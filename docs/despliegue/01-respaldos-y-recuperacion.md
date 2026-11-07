# NOTI ICE - persistencia, respaldos y recuperacion (preparacion)

**Estado:** documento de planificacion, NO ejecutado. No implica contratar un VPS,
conectar MySQL, copiar datos reales ni restaurar ninguna base.
**Regla:** `portal_noticias` es intocable. Solo `portal_noticias_pruebas` puede usarse
para ensayos expresamente autorizados. Mantener secretos y respaldos fuera de Git.

## 1. Datos persistentes

- **MySQL:** usuarios, publicaciones, permisos, metadatos y rutas logicas de adjuntos.
- **Archivos:** `Storage__UploadsPath=/var/lib/noti-ice/uploads` (plantilla Linux).
  El directorio NO debe estar bajo `/var/www`, ni exponerse como estatico por Nginx.
- Las rutas que ya figuran en MySQL (`/uploads/<nombre>`) siguen siendo logicas;
  cambiar la ubicacion fisica NO exige reescribirlas.
- En desarrollo, sin `Storage__UploadsPath`, se conserva la ruta historica
  `<ContentRootPath>/uploads`; fuera de Development se exige una ruta absoluta.

## 2. Preparacion futura del VPS (NO ejecutar todavia)

1. Elegir almacenamiento persistente, retenido entre actualizaciones de la API.
2. Antes de habilitar la API, crear `/var/lib/noti-ice/uploads`, con propietario
   del servicio `notiice`, permisos de directorio `0700` y respaldos separados.
3. Mantener `ProtectSystem=strict` en systemd y conceder escritura solo en la ruta
   persistente mediante `ReadWritePaths=/var/lib/noti-ice/uploads`.
4. Evitar que usuarios ajenos al servicio lean adjuntos o respaldos.
5. Definir almacenamiento externo cifrado, control de acceso y una politica de
   retencion (por ejemplo, diaria/semanal), sujeta a aprobacion y capacidad.

## 3. Procedimiento propuesto de respaldo

1. Identificar explicitamente el esquema autorizado. NO inferir nombres ni
   usar la base original para pruebas.
2. Capturar un respaldo consistente de MySQL con `mysqldump --single-transaction`
   cuando las tablas sean InnoDB. Incluir esquema, datos, disparadores y rutinas
   aplicables. Almacenar el volcado fuera del directorio publico y del repositorio.
3. Capturar la carpeta de adjuntos usando una ventana sin escrituras o un snapshot
   coordinado con la base de datos para evitar referencias a archivos incompletos.
4. Cifrar y copiar ambos respaldos a almacenamiento fuera del VPS. Conservar
   manifiesto de fecha, nombre de esquema, version de NOTI ICE, tamanos y sumas SHA-256.
5. Comprobar integridad de los archivos respaldados y registrar el resultado;
   no confundir creacion de un archivo con restauracion exitosa.
6. Proteger cualquier configuracion del cliente MySQL con credenciales: permisos
   privados; nunca copiar claves, volcados o tokens a Git/ChatGPT.

## 4. Restauracion de ensayo (solo con nueva autorizacion)

1. Preparar una instancia aislada y el esquema `portal_noticias_pruebas`.
2. Verificar en el SQL de respaldo que no existan comandos que seleccionen, creen,
   eliminen o modifiquen `portal_noticias`. No ejecutar volcados desconocidos.
3. Restaurar SOLO en `portal_noticias_pruebas` y restaurar los adjuntos a una carpeta
   privada separada; no sobrescribir rutas de datos originales.
4. Arrancar la API de ensayo con un `Storage__UploadsPath` propio y una cadena de
   conexion apuntando unicamente a `portal_noticias_pruebas`.
5. Verificar solo lo necesario: integridad basica de tablas, correspondencia entre
   rutas `/uploads/...` y archivos, y una descarga autorizada/no autorizada.
6. Documentar resultado, tiempo de recuperacion y discrepancias sin repetir la
   bateria historica de seguridad ya superada.

## 5. Migracion del directorio historico (cuando proceda)

- No mover ni eliminar el origen de inmediato. Detener nuevas cargas en una ventana
  controlada, realizar copia preservando nombres/permisos y comparar conteos y hash.
- Cambiar `Storage__UploadsPath` solo despues de confirmar que los archivos
  existentes se encuentran en la nueva ubicacion; reiniciar la API al cambiarla.
- Conservar la copia original para rollback hasta aprobar las comprobaciones.
- No alterar `RutaArchivo` en MySQL ni abrir una URL publica a `/uploads/`.

## 6. Criterio de cierre futuro

Antes de desplegar: acordar frecuencia/retencion, realizar una restauracion de
ensayo en entorno autorizado, garantizar copia externa y registrar responsables.
El procedimiento real se adaptara al proveedor y al sistema de backup elegido.
