function render() {
  return Spicetify.React.createElement(QuickWavePage);
}

async function startSongWave(track) {
  const url = "https://spclient.wg.spotify.com/inspiredby-mix/v2/seed_to_playlist/" + track.uri + "?response-format=json";
  const result = await Spicetify.CosmosAsync.get(url);
  const playlist = result?.mediaItems?.[0]?.uri;
  if (!/^spotify:playlist:[A-Za-z0-9]{22}$/.test(playlist)) throw new Error("Подборка недоступна");
  await Spicetify.Player.playUri(playlist);
}

const quickWaveVersion = "2.4.0";

async function quickWaveRelease() {
  const response = await fetch("https://api.github.com/repos/stasspasjuk-rgb/QuickWave/releases/latest", {signal:AbortSignal.timeout(12000)});
  if (!response.ok) throw new Error("GitHub не ответил");
  const release = await response.json();
  if (!/^v\d+\.\d+\.\d+$/.test(release.tag_name) || release.draft || release.prerelease) return null;
  const installed = quickWaveVersion.split(".").map(Number);
  const latest = release.tag_name.slice(1).split(".").map(Number);
  const first = latest.findIndex((part,i)=>part!==installed[i]);
  return first>=0 && latest[first]>installed[first] ? release.tag_name : null;
}

const waveIcons={
  play:"M8 5l12 7-12 7z",stop:"M7 7h10v10H7z",
  song:"M2 12h4l3-7 5 14 4-10 2 3h2",
  settings:"M4 7h16M4 17h16M8 4v6m8 4v6"
};
const waveThemes=["violet","ocean","ember","forest"];

