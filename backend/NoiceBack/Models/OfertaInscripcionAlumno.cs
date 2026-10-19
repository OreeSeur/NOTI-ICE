using System;

namespace PortalNoticiasAPI.Models
{
    // Suscripción declarada por un alumno, sin efectos sobre gruposalumnos o audiencias.
    public sealed class OfertaInscripcionAlumno
    {
        public int IdInscripcionOferta { get; set; }
        public int IdUsuario { get; set; }
        public int IdUnidadOferta { get; set; }
        public DateTime FechaAlta { get; set; }
        public DateTime? FechaBaja { get; set; }
        public bool Activo { get; set; } = true;

        public Usuario Alumno { get; set; } = null!;
        public OfertaUnidad Unidad { get; set; } = null!;
    }
}
