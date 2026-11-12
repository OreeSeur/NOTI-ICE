// Pruebas aisladas de la Intervencion 1 (S3, S4 y S5).
// Ejecutar desde la raiz del repositorio:  dotnet run --project backend/tests/Intervencion1.Checks
// Usa los controladores reales sobre SQLite en memoria: no inicia Program.cs, no se conecta a
// MySQL, al VPS, a SMTP ni a Ollama, y no requiere secretos (la clave JWT es aleatoria por ejecucion).
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using PortalNoticiasAPI.Controllers;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;
using PortalNoticiasAPI.Services;

var superadas = 0;
var fallidas = new List<string>();

async Task Caso(string nombre, Func<Task> prueba)
{
    try
    {
        await prueba();
        superadas++;
        Console.WriteLine("PASS: " + nombre);
    }
    catch (Exception ex)
    {
        fallidas.Add(nombre);
        Console.WriteLine($"FAIL: {nombre} -> {ex.GetType().Name}: {ex.Message}");
    }
}

RegisterDto Registro(string nombre = "Ana López", string correo = "ana.lopez@alumno.ipn.mx",
    string contrasena = "ClaveSegura1", string boleta = "2026630001") => new()
{
    Nombre = nombre,
    Correo = correo,
    Contrasena = contrasena,
    NoIdentificacion = boleta,
    Carrera = "Ingeniería en Comunicaciones y Electrónica",
    Semestre = 3
};

var adminA = H.Principal(BaseDePrueba.IdAdminA, "Administrador");

// ---------------------------------------------------------------- S3: cuentas
await Caso("S3 registro válido: 200 con JWT, rol Alumno y datos normalizados", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using var db = b.NuevoContexto();
    var r = await Fabrica.Auth(db).Register(Registro(nombre: "  Ana   López ", correo: "  ana.lopez@alumno.ipn.mx "));
    H.Afirmar(H.Estado(r) == 200, $"estado {H.Estado(r)}: {H.Mensaje(H.Valor(r))}");
    var dto = (LoginResponseDto)H.Valor(r)!;
    H.Afirmar(!string.IsNullOrEmpty(dto.Token), "la respuesta no incluye token");
    H.Afirmar(dto.RolNombre == "Alumno", "rol inesperado: " + dto.RolNombre);
    H.Afirmar(dto.Nombre == "Ana López", "nombre no normalizado: " + dto.Nombre);
    H.Afirmar(dto.Correo == "ana.lopez@alumno.ipn.mx", "correo no recortado: " + dto.Correo);
    H.Afirmar(dto.Semestre == 3 && dto.NoIdentificacion == "2026630001", "datos académicos alterados");
    var token = new JwtSecurityTokenHandler().ReadJwtToken(dto.Token);
    H.Afirmar(token.Claims.Any(c => c.Type == TokenService.VersionClaim && c.Value == "1"),
        "el JWT no conserva la versión de sesión");
    await using var verificacion = b.NuevoContexto();
    var guardado = await verificacion.Usuarios.SingleAsync(u => u.Correo == "ana.lopez@alumno.ipn.mx");
    H.Afirmar(BCrypt.Net.BCrypt.Verify("ClaveSegura1", guardado.Contrasena), "el hash BCrypt no corresponde");
    H.Afirmar(guardado.Nombre == "Ana López", "nombre persistido sin normalizar");
});

var registrosInvalidos = new (string Descripcion, RegisterDto Dto)[]
{
    ("contraseña de 7 caracteres", Registro(contrasena: "Abcdef1")),
    ("contraseña formada solo por espacios", Registro(contrasena: "        ")),
    ("contraseña de 73 bytes", Registro(contrasena: new string('a', 73))),
    ("contraseña de 37 'ñ' (74 bytes)", Registro(contrasena: new string('ñ', 37))),
    ("correo sin arroba", Registro(correo: "ana.ipn.mx")),
    ("correo sin punto en el dominio", Registro(correo: "ana@ipn")),
    ("correo con nombre visible", Registro(correo: "Ana <ana@ipn.mx>")),
    ("correo con espacio interno", Registro(correo: "ana lopez@ipn.mx")),
    ("correo de 151 caracteres", Registro(correo: new string('a', 140) + "@ipn.edu.mx")),
    ("nombre de 2 caracteres", Registro(nombre: "Al")),
    ("nombre formado solo por espacios", Registro(nombre: "    ")),
    ("nombre de 151 caracteres", Registro(nombre: new string('a', 151))),
    ("nombre con carácter de control", Registro(nombre: "Ana\u0000López")),
};

foreach (var (descripcion, dto) in registrosInvalidos)
{
    await Caso($"S3 registro rechaza {descripcion} con 400 y mensaje claro", async () =>
    {
        await using var b = await BaseDePrueba.CrearAsync();
        await using var db = b.NuevoContexto();
        var antes = await db.Usuarios.CountAsync();
        var r = await Fabrica.Auth(db).Register(dto);
        H.Afirmar(H.Estado(r) == 400, $"estado {H.Estado(r)}");
        H.Afirmar(H.Mensaje(H.Valor(r)).Length > 0, "respuesta 400 sin campo mensaje");
        await using var verificacion = b.NuevoContexto();
        H.Afirmar(await verificacion.Usuarios.CountAsync() == antes, "se creó una cuenta inválida");
    });
}

await Caso("S3 registro acepta los límites exactos: contraseña de 72 bytes, nombre y correo de 150", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using var db = b.NuevoContexto();
    var correo150 = new string('c', 100) + "@" + new string('d', 38) + ".ipn.edu.mx";
    H.Afirmar(correo150.Length == 150, "correo de prueba mal construido");
    var r = await Fabrica.Auth(db).Register(
        Registro(nombre: new string('n', 150), correo: correo150, contrasena: new string('a', 72)));
    H.Afirmar(H.Estado(r) == 200, $"estado {H.Estado(r)}: {H.Mensaje(H.Valor(r))}");
});

await Caso("S3 registro con correo existente (con espacios) sigue respondiendo 400", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using var db = b.NuevoContexto();
    var r = await Fabrica.Auth(db).Register(Registro(correo: "  alumno@prueba.local  "));
    H.Afirmar(H.Estado(r) == 400, $"estado {H.Estado(r)}");
    H.Afirmar(H.Mensaje(H.Valor(r)).Contains("Ya existe"), "mensaje: " + H.Mensaje(H.Valor(r)));
});

await Caso("S3 login sin cambios: cuenta existente con contraseña histórica de 5 caracteres entra", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using var db = b.NuevoContexto();
    var r = await Fabrica.Auth(db).Login(new LoginRequestDto
        { Correo = "alumno@prueba.local", Contrasena = BaseDePrueba.ContrasenaHistorica });
    H.Afirmar(H.Estado(r) == 200, $"estado {H.Estado(r)}");
    H.Afirmar(!string.IsNullOrEmpty(((LoginResponseDto)H.Valor(r)!).Token), "sin token");
});

await Caso("S3 login con contraseña incorrecta sigue respondiendo 401", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using var db = b.NuevoContexto();
    var r = await Fabrica.Auth(db).Login(new LoginRequestDto
        { Correo = "alumno@prueba.local", Contrasena = "incorrecta" });
    H.Afirmar(H.Estado(r) == 401, $"estado {H.Estado(r)}");
});

await Caso("S3 perfil propio: normaliza el nombre y rechaza más de 150 caracteres", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    var alumno = H.Principal(BaseDePrueba.IdAlumno, "Alumno");
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Auth(db, alumno).ActualizarPerfil(new PerfilUpdateDto
            { Nombre = "  Luis   Pérez ", Carrera = "Ingeniería en Comunicaciones y Electrónica", Semestre = 5 });
        H.Afirmar(H.Estado(r) == 200, $"estado {H.Estado(r)}: {H.Mensaje(H.Valor(r))}");
    }
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Auth(db, alumno).ActualizarPerfil(new PerfilUpdateDto
            { Nombre = new string('x', 151), Carrera = "Ingeniería en Comunicaciones y Electrónica", Semestre = 5 });
        H.Afirmar(H.Estado(r) == 400, $"estado {H.Estado(r)}");
    }
    await using var verificacion = b.NuevoContexto();
    H.Afirmar((await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAlumno))!.Nombre == "Luis Pérez", "nombre no normalizado");
});

await Caso("S3 alta administrativa: 400 con correo o contraseña inválidos y 201 con datos válidos", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    UsuarioCreateDto Alta(string correo, string contrasena) => new()
        { Nombre = " Nuevo   Docente ", IdRol = BaseDePrueba.IdRolDocente, NoIdentificacion = "D-100", Correo = correo, Contrasena = contrasena };
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).CrearUsuario(Alta("docente@", "ClaveSegura1"))) == 400, "correo inválido aceptado");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).CrearUsuario(Alta("nuevo@ipn.mx", "corta"))) == 400, "contraseña corta aceptada");
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Usuarios(db, adminA).CrearUsuario(Alta(" nuevo@ipn.mx ", "ClaveSegura1"));
        H.Afirmar(H.Estado(r) == 201, $"estado {H.Estado(r)}: {H.Mensaje(H.Valor(r))}");
    }
    await using var verificacion = b.NuevoContexto();
    var creado = await verificacion.Usuarios.SingleAsync(u => u.NoIdentificacion == "D-100");
    H.Afirmar(creado.Nombre == "Nuevo Docente" && creado.Correo == "nuevo@ipn.mx", "datos no normalizados");
});

await Caso("S3 edición administrativa: rechaza correo inválido con 400 sin modificar la cuenta", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdAlumno,
            new UsuarioUpdateDto { Nombre = "Alumno", IdRol = BaseDePrueba.IdRolAlumno, Correo = "sin-formato" });
        H.Afirmar(H.Estado(r) == 400, $"estado {H.Estado(r)}");
    }
    await using var verificacion = b.NuevoContexto();
    H.Afirmar((await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAlumno))!.Correo == "alumno@prueba.local", "correo modificado");
});

await Caso("S3 recuperación: misma regla de contraseña; el flujo válido cambia la clave y revoca sesiones", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    const string tokenRecuperacion = "token-de-prueba-recuperacion";
    await using (var db = b.NuevoContexto())
    {
        var u = (await db.Usuarios.FindAsync(BaseDePrueba.IdAlumno))!;
        u.TokenRecuperacionHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(tokenRecuperacion)));
        u.TokenRecuperacionExpira = DateTime.UtcNow.AddMinutes(30);
        await db.SaveChangesAsync();
    }
    RestablecerContrasenaDto Solicitud(string nueva) => new()
        { Correo = "alumno@prueba.local", Token = tokenRecuperacion, NuevaContrasena = nueva };
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Recuperacion(db).RestablecerContrasena(Solicitud("corta1"))) == 400, "aceptó 6 caracteres");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Recuperacion(db).RestablecerContrasena(Solicitud(new string('a', 73)))) == 400, "aceptó 73 bytes");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Recuperacion(db).RestablecerContrasena(Solicitud("NuevaClave2026"))) == 200, "flujo válido rechazado");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Auth(db).Login(new LoginRequestDto
            { Correo = "alumno@prueba.local", Contrasena = "NuevaClave2026" })) == 200, "no inicia sesión con la clave nueva");
    await using var verificacion = b.NuevoContexto();
    var alumno = (await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAlumno))!;
    H.Afirmar(alumno.VersionSesion == 2 && alumno.TokenRecuperacionHash == null, "no revocó sesiones o no consumió el token");
});

// ---------------------------------------------------------------- S4: roles
foreach (var (idRol, nuevoNombre) in new[]
{
    (BaseDePrueba.IdRolAdministrador, "Admin"), (BaseDePrueba.IdRolDocente, "Profesor"),
    (BaseDePrueba.IdRolAlumno, "alumno")
})
{
    await Caso($"S4 rol esencial {idRol} no puede renombrarse a '{nuevoNombre}' (409)", async () =>
    {
        await using var b = await BaseDePrueba.CrearAsync();
        await using (var db = b.NuevoContexto())
        {
            var r = await Fabrica.Roles(db, adminA).ActualizarRol(idRol, new RolCreateUpdateDto { Nombre = nuevoNombre });
            H.Afirmar(H.Estado(r) == 409, $"estado {H.Estado(r)}");
        }
        await using var verificacion = b.NuevoContexto();
        var rol = (await verificacion.NombreRoles.FindAsync(idRol))!;
        H.Afirmar(rol.Nombre != nuevoNombre && rol.Activo, "el rol fue modificado");
        H.Afirmar(await verificacion.Usuarios.AllAsync(u => u.VersionSesion == 1), "se revocaron sesiones sin cambio");
    });

    await Caso($"S4 rol esencial {idRol} no puede desactivarse (409)", async () =>
    {
        await using var b = await BaseDePrueba.CrearAsync();
        await using (var db = b.NuevoContexto())
            H.Afirmar(H.Estado(await Fabrica.Roles(db, adminA).EliminarRol(idRol)) == 409, "rol esencial desactivado");
        await using var verificacion = b.NuevoContexto();
        H.Afirmar((await verificacion.NombreRoles.FindAsync(idRol))!.Activo, "el rol quedó inactivo");
    });
}

