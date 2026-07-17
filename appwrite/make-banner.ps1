Add-Type -AssemblyName System.Drawing
$w = 1280
$h = 320
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Gradient background
$bg = [System.Drawing.Color]::FromArgb(255, 16, 40, 48)
$brand = [System.Drawing.Color]::FromArgb(255, 92, 158, 173)
$accent = [System.Drawing.Color]::FromArgb(255, 156, 219, 137)
$warm = [System.Drawing.Color]::FromArgb(255, 224, 180, 80)
$rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bg, $brand, 30)
$g.FillRectangle($bgBrush, $rect)

# Decorative circles
$c1Brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 255, 255, 255))
$g.FillEllipse($c1Brush, $w - 200, -100, 400, 400)
$c2Brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30, 255, 255, 255))
$g.FillEllipse($c2Brush, 0, $h - 120, 300, 300)

# Draw mini clock icon on the left
$cx = 160
$cy = $h / 2
$ringRadius = 90
$ringWidth = 12
$ringPen = New-Object System.Drawing.Pen $accent, $ringWidth
$g.DrawEllipse($ringPen, $cx - $ringRadius, $cy - $ringRadius, $ringRadius * 2, $ringRadius * 2)
$hourPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 7
$hourPen.StartCap = 'Round'
$hourPen.EndCap = 'Round'
$minPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 5
$minPen.StartCap = 'Round'
$minPen.EndCap = 'Round'
$g.DrawLine($hourPen, $cx, $cy, $cx, $cy - 55)
$g.DrawLine($minPen, $cx, $cy, $cx + 75, $cy)
$dotBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$g.FillEllipse($dotBrush, $cx - 7, $cy - 7, 14, 14)

# Title
$titleFont = New-Object System.Drawing.Font("Segoe UI", 56, [System.Drawing.FontStyle]::Bold)
$titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$titleRect = New-Object System.Drawing.RectangleF 300, 70, 900, 100
$g.DrawString("Work Tracker", $titleFont, $titleBrush, $titleRect)

# Subtitle
$subFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular)
$subBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 200, 230, 235))
$subRect = New-Object System.Drawing.RectangleF 300, 170, 900, 50
$g.DrawString("Daily coding time, beautifully tracked.", $subFont, $subBrush, $subRect)

# Tagline
$tagFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
$tagBrush = New-Object System.Drawing.SolidBrush $accent
$tagRect = New-Object System.Drawing.RectangleF 300, 230, 900, 40
$g.DrawString("Time per project  ·  per language  ·  per day  ·  goals  ·  streaks", $tagFont, $tagBrush, $tagRect)

$g.Dispose()
$outPath = "D:\harendra\work-tracker\media\banner.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Saved $outPath"
