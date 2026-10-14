# NOTI ICE — plantillas portables de produccion (.NET 8)

**Estado:** solo preparacion. Ningun archivo instala, contrata o despliega servicios.
**Origen:** rama `fase-a-estabilidad-seguridad`, commit `ca447dd`.

## Distribucion de servicios

- Un VPS Linux compatible (referencia: Ubuntu Server 24.04 LTS) puede alojar Nginx,
  archivos estaticos de React, API ASP.NET Core 8, MySQL y Ollama `llama3.2:3b`.
- Nginx termina TLS y dirige `/api/` a Kestrel en `127.0.0.1:5135`.
- El frontend se compila con `VITE_DATA_SOURCE=api` y `VITE_API_URL=/api` **antes**
  de `npm run build`; esas variables de Vite quedan incorporadas al build.
- MySQL y Ollama deben permanecer privados; no abrir sus puertos a Internet.
- Los adjuntos bajo `uploads` no son publicos y solo se descargan mediante la API
  protegida. Evitar servir esa carpeta desde Nginx.

## Configuracion sin dependencia del proveedor

1. Cambiar el dominio de ejemplo, rutas y certificados de las plantillas.
2. Mantener los secretos fuera de Git, en un archivo privado de entorno de systemd
   con propietario adecuado y permisos 0600 (o gestor de secretos compatible).
   Configurar `ConnectionStrings__PortalNoticiasDb`, `Jwt__Key`, `Jwt__Issuer`,
   `Jwt__Audience` y SMTP si corresponde. No copiar valores a un repositorio.
3. `Cors__AllowedOrigins__0`: origen HTTPS exacto del frontend cuando se aloja
   separado de la API. Si ambos comparten dominio y ruta `/api`, CORS no es necesario;
   en Production no se permiten origenes CORS externos por defecto.
   En Development se conserva `http://localhost:5173` como valor predeterminado.
4. `ReverseProxy__KnownProxies__0`, `__1`, etc.: agregar **solo** las IP de los
   proxies confiables si Nginx no esta en loopback. La lista no debe contener IP de
   clientes finales ni intervalos amplios. Se procesan como maximo un salto y solo
   `X-Forwarded-For` y `X-Forwarded-Proto`.
5. Para una sola instancia, mantener los parametros de `Chatbot__Limits__*`,
   `OLLAMA_NUM_PARALLEL=1` y `OLLAMA_MAX_LOADED_MODELS=1`. Los limites del chatbot
   son locales al proceso; varias replicas requieren coordinacion adicional.
6. `DocumentosController` guarda en `<ContentRootPath>/uploads`; la plantilla systemd
   supone `/opt/noti-ice/backend/uploads`. Crear ese directorio, asegurar permisos
   para el usuario `notiice` y respaldarlo de manera separada de la base de datos.
7. La plantilla Nginx exige certificados ya emitidos. No habilitarla literalmente,
   pues `notiice.example.org` es ficticio. Elegir el tamano maximo de carga segun
   los limites existentes antes de configurar `client_max_body_size`.

## Aspectos de compatibilidad

- No se cambia `net8.0`, la API, JWT, audiencias ni el esquema MySQL.
- Configurar un alojamiento distinto modifica dominio, DNS, TLS, rutas, puertos,
  secretos y posiblemente los servicios de MySQL y Ollama; no obliga a rehacer
  React o los controladores del backend.
- `UseForwardedHeaders` se ejecuta antes de `UseHttpsRedirection` para reconocer
  HTTPS terminado en un proxy **de confianza**. Kestrel escucha solo en loopback en
  el ejemplo. Si se separan los servidores, configurar una red privada/firewall.
- La configuracion de Vite para produccion se documenta; no se cambia el frontend.
- `launchSettings.json` sigue siendo de desarrollo, no una configuracion del VPS.

## Verificacion futura acotada (NO ejecutada en esta preparacion)

- Revisar las rutas y la sintaxis de los archivos para el proveedor elegido.
- Confirmar variables privadas, certificados y permisos en la instancia definitiva.
- Compilar solo los archivos cambiados por esta intervencion con `dotnet build`.
- Una vez autorizada la infraestructura, verificar HTTPS, CORS con dominio real,
  permisos de adjuntos, conectividad privada de Ollama y latencias en CPU.
- Trabajar exclusivamente con la base de pruebas autorizada cuando corresponda;
  `portal_noticias` original no debe modificarse.

Estas plantillas no son una receta de despliegue automatico ni justifican contratar
infraestructura. Los cambios solo deben integrarse a la rama estable tras revision.
