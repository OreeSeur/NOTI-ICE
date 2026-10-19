namespace PortalNoticiasAPI.Models
{
    // Nombre publicado o plaza VACANTE; nunca crea usuarios ni credenciales.
    public class OfertaDocenteUnidad
    {
        public int IdAsignacion { get; set; }
        public int IdUnidadOferta { get; set; }
        public int Orden { get; set; }
        public string? NombrePublicado { get; set; }
        public string Tipo { get; set; } = string.Empty; // DOCENTE / VACANTE.

        public OfertaUnidad Unidad { get; set; } = null!;
    }
}
