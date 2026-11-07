using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Controllers
{
    // Suscripciones de alumnos a unidades de los horarios. NO son inscripciones del IPN.
    [ApiController]
    [Authorize(Roles = "Alumno")]
    [Route("api/oferta-academica/mis-materias")]
    public sealed class InscripcionesOfertaController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public InscripcionesOfertaController(PortalNoticiasContext context) => _context = context;

        private int IdAlumno() => int.TryParse(
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        private async Task<bool> AlumnoActivo(int id) =>
            await _context.Usuarios.AsNoTracking().AnyAsync(u =>
                u.IdUsuario == id && u.Activo && u.Rol != null &&
                u.Rol.Activo && u.Rol.Nombre == "Alumno", HttpContext.RequestAborted);

        // GET devuelve exclusivamente selecciones del alumno identificado por JWT.
        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var id = IdAlumno();
            if (id <= 0 || !await AlumnoActivo(id)) return Forbid();

            var materias = await _context.OfertaInscripcionesAlumnos.AsNoTracking().AsSplitQuery()
                .Where(i => i.IdUsuario == id && i.Activo)
                .OrderByDescending(i => i.Unidad.Grupo.Periodo.Clave)
                .ThenBy(i => i.Unidad.Grupo.CodigoGrupo)
                .ThenBy(i => i.Unidad.OrdenFuente)
                .Select(i => new MisMateriasOfertaDto
                {
                    IdUnidadOferta = i.IdUnidadOferta,
                    Periodo = i.Unidad.Grupo.Periodo.Clave,
                    Plan = i.Unidad.Grupo.Plan,
                    Programa = i.Unidad.Grupo.Programa,
                    CodigoGrupo = i.Unidad.Grupo.CodigoGrupo,
                    NombrePublicado = i.Unidad.NombrePublicado,
                    EsLaboratorio = i.Unidad.EsLaboratorio,
                    AulaPublicada = i.Unidad.AulaPublicada,
                    FechaAlta = i.FechaAlta,
                    Sesiones = i.Unidad.Sesiones.OrderBy(s => s.DiaSemana)
                        .ThenBy(s => s.HoraInicio)
                        .Select(s => new HorarioSesionConsultaDto
                        {
                            DiaSemana = s.DiaSemana,
                            HoraInicio = s.HoraInicio,
                            HoraFin = s.HoraFin,
                            Aula = s.Aula
                        }).ToList(),
                    Docentes = i.Unidad.Docentes.OrderBy(d => d.Orden)
                        .Select(d => new DocentePublicadoConsultaDto
                        {
                            Orden = d.Orden,
                            Tipo = d.Tipo,
                            NombrePublicado = d.NombrePublicado
                        }).ToList()
                }).ToListAsync(HttpContext.RequestAborted);

            return Ok(materias);
        }

        // POST { "idUnidadOferta": 123 }. Nunca acepta un idUsuario del cliente.
        [HttpPost]
        public async Task<IActionResult> Agregar([FromBody] AgregarInscripcionOfertaDto dto)
        {
            var id = IdAlumno();
            if (id <= 0 || !await AlumnoActivo(id)) return Forbid();
            if (dto.IdUnidadOferta <= 0)
                return BadRequest(new { mensaje = "Selecciona una unidad académica válida." });

            var existe = await _context.OfertaUnidades.AsNoTracking().AnyAsync(u =>
                u.IdUnidadOferta == dto.IdUnidadOferta && u.Grupo.Activo &&
                u.Grupo.Periodo.Activo, HttpContext.RequestAborted);
            if (!existe) return NotFound(new { mensaje = "No existe una unidad activa en esa oferta." });

            var anterior = await _context.OfertaInscripcionesAlumnos.FirstOrDefaultAsync(i =>
                i.IdUsuario == id && i.IdUnidadOferta == dto.IdUnidadOferta,
                HttpContext.RequestAborted);
            if (anterior?.Activo == true)
                return Conflict(new { mensaje = "Esta materia ya está agregada a tu perfil." });

            if (anterior is null)
            {
                _context.OfertaInscripcionesAlumnos.Add(new OfertaInscripcionAlumno
                {
                    IdUsuario = id,
                    IdUnidadOferta = dto.IdUnidadOferta,
                    FechaAlta = DateTime.UtcNow,
                    Activo = true
                });
            }
            else
            {
                anterior.Activo = true;
                anterior.FechaBaja = null;
                anterior.FechaAlta = DateTime.UtcNow;
            }

            try
            {
                await _context.SaveChangesAsync(HttpContext.RequestAborted);
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1062 })
            {
                return Conflict(new { mensaje = "Esta materia ya está agregada a tu perfil." });
            }

            return Ok(new { idUnidadOferta = dto.IdUnidadOferta, mensaje = "Materia agregada a tu perfil." });
        }

        // POST /grupo { "idGrupoOferta": 12 }: agrega todas las unidades activas del grupo que el
        // alumno aún no tenga (reactiva las dadas de baja). Nunca acepta un idUsuario del cliente.
        [HttpPost("grupo")]
        public async Task<IActionResult> AgregarGrupo([FromBody] AgregarGrupoOfertaDto dto)
        {
            var id = IdAlumno();
            if (id <= 0 || !await AlumnoActivo(id)) return Forbid();
            if (dto is null || dto.IdGrupoOferta <= 0)
                return BadRequest(new { mensaje = "Selecciona un grupo válido." });

            var ct = HttpContext.RequestAborted;
            var grupo = await _context.OfertaGrupos.AsNoTracking()
                .Where(g => g.IdGrupoOferta == dto.IdGrupoOferta && g.Activo && g.Periodo.Activo)
                .Select(g => new { g.CodigoGrupo }).FirstOrDefaultAsync(ct);
            if (grupo is null) return NotFound(new { mensaje = "No existe un grupo activo con ese identificador." });

            var unidades = await _context.OfertaUnidades.AsNoTracking()
                .Where(u => u.IdGrupoOferta == dto.IdGrupoOferta)
                .Select(u => u.IdUnidadOferta).ToListAsync(ct);
            if (unidades.Count == 0)
                return Ok(new { agregadas = 0, yaTenias = 0, mensaje = "El grupo no tiene materias publicadas." });

            var existentes = await _context.OfertaInscripcionesAlumnos
                .Where(i => i.IdUsuario == id && unidades.Contains(i.IdUnidadOferta))
                .ToListAsync(ct);
            var ahora = DateTime.UtcNow;
            var agregadas = 0;
            foreach (var idUnidad in unidades)
            {
                var anterior = existentes.FirstOrDefault(i => i.IdUnidadOferta == idUnidad);
                if (anterior?.Activo == true) continue;
                if (anterior is null)
                    _context.OfertaInscripcionesAlumnos.Add(new OfertaInscripcionAlumno
                    {
                        IdUsuario = id, IdUnidadOferta = idUnidad, FechaAlta = ahora, Activo = true
                    });
                else
                {
                    anterior.Activo = true;
                    anterior.FechaBaja = null;
                    anterior.FechaAlta = ahora;
                }
                agregadas++;
            }

            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ex.InnerException is MySqlException { Number: 1062 })
            {
                return Conflict(new { mensaje = "Tus materias cambiaron mientras se guardaban; vuelve a intentarlo." });
            }

            var yaTenias = unidades.Count - agregadas;
            return Ok(new
            {
                agregadas,
                yaTenias,
                mensaje = agregadas == 0
                    ? $"Ya tenías todas las materias del grupo {grupo.CodigoGrupo}."
                    : $"Se agregaron {agregadas} materia(s) del grupo {grupo.CodigoGrupo}."
            });
        }

        // DELETE sin identificador: da de baja todas las selecciones activas del alumno.
        [HttpDelete]
        public async Task<IActionResult> QuitarTodas()
        {
            var id = IdAlumno();
            if (id <= 0 || !await AlumnoActivo(id)) return Forbid();

            var quitadas = await _context.OfertaInscripcionesAlumnos
                .Where(i => i.IdUsuario == id && i.Activo)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(i => i.Activo, false)
                    .SetProperty(i => i.FechaBaja, DateTime.UtcNow), HttpContext.RequestAborted);
            return Ok(new { quitadas, mensaje = $"Se quitaron {quitadas} materia(s) de tu perfil." });
        }

        [HttpDelete("{idUnidadOferta:int}")]
        public async Task<IActionResult> Quitar(int idUnidadOferta)
        {
            var id = IdAlumno();
            if (id <= 0 || !await AlumnoActivo(id)) return Forbid();
            if (idUnidadOferta <= 0) return BadRequest();

            var inscripcion = await _context.OfertaInscripcionesAlumnos.FirstOrDefaultAsync(i =>
                i.IdUsuario == id && i.IdUnidadOferta == idUnidadOferta && i.Activo,
                HttpContext.RequestAborted);
            if (inscripcion is null) return NotFound(new { mensaje = "La materia no está en tu perfil." });

            inscripcion.Activo = false;
            inscripcion.FechaBaja = DateTime.UtcNow;
            await _context.SaveChangesAsync(HttpContext.RequestAborted);
            return NoContent();
        }
    }
}
