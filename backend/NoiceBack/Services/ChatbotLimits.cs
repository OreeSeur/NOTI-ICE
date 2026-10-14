using System.Globalization;
using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace PortalNoticiasAPI.Services;

public sealed class ChatbotLimitsOptions
{
    public const string SectionName = "Chatbot:Limits";
    public int RequestsPerWindow { get; set; } = 5;
    public int WindowSeconds { get; set; } = 60;
    public int MaxConcurrentGenerations { get; set; } = 1;
    public int BusyRetryAfterSeconds { get; set; } = 5;
}

public static class ChatbotLimitsRegistration
{
    public static IServiceCollection AddChatbotLimits(this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<ChatbotLimitsOptions>()
            .Bind(configuration.GetSection(ChatbotLimitsOptions.SectionName))
            .Validate(o => o.RequestsPerWindow > 0 && o.WindowSeconds > 0 &&
                o.MaxConcurrentGenerations > 0 && o.BusyRetryAfterSeconds > 0,
                "Todos los valores de Chatbot:Limits deben ser enteros mayores que cero.")
            .ValidateOnStart();

        services.AddRateLimiter(options =>
            options.AddPolicy<string, ChatbotUserRateLimitPolicy>(ChatbotUserRateLimitPolicy.PolicyName));
        services.AddSingleton<ChatbotGenerationLimiter>();
        return services;
    }
}

public sealed class ChatbotUserRateLimitPolicy : IRateLimiterPolicy<string>
{
    public const string PolicyName = "chatbot-por-usuario";
    private readonly ChatbotLimitsOptions _limits;

    public ChatbotUserRateLimitPolicy(IOptions<ChatbotLimitsOptions> options) => _limits = options.Value;

    public RateLimitPartition<string> GetPartition(HttpContext context) =>
        RateLimitPartition.GetFixedWindowLimiter(
            // Se ejecuta despues de autenticacion/autorizacion. La clave es el usuario,
            // no el JWT ni la IP: varias sesiones comparten el mismo cupo.
            context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "sin-identidad",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = _limits.RequestsPerWindow,
                Window = TimeSpan.FromSeconds(_limits.WindowSeconds),
                QueueLimit = 0,
                AutoReplenishment = true
            });

    public Func<OnRejectedContext, CancellationToken, ValueTask>? OnRejected => async (context, token) =>
    {
        var segundos = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)
            ? Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds))
            : _limits.WindowSeconds;
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.RetryAfter = segundos.ToString(CultureInfo.InvariantCulture);
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            mensaje = $"Has alcanzado el limite de consultas. Intenta de nuevo en {segundos} segundos.",
            codigo = "chatbot_rate_limit",
            reintentarEnSegundos = segundos
        }, token);
    };
}

// Una sola instancia por proceso. No acumular generaciones en espera en el VPS.
public sealed class ChatbotGenerationLimiter : IDisposable
{
    private readonly ConcurrencyLimiter _limiter;
    public int RetryAfterSeconds { get; }

    public ChatbotGenerationLimiter(IOptions<ChatbotLimitsOptions> options)
    {
        _limiter = new ConcurrencyLimiter(new ConcurrencyLimiterOptions
        {
            PermitLimit = options.Value.MaxConcurrentGenerations,
            QueueLimit = 0
        });
        RetryAfterSeconds = options.Value.BusyRetryAfterSeconds;
    }

    public RateLimitLease TryAcquire() => _limiter.AttemptAcquire(1);
    public void Dispose() => _limiter.Dispose();
}
