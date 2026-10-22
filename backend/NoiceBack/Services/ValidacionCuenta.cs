using System.Net.Mail;
using System.Text;

namespace PortalNoticiasAPI.Services
{
    // Reglas compartidas para crear o editar cuentas (registro publico, alta y edicion
    // administrativa, perfil propio y nueva contrasena). No se aplican al inicio de sesion:
    // las cuentas existentes conservan su acceso aunque no cumplan las reglas nuevas.
    public static class ValidacionCuenta
    {
        public const int NombreMinimo = 3;

        // Longitudes reales de portal_noticias_pruebas.usuarios (esquema exportado del VPS):
        // Nombre VARCHAR(150) NOT NULL y Correo VARCHAR(150) NOT NULL.
        public const int NombreMaximo = 150;
        public const int CorreoMaximo = 150;

        public const int ContrasenaMinima = 8;

        // BCrypt solo utiliza los primeros 72 bytes: se rechaza en lugar de truncar en silencio.
        public const int ContrasenaMaximaBytes = 72;

        // Recorta y reduce SOLO los espacios ordinarios (U+0020). Tabulaciones, saltos de linea y
        // otros caracteres de control se conservan para que ValidarNombre los rechace; antes, la
        // division por cualquier espacio en blanco los convertia en espacios y ocultaba la entrada invalida.
        public static string NormalizarNombre(string? nombre) =>
            string.Join(' ', (nombre ?? string.Empty)
                .Split(' ', StringSplitOptions.RemoveEmptyEntries));

        // Controles C0/C1 (incluye \t, \n, \r, NUL, DEL) y separadores Unicode de linea o parrafo.
        private static bool EsCaracterNoPermitidoEnNombre(char c) =>
            char.IsControl(c) ||
            char.GetUnicodeCategory(c) is System.Globalization.UnicodeCategory.LineSeparator
                                       or System.Globalization.UnicodeCategory.ParagraphSeparator;

        public static string NormalizarCorreo(string? correo) => (correo ?? string.Empty).Trim();

        // Recibe el nombre ya normalizado. Devuelve un mensaje de error o null.
        public static string? ValidarNombre(string nombre)
        {
            if (nombre.Any(EsCaracterNoPermitidoEnNombre))
                return "El nombre contiene caracteres no permitidos (tabulaciones, saltos de línea u otros caracteres de control).";

            // La normalizacion solo elimina U+0020: un nombre formado unicamente por otros espacios
            // Unicode (U+00A0, U+2003, U+3000...) llegaria aqui con longitud valida y debe rechazarse.
            if (nombre.All(char.IsWhiteSpace))
                return "El nombre es obligatorio y no puede estar formado solo por espacios.";

            if (nombre.Length < NombreMinimo || nombre.Length > NombreMaximo)
                return $"El nombre debe tener entre {NombreMinimo} y {NombreMaximo} caracteres.";

            return null;
        }

        // Recibe el correo ya normalizado. Devuelve un mensaje de error o null.
        public static string? ValidarCorreo(string correo)
        {
            const string formatoInvalido = "Escribe un correo electrónico válido.";

            if (correo.Length == 0)
                return "El correo electrónico es obligatorio.";

            if (correo.Length > CorreoMaximo)
                return $"El correo electrónico no puede superar {CorreoMaximo} caracteres.";

            if (correo.Any(c => char.IsWhiteSpace(c) || char.IsControl(c)))
                return formatoInvalido;

            // Solo una direccion simple: sin nombre visible ("Nombre <a@b.mx>") ni varias direcciones.
            if (!MailAddress.TryCreate(correo, out var direccion))
                return formatoInvalido;

            if (!string.Equals(direccion.Address, correo, StringComparison.Ordinal))
                return formatoInvalido;

            var dominio = direccion.Host;
            if (!dominio.Contains('.') || dominio.StartsWith('.') || dominio.EndsWith('.') ||
                dominio.Contains(".."))
                return formatoInvalido;

            return null;
        }

        // La contrasena no se recorta: los espacios son caracteres validos.
        public static string? ValidarContrasena(string? contrasena)
        {
            if (string.IsNullOrEmpty(contrasena) || contrasena.Length < ContrasenaMinima)
                return $"La contraseña debe tener al menos {ContrasenaMinima} caracteres.";

            if (string.IsNullOrWhiteSpace(contrasena))
                return "La contraseña no puede estar formada solo por espacios.";

            if (Encoding.UTF8.GetByteCount(contrasena) > ContrasenaMaximaBytes)
                return $"La contraseña no puede superar {ContrasenaMaximaBytes} bytes " +
                       "(72 caracteres sin acentos ni símbolos especiales).";

            return null;
        }
    }
}
