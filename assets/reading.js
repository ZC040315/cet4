/* 过线 · 短读（规划书第四节第 4 条）

   自产短文 100–150 词 + 标注生词 + 一句中文说明，明确标注「不是真题」。

   两个刻意的设计：
     1. **生词的释义不在数据里，全部从词表查**。数据只标「哪些词是生词」，
        释义一律取 ECDICT 的原文 —— 所以不会出现自己编词义这种事，
        而且 scripts/check-data.mjs 会强制「标注的词必须在词表里」。
     2. **中文说明读完再给**。像精听里的「对一下大意」一样，
        先看说明再读，等于把答案先摊开，阅读就白做了。 */

(function () {
  var A = window.CET4_APP;
  var S = window.CET4_STORE;
  var main = document.getElementById('main');
  if (!main) return;

  var params = new URLSearchParams(location.search);
  var ST = {
    id: params.get('id') || '',
    step: 'read', // read | done
    active: '', // 当前点开的生词
    startedAt: Date.now(),
    ms: 0,
  };

  function reading() {
    return A.readingById(ST.id);
  }

  function markedSet(r) {
    var set = {};
    (r.words || []).forEach(function (w) {
      set[String(w).toLowerCase()] = 1;
    });
    return set;
  }

  /* 把正文切成「词 / 非词」，把标注过的词包成可点的按钮。
     标点原样保留，所以段落读起来和原文一模一样。 */
  function paraHtml(text, set, active) {
    var raw = String(text).match(/[A-Za-z0-9'\u2019\u02bc\-]+|[^A-Za-z0-9'\u2019\u02bc\-]+/g) || [];
    return raw
      .map(function (piece) {
        if (!/[A-Za-z]/.test(piece.charAt(0))) return A.esc(piece);
        var key = piece.toLowerCase().replace(/\u2019/g, "'");
        if (!set[key]) return A.esc(piece);
        return (
          '<button type="button" class="rword' + (active === key ? ' is-on' : '') +
          '" data-w="' + A.esc(key) + '">' + A.esc(piece) + '</button>'
        );
      })
      .join('');
  }

  function wordsWithGloss(r) {
    return (r.words || []).map(function (w) {
      var key = String(w).toLowerCase();
      return { w: key, zh: shortZh(A.wordGloss(key)) };
    });
  }

  // 词表里的释义常有多行（每行一个词性），短读里只取第一行，读起来不打断
  function shortZh(zh) {
    return String(zh || '').split('\n')[0].trim();
  }

  function inBook(word) {
    var state = S.read();
    var e = (state.srs || {})[word];
    return Boolean(e && e.inBook);
  }

  /* ---------- 列表 ---------- */

  function renderList() {
    var list = A.readings();
    if (!list.length) {
      main.innerHTML = '<div class="card"><h2>还没有短读材料</h2><p class="muted">data/readings.js 没读到。</p></div>';
      return;
    }
    var state = S.read();
    var doneCount = list.filter(function (r) {
      return state.readings[r.id] && state.readings[r.id].rounds;
    }).length;
    var levels = { 1: '入门', 2: '中等', 3: '偏难' };

    var cards = list
      .map(function (r) {
        var rec = state.readings[r.id];
        var action = rec && rec.rounds
          ? '<div class="btn-row" style="margin-top:10px"><a class="btn btn--sm" href="reading.html?id=' + r.id +
            '">再读一遍</a></div><p class="faint" style="margin:8px 0 0">读过 ' + rec.rounds + ' 轮 · 上次 ' + rec.lastDone + '</p>'
          : '<div class="btn-row" style="margin-top:10px"><a class="btn btn--sm btn--primary" href="reading.html?id=' + r.id +
            '">开始读</a></div>';
        return (
          '<div class="card card--tight clip-card" data-reading="' + r.id + '">' +
          '<div class="clip-head"><b>' + A.esc(r.title) + '</b><span class="faint">' + A.esc(levels[r.level] || '') + '</span></div>' +
          '<p class="faint" style="margin:6px 0 0">' + A.esc(r.topic) + ' · ' + A.readingWordCount(r) + ' 词 · ' +
          r.words.length + ' 个生词</p>' +
          action +
          '</div>'
        );
      })
      .join('');

    main.innerHTML =
      '<h1>短读</h1>' +
      '<p class="lede">一篇 100–150 词。先读，读完对一句中文说明，约 10–15 分钟。</p>' +
      '<div class="notice">这些短文是本站自产的练习材料，<b>不是真题</b>。' +
      '带下划线的生词点一下就有释义，释义来自词表，不是我们编的。</div>' +
      '<p class="faint">读过 ' + doneCount + ' / ' + list.length + ' 篇</p>' +
      cards;
  }

  /* ---------- 读一篇 ---------- */

  function renderRead() {
    var r = reading();
    var set = markedSet(r);
    var paras = (r.paras || [])
      .map(function (p) {
        return '<p class="read-para">' + paraHtml(p, set, ST.active) + '</p>';
      })
      .join('');

    var gloss;
    if (ST.active) {
      var zh = shortZh(A.wordGloss(ST.active));
      var added = inBook(ST.active);
      gloss =
        '<div class="gloss" data-gloss="' + A.esc(ST.active) + '"><b>' + A.esc(ST.active) + '</b> · ' +
        (zh ? A.esc(zh.slice(0, 60)) : '（词表里没有）') +
        (added
          ? '<span class="done-mark" style="margin-left:10px">已在错词本</span>'
          : '<button class="btn btn--sm" type="button" data-add="' + A.esc(ST.active) + '" style="margin-left:10px">加进错词本</button>') +
        '</div>';
    } else {
      gloss = '<div class="gloss faint">点带下划线的词，这里会显示释义。</div>';
    }

    main.innerHTML =
      '<div class="probe-meta" data-step="read"><span>读</span><span class="faint">' + A.esc(r.title) + ' · ' +
      A.readingWordCount(r) + ' 词</span></div>' +
      '<div class="card">' +
      '<h2>' + A.esc(r.title) + '</h2>' +
      '<p class="faint" style="margin-bottom:14px">' + A.esc(r.topic) + ' · 本站自产，不是真题</p>' +
      paras +
      gloss +
      '<div class="btn-row">' +
      '<button class="btn btn--primary btn--huge" type="button" data-finish>读完了</button>' +
      '</div>' +
      '<p class="faint">读不完就先放着，进度不会丢。读完再点这个按钮，会给你一句中文说明。</p>' +
      '</div>' +
      '<p class="faint"><a href="reading.html">← 回短读列表</a></p>';
  }

  function renderDone() {
    var r = reading();
    var list = wordsWithGloss(r);
    var rows = list
      .map(function (x) {
        var added = inBook(x.w);
        return (
          '<div class="classify" data-word="' + A.esc(x.w) + '">' +
          '<div class="classify-word"><b>' + A.esc(x.w) + '</b> ' +
          '<span class="faint">' + (x.zh ? A.esc(x.zh.slice(0, 50)) : '（词表里没有）') + '</span></div>' +
          (added
            ? '<span class="done-mark">✓ 已经在错词本里了</span>'
            : '<div class="btn-row" style="margin-top:0"><button class="btn btn--sm" type="button" data-add="' +
              A.esc(x.w) + '">加进错词本</button></div>') +
          '</div>'
        );
      })
      .join('');
    var state = S.read();
    var book = 0;
    Object.keys(state.srs || {}).forEach(function (k) {
      if (state.srs[k] && state.srs[k].inBook) book++;
    });

    main.innerHTML =
      '<div class="probe-meta" data-step="done"><span>读完了</span><span class="faint">' + A.esc(r.title) +
      ' · ' + A.readingWordCount(r) + ' 词</span></div>' +
      '<h1>读完了</h1>' +
      '<div class="card">' +
      '<h2>' + A.esc(r.title) + '</h2>' +
      '<div class="study-answer" style="margin-top:0;border-top:0;padding-top:0"><b>' + A.esc(r.gist) + '</b></div>' +
      '<p class="faint" style="margin-top:12px">这是这一篇的一句话说明。如果你读出来的意思和它差不多，就够了；' +
      '差得远，就再读一遍，别急着看词。</p>' +
      '<p class="faint">用时约 ' + Math.max(1, Math.round(ST.ms / 60000)) + ' 分钟。</p>' +
      '</div>' +
      '<div class="card">' +
      '<h2>这篇标出来的 ' + list.length + ' 个生词</h2>' +
      '<p class="faint">认得就不用管；不认得的丢进错词本，它会和背词用同一套复习节奏。</p>' +
      rows +
      '<p class="faint" style="margin-top:12px">错词本现在一共 ' + book + ' 个词。</p>' +
      '</div>' +
      '<div class="btn-row">' +
      '<a class="btn btn--primary btn--huge" href="index.html">回今日页</a>' +
      '<a class="btn" href="reading.html">回短读列表</a>' +
      '<a class="btn btn--ghost" href="reading.html?id=' + r.id + '">再读一遍</a>' +
      '</div>';
  }

  function render() {
    if (!A.readingTable()) {
      main.innerHTML = '<div class="card"><h2>短读材料没加载出来</h2><p class="muted">缺 data/readings.js。</p></div>';
      return;
    }
    if (!ST.id) renderList();
    else if (!reading()) renderList();
    else if (ST.step === 'done') renderDone();
    else renderRead();
  }

  /* ---------- 读完入账 ---------- */

  function finish() {
    var r = reading();
    var key = A.todayKey();
    ST.ms = Date.now() - ST.startedAt;
    S.patch(function (state) {
      var rec = S.reading(state, r.id);
      rec.rounds += 1;
      rec.lastDone = key;
      rec.ms = (Number(rec.ms) || 0) + ST.ms;
      var day = S.day(state, key);
      day.readDone += 1;
      A.applyGoals(state, key);
    });
    ST.step = 'done';
    render();
    window.scrollTo(0, 0);
  }

  /* ---------- 事件 ---------- */

  main.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-w],[data-add],[data-finish]') : null;
    if (!t) return;
    if (t.hasAttribute('data-finish')) {
      finish();
      return;
    }
    if (t.hasAttribute('data-add')) {
      A.addToBook(t.getAttribute('data-add'));
      render();
      return;
    }
    if (t.hasAttribute('data-w')) {
      var w = t.getAttribute('data-w');
      ST.active = ST.active === w ? '' : w;
      render();
    }
  });

  window.CET4_APP.onImport = render;
  render();
})();
