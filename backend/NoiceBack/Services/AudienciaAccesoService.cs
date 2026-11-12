using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.DTOs;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Services
{
    // Política de lectura: público solo cuando roles, carreras y semestres son generales.
    // Las categorías son temas de suscripción, no criterios de autorización.
    public sealed class AudienciaAccesoService
    {
        private const int MaxDestinos = 30;
        private readonly PortalNoticiasContext _context;
        private HashSet<int> _unidadesValidas = new();
        private HashSet<int> _gruposOfertaValidos = new();
        private HashSet<int> _academiasValidas = new();

        public AudienciaAccesoService(PortalNoticiasContext context) => _context = context;

        // Calcula a que materias, grupos de horario y academias pertenece el usuario.
        // Se utiliza tanto en GET de publicaciones como al enviar correos.
        //  - Alumno: sus suscripciones activas (materias que agrego a su perfil).
        //  - Docente: sus solicitudes Aprobadas por un Administrador.
        // Grupos y academias solo cuentan si el grupo y su periodo siguen activos.
        public async Task PrepararDestinosAsync(Usuario? usuario)
        {
            _unidadesValidas = new();
            _gruposOfertaValidos = new();
            _academiasValidas = new();
            if (usuario == null) return;

            List<PertenenciaUnidad> filas;
            if (usuario.Rol?.Nombre == "Alumno")
            {
                filas = await _context.OfertaInscripcionesAlumnos.AsNoTracking()
                    .Where(i => i.IdUsuario == usuario.IdUsuario && i.Activo)
                    .Select(i => new PertenenciaUnidad(
                        i.IdUnidadOferta,
                        i.Unidad.IdGrupoOferta,
                        i.Unidad.MateriaCatalogo != null ? i.Unidad.MateriaCatalogo.IdAcademia : null,
                        i.Unidad.Grupo.Activo && i.Unidad.Grupo.Periodo.Activo))
                    .ToListAsync();
            }
            else if (usuario.Rol?.Nombre == "Docente")
            {
                filas = await _context.OfertaSolicitudesDocentes.AsNoTracking()
                    .Where(s => s.IdUsuario == usuario.IdUsuario && s.Estado == EstadosSolicitudDocente.Aprobada)
                    .Select(s => new PertenenciaUnidad(
                        s.IdUnidadOferta,
                        s.Unidad.IdGrupoOferta,
                        s.Unidad.MateriaCatalogo != null ? s.Unidad.MateriaCatalogo.IdAcademia : null,
                        s.Unidad.Grupo.Activo && s.Unidad.Grupo.Periodo.Activo))
                    .ToListAsync();
            }
            else return;

            _unidadesValidas = filas.Select(f => f.IdUnidad).ToHashSet();
            _gruposOfertaValidos = filas.Where(f => f.Vigente).Select(f => f.IdGrupo).ToHashSet();
            _academiasValidas = filas.Where(f => f.Vigente && f.IdAcademia.HasValue)
                .Select(f => f.IdAcademia!.Value).ToHashSet();
        }

        private sealed record PertenenciaUnidad(int IdUnidad, int IdGrupo, int? IdAcademia, bool Vigente);

        private static bool ListaValida(List<int>? ids) =>
            ids != null && ids.Count <= MaxDestinos && ids.All(id => id > 0) && ids.Distinct().Count() == ids.Count;

        // Valida todos los destinos academicos de una publicacion nueva o editada.
        //  - Administrador: cualquier materia o grupo de un periodo activo y cualquier academia activa.
        //  - Docente: solo los que contienen una unidad con su solicitud Aprobada (periodo activo).
        // Rechaza el campo antiguo `grupos` con ids y lo quita del DTO para no volver a guardarlo.
        public async Task<bool> PuedePublicarAsync(ClaimsPrincipal principal, AudienciaDto audiencia)
        {
            if (audiencia.GruposAntiguos is { Count: > 0 }) return false;
            audiencia.GruposAntiguos = null;
            if (!ListaValida(audiencia.UnidadesOferta) || !ListaValida(audiencia.GruposOferta) ||
                !ListaValida(audiencia.Academias)) return false;
            if (audiencia.UnidadesOferta.Count == 0 && audiencia.GruposOferta.Count == 0 &&
                audiencia.Academias.Count == 0) return true;

            var esAdministrador = principal.IsInRole("Administrador");
            if (!esAdministrador && !principal.IsInRole("Docente")) return false;
            if (!int.TryParse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var idAutor)) return false;

            // Unidades aprobadas del autor en periodo activo (solo se usa si no es Administrador).
            var aprobadas = _context.OfertaSolicitudesDocentes.AsNoTracking()
                .Where(s => s.IdUsuario == idAutor && s.Estado == EstadosSolicitudDocente.Aprobada &&
                            s.Unidad.Grupo.Activo && s.Unidad.Grupo.Periodo.Activo)
                .Select(s => s.Unidad);

            if (audiencia.UnidadesOferta.Count > 0)
            {
                var ids = audiencia.UnidadesOferta;
                var unidades = esAdministrador
                    ? _context.OfertaUnidades.AsNoTracking()
                        .Where(u => ids.Contains(u.IdUnidadOferta) && u.Grupo.Activo && u.Grupo.Periodo.Activo)
                        .Select(u => u.IdUnidadOferta)
                    : aprobadas.Where(u => ids.Contains(u.IdUnidadOferta)).Select(u => u.IdUnidadOferta);
                if (await unidades.Distinct().CountAsync() != ids.Count) return false;
            }

            if (audiencia.GruposOferta.Count > 0)
            {
                var ids = audiencia.GruposOferta;
                var grupos = esAdministrador
                    ? _context.OfertaGrupos.AsNoTracking()
                        .Where(g => ids.Contains(g.IdGrupoOferta) && g.Activo && g.Periodo.Activo)
                        .Select(g => g.IdGrupoOferta)
                    : aprobadas.Where(u => ids.Contains(u.IdGrupoOferta)).Select(u => u.IdGrupoOferta);
                if (await grupos.Distinct().CountAsync() != ids.Count) return false;
            }

            if (audiencia.Academias.Count > 0)
            {
                var ids = audiencia.Academias;
                var activas = _context.Academias.AsNoTracking()
                    .Where(a => ids.Contains(a.IdAcademia) && a.Activo);
                if (!esAdministrador)
                {
                    activas = activas.Where(a => aprobadas.Any(u =>
                        u.MateriaCatalogo != null && u.MateriaCatalogo.IdAcademia == a.IdAcademia));
                }
                if (await activas.CountAsync() != ids.Count) return false;
            }
            return true;
        }

        public async Task<Usuario?> UsuarioActualAsync(ClaimsPrincipal principal)
        {
            if (principal.Identity?.IsAuthenticated != true ||
                !int.TryParse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id))
                return null;

            // Consultar perfil y rol actual en BD evita confiar en datos académicos aportados
            // por el cliente o roles desactualizados incluidos en el token.
            var usuario = await _context.Usuarios.Include(u => u.Rol)
                .FirstOrDefaultAsync(u => u.IdUsuario == id && u.Activo && u.Rol != null && u.Rol.Activo);
            await PrepararDestinosAsync(usuario);
            return usuario;
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
                var gruposAntiguos = IdsDestino(documento.RootElement, "grupos");
                var unidades = IdsDestino(documento.RootElement, "unidadesOferta");
                var gruposOferta = IdsDestino(documento.RootElement, "gruposOferta");
                var academias = IdsDestino(documento.RootElement, "academias");
                if (roles == null || carreras == null || semestres == null || gruposAntiguos == null ||
                    unidades == null || gruposOferta == null || academias == null)
                    return false;

                // Grupos del modelo antiguo (tabla retirada): nadie puede pertenecer ya a ellos.
                // Ignorar el campo volveria publica una publicacion restringida, asi que se cierra:
                // solo la ven el Administrador (arriba) y su autor (en cada controlador).
                if (gruposAntiguos.Count > 0) return false;

                // Materias, grupos de horario y academias se verifican antes de permitir un contenido
                // general: si hay alguno, el usuario debe pertenecer al menos a uno de ellos.
                if ((unidades.Count > 0 || gruposOferta.Count > 0 || academias.Count > 0) &&
                    (usuario == null || !(unidades.Any(_unidadesValidas.Contains) ||
                                          gruposOferta.Any(_gruposOfertaValidos.Contains) ||
                                          academias.Any(_academiasValidas.Contains))))
                    return false;

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

        private static List<int>? IdsDestino(JsonElement root, string nombre)
        {
            var campos = root.EnumerateObject()
                .Where(p => p.Name.Equals(nombre, StringComparison.OrdinalIgnoreCase)).ToArray();
            if (campos.Length == 0) return new List<int>();
            if (campos.Length != 1 || campos[0].Value.ValueKind != JsonValueKind.Array) return null;
            var ids = new List<int>();
            foreach (var valor in campos[0].Value.EnumerateArray())
            {
                if (valor.ValueKind != JsonValueKind.Number || !valor.TryGetInt32(out var id) || id <= 0 || ids.Contains(id)) return null;
                ids.Add(id);
            }
            return ids.Count <= MaxDestinos ? ids : null;
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
