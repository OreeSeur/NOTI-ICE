using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;
using PortalNoticiasAPI.Services;

namespace PortalNoticiasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventosController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        private readonly NotificacionCorreoService _notificaciones;
        private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

        public EventosController(PortalNoticiasContext context, NotificacionCorreoService notificaciones)
        {
            _context = context;
            _notificaciones = notificaciones;
        }

        private int? GetUserId()
        {
            var valor = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(valor, out var id) ? id : null;
        }

        // El Administrador puede modificar cualquier evento; el Docente, solo los suyos
        private bool PuedeModificar(Evento e) =>
            User.IsInRole("Administrador") || e.IdUsuario == GetUserId();

        private static EventoDto ToDto(Evento e)
        {
            AudienciaDto audiencia;
            try
            {
                audiencia = string.IsNullOrWhiteSpace(e.AudienciaJson)
                    ? new AudienciaDto()
                    : JsonSerializer.Deserialize<AudienciaDto>(e.AudienciaJson, JsonOpts) ?? new AudienciaDto();
            }
            catch
            {
                audiencia = new AudienciaDto();
            }
            audiencia.Prioridad = e.Prioridad;

            return new EventoDto
            {
                IdEvento = e.IdEvento,
                Titulo = e.Titulo,
                Descripcion = e.Descripcion,
                Lugar = e.Lugar,
                FechaInicio = e.FechaInicio,
                FechaFin = e.FechaFin,
                HoraInicio = e.HoraInicio,
                HoraFin = e.HoraFin,
                IdUsuario = e.IdUsuario,
                OrganizadorNombre = e.Usuario?.Nombre,
                CategoriaEvento = e.CategoriaEvento,
                Activo = e.Activo,
                Audiencia = audiencia
            };
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EventoDto>>> GetEventos()
        {
            var eventos = await _context.Eventos
                .Include(e => e.Usuario)
                .Where(e => e.Activo)
                .OrderBy(e => e.FechaInicio)
                .ToListAsync();

            return Ok(eventos.Select(ToDto));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<EventoDto>> GetEvento(int id)
        {
            var evento = await _context.Eventos
                .Include(e => e.Usuario)
                .FirstOrDefaultAsync(e => e.IdEvento == id && e.Activo);

            if (evento == null)
                return NotFound(new { mensaje = $"No se encontró el evento con id {id}" });

            return Ok(ToDto(evento));
        }

        [HttpPost]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<ActionResult<EventoDto>> CrearEvento(EventoCreateUpdateDto dto)
        {
            var idUsuario = GetUserId();
            if (idUsuario == null)
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado" });

            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == idUsuario && u.Activo);
            if (!usuarioExiste)
                return BadRequest(new { mensaje = "El usuario autenticado no existe o está inactivo" });

            if (dto.FechaFin < dto.FechaInicio)
                return BadRequest(new { mensaje = "La fecha de fin no puede ser anterior a la fecha de inicio" });

            var audiencia = dto.Audiencia ?? new AudienciaDto();

            var evento = new Evento
            {
                Titulo = dto.Titulo,
                Descripcion = dto.Descripcion,
                Lugar = dto.Lugar,
                FechaInicio = dto.FechaInicio,
                FechaFin = dto.FechaFin,
                HoraInicio = dto.HoraInicio,
                HoraFin = dto.HoraFin,
                IdUsuario = idUsuario.Value,
                CategoriaEvento = dto.CategoriaEvento,
                Prioridad = string.IsNullOrWhiteSpace(audiencia.Prioridad) ? "normal" : audiencia.Prioridad,
                AudienciaJson = JsonSerializer.Serialize(audiencia, JsonOpts),
                FechaAlta = DateTime.Now,
                Activo = true
            };

            _context.Eventos.Add(evento);
            await _context.SaveChangesAsync();

            _notificaciones.NotificarPublicacion(
                "Evento", evento.Titulo, evento.Descripcion, $"/eventos/{evento.IdEvento}",
                evento.AudienciaJson, evento.Prioridad, evento.IdUsuario);

            var creado = await _context.Eventos.Include(e => e.Usuario).FirstAsync(e => e.IdEvento == evento.IdEvento);
            return CreatedAtAction(nameof(GetEvento), new { id = evento.IdEvento }, ToDto(creado));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> ActualizarEvento(int id, EventoCreateUpdateDto dto)
        {
            var evento = await _context.Eventos.FindAsync(id);
            if (evento == null || !evento.Activo)
                return NotFound(new { mensaje = $"No se encontró el evento con id {id}" });

            if (!PuedeModificar(evento))
                return StatusCode(403, new { mensaje = "Solo puedes modificar los eventos que tú publicaste" });

            var audiencia = dto.Audiencia ?? new AudienciaDto();

            evento.Titulo = dto.Titulo;
            evento.Descripcion = dto.Descripcion;
            evento.Lugar = dto.Lugar;
            evento.FechaInicio = dto.FechaInicio;
            evento.FechaFin = dto.FechaFin;
            evento.HoraInicio = dto.HoraInicio;
            evento.HoraFin = dto.HoraFin;
            evento.CategoriaEvento = dto.CategoriaEvento;
            evento.Prioridad = string.IsNullOrWhiteSpace(audiencia.Prioridad) ? "normal" : audiencia.Prioridad;
            evento.AudienciaJson = JsonSerializer.Serialize(audiencia, JsonOpts);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> EliminarEvento(int id)
        {
            var evento = await _context.Eventos.FindAsync(id);
            if (evento == null || !evento.Activo)
                return NotFound(new { mensaje = $"No se encontró el evento con id {id}" });

            if (!PuedeModificar(evento))
                return StatusCode(403, new { mensaje = "Solo puedes eliminar los eventos que tú publicaste" });

            evento.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}