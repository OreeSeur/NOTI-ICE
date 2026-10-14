using System.IO.Compression;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace PortalNoticiasAPI.Services
{
    // Validacion del servidor: el filtro accept del navegador no es una medida de seguridad.
    // Las firmas detectan archivos con una extension falsa; no reemplazan a un antivirus.
    public static class ValidadorArchivoDocumento
    {
        public const long MaximoBytes = 20L * 1024 * 1024; // 20 MiB por archivo

        private static readonly HashSet<string> ExtensionesPermitidas = new(StringComparer.OrdinalIgnoreCase)
        {
            ".pdf", ".jpg", ".jpeg", ".png", ".webp",
            ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt"
        };

        public static async Task<string?> ValidarAsync(IFormFile archivo, CancellationToken cancelacion)
        {
            if (archivo.Length <= 0)
                return "El archivo adjunto no puede estar vacio.";
            if (archivo.Length > MaximoBytes)
                return "El archivo adjunto excede el limite de 20 MiB.";

            var nombreOriginal = archivo.FileName;
            var nombre = Path.GetFileName(nombreOriginal.Replace('\\', '/'));
            if (string.IsNullOrWhiteSpace(nombre) || nombre.Length > 140 ||
                nombreOriginal != nombre ||
                nombre.Any(c => char.IsControl(c) || "<>:\"/\\|?*".Contains(c)))
                return "El nombre del archivo adjunto no es valido.";

            var extension = Path.GetExtension(nombre);
            if (!ExtensionesPermitidas.Contains(extension))
                return "El formato del archivo no esta permitido.";

            try
            {
                await using var contenido = archivo.OpenReadStream();
                if (!contenido.CanSeek)
                    return "No fue posible validar el archivo adjunto.";

                var cabecera = new byte[16];
                var leidos = 0;
                while (leidos < cabecera.Length)
                {
                    var cantidad = await contenido.ReadAsync(
                        cabecera.AsMemory(leidos, cabecera.Length - leidos), cancelacion);
                    if (cantidad == 0) break;
                    leidos += cantidad;
                }
                bool firmaValida;
                if (extension.Equals(".txt", StringComparison.OrdinalIgnoreCase))
                    firmaValida = await EsTextoAsync(contenido, cancelacion);
                else if (extension.Equals(".docx", StringComparison.OrdinalIgnoreCase))
                    firmaValida = EsOffice(contenido, "word/document.xml");
                else if (extension.Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
                    firmaValida = EsOffice(contenido, "xl/workbook.xml");
                else if (extension.Equals(".pptx", StringComparison.OrdinalIgnoreCase))
                    firmaValida = EsOffice(contenido, "ppt/presentation.xml");
                else
                    firmaValida = FirmaBinariaValida(extension, cabecera, leidos);

                return firmaValida ? null : "El contenido no corresponde al formato del archivo.";
            }
            catch (Exception ex) when (ex is InvalidDataException or IOException or DecoderFallbackException or NotSupportedException)
            {
                return "No fue posible leer o verificar el formato del archivo adjunto.";
            }
        }

        private static bool FirmaBinariaValida(string extension, byte[] cabecera, int leidos)
        {
            var bytes = cabecera.AsSpan(0, leidos);
            return extension.ToLowerInvariant() switch
            {
                ".pdf" => bytes.StartsWith("%PDF-"u8),
                ".jpg" or ".jpeg" => bytes.StartsWith(new byte[] { 0xFF, 0xD8, 0xFF }),
                ".png" => bytes.StartsWith(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
                ".webp" => bytes.Length >= 12 && bytes[..4].SequenceEqual("RIFF"u8) &&
                            bytes.Slice(8, 4).SequenceEqual("WEBP"u8),
                ".doc" or ".xls" or ".ppt" =>
                    bytes.StartsWith(new byte[] { 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1 }),
                _ => false
            };
        }

        private static bool EsOffice(Stream contenido, string entradaPrincipal)
        {
            contenido.Seek(0, SeekOrigin.Begin);
            using var zip = new ZipArchive(contenido, ZipArchiveMode.Read, leaveOpen: true);
            if (zip.Entries.Count is < 2 or > 3000) return false;
            return zip.GetEntry("[Content_Types].xml") is not null &&
                   zip.GetEntry(entradaPrincipal) is not null;
        }

        private static async Task<bool> EsTextoAsync(Stream contenido, CancellationToken cancelacion)
        {
            contenido.Seek(0, SeekOrigin.Begin);
            // UTF-8 valido, admitiendo archivos con BOM. Rechazar datos binarios con NUL.
            using var lector = new StreamReader(contenido, new UTF8Encoding(false, true),
                detectEncodingFromByteOrderMarks: true, bufferSize: 1024, leaveOpen: true);
            var texto = await lector.ReadToEndAsync(cancelacion);
            return !texto.Contains('\0');
        }
    }
}
