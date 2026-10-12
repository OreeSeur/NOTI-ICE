using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Services
{
    // Política de lectura: público solo cuando roles, carreras y semestres son generales.
    // Las categorías son temas de suscripción, no criterios de autorización.
    public sealed class AudienciaAccesoService
    {
        private readonly PortalNoticiasContext _context;

        public AudienciaAccesoService(PortalNoticiasContext context) => _context = context;

        public async Task<Usuario?> UsuarioActualAsync(ClaimsPrincipal principal)
        {
            if (principal.Identity?.IsAuthenticated != true ||
                !int.TryParse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id))
                return null;

            // Consultar perfil y rol actual en BD evita confiar en datos académicos aportados
            // por el cliente o roles desactualizados incluidos en el token.
            return await _context.Usuarios.Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.IdUsuario == id && u.Activo && u.Rol != null && u.Rol.Activo);
        }

        public bool PuedeVer(string? audienciaJson, Usuario? usuario)
        {
            if (usuario?.Rol?.Nombre == "Administrador") return true;

            // Contenido anterior sin configuración de audiencia = publicación general.
            if (string.IsNullOrWhiteSpace(audienciaJson)) return true;

            try
            {
                using var documento = JsonDocument.Parse(audienciaJson);
                if (documento.RootElement.ValueKind != JsonValueKind.Object) return false;

                var roles = Valores(documento.RootElement, "roles");
                var carreras = Valores(documento.RootElement, "carreras");
                var semestres = Valores(documento.RootElement, "semestres");
                if (roles == null || carreras == null || semestres == null) return false;

                // Publicación general disponible sin autenticación.
                if (EsGeneral(roles) && EsGeneral(carreras) && EsGeneral(semestres)) return true;
                if (usuario == null) return false;

                var rol = Normalizar(usuario.Rol?.Nombre);
                var carrera = Normalizar(usuario.Carrera);
                var semestre = usuario.Semestre?.ToString(CultureInfo.InvariantCulture);

                return Coincide(roles, rol, valor => valor == rol)
                    && Coincide(carreras, carrera, valor => carrera.Length > 0 &&
                        (carrera == valor || carrera.Contains(valor, StringComparison.Ordinal)))
                    && Coincide(semestres, semestre ?? "", valor =>
                        !string.IsNullOrEmpty(semestre) &&
                        NormalizarSemestre(valor) == semestre);
            }
            catch (JsonException)
            {
                // JSON corrupto nunca debe convertirse en publicación pública.
                return false;
            }
        }

        private static List<string>? Valores(JsonElement root, string nombre)
        {
            JsonElement propiedad = default;
            var encontrada = false;
            foreach (var p in root.EnumerateObject())
            {
                if (!p.Name.Equals(nombre, StringComparison.OrdinalIgnoreCase)) continue;
                propiedad = p.Value;
                encontrada = true;
                break;
            }
            if (!encontrada) return new List<string> { "todos" }; // datos anteriores

            if (propiedad.ValueKind == JsonValueKind.String)
                return new List<string> { Normalizar(propiedad.GetString()) };

            if (propiedad.ValueKind != JsonValueKind.Array) return null;
            var valores = new List<string>();
            foreach (var item in propiedad.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.String) return null;
                valores.Add(Normalizar(item.GetString()));
            }
            return valores.Count == 0 ? null : valores;
        }

        private static bool EsGeneral(List<string> valores) =>
            valores.Count > 0 && valores.All(v => v == "todos");

        private static bool Coincide(List<string> valores, string dato, Func<string, bool> predicado) =>
            EsGeneral(valores) || (dato.Length > 0 && valores.Where(v => v != "todos").Any(predicado));

        private static string NormalizarSemestre(string valor) =>
            valor.Replace("semestre", "", StringComparison.Ordinal).Trim();

        private static string Normalizar(string? texto)
        {
            if (string.IsNullOrWhiteSpace(texto)) return "";
            var descompuesto = texto.Trim().ToLowerInvariant().Replace('-', ' ')
                .Normalize(NormalizationForm.FormD);
            var resultado = new StringBuilder();
            foreach (var c in descompuesto)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    resultado.Append(c);
            }
            return string.Join(" ", resultado.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }
    }
}
