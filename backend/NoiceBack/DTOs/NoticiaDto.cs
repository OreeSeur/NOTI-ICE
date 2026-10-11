using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.DTOs
{
    // Coincide exactamente con la forma que tu frontend espera en item.audiencia
    // (ver src/constants/audience.js -> DEFAULT_AUDIENCE)
    public class AudienciaDto
    {
        public List<string> Roles { get; set; } = new() { "todos" };
        public List<string> Carreras { get; set; } = new() { "todos" };
        public List<string> Semestres { get; set; } = new() { "todos" };
        public List<string> Categorias { get; set; } = new() { "todos" };
        public string Prioridad { get; set; } = "normal";
    }

    public class NoticiaDto
    {
        public int IdNoticia { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public int IdUsuario { get; set; }
        public string? AutorNombre { get; set; }
        public int? IdCategoria { get; set; }
        public string? CategoriaNombre { get; set; }
        public DateTime FechaPublicacion { get; set; }
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }
        public AudienciaDto Audiencia { get; set; } = new();
    }

    public class NoticiaCreateDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public int IdUsuario { get; set; }
        public int? IdCategoria { get; set; } // opcional ahora
        public DateTime FechaPublicacion { get; set; }
        public AudienciaDto? Audiencia { get; set; }
    }

    public class NoticiaUpdateDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public int? IdCategoria { get; set; }
        public DateTime FechaPublicacion { get; set; }
        public AudienciaDto? Audiencia { get; set; }
    }
}