await Caso("S4 guardar un rol esencial sin cambiar su nombre sigue respondiendo 204", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using var db = b.NuevoContexto();
    var r = await Fabrica.Roles(db, adminA).ActualizarRol(BaseDePrueba.IdRolAdministrador,
        new RolCreateUpdateDto { Nombre = "Administrador" });
    H.Afirmar(H.Estado(r) == 204, $"estado {H.Estado(r)}");
});

await Caso("S4 nombres esenciales reservados al crear o renombrar otros roles (409)", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Roles(db, adminA).CrearRol(new RolCreateUpdateDto { Nombre = "docente" })) == 409, "creó 'docente'");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Roles(db, adminA).ActualizarRol(BaseDePrueba.IdRolInvitado,
            new RolCreateUpdateDto { Nombre = " Administrador " })) == 409, "renombró a Administrador");
});

await Caso("S4 operaciones legítimas sobre roles no esenciales se conservan", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Roles(db, adminA).CrearRol(new RolCreateUpdateDto { Nombre = "Coordinación" })) == 201, "no creó rol");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Roles(db, adminA).ActualizarRol(BaseDePrueba.IdRolInvitado,
            new RolCreateUpdateDto { Nombre = "Invitado externo" })) == 204, "no renombró rol no esencial");
    await using (var db = b.NuevoContexto())
        H.Afirmar((await db.Usuarios.FindAsync(BaseDePrueba.IdInvitado))!.VersionSesion == 2, "no revocó sesiones del rol renombrado");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Roles(db, adminA).EliminarRol(BaseDePrueba.IdRolInvitado)) == 204, "no desactivó rol no esencial");
});

// ---------------------------------------------------------------- S4: administradores
await Caso("S4 un administrador no puede desactivar su propia cuenta (409)", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).EliminarUsuario(BaseDePrueba.IdAdminA)) == 409, "se autodesactivó");
    await using var verificacion = b.NuevoContexto();
    H.Afirmar((await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAdminA))!.Activo, "la cuenta quedó inactiva");
});

await Caso("S4 un administrador no puede quitarse su propio rol (409), pero sí editar su nombre (204)", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdAdminA, new UsuarioUpdateDto
            { Nombre = "Admin A", IdRol = BaseDePrueba.IdRolDocente, Correo = "admin.a@prueba.local" });
        H.Afirmar(H.Estado(r) == 409, $"estado {H.Estado(r)}");
    }
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdAdminA, new UsuarioUpdateDto
            { Nombre = "Admin A Editado", IdRol = BaseDePrueba.IdRolAdministrador, Correo = "admin.a@prueba.local" });
        H.Afirmar(H.Estado(r) == 204, $"estado {H.Estado(r)}: {H.Mensaje(H.Valor(r))}");
    }
    await using var verificacion = b.NuevoContexto();
    var a = (await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAdminA))!;
    H.Afirmar(a.IdRol == BaseDePrueba.IdRolAdministrador && a.Nombre == "Admin A Editado" && a.VersionSesion == 1,
        "rol, nombre o versión de sesión inesperados");
});

await Caso("S4 con dos administradores, uno puede desactivar o degradar al otro (204)", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdAdminB, new UsuarioUpdateDto
            { Nombre = "Admin B", IdRol = BaseDePrueba.IdRolDocente, Correo = "admin.b@prueba.local" });
        H.Afirmar(H.Estado(r) == 204, $"degradar: estado {H.Estado(r)}: {H.Mensaje(H.Valor(r))}");
    }
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).EliminarUsuario(BaseDePrueba.IdAdminB)) == 204, "no desactivó");
    await using var verificacion = b.NuevoContexto();
    var bAdmin = (await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAdminB))!;
    H.Afirmar(!bAdmin.Activo && bAdmin.IdRol == BaseDePrueba.IdRolDocente && bAdmin.VersionSesion == 3,
        "estado final inesperado de B");
});

await Caso("S4 nunca deja cero administradores activos aunque el JWT del actor siga vigente (409)", async () =>
{
    // Simula una modificacion concurrente ya confirmada: A fue desactivado mientras su token seguia vigente.
    await using var b = await BaseDePrueba.CrearAsync();
    await using (var db = b.NuevoContexto())
    {
        (await db.Usuarios.FindAsync(BaseDePrueba.IdAdminA))!.Activo = false;
        await db.SaveChangesAsync();
    }
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Usuarios(db, adminA).EliminarUsuario(BaseDePrueba.IdAdminB);
        H.Afirmar(H.Estado(r) == 409, $"desactivar: estado {H.Estado(r)}");
        H.Afirmar(H.Mensaje(H.Valor(r)).Contains("sin administradores"), "mensaje: " + H.Mensaje(H.Valor(r)));
    }
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdAdminB, new UsuarioUpdateDto
            { Nombre = "Admin B", IdRol = BaseDePrueba.IdRolAlumno, Correo = "admin.b@prueba.local" });
        H.Afirmar(H.Estado(r) == 409, $"degradar: estado {H.Estado(r)}");
    }
    await using var verificacion = b.NuevoContexto();
    var bAdmin = (await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAdminB))!;
    H.Afirmar(bAdmin.Activo && bAdmin.IdRol == BaseDePrueba.IdRolAdministrador, "B dejó de ser administrador activo");
});

await Caso("S4 operaciones legítimas sobre otros usuarios se conservan (204)", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).EliminarUsuario(BaseDePrueba.IdDocente)) == 204, "no desactivó al docente");
    await using (var db = b.NuevoContexto())
    {
        var r = await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdAlumno, new UsuarioUpdateDto
            { Nombre = "Alumno Promovido", IdRol = BaseDePrueba.IdRolDocente, Correo = "alumno@prueba.local" });
        H.Afirmar(H.Estado(r) == 204, $"estado {H.Estado(r)}: {H.Mensaje(H.Valor(r))}");
    }
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).ReactivarUsuario(BaseDePrueba.IdDocente)) == 204, "no reactivó");
    await using var verificacion = b.NuevoContexto();
    var alumno = (await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAlumno))!;
    H.Afirmar(alumno.IdRol == BaseDePrueba.IdRolDocente && alumno.VersionSesion == 2, "cambio de rol sin revocar sesión");
});

await Caso("S4 sin identidad en el JWT la API responde 401 y no modifica cuentas", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using var db = b.NuevoContexto();
    var sinId = H.Principal(null, "Administrador");
    H.Afirmar(H.Estado(await Fabrica.Usuarios(db, sinId).EliminarUsuario(BaseDePrueba.IdDocente)) == 401, "sin 401");
});

// ---------------------------------------------------------------- S5: chatbot
foreach (var valor in new string?[] { null, "", "false", "False", "yes", "1" })
{
    var etiqueta = valor == null ? "(ausente)" : "\"" + valor + "\"";
    await Caso("S5 chatbot con Chatbot:Enabled=" + etiqueta + " responde 503 chatbot_disabled", async () =>
    {
        await using var b = await BaseDePrueba.CrearAsync();
        await using var db = b.NuevoContexto();
        var config = valor == null ? H.Config() : H.Config(("Chatbot:Enabled", valor));
        var r = await Fabrica.Chatbot(db, config, H.Principal(BaseDePrueba.IdAlumno, "Alumno"))
            .Consultar(new PreguntaChatDto { Pregunta = "¿Qué noticias hay?" });
        H.Afirmar(H.Estado(r) == 503, $"estado {H.Estado(r)}");
        H.Afirmar(H.Campo(H.Valor(r), "codigo") == "chatbot_disabled", "código: " + H.Campo(H.Valor(r), "codigo"));
        H.Afirmar(H.Mensaje(H.Valor(r)) == "El asistente no esta disponible en esta version de prueba.", "mensaje distinto");
    });
}

await Caso("S5 con Chatbot:Enabled=true conserva el flujo (sin publicaciones no llama a Ollama)", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    await using var db = b.NuevoContexto();
    var r = await Fabrica.Chatbot(db, H.Config(("Chatbot:Enabled", "true")), H.Principal(BaseDePrueba.IdAlumno, "Alumno"))
        .Consultar(new PreguntaChatDto { Pregunta = "¿Qué noticias hay?" });
    H.Afirmar(H.Estado(r) == 200, $"estado {H.Estado(r)}");
    H.Afirmar(((RespuestaChatDto)H.Valor(r)!).Texto.StartsWith("No encontre informacion"), "respuesta inesperada");
});

// ================================================================ Intervencion 1B
// ---- Ajuste A: longitudes reales (usuarios.Nombre y usuarios.Correo VARCHAR(150))
string Correo(int longitud)
{
    const string dominio = "@ipn.edu.mx";
    return new string('c', longitud - dominio.Length) + dominio;
}

await Caso("1B-A ValidacionCuenta: nombre y correo de 150 se aceptan; de 151 se rechazan", () =>
{
    H.Afirmar(ValidacionCuenta.NombreMaximo == 150 && ValidacionCuenta.CorreoMaximo == 150, "constantes distintas de 150");
    H.Afirmar(ValidacionCuenta.ValidarNombre(new string('n', 150)) == null, "rechazó nombre de 150");
    H.Afirmar(ValidacionCuenta.ValidarNombre(new string('n', 151)) != null, "aceptó nombre de 151");
    H.Afirmar(Correo(150).Length == 150 && ValidacionCuenta.ValidarCorreo(Correo(150)) == null, "rechazó correo de 150");
    H.Afirmar(ValidacionCuenta.ValidarCorreo(Correo(151)) != null, "aceptó correo de 151");
    H.Afirmar(ValidacionCuenta.ValidarContrasena(new string('a', 72)) == null &&
              ValidacionCuenta.ValidarContrasena(new string('a', 73)) != null, "cambió el límite de 72 bytes");
    return Task.CompletedTask;
});

await Caso("1B-A registro público: 150 → 200 y 151 → 400 (nombre y correo por separado)", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    async Task<int?> Registrar(RegisterDto dto) { await using var db = b.NuevoContexto(); return H.Estado(await Fabrica.Auth(db).Register(dto)); }
    H.Afirmar(await Registrar(Registro(nombre: new string('n', 151), correo: "n151@ipn.mx", boleta: "B151N")) == 400, "nombre de 151 aceptado");
    H.Afirmar(await Registrar(Registro(correo: Correo(151), boleta: "B151C")) == 400, "correo de 151 aceptado");
    H.Afirmar(await Registrar(Registro(nombre: new string('n', 150), correo: "n150@ipn.mx", boleta: "B150N")) == 200, "nombre de 150 rechazado");
    H.Afirmar(await Registrar(Registro(correo: Correo(150), boleta: "B150C")) == 200, "correo de 150 rechazado");
    await using var verificacion = b.NuevoContexto();
    var correo150 = Correo(150);
    H.Afirmar(await verificacion.Usuarios.AnyAsync(u => u.Correo == correo150), "no persistió el correo de 150");
});

await Caso("1B-A alta y edición administrativas y perfil propio: 150 aceptado, 151 rechazado", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    UsuarioCreateDto Alta(string nombre, string correo, string id) => new()
        { Nombre = nombre, IdRol = BaseDePrueba.IdRolDocente, NoIdentificacion = id, Correo = correo, Contrasena = "ClaveSegura1" };
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).CrearUsuario(Alta(new string('n', 151), "a1@ipn.mx", "X1"))) == 400, "alta: nombre 151");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).CrearUsuario(Alta("Docente Nuevo", Correo(151), "X2"))) == 400, "alta: correo 151");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).CrearUsuario(Alta(new string('n', 150), Correo(150), "X3"))) == 201, "alta: 150 rechazado");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdDocente, new UsuarioUpdateDto
            { Nombre = "Docente", IdRol = BaseDePrueba.IdRolDocente, Correo = Correo(151) })) == 400, "edición: correo 151");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdDocente, new UsuarioUpdateDto
            { Nombre = new string('d', 150), IdRol = BaseDePrueba.IdRolDocente, Correo = "docente@prueba.local" })) == 204, "edición: nombre 150");
    var alumno = H.Principal(BaseDePrueba.IdAlumno, "Alumno");
    PerfilUpdateDto Perfil(int n) => new() { Nombre = new string('p', n), Carrera = "Ingeniería en Comunicaciones y Electrónica", Semestre = 3 };
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Auth(db, alumno).ActualizarPerfil(Perfil(150))) == 200, "perfil: 150 rechazado");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Auth(db, alumno).ActualizarPerfil(Perfil(151))) == 400, "perfil: 151 aceptado");
});

