using System;

namespace PortalNoticiasAPI.DTOs
{
    public class EventoDto
    {
        public int IdEvento { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? Lugar { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public TimeSpan? HoraInicio { get; set; }
        public TimeSpan? HoraFin { get; set; }
        public int IdUsuario { get; set; }
        public string? OrganizadorNombre { get; set; }
        public string? CategoriaEvento { get; set; }
        public bool Activo { get; set; }
        public AudienciaDto Audiencia { get; set; } = new();
    }

    public class EventoCreateUpdateDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? Lugar { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public TimeSpan? HoraInicio { get; set; }
        public TimeSpan? HoraFin { get; set; }
        public int IdUsuario { get; set; }
        public string? CategoriaEvento { get; set; }
        public AudienciaDto? Audiencia { get; set; }
    }
}
