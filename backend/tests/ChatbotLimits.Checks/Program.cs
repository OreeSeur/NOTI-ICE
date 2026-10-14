using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.Options;
using PortalNoticiasAPI.Services;

var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new InvalidOperationException("FAIL: " + name);
    Console.WriteLine("PASS: " + name);
    checks++;
}

ServiceProvider Services(Dictionary<string, string?> values)
{
    var configuration = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    var services = new ServiceCollection();
    services.AddLogging();
    services.AddChatbotLimits(configuration);
    return services.BuildServiceProvider();
}

using (var services = Services(new()))
{
    services.GetRequiredService<IStartupValidator>().Validate();
    var options = services.GetRequiredService<IOptions<ChatbotLimitsOptions>>().Value;
    Check(options.RequestsPerWindow == 5 && options.WindowSeconds == 60 &&
        options.MaxConcurrentGenerations == 1 && options.BusyRetryAfterSeconds == 5,
        "valores conservadores predeterminados");
    Check(ReferenceEquals(services.GetRequiredService<ChatbotGenerationLimiter>(),
        services.GetRequiredService<ChatbotGenerationLimiter>()), "concurrencia compartida por el proceso");
}

foreach (var key in new[] { "RequestsPerWindow", "WindowSeconds", "MaxConcurrentGenerations", "BusyRetryAfterSeconds" })
{
    foreach (var invalid in new[] { "0", "-1" })
    {
        using var services = Services(new() { [$"Chatbot:Limits:{key}"] = invalid });
        var rejected = false;
        try { services.GetRequiredService<IStartupValidator>().Validate(); }
        catch (OptionsValidationException) { rejected = true; }
        Check(rejected, $"configuracion invalida rechazada al iniciar: {key}={invalid}");
    }
}

foreach (var capacity in new[] { 1, 2 })
{
    using var services = Services(new() { ["Chatbot:Limits:MaxConcurrentGenerations"] = capacity.ToString() });
    var limiter = services.GetRequiredService<ChatbotGenerationLimiter>();
    var leases = new ConcurrentBag<RateLimitLease>();
    await Task.WhenAll(Enumerable.Range(0, 24).Select(_ => Task.Run(() => leases.Add(limiter.TryAcquire()))));
    Check(leases.Count(lease => lease.IsAcquired) == capacity,
        $"24 solicitudes simultaneas respetan capacidad {capacity} sin cola");
    foreach (var lease in leases) lease.Dispose();
    using var recovered = limiter.TryAcquire();
    Check(recovered.IsAcquired, $"cupo recuperado tras finalizar, capacidad {capacity}");
}

using (var services = Services(new()))
{
    var limiter = services.GetRequiredService<ChatbotGenerationLimiter>();
    try
    {
        using var lease = limiter.TryAcquire();
        Check(lease.IsAcquired, "permiso antes de excepcion");
        throw new IOException("Fallo de generacion de prueba");
    }
    catch (IOException) { }
    using (var recovered = limiter.TryAcquire())
        Check(recovered.IsAcquired, "excepcion libera el permiso");

    using var cancellation = new CancellationTokenSource();
    async Task PendingGeneration()
    {
        using var lease = limiter.TryAcquire();
        Check(lease.IsAcquired, "permiso antes de cancelacion");
        await Task.Delay(Timeout.Infinite, cancellation.Token);
    }
    var pending = PendingGeneration();
    cancellation.Cancel();
    try { await pending; }
    catch (OperationCanceledException) { }
    using var afterCancellation = limiter.TryAcquire();
    Check(afterCancellation.IsAcquired, "cancelacion libera el permiso");
}

// Host aislado: identidad de prueba, middleware real; sin JWT reales, MySQL ni Ollama.
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    ApplicationName = typeof(CheckAuthentication).Assembly.GetName().Name,
    EnvironmentName = "Production"
});
builder.Logging.ClearProviders();
builder.WebHost.UseUrls("http://127.0.0.1:0");
builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["Chatbot:Limits:RequestsPerWindow"] = "2",
    ["Chatbot:Limits:WindowSeconds"] = "1"
});
builder.Services.AddAuthentication("Checks")
    .AddScheme<AuthenticationSchemeOptions, CheckAuthentication>("Checks", _ => { });
builder.Services.AddAuthorization();
builder.Services.AddChatbotLimits(builder.Configuration);
await using var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapPost("/api/chatbot", () => Results.Ok(new { texto = "ok", enlaces = Array.Empty<object>() }))
    .RequireAuthorization().RequireRateLimiting(ChatbotUserRateLimitPolicy.PolicyName);
app.MapGet("/otro", () => Results.Ok());
await app.StartAsync();
try
{
    var address = app.Services.GetRequiredService<IServer>().Features
        .Get<IServerAddressesFeature>()!.Addresses.Single();
    using var client = new HttpClient { BaseAddress = new Uri(address) };
    async Task<HttpResponseMessage> Post(string? user, string session = "sesion-1")
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/chatbot");
        if (user != null) request.Headers.Add("X-Check-User", user);
        request.Headers.Add("X-Check-Session", session);
        return await client.SendAsync(request);
    }

    using (var response = await Post(null))
        Check(response.StatusCode == HttpStatusCode.Unauthorized, "sin autenticacion devuelve 401 antes del limitador");
    for (var i = 0; i < 2; i++)
        using (var response = await Post("usuario-a"))
            Check(response.IsSuccessStatusCode, $"solicitud normal {i + 1} permitida");
    using (var response = await Post("usuario-a"))
    {
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Check(response.StatusCode == HttpStatusCode.TooManyRequests, "exceso por usuario devuelve HTTP 429");
        Check(response.Headers.RetryAfter?.Delta?.TotalSeconds > 0 &&
            json.GetProperty("reintentarEnSegundos").GetInt32() == response.Headers.RetryAfter.Delta.Value.TotalSeconds &&
            !string.IsNullOrWhiteSpace(json.GetProperty("mensaje").GetString()), "429 incluye mensaje y Retry-After coherente");
    }
    using (var response = await Post("usuario-a", "otra-sesion"))
        Check(response.StatusCode == HttpStatusCode.TooManyRequests, "otra sesion del mismo usuario comparte el cupo");
    using (var response = await Post("usuario-b"))
        Check(response.IsSuccessStatusCode, "otro usuario mantiene su propio cupo");
    using (var response = await client.GetAsync("/otro"))
        Check(response.IsSuccessStatusCode, "otros endpoints no reciben esta politica");
    await Task.Delay(1500);
    using (var response = await Post("usuario-a"))
        Check(response.IsSuccessStatusCode, "nueva ventana repone el cupo");
}
finally { await app.StopAsync(); }
Console.WriteLine($"OK: {checks} comprobaciones; sin acceso a MySQL/Ollama.");

sealed class CheckAuthentication : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public CheckAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder) : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var user = Request.Headers["X-Check-User"].ToString();
        if (string.IsNullOrEmpty(user)) return Task.FromResult(AuthenticateResult.NoResult());
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user),
            new Claim("session", Request.Headers["X-Check-Session"].ToString()) };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name)));
    }
}
