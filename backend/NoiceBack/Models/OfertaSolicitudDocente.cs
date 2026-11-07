namespace PortalNoticiasAPI.Models
{
    // Solicitud de un Docente para impartir una materia o laboratorio (unidad) de los horarios.
    // Solo una solicitud Aprobada da permiso de publicar para los alumnos de esa unidad.
    // No equivale a una asignacion oficial del IPN ni modifica el horario publicado.
    public sealed class OfertaSolicitudDocente
    {
        public int IdSolicitud { get; set; }
        public int IdUsuario { get; set; }          // Docente solicitante
        public int IdUnidadOferta { get; set; }
        public string Estado { get; set; } = EstadosSolicitudDocente.Pendiente;
        public DateTime FechaSolicitud { get; set; }
        public int? IdAdministrador { get; set; }   // Quien resolvio (aprobo, rechazo o revoco)
        public DateTime? FechaResolucion { get; set; }
        public string? Motivo { get; set; }         // Obligatorio al rechazar o revocar

        // Columnas generadas por la BD: garantizan una sola aprobada por unidad y una sola
        // solicitud vigente (pendiente o aprobada) por docente y unidad.
        public int? IdUnidadAprobada { get; private set; }
        public int? IdUnidadVigente { get; private set; }

        public Usuario Docente { get; set; } = null!;
        public Usuario? Administrador { get; set; }
        public OfertaUnidad Unidad { get; set; } = null!;
    }

    public static class EstadosSolicitudDocente
    {
        public const string Pendiente = "Pendiente";
        public const string Aprobada = "Aprobada";
        public const string Rechazada = "Rechazada";
        public const string Cancelada = "Cancelada"; // por el propio docente
        public const string Revocada = "Revocada";   // por un Administrador, despues de aprobada

        public static readonly string[] Todos = { Pendiente, Aprobada, Rechazada, Cancelada, Revocada };
    }
}
