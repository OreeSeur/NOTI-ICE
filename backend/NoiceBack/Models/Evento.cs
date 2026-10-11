using System;

namespace PortalNoticiasAPI.Models
{
    public class Evento
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
        public int? IdCategoria { get; set; }
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        // Nuevo: mismo patrón que Noticias
        public string? CategoriaEvento { get; set; } // texto libre, distinto del catálogo IdCategoria
        public string Prioridad { get; set; } = "normal";
        public string? AudienciaJson { get; set; }

        public Usuario? Usuario { get; set; }
        public Categoria? Categoria { get; set; }
    }
}
