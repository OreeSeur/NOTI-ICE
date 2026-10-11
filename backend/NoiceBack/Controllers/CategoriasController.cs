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
    public class CategoriasController : ControllerBase
    {
        private readonly PortalNoticiasContext _context;
        public CategoriasController(PortalNoticiasContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoriaDto>>> GetCategorias()
        {
            var categorias = await _context.Categorias
                .Where(c => c.Activo)
                .Select(c => new CategoriaDto
                {
                    IdCategoria = c.IdCategoria,
                    CategoriaNombre = c.CategoriaNombre,
                    Descripcion = c.Descripcion,
                    Activo = c.Activo
                })
                .ToListAsync();
            return Ok(categorias);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoriaDto>> GetCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null || !categoria.Activo)
                return NotFound(new { mensaje = $"No se encontró la categoría con id {id}" });

            return Ok(new CategoriaDto
            {
                IdCategoria = categoria.IdCategoria,
                CategoriaNombre = categoria.CategoriaNombre,
                Descripcion = categoria.Descripcion,
                Activo = categoria.Activo
            });
        }

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<ActionResult<CategoriaDto>> CrearCategoria(CategoriaCreateUpdateDto dto)
        {
            var categoria = new Categoria
            {
                CategoriaNombre = dto.CategoriaNombre,
                Descripcion = dto.Descripcion,
                FechaAlta = DateTime.Now,
                Activo = true
            };
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategoria), new { id = categoria.IdCategoria }, categoria);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> ActualizarCategoria(int id, CategoriaCreateUpdateDto dto)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null || !categoria.Activo)
                return NotFound(new { mensaje = $"No se encontró la categoría con id {id}" });

            categoria.CategoriaNombre = dto.CategoriaNombre;
            categoria.Descripcion = dto.Descripcion;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> EliminarCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null || !categoria.Activo)
                return NotFound(new { mensaje = $"No se encontró la categoría con id {id}" });

            categoria.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
