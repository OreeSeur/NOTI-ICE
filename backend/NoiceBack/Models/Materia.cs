using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    public class Materia
    {
        public int IdMateria { get; set; }
        public int IdAcademia { get; set; }
        public string MateriaNombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        public Academia? Academia { get; set; }
        public ICollection<Grupo>? Grupos { get; set; }
    }
}
