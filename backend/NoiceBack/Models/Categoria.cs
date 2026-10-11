using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    public class Categoria
    {
        public int IdCategoria { get; set; }
        public string CategoriaNombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        public ICollection<Noticia>? Noticias { get; set; }
        public ICollection<Evento>? Eventos { get; set; }
    }
}
