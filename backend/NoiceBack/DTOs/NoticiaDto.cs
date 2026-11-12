using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

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
        // Grupos de los horarios (ofertagrupos). Los ven los alumnos con alguna materia de ese grupo
        // en su perfil y el Docente aprobado en alguna unidad del grupo.
        public List<int> GruposOferta { get; set; } = new();
        // Academias = opciones de optativas. Las ven los alumnos con una optativa de esa academia
        // en su perfil y el Docente aprobado en una unidad de esa academia.
        public List<int> Academias { get; set; } = new();
        // Materias/laboratorios de los horarios (ofertaunidades). Solo el Docente aprobado para
        // cada una (o un Administrador) puede elegirlas; las ven sus alumnos suscritos.
        public List<int> UnidadesOferta { get; set; } = new();
        // Campo del modelo antiguo (tabla `grupos`, retirada). Ya no se acepta al publicar; en
        // publicaciones antiguas cierra el acceso (ver AudienciaAccesoService.PuedeVer). Se conserva
        // solo para detectarlo y no se vuelve a guardar.
        [JsonPropertyName("grupos")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<int>? GruposAntiguos { get; set; }
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
