param([switch]$Install, [switch]$Background, [string]$RequestedVersion)
$ErrorActionPreference = 'Stop'
$repo = 'stasspasjuk-rgb/QuickWave'
$spicetify = (Get-Command spicetify.exe -ErrorAction Stop).Source
$config = & $spicetify -c
if ($LASTEXITCODE -ne 0 -or !$config) { throw 'Install Spicetify first.' }
$apps = Join-Path (Split-Path -Parent $config) 'CustomApps'
$app = Join-Path $apps 'quickwave'
$manifest = Join-Path $app 'manifest.json'

function Send-QuickWaveProgress($phase) {
    if (!$streamResponse) { return }
    try {
        $bytes = [Text.Encoding]::UTF8.GetBytes(('{ "phase": "' + $phase + '" }') + "`n")
        $streamResponse.OutputStream.Write($bytes, 0, $bytes.Length)
        $streamResponse.OutputStream.Flush()
    } catch {
        # A closed Spotify view does not interrupt an accepted installation.
    }
}

function Update-QuickWave {
    $release = Invoke-RestMethod -UseBasicParsing -TimeoutSec 20 -Headers @{'User-Agent'='QuickWave-Updater'} -Uri "https://raw.githubusercontent.com/$repo/main/release.json"
    if ($release.tag -notmatch '^v(\d+\.\d+\.\d+)$' -or $release.draft -or $release.prerelease) { return }
    $version = [version]$Matches[1]
    if ($RequestedVersion -and $release.tag -cne $RequestedVersion) { throw 'Release changed. Check for updates again.' }
    if (!$Install -and (Test-Path -LiteralPath $manifest)) {
        $installed = (Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json).version
        if ($installed -and [version]$installed -ge $version) { return }
    }
    $url = "https://github.com/$repo/releases/download/$($release.tag)/QuickWave-CustomApp.zip"
    if ($release.sha256 -notmatch '^[a-f0-9]{64}$') { throw 'Invalid QuickWave release checksum.' }
    $hash = $release.sha256
    $temp = Join-Path ([IO.Path]::GetTempPath()) ("QuickWave-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $temp | Out-Null
    $zip = Join-Path $temp 'app.zip'
    try {
        Send-QuickWaveProgress 'download'
        Invoke-WebRequest -UseBasicParsing -TimeoutSec 45 -Uri $url -OutFile $zip
        Send-QuickWaveProgress 'verify'
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
            Send-QuickWaveProgress 'apply'
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
    if (Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    }
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

$log = Join-Path $PSScriptRoot 'last-error.txt'
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add('http://127.0.0.1:46423/')
try {
    $listener.Start()
    while ($true) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $origin = $request.Headers['Origin']
        $restart = $false
        $streamResponse = $null
        try {
            if ($origin -cnotin @('https://xpui.app.spotify.com', 'https://open.spotify.com') -or
                $request.Url.AbsolutePath -cne '/update' -or $request.UserHostName -cne '127.0.0.1:46423') {
                $response.StatusCode = 403
                continue
            }
            $response.Headers['Access-Control-Allow-Origin'] = $origin
            $response.Headers['Vary'] = 'Origin'
            $response.Headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            $response.Headers['Access-Control-Allow-Headers'] = 'X-QuickWave-Version, X-QuickWave-Progress'
            $response.Headers['Access-Control-Allow-Private-Network'] = 'true'
            if ($request.HttpMethod -eq 'OPTIONS') { $response.StatusCode = 204; continue }
            $RequestedVersion = $request.Headers['X-QuickWave-Version']
            if ($request.HttpMethod -cne 'POST' -or $RequestedVersion -notmatch '^v\d+\.\d+\.\d+$') {
                $response.StatusCode = 400
                continue
            }
            $enabled = & $spicetify config custom_apps
            if ((($enabled -join '|') -split '\|') -notcontains 'quickwave') { throw 'QuickWave is disabled.' }
            $response.Headers['Access-Control-Expose-Headers'] = 'X-QuickWave-Restart-In'
            $response.Headers['X-QuickWave-Restart-In'] = '5'
            if ($request.Headers['X-QuickWave-Progress'] -eq '1') {
                $response.ContentType = 'application/x-ndjson; charset=utf-8'
                $response.SendChunked = $true
                $streamResponse = $response
            }
            Update-QuickWave
            if ($streamResponse) { Send-QuickWaveProgress 'done' }
            else { $response.StatusCode = 204 }
            $restart = $true
        } catch {
            if ($streamResponse) { Send-QuickWaveProgress 'error' }
            else { $response.StatusCode = 500 }
            Set-Content -LiteralPath $log -Value $_.Exception.Message -Encoding UTF8
        } finally {
            $response.Close()
        }
        if ($restart) {
            Start-Sleep -Seconds 5
            & $spicetify restart
        }
    }
} catch {
    Set-Content -LiteralPath $log -Value $_.Exception.Message -Encoding UTF8
    throw
} finally {
    $listener.Close()
}
