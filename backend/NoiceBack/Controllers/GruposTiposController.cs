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
    public class GruposTiposController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public GruposTiposController(PortalNoticiasContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GrupoTipoDto>>> GetGruposTipos()
        {
            var tipos = await _context.GruposTipos
                .Where(t => t.Activo)
                .Select(t => new GrupoTipoDto { IdGrupoTipo = t.IdGrupoTipo, Tipo = t.Tipo, Activo = t.Activo })
                .ToListAsync();
            return Ok(tipos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GrupoTipoDto>> GetGrupoTipo(int id)
        {
            var tipo = await _context.GruposTipos.FindAsync(id);
            if (tipo == null || !tipo.Activo)
                return NotFound(new { mensaje = $"No se encontró el tipo de grupo con id {id}" });

            return Ok(new GrupoTipoDto { IdGrupoTipo = tipo.IdGrupoTipo, Tipo = tipo.Tipo, Activo = tipo.Activo });
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<GrupoTipoDto>> CrearGrupoTipo(GrupoTipoCreateUpdateDto dto)
        {
            var tipo = new GrupoTipo { Tipo = dto.Tipo, FechaAlta = DateTime.Now, Activo = true };
            _context.GruposTipos.Add(tipo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetGrupoTipo), new { id = tipo.IdGrupoTipo }, tipo);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarGrupoTipo(int id, GrupoTipoCreateUpdateDto dto)
        {
            var tipo = await _context.GruposTipos.FindAsync(id);
            if (tipo == null || !tipo.Activo)
                return NotFound(new { mensaje = $"No se encontró el tipo de grupo con id {id}" });

            tipo.Tipo = dto.Tipo;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EliminarGrupoTipo(int id)
        {
            var tipo = await _context.GruposTipos.FindAsync(id);
            if (tipo == null || !tipo.Activo)
                return NotFound(new { mensaje = $"No se encontró el tipo de grupo con id {id}" });

            tipo.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
