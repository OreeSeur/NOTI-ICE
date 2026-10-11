using System;

namespace PortalNoticiasAPI.Models
{
    public class NoticiaDocumento
    {
        public int IdNoticiaDocumento { get; set; }
        public int? IdNoticia { get; set; } // ahora es opcional: documento independiente si es null
        public int? IdUsuario { get; set; } // quién lo publicó (se toma del token, no del cliente)
        public string DocumentoNombre { get; set; } = string.Empty; // título del documento
        public string? RutaArchivo { get; set; } // puede no haber archivo si solo se dio una URL
        public string TipoDocumento { get; set; } = string.Empty;
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        // Nuevo: mismo patrón que Noticias/Eventos
        public string? Descripcion { get; set; }
        public string? Url { get; set; }
        public DateTime? FechaPublicacion { get; set; }
        public string Prioridad { get; set; } = "normal";
        public string? AudienciaJson { get; set; }

        public Noticia? Noticia { get; set; }
        public Usuario? Usuario { get; set; }
    }
}
