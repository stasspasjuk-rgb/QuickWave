function render() {
  return Spicetify.React.createElement(QuickWavePage);
}

function QuickWavePage() {
  const { createElement, useEffect, useRef } = Spicetify.React;
  const container = useRef(null);
  useEffect(() => {
    const host = container.current;
    const view = host.shadowRoot || host.attachShadow({ mode: "open" });
    view.innerHTML = "<style>\n:host{color-scheme:dark;--bg:#101018;--card:#1a1925;--line:#343143;--text:#f7f4ff;--muted:#c1bacf;--accent:#dfccff;--lime:#dbfc9e}\n*{box-sizing:border-box}:host{margin:0;background:radial-gradient(ellipse at 60% 0,#211b38,transparent 50%),var(--bg);color:var(--text);font:15px/1.5 \"Segoe UI\",system-ui,sans-serif}\nbutton,input,select{font:inherit}button,a,input,select{outline-offset:4px}button{cursor:pointer}button:disabled{cursor:default;opacity:.45}a{color:inherit}\n.shell{max-width:1250px;margin:auto;padding:22px clamp(16px,4vw,54px) 44px}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.logo{font-size:20px;letter-spacing:-.05em;font-weight:800}.logo svg{vertical-align:-5px;margin-right:8px;color:var(--lime)}.header small,.muted,small{color:var(--muted)}\n.hero{min-height:320px;display:flex;align-items:center;position:relative;isolation:isolate;overflow:hidden;border:1px solid #49405d;border-radius:28px;padding:clamp(23px,5vw,62px);background:#201831}\n.hero:after{content:\"\";position:absolute;z-index:-1;inset:0;background:linear-gradient(90deg,#1b1529 8%,#1b1529cc 37%,transparent 80%)}\n.orb{position:absolute;z-index:-2;width:min(70%,640px);aspect-ratio:1.28;right:-3%;top:50%;transform:translateY(-50%) rotate(-19deg);border-radius:43% 57% 39% 61%;background:radial-gradient(ellipse at 28% 60%,#e9ffa3,transparent 40%),radial-gradient(ellipse at 65% 36%,#fa8bdc,transparent 58%),radial-gradient(ellipse at 54% 70%,#714cff 18%,transparent 68%);filter:blur(19px);animation:float 12s ease-in-out infinite alternate}\n@keyframes float{to{transform:translateY(-50%) rotate(7deg) scale(1.13);border-radius:65% 35% 50% 50%}}@media(prefers-reduced-motion:reduce){.orb{animation:none}}\nh1,h2,h3,p{margin:0}h1{font-size:clamp(48px,8vw,92px);letter-spacing:-.08em;line-height:1}h2{font-size:21px;letter-spacing:-.025em}h3{font-size:16px}.hero p{max-width:350px;color:#e0d7ed;margin:15px 0 24px}\n.primary,.chip,.quiet,.action{border:1px solid var(--line);border-radius:999px;padding:8px 13px;background:#242131;color:var(--text);text-decoration:none;display:inline-flex;justify-content:center;align-items:center;min-height:40px}.primary{background:var(--lime);border-color:var(--lime);color:#1c2414;font-weight:800;padding:11px 19px}.primary:hover{background:#efffcd}.chip:hover,.quiet:hover,.action:hover{background:#372f49}.chip[aria-pressed=true],.action[aria-pressed=true]{color:#251932;background:var(--accent);border-color:var(--accent);font-weight:700}\n.columns{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:16px;margin-top:16px;align-items:start}.panel{border:1px solid var(--line);background:var(--card);border-radius:22px;padding:clamp(15px,3vw,26px)}.heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.stack{display:grid;gap:16px}.chips{display:flex;gap:7px;flex-wrap:wrap}\n.modes{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mode{display:grid;align-content:start;text-align:left;min-height:76px;border:1px solid var(--line);border-radius:14px;padding:10px;background:#211e2e;color:var(--text)}.mode[aria-pressed=true]{border-color:#b792f8;background:#35274b}.mode small{font-size:12px}\n.genre-groups{display:grid;gap:14px;margin-top:14px}.genre-groups h3{margin-bottom:6px;font-size:13px;color:var(--muted)}.search{width:100%;padding:9px 11px;background:#12111a;border:1px solid #554963;border-radius:11px;color:var(--text)}.genres-count{white-space:nowrap}.group-label{display:block;margin:16px 0 7px}.results{display:grid;gap:10px}.track{border:1px solid #3b344c;background:#201c2d;border-radius:16px;padding:13px;display:grid;gap:8px}.track-header{display:grid;grid-template-columns:42px 1fr;align-items:center;gap:10px}.tile{display:grid;place-items:center;height:42px;border-radius:11px;background:linear-gradient(135deg,#e0c1ff,#9b78df);color:#20182e;font-weight:800}.track small{display:block}.track p{color:#e5d8f4;font-size:13px;overflow-wrap:anywhere}.actions{display:flex;flex-wrap:wrap;gap:6px}.action{font-size:12px;min-height:32px;padding:5px 9px}.action.play{background:#313b26;color:#e8ffc9}.empty{color:var(--muted);padding:10px 0}.status{min-height:23px;font-size:13px;color:var(--muted)}details{margin-top:15px;color:var(--muted)}details summary{cursor:pointer}details p{margin-top:9px}.inline{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}details label{display:block;margin-top:8px}details select{background:#171520;color:var(--text);border:1px solid #554963;border-radius:8px;padding:7px;max-width:100%}\n@media(max-width:850px){.columns{grid-template-columns:1fr}.hero{min-height:265px}}@media(max-width:440px){.modes{grid-template-columns:1fr}.header small{display:none}.heading{flex-wrap:wrap}}\n\n\n:host{--hero:#201831;--veil:#1b1529;--glow-a:#e9ffa3;--glow-b:#fa8bdc;--glow-c:#714cff;--back-glow:#211b38}\n:host[data-theme=ocean]{--bg:#0b151f;--card:#122332;--line:#304c60;--hero:#123044;--veil:#0d2434;--glow-a:#71eedd;--glow-b:#5caaff;--glow-c:#355de4;--back-glow:#143852;--accent:#c6eaff;--lime:#8df4dd}\n:host[data-theme=ember]{--bg:#1d1113;--card:#2d1d22;--line:#583b43;--hero:#45242a;--veil:#2c191d;--glow-a:#ffdf91;--glow-b:#ff886d;--glow-c:#b84276;--back-glow:#482428;--accent:#ffd5c5;--lime:#ffd99a}\n:host[data-theme=forest]{--bg:#101a15;--card:#192a21;--line:#3a5242;--hero:#243e32;--veil:#14291e;--glow-a:#e2f594;--glow-b:#6ee3aa;--glow-c:#258e80;--back-glow:#254231;--accent:#c6eed1;--lime:#e0f89f}\n:host{background:radial-gradient(ellipse at 60% 0,var(--back-glow),transparent 50%),var(--bg)}\n.hero{background:var(--hero)}.hero:after{background:linear-gradient(90deg,var(--veil) 8%,color-mix(in srgb,var(--veil) 80%,transparent) 37%,transparent 80%)}\n.orb{background:radial-gradient(ellipse at 28% 60%,var(--glow-a),transparent 40%),radial-gradient(ellipse at 65% 36%,var(--glow-b),transparent 58%),radial-gradient(ellipse at 54% 70%,var(--glow-c) 18%,transparent 68%)}\n.mode[aria-pressed=true]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 20%,var(--card))}\n.tile{background:linear-gradient(135deg,var(--accent),var(--glow-c))}\n.primary:hover{background:color-mix(in srgb,var(--lime) 78%,white)}\n:host[data-motion=off] .orb{animation:none}:host[data-density=compact] .track{padding:8px 10px;gap:5px}:host[data-density=compact] .panel{padding:15px}:host[data-density=compact] .hero{min-height:250px}\ndialog{width:min(92vw,480px);border:1px solid var(--line);border-radius:20px;padding:23px;background:var(--card);color:var(--text)}dialog::backdrop{background:#090712ac}dialog label{display:grid;gap:7px;margin:12px 0}dialog input[type=color]{width:50px;height:32px;padding:2px;border:1px solid var(--line);background:var(--bg)}dialog select{padding:8px;border-radius:9px;background:var(--bg);color:var(--text);border:1px solid var(--line)}dialog .check{display:flex;align-items:center;gap:9px}dialog .check input{accent-color:var(--lime)}\n\n:host{display:block;min-height:100%;color-scheme:dark} dialog{margin:auto} :host button:focus-visible{outline:2px solid var(--accent)}</style><main class=\"shell\">\n <header class=\"header\"><div class=\"logo\"><svg width=\"26\" height=\"23\" viewBox=\"0 0 26 23\" fill=\"none\" aria-hidden=\"true\"><path d=\"M2 12h4l3-8 5 16 4-11 3 3h3\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></svg>QuickWave</div><button class=\"quiet\" type=\"button\" id=\"appearance\">⚙ Настройки</button></header>\n <dialog id=\"settings\" aria-labelledby=\"settings-title\">\n  <div class=\"heading\"><h2 id=\"settings-title\">Настройки</h2><form method=\"dialog\"><button class=\"quiet\">Готово</button></form></div>\n  <label>Тема<select id=\"theme\"><option value=\"violet\">Лиловая</option><option value=\"ocean\">Океан</option><option value=\"ember\">Закат</option><option value=\"forest\">Лес</option></select></label>\n  <label>Цвет акцента<input id=\"accent\" type=\"color\" value=\"#dfccff\"></label>\n  <label class=\"check\"><input type=\"checkbox\" id=\"motion\"> Анимация волны</label>\n  <label class=\"check\"><input type=\"checkbox\" id=\"compact\"> Компактные карточки</label>\n  <button class=\"quiet\" type=\"button\" id=\"reset-style\">Сбросить оформление</button>\n  <p class=\"muted group-label\">Версия 2.1.0 · <a href=\"https://github.com/stasspasjuk-rgb/QuickWave/releases/latest\" target=\"_blank\" rel=\"noopener noreferrer\">Обновления на GitHub</a></p>\n </dialog>\n <section class=\"hero\" aria-labelledby=\"title\"><div class=\"orb\" aria-hidden=\"true\"></div><div><h1 id=\"title\">Моя волна</h1><p>Выбери, чего хочется сейчас. Оценивай треки, чтобы следующий подбор лучше попадал в твой вкус.</p><button id=\"start\" class=\"primary\" type=\"button\">▶ &nbsp; Подобрать треки</button></div></section>\n <div class=\"columns\">\n  <div class=\"stack\">\n   <section class=\"panel\" aria-labelledby=\"taste-title\">\n    <div class=\"heading\"><h2 id=\"taste-title\">Твой вкус</h2></div><div id=\"taste\" class=\"modes\"></div>\n    <strong class=\"group-label\" id=\"mood-title\">Настроение</strong><div id=\"moods\" class=\"chips\" role=\"group\" aria-labelledby=\"mood-title\"></div>\n   </section>\n   <section class=\"panel\" aria-labelledby=\"genre-title\">\n    <div class=\"heading\"><h2 id=\"genre-title\">Жанры</h2><small id=\"genre-count\" class=\"genres-count\"></small></div>\n    <input class=\"search\" type=\"search\" id=\"genre-search\" placeholder=\"Найти жанр или поджанр\" aria-label=\"Поиск жанров\" autocomplete=\"off\">\n    <div id=\"genre-groups\" class=\"genre-groups\"></div>\n    <details><summary>Добавить свой трек</summary>\n      <form id=\"custom\">\n        <label>Исполнитель<input class=\"search\" name=\"artist\" required maxlength=\"80\"></label>\n        <label>Название<input class=\"search\" name=\"title\" required maxlength=\"100\"></label>\n        <div class=\"inline\"><label>Жанр<br><select name=\"genre\" id=\"custom-genre\" required></select></label><label>Настроение<br><select name=\"mood\" id=\"custom-mood\" required></select></label></div>\n        <button class=\"quiet group-label\" type=\"submit\">Добавить в каталог</button>\n      </form>\n    </details>\n   </section>\n  </div>\n  <section id=\"wave\" class=\"panel\" aria-labelledby=\"wave-title\">\n    <div class=\"heading\"><h2 id=\"wave-title\">Подборка</h2><button class=\"quiet\" type=\"button\" id=\"next\" disabled>Ещё треки</button></div>\n    <div id=\"status\" class=\"status\" role=\"status\"></div><div id=\"results\" class=\"results\"><p class=\"empty\">Здесь появятся треки и причины их выбора.</p></div>\n    <details><summary>Как работает подбор</summary><p>Выбранные жанры и настроение влияют на порядок треков. Оценки «Больше такого» и «Меньше такого» меняют вес трека, артиста и жанра. В одной подборке артисты чередуются, а ранее показанные треки уступают место новым.</p><p>Каталог собран вручную и работает локально. Кнопка трека открывает поиск Spotify в новой вкладке. Оценки и настройки сохраняются в этом браузере.</p><button class=\"quiet group-label\" type=\"button\" id=\"reset\">Сбросить оценки</button></details>\n  </section>\n </div>\n</main>";
    mountQuickWave(view);
    return () => view.replaceChildren();
  }, []);
  return createElement("div", { ref: container });
}

