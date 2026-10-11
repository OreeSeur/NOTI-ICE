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
    public class RolesController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public RolesController(PortalNoticiasContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RolDto>>> GetRoles()
        {
            var roles = await _context.NombreRoles
                .Where(r => r.Activo)
                .Select(r => new RolDto { IdRol = r.IdRol, Nombre = r.Nombre, Activo = r.Activo })
                .ToListAsync();
            return Ok(roles);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<RolDto>> GetRol(int id)
        {
            var rol = await _context.NombreRoles.FindAsync(id);
            if (rol == null || !rol.Activo)
                return NotFound(new { mensaje = $"No se encontró el rol con id {id}" });

            return Ok(new RolDto { IdRol = rol.IdRol, Nombre = rol.Nombre, Activo = rol.Activo });
        }

        [HttpPost]
        public async Task<ActionResult<RolDto>> CrearRol(RolCreateUpdateDto dto)
        {
            var rol = new NombreRol { Nombre = dto.Nombre, FechaAlta = DateTime.Now, Activo = true };
            _context.NombreRoles.Add(rol);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetRol), new { id = rol.IdRol }, rol);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarRol(int id, RolCreateUpdateDto dto)
        {
            var rol = await _context.NombreRoles.FindAsync(id);
            if (rol == null || !rol.Activo)
                return NotFound(new { mensaje = $"No se encontró el rol con id {id}" });

            rol.Nombre = dto.Nombre;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarRol(int id)
        {
            var rol = await _context.NombreRoles.FindAsync(id);
            if (rol == null || !rol.Activo)
                return NotFound(new { mensaje = $"No se encontró el rol con id {id}" });

            rol.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
