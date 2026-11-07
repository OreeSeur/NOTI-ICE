# NOTI ICE

Portal de noticias academicas e institucionales
para Ingenieria en Comunicaciones y Electronica,
ESIME Zacatenco, Instituto Politecnico Nacional.

## Estructura

- frontend: React y Vite
- backend: ASP.NET Core y C#
- database: scripts y migraciones de MySQL
- docs: documentacion tecnica

## Ejecutar en local

Pasos completos (requisitos, base de datos, backend, frontend y problemas
frecuentes): [guia de arranque local](docs/pruebas/00-arranque-local.md).

Resumen, desde la raiz del repositorio y con MySQL y la configuracion privada listos:

```powershell
# Terminal 1: API en http://localhost:5135
dotnet run --project backend/NoiceBack/NoiceBack.csproj --launch-profile ollama-local

# Terminal 2: portal en http://localhost:5173
cd frontend
npm ci
npm run dev:ollama
```

Para probar el asistente con Ollama local, consultar tambien
[la guia de pruebas locales](docs/pruebas/02-pruebas-locales-ollama.md).

## Estado

Proyecto en proceso de auditoria y estabilizacion.

La configuracion privada y las credenciales
no deben incorporarse al repositorio.
