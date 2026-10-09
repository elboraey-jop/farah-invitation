$output = Join-Path (Split-Path -Parent $PSScriptRoot) 'public\assets\music\placeholder.wav'
$sampleRate = 44100
$seconds = 4
$channels = 1
$bits = 16
$samples = $sampleRate * $seconds
$dataSize = $samples * $channels * ($bits / 8)

$stream = [System.IO.File]::Open($output, [System.IO.FileMode]::Create)
$writer = [System.IO.BinaryWriter]::new($stream)
$writer.Write([Text.Encoding]::ASCII.GetBytes('RIFF'))
$writer.Write([int](36 + $dataSize))
$writer.Write([Text.Encoding]::ASCII.GetBytes('WAVEfmt '))
$writer.Write([int]16)
$writer.Write([int16]1)
$writer.Write([int16]$channels)
$writer.Write([int]$sampleRate)
$writer.Write([int]($sampleRate * $channels * ($bits / 8)))
$writer.Write([int16]($channels * ($bits / 8)))
$writer.Write([int16]$bits)
$writer.Write([Text.Encoding]::ASCII.GetBytes('data'))
$writer.Write([int]$dataSize)

for ($i = 0; $i -lt $samples; $i++) {
  $t = $i / $sampleRate
  $envelope = [Math]::Min(1, $t * 8) * [Math]::Min(1, ($seconds - $t) * 8)
  $sample = [Math]::Sin(2 * [Math]::PI * 220 * $t) * 0.12 + [Math]::Sin(2 * [Math]::PI * 330 * $t) * 0.08
  $writer.Write([int16]($sample * $envelope * 32767))
}

$writer.Dispose()
$stream.Dispose()
Write-Output 'Created placeholder audio.'
