using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Data;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Services;

// Fuente ya autorizada para el usuario. Contenido se recorta a MaxContenido antes de enviarse al modelo.
public sealed record FuenteChat(string Tipo, int Id, string Titulo, string Contenido,
    string Detalle, string Ruta, int MaxContenido = 850);

// Recupera para el asistente la misma informacion academica que el usuario ya puede ver en el portal:
//  - Horarios por grupo y busqueda de materias/docentes publicados  -> como /api/oferta-academica
//  - Catalogo de materias por plan                                   -> como /api/catalogo-academico
//  - Materias seleccionadas por el propio Alumno                     -> como /api/oferta-academica/mis-materias
//  - Datos basicos del propio perfil (sin correo, boleta ni secretos)
// Cada fuente aplica la misma regla de rol que su endpoint. Nunca consulta datos de otros usuarios.
public sealed class ChatbotFuentesAcademicasService
{
    private static readonly HashSet<string> RolesAcademicos = new(StringComparer.Ordinal)
        { "Administrador", "Docente", "Alumno" };

    // Palabras que indican el tipo de consulta, no el tema que se busca.
    private static readonly HashSet<string> RuidoAcademico = new(StringComparer.Ordinal)
    {
        "que", "como", "cual", "cuales", "cuando", "donde", "quien", "quienes", "para", "por",
        "con", "una", "uno", "unos", "unas", "los", "las", "del", "hay", "tengo", "tiene",
        "sobre", "quiero", "dime", "dame", "puedo", "puedes", "saber", "ver", "este", "esta",
        "son", "mis", "mio", "mia", "todas", "todos", "toda", "todo", "dia", "dias", "hora",
        "horas", "materia", "materias", "asignatura", "asignaturas", "unidad", "unidades",
        "horario", "horarios", "grupo", "grupos", "clase", "clases", "profesor", "profesora",
        "profesores", "maestro", "maestra", "docente", "docentes", "imparte", "imparten", "da",
        "dan", "salon", "salones", "aula", "aulas", "semestre", "plan", "periodo", "catalogo",
        "carrera", "turno", "laboratorio", "lab", "esime", "ice", "ipn", "noti", "portal",
        "informacion", "favor", "hola", "lleva", "llevo", "cursar", "curso", "cursos",
        "primer", "primero", "segundo", "tercer", "tercero", "cuarto", "quinto", "sexto",
        "septimo", "octavo", "noveno"
    };

