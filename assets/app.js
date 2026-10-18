/* 过线 · 全站共用的小东西：顶栏、深色开关、进度汇总、导出导入。

   页面脚本的加载顺序固定为：store.js → plan.js → app.js → 各页自己的脚本。 */

(function () {
  var S = window.CET4_STORE;
  var P = window.CET4_PLAN;

  /* ---------- 深色开关 ---------- */

  function applyTheme(mode) {
    var root = document.documentElement;
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.textContent = mode === 'dark' ? '浅色' : '深色';
  }

  function initTheme() {
    var state = S.read();
    var mode = state.settings && state.settings.theme === 'dark' ? 'dark' : 'light';
    applyTheme(mode);
    var btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      S.patch(function (s) {
        if (!s.settings) s.settings = {};
        s.settings.theme = next;
      });
      applyTheme(next);
    });
  }

  /* ---------- 顶栏当前页高亮 ---------- */

  function initNav() {
    var here = location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.nav a');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href === here) links[i].setAttribute('aria-current', 'page');
    }
  }

  /* ---------- 摸底进度汇总（主干词） ---------- */

  function coreTable() {
    return window.CET4_WORDS_CORE && window.CET4_WORDS_CORE.words ? window.CET4_WORDS_CORE : null;
  }

  function coreWords() {
    var t = coreTable();
    return t ? t.words : [];
  }

  // 摸底里「认识 / 不认识」的判断（背词阶段用它挑新词）
  function answers() {
    return S.layer(S.read(), 'core').answers;
  }

  function todayKey() {
    return window.CET4_SRS.dateKey();
  }

  function summary() {
    var table = coreTable();
    var total = table ? table.words.length : 0;
    var state = S.read();
    var rec = S.layer(state, 'core');
    var c = S.counts(rec, total);
    c.startedAt = rec.startedAt || null;
    c.doneAt = rec.doneAt || null;
    return c;
  }

  function savePlan(plan) {
    S.patch(function (s) {
      s.plan = plan;
    });
    return plan;
  }

  // 首页 / 摸底页 / 结果页都用这一个入口算「每天该背多少」
  function currentPlan() {
    var s = summary();
    var plan = P.planFor({ unknown: s.unknown, remainingScan: s.remaining });
    plan.scanned = s.scanned;
    plan.known = s.known;
    plan.total = s.total;
    plan.done = s.done;
    return plan;
  }

  /* ---------- 档位（四档）与今天的目标 ---------- */

  // 没说选哪档时，用摸底算出来的推荐量对应的那一档
  function defaultMode() {
    var plan = currentPlan();
    var rec = plan.recommended || 0;
    for (var i = 0; i < P.MODES.length; i++) if (P.MODES[i].newWords >= rec) return P.MODES[i];
    return P.MODES[P.MODES.length - 1];
  }

  function modeFor(state, key) {
    var day = S.day(state, key);
    var id = day.tier || (state.settings && state.settings.tier) || '';
    return P.modeById(id) || defaultMode();
  }

  // 把今天的目标写回存储：新词按档位、复习取「到期数」和档位上限里小的那个
  function applyGoals(state, key) {
    var mode = modeFor(state, key);
    var rec = S.day(state, key);
    rec.tier = mode.id;
    // 新词额度不能超过「今天开始时还剩多少词」：当前剩余 + 今天已经做过的。
    // 只按当前剩余算的话，每答一个词额度就缩一格，今天会提前算完成。
    // 词表背完后额度归 0，否则今日页永远差几个新词，今天和连续天数都完不成。
    var pool = window.CET4_SRS.countNewPool(state.srs || {}, coreWords(), answers());
    rec.newGoal = Math.min(mode.newWords, pool + (Number(rec.newDone) || 0));
    rec.reviewGoal = Math.min(mode.reviewCap, window.CET4_SRS.countDue(state.srs || {}, coreWords(), key));
    rec.listenGoal = mode.listen || 0;
    rec.readGoal = mode.read || 0;
    rec.done = window.CET4_SRS.dayDone(rec);
    return rec;
  }

  function todayState() {
    var state = S.read();
    var key = todayKey();
    applyGoals(state, key);
    var mode = modeFor(state, key);
    return { state: state, key: key, day: state.days[key], mode: mode };
  }

  function setTier(id) {
    S.patch(function (state) {
      if (!state.settings) state.settings = {};
      state.settings.tier = id;
      S.day(state, todayKey()).tier = id;
      applyGoals(state, todayKey());
    });
  }

  // 「只有 10 分钟」用这个：只降今天，明天自动回到你原来选的档
  function setTierToday(id) {
    S.patch(function (state) {
      S.day(state, todayKey()).tier = id;
      applyGoals(state, todayKey());
    });
  }

  // 从开始那天算起是第几天（摸底完成那天算第 1 天）
  function startKey() {
    var state = S.read();
    var fromProbe = state.probe && state.probe.core && state.probe.core.doneAt;
    var keys = Object.keys(state.days || {}).sort();
    var candidates = [];
    if (fromProbe) candidates.push(window.CET4_SRS.dateKey(fromProbe));
    if (keys.length) candidates.push(keys[0]);
    if (!candidates.length) return todayKey();
    candidates.sort();
    return candidates[0];
  }

  function dayNumber() {
    return window.CET4_SRS.diffDays(startKey(), todayKey()) + 1;
  }

  /* ---------- 精听 ---------- */

  function listenTable() {
    return window.CET4_LISTENING && window.CET4_LISTENING.clips && window.CET4_LISTENING.clips.length
      ? window.CET4_LISTENING
      : null;
  }

  function clips() {
    var t = listenTable();
    return t ? t.clips : [];
  }

  function clipById(id) {
    var list = clips();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // 「认识但没听出来」和「不认识」两类，全站累计。两个数字都从每篇的逐词分类里算出来，
  // 不单独存一份，免得两处对不上。
  function listenTally(state) {
    var clipsRec = (state && state.listen && state.listen.clips) || {};
    var tally = { recognized: 0, unknown: 0, words: [] };
    clips().forEach(function (clip) {
      var rec = clipsRec[clip.id];
      if (!rec || !rec.words) return;
      Object.keys(rec.words).forEach(function (w) {
        if (rec.words[w] === 'unknown') {
          tally.unknown++;
          tally.words.push({ w: w, clip: clip.id, clipType: clip.type });
        } else if (rec.words[w] === 'recog') {
          tally.recognized++;
        }
      });
    });
    return tally;
  }

  // 今天该重听的（做过、且到期）
  function listenDue(state, key) {
    var clipsRec = (state && state.listen && state.listen.clips) || {};
    return clips().filter(function (clip) {
      var rec = clipsRec[clip.id];
      return Boolean(rec && rec.lastDone && rec.due && rec.due <= key);
    });
  }

  // 生词的释义：在主干词和叶子词里查（都是 ECDICT 的原文，不自己编）
  function wordGloss(word) {
    var w = String(word || '').toLowerCase();
    var tables = [window.CET4_WORDS_CORE, window.CET4_WORDS_LEAF];
    for (var t = 0; t < tables.length; t++) {
      var list = tables[t] && tables[t].words;
      if (!list) continue;
      for (var i = 0; i < list.length; i++) {
        // 兜一层：万一数据里混进字面量 \n，也别让它显示成文本
        if (list[i].w === w) return String(list[i].zh).replace(/\\r\\n|\\n|\\r/g, ' ');
      }
    }
    return '';
  }

  /* ---------- 短读 ---------- */

  function readingTable() {
    return window.CET4_READINGS && window.CET4_READINGS.readings && window.CET4_READINGS.readings.length
      ? window.CET4_READINGS
      : null;
  }

  function readings() {
    var t = readingTable();
    return t ? t.readings : [];
  }

  function readingById(id) {
    var list = readings();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function readingWordCount(r) {
    var text = (r.paras || []).join(' ');
    return (text.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
  }

  /* 把短读标注的生词丢进背词的错词本。
     这些词一定是四级词表里的（scripts/check-data.mjs 会把关），所以
     seen=1 + box=1 + due 明天，就等于「今天学过、明天开始复习」——
     它会和背词流程用同一套盒号往前走，而不是另起一个生词本。 */
  function addToBook(word) {
    var key = todayKey();
    var added = false;
    S.patch(function (state) {
      var w = String(word || '').toLowerCase();
      var e = S.entry(state, w, key);
      if (e.inBook) return;
      added = true;
      e.seen = Math.max(1, e.seen || 0);
      e.box = Math.max(1, e.box || 0);
      e.due = window.CET4_SRS.addDays(key, 1);
      e.inBook = true;
      e.streakOk = 0;
      e.src = 'reading';
      if (!e.first) e.first = key;
      e.last = key;
    });
    return added;
  }

  /* ---------- 「每天该背多少」那段结论，首页和摸底结果页共用 ---------- */

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* 读一个单词 / 一句话：有 TTS 就播，没有就安静地什么都不做。
     所有播放都由点击触发 —— iOS Safari 要求用户手势，且自动出声很吓人。 */
  function say(text) {
    if (!text || !window.CET4_TTS || !window.CET4_TTS.supported) return false;
    window.CET4_TTS.speak(String(text), { rate: 0.9 });
    return true;
  }

  function planHtml(plan) {
    // 考完了就不再给每日额度：一张说明卡，代替整张档位表和各种「每天 N 个」的算式
    if (plan.over) {
      return (
        '<div class="card">' +
        '<h2>这一场已经结束了</h2>' +
        '<p class="muted">按本站记的考试日期（' + esc(P.EXAM_LABEL) + '）算，现在再排「每天背多少」已经没有意义，所以这里不再给数字。</p>' +
        '<p class="faint" style="margin-bottom:0">进度记录还在本机，没上传。要准备下一场，先到<a href="about.html">说明</a>页导出备份，' +
        '再在网址后面加 <code style="white-space:nowrap">?exam=2027-06-12</code> 这样的日期重新摸底。</p>' +
        '</div>'
      );
    }
    var rows = plan.modes
      .map(function (m) {
        return (
          '<tr' + (m.here ? ' data-here="1"' : '') + '>' +
          '<td>' + esc(m.label) + (m.here ? ' ← 你在这' : '') + '</td>' +
          '<td class="num">' + m.newWords + '</td>' +
          '<td class="num">' + m.days + ' 天</td>' +
          '<td>' + (m.fits ? '来得及' : '来不及') + '</td>' +
          '</tr>'
        );
      })
      .join('');

    var assumptions =
      '距考试还有 <b>' + plan.daysLeft + '</b> 天，' +
      (plan.remainingScan > 0
        ? '摸底还差 <b>' + plan.remainingScan + '</b> 个词（约 ' + plan.probeDaysLeft + ' 天扫完）。'
        : '摸底已经做完。') +
      (plan.shortened
        ? '时间不够留考前那 14 天，所以这里按「摸底结束到考试前一天」全用来背词算。'
        : '考前留 <b>' + P.RESERVE_DAYS + '</b> 天做真题音频和写作翻译，剩下 <b>' + plan.studyDays + '</b> 天背词。');

    var math =
      plan.unknown === 0
        ? '主干词你全都认识，那就直接进听力，别在单词上耗时间了。'
        : '<b>' + plan.unknown + '</b> 个不认识 ÷ <b>' + plan.studyDays + '</b> 天 ≈ ' +
          plan.raw.toFixed(1) + ' 个 → 取整到 5 的倍数，<b>每天 ' + plan.recommended + ' 个新词</b>。' +
          '（每天再跟大约 ' + Math.round(plan.recommended * 2.5) + ' 个复习词）';

    var warn = '';
    if (plan.exceedsMax) {
      warn =
        '<p><b>注意：</b>按剩余天数算下来每天要背 ' + plan.recommended +
        ' 个，已经超过「充足档」的 30 个。这时候要取舍，不是硬扛 —— ' +
        '先把主干词里最常考的那 30 个拿下，叶子词不背。撑不住的 80 分钟，不如稳住的 30 分钟。</p>';
    } else if (plan.recommended > 0 && plan.recommended <= 10) {
      warn = '<p>按这个量，单词每天几分钟就能收工。剩下的时间全给精听 —— 那才是你现在真正的短板。</p>';
    }

    return (
      '<div class="card">' +
      '<h2>每天背 ' + plan.recommended + ' 个新词</h2>' +
      '<p>' + math + '</p>' +
      '<p class="faint">' + assumptions + '</p>' +
      warn +
      '<table class="table" style="margin-top:14px">' +
      '<thead><tr><th>档位</th><th class="num">每天新词</th><th class="num">背完需要</th><th>结果</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>' +
      '<p class="faint" style="margin-top:12px">一条校准规则：如果标准档连续一周都完不成，就把保底档当成你的正常水平。降低标准叫校准，不叫失败。</p>' +
      '</div>'
    );
  }

  /* ---------- 导出 / 导入 ---------- */

  function exportFile() {
    var text = S.exportJson();
    var stamp = new Date().toISOString().slice(0, 10);
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cet4-进度-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function importFile(file, done) {
    var reader = new FileReader();
    reader.onload = function () {
      var res = S.importJson(String(reader.result));
      if (res.ok) {
        applyTheme(S.read().settings.theme === 'dark' ? 'dark' : 'light');
        if (window.CET4_APP.onImport) window.CET4_APP.onImport();
      }
      if (done) done(res);
    };
    reader.onerror = function () {
      if (done) done({ ok: false, error: '读不了这个文件' });
    };
    reader.readAsText(file);
  }

  function initDataTools(root) {
    var box = root || document;
    var out = box.querySelector('[data-export]');
    if (out) out.addEventListener('click', exportFile);
    var pick = box.querySelector('[data-import]');
    var file = box.querySelector('[data-import-file]');
    if (pick && file) {
      pick.addEventListener('click', function () {
        file.click();
      });
      file.addEventListener('change', function () {
        if (!file.files || !file.files[0]) return;
        var note = box.querySelector('[data-import-note]');
        importFile(file.files[0], function (res) {
          if (note) note.textContent = res.ok ? '导入成功，进度已换成文件里的那份。' : '导入失败：' + res.error;
          file.value = '';
        });
      });
    }
  }

  function init() {
    initTheme();
    initNav();
    initDataTools(document);
  }

  window.CET4_APP = {
    applyTheme: applyTheme,
    coreTable: coreTable,
    coreWords: coreWords,
    answers: answers,
    todayKey: todayKey,
    summary: summary,
    currentPlan: currentPlan,
    defaultMode: defaultMode,
    modeFor: modeFor,
    applyGoals: applyGoals,
    todayState: todayState,
    setTier: setTier,
    setTierToday: setTierToday,
    startKey: startKey,
    dayNumber: dayNumber,
    listenTable: listenTable,
    clips: clips,
    clipById: clipById,
    listenTally: listenTally,
    listenDue: listenDue,
    wordGloss: wordGloss,
    readingTable: readingTable,
    readings: readings,
    readingById: readingById,
    readingWordCount: readingWordCount,
    addToBook: addToBook,
    planHtml: planHtml,
    esc: esc,
    say: say,
    savePlan: savePlan,
    exportFile: exportFile,
    importFile: importFile,
    initDataTools: initDataTools,
    onImport: null,
    GROUP: 500, // 摸底一组多少词：规划书第十一节「一天扫 500 个」
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
