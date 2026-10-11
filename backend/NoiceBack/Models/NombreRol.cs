using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    public class NombreRol
    {
        public int IdRol { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        // Relación: un rol puede tener muchos usuarios
        public ICollection<Usuario>? Usuarios { get; set; }
    }
}
