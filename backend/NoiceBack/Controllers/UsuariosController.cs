using System.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;
using PortalNoticiasAPI.Services;

namespace PortalNoticiasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador")]
    public class UsuariosController : ControllerBase
    {
        private const string RolAdministrador = "Administrador";
        private const string MensajeUltimoAdministrador =
            "La operación dejaría a NOTI ICE sin administradores activos.";
        private const string MensajeConcurrencia =
            "Otra operación administrativa modificó estas cuentas al mismo tiempo. Actualiza la lista e inténtalo de nuevo.";

        private readonly PortalNoticiasContext _context;
        public UsuariosController(PortalNoticiasContext context) => _context = context;

        // La identidad del administrador que actua sale del JWT ya validado.
        private bool TryObtenerIdActor(out int idActor) =>
            int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out idActor);

        private async Task<bool> EsAdministradorActivoAsync(Usuario usuario)
        {
            if (!usuario.Activo) return false;
            var idRol = usuario.IdRol;
            return await _context.NombreRoles.AnyAsync(r => r.IdRol == idRol &&
                r.Activo && r.Nombre == RolAdministrador);
        }

        private Task<bool> ExisteOtroAdministradorActivoAsync(int idExcluido) =>
            _context.Usuarios.AnyAsync(u => u.IdUsuario != idExcluido && u.Activo &&
                u.Rol != null && u.Rol.Activo && u.Rol.Nombre == RolAdministrador);

        // Las operaciones que pueden retirar a un administrador se ejecutan en una transaccion
        // SERIALIZABLE. En InnoDB sus lecturas bloquean las filas consultadas hasta el COMMIT:
        // si dos administradores intentan retirarse mutuamente a la vez, MySQL aborta una de las
        // transacciones (interbloqueo 1213) y nunca quedan ambas confirmadas. No requiere cambios de esquema.
        // La clasificacion (1213/1205 en cualquier nivel de anidamiento) esta en ConflictoConcurrencia.
        private static bool EsConflictoConcurrente(Exception ex) =>
            ConflictoConcurrencia.EsConflictoConcurrente(ex);

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UsuarioDto>>> GetUsuarios()
        {
            var usuarios = await _context.Usuarios
                .Include(u => u.Rol)
                .Where(u => u.Activo)
                .Select(u => new UsuarioDto
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    IdRol = u.IdRol,
                    RolNombre = u.Rol!.Nombre,
                    NoIdentificacion = u.NoIdentificacion,
                    Correo = u.Correo,
                    Activo = u.Activo
                })
                .ToListAsync();
            return Ok(usuarios);
        }

        // Sólo administración; el listado general sigue exponiendo únicamente cuentas activas.
        [HttpGet("inactivos")]
        public async Task<ActionResult<IEnumerable<UsuarioDto>>> GetUsuariosInactivos()
        {
            var usuarios = await _context.Usuarios
                .Where(u => !u.Activo)
                .OrderBy(u => u.IdUsuario)
                .Select(u => new UsuarioDto
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    IdRol = u.IdRol,
                    RolNombre = u.Rol!.Nombre,
                    NoIdentificacion = u.NoIdentificacion,
                    Correo = u.Correo,
                    Activo = u.Activo
                })
                .ToListAsync();
            return Ok(usuarios);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UsuarioDto>> GetUsuario(int id)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.Rol)
                .Where(u => u.IdUsuario == id && u.Activo)
                .Select(u => new UsuarioDto
                {
                    IdUsuario = u.IdUsuario,
                    Nombre = u.Nombre,
                    IdRol = u.IdRol,
                    RolNombre = u.Rol!.Nombre,
                    NoIdentificacion = u.NoIdentificacion,
                    Correo = u.Correo,
                    Activo = u.Activo
                })
                .FirstOrDefaultAsync();

            if (usuario == null)
                return NotFound(new { mensaje = $"No se encontró el usuario con id {id}" });

            return Ok(usuario);
        }

        [HttpPost]
        public async Task<ActionResult<UsuarioDto>> CrearUsuario(UsuarioCreateDto dto)
        {
            var identificacion = dto.NoIdentificacion?.Trim();
            if (string.IsNullOrWhiteSpace(identificacion) || identificacion.Length > 30)
                return BadRequest(new { mensaje = "El número de identificación debe contener entre 1 y 30 caracteres" });

            var nombre = ValidacionCuenta.NormalizarNombre(dto.Nombre);
            var correo = ValidacionCuenta.NormalizarCorreo(dto.Correo);
            var errorCuenta = ValidacionCuenta.ValidarNombre(nombre)
                ?? ValidacionCuenta.ValidarCorreo(correo)
                ?? ValidacionCuenta.ValidarContrasena(dto.Contrasena);
            if (errorCuenta != null)
                return BadRequest(new { mensaje = errorCuenta });

            var identificacionExistente = await _context.Usuarios
                .Where(u => u.NoIdentificacion == identificacion)
                .Select(u => new { u.Activo })
                .FirstOrDefaultAsync();
            if (identificacionExistente != null)
                return Conflict(new { mensaje = identificacionExistente.Activo
                    ? "Ya existe un usuario activo con ese número de identificación."
                    : "La identificación pertenece a una cuenta inactiva. Reactívala desde Administración de usuarios." });

            var correoExistente = await _context.Usuarios
                .Where(u => u.Correo == correo)
                .Select(u => new { u.Activo })
                .FirstOrDefaultAsync();
            if (correoExistente != null)
                return Conflict(new { mensaje = correoExistente.Activo
                    ? "Ya existe un usuario activo con ese correo."
                    : "El correo pertenece a una cuenta inactiva. Reactívala desde Administración de usuarios." });

            var rolExiste = await _context.NombreRoles.AnyAsync(r => r.IdRol == dto.IdRol && r.Activo);
            if (!rolExiste)
                return BadRequest(new { mensaje = "El rol especificado no existe o está inactivo" });

            var usuario = new Usuario
            {
                Nombre = nombre,
                IdRol = dto.IdRol,
                NoIdentificacion = identificacion!,
                Correo = correo,
                Contrasena = BCrypt.Net.BCrypt.HashPassword(dto.Contrasena),
                FechaAlta = DateTime.Now,
                Activo = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuario), new { id = usuario.IdUsuario },
                new UsuarioDto
                {
                    IdUsuario = usuario.IdUsuario,
                    Nombre = usuario.Nombre,
                    IdRol = usuario.IdRol,
                    NoIdentificacion = usuario.NoIdentificacion,
                    Correo = usuario.Correo,
                    Activo = usuario.Activo
                });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarUsuario(int id, UsuarioUpdateDto dto)
        {
            if (!TryObtenerIdActor(out var idActor))
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado" });

            var nombre = ValidacionCuenta.NormalizarNombre(dto.Nombre);
            var nuevoCorreo = ValidacionCuenta.NormalizarCorreo(dto.Correo);
            var errorCuenta = ValidacionCuenta.ValidarNombre(nombre)
                ?? ValidacionCuenta.ValidarCorreo(nuevoCorreo);

            try
            {
                await using var transaccion = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

                var usuario = await _context.Usuarios.FindAsync(id);
                if (usuario == null || !usuario.Activo)
                    return NotFound(new { mensaje = $"No se encontró el usuario con id {id}" });

                if (errorCuenta != null)
                    return BadRequest(new { mensaje = errorCuenta });

                var nuevoRol = await _context.NombreRoles
                    .Where(r => r.IdRol == dto.IdRol && r.Activo)
                    .Select(r => r.Nombre)
                    .FirstOrDefaultAsync();
                if (nuevoRol == null)
                    return BadRequest(new { mensaje = "El rol indicado no existe o está inactivo." });

                var seguiraSiendoAdministrador = nuevoRol == RolAdministrador;
                if (id == idActor && !seguiraSiendoAdministrador)
                    return Conflict(new { mensaje = "No puedes quitarte el rol de Administrador. Pide a otro administrador que realice el cambio." });

                if (!seguiraSiendoAdministrador && await EsAdministradorActivoAsync(usuario) &&
                    !await ExisteOtroAdministradorActivoAsync(id))
                    return Conflict(new { mensaje = MensajeUltimoAdministrador });

                if (await _context.Usuarios.AnyAsync(u => u.IdUsuario != id && u.Correo == nuevoCorreo))
                    return Conflict(new { mensaje = "Ese correo ya pertenece a otra cuenta. No puede reutilizarse." });

                if (usuario.IdRol != dto.IdRol ||
                    !string.Equals(usuario.Correo, nuevoCorreo, StringComparison.Ordinal))
                    usuario.VersionSesion++;

                usuario.Nombre = nombre;
                usuario.IdRol = dto.IdRol;
                usuario.Correo = nuevoCorreo;

                await _context.SaveChangesAsync();
                await transaccion.CommitAsync();
                return NoContent();
            }
            catch (Exception ex) when (EsConflictoConcurrente(ex))
            {
                return Conflict(new { mensaje = MensajeConcurrencia });
            }
        }

        // Reactivación lógica: se conserva el ID, la contraseña y las relaciones académicas.
        [HttpPut("{id}/reactivar")]
        public async Task<IActionResult> ReactivarUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
                return NotFound(new { mensaje = "No existe el usuario solicitado." });
            if (usuario.Activo)
                return Conflict(new { mensaje = "El usuario ya está activo." });

            var rolActivo = await _context.NombreRoles.AnyAsync(r => r.IdRol == usuario.IdRol && r.Activo);
            if (!rolActivo)
                return Conflict(new { mensaje = "No puede reactivarse: el rol asociado está inactivo." });

            var conflicto = await _context.Usuarios.AnyAsync(u => u.IdUsuario != id && u.Activo &&
                (u.Correo == usuario.Correo || u.NoIdentificacion == usuario.NoIdentificacion));
            if (conflicto)
                return Conflict(new { mensaje = "La cuenta no puede reactivarse porque su correo o identificación ya está en uso." });

            usuario.Activo = true;
            usuario.VersionSesion++;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarUsuario(int id)
        {
            if (!TryObtenerIdActor(out var idActor))
                return Unauthorized(new { mensaje = "No se pudo identificar al usuario autenticado" });

            if (id == idActor)
                return Conflict(new { mensaje = "No puedes desactivar tu propia cuenta. Pide a otro administrador que lo haga." });

            try
            {
                await using var transaccion = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

                var usuario = await _context.Usuarios.FindAsync(id);
                if (usuario == null || !usuario.Activo)
                    return NotFound(new { mensaje = $"No se encontró el usuario con id {id}" });

                if (await EsAdministradorActivoAsync(usuario) && !await ExisteOtroAdministradorActivoAsync(id))
                    return Conflict(new { mensaje = MensajeUltimoAdministrador });

                usuario.Activo = false;
                usuario.VersionSesion++;
                await _context.SaveChangesAsync();
                await transaccion.CommitAsync();
                return NoContent();
            }
            catch (Exception ex) when (EsConflictoConcurrente(ex))
            {
                return Conflict(new { mensaje = MensajeConcurrencia });
            }
        }
    }
}
