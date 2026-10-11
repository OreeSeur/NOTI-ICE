using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;

namespace PortalNoticiasAPI.Services
{
    // Envía por correo cada publicación nueva a quienes les corresponde según su audiencia
    // (misma regla que aplica la interfaz) y que no hayan desactivado los avisos por correo.
    public class NotificacionCorreoService
    {
        private const string Todos = "todos";
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

        private class AudienciaLeida
        {
            public List<string>? Roles { get; set; }
            public List<string>? Carreras { get; set; }
            public List<string>? Semestres { get; set; }
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

                var candidatos = await context.Usuarios
                    .Where(u => u.Activo && u.NotificarPorCorreo && (idAutor == null || u.IdUsuario != idAutor))
                    .Select(u => new { u.Nombre, u.Correo, Rol = u.Rol!.Nombre, u.Carrera, u.Semestre })
                    .ToListAsync();

                var audiencia = LeerAudiencia(audienciaJson);
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
                    if (!Coincide(audiencia, destinatario.Rol, destinatario.Carrera, destinatario.Semestre)) continue;

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

        private static AudienciaLeida LeerAudiencia(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return new AudienciaLeida();

            try
            {
                return JsonSerializer.Deserialize<AudienciaLeida>(
                    json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new AudienciaLeida();
            }
            catch (JsonException)
            {
                return new AudienciaLeida();
            }
        }

        // Quita acentos y mayúsculas; los guiones cuentan como espacios ("comunicaciones-y-electronica")
        private static string Normalizar(string? texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return string.Empty;

            var descompuesto = texto.Trim().ToLowerInvariant().Replace('-', ' ').Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var c in descompuesto)
            {
                if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark)
                    sb.Append(c);
            }
            return sb.ToString();
        }

        private static bool IncluyeTodos(List<string>? seleccion) =>
            seleccion == null || seleccion.Count == 0 || seleccion.Any(v => Normalizar(v) == Todos);

        private static string NormalizarRol(string? rol)
        {
            var r = Normalizar(rol);
            return r == "administrador" ? "admin" : r;
        }

        // Misma regla que la interfaz: el Administrador recibe todo; los demás, según rol, carrera y semestre
        private static bool Coincide(AudienciaLeida audiencia, string rol, string? carrera, int? semestre)
        {
            if (NormalizarRol(rol) == "admin") return true;

            var coincideRol = IncluyeTodos(audiencia.Roles) ||
                audiencia.Roles!.Any(v => NormalizarRol(v) == NormalizarRol(rol));

            var carreraUsuario = Normalizar(carrera);
            var coincideCarrera = IncluyeTodos(audiencia.Carreras) ||
                (carreraUsuario.Length > 0 &&
                 audiencia.Carreras!.Any(v => carreraUsuario.Contains(Normalizar(v))));

            var coincideSemestre = IncluyeTodos(audiencia.Semestres) ||
                (semestre != null && audiencia.Semestres!.Any(v => v.Trim() == semestre.Value.ToString()));

            return coincideRol && coincideCarrera && coincideSemestre;
        }

        private static string Recortar(string texto) =>
            texto.Length <= MaxDescripcion ? texto : texto[..MaxDescripcion].TrimEnd() + "…";
    }
}
