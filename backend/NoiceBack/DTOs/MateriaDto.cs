using System;
using System.ComponentModel.DataAnnotations;

namespace PortalNoticiasAPI.DTOs
{
    public class MateriaDto
    {
        public int IdMateria { get; set; }
        public int IdAcademia { get; set; }
        public string? AcademiaNombre { get; set; }
        public string MateriaNombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activo { get; set; }
    }

    public class MateriaCreateUpdateDto
    {
        [Range(1, int.MaxValue,
            ErrorMessage = "Debe seleccionar una academia válida.")]
        public int IdAcademia { get; set; }

        [Required(ErrorMessage = "El nombre de la materia es obligatorio.")]
        [StringLength(150,
            ErrorMessage = "El nombre de la materia no puede superar los 150 caracteres.")]
        public string MateriaNombre { get; set; } = string.Empty;

        [StringLength(255,
            ErrorMessage = "La descripción no puede superar los 255 caracteres.")]
        public string? Descripcion { get; set; }
    }
}
