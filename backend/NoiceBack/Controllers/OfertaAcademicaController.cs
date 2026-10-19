using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Controllers
{
    // Consulta de horarios publicados. No toca grupos de inscripción ni usuarios.
    [ApiController]
    [Authorize(Roles = "Administrador,Docente,Alumno")]
    [Route("api/oferta-academica")]
    public sealed class OfertaAcademicaController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public OfertaAcademicaController(PortalNoticiasContext context) => _context = context;

        [HttpGet("periodos")]
        public async Task<IActionResult> ListarPeriodos()
        {
            var periodos = await _context.OfertaPeriodos.AsNoTracking()
                .Where(p => p.Activo)
                .OrderByDescending(p => p.Clave)
                .Select(p => new PeriodoAcademicoConsultaDto
                {
                    Clave = p.Clave,
                    Descripcion = p.Descripcion
                })
                .Take(100)
                .ToListAsync(HttpContext.RequestAborted);
            return Ok(periodos);
        }

        // El periodo es obligatorio para no mezclar oferta histórica con actual.
        [HttpGet("grupos")]
        public async Task<IActionResult> ListarGrupos(
            [FromQuery] string? periodo,
            [FromQuery] string? plan = null,
            [FromQuery] int? semestre = null,
            [FromQuery] bool? esEspecial = null)
        {
            if (!PeriodoValido(periodo))
                return BadRequest(new { mensaje = "Debes indicar un periodo válido (hasta 20 caracteres)." });
            if (!PlanValido(plan) || (semestre.HasValue && (semestre < 1 || semestre > 12)))
                return BadRequest(new { mensaje = "Plan o semestre inválido." });

            var periodoBuscado = periodo!.Trim();
            var consulta = _context.OfertaGrupos.AsNoTracking()
                .Where(g => g.Activo && g.Periodo.Activo && g.Periodo.Clave == periodoBuscado);
            if (!string.IsNullOrWhiteSpace(plan))
            {
                var planBuscado = plan.Trim();
                consulta = consulta.Where(g => g.Plan == planBuscado);
            }
            if (semestre.HasValue)
                consulta = consulta.Where(g => g.Semestre == semestre.Value);
            if (esEspecial.HasValue)
                consulta = consulta.Where(g => g.EsEspecial == esEspecial.Value);

            var grupos = await consulta
                .OrderBy(g => g.CodigoGrupo).ThenBy(g => g.Programa)
                .Take(200).Select(g => new GrupoOfertaConsultaDto
                {
                    IdGrupoOferta = g.IdGrupoOferta,
                    Periodo = g.Periodo.Clave,
                    CodigoGrupo = g.CodigoGrupo,
                    Plan = g.Plan,
                    Programa = g.Programa,
                    Semestre = g.Semestre,
                    Turno = g.Turno,
                    Modalidad = g.Modalidad,
                    Especialidad = g.Especialidad,
                    EsEspecial = g.EsEspecial,
                    UrlFuente = g.UrlFuente,
                    FechaActualizacionFuente = g.FechaActualizacionFuente,
                    FechaConsulta = g.FechaConsulta
                }).ToListAsync(HttpContext.RequestAborted);

            return Ok(grupos);
        }

        // GET /api/oferta-academica/grupos/1CM10?periodo=2027-1&plan=2024
        // "programa" permite resolver códigos repetidos entre carreras.
        [HttpGet("grupos/{codigoGrupo}")]
        public async Task<IActionResult> DetalleGrupo(
            string codigoGrupo,
            [FromQuery] string? periodo,
            [FromQuery] string? plan,
            [FromQuery] string? programa = null)
        {
            if (!PeriodoValido(periodo) || !PlanValido(plan) || string.IsNullOrWhiteSpace(plan) ||
                string.IsNullOrWhiteSpace(codigoGrupo) || codigoGrupo.Trim().Length > 30 ||
                (programa is not null && programa.Length > 180))
                return BadRequest(new { mensaje = "Debes indicar grupo, periodo y plan válidos." });

            var periodoBuscado = periodo!.Trim();
            var planBuscado = plan!.Trim();
            var grupoBuscado = codigoGrupo.Trim();
            var consulta = _context.OfertaGrupos.AsNoTracking()
                .Where(g => g.Activo && g.Periodo.Activo &&
                    g.Periodo.Clave == periodoBuscado && g.Plan == planBuscado &&
                    g.CodigoGrupo == grupoBuscado);
            if (!string.IsNullOrWhiteSpace(programa))
            {
                var programaBuscado = programa.Trim();
                consulta = consulta.Where(g => g.Programa == programaBuscado);
            }

            var coincidencias = await consulta.OrderBy(g => g.IdGrupoOferta)
                .Select(g => new GrupoOfertaConsultaDto
                {
                    IdGrupoOferta = g.IdGrupoOferta,
                    Periodo = g.Periodo.Clave,
                    CodigoGrupo = g.CodigoGrupo,
                    Plan = g.Plan,
                    Programa = g.Programa,
                    Semestre = g.Semestre,
                    Turno = g.Turno,
                    Modalidad = g.Modalidad,
                    Especialidad = g.Especialidad,
                    EsEspecial = g.EsEspecial,
                    UrlFuente = g.UrlFuente,
                    FechaActualizacionFuente = g.FechaActualizacionFuente,
                    FechaConsulta = g.FechaConsulta
                }).Take(2).ToListAsync(HttpContext.RequestAborted);

            if (coincidencias.Count == 0)
                return NotFound(new { mensaje = "No se encontró el grupo para ese periodo y plan." });
            if (coincidencias.Count > 1)
                return Conflict(new { mensaje = "La clave del grupo no es única en este plan; especifica programa." });

            var grupo = coincidencias[0];
            // Dos colecciones hijas: SplitQuery evita productos cartesianos.
            var unidades = await _context.OfertaUnidades.AsNoTracking().AsSplitQuery()
                .Where(u => u.IdGrupoOferta == grupo.IdGrupoOferta)
                .OrderBy(u => u.OrdenFuente)
                .Select(u => new UnidadOfertaConsultaDto
                {
                    IdUnidadOferta = u.IdUnidadOferta,
                    OrdenFuente = u.OrdenFuente,
                    NombrePublicado = u.NombrePublicado,
                    EsLaboratorio = u.EsLaboratorio,
                    AulaPublicada = u.AulaPublicada,
                    IdMateriaCatalogo = u.IdMateriaCatalogo,
                    Sesiones = u.Sesiones.OrderBy(s => s.DiaSemana)
                        .ThenBy(s => s.HoraInicio)
                        .Select(s => new HorarioSesionConsultaDto
                        {
                            DiaSemana = s.DiaSemana,
                            HoraInicio = s.HoraInicio,
                            HoraFin = s.HoraFin,
                            Aula = s.Aula
                        }).ToList(),
                    Docentes = u.Docentes.OrderBy(d => d.Orden)
                        .Select(d => new DocentePublicadoConsultaDto
                        {
                            Orden = d.Orden,
                            Tipo = d.Tipo,
                            NombrePublicado = d.NombrePublicado
                        }).ToList()
                }).ToListAsync(HttpContext.RequestAborted);

            return Ok(new GrupoOfertaDetalleConsultaDto { Grupo = grupo, Unidades = unidades });
        }

        // Coincidencias textuales de nombres publicados, no identidad oficial.
        [HttpGet("buscar")]
        public async Task<IActionResult> BuscarUnidad(
            [FromQuery] string? periodo,
            [FromQuery] string? materia,
            [FromQuery] string? plan = null)
        {
            if (!PeriodoValido(periodo) || string.IsNullOrWhiteSpace(materia) ||
                materia.Trim().Length > 120 || !PlanValido(plan))
                return BadRequest(new { mensaje = "Indica periodo y materia válidos (máximo 120 caracteres)." });

            var periodoBuscado = periodo!.Trim();
            var materiaBuscada = materia!.Trim();
            var consulta = _context.OfertaUnidades.AsNoTracking()
                .Where(u => u.Grupo.Activo && u.Grupo.Periodo.Activo &&
                    u.Grupo.Periodo.Clave == periodoBuscado &&
                    u.NombrePublicado.Contains(materiaBuscada));
            if (!string.IsNullOrWhiteSpace(plan))
            {
                var planBuscado = plan.Trim();
                consulta = consulta.Where(u => u.Grupo.Plan == planBuscado);
            }

            var resultados = await consulta
                .OrderBy(u => u.Grupo.CodigoGrupo).ThenBy(u => u.OrdenFuente)
                .Take(100)
                .Select(u => new UnidadEncontradaConsultaDto
                {
                    Periodo = u.Grupo.Periodo.Clave,
                    Plan = u.Grupo.Plan,
                    Programa = u.Grupo.Programa,
                    CodigoGrupo = u.Grupo.CodigoGrupo,
                    NombrePublicado = u.NombrePublicado,
                    EsLaboratorio = u.EsLaboratorio,
                    AulaPublicada = u.AulaPublicada
                }).ToListAsync(HttpContext.RequestAborted);
            return Ok(resultados);
        }

        private static bool PeriodoValido(string? periodo) =>
            !string.IsNullOrWhiteSpace(periodo) && periodo.Trim().Length <= 20;

        private static bool PlanValido(string? plan) =>
            plan is null || (plan.Trim().Length > 0 && plan.Trim().Length <= 10);
    }
}
