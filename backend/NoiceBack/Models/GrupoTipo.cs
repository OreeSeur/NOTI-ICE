using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    public class GrupoTipo
    {
        public int IdGrupoTipo { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        public ICollection<Grupo>? Grupos { get; set; }
    }
}
