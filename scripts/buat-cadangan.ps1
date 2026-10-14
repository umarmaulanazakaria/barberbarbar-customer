$ErrorActionPreference = 'Stop'
$akarCustomer = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$akarStage = [IO.Path]::GetFullPath((Join-Path $akarCustomer '..'))
$jalurArsip = Join-Path $akarStage 'BARBERBARBAR-F12-CUSTOMER-APP.zip'
if (Test-Path -LiteralPath $jalurArsip) { throw 'ZIP sudah ada. Pertahankan backup lama; pilih lokasi baru sebelum menjalankan ulang.' }
$safeCustomer = $akarCustomer.Replace('\','/')
$statusCustomer = & git -c "safe.directory=$safeCustomer" -C $akarCustomer status --porcelain
if ($LASTEXITCODE -ne 0 -or $statusCustomer) { throw 'Working tree harus bersih dan commit dibuat sebelum ZIP.' }
$commitCustomer = & git -c "safe.directory=$safeCustomer" -C $akarCustomer rev-parse HEAD
$berkasCustomer = & git -c "safe.directory=$safeCustomer" -C $akarCustomer ls-files
if ($LASTEXITCODE -ne 0 -or -not $berkasCustomer) { throw 'Daftar source tracked tidak tersedia.' }
foreach ($berkas in $berkasCustomer) {
 if ($berkas -match '(^|/)(node_modules|\.git|dist|\.expo|backup-database)(/|$)' -or ($berkas -match '(^|/)\.env($|\.)' -and $berkas -ne '.env.example') -or $berkas -match '\.(dump|sql|pem|key)$') { throw "Berkas terlarang: $berkas" }
 $absolut = [IO.Path]::GetFullPath((Join-Path $akarCustomer $berkas))
 if (-not $absolut.StartsWith($akarCustomer + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Source keluar dari folder aplikasi.' }
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipCustomer = [IO.Compression.ZipFile]::Open($jalurArsip, [IO.Compression.ZipArchiveMode]::Create)
try { foreach ($berkas in $berkasCustomer) { [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipCustomer, (Join-Path $akarCustomer $berkas), ('barberbarbar-customer/' + $berkas.Replace('\','/')), [IO.Compression.CompressionLevel]::Optimal) | Out-Null } }
finally { $zipCustomer.Dispose() }
$hasilEntry = @()
$bacaCustomer = [IO.Compression.ZipFile]::OpenRead($jalurArsip)
try {
 if ($bacaCustomer.Entries.Count -ne $berkasCustomer.Count) { throw 'Jumlah entry berbeda.' }
 foreach ($entry in $bacaCustomer.Entries) {
  $relatif = $entry.FullName.Substring('barberbarbar-customer/'.Length)
  if ($relatif -notin $berkasCustomer) { throw 'Entry tidak ada pada daftar source.' }
  $stream = $entry.Open(); $sha = [Security.Cryptography.SHA256]::Create()
  try { $hashEntry = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() } finally { $stream.Dispose(); $sha.Dispose() }
  $source = Join-Path $akarCustomer $relatif
  if ($hashEntry -ne (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant() -or $entry.Length -ne (Get-Item -LiteralPath $source).Length) { throw "Checksum/ukuran berbeda: $relatif" }
  $hasilEntry += [PSCustomObject]@{ path=$entry.FullName; bytes=$entry.Length; sha256=$hashEntry }
 }
} finally { $bacaCustomer.Dispose() }
$hashZip = (Get-FileHash -LiteralPath $jalurArsip -Algorithm SHA256).Hash.ToLowerInvariant()
$manifest = [PSCustomObject]@{ commit=$commitCustomer; archive=(Split-Path $jalurArsip -Leaf); sha256=$hashZip; entries=$hasilEntry }
[IO.File]::WriteAllText($jalurArsip + '.manifest.json', ($manifest | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText($jalurArsip + '.sha256', ($hashZip + '  ' + (Split-Path $jalurArsip -Leaf)), [Text.UTF8Encoding]::new($false))
Write-Output "PASS ZIP: $($hasilEntry.Count) entry identik dengan source commit $commitCustomer"
Write-Output "SHA256: $hashZip"
