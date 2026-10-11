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

  /* ---------- 「每天该背多少」那段结论，首页和摸底结果页共用 ---------- */

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function planHtml(plan) {
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
    summary: summary,
    currentPlan: currentPlan,
    planHtml: planHtml,
    esc: esc,
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