function mountQuickWave(view) {
  const groups = {
    "Поп и гитары": ["Поп","Инди-поп","Альт-рок","Классический рок","Панк","Метал"],
    "Биты и клуб": ["Хип-хоп","R&B","Хаус","Техно","Драм-н-бейс","Синтвейв","Гараж","Трип-хоп"],
    "Тихий звук и живые инструменты": ["Эмбиент","Лоу-фай","Джаз","Соул","Фанк","Фолк","Неоклассика"]
  };
  const moods = { any:"Любое", calm:"Спокойно", energy:"Энергично", focus:"Для фокуса", sad:"Меланхолично", happy:"Радостно", night:"Ночной вайб", warm:"Тепло" };
  const tastes = {
    mix:["Баланс","Сочетание выбранного и соседних жанров"],
    familiar:["Ближе к моему вкусу","Больше веса твоим оценкам"],
    discover:["Больше открытий","Новые артисты и соседние жанры"],
    precise:["Только мои жанры","Подбор внутри выбранных жанров"]
  };
  const catalog = [
  ["Поп","Dua Lipa|Levitating|happy energy","Robyn|Dancing On My Own|sad energy","The Weeknd|Blinding Lights|night energy","Carly Rae Jepsen|Run Away with Me|happy warm"],
  ["Инди-поп","Phoenix|Lisztomania|happy energy","Men I Trust|Show Me How|calm night","Japanese Breakfast|Be Sweet|happy warm","Alvvays|Archie, Marry Me|warm sad"],
  ["Альт-рок","Radiohead|Weird Fishes/Arpeggi|focus sad","The Strokes|Reptilia|energy night","Wolf Alice|Don't Delete the Kisses|night warm","Pixies|Where Is My Mind?|sad night"],
  ["Классический рок","Fleetwood Mac|Dreams|warm calm","David Bowie|Heroes|energy warm","The Rolling Stones|Gimme Shelter|energy night","Queen|Don't Stop Me Now|happy energy"],
  ["Панк","Ramones|Blitzkrieg Bop|energy happy","The Clash|London Calling|energy night","Buzzcocks|Ever Fallen in Love|energy sad"],
  ["Метал","Metallica|Master of Puppets|energy focus","Gojira|Stranded|energy night","Black Sabbath|Paranoid|energy night","Deftones|Change (In the House of Flies)|night sad"],
  ["Хип-хоп","A Tribe Called Quest|Electric Relaxation|calm warm","Kendrick Lamar|Money Trees|night calm","Outkast|B.O.B.|energy happy","Little Simz|Introvert|focus energy"],
  ["R&B","SZA|Good Days|calm sad","Frank Ocean|Pink + White|warm calm","Aaliyah|Rock the Boat|calm night","D'Angelo|Untitled (How Does It Feel)|night warm"],
  ["Хаус","Daft Punk|Around the World|energy happy","Stardust|Music Sounds Better with You|happy warm","Disclosure|Latch|energy night","Kerri Chandler|Atmosphere|night focus"],
  ["Техно","Jeff Mills|The Bells|energy night","Charlotte de Witte|Doppler|energy focus","Underworld|Rez|focus energy","Robert Hood|Minus|focus night"],
  ["Драм-н-бейс","LTJ Bukem|Horizons|focus night","Pendulum|Tarantula|energy night","High Contrast|If We Ever|energy happy","Goldie|Inner City Life|night sad"],
  ["Синтвейв","Kavinsky|Nightcall|night sad","The Midnight|Sunset|warm night","FM-84|Running in the Night|energy night","Timecop1983|On the Run|focus night"],
  ["Гараж","MJ Cole|Sincere|warm night","Artful Dodger|Re-Rewind|happy energy","Burial|Archangel|night sad"],
  ["Трип-хоп","Massive Attack|Teardrop|night calm","Portishead|Roads|sad night","Tricky|Hell Is Round the Corner|night focus"],
  ["Эмбиент","Brian Eno|An Ending (Ascent)|calm focus","Aphex Twin|Rhubarb|calm sad","Stars of the Lid|Requiem for Dying Mothers, Pt. 2|calm focus","Hiroshi Yoshimura|Blink|calm focus"],
  ["Лоу-фай","Nujabes|Aruarian Dance|focus warm","J Dilla|Time: The Donut of the Heart|calm warm","Jinsang|Affection|calm focus","Idealism|Both of Us|focus calm"],
  ["Джаз","Miles Davis|So What|focus calm","John Coltrane|Naima|calm sad","Dave Brubeck Quartet|Take Five|focus happy","Bill Evans|Peace Piece|calm focus"],
  ["Соул","Bill Withers|Lovely Day|happy warm","Marvin Gaye|What's Going On|warm calm","Aretha Franklin|I Say a Little Prayer|happy warm","Otis Redding|(Sittin’ On) The Dock of the Bay|warm sad"],
  ["Фанк","Stevie Wonder|Superstition|energy happy","Parliament|Give Up the Funk|energy happy","Chic|Good Times|happy warm","The Meters|Cissy Strut|focus happy"],
  ["Фолк","Nick Drake|Pink Moon|calm sad","Joni Mitchell|A Case of You|sad warm","Sufjan Stevens|Mystery of Love|warm calm","Fleet Foxes|Blue Ridge Mountains|warm energy"],
  ["Неоклассика","Ólafur Arnalds|Near Light|focus sad","Nils Frahm|Ambre|calm focus","Max Richter|On the Nature of Daylight|sad calm","Hania Rani|Glass|focus calm"]
  ].flatMap(([genre,...rows]) => rows.map(row => {
    const [artist,title,tags] = row.split("|");
    return { artist,title,genre,tags:tags.split(" ") };
  }));
  const related = [
    ["Поп","Инди-поп","R&B","Соул","Фанк"], ["Инди-поп","Альт-рок","Фолк","Классический рок"],
    ["Альт-рок","Панк","Классический рок","Метал"], ["Хаус","Техно","Гараж","Драм-н-бейс","Синтвейв"],
    ["Драм-н-бейс","Гараж","Трип-хоп","Хип-хоп","Лоу-фай"], ["Лоу-фай","Джаз","Соул","Хип-хоп"],
    ["Эмбиент","Неоклассика","Синтвейв","Трип-хоп"], ["Джаз","Соул","Фанк","R&B"]
  ];
  const allGenres = Object.values(groups).flat();
  const key = "quickwave:standalone:v1";
  const defaultStyle = {theme:"violet", accent:"", motion:true, compact:false};
  const defaults = { genres:[], mood:"any", taste:"mix", votes:{}, custom:[], appearance:defaultStyle };
  let state;
  let storageReady = true;
  try { state = {...defaults,...JSON.parse(Spicetify.LocalStorage.get(key) || localStorage.getItem(key) || "{}")}; }
  catch { state = {...defaults}; storageReady = false; }
  state.appearance={...defaultStyle,...state.appearance};
  const recent = new Map();
  let batch = [];
  let round = 0;
  const byId = id => view.getElementById(id);
  const idOf = t => JSON.stringify([t.artist.toLowerCase(),t.title.toLowerCase()]);
  const all = () => [...catalog,...state.custom];
  function save(){
    try { Spicetify.LocalStorage.set(key,JSON.stringify(state)); }
    catch { storageReady = false; }
  }
  function renderAppearance(){
    const {theme,accent,motion,compact}=state.appearance;
    const root=view.host;
    root.dataset.theme=theme;
    root.dataset.motion=motion?"on":"off";
    root.dataset.density=compact?"compact":"normal";
    const valid=/^#[a-f0-9]{6}$/i.test(accent);
    if(valid){
      root.style.setProperty("--glow-b",accent);
      root.style.setProperty("--accent",`color-mix(in srgb, ${accent} 43%, white)`);
    }else{
      root.style.removeProperty("--glow-b");
      root.style.removeProperty("--accent");
    }
    byId("theme").value=theme;
    byId("accent").value=valid?accent:({violet:"#dfccff",ocean:"#c6eaff",ember:"#ffd5c5",forest:"#c6eed1"}[theme]||"#dfccff");
    byId("motion").checked=motion;
    byId("compact").checked=compact;
  }
  function setAppearance(patch){
    state.appearance={...state.appearance,...patch};
    save();
    renderAppearance();
  }
  function change(patch){
    Object.assign(state,patch);save();renderChoices();
    if (round) selectBatch(false);
  }
  function element(tag,text,className){
    const node=document.createElement(tag);
    if(text)node.textContent=text;
    if(className)node.className=className;
    return node;
  }
  function toggle(text,on,handler,className="chip"){
    const button=element("button",text,className);
    button.type="button";button.setAttribute("aria-pressed",String(on));button.onclick=handler;
    return button;
  }
  function renderGenres(){
    const search=byId("genre-search").value.toLowerCase().trim().replaceAll("ё","е");
    const container=byId("genre-groups");
    container.replaceChildren();
    for(const [group,genres] of Object.entries(groups)){
      const visible=genres.filter(g=>g.toLowerCase().includes(search)||group.toLowerCase().includes(search));
      if(!visible.length)continue;
      const section=element("section");const chips=element("div","","chips");
      section.append(element("h3",group),chips);
      for(const genre of visible){
        const on=state.genres.includes(genre);
        chips.append(toggle(genre,on,()=>{
          change({genres:on?state.genres.filter(g=>g!==genre):[...state.genres,genre]});
          [...container.querySelectorAll("button")].find(button=>button.textContent===genre)?.focus();
        }));
      }
      container.append(section);
    }
    if(!container.children.length)container.append(element("p","Жанры не найдены.","muted"));
    byId("genre-count").textContent=state.genres.length?"Выбрано: "+state.genres.length:"Все жанры";
  }
  function renderChoices(){
    const taste=byId("taste");taste.replaceChildren();
    for(const [value,[label,description]] of Object.entries(tastes)){
      const button=toggle("",state.taste===value,()=>{change({taste:value});taste.children[Object.keys(tastes).indexOf(value)].focus();},"mode");
      button.append(element("strong",label),element("small",description));taste.append(button);
    }
    const mood=byId("moods");mood.replaceChildren();
    for(const [value,label] of Object.entries(moods))mood.append(toggle(label,state.mood===value,()=>{change({mood:value});mood.children[Object.keys(moods).indexOf(value)].focus();}));
    renderGenres();
  }
  function rank(tracks,preferences,seen,pass){
    const affinity=new Map();
    const genreWeights=new Map();
    const moodWeights=new Map();
    const normalize=artist=>artist.normalize("NFKC").toLowerCase().trim();
    function addEvidence(map,key,vote){
      const entry=map.get(key)||{sum:0,count:0};
      entry.sum+=vote;
      entry.count++;
      map.set(key,entry);
    }
    function affinityFor(map,key){
      const entry=map.get(key);
      return entry ? entry.sum/(entry.count+2) : 0;
    }
    for(const track of tracks){
      const vote=preferences.votes[idOf(track)]||0;
      if(!vote)continue;
      addEvidence(affinity,normalize(track.artist),vote);
      addEvidence(genreWeights,track.genre,vote);
      for(const tag of track.tags)addEvidence(moodWeights,tag,vote);
    }
    const chosen=new Set(preferences.genres);
    const adjacent=new Set(related.filter(list=>list.some(genre=>chosen.has(genre))).flat());
    return tracks.filter(t=>preferences.taste!=="precise"||!chosen.size||chosen.has(t.genre)).map(track=>{
      const id=idOf(track);
      const vote=preferences.votes[id]||0;
      const direct=chosen.has(track.genre);
      const neighbor=!direct&&adjacent.has(track.genre);
      const moodMatch=preferences.mood!=="any"&&track.tags.includes(preferences.mood);
      const last=seen.get(id);
      const taste=preferences.taste;
      const learned=taste==="familiar"?1.75:taste==="discover"?0.65:1;
      const genreAffinity=affinityFor(genreWeights,track.genre);
      const artistAffinity=affinityFor(affinity,normalize(track.artist));
      const tagAffinity=track.tags.reduce((sum,tag)=>sum+affinityFor(moodWeights,tag),0)/track.tags.length;
      const sameArtist=seen.get("artist:"+track.artist);
      const recency=last===undefined?0:Math.max(0,21-(pass-last)*3);
      const artistRecency=sameArtist===undefined?0:Math.max(0,4-(pass-sameArtist));
      const score=(direct?(taste==="discover"?7:11):neighbor?(taste==="discover"?6:4):0)+(moodMatch?7:preferences.mood==="any"?0:-2)
        + learned*(6*genreAffinity+8*artistAffinity+3*tagAffinity+vote*(taste==="discover"?1:4))
        + (taste==="discover"&&last===undefined?3:0)-recency-artistRecency
        + ((Array.from(id).reduce((n,c)=>Math.imul(n,31)+c.codePointAt(0),pass*31)>>>0)%1021)/1021;
      const reasons=[direct&&track.genre,neighbor&&"соседний жанр: "+track.genre,moodMatch&&moods[preferences.mood],
        artistAffinity>0&&"нравится исполнитель",artistAffinity<=0&&genreAffinity>0&&"по оценкам жанра",
        artistAffinity<=0&&genreAffinity<=0&&tagAffinity>0&&"по оценкам похожего настроения",last===undefined&&"ещё не показывался"].filter(Boolean);
      return {...track,id,vote,score,reasons};
    }).sort((a,b)=>b.score-a.score);
  }
  function selectBatch(advance){
    if(advance){
      for(const track of batch){recent.set(track.id,round);recent.set("artist:"+track.artist,round);}
      round++;
    }
    const ranked=rank(all(),state,recent,round).filter(track=>track.vote!==-1);
    const artists=new Set();
    const genreCounts=new Map();
    batch=[];
    while(batch.length<6){
      let best;
      let bestScore=-Infinity;
      for(const track of ranked){
        const artist=track.artist.normalize("NFKC").toLowerCase().trim();
        if(artists.has(artist))continue;
        const penalty=(genreCounts.get(track.genre)||0)*(state.taste==="discover"?4:2);
        if(track.score-penalty>bestScore){best={track,artist};bestScore=track.score-penalty;}
      }
      if(!best)break;
      artists.add(best.artist);
      genreCounts.set(best.track.genre,(genreCounts.get(best.track.genre)||0)+1);
      batch.push(best.track);
    }
    renderTracks();
  }
  function renderTracks(){
    const target=byId("results");target.replaceChildren();
    byId("status").textContent=(batch.length?"Треков в подборке: "+batch.length:"Измени жанры или оценки, чтобы расширить подборку.")+
      (storageReady?"":" · Браузер не сохранил профиль.");
    byId("next").disabled=!batch.length;
    for(const track of batch){
      const card=element("article","","track");
      const head=element("div","","track-header");
      const tile=element("span",track.artist[0].toUpperCase(),"tile");tile.setAttribute("aria-hidden","true");
      const label=element("div");label.append(element("h3",track.title),element("small",track.artist));head.append(tile,label);
      const actions=element("div","","actions");
      const link=element("a","Открыть в Spotify ↗","action play");
      link.href="https://open.spotify.com/search/"+encodeURIComponent(track.artist+" "+track.title);
      link.target="_blank";link.rel="noopener noreferrer";
    link.onclick=event=>{
      const history=Spicetify.Platform?.History;
      if(!history?.push||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      history.push(new URL(link.href).pathname);
    };
      function vote(value){
        if(state.votes[track.id]===value)delete state.votes[track.id];
        else state.votes[track.id]=value;
        save();
        const result=rank(all(),state,recent,round).find(item=>item.id===track.id);
        if(value===-1&&state.votes[track.id]===-1)selectBatch(false);
        else{batch=batch.map(item=>item.id===track.id?result:item);renderTracks();}
        byId("next").focus();
      }
      actions.append(link,toggle("＋ Больше такого",track.vote===1,()=>vote(1),"action"),toggle("− Меньше такого",track.vote===-1,()=>vote(-1),"action"));
      card.append(head,element("p",track.reasons.join(" · ")||track.genre),actions);target.append(card);
    }
  }
  byId("genre-search").oninput=renderGenres;
  byId("appearance").onclick=()=>byId("settings").showModal();
  byId("theme").onchange=event=>setAppearance({theme:event.target.value,accent:""});
  byId("accent").oninput=event=>setAppearance({accent:event.target.value});
  byId("motion").onchange=event=>setAppearance({motion:event.target.checked});
  byId("compact").onchange=event=>setAppearance({compact:event.target.checked});
  byId("reset-style").onclick=()=>setAppearance(defaultStyle);
  byId("start").onclick=()=>{selectBatch(true);byId("wave").scrollIntoView({block:"nearest"});byId("next").focus();};
  byId("next").onclick=()=>selectBatch(true);
  byId("reset").onclick=()=>{
    if(!confirm("Сбросить оценки треков?"))return;
    state.votes={};recent.clear();save();if(round)selectBatch(false);
  };
  for(const genre of allGenres)byId("custom-genre").append(new Option(genre,genre));
  for(const [value,label] of Object.entries(moods))if(value!=="any")byId("custom-mood").append(new Option(label,value));
  byId("custom").onsubmit=event=>{
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    const track={artist:form.get("artist").trim(),title:form.get("title").trim(),genre:form.get("genre"),tags:[form.get("mood")]};
    if(!track.artist||!track.title)return;
    if(all().some(existing=>idOf(existing)===idOf(track))){
      byId("status").textContent="Этот трек уже есть в каталоге.";return;
    }
    state.custom=[...state.custom,track];save();event.currentTarget.reset();
    if(round)selectBatch(false);
    byId("status").textContent="Трек добавлен в каталог.";
  };
  renderChoices();
  renderAppearance();
}