// ---- Ajuste B: caracteres de control en el nombre
foreach (var (descripcion, nombre) in new[]
{
    ("tabulación interna", "Ana\tLópez"), ("salto de línea interno", "Ana\nLópez"), ("CRLF interno", "Ana\r\nLópez"),
    ("tabulación inicial", "\tAna López"), ("salto de línea final", "Ana López\n"), ("NEL (U+0085)", "Ana\u0085López"),
    ("separador de línea U+2028", "Ana\u2028López"), ("DEL (U+007F)", "Ana\u007FLópez")
})
{
    await Caso($"1B-B registro rechaza nombre con {descripcion} (400, sin crear cuenta)", async () =>
    {
        H.Afirmar(ValidacionCuenta.ValidarNombre(ValidacionCuenta.NormalizarNombre(nombre)) != null, "la regla compartida lo aceptó");
        await using var b = await BaseDePrueba.CrearAsync();
        await using (var db = b.NuevoContexto())
        {
            var r = await Fabrica.Auth(db).Register(Registro(nombre: nombre));
            H.Afirmar(H.Estado(r) == 400, $"estado {H.Estado(r)}");
            H.Afirmar(H.Mensaje(H.Valor(r)).Contains("no permitidos"), "mensaje: " + H.Mensaje(H.Valor(r)));
        }
        await using var verificacion = b.NuevoContexto();
        H.Afirmar(!await verificacion.Usuarios.AnyAsync(u => u.Correo == "ana.lopez@alumno.ipn.mx"), "se creó la cuenta");
    });
}

await Caso("1B-B se conserva la normalización de espacios ordinarios y los nombres válidos", () =>
{
    H.Afirmar(ValidacionCuenta.NormalizarNombre("  María   José   Pérez  ") == "María José Pérez", "no normalizó espacios");
    foreach (var valido in new[] { "María José Pérez", "José O'Neill", "Ana-Sofía Núñez", "Lǐ Wěi" })
        H.Afirmar(ValidacionCuenta.ValidarNombre(ValidacionCuenta.NormalizarNombre(valido)) == null, "rechazó " + valido);
    return Task.CompletedTask;
});

await Caso("1B-B perfil propio y alta administrativa rechazan tabulaciones y saltos de línea", async () =>
{
    await using var b = await BaseDePrueba.CrearAsync();
    var alumno = H.Principal(BaseDePrueba.IdAlumno, "Alumno");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Auth(db, alumno).ActualizarPerfil(new PerfilUpdateDto
            { Nombre = "Luis\tPérez", Carrera = "Ingeniería en Comunicaciones y Electrónica", Semestre = 3 })) == 400, "perfil aceptó \\t");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).CrearUsuario(new UsuarioCreateDto
            { Nombre = "Nuevo\nDocente", IdRol = BaseDePrueba.IdRolDocente, NoIdentificacion = "Y1", Correo = "y1@ipn.mx", Contrasena = "ClaveSegura1" })) == 400, "alta aceptó \\n");
    await using (var db = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdDocente, new UsuarioUpdateDto
            { Nombre = "Docente\r\nEditado", IdRol = BaseDePrueba.IdRolDocente, Correo = "docente@prueba.local" })) == 400, "edición aceptó CRLF");
    await using var verificacion = b.NuevoContexto();
    H.Afirmar((await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAlumno))!.Nombre == "Alumno", "perfil modificado");
});

// ---- Ajuste C: clasificación de excepciones de concurrencia
await Caso("1B-C MySqlException de prueba conserva el número de error", () =>
{
    H.Afirmar(ErrorMySql.Crear(1213).Number == 1213 && ErrorMySql.Crear(1205).Number == 1205 &&
              ErrorMySql.Crear(1062).Number == 1062, "la fábrica no fija Number");
    return Task.CompletedTask;
});

foreach (var (descripcion, crear) in new (string, Func<Exception>)[]
{
    ("1213 directo", () => ErrorMySql.Crear(1213)),
    ("1205 directo", () => ErrorMySql.Crear(1205)),
    ("1213 dentro de DbUpdateException", () => new DbUpdateException("x", ErrorMySql.Crear(1213))),
    ("1205 dentro de DbUpdateException", () => new DbUpdateException("x", ErrorMySql.Crear(1205))),
    ("1213 en tercer nivel (DbUpdate > InvalidOperation > MySql)",
        () => new DbUpdateException("x", new InvalidOperationException("y", ErrorMySql.Crear(1213)))),
    ("1205 en cuarto nivel", () => new DbUpdateException("x", new InvalidOperationException("y",
        new DbUpdateConcurrencyException("z", ErrorMySql.Crear(1205))))),
    ("1213 dentro de AggregateException", () => new AggregateException(new InvalidOperationException("a"), ErrorMySql.Crear(1213))),
})
{
    await Caso($"1B-C se clasifica como conflicto concurrente: {descripcion}", () =>
    {
        H.Afirmar(ConflictoConcurrencia.EsConflictoConcurrente(crear()), "no detectado");
        return Task.CompletedTask;
    });
}

foreach (var (descripcion, crear) in new (string, Func<Exception?>)[]
{
    ("null", () => null),
    ("1062 duplicado", () => ErrorMySql.Crear(1062)),
    ("1062 dentro de DbUpdateException", () => new DbUpdateException("x", ErrorMySql.Crear(1062))),
    ("1146 tabla inexistente anidada", () => new DbUpdateException("x", new InvalidOperationException("y", ErrorMySql.Crear(1146)))),
    ("1452 clave foránea", () => new DbUpdateException("x", ErrorMySql.Crear(1452))),
    ("DbUpdateException sin causa", () => new DbUpdateException("x")),
    ("SqliteException BUSY (otro proveedor)", () => new DbUpdateException("x", new SqliteException("busy", 5))),
    ("TimeoutException genérica", () => new TimeoutException("t")),
    ("InvalidOperationException genérica", () => new InvalidOperationException("op")),
})
{
    await Caso($"1B-C NO se clasifica como conflicto: {descripcion}", () =>
    {
        H.Afirmar(!ConflictoConcurrencia.EsConflictoConcurrente(crear()), "clasificado como 409 indebidamente");
        return Task.CompletedTask;
    });
}

foreach (var numero in new[] { 1213, 1205 })
{
    await Caso($"1B-C controlador: error {numero} encapsulado por EF al guardar → 409 sin aplicar cambios", async () =>
    {
        await using var b = await BaseDePrueba.CrearAsync();
        var fallo = new FalloAlGuardar(() => new DbUpdateException("EF", new InvalidOperationException("envoltura", ErrorMySql.Crear(numero))));
        await using (var db = b.NuevoContexto(fallo))
        {
            var r = await Fabrica.Usuarios(db, adminA).EliminarUsuario(BaseDePrueba.IdDocente);
            H.Afirmar(H.Estado(r) == 409, $"desactivar: estado {H.Estado(r)}");
            H.Afirmar(H.Mensaje(H.Valor(r)).Contains("al mismo tiempo"), "mensaje: " + H.Mensaje(H.Valor(r)));
        }
        await using (var db = b.NuevoContexto(fallo))
        {
            var r = await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdAdminB, new UsuarioUpdateDto
                { Nombre = "Admin B", IdRol = BaseDePrueba.IdRolDocente, Correo = "admin.b@prueba.local" });
            H.Afirmar(H.Estado(r) == 409, $"actualizar: estado {H.Estado(r)}");
        }
        await using var verificacion = b.NuevoContexto();
        H.Afirmar((await verificacion.Usuarios.FindAsync(BaseDePrueba.IdDocente))!.Activo, "se aplicó la desactivación");
        H.Afirmar((await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAdminB))!.IdRol == BaseDePrueba.IdRolAdministrador, "se aplicó el cambio de rol");
    });
}

await Caso("1B-C controlador: otros errores de base de datos (1062, 1146) NO se convierten en 409", async () =>
{
    foreach (var numero in new[] { 1062, 1146 })
    {
        await using var b = await BaseDePrueba.CrearAsync();
        await using var db = b.NuevoContexto(new FalloAlGuardar(() => new DbUpdateException("EF", ErrorMySql.Crear(numero))));
        Exception? capturada = null;
        try { await Fabrica.Usuarios(db, adminA).EliminarUsuario(BaseDePrueba.IdDocente); }
        catch (Exception ex) { capturada = ex; }
        H.Afirmar(capturada is DbUpdateException { InnerException: MySqlConnector.MySqlException m } && m.Number == numero,
            $"{numero}: se esperaba que la excepción se propagara; obtenido {capturada?.GetType().Name ?? "respuesta HTTP"}");
    }
});

// ---- Corrección final 1B: nombres formados solo por espacios Unicode
foreach (var (descripcion, nombre) in new[]
{
    ("U+00A0 ×3 (espacio duro)", "\u00A0\u00A0\u00A0"), ("U+2003 ×3 (espacio em)", "\u2003\u2003\u2003"),
    ("U+3000 ×3 (espacio ideográfico)", "\u3000\u3000\u3000"), ("mezcla U+00A0, U+2003 y U+0020", "\u00A0 \u2003 \u00A0"),
    ("U+2007/U+202F/U+205F", "\u2007\u202F\u205F")
})
{
    await Caso($"1B-D nombre formado solo por espacios Unicode se rechaza: {descripcion}", async () =>
    {
        H.Afirmar(ValidacionCuenta.ValidarNombre(ValidacionCuenta.NormalizarNombre(nombre)) != null, "la regla compartida lo aceptó");
        await using var b = await BaseDePrueba.CrearAsync();
        await using (var db = b.NuevoContexto())
        {
            var r = await Fabrica.Auth(db).Register(Registro(nombre: nombre));
            H.Afirmar(H.Estado(r) == 400, $"registro: estado {H.Estado(r)}");
            H.Afirmar(H.Mensaje(H.Valor(r)).Contains("solo por espacios"), "mensaje: " + H.Mensaje(H.Valor(r)));
        }
        await using (var db = b.NuevoContexto())
            H.Afirmar(H.Estado(await Fabrica.Auth(db, H.Principal(BaseDePrueba.IdAlumno, "Alumno")).ActualizarPerfil(new PerfilUpdateDto
                { Nombre = nombre, Carrera = "Ingeniería en Comunicaciones y Electrónica", Semestre = 3 })) == 400, "perfil aceptó el nombre");
        await using (var db = b.NuevoContexto())
            H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).CrearUsuario(new UsuarioCreateDto
                { Nombre = nombre, IdRol = BaseDePrueba.IdRolDocente, NoIdentificacion = "Z1", Correo = "z1@ipn.mx", Contrasena = "ClaveSegura1" })) == 400, "alta aceptó el nombre");
        await using (var db = b.NuevoContexto())
            H.Afirmar(H.Estado(await Fabrica.Usuarios(db, adminA).ActualizarUsuario(BaseDePrueba.IdDocente, new UsuarioUpdateDto
                { Nombre = nombre, IdRol = BaseDePrueba.IdRolDocente, Correo = "docente@prueba.local" })) == 400, "edición aceptó el nombre");
        await using var verificacion = b.NuevoContexto();
        H.Afirmar(await verificacion.Usuarios.CountAsync() == 5, "se creó una cuenta");
        H.Afirmar((await verificacion.Usuarios.FindAsync(BaseDePrueba.IdAlumno))!.Nombre == "Alumno" &&
                  (await verificacion.Usuarios.FindAsync(BaseDePrueba.IdDocente))!.Nombre == "Docente", "se modificó un nombre");
    });
}

await Caso("1B-D se conservan nombres válidos con un espacio Unicode interno y la regla de espacios ordinarios", () =>
{
    H.Afirmar(ValidacionCuenta.ValidarNombre(ValidacionCuenta.NormalizarNombre("Ana\u00A0López")) == null, "rechazó un nombre con espacio duro interno");
    H.Afirmar(ValidacionCuenta.ValidarNombre(ValidacionCuenta.NormalizarNombre("  María   José  ")) == null &&
              ValidacionCuenta.NormalizarNombre("  María   José  ") == "María José", "cambió la normalización de U+0020");
    H.Afirmar(ValidacionCuenta.ValidarNombre(ValidacionCuenta.NormalizarNombre("Ana\tLópez")) is string m && m.Contains("no permitidos"),
        "cambió el rechazo de caracteres de control");
    return Task.CompletedTask;
});

// ---------------------------------------------------------------- Autorizacion sin cambios
await Caso("Autorización intacta: atributos [Authorize] y límites de frecuencia", () =>
{
    string? Roles(Type t) => t.GetCustomAttribute<AuthorizeAttribute>()?.Roles;
    H.Afirmar(Roles(typeof(UsuariosController)) == "Administrador", "UsuariosController");
    H.Afirmar(Roles(typeof(RolesController)) == "Administrador", "RolesController");
    H.Afirmar(typeof(ChatbotController).GetCustomAttribute<AuthorizeAttribute>() != null, "ChatbotController sin [Authorize]");
    var consultar = typeof(ChatbotController).GetMethod(nameof(ChatbotController.Consultar))!;
    H.Afirmar(consultar.GetCustomAttribute<EnableRateLimitingAttribute>()?.PolicyName == ChatbotUserRateLimitPolicy.PolicyName,
        "límite del chatbot");
    var login = typeof(AuthController).GetMethod(nameof(AuthController.Login))!;
    H.Afirmar(login.GetCustomAttribute<AuthorizeAttribute>() == null, "el login no debe exigir sesión");
    H.Afirmar(login.GetCustomAttribute<EnableRateLimitingAttribute>()?.PolicyName == "auth-publico", "límite del login");
    var registro = typeof(AuthController).GetMethod(nameof(AuthController.Register))!;
    H.Afirmar(registro.GetCustomAttribute<EnableRateLimitingAttribute>()?.PolicyName == "auth-publico", "límite del registro");
    H.Afirmar(typeof(AuthController).GetMethod(nameof(AuthController.ActualizarPerfil))!
        .GetCustomAttribute<AuthorizeAttribute>() != null, "perfil sin [Authorize]");
    return Task.CompletedTask;
});

