using System;
using System.ComponentModel.DataAnnotations;

namespace PortalNoticiasAPI.DTOs
{
    // ---------- Categoria ----------
    public class CategoriaDto
    {
        public int IdCategoria { get; set; }
        public string CategoriaNombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activo { get; set; }
    }

    public class CategoriaCreateUpdateDto
    {
        public string CategoriaNombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }

    // ---------- NombreRol ----------
    public class RolDto
    {
        public int IdRol { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    public class RolCreateUpdateDto
    {
        public string Nombre { get; set; } = string.Empty;
    }

    // ---------- Academia ----------
    public class AcademiaDto
    {
        public int IdAcademia { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public bool Activo { get; set; }
    }

    public class AcademiaCreateUpdateDto
    {
        [Required(ErrorMessage = "El nombre de la academia es obligatorio.")]
        [StringLength(150,
            ErrorMessage = "El nombre de la academia no puede superar los 150 caracteres.")]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(255,
            ErrorMessage = "La descripción no puede superar los 255 caracteres.")]
        public string? Descripcion { get; set; }
    }

    // ---------- GrupoTipo ----------
    public class GrupoTipoDto
    {
        public int IdGrupoTipo { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    public class GrupoTipoCreateUpdateDto
    {
        [Required(ErrorMessage = "El tipo de grupo es obligatorio.")]
        [StringLength(100,
            ErrorMessage = "El tipo de grupo no puede superar los 100 caracteres.")]
        public string Tipo { get; set; } = string.Empty;
    }
}
