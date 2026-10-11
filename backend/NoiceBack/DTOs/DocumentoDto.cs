using System;
using Microsoft.AspNetCore.Http;

namespace PortalNoticiasAPI.DTOs
{
    public class DocumentoDto
    {
        public int IdNoticiaDocumento { get; set; }
        public int? IdUsuario { get; set; }
        public string? AutorNombre { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string TipoDocumento { get; set; } = string.Empty;
        public string? RutaArchivo { get; set; }
        public string? Url { get; set; }
        public DateTime? FechaPublicacion { get; set; }
        public bool Activo { get; set; }
        public AudienciaDto Audiencia { get; set; } = new();
    }

    // Formulario multipart: archivo es opcional (puede ser solo un enlace/URL),
    // la audiencia viaja como texto JSON porque los objetos anidados no se
    // pueden mandar directo en un formulario multipart/form-data.
    public class DocumentoUploadDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string TipoDocumento { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? Url { get; set; }
        public DateTime? FechaPublicacion { get; set; }
        public string? AudienciaJson { get; set; }
        public IFormFile? Archivo { get; set; }
    }
}
