Add-Type -AssemblyName System.Drawing

$Files = @(
  'one-bottle.png',
  'two-bottles.png',
  'five-bottles.png',
  'product-18-9-white.png',
  'product-18-9.png',
  'product-2-4.png',
  'product-5.png'
)
$assets = (Resolve-Path (Join-Path (Join-Path $PSScriptRoot '..') 'assets')).Path

function Get-ColumnAvg([System.Drawing.Bitmap]$bmp, [int]$x) {
  $sum = 0.0
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $c = $bmp.GetPixel($x, $y)
    $sum += ($c.R + $c.G + $c.B) / 3.0
  }
  return $sum / $bmp.Height
}

function Get-RowAvg([System.Drawing.Bitmap]$bmp, [int]$y) {
  $sum = 0.0
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $c = $bmp.GetPixel($x, $y)
    $sum += ($c.R + $c.G + $c.B) / 3.0
  }
  return $sum / $bmp.Width
}

function ShouldStripEdgeRow([System.Drawing.Bitmap]$bmp, [int]$y, [int]$edgeMax = 6, [int]$darkMax = 45) {
  $dist = [Math]::Min($y, $bmp.Height - 1 - $y)
  if ($dist -gt $edgeMax) { return $false }
  $avg = Get-RowAvg $bmp $y
  if ($avg -lt 240) { return $true }
  $dark = 0
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.R -le $darkMax -and $c.G -le $darkMax -and $c.B -le $darkMax) { $dark++ }
  }
  return ($dark / [double]$bmp.Width) -gt 0.02
}

foreach ($name in $Files) {
  $path = Join-Path $assets $name
  if (-not (Test-Path $path)) {
    Write-Host "$name skip (missing)"
    continue
  }

  $src = [System.Drawing.Bitmap]::FromFile($path)
  $threshold = 248

  $left = 0
  while ($left -lt $src.Width - 2 -and (Get-ColumnAvg $src $left) -lt $threshold) { $left++ }

  $right = $src.Width - 1
  while ($right -gt $left + 2 -and (Get-ColumnAvg $src $right) -lt $threshold) { $right-- }

  $top = 0
  while ($top -lt $src.Height - 2 -and ((Get-RowAvg $src $top) -lt $threshold -or (ShouldStripEdgeRow $src $top))) { $top++ }

  $bottom = $src.Height - 1
  while ($bottom -gt $top + 2 -and ((Get-RowAvg $src $bottom) -lt $threshold -or (ShouldStripEdgeRow $src $bottom))) { $bottom-- }

  $w = $right - $left + 1
  $h = $bottom - $top + 1

  if ($w -lt 8 -or $h -lt 8 -or ($w -ge $src.Width -and $h -ge $src.Height)) {
    $src.Dispose()
    Write-Host "$name ok"
    continue
  }

  $dst = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $srcRect = New-Object System.Drawing.Rectangle $left, $top, $w, $h
  $dstRect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
  $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $src.Dispose()

  $tmp = "$path.tmp"
  $dst.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  $dst.Dispose()
  Move-Item -Force $tmp $path
  Write-Host "$name trimmed to ${w}x${h} (L=$left T=$top)"
}
