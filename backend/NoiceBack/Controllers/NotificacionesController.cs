using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Controllers;

public sealed class EstadoLecturasDto
{
    public List<string> Ids { get; set; } = [];
}

[ApiController]
[Authorize]
[Route("api/notificaciones/leidas")]
public sealed class NotificacionesController : ControllerBase
{
    private readonly PortalNoticiasContext _db;
    private static readonly Regex ClaveValida = new("^(noticia|evento|documento)-[0-9]{1,12}$", RegexOptions.Compiled);

    public NotificacionesController(PortalNoticiasContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<EstadoLecturasDto>> Obtener()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var keys = await _db.NotificacionesLeidas.AsNoTracking()
            .Where(x => x.IdUsuario == id).Select(x => x.Clave).ToListAsync();
        return Ok(new EstadoLecturasDto { Ids = keys });
    }

    [HttpPut]
    public async Task<IActionResult> Guardar(EstadoLecturasDto dto)
    {
        if (dto.Ids is null || dto.Ids.Count > 1000 || dto.Ids.Any(k => k is null || !ClaveValida.IsMatch(k)))
            return BadRequest(new { mensaje = "Identificadores de notificaciones no válidos." });
        var ids = dto.Ids.Distinct(StringComparer.Ordinal).ToHashSet(StringComparer.Ordinal);
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var anteriores = await _db.NotificacionesLeidas.Where(x => x.IdUsuario == id).ToListAsync();
        foreach (var item in anteriores.Where(x => !ids.Contains(x.Clave))) _db.NotificacionesLeidas.Remove(item);
        var anterioresIds = anteriores.Select(x => x.Clave).ToHashSet(StringComparer.Ordinal);
        foreach (var key in ids.Where(x => !anterioresIds.Contains(x)))
            _db.NotificacionesLeidas.Add(new NotificacionLeida
            {
                IdUsuario = id, Clave = key, FechaLectura = DateTime.UtcNow
            });
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
