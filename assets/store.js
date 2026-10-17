/* 过线 · 本机存储层（零依赖）

   所有进度都存浏览器 localStorage，没有后端、没有账号。
   「导出 / 导入 JSON」是换设备唯一的搬家方式，所以格式必须稳、必须能读回来。

   数据形状（cet4.v1）：
   {
     probe: { core: { answers: { word: 1|0 }, cursor: 3, startedAt, updatedAt, doneAt } },
     plan:  { unknown, daysLeft, recommended, ... } | null,
     srs:   { word: { box, due, seen, ok, wrong, streakOk, inBook, first, last } },
     days:  { "2026-10-11": { tier, newGoal, newDone, reviewGoal, reviewDone, done, ms } },
     listen:{ clips: { "news-01": { rounds, lastDone, due, replays, blindPlays, words: { word: "recog"|"unknown" } } } },
     readings: { "read-01": { rounds, lastDone, ms } },
     settings: { theme: "light" | "dark", tier: "std", rate: 0.8, voice: "", listenText: "shown" | "hidden" | "" }
   }

   说明：answers 用单词本身当键，不用下标 —— 这样以后词表加词、重新排序，
   已经扫过的判断依然跟得住那个词。cursor 只是「扫到第几个」的断点。 */

(function () {
  // 常量定义在 theme-boot.js 里（它是最早执行的脚本，必须在首绘前就知道主题）。
  // 这里回退到字面量，是为了万一没引入那个脚本时存储层仍然可用。
  var KEY = window.CET4_STORE_KEY || 'cet4.v1';

  function blank() {
    return {
      probe: {},
      plan: null,
      srs: {},
      days: {},
      listen: { clips: {} },
      readings: {},
      settings: { theme: '', tier: '', rate: 0.8, voice: '', listenText: '' },
      updatedAt: null,
    };
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return blank();
      var out = blank();
      out.probe = data.probe && typeof data.probe === 'object' ? data.probe : {};
      out.plan = data.plan || null;
      out.srs = data.srs && typeof data.srs === 'object' ? data.srs : {};
      out.days = data.days && typeof data.days === 'object' ? data.days : {};
      out.listen = data.listen && typeof data.listen === 'object' ? data.listen : { clips: {} };
      if (!out.listen.clips || typeof out.listen.clips !== 'object') out.listen.clips = {};
      out.readings = data.readings && typeof data.readings === 'object' ? data.readings : {};
      out.settings = data.settings && typeof data.settings === 'object' ? data.settings : {};
      if (out.settings.theme === undefined) out.settings.theme = '';
      if (out.settings.tier === undefined) out.settings.tier = '';
      if (!Number(out.settings.rate)) out.settings.rate = 0.8;
      if (out.settings.voice === undefined) out.settings.voice = '';
      // 精听里「显示原文」这个开关记在这儿：'shown' 显示、'hidden' 藏起、'' 还没选过。
      // 不记在 listen.clips 里，因为它管的是看图习惯，不是某一篇的进度。
      if (out.settings.listenText !== 'shown' && out.settings.listenText !== 'hidden') out.settings.listenText = '';
      out.updatedAt = data.updatedAt || null;
      return out;
    } catch (e) {
      // 存储坏了不能让页面白屏，退回空白状态
      return blank();
    }
  }

  function write(state) {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* 隐私模式 / 配额满：静默失败，页面照常能用，只是不留痕 */
    }
    return state;
  }

  function patch(fn) {
    var state = read();
    fn(state);
    return write(state);
  }

  // 某一层（core / leaf）的摸底记录，没有就建一个空的
  function layer(state, id) {
    if (!state.probe[id] || typeof state.probe[id] !== 'object') {
      state.probe[id] = { answers: {}, cursor: 0, startedAt: null, updatedAt: null, doneAt: null };
    }
    var rec = state.probe[id];
    if (!rec.answers || typeof rec.answers !== 'object') rec.answers = {};
    rec.cursor = Number(rec.cursor) || 0;
    return rec;
  }

  function counts(rec, total) {
    var answers = (rec && rec.answers) || {};
    var known = 0;
    var unknown = 0;
    for (var k in answers) {
      if (answers[k] === 1) known++;
      else unknown++;
    }
    var scanned = known + unknown;
    return {
      known: known,
      unknown: unknown,
      scanned: scanned,
      total: total,
      remaining: Math.max(0, total - scanned),
      done: total > 0 && scanned >= total,
    };
  }

  function exportJson() {
    return JSON.stringify(read(), null, 2);
  }

  /* ---------- 某一天的记录（今日页、背词页、进度页都读写它） ---------- */

  function day(state, key) {
    if (!state.days || typeof state.days !== 'object') state.days = {};
    var rec = state.days[key];
    if (!rec || typeof rec !== 'object') {
      rec = {
        tier: '',
        newGoal: 0,
        newDone: 0,
        reviewGoal: 0,
        reviewDone: 0,
        listenGoal: 0,
        listenDone: 0,
        readGoal: 0,
        readDone: 0,
        realAudio: false,
        done: false,
        ms: 0,
      };
      state.days[key] = rec;
    }
    rec.newDone = Number(rec.newDone) || 0;
    rec.reviewDone = Number(rec.reviewDone) || 0;
    rec.listenGoal = Number(rec.listenGoal) || 0;
    rec.listenDone = Number(rec.listenDone) || 0;
    rec.readGoal = Number(rec.readGoal) || 0;
    rec.readDone = Number(rec.readDone) || 0;
    rec.realAudio = Boolean(rec.realAudio);
    rec.ms = Number(rec.ms) || 0;
    rec.done = Boolean(rec.done);
    return rec;
  }

  /* ---------- 精听：每一篇的记录 ---------- */

  function clip(state, id) {
    if (!state.listen || typeof state.listen !== 'object') state.listen = { clips: {} };
    if (!state.listen.clips || typeof state.listen.clips !== 'object') state.listen.clips = {};
    var rec = state.listen.clips[id];
    if (!rec || typeof rec !== 'object') {
      rec = { rounds: 0, lastDone: '', due: '', replays: 0, blindPlays: 0, words: {} };
      state.listen.clips[id] = rec;
    }
    rec.rounds = Number(rec.rounds) || 0;
    rec.replays = Number(rec.replays) || 0;
    rec.blindPlays = Number(rec.blindPlays) || 0;
    if (!rec.words || typeof rec.words !== 'object') rec.words = {};
    return rec;
  }

  /* ---------- 短读：每一篇的记录 ---------- */

  function reading(state, id) {
    if (!state.readings || typeof state.readings !== 'object') state.readings = {};
    var rec = state.readings[id];
    if (!rec || typeof rec !== 'object') {
      rec = { rounds: 0, lastDone: '', ms: 0 };
      state.readings[id] = rec;
    }
    rec.rounds = Number(rec.rounds) || 0;
    rec.ms = Number(rec.ms) || 0;
    return rec;
  }

  /* ---------- 每个词的间隔重复记录 ---------- */

  function entry(state, word, today) {
    if (!state.srs || typeof state.srs !== 'object') state.srs = {};
    var rec = state.srs[word];
    if (!rec || typeof rec !== 'object') {
      rec = { box: 0, due: today, seen: 0, ok: 0, wrong: 0, streakOk: 0, inBook: false, first: today, last: today };
      state.srs[word] = rec;
    }
    return rec;
  }

  // 导入：整份替换。返回 { ok, error }
  function importJson(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: '不是合法的 JSON 文件' };
    }
    if (!data || typeof data !== 'object' || (!data.probe && !data.plan && !data.settings)) {
      return { ok: false, error: '这个 JSON 里没有本站的进度数据' };
    }
    write(data);
    return { ok: true };
  }

  window.CET4_STORE = {
    KEY: KEY,
    read: read,
    write: write,
    patch: patch,
    layer: layer,
    day: day,
    entry: entry,
    clip: clip,
    reading: reading,
    counts: counts,
    exportJson: exportJson,
    importJson: importJson,
    blank: blank,
  };
})();
