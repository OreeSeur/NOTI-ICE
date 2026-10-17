using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Controllers;

public sealed class PreferenciasPortalDto
{
    public List<string> Topics { get; set; } = ["academico", "becas", "eventos", "documentos"];
    public bool NotifyNoticias { get; set; } = true;
    public bool NotifyEventos { get; set; } = true;
    public bool NotifyDocumentos { get; set; } = true;
}

[ApiController]
[Route("api/auth/preferencias-portal")]
[Authorize]
public sealed class PreferenciasPortalController : ControllerBase
{
    private readonly PortalNoticiasContext _db;
    private static readonly HashSet<string> TemasPermitidos = new(StringComparer.Ordinal)
    { "academico", "becas", "eventos", "documentos", "servicio-social", "titulacion" };

    public PreferenciasPortalController(PortalNoticiasContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<PreferenciasPortalDto>> Obtener()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var json = await _db.UsuariosPreferencias.AsNoTracking()
            .Where(x => x.IdUsuario == id).Select(x => x.DatosJson).FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(json)) return Ok(new PreferenciasPortalDto());
        try { return Ok(JsonSerializer.Deserialize<PreferenciasPortalDto>(json) ?? new PreferenciasPortalDto()); }
        catch (JsonException) { return StatusCode(500, new { mensaje = "Las preferencias almacenadas tienen un formato inválido." }); }
    }

    [HttpPut]
    public async Task<ActionResult<PreferenciasPortalDto>> Guardar(PreferenciasPortalDto dto)
    {
        if (dto.Topics is null || dto.Topics.Count > TemasPermitidos.Count ||
            dto.Topics.Count != dto.Topics.Distinct(StringComparer.Ordinal).Count() ||
            dto.Topics.Any(t => !TemasPermitidos.Contains(t)))
            return BadRequest(new { mensaje = "La selección de temas no es válida." });

        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var existente = await _db.UsuariosPreferencias.FindAsync(id);
        if (existente == null)
        {
            existente = new UsuarioPreferencia { IdUsuario = id };
            _db.UsuariosPreferencias.Add(existente);
        }
        existente.DatosJson = JsonSerializer.Serialize(dto);
        await _db.SaveChangesAsync();
        return Ok(dto);
    }
}