// ------------------------------------------- Chatbot: fuentes academicas con limites por usuario
async Task<(BaseDePrueba Base, PortalNoticiasContext Db)> BaseAcademica()
{
    var b = await BaseDePrueba.CrearAsync();
    await OfertaDePrueba.SembrarAsync(b);
    return (b, b.NuevoContexto());
}

async Task<Usuario> UsuarioDe(PortalNoticiasContext db, int id) =>
    await db.Usuarios.Include(u => u.Rol).SingleAsync(u => u.IdUsuario == id);

foreach (var (id, rol) in new[] { (BaseDePrueba.IdAdminA, "Administrador"), (BaseDePrueba.IdDocente, "Docente"), (BaseDePrueba.IdAlumno, "Alumno") })
{
    await Caso($"Chatbot academico: {rol} consulta el horario de un grupo con dias, horas y docentes", async () =>
    {
        var (b, db) = await BaseAcademica();
        await using var _b = b; await using var _db = db;
        var fuentes = await new ChatbotFuentesAcademicasService(db)
            .ObtenerAsync(await UsuarioDe(db, id), "¿Cuál es el horario del grupo 1CV11?", default);
        var grupo = fuentes.SingleOrDefault(f => f.Tipo == "Grupo");
        H.Afirmar(grupo != null, "sin fuente de grupo: " + string.Join(",", fuentes.Select(f => f.Tipo)));
        H.Afirmar(grupo!.Contenido.Contains("CALCULO DIFERENCIAL") && grupo.Contenido.Contains("Lun 07:00-08:30"),
            "contenido incompleto: " + grupo.Contenido);
        H.Afirmar(grupo.Contenido.Contains("PEREZ GOMEZ JUAN") && grupo.Contenido.Contains("vacante"), "docentes ausentes");
        H.Afirmar(!grupo.Contenido.Contains("2026-2"), "mezcla un periodo inactivo");
    });
}

await Caso("Chatbot academico: rol ajeno a Administrador/Docente/Alumno no recibe horarios ni catalogo", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var servicio = new ChatbotFuentesAcademicasService(db);
    var invitado = await UsuarioDe(db, BaseDePrueba.IdInvitado);
    H.Afirmar((await servicio.ObtenerAsync(invitado, "horario del grupo 1CV11", default)).Count == 0, "devolvió horarios");
    H.Afirmar((await servicio.ObtenerAsync(invitado, "materias de calculo", default)).Count == 0, "devolvió catálogo");
});

await Caso("Chatbot academico: busca una materia por nombre y por docente publicado", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var servicio = new ChatbotFuentesAcademicasService(db);
    var docente = await UsuarioDe(db, BaseDePrueba.IdDocente);
    var porMateria = await servicio.ObtenerAsync(docente, "¿En qué grupos hay Física Clásica?", default);
    H.Afirmar(porMateria.Any(f => f.Tipo == "Materia" && f.Contenido.Contains("1CV12")), "no encontró la materia");
    var porDocente = await servicio.ObtenerAsync(docente, "¿Qué materias da el profesor Pérez?", default);
    H.Afirmar(porDocente.Any(f => f.Tipo == "Materia" && f.Titulo == "CALCULO DIFERENCIAL E INTEGRAL" &&
        f.Contenido.Contains("PEREZ GOMEZ JUAN")), "no encontró por docente");
});

await Caso("Chatbot academico: catalogo por semestre y plan", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var fuentes = await new ChatbotFuentesAcademicasService(db)
        .ObtenerAsync(await UsuarioDe(db, BaseDePrueba.IdAlumno), "¿Qué materias hay en primer semestre del plan 2024?", default);
    var catalogo = fuentes.SingleOrDefault(f => f.Tipo == "Catálogo");
    H.Afirmar(catalogo != null, "sin catálogo");
    H.Afirmar(catalogo!.Contenido.Contains("Cálculo Diferencial e Integral") && !catalogo.Contenido.Contains("Electrónica Avanzada"),
        "filtro de semestre incorrecto: " + catalogo.Contenido);
    H.Afirmar(!catalogo.Contenido.Contains("CLAVE-NO-VERIFICADA"), "expone una clave oficial no verificada");
});

await Caso("Chatbot academico: el Alumno solo recibe sus propias materias seleccionadas", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var fuentes = await new ChatbotFuentesAcademicasService(db)
        .ObtenerAsync(await UsuarioDe(db, BaseDePrueba.IdAlumno), "¿Cuál es mi horario?", default);
    var mias = fuentes.SingleOrDefault(f => f.Tipo == "Mis materias");
    H.Afirmar(mias != null, "sin fuente de mis materias");
    H.Afirmar(mias!.Contenido.Contains("CALCULO DIFERENCIAL"), "falta la selección activa propia");
    H.Afirmar(!mias.Contenido.Contains("FISICA CLASICA"), "incluye la selección de otro alumno");
    H.Afirmar(!mias.Contenido.Contains("QUIMICA BASICA"), "incluye una selección dada de baja");
    H.Afirmar(mias.Contenido.Contains("no inscripción oficial"), "no aclara que no es inscripción oficial");
});

foreach (var (id, rol) in new[] { (BaseDePrueba.IdAdminA, "Administrador"), (BaseDePrueba.IdDocente, "Docente") })
{
    await Caso($"Chatbot academico: {rol} no obtiene selecciones de alumnos con «mis materias»", async () =>
    {
        var (b, db) = await BaseAcademica();
        await using var _b = b; await using var _db = db;
        var fuentes = await new ChatbotFuentesAcademicasService(db)
            .ObtenerAsync(await UsuarioDe(db, id), "¿Cuáles son mis materias?", default);
        H.Afirmar(fuentes.Count == 0, "devolvió fuentes: " + string.Join(",", fuentes.Select(f => f.Tipo)));
    });
}

await Caso("Chatbot academico: el perfil solo contiene datos propios, sin correo ni boleta", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var alumno = await UsuarioDe(db, BaseDePrueba.IdAlumno);
    var perfil = (await new ChatbotFuentesAcademicasService(db).ObtenerAsync(alumno, "¿En qué semestre estoy según mi perfil?", default))
        .SingleOrDefault(f => f.Tipo == "Perfil");
    H.Afirmar(perfil != null, "sin fuente de perfil");
    H.Afirmar(perfil!.Contenido.Contains("Semestre: 3") && perfil.Contenido.Contains("Alumno"), "datos incompletos");
    H.Afirmar(!perfil.Contenido.Contains(alumno.Correo) && !perfil.Contenido.Contains(alumno.NoIdentificacion) &&
              !perfil.Contenido.Contains(alumno.Contrasena), "expone datos sensibles");
});

await Caso("Chatbot: pregunta academica sin coincidencias responde sin llamar a Ollama", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var r = await Fabrica.Chatbot(db, H.Config(("Chatbot:Enabled", "true"), ("Ollama:BaseUrl", "http://127.0.0.1:9")),
            H.Principal(BaseDePrueba.IdAlumno, "Alumno"))
        .Consultar(new PreguntaChatDto { Pregunta = "¿Quién imparte astrofísica cuántica?" });
    H.Afirmar(H.Estado(r) == 200, $"estado {H.Estado(r)}");
    H.Afirmar(((RespuestaChatDto)H.Valor(r)!).Texto.StartsWith("No encontre informacion"), "respuesta inesperada");
});

await Caso("Chatbot: horario de grupo se responde con los datos exactos sin llamar a Ollama", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    // Ollama apunta a un puerto cerrado: si el controlador lo llamara, responderia 503.
    var r = await Fabrica.Chatbot(db, H.Config(("Chatbot:Enabled", "true"), ("Ollama:BaseUrl", "http://127.0.0.1:9")),
            H.Principal(BaseDePrueba.IdAlumno, "Alumno"))
        .Consultar(new PreguntaChatDto { Pregunta = "horario del grupo 1CV11" });
    H.Afirmar(H.Estado(r) == 200, $"estado {H.Estado(r)}: {H.Mensaje(H.Valor(r))}");
    var dto = (RespuestaChatDto)H.Valor(r)!;
    H.Afirmar(dto.Texto.Contains("Horario del grupo 1CV11") && dto.Texto.Contains("Lun 07:00-08:30") &&
              dto.Texto.Contains("PEREZ GOMEZ JUAN"), "texto incompleto: " + dto.Texto);
    H.Afirmar(dto.Enlaces.Count == 1 && dto.Enlaces[0].Ruta == "/horarios", "enlaces inesperados");
});

await Caso("Chatbot academico: coincidencia parcial se advierte como no exacta", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var fuentes = await new ChatbotFuentesAcademicasService(db)
        .ObtenerAsync(await UsuarioDe(db, BaseDePrueba.IdAlumno), "¿Quién da Física Moderna?", default);
    var materia = fuentes.SingleOrDefault(f => f.Tipo == "Materia");
    H.Afirmar(materia != null && materia.Contenido.StartsWith("No encontré una coincidencia exacta"),
        "sin aviso de coincidencia parcial: " + materia?.Contenido);
});

// ------------------------------------------- Solicitudes de docentes para impartir materias
async Task<int> UnidadId(PortalNoticiasContext db, string nombre) =>
    await db.OfertaUnidades.Where(u => u.NombrePublicado == nombre).Select(u => u.IdUnidadOferta).SingleAsync();

async Task<int> Solicitar(PortalNoticiasContext db, int idDocente, int idUnidad)
{
    var r = await Fabrica.Solicitudes(db, H.Principal(idDocente, "Docente"))
        .Solicitar(new CrearSolicitudDocenteDto { IdUnidadOferta = idUnidad });
    H.Afirmar(H.Estado(r) == 200, $"solicitar: estado {H.Estado(r)} {H.Mensaje(H.Valor(r))}");
    return int.Parse(H.Campo(H.Valor(r), "idSolicitud"));
}

async Task<string> EstadoSolicitud(BaseDePrueba b, int id)
{
    await using var db = b.NuevoContexto();
    return await db.OfertaSolicitudesDocentes.Where(s => s.IdSolicitud == id).Select(s => s.Estado).SingleAsync();
}

var adminP = H.Principal(BaseDePrueba.IdAdminA, "Administrador");

await Caso("Solicitudes: roles exigidos por cada endpoint", () =>
{
    string? Roles(string metodo) => typeof(SolicitudesDocentesController).GetMethod(metodo)!
        .GetCustomAttribute<AuthorizeAttribute>()?.Roles;
    foreach (var m in new[] { "MisSolicitudes", "Solicitar", "Cancelar" })
        H.Afirmar(Roles(m) == "Docente", $"{m}: {Roles(m)}");
    foreach (var m in new[] { "Listar", "TotalPendientes", "Aprobar", "Rechazar", "Revocar" })
        H.Afirmar(Roles(m) == "Administrador", $"{m}: {Roles(m)}");
    H.Afirmar(Roles("Destinos") == "Administrador,Docente", "Destinos: " + Roles("Destinos"));
    return Task.CompletedTask;
});

await Caso("Solicitudes: el Docente solicita; duplicada y unidad de periodo inactivo se rechazan", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var id = await Solicitar(db, BaseDePrueba.IdDocente, await UnidadId(db, "CALCULO DIFERENCIAL E INTEGRAL"));
    H.Afirmar(await EstadoSolicitud(b, id) == "Pendiente", "estado inicial");
    var dup = await Fabrica.Solicitudes(db, H.Principal(BaseDePrueba.IdDocente, "Docente"))
        .Solicitar(new CrearSolicitudDocenteDto { IdUnidadOferta = await UnidadId(db, "CALCULO DIFERENCIAL E INTEGRAL") });
    H.Afirmar(H.Estado(dup) == 409, $"duplicada: {H.Estado(dup)}");
    var historica = await Fabrica.Solicitudes(db, H.Principal(BaseDePrueba.IdDocente, "Docente"))
        .Solicitar(new CrearSolicitudDocenteDto { IdUnidadOferta = await UnidadId(db, "HISTORICA 2026-2") });
    H.Afirmar(H.Estado(historica) == 404, $"periodo inactivo: {H.Estado(historica)}");
});

await Caso("Solicitudes: una cuenta que no es Docente en BD no puede solicitar aunque el JWT diga Docente", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var r = await Fabrica.Solicitudes(db, H.Principal(BaseDePrueba.IdAlumno, "Docente"))
        .Solicitar(new CrearSolicitudDocenteDto { IdUnidadOferta = await UnidadId(db, "QUIMICA BASICA") });
    H.Afirmar(r is ForbidResult, "no devolvió Forbid: " + H.Estado(r));
});

