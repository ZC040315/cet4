/* 过线 · 本机存储层（零依赖）

   所有进度都存浏览器 localStorage，没有后端、没有账号。
   「导出 / 导入 JSON」是换设备唯一的搬家方式，所以格式必须稳、必须能读回来。

   数据形状（cet4.v1）：
   {
     probe: { core: { answers: { word: 1|0 }, cursor: 3, startedAt, updatedAt, doneAt } },
     plan:  { unknown, daysLeft, recommended, ... } | null,
     settings: { theme: "light" | "dark" }
   }

   说明：answers 用单词本身当键，不用下标 —— 这样以后词表加词、重新排序，
   已经扫过的判断依然跟得住那个词。cursor 只是「扫到第几个」的断点。 */

(function () {
  var KEY = 'cet4.v1';

  function blank() {
    return { probe: {}, plan: null, settings: { theme: '' }, updatedAt: null };
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
      out.settings = data.settings && typeof data.settings === 'object' ? data.settings : { theme: '' };
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
    counts: counts,
    exportJson: exportJson,
    importJson: importJson,
    blank: blank,
  };
})();
