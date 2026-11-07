# Prompt inicial para Claude Code

Texto para pegar al iniciar una sesión de Claude Code en el repositorio. Claude Code
lee `CLAUDE.md` automáticamente; este prompt añade las reglas de trabajo de la sesión.

## Uso

```powershell
cd C:\dev\NOTI-ICE
claude
```

Inicia sesión con tu cuenta la primera vez, deja el modo de permisos normal (pregunta
antes de editar o ejecutar) y pega el prompt.

## Prompt

```text
Lee CLAUDE.md, docs/pruebas/00-arranque-local.md y docs/pruebas/02-pruebas-locales-ollama.md.

Contexto: trabajamos en la rama preparacion-final-despliegue, en mi PC con Windows. MySQL 8, .NET 8, Node 24 y Ollama (llama3.2:3b) ya están instalados.

Reglas de esta sesión:
- Idioma: español.
- No leas, imprimas ni pegues secretos (User Secrets, contraseñas, JWT, SMTP). Para revisar la configuración, muestra solo los nombres.
- No ejecutes SQL de escritura ni cambies datos en MySQL sin pedirme confirmación; confirma antes el servidor y la base efectiva.
- No despliegues, no toques el VPS ni la base portal_noticias, y no hagas push ni merge sin mi autorización explícita.
- Haz commits pequeños en esta rama y muéstrame el resumen de cambios antes de cada push.
- Conserva roles (Administrador, Docente, Alumno), la autorización en backend y ASP.NET Core 8.

Primero: comprueba rama, HEAD y estado de git; arranca backend y frontend siguiendo la guía de arranque local y confirma que el portal carga en http://localhost:5173. Después te daré la lista de cambios, y los trabajaremos uno por uno, validando cada uno.
```

## Notas

- Cierra la API y Vite antes de compilar o reinstalar dependencias: un proceso en
  ejecución bloquea `NoiceBack.exe` y `node_modules`.
- Si cambian las reglas del proyecto, actualiza este prompt y `CLAUDE.md` juntos.
