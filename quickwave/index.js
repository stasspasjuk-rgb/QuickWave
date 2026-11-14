function render() {
  return Spicetify.React.createElement(QuickWavePage);
}

const quickWaveVersion = "2.5.1";

function waveEnergy(position, segment) {
  if (!segment) return 0;
  const peak = Math.max(.015, segment.loudness_max_time || .015);
  const elapsed = Math.max(0, position-segment.start);
  const start = segment.loudness_start ?? -60;
  const max = segment.loudness_max ?? start;
  const end = segment.loudness_end ?? start;
  const mix = elapsed < peak ? elapsed/peak : Math.min(1,(elapsed-peak)/Math.max(.03,segment.duration-peak || .2));
  const db = elapsed < peak ? start+(max-start)*mix : max+(end-max)*mix;
  return Math.max(0,Math.min(1,(db+45)/45));
}

function waveBeat(position, beat, loudness, volume) {
  if (!beat) return 0;
  const age = position - beat.start;
  const duration = Math.min(.42, (beat.duration || .5) * .88);
  if (age < 0 || age >= duration) return 0;
  const strength = Number.isFinite(loudness) ? Math.max(.55, Math.min(1, (loudness + 42) / 42)) : .8;
  const attack = Math.min(1, age / .024);
  return Math.sin(attack * Math.PI / 2) * (1 - age / duration) ** 1.35 * strength * (.65 + .35 * Math.sqrt(volume));
}

async function quickWaveRelease() {
  const response = await fetch("https://raw.githubusercontent.com/stasspasjuk-rgb/QuickWave/main/release.json", {signal:AbortSignal.timeout(12000)});
  if (!response.ok) throw new Error("GitHub не ответил");
  const release = await response.json();
  if (!/^v\d+\.\d+\.\d+$/.test(release.tag) || release.draft || release.prerelease) return null;
  const installed = quickWaveVersion.split(".").map(Number);
  const latest = release.tag.slice(1).split(".").map(Number);
  const first = latest.findIndex((part,i)=>part!==installed[i]);
  return first>=0 && latest[first]>installed[first] ? release.tag : null;
}

const waveIcons={
  close:"M6 6l12 12M18 6L6 18", check:"M5 12l4 4L19 6", search:"M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  play:"M8.7 4.8a1.8 1.8 0 0 0-2.7 1.6v11.2a1.8 1.8 0 0 0 2.7 1.6l9.4-5.6a1.85 1.85 0 0 0 0-3.2z",stop:"M8 5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z",
  song:"M2 12h4l3-7 5 14 4-10 2 3h2",
  settings:"M4 7h16M4 17h16M8 4v6m8 4v6",
  update:"M20 11a8 8 0 1 0-2 6m2-11v5h-5"
};
const waveThemes=["violet","ocean","ember","forest"];
const moodArt={
  any:["#c99aff","M12 2v20M2 12h20M5 5l14 14M19 5L5 19"],
  calm:["#71e8d2","M2 9c4-5 6 5 10 0s6 5 10 0M2 15c4-5 6 5 10 0s6 5 10 0"],
  energy:["#ffad64","M13 2L4 14h7l-1 8 10-12h-7z"],
  focus:["#82baff","M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6M9 12h6m-3-3v6"],
  sad:["#ad9af5","M20 15a8 8 0 0 1-11-11 8.5 8.5 0 1 0 11 11z"],
  happy:["#f4d476","M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2m0-14-2 2M7 17l-2 2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"]
};

