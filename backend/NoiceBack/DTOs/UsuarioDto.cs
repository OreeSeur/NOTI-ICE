using System;

namespace PortalNoticiasAPI.DTOs
{
    // Nunca incluye la contraseña - lo que la API devuelve
    public class UsuarioDto
    {
        public int IdUsuario { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int IdRol { get; set; }
        public string? RolNombre { get; set; }
        public string NoIdentificacion { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    public class UsuarioCreateDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int IdRol { get; set; }
        public string NoIdentificacion { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Contrasena { get; set; } = string.Empty;
    }

    public class UsuarioUpdateDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int IdRol { get; set; }
        public string Correo { get; set; } = string.Empty;
    }
}
