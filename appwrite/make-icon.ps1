Add-Type -AssemblyName System.Drawing
$sizes = @(128, 256, 512)
$brand = [System.Drawing.Color]::FromArgb(255, 92, 158, 173)
$accent = [System.Drawing.Color]::FromArgb(255, 156, 219, 137)
$bg = [System.Drawing.Color]::FromArgb(255, 16, 40, 48)

foreach ($size in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  # Rounded square background with gradient
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $radius = [int]($size * 0.22)
  $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
  $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
  $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
  $path.CloseFigure()
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bg, $brand, 45)
  $g.FillPath($bgBrush, $path)

  # Clock face (centered ring)
  $cx = $size / 2
  $cy = $size / 2
  $ringRadius = $size * 0.30
  $ringWidth = $size * 0.06
  $ringPen = New-Object System.Drawing.Pen $accent, $ringWidth
  $g.DrawEllipse($ringPen, $cx - $ringRadius, $cy - $ringRadius, $ringRadius * 2, $ringRadius * 2)

  # Clock hands
  $hourLen = $ringRadius * 0.55
  $minLen = $ringRadius * 0.78
  $hourPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($size * 0.045)
  $hourPen.StartCap = 'Round'
  $hourPen.EndCap = 'Round'
  $minPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($size * 0.035)
  $minPen.StartCap = 'Round'
  $minPen.EndCap = 'Round'
  $g.DrawLine($hourPen, $cx, $cy, $cx, $cy - $hourLen)
  $g.DrawLine($minPen, $cx, $cy, $cx + $minLen, $cy)

  # Center dot
  $dotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $dotSize = $size * 0.07
  $g.FillEllipse($dotBrush, $cx - $dotSize/2, $cy - $dotSize/2, $dotSize, $dotSize)

  $g.Dispose()
  $outPath = "D:\harendra\work-tracker\media\icon-$size.png"
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Saved $outPath"
}

# Save the 256 as the main icon.png
Copy-Item "D:\harendra\work-tracker\media\icon-256.png" "D:\harendra\work-tracker\media\icon.png" -Force
Write-Host "Saved main icon.png"
