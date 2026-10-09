# Voices each line in lines.json with a built-in Windows voice into WAV files.
# Called by make-interim-audio.mjs.  Args: <lines.json> <out dir> <rate>
param([string]$linesPath, [string]$outDir, [int]$rate = -5)
Add-Type -AssemblyName System.Speech
$lines = Get-Content -Raw -Encoding UTF8 $linesPath | ConvertFrom-Json
# Person in charge = female voice (matches the interim drawing); narrator = male voice; model = a third voice.
$voiceFor = @{ PIC = "Microsoft Zira Desktop"; NAR = "Microsoft David Desktop"; MOD = "Microsoft Zira Desktop" }
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
foreach ($l in $lines) {
  $syn = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $syn.SelectVoice($voiceFor[$l.role])
  $syn.Rate = $rate
  $wav = Join-Path $outDir ($l.file -replace '\.mp3$', '.wav')
  $syn.SetOutputToWaveFile($wav, $fmt)
  # Curly quotes and dashes are read as pauses, not spoken.
  $t = $l.text.Replace([string][char]0x2018, "'").Replace([string][char]0x2019, "'").Replace([string][char]0x2014, ",")
  $syn.Speak($t)
  $syn.Dispose()
}