await Caso("Solicitudes: aprobar asigna un solo docente y rechaza las demás pendientes de esa materia", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var unidad = await UnidadId(db, "CALCULO DIFERENCIAL E INTEGRAL");
    var s1 = await Solicitar(db, BaseDePrueba.IdDocente, unidad);
    var s2 = await Solicitar(db, OfertaDePrueba.IdOtroDocente, unidad);
    var r = await Fabrica.Solicitudes(db, adminP).Aprobar(s1);
    H.Afirmar(H.Estado(r) == 200, $"aprobar: {H.Estado(r)} {H.Mensaje(H.Valor(r))}");
    H.Afirmar(await EstadoSolicitud(b, s1) == "Aprobada", "s1 no aprobada");
    H.Afirmar(await EstadoSolicitud(b, s2) == "Rechazada", "s2 no rechazada automáticamente");
    var nueva = await Fabrica.Solicitudes(db, H.Principal(OfertaDePrueba.IdOtroDocente, "Docente"))
        .Solicitar(new CrearSolicitudDocenteDto { IdUnidadOferta = unidad });
    H.Afirmar(H.Estado(nueva) == 409, $"nueva solicitud sobre materia asignada: {H.Estado(nueva)}");
    var otraVez = await Fabrica.Solicitudes(db, H.Principal(BaseDePrueba.IdAdminB, "Administrador")).Aprobar(s1);
    H.Afirmar(H.Estado(otraVez) == 409, $"segunda resolución: {H.Estado(otraVez)}");
});

await Caso("Solicitudes: la BD impide dos aprobadas para la misma materia (índice único)", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var unidad = await UnidadId(db, "QUIMICA BASICA");
    db.OfertaSolicitudesDocentes.AddRange(
        new OfertaSolicitudDocente { IdUsuario = BaseDePrueba.IdDocente, IdUnidadOferta = unidad, Estado = "Aprobada", FechaSolicitud = DateTime.UtcNow },
        new OfertaSolicitudDocente { IdUsuario = OfertaDePrueba.IdOtroDocente, IdUnidadOferta = unidad, Estado = "Aprobada", FechaSolicitud = DateTime.UtcNow });
    var fallo = false;
    try { await db.SaveChangesAsync(); } catch (DbUpdateException) { fallo = true; }
    H.Afirmar(fallo, "se guardaron dos aprobadas");
});

await Caso("Solicitudes: rechazar y revocar exigen motivo; el Docente solo cancela las suyas", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var s1 = await Solicitar(db, BaseDePrueba.IdDocente, await UnidadId(db, "QUIMICA BASICA"));
    var sinMotivo = await Fabrica.Solicitudes(db, adminP).Rechazar(s1, new ResolverSolicitudDocenteDto { Motivo = " " });
    H.Afirmar(H.Estado(sinMotivo) == 400, $"sin motivo: {H.Estado(sinMotivo)}");
    var ajena = await Fabrica.Solicitudes(db, H.Principal(OfertaDePrueba.IdOtroDocente, "Docente")).Cancelar(s1);
    H.Afirmar(H.Estado(ajena) == 404, $"cancelar ajena: {H.Estado(ajena)}");
    var rech = await Fabrica.Solicitudes(db, adminP).Rechazar(s1, new ResolverSolicitudDocenteDto { Motivo = "No corresponde al horario." });
    H.Afirmar(H.Estado(rech) == 200 && await EstadoSolicitud(b, s1) == "Rechazada", "no se rechazó");
    var revocarRechazada = await Fabrica.Solicitudes(db, adminP).Revocar(s1, new ResolverSolicitudDocenteDto { Motivo = "Prueba de estado." });
    H.Afirmar(H.Estado(revocarRechazada) == 409, $"revocar rechazada: {H.Estado(revocarRechazada)}");

    var s2 = await Solicitar(db, BaseDePrueba.IdDocente, await UnidadId(db, "FISICA CLASICA"));
    var propia = await Fabrica.Solicitudes(db, H.Principal(BaseDePrueba.IdDocente, "Docente")).Cancelar(s2);
    H.Afirmar(H.Estado(propia) == 204 && await EstadoSolicitud(b, s2) == "Cancelada", "no canceló la propia");
});

await Caso("Solicitudes: el Docente solo publica para sus materias aprobadas; al revocar pierde el permiso", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var calculo = await UnidadId(db, "CALCULO DIFERENCIAL E INTEGRAL");
    var fisica = await UnidadId(db, "FISICA CLASICA");
    var docente = H.Principal(BaseDePrueba.IdDocente, "Docente");
    var acceso = new AudienciaAccesoService(db);
    AudienciaDto A(params int[] ids) => new() { UnidadesOferta = ids.ToList() };
    H.Afirmar(!await acceso.PuedePublicarAsync(docente, A(calculo)), "publica sin aprobación");

    var s = await Solicitar(db, BaseDePrueba.IdDocente, calculo);
    await Fabrica.Solicitudes(db, adminP).Aprobar(s);
    H.Afirmar(await acceso.PuedePublicarAsync(docente, A(calculo)), "no publica con aprobación");
    H.Afirmar(!await acceso.PuedePublicarAsync(docente, A(calculo, fisica)), "publica en materia ajena");
    H.Afirmar(await acceso.PuedePublicarAsync(adminP, A(calculo, fisica)), "el Administrador no puede");
    H.Afirmar(!await acceso.PuedePublicarAsync(H.Principal(BaseDePrueba.IdAlumno, "Alumno"), A(calculo)),
        "un Alumno puede destinar a materias");

    await Fabrica.Solicitudes(db, adminP).Revocar(s, new ResolverSolicitudDocenteDto { Motivo = "Cambio de docente." });
    H.Afirmar(!await acceso.PuedePublicarAsync(docente, A(calculo)), "sigue publicando tras revocar");
});

await Caso("Solicitudes: una publicación para una materia solo la ven sus alumnos, su docente y administración", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var calculo = await UnidadId(db, "CALCULO DIFERENCIAL E INTEGRAL");
    var s = await Solicitar(db, BaseDePrueba.IdDocente, calculo);
    await Fabrica.Solicitudes(db, adminP).Aprobar(s);
    var audiencia = $"{{\"roles\":[\"todos\"],\"carreras\":[\"todos\"],\"semestres\":[\"todos\"],\"unidadesOferta\":[{calculo}]}}";

    async Task<bool> Ve(int id)
    {
        await using var ctx = b.NuevoContexto();
        var acceso = new AudienciaAccesoService(ctx);
        var u = await acceso.UsuarioActualAsync(H.Principal(id, "x"));
        return acceso.PuedeVer(audiencia, u);
    }
    H.Afirmar(await Ve(BaseDePrueba.IdAlumno), "el alumno suscrito no la ve");
    H.Afirmar(!await Ve(OfertaDePrueba.IdOtroAlumno), "un alumno no suscrito la ve");
    H.Afirmar(await Ve(BaseDePrueba.IdDocente), "el docente aprobado no la ve");
    H.Afirmar(!await Ve(OfertaDePrueba.IdOtroDocente), "otro docente la ve");
    H.Afirmar(await Ve(BaseDePrueba.IdAdminA), "la administración no la ve");
    await using (var ctx = b.NuevoContexto())
        H.Afirmar(!new AudienciaAccesoService(ctx).PuedeVer(audiencia, null), "un visitante la ve");
    await using (var ctx = b.NuevoContexto())
        H.Afirmar(!new AudienciaAccesoService(ctx).PuedeVer(
            "{\"roles\":[\"todos\"],\"carreras\":[\"todos\"],\"semestres\":[\"todos\"],\"unidadesOferta\":[\"x\"]}", null),
            "unidadesOferta inválido se trató como general");
});

await Caso("Solicitudes: destinos del Docente son solo los suyos; el Administrador ve todos y la bandeja", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var s1 = await Solicitar(db, BaseDePrueba.IdDocente, await UnidadId(db, "CALCULO DIFERENCIAL E INTEGRAL"));
    var s2 = await Solicitar(db, OfertaDePrueba.IdOtroDocente, await UnidadId(db, "FISICA CLASICA"));
    await Solicitar(db, OfertaDePrueba.IdOtroDocente, await UnidadId(db, "QUIMICA BASICA"));
    await Fabrica.Solicitudes(db, adminP).Aprobar(s1);
    await Fabrica.Solicitudes(db, adminP).Aprobar(s2);

    var mios = (List<UnidadDestinoDto>)H.Valor(await Fabrica.Solicitudes(db, H.Principal(BaseDePrueba.IdDocente, "Docente")).Destinos())!;
    H.Afirmar(mios.Count == 1 && mios[0].NombrePublicado == "CALCULO DIFERENCIAL E INTEGRAL" && mios[0].AlumnosSuscritos == 1,
        "destinos del docente: " + string.Join(",", mios.Select(m => m.NombrePublicado)));
    var todos = (List<UnidadDestinoDto>)H.Valor(await Fabrica.Solicitudes(db, adminP).Destinos())!;
    H.Afirmar(todos.Count == 2, "destinos del admin: " + todos.Count);
    var pendientes = (List<SolicitudDocenteDto>)H.Valor(await Fabrica.Solicitudes(db, adminP).Listar("Pendiente"))!;
    H.Afirmar(pendientes.Count == 1 && pendientes[0].DocenteNombre == "Otro docente", "bandeja: " + pendientes.Count);
    var mias = (List<SolicitudDocenteDto>)H.Valor(await Fabrica.Solicitudes(db, H.Principal(BaseDePrueba.IdDocente, "Docente")).MisSolicitudes())!;
    H.Afirmar(mias.Count == 1 && mias[0].DocenteCorreo == null && mias[0].DocentesPublicados.Contains("PEREZ GOMEZ JUAN"),
        "mis solicitudes: " + mias.Count);
});

// ------------------------------------------- Noticias publicadas y editadas por docentes
NoticiaCreateDto NuevaNoticia(string titulo, string rol = "todos", List<int>? unidades = null) => new()
{
    Titulo = titulo,
    Contenido = "Contenido de prueba.",
    FechaPublicacion = DateTime.Today,
    Audiencia = new AudienciaDto { Roles = new() { rol }, UnidadesOferta = unidades ?? new() }
};

async Task<int> CrearNoticiaComo(PortalNoticiasContext db, int idUsuario, string rolJwt, NoticiaCreateDto dto)
{
    var r = await Fabrica.Noticias(db, H.Principal(idUsuario, rolJwt)).CrearNoticia(dto);
    H.Afirmar(H.Estado(r) == 201, $"crear noticia: {H.Estado(r)} {H.Mensaje(H.Valor(r))}");
    return ((NoticiaDto)H.Valor(r)!).IdNoticia;
}

NoticiaUpdateDto Cambio(string titulo) => new()
{
    Titulo = titulo, Contenido = "Editada.", FechaPublicacion = DateTime.Today, Audiencia = new AudienciaDto()
};

await Caso("Noticias: crear, editar y eliminar admiten Administrador y Docente", () =>
{
    foreach (var m in new[] { "CrearNoticia", "ActualizarNoticia", "EliminarNoticia" })
    {
        var roles = typeof(NoticiasController).GetMethod(m)!.GetCustomAttribute<AuthorizeAttribute>()?.Roles;
        H.Afirmar(roles == "Administrador,Docente", $"{m}: {roles}");
    }
    return Task.CompletedTask;
});

await Caso("Noticias: el Docente publica y la autoría sale del JWT, no del cuerpo", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var dto = NuevaNoticia("Aviso docente");
    dto.IdUsuario = BaseDePrueba.IdAdminA; // intento de suplantar autoría
    var id = await CrearNoticiaComo(db, BaseDePrueba.IdDocente, "Docente", dto);
    await using var ctx = b.NuevoContexto();
    H.Afirmar((await ctx.Noticias.SingleAsync(n => n.IdNoticia == id)).IdUsuario == BaseDePrueba.IdDocente, "autor incorrecto");
});

await Caso("Noticias: el Docente edita y elimina solo las suyas; el Administrador cualquiera y conserva al autor", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var id = await CrearNoticiaComo(db, BaseDePrueba.IdDocente, "Docente", NuevaNoticia("Original"));
    var otroDocente = H.Principal(OfertaDePrueba.IdOtroDocente, "Docente");

    var ajena = await Fabrica.Noticias(db, otroDocente).ActualizarNoticia(id, Cambio("Intrusa"));
    H.Afirmar(H.Estado(ajena) == 403, $"editar ajena: {H.Estado(ajena)}");
    var borrarAjena = await Fabrica.Noticias(db, otroDocente).EliminarNoticia(id);
    H.Afirmar(H.Estado(borrarAjena) == 403, $"eliminar ajena: {H.Estado(borrarAjena)}");

    var propia = await Fabrica.Noticias(db, H.Principal(BaseDePrueba.IdDocente, "Docente")).ActualizarNoticia(id, Cambio("Editada por autor"));
    H.Afirmar(H.Estado(propia) == 204, $"editar propia: {H.Estado(propia)}");
    var admin = await Fabrica.Noticias(db, H.Principal(BaseDePrueba.IdAdminA, "Administrador")).ActualizarNoticia(id, Cambio("Editada por admin"));
    H.Afirmar(H.Estado(admin) == 204, $"editar como admin: {H.Estado(admin)}");
    await using (var ctx = b.NuevoContexto())
    {
        var n = await ctx.Noticias.SingleAsync(x => x.IdNoticia == id);
        H.Afirmar(n.Titulo == "Editada por admin" && n.IdUsuario == BaseDePrueba.IdDocente, "no conservó autor o título");
    }

    var borrar = await Fabrica.Noticias(db, H.Principal(BaseDePrueba.IdDocente, "Docente")).EliminarNoticia(id);
    H.Afirmar(H.Estado(borrar) == 204, $"eliminar propia: {H.Estado(borrar)}");
});

