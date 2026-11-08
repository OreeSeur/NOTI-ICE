# Instalar NOTI ICE en otro equipo (Windows)

Guía para que otra persona del proyecto ejecute NOTI ICE en su computadora desde cero:
frontend, backend y MySQL, con una copia limpia de la base de datos. Rama:
`preparacion-final-despliegue`.

Qué recibe la otra persona:

| Por dónde | Qué |
|---|---|
| GitHub | El código: `https://github.com/OreeSeur/NOTI-ICE` |
| En privado (USB, mensaje directo) | El archivo `noti_ice_local.sql` y `CUENTAS_ENTREGA.txt` (correos y contraseñas de las cuentas) |

Ninguno de los dos archivos **se sube a Git ni a un enlace público**: el `.sql` contiene hashes de
contraseñas y el `.txt` las contraseñas.

---

## Parte A. Quien entrega: generar la base limpia

Se hace una vez, en el equipo que ya tiene NOTI ICE funcionando. El script **no modifica** la base
de trabajo: la copia a una base temporal, la limpia ahí, genera el archivo y borra la temporal.

```powershell
cd C:\dev\NOTI-ICE
powershell -ExecutionPolicy Bypass -File database\entrega\Generar-BD-Entrega.ps1
```

- Pide la contraseña de MySQL del usuario `root` (o el que indiques con `-Usuario`), sin mostrarla.
- Crea `C:\dev\entrega-noti-ice\noti_ice_local.sql` (cámbialo con `-Salida`; no se permite dentro del repositorio).
- Conserva: el único Administrador activo, los 3 roles, el catálogo de materias por plan, el periodo,
  los grupos, materias, horarios y docentes publicados de la oferta, y los catálogos antiguos.
- Vacía: noticias, eventos, documentos, comentarios, notificaciones leídas, preferencias, materias
  seleccionadas por alumnos, solicitudes de docentes y suscripciones a grupos antiguos.
- Borra todas las cuentas que no sean el Administrador activo (incluidas las cuentas de prueba).
- Se detiene sin generar nada si no hay **exactamente un** Administrador activo.
- Al terminar muestra cuántos registros tiene cada tabla, para revisar la entrega.

Los archivos adjuntos (carpeta de uploads) no se incluyen; como las publicaciones se vacían, no hacen falta.

### Entrega con cuentas propias (recomendado)

Para no compartir tu Administrador personal, la entrega puede llevar **otras tres cuentas**:
un Administrador, un Docente y un Alumno. Se necesita un archivo con sus `INSERT` (solo hashes
BCrypt), guardado **fuera** del repositorio, por ejemplo `C:\dev\entrega-noti-ice\cuentas_entrega.sql`,
y su lista de credenciales `CUENTAS_ENTREGA.txt` para pasarla en privado.

```powershell
powershell -ExecutionPolicy Bypass -File database\entrega\Generar-BD-Entrega.ps1 -SqlCuentas C:\dev\entrega-noti-ice\cuentas_entrega.sql
```

Con `-SqlCuentas` el script borra **todos** los usuarios de la copia, incluido tu Administrador,
inserta las cuentas del archivo y se detiene si no quedan exactamente un Administrador, un Docente y
un Alumno activos. Tu base de trabajo no cambia.

---

## Parte B. Quien recibe: instalación

### 1. Programas necesarios

| Programa | Versión | Comprobar | Instalar |
|---|---|---|---|
| Git | reciente | `git --version` | `winget install Git.Git` |
| SDK de .NET | **8** | `dotnet --list-sdks` (debe aparecer 8.x) | `winget install Microsoft.DotNet.SDK.8` |
| Node.js | 22.13+ o 24 | `node -v` | `winget install OpenJS.NodeJS.LTS` |
| MySQL Server | **8.0** | `Get-Service *mysql*` | MySQL Installer 8.0 de `dev.mysql.com/downloads/installer/` |
| Ollama (opcional) | reciente | `ollama list` | `winget install Ollama.Ollama` |

Notas:

- **MySQL:** en el instalador elige *Server only* (o *Custom* con *MySQL Server 8.0*), deja el puerto
  3306, configúralo como servicio de Windows y anota la contraseña de `root`.
- **Ollama** solo hace falta para que el asistente redacte respuestas sobre noticias, eventos y
  documentos. Horarios, materias y perfil funcionan sin Ollama. Si lo instalas, descarga el modelo:
  `ollama pull llama3.2:3b` (unos 2 GB).
- Cierra y vuelve a abrir la terminal después de instalar, para que reconozca los comandos.
- **No pongas el proyecto dentro de OneDrive** (usa por ejemplo `C:\dev`): OneDrive bloquea
  `node_modules` y provoca errores `EPERM`.

### 2. Obtener el código

```powershell
mkdir C:\dev -Force
cd C:\dev
git clone https://github.com/OreeSeur/NOTI-ICE.git
cd NOTI-ICE
git checkout preparacion-final-despliegue
```

Todos los comandos siguientes se ejecutan desde `C:\dev\NOTI-ICE` salvo que se indique.

### 3. Restaurar la base de datos

Copia el archivo recibido a una carpeta **fuera** del repositorio, por ejemplo `C:\dev\entrega-noti-ice\noti_ice_local.sql`.

