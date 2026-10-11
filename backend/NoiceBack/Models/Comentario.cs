using System;
using System.Collections.Generic;

namespace PortalNoticiasAPI.Models
{
    public class Comentario
    {
        public int IdComentario { get; set; }
        public string ComentarioTexto { get; set; } = string.Empty;
        public DateTime FechaPublicacion { get; set; }
        public int IdUsuario { get; set; }
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        public Usuario? Usuario { get; set; }
        public ICollection<NoticiaComentario>? NoticiasComentarios { get; set; }
    }
}