await Caso("Noticias: el autor ve su noticia dirigida a otro rol (y sus comentarios); otro Docente no", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var id = await CrearNoticiaComo(db, BaseDePrueba.IdDocente, "Docente", NuevaNoticia("Solo alumnos", "Alumno"));

    async Task<int?> Ver(int idUsuario, string rol)
    {
        await using var ctx = b.NuevoContexto();
        return H.Estado(await Fabrica.Noticias(ctx, H.Principal(idUsuario, rol)).GetNoticia(id));
    }
    H.Afirmar(await Ver(BaseDePrueba.IdDocente, "Docente") == 200, "el autor no la ve");
    H.Afirmar(await Ver(OfertaDePrueba.IdOtroDocente, "Docente") == 404, "otro docente la ve");
    H.Afirmar(await Ver(BaseDePrueba.IdAlumno, "Alumno") == 200, "el alumno destinatario no la ve");

    await using var c1 = b.NuevoContexto();
    var comentariosAutor = await Fabrica.Comentarios(c1, H.Principal(BaseDePrueba.IdDocente, "Docente")).GetComentariosPorNoticia(id);
    H.Afirmar(H.Estado(comentariosAutor) == 200, $"comentarios para el autor: {H.Estado(comentariosAutor)}");
    await using var c2 = b.NuevoContexto();
    var comentariosOtro = await Fabrica.Comentarios(c2, H.Principal(OfertaDePrueba.IdOtroDocente, "Docente")).GetComentariosPorNoticia(id);
    H.Afirmar(H.Estado(comentariosOtro) == 404, $"comentarios para otro docente: {H.Estado(comentariosOtro)}");
});

await Caso("Noticias: el Docente solo destina noticias a sus materias aprobadas", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var calculo = await UnidadId(db, "CALCULO DIFERENCIAL E INTEGRAL");
    var docente = H.Principal(BaseDePrueba.IdDocente, "Docente");
    var sin = await Fabrica.Noticias(db, docente).CrearNoticia(NuevaNoticia("Sin aprobación", unidades: new() { calculo }));
    H.Afirmar(H.Estado(sin) == 400, $"sin aprobación: {H.Estado(sin)}");

    var s = await Solicitar(db, BaseDePrueba.IdDocente, calculo);
    await Fabrica.Solicitudes(db, adminP).Aprobar(s);
    await using var ctx = b.NuevoContexto();
    var con = await Fabrica.Noticias(ctx, docente).CrearNoticia(NuevaNoticia("Con aprobación", unidades: new() { calculo }));
    H.Afirmar(H.Estado(con) == 201, $"con aprobación: {H.Estado(con)} {H.Mensaje(H.Valor(con))}");
});

// ------------------------------------------- Mis materias: grupo completo y quitar todas
async Task<List<int>> ActivasDe(BaseDePrueba b, int idUsuario)
{
    await using var ctx = b.NuevoContexto();
    return await ctx.OfertaInscripcionesAlumnos.Where(i => i.IdUsuario == idUsuario && i.Activo)
        .Select(i => i.IdUnidadOferta).OrderBy(x => x).ToListAsync();
}

async Task<int> GrupoId(PortalNoticiasContext db, string codigo, bool activo = true) =>
    await db.OfertaGrupos.Where(g => g.CodigoGrupo == codigo && g.Periodo.Activo == activo)
        .Select(g => g.IdGrupoOferta).SingleAsync();

await Caso("Mis materias: agregar grupo completo suma las que faltan y reactiva las dadas de baja", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var grupo = await GrupoId(db, "1CV11");
    var otroAntes = await ActivasDe(b, OfertaDePrueba.IdOtroAlumno);
    var r = await Fabrica.MisMaterias(db, H.Principal(BaseDePrueba.IdAlumno, "Alumno"))
        .AgregarGrupo(new AgregarGrupoOfertaDto { IdGrupoOferta = grupo });
    H.Afirmar(H.Estado(r) == 200, $"estado {H.Estado(r)} {H.Mensaje(H.Valor(r))}");
    H.Afirmar(H.Campo(H.Valor(r), "agregadas") == "1" && H.Campo(H.Valor(r), "yaTenias") == "1",
        $"agregadas={H.Campo(H.Valor(r), "agregadas")} yaTenias={H.Campo(H.Valor(r), "yaTenias")}");
    var esperadas = new[] { await UnidadId(db, "CALCULO DIFERENCIAL E INTEGRAL"), await UnidadId(db, "QUIMICA BASICA") }.OrderBy(x => x);
    H.Afirmar((await ActivasDe(b, BaseDePrueba.IdAlumno)).SequenceEqual(esperadas), "no quedaron las dos materias del grupo");
    H.Afirmar((await ActivasDe(b, OfertaDePrueba.IdOtroAlumno)).SequenceEqual(otroAntes), "cambió las materias de otro alumno");

    await using var ctx = b.NuevoContexto();
    var otraVez = await Fabrica.MisMaterias(ctx, H.Principal(BaseDePrueba.IdAlumno, "Alumno"))
        .AgregarGrupo(new AgregarGrupoOfertaDto { IdGrupoOferta = grupo });
    H.Afirmar(H.Campo(H.Valor(otraVez), "agregadas") == "0", "repetir agregó duplicados");
});

await Caso("Mis materias: no agrega grupos de un periodo inactivo ni para cuentas que no son Alumno", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var historico = await GrupoId(db, "1CV11", activo: false);
    var r = await Fabrica.MisMaterias(db, H.Principal(BaseDePrueba.IdAlumno, "Alumno"))
        .AgregarGrupo(new AgregarGrupoOfertaDto { IdGrupoOferta = historico });
    H.Afirmar(H.Estado(r) == 404, $"periodo inactivo: {H.Estado(r)}");
    var docente = await Fabrica.MisMaterias(db, H.Principal(BaseDePrueba.IdDocente, "Alumno"))
        .AgregarGrupo(new AgregarGrupoOfertaDto { IdGrupoOferta = await GrupoId(db, "1CV12") });
    H.Afirmar(docente is ForbidResult, "una cuenta Docente con JWT de Alumno pudo agregar");
    var roles = typeof(InscripcionesOfertaController).GetCustomAttribute<AuthorizeAttribute>()?.Roles;
    H.Afirmar(roles == "Alumno", "roles del controlador: " + roles);
});

await Caso("Mis materias: quitar todas da de baja solo las del alumno autenticado", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var otroAntes = await ActivasDe(b, OfertaDePrueba.IdOtroAlumno);
    var r = await Fabrica.MisMaterias(db, H.Principal(BaseDePrueba.IdAlumno, "Alumno")).QuitarTodas();
    H.Afirmar(H.Estado(r) == 200 && H.Campo(H.Valor(r), "quitadas") == "1", $"quitadas={H.Campo(H.Valor(r), "quitadas")}");
    H.Afirmar((await ActivasDe(b, BaseDePrueba.IdAlumno)).Count == 0, "quedaron materias activas");
    H.Afirmar((await ActivasDe(b, OfertaDePrueba.IdOtroAlumno)).SequenceEqual(otroAntes) && otroAntes.Count == 1,
        "afectó a otro alumno");
    await using var ctx = b.NuevoContexto();
    H.Afirmar(await ctx.OfertaInscripcionesAlumnos.AnyAsync(i => i.IdUsuario == BaseDePrueba.IdAlumno && !i.Activo && i.FechaBaja != null),
        "no registró la fecha de baja");
});

// ------------------------------------------- Fusion de modelos: grupos de horario, academias y suscritos
// Academia "Electronica" con la materia de FISICA CLASICA (1CV12). OtroAlumno la tiene en su perfil;
// el Alumno principal solo tiene CALCULO (1CV11). Devuelve (idAcademia, idAcademiaInactiva).
async Task<(int Academia, int Inactiva)> PrepararAcademia(BaseDePrueba b)
{
    await using var ctx = b.NuevoContexto();
    var electronica = new Academia { Nombre = "Electrónica", FechaAlta = DateTime.Now, Activo = true };
    var retirada = new Academia { Nombre = "Retirada", FechaAlta = DateTime.Now, Activo = false };
    ctx.Academias.AddRange(electronica, retirada);
    await ctx.SaveChangesAsync();
    var materia = await ctx.CatalogoMateriasPlanes.SingleAsync(m => m.IdOrigen == "C2");
    materia.IdAcademia = electronica.IdAcademia;
    var fisica = await ctx.OfertaUnidades.SingleAsync(u => u.NombrePublicado == "FISICA CLASICA");
    fisica.IdMateriaCatalogo = materia.IdMateriaCatalogo;
    await ctx.SaveChangesAsync();
    return (electronica.IdAcademia, retirada.IdAcademia);
}

async Task<bool> VeAudiencia(BaseDePrueba b, string audiencia, int? id)
{
    await using var ctx = b.NuevoContexto();
    var acceso = new AudienciaAccesoService(ctx);
    var u = id.HasValue ? await acceso.UsuarioActualAsync(H.Principal(id, "x")) : null;
    return acceso.PuedeVer(audiencia, u);
}

const string Generales = "\"roles\":[\"todos\"],\"carreras\":[\"todos\"],\"semestres\":[\"todos\"]";

await Caso("Audiencia: grupos de horario y academias, quién puede elegirlos al publicar", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var (academia, inactiva) = await PrepararAcademia(b);
    var g11 = await GrupoId(db, "1CV11");
    var g12 = await GrupoId(db, "1CV12");
    var historico = await GrupoId(db, "1CV11", activo: false);
    var otroDocente = H.Principal(OfertaDePrueba.IdOtroDocente, "Docente");
    var docente = H.Principal(BaseDePrueba.IdDocente, "Docente");
    AudienciaDto G(params int[] ids) => new() { GruposOferta = ids.ToList() };
    AudienciaDto Ac(params int[] ids) => new() { Academias = ids.ToList() };

    var acceso = new AudienciaAccesoService(db);
    H.Afirmar(!await acceso.PuedePublicarAsync(otroDocente, G(g12)), "grupo sin aprobación");
    H.Afirmar(!await acceso.PuedePublicarAsync(otroDocente, Ac(academia)), "academia sin aprobación");

    var s = await Solicitar(db, OfertaDePrueba.IdOtroDocente, await UnidadId(db, "FISICA CLASICA"));
    await Fabrica.Solicitudes(db, adminP).Aprobar(s);
    H.Afirmar(await acceso.PuedePublicarAsync(otroDocente, G(g12)), "el docente aprobado no elige su grupo");
    H.Afirmar(!await acceso.PuedePublicarAsync(otroDocente, G(g11)), "el docente elige un grupo ajeno");
    H.Afirmar(!await acceso.PuedePublicarAsync(otroDocente, G(g11, g12)), "el docente mezcla grupo ajeno");
    H.Afirmar(await acceso.PuedePublicarAsync(otroDocente, Ac(academia)), "el docente aprobado no elige su academia");
    H.Afirmar(!await acceso.PuedePublicarAsync(docente, Ac(academia)), "otro docente elige la academia");
    H.Afirmar(!await acceso.PuedePublicarAsync(docente, G(g12)), "otro docente elige el grupo");

    H.Afirmar(await acceso.PuedePublicarAsync(adminP, G(g11, g12)), "el Administrador no elige grupos activos");
    H.Afirmar(await acceso.PuedePublicarAsync(adminP, Ac(academia)), "el Administrador no elige la academia");
    H.Afirmar(!await acceso.PuedePublicarAsync(adminP, G(historico)), "grupo de periodo inactivo aceptado");
    H.Afirmar(!await acceso.PuedePublicarAsync(adminP, Ac(inactiva)), "academia inactiva aceptada");
    H.Afirmar(!await acceso.PuedePublicarAsync(adminP, Ac(9999)), "academia inexistente aceptada");
    H.Afirmar(!await acceso.PuedePublicarAsync(adminP, G(g11, g11)), "grupos repetidos aceptados");
    H.Afirmar(!await acceso.PuedePublicarAsync(adminP, G(Enumerable.Range(1, 31).ToArray())), "más de 30 grupos aceptados");
    H.Afirmar(!await acceso.PuedePublicarAsync(adminP, new AudienciaDto { GruposOferta = null! }), "lista nula aceptada");
    H.Afirmar(!await acceso.PuedePublicarAsync(H.Principal(BaseDePrueba.IdAlumno, "Alumno"), G(g11)), "un Alumno destina a grupos");

    // Destinos del docente: incluyen grupo y academia para el formulario de audiencia.
    var mios = (List<UnidadDestinoDto>)H.Valor(await Fabrica.Solicitudes(db, otroDocente).Destinos())!;
    H.Afirmar(mios.Count == 1 && mios[0].IdGrupoOferta == g12 && mios[0].IdAcademia == academia &&
              mios[0].AcademiaNombre == "Electrónica", "destinos sin grupo o academia");
});

