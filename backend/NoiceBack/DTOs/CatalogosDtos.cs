using System;

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
        public string Nombre { get; set; } = string.Empty;
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
        public string Tipo { get; set; } = string.Empty;
    }
}
