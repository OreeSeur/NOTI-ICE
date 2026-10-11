namespace PortalNoticiasAPI.DTOs
{
    public class OlvideContrasenaDto
    {
        public string Correo { get; set; } = string.Empty;
    }

    public class RestablecerContrasenaDto
    {
        public string Correo { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NuevaContrasena { get; set; } = string.Empty;
    }

    public class PreferenciaCorreoDto
    {
        public bool NotificarPorCorreo { get; set; }
    }
}