await Caso("Audiencia: una publicación por grupo o academia solo la ven sus alumnos, su docente y administración", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var (academia, _) = await PrepararAcademia(b);
    var g12 = await GrupoId(db, "1CV12");
    var s = await Solicitar(db, OfertaDePrueba.IdOtroDocente, await UnidadId(db, "FISICA CLASICA"));
    await Fabrica.Solicitudes(db, adminP).Aprobar(s);

    foreach (var audiencia in new[] { $"{{{Generales},\"gruposOferta\":[{g12}]}}", $"{{{Generales},\"academias\":[{academia}]}}" })
    {
        H.Afirmar(await VeAudiencia(b, audiencia, OfertaDePrueba.IdOtroAlumno), "el alumno suscrito no la ve: " + audiencia);
        H.Afirmar(!await VeAudiencia(b, audiencia, BaseDePrueba.IdAlumno), "un alumno no suscrito la ve: " + audiencia);
        H.Afirmar(await VeAudiencia(b, audiencia, OfertaDePrueba.IdOtroDocente), "el docente aprobado no la ve: " + audiencia);
        H.Afirmar(!await VeAudiencia(b, audiencia, BaseDePrueba.IdDocente), "otro docente la ve: " + audiencia);
        H.Afirmar(await VeAudiencia(b, audiencia, BaseDePrueba.IdAdminA), "la administración no la ve: " + audiencia);
        H.Afirmar(!await VeAudiencia(b, audiencia, null), "un visitante la ve: " + audiencia);
    }
    H.Afirmar(!await VeAudiencia(b, $"{{{Generales},\"academias\":[\"x\"]}}", null), "academias inválido se trató como general");
    H.Afirmar(!await VeAudiencia(b, $"{{{Generales},\"gruposOferta\":{{}}}}", BaseDePrueba.IdAlumno), "gruposOferta inválido aceptado");

    // Al revocar, el docente deja de verla (ya no pertenece al grupo ni a la academia).
    await Fabrica.Solicitudes(db, adminP).Revocar(s, new ResolverSolicitudDocenteDto { Motivo = "Cambio de docente." });
    H.Afirmar(!await VeAudiencia(b, $"{{{Generales},\"academias\":[{academia}]}}", OfertaDePrueba.IdOtroDocente),
        "el docente revocado la sigue viendo");
});

await Caso("Audiencia: el campo antiguo `grupos` cierra el acceso y ya no se acepta al publicar", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var antigua = $"{{{Generales},\"grupos\":[1]}}";
    H.Afirmar(!await VeAudiencia(b, antigua, BaseDePrueba.IdAlumno), "un alumno ve una publicación del modelo antiguo");
    H.Afirmar(!await VeAudiencia(b, antigua, BaseDePrueba.IdDocente), "un docente ve una publicación del modelo antiguo");
    H.Afirmar(!await VeAudiencia(b, antigua, null), "un visitante ve una publicación del modelo antiguo");
    H.Afirmar(await VeAudiencia(b, antigua, BaseDePrueba.IdAdminA), "la administración no la ve");
    H.Afirmar(await VeAudiencia(b, $"{{{Generales},\"grupos\":[]}}", null), "grupos vacío dejó de ser general");

    // Noticia antigua de un Docente: su autor la sigue viendo; un alumno no.
    int id;
    await using (var ctx = b.NuevoContexto())
    {
        var n = new Noticia { Titulo = "Antigua", Contenido = "x", IdUsuario = BaseDePrueba.IdDocente, FechaPublicacion = DateTime.Today,
            FechaAlta = DateTime.Now, Activo = true, Prioridad = "normal", AudienciaJson = antigua };
        ctx.Noticias.Add(n);
        await ctx.SaveChangesAsync();
        id = n.IdNoticia;
    }
    await using (var ctx = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Noticias(ctx, H.Principal(BaseDePrueba.IdDocente, "Docente")).GetNoticia(id)) == 200,
            "el autor no ve su noticia antigua");
    await using (var ctx = b.NuevoContexto())
        H.Afirmar(H.Estado(await Fabrica.Noticias(ctx, H.Principal(BaseDePrueba.IdAlumno, "Alumno")).GetNoticia(id)) == 404,
            "un alumno ve la noticia antigua");

    // Publicar con el campo antiguo se rechaza, aunque lo envíe el Administrador.
    var dto = JsonSerializer.Deserialize<NoticiaCreateDto>(
        $"{{\"titulo\":\"Con grupos\",\"contenido\":\"x\",\"fechaPublicacion\":\"2026-11-11\",\"audiencia\":{antigua}}}",
        new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
    H.Afirmar(dto.Audiencia!.GruposAntiguos is [1], "no se leyó el campo antiguo");
    var r = await Fabrica.Noticias(db, adminP).CrearNoticia(dto);
    H.Afirmar(H.Estado(r) == 400, $"publicar con grupos antiguos: {H.Estado(r)}");

    // Una audiencia sin el campo antiguo no lo vuelve a escribir.
    var nueva = await CrearNoticiaComo(db, BaseDePrueba.IdAdminA, "Administrador", NuevaNoticia("Sin grupos"));
    await using (var ctx = b.NuevoContexto())
    {
        var json = (await ctx.Noticias.SingleAsync(n => n.IdNoticia == nueva)).AudienciaJson ?? "";
        H.Afirmar(!json.Contains("\"grupos\"", StringComparison.Ordinal) && json.Contains("gruposOferta", StringComparison.Ordinal),
            "JSON guardado: " + json);
    }
});

await Caso("Suscritos: el Docente aprobado y el Administrador ven el listado; otro Docente no", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var fisica = await UnidadId(db, "FISICA CLASICA");
    var s = await Solicitar(db, OfertaDePrueba.IdOtroDocente, fisica);
    await Fabrica.Solicitudes(db, adminP).Aprobar(s);

    async Task<IActionResult> Pedir(int id, string rol, int unidad)
    {
        await using var ctx = b.NuevoContexto();
        return await H.ConUsuario(new SuscritosUnidadController(ctx), H.Principal(id, rol)).Listar(unidad);
    }

    var propio = await Pedir(OfertaDePrueba.IdOtroDocente, "Docente", fisica);
    H.Afirmar(H.Estado(propio) == 200, $"docente aprobado: {H.Estado(propio)}");
    var lista = (SuscritosUnidadDto)H.Valor(propio)!;
    H.Afirmar(lista.Total == 1 && lista.Alumnos.Count == 1 && lista.Alumnos[0].Nombre == "Otro alumno" &&
              lista.Aviso.Contains("no es una inscripción oficial", StringComparison.Ordinal), "listado incorrecto");

    var admin = await Pedir(BaseDePrueba.IdAdminA, "Administrador", fisica);
    H.Afirmar(H.Estado(admin) == 200 && ((SuscritosUnidadDto)H.Valor(admin)!).Total == 1, $"administrador: {H.Estado(admin)}");
    var ajeno = await Pedir(BaseDePrueba.IdDocente, "Docente", fisica);
    H.Afirmar(H.Estado(ajeno) == 404, $"docente ajeno: {H.Estado(ajeno)}");
    var inexistente = await Pedir(BaseDePrueba.IdAdminA, "Administrador", 99999);
    H.Afirmar(H.Estado(inexistente) == 404, $"unidad inexistente: {H.Estado(inexistente)}");
    var historica = await Pedir(BaseDePrueba.IdAdminA, "Administrador", await UnidadId(db, "HISTORICA 2026-2"));
    H.Afirmar(H.Estado(historica) == 404, $"periodo inactivo: {H.Estado(historica)}");
    // JWT de Docente, pero la cuenta es Alumno en la BD.
    var suplantado = await Pedir(BaseDePrueba.IdAlumno, "Docente", fisica);
    H.Afirmar(suplantado is ForbidResult, "una cuenta Alumno con JWT de Docente vio el listado");

    await Fabrica.Solicitudes(db, adminP).Revocar(s, new ResolverSolicitudDocenteDto { Motivo = "Cambio de docente." });
    H.Afirmar(H.Estado(await Pedir(OfertaDePrueba.IdOtroDocente, "Docente", fisica)) == 404, "el docente revocado ve el listado");

    var roles = typeof(SuscritosUnidadController).GetCustomAttribute<AuthorizeAttribute>()?.Roles;
    H.Afirmar(roles == "Administrador,Docente", "roles: " + roles);
    var campos = typeof(AlumnoSuscritoDto).GetProperties().Select(p => p.Name).ToArray();
    H.Afirmar(!campos.Any(c => c.Contains("Correo") || c.Contains("Identificacion") || c.Contains("Contrasena") || c.Contains("IdUsuario")),
        "el listado expone datos sensibles: " + string.Join(",", campos));
});

await Caso("Catálogo: expone la academia y filtra por ella; no se desactiva una academia con materias", async () =>
{
    var (b, db) = await BaseAcademica();
    await using var _b = b; await using var _db = db;
    var (academia, _) = await PrepararAcademia(b);
    var r = await H.ConUsuario(new CatalogoAcademicoController(db), adminP).ListarMaterias(idAcademia: academia);
    H.Afirmar(H.Estado(r) == 200 && H.Campo(H.Valor(r), "total") == "1", $"filtro por academia: total={H.Campo(H.Valor(r), "total")}");
    var resultados = (List<CatalogoMateriaConsultaDto>)H.Valor(r)!.GetType().GetProperty("resultados")!.GetValue(H.Valor(r))!;
    H.Afirmar(resultados[0].AcademiaNombre == "Electrónica" && resultados[0].IdAcademia == academia, "sin nombre de academia");

    await using var ctx = b.NuevoContexto();
    var baja = await H.ConUsuario(new AcademiasController(ctx), adminP).EliminarAcademia(academia);
    H.Afirmar(H.Estado(baja) == 409, $"desactivar academia con materias: {H.Estado(baja)}");
});

Console.WriteLine();
Console.WriteLine($"Resultado: {superadas} superadas, {fallidas.Count} fallidas.");
foreach (var f in fallidas) Console.WriteLine("  - " + f);
return fallidas.Count == 0 ? 0 : 1;

// ================================================================= Infraestructura de prueba
static class H
{
    public static void Afirmar(bool condicion, string detalle)
    {
        if (!condicion) throw new InvalidOperationException(detalle);
    }

    public static int? Estado(IActionResult resultado) => (resultado as IStatusCodeActionResult)?.StatusCode;

    public static int? Estado<T>(ActionResult<T> resultado) => Estado(((IConvertToActionResult)resultado).Convert());

    public static object? Valor(IActionResult resultado) => (resultado as ObjectResult)?.Value;

    public static object? Valor<T>(ActionResult<T> resultado) => Valor(((IConvertToActionResult)resultado).Convert());

    public static string Mensaje(object? valor) => Campo(valor, "mensaje");

    public static string Campo(object? valor, string nombre) =>
        valor?.GetType().GetProperty(nombre)?.GetValue(valor)?.ToString() ?? "";

    public static ClaimsPrincipal Principal(int? idUsuario, string rol)
    {
        var claims = new List<Claim> { new(ClaimTypes.Role, rol) };
        if (idUsuario.HasValue)
            claims.Add(new(ClaimTypes.NameIdentifier, idUsuario.Value.ToString(System.Globalization.CultureInfo.InvariantCulture)));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Prueba"));
    }

    public static T ConUsuario<T>(T controlador, ClaimsPrincipal? principal) where T : ControllerBase
    {
        controlador.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal ?? new ClaimsPrincipal(new ClaimsIdentity()) }
        };
        return controlador;
    }

    public static IConfiguration Config(params (string Clave, string? Valor)[] valores)
    {
        var datos = new Dictionary<string, string?>();
        foreach (var (clave, valor) in valores) datos[clave] = valor;
        return new ConfigurationBuilder().AddInMemoryCollection(datos).Build();
    }
}

