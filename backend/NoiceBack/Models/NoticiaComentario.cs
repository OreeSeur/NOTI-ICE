using System;

namespace PortalNoticiasAPI.Models
{
    public class NoticiaComentario
    {
        public int IdNoticiaComentario { get; set; }
        public int IdNoticia { get; set; }
        public int IdComentario { get; set; }
        public DateTime FechaAlta { get; set; }
        public bool Activo { get; set; }

        public Noticia? Noticia { get; set; }
        public Comentario? Comentario { get; set; }
    }
}
