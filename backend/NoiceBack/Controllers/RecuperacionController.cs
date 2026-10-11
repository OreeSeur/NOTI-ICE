using System.Net;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Services;

namespace PortalNoticiasAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class RecuperacionController : ControllerBase
    {
        private const int MinutosVigencia = 30;
        private const int MinutosEntreSolicitudes = 2;
        private const int ContrasenaMinima = 8;

        private readonly PortalNoticiasContext _context;
        private readonly EmailService _email;
        private readonly IConfiguration _config;
        private readonly IHostEnvironment _env;
        private readonly ILogger<RecuperacionController> _logger;

        public RecuperacionController(
            PortalNoticiasContext context,
            EmailService email,
            IConfiguration config,
            IHostEnvironment env,
            ILogger<RecuperacionController> logger)
        {
            _context = context;
            _email = email;
            _config = config;
            _env = env;
            _logger = logger;
        }

        // Solo se guarda el hash del token: si alguien lee la base, no puede usar los enlaces pendientes
        private static string Hash(string token) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        // POST: api/auth/olvide-contrasena
        // Responde siempre lo mismo, exista o no la cuenta, para no revelar qué correos están registrados.
        [HttpPost("olvide-contrasena")]
        public async Task<IActionResult> OlvideContrasena(OlvideContrasenaDto dto)
        {
            var respuesta = new { mensaje = "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." };

            if (string.IsNullOrWhiteSpace(dto.Correo))
                return BadRequest(new { mensaje = "El correo es obligatorio" });

            var correo = dto.Correo.Trim();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == correo && u.Activo);

            if (usuario == null) return Ok(respuesta);

            // Evita que alguien use el formulario para llenar de correos a otra persona
            if (usuario.TokenRecuperacionExpira != null &&
                usuario.TokenRecuperacionExpira > DateTime.UtcNow.AddMinutes(MinutosVigencia - MinutosEntreSolicitudes))
                return Ok(respuesta);

            var token = CodificarBase64Url(RandomNumberGenerator.GetBytes(32));
            usuario.TokenRecuperacionHash = Hash(token);
            usuario.TokenRecuperacionExpira = DateTime.UtcNow.AddMinutes(MinutosVigencia);
            await _context.SaveChangesAsync();

            var baseUrl = (_config["Frontend:BaseUrl"] ?? "").TrimEnd('/');
            var enlace = $"{baseUrl}/restablecer-contrasena?correo={Uri.EscapeDataString(correo)}&token={Uri.EscapeDataString(token)}";

            var cuerpo = PlantillaCorreo.Armar(
                "Restablecer tu contraseña",
                $"<p style=\"line-height:1.5\">Hola, {WebUtility.HtmlEncode(usuario.Nombre)}. Recibimos una solicitud para crear una contraseña nueva en NOTICE.</p>" +
                $"<p style=\"line-height:1.5\">El enlace vence en {MinutosVigencia} minutos y solo se puede usar una vez.</p>",
                "Crear contraseña nueva",
                enlace,
                "Si no fuiste tú, ignora este correo: tu contraseña no cambiará.");

            if (!_email.Configurado && _env.IsDevelopment())
                _logger.LogWarning("SMTP sin configurar. Enlace de recuperación (solo desarrollo): {Enlace}", enlace);

            _email.EnviarSinEsperar(usuario.Correo, "Restablecer tu contraseña de NOTICE", cuerpo);

            return Ok(respuesta);
        }

        // POST: api/auth/restablecer-contrasena
        [HttpPost("restablecer-contrasena")]
        public async Task<IActionResult> RestablecerContrasena(RestablecerContrasenaDto dto)
        {
            const string enlaceInvalido = "El enlace no es válido o ya venció. Solicita uno nuevo.";

            if (string.IsNullOrWhiteSpace(dto.Correo) || string.IsNullOrWhiteSpace(dto.Token))
                return BadRequest(new { mensaje = enlaceInvalido });

            if (string.IsNullOrEmpty(dto.NuevaContrasena) || dto.NuevaContrasena.Length < ContrasenaMinima)
                return BadRequest(new { mensaje = $"La contraseña debe tener al menos {ContrasenaMinima} caracteres" });

            var correo = dto.Correo.Trim();
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == correo && u.Activo);

            if (usuario?.TokenRecuperacionHash == null ||
                usuario.TokenRecuperacionExpira == null ||
                usuario.TokenRecuperacionExpira < DateTime.UtcNow)
                return BadRequest(new { mensaje = enlaceInvalido });

            var recibido = Encoding.UTF8.GetBytes(Hash(dto.Token));
            var guardado = Encoding.UTF8.GetBytes(usuario.TokenRecuperacionHash);

            if (!CryptographicOperations.FixedTimeEquals(recibido, guardado))
                return BadRequest(new { mensaje = enlaceInvalido });

            usuario.Contrasena = BCrypt.Net.BCrypt.HashPassword(dto.NuevaContrasena);
            usuario.TokenRecuperacionHash = null;      // un solo uso
            usuario.TokenRecuperacionExpira = null;
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Contraseña actualizada. Ya puedes iniciar sesión." });
        }

        private static string CodificarBase64Url(byte[] bytes) =>
            Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        // GET: api/auth/preferencias-correo
        [HttpGet("preferencias-correo")]
        [Authorize]
        public async Task<ActionResult<PreferenciaCorreoDto>> ObtenerPreferencia()
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var idUsuario))
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado" });

            var activa = await _context.Usuarios
                .Where(u => u.IdUsuario == idUsuario && u.Activo)
                .Select(u => (bool?)u.NotificarPorCorreo)
                .FirstOrDefaultAsync();

            if (activa == null) return NotFound(new { mensaje = "No se encontró el usuario" });

            return Ok(new PreferenciaCorreoDto { NotificarPorCorreo = activa.Value });
        }

        // PUT: api/auth/preferencias-correo
        [HttpPut("preferencias-correo")]
        [Authorize]
        public async Task<ActionResult<PreferenciaCorreoDto>> ActualizarPreferencia(PreferenciaCorreoDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var idUsuario))
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado" });

            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario && u.Activo);
            if (usuario == null) return NotFound(new { mensaje = "No se encontró el usuario" });

            usuario.NotificarPorCorreo = dto.NotificarPorCorreo;
            await _context.SaveChangesAsync();

            return Ok(new PreferenciaCorreoDto { NotificarPorCorreo = usuario.NotificarPorCorreo });
        }
    }
}
