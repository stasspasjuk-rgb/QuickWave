# QuickWave для Spicetify

QuickWave открывается внутри Spotify Desktop из боковой панели. Подбор учитывает жанры, настроение и оценки в самом QuickWave.

[Скачать ZIP](https://github.com/stasspasjuk-rgb/QuickWave/releases/latest/download/QuickWave-CustomApp.zip) · [История версий](https://github.com/stasspasjuk-rgb/QuickWave/releases)

## Установка на Windows

Установи [Spicetify](https://spicetify.app/docs/getting-started), затем вставь этот блок в PowerShell.

```powershell
$installer = Join-Path $env:TEMP 'Update-QuickWave.ps1'
Invoke-WebRequest -UseBasicParsing 'https://github.com/stasspasjuk-rgb/QuickWave/releases/latest/download/Update-QuickWave.ps1' -OutFile $installer -ErrorAction Stop
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer -Install
```

Перезапусти Spotify и открой **QuickWave** в боковой панели. Установщик один раз регистрирует скрытую задачу Windows. После этого закрой PowerShell. При каждом запуске Spotify помощник проверяет GitHub. Если есть обновление, оно скачивается и применяется в фоне. Новая версия загрузится при следующем запуске Spotify.

Вручную можно распаковать ZIP, скопировать папку `quickwave` в `CustomApps` рядом с файлом из `spicetify -c`, затем выполнить `spicetify config custom_apps quickwave` и `spicetify apply`. Для фонового обновления выполни установку из PowerShell один раз.

## Возможности

- **Моя волна** пополняет обычную очередь Spotify. Можно выбрать настроение, режим вкуса и до пяти жанров, включая свои.
- **Профиль на этом компьютере** учитывает лайки, пропуски и длительность прослушивания. Сбор можно выключить, а профиль очистить прямо в приложении.
- **Оформление** переключает четыре цветовые темы. Иконки интерфейса выполнены в SVG.

QuickWave использует функции настольного клиента через Spicetify. Доступность поиска и очереди зависит от версии Spotify. Локальный профиль и модификации клиента подпадают под применимые условия Spotify.

[Правила Spotify для разработчиков](https://developer.spotify.com/policy) · [Пользовательские правила Spotify](https://www.spotify.com/us/legal/user-guidelines/)