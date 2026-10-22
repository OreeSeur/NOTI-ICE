// Pruebas aisladas de la Intervencion 1 (S3, S4 y S5).
// Ejecutar desde la raiz del repositorio:  dotnet run --project backend/tests/Intervencion1.Checks
// Usa los controladores reales sobre SQLite en memoria: no inicia Program.cs, no se conecta a
// MySQL, al VPS, a SMTP ni a Ollama, y no requiere secretos (la clave JWT es aleatoria por ejecucion).
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
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
            new ChatbotGenerationLimiter(Options.Create(new ChatbotLimitsOptions()))), usuario);
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
