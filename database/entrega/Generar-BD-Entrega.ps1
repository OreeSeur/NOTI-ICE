<#
.SYNOPSIS
  Genera un respaldo SQL "limpio" de NOTI ICE para entregar a otra persona:
  solo el Administrador, los roles y los datos académicos (catálogo, oferta y horarios),
  sin publicaciones, selecciones, solicitudes, preferencias ni cuentas de prueba.

.DESCRIPTION
  NO modifica la base de origen. Pasos:
    1. Respalda la base de origen a un archivo temporal.
    2. La restaura en una base temporal nueva (falla si ya existe).
    3. Limpia la base temporal (comprueba antes que haya exactamente un Administrador).
    4. Respalda la base temporal limpia al archivo de salida.
    5. Elimina la base temporal y el archivo intermedio.

  La contraseña de MySQL se pide de forma oculta y solo vive en este proceso.
  El archivo de salida contiene el hash BCrypt del Administrador: entrégalo de forma privada
  (USB, mensaje directo); NUNCA lo subas a Git. Por eso la salida predeterminada está fuera
  del repositorio.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File database\entrega\Generar-BD-Entrega.ps1
  powershell -ExecutionPolicy Bypass -File database\entrega\Generar-BD-Entrega.ps1 -Usuario root -Salida C:\dev\entrega\noti_ice_local.sql
#>
param(
    [string]$Usuario = "root",
    [string]$Servidor = "localhost",
    [int]$Puerto = 3306,
    [string]$BaseOrigen = "portal_noticias_pruebas",
    [string]$BaseTemporal = "noti_ice_entrega_tmp",
    [string]$Salida = "C:\dev\entrega-noti-ice\noti_ice_local.sql",
    [string]$BinMySql = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
)

$ErrorActionPreference = "Stop"
$mysql = Join-Path $BinMySql "mysql.exe"
$mysqldump = Join-Path $BinMySql "mysqldump.exe"
foreach ($exe in $mysql, $mysqldump) {
    if (-not (Test-Path $exe)) { throw "No se encontró $exe. Indica la carpeta con -BinMySql." }
}
if ($BaseOrigen -eq "portal_noticias") { throw "No se usa la base original portal_noticias." }
if ($BaseTemporal -eq $BaseOrigen) { throw "La base temporal no puede ser la de origen." }

$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$salidaCompleta = [IO.Path]::GetFullPath($Salida)
if ($salidaCompleta.StartsWith($repo, [StringComparison]::OrdinalIgnoreCase)) {
    throw "La salida no puede quedar dentro del repositorio ($repo): contiene el hash del Administrador."
}

# Tablas de actividad que se vacían. Catálogos, roles y oferta académica se conservan.
$tablasActividad = @(
    "noticiascomentarios", "comentarios", "noticiasdocumentos", "noticias", "eventos",
    "notificacionesleidas", "usuariospreferencias", "ofertainscripcionesalumnos",
    "ofertasolicitudesdocentes", "gruposalumnos"
)

$seguro = Read-Host "Contraseña de MySQL para '$Usuario'" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($seguro)
$intermedio = Join-Path $env:TEMP ("noti_ice_origen_{0}.sql" -f [guid]::NewGuid().ToString("N"))
$baseCreada = $false

function Invoke-MySql([string]$base, [string]$sql) {
    $parametros = @("-h", $Servidor, "-P", $Puerto, "-u", $Usuario, "--default-character-set=utf8mb4", "-N", "-B")
    if ($base) { $parametros += @("-D", $base) }
    $resultado = $sql | & $mysql @parametros
    if ($LASTEXITCODE -ne 0) { throw "MySQL devolvió un error: $($resultado | Out-String)" }
    return $resultado
}

