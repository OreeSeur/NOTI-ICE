using MySqlConnector;

namespace PortalNoticiasAPI.Services
{
    // Clasifica errores de concurrencia de MySQL/InnoDB que justifican responder HTTP 409:
    //   1213 (ER_LOCK_DEADLOCK) y 1205 (ER_LOCK_WAIT_TIMEOUT).
    // Entity Framework puede encapsularlos (DbUpdateException, InvalidOperationException, etc.),
    // por eso se recorre toda la cadena de InnerException y las excepciones de un AggregateException.
    // Cualquier otro error de base de datos NO se considera conflicto y conserva su tratamiento normal.
    public static class ConflictoConcurrencia
    {
        public const int Interbloqueo = 1213;
        public const int TiempoEsperaBloqueo = 1205;

        private const int ProfundidadMaxima = 32; // evita recorridos patologicos o ciclicos

        public static bool EsConflictoConcurrente(Exception? excepcion) =>
            EsConflicto(excepcion, 0);

        private static bool EsConflicto(Exception? excepcion, int profundidad)
        {
            for (var actual = excepcion; actual != null && profundidad < ProfundidadMaxima;
                 actual = actual.InnerException, profundidad++)
            {
                if (actual is MySqlException { Number: Interbloqueo or TiempoEsperaBloqueo })
                    return true;

                if (actual is AggregateException agregada)
                    return agregada.InnerExceptions.Any(interna => EsConflicto(interna, profundidad + 1));
            }

            return false;
        }
    }
}
