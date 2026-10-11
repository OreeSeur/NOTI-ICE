using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;

namespace PortalNoticiasAPI.Services
{
    public class EmailSettings
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 587;
        public bool UseSsl { get; set; } = true;   // STARTTLS en el puerto 587
        public string User { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string FromName { get; set; } = "NOTICE";
    }

    // Envío de correos por SMTP. Si no hay configuración, no envía y lo deja en el log;
    // así el resto del sistema sigue funcionando sin servidor de correo.
    public class EmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public bool Configurado =>
            !string.IsNullOrWhiteSpace(_settings.Host) && !string.IsNullOrWhiteSpace(_settings.From);

        public async Task EnviarAsync(string para, string asunto, string cuerpoHtml, CancellationToken ct = default)
        {
            if (!Configurado)
            {
                _logger.LogWarning("Correo no enviado: falta configurar la sección Email en appsettings.json");
                return;
            }

            using var mensaje = new MailMessage
            {
                From = new MailAddress(_settings.From, _settings.FromName, Encoding.UTF8),
                Subject = asunto,
                SubjectEncoding = Encoding.UTF8,
                Body = cuerpoHtml,
                BodyEncoding = Encoding.UTF8,
                IsBodyHtml = true
            };
            mensaje.To.Add(para);

            using var cliente = new SmtpClient(_settings.Host, _settings.Port)
            {
                EnableSsl = _settings.UseSsl,
                Credentials = new NetworkCredential(_settings.User, _settings.Password)
            };

            await cliente.SendMailAsync(mensaje, ct);
        }

        // Para no hacer esperar la respuesta HTTP: un fallo de SMTP solo se registra.
        public void EnviarSinEsperar(string para, string asunto, string cuerpoHtml)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await EnviarAsync(para, asunto, cuerpoHtml);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "No se pudo enviar un correo");
                }
            });
        }
    }

    public static class PlantillaCorreo
    {
        public static string Armar(string titulo, string parrafosHtml, string? textoBoton, string? url, string pie)
        {
            var boton = string.IsNullOrEmpty(url) || string.IsNullOrEmpty(textoBoton)
                ? ""
                : $@"<p style=""margin:24px 0""><a href=""{WebUtility.HtmlEncode(url)}"" style=""background:#6F1D46;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block"">{WebUtility.HtmlEncode(textoBoton)}</a></p>";

            return $@"<div style=""font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1e293b"">
  <div style=""background:#6F1D46;color:#ffffff;padding:16px 24px;border-radius:12px 12px 0 0;font-size:18px;font-weight:bold"">NOTICE · ESIME Zacatenco</div>
  <div style=""border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px"">
    <h2 style=""margin:0 0 12px;font-size:20px"">{WebUtility.HtmlEncode(titulo)}</h2>
    {parrafosHtml}
    {boton}
    <p style=""margin:24px 0 0;font-size:12px;color:#64748b"">{pie}</p>
  </div>
</div>";
        }
    }
}