static class Fabrica
{
    // Clave aleatoria por ejecucion: no es un secreto del proyecto.
    public static readonly IConfiguration Jwt = H.Config(
        ("Jwt:Key", Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))),
        ("Jwt:Issuer", "noti-ice-pruebas"),
        ("Jwt:Audience", "noti-ice-pruebas"));

    private static EmailService Correo() =>
        new(Options.Create(new EmailSettings()), NullLogger<EmailService>.Instance); // SMTP sin configurar: no envia.

    public static AuthController Auth(PortalNoticiasContext db, ClaimsPrincipal? usuario = null) =>
        H.ConUsuario(new AuthController(db, new TokenService(Jwt), Correo(), Jwt), usuario);

    // SMTP sin configurar: NotificarPublicacion termina sin enviar ni usar el proveedor de servicios.
    public static NoticiasController Noticias(PortalNoticiasContext db, ClaimsPrincipal usuario) =>
        H.ConUsuario(new NoticiasController(db,
            new NotificacionCorreoService(new ServiceCollection().BuildServiceProvider().GetRequiredService<IServiceScopeFactory>(),
                Correo(), H.Config(), NullLogger<NotificacionCorreoService>.Instance),
            new AudienciaAccesoService(db)), usuario);

    public static ComentariosController Comentarios(PortalNoticiasContext db, ClaimsPrincipal? usuario) =>
        H.ConUsuario(new ComentariosController(db, new AudienciaAccesoService(db)), usuario);

    public static InscripcionesOfertaController MisMaterias(PortalNoticiasContext db, ClaimsPrincipal usuario) =>
        H.ConUsuario(new InscripcionesOfertaController(db), usuario);

    public static SolicitudesDocentesController Solicitudes(PortalNoticiasContext db, ClaimsPrincipal usuario) =>
        H.ConUsuario(new SolicitudesDocentesController(db), usuario);

    public static UsuariosController Usuarios(PortalNoticiasContext db, ClaimsPrincipal usuario) =>
        H.ConUsuario(new UsuariosController(db), usuario);

    public static RolesController Roles(PortalNoticiasContext db, ClaimsPrincipal usuario) =>
        H.ConUsuario(new RolesController(db), usuario);

    public static RecuperacionController Recuperacion(PortalNoticiasContext db) =>
        H.ConUsuario(new RecuperacionController(db, Correo(), Jwt, new EntornoPrueba(),
            NullLogger<RecuperacionController>.Instance), null);

    public static ChatbotController Chatbot(PortalNoticiasContext db, IConfiguration config, ClaimsPrincipal usuario) =>
        H.ConUsuario(new ChatbotController(db, new AudienciaAccesoService(db), config,
            NullLogger<ChatbotController>.Instance,
            new ChatbotGenerationLimiter(Options.Create(new ChatbotLimitsOptions())),
            new ChatbotFuentesAcademicasService(db)), usuario);
}

// Construye MySqlException reales (su constructor es interno en MySqlConnector) para probar la clasificacion.
static class ErrorMySql
{
    public static MySqlConnector.MySqlException Crear(int numero)
    {
        var tipo = typeof(MySqlConnector.MySqlException);
        var ctor = tipo.GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
            .Where(c => c.GetParameters().FirstOrDefault()?.ParameterType == typeof(MySqlConnector.MySqlErrorCode))
            .OrderBy(c => c.GetParameters().Length).First();
        var argumentos = ctor.GetParameters().Select((p, i) => i == 0 ? (object?)(MySqlConnector.MySqlErrorCode)numero
            : p.ParameterType == typeof(string) ? (p.Name?.Contains("state", StringComparison.OrdinalIgnoreCase) == true ? "40001" : $"Error de prueba {numero}")
            : p.ParameterType.IsValueType ? Activator.CreateInstance(p.ParameterType) : null).ToArray();
        var excepcion = (MySqlConnector.MySqlException)ctor.Invoke(argumentos);
        H.Afirmar(excepcion.Number == numero, $"MySqlException.Number={excepcion.Number}, esperado {numero}");
        return excepcion;
    }
}

// Inyecta un fallo en SaveChanges, como lo produciria EF al recibir un error del servidor MySQL.
sealed class FalloAlGuardar : Microsoft.EntityFrameworkCore.Diagnostics.SaveChangesInterceptor
{
    private readonly Func<Exception> _fallo;
    public FalloAlGuardar(Func<Exception> fallo) => _fallo = fallo;
    public override ValueTask<Microsoft.EntityFrameworkCore.Diagnostics.InterceptionResult<int>> SavingChangesAsync(
        Microsoft.EntityFrameworkCore.Diagnostics.DbContextEventData eventData,
        Microsoft.EntityFrameworkCore.Diagnostics.InterceptionResult<int> result, CancellationToken cancellationToken = default)
        => throw _fallo();
}

sealed class EntornoPrueba : IHostEnvironment
{
    public string EnvironmentName { get; set; } = "Production";
    public string ApplicationName { get; set; } = "Intervencion1.Checks";
    public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
}

// Oferta academica minima para las pruebas del asistente. Datos ficticios, solo en SQLite en memoria.
static class OfertaDePrueba
{
    public const int IdOtroAlumno = 6, IdOtroDocente = 7;

    public static async Task SembrarAsync(BaseDePrueba b)
    {
        await using var db = b.NuevoContexto();
        var ahora = DateTime.Now;
        db.Usuarios.Add(new Usuario
        {
            IdUsuario = IdOtroAlumno, Nombre = "Otro alumno", Correo = "otro.alumno@prueba.local",
            IdRol = BaseDePrueba.IdRolAlumno, NoIdentificacion = "ID-6", Contrasena = "x", FechaAlta = ahora,
            Activo = true, VersionSesion = 1, Carrera = "Ingeniería en Comunicaciones y Electrónica", Semestre = 1
        });
        db.Usuarios.Add(new Usuario
        {
            IdUsuario = IdOtroDocente, Nombre = "Otro docente", Correo = "otro.docente@prueba.local",
            IdRol = BaseDePrueba.IdRolDocente, NoIdentificacion = "ID-7", Contrasena = "x", FechaAlta = ahora,
            Activo = true, VersionSesion = 1
        });

        var actual = new OfertaPeriodo { Clave = "2027-1", Descripcion = "Periodo actual", Activo = true };
        var anterior = new OfertaPeriodo { Clave = "2026-2", Descripcion = "Periodo cerrado", Activo = false };
        OfertaGrupo Grupo(OfertaPeriodo p, string codigo) => new()
        {
            Periodo = p, CodigoGrupo = codigo, Programa = "ICE", Plan = "2024", Semestre = 1,
            Turno = "Matutino", Modalidad = "Escolarizada", FechaConsulta = ahora, Activo = true
        };
        var g11 = Grupo(actual, "1CV11");
        var g12 = Grupo(actual, "1CV12");
        var gHistorico = Grupo(anterior, "1CV11");

        var calculo = new OfertaUnidad
        {
            Grupo = g11, NombrePublicado = "CALCULO DIFERENCIAL E INTEGRAL", OrdenFuente = 1, AulaPublicada = "1201",
            Sesiones = { new OfertaSesion { DiaSemana = 1, HoraInicio = new TimeSpan(7, 0, 0), HoraFin = new TimeSpan(8, 30, 0) },
                         new OfertaSesion { DiaSemana = 3, HoraInicio = new TimeSpan(7, 0, 0), HoraFin = new TimeSpan(8, 30, 0) } },
            Docentes = { new OfertaDocenteUnidad { Orden = 1, Tipo = "DOCENTE", NombrePublicado = "PEREZ GOMEZ JUAN" },
                         new OfertaDocenteUnidad { Orden = 2, Tipo = "VACANTE" } }
        };
        var quimica = new OfertaUnidad
        {
            Grupo = g11, NombrePublicado = "QUIMICA BASICA", OrdenFuente = 2,
            Sesiones = { new OfertaSesion { DiaSemana = 2, HoraInicio = new TimeSpan(10, 0, 0), HoraFin = new TimeSpan(11, 30, 0) } }
        };
        var fisica = new OfertaUnidad
        {
            Grupo = g12, NombrePublicado = "FISICA CLASICA", OrdenFuente = 1,
            Sesiones = { new OfertaSesion { DiaSemana = 4, HoraInicio = new TimeSpan(8, 30, 0), HoraFin = new TimeSpan(10, 0, 0) } },
            Docentes = { new OfertaDocenteUnidad { Orden = 1, Tipo = "DOCENTE", NombrePublicado = "LOPEZ RUIZ ANA" } }
        };
        var historica = new OfertaUnidad { Grupo = gHistorico, NombrePublicado = "HISTORICA 2026-2", OrdenFuente = 1 };
        db.OfertaUnidades.AddRange(calculo, quimica, fisica, historica);

        db.CatalogoMateriasPlanes.AddRange(
            new CatalogoMateriaPlan { IdOrigen = "C1", Nombre = "Cálculo Diferencial e Integral", Plan = "2024", Programa = "ICE",
                Semestre = 1, Tipo = "Obligatoria", ClaveOficialIPN = "CLAVE-NO-VERIFICADA", ClaveOficialVerificada = false, Activo = true },
            new CatalogoMateriaPlan { IdOrigen = "C2", Nombre = "Electrónica Avanzada", Plan = "2024", Programa = "ICE",
                Semestre = 7, Tipo = "Obligatoria", Activo = true });
        await db.SaveChangesAsync();

        // Selecciones: activa propia, baja propia y activa de otro alumno.
        db.OfertaInscripcionesAlumnos.AddRange(
            new OfertaInscripcionAlumno { IdUsuario = BaseDePrueba.IdAlumno, IdUnidadOferta = calculo.IdUnidadOferta, FechaAlta = ahora, Activo = true },
            new OfertaInscripcionAlumno { IdUsuario = BaseDePrueba.IdAlumno, IdUnidadOferta = quimica.IdUnidadOferta, FechaAlta = ahora, Activo = false, FechaBaja = ahora },
            new OfertaInscripcionAlumno { IdUsuario = IdOtroAlumno, IdUnidadOferta = fisica.IdUnidadOferta, FechaAlta = ahora, Activo = true });
        await db.SaveChangesAsync();
    }
}

// Base SQLite en memoria con el modelo real de PortalNoticiasContext. Cada caso crea la suya.
sealed class BaseDePrueba : IAsyncDisposable
{
    public const int IdRolAdministrador = 1, IdRolDocente = 2, IdRolAlumno = 3, IdRolInvitado = 4;
    public const int IdAdminA = 1, IdAdminB = 2, IdDocente = 3, IdAlumno = 4, IdInvitado = 5;
    public const string ContrasenaHistorica = "abc12"; // cuenta anterior a la regla de 8 caracteres

    private static readonly string HashHistorico = BCrypt.Net.BCrypt.HashPassword(ContrasenaHistorica);

    private readonly SqliteConnection _conexion;
    private readonly DbContextOptions<PortalNoticiasContext> _opciones;

    private BaseDePrueba(SqliteConnection conexion)
    {
        _conexion = conexion;
        _opciones = new DbContextOptionsBuilder<PortalNoticiasContext>().UseSqlite(conexion).Options;
    }

    public PortalNoticiasContext NuevoContexto() => new(_opciones);

    // Mismo esquema y datos, con un interceptor que simula fallos del proveedor al guardar.
    public PortalNoticiasContext NuevoContexto(Microsoft.EntityFrameworkCore.Diagnostics.IInterceptor interceptor) =>
        new(new DbContextOptionsBuilder<PortalNoticiasContext>().UseSqlite(_conexion).AddInterceptors(interceptor).Options);

    public static async Task<BaseDePrueba> CrearAsync()
    {
        var conexion = new SqliteConnection("DataSource=:memory:");
        await conexion.OpenAsync();
        var prueba = new BaseDePrueba(conexion);

        await using var db = prueba.NuevoContexto();
        await db.Database.EnsureCreatedAsync();
        var ahora = DateTime.Now;
        db.NombreRoles.AddRange(
            new NombreRol { IdRol = IdRolAdministrador, Nombre = "Administrador", FechaAlta = ahora, Activo = true },
            new NombreRol { IdRol = IdRolDocente, Nombre = "Docente", FechaAlta = ahora, Activo = true },
            new NombreRol { IdRol = IdRolAlumno, Nombre = "Alumno", FechaAlta = ahora, Activo = true },
            new NombreRol { IdRol = IdRolInvitado, Nombre = "Invitado", FechaAlta = ahora, Activo = true });
        db.Usuarios.AddRange(
            Cuenta(IdAdminA, "Admin A", "admin.a@prueba.local", IdRolAdministrador),
            Cuenta(IdAdminB, "Admin B", "admin.b@prueba.local", IdRolAdministrador),
            Cuenta(IdDocente, "Docente", "docente@prueba.local", IdRolDocente),
            Cuenta(IdAlumno, "Alumno", "alumno@prueba.local", IdRolAlumno),
            Cuenta(IdInvitado, "Invitado", "invitado@prueba.local", IdRolInvitado));
        await db.SaveChangesAsync();
        return prueba;
    }

    private static Usuario Cuenta(int id, string nombre, string correo, int idRol) => new()
    {
        IdUsuario = id,
        Nombre = nombre,
        Correo = correo,
        IdRol = idRol,
        NoIdentificacion = "ID-" + id,
        Contrasena = HashHistorico,
        FechaAlta = DateTime.Now,
        Activo = true,
        VersionSesion = 1,
        Carrera = idRol == IdRolAlumno ? "Ingeniería en Comunicaciones y Electrónica" : null,
        Semestre = idRol == IdRolAlumno ? 3 : null
    };

    public async ValueTask DisposeAsync() => await _conexion.DisposeAsync();
}
