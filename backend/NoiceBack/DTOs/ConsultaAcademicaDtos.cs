using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.DTOs
{
    // Contratos PUBLICADOS por las nuevas rutas; no exponen entidades EF ni contraseñas.
    public sealed class CatalogoMateriaConsultaDto
    {
        public int IdMateriaCatalogo { get; set; }
        public string IdOrigen { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string Programa { get; set; } = string.Empty;
        public int Semestre { get; set; }
        public string? Tipo { get; set; }
        public string? Especialidad { get; set; }
        public string? Area { get; set; }
        // Academia = opcion de optativas (solo en optativas; vacio en obligatorias).
        public int? IdAcademia { get; set; }
        public string? AcademiaNombre { get; set; }
        public string? ClaveOficialIPN { get; set; }
        public bool ClaveOficialVerificada { get; set; }
        public string? FuenteClaveOficialIPN { get; set; }
        public DateTime? FechaVerificacionClaveOficialIPN { get; set; }
    }

    public sealed class PeriodoAcademicoConsultaDto
    {
        public string Clave { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }

    public sealed class GrupoOfertaConsultaDto
    {
        public int IdGrupoOferta { get; set; }
        public string Periodo { get; set; } = string.Empty;
        public string CodigoGrupo { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string Programa { get; set; } = string.Empty;
        public int Semestre { get; set; }
        public string? Turno { get; set; }
        public string? Modalidad { get; set; }
        public string? Especialidad { get; set; }
        public bool EsEspecial { get; set; }
        public string? UrlFuente { get; set; }
        public DateTime? FechaActualizacionFuente { get; set; }
        public DateTime FechaConsulta { get; set; }
    }

    public sealed class HorarioSesionConsultaDto
    {
        public int DiaSemana { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
        public string? Aula { get; set; }
    }

    public sealed class DocentePublicadoConsultaDto
    {
        public int Orden { get; set; }
        public string Tipo { get; set; } = string.Empty; // DOCENTE / VACANTE
        public string? NombrePublicado { get; set; }
    }

    public sealed class UnidadOfertaConsultaDto
    {
        public int IdUnidadOferta { get; set; }
        public int OrdenFuente { get; set; }
        public string NombrePublicado { get; set; } = string.Empty;
        public bool EsLaboratorio { get; set; }
        public string? AulaPublicada { get; set; }
        public int? IdMateriaCatalogo { get; set; } // Relación interna, nunca clave oficial.
        // Academia (opcion de optativas) de la materia del catalogo; vacio en obligatorias.
        public int? IdAcademia { get; set; }
        public string? AcademiaNombre { get; set; }
        public List<HorarioSesionConsultaDto> Sesiones { get; set; } = new();
        public List<DocentePublicadoConsultaDto> Docentes { get; set; } = new();
    }

    public sealed class GrupoOfertaDetalleConsultaDto
    {
        public GrupoOfertaConsultaDto Grupo { get; set; } = new();
        public List<UnidadOfertaConsultaDto> Unidades { get; set; } = new();
    }

    public sealed class UnidadEncontradaConsultaDto
    {
        public string Periodo { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string Programa { get; set; } = string.Empty;
        public string CodigoGrupo { get; set; } = string.Empty;
        public string NombrePublicado { get; set; } = string.Empty;
        public bool EsLaboratorio { get; set; }
        public string? AulaPublicada { get; set; }
    }

    // Alumno que agrego una unidad a su perfil. Sin correo, boleta ni datos de acceso.
    public sealed class AlumnoSuscritoDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Carrera { get; set; }
        public int? Semestre { get; set; }
        public DateTime FechaSuscripcion { get; set; }
    }

    public sealed class SuscritosUnidadDto
    {
        public int IdUnidadOferta { get; set; }
        public string NombrePublicado { get; set; } = string.Empty;
        public bool EsLaboratorio { get; set; }
        public string Periodo { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string CodigoGrupo { get; set; } = string.Empty;
        public int Total { get; set; }
        public string Aviso { get; set; } = string.Empty;
        public List<AlumnoSuscritoDto> Alumnos { get; set; } = new();
    }
}
