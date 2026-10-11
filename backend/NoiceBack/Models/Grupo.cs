using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    public class Grupo
    {
        public int IdGrupo { get; set; }
        public int IdMateria { get; set; }
        public int IdUsuario { get; set; } // Profesor
        public int IdGrupoTipo { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public string Dias { get; set; } = string.Empty;
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        public Materia? Materia { get; set; }
        public Usuario? Profesor { get; set; }
        public GrupoTipo? GrupoTipoNav { get; set; }
        public ICollection<GrupoAlumno>? GruposAlumnos { get; set; }
    }
}
