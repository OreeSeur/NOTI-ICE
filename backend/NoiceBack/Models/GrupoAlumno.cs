using System;

namespace PortalNoticiasAPI.Models
{
    public class GrupoAlumno
    {
        public int IdGrupoAlumno { get; set; }
        public int IdGrupo { get; set; }
        public int IdUsuario { get; set; } // Alumno
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        public Grupo? Grupo { get; set; }
        public Usuario? Alumno { get; set; }
    }
}
