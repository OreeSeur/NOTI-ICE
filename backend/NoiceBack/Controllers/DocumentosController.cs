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
    public class DocumentosController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly NotificacionCorreoService _notificaciones;
        private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

        public DocumentosController(
            PortalNoticiasContext context,
            IWebHostEnvironment env,
            NotificacionCorreoService notificaciones)
        {
            _context = context;
            _env = env;
            _notificaciones = notificaciones;
        }

        // Identidad tomada del token (no del cuerpo de la petición, que el cliente podría falsear)
        private int? GetUserId()
        {
            var valor = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(valor, out var id) ? id : null;
        }

        // El Administrador puede modificar cualquier documento; el Docente, solo los suyos
        private bool PuedeModificar(NoticiaDocumento d) =>
            User.IsInRole("Administrador") || (d.IdUsuario.HasValue && d.IdUsuario == GetUserId());

        private static DocumentoDto ToDto(NoticiaDocumento d)
        {
            AudienciaDto audiencia;
            try
            {
                audiencia = string.IsNullOrWhiteSpace(d.AudienciaJson)
                    ? new AudienciaDto()
                    : JsonSerializer.Deserialize<AudienciaDto>(d.AudienciaJson, JsonOpts) ?? new AudienciaDto();
            }
            catch
            {
                audiencia = new AudienciaDto();
            }
            audiencia.Prioridad = d.Prioridad;

            return new DocumentoDto
            {
                IdNoticiaDocumento = d.IdNoticiaDocumento,
                IdUsuario = d.IdUsuario,
                AutorNombre = d.Usuario?.Nombre,
                Titulo = d.DocumentoNombre,
                Descripcion = d.Descripcion,
                TipoDocumento = d.TipoDocumento,
                RutaArchivo = d.RutaArchivo,
                Url = d.Url,
                FechaPublicacion = d.FechaPublicacion,
                Activo = d.Activo,
                Audiencia = audiencia
            };
        }

        // GET: api/documentos  (biblioteca completa, ya no depende de una noticia)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DocumentoDto>>> GetDocumentos()
        {
            var documentos = await _context.NoticiasDocumentos
                .Include(d => d.Usuario)
                .Where(d => d.Activo)
                .OrderByDescending(d => d.FechaPublicacion ?? d.FechaAlta)
                .ToListAsync();

            return Ok(documentos.Select(ToDto));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DocumentoDto>> GetDocumento(int id)
        {
            var documento = await _context.NoticiasDocumentos
                .Include(d => d.Usuario)
                .FirstOrDefaultAsync(d => d.IdNoticiaDocumento == id && d.Activo);

            if (documento == null)
                return NotFound(new { mensaje = $"No se encontró el documento con id {id}" });

            return Ok(ToDto(documento));
        }

        // POST: api/documentos (multipart/form-data)
        [HttpPost]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<ActionResult<DocumentoDto>> SubirDocumento([FromForm] DocumentoUploadDto dto)
        {
            var idUsuario = GetUserId();
            if (idUsuario == null)
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado" });

            var tieneArchivo = dto.Archivo != null && dto.Archivo.Length > 0;
            var tieneUrl = !string.IsNullOrWhiteSpace(dto.Url);

            if (!tieneArchivo && !tieneUrl)
                return BadRequest(new { mensaje = "Debes adjuntar un archivo o proporcionar un enlace" });

            string? rutaArchivo = null;

            if (tieneArchivo)
            {
                var carpetaUploads = Path.Combine(_env.ContentRootPath, "uploads");
                Directory.CreateDirectory(carpetaUploads);

                var nombreUnico = $"{Guid.NewGuid()}_{dto.Archivo!.FileName}";
                var rutaFisica = Path.Combine(carpetaUploads, nombreUnico);

                using (var stream = new FileStream(rutaFisica, FileMode.Create))
                {
                    await dto.Archivo.CopyToAsync(stream);
                }

                rutaArchivo = $"/uploads/{nombreUnico}";
            }

            AudienciaDto audiencia;
            try
            {
                audiencia = string.IsNullOrWhiteSpace(dto.AudienciaJson)
                    ? new AudienciaDto()
                    : JsonSerializer.Deserialize<AudienciaDto>(dto.AudienciaJson, JsonOpts) ?? new AudienciaDto();
            }
            catch
            {
                audiencia = new AudienciaDto();
            }

            var documento = new NoticiaDocumento
            {
                IdNoticia = null, // documento independiente
                IdUsuario = idUsuario,
                DocumentoNombre = dto.Titulo,
                Descripcion = dto.Descripcion,
                TipoDocumento = dto.TipoDocumento,
                RutaArchivo = rutaArchivo,
                Url = dto.Url,
                FechaPublicacion = dto.FechaPublicacion ?? DateTime.Now,
                Prioridad = string.IsNullOrWhiteSpace(audiencia.Prioridad) ? "normal" : audiencia.Prioridad,
                AudienciaJson = JsonSerializer.Serialize(audiencia, JsonOpts),
                FechaAlta = DateTime.Now,
                Activo = true
            };

            _context.NoticiasDocumentos.Add(documento);
            await _context.SaveChangesAsync();

            _notificaciones.NotificarPublicacion(
                "Documento", documento.DocumentoNombre, documento.Descripcion,
                $"/documentos/{documento.IdNoticiaDocumento}",
                documento.AudienciaJson, documento.Prioridad, documento.IdUsuario);

            await _context.Entry(documento).Reference(d => d.Usuario).LoadAsync();
            return Ok(ToDto(documento));
        }


        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> ActualizarDocumento(int id, [FromForm] DocumentoUploadDto dto)
        {
            var documento = await _context.NoticiasDocumentos.FindAsync(id);
            if (documento == null || !documento.Activo)
                return NotFound(new { mensaje = $"No se encontró el documento con id {id}" });

            if (!PuedeModificar(documento))
                return StatusCode(403, new { mensaje = "Solo puedes modificar los documentos que tú publicaste" });

            if (dto.Archivo != null && dto.Archivo.Length > 0)
            {
                var carpetaUploads = Path.Combine(_env.ContentRootPath, "uploads");
                Directory.CreateDirectory(carpetaUploads);

                var nombreUnico = $"{Guid.NewGuid()}_{dto.Archivo.FileName}";
                var rutaFisica = Path.Combine(carpetaUploads, nombreUnico);

                using (var stream = new FileStream(rutaFisica, FileMode.Create))
                {
                    await dto.Archivo.CopyToAsync(stream);
                }

                documento.RutaArchivo = $"/uploads/{nombreUnico}";
            }

            AudienciaDto audiencia;
            try
            {
                audiencia = string.IsNullOrWhiteSpace(dto.AudienciaJson)
                    ? new AudienciaDto()
                    : JsonSerializer.Deserialize<AudienciaDto>(dto.AudienciaJson, JsonOpts) ?? new AudienciaDto();
            }
            catch
            {
                audiencia = new AudienciaDto();
            }

            documento.DocumentoNombre = dto.Titulo;
            documento.Descripcion = dto.Descripcion;
            documento.TipoDocumento = dto.TipoDocumento;
            documento.Url = dto.Url;
            documento.FechaPublicacion = dto.FechaPublicacion ?? documento.FechaPublicacion;
            documento.Prioridad = string.IsNullOrWhiteSpace(audiencia.Prioridad) ? "normal" : audiencia.Prioridad;
            documento.AudienciaJson = JsonSerializer.Serialize(audiencia, JsonOpts);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador,Docente")]
        public async Task<IActionResult> EliminarDocumento(int id)
        {
            var documento = await _context.NoticiasDocumentos.FindAsync(id);
            if (documento == null || !documento.Activo)
                return NotFound(new { mensaje = $"No se encontró el documento con id {id}" });

            if (!PuedeModificar(documento))
                return StatusCode(403, new { mensaje = "Solo puedes eliminar los documentos que tú publicaste" });

            documento.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}