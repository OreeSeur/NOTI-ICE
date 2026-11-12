using Microsoft.EntityFrameworkCore;
using PortalNoticiasAPI.Models;

namespace PortalNoticiasAPI.Data
{
    public class PortalNoticiasContext : DbContext
    {
        public PortalNoticiasContext(DbContextOptions<PortalNoticiasContext> options)
            : base(options) { }

        public DbSet<NombreRol> NombreRoles { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Noticia> Noticias { get; set; }
        public DbSet<NoticiaDocumento> NoticiasDocumentos { get; set; }
        public DbSet<Comentario> Comentarios { get; set; }
        public DbSet<NoticiaComentario> NoticiasComentarios { get; set; }
        public DbSet<Evento> Eventos { get; set; }
        public DbSet<Academia> Academias { get; set; }
        public DbSet<UsuarioPreferencia> UsuariosPreferencias { get; set; }
        public DbSet<NotificacionLeida> NotificacionesLeidas { get; set; }

        // Consultas acadÃ©micas institucionales (independientes de grupos/inscripciones).
        public DbSet<CatalogoMateriaPlan> CatalogoMateriasPlanes { get; set; }
        public DbSet<OfertaPeriodo> OfertaPeriodos { get; set; }
        public DbSet<OfertaGrupo> OfertaGrupos { get; set; }
        public DbSet<OfertaUnidad> OfertaUnidades { get; set; }
        public DbSet<OfertaSesion> OfertaSesiones { get; set; }
        public DbSet<OfertaDocenteUnidad> OfertaDocentesUnidad { get; set; }
        public DbSet<OfertaInscripcionAlumno> OfertaInscripcionesAlumnos { get; set; }
        public DbSet<OfertaSolicitudDocente> OfertaSolicitudesDocentes { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // -------- Consulta académica institucional: tablas nuevas independientes --------
            modelBuilder.Entity<CatalogoMateriaPlan>(e =>
            {
                e.ToTable("catalogomateriasplanes");
                e.HasKey(x => x.IdMateriaCatalogo);
                e.Property(x => x.IdMateriaCatalogo).HasColumnName("idMateriaCatalogo");
                e.Property(x => x.IdOrigen).HasColumnName("IdOrigen").HasMaxLength(180).IsRequired();
                e.HasIndex(x => x.IdOrigen).IsUnique().HasDatabaseName("uq_catalogomateriasplanes_origen");
                e.Property(x => x.ClaveInterna).HasColumnName("ClaveInterna").HasMaxLength(80);
                // Clave oficial verificada y fuente, independientes de ClaveInterna.
                e.Property(x => x.ClaveOficialIPN).HasColumnName("ClaveOficialIPN").HasMaxLength(50);
                e.Property(x => x.ClaveOficialVerificada).HasColumnName("ClaveOficialVerificada")
                    .HasColumnType("bit(1)").HasDefaultValue(false);
                e.Property(x => x.FuenteClaveOficialIPN).HasColumnName("FuenteClaveOficialIPN").HasMaxLength(500);
                e.Property(x => x.FechaVerificacionClaveOficialIPN)
                    .HasColumnName("FechaVerificacionClaveOficialIPN").HasColumnType("date");
                e.Property(x => x.Nombre).HasColumnName("Nombre").HasMaxLength(180).IsRequired();
                e.Property(x => x.Plan).HasColumnName("Plan").HasMaxLength(10).IsRequired();
                e.Property(x => x.Programa).HasColumnName("Programa").HasMaxLength(180).IsRequired();
                e.Property(x => x.Semestre).HasColumnName("Semestre");
                e.Property(x => x.Tipo).HasColumnName("Tipo").HasMaxLength(60);
                e.Property(x => x.Especialidad).HasColumnName("Especialidad").HasMaxLength(120);
                e.Property(x => x.Area).HasColumnName("Area").HasMaxLength(120);
                e.Property(x => x.Activo).HasColumnName("Activo").HasColumnType("bit(1)").HasDefaultValue(true);
                // Columna agregada por Sql/20261111_fusion_02_academias_en_catalogo_SOLO_PRUEBAS.sql.
                e.Property(x => x.IdAcademia).HasColumnName("idAcademia");
                e.HasIndex(x => x.IdAcademia).HasDatabaseName("ix_catalogomateriasplanes_academia");
                e.HasOne(x => x.Academia).WithMany(a => a.MateriasCatalogo).HasForeignKey(x => x.IdAcademia)
                    .HasConstraintName("fk_catalogomateriasplanes_academia").OnDelete(DeleteBehavior.Restrict);
                // ClaveInterna NO es única: hay colisión documentada en plan 2003.
            });

            modelBuilder.Entity<OfertaPeriodo>(e =>
            {
                e.ToTable("ofertaperiodos");
                e.HasKey(x => x.IdPeriodo);
                e.Property(x => x.IdPeriodo).HasColumnName("idPeriodo");
                e.Property(x => x.Clave).HasColumnName("Clave").HasMaxLength(20).IsRequired();
                e.Property(x => x.Descripcion).HasColumnName("Descripcion").HasMaxLength(180);
                e.Property(x => x.Activo).HasColumnName("Activo").HasColumnType("bit(1)").HasDefaultValue(true);
                e.HasIndex(x => x.Clave).IsUnique().HasDatabaseName("uq_ofertaperiodos_clave");
            });

            modelBuilder.Entity<OfertaGrupo>(e =>
            {
                e.ToTable("ofertagrupos");
                e.HasKey(x => x.IdGrupoOferta);
                e.Property(x => x.IdGrupoOferta).HasColumnName("idGrupoOferta");
                e.Property(x => x.IdPeriodo).HasColumnName("idPeriodo");
                e.Property(x => x.CodigoGrupo).HasColumnName("CodigoGrupo").HasMaxLength(30).IsRequired();
                e.Property(x => x.Programa).HasColumnName("Programa").HasMaxLength(180).IsRequired();
                e.Property(x => x.Plan).HasColumnName("Plan").HasMaxLength(10).IsRequired();
                e.Property(x => x.Semestre).HasColumnName("Semestre");
                e.Property(x => x.Turno).HasColumnName("Turno").HasMaxLength(50);
                e.Property(x => x.Modalidad).HasColumnName("Modalidad").HasMaxLength(80);
                e.Property(x => x.Especialidad).HasColumnName("Especialidad").HasMaxLength(120);
                e.Property(x => x.EsEspecial).HasColumnName("EsEspecial").HasColumnType("bit(1)").HasDefaultValue(false);
                e.Property(x => x.UrlFuente).HasColumnName("UrlFuente").HasMaxLength(500);
                e.Property(x => x.FechaActualizacionFuente).HasColumnName("FechaActualizacionFuente").HasColumnType("date");
                e.Property(x => x.FechaConsulta).HasColumnName("FechaConsulta").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");
                e.Property(x => x.ChecksumFuente).HasColumnName("ChecksumFuente").HasColumnType("char(64)");
                e.Property(x => x.Activo).HasColumnName("Activo").HasColumnType("bit(1)").HasDefaultValue(true);
                e.HasIndex(x => new { x.IdPeriodo, x.Programa, x.Plan, x.CodigoGrupo })
                    .IsUnique().HasDatabaseName("uq_ofertagrupos_identidad");
                e.HasOne(x => x.Periodo).WithMany(x => x.Grupos).HasForeignKey(x => x.IdPeriodo)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<OfertaUnidad>(e =>
            {
                e.ToTable("ofertaunidades");
                e.HasKey(x => x.IdUnidadOferta);
                e.Property(x => x.IdUnidadOferta).HasColumnName("idUnidadOferta");
                e.Property(x => x.IdGrupoOferta).HasColumnName("idGrupoOferta");
                e.Property(x => x.NombrePublicado).HasColumnName("NombrePublicado").HasMaxLength(180).IsRequired();
                e.Property(x => x.EsLaboratorio).HasColumnName("EsLaboratorio").HasColumnType("bit(1)").HasDefaultValue(false);
                e.Property(x => x.AulaPublicada).HasColumnName("AulaPublicada").HasMaxLength(120);
                e.Property(x => x.IdMateriaCatalogo).HasColumnName("idMateriaCatalogo");
                e.Property(x => x.OrdenFuente).HasColumnName("OrdenFuente");
                e.HasIndex(x => new { x.IdGrupoOferta, x.OrdenFuente }).IsUnique()
                    .HasDatabaseName("uq_ofertaunidades_orden");
                e.HasIndex(x => x.IdMateriaCatalogo).HasDatabaseName("ix_ofertaunidades_catalogo");
                e.HasOne(x => x.Grupo).WithMany(x => x.Unidades).HasForeignKey(x => x.IdGrupoOferta)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.MateriaCatalogo).WithMany(x => x.UnidadesEnOferta)
                    .HasForeignKey(x => x.IdMateriaCatalogo).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<OfertaSesion>(e =>
            {
                e.ToTable("ofertasesiones");
                e.HasKey(x => x.IdSesion);
                e.Property(x => x.IdSesion).HasColumnName("idSesion");
                e.Property(x => x.IdUnidadOferta).HasColumnName("idUnidadOferta");
                e.Property(x => x.DiaSemana).HasColumnName("DiaSemana");
                e.Property(x => x.HoraInicio).HasColumnName("HoraInicio").HasColumnType("time");
                e.Property(x => x.HoraFin).HasColumnName("HoraFin").HasColumnType("time");
                e.Property(x => x.Aula).HasColumnName("Aula").HasMaxLength(120);
                e.HasIndex(x => new { x.IdUnidadOferta, x.DiaSemana, x.HoraInicio, x.HoraFin })
                    .IsUnique().HasDatabaseName("uq_ofertasesiones_bloque");
                e.HasOne(x => x.Unidad).WithMany(x => x.Sesiones).HasForeignKey(x => x.IdUnidadOferta)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<OfertaDocenteUnidad>(e =>
            {
                e.ToTable("ofertadocentesunidad");
                e.HasKey(x => x.IdAsignacion);
                e.Property(x => x.IdAsignacion).HasColumnName("idAsignacion");
                e.Property(x => x.IdUnidadOferta).HasColumnName("idUnidadOferta");
                e.Property(x => x.Orden).HasColumnName("Orden");
                e.Property(x => x.NombrePublicado).HasColumnName("NombrePublicado").HasMaxLength(180);
                e.Property(x => x.Tipo).HasColumnName("Tipo").HasMaxLength(10).IsRequired();
                e.HasIndex(x => new { x.IdUnidadOferta, x.Orden }).IsUnique()
                    .HasDatabaseName("uq_ofertadocentesunidad_orden");
                e.HasOne(x => x.Unidad).WithMany(x => x.Docentes).HasForeignKey(x => x.IdUnidadOferta)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Elecciones voluntarias, sin alterar las inscripciones operativas ni permisos.
            modelBuilder.Entity<OfertaInscripcionAlumno>(e =>
            {
                e.ToTable("ofertainscripcionesalumnos");
                e.HasKey(x => x.IdInscripcionOferta);
                e.Property(x => x.IdInscripcionOferta).HasColumnName("idInscripcionOferta");
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");
                e.Property(x => x.IdUnidadOferta).HasColumnName("idUnidadOferta");
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta").HasColumnType("datetime(6)");
                e.Property(x => x.FechaBaja).HasColumnName("FechaBaja").HasColumnType("datetime(6)");
                e.Property(x => x.Activo).HasColumnName("Activo").HasColumnType("bit(1)");
                e.HasIndex(x => new { x.IdUsuario, x.IdUnidadOferta }).IsUnique()
                    .HasDatabaseName("uq_ofertainscripcionesalumnos_usuario_unidad");
                e.HasOne(x => x.Alumno).WithMany().HasForeignKey(x => x.IdUsuario)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Unidad).WithMany().HasForeignKey(x => x.IdUnidadOferta)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Solicitudes de docentes para impartir unidades; las aprueba o rechaza un Administrador.
            modelBuilder.Entity<OfertaSolicitudDocente>(e =>
            {
                e.ToTable("ofertasolicitudesdocentes");
                e.HasKey(x => x.IdSolicitud);
                e.Property(x => x.IdSolicitud).HasColumnName("idSolicitud");
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");
                e.Property(x => x.IdUnidadOferta).HasColumnName("idUnidadOferta");
                e.Property(x => x.Estado).HasColumnName("Estado").HasMaxLength(12).IsRequired();
                e.Property(x => x.FechaSolicitud).HasColumnName("FechaSolicitud").HasColumnType("datetime(6)");
                e.Property(x => x.IdAdministrador).HasColumnName("idAdministrador");
                e.Property(x => x.FechaResolucion).HasColumnName("FechaResolucion").HasColumnType("datetime(6)");
                e.Property(x => x.Motivo).HasColumnName("Motivo").HasMaxLength(300);
                // CASE es valido en MySQL y en SQLite (pruebas aisladas).
                e.Property(x => x.IdUnidadAprobada).HasColumnName("idUnidadAprobada")
                    .HasComputedColumnSql("CASE WHEN `Estado` = 'Aprobada' THEN `idUnidadOferta` END", stored: true);
                e.Property(x => x.IdUnidadVigente).HasColumnName("idUnidadVigente")
                    .HasComputedColumnSql("CASE WHEN `Estado` IN ('Pendiente', 'Aprobada') THEN `idUnidadOferta` END", stored: true);
                e.HasIndex(x => x.IdUnidadAprobada).IsUnique()
                    .HasDatabaseName("uq_ofertasolicitudesdocentes_unidad_aprobada");
                e.HasIndex(x => new { x.IdUsuario, x.IdUnidadVigente }).IsUnique()
                    .HasDatabaseName("uq_ofertasolicitudesdocentes_docente_vigente");
                e.HasIndex(x => new { x.Estado, x.FechaSolicitud })
                    .HasDatabaseName("ix_ofertasolicitudesdocentes_estado");
                e.HasOne(x => x.Docente).WithMany().HasForeignKey(x => x.IdUsuario)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Administrador).WithMany().HasForeignKey(x => x.IdAdministrador)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(x => x.Unidad).WithMany().HasForeignKey(x => x.IdUnidadOferta)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<UsuarioPreferencia>(e =>
            {
                e.ToTable("usuariospreferencias");
                e.HasKey(x => x.IdUsuario);
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");
                e.Property(x => x.DatosJson).HasColumnName("DatosJson").HasColumnType("json").IsRequired();
            });
            modelBuilder.Entity<NotificacionLeida>(e =>
            {
                e.ToTable("notificacionesleidas");
                e.HasKey(x => new { x.IdUsuario, x.Clave });
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");
                e.Property(x => x.Clave).HasColumnName("Clave").HasMaxLength(100).IsRequired();
                e.Property(x => x.FechaLectura).HasColumnName("FechaLectura");
            });

            // ---------- NombreRol ----------
            modelBuilder.Entity<NombreRol>(e =>
            {
                e.ToTable("nombrerol");
                e.HasKey(x => x.IdRol);
                e.Property(x => x.IdRol).HasColumnName("idRol");
                e.Property(x => x.Nombre).HasColumnName("NombreRol").IsRequired();
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");
            });

            // ---------- Usuario ----------
            modelBuilder.Entity<Usuario>(e =>
            {
                e.ToTable("usuarios");
                e.HasKey(x => x.IdUsuario);
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");
                e.Property(x => x.Nombre).HasColumnName("Nombre").IsRequired();
                e.Property(x => x.IdRol).HasColumnName("idRol");
                e.Property(x => x.NoIdentificacion).HasColumnName("NoIdentificacion").HasMaxLength(30).IsRequired();
                e.Property(x => x.Correo).HasColumnName("Correo").IsRequired();
                e.Property(x => x.Contrasena).HasColumnName("Contrasena").IsRequired();
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");
                e.Property(x => x.VersionSesion).HasColumnName("VersionSesion").HasDefaultValue(1);
                e.Property(x => x.Carrera).HasColumnName("Carrera");
                e.Property(x => x.Semestre).HasColumnName("Semestre");

                e.HasOne(x => x.Rol)
                 .WithMany(r => r.Usuarios)
                 .HasForeignKey(x => x.IdRol);
            });

            // ---------- Categoria ----------
            modelBuilder.Entity<Categoria>(e =>
            {
                e.ToTable("categorias");
                e.HasKey(x => x.IdCategoria);
                e.Property(x => x.IdCategoria).HasColumnName("idCategoria");
                e.Property(x => x.CategoriaNombre).HasColumnName("CategoriaNombre").IsRequired();
                e.Property(x => x.Descripcion).HasColumnName("Descripcion");
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");
            });

            // ---------- Noticia ----------
            modelBuilder.Entity<Noticia>(e =>
            {
                e.ToTable("noticias");
                e.HasKey(x => x.IdNoticia);
                e.Property(x => x.IdNoticia).HasColumnName("idNoticia");
                e.Property(x => x.Titulo).HasColumnName("Titulo").IsRequired();
                e.Property(x => x.Contenido).HasColumnName("Contenido").IsRequired();
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");
                e.Property(x => x.IdCategoria).HasColumnName("idCategoria");
                e.Property(x => x.FechaPublicacion).HasColumnName("FechaPublicacion");
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");
                e.Property(x => x.Prioridad).HasColumnName("Prioridad");
                e.Property(x => x.AudienciaJson).HasColumnName("Audiencia").HasColumnType("json");

                e.HasOne(x => x.Usuario)
                 .WithMany(u => u.Noticias)
                 .HasForeignKey(x => x.IdUsuario);

                e.HasOne(x => x.Categoria)
                 .WithMany(c => c.Noticias)
                 .HasForeignKey(x => x.IdCategoria)
                 .IsRequired(false); // <- este .IsRequired(false) es el cambio clave
            });

            // ---------- NoticiaDocumento ----------
            modelBuilder.Entity<NoticiaDocumento>(e =>
            {
                e.ToTable("noticiasdocumentos");
                e.HasKey(x => x.IdNoticiaDocumento);
                e.Property(x => x.IdNoticiaDocumento).HasColumnName("idNoticiaDocumento");
                e.Property(x => x.IdNoticia).HasColumnName("idNoticia");
                e.Property(x => x.DocumentoNombre).HasColumnName("DocumentoNombre").IsRequired();
                e.Property(x => x.RutaArchivo).HasColumnName("RutaArchivo");
                e.Property(x => x.TipoDocumento).HasColumnName("TipoDocumento").IsRequired();
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");
                e.Property(x => x.Descripcion).HasColumnName("Descripcion");
                e.Property(x => x.Url).HasColumnName("Url");
                e.Property(x => x.FechaPublicacion).HasColumnName("FechaPublicacion");
                e.Property(x => x.Prioridad).HasColumnName("Prioridad");
                e.Property(x => x.AudienciaJson).HasColumnName("Audiencia").HasColumnType("json");
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");

                e.HasOne(x => x.Usuario)
                 .WithMany()
                 .HasForeignKey(x => x.IdUsuario)
                 .IsRequired(false);
                e.HasOne(x => x.Noticia)
                 .WithMany(n => n.Documentos)
                 .HasForeignKey(x => x.IdNoticia)
                 .IsRequired(false);
            });

            // ---------- Comentario ----------
            modelBuilder.Entity<Comentario>(e =>
            {
                e.ToTable("comentarios");
                e.HasKey(x => x.IdComentario);
                e.Property(x => x.IdComentario).HasColumnName("idComentario");
                e.Property(x => x.ComentarioTexto).HasColumnName("Comentario").IsRequired();
                e.Property(x => x.FechaPublicacion).HasColumnName("FechaPublicacion");
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");

                e.HasOne(x => x.Usuario)
                 .WithMany(u => u.Comentarios)
                 .HasForeignKey(x => x.IdUsuario);
            });

            // ---------- NoticiaComentario (puente) ----------
            modelBuilder.Entity<NoticiaComentario>(e =>
            {
                e.ToTable("noticiascomentarios");
                e.HasKey(x => x.IdNoticiaComentario);
                e.Property(x => x.IdNoticiaComentario).HasColumnName("idNoticiaComentario");
                e.Property(x => x.IdNoticia).HasColumnName("idNoticia");
                e.Property(x => x.IdComentario).HasColumnName("idComentario");
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");

                e.HasOne(x => x.Noticia)
                 .WithMany(n => n.NoticiasComentarios)
                 .HasForeignKey(x => x.IdNoticia);

                e.HasOne(x => x.Comentario)
                 .WithMany(c => c.NoticiasComentarios)
                 .HasForeignKey(x => x.IdComentario);
            });

            // ---------- Evento ----------
            modelBuilder.Entity<Evento>(e =>
            {
                e.ToTable("eventos");
                e.HasKey(x => x.IdEvento);
                e.Property(x => x.IdEvento).HasColumnName("idEvento");
                e.Property(x => x.Titulo).HasColumnName("Titulo").IsRequired();
                e.Property(x => x.Descripcion).HasColumnName("Descripcion");
                e.Property(x => x.Lugar).HasColumnName("Lugar");
                e.Property(x => x.FechaInicio).HasColumnName("FechaInicio");
                e.Property(x => x.FechaFin).HasColumnName("FechaFin");
                e.Property(x => x.HoraInicio).HasColumnName("HoraInicio");
                e.Property(x => x.HoraFin).HasColumnName("HoraFin");
                e.Property(x => x.IdUsuario).HasColumnName("idUsuario");
                e.Property(x => x.IdCategoria).HasColumnName("idCategoria");
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");
                e.Property(x => x.CategoriaEvento).HasColumnName("CategoriaEvento");
                e.Property(x => x.Prioridad).HasColumnName("Prioridad");
                e.Property(x => x.AudienciaJson).HasColumnName("Audiencia").HasColumnType("json");

                e.HasOne(x => x.Usuario)
                 .WithMany(u => u.Eventos)
                 .HasForeignKey(x => x.IdUsuario);

                e.HasOne(x => x.Categoria)
                 .WithMany(c => c.Eventos)
                 .HasForeignKey(x => x.IdCategoria)
                 .IsRequired(false);
            });

            // ---------- Academia ----------
            modelBuilder.Entity<Academia>(e =>
            {
                e.ToTable("academias");
                e.HasKey(x => x.IdAcademia);
                e.Property(x => x.IdAcademia).HasColumnName("idAcademia");
                e.Property(x => x.Nombre).HasColumnName("Nombre").IsRequired();
                e.Property(x => x.Descripcion).HasColumnName("Descripcion");
                e.Property(x => x.FechaAlta).HasColumnName("FechaAlta");
                e.Property(x => x.Activo).HasColumnName("Activo");
            });
        }
    }
}
