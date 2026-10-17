namespace PortalNoticiasAPI.Models;

public sealed class UsuarioPreferencia
{
    public int IdUsuario { get; set; }
    public string DatosJson { get; set; } = "{}";
}
