# Pruebas locales con Ollama

Rama de trabajo: `preparacion-final-despliegue`.

## Requisitos

- MySQL y la base restaurada, con la conexion privada `ConnectionStrings:PortalNoticiasDb` configurada en el backend.
- Configuracion privada `Jwt:Key`, `Jwt:Issuer` y `Jwt:Audience` para iniciar sesion.
- SDK .NET 8 (o un SDK posterior compatible con el destino net8.0 y su runtime instalado).
- Node.js 22.13+ de la serie 22, o 24; dependencias instaladas con `npm ci` en `frontend`.
- Ollama instalado y en ejecucion en este mismo equipo.

Descargar el modelo si no esta instalado:

```powershell
ollama pull llama3.2:3b
ollama list
```

Si Ollama no esta ejecutandose, abrir su aplicacion o ejecutar `ollama serve` en una terminal separada. No iniciar un segundo servidor si ya esta escuchando en el puerto 11434.

## Arranque

Desde la raiz del repositorio, en una terminal:

```powershell
dotnet run --project backend/NoiceBack/NoiceBack.csproj --launch-profile ollama-local
```

En otra terminal:

```powershell
cd frontend
npm ci
npm run dev:ollama
```

Abrir http://localhost:5173 e iniciar sesion con el Administrador. El asistente aparece para usuarios autenticados. La API esta en http://localhost:5135 y Swagger en http://localhost:5135/swagger.

El perfil `ollama-local` activa `Chatbot:Enabled`, configura `llama3.2:3b` y conecta la API a `http://127.0.0.1:11434`. El modo Vite `ollama` activa la interfaz y la fuente de datos API. Se usa HTTP solo sobre localhost para estas pruebas. Las configuraciones de produccion conservan su activacion explicita independiente.

La conexion y los secretos siguen siendo privados: no se incluyen en estos archivos. Cada equipo debe configurar su propia copia de MySQL. Si existen variables de entorno VITE_* o un archivo `.env.ollama.local`, pueden sobrescribir el modo; revisar esos valores si la interfaz apunta a otra API. Si existe una configuracion de redireccion HTTPS personalizada, retirarla del entorno de esta prueba HTTP o utilizar un perfil HTTPS con certificado confiable y ajustar la URL del frontend.

## Que se puede comprobar con la base vacia

Actualmente el asistente recupera solamente noticias, eventos y documentos autorizados para el usuario. No consulta el catalogo de materias ni los horarios.

Con esas publicaciones vacias, la respuesta esperada es `No encontre informacion publicada para tu perfil sobre ese tema.` En ese caso la API no llama al modelo: no es una falla de Ollama. No se agregan publicaciones automaticamente para hacer pruebas.

Para comprobar directamente la generacion de Ollama sin alterar MySQL:

```powershell
$body = @{
  model = 'llama3.2:3b'
  stream = $false
  messages = @(@{ role = 'user'; content = 'Responde brevemente en espanol: prueba local correcta.' })
  options = @{ temperature = 0; num_predict = 40 }
} | ConvertTo-Json -Depth 5
$respuesta = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/chat' -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 150
$respuesta.message.content
```

Referencia del endpoint: https://docs.ollama.com/api/chat

Se mantienen la autenticacion, el filtro de audiencia y los limites de solicitudes y concurrencia existentes. Habilitar el modo no modifica usuarios, materias, horarios ni publicaciones.
