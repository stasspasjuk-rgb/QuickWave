param([switch]$Install, [switch]$Watch)
$ErrorActionPreference = 'Stop'
$repo = 'stasspasjuk-rgb/QuickWave'
$config = spicetify -c
if ($LASTEXITCODE -ne 0 -or !$config) { throw 'Install Spicetify first.' }
$apps = Join-Path (Split-Path -Parent $config) 'CustomApps'
$app = Join-Path $apps 'quickwave'
$manifest = Join-Path $app 'manifest.json'

function Update-QuickWave {
    $release = Invoke-RestMethod -UseBasicParsing -TimeoutSec 20 -Headers @{'User-Agent'='QuickWave-Updater'} -Uri "https://api.github.com/repos/$repo/releases/latest"
    if ($release.tag_name -notmatch '^v(\d+\.\d+\.\d+)$' -or $release.draft -or $release.prerelease) { return }
    $version = [version]$Matches[1]
    if (!$Install -and (Test-Path -LiteralPath $manifest)) {
        $installed = (Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json).version
        if ($installed -and [version]$installed -ge $version) { return }
    }
    $asset = @($release.assets | Where-Object name -CEQ 'QuickWave-Spicetify.zip')
    $url = "https://github.com/$repo/releases/download/$($release.tag_name)/QuickWave-Spicetify.zip"
    if ($asset.Count -ne 1 -or $asset[0].browser_download_url -cne $url -or $asset[0].digest -notmatch '^sha256:([a-f0-9]{64})$') { throw 'Spicetify release asset unavailable.' }
    $hash = $Matches[1]
    $temp = Join-Path ([IO.Path]::GetTempPath()) ("QuickWave-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $temp | Out-Null
    $zip = Join-Path $temp 'app.zip'
    try {
        Invoke-WebRequest -UseBasicParsing -TimeoutSec 45 -Uri $url -OutFile $zip
        if ((Get-FileHash -LiteralPath $zip).Hash -ne $hash) { throw 'QuickWave checksum mismatch.' }
        Expand-Archive -LiteralPath $zip -DestinationPath $temp
        $source = Join-Path $temp 'quickwave'
        $metadata = Get-Content -LiteralPath (Join-Path $source 'manifest.json') -Raw | ConvertFrom-Json
        if ($metadata.version -ne $version.ToString()) { throw 'Unexpected QuickWave version.' }
        New-Item -ItemType Directory -Path $app -Force | Out-Null
        Copy-Item -LiteralPath (Join-Path $source 'index.js') -Destination $app -Force
        Copy-Item -LiteralPath (Join-Path $source 'manifest.json') -Destination $app -Force
        spicetify config custom_apps quickwave
        if ($LASTEXITCODE -ne 0) { throw 'Could not enable QuickWave.' }
        spicetify -n apply
        if ($LASTEXITCODE -ne 0) { throw 'Spicetify apply failed. Run spicetify apply to retry.' }
        Write-Host "QuickWave $version installed. Restart Spotify to load the update."
    } finally {
        if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
    }
}

Update-QuickWave
if ($Watch) {
    $Install = $false
    Write-Host 'Checking GitHub every 5 minutes. Keep this window open.'
    while ($true) {
        Start-Sleep -Seconds 300
        try { Update-QuickWave } catch { Write-Warning $_.Exception.Message }
    }
}
