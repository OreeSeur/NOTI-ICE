# Limites de POST /api/chatbot (.NET 8)

Solo este endpoint aplica la politica de frecuencia. Se ejecuta despues de la
autenticacion y autorizacion existentes. El identificador del usuario validado en
el JWT comparte cupo entre sus sesiones; la IP no se utiliza como identidad.
No se modifican las consultas, audiencias ni referencias a publicaciones.

## Parametros de produccion

Variables de entorno del proceso ASP.NET Core; los valores indicados son tambien
los predeterminados si no se proporciona configuracion:

| Variable | Predeterminado | Funcion |
| --- | ---: | --- |
| `Chatbot__Limits__RequestsPerWindow` | 5 | Solicitudes por usuario en cada ventana fija. |
| `Chatbot__Limits__WindowSeconds` | 60 | Duracion de la ventana, en segundos. |
| `Chatbot__Limits__MaxConcurrentGenerations` | 1 | Llamadas simultaneas a Ollama por proceso del backend. |
| `Chatbot__Limits__BusyRetryAfterSeconds` | 5 | Espera sugerida cuando todos los permisos estan ocupados. |

Tambien pueden definirse en la seccion `Chatbot:Limits` de la configuracion privada
de produccion. Todos deben ser enteros positivos; configuraciones invalidas impiden
el inicio. Reiniciar el backend despues de cambiarlos. No se requieren paquetes
NuGet adicionales ni cambios de framework.

La configuracion existente del modelo se conserva. En el VPS, configurar
`Ollama__Model=llama3.2:3b` y `Ollama__BaseUrl=http://127.0.0.1:11434`.
El valor de respaldo del controlador sigue siendo `llama3` si se omite el modelo.

## Comportamiento HTTP

- **429**: cupo por usuario agotado. JSON con `mensaje`, `codigo=chatbot_rate_limit`
  y `reintentarEnSegundos`; cabecera `Retry-After` en segundos.
- **503**: todos los permisos de generacion estan ocupados. JSON con `mensaje`,
  `codigo=chatbot_busy` y `reintentarEnSegundos`; cabecera `Retry-After` configurada.
  Es una sugerencia para reintentar, no una reserva ni una garantia de disponibilidad.
- Sin cola: el rechazo es inmediato. Los intentos aceptados por el limitador de
  frecuencia consumen cupo aunque despues terminen en 400, 503 u otro error.
- El permiso de concurrencia abarca la llamada y lectura de respuesta de Ollama;
  se libera al finalizar, fallar, agotar el timeout o cancelar la solicitud.
- Una consulta sin fuentes sigue respondiendo normalmente y no ocupa un permiso
  de generacion. El JSON exitoso `texto`/`enlaces` permanece igual.

## Verificacion acotada

```sh
dotnet build backend/NoiceBack/NoiceBack.csproj -c Release
dotnet run --project backend/tests/ChatbotLimits.Checks/ChatbotLimits.Checks.csproj -c Release
```

El ejecutable de comprobacion utiliza el archivo real `ChatbotLimits.cs` y un host
HTTP aislado con identidades de prueba. Verifica configuracion, particion por
usuario, HTTP 429/Retry-After, reposicion de cupo y concurrencia/liberacion.
No inicia `Program.cs` del backend, no prueba JWT reales ni consulta MySQL/Ollama.
No sustituye una compilacion completa ni una medicion de rendimiento en el VPS.

## Alcance y pendientes

Los contadores son locales y se reinician con el proceso. Ejecutar inicialmente
una sola instancia del backend; varias instancias o clientes externos de Ollama
requieren coordinacion adicional. La autenticacion existente sigue revalidando
el JWT en MySQL antes de llegar al limitador de frecuencia.

Como defensa adicional al configurar el servidor, fijar `OLLAMA_NUM_PARALLEL=1`
y `OLLAMA_MAX_LOADED_MODELS=1` en el servicio de Ollama y restringir su acceso a
localhost. El limite del backend cuenta sus llamadas activas; una cancelacion o
timeout no demuestra por si sola que el motor haya detenido la inferencia.
Comprobar ese comportamiento en el VPS. No se configura ni despliega Ollama en
esta intervencion.

Las ventanas fijas permiten una rafaga al cambiar de ventana; el limite global
de concurrencia permanece activo. Medir latencia y memoria reales antes de
aumentar la concurrencia. Conservar el timeout existente de 150 segundos por ahora.

## Resultado de esta intervencion (2026-10-14)

- Base verificada: `13c77ea`; rama local `preparacion-produccion-chatbot-limites`.
- Compilacion aislada de `ChatbotLimits.cs` y comprobaciones con Roslyn del SDK
  .NET 8.0.415 y referencias de ASP.NET Core 8: correcta, sin advertencias.
- 27 comprobaciones especificas: correctas. No se ejecutaron pruebas funcionales
  anteriores ni se accedio a MySQL/Ollama.
- Compilacion completa del backend: no completada. MSBuild fallo antes de
  compilar con `MSB1025`/`Process.get_ProcessName()` por las restricciones de
  informacion de procesos del entorno. Pendiente ejecutar el comando anterior
  en un entorno compatible. Las pruebas aisladas no prueban el controlador real.
- Sin commits nuevos, push, PR, fusiones ni despliegues.

Referencias tecnicas: [middleware de limites en ASP.NET Core 8](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-8.0)
y [configuracion de concurrencia de Ollama](https://docs.ollama.com/faq#how-does-ollama-handle-concurrent-requests).
