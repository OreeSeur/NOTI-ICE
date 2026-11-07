using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Controllers
{
    // Flujo: el Docente solicita impartir una materia/laboratorio de los horarios; cualquier
    // Administrador activo la aprueba o la rechaza (gana la primera resolucion). Solo una solicitud
    // aprobada por unidad. La aprobacion permite publicar para los alumnos de esa unidad;
    // no es una asignacion oficial del IPN ni cambia el horario publicado.
    [ApiController]
    [Route("api/solicitudes-docentes")]
    public sealed class SolicitudesDocentesController : ControllerBase
    {
        private const int MaxPendientesPorDocente = 20;
        private const int MotivoMinimo = 5;
        private const int MotivoMaximo = 300;

        private readonly PortalNoticiasContext _context;
        public SolicitudesDocentesController(PortalNoticiasContext context) => _context = context;

        private int IdActual() => int.TryParse(
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : 0;

        // Se revalida en BD: cuenta activa, rol activo y rol vigente (no solo el claim del JWT).
        private Task<bool> CuentaActivaConRol(int id, string rol) =>
            _context.Usuarios.AsNoTracking().AnyAsync(u =>
                u.IdUsuario == id && u.Activo && u.Rol != null && u.Rol.Activo && u.Rol.Nombre == rol,
                HttpContext.RequestAborted);

        // ------------------------------------------------------------------ Docente

        [HttpGet("mias")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> MisSolicitudes()
        {
            var id = IdActual();
            if (id <= 0 || !await CuentaActivaConRol(id, "Docente")) return Forbid();

            var lista = await Proyectar(_context.OfertaSolicitudesDocentes.AsNoTracking()
                    .Where(s => s.IdUsuario == id), incluirDocente: false)
                .Take(300).ToListAsync(HttpContext.RequestAborted);
            return Ok(lista);
        }

        [HttpPost]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> Solicitar([FromBody] CrearSolicitudDocenteDto? dto)
        {
            var id = IdActual();
            if (id <= 0 || !await CuentaActivaConRol(id, "Docente")) return Forbid();
            if (dto is null || dto.IdUnidadOferta <= 0)
                return BadRequest(new { mensaje = "Selecciona una materia o laboratorio válido." });

            var ct = HttpContext.RequestAborted;
            var unidadActiva = await _context.OfertaUnidades.AsNoTracking().AnyAsync(u =>
                u.IdUnidadOferta == dto.IdUnidadOferta && u.Grupo.Activo && u.Grupo.Periodo.Activo, ct);
            if (!unidadActiva)
                return NotFound(new { mensaje = "No existe esa materia en un periodo activo." });

            var solicitudes = _context.OfertaSolicitudesDocentes.AsNoTracking()
                .Where(s => s.IdUnidadOferta == dto.IdUnidadOferta);
            if (await solicitudes.AnyAsync(s => s.Estado == EstadosSolicitudDocente.Aprobada, ct))
                return Conflict(new { mensaje = "Esta materia ya tiene un docente aprobado." });
            if (await solicitudes.AnyAsync(s => s.IdUsuario == id && s.Estado == EstadosSolicitudDocente.Pendiente, ct))
                return Conflict(new { mensaje = "Ya tienes una solicitud pendiente para esta materia." });

            var pendientes = await _context.OfertaSolicitudesDocentes.AsNoTracking()
                .CountAsync(s => s.IdUsuario == id && s.Estado == EstadosSolicitudDocente.Pendiente, ct);
            if (pendientes >= MaxPendientesPorDocente)
                return Conflict(new { mensaje = $"Tienes {MaxPendientesPorDocente} solicitudes pendientes; espera a que se resuelvan." });

            var solicitud = new OfertaSolicitudDocente
            {
                IdUsuario = id,
                IdUnidadOferta = dto.IdUnidadOferta,
                Estado = EstadosSolicitudDocente.Pendiente,
                FechaSolicitud = DateTime.UtcNow
            };
            _context.OfertaSolicitudesDocentes.Add(solicitud);
            try
            {
                await _context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (EsDuplicado(ex))
            {
                return Conflict(new { mensaje = "Ya existe una solicitud vigente para esta materia." });
            }

            return Ok(new { idSolicitud = solicitud.IdSolicitud, estado = solicitud.Estado,
                mensaje = "Solicitud enviada. Un Administrador la revisará." });
        }

        // El docente puede retirar su solicitud pendiente o dejar una materia aprobada.
        [HttpDelete("{idSolicitud:int}")]
        [Authorize(Roles = "Docente")]
        public async Task<IActionResult> Cancelar(int idSolicitud)
        {
            var id = IdActual();
            if (id <= 0 || !await CuentaActivaConRol(id, "Docente")) return Forbid();

            var cambiadas = await _context.OfertaSolicitudesDocentes
                .Where(s => s.IdSolicitud == idSolicitud && s.IdUsuario == id &&
                            (s.Estado == EstadosSolicitudDocente.Pendiente || s.Estado == EstadosSolicitudDocente.Aprobada))
                .ExecuteUpdateAsync(u => u
                    .SetProperty(s => s.Estado, EstadosSolicitudDocente.Cancelada)
                    .SetProperty(s => s.FechaResolucion, DateTime.UtcNow), HttpContext.RequestAborted);
            return cambiadas == 0
                ? NotFound(new { mensaje = "No tienes una solicitud vigente con ese identificador." })
                : NoContent();
        }

        // ------------------------------------------------------------------ Administrador

        [HttpGet]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Listar([FromQuery] string? estado = null)
        {
            var id = IdActual();
            if (id <= 0 || !await CuentaActivaConRol(id, "Administrador")) return Forbid();
            if (estado is not null && !EstadosSolicitudDocente.Todos.Contains(estado))
                return BadRequest(new { mensaje = "Estado no válido." });

            var consulta = _context.OfertaSolicitudesDocentes.AsNoTracking();
            if (estado is not null) consulta = consulta.Where(s => s.Estado == estado);
            var lista = await Proyectar(consulta, incluirDocente: true)
                .Take(300).ToListAsync(HttpContext.RequestAborted);
            return Ok(lista);
        }

        [HttpGet("pendientes/total")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> TotalPendientes()
        {
            var id = IdActual();
            if (id <= 0 || !await CuentaActivaConRol(id, "Administrador")) return Forbid();
            var total = await _context.OfertaSolicitudesDocentes.AsNoTracking()
                .CountAsync(s => s.Estado == EstadosSolicitudDocente.Pendiente, HttpContext.RequestAborted);
            return Ok(new { total });
        }

        [HttpPost("{idSolicitud:int}/aprobar")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Aprobar(int idSolicitud)
        {
            var idAdmin = IdActual();
            if (idAdmin <= 0 || !await CuentaActivaConRol(idAdmin, "Administrador")) return Forbid();
            var ct = HttpContext.RequestAborted;

            var solicitud = await _context.OfertaSolicitudesDocentes.AsNoTracking()
                .Where(s => s.IdSolicitud == idSolicitud)
                .Select(s => new
                {
                    s.IdUsuario, s.IdUnidadOferta, s.Estado,
                    UnidadActiva = s.Unidad.Grupo.Activo && s.Unidad.Grupo.Periodo.Activo
                }).FirstOrDefaultAsync(ct);
            if (solicitud is null) return NotFound(new { mensaje = "No existe la solicitud." });
            if (solicitud.Estado != EstadosSolicitudDocente.Pendiente)
                return Conflict(new { mensaje = $"La solicitud ya está {solicitud.Estado.ToLowerInvariant()}." });
            if (solicitud.IdUsuario == idAdmin)
                return Conflict(new { mensaje = "No puedes aprobar una solicitud propia." });
            if (!solicitud.UnidadActiva)
                return Conflict(new { mensaje = "La materia ya no está en un periodo activo." });
            if (!await CuentaActivaConRol(solicitud.IdUsuario, "Docente"))
                return Conflict(new { mensaje = "La cuenta solicitante ya no es un Docente activo." });

            var ahora = DateTime.UtcNow;
            await using var transaccion = await _context.Database.BeginTransactionAsync(ct);
            int cambiadas;
            try
            {
                // Condicionada al estado: si otro Administrador resolvio antes, no cambia nada.
                cambiadas = await _context.OfertaSolicitudesDocentes
                    .Where(s => s.IdSolicitud == idSolicitud && s.Estado == EstadosSolicitudDocente.Pendiente)
                    .ExecuteUpdateAsync(u => u
                        .SetProperty(s => s.Estado, EstadosSolicitudDocente.Aprobada)
                        .SetProperty(s => s.IdAdministrador, idAdmin)
                        .SetProperty(s => s.FechaResolucion, ahora)
                        .SetProperty(s => s.Motivo, (string?)null), ct);
            }
            catch (Exception ex) when (EsDuplicado(ex))
            {
                return Conflict(new { mensaje = "Esta materia ya tiene un docente aprobado." });
            }
            if (cambiadas == 0)
                return Conflict(new { mensaje = "Otro Administrador ya resolvió esta solicitud." });

            // Solo un docente por unidad: las demas solicitudes pendientes se rechazan.
            await _context.OfertaSolicitudesDocentes
                .Where(s => s.IdUnidadOferta == solicitud.IdUnidadOferta && s.IdSolicitud != idSolicitud &&
                            s.Estado == EstadosSolicitudDocente.Pendiente)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(s => s.Estado, EstadosSolicitudDocente.Rechazada)
                    .SetProperty(s => s.IdAdministrador, idAdmin)
                    .SetProperty(s => s.FechaResolucion, ahora)
                    .SetProperty(s => s.Motivo, "La materia se asignó a otro docente."), ct);
            await transaccion.CommitAsync(ct);
            return Ok(new { idSolicitud, estado = EstadosSolicitudDocente.Aprobada, mensaje = "Solicitud aprobada." });
        }

        [HttpPost("{idSolicitud:int}/rechazar")]
        [Authorize(Roles = "Administrador")]
        public Task<IActionResult> Rechazar(int idSolicitud, [FromBody] ResolverSolicitudDocenteDto? dto) =>
            Resolver(idSolicitud, dto, EstadosSolicitudDocente.Pendiente, EstadosSolicitudDocente.Rechazada,
                "Solicitud rechazada.");

        // Retira una asignacion aprobada; el docente deja de poder publicar para esa materia.
        [HttpPost("{idSolicitud:int}/revocar")]
        [Authorize(Roles = "Administrador")]
        public Task<IActionResult> Revocar(int idSolicitud, [FromBody] ResolverSolicitudDocenteDto? dto) =>
            Resolver(idSolicitud, dto, EstadosSolicitudDocente.Aprobada, EstadosSolicitudDocente.Revocada,
                "Asignación revocada.");

        private async Task<IActionResult> Resolver(int idSolicitud, ResolverSolicitudDocenteDto? dto,
            string estadoEsperado, string estadoNuevo, string mensaje)
        {
            var idAdmin = IdActual();
            if (idAdmin <= 0 || !await CuentaActivaConRol(idAdmin, "Administrador")) return Forbid();
            var motivo = dto?.Motivo?.Trim() ?? "";
            if (motivo.Length is < MotivoMinimo or > MotivoMaximo)
                return BadRequest(new { mensaje = $"Indica un motivo de {MotivoMinimo} a {MotivoMaximo} caracteres." });

            var ct = HttpContext.RequestAborted;
            var cambiadas = await _context.OfertaSolicitudesDocentes
                .Where(s => s.IdSolicitud == idSolicitud && s.Estado == estadoEsperado && s.IdUsuario != idAdmin)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(s => s.Estado, estadoNuevo)
                    .SetProperty(s => s.IdAdministrador, idAdmin)
                    .SetProperty(s => s.FechaResolucion, DateTime.UtcNow)
                    .SetProperty(s => s.Motivo, motivo), ct);
            if (cambiadas > 0) return Ok(new { idSolicitud, estado = estadoNuevo, mensaje });

            var actual = await _context.OfertaSolicitudesDocentes.AsNoTracking()
                .Where(s => s.IdSolicitud == idSolicitud).Select(s => s.Estado).FirstOrDefaultAsync(ct);
            return actual is null
                ? NotFound(new { mensaje = "No existe la solicitud." })
                : Conflict(new { mensaje = $"La solicitud está {actual.ToLowerInvariant()}; no se puede cambiar." });
        }

        // ------------------------------------------------------------------ Destinos para publicar

        // Materias aprobadas que el usuario puede elegir como destinatarias de una publicacion:
        // el Docente, solo las suyas; el Administrador, todas las aprobadas.
        [HttpGet("destinos")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> Destinos()
        {
            var id = IdActual();
            var esAdmin = User.IsInRole("Administrador");
            if (id <= 0 || !await CuentaActivaConRol(id, esAdmin ? "Administrador" : "Docente")) return Forbid();

            var consulta = _context.OfertaSolicitudesDocentes.AsNoTracking()
                .Where(s => s.Estado == EstadosSolicitudDocente.Aprobada &&
                            s.Unidad.Grupo.Activo && s.Unidad.Grupo.Periodo.Activo);
            if (!esAdmin) consulta = consulta.Where(s => s.IdUsuario == id);

            var destinos = await consulta
                .OrderBy(s => s.Unidad.Grupo.CodigoGrupo).ThenBy(s => s.Unidad.OrdenFuente)
                .Select(s => new UnidadDestinoDto
                {
                    IdUnidadOferta = s.IdUnidadOferta,
                    NombrePublicado = s.Unidad.NombrePublicado,
                    EsLaboratorio = s.Unidad.EsLaboratorio,
                    Periodo = s.Unidad.Grupo.Periodo.Clave,
                    Plan = s.Unidad.Grupo.Plan,
                    CodigoGrupo = s.Unidad.Grupo.CodigoGrupo,
                    DocenteNombre = esAdmin ? s.Docente.Nombre : null,
                    AlumnosSuscritos = _context.OfertaInscripcionesAlumnos
                        .Count(i => i.IdUnidadOferta == s.IdUnidadOferta && i.Activo)
                }).Take(500).ToListAsync(HttpContext.RequestAborted);
            return Ok(destinos);
        }

        // ------------------------------------------------------------------ Auxiliares

        private static IQueryable<SolicitudDocenteDto> Proyectar(IQueryable<OfertaSolicitudDocente> consulta,
            bool incluirDocente) =>
            consulta.OrderByDescending(s => s.FechaSolicitud).ThenByDescending(s => s.IdSolicitud)
                .Select(s => new SolicitudDocenteDto
                {
                    IdSolicitud = s.IdSolicitud,
                    Estado = s.Estado,
                    FechaSolicitud = s.FechaSolicitud,
                    FechaResolucion = s.FechaResolucion,
                    Motivo = s.Motivo,
                    AdministradorNombre = s.Administrador != null ? s.Administrador.Nombre : null,
                    IdUnidadOferta = s.IdUnidadOferta,
                    NombrePublicado = s.Unidad.NombrePublicado,
                    EsLaboratorio = s.Unidad.EsLaboratorio,
                    Periodo = s.Unidad.Grupo.Periodo.Clave,
                    Plan = s.Unidad.Grupo.Plan,
                    Programa = s.Unidad.Grupo.Programa,
                    CodigoGrupo = s.Unidad.Grupo.CodigoGrupo,
                    Semestre = s.Unidad.Grupo.Semestre,
                    Turno = s.Unidad.Grupo.Turno,
                    DocentesPublicados = s.Unidad.Docentes.OrderBy(d => d.Orden)
                        .Select(d => d.Tipo == "VACANTE" || d.NombrePublicado == null ? "Vacante" : d.NombrePublicado)
                        .ToList(),
                    IdDocente = incluirDocente ? s.IdUsuario : null,
                    DocenteNombre = incluirDocente ? s.Docente.Nombre : null,
                    DocenteCorreo = incluirDocente ? s.Docente.Correo : null
                });

        // Violacion de indice unico: MySQL 1062; en las pruebas aisladas, SQLite (restriccion).
        private static bool EsDuplicado(Exception ex)
        {
            for (var e = (Exception?)ex; e is not null; e = e.InnerException)
            {
                if (e is MySqlException { Number: 1062 }) return true;
                if (e.GetType().Name == "SqliteException" && e.Message.Contains("UNIQUE", StringComparison.Ordinal))
                    return true;
            }
            return false;
        }
    }
}
