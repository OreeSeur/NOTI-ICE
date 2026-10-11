using System;

namespace PortalNoticiasAPI.DTOs
{
    public class ComentarioDto
    {
        public int IdComentario { get; set; }
        public string ComentarioTexto { get; set; } = string.Empty;
        public DateTime FechaPublicacion { get; set; }
        public int IdUsuario { get; set; }
        public string? AutorNombre { get; set; }
    }

    // Lo que el frontend manda para publicar un comentario en una noticia
    public class ComentarioCreateDto
    {
        public int IdNoticia { get; set; }
        public int IdUsuario { get; set; }
        public string ComentarioTexto { get; set; } = string.Empty;
    }
}
