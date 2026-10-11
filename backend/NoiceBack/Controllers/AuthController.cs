using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;
using PortalNoticiasAPI.Services;

namespace PortalNoticiasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const int SemestreMinimo = 1;
        private const int SemestreMaximo = 9;
        private const int CarreraMaxCaracteres = 100;

        private readonly PortalNoticiasContext _context;
        private readonly TokenService _tokenService;

        public AuthController(PortalNoticiasContext context, TokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        private static LoginResponseDto ToResponse(Usuario u, string rolNombre, string token) => new()
        {
            Token = token,
            IdUsuario = u.IdUsuario,
            Nombre = u.Nombre,
            Correo = u.Correo,
            IdRol = u.IdRol,
            RolNombre = rolNombre,
            NoIdentificacion = u.NoIdentificacion,
            Carrera = u.Carrera,
            Semestre = u.Semestre
        };

        // Devuelve un mensaje de error si los datos académicos no son válidos, o null si están bien
        private static string? ValidarAcademico(string? carrera, int? semestre, bool obligatorios)
        {
            var carreraTexto = carrera?.Trim();

            if (obligatorios && string.IsNullOrEmpty(carreraTexto))
                return "La carrera es obligatoria";

            if (obligatorios && semestre == null)
                return "El semestre es obligatorio";

            if (carreraTexto != null && carreraTexto.Length > CarreraMaxCaracteres)
                return $"La carrera no puede tener más de {CarreraMaxCaracteres} caracteres";

            if (semestre != null && (semestre < SemestreMinimo || semestre > SemestreMaximo))
                return $"El semestre debe estar entre {SemestreMinimo} y {SemestreMaximo}";

            return null;
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginRequestDto dto)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.Correo == dto.Correo && u.Activo);

            if (usuario == null)
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos" });

            bool contrasenaValida = BCrypt.Net.BCrypt.Verify(dto.Contrasena, usuario.Contrasena);
            if (!contrasenaValida)
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos" });

            var token = _tokenService.GenerarToken(usuario, usuario.Rol!.Nombre);

            return Ok(ToResponse(usuario, usuario.Rol.Nombre, token));
        }

        // POST: api/auth/register
        // Público (no requiere estar logueado). Siempre crea el usuario con rol "Alumno".
        [HttpPost("register")]
        public async Task<ActionResult<LoginResponseDto>> Register(RegisterDto dto)
        {
            var errorAcademico = ValidarAcademico(dto.Carrera, dto.Semestre, obligatorios: true);
            if (errorAcademico != null)
                return BadRequest(new { mensaje = errorAcademico });

            var correoExiste = await _context.Usuarios.AnyAsync(u => u.Correo == dto.Correo);
            if (correoExiste)
                return BadRequest(new { mensaje = "Ya existe un usuario con ese correo" });

            var boletaExiste = await _context.Usuarios.AnyAsync(u => u.NoIdentificacion == dto.NoIdentificacion);
            if (boletaExiste)
                return BadRequest(new { mensaje = "Ya existe un usuario con ese número de identificación" });

            var rolAlumno = await _context.NombreRoles.FirstOrDefaultAsync(r => r.Nombre == "Alumno" && r.Activo);
            if (rolAlumno == null)
                return StatusCode(500, new { mensaje = "No se encontró el rol 'Alumno' configurado en el sistema" });

            var usuario = new Usuario
            {
                Nombre = dto.Nombre,
                IdRol = rolAlumno.IdRol,
                NoIdentificacion = dto.NoIdentificacion,
                Correo = dto.Correo,
                Contrasena = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena),
                Carrera = dto.Carrera.Trim(),
                Semestre = dto.Semestre,
                FechaAlta = DateTime.Now,
                Activo = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            // Auto-login: le devolvemos el token de una vez para que no tenga que iniciar sesión aparte
            var token = _tokenService.GenerarToken(usuario, rolAlumno.Nombre);

            return Ok(ToResponse(usuario, rolAlumno.Nombre, token));
        }

        // PUT: api/auth/perfil
        // Cada persona edita SU PROPIO perfil (la identidad sale del token, no del cuerpo).
        [HttpPut("perfil")]
        [Authorize]
        public async Task<ActionResult<PerfilDto>> ActualizarPerfil(PerfilUpdateDto dto)
        {
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var idUsuario))
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado" });

            var usuario = await _context.Usuarios
                .Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario && u.Activo);

            if (usuario == null)
                return NotFound(new { mensaje = "No se encontró el usuario" });

            if (string.IsNullOrWhiteSpace(dto.Nombre) || dto.Nombre.Trim().Length < 3)
                return BadRequest(new { mensaje = "El nombre debe tener al menos 3 caracteres" });

            // Los datos académicos son obligatorios solo para alumnos
            var esAlumno = usuario.Rol?.Nombre == "Alumno";
            var errorAcademico = ValidarAcademico(dto.Carrera, dto.Semestre, obligatorios: esAlumno);
            if (errorAcademico != null)
                return BadRequest(new { mensaje = errorAcademico });

            usuario.Nombre = dto.Nombre.Trim();
            usuario.Carrera = string.IsNullOrWhiteSpace(dto.Carrera) ? null : dto.Carrera.Trim();
            usuario.Semestre = dto.Semestre;

            await _context.SaveChangesAsync();

            return Ok(new PerfilDto
            {
                IdUsuario = usuario.IdUsuario,
                Nombre = usuario.Nombre,
                Correo = usuario.Correo,
                NoIdentificacion = usuario.NoIdentificacion,
                Carrera = usuario.Carrera,
                Semestre = usuario.Semestre
            });
        }
    }
}
