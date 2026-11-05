/* 过线 · 音标页

   48 个英式 DJ 音标，6 组。总览是一屏 6 张卡，单音是一屏一件事：

     怎么发 → 三个例词（点一下用英音读）→ 最容易混的那个音 → 三道听辨题

   数据全在 data/phonetics.js：音标符号、发音要点、例词和注音都是手工写的，
   例词一律取本站 3846 个四级词，所以页面上每个词都能在词表里查到释义。
   为什么不用词表里的 ECDICT 注音：那套符号不统一（law 记成 /lɒː/、point 记成 /pɒint/），
   拿它教音标会把 ɔː 和 ɒ 混成一团。

   听辨题的设计：四个词都给出注音，问「哪个词里有 /x/」。
   正确答案是这一条的例词，干扰项来自**别的音标**的例词，而且它的注音里一定不含 /x/，
   所以答案唯一 —— 这条由 scripts/check-data.mjs 逐条验，改数据时不会悄悄坏掉。 */

(function () {
  var A = window.CET4_APP;
  var S = window.CET4_STORE;
  var main = document.getElementById('main');
  var params = new URLSearchParams(location.search);

  var META = (window.CET4_PHON && window.CET4_PHON.meta) || {};
  var SYMS = META.symbols || [];

  var ST = {
    id: params.get('id') || '',
    picked: {}, // 第几题 → 选了哪个词
    saved: false, // 这一轮成绩写进 localStorage 没有
  };

  function esc(t) {
    return A.esc(t);
  }

  /* ---------- 音标切分：把 /ˈtiːm/ 切成 ['t','iː','m'] ---------- */

  function tokens(ipa) {
    var text = String(ipa || '');
    var out = [];
    var i = 0;
    while (i < text.length) {
      var c = text.charAt(i);
      if (c === 'ˈ' || c === 'ˌ' || c === ' ') {
        i += 1;
        continue;
      }
      var hit = '';
      for (var k = 0; k < SYMS.length; k++) {
        var s = SYMS[k];
        if (s.length > hit.length && text.substr(i, s.length) === s) hit = s;
      }
      if (!hit) return null; // 切不开就当数据坏了，不让页面崩
      out.push(hit);
      i += hit.length;
    }
    return out;
  }

  /* ---------- 读音：优先英音 ---------- */

  function gbVoice() {
    if (!window.CET4_TTS || !window.CET4_TTS.supported) return '';
    var list = window.CET4_TTS.voices ? window.CET4_TTS.voices() : [];
    for (var i = 0; i < list.length; i++) {
      if (/^en[-_]GB/i.test(list[i].lang || '')) return list[i].name;
    }
    return '';
  }

  function sayWord(word) {
    if (!word || !window.CET4_TTS || !window.CET4_TTS.supported) return;
    var v = gbVoice();
    window.CET4_TTS.speak(String(word), {
      rate: 0.85,
      lang: 'en-GB',
      voice: v || undefined,
    });
  }

  /* ---------- 稳定打乱：同一个音标的题目顺序每次都一样，方便对照 ---------- */

  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seeded(list, salt) {
    return list
      .map(function (item, i) {
        return { item: item, key: hash(salt + '#' + i) };
      })
      .sort(function (a, b) {
        return a.key - b.key;
      })
      .map(function (o) {
        return o.item;
      });
  }

  /* ---------- 听辨题：四个词，只有一个是含这个音的 ---------- */

  function optionsFor(p, qi) {
    var correct = p.ex[qi];
    var pool = [];
    A.phonemes().forEach(function (o) {
      o.ex.forEach(function (e) {
        if (e.w === correct.w) return;
        var tk = tokens(e.ipa);
        if (!tk || tk.indexOf(p.sym) >= 0) return;
        pool.push(e);
      });
    });
    var extra = seeded(pool, p.id + ':' + qi).slice(0, 3);
    // 数据里还存了三个备用干扰词：万一别的音标数据被删掉了也能出满四题
    (p.distract || []).forEach(function (d) {
      if (extra.length >= 3) return;
      var tk = tokens(d.ipa);
      if (!tk || tk.indexOf(p.sym) >= 0) return;
      for (var i = 0; i < extra.length; i++) if (extra[i].w === d.w) return;
      if (d.w === correct.w) return;
      extra.push(d);
    });
    return seeded([correct].concat(extra), p.id + ':' + qi + ':order');
  }

  function scoreOf(p) {
    var got = 0;
    (p.ex || []).forEach(function (e, qi) {
      if (ST.picked[qi] === e.w) got += 1;
    });
    return got;
  }

  function allAnswered(p) {
    return (p.ex || []).length > 0 && Object.keys(ST.picked).length === p.ex.length;
  }

  /* 答完一轮就写一次记录；learned 只在「全对」或用户自己点按钮时置真 */
  function saveResult(p) {
    if (ST.saved || !allAnswered(p)) return;
    ST.saved = true;
    var got = scoreOf(p);
    var key = A.todayKey();
    S.patch(function (state) {
      var rec = S.phon(state, p.id);
      rec.rounds += 1;
      rec.lastDone = key;
      rec.best = Math.max(rec.best || 0, got);
      rec.total = (p.ex || []).length;
      if (got === rec.total) rec.learned = true;
    });
  }

  /* ---------- 总览 ---------- */

  function learnedCount(state) {
    var n = 0;
    A.phonemes().forEach(function (p) {
      var rec = state.phon && state.phon[p.id];
      if (rec && rec.learned) n += 1;
    });
    return n;
  }

  function nextUnlearned(state) {
    var list = A.phonemes();
    for (var i = 0; i < list.length; i++) {
      var rec = state.phon && state.phon[list[i].id];
      if (!rec || !rec.learned) return list[i];
    }
    return null;
  }

  function renderOverview(state) {
    var all = A.phonemes();
    var done = learnedCount(state);
    var next = nextUnlearned(state);

    var html = '';
    html += '<h1>音标</h1>';
    html +=
      '<p class="lede">' +
      all.length +
      ' 个音标，分 ' +
      A.phonGroups().length +
      ' 组。一个音标一屏：怎么发、三个例词、最容易混的是谁、三道听辨题。' +
      '按顺序走一遍大约 40 分钟，之后每天挑一两个不熟的再听一遍。</p>';

    html +=
      '<div class="notice"><p>' +
      '这里的注音是<b>英式 DJ 音标</b>，按牛津 / 朗文式手写 —— <b>不用</b>词表里 ECDICT 的原始注音，' +
      '因为它自己就不统一（law 记成 /lɒː/、point 记成 /pɒint/，把 ɔː 写成了 ɒ）。' +
      '例词全部取自本站 3846 个四级词，所以每个词都能在<a href="words.html">词表</a>里查到释义。</p></div>';

    html +=
      '<p class="faint">学过 <b>' +
      done +
      '</b> / ' +
      all.length +
      ' 个。' +
      (next
        ? '<a href="phonetics.html?id=' + esc(next.id) + '">继续下一个：/' + esc(next.sym) + '/</a>'
        : '全过了一遍。想巩固就从头再走一次。') +
      '</p>';

    A.phonGroups().forEach(function (g) {
      html += '<div class="card">';
      html +=
        '<h2>' + esc(g.name) + ' <span class="phon-count">' + (g.ids || []).length + ' 个</span></h2>';
      html += '<p class="muted">' + esc(g.desc) + '</p>';
      html += '<div class="phon-grid">';
      (g.ids || []).forEach(function (id) {
        var p = A.phonemeById(id);
        if (!p) return;
        var rec = state.phon && state.phon[id];
        var learned = !!(rec && rec.learned);
        html +=
          '<a class="phon-chip' + (learned ? ' is-done' : '') + '" href="phonetics.html?id=' + esc(id) +
          '" data-chip="' + esc(id) + '">' +
          '<b>/' + esc(p.sym) + '/</b>' +
          '<span>' + esc(p.ex[0] ? p.ex[0].w : '') + '</span>' +
          (learned ? '<i class="phon-done">✓</i>' : '') +
          '</a>';
      });
      html += '</div>';
      html += '</div>';
    });

    html +=
      '<p class="faint">注音里的小撇 ˈ 表示重音在后面那个音节（beˈgin）。' +
      '本站不托管任何音频：读音是浏览器现场合成的，没有英音就退回美音。</p>';

    main.innerHTML = html;
  }

  /* ---------- 单个音标 ---------- */

  function renderOne(state, p) {
    var g = A.phonGroupOf(p.id);
    var posInGroup = g ? (g.ids || []).indexOf(p.id) : -1;
    var rec = (state.phon && state.phon[p.id]) || {};
    var html = '';

    html +=
      '<p class="faint"><a href="phonetics.html">音标</a> · ' +
      esc(g ? g.name : '') +
      (posInGroup >= 0 ? ' ' + (posInGroup + 1) + ' / ' + (g.ids || []).length : '') +
      '</p>';

    html +=
      '<h1 class="phon-sym">/' + esc(p.sym) + '/ <span class="phon-name">' + esc(p.name) + '</span></h1>';

    /* 1. 怎么发 */
    html += '<div class="card"><h2>怎么发</h2><ul class="phon-tips">';
    (p.tip || []).forEach(function (t) {
      html += '<li>' + esc(t) + '</li>';
    });
    html += '</ul></div>';

    /* 2. 例词 */
    html += '<div class="card"><h2>例词</h2>';
    html += '<p class="faint" style="margin-bottom:12px">点「读一下」听一遍。先自己读，再听差在哪。</p>';
    html += '<div class="rows">';
    (p.ex || []).forEach(function (e) {
      html +=
        '<div class="row phon-word" data-ex="' + esc(e.w) + '">' +
        '<span class="row-word"><b>' + esc(e.w) + '</b> <span class="phon-ipa">/' + esc(e.ipa) + '/</span></span>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-say="' + esc(e.w) + '">读一下</button>' +
        '</div>';
    });
    html += '</div></div>';

    /* 3. 最容易混 */
    var c = p.contrast ? A.phonemeById(p.contrast.id) : null;
    if (c) {
      html += '<div class="card"><h2>最容易混：/' + esc(c.sym) + '/ <span class="phon-name">' + esc(c.name) + '</span></h2>';
      html += '<p>' + esc(p.contrast.note) + '</p>';
      html += '<div class="phon-pair">';
      [p, c].forEach(function (one, i) {
        var word = one.ex[0] || { w: '', ipa: '' };
        html +=
          '<div class="phon-side" data-side="' + esc(one.id) + '">' +
          '<b>/' + esc(one.sym) + '/</b>' +
          '<span>' + esc(word.w) + ' <span class="phon-ipa">/' + esc(word.ipa) + '/</span></span>' +
          '<button class="btn btn--sm" type="button" data-say="' + esc(word.w) + '">听 ' + (i === 0 ? '这个' : '那个') + '</button>' +
          '</div>';
      });
      html += '</div>';
      html += '<p class="faint" style="margin:12px 0 0">两个都听一遍，然后跟着读。区别只在舌位或声带，' +
        '不是「读得不一样」。<a href="phonetics.html?id=' + esc(c.id) + '">去看 /' + esc(c.sym) + '/</a></p>';
      html += '</div>';
    }

    /* 4. 听辨 */
    html += '<div class="card" data-quiz="' + esc(p.id) + '"><h2>听辨：哪个词里有 /' + esc(p.sym) + '/</h2>';
    html += '<p class="faint">四个词都给了注音。先用眼睛找，再点「读一下」用耳朵确认。</p>';
    (p.ex || []).forEach(function (e, qi) {
      var opts = optionsFor(p, qi);
      var chosen = ST.picked[qi];
      html += '<div class="q" data-q="' + qi + '">';
      html += '<p class="q-text">第 ' + (qi + 1) + ' 题 · 哪个词里有 /' + esc(p.sym) + '/？</p>';
      html += '<div class="phon-opts">';
      opts.forEach(function (o) {
        var isRight = o.w === e.w;
        var cls = 'phon-opt';
        if (chosen) {
          if (isRight) cls += ' is-right';
          else if (chosen === o.w) cls += ' is-wrong';
        }
        html +=
          '<button class="' + cls + '" type="button" data-pick="' + qi + '" data-w="' + esc(o.w) + '"' +
          (chosen ? ' disabled' : '') + '>' +
          '<span><b>' + esc(o.w) + '</b> <span class="phon-ipa">/' + esc(o.ipa) + '/</span></span>' +
          '<span class="phon-hear" data-say="' + esc(o.w) + '">听</span>' +
          '</button>';
      });
      html += '</div>';
      if (chosen) {
        html += chosen === e.w
          ? '<p class="mark-ok">对：' + esc(e.w) + ' /' + esc(e.ipa) + '/</p>'
          : '<p class="mark-no">这题是 ' + esc(e.w) + ' /' + esc(e.ipa) + '/（你选的是 ' + esc(chosen) + '）</p>';
      }
      html += '</div>';
    });

    if (allAnswered(p)) {
      var got = scoreOf(p);
      var total = (p.ex || []).length;
      var passed = got === total;
      html +=
        '<div class="notice" data-score="' + got + '"><p>这一轮对了 <b>' + got + ' / ' + total + '</b> 题。' +
        (passed
          ? '全对。这个音标可以放一放，过几天再回来听一次。'
          : '错的那题回去看「怎么发」和「最容易混」两段，再听一遍例词。') +
        '</p></div>';
      if (passed && !rec.learned) {
        html += '<p class="faint">全对，已经把它记为「学过」。</p>';
      }
      html += '<p class="phon-actions">';
      html += '<button class="btn" type="button" data-retry>再练一遍</button>';
      html +=
        '<button class="btn btn--ghost" type="button" data-learn="' + esc(p.id) + '">' +
        (rec.learned ? '标记为还没掌握' : '标记为学过') +
        '</button>';
      html += '</p>';
    } else {
      var doneN = Object.keys(ST.picked).length;
      html += '<p class="faint">已经答了 ' + doneN + ' / ' + (p.ex || []).length + ' 题。</p>';
    }
    html += '</div>';

    /* 5. 上一个 / 下一个 */
    var all = A.phonemes();
    var pos = -1;
    for (var i = 0; i < all.length; i++) if (all[i].id === p.id) pos = i;
    var prev = pos > 0 ? all[pos - 1] : null;
    var next = pos >= 0 && pos < all.length - 1 ? all[pos + 1] : null;
    html += '<div class="phon-nav">';
    html += prev
      ? '<a class="btn btn--ghost" href="phonetics.html?id=' + esc(prev.id) + '">← /' + esc(prev.sym) + '/</a>'
      : '<span></span>';
    html += next
      ? '<a class="btn btn--ghost" href="phonetics.html?id=' + esc(next.id) + '">/' + esc(next.sym) + '/ →</a>'
      : '<a class="btn btn--ghost" href="phonetics.html">回到总览</a>';
    html += '</div>';

    main.innerHTML = html;

    if (allAnswered(p) && !ST.saved) {
      saveResult(p);
    }
  }

  /* ---------- 入口 ---------- */

  function render() {
    if (!A.phonTable()) {
      main.innerHTML =
        '<h1>音标</h1><p class="lede">音标数据没加载出来。</p>' +
        '<div class="notice"><p>先确认 <code>data/phonetics.js</code> 在页面里、而且没被改坏。' +
        '跑一下 <code>node scripts/check-data.mjs</code> 会直接告诉你是哪一条。</p></div>';
      return;
    }

    var state = S.read();
    var y = window.scrollY;

    if (!ST.id) {
      renderOverview(state);
    } else {
      var p = A.phonemeById(ST.id);
      if (!p) {
        renderOverview(state);
      } else {
        renderOne(state, p);
      }
    }
    window.scrollTo(0, y);
  }

  function rerender() {
    // 重渲染会重建 DOM，先把滚动位置接回来，答完一题不至于跳回页首
    var y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  main.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;

    var say = t.closest('[data-say]');
    if (say) {
      ev.preventDefault();
      ev.stopPropagation();
      sayWord(say.getAttribute('data-say'));
      return;
    }

    var pick = t.closest('[data-pick]');
    if (pick) {
      var qi = Number(pick.getAttribute('data-pick'));
      var w = pick.getAttribute('data-w');
      if (ST.picked[qi]) return;
      ST.picked[qi] = w;
      var p = A.phonemeById(ST.id);
      if (p && allAnswered(p)) saveResult(p);
      rerender();
      return;
    }

    var retry = t.closest('[data-retry]');
    if (retry) {
      ST.picked = {};
      ST.saved = false;
      rerender();
      return;
    }

    var learn = t.closest('[data-learn]');
    if (learn) {
      var id = learn.getAttribute('data-learn');
      var key = A.todayKey();
      S.patch(function (state) {
        var rec = S.phon(state, id);
        rec.learned = !rec.learned;
        rec.lastDone = key;
      });
      rerender();
      return;
    }
  });

  window.CET4_APP.onImport = function () {
    ST.picked = {};
    ST.saved = false;
    render();
  };

  render();
})();
