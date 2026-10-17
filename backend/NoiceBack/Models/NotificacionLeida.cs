namespace PortalNoticiasAPI.Models;

public sealed class NotificacionLeida
{
    public int IdUsuario { get; set; }
    public string Clave { get; set; } = string.Empty;
    public DateTime FechaLectura { get; set; }
}
