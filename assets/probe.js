/* 过线 · 摸底模式

   规划书第十一节：快速过一遍主干词表，只判断「认识 / 不认识」，每个词两秒。
   一天扫 500 个，三天扫完主干词；扫完才拿「不认识的词数」去算每天该背多少。

   三个刻意的设计决定：
     1. 打乱顺序（用固定种子，每次打乱结果一样）。不按字母、也不按词频 ——
        否则第一组全是简单词、最后一天全是硬骨头，越扫越崩。
     2. 认得就点认识，两秒一个；拿不准可以按空格先看一眼释义，看完再判，不算作弊。
     3. 每 500 个停下来给一次小结。进度写进 localStorage，关掉页面下次接着扫。 */

(function () {
  var S = window.CET4_STORE;
  var A = window.CET4_APP;
  var TABLE = window.CET4_WORDS_CORE;
  var main = document.getElementById('main');
  var LAYER = 'core';
  var GROUP = A.GROUP;
  var SEED = 20261212; // 固定种子：打乱顺序稳定，断点才接得上

  if (!main) return;

  if (!TABLE || !TABLE.words || !TABLE.words.length) {
    main.innerHTML =
      '<div class="card"><h2>词表没加载出来</h2>' +
      '<p class="muted">页面里的 <code>data/words-core.js</code> 没读到。' +
      '如果这是刚克隆下来的仓库，先跑一次 <code>node scripts/fetch-words.mjs</code> 生成词表。</p></div>';
    return;
  }

  var words = TABLE.words;
  var total = words.length;
  var order = shuffled(total, SEED);
  var revealed = false;
  var pendingGroupEnd = false;
  var lastJudged = null;

  function shuffled(n, seed) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(i);
    var t = seed >>> 0;
    for (var j = n - 1; j > 0; j--) {
      t = (t + 0x6d2b79f5) >>> 0;
      var x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      var r = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      var k = Math.floor(r * (j + 1));
      var tmp = arr[j];
      arr[j] = arr[k];
      arr[k] = tmp;
    }
    return arr;
  }

  function rec() {
    return S.layer(S.read(), LAYER);
  }

  function cursor() {
    return rec().cursor;
  }

  function judge(knows) {
    // 组小结页上不能判词：否则方向键会把下一个还没显示出来的词直接标掉，
    // cursor 继续往前走，用户根本没看见那个词。
    if (pendingGroupEnd) return;
    var c = cursor();
    if (c >= total) return;
    var w = words[order[c]];
    var now = new Date().toISOString();
    S.patch(function (s) {
      var r = S.layer(s, LAYER);
      r.answers[w.w] = knows ? 1 : 0;
      r.cursor = r.cursor + 1;
      if (!r.startedAt) r.startedAt = now;
      r.updatedAt = now;
      r.doneAt = r.cursor >= total ? now : null;
    });
    lastJudged = w;
    revealed = false;
    pendingGroupEnd = (c + 1) % GROUP === 0 && c + 1 < total;
    render();
  }

  function undo() {
    var c = cursor();
    if (c <= 0) return;
    var w = words[order[c - 1]];
    var now = new Date().toISOString();
    S.patch(function (s) {
      var r = S.layer(s, LAYER);
      delete r.answers[w.w];
      r.cursor = c - 1;
      r.doneAt = null;
      r.updatedAt = now;
    });
    lastJudged = null;
    revealed = false;
    pendingGroupEnd = false;
    render();
  }

  function render() {
    var c = cursor();
    if (c >= total) return renderDone();
    if (pendingGroupEnd) return renderGroupEnd(c);
    renderCard(c);
  }

  function renderCard(c) {
    var w = words[order[c]];
    var s = A.summary();
    var groupNo = Math.floor(c / GROUP) + 1;
    var inGroup = (c % GROUP) + 1;
    var pct = Math.round((c / total) * 100);
    var answer = revealed
      ? '<b>' + A.esc(w.zh) + '</b>'
      : '<span class="probe-hint">认得就点「认识」，不认得就点「不认识」；拿不准可以先看一眼释义</span>';
    var lastLine = lastJudged
      ? '上一个：<b>' + A.esc(lastJudged.w) + '</b> — ' + A.esc(lastJudged.zh)
      : '已标不认识 <b class="num">' + s.unknown + '</b> 个';

    main.innerHTML =
      '<div class="probe-meta" data-probe-cursor="' + c + '">' +
        '<span>第 <b class="num">' + (c + 1) + '</b> / ' + total +
          ' <span class="faint">· 第 ' + groupNo + ' 组（' + inGroup + '/' + GROUP + '）</span></span>' +
        '<span class="faint">还剩 <span class="num">' + (total - c) + '</span> 个</span>' +
      '</div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="card">' +
        '<div class="probe-word">' + A.esc(w.w) + '</div>' +
        '<div class="probe-phon">' + (w.ph ? '/' + A.esc(w.ph) + '/' : '') + '</div>' +
        '<div class="probe-answer">' + answer + '</div>' +
        '<div class="btn-row btn-row--split" style="margin-top:18px">' +
          '<button class="btn btn--no btn--huge" type="button" data-verdict="0">不认识</button>' +
          '<button class="btn btn--ok btn--huge" type="button" data-verdict="1">认识</button>' +
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn btn--sm btn--ghost" type="button" data-reveal>看一眼释义（空格）</button>' +
          '<button class="btn btn--sm btn--ghost" type="button" data-undo>撤销上一个</button>' +
        '</div>' +
        '<p class="faint" style="margin:16px 0 0">' + lastLine + '</p>' +
      '</div>' +
      '<p class="faint">键盘也能扫：<b>←</b> 不认识 · <b>→</b> 认识 · <b>空格</b> 看释义 · <b>Backspace</b> 撤销。</p>';
  }

  function renderGroupEnd(c) {
    var r = rec();
    var from = c - GROUP;
    var known = 0;
    var unknown = 0;
    for (var i = from; i < c; i++) {
      var v = r.answers[words[order[i]].w];
      if (v === 1) known++;
      else if (v === 0) unknown++;
    }
    var s = A.summary();
    var groupNo = Math.floor(c / GROUP);
    var groupTotal = Math.ceil(total / GROUP);

    main.innerHTML =
      '<div class="card">' +
        '<h2>第 ' + groupNo + ' 组扫完了</h2>' +
        '<p class="muted">这 ' + GROUP + ' 个词里，认识 ' + known + ' 个，不认识 ' + unknown + ' 个。</p>' +
        '<div class="stats">' +
          '<div class="stat"><b class="num">' + s.scanned + '</b><span>已扫 / ' + total + '</span></div>' +
          '<div class="stat"><b class="num">' + s.unknown + '</b><span>累计不认识</span></div>' +
          '<div class="stat"><b class="num">' + (s.total ? ((s.unknown / s.total) * 100).toFixed(1) : 0) + '%</b><span>不认识的比例</span></div>' +
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn btn--primary btn--huge" type="button" data-next>继续第 ' + (groupNo + 1) + ' 组</button>' +
          '<a class="btn" href="index.html">今天先到这</a>' +
        '</div>' +
        '<p class="faint" style="margin-top:14px">进度已经存好了。' + (groupTotal > groupNo ? '你也可以关掉页面，明天打开会自动接着扫。' : '') + '</p>' +
      '</div>';
  }

  function renderDone() {
    var s = A.summary();
    var plan = A.currentPlan();
    A.savePlan(plan);
    var ratio = s.total ? ((s.unknown / s.total) * 100).toFixed(1) + '%' : '—';
    main.innerHTML =
      '<h1>摸底扫完了</h1>' +
      '<div class="card">' +
        '<h2>' + total + ' 个主干词，你不认识 ' + s.unknown + ' 个</h2>' +
        '<div class="stats">' +
          '<div class="stat"><b class="num">' + s.known + '</b><span>认识</span></div>' +
          '<div class="stat"><b class="num">' + s.unknown + '</b><span>不认识</span></div>' +
          '<div class="stat"><b class="num">' + ratio + '</b><span>不认识的比例</span></div>' +
        '</div>' +
        '<p class="faint">这个数字就是你的起点。下面按它还剩多少天，算出每天该背多少。</p>' +
      '</div>' +
      A.planHtml(plan) +
      '<div class="btn-row">' +
        '<a class="btn btn--primary btn--huge" href="words.html?mark=0">按「不认识」看词表</a>' +
        '<a class="btn" href="index.html">回首页</a>' +
      '</div>' +
      '<p class="faint" style="margin-top:16px">想重来一遍？到<a href="about.html">说明</a>页清空摸底记录。</p>';
  }

  main.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-verdict],[data-reveal],[data-undo],[data-next]') : null;
    if (!t) return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (t.hasAttribute('data-verdict')) judge(t.getAttribute('data-verdict') === '1');
    else if (t.hasAttribute('data-reveal')) { revealed = true; render(); }
    else if (t.hasAttribute('data-undo')) undo();
    else if (t.hasAttribute('data-next')) { pendingGroupEnd = false; render(); }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var k = ev.key;
    if (k === 'ArrowLeft' || k === '1') { ev.preventDefault(); judge(false); }
    else if (k === 'ArrowRight' || k === '2') { ev.preventDefault(); judge(true); }
    else if (k === ' ' || k === 'Spacebar') { ev.preventDefault(); revealed = true; render(); }
    else if (k === 'Backspace' || k === 'u' || k === 'U') { ev.preventDefault(); undo(); }
  });

  render();
})();
