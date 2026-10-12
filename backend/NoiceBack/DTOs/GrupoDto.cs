using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

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

    public class GrupoCreateUpdateDto : IValidatableObject
    {
        [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar una materia válida.")]
        public int IdMateria { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un docente válido.")]
        public int IdUsuario { get; set; } // profesor

        [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un tipo de grupo válido.")]
        public int IdGrupoTipo { get; set; }

        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }

        [Required(ErrorMessage = "Los días del grupo son obligatorios.")]
        [StringLength(50, ErrorMessage = "Los días no pueden superar los 50 caracteres.")]
        public string Dias { get; set; } = string.Empty;

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (FechaInicio == default || FechaFin == default)
                yield return new ValidationResult(
                    "Las fechas de inicio y fin son obligatorias.",
                    new[] { nameof(FechaInicio), nameof(FechaFin) });
            else if (FechaFin.Date < FechaInicio.Date)
                yield return new ValidationResult(
                    "La fecha final no puede ser anterior a la inicial.",
                    new[] { nameof(FechaFin) });

            if (HoraInicio < TimeSpan.Zero || HoraInicio >= TimeSpan.FromDays(1) ||
                HoraFin <= HoraInicio || HoraFin > TimeSpan.FromDays(1))
                yield return new ValidationResult(
                    "El horario debe ser válido y la hora final posterior a la inicial.",
                    new[] { nameof(HoraInicio), nameof(HoraFin) });
        }
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
        [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un grupo válido.")]
        public int IdGrupo { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un alumno válido.")]
        public int IdUsuario { get; set; } // alumno
    }
}
