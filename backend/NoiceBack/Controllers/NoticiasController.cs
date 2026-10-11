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
    public class NoticiasController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        private readonly NotificacionCorreoService _notificaciones;
        private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

        public NoticiasController(PortalNoticiasContext context, NotificacionCorreoService notificaciones)
        {
            _context = context;
            _notificaciones = notificaciones;
        }

        // Convierte la entidad (con AudienciaJson como texto) al DTO que consume el frontend
        private static NoticiaDto ToDto(Noticia n)
        {
            AudienciaDto audiencia;
            try
            {
                audiencia = string.IsNullOrWhiteSpace(n.AudienciaJson)
                    ? new AudienciaDto()
                    : JsonSerializer.Deserialize<AudienciaDto>(n.AudienciaJson, JsonOpts) ?? new AudienciaDto();
            }
            catch
            {
                audiencia = new AudienciaDto();
            }
            audiencia.Prioridad = n.Prioridad;

            return new NoticiaDto
            {
                IdNoticia = n.IdNoticia,
                Titulo = n.Titulo,
                Contenido = n.Contenido,
                IdUsuario = n.IdUsuario,
                AutorNombre = n.Usuario?.Nombre,
                IdCategoria = n.IdCategoria,
                CategoriaNombre = n.Categoria?.CategoriaNombre,
                FechaPublicacion = n.FechaPublicacion,
                FechaAlta = n.FechaAlta,
                Activo = n.Activo,
                Audiencia = audiencia
            };
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NoticiaDto>>> GetNoticias()
        {
            var noticias = await _context.Noticias
                .Include(n => n.Usuario)
                .Include(n => n.Categoria)
                .Where(n => n.Activo)
                .OrderByDescending(n => n.FechaPublicacion)
                .ToListAsync();

            return Ok(noticias.Select(ToDto));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<NoticiaDto>> GetNoticia(int id)
        {
            var noticia = await _context.Noticias
                .Include(n => n.Usuario)
                .Include(n => n.Categoria)
                .FirstOrDefaultAsync(n => n.IdNoticia == id && n.Activo);

            if (noticia == null)
                return NotFound(new { mensaje = $"No se encontró la noticia con id {id}" });

            return Ok(ToDto(noticia));
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<NoticiaDto>> CrearNoticia(NoticiaCreateDto dto)
        {
            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == dto.IdUsuario && u.Activo);
            if (!usuarioExiste)
                return BadRequest(new { mensaje = "El usuario especificado no existe o está inactivo" });

            if (dto.IdCategoria.HasValue)
            {
                var categoriaExiste = await _context.Categorias.AnyAsync(c => c.IdCategoria == dto.IdCategoria && c.Activo);
                if (!categoriaExiste)
                    return BadRequest(new { mensaje = "La categoría especificada no existe o está inactiva" });
            }

            var audiencia = dto.Audiencia ?? new AudienciaDto();

            var noticia = new Noticia
            {
                Titulo = dto.Titulo,
                Contenido = dto.Contenido,
                IdUsuario = dto.IdUsuario,
                IdCategoria = dto.IdCategoria,
                FechaPublicacion = dto.FechaPublicacion,
                Prioridad = string.IsNullOrWhiteSpace(audiencia.Prioridad) ? "normal" : audiencia.Prioridad,
                AudienciaJson = JsonSerializer.Serialize(audiencia, JsonOpts),
                FechaAlta = DateTime.Now,
                Activo = true
            };

            _context.Noticias.Add(noticia);
            await _context.SaveChangesAsync();

            _notificaciones.NotificarPublicacion(
                "Noticia", noticia.Titulo, noticia.Contenido, $"/noticias/{noticia.IdNoticia}",
                noticia.AudienciaJson, noticia.Prioridad, noticia.IdUsuario);

            var creada = await _context.Noticias
                .Include(n => n.Usuario)
                .Include(n => n.Categoria)
                .FirstAsync(n => n.IdNoticia == noticia.IdNoticia);

            return CreatedAtAction(nameof(GetNoticia), new { id = noticia.IdNoticia }, ToDto(creada));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarNoticia(int id, NoticiaUpdateDto dto)
        {
            var noticia = await _context.Noticias.FindAsync(id);
            if (noticia == null || !noticia.Activo)
                return NotFound(new { mensaje = $"No se encontró la noticia con id {id}" });

            if (dto.IdCategoria.HasValue)
            {
                var categoriaExiste = await _context.Categorias.AnyAsync(c => c.IdCategoria == dto.IdCategoria && c.Activo);
                if (!categoriaExiste)
                    return BadRequest(new { mensaje = "La categoría especificada no existe o está inactiva" });
            }

            var audiencia = dto.Audiencia ?? new AudienciaDto();

            noticia.Titulo = dto.Titulo;
            noticia.Contenido = dto.Contenido;
            noticia.IdCategoria = dto.IdCategoria;
            noticia.FechaPublicacion = dto.FechaPublicacion;
            noticia.Prioridad = string.IsNullOrWhiteSpace(audiencia.Prioridad) ? "normal" : audiencia.Prioridad;
            noticia.AudienciaJson = JsonSerializer.Serialize(audiencia, JsonOpts);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EliminarNoticia(int id)
        {
            var noticia = await _context.Noticias.FindAsync(id);
            if (noticia == null || !noticia.Activo)
                return NotFound(new { mensaje = $"No se encontró la noticia con id {id}" });

            noticia.Activo = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}