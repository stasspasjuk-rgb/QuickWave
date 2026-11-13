param([switch]$CheckOnce)

$ErrorActionPreference = 'Stop'
$repository = 'stasspasjuk-rgb/QuickWave'
$page = Join-Path $PSScriptRoot 'QuickWave.html'
$versionPattern = '<meta name="quickwave-version" content="(\d+\.\d+\.\d+)">'

function Get-QuickWaveVersion($path) {
    $match = [regex]::Match([IO.File]::ReadAllText($path), $versionPattern)
    if (!$match.Success) { throw 'QuickWave.html version is missing' }
    [version]$match.Groups[1].Value
}

function Update-QuickWave {
    $installed = Get-QuickWaveVersion $page
    $headers = @{ 'User-Agent' = 'QuickWave-Updater'; Accept = 'application/vnd.github+json' }
    $release = Invoke-RestMethod -UseBasicParsing -TimeoutSec 20 -Headers $headers -Uri "https://api.github.com/repos/$repository/releases/latest"
    if ($release.draft -or $release.prerelease -or $release.tag_name -notmatch '^v(\d+\.\d+\.\d+)$') { return }
    $available = [version]$Matches[1]
    if ($available -le $installed) { return }
    $asset = @($release.assets | Where-Object { $_.name -ceq 'QuickWave.html' })
    $download = "https://github.com/$repository/releases/download/$($release.tag_name)/QuickWave.html"
    if ($asset.Count -ne 1 -or $asset[0].browser_download_url -cne $download -or
        $asset[0].digest -notmatch '^sha256:([0-9a-f]{64})$') {
        throw 'The release is missing a verified QuickWave.html asset'
    }
    $digest = $Matches[1]
    $temporary = Join-Path $PSScriptRoot ('.quickwave-' + [guid]::NewGuid() + '.tmp')
    $backup = "$temporary.bak"
    try {
        Invoke-WebRequest -UseBasicParsing -TimeoutSec 45 -Uri $download -OutFile $temporary
        if ((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash -ne $digest -or
            (Get-QuickWaveVersion $temporary) -ne $available) { throw 'Release file verification failed' }
        [IO.File]::Replace($temporary, $page, $backup)
        Write-Host "QuickWave $available installed. Reload the browser tab to use the new version."
    } finally {
        if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
        if ((Test-Path -LiteralPath $page) -and (Test-Path -LiteralPath $backup)) {
            Remove-Item -LiteralPath $backup -Force
        }
    }
}

if (!(Test-Path -LiteralPath $page -PathType Leaf)) { throw 'Extract the full QuickWave ZIP before launching' }
$lockPath = Join-Path $PSScriptRoot '.quickwave-update.lock'
try {
    $lock = [IO.File]::Open($lockPath, [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
} catch [IO.IOException] {
    if (!$CheckOnce) { Start-Process -FilePath $page }
    exit
}
try {
    try { Update-QuickWave } catch { Write-Warning $_.Exception.Message }
    if (!$CheckOnce) {
        Start-Process -FilePath $page
        Write-Host 'QuickWave checks GitHub every 5 minutes while this window is open.'
        while ($true) {
            Start-Sleep -Seconds 300
            try { Update-QuickWave } catch { Write-Warning $_.Exception.Message }
        }
    }
} finally {
    $lock.Dispose()
}
