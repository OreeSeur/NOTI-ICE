using System.Net;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;

namespace PortalNoticiasAPI.Services
{
    // Envía por correo cada publicación nueva a quienes les corresponde según su audiencia
    // (misma regla que aplica la interfaz) y que no hayan desactivado los avisos por correo.
    public class NotificacionCorreoService
    {
        private const int MaxDescripcion = 280;

        private readonly IServiceScopeFactory _scopes;
        private readonly EmailService _email;
        private readonly IConfiguration _config;
        private readonly ILogger<NotificacionCorreoService> _logger;

        public NotificacionCorreoService(
            IServiceScopeFactory scopes,
            EmailService email,
            IConfiguration config,
            ILogger<NotificacionCorreoService> logger)
        {
            _scopes = scopes;
            _email = email;
            _config = config;
            _logger = logger;
        }

        // tipo: "Noticia", "Evento" o "Documento". ruta: por ejemplo "/noticias/12".
        // No espera: la respuesta HTTP no depende del servidor de correo.
        public void NotificarPublicacion(
            string tipo, string titulo, string? descripcion, string ruta,
            string? audienciaJson, string? prioridad, int? idAutor)
        {
            if (!_email.Configurado) return;

            _ = Task.Run(() => EnviarAsync(tipo, titulo, descripcion, ruta, audienciaJson, prioridad, idAutor));
        }

        private async Task EnviarAsync(
            string tipo, string titulo, string? descripcion, string ruta,
            string? audienciaJson, string? prioridad, int? idAutor)
        {
            try
            {
                using var scope = _scopes.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<PortalNoticiasContext>();
                var acceso = scope.ServiceProvider.GetRequiredService<AudienciaAccesoService>();

                var candidatos = await context.Usuarios
                    .AsNoTracking()
                    .Include(u => u.Rol)
                    .Where(u => u.Activo && u.NotificarPorCorreo && u.Rol != null && u.Rol.Activo &&
                        (idAutor == null || u.IdUsuario != idAutor))
                    .ToListAsync();
                var urgente = string.Equals(prioridad, "urgente", StringComparison.OrdinalIgnoreCase);
                var asunto = $"{(urgente ? "URGENTE · " : "")}Nueva {tipo.ToLowerInvariant()}: {titulo}";
                var baseUrl = (_config["Frontend:BaseUrl"] ?? "").TrimEnd('/');
                var enlace = string.IsNullOrEmpty(baseUrl) ? null : baseUrl + ruta;

                var cuerpoDescripcion = string.IsNullOrWhiteSpace(descripcion)
                    ? ""
                    : $"<p style=\"line-height:1.5\">{WebUtility.HtmlEncode(Recortar(descripcion!))}</p>";

                var cuerpo = PlantillaCorreo.Armar(
                    titulo,
                    $"<p style=\"color:#64748b;margin:0 0 12px\">{WebUtility.HtmlEncode(tipo)} publicada en el portal.</p>{cuerpoDescripcion}",
                    "Ver en el portal",
                    enlace,
                    "Recibes este correo porque tienes activados los avisos por correo. Puedes desactivarlos en tu perfil.");

                var enviados = 0;
                foreach (var destinatario in candidatos)
                {
                    if (!acceso.PuedeVer(audienciaJson, destinatario)) continue;

                    try
                    {
                        await _email.EnviarAsync(destinatario.Correo, asunto, cuerpo);
                        enviados++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "No se pudo enviar el aviso de {Tipo} a un destinatario", tipo);
                    }
                }

                _logger.LogInformation("Aviso de {Tipo} enviado por correo a {Cantidad} personas", tipo, enviados);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falló el envío de avisos por correo");
            }
        }

        private static string Recortar(string texto) =>
            texto.Length <= MaxDescripcion ? texto : texto[..MaxDescripcion].TrimEnd() + "…";
    }
}
