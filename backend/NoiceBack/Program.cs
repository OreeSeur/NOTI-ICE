using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.Services;
using System.Net;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<PortalNoticiasContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("PortalNoticiasDb"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("PortalNoticiasDb"))
    )
);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddChatbotLimits(builder.Configuration);
// Las solicitudes pÃºblicas comparten una cuota moderada por IP: evita abuso sin impedir un piloto pequeÃ±o.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth-publico", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "sin-ip",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Ingresa tu token JWT así: Bearer {tu token}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<AudienciaAccesoService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine("JWT FALLÓ: " + context.Exception.Message);
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            Console.WriteLine("JWT CHALLENGE: " + context.Error + " - " + context.ErrorDescription);
            return Task.CompletedTask;
        }
    };
});

// Confiar solo en las cabeceras reenviadas por Nginx local u otros proxies explicitos.
// Una lista vacia no significa confiar en cualquier proxy.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
    options.KnownProxies.Add(IPAddress.Loopback);
    options.KnownProxies.Add(IPAddress.IPv6Loopback);

    foreach (var ipTexto in builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
    {
        if (!IPAddress.TryParse(ipTexto, out var ip))
            throw new InvalidOperationException("ReverseProxy:KnownProxies requiere direcciones IP validas.");
        options.KnownProxies.Add(ip);
    }
});

// En produccion, sin origenes configurados, se deniegan solicitudes CORS externas.
// Las peticiones del mismo origen funcionan sin habilitar CORS.
var origenesCors = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
if (origenesCors.Length == 0 && builder.Environment.IsDevelopment())
    origenesCors = ["http://localhost:5173"];

foreach (var origen in origenesCors)
{
    if (!Uri.TryCreate(origen, UriKind.Absolute, out var uri) ||
        (uri.Scheme != Uri.UriSchemeHttps &&
         !(builder.Environment.IsDevelopment() && uri.Scheme == Uri.UriSchemeHttp)) ||
        !string.Equals(origen, uri.GetLeftPart(UriPartial.Authority), StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("Cors:AllowedOrigins requiere origenes HTTPS completos sin rutas ni comodines (HTTP solo en Development).");
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(origenesCors)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.AddSingleton<EmailService>();
builder.Services.AddSingleton<NotificacionCorreoService>();

// Revalidar cada JWT contra el estado y rol ACTUALES en MySQL.
// PostConfigure agrega este evento sin reemplazar los eventos existentes del esquema Bearer.
builder.Services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.Events ??= new JwtBearerEvents();
    options.Events.OnTokenValidated = async context =>
    {
        var identidad = context.Principal;
        var idTexto = identidad?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var rolDelToken = identidad?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var versionTexto = identidad?.FindFirst(TokenService.VersionClaim)?.Value;

        if (!int.TryParse(idTexto, out var idUsuario) || string.IsNullOrWhiteSpace(rolDelToken) ||
            !int.TryParse(versionTexto, out var versionToken) || versionToken < 1)
        {
            context.Fail("El token no contiene una identidad y un rol vÃ¡lidos.");
            return;
        }

        var db = context.HttpContext.RequestServices.GetRequiredService<PortalNoticiasContext>();
        var cuentaActual = await db.Usuarios.AsNoTracking()
            .Where(u => u.IdUsuario == idUsuario && u.Activo && u.Rol != null && u.Rol.Activo)
            .Select(u => new { RolNombre = u.Rol!.Nombre, u.VersionSesion })
            .FirstOrDefaultAsync(context.HttpContext.RequestAborted);

        if (cuentaActual == null || cuentaActual.VersionSesion != versionToken ||
            !string.Equals(cuentaActual.RolNombre, rolDelToken, StringComparison.Ordinal))
        {
            context.Fail("La sesion fue revocada, la cuenta esta inactiva o su rol cambio. Inicia sesion nuevamente.");
        }
    };
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Antes de HTTPS, CORS, JWT y los controladores.
app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
// No publicar /uploads como archivos estáticos: la descarga pasa por la API
// y se valida contra la audiencia de cada documento.
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.Run();
