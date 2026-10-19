using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    // Catálogo histórico independiente de materias y grupos operativos del portal.
    public class CatalogoMateriaPlan
    {
        public int IdMateriaCatalogo { get; set; }
        public string IdOrigen { get; set; } = string.Empty;
        public string? ClaveInterna { get; set; }
        // Clave oficial solo con evidencia documental verificada; sin inventar códigos.
        public string? ClaveOficialIPN { get; set; }
        public bool ClaveOficialVerificada { get; set; }
        public string? FuenteClaveOficialIPN { get; set; }
        public DateTime? FechaVerificacionClaveOficialIPN { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public string Programa { get; set; } = string.Empty;
        public int Semestre { get; set; }
        public string? Tipo { get; set; }
        public string? Especialidad { get; set; }
        public string? Area { get; set; }
        public bool Activo { get; set; } = true;

        public ICollection<OfertaUnidad> UnidadesEnOferta { get; set; } = new List<OfertaUnidad>();
    }
}
