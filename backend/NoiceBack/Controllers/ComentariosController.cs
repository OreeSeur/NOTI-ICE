using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComentariosController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public ComentariosController(PortalNoticiasContext context) => _context = context;

        [HttpGet("porNoticia/{idNoticia}")]
        public async Task<ActionResult<IEnumerable<ComentarioDto>>> GetComentariosPorNoticia(int idNoticia)
        {
            var comentarios = await _context.NoticiasComentarios
                .Include(nc => nc.Comentario)
                    .ThenInclude(c => c!.Usuario)
                .Where(nc => nc.IdNoticia == idNoticia && nc.Activo && nc.Comentario!.Activo)
                .OrderBy(nc => nc.Comentario!.FechaPublicacion)
                .Select(nc => new ComentarioDto
                {
                    IdComentario = nc.Comentario!.IdComentario,
                    ComentarioTexto = nc.Comentario.ComentarioTexto,
                    FechaPublicacion = nc.Comentario.FechaPublicacion,
                    IdUsuario = nc.Comentario.IdUsuario,
                    AutorNombre = nc.Comentario.Usuario!.Nombre
                })
                .ToListAsync();

            return Ok(comentarios);
        }

        // Cualquier usuario logueado (Admin, Docente o Alumno) puede comentar
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ComentarioDto>> CrearComentario(ComentarioCreateDto dto)
        {
            var noticiaExiste = await _context.Noticias.AnyAsync(n => n.IdNoticia == dto.IdNoticia && n.Activo);
            if (!noticiaExiste)
                return BadRequest(new { mensaje = "La noticia especificada no existe o está inactiva" });

            // La identidad del autor se obtiene del JWT, nunca del IdUsuario enviado por el cliente.
            if (!int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var idUsuario))
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado" });

            var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == idUsuario && u.Activo);
            if (!usuarioExiste)
                return Unauthorized(new { mensaje = "El usuario autenticado no existe o está inactivo" });

            var comentario = new Comentario
            {
                ComentarioTexto = dto.ComentarioTexto,
                FechaPublicacion = DateTime.Now,
                IdUsuario = idUsuario,
                FechaAlta = DateTime.Now,
                Activo = true
            };
            _context.Comentarios.Add(comentario);
            await _context.SaveChangesAsync();

            var relacion = new NoticiaComentario
            {
                IdNoticia = dto.IdNoticia,
                IdComentario = comentario.IdComentario,
                FechaAlta = DateTime.Now,
                Activo = true
            };
            _context.NoticiasComentarios.Add(relacion);
            await _context.SaveChangesAsync();

            return Ok(new ComentarioDto
            {
                IdComentario = comentario.IdComentario,
                ComentarioTexto = comentario.ComentarioTexto,
                FechaPublicacion = comentario.FechaPublicacion,
                IdUsuario = comentario.IdUsuario
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EliminarComentario(int id)
        {
            var comentario = await _context.Comentarios.FindAsync(id);
            if (comentario == null || !comentario.Activo)
                return NotFound(new { mensaje = $"No se encontró el comentario con id {id}" });

            comentario.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
