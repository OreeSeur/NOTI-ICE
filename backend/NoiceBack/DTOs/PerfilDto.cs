namespace PortalNoticiasAPI.DTOs
{
    // Lo que una persona puede cambiar de su propio perfil.
    // El correo y la boleta no se editan aquí (son su identidad para iniciar sesión).
    public class PerfilUpdateDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Carrera { get; set; }
        public int? Semestre { get; set; }
    }

    public class PerfilDto
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public int NoIdentificacion { get; set; }
        public string? Carrera { get; set; }
        public int? Semestre { get; set; }
    }
}
