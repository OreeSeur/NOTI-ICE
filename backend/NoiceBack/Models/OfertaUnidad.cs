using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    // Una fila publicada del horario, incluyendo laboratorios separados de teoría.
    public class OfertaUnidad
    {
        public int IdUnidadOferta { get; set; }
        public int IdGrupoOferta { get; set; }
        public string NombrePublicado { get; set; } = string.Empty;
        public bool EsLaboratorio { get; set; }
        public string? AulaPublicada { get; set; }
        public int? IdMateriaCatalogo { get; set; } // No asociar por coincidencia textual automática.
        public int OrdenFuente { get; set; }

        public OfertaGrupo Grupo { get; set; } = null!;
        public CatalogoMateriaPlan? MateriaCatalogo { get; set; }
        public ICollection<OfertaSesion> Sesiones { get; set; } = new List<OfertaSesion>();
        public ICollection<OfertaDocenteUnidad> Docentes { get; set; } = new List<OfertaDocenteUnidad>();
    }
}
