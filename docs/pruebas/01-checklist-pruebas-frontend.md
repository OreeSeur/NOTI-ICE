# Checklist de pruebas frontend

Antes de iniciar integración con backend, usar esta lista para validar el sistema.

## Validación técnica

```bash
npm install
npm run lint
npm run build
npm run dev
```

## Login y roles

- [ ] Iniciar sesión como administrador.
- [ ] Iniciar sesión como alumno.
- [ ] Iniciar sesión como docente.
- [ ] Iniciar sesión como personal administrativo.
- [ ] Cerrar sesión.
- [ ] Verificar que un alumno no acceda a `/admin`.
- [ ] Verificar que un alumno no acceda a `/docente/publicaciones`.
- [ ] Verificar que un docente sí acceda a `/docente/publicaciones`.
- [ ] Verificar que rutas inexistentes muestren 404.

## Panel administrador

- [ ] Ver dashboard admin.
- [ ] Crear aviso.
- [ ] Editar aviso.
- [ ] Eliminar aviso.
- [ ] Crear evento.
- [ ] Editar evento.
- [ ] Eliminar evento.
- [ ] Crear documento.
- [ ] Editar documento.
- [ ] Eliminar documento.
- [ ] Crear usuario.
- [ ] Editar usuario.
- [ ] Eliminar usuario.

## Gestión académica

- [ ] Entrar a `/admin/academico`.
- [ ] Cambiar entre Plan 2003 y Plan 2024.
- [ ] Buscar materias por plan.
- [ ] Crear grupo con formato válido, por ejemplo `6CV1`.
- [ ] Rechazar grupo inválido.
- [ ] Crear asignación docente-materia-grupo.
- [ ] Confirmar que los grupos se filtran por semestre de la materia.
- [ ] Filtrar asignaciones por docente.
- [ ] Filtrar asignaciones por plan.
- [ ] Filtrar asignaciones por semestre.
- [ ] Revisar panel de flujo académico.

## Perfil alumno

- [ ] Editar datos personales.
- [ ] Agregar materia de un grupo.
- [ ] Agregar otra materia de otro semestre o grupo.
- [ ] Confirmar que ambas materias aparecen listadas.
- [ ] Eliminar una materia inscrita.
- [ ] Recargar navegador y confirmar persistencia.

## Perfil docente

- [ ] Agregar asignación docente desde perfil.
- [ ] Ver “Mis materias y grupos”.
- [ ] Quitar asignación.
- [ ] Confirmar que el admin puede ver asignaciones en `/admin/academico`.

## Publicaciones docentes

- [ ] Crear aviso docente.
- [ ] Crear evento docente.
- [ ] Crear documento docente.
- [ ] Confirmar que muestran materia, grupo, profesor, plan y periodo.
- [ ] Editar publicación docente.
- [ ] Confirmar que el alumno ve los cambios.
- [ ] Eliminar publicación docente.
- [ ] Confirmar que el alumno deja de verla.

## Notificaciones

- [ ] Crear publicación dirigida al alumno.
- [ ] Confirmar contador en campana.
- [ ] Abrir campana y revisar contenido académico.
- [ ] Entrar a `/notificaciones`.
- [ ] Marcar una como leída.
- [ ] Marcar una como no leída.
- [ ] Marcar todas como leídas.
- [ ] Filtrar por aviso, evento y documento.
- [ ] Filtrar por prioridad.

## Responsive

- [ ] Probar escritorio.
- [ ] Probar tablet.
- [ ] Probar móvil.
- [ ] Abrir y cerrar sidebar móvil.
- [ ] Revisar tablas/tarjetas admin en móvil.
- [ ] Revisar calendario móvil.
- [ ] Revisar formularios en móvil.

## Modo oscuro

- [ ] Activar modo oscuro.
- [ ] Revisar inicio.
- [ ] Revisar admin.
- [ ] Revisar perfil.
- [ ] Revisar notificaciones.
- [ ] Revisar formularios.
