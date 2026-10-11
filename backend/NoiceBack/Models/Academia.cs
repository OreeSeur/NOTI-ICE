using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    public class Academia
    {
        public int IdAcademia { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        public ICollection<Materia>? Materias { get; set; }
    }
}
