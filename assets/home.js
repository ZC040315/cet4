/* 过线 · 首页

   只回答一个问题：今天该做什么。
   摸底没做完 → 一行字说清「去扫词，还剩多少个」；
   摸底做完了 → 一行字说清「每天背几个」。 */

(function () {
  var A = window.CET4_APP;
  var P = window.CET4_PLAN;
  var main = document.getElementById('main');
  if (!main) return;

  function render() {
    var table = A.coreTable();
    if (!table) {
      main.innerHTML =
        '<div class="card"><h2>词表没加载出来</h2>' +
        '<p class="muted">页面里的 <code>data/words-core.js</code> 没读到。' +
        '如果这是刚克隆下来的仓库，先跑一次 <code>node scripts/fetch-words.mjs</code> 生成词表。</p></div>';
      return;
    }

    var s = A.summary();
    var left = P.daysLeft();
    var head =
      '<h1>距 2026 年 12 月 12 日还有 <span class="num">' + left + '</span> 天</h1>';

    if (!s.done) {
      var pct = s.total ? Math.round((s.scanned / s.total) * 100) : 0;
      var minutes = Math.max(1, Math.round((s.remaining * 2) / 60));
      var startLabel = s.scanned > 0 ? '继续摸底' : '开始摸底';
      var firstTime = s.scanned === 0;
      main.innerHTML =
        head +
        '<p class="lede">' + (firstTime
          ? '前三天不背单词，先摸底：把主干词扫一遍，只判断「认识 / 不认识」。'
          : '摸底还没扫完，先把这件事做完 —— 扫完才知道每天该背多少。') + '</p>' +
        '<div class="card">' +
          '<h2>摸底 · 主干词</h2>' +
          '<p class="muted">每个词两秒，只判断认识 / 不认识。一天扫 500 个，分 3 天扫完就行。</p>' +
          '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="probe-meta">' +
            '<span>已扫 <b class="num">' + s.scanned + '</b> / ' + s.total + '</span>' +
            '<span>还剩 <b class="num">' + s.remaining + '</b> 个 · 约 ' + minutes + ' 分钟</span>' +
          '</div>' +
          '<div class="btn-row">' +
            '<a class="btn btn--primary btn--huge" href="probe.html">' + startLabel + '</a>' +
            '<a class="btn" href="words.html">先看看词表</a>' +
          '</div>' +
        '</div>' +
        '<p class="faint">今天扫不完不要紧，进度会自动留着，明天打开接着扫。</p>';
      return;
    }

    var plan = A.currentPlan();
    var ratio = s.total ? ((s.unknown / s.total) * 100).toFixed(1) + '%' : '—';
    main.innerHTML =
      head +
      '<p class="lede">摸底做完了。今天开始按下面的量背，剩下的时间给精听。</p>' +
      '<div class="card">' +
        '<h2>摸底结果</h2>' +
        '<div class="stats">' +
          '<div class="stat"><b class="num">' + s.total + '</b><span>主干词</span></div>' +
          '<div class="stat"><b class="num">' + s.unknown + '</b><span>不认识</span></div>' +
          '<div class="stat"><b class="num">' + ratio + '</b><span>不认识的比例</span></div>' +
        '</div>' +
        '<div class="btn-row">' +
          '<a class="btn" href="words.html?mark=0">只看不认识的</a>' +
          '<a class="btn btn--ghost" href="words.html">整个词表</a>' +
        '</div>' +
      '</div>' +
      A.planHtml(plan);
  }

  window.CET4_APP.onImport = render;
  render();
})();
