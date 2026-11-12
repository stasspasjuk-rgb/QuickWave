# QuickWave 1.0.0

Персональная волна для Spotify Desktop на Windows. В боковой панели появляется страница QuickWave с кнопкой запуска, выбором настроения, жанров и баланса между знакомым и новым.

| Запуск и очередь | Настроение, жанры и вкус |
| --- | --- |
| ![Запуск QuickWave и причина выбора следующего трека](media/wave.gif) | ![Выбор настроения, жанра и режима открытий](media/settings.gif) |

Интерфейс записан с демонстрационными треками и профилем.

## Установка

Установи [Spicetify](https://spicetify.app/docs/getting-started) для своей версии Spotify Desktop и войди в Spotify. Затем вставь этот блок в PowerShell. Он скачает [готовый ZIP](https://github.com/stasspasjuk-rgb/QuickWave/releases/latest) и установит QuickWave.

```powershell
& {
    $ErrorActionPreference = 'Stop'
    Get-Command spicetify | Out-Null
    $qwConfig = spicetify -c
    if ($LASTEXITCODE -ne 0 -or -not $qwConfig) { throw 'Spicetify config not found' }
    $qwApps = Join-Path (Split-Path -Parent $qwConfig) 'CustomApps'
    $qwTemp = Join-Path ([IO.Path]::GetTempPath()) ('QuickWave-' + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $qwTemp, $qwApps -Force | Out-Null
    $qwZip = Join-Path $qwTemp 'QuickWave.zip'
    Invoke-WebRequest -Uri 'https://github.com/stasspasjuk-rgb/QuickWave/releases/latest/download/QuickWave.zip' -OutFile $qwZip
    Expand-Archive -LiteralPath $qwZip -DestinationPath $qwTemp
    Copy-Item -LiteralPath (Join-Path $qwTemp 'quickwave') -Destination $qwApps -Recurse -Force
    spicetify config custom_apps quickwave
    if ($LASTEXITCODE -ne 0) { throw 'Could not enable QuickWave' }
    spicetify apply
    if ($LASTEXITCODE -ne 0) { throw 'Spicetify apply failed' }
}
```

Открой **QuickWave** в боковой панели Spotify. Выбери настроение и жанры, затем нажми **Включить волну**. Если Spotify уже играет, волна добавит трек в обычную очередь. Когда этот трек начнёт играть, QuickWave подберёт следующий.

Фоновое расширение подключается через манифест Custom App при старте Spotify. Настройки действуют при следующем добавлении. Кнопка остановки прекращает пополнение очереди. Уже добавленный трек можно убрать через очередь Spotify. Если используешь Drift, останови его волну перед запуском QuickWave, чтобы оба расширения не пополняли одну очередь одновременно.

При обновлении QuickWave повтори копирование и `spicetify apply`. Если обновление Spotify сняло изменения Spicetify, проверь совместимость версий и выполни `spicetify backup apply`. Для удаления из боковой панели выполни `spicetify config custom_apps quickwave-` и `spicetify apply`. Сбросить локальную историю можно из приложения до удаления.

## Откуда берутся рекомендации

- **Профиль.** QuickWave наблюдает плеер этого экземпляра Spotify Desktop на любой странице, даже когда волна выключена. Сохраняет статус «В любимых», фактически прошедшее время воспроизведения, число прослушиваний и ранних пропусков. Каждое повторное прослушивание учитывается отдельно. Пауза и скачок позиции при перемотке сами по себе не добавляют время.
- **Сигналы.** Прослушивание засчитывается после 30 секунд или половины короткого трека. Дослушивание даёт дополнительный вес после 75% длительности. Переход до 20 секунд или четверти короткого трека считается ранним пропуском. Оценки прошлых прослушиваний и пропусков теряют половину веса за 45 дней. Статус «В любимых» имеет отдельный постоянный вес.
- **Кандидаты.** QuickWave ищет плейлисты Spotify по выбранным жанрам, настроению и артистам из профиля. Дополняет выдачу недавно сохранёнными треками из медиатеки и знакомыми треками из профиля. Если понравившийся трек встречается в найденной подборке, соседние треки получают прибавку. При повторных прослушиваниях трека с известной жанровой подборкой жанр может стать поисковой подсказкой даже после снятия фильтра.
- **Ранжирование.** Совпадение с жанром даёт до +7, настроение +5, общая подборка с треком из профиля +3. Интерес к артисту, выбранный баланс, лайки и пропуски меняют баллы. Недавние треки и артисты получают штраф, а текущий трек и треки из очереди исключаются. Для разнообразия добавляется небольшая случайная поправка. Причина выбора видна на карточке.

## Ограничения Spotify

QuickWave использует плеер, очередь, медиатеку и поиск настольного клиента через Spicetify. В Spotify Web API для новых интеграций ограничены Recommendations, Related Artists и Audio Features. QuickWave обходится без них, OAuth-приложения и стороннего сервера. Жанр и настроение определяются по поиску плейлистов и могут совпадать приблизительно. Когда внутренний поиск меняется или недоступен, волна пробует подбирать из медиатеки и профиля. При исчерпании кандидатов она показывает статус и повторяет поиск, пока включена.

Профиль хранится в локальном хранилище этого клиента Spotify, до 2 000 треков. Настройки и история действуют для установки клиента. QuickWave видит только воспроизведение, которое отражается в наблюдаемом плеере. Старую историю, закрытый клиент и лайки неизвестных QuickWave треков вне доступной выборки он не импортирует. Для известных треков библиотека проверяется порциями, поэтому лайки вне плеера могут появиться с задержкой. Отключение обучения прекращает сбор. Распознанные приватные сессии пропускаются.

## Исходники

- `quickwave/index.js` — страница приложения.
- `quickwave/style.css` — оформление и анимация.
- `quickwave/quickwave.js` — фоновое наблюдение, профиль, рекомендации и очередь.
- `quickwave/manifest.json` — регистрация страницы и фонового расширения.

Документация: [Custom Apps](https://spicetify.app/docs/development/custom-apps), [Player](https://spicetify.app/docs/development/api-wrapper/methods/player), [очередь](https://spicetify.app/docs/development/api-wrapper/functions/add-to-queue), [ограничения Spotify Web API](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api).

QuickWave — самостоятельная реализация. [Drift for Spotify](https://github.com/mayl0o/drift-for-spotify) изучен как пример локального профиля и пополнения очереди.
