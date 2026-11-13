param([switch]$Install, [switch]$Background)
$ErrorActionPreference = 'Stop'
$repo = 'stasspasjuk-rgb/QuickWave'
$spicetify = (Get-Command spicetify.exe -ErrorAction Stop).Source
$config = & $spicetify -c
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
    $asset = @($release.assets | Where-Object name -CEQ 'QuickWave-CustomApp.zip')
    $url = "https://github.com/$repo/releases/download/$($release.tag_name)/QuickWave-CustomApp.zip"
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
        & $spicetify config custom_apps quickwave
        if ($LASTEXITCODE -ne 0) { throw 'Could not enable QuickWave.' }
        $files = 'index.js', 'style.css', 'quickwave.js', 'manifest.json'
        $previous = @{}
        foreach ($file in $files) {
            $target = Join-Path $app $file
            if (Test-Path -LiteralPath $target) { $previous[$file] = [IO.File]::ReadAllBytes($target) }
        }
        try {
            foreach ($file in $files) { Copy-Item -LiteralPath (Join-Path $source $file) -Destination $app -Force }
            & $spicetify -n apply
            if ($LASTEXITCODE -ne 0) { throw 'Spicetify apply failed.' }
        } catch {
            foreach ($file in $files) {
                $target = Join-Path $app $file
                if ($previous.ContainsKey($file)) { [IO.File]::WriteAllBytes($target, $previous[$file]) }
                elseif (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Force }
            }
            throw
        }
        Write-Host "QuickWave $version installed. Restart Spotify to load the update."
    } finally {
        if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
    }
}

function Register-QuickWaveUpdater {
    $folder = Join-Path (Split-Path -Parent $config) 'QuickWaveUpdater'
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    $scriptPath = Join-Path $folder 'Update-QuickWave.ps1'
    Copy-Item -LiteralPath $PSCommandPath -Destination $scriptPath -Force
    $launcher = Join-Path $folder 'Start-Hidden.vbs'
    @"
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""$scriptPath"" -Background", 0, True
"@ | Set-Content -LiteralPath $launcher -Encoding Unicode
    $account = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $name = "QuickWave Updater $sid"
    $action = New-ScheduledTaskAction -Execute (Join-Path $env:SystemRoot 'System32\wscript.exe') -Argument ('//B //Nologo "' + $launcher + '"')
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $account
    $principal = New-ScheduledTaskPrincipal -UserId $account -LogonType Interactive
    $settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
    Start-ScheduledTask -TaskName $name
}

if (!$Background) {
    Update-QuickWave
    if ($Install) { Register-QuickWaveUpdater }
    return
}

$session = (Get-Process -Id $PID).SessionId
$lastStart = $null
$log = Join-Path $PSScriptRoot 'last-error.txt'
while ($true) {
    $spotify = Get-Process -Name Spotify -ErrorAction SilentlyContinue |
        Where-Object { $_.SessionId -eq $session } |
        Sort-Object StartTime | Select-Object -First 1
    $started = if ($spotify) { "$($spotify.Id):$($spotify.StartTime.Ticks)" }
    if ($started -and $started -ne $lastStart) {
        try {
            $enabled = & $spicetify config custom_apps
            if (($enabled -join '|') -split '\|' -contains 'quickwave') { Update-QuickWave }
            if (Test-Path -LiteralPath $log) { Remove-Item -LiteralPath $log -Force }
        } catch {
            Set-Content -LiteralPath $log -Value $_.Exception.Message -Encoding UTF8
        }
    }
    $lastStart = $started
    Start-Sleep -Seconds 3
}