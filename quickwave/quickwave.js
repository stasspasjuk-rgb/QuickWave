(() => {
  "use strict";

  const key = "quickwave:profile:v1";
  const trackUri = /^spotify:track:[A-Za-z0-9]{22}$/;
  const day = 86_400_000;
  // The desktop search bundle is lazy-loaded. This is the native searchPlaylists operation
  // observed in the local Spotify bundle, used only until the client registers its definition.
  const playlistSearchHash = "d520014e748f9ea44f7707d8df1819867ac1205e8b7f3e28f22fe5fc858921b1";
  const moods = { any: "", calm: "chill calm", energy: "energy workout", focus: "focus concentration", sad: "sad melancholic", happy: "feel good upbeat" };
  const defaults = { mood: "any", genres: [], taste: "mix", learn: true };
  const newProfile = () => ({ tracks: {}, settings: { ...defaults } });
  const listeners = new Set();
  const cache = new Map();
  let profile = newProfile();
  let session;
  let pending;
  let currentPick;
  let active = false;
  let busy = false;
  let loading = false;
  let generation = 0;
  let nextRetry = 0;
  let refreshAt = 0;
  let pool = [];
  let note = "";
  let storageError = false;
  let savedCheckAt = 0;
  let savedCursor = 0;
  let S;

  function load() {
    try {
      const stored = JSON.parse(S.LocalStorage.get(key) || "null");
      if (stored?.tracks && stored.settings) {
        profile = { tracks: stored.tracks, settings: { ...defaults, ...stored.settings } };
      }
    } catch {
      storageError = true;
    }
  }

  function save() {
    try {
      const entries = Object.entries(profile.tracks);
      if (entries.length > 2000) {
        entries.sort((a, b) => Number(b[1].liked) - Number(a[1].liked) || b[1].at - a[1].at);
        profile.tracks = Object.fromEntries(entries.slice(0, 2000));
      }
      S.LocalStorage.set(key, JSON.stringify(profile));
      storageError = false;
    } catch {
      storageError = true;
    }
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function itemTrack(item) {
    const data = item?.itemV2?.data || item?.track?.data || item?.track || item?.data || item;
    const uri = data?.uri || item?.uri || data?.link;
    if (!trackUri.test(uri) || data.isPlayable === false || data.playability?.playable === false) return null;
    const metadata = data.metadata || {};
    const artists = Array.isArray(data.artists) ? data.artists : data.artists?.items;
    const first = artists?.[0];
    const artist = first?.name || first?.profile?.name || data.artist?.name || metadata.artist_name || "";
    const artistId = first?.uri || data.artist?.uri || metadata.artist_uri || artist.toLowerCase();
    const image = metadata.image_url || data.albumOfTrack?.coverArt?.sources?.[0]?.url ||
      data.album?.images?.[0]?.url || data.album?.image?.url || data.images?.[0]?.url || data.image?.url;
    const cover = /^spotify:image:[a-f0-9]+$/i.test(image) ? "https://i.scdn.co/image/" + image.split(":")[2] :
      /^https:\/\/(?:i\.scdn\.co|image-cdn-[a-z0-9]+\.spotifycdn\.com)\//i.test(image) ? image : "";
    return { uri, name: data.name || metadata.title || "", artist, artistId, cover };
  }

  function row(track) {
    const r = profile.tracks[track.uri] ||= { plays: 0, skips: 0, completed: 0, ms: 0, liked: false, at: Date.now() };
    if (track.name) r.name = track.name;
    if (track.artist) r.artist = track.artist;
    if (track.artistId) r.artistId = track.artistId;
    return r;
  }

  function privateSession() {
    const state = S.Player.data;
    return state?.isPrivateSession === true || state?.options?.isPrivateSession === true ||
      state?.options?.privateSession === true || state?.options?.private_session === true ||
      S.Platform?.Session?.isPrivateSession === true;
  }

  function setLiked(track, liked) {
    const existing = profile.tracks[track.uri];
    if ((!existing && !liked) || existing?.liked === liked) return false;
    const r = row(track);
    r.liked = liked;
    r.at = Date.now();
    return true;
  }

  async function checkSaved() {
    if (Date.now() < savedCheckAt || !profile.settings.learn || privateSession()) return;
    savedCheckAt = Date.now() + 45_000;
    const library = S.Platform?.LibraryAPI;
    if (!library?.contains) return;
    const snapshot = profile;
    const known = Object.entries(profile.tracks).sort((a, b) => b[1].at - a[1].at);
    const recent = known.slice(0, 8);
    const older = known.slice(8);
    if (savedCursor >= older.length) savedCursor = 0;
    const batch = [...recent, ...older.slice(savedCursor, savedCursor + 22)];
    savedCursor += 22;
    if (!batch.length) return;
    try {
      const flags = await library.contains(...batch.map(([uri]) => uri));
      if (snapshot !== profile || !profile.settings.learn || privateSession() || !Array.isArray(flags)) return;
      let changed = false;
      batch.forEach(([uri, previous], i) => {
        if (typeof flags[i] === "boolean" && profile.tracks[uri] === previous) {
          changed = setLiked({ ...previous, uri }, flags[i]) || changed;
        }
      });
      if (changed) { save(); emit(); }
    } catch {
      // A failed library read leaves the previous saved state intact.
    }
  }

  function finish(allowSkip) {
    if (!session?.ms && !session?.liked) return;
    const r = row(session.track);
    if (session.genre) r.genre = session.genre;
    if (typeof session.liked === "boolean") r.liked = session.liked;
    const duration = session.duration;
    const counted = session.ms >= Math.min(30_000, duration ? duration * 0.5 : 30_000);
    const completed = duration > 0 && session.ms >= duration * 0.75;
    if (counted) r.plays++;
    if (completed) r.completed++;
    if (allowSkip && !session.partial && session.ms > 0 && session.ms < Math.min(20_000, duration ? duration * 0.25 : 20_000)) r.skips++;
    r.ms += Math.round(session.ms);
    r.at = Date.now();
    save();
    emit();
  }

  function sample() {
    const now = Date.now();
    const player = S.Player;
    const item = player.data?.item;
    const track = itemTrack(item);
    if (pending && pending.uri === track?.uri && currentPick !== pending) {
      currentPick = pending;
      pending = null;
      emit();
    } else if (currentPick && track?.uri !== currentPick.uri) {
      currentPick = null;
      emit();
    }
    if (!profile.settings.learn || privateSession()) { session = null; return; }
    const pos = Number(player.getProgress?.()) || 0;
    const duration = Number(player.getDuration?.()) || 0;
    const playing = player.isPlaying?.() === true;
    const repeated = session && track?.uri === session.track.uri &&
      session.duration > 0 && session.pos > 3000 && session.duration - session.pos < 6500 && pos < 3000;
    if (!session || session.track.uri !== track?.uri || (item?.uid && session.uid && item.uid !== session.uid) || repeated) {
      if (session) {
        const tail = now - session.now;
        if (session.playing && tail >= 350 && tail <= 3000) {
          session.ms += session.duration ? Math.min(tail, Math.max(0, session.duration - session.pos)) : tail;
        }
        finish(true);
      }
      session = track ? { track, uid: item.uid, pos, now, duration, playing, ms: 0, partial: pos > 5000, genre: currentPick?.genre } : null;
    } else {
      const elapsed = now - session.now;
      const advanced = pos - session.pos;
      if (session.playing && elapsed <= 6000 && advanced > 0 && advanced <= elapsed + 900) {
        session.ms += Math.min(advanced, elapsed);
      }
      Object.assign(session, { pos, now, playing, duration: duration || session.duration });
    }
    if (session) {
      let heart;
      try { heart = player.getHeart?.(); } catch { /* Library polling is the fallback. */ }
      if (typeof heart === "boolean" && session.liked !== heart) {
        session.liked = heart;
        if (setLiked(track, heart)) { save(); emit(); }
      }
    }
  }

  function weight(r) {
    const recency = Math.pow(0.5, Math.max(0, Date.now() - r.at) / (45 * day));
    return (r.liked ? 6 : 0) + recency * (
      Math.min(r.plays, 12) * 0.9 + Math.min(r.completed, 10) * 0.6 +
      Math.min(r.ms / 180_000, 10) * 0.3 - Math.min(r.skips, 10) * 1.8
    );
  }

  function timed(request) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Spotify не ответил вовремя")), 10_000);
      Promise.resolve().then(request).then(
        value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); }
      );
    });
  }

  async function cached(id, ttl, request) {
    const entry = cache.get(id);
    if (entry?.until > Date.now()) return entry.value;
    const value = await timed(request);
    if (cache.size >= 90) cache.delete(cache.keys().next().value);
    cache.set(id, { value, until: Date.now() + ttl });
    return value;
  }

  async function search(variables) {
    const api = S.GraphQL;
    if (!api?.Request) throw new Error("Поиск Spotify недоступен в этой версии клиента");
    const name = "searchPlaylists";
    let definition = api.Definitions?.[name];
    if (!definition) {
      const sample = Object.values(api.Definitions || {}).find(entry => entry?.constructor && entry.constructor !== Object);
      definition = sample
        ? new sample.constructor(name, "query", playlistSearchHash, null)
        : { name, operationName: name, operation: "query", sha256Hash: playlistSearchHash, value: null };
    }
    const result = await api.Request(definition, variables);
    if (!result || result.errors?.length) throw new Error("Spotify не вернул данные");
    return result.data || result;
  }

  function playlists(term, offset) {
    return cached(`search:${term}:${offset}`, 20 * 60_000, async () => {
      const data = await search({
        searchTerm: term, offset, limit: 5, numberOfTopResults: 3,
        includeAudiobooks: false, includePreReleases: false, includeAlbumPreReleases: false,
        includeAuthors: false, includeEpisodeContentRatingsV2: false
      });
      const items = data.searchV2?.playlists?.items;
      if (!Array.isArray(items)) throw new Error("Формат поиска Spotify изменился");
      return items.map(item => item?.itemV2?.data?.uri || item?.data?.uri || item?.uri)
        .filter(uri => /^spotify:playlist:[A-Za-z0-9]{22}$/.test(uri));
    });
  }

  function contents(uri) {
    return cached(uri, 20 * 60_000, async () => {
      const result = await S.Platform.PlaylistAPI.getContents(uri, { limit: 65 });
      if (!Array.isArray(result?.items)) throw new Error("Плейлист недоступен");
      return result.items.map(itemTrack).filter(Boolean);
    });
  }

  async function refresh(settings, round, token) {
    const seeds = Object.entries(profile.tracks).map(([uri, r]) => ({ ...r, uri, weight: weight(r) }))
      .filter(r => r.weight > 0.75).sort((a, b) => b.weight - a.weight).slice(0, 35);
    const seedByUri = new Map(seeds.map(r => [r.uri, r]));
    const artists = [...new Set(seeds.map(r => r.artist).filter(Boolean))].slice(0, 8);
    const mood = moods[settings.mood];
    const genre = settings.genres.length ? settings.genres[round % settings.genres.length] : "";
    const learnedGenre = seeds.find(seed => seed.genre && seed.plays >= 2)?.genre;
    const queries = new Map();
    if (genre || mood) queries.set([genre, mood].filter(Boolean).join(" "), { genre, mood });
    if (genre && mood) {
      queries.set(genre, { genre });
      queries.set(mood, { mood });
    }
    if (!genre && learnedGenre) queries.set([learnedGenre, mood].filter(Boolean).join(" "), { genre: learnedGenre, mood });
    const artist = artists[round % artists.length];
    if (artist) queries.set(`${artist} mix`, { artist });
    if (!queries.size) queries.set("music hits", {});

    const candidates = new Map();
    const add = (track, clues) => {
      const candidate = candidates.get(track.uri) || { ...track, genre: "", mood: "", link: "", liked: false };
      if (!candidate.cover && track.cover) candidate.cover = track.cover;
      for (const field of ["genre", "mood", "link", "liked"]) {
        if (clues[field]) candidate[field] = clues[field];
      }
      candidates.set(track.uri, candidate);
    };
    for (const r of seeds) add(r, { liked: r.liked });
    const jobs = [
      cached("library", 90_000, async () => {
        const library = S.Platform.LibraryAPI;
        const result = await library.getTracks({ limit: 100, offset: 0, sort: { field: "ADDED_AT", order: "DESC" } });
        const items = result?.items || result?.tracks;
        if (!Array.isArray(items)) throw new Error("Медиатека недоступна");
        return items.map(itemTrack).filter(Boolean);
      }).then(items => {
        if (token !== generation) return;
        let changed = false;
        for (const track of items) {
          add(track, { liked: true });
          if (settings.learn && !privateSession()) changed = setLiked(track, true) || changed;
        }
        if (changed) save();
      }),
      ...[...queries].map(async ([term, tags]) => {
        const offset = (Math.floor(round / Math.max(1, settings.genres.length)) % 4) * 5;
        let uris = await playlists(term, offset);
        if (!uris.length && offset) uris = await playlists(term, 0);
        if (token !== generation) return;
        const results = await Promise.allSettled(uris.slice(0, 2).map(contents));
        if (results.length && results.every(result => result.status === "rejected")) throw results[0].reason;
        for (const result of results) {
          if (result.status !== "fulfilled") continue;
          const anchor = result.value.map(track => seedByUri.get(track.uri)).filter(Boolean)
            .sort((a, b) => b.weight - a.weight)[0];
          const artistMatch = tags.artist && result.value.some(track => track.artist.toLowerCase() === tags.artist.toLowerCase());
          for (const track of result.value) add(track, { ...tags, link: anchor?.name || (artistMatch ? tags.artist : "") });
        }
      })
    ];
    const results = await Promise.allSettled(jobs);
    if (token !== generation) return;
    pool = [...candidates.values()];
    refreshAt = Date.now() + (pool.length ? 90_000 : 25_000);
    const searchFailed = results.slice(1).every(result => result.status === "rejected");
    note = searchFailed ? "Поиск Spotify недоступен. Подбор из медиатеки и профиля." :
      (genre || mood) && !pool.some(track => track.genre || track.mood)
        ? "По этим настройкам подборки пусты. Используется профиль и медиатека." : "";
  }

  function choose(excluded) {
    const now = Date.now();
    const { taste, mood, genres } = profile.settings;
    const affinity = new Map();
    const tracks = Object.values(profile.tracks);
    const recentArtists = new Set(tracks.filter(r => r.ms && now - r.at < 12 * 60_000).map(r => r.artistId).filter(Boolean));
    const learnedGenres = new Set(tracks.filter(r => r.genre && r.plays >= 2 && weight(r) > 1).map(r => r.genre));
    const currentArtist = itemTrack(S.Player.data?.item)?.artistId;
    for (const r of tracks) {
      if (r.artistId) affinity.set(r.artistId, (affinity.get(r.artistId) || 0) + weight(r));
    }
    const ranked = [];
    for (const candidate of pool) {
      if (excluded.has(candidate.uri)) continue;
      const r = profile.tracks[candidate.uri];
      const known = Boolean(candidate.liked || r?.liked || r?.plays);
      const artistWeight = Math.max(-5, Math.min(6, (affinity.get(candidate.artistId) || 0) * 0.5));
      const genreMatch = genres.includes(candidate.genre);
      const genreAffinity = learnedGenres.has(candidate.genre);
      const moodMatch = mood !== "any" && candidate.mood === moods[mood];
      const linked = Boolean(candidate.link);
      const recent = r?.ms && now - r.at < 120 * 60_000;
      const nearArtist = candidate.artistId && (candidate.artistId === currentArtist || recentArtists.has(candidate.artistId));
      const score = (genreMatch ? 10 : genreAffinity ? 4 : 0) + (moodMatch ? 7 : 0) + (linked ? 3 : 0) + artistWeight +
        (taste === "discover" ? (known ? -4 : 5) : taste === "favorites" ? (known ? 6 : -2) : (known ? 1 : 2)) +
        (r?.liked || candidate.liked ? 2 : 0) - Math.min(r?.skips || 0, 5) * 2 -
        (recent ? 18 : 0) - (nearArtist ? 9 : 0) + Math.random() * 1.5;
      const reasons = [
        genreMatch && `жанровая подборка «${candidate.genre}»`,
        !genreMatch && genreAffinity && `часто слушаешь «${candidate.genre}»`,
        moodMatch && "подборка по настроению",
        linked && `в подборке с «${candidate.link}»`,
        artistWeight > 1 && "артист из твоего профиля",
        (r?.liked || candidate.liked) && "из любимых треков",
        !known && "новый для профиля трек"
      ].filter(Boolean);
      ranked.push({ ...candidate, score, reason: reasons.join(" · ") || "из истории QuickWave" });
    }
    return ranked.sort((a, b) => b.score - a.score)[0];
  }

  let round = 0;
  async function feed(start = false) {
    if (!active || busy || Date.now() < nextRetry) return;
    busy = true;
    const token = generation;
    try {
      const getQueue = S.Platform?.PlayerAPI?.getQueue;
      const q = getQueue ? await timed(() => S.Platform.PlayerAPI.getQueue()).catch(() => null) : null;
      if (token !== generation || !active) return;
      const queued = Array.isArray(q?.queued) ? q.queued : null;
      const next = S.Queue?.nextTracks;
      const listed = queued || (Array.isArray(next) ? next : null);
      const uriOf = item => item?.uri || item?.contextTrack?.uri;
      if (pending && (!listed || listed.some(item => uriOf(item) === pending.uri) || Date.now() - pending.queuedAt < 12_000)) return;
      pending = null;
      loading = true;
      emit();
      if (Date.now() >= refreshAt || !pool.length) await refresh(profile.settings, round++, token);
      if (token !== generation || !active) return;
      const excluded = new Set((listed || []).map(uriOf));
      excluded.add(S.Player.data?.item?.uri);
      const pick = choose(excluded);
      if (!pick) {
        note = "Нет подходящих треков. Добавь любимые треки или попробуй другой жанр.";
        nextRetry = Date.now() + 25_000;
        if (start) active = false;
        return;
      }
      if (start && !S.Player.isPlaying?.() && queued?.length === 0) {
        pending = { ...pick, queuedAt: Date.now() };
        try { await S.Player.playUri(pick.uri); }
        catch (error) { pending = null; throw error; }
        if (token !== generation) return;
        nextRetry = Date.now() + 1200;
      } else {
        await S.addToQueue([{ uri: pick.uri }]);
        pending = { ...pick, queuedAt: Date.now() };
        if (start && token === generation && !S.Player.isPlaying?.()) {
          if (S.Player.data?.item) S.Player.play();
          else S.Player.next();
        }
      }
    } catch (error) {
      if (token === generation) {
        note = "Spotify не запустил трек или не принял очередь. QuickWave попробует снова.";
        nextRetry = Date.now() + 15_000;
        console.warn("[QuickWave]", error);
      }
    } finally {
      busy = false;
      if (loading) { loading = false; emit(); }
    }
  }

  function init() {
    S = globalThis.Spicetify;
    if (!S?.Player?.addEventListener || !S?.Player?.getProgress || !S.LocalStorage || !S.addToQueue) {
      setTimeout(init, 700);
      return;
    }
    if (globalThis.QuickWave) return;
    load();
    globalThis.QuickWave = {
      snapshot: () => ({
        settings: profile.settings, active, busy: loading, note, storageError, currentPick, pending,
        count: Object.keys(profile.tracks).length,
        plays: Object.values(profile.tracks).reduce((sum, r) => sum + r.plays, 0)
      }),
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      toggle() {
        if (active) {
          active = false;
          generation++;
          emit();
          return;
        }
        active = true;
        note = "";
        nextRetry = 0;
        emit();
        void feed(true);
      },
      settings(patch) {
        if (patch.learn === false && !privateSession()) finish(false);
        if ("learn" in patch) { session = null; cache.delete("library"); }
        profile.settings = { ...profile.settings, ...patch };
        generation++;
        refreshAt = 0;
        nextRetry = 0;
        round = 0;
        save();
        emit();
        void feed();
      },
      reset() {
        session = null;
        profile = { ...newProfile(), settings: profile.settings };
        generation++;
        refreshAt = 0;
        pool = [];
        cache.clear();
        savedCursor = 0;
        save();
        emit();
      }
    };
    if(typeof fetch==="function" && typeof S.showNotification==="function"){
      globalThis.QuickWave.startupRelease=fetch("https://api.github.com/repos/stasspasjuk-rgb/QuickWave/releases/latest",{signal:AbortSignal.timeout(12000)})
        .then(response=>{
          if(!response.ok)throw new Error();
          return response.json();
        }).then(release=>{
          if(release.draft||release.prerelease||!/^v\d+\.\d+\.\d+$/.test(release.tag_name))throw new Error();
          const installed=[2,4,3];
          const remote=release.tag_name.slice(1).split(".").map(Number);
          const first=remote.findIndex((value,index)=>value!==installed[index]);
          const update=first>=0&&remote[first]>installed[first]?release.tag_name:null;
          S.showNotification(update?"Доступна новая версия QuickWave "+update.slice(1)+". Открой QuickWave, чтобы обновить.":"Установлена последняя версия QuickWave");
          return update;
        }).catch(()=>null);
    }
    if(S.Playbar?.Button && S.Platform?.History?.push){
      new S.Playbar.Button("Открыть QuickWave",'<path d="M2 12h4l3-7 5 14 4-10 2 3h2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',()=>{
        const history=S.Platform.History;
        if(history.location?.pathname!=="/quickwave")history.push("/quickwave");
        else globalThis.dispatchEvent(new Event("quickwave:reopen"));
      });
    }
    S.Player.addEventListener("songchange", () => { sample(); void feed(); });
    S.Player.addEventListener("onplaypause", sample);
    setInterval(() => { sample(); void checkSaved(); void feed(); }, 2200);
    globalThis.addEventListener?.("pagehide", () => {
      if (profile.settings.learn && !privateSession()) finish(false);
    });
    sample();
  }

  init();
})();
