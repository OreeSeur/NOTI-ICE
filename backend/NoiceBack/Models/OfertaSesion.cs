using System;

namespace PortalNoticiasAPI.Models
{
    public class OfertaSesion
    {
        public int IdSesion { get; set; }
        public int IdUnidadOferta { get; set; }
        public int DiaSemana { get; set; } // ISO: lunes=1, ..., domingo=7.
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public string? Aula { get; set; }

        public OfertaUnidad Unidad { get; set; } = null!;
    }
}
