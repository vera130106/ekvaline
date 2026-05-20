Add-Type -AssemblyName System.Drawing

$Files = @('one-bottle.png', 'two-bottles.png', 'five-bottles.png')
$assets = Join-Path $PSScriptRoot '..' 'assets' | Resolve-Path

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

foreach ($name in $Files) {
  $path = Join-Path $assets $name
  if (-not (Test-Path $path)) { continue }

  $src = [System.Drawing.Bitmap]::FromFile($path)
  $threshold = 248

  $left = 0
  while ($left -lt $src.Width - 2 -and (Get-ColumnAvg $src $left) -lt $threshold) { $left++ }

  $right = $src.Width - 1
  while ($right -gt $left + 2 -and (Get-ColumnAvg $src $right) -lt $threshold) { $right-- }

  $top = 0
  while ($top -lt $src.Height - 2 -and (Get-RowAvg $src $top) -lt $threshold) { $top++ }

  $bottom = $src.Height - 1
  while ($bottom -gt $top + 2 -and (Get-RowAvg $src $bottom) -lt $threshold) { $bottom-- }

  $w = $right - $left + 1
  $h = $bottom - $top + 1

  if ($w -ge $src.Width -and $h -ge $src.Height) {
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