    private static readonly string[] DiasCortos = { "", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom" };

    private static readonly Dictionary<string, int> SemestresEscritos = new(StringComparer.Ordinal)
    {
        ["primer"] = 1, ["primero"] = 1, ["segundo"] = 2, ["tercer"] = 3, ["tercero"] = 3,
        ["cuarto"] = 4, ["quinto"] = 5, ["sexto"] = 6, ["septimo"] = 7, ["octavo"] = 8, ["noveno"] = 9
    };

    private const int MaxUnidadesPorMateria = 5;
    private const int MaxGrupos = 2;
    private const int MaxMateriasBuscadas = 2;
    private const int MaxCatalogo = 25;

    private readonly PortalNoticiasContext _db;

    public ChatbotFuentesAcademicasService(PortalNoticiasContext db) => _db = db;

    public static bool EsRolAcademico(Usuario usuario) =>
        usuario.Rol?.Nombre is { } rol && RolesAcademicos.Contains(rol);

    // Indica si la pregunta trata de informacion academica (para no mezclarla con publicaciones).
    public static bool EsPreguntaAcademica(string normal) =>
        Regex.IsMatch(normal, @"\b(horarios?|grupos?|materias?|asignaturas?|clases?|profesor(a|es)?|maestr[oa]s?|docentes?|imparten?|salon(es)?|aulas?|catalogo|semestre|laboratorio)\b")
        || Regex.IsMatch(normal, @"\bquien(es)? (da|dan)\b")
        || CodigosDeGrupo(normal).Count > 0;

    public static bool PreguntaPorPerfil(string normal) =>
        Regex.IsMatch(normal, @"\b(mi perfil|mis datos|quien soy|mi nombre|mi rol|mi carrera|mi semestre|en que semestre (estoy|voy)|que carrera)\b");

    public static bool PreguntaPorMisMaterias(string normal) =>
        Regex.IsMatch(normal, @"\b(mis materias|mi horario|mis clases|mis asignaturas|mis grupos|materias (que )?(tengo|llevo|seleccione|agregue)|que (clases|materias) tengo|tengo clase)\b");

    public async Task<List<FuenteChat>> ObtenerAsync(Usuario usuario, string pregunta, CancellationToken ct)
    {
        var fuentes = new List<FuenteChat>();
        var normal = Normalizar(pregunta);

        // Perfil propio: cualquier usuario autenticado y activo puede consultar sus datos basicos.
        if (PreguntaPorPerfil(normal))
            fuentes.Add(FuentePerfil(usuario));

        // El resto replica [Authorize(Roles = "Administrador,Docente,Alumno")] de los endpoints academicos.
        if (!EsRolAcademico(usuario)) return fuentes;

        var esAlumno = usuario.Rol!.Nombre == "Alumno";
        if (PreguntaPorMisMaterias(normal))
        {
            // Igual que mis-materias: solo el Alumno y exclusivamente sus selecciones activas.
            if (esAlumno) fuentes.Add(await FuenteMisMateriasAsync(usuario.IdUsuario, ct));
            return fuentes;
        }

        if (!EsPreguntaAcademica(normal)) return fuentes;

        var periodo = await PeriodoAsync(normal, ct);
        var codigos = CodigosDeGrupo(normal);
        var plan = PlanMencionado(normal);
        var semestre = SemestreMencionado(normal, usuario);
        var tokens = TokensDeTema(normal, codigos);

        var enOferta = 0;
        if (periodo is not null && codigos.Count > 0)
            fuentes.AddRange(await FuentesGruposAsync(periodo, codigos, plan, ct));
        else if (periodo is not null && tokens.Length > 0)
        {
            var materias = await FuentesMateriasOfertaAsync(periodo, tokens, plan,
                normal.Contains("laboratorio", StringComparison.Ordinal), ct);
            enOferta = materias.Count;
            fuentes.AddRange(materias);
        }

        // El catalogo se agrega cuando se pide por semestre/plan/catalogo o la oferta no tuvo resultados.
        var pideCatalogo = semestre.HasValue || plan is not null || normal.Contains("catalogo", StringComparison.Ordinal);
        if (codigos.Count == 0 && (tokens.Length > 0 || semestre.HasValue) && (pideCatalogo || enOferta == 0))
        {
            var catalogo = await FuenteCatalogoAsync(tokens, plan, semestre, ct);
            if (catalogo is not null) fuentes.Add(catalogo);
        }

        return fuentes;
    }

    private static FuenteChat FuentePerfil(Usuario usuario)
    {
        var texto = $"- Nombre: {usuario.Nombre}\n- Rol: {usuario.Rol?.Nombre}\n" +
            $"- Carrera: {(string.IsNullOrWhiteSpace(usuario.Carrera) ? "no registrada" : usuario.Carrera)}\n" +
            $"- Semestre: {(usuario.Semestre.HasValue ? usuario.Semestre.Value.ToString(CultureInfo.InvariantCulture) : "no registrado")}";
        return new FuenteChat("Perfil", usuario.IdUsuario, "Tu perfil", texto, "Datos de tu cuenta", "/perfil");
    }

    private async Task<FuenteChat> FuenteMisMateriasAsync(int idUsuario, CancellationToken ct)
    {
        var unidades = await _db.OfertaInscripcionesAlumnos.AsNoTracking()
            .Where(i => i.IdUsuario == idUsuario && i.Activo && i.Unidad.Grupo.Activo && i.Unidad.Grupo.Periodo.Activo)
            .OrderByDescending(i => i.Unidad.Grupo.Periodo.Clave)
            .ThenBy(i => i.Unidad.Grupo.CodigoGrupo).ThenBy(i => i.Unidad.OrdenFuente)
            .Select(i => i.IdUnidadOferta)
            .Take(30).ToListAsync(ct);

        var lineas = await DescribirUnidadesAsync(unidades, incluirGrupo: true, ct);
        var contenido = lineas.Count == 0
            ? "Todavía no has agregado materias de los horarios a tu perfil."
            : "Materias que agregaste a tu perfil (selección del portal, no inscripción oficial del IPN):\n" +
              string.Join("\n", lineas);
        return new FuenteChat("Mis materias", idUsuario, "Mis materias de los horarios", contenido,
            $"{lineas.Count} materia(s) seleccionada(s)", "/perfil");
    }

    private async Task<OfertaPeriodo?> PeriodoAsync(string normal, CancellationToken ct)
    {
        var activos = await _db.OfertaPeriodos.AsNoTracking().Where(p => p.Activo)
            .OrderByDescending(p => p.Clave).Take(20).ToListAsync(ct);
        var mencionado = Regex.Match(normal, @"\b(20\d{2}\s*-\s*[12])\b");
        if (mencionado.Success)
        {
            var clave = Regex.Replace(mencionado.Value, @"\s", "");
            var coincide = activos.FirstOrDefault(p => p.Clave == clave);
            if (coincide is not null) return coincide;
        }
        return activos.FirstOrDefault();
    }

    private async Task<List<FuenteChat>> FuentesGruposAsync(OfertaPeriodo periodo, List<string> codigos,
        string? plan, CancellationToken ct)
    {
        var consulta = _db.OfertaGrupos.AsNoTracking()
            .Where(g => g.Activo && g.IdPeriodo == periodo.IdPeriodo && codigos.Contains(g.CodigoGrupo));
        if (plan is not null) consulta = consulta.Where(g => g.Plan == plan);
        var grupos = await consulta.OrderBy(g => g.CodigoGrupo).ThenByDescending(g => g.Plan)
            .Take(MaxGrupos).ToListAsync(ct);

        var fuentes = new List<FuenteChat>();
        foreach (var g in grupos)
        {
            var ids = await _db.OfertaUnidades.AsNoTracking().Where(u => u.IdGrupoOferta == g.IdGrupoOferta)
                .OrderBy(u => u.OrdenFuente).Select(u => u.IdUnidadOferta).Take(25).ToListAsync(ct);
            var lineas = await DescribirUnidadesAsync(ids, incluirGrupo: false, ct);
            var encabezado = $"Periodo {periodo.Clave}, plan {g.Plan}, {g.Programa}, " +
                $"semestre {g.Semestre}{Opcional(", turno ", g.Turno)}{Opcional(", modalidad ", g.Modalidad)}" +
                $"{Opcional(", especialidad ", g.Especialidad)}.";
            fuentes.Add(new FuenteChat("Grupo", g.IdGrupoOferta, $"Horario del grupo {g.CodigoGrupo}",
                encabezado + "\n" + (lineas.Count == 0 ? "Sin materias publicadas." : string.Join("\n", lineas)),
                $"Periodo {periodo.Clave} · plan {g.Plan}", "/horarios"));
        }
        return fuentes;
    }

    // Busca por nombre publicado de la materia o por nombre publicado del docente.
    private async Task<List<FuenteChat>> FuentesMateriasOfertaAsync(OfertaPeriodo periodo, string[] tokens,
        string? plan, bool pideLaboratorio, CancellationToken ct)
    {
        var consulta = _db.OfertaUnidades.AsNoTracking()
            .Where(u => u.Grupo.Activo && u.Grupo.IdPeriodo == periodo.IdPeriodo);
        if (plan is not null) consulta = consulta.Where(u => u.Grupo.Plan == plan);
        var unidades = await consulta
            .Select(u => new { u.IdUnidadOferta, u.NombrePublicado, u.EsLaboratorio, u.Grupo.CodigoGrupo })
            .ToListAsync(ct);
        if (unidades.Count == 0) return new();

        var docentes = (await _db.OfertaDocentesUnidad.AsNoTracking()
                .Where(d => d.NombrePublicado != null && d.Unidad.Grupo.Activo &&
                            d.Unidad.Grupo.IdPeriodo == periodo.IdPeriodo)
                .Select(d => new { d.IdUnidadOferta, d.NombrePublicado }).ToListAsync(ct))
            .GroupBy(d => d.IdUnidadOferta)
            .ToDictionary(x => x.Key, x => Normalizar(string.Join(" ", x.Select(d => d.NombrePublicado))));

        // Puntos = cuantas palabras de la pregunta aparecen en el nombre de la materia o del docente.
        var puntuadas = unidades.Select(u =>
            {
                var nombre = Normalizar(u.NombrePublicado);
                var docente = docentes.GetValueOrDefault(u.IdUnidadOferta, "");
                var puntos = tokens.Count(t => Contiene(nombre, t) || Contiene(docente, t));
                return new { u.IdUnidadOferta, u.NombrePublicado, u.EsLaboratorio, u.CodigoGrupo, Puntos = puntos };
            })
            .Where(u => u.Puntos > 0).ToList();
        if (puntuadas.Count == 0) return new();

        var mejor = puntuadas.Max(u => u.Puntos);
        var exacta = mejor == tokens.Length;
        var elegidas = puntuadas.Where(u => u.Puntos == mejor).ToList();
        // Si no se pide laboratorio y hay teoria con la misma coincidencia, se muestra primero la teoria.
        if (!pideLaboratorio && elegidas.Any(u => !u.EsLaboratorio))
            elegidas = elegidas.Where(u => !u.EsLaboratorio).ToList();

        var fuentes = new List<FuenteChat>();
        foreach (var materia in elegidas.GroupBy(u => Normalizar(u.NombrePublicado))
                     .OrderByDescending(g => g.Count()).Take(MaxMateriasBuscadas))
        {
            var lista = materia.OrderBy(u => u.CodigoGrupo, StringComparer.Ordinal).ToList();
            var ids = lista.Take(MaxUnidadesPorMateria).Select(u => u.IdUnidadOferta).ToList();
            var lineas = await DescribirUnidadesAsync(ids, incluirGrupo: true, ct, incluirNombre: false);
            var extra = lista.Count > ids.Count
                ? $"\nTambién se imparte en otros {lista.Count - ids.Count} grupo(s): " +
                  string.Join(", ", lista.Skip(ids.Count).Select(u => u.CodigoGrupo).Distinct().Take(40)) +
                  ". Consulta su horario en la sección Horarios."
                : "";
            var aviso = exacta ? "" : "No encontré una coincidencia exacta con tu pregunta; esta es la más parecida.\n";
            var nombre = lista[0].NombrePublicado;
            fuentes.Add(new FuenteChat("Materia", lista[0].IdUnidadOferta, nombre,
                $"{aviso}Se imparte en {lista.Count} grupo(s) del periodo {periodo.Clave}:\n" +
                string.Join("\n", lineas) + extra,
                $"Periodo {periodo.Clave} · {lista.Count} grupo(s)", "/horarios"));
        }
        return fuentes;
    }

    private async Task<FuenteChat?> FuenteCatalogoAsync(string[] tokens, string? plan, int? semestre, CancellationToken ct)
    {
        var consulta = _db.CatalogoMateriasPlanes.AsNoTracking().Where(m => m.Activo);
        if (plan is not null) consulta = consulta.Where(m => m.Plan == plan);
        if (semestre.HasValue) consulta = consulta.Where(m => m.Semestre == semestre.Value);
        var materias = await consulta.OrderBy(m => m.Plan).ThenBy(m => m.Semestre).ThenBy(m => m.Nombre)
            .Take(400).ToListAsync(ct);

        var aviso = "";
        if (tokens.Length > 0)
        {
            var conPuntos = materias.Select(m => new { M = m, P = tokens.Count(t => Contiene(Normalizar(m.Nombre), t)) })
                .Where(x => x.P > 0).ToList();
            if (conPuntos.Count == 0 && !semestre.HasValue) return null;
            if (conPuntos.Count > 0)
            {
                var max = conPuntos.Max(x => x.P);
                if (max < tokens.Length) aviso = "No encontré una coincidencia exacta; estas son las más parecidas.\n";
                materias = conPuntos.Where(x => x.P == max).Select(x => x.M).ToList();
            }
        }
        if (materias.Count == 0) return null;

        var lineas = materias.Take(MaxCatalogo).Select(m =>
            $"- {m.Nombre} (plan {m.Plan}, semestre {m.Semestre}" +
            $"{Opcional(", ", m.Tipo)}{Opcional(", área ", m.Area)}{Opcional(", especialidad ", m.Especialidad)}" +
            (m.ClaveOficialVerificada && !string.IsNullOrWhiteSpace(m.ClaveOficialIPN) ? $", clave IPN {m.ClaveOficialIPN}" : "") +
            ")");
        var extra = materias.Count > MaxCatalogo ? $"\n... y {materias.Count - MaxCatalogo} materia(s) más." : "";
        var filtro = string.Join(", ", new[]
        {
            plan is null ? null : $"plan {plan}",
            semestre.HasValue ? $"semestre {semestre}" : null
        }.Where(x => x is not null));
        var titulo = string.IsNullOrEmpty(filtro) ? "Catálogo de materias" : $"Catálogo de materias ({filtro})";
        return new FuenteChat("Catálogo", materias[0].IdMateriaCatalogo, titulo,
            aviso + string.Join("\n", lineas) + extra, $"{materias.Count} materia(s)", "/horarios");
    }

    // Una linea compacta por unidad: nombre, grupo, sesiones, aula y docentes publicados.
    private async Task<List<string>> DescribirUnidadesAsync(List<int> ids, bool incluirGrupo, CancellationToken ct,
        bool incluirNombre = true)
    {
        if (ids.Count == 0) return new();
        var unidades = await _db.OfertaUnidades.AsNoTracking().AsSplitQuery()
            .Where(u => ids.Contains(u.IdUnidadOferta))
            .Select(u => new
            {
                u.IdUnidadOferta,
                u.NombrePublicado,
                u.EsLaboratorio,
                u.AulaPublicada,
                u.Grupo.CodigoGrupo,
                u.Grupo.Plan,
                u.Grupo.Turno,
                Periodo = u.Grupo.Periodo.Clave,
                // Se ordenan en memoria: pocas filas por unidad y portable entre proveedores.
                Sesiones = u.Sesiones.Select(s => new { s.DiaSemana, s.HoraInicio, s.HoraFin, s.Aula }).ToList(),
                Docentes = u.Docentes.OrderBy(d => d.Orden)
                    .Select(d => new { d.Tipo, d.NombrePublicado }).ToList()
            }).ToListAsync(ct);

        var orden = ids.Select((id, i) => (id, i)).ToDictionary(x => x.id, x => x.i);
        return unidades.OrderBy(u => orden[u.IdUnidadOferta]).Select(u =>
        {
            var sesiones = u.Sesiones.Count == 0 ? "sin horario publicado" : string.Join(", ", u.Sesiones
                .OrderBy(s => s.DiaSemana).ThenBy(s => s.HoraInicio).Select(s =>
                $"{(s.DiaSemana is >= 1 and <= 7 ? DiasCortos[s.DiaSemana] : "?")} " +
                $"{s.HoraInicio:hh\\:mm}-{s.HoraFin:hh\\:mm}{Opcional(" aula ", s.Aula)}"));
            var docentes = u.Docentes.Count == 0 ? "sin docente publicado" : string.Join(", ", u.Docentes.Select(d =>
                string.Equals(d.Tipo, "VACANTE", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(d.NombrePublicado)
                    ? "vacante" : d.NombrePublicado!.Trim()));
            var grupo = incluirGrupo ? $"Grupo {u.CodigoGrupo} (plan {u.Plan}{Opcional(", ", u.Turno)}, {u.Periodo})" : "";
            var nombre = incluirNombre ? u.NombrePublicado + (u.EsLaboratorio ? " (laboratorio)" : "") : "";
            var titulo = string.Join(" · ", new[] { grupo, nombre }.Where(x => x.Length > 0));
            // El aula general solo se muestra si las sesiones no traen la suya.
            var aula = u.Sesiones.Any(s => !string.IsNullOrWhiteSpace(s.Aula)) ? "" : Opcional("; aula ", u.AulaPublicada);
            return $"- {titulo}: {sesiones}{aula}; docencia: {docentes}";
        }).ToList();
    }

    // Respuesta exacta para el usuario, sin pasar por el modelo: los datos llegan tal como estan en el portal.
    public static string Redactar(IReadOnlyCollection<FuenteChat> fuentes)
    {
        if (fuentes.Count == 0) return "";
        var texto = string.Join("\n\n", fuentes.Select(f => $"{f.Titulo}\n{f.Contenido}"));
        if (fuentes.Any(f => f.Tipo is "Grupo" or "Materia" or "Mis materias"))
            texto += "\n\nHorarios de referencia publicados en el portal; confirma su vigencia en los canales oficiales del IPN.";
        return texto;
    }

    public static List<string> CodigosDeGrupo(string normal) =>
        Regex.Matches(normal.ToUpperInvariant(), @"\b[1-9][A-Z]{1,3}\d{1,3}\b")
            .Select(m => m.Value).Distinct().Take(MaxGrupos).ToList();

    private static string? PlanMencionado(string normal)
    {
        var m = Regex.Match(normal, @"\b(2003|2024)\b");
        return m.Success ? m.Value : null;
    }

    private static int? SemestreMencionado(string normal, Usuario usuario)
    {
        if (Regex.IsMatch(normal, @"\bmi semestre\b") && usuario.Semestre is >= 1 and <= 12)
            return usuario.Semestre;
        var m = Regex.Match(normal, @"\b(\d{1,2})\s*(?:er|ro|do|to|vo|no|mo|o|°)?\s+semestre\b|\bsemestre\s+(\d{1,2})\b");
        if (m.Success && int.TryParse(m.Groups[1].Success ? m.Groups[1].Value : m.Groups[2].Value, out var n) && n is >= 1 and <= 12)
            return n;
        var escrito = Regex.Match(normal, @"\b(primer|primero|segundo|tercer|tercero|cuarto|quinto|sexto|septimo|octavo|noveno)\s+semestre\b");
        return escrito.Success ? SemestresEscritos[escrito.Groups[1].Value] : null;
    }

    private static string[] TokensDeTema(string normal, List<string> codigos)
    {
        var codigosNormales = codigos.Select(c => c.ToLowerInvariant()).ToHashSet();
        return Regex.Matches(normal, @"[a-z0-9]{3,}").Select(m => m.Value)
            .Where(t => !RuidoAcademico.Contains(t) && !codigosNormales.Contains(t) &&
                        !Regex.IsMatch(t, @"^\d+$"))
            .Distinct().Take(8).ToArray();
    }

    // Coincidencia parcial tolerante a plurales simples ("circuitos" ~ "circuito").
    private static bool Contiene(string texto, string token)
    {
        if (texto.Contains(token, StringComparison.Ordinal)) return true;
        if (token.Length > 4 && token.EndsWith("es", StringComparison.Ordinal) &&
            texto.Contains(token[..^2], StringComparison.Ordinal)) return true;
        return token.Length > 4 && token.EndsWith('s') && texto.Contains(token[..^1], StringComparison.Ordinal);
    }

    private static string Opcional(string prefijo, string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? "" : prefijo + valor.Trim();

    public static string Normalizar(string? texto)
    {
        var descompuesto = (texto ?? "").ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(descompuesto.Length);
        foreach (var c in descompuesto)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        return sb.ToString();
    }
}
