<p align="center"><img src="media/logo.svg" width="96" alt="Логотип QuickWave"></p>

# QuickWave 2.4.6

Персональная волна в Spotify Desktop через Spicetify. Запускай подбор с главного экрана, меняй настроение и жанры в боковой панели или разворачивай волну на весь экран.

[Релиз 2.4.6](https://github.com/stasspasjuk-rgb/QuickWave/releases/tag/v2.4.6) · [Скачать ZIP](https://github.com/stasspasjuk-rgb/QuickWave/releases/download/v2.4.6/QuickWave-CustomApp.zip) · [Telegram](https://t.me/QuickDeveloper_bot)

## Установка и обновление на Windows

1. Установи [Spotify Desktop](https://www.spotify.com/download/windows/) и настрой [Spicetify](https://spicetify.app/docs/getting-started).
2. Вставь весь блок в PowerShell. Он установит актуальный релиз и зарегистрирует скрытый помощник обновлений.

```powershell
$installer = Join-Path $env:TEMP ('QuickWave-' + [guid]::NewGuid() + '.ps1')
try {
    Invoke-WebRequest -UseBasicParsing 'https://github.com/stasspasjuk-rgb/QuickWave/releases/download/v2.4.6/Update-QuickWave.ps1' -OutFile $installer -ErrorAction Stop
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer -Install
    if ($LASTEXITCODE -ne 0) { throw 'Установка QuickWave не завершилась' }
} finally {
    if (Test-Path -LiteralPath $installer) { Remove-Item -LiteralPath $installer -Force }
}
```

3. Перезапусти Spotify и открой **QuickWave** в боковой панели.

При переходе с 2.4.5 или более ранней версии выполни этот блок один раз. Он заменит старый помощник, который обращался к GitHub REST API и мог получать ошибку лимита. Новый читает файл версии из репозитория и сверяет SHA-256 ZIP перед установкой. Окно PowerShell после установки можно закрыть.

## Интерфейс

- **Включить волну** добавляет треки по одному в обычную очередь Spotify. Очередь доступна через штатную кнопку плеера.
- **Настроить** открывает панель справа. Карточки настроения и жанров подсвечиваются анимированными градиентами.
- **Кнопка с уголками** вверху справа включает полноэкранный режим. Повторное нажатие или **Esc** возвращает обычный вид.

| Вкладка | Что в ней |
| --- | --- |
| **Настроение** | Настроение и режим вкуса — баланс, знакомое или открытия. |
| **Жанры** | Иллюстрированные карточки жанров. Можно выбрать до пяти, включая свои. |
| **Профиль** | Статистика локального профиля, переключатель сбора прослушиваний и сброс истории. |
| **Ещё** | Волна по текущей песне, предпросмотр тем, фона и цвета волны, Telegram и проверка обновлений. |

Изменения настроения, вкуса и жанров влияют на следующий подбор. Волна пульсирует по меткам бита, если клиент Spotify их предоставляет, и замирает на паузе.

## Следующие обновления

Открой **Настроить → Ещё → Проверить обновления**. Если доступен новый релиз, выбери **Обновить** или **Позже**. На Windows помощник применит обновление и перезапустит Spotify после подтверждения.

## Совместимость и ручная установка

| Устройство | Поддержка |
| --- | --- |
| Windows, Spotify Desktop + Spicetify | Установка через PowerShell и обновление из приложения |
| macOS и Linux, Spotify Desktop + Spicetify | Ручная установка. Совместимость отдельно не проверена |
| Android, iOS и веб-плеер | Custom App не поддерживается |

Для ручной установки распакуй ZIP и скопируй папку `quickwave` в `CustomApps` рядом с конфигурацией, путь к которой показывает `spicetify -c`. Затем выполни:

```sh
spicetify config custom_apps quickwave
spicetify apply
```

## Как работает подбор

QuickWave ищет кандидатов в медиатеке и тематических подборках Spotify. Лайки и долгие прослушивания увеличивают вес знакомого звучания. Ранние пропуски снижают оценку, а недавно звучавшие треки и артисты получают меньший приоритет. Профиль хранится в клиенте и управляется во вкладке **Профиль**.

Доступность отдельных функций зависит от версии Spotify, региона и аккаунта. [Пользовательские правила Spotify](https://www.spotify.com/us/legal/user-guidelines/)
