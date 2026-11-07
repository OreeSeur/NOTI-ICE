# Arranque local de NOTI ICE

Guía para ejecutar frontend, backend y MySQL en un equipo Windows. Rama de trabajo:
`preparacion-final-despliegue`. Para probar el asistente con Ollama, esta guía se
complementa con [02-pruebas-locales-ollama.md](02-pruebas-locales-ollama.md).

> No escribas contraseñas, claves ni cadenas de conexión reales en el repositorio,
> en capturas ni en mensajes. Los valores de esta guía son marcadores.

## 1. Requisitos

| Herramienta | Versión | Comprobación |
|---|---|---|
| Git | cualquiera reciente | `git --version` |
| SDK .NET | 8 o posterior (destino `net8.0`) | `dotnet --list-sdks` |
| Node.js | 22.13+ de la serie 22, o 24 | `node -v` |
| MySQL | 8.0, servicio en ejecución | `Get-Service *mysql*` |
| Ollama | solo para el asistente, con `llama3.2:3b` | `ollama list` |

Si falta el modelo: `ollama pull llama3.2:3b`.

## 2. Obtener el código

```powershell
git clone https://github.com/OreeSeur/NOTI-ICE.git
cd NOTI-ICE
git checkout preparacion-final-despliegue
```

**Todos los comandos siguientes parten de la raíz del repositorio** (la carpeta
`NOTI-ICE`, que contiene `frontend` y `backend`), salvo donde se indique.

## 3. Base de datos MySQL

El repositorio **no incluye** la base ni los usuarios, y no hay un instalador
completo del esquema. Se necesita una base MySQL compatible, por ejemplo una copia
privada entregada por el responsable del proyecto. Nunca se transfiere por Git.

Con esa copia, crea una base y un usuario propios de desarrollo y restaura el
respaldo en ella.

## 4. Configuración privada del backend

El backend no lee archivos `.env`. Usa User Secrets o
`backend/NoiceBack/appsettings.Development.json` (no versionado). Con User Secrets:

```powershell
cd backend/NoiceBack
dotnet user-secrets set "ConnectionStrings:PortalNoticiasDb" "Server=localhost;Port=3306;Database=NOMBRE_BASE;User ID=USUARIO_LOCAL;Password=SECRETO_LOCAL;"
dotnet user-secrets set "Jwt:Key" "SECRETO_ALEATORIO_DE_AL_MENOS_32_BYTES"
dotnet user-secrets set "Jwt:Issuer" "noti-ice-local"
dotnet user-secrets set "Jwt:Audience" "noti-ice-local"
cd ../..
```

Para revisar qué hay configurado **sin mostrar los valores**:

```powershell
dotnet user-secrets list --project backend/NoiceBack/NoiceBack.csproj | ForEach-Object { ($_ -split ' = ')[0] }
```

El correo (`Email__*`) solo es necesario para probar recuperación de contraseña.

## 5. Arrancar el backend (terminal 1)

```powershell
dotnet run --project backend/NoiceBack/NoiceBack.csproj --launch-profile ollama-local
```

- API: http://localhost:5135
- Swagger: http://localhost:5135/swagger

El perfil `ollama-local` activa el asistente (`Chatbot__Enabled=true`) y fija CORS
para `http://localhost:5173`. Para correr **sin** asistente usa `--launch-profile http`.

## 6. Arrancar el frontend (terminal 2)

```powershell
cd frontend
npm ci
npm run dev:ollama
```

Abre http://localhost:5173 e inicia sesión con una cuenta de la base.

`npm run dev:ollama` usa `frontend/.env.ollama` (API real en
`http://localhost:5135/api` y asistente visible). Con `npm run dev` se usa
`frontend/.env`, o el modo simulado (`mock`) si no existe. Reinicia Vite al cambiar
variables `VITE_*`.

## 7. Qué esperar

