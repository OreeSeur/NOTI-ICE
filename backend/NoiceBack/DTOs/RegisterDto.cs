namespace PortalNoticiasAPI.DTOs
{
    // Registro público: cualquiera puede crear su cuenta, pero siempre como Alumno.
    // No se le permite elegir su propio rol (eso evita que alguien se autoasigne Administrador).
    public class RegisterDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string NoIdentificacion { get; set; } = string.Empty; // conserva ceros iniciales
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
        public string Carrera { get; set; } = string.Empty;
        public int Semestre { get; set; } // 1 a 9
    }
}
