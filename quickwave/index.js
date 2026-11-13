function render() {
  return Spicetify.React.createElement(QuickWavePage);
}

  function openSpotifyRadio(track){
    const path="/track/"+track.uri.split(":")[2];
    const links=document.querySelectorAll('.main-nowPlayingBar-nowPlayingBar a, [data-testid="now-playing-widget"] a, .Root__now-playing-bar a');
    const trigger=[...links].find(link=>link.getAttribute("href")===path || link.getAttribute("href")===track.uri);
    if(!trigger){Spicetify.showNotification?.('Открой меню текущего трека в плеере',true);return;}
    const label=Spicetify.Locale?.getDictionary?.()?.["contextmenu.go-to-song-radio"];
    const labels=new Set([label,"Go to song radio","Перейти к радио по треку","Перейти к радио"]);
    const existing=new Set(document.querySelectorAll('[role="menuitem"]'));
    const rect=trigger.getBoundingClientRect();
    trigger.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2,clientX:rect.x,clientY:rect.y}));
    let attempts=0;
    const timer=setInterval(()=>{
      if(Spicetify.Player.data?.item?.uri!==track.uri||++attempts>16){clearInterval(timer);return;}
      const item=[...document.querySelectorAll('[role="menuitem"]')].find(node=>!existing.has(node) &&
        (node.getAttribute("data-menu-action")==="go-to-radio" || labels.has(node.textContent.trim())));
      if(!item)return;
      clearInterval(timer);
      if(item.matches('[disabled], [aria-disabled="true"], [data-disabled="true"]'))return;
      item.click();
    },50);
  }

const waveIcons={
  play:"M8 5l12 7-12 7z",stop:"M7 7h10v10H7z",
  song:"M2 12h4l3-7 5 14 4-10 2 3h2",
  settings:"M4 7h16M4 17h16M8 4v6m8 4v6"
};
const waveThemes=["violet","ocean","ember","forest"];

function QuickWavePage() {
  const { createElement: h, useEffect, useState } = Spicetify.React;
  const [state, setState] = useState(null);
  const [custom, setCustom] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [track, setTrack] = useState(Spicetify.Player?.data?.item);
  const [theme, setTheme] = useState(()=>Spicetify.LocalStorage.get("quickwave:theme")||"violet");
  const [showTheme, setShowTheme] = useState(false);
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
      h("span", { className: "qw-kicker" }, caption),
      h("strong", null, track.name || "Трек Spotify"),
      track.artist && h("span", null, track.artist),
      h("small", null, track.reason));
  }

  return h("main", { className: "qw-app", "data-theme": theme },
    h("div",{className:"qw-toolbar"},
      h("button",{className:"qw-chip",type:"button","aria-expanded":showTheme,onClick:()=>setShowTheme(!showTheme)},icon("settings"),"Оформление"),
      showTheme && h("div",{className:"qw-chips"},chips(Object.fromEntries(waveThemes.map((key,i)=>[key,["Лиловая","Океан","Закат","Лес"][i]])),theme,value=>{setTheme(value);Spicetify.LocalStorage.set("quickwave:theme",value);}))),
    h("section", { className: "qw-hero", "aria-labelledby": "qw-title" },
      h("div", { className: "qw-orb", "data-active": Boolean(state?.active), "aria-hidden": true }),
      h("div", { className: "qw-hero-content" },
        h("h1", { id: "qw-title" }, "Моя волна"),
        h("button", { type: "button", className: "qw-play", disabled: !state, onClick: () => api.toggle() }, icon(state?.active?"stop":"play"), label),
        h("button",{className:"qw-chip qw-song",type:"button",disabled:!/^spotify:track:[A-Za-z0-9]{22}$/.test(track?.uri),onClick:()=>{
          const current=Spicetify.Player.data?.item;
          if(!/^spotify:track:[A-Za-z0-9]{22}$/.test(current?.uri))return;
          if(api?.snapshot().active)api.toggle();
          openSpotifyRadio(current);
        }},icon("song"),"Волна по песне"),
        h("span", { className: "qw-status", role: "status" }, status))),
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
