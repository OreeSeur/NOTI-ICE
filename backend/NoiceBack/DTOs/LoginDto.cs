namespace PortalNoticiasAPI.DTOs
{
    public class LoginRequestDto
    {
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public int IdRol { get; set; }
        public string RolNombre { get; set; } = string.Empty;
        public int NoIdentificacion { get; set; } // boleta
        public string? Carrera { get; set; }
        public int? Semestre { get; set; }
    }
}
