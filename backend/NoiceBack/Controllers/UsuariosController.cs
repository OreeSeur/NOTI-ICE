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
            var correoExiste = await _context.Usuarios.AnyAsync(u => u.Correo == dto.Correo);
            if (correoExiste)
                return BadRequest(new { mensaje = "Ya existe un usuario con ese correo" });

            var rolExiste = await _context.NombreRoles.AnyAsync(r => r.IdRol == dto.IdRol && r.Activo);
            if (!rolExiste)
                return BadRequest(new { mensaje = "El rol especificado no existe o está inactivo" });

            var usuario = new Usuario
            {
                Nombre = dto.Nombre,
                IdRol = dto.IdRol,
                NoIdentificacion = dto.NoIdentificacion,
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

            usuario.Nombre = dto.Nombre;
            usuario.IdRol = dto.IdRol;
            usuario.Correo = dto.Correo;

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
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
