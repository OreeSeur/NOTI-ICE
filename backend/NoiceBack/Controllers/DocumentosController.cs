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
        private readonly AudienciaAccesoService _audiencias;
        private readonly string _uploadsPath;
        private readonly NotificacionCorreoService _notificaciones;
        private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

        // Nunca convertir silenciosamente una audiencia mal formada en "todos".
        // La web envia siempre roles, carreras y semestres como listas no vacias.
        private static bool TryLeerAudiencia(string? audienciaJson, out AudienciaDto audiencia)
        {
            audiencia = new AudienciaDto();
            if (string.IsNullOrWhiteSpace(audienciaJson)) return false;

            try
            {
                using var documento = JsonDocument.Parse(audienciaJson);
                if (documento.RootElement.ValueKind != JsonValueKind.Object) return false;

                var propiedades = documento.RootElement.EnumerateObject().ToArray();
                foreach (var nombre in new[] { "roles", "carreras", "semestres" })
                {
                    var coincidencias = propiedades
                        .Where(p => p.Name.Equals(nombre, StringComparison.OrdinalIgnoreCase))
                        .ToArray();
                    if (coincidencias.Length != 1 || coincidencias[0].Value.ValueKind != JsonValueKind.Array)
                        return false;

                    var valores = coincidencias[0].Value.EnumerateArray().ToArray();
                    if (valores.Length == 0 || valores.Any(v => v.ValueKind != JsonValueKind.String ||
                                                         string.IsNullOrWhiteSpace(v.GetString())))
                        return false;
                }

                var leida = JsonSerializer.Deserialize<AudienciaDto>(audienciaJson, JsonOpts);
                if (leida?.Roles is not { Count: > 0 } ||
                    leida.Carreras is not { Count: > 0 } ||
                    leida.Semestres is not { Count: > 0 }) return false;

                audiencia = leida;
                return true;
            }
            catch (JsonException)
            {
                return false;
            }
        }

        // No confiar en el atributo type=url del formulario: la API recibe solicitudes directas.
        // Solo se admiten enlaces web absolutos; no aceptar javascript:, data:, file: ni credenciales.
        private static bool TryValidarUrl(string? valor, out string? enlace)
        {
            enlace = null;
            if (string.IsNullOrWhiteSpace(valor)) return true; // Archivo sin enlace externo

            var normalizado = valor.Trim();
            if (normalizado.Length > 2048 || valor.Any(char.IsControl) ||
                normalizado.Any(char.IsWhiteSpace) || normalizado.Contains('\\') ||
                !Uri.TryCreate(normalizado, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) ||
                string.IsNullOrWhiteSpace(uri.Host) || !string.IsNullOrEmpty(uri.UserInfo))
                return false;

            enlace = normalizado;
            return true;
        }

        public DocumentosController(
            PortalNoticiasContext context,
            IWebHostEnvironment env,
            NotificacionCorreoService notificaciones,
            AudienciaAccesoService audiencias,
            IConfiguration configuration)
        {
            _context = context;
            _audiencias = audiencias;
            _notificaciones = notificaciones;

            // Desarrollo conserva la carpeta historica. Fuera de Development,
            // exigir una ubicacion absoluta y persistente independiente del binario.
            var configuredPath = configuration["Storage:UploadsPath"];
            if (string.IsNullOrWhiteSpace(configuredPath))
            {
                if (!env.IsDevelopment())
                    throw new InvalidOperationException("Storage:UploadsPath es obligatorio fuera de Development.");
                _uploadsPath = Path.Combine(env.ContentRootPath, "uploads");
            }
            else
            {
                if (!Path.IsPathFullyQualified(configuredPath))
                    throw new InvalidOperationException("Storage:UploadsPath debe ser una ruta absoluta.");
                _uploadsPath = Path.GetFullPath(configuredPath);
            }
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
                .Include(d => d.Noticia)
                .Where(d => d.Activo)
                .OrderByDescending(d => d.FechaPublicacion ?? d.FechaAlta)
                .ToListAsync();

            var usuario = await _audiencias.UsuarioActualAsync(User);
            return Ok(documentos.Where(d => PuedeVerDocumento(d, usuario))
                .Select(ToDto).ToList());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DocumentoDto>> GetDocumento(int id)
        {
            var documento = await _context.NoticiasDocumentos
                .Include(d => d.Usuario)
                .Include(d => d.Noticia)
                .FirstOrDefaultAsync(d => d.IdNoticiaDocumento == id && d.Activo);

            if (documento == null)
                return NotFound(new { mensaje = $"No se encontró el documento con id {id}" });

            var usuario = await _audiencias.UsuarioActualAsync(User);
            if (!PuedeVerDocumento(documento, usuario)) return NotFound();

            return Ok(ToDto(documento));
        }

        // El autor autenticado puede consultar sus documentos independientes,
        // aunque esten dirigidos a otro rol. El resto conserva el filtro de audiencia.
        private bool PuedeVerDocumento(NoticiaDocumento d, Usuario? usuario)
        {
            if (usuario is not null && !d.IdNoticia.HasValue && d.IdUsuario == usuario.IdUsuario)
                return true;

            return _audiencias.PuedeVer(d.AudienciaJson, usuario) &&
                (!d.IdNoticia.HasValue || (d.Noticia is { Activo: true } noticia &&
                    _audiencias.PuedeVer(noticia.AudienciaJson, usuario)));
        }

        // Descarga protegida. No entregar nunca los adjuntos desde /uploads.
        [HttpGet("{id}/archivo")]
        public async Task<IActionResult> DescargarArchivo(int id)
        {
            var documento = await _context.NoticiasDocumentos
                .Include(d => d.Noticia)
                .FirstOrDefaultAsync(d => d.IdNoticiaDocumento == id && d.Activo);
            if (documento == null) return NotFound();

            var usuario = await _audiencias.UsuarioActualAsync(User);
            if (!PuedeVerDocumento(documento, usuario)) return NotFound();

            const string prefijo = "/uploads/";
            var ruta = documento.RutaArchivo;
            if (string.IsNullOrWhiteSpace(ruta) ||
                !ruta.StartsWith(prefijo, StringComparison.OrdinalIgnoreCase)) return NotFound();

            var nombre = ruta[prefijo.Length..];
            if (nombre.Length == 0 || nombre != Path.GetFileName(nombre) ||
                nombre.Contains('\\') || nombre.Contains('/')) return NotFound();

            var rutaFisica = Path.Combine(_uploadsPath, nombre);
            if (!System.IO.File.Exists(rutaFisica)) return NotFound();

            var tipos = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!tipos.TryGetContentType(nombre, out var tipo)) tipo = "application/octet-stream";
            return PhysicalFile(rutaFisica, tipo, nombre);
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

            if (!TryLeerAudiencia(dto.AudienciaJson, out var audiencia))
                return BadRequest(new { mensaje = "La audiencia debe incluir roles, carreras y semestres validos." });
            if (!await _audiencias.PuedePublicarAsync(User, audiencia))
                return BadRequest(new { mensaje = "Las materias, grupos de horario o academias destinatarios deben estar activos y, para un Docente, corresponder a una materia que tenga aprobada." });

            if (!TryValidarUrl(dto.Url, out var enlaceValidado))
                return BadRequest(new { mensaje = "El enlace debe ser una URL absoluta http:// o https://, sin credenciales." });

            if (dto.Archivo is not null)
            {
                var errorArchivo = await ValidadorArchivoDocumento.ValidarAsync(dto.Archivo, HttpContext.RequestAborted);
                if (errorArchivo is not null)
                    return BadRequest(new { mensaje = errorArchivo });
            }

            string? rutaArchivo = null;

            if (tieneArchivo)
            {
                var carpetaUploads = _uploadsPath;
                Directory.CreateDirectory(carpetaUploads);

                var nombreUnico = $"{Guid.NewGuid()}_{Path.GetFileName(dto.Archivo!.FileName.Replace('\\', '/'))}";
                var rutaFisica = Path.Combine(carpetaUploads, nombreUnico);

                using (var stream = new FileStream(rutaFisica, FileMode.Create))
                {
                    await dto.Archivo.CopyToAsync(stream);
                }

                rutaArchivo = $"/uploads/{nombreUnico}";
            }

            var documento = new NoticiaDocumento
            {
                IdNoticia = null, // documento independiente
                IdUsuario = idUsuario,
                DocumentoNombre = dto.Titulo,
                Descripcion = dto.Descripcion,
                TipoDocumento = dto.TipoDocumento,
                RutaArchivo = rutaArchivo,
                Url = enlaceValidado,
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

            if (!TryLeerAudiencia(dto.AudienciaJson, out var audiencia))
                return BadRequest(new { mensaje = "La audiencia debe incluir roles, carreras y semestres validos." });
            if (!await _audiencias.PuedePublicarAsync(User, audiencia))
                return BadRequest(new { mensaje = "Las materias, grupos de horario o academias destinatarios deben estar activos y, para un Docente, corresponder a una materia que tenga aprobada." });

            if (!TryValidarUrl(dto.Url, out var enlaceValidado))
                return BadRequest(new { mensaje = "El enlace debe ser una URL absoluta http:// o https://, sin credenciales." });

            if (dto.Archivo is not null)
            {
                var errorArchivo = await ValidadorArchivoDocumento.ValidarAsync(dto.Archivo, HttpContext.RequestAborted);
                if (errorArchivo is not null)
                    return BadRequest(new { mensaje = errorArchivo });
            }

            if (dto.Archivo != null && dto.Archivo.Length > 0)
            {
                var carpetaUploads = _uploadsPath;
                Directory.CreateDirectory(carpetaUploads);

                var nombreUnico = $"{Guid.NewGuid()}_{Path.GetFileName(dto.Archivo.FileName.Replace('\\', '/'))}";
                var rutaFisica = Path.Combine(carpetaUploads, nombreUnico);

                using (var stream = new FileStream(rutaFisica, FileMode.Create))
                {
                    await dto.Archivo.CopyToAsync(stream);
                }

                documento.RutaArchivo = $"/uploads/{nombreUnico}";
            }

            documento.DocumentoNombre = dto.Titulo;
            documento.Descripcion = dto.Descripcion;
            documento.TipoDocumento = dto.TipoDocumento;
            documento.Url = enlaceValidado;
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