function QuickWavePage() {
  const { createElement: h, useEffect, useState, useRef } = Spicetify.React;
  const [state, setState] = useState(null);
  const [custom, setCustom] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [track, setTrack] = useState(Spicetify.Player?.data?.item);
  const [theme, setTheme] = useState(()=>Spicetify.LocalStorage.get("quickwave:theme")||"violet");
  const [showTheme, setShowTheme] = useState(false);
  const [notice, setNotice] = useState("");
  const [release, setRelease] = useState(null);
  const [updateStage, setUpdateStage] = useState("");
  const orb = useRef(null);
  const updateBusy = useRef(false);
  async function checkUpdates(quiet=false) {
    if(updateBusy.current)return;
    updateBusy.current=true;
    if(!quiet)setUpdateStage("Проверяем GitHub…");
    try {
      const found=await quickWaveRelease();
      if(found && (!quiet || sessionStorage.getItem("quickwave:dismissed")!==found))setRelease(found);
      setUpdateStage(!found&&!quiet?"Установлена последняя версия":"");
    } catch {
      if(!quiet)setUpdateStage("GitHub недоступен. Попробуй позже.");
    } finally { updateBusy.current=false; }
  }
  async function installUpdate() {
    if(updateBusy.current)return;
    updateBusy.current=true;
    setUpdateStage("Скачиваем и устанавливаем обновление…");
    try {
      const response=await fetch("http://127.0.0.1:46423/update",{
        method:"POST",headers:{"X-QuickWave-Version":release},signal:AbortSignal.timeout(120000)
      });
      if(!response.ok)throw new Error();
      setUpdateStage("Перезапускаем Spotify…");
    } catch {
      setUpdateStage("Не удалось обновить. Проверь, установлен ли помощник из README, и попробуй снова.");
    } finally { updateBusy.current=false; }
  }
  useEffect(()=>{ void checkUpdates(true); },[]);
  useEffect(()=>{
    const player=Spicetify.Player;
    if(!orb.current || typeof requestAnimationFrame!=="function" || matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    let cancelled=false, frame, beats=[], segments=[], beatIndex=0, segmentIndex=0, lastPos=0;
    if(track?.uri && Spicetify.getAudioData){
      Promise.resolve().then(()=>Spicetify.getAudioData(track.uri)).then(data=>{
        if(!cancelled){beats=data?.beats||[];segments=data?.segments||[];}
      }).catch(()=>{});
    }
    const paint=()=>{
      const position=(player?.getProgress?.()||0)/1000;
      if(position<lastPos || position-lastPos>1){beatIndex=0;segmentIndex=0;}
      lastPos=position;
      while(beats[beatIndex+1]?.start<=position)beatIndex++;
      while(segments[segmentIndex+1]?.start<=position)segmentIndex++;
      const playing=player?.isPlaying?.()===true;
      const beat=beats[beatIndex];
      const volume=Math.min(1,Math.max(0,(Number(player?.getVolume?.())||0)));
      const loudness=segments[segmentIndex]?.loudness_max;
      const gain=Number.isFinite(loudness)?Math.min(1,Math.max(0,(loudness+35)/35)):0.55;
      const pulse=playing&&beat?Math.exp(-8*Math.abs(position-beat.start))*volume*gain:0;
      const node=orb.current;
      if(node){
        node.style.setProperty("--qw-pulse",pulse.toFixed(3));
        node.style.setProperty("--qw-spin",`${playing?position*7:0}deg`);
        node.style.setProperty("--qw-shape",`${(44+pulse*21).toFixed(1)}%`);
      }
      frame=requestAnimationFrame(paint);
    };
    frame=requestAnimationFrame(paint);
    return ()=>{cancelled=true;cancelAnimationFrame(frame);};
  },[track?.uri]);
  useEffect(()=>{
    const player=Spicetify.Player;
    const update=()=>setTrack(player?.data?.item);
    player?.addEventListener?.("songchange",update);
    update();
    return ()=>player?.removeEventListener?.("songchange",update);
  },[]);
  useEffect(() => {
    let timer;
    let unsubscribe;
    function connect() {
      const api = globalThis.QuickWave;
      if (!api) {
        timer = setTimeout(connect, 250);
        return;
      }
      const update = () => setState(api.snapshot());
      unsubscribe = api.subscribe(update);
      update();
    }
    connect();
    return () => { clearTimeout(timer); unsubscribe?.(); };
  }, []);

  const api = globalThis.QuickWave;
  const settings = state?.settings;
  const moods = { any: "Любое", calm: "Спокойно", energy: "Энергично", focus: "Для фокуса", sad: "Меланхолично", happy: "Радостно" };
  const tastes = { mix: "Баланс", favorites: "Знакомое", discover: "Открытия" };
  const presets = { pop: "Поп", rock: "Рок", "hip hop": "Хип-хоп", electronic: "Электроника", indie: "Инди", jazz: "Джаз", metal: "Метал", classical: "Классика" };
  const genres = settings?.genres || [];
  const label = state?.active ? "Остановить волну" : "Включить волну";
  const status = state?.busy ? "Подбираем музыку…" : state?.active ? "Волна включена" : state ? "Волна выключена" : "Подключение к Spotify…";
  const icon = name => h("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true},h("path",{d:waveIcons[name]}));

  function chips(options, selected, change) {
    return Object.entries(options).map(([value, caption]) => {
      const on = Array.isArray(selected) ? selected.includes(value) : selected === value;
      return h("button", { key: value, type: "button", className: "qw-chip", "aria-pressed": on, onClick: () => change(value) }, caption);
    });
  }

  function toggleGenre(genre) {
    if (genres.length >= 5 && !genres.includes(genre)) return;
    api.settings({ genres: genres.includes(genre) ? genres.filter(g => g !== genre) : [...genres, genre] });
  }

  function trackCard(track, caption) {
    if (!track) return null;
    return h("div", { className: "qw-track", key: caption },
      track.cover && h("img",{className:"qw-cover",src:track.cover,alt:"",width:56,height:56}),
      h("span", { className: "qw-kicker" }, caption),
      h("strong", null, track.name || "Трек Spotify"),
      track.artist && h("span", null, track.artist),
      h("small", null, track.reason));
  }

  return h("main", { className: "qw-app", "data-theme": theme },
    h("div",{className:"qw-toolbar"},
      h("a",{className:"qw-chip qw-telegram",href:"https://t.me/QuickDeveloper_bot",target:"_blank",rel:"noopener noreferrer"},
        h("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,"aria-hidden":true},h("path",{d:"M3 11l18-7-4 16-6-5-3 3 1-5 8-6-10 5z",strokeLinejoin:"round"})),"Telegram"),
      h("button",{className:"qw-chip",type:"button","aria-expanded":showTheme,onClick:()=>setShowTheme(!showTheme)},icon("settings"),"Оформление"),
      showTheme && h("div",{className:"qw-chips"},chips(Object.fromEntries(waveThemes.map((key,i)=>[key,["Лиловая","Океан","Закат","Лес"][i]])),theme,value=>{setTheme(value);Spicetify.LocalStorage.set("quickwave:theme",value);}),
        h("button",{className:"qw-chip",type:"button",onClick:()=>checkUpdates()},"Проверить обновления"))),
    !release && updateStage && h("p",{className:"qw-message",role:"status"},updateStage),
    release && h("section",{className:"qw-update","data-busy":/^Скачиваем|^Перезапускаем/.test(updateStage),role:"region","aria-label":"Обновление QuickWave"},
      h("strong",null,`Доступно обновление QuickWave ${release.slice(1)}`),
      updateStage && h("p",{role:"status"},updateStage),
      h("div",{className:"qw-chips"},
        h("button",{className:"qw-chip",type:"button",disabled:/^Скачиваем|^Перезапускаем/.test(updateStage),onClick:installUpdate},"Обновить"),
        h("button",{className:"qw-chip",type:"button",disabled:/^Скачиваем|^Перезапускаем/.test(updateStage),onClick:()=>{sessionStorage.setItem("quickwave:dismissed",release);setRelease(null);setUpdateStage("");}},"Позже"))),
    h("section", { className: "qw-hero", "aria-labelledby": "qw-title" },
      h("div", { className: "qw-orb", ref:orb, "data-active": Boolean(state?.active), "aria-hidden": true }),
      h("div", { className: "qw-hero-content" },
        h("h1", { id: "qw-title" }, "Моя волна"),
        h("button", { type: "button", className: "qw-play", disabled: !state, onClick: () => { setNotice(""); api.toggle(); } }, icon(state?.active?"stop":"play"), label),
        h("button",{className:"qw-chip qw-song",type:"button",disabled:!/^spotify:track:[A-Za-z0-9]{22}$/.test(track?.uri)||notice==="Запускаем волну…",onClick:async()=>{
          const current=Spicetify.Player.data?.item;
          if(!/^spotify:track:[A-Za-z0-9]{22}$/.test(current?.uri))return;
          if(api?.snapshot().active)api.toggle();
          setNotice("Запускаем волну…");
          try { await startSongWave(current); setNotice("Волна по песне включена"); }
          catch { setNotice("Не удалось включить волну по песне. Попробуй другой трек."); }
        }},icon("song"),"Волна по песне"),
        h("span", { className: "qw-status", role: "status" }, notice||status))),
    state && h(Spicetify.React.Fragment, null,
      state.note && h("p", { className: "qw-message", role: "status" }, state.note),
      (state.currentPick || state.pending) && h("section", { className: "qw-grid qw-tracks", "aria-label": "Треки волны" },
        trackCard(state.currentPick, "Сейчас в волне"), trackCard(state.pending, "В очереди Spotify")),
      h("div", { className: "qw-grid" },
        h("section", { className: "qw-panel" },
          h("h2", null, "Настроение"),
          h("div", { className: "qw-chips" }, chips(moods, settings.mood, mood => api.settings({ mood })))),
        h("section", { className: "qw-panel" },
          h("h2", null, "Твой вкус"),
          h("div", { className: "qw-chips" }, chips(tastes, settings.taste, taste => api.settings({ taste })))),
        h("section", { className: "qw-panel qw-wide" },
          h("h2", null, "Жанры"),
          h("div", { className: "qw-chips" }, chips({ ...presets, ...Object.fromEntries(genres.filter(g => !Object.hasOwn(presets, g)).map(g => [g, g])) }, genres, toggleGenre)),
          h("form", { className: "qw-form", onSubmit: event => {
            event.preventDefault();
            const genre = custom.trim().replace(/\s+/g, " ").toLowerCase();
            if (genre && !genres.includes(genre) && genres.length < 5) { toggleGenre(genre); setCustom(""); }
          } },
          h("input", { type: "text", value: custom, maxLength: 40, placeholder: "Например, synthwave", "aria-label": "Свой жанр", onChange: event => setCustom(event.target.value) }),
          h("button", { className: "qw-chip", type: "submit", disabled: !custom.trim() || genres.length >= 5 }, "Добавить"),
          h("span", { className: "qw-count" }, `${genres.length} из 5`))),
        h("section", { className: "qw-panel qw-wide" },
          h("h2", null, "Профиль на этом компьютере"),
          h("p", null, `Треков в профиле: ${state.count} · Учтённых прослушиваний: ${state.plays}`),
          h("label", { className: "qw-check" },
            h("input", { type: "checkbox", checked: settings.learn, onChange: event => api.settings({ learn: event.target.checked }) }),
            "Учитывать прослушивания во всём Spotify"),
          state.storageError && h("p", { role: "alert" }, "Хранилище Spotify недоступно. Изменения могут пропасть после перезапуска."),
          confirm
            ? h("div", { className: "qw-chips qw-reset" },
              h("button", { className: "qw-chip", type: "button", onClick: () => { api.reset(); setConfirm(false); } }, "Очистить историю"),
              h("button", { className: "qw-chip", type: "button", onClick: () => setConfirm(false) }, "Отмена"))
            : h("button", { className: "qw-link", type: "button", onClick: () => setConfirm(true) }, "Сбросить историю"))),
      h("details", { className: "qw-details" },
        h("summary", null, "Как QuickWave выбирает треки"),
        h("p", null, "Лайки, повторы и долгие прослушивания усиливают интерес к артисту. Ранние пропуски снижают оценку трека. Волна ищет музыку в медиатеке и подборках Spotify, а недавно звучавшие треки и артисты получают меньший приоритет."),
        h("p", null, "Жанр и настроение оцениваются по подборкам Spotify. Настройки влияют на следующее добавление в очередь."))));
}
