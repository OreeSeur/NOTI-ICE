using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.Services;
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // el puerto donde corre tu Vite
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

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
// No publicar /uploads como archivos estáticos: la descarga pasa por la API
// y se valida contra la audiencia de cada documento.
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.Run();
