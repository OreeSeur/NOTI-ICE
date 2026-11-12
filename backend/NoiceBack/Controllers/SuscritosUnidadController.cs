using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Controllers
{
    // Listado nominal de alumnos que agregaron una materia/laboratorio de los horarios a su perfil.
    // Lo consultan el Administrador (cualquier unidad) y el Docente con solicitud Aprobada en esa
    // unidad. Las suscripciones del portal NO son inscripciones oficiales del IPN.
    [ApiController]
    [Authorize(Roles = "Administrador,Docente")]
    [Route("api/oferta-academica/unidades")]
    public sealed class SuscritosUnidadController : ControllerBase
    {
        public const string Aviso =
            "Alumnos que agregaron esta materia a su perfil; no es una inscripción oficial.";
        private const int MaxAlumnos = 500;

        private readonly PortalNoticiasContext _context;
        public SuscritosUnidadController(PortalNoticiasContext context) => _context = context;

        // GET /api/oferta-academica/unidades/{idUnidadOferta}/suscritos
        [HttpGet("{idUnidadOferta:int}/suscritos")]
        public async Task<IActionResult> Listar(int idUnidadOferta)
        {
            var ct = HttpContext.RequestAborted;
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) || id <= 0)
                return Forbid();

            // Rol vigente en BD (no solo el claim del JWT): cuenta y rol activos.
            var rol = await _context.Usuarios.AsNoTracking()
                .Where(u => u.IdUsuario == id && u.Activo && u.Rol != null && u.Rol.Activo)
                .Select(u => u.Rol!.Nombre).FirstOrDefaultAsync(ct);
            if (rol is not ("Administrador" or "Docente")) return Forbid();

            var unidad = _context.OfertaUnidades.AsNoTracking()
                .Where(u => u.IdUnidadOferta == idUnidadOferta && u.Grupo.Activo && u.Grupo.Periodo.Activo);
            // Docente: solo unidades con su solicitud Aprobada. Una unidad ajena responde igual que
            // una inexistente, para no revelar cuales existen ni quien las imparte.
            if (rol == "Docente")
                unidad = unidad.Where(u => _context.OfertaSolicitudesDocentes.Any(s =>
                    s.IdUnidadOferta == u.IdUnidadOferta && s.IdUsuario == id &&
                    s.Estado == EstadosSolicitudDocente.Aprobada));

            var resultado = await unidad.Select(u => new SuscritosUnidadDto
            {
                IdUnidadOferta = u.IdUnidadOferta,
                NombrePublicado = u.NombrePublicado,
                EsLaboratorio = u.EsLaboratorio,
                Periodo = u.Grupo.Periodo.Clave,
                Plan = u.Grupo.Plan,
                CodigoGrupo = u.Grupo.CodigoGrupo
            }).FirstOrDefaultAsync(ct);
            if (resultado is null)
                return NotFound(new { mensaje = "No se encontró la materia o no la tienes aprobada." });

            // Solo nombre, carrera, semestre y fecha: nunca correo, boleta ni datos de acceso.
            var suscritos = _context.OfertaInscripcionesAlumnos.AsNoTracking()
                .Where(i => i.IdUnidadOferta == idUnidadOferta && i.Activo && i.Alumno.Activo);
            resultado.Total = await suscritos.CountAsync(ct);
            resultado.Alumnos = await suscritos
                .OrderBy(i => i.Alumno.Nombre).ThenBy(i => i.IdInscripcionOferta)
                .Take(MaxAlumnos)
                .Select(i => new AlumnoSuscritoDto
                {
                    Nombre = i.Alumno.Nombre,
                    Carrera = i.Alumno.Carrera,
                    Semestre = i.Alumno.Semestre,
                    FechaSuscripcion = i.FechaAlta
                }).ToListAsync(ct);
            // FechaAlta se guarda con DateTime.UtcNow; marcarla como UTC para que el JSON lleve "Z"
            // y el navegador la convierta a la hora local (si no, la muestra como si ya fuera local).
            foreach (var alumno in resultado.Alumnos)
                alumno.FechaSuscripcion = DateTime.SpecifyKind(alumno.FechaSuscripcion, DateTimeKind.Utc);
            resultado.Aviso = Aviso;
            return Ok(resultado);
        }
    }
}
