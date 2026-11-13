#!/bin/sh
set -eu

repo=https://github.com/stasspasjuk-rgb/QuickWave
for tool in spicetify curl unzip mktemp; do
    command -v "$tool" >/dev/null 2>&1 || { echo "Required command: $tool" >&2; exit 1; }
done
if command -v sha256sum >/dev/null 2>&1; then
    checksum() { sha256sum "$1"; }
elif command -v shasum >/dev/null 2>&1; then
    checksum() { shasum -a 256 "$1"; }
else
    echo 'Install sha256sum or shasum first.' >&2
    exit 1
fi

config=$(spicetify -c)
[ -f "$config" ] || { echo 'Spicetify configuration was not found.' >&2; exit 1; }
tmp=$(mktemp -d "${TMPDIR:-/tmp}/quickwave.XXXXXXXX")
trap 'rm -rf -- "$tmp"' EXIT
trap 'exit 1' HUP INT TERM
download() { curl -fsSL --retry 2 --connect-timeout 10 --max-time 90 "$1" -o "$2"; }
download https://raw.githubusercontent.com/stasspasjuk-rgb/QuickWave/main/release.json "$tmp/release.json"
tag=$(sed -nE 's/^[[:space:]]*"tag"[[:space:]]*:[[:space:]]*"(v[0-9]+\.[0-9]+\.[0-9]+)"[,]?[[:space:]]*$/\1/p' "$tmp/release.json")
hash=$(sed -nE 's/^[[:space:]]*"sha256"[[:space:]]*:[[:space:]]*"([a-f0-9]{64})"[,]?[[:space:]]*$/\1/p' "$tmp/release.json")
printf '%s\n' "$tag" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' && [ "${#hash}" -eq 64 ] ||
    { echo 'Invalid QuickWave release manifest.' >&2; exit 1; }
download "$repo/releases/download/$tag/QuickWave-CustomApp.zip" "$tmp/app.zip"
actual=$(checksum "$tmp/app.zip")
[ "${actual%% *}" = "$hash" ] || { echo 'QuickWave checksum mismatch.' >&2; exit 1; }

mkdir "$tmp/extracted"
unzip -q "$tmp/app.zip" 'quickwave/*' -d "$tmp/extracted"
source="$tmp/extracted/quickwave"
app="$(dirname "$config")/CustomApps/quickwave"
for file in index.js style.css quickwave.js manifest.json; do
    [ -s "$source/$file" ] || { echo "Missing $file in release." >&2; exit 1; }
done
mkdir -p "$app"
cp "$source/index.js" "$source/style.css" "$source/quickwave.js" "$source/manifest.json" "$app/"
spicetify config custom_apps quickwave
spicetify apply
printf 'QuickWave %s installed. Open QuickWave in Spotify.\n' "$tag"
