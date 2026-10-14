using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador")]
    public class UsuariosController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public UsuariosController(PortalNoticiasContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UsuarioDto>>> GetUsuarios()
        {
            var usuarios = await _context.Usuarios
                .Include(u => u.Rol)
                .Where(u => u.Activo)
                .Select(u => new UsuarioDto
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    IdRol = u.IdRol,
                    RolNombre = u.Rol!.Nombre,
                    NoIdentificacion = u.NoIdentificacion,
                    Correo = u.Correo,
                    Activo = u.Activo
                })
                .ToListAsync();
            return Ok(usuarios);
        }

        // Sólo administración; el listado general sigue exponiendo únicamente cuentas activas.
        [HttpGet("inactivos")]
        public async Task<ActionResult<IEnumerable<UsuarioDto>>> GetUsuariosInactivos()
        {
            var usuarios = await _context.Usuarios
                .Where(u => !u.Activo)
                .OrderBy(u => u.IdUsuario)
                .Select(u => new UsuarioDto
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    IdRol = u.IdRol,
                    RolNombre = u.Rol!.Nombre,
                    NoIdentificacion = u.NoIdentificacion,
                    Correo = u.Correo,
                    Activo = u.Activo
                })
                .ToListAsync();
            return Ok(usuarios);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UsuarioDto>> GetUsuario(int id)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.Rol)
                .Where(u => u.IdUsuario == id && u.Activo)
                .Select(u => new UsuarioDto
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    IdRol = u.IdRol,
                    RolNombre = u.Rol!.Nombre,
                    NoIdentificacion = u.NoIdentificacion,
                    Correo = u.Correo,
                    Activo = u.Activo
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
                return NotFound(new { mensaje = $"No se encontró el usuario con id {id}" });

            return Ok(usuario);
        }

        [HttpPost]
        public async Task<ActionResult<UsuarioDto>> CrearUsuario(UsuarioCreateDto dto)
        {
            var identificacion = dto.NoIdentificacion?.Trim();
            if (string.IsNullOrWhiteSpace(identificacion) || identificacion.Length > 30)
                return BadRequest(new { mensaje = "El número de identificación debe contener entre 1 y 30 caracteres" });

            var identificacionExistente = await _context.Usuarios
                .Where(u => u.NoIdentificacion == identificacion)
                .Select(u => new { u.Activo })
                .FirstOrDefaultAsync();
            if (identificacionExistente != null)
                return Conflict(new { mensaje = identificacionExistente.Activo
                    ? "Ya existe un usuario activo con ese número de identificación."
                    : "La identificación pertenece a una cuenta inactiva. Reactívala desde Administración de usuarios." });

            var correoExistente = await _context.Usuarios
                .Where(u => u.Correo == dto.Correo)
                .Select(u => new { u.Activo })
                .FirstOrDefaultAsync();
            if (correoExistente != null)
                return Conflict(new { mensaje = correoExistente.Activo
                    ? "Ya existe un usuario activo con ese correo."
                    : "El correo pertenece a una cuenta inactiva. Reactívala desde Administración de usuarios." });

            var rolExiste = await _context.NombreRoles.AnyAsync(r => r.IdRol == dto.IdRol && r.Activo);
            if (!rolExiste)
                return BadRequest(new { mensaje = "El rol especificado no existe o está inactivo" });

            var usuario = new Usuario
            {
                Nombre = dto.Nombre,
                IdRol = dto.IdRol,
                NoIdentificacion = identificacion!,
                Correo = dto.Correo,
                Contrasena = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena),
                FechaAlta = DateTime.Now,
                Activo = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuario), new { id = usuario.IdUsuario },
                new UsuarioDto
                {
                    IdUsuario = usuario.IdUsuario,
                    Nombre = usuario.Nombre,
                    IdRol = usuario.IdRol,
                    NoIdentificacion = usuario.NoIdentificacion,
                    Correo = usuario.Correo,
                    Activo = usuario.Activo
                });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarUsuario(int id, UsuarioUpdateDto dto)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null || !usuario.Activo)
                return NotFound(new { mensaje = $"No se encontró el usuario con id {id}" });

            if (string.IsNullOrWhiteSpace(dto.Nombre) || string.IsNullOrWhiteSpace(dto.Correo))
                return BadRequest(new { mensaje = "El nombre y el correo son obligatorios." });

            var rolValido = await _context.NombreRoles.AnyAsync(r => r.IdRol == dto.IdRol && r.Activo);
            if (!rolValido)
                return BadRequest(new { mensaje = "El rol indicado no existe o está inactivo." });

            if (await _context.Usuarios.AnyAsync(u => u.IdUsuario != id && u.Correo == dto.Correo))
                return Conflict(new { mensaje = "Ese correo ya pertenece a otra cuenta. No puede reutilizarse." });

            var nuevoCorreo = dto.Correo.Trim();
            if (usuario.IdRol != dto.IdRol ||
                !string.Equals(usuario.Correo, nuevoCorreo, StringComparison.Ordinal))
                usuario.VersionSesion++;

            usuario.Nombre = dto.Nombre.Trim();
            usuario.IdRol = dto.IdRol;
            usuario.Correo = nuevoCorreo;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Reactivación lógica: se conserva el ID, la contraseña y las relaciones académicas.
        [HttpPut("{id}/reactivar")]
        public async Task<IActionResult> ReactivarUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return NotFound(new { mensaje = "No existe el usuario solicitado." });
            if (usuario.Activo)
                return Conflict(new { mensaje = "El usuario ya está activo." });

            var rolActivo = await _context.NombreRoles.AnyAsync(r => r.IdRol == usuario.IdRol && r.Activo);
            if (!rolActivo)
                return Conflict(new { mensaje = "No puede reactivarse: el rol asociado está inactivo." });

            var conflicto = await _context.Usuarios.AnyAsync(u => u.IdUsuario != id && u.Activo &&
                (u.Correo == usuario.Correo || u.NoIdentificacion == usuario.NoIdentificacion));
            if (conflicto)
                return Conflict(new { mensaje = "La cuenta no puede reactivarse porque su correo o identificación ya está en uso." });

            usuario.Activo = true;
            usuario.VersionSesion++;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null || !usuario.Activo)
                return NotFound(new { mensaje = $"No se encontró el usuario con id {id}" });

            usuario.Activo = false;
            usuario.VersionSesion++;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
