namespace PortalNoticiasAPI.DTOs
{
    public sealed class CrearSolicitudDocenteDto
    {
        public int IdUnidadOferta { get; set; }
    }

    public sealed class ResolverSolicitudDocenteDto
    {
        public string? Motivo { get; set; }
    }

    // Lo que ve el docente de sus propias solicitudes y el Administrador en la bandeja.
    public sealed class SolicitudDocenteDto
    {
        public int IdSolicitud { get; set; }
        public string Estado { get; set; } = string.Empty;
        public DateTime FechaSolicitud { get; set; }
        public DateTime? FechaResolucion { get; set; }
        public string? Motivo { get; set; }
        public string? AdministradorNombre { get; set; }

        public int IdUnidadOferta { get; set; }
        public string NombrePublicado { get; set; } = string.Empty;
        public bool EsLaboratorio { get; set; }
        public string Periodo { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string Programa { get; set; } = string.Empty;
        public string CodigoGrupo { get; set; } = string.Empty;
        public int Semestre { get; set; }
        public string? Turno { get; set; }
        // Docentes del horario publicado, para que el Administrador compare con el solicitante.
        public List<string> DocentesPublicados { get; set; } = new();

        // Solo se llenan en la bandeja del Administrador.
        public int? IdDocente { get; set; }
        public string? DocenteNombre { get; set; }
        public string? DocenteCorreo { get; set; }
    }

    // Unidad aprobada que se puede elegir como destinataria al publicar.
    public sealed class UnidadDestinoDto
    {
        public int IdUnidadOferta { get; set; }
        public string NombrePublicado { get; set; } = string.Empty;
        public bool EsLaboratorio { get; set; }
        public string Periodo { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string CodigoGrupo { get; set; } = string.Empty;
        // Permiten al formulario de audiencia ofrecer el grupo de horario y la academia de la unidad.
        public int IdGrupoOferta { get; set; }
        public int? IdAcademia { get; set; }
        public string? AcademiaNombre { get; set; }
        public string? DocenteNombre { get; set; }
        public int AlumnosSuscritos { get; set; }
    }
}
