/* 精读页。
   短读是「把一段话读懂」，精读是「把一篇文章拆开」：
   读原文（点生词有释义）→ 做三道理解题 → 对答案、看长难句、看全文译文。
   一屏一件事，三步走完；中途关掉页面，进度不会丢。 */
(function () {
  var A = window.CET4_APP;
  var S = window.CET4_STORE;
  var T = window.CET4_TTS;
  var main = document.getElementById('main');
  if (!main) return;

  var params = new URLSearchParams(location.search);

  var ST = {
    id: params.get('id') || '',
    step: 'read',           // read | quiz | review
    active: '',             // 当前点开的生词
    openZh: {},             // 哪些段落翻成了中文
    answers: {},            // { 题号: 选项号 }
    checked: false,
    started: 0,
    ms: 0,
    speaking: false
  };

  function esc(text) {
    return A.esc(text);
  }

  function article() {
    return ST.id ? A.intensiveById(ST.id) : null;
  }

  function markedSet(a) {
    var set = {};
    (a.words || []).forEach(function (w) {
      set[String(w).toLowerCase()] = 1;
    });
    return set;
  }

  /* 正文切词：标注过的词包成可点按钮，其余原样输出 */
  function paraHtml(text, set, active) {
    var raw = String(text).match(/[A-Za-z0-9'\u2019\u02bc\-]+|[^A-Za-z0-9'\u2019\u02bc\-]+/g) || [];
    return raw
      .map(function (piece) {
        if (!/[A-Za-z]/.test(piece.charAt(0))) return esc(piece);
        var key = piece.toLowerCase().replace(/\u2019/g, "'");
        if (!set[key]) return esc(piece);
        return (
          '<button type="button" class="rword' + (active === key ? ' is-on' : '') +
          '" data-w="' + esc(key) + '">' + esc(piece) + '</button>'
        );
      })
      .join('');
  }

  function shortZh(zh) {
    return String(zh || '').split('\n')[0].trim();
  }

  function inBook(word) {
    var state = S.read();
    var e = (state.srs || {})[word];
    return Boolean(e && e.inBook);
  }

  function rec() {
    var state = S.read();
    return (state.intensive || {})[ST.id] || { rounds: 0, best: 0, total: 0 };
  }

  /* ---------- 列表 ---------- */

  function renderList() {
    var list = A.intensiveArticles();
    if (!list.length) {
      main.innerHTML = '<div class="card"><h2>还没有精读材料</h2><p class="muted">data/intensive.js 没读到。</p></div>';
      return;
    }
    var state = S.read();
    var doneCount = list.filter(function (a) {
      var r = state.intensive[a.id];
      return r && r.rounds;
    }).length;
    var levels = { 1: '入门', 2: '中等', 3: '偏难' };
    var wordsTotal = list.reduce(function (sum, a) {
      return sum + A.articleWordCount(a);
    }, 0);

    var cards = list
      .map(function (a) {
        var r = state.intensive[a.id];
        var done = r && r.rounds;
        var action = done
          ? '<div class="btn-row" style="margin-top:10px"><a class="btn btn--sm" href="intensive.html?id=' + a.id +
            '">再精读一遍</a></div>' +
            '<p class="faint" style="margin:8px 0 0">读过 ' + r.rounds + ' 轮' +
            (r.total ? ' · 上次 ' + r.best + ' / ' + r.total + ' 题' : '') +
            (r.lastDone ? ' · ' + esc(r.lastDone) : '') + '</p>'
          : '<div class="btn-row" style="margin-top:10px"><a class="btn btn--sm btn--primary" href="intensive.html?id=' + a.id +
            '">开始精读</a></div>';
        return (
          '<div class="card card--tight clip-card" data-int="' + a.id + '">' +
          '<div class="clip-head"><b>' + esc(a.title) + '</b><span class="faint">' + esc(levels[a.level] || '') + '</span></div>' +
          '<p class="faint" style="margin:6px 0 0">' + esc(a.topic) + ' · ' + A.articleWordCount(a) + ' 词 · ' +
          (a.words || []).length + ' 个生词 · ' + (a.questions || []).length + ' 道理解题</p>' +
          action +
          '</div>'
        );
      })
      .join('');

    main.innerHTML =
      '<h1>精读</h1>' +
      '<p class="lede">一篇 280–400 词。先读原文，再做题，然后看长难句和译文。约 20–25 分钟。</p>' +
      '<div class="notice">这些文章是本站自产的练习材料，<b>不是真题</b>。' +
      '题目是我们按四级阅读的问法写的，不来自任何真题。带下划线的生词点一下有释义，释义来自词表。</div>' +
      '<p class="faint">读过 <b>' + doneCount + '</b> / ' + list.length + ' 篇 · 合计 ' + wordsTotal + ' 词</p>' +
      cards;
  }

  /* ---------- 第 1 步：读 ---------- */

  function renderRead() {
    var a = article();
    var set = markedSet(a);

    var paras = (a.paras || [])
      .map(function (p, i) {
        var open = ST.openZh[i];
        return (
          '<p class="read-para">' + paraHtml(p.en, set, ST.active) + '</p>' +
          '<p class="read-tools"><button type="button" class="btn btn--sm btn--ghost" data-zh="' + i + '">' +
          (open ? '收起中文' : '看这段中文') + '</button></p>' +
          (open ? '<p class="read-zh">' + esc(p.zh) + '</p>' : '')
        );
      })
      .join('');

    var gloss;
    if (ST.active) {
      var zh = shortZh(A.wordGloss(ST.active));
      gloss =
        '<div class="gloss" data-gloss="' + esc(ST.active) + '"><b>' + esc(ST.active) + '</b> · ' +
        (zh ? esc(zh.slice(0, 60)) : '（词表里没有）') +
        (inBook(ST.active)
          ? '<span class="done-mark" style="margin-left:10px">已在错词本</span>'
          : '<button class="btn btn--sm" type="button" data-add="' + esc(ST.active) + '" style="margin-left:10px">加进错词本</button>') +
        '</div>';
    } else {
      gloss = '<div class="gloss faint">点带下划线的词，这里会显示释义；每段下面可以单独看中文。</div>';
    }

    var speak = T && T.supported
      ? '<button type="button" class="btn btn--sm btn--ghost" data-speak>' +
        (ST.speaking ? '停止朗读' : '听一遍') + '</button>'
      : '';

    main.innerHTML =
      '<div class="probe-meta" data-step="read"><span>1 读</span><span class="faint">' + esc(a.title) + ' · ' +
      A.articleWordCount(a) + ' 词</span></div>' +
      '<div class="card">' +
      '<h2>' + esc(a.title) + '</h2>' +
      '<p class="faint" style="margin-bottom:14px">' + esc(a.topic) + ' · 本站自产，不是真题</p>' +
      paras +
      gloss +
      '<div class="btn-row">' +
      '<button class="btn btn--primary btn--huge" type="button" data-finish>读完了，去做题</button>' +
      speak +
      '</div>' +
      '<p class="faint">读的时候别查太多词。先读完，再回头看生词。</p>' +
      '</div>' +
      '<p class="faint"><a href="intensive.html">← 回精读列表</a></p>';
  }

  /* ---------- 第 2 步：做题 ---------- */

  function answeredCount() {
    var a = article();
    var n = 0;
    (a.questions || []).forEach(function (q, i) {
      if (ST.answers[i] != null) n += 1;
    });
    return n;
  }

  function renderQuiz() {
    var a = article();
    var qs = a.questions || [];
    var answered = answeredCount();

    var body = qs
      .map(function (q, i) {
        var opts = (q.options || [])
          .map(function (text, j) {
            return (
              '<label class="opt"><input type="radio" name="q' + i + '" value="' + j + '"' +
              (ST.answers[i] === j ? ' checked' : '') + '> ' +
              '<span class="opt-key">' + 'ABCD'.charAt(j) + '</span> ' + esc(text) + '</label>'
            );
          })
          .join('');
        return (
          '<div class="q" data-q="' + i + '">' +
          '<p class="q-text"><b>' + (i + 1) + '.</b> ' + esc(q.q) + '</p>' +
          opts +
          '</div>'
        );
      })
      .join('');

    main.innerHTML =
      '<div class="probe-meta" data-step="quiz"><span>2 做题</span><span class="faint">' + esc(a.title) +
      ' · ' + qs.length + ' 题</span></div>' +
      '<div class="card">' +
      '<h2>理解题</h2>' +
      '<p class="faint">按读到的内容选，不必回原文找。做完再对答案。</p>' +
      body +
      '<div class="btn-row">' +
      '<button class="btn btn--primary btn--huge" type="button" data-check' +
      (answered < qs.length ? ' disabled' : '') + '>对答案</button>' +
      '</div>' +
      '<p class="faint" data-answered>已选 ' + answered + ' / ' + qs.length + ' 题</p>' +
      '</div>' +
      '<p class="faint"><a href="intensive.html?id=' + a.id + '">← 回去再读一遍</a></p>';
  }

  /* ---------- 第 3 步：对答案 + 拆句 + 译文 ---------- */

  function score() {
    var a = article();
    var n = 0;
    (a.questions || []).forEach(function (q, i) {
      if (ST.answers[i] === q.answer) n += 1;
    });
    return n;
  }

  function renderReview() {
    var a = article();
    var qs = a.questions || [];
    var got = score();

    var report = qs
      .map(function (q, i) {
        var picked = ST.answers[i];
        var ok = picked === q.answer;
        var opts = (q.options || [])
          .map(function (text, j) {
            var cls = 'opt';
            if (j === q.answer) cls += ' is-right';
            else if (j === picked) cls += ' is-wrong';
            return '<div class="' + cls + '"><span class="opt-key">' + 'ABCD'.charAt(j) + '</span> ' + esc(text) + '</div>';
          })
          .join('');
        return (
          '<div class="q" data-q="' + i + '">' +
          '<p class="q-text"><b>' + (i + 1) + '.</b> ' + esc(q.q) + ' ' +
          (ok ? '<span class="mark-ok">对了</span>' : '<span class="mark-no">错了</span>') + '</p>' +
          opts +
          '<p class="faint" style="margin:8px 0 0">' + (ok ? '' : '你选的是 ' + 'ABCD'.charAt(picked) + '。') +
          esc(q.explain || '') + '</p>' +
          '</div>'
        );
      })
      .join('');

    var sents = (a.sentences || [])
      .map(function (s) {
        return (
          '<div class="sent">' +
          '<p class="sent-en">' + esc(s.en) + '</p>' +
          '<p class="sent-note">' + esc(s.note) + '</p>' +
          '<p class="sent-zh">' + esc(s.zh) + '</p>' +
          '</div>'
        );
      })
      .join('');

    var words = (a.words || [])
      .map(function (w) {
        var key = String(w).toLowerCase();
        var zh = shortZh(A.wordGloss(key));
        return (
          '<li class="row"><span class="row-word"><b>' + esc(key) + '</b></span>' +
          '<span class="row-zh">' + (zh ? esc(zh.slice(0, 40)) : '（词表里没有）') + '</span>' +
          (inBook(key)
            ? '<span class="done-mark">已在错词本</span>'
            : '<button class="btn btn--sm" type="button" data-add="' + esc(key) + '">加进错词本</button>') +
          '</li>'
        );
      })
      .join('');

    var zhAll = (a.paras || [])
      .map(function (p) {
        return '<p class="read-zh">' + esc(p.zh) + '</p>';
      })
      .join('');

    main.innerHTML =
      '<div class="probe-meta" data-step="review"><span>3 复盘</span><span class="faint">' + esc(a.title) + '</span></div>' +
      '<div class="card">' +
      '<h2>' + got + ' / ' + qs.length + '</h2>' +
      '<p class="faint" data-score="' + got + '">' +
      (got === qs.length ? '全对。这一篇可以放下了，明天换一篇。'
        : got === 0 ? '全错也别急。回去看长难句，再看一遍译文，重做一次。'
        : '错的地方多半是长难句没拆开。先看下面的句子，再重做。') +
      '</p>' +
      report +
      '</div>' +
      '<div class="card">' +
      '<h2>长难句</h2>' +
      '<p class="faint">每篇挑三句。先自己断句，再看我们怎么断。</p>' +
      sents +
      '</div>' +
      '<div class="card">' +
      '<h2>生词</h2>' +
      '<ul class="rows" data-int-words="' + (a.words || []).length + '">' + words + '</ul>' +
      '</div>' +
      '<div class="card">' +
      '<h2>全文译文</h2>' +
      '<p class="faint">先自己回译一遍，再看这个。直接看会以为自己懂了。</p>' +
      zhAll +
      '</div>' +
      '<div class="btn-row">' +
      '<button class="btn btn--primary" type="button" data-retry>再做一遍</button>' +
      '<a class="btn" href="intensive.html">回列表</a>' +
      '</div>' +
      '<p class="faint"><a href="intensive.html?id=' + a.id + '">← 重新读这一篇</a></p>';
  }

  /* ---------- 记录 ---------- */

  function saveResult() {
    var a = article();
    if (!a) return;
    var got = score();
    var total = (a.questions || []).length;
    var key = A.todayKey();
    var ms = ST.ms;
    S.patch(function (state) {
      var r = S.intensive(state, a.id);
      if (!r.rounds) r.rounds = 0;
      r.rounds += 1;
      r.lastDone = key;
      r.ms += ms;
      r.best = got;
      r.total = total;
    });
  }

  /* ---------- 渲染总入口 ---------- */

  function render() {
    if (!A.intensiveTable()) {
      main.innerHTML = '<div class="card"><h2>还没有精读材料</h2><p class="muted">data/intensive.js 没读到。</p></div>';
      return;
    }
    if (!ST.id) return renderList();
    if (!article()) return renderList();
    if (!ST.started) ST.started = Date.now();
    if (ST.step === 'review') return renderReview();
    if (ST.step === 'quiz') return renderQuiz();
    return renderRead();
  }

  /* ---------- 交互 ---------- */

  main.addEventListener('change', function (ev) {
    var input = ev.target;
    if (!input || input.type !== 'radio' || !input.name) return;
    var m = /^q(\d+)$/.exec(input.name);
    if (!m) return;
    ST.answers[Number(m[1])] = Number(input.value);
    var total = (article().questions || []).length;
    var hint = main.querySelector('[data-answered]');
    if (hint) hint.textContent = '已选 ' + answeredCount() + ' / ' + total + ' 题';
    var btn = main.querySelector('[data-check]');
    if (btn) btn.disabled = answeredCount() < total;
  });

  main.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-w],[data-add],[data-finish],[data-check],[data-zh],[data-retry],[data-speak]') : null;
    if (!t) return;

    if (t.hasAttribute('data-w')) {
      ST.active = t.getAttribute('data-w');
      return render();
    }

    if (t.hasAttribute('data-zh')) {
      var i = Number(t.getAttribute('data-zh'));
      ST.openZh[i] = !ST.openZh[i];
      return render();
    }

    if (t.hasAttribute('data-add')) {
      A.addToBook(t.getAttribute('data-add'), 'intensive');
      return render();
    }

    if (t.hasAttribute('data-finish')) {
      ST.ms = ST.started ? Date.now() - ST.started : 0;
      ST.step = 'quiz';
      return render();
    }

    if (t.hasAttribute('data-check')) {
      ST.ms = ST.started ? Date.now() - ST.started : 0;
      ST.step = 'review';
      saveResult();
      window.scrollTo(0, 0);
      return render();
    }

    if (t.hasAttribute('data-retry')) {
      ST.answers = {};
      ST.started = Date.now();
      ST.ms = 0;
      ST.step = 'quiz';
      window.scrollTo(0, 0);
      return render();
    }

    if (t.hasAttribute('data-speak')) {
      if (!T) return;
      if (ST.speaking) {
        T.cancel();
        ST.speaking = false;
        return render();
      }
      var a = article();
      var texts = (a.paras || []).map(function (p) { return p.en; });
      ST.speaking = true;
      render();
      T.speakAll(texts, {
        rate: 0.9,
        onend: function () { ST.speaking = false; render(); },
        onerror: function () { ST.speaking = false; render(); }
      });
    }
  });

  window.CET4_APP.onImport = render;
  render();
})();
