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
    public class GruposController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public GruposController(PortalNoticiasContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GrupoDto>>> GetGrupos()
        {
            var grupos = await _context.Grupos
                .Include(g => g.Materia)
                .Include(g => g.Profesor)
                .Include(g => g.GrupoTipoNav)
                .Where(g => g.Activo)
                .Select(g => new GrupoDto
                {
                    IdGrupo = g.IdGrupo,
                    IdMateria = g.IdMateria,
                    MateriaNombre = g.Materia!.MateriaNombre,
                    IdUsuario = g.IdUsuario,
                    ProfesorNombre = g.Profesor!.Nombre,
                    IdGrupoTipo = g.IdGrupoTipo,
                    GrupoTipoNombre = g.GrupoTipoNav!.Tipo,
                    FechaInicio = g.FechaInicio,
                    FechaFin = g.FechaFin,
                    HoraInicio = g.HoraInicio,
                    HoraFin = g.HoraFin,
                    Dias = g.Dias,
                    Activo = g.Activo
                })
                .ToListAsync();
            return Ok(grupos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<GrupoDto>> GetGrupo(int id)
        {
            var grupo = await _context.Grupos
                .Include(g => g.Materia)
                .Include(g => g.Profesor)
                .Include(g => g.GrupoTipoNav)
                .Where(g => g.IdGrupo == id && g.Activo)
                .Select(g => new GrupoDto
                {
                    IdGrupo = g.IdGrupo,
                    IdMateria = g.IdMateria,
                    MateriaNombre = g.Materia!.MateriaNombre,
                    IdUsuario = g.IdUsuario,
                    ProfesorNombre = g.Profesor!.Nombre,
                    IdGrupoTipo = g.IdGrupoTipo,
                    GrupoTipoNombre = g.GrupoTipoNav!.Tipo,
                    FechaInicio = g.FechaInicio,
                    FechaFin = g.FechaFin,
                    HoraInicio = g.HoraInicio,
                    HoraFin = g.HoraFin,
                    Dias = g.Dias,
                    Activo = g.Activo
                })
                .FirstOrDefaultAsync();

            if (grupo == null)
                return NotFound(new { mensaje = $"No se encontró el grupo con id {id}" });

            return Ok(grupo);
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<GrupoDto>> CrearGrupo(GrupoCreateUpdateDto dto)
        {
            var materiaExiste = await _context.Materias.AnyAsync(m => m.IdMateria == dto.IdMateria && m.Activo);
            if (!materiaExiste)
                return BadRequest(new { mensaje = "La materia especificada no existe o está inactiva" });

            var profesorExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == dto.IdUsuario && u.Activo);
            if (!profesorExiste)
                return BadRequest(new { mensaje = "El profesor especificado no existe o está inactivo" });

            var tipoExiste = await _context.GruposTipos.AnyAsync(t => t.IdGrupoTipo == dto.IdGrupoTipo && t.Activo);
            if (!tipoExiste)
                return BadRequest(new { mensaje = "El tipo de grupo especificado no existe o está inactivo" });

            var grupo = new Grupo
            {
                IdMateria = dto.IdMateria,
                IdUsuario = dto.IdUsuario,
                IdGrupoTipo = dto.IdGrupoTipo,
                FechaInicio = dto.FechaInicio,
                FechaFin = dto.FechaFin,
                HoraInicio = dto.HoraInicio,
                HoraFin = dto.HoraFin,
                Dias = dto.Dias,
                FechaAlta = DateTime.Now,
                Activo = true
            };

            _context.Grupos.Add(grupo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetGrupo), new { id = grupo.IdGrupo }, grupo);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarGrupo(int id, GrupoCreateUpdateDto dto)
        {
            var grupo = await _context.Grupos.FindAsync(id);
            if (grupo == null || !grupo.Activo)
                return NotFound(new { mensaje = $"No se encontró el grupo con id {id}" });

            grupo.IdMateria = dto.IdMateria;
            grupo.IdUsuario = dto.IdUsuario;
            grupo.IdGrupoTipo = dto.IdGrupoTipo;
            grupo.FechaInicio = dto.FechaInicio;
            grupo.FechaFin = dto.FechaFin;
            grupo.HoraInicio = dto.HoraInicio;
            grupo.HoraFin = dto.HoraFin;
            grupo.Dias = dto.Dias;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EliminarGrupo(int id)
        {
            var grupo = await _context.Grupos.FindAsync(id);
            if (grupo == null || !grupo.Activo)
                return NotFound(new { mensaje = $"No se encontró el grupo con id {id}" });

            grupo.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ---------- Sub-recurso: alumnos inscritos en el grupo ----------

        [HttpGet("{idGrupo}/alumnos")]
        public async Task<ActionResult<IEnumerable<GrupoAlumnoDto>>> GetAlumnosDeGrupo(int idGrupo)
        {
            var alumnos = await _context.GruposAlumnos
                .Include(ga => ga.Alumno)
                .Where(ga => ga.IdGrupo == idGrupo && ga.Activo)
                .Select(ga => new GrupoAlumnoDto
                {
                    IdGrupoAlumno = ga.IdGrupoAlumno,
                    IdGrupo = ga.IdGrupo,
                    IdUsuario = ga.IdUsuario,
                    AlumnoNombre = ga.Alumno!.Nombre
                })
                .ToListAsync();

            return Ok(alumnos);
        }

        [HttpPost("inscribir")]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<GrupoAlumnoDto>> InscribirAlumno(GrupoAlumnoCreateDto dto)
        {
            var grupoExiste = await _context.Grupos.AnyAsync(g => g.IdGrupo == dto.IdGrupo && g.Activo);
            if (!grupoExiste)
                return BadRequest(new { mensaje = "El grupo especificado no existe o está inactivo" });

            var alumnoExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == dto.IdUsuario && u.Activo);
            if (!alumnoExiste)
                return BadRequest(new { mensaje = "El alumno especificado no existe o está inactivo" });

            var yaInscrito = await _context.GruposAlumnos
                .AnyAsync(ga => ga.IdGrupo == dto.IdGrupo && ga.IdUsuario == dto.IdUsuario && ga.Activo);
            if (yaInscrito)
                return BadRequest(new { mensaje = "El alumno ya está inscrito en este grupo" });

            var inscripcion = new GrupoAlumno
            {
                IdGrupo = dto.IdGrupo,
                IdUsuario = dto.IdUsuario,
                FechaAlta = DateTime.Now,
                Activo = true
            };

            _context.GruposAlumnos.Add(inscripcion);
            await _context.SaveChangesAsync();

            return Ok(new GrupoAlumnoDto
            {
                IdGrupoAlumno = inscripcion.IdGrupoAlumno,
                IdGrupo = inscripcion.IdGrupo,
                IdUsuario = inscripcion.IdUsuario
            });
        }

        [HttpDelete("desinscribir/{idGrupoAlumno}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> DesinscribirAlumno(int idGrupoAlumno)
        {
            var inscripcion = await _context.GruposAlumnos.FindAsync(idGrupoAlumno);
            if (inscripcion == null || !inscripcion.Activo)
                return NotFound(new { mensaje = $"No se encontró la inscripción con id {idGrupoAlumno}" });

            inscripcion.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
