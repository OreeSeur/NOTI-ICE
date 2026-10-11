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
    public class MateriasController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public MateriasController(PortalNoticiasContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MateriaDto>>> GetMaterias()
        {
            var materias = await _context.Materias
                .Include(m => m.Academia)
                .Where(m => m.Activo)
                .Select(m => new MateriaDto
                {
                    IdMateria = m.IdMateria,
                    IdAcademia = m.IdAcademia,
                    AcademiaNombre = m.Academia!.Nombre,
                    MateriaNombre = m.MateriaNombre,
                    Descripcion = m.Descripcion,
                    Activo = m.Activo
                })
                .ToListAsync();
            return Ok(materias);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MateriaDto>> GetMateria(int id)
        {
            var materia = await _context.Materias
                .Include(m => m.Academia)
                .Where(m => m.IdMateria == id && m.Activo)
                .Select(m => new MateriaDto
                {
                    IdMateria = m.IdMateria,
                    IdAcademia = m.IdAcademia,
                    AcademiaNombre = m.Academia!.Nombre,
                    MateriaNombre = m.MateriaNombre,
                    Descripcion = m.Descripcion,
                    Activo = m.Activo
                })
                .FirstOrDefaultAsync();

            if (materia == null)
                return NotFound(new { mensaje = $"No se encontró la materia con id {id}" });

            return Ok(materia);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<MateriaDto>> CrearMateria(MateriaCreateUpdateDto dto)
        {
            var academiaExiste = await _context.Academias.AnyAsync(a => a.IdAcademia == dto.IdAcademia && a.Activo);
            if (!academiaExiste)
                return BadRequest(new { mensaje = "La academia especificada no existe o está inactiva" });

            var materia = new Materia
            {
                IdAcademia = dto.IdAcademia,
                MateriaNombre = dto.MateriaNombre,
                Descripcion = dto.Descripcion,
                FechaAlta = DateTime.Now,
                Activo = true
            };
            _context.Materias.Add(materia);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMateria), new { id = materia.IdMateria }, materia);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarMateria(int id, MateriaCreateUpdateDto dto)
        {
            var materia = await _context.Materias.FindAsync(id);
            if (materia == null || !materia.Activo)
                return NotFound(new { mensaje = $"No se encontró la materia con id {id}" });

            materia.IdAcademia = dto.IdAcademia;
            materia.MateriaNombre = dto.MateriaNombre;
            materia.Descripcion = dto.Descripcion;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EliminarMateria(int id)
        {
            var materia = await _context.Materias.FindAsync(id);
            if (materia == null || !materia.Activo)
                return NotFound(new { mensaje = $"No se encontró la materia con id {id}" });

            materia.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
