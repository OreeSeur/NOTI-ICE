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
    public class AcademiasController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public AcademiasController(PortalNoticiasContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AcademiaDto>>> GetAcademias()
        {
            var academias = await _context.Academias
                .Where(a => a.Activo)
                .Select(a => new AcademiaDto { IdAcademia = a.IdAcademia, Nombre = a.Nombre, Descripcion = a.Descripcion, Activo = a.Activo })
                .ToListAsync();
            return Ok(academias);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AcademiaDto>> GetAcademia(int id)
        {
            var academia = await _context.Academias.FindAsync(id);
            if (academia == null || !academia.Activo)
                return NotFound(new { mensaje = $"No se encontró la academia con id {id}" });

            return Ok(new AcademiaDto { IdAcademia = academia.IdAcademia, Nombre = academia.Nombre, Descripcion = academia.Descripcion, Activo = academia.Activo });
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<AcademiaDto>> CrearAcademia(AcademiaCreateUpdateDto dto)
        {
            var academia = new Academia { Nombre = dto.Nombre, Descripcion = dto.Descripcion, FechaAlta = DateTime.Now, Activo = true };
            _context.Academias.Add(academia);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAcademia), new { id = academia.IdAcademia }, academia);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarAcademia(int id, AcademiaCreateUpdateDto dto)
        {
            var academia = await _context.Academias.FindAsync(id);
            if (academia == null || !academia.Activo)
                return NotFound(new { mensaje = $"No se encontró la academia con id {id}" });

            academia.Nombre = dto.Nombre;
            academia.Descripcion = dto.Descripcion;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EliminarAcademia(int id)
        {
            var academia = await _context.Academias.FindAsync(id);
            if (academia == null || !academia.Activo)
                return NotFound(new { mensaje = $"No se encontró la academia con id {id}" });

            academia.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
