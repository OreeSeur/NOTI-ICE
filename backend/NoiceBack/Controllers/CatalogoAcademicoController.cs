using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;

namespace PortalNoticiasAPI.Controllers
{
    // Catalogo de materias por plan. La academia (opcion de optativas) viene de la tabla `academias`.
    [ApiController]
    [Authorize(Roles = "Administrador,Docente,Alumno")]
    [Route("api/catalogo-academico")]
    public sealed class CatalogoAcademicoController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public CatalogoAcademicoController(PortalNoticiasContext context) => _context = context;

        // GET /api/catalogo-academico/materias?plan=2003&semestre=8&idAcademia=1&pagina=1&tamanoPagina=50
        [HttpGet("materias")]
        public async Task<IActionResult> ListarMaterias(
            [FromQuery] string? plan = null,
            [FromQuery] int? semestre = null,
            [FromQuery] string? buscar = null,
            [FromQuery] int? idAcademia = null,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanoPagina = 50)
        {
            if (pagina < 1 || pagina > 10000 || tamanoPagina < 1 || tamanoPagina > 100)
                return BadRequest(new { mensaje = "Página: 1–10000. Tamaño de página: 1–100." });
            if (semestre.HasValue && (semestre < 1 || semestre > 12))
                return BadRequest(new { mensaje = "El semestre debe estar entre 1 y 12." });
            if (plan is not null && (plan.Trim().Length < 1 || plan.Trim().Length > 10))
                return BadRequest(new { mensaje = "Plan inválido." });
            if (buscar is not null && buscar.Trim().Length > 120)
                return BadRequest(new { mensaje = "La búsqueda admite hasta 120 caracteres." });
            if (idAcademia.HasValue && idAcademia <= 0)
                return BadRequest(new { mensaje = "Academia inválida." });

            var consulta = _context.CatalogoMateriasPlanes.AsNoTracking().Where(m => m.Activo);
            if (!string.IsNullOrWhiteSpace(plan))
            {
                var valor = plan.Trim();
                consulta = consulta.Where(m => m.Plan == valor);
            }
            if (semestre.HasValue)
                consulta = consulta.Where(m => m.Semestre == semestre.Value);
            if (idAcademia.HasValue)
                consulta = consulta.Where(m => m.IdAcademia == idAcademia.Value);
            if (!string.IsNullOrWhiteSpace(buscar))
            {
                var valor = buscar.Trim();
                consulta = consulta.Where(m => m.Nombre.Contains(valor));
            }

            var total = await consulta.CountAsync(HttpContext.RequestAborted);
            var resultados = await consulta
                .OrderBy(m => m.Plan).ThenBy(m => m.Semestre)
                .ThenBy(m => m.Nombre).ThenBy(m => m.IdMateriaCatalogo)
                .Skip((pagina - 1) * tamanoPagina).Take(tamanoPagina)
                .Select(m => new CatalogoMateriaConsultaDto
                {
                    IdMateriaCatalogo = m.IdMateriaCatalogo,
                    IdOrigen = m.IdOrigen,
                    Nombre = m.Nombre,
                    Plan = m.Plan,
                    Programa = m.Programa,
                    Semestre = m.Semestre,
                    Tipo = m.Tipo,
                    Especialidad = m.Especialidad,
                    Area = m.Area,
                    IdAcademia = m.IdAcademia,
                    AcademiaNombre = m.Academia != null ? m.Academia.Nombre : null,
                    ClaveOficialIPN = m.ClaveOficialVerificada ? m.ClaveOficialIPN : null,
                    ClaveOficialVerificada = m.ClaveOficialVerificada,
                    FuenteClaveOficialIPN = m.ClaveOficialVerificada ? m.FuenteClaveOficialIPN : null,
                    FechaVerificacionClaveOficialIPN = m.ClaveOficialVerificada
                        ? m.FechaVerificacionClaveOficialIPN : null
                })
                .ToListAsync(HttpContext.RequestAborted);

            return Ok(new { pagina, tamanoPagina, total, resultados });
        }
    }
}
