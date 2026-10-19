using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    // Grupo institucional 1CM10, etc.; no equivale a un grupo de inscripción.
    public class OfertaGrupo
    {
        public int IdGrupoOferta { get; set; }
        public int IdPeriodo { get; set; }
        public string CodigoGrupo { get; set; } = string.Empty;
        public string Programa { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public int Semestre { get; set; }
        public string? Turno { get; set; }
        public string? Modalidad { get; set; }
        public string? Especialidad { get; set; }
        public bool EsEspecial { get; set; }
        public string? UrlFuente { get; set; }
        public DateTime? FechaActualizacionFuente { get; set; }
        public DateTime FechaConsulta { get; set; }
        public string? ChecksumFuente { get; set; }
        public bool Activo { get; set; } = true;

        public OfertaPeriodo Periodo { get; set; } = null!;
        public ICollection<OfertaUnidad> Unidades { get; set; } = new List<OfertaUnidad>();
    }
}