- Con la base limpia, noticias, eventos y documentos aparecen vacíos.
- `/horarios` muestra la oferta académica si la base la contiene.
- El asistente aparece tras iniciar sesión. Sin publicaciones responde
  «No encontre informacion publicada para tu perfil sobre ese tema.»; no es una falla
  de Ollama.
- El asistente también responde horarios por grupo, materias y docentes, catálogo,
  perfil y, para Alumno, sus materias seleccionadas (por ejemplo «horario del grupo
  1CM10»). Esas respuestas salen directo de la base, sin Ollama.

## 8. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `dotnet run` falla con `MSB3027` / `NoiceBack.exe` bloqueado | Ya hay una API corriendo. Ciérrala: `Stop-Process -Name NoiceBack`, y vuelve a ejecutar. |
| `NU1900` al compilar | Solo avisa que no se alcanzó nuget.org para revisar vulnerabilidades. No impide compilar. |
| `cd frontend` o `npm` no encuentran la ruta / `package.json` | Estás fuera del repositorio. Entra a la carpeta `NOTI-ICE` primero. |
| `npm ci` falla con `EPERM ... unlink` | Un proceso usa `node_modules` (Vite abierto, antivirus u OneDrive). Cierra Node (`Get-Process node \| Stop-Process`), borra `frontend\node_modules` y repite `npm ci`. Si el proyecto está en OneDrive, pausa la sincronización o excluye `node_modules`. |
| `"vite" no se reconoce` | Falló la instalación de dependencias. Repite `npm ci`. |
| El backend se cierra al arrancar | Falta la cadena de conexión o la clave JWT, o MySQL está detenido. |
| Errores de CORS o el login falla | El frontend no corre en el puerto 5173, o hay variables `VITE_*` o un `.env.ollama.local` que lo sobrescriben. |
| La interfaz muestra datos simulados | Se arrancó con `npm run dev` sin `VITE_DATA_SOURCE=api`. Usa `npm run dev:ollama`. |
| El asistente responde 503 | Ollama no está en ejecución (`ollama serve`) o la generación está ocupada. |
| El asistente responde 429 | Se agotó la cuota por usuario (5 solicitudes por 60 s). Espera. |
| Redirección HTTPS inesperada | La API conserva `UseHttpsRedirection`. Usa el perfil `ollama-local` (HTTP) o el perfil `https` con certificado de confianza. |

## 9. Si el proyecto está dentro de OneDrive

OneDrive intenta sincronizar `node_modules` (miles de archivos) y `bin`/`obj` y puede
bloquearlos, lo que provoca errores `EPERM` en `npm ci` o archivos en uso al compilar.
Lo más seguro es mantener el repositorio **fuera** de OneDrive (por ejemplo
`C:\dev\NOTI-ICE`) y usar Git y GitHub como respaldo. Para moverlo:

```powershell
git clone https://github.com/OreeSeur/NOTI-ICE.git C:\dev\NOTI-ICE
```

Los secretos de User Secrets no viajan con el clon: se guardan en el perfil de Windows
y se identifican por el `UserSecretsId` del proyecto, así que siguen disponibles en el
mismo usuario.

Si no puedes moverlo, pausa la sincronización mientras trabajas (icono de OneDrive,
Ayuda y configuración, Pausar sincronización). No uses «Liberar espacio» sobre
`node_modules`, `bin` u `obj`: convierte los archivos en solo-nube y rompe la
compilación.

## 10. Verificación opcional

```powershell
dotnet build backend/NoiceBack/NoiceBack.csproj -c Release
dotnet run --project backend/tests/ChatbotLimits.Checks/ChatbotLimits.Checks.csproj -c Release
dotnet run --project backend/tests/Intervencion1.Checks/Intervencion1.Checks.csproj -c Release
cd frontend
npm run lint
npm run build -- --mode ollama
```

Estas pruebas no usan MySQL real, Ollama ni SMTP: no sustituyen la prueba manual del
portal.