function QuickWavePage() {
  const { createElement: h, useEffect, useState, useRef } = Spicetify.React;
  const [state, setState] = useState(null);
  const [custom, setCustom] = useState("");
  const [songQuery, setSongQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [searchStatus, setSearchStatus] = useState("");
  const searchRequest = useRef(0);
  async function findSongs(event) {
    event.preventDefault();
    const query=songQuery.trim();
    if(!query)return;
    const token=++searchRequest.current;
    setSearchStatus("Ищем треки…");
    setSongs([]);
    try {
      const found=await globalThis.QuickWave.searchSongs(query);
      if(token!==searchRequest.current)return;
      setSongs(found);
      setSearchStatus(found.length?"":"Ничего не найдено.");
    } catch {
      if(token===searchRequest.current)setSearchStatus("Поиск Spotify сейчас недоступен. Попробуй ещё раз.");
    }
  }
  async function launchSongWave(uri) {
    setNotice("Запускаем волну…");
    try { await globalThis.QuickWave.playSongWave(uri); setNotice("Волна по песне включена"); }
    catch { setNotice("Не удалось включить волну по песне. Попробуй другой трек."); }
  }
  const [confirm, setConfirm] = useState(false);
  const [track, setTrack] = useState(Spicetify.Player?.data?.item);
  const [theme, setTheme] = useState(()=>Spicetify.LocalStorage.get("quickwave:theme")||"violet");
  const [showTheme, setShowTheme] = useState(false);
  const [previewTheme, setPreviewTheme] = useState(theme);
  const [background, setBackground] = useState(()=>Spicetify.LocalStorage.get("quickwave:background")||"theme");
  const [previewBackground, setPreviewBackground] = useState(background);
  const [waveColor, setWaveColor] = useState(()=>Spicetify.LocalStorage.get("quickwave:wave-color")||"");
  const [previewColor, setPreviewColor] = useState(waveColor);
  const [showWaveSettings, setShowWaveSettings] = useState(false);
  const [launching, setLaunching] = useState(true);
  const [notice, setNotice] = useState("");
  const [release, setRelease] = useState(null);
  const [updateStage, setUpdateStage] = useState("");
  const [restartAt, setRestartAt] = useState(null);
  const [remaining, setRemaining] = useState(0);
  useEffect(()=>{
    if(!restartAt)return;
    const tick=()=>setRemaining(Math.max(0,Math.ceil((restartAt-Date.now())/1000)));
    tick();
    const timer=setInterval(tick,100);
    return ()=>clearInterval(timer);
  },[restartAt]);
  const orb = useRef(null);
  const root = useRef(null);
  const [tab,setTab]=useState("Настроение");
  const updateBusy = useRef(false);
  const launchTimer = useRef(null);
  const themeDialog = useRef(null);
  const updateDialog = useRef(null);
  useEffect(()=>{ launchTimer.current=setTimeout(()=>setLaunching(false),1050); return ()=>clearTimeout(launchTimer.current); },[]);
  useEffect(()=>{
    const replay=()=>{
      clearTimeout(launchTimer.current);
      setLaunching(true);
      launchTimer.current=setTimeout(()=>setLaunching(false),1050);
    };
    globalThis.addEventListener?.("quickwave:reopen",replay);
    return ()=>globalThis.removeEventListener?.("quickwave:reopen",replay);
  },[]);
  async function checkUpdates(quiet=false) {
    if(updateBusy.current)return;
    updateBusy.current=true;
    if(!quiet){updateDialog.current?.showModal();setUpdateStage("Проверяем GitHub…");}
    try {
      const found=await (quiet && globalThis.QuickWave?.startupRelease || quickWaveRelease());
      if(!quiet || (found && sessionStorage.getItem("quickwave:dismissed")!==found))setRelease(found);
      setUpdateStage(!found&&!quiet?"Установлена последняя версия":"");
    } catch {
      if(!quiet)setUpdateStage("GitHub недоступен. Попробуй позже.");
    } finally { updateBusy.current=false; }
  }
  async function installUpdate() {
    if (!isWindows) {
      setUpdateStage("Для обновления запусти установщик из инструкции для macOS и Linux.");
      return;
    }
    if(updateBusy.current)return;
    updateBusy.current=true;
    setUpdateStage("Скачиваем и устанавливаем обновление…");
    try {
      const response=await fetch("http://127.0.0.1:46423/update",{
        method:"POST",headers:{"X-QuickWave-Version":release},signal:AbortSignal.timeout(120000)
      });
      if(!response.ok)throw new Error();
      const seconds=Number(response.headers.get("X-QuickWave-Restart-In"));
      if(seconds===5){setRemaining(5);setRestartAt(Date.now()+5000);}
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
    const node=orb.current;
    node.style.setProperty("--qw-pulse","0");
    node.style.setProperty("--qw-energy","0");
    node.style.setProperty("--qw-hue","0deg");
    node.style.setProperty("--qw-drift","0");
    if(/^spotify:track:[A-Za-z0-9]{22}$/.test(track?.uri) && Spicetify.getAudioData){
      Promise.resolve().then(()=>Spicetify.getAudioData(track.uri)).then(data=>{
        if(!cancelled){
          const markers=data?.beats||data?.track?.beats;
          beats=Array.isArray(markers)?markers.filter(beat=>Number.isFinite(beat?.start)).sort((a,b)=>a.start-b.start):[];
          const dynamics=data?.segments||data?.track?.segments;
          segments=Array.isArray(dynamics)?dynamics.filter(segment=>Number.isFinite(segment?.start)).sort((a,b)=>a.start-b.start):[];
        }
      }).catch(()=>{});
    }
    const paint=()=>{
      frame=requestAnimationFrame(paint);
      if(player?.isPlaying?.()!==true||(!beats.length&&!segments.length))return;
      const position=(player?.getProgress?.()||0)/1000;
      if(position<lastPos || position-lastPos>1){beatIndex=0;segmentIndex=0;}
      lastPos=position;
      while(beats[beatIndex+1]?.start<=position)beatIndex++;
      while(segments[segmentIndex+1]?.start<=position)segmentIndex++;
      const beat=beats[beatIndex];
      const volume=Math.min(1,Math.max(0,(Number(player?.getVolume?.())||0)));
      const segment=segments[segmentIndex];
      const energy=waveEnergy(position,segment);
      const loudness=segment?.loudness_max;
      const nextBeat=beats[beatIndex+1];
      const gap=nextBeat?nextBeat.start-beat.start:beat?.duration;
      const pulse=waveBeat(position,gap>0?{start:beat.start,duration:gap}:beat,loudness,volume);
      const phase=gap>0?Math.max(0,Math.min(1,(position-beat.start)/gap)):0;
      const phrase=beatIndex+phase;
      node.style.setProperty("--qw-pulse",pulse.toFixed(3));
      node.style.setProperty("--qw-energy",(energy*(.4+volume*.6)).toFixed(3));
      node.style.setProperty("--qw-hue",`${(Math.sin(phrase/13)*34).toFixed(2)}deg`);
      node.style.setProperty("--qw-drift",Math.sin(phrase/7).toFixed(3));
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
  const icon = name => {
    const filled = name==="play" || name==="stop";
    return h("svg",{className:"qw-icon",width:20,height:20,viewBox:"0 0 24 24",fill:filled?"currentColor":"none",stroke:filled?"none":"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true},h("path",{d:waveIcons[name]}));
  };

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

  const isWindows = /win/i.test(globalThis.navigator?.userAgentData?.platform || globalThis.navigator?.platform || "");
  const updateRunning=/^Проверяем|^Скачиваем|^Перезапускаем/.test(updateStage);
  const upToDate=updateStage==="Установлена последняя версия"||updateStage.startsWith("Перезапускаем");
  const color=showTheme?previewColor:waveColor;
  const customPalette=/^#[a-f0-9]{6}$/i.test(color)?{"--qw-custom":color}:undefined;
  return h("main", { className: "qw-app qw-full-wave", ref:root, style:customPalette, "data-theme": showTheme?previewTheme:theme, "data-background":showTheme?previewBackground:background, "data-settings-open":showWaveSettings,
    onKeyDown:event=>{if(event.key==="Escape"&&showWaveSettings){setShowWaveSettings(false);setConfirm(false);}} },
    h("button",{className:"qw-chip qw-fullscreen",type:"button","aria-label":"Полноэкранный режим",title:"Полноэкранный режим",onClick:async()=>{
      try { if(document.fullscreenElement===root.current)await document.exitFullscreen();else await root.current.requestFullscreen(); }
      catch { Spicetify.showNotification?.("Полноэкранный режим недоступен",true); }
    }},h("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,"aria-hidden":true},h("path",{d:"M9 4H4v5m11-5h5v5m0 6v5h-5M4 15v5h5",strokeLinecap:"round"}))),
    h("dialog",{className:"qw-theme-dialog",ref:themeDialog,"aria-labelledby":"qw-theme-title",onClose:()=>setShowTheme(false)},
      h("h2",{id:"qw-theme-title"},"Оформление"),
      h("div",{className:"qw-preview qw-preview-refined","data-background":previewBackground},h("div",{className:"qw-preview-orb","aria-hidden":true}),h("strong",null,"Моя волна")),
      h("div",{className:"qw-chips"},chips(Object.fromEntries(waveThemes.map((key,i)=>[key,["Лиловая","Океан","Закат","Лес"][i]])),previewTheme,setPreviewTheme)),
      h("h3",null,"Фон"),
      h("div",{className:"qw-chips"},chips({theme:"Под цвет темы",dark:"Графит",spotify:"Фон Spotify"},previewBackground,setPreviewBackground)),
      h("div",{className:"qw-color-controls"},
        h("label",null,"Цвет волны",h("input",{type:"color",value:/^#[a-f0-9]{6}$/i.test(previewColor)?previewColor:"#e94fc2",onChange:event=>setPreviewColor(event.target.value)})),
        h("button",{className:"qw-chip",type:"button",onClick:()=>setPreviewColor("")},"Цвет темы")),
      h("div",{className:"qw-chips qw-theme-actions"},
        h("button",{className:"qw-chip",type:"button",onClick:()=>{setTheme(previewTheme);setBackground(previewBackground);setWaveColor(previewColor);Spicetify.LocalStorage.set("quickwave:theme",previewTheme);Spicetify.LocalStorage.set("quickwave:background",previewBackground);Spicetify.LocalStorage.set("quickwave:wave-color",previewColor);themeDialog.current.close();}},"Применить"),
        h("button",{className:"qw-chip",type:"button",onClick:()=>themeDialog.current.close()},"Отмена"))),
    release && h("button",{className:"qw-chip qw-update-offer",type:"button",onClick:()=>updateDialog.current.showModal()},`Доступно обновление QuickWave ${release.slice(1)}`),
    h("dialog",{className:"qw-theme-dialog qw-update-dialog",ref:updateDialog,"aria-labelledby":"qw-update-title",
      onCancel:event=>{if(updateRunning)event.preventDefault();}},
      h("div",{className:"qw-update-mark","data-running":updateRunning,"data-done":upToDate,"aria-hidden":true},
        h("svg",{viewBox:"0 0 48 48",width:56,height:56,fill:"none",stroke:"currentColor",strokeWidth:3,strokeLinecap:"round",strokeLinejoin:"round"},
          h("circle",{cx:24,cy:24,r:20}),upToDate&&h("path",{d:"M14 24l7 7 13-14"}))),
      h("h2",{id:"qw-update-title"},release?`QuickWave ${release.slice(1)} доступен`:"Обновления QuickWave"),
      h("p",{role:"status"},restartAt?`Обновление установлено. Перезапуск через ${remaining} с`:updateStage||(release?"Обновление готово к установке":"")),
      h("small",null,`Установлена версия ${quickWaveVersion}`),
      updateRunning&&h("progress",{className:"qw-update-progress","aria-label":"Ход обновления",max:5,value:restartAt?5-remaining:undefined}),
      h("div",{className:"qw-chips"},
        release&&(isWindows
          ? h("button",{className:"qw-chip",type:"button",disabled:updateRunning,onClick:installUpdate},"Обновить")
          : h("a",{className:"qw-chip",href:"https://github.com/stasspasjuk-rgb/QuickWave#macos-и-linux",target:"_blank",rel:"noopener noreferrer"},"Как обновить")),
        h("button",{className:"qw-chip",type:"button",disabled:updateRunning,onClick:()=>{if(release){sessionStorage.setItem("quickwave:dismissed",release);setRelease(null);}updateDialog.current.close();}},release?"Позже":"Готово"))),
    h("section", { className: "qw-hero", "data-launching":launching, "aria-labelledby": "qw-title" },
      h("div",{className:"qw-launch-ring","aria-hidden":true}),
      h("div", { className: "qw-orb", ref:orb, "data-active": Boolean(track?.uri), "aria-hidden": true },
        h("div",{className:"qw-beat-ring"})),
      h("div", { className: "qw-hero-content" },
        launching&&h("div",{className:"qw-intro","aria-hidden":true},icon("song"),h("strong",null,"QuickWave")),
        h("div",{className:"qw-brand"},icon("song"),h("span",null,"QuickWave")),
        h("h1", { id: "qw-title" }, "Моя волна"),
        h("button", { type: "button", className: "qw-play", disabled: !state, onClick: () => {
          setNotice("");
          clearTimeout(launchTimer.current);
          setLaunching(!state.active);
          if(!state.active)launchTimer.current=setTimeout(()=>setLaunching(false),1050);
          api.toggle();
        } }, icon(state?.active?"stop":"play"), label),
        h("button", { className:"qw-chip qw-configure", type:"button", disabled:!state,
          "aria-expanded":showWaveSettings,"aria-controls":showWaveSettings?"qw-wave-settings":undefined,
          onClick:()=>{setShowWaveSettings(!showWaveSettings);setConfirm(false);} },icon("settings"),"Настроить"),
        h("span", { className: "qw-status", role: "status" }, notice||status))),
    state && h(Spicetify.React.Fragment, null,
      state.note && h("p", { className: "qw-message", role: "status" }, state.note),
      showWaveSettings && h("aside", { className:"qw-wave-settings",id:"qw-wave-settings","aria-labelledby":"qw-wave-settings-title" },
        h("header",{className:"qw-wave-settings-header"},
          h("div",null,h("h2",{id:"qw-wave-settings-title"},"Настроить волну"),
            h("p",null,"Выбор применяется к следующему подбору.")),
          h("button",{className:"qw-chip qw-close",type:"button","aria-label":"Закрыть настройки",onClick:()=>{setShowWaveSettings(false);setConfirm(false);}},icon("close"))),
      h("nav",{className:"qw-chips qw-settings-tabs","aria-label":"Разделы настроек"},chips(Object.fromEntries(["Настроение","Жанры","Поиск","Профиль","Ещё"].map(name=>[name,name])),tab,setTab)),
      h("div", { className: "qw-grid qw-settings-grid" },
        tab==="Настроение" && h("section", { className: "qw-panel" },
          h("h2", null, "Настроение"),
          h("div", { className: "qw-mood-grid" }, Object.entries(moods).map(([mood,label])=>{
            const [color,path]=moodArt[mood];
            return h("button",{key:mood,className:"qw-mood",type:"button",style:{"--mood-color":color},
              "aria-pressed":settings.mood===mood,onClick:()=>api.settings({mood})},
              h("svg",{width:25,height:25,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.5,
                strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true},h("path",{d:path})),
              h("span",null,label));
          }))),
        tab==="Настроение" && h("section", { className: "qw-panel" },
          h("h2", null, "Твой вкус"),
          h("div", { className: "qw-chips" }, chips(tastes, settings.taste, taste => api.settings({ taste })))),
        tab==="Жанры" && h("section", { className: "qw-panel qw-wide" },
          h("h2", null, "Жанры"),
          h("div",{className:"qw-mood-grid"},Object.entries({...presets,...Object.fromEntries(genres.filter(g=>!Object.hasOwn(presets,g)).map(g=>[g,g]))}).map(([genre,name],i)=>{
  const arts=[["#fa88c1","M9 18V5l12-2v13M9 18c0 4-7 4-7 1s7-4 7-1m12-2c0 4-7 4-7 1s7-4 7-1"],["#ffa776",moodArt.energy[1]],["#f0cc7d","M8 12a4 4 0 0 0 8 0V6a4 4 0 0 0-8 0zm-4 0a8 8 0 0 0 16 0m-8 8v3"],["#80e3df",moodArt.calm[1]],["#aab9ff",moodArt.any[1]],["#91e9a2","M3 4h18v16H3zm5 0v16m4-16v16m4-16v16"],["#ff9292","M3 15l4-8 5 11 5-11 4 8"],["#d2a6ff","M4 20h16M6 17V8m6 9V8m6 9V8M3 7l9-5 9 5z"]];
  const [color,path]=arts[i%arts.length];
  return h("button",{key:genre,type:"button",className:"qw-mood",style:{"--mood-color":color},"aria-pressed":genres.includes(genre),onClick:()=>toggleGenre(genre)},h("svg",{viewBox:"0 0 24 24",width:25,height:25,fill:"none",stroke:"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true},h("path",{d:path})),name);
})),
          h("form", { className: "qw-form", onSubmit: event => {
            event.preventDefault();
            const genre = custom.trim().replace(/\s+/g, " ").toLowerCase();
            if (genre && !genres.includes(genre) && genres.length < 5) { toggleGenre(genre); setCustom(""); }
          } },
          h("input", { type: "text", value: custom, maxLength: 40, placeholder: "Например, synthwave", "aria-label": "Свой жанр", onChange: event => setCustom(event.target.value) }),
          h("button", { className: "qw-chip", type: "submit", disabled: !custom.trim() || genres.length >= 5 }, "Добавить"),
          h("span", { className: "qw-count" }, `${genres.length} из 5`))),
        tab==="Профиль" && h("section", { className: "qw-panel qw-wide qw-profile" },
          h("h2", null, "Твой профиль"),
          h("p", {className:"qw-profile-caption"}, "Хранится на этом компьютере"),
          h("div",{className:"qw-profile-stats"},
            h("div",null,h("strong",null,state.count),h("span",null,"Треков в профиле")),
            h("div",null,h("strong",null,state.plays),h("span",null,"Учтено прослушиваний"))),
          h("label", { className: "qw-check" },
            h("input", { type: "checkbox", checked: settings.learn, onChange: event => api.settings({ learn: event.target.checked }) }),
            "Учитывать прослушивания во всём Spotify"),
          state.storageError && h("p", { role: "alert" }, "Хранилище Spotify недоступно. Изменения могут пропасть после перезапуска."),
          confirm
            ? h("div", { className: "qw-chips qw-reset" },
              h("button", { className: "qw-chip", type: "button", onClick: () => { api.reset(); setConfirm(false); } }, "Очистить историю"),
              h("button", { className: "qw-chip", type: "button", onClick: () => setConfirm(false) }, "Отмена"))
            : h("button", { className: "qw-link", type: "button", onClick: () => setConfirm(true) }, "Сбросить историю"))),
      tab==="Поиск" && h("section",{className:"qw-panel qw-wide qw-search-panel"},
        h("h2",null,"Поиск песен"),
        h("form",{className:"qw-song-search",role:"search",onSubmit:findSongs},
          icon("search"),
          h("input",{type:"search",value:songQuery,maxLength:200,placeholder:"Трек или исполнитель","aria-label":"Поиск песен",onChange:event=>setSongQuery(event.target.value)}),
          h("button",{className:"qw-chip",type:"submit",disabled:!songQuery.trim()},"Найти")),
        searchStatus&&h("p",{role:"status"},searchStatus),
        songs.length>0&&h("ul",{className:"qw-search-results"},songs.map(song=>h("li",{key:song.uri},
          song.cover?h("img",{src:song.cover,alt:"",loading:"lazy"}):h("span",{className:"qw-search-cover"},icon("song")),
          h("div",null,h("strong",null,song.name),h("small",null,song.artist)),
          h("button",{className:"qw-chip qw-close",type:"button",title:"Воспроизвести","aria-label":"Воспроизвести "+song.name,onClick:async()=>{
            try { await Spicetify.Player.playUri(song.uri); } catch { setSearchStatus("Не удалось воспроизвести трек."); }
          }},icon("play")),
          h("button",{className:"qw-chip qw-close",type:"button",title:"Волна по песне","aria-label":"Волна по песне "+song.name,disabled:notice==="Запускаем волну…",onClick:()=>launchSongWave(song.uri)},icon("song")))))),
      tab==="Ещё" && h("div",{className:"qw-panel qw-wide"},h("button",{className:"qw-chip qw-song",type:"button",disabled:!/^spotify:track:[A-Za-z0-9]{22}$/.test(track?.uri)||notice==="Запускаем волну…",onClick:async()=>{
          const current=Spicetify.Player.data?.item;
          if(!/^spotify:track:[A-Za-z0-9]{22}$/.test(current?.uri))return;
          await launchSongWave(current.uri);
        }},icon("song"),"Волна по песне"),    h("div",{className:"qw-settings-links"},
      h("a",{className:"qw-chip qw-telegram",href:"https://t.me/QuickDeveloper_bot",target:"_blank",rel:"noopener noreferrer"},
        h("svg",{width:20,height:20,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,"aria-hidden":true},h("path",{d:"M3 11l18-7-4 16-6-5-3 3 1-5 8-6-10 5z",strokeLinejoin:"round"})),"Telegram"),
      h("button",{className:"qw-chip",type:"button",onClick:()=>{setPreviewTheme(theme);setPreviewBackground(background);setPreviewColor(waveColor);setShowTheme(true);themeDialog.current.showModal();}},icon("settings"),"Оформление"),
      h("button",{className:"qw-chip",type:"button",onClick:()=>checkUpdates()},icon("update"),release?"Обновить "+release.slice(1):"Проверить обновления"))),
      tab==="Профиль" && h("details", { className: "qw-details" },
        h("summary", null, "Как QuickWave выбирает треки"),
        h("p", null, "Лайки, повторы и долгие прослушивания усиливают интерес к артисту. Ранние пропуски снижают оценку трека. Волна ищет музыку в медиатеке и подборках Spotify, а недавно звучавшие треки и артисты получают меньший приоритет."),
        h("p", null, "Жанр и настроение оцениваются по подборкам Spotify. Настройки влияют на следующее добавление в очередь.")))));
}