Abre una consola de MySQL como `root` (pide su contraseña):

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Dentro de la consola `mysql>`, ejecuta esto. Cambia `ELIGE_UNA_CLAVE` por una contraseña propia
para el usuario de la aplicación (no la de root):

```sql
CREATE DATABASE noti_ice_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'noti_ice_dev'@'localhost' IDENTIFIED BY 'ELIGE_UNA_CLAVE';
GRANT SELECT, INSERT, UPDATE, DELETE ON noti_ice_local.* TO 'noti_ice_dev'@'localhost';
USE noti_ice_local;
SOURCE C:/dev/entrega-noti-ice/noti_ice_local.sql;
SELECT COUNT(*) AS usuarios FROM usuarios;
SELECT COUNT(*) AS grupos FROM ofertagrupos;
EXIT;
```

Debe mostrar `usuarios = 3` (o `1` si la entrega lleva solo un Administrador) y `grupos = 175`.
En `SOURCE` usa diagonales `/` en la ruta.

### 4. Configuración privada del backend

El repositorio no trae contraseñas ni claves. Se guardan con *User Secrets* en tu perfil de Windows
(fuera del proyecto). Primero genera una clave aleatoria para firmar las sesiones:

```powershell
$b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); $clave = [Convert]::ToBase64String($b)
```

En la **misma terminal**, registra la configuración (cambia `ELIGE_UNA_CLAVE` por la contraseña que
diste a `noti_ice_dev` en el paso 3):

```powershell
$proyecto = "backend/NoiceBack/NoiceBack.csproj"
dotnet user-secrets set "ConnectionStrings:PortalNoticiasDb" "Server=localhost;Port=3306;Database=noti_ice_local;User ID=noti_ice_dev;Password=ELIGE_UNA_CLAVE;" --project $proyecto
dotnet user-secrets set "Jwt:Key" $clave --project $proyecto
dotnet user-secrets set "Jwt:Issuer" "noti-ice-local" --project $proyecto
dotnet user-secrets set "Jwt:Audience" "noti-ice-local" --project $proyecto
```

Para revisar qué quedó configurado **sin mostrar los valores**:

```powershell
dotnet user-secrets list --project backend/NoiceBack/NoiceBack.csproj | ForEach-Object { ($_ -split ' = ')[0] }
```

Deben aparecer `ConnectionStrings:PortalNoticiasDb`, `Jwt:Key`, `Jwt:Issuer` y `Jwt:Audience`.
El correo (`Email:*`) solo hace falta para probar la recuperación de contraseña.

### 5. Arrancar (dos terminales)

**Terminal 1, API:**

```powershell
cd C:\dev\NOTI-ICE
dotnet run --project backend/NoiceBack/NoiceBack.csproj --launch-profile ollama-local
```

Espera a ver `Now listening on: http://localhost:5135`. Swagger: http://localhost:5135/swagger

**Terminal 2, portal:**

```powershell
cd C:\dev\NOTI-ICE\frontend
npm ci
npm run dev:ollama
```

`npm ci` solo hace falta la primera vez o cuando cambie `package-lock.json`.

Abre http://localhost:5173 e inicia sesión con una de las cuentas de `CUENTAS_ENTREGA.txt`
(Administrador, Docente o Alumno).

### 6. Comprobar que todo funciona

| Prueba | Resultado esperado |
|---|---|
| Iniciar sesión como Administrador | Entra y aparece «Administración» en el menú |
| `/horarios`, periodo 2027-1, grupo 1CM10 | Materias con días, horas, aulas y docentes |
| Noticias, eventos y documentos | Vacíos (la base viene limpia) |
| Administración → Solicitudes de docentes | «No hay solicitudes pendientes» |
| Asistente (botón redondo) → «¿Cuál es el horario del grupo 1CM10?» | El horario exacto del grupo |
| Asistente → «¿Qué noticias hay?» | «No encontre informacion publicada para tu perfil…» (normal: no hay noticias) |

Con las cuentas de Docente y Alumno se puede probar el flujo completo: el Alumno agrega materias
en `/horarios`, el Docente las solicita en «Mis materias», el Administrador las aprueba en
«Solicitudes de docentes» y el Docente publica para esos alumnos. Para más cuentas, usa
**Administración → Nuevo usuario**.

### 7. Actualizar a cambios nuevos

```powershell
cd C:\dev\NOTI-ICE
git pull
cd frontend
npm ci
```

Reinicia la API y el portal. Si un cambio nuevo trae un script en `backend/NoiceBack/Sql/` que deba
aplicarse, la persona que lo hizo debe avisar; no ejecutes scripts `*_NO_EJECUTAR.sql`.

### Problemas frecuentes

Consulta la tabla de [00-arranque-local.md](00-arranque-local.md#8-problemas-frecuentes). Los más comunes:

| Síntoma | Solución |
|---|---|
| La API se cierra al arrancar | Falta un User Secret (paso 4) o MySQL está detenido (`Get-Service *mysql*`). |
| `Access denied for user 'noti_ice_dev'` | La contraseña del paso 4 no coincide con la del paso 3. |
| `Table '…ofertasolicitudesdocentes' doesn't exist` | El `.sql` es anterior a esa tabla: pide un respaldo nuevo. |
| El login falla o hay errores de CORS | El portal debe correr en `http://localhost:5173` con `npm run dev:ollama`. |
| `dotnet` no encuentra el SDK 8 | Instala `Microsoft.DotNet.SDK.8` aunque tengas otra versión. |
