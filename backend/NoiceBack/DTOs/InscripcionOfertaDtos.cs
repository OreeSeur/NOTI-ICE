using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PortalNoticiasAPI.DTOs
{
    public sealed class AgregarInscripcionOfertaDto
    {
        [Range(1, int.MaxValue)]
        public int IdUnidadOferta { get; set; }
    }

    // Agrega de una vez todas las materias y laboratorios publicados de un grupo de la oferta.
    public sealed class AgregarGrupoOfertaDto
    {
        [Range(1, int.MaxValue)]
        public int IdGrupoOferta { get; set; }
    }

    public sealed class MisMateriasOfertaDto
    {
        public int IdUnidadOferta { get; set; }
        public string Periodo { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string Programa { get; set; } = string.Empty;
        public string CodigoGrupo { get; set; } = string.Empty;
        public string NombrePublicado { get; set; } = string.Empty;
        public bool EsLaboratorio { get; set; }
        public string? AulaPublicada { get; set; }
        public DateTime FechaAlta { get; set; }
        public List<HorarioSesionConsultaDto> Sesiones { get; set; } = new();
        public List<DocentePublicadoConsultaDto> Docentes { get; set; } = new();
    }
}
