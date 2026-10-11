using System;

namespace PortalNoticiasAPI.DTOs
{
    public class GrupoDto
    {
        public int IdGrupo { get; set; }
        public int IdMateria { get; set; }
        public string? MateriaNombre { get; set; }
        public int IdUsuario { get; set; }
        public string? ProfesorNombre { get; set; }
        public int IdGrupoTipo { get; set; }
        public string? GrupoTipoNombre { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public string Dias { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    public class GrupoCreateUpdateDto
    {
        public int IdMateria { get; set; }
        public int IdUsuario { get; set; } // profesor
        public int IdGrupoTipo { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public string Dias { get; set; } = string.Empty;
    }

    // ---------- GrupoAlumno ----------
    public class GrupoAlumnoDto
    {
        public int IdGrupoAlumno { get; set; }
        public int IdGrupo { get; set; }
        public int IdUsuario { get; set; }
        public string? AlumnoNombre { get; set; }
    }

    public class GrupoAlumnoCreateDto
    {
        public int IdGrupo { get; set; }
        public int IdUsuario { get; set; } // alumno
    }
}
