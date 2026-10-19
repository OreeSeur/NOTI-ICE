using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    public class OfertaPeriodo
    {
        public int IdPeriodo { get; set; }
        public string Clave { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activo { get; set; } = true;

        public ICollection<OfertaGrupo> Grupos { get; set; } = new List<OfertaGrupo>();
    }
}
