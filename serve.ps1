# Static file server for the portfolio (HTTP.sys HttpListener)
# - strips query strings; falls back to index.html on "/"
# - Cache-Control: no-cache for html/css/js so edits always reload
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = 'http://localhost:8765/'

$mimes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.webp' = 'image/webp'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Serving $root at $prefix"

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($rel -eq '/' -or $rel -eq '') { $rel = '/index.html' }
    $file = Join-Path $root ($rel.TrimStart('/') -replace '/', '\')

    if (Test-Path -LiteralPath $file -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($file).ToLower()
      $mime = if ($mimes.ContainsKey($ext)) { $mimes[$ext] } else { 'application/octet-stream' }
      $bytes = [IO.File]::ReadAllBytes($file)
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentType = $mime
      $ctx.Response.ContentLength64 = $bytes.Length
      if ($ext -in @('.html', '.css', '.js')) {
        $ctx.Response.Headers.Set('Cache-Control', 'no-cache, must-revalidate')
      }
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch {
    try { $ctx.Response.StatusCode = 500 } catch {}
  } finally {
    try { $ctx.Response.OutputStream.Close() } catch {}
  }
}