try {
    $env:MYSQL_PWD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)

    Write-Host "1/5 Comprobando origen '$BaseOrigen' en ${Servidor}:$Puerto..."
    $existeOrigen = Invoke-MySql "" "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='$BaseOrigen';"
    if ("$existeOrigen".Trim() -ne "1") { throw "No existe la base de origen '$BaseOrigen'." }
    $existeTemporal = Invoke-MySql "" "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='$BaseTemporal';"
    if ("$existeTemporal".Trim() -ne "0") { throw "Ya existe la base '$BaseTemporal'. Elimínala o usa otro -BaseTemporal." }

    Write-Host "2/5 Respaldando el origen a un archivo temporal..."
    & $mysqldump -h $Servidor -P $Puerto -u $Usuario --single-transaction --no-tablespaces `
        --set-gtid-purged=OFF --default-character-set=utf8mb4 --result-file="$intermedio" $BaseOrigen
    if ($LASTEXITCODE -ne 0) { throw "mysqldump falló al respaldar el origen." }

    Write-Host "3/5 Restaurando en la base temporal '$BaseTemporal'..."
    Invoke-MySql "" "CREATE DATABASE ``$BaseTemporal`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" | Out-Null
    $baseCreada = $true
    $rutaSource = $intermedio.Replace("\", "/")
    Invoke-MySql $BaseTemporal "SOURCE $rutaSource;" | Out-Null

    Write-Host "4/5 Limpiando la base temporal..."
    $admins = Invoke-MySql $BaseTemporal @"
SELECT COUNT(*) FROM usuarios u JOIN nombrerol r ON r.idRol = u.idRol
WHERE r.NombreRol = 'Administrador' AND u.Activo = 1;
"@
    if ("$admins".Trim() -ne "1") {
        throw "Se esperaba exactamente 1 Administrador activo y hay $("$admins".Trim()). No se generó la entrega."
    }

    $existentes = Invoke-MySql $BaseTemporal "SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE();"
    $vaciar = $tablasActividad | Where-Object { $existentes -contains $_ }
    $limpieza = "SET FOREIGN_KEY_CHECKS=0;`n"
    foreach ($t in $vaciar) { $limpieza += "DELETE FROM ``$t``;`n" }
    $limpieza += @"
DELETE u FROM usuarios u JOIN nombrerol r ON r.idRol = u.idRol
  WHERE NOT (r.NombreRol = 'Administrador' AND u.Activo = 1);
UPDATE usuarios SET TokenRecuperacionHash = NULL, TokenRecuperacionExpira = NULL;
SET FOREIGN_KEY_CHECKS=1;
"@
    Invoke-MySql $BaseTemporal $limpieza | Out-Null

    $conteo = @(
        "usuarios", "nombrerol", "catalogomateriasplanes", "ofertaperiodos", "ofertagrupos",
        "ofertaunidades", "ofertasesiones", "ofertadocentesunidad", "grupostipos"
    ) + $vaciar
    $sqlConteo = ($conteo | Where-Object { $existentes -contains $_ } |
        ForEach-Object { "SELECT '$_', COUNT(*) FROM ``$_``" }) -join " UNION ALL "
    Write-Host "`nContenido de la entrega:"
    Invoke-MySql $BaseTemporal "$sqlConteo;" | ForEach-Object { Write-Host ("  " + ($_ -replace "`t", ": ")) }

    Write-Host "`n5/5 Generando el archivo de entrega..."
    New-Item -ItemType Directory -Force -Path (Split-Path $salidaCompleta) | Out-Null
    & $mysqldump -h $Servidor -P $Puerto -u $Usuario --single-transaction --no-tablespaces `
        --set-gtid-purged=OFF --default-character-set=utf8mb4 --result-file="$salidaCompleta" $BaseTemporal
    if ($LASTEXITCODE -ne 0) { throw "mysqldump falló al generar la entrega." }

    $mb = [math]::Round((Get-Item $salidaCompleta).Length / 1MB, 2)
    Write-Host "`nListo: $salidaCompleta ($mb MB)"
    Write-Host "Contiene el hash del Administrador: compártelo en privado y nunca lo subas a Git."
}
finally {
    if ($baseCreada) {
        try { Invoke-MySql "" "DROP DATABASE ``$BaseTemporal``;" | Out-Null; Write-Host "Base temporal '$BaseTemporal' eliminada." }
        catch { Write-Warning "No se pudo eliminar la base temporal '$BaseTemporal': elimínala manualmente." }
    }
    if (Test-Path $intermedio) { Remove-Item $intermedio -Force }
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
