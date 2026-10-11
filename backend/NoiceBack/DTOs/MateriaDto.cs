using System;

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
        public int IdAcademia { get; set; }
        public string MateriaNombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }
}
