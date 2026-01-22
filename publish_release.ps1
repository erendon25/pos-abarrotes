# Script para automatizar la actualización de versión y publicación en GitHub
# Uso: .\publish_release.ps1

param (
    [string]$Version,
    [string]$Token
)

# 1. Solicitar Versión si no se pasó como argumento
if (-not $Version) {
    $CurrentVersion = (Get-Content package.json | ConvertFrom-Json).version
    Write-Host "La versión actual es: $CurrentVersion" -ForegroundColor Cyan
    $Version = Read-Host "Ingresa la nueva versión (ej. 1.1.3)"
}

if (-not $Version) {
    Write-Error "Se requiere una versión."
    exit 1
}

# 2. Solicitar Token si no existe en variables de entorno ni argumento
if (-not $Token -and -not $env:GH_TOKEN) {
    Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "Se requiere un Token de Acceso Personal (PAT) de GitHub." -ForegroundColor Yellow
    Write-Host "1. Ve a: https://github.com/settings/tokens"
    Write-Host "2. Genera un nuevo token (Classic)"
    Write-Host "3. Marca el permiso 'repo' (Full control of private repositories)"
    Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
    $Token = Read-Host "Pega tu GitHub Token aquí"
    $env:GH_TOKEN = $Token
} elseif ($Token) {
    $env:GH_TOKEN = $Token
}

# 3. Actualizar package.json (Usando Regex para mantener formato)
$params = @{
    Path = "package.json"
    Pattern = '"version":\s*".*?"'
    Value = """version"": ""$Version"""
}
$content = Get-Content "package.json" -Raw
if ($content -match '"version":\s*".*?"') {
    $newContent = $content -replace '"version":\s*".*?"', """version"": ""$Version"""
    Set-Content -Path "package.json" -Value $newContent
    Write-Host "package.json actualizado a la versión $Version" -ForegroundColor Green
} else {
    Write-Error "No se pudo encontrar el campo versión en package.json"
    exit 1
}

# 4. Ejecutar Build y Publicar
Write-Host "Iniciando compilación y subida a GitHub Releases..." -ForegroundColor Cyan
Write-Host "Esto puede tomar unos minutos..."

# Ejecutamos el comando de build pasando el flag --publish always
# electron-builder detectará la variable GH_TOKEN automáticamente
npm run electron:build -- --publish always

if ($LASTEXITCODE -eq 0) {
    Write-Host "¡Éxito! El release se ha subido a GitHub." -ForegroundColor Green
    Write-Host "Verifica en: https://github.com/erendon25/pos-abarrotes/releases" -ForegroundColor Green
} else {
    Write-Host "Hubo un error durante el proceso." -ForegroundColor Red
}
