/* 过线 · 精听（规划书第三节的五步流程）

   1 盲听（1 分钟）→ 2 逐句听写（10 分钟）→ 3 对照原文 + 分类（5 分钟）
   → 4 跟读（5 分钟）→ 5 第二天重听（3 分钟）

   第 3 步是全部价值所在：逐个看画圈的地方，分成两类
     「认识但没听出来」 → 音义映射断了，最好修
     「压根不认识」    → 单词问题，进生词本
   这两类的比例就是进度表 —— 判断标准不是正确率，是这个比例在不在下降。
   所以这个页面**不显示听写正确率**，只显示两类的个数。 */

(function () {
  var A = window.CET4_APP;
  var S = window.CET4_STORE;
  var TTS = window.CET4_TTS;
  var TXT = window.CET4_TEXT;
  var SRS = window.CET4_SRS;
  var main = document.getElementById('main');
  if (!main) return;

  var params = new URLSearchParams(location.search);
  var MAX_PLAYS = 3;

  var ST = {
    clipId: params.get('clip') || '',
    relisten: params.get('mode') === 'relisten',
    step: 'blind',
    index: 0,
    typed: {},
    plays: {},
    blindPlays: 0,
    gistShown: false,
    textShown: false,
    labels: {},
    content: [],
    funcWords: [],
    marked: null,
    playing: false,
    playAt: 0,
    handle: null,
  };

  var TYPES = {
    news: { label: '短篇新闻', note: 'A 部分 · 7 题 49.7 分' },
    conversation: { label: '长对话', note: 'B 部分 · 8 题 56.8 分' },
    passage: { label: '听力篇章', note: 'C 部分 · 10 题 142 分 ← 分值最高' },
  };
  var TYPE_ORDER = ['passage', 'conversation', 'news'];

  function clip() {
    return A.clipById(ST.clipId);
  }

  function rate() {
    var r = Number(S.read().settings.rate);
    return r > 0 ? r : 0.8;
  }

  function setRate(r) {
    S.patch(function (state) {
      state.settings.rate = r;
    });
  }

  function nowKey() {
    return A.todayKey();
  }

  function stop() {
    if (ST.handle && ST.handle.cancel) ST.handle.cancel();
    TTS.cancel();
    ST.playing = false;
    ST.handle = null;
  }

  /* ---------- 播放 ---------- */

  function playAll() {
    var c = clip();
    if (!c || !TTS.supported) return;
    stop();
    ST.blindPlays += 1;
    ST.playing = true;
    ST.playAt = 0;
    render();
    ST.handle = TTS.speakAll(c.sentences, {
      rate: rate(),
      gap: 420,
      onProgress: function (i) {
        ST.playAt = i;
        var el = main.querySelector('[data-play-status]');
        if (el) el.textContent = '正在播放第 ' + (i + 1) + ' / ' + c.sentences.length + ' 句…';
      },
      onend: function () {
        ST.playing = false;
        render();
      },
    });
  }

  function playOne(text, onDone) {
    if (!TTS.supported) return;
    stop();
    ST.handle = TTS.speak(text, {
      rate: rate(),
      onend: function () {
        ST.playing = false;
        if (onDone) onDone();
        render();
      },
    });
    ST.playing = true;
    render();
  }

  function playSentence(i) {
    var c = clip();
    if (!c) return;
    ST.plays[i] = (ST.plays[i] || 0) + 1;
    playOne(c.sentences[i]);
  }

  /* ---------- 列表 ---------- */

  function statusOf(rec) {
    if (!rec || !rec.rounds) return 'new';
    if (rec.due && rec.due <= nowKey()) return 'due';
    return 'done';
  }

  function renderList() {
    var state = S.read();
    var key = nowKey();
    var all = A.clips();
    if (!all.length) {
      main.innerHTML = '<div class="card"><h2>还没有精听材料</h2><p class="muted">data/listening.js 没读到。</p></div>';
      return;
    }
    var due = A.listenDue(state, key);

    var groups = TYPE_ORDER.map(function (type) {
      var list = all.filter(function (c) {
        return c.type === type;
      });
      if (!list.length) return '';
      var cards = list
        .map(function (c) {
          var rec = (state.listen.clips || {})[c.id];
          var status = statusOf(rec);
          var action = ST.relistenTag(status, c, rec);
          return (
            '<div class="card card--tight clip-card" data-clip="' + c.id + '">' +
            '<div class="clip-head"><b>' + A.esc(c.title) + '</b>' +
            '<span class="faint">' + c.sentences.length + ' 句 · 难度 ' + c.level + '</span></div>' +
            '<p class="faint" style="margin:6px 0 0">练的是：' + A.esc(c.focus) + '</p>' +
            action +
            '</div>'
          );
        })
        .join('');
      return '<h2 style="margin-top:26px">' + TYPES[type].label +
        ' <span class="faint" style="font-size:14px">' + TYPES[type].note + '</span></h2>' + cards;
    }).join('');

    var notice = '';
    if (!TTS.supported) {
      notice = '<div class="notice">这个浏览器不支持语音合成，朗读用不了。<b>听写对照那几步照样能用</b>：' +
        '自己放真题音频或手机朗读，一样能在这个页面上对照、分类。</div>';
    } else if (!TTS.voices().length) {
      notice = '<div class="notice">系统里好像没装英语语音，按下播放可能没声音。换 Chrome 或 Edge 试试。</div>';
    }

    main.innerHTML =
      '<h1>精听</h1>' +
      '<p class="lede">一段自产短文 + 浏览器朗读。五步，约 25 分钟：盲听 → 逐句听写 → 对照原文 → 跟读 → 第二天重听。</p>' +
      notice +
      (due.length
        ? '<div class="card card--tight"><b>今天该重听 ' + due.length + ' 篇</b>' +
          '<p class="faint" style="margin:6px 0 0">不写，只听。能听懂八成就算过。</p>' +
          '<div class="btn-row" style="margin-top:10px"><a class="btn btn--sm btn--primary" href="listening.html?clip=' +
          due[0].id + '&mode=relisten">开始重听</a></div></div>'
        : '') +
      '<p class="faint" style="margin-top:20px">这些短文是本站自产的练习材料，<b>不是真题</b>。' +
      '机器音练的是「听清并理解」，练不出考场音响的适应感 —— 真题音频请用官方出版物。</p>' +
      groups;
  }

  // 附在牌子里的状态标签（抽出来是因为下面还要用）
  ST.relistenTag = function (status, c, rec) {
    var key = nowKey();
    if (status === 'due') {
      return '<div class="btn-row" style="margin-top:10px">' +
        '<a class="btn btn--sm btn--primary" href="listening.html?clip=' + c.id + '&mode=relisten">今天该重听</a>' +
        '<a class="btn btn--sm btn--ghost" href="listening.html?clip=' + c.id + '">重新精听一遍</a>' +
        '</div><p class="faint" style="margin:8px 0 0">上次 ' + rec.lastDone + '</p>';
    }
    if (status === 'done') {
      return '<div class="btn-row" style="margin-top:10px">' +
        '<a class="btn btn--sm" href="listening.html?clip=' + c.id + '">再做一遍</a>' +
        '</div><p class="faint" style="margin:8px 0 0">做过 ' + rec.rounds + ' 轮 · 上次 ' + rec.lastDone +
        ' · 下次重听 ' + rec.due + '（' + SRS.dueLabel(rec.due, key) + '）</p>';
    }
    return '<div class="btn-row" style="margin-top:10px">' +
      '<a class="btn btn--sm btn--primary" href="listening.html?clip=' + c.id + '">开始精听</a>' +
      '</div>';
  };

  /* ---------- 五步 ---------- */

  function ttsNotice() {
    if (!TTS.supported) return '<p class="faint">这个浏览器没有语音合成，请自己放音频，用下面的框听写。</p>';
    return '';
  }

  function rateChips() {
    var cur = rate();
    var opts = [
      [0.6, '很慢'],
      [0.8, '慢'],
      [1.0, '正常'],
      [1.15, '快'],
    ];
    return (
      '<div class="chips">' +
      opts
        .map(function (o) {
          return '<button class="chip" type="button" data-rate="' + o[0] + '" aria-pressed="' +
            (Math.abs(cur - o[0]) < 0.01) + '">' + o[1] + ' ' + o[0] + '×</button>';
        })
        .join('') +
      '</div>'
    );
  }

  function stepMeta(step, right) {
    var steps = [
      ['blind', '第 1 步 · 盲听'],
      ['dictate', '第 2 步 · 逐句听写'],
      ['compare', '第 3 步 · 对照原文'],
      ['shadow', '第 4 步 · 跟读'],
      ['done', '第 5 步 · 明天重听'],
    ];
    var idx = 0;
    for (var i = 0; i < steps.length; i++) if (steps[i][0] === step) idx = i;
    var label = ST.relisten && step === 'blind' ? '重听' : steps[idx][1];
    return (
      '<div class="probe-meta" data-step="' + step + '">' +
      '<span>' + label + '</span><span class="faint">' + (right || '') + '</span></div>' +
      '<div class="bar"><i style="width:' + Math.round(((idx + 1) / steps.length) * 100) + '%"></i></div>'
    );
  }

  function renderBlind() {
    var c = clip();
    var playLabel = ST.blindPlays ? '再听一遍（第 ' + (ST.blindPlays + 1) + ' 次）' : '▶ 播放整篇';
    var body = ST.relisten
      ? '<p class="muted">不写，只听。能听懂八成就算过。</p>'
      : '<p class="muted">只听，不写。抓大意就行，别纠结个别词。</p>';
    body += rateChips();
    body +=
      '<div class="btn-row">' +
      (TTS.supported
        ? '<button class="btn btn--primary btn--huge" type="button" data-play-all>' + (ST.playing ? '正在播放…' : playLabel) + '</button>'
        : '') +
      (ST.playing ? '<button class="btn" type="button" data-stop>停止</button>' : '') +
      '</div>' +
      '<p class="faint" data-play-status>' +
      (ST.playing
        ? '正在播放第 ' + (ST.playAt + 1) + ' / ' + c.sentences.length + ' 句…'
        : '建议只播 1–2 遍。听不懂的地方先放下，第 2 步会逐句挖出来。') +
      '</p>' +
      ttsNotice();

    if (ST.relisten) {
      if (ST.textShown) {
        body += '<div class="study-answer">' + A.esc(c.sentences.join(' ')) + '</div>';
      }
      body +=
        '<div class="btn-row">' +
        (ST.textShown ? '' : '<button class="btn btn--sm btn--ghost" type="button" data-show-text>实在不行，看原文</button>') +
        '<button class="btn btn--ok btn--huge" type="button" data-pass>听懂了（八成以上）</button>' +
        '<button class="btn btn--no" type="button" data-fail>还不行，明天再来</button>' +
        '</div>';
      return body;
    }

    if (ST.gistShown) {
      body += '<div class="study-answer"><b>大意：</b>' + A.esc(c.gist) + '</div>';
    } else {
      body += '<div class="btn-row"><button class="btn" type="button" data-gist>对一下大意</button></div>';
    }
    body +=
      '<div class="btn-row">' +
      '<button class="btn btn--primary btn--huge" type="button" data-next-step>进入逐句听写</button>' +
      '</div>';
    return body;
  }

  function renderDictate() {
    var c = clip();
    var i = ST.index;
    var played = ST.plays[i] || 0;
    var canPlay = TTS.supported && played < MAX_PLAYS;
    var playLabel = played === 0 ? '▶ 播放这一句' : '再听一次（第 ' + (played + 1) + ' 次）';
    return (
      '<div class="card">' +
      '<p class="muted">听到什么写什么。<b>听不出的地方打一个 ?</b>，不要倒回去反复听 —— 那些圈就是你耳朵的病灶。</p>' +
      rateChips() +
      '<div class="btn-row">' +
      (canPlay
        ? '<button class="btn ' + (played ? '' : 'btn--primary btn--huge') + '" type="button" data-play-one>' + playLabel + '</button>'
        : '<span class="faint">这一句已经放过 ' + played + ' 次，别再听了。</span>') +
      '</div>' +
      '<textarea class="writebox" data-typed rows="3" placeholder="第 ' + (i + 1) + ' 句听到的内容…">' +
      A.esc(ST.typed[i] || '') +
      '</textarea>' +
      '<div class="btn-row">' +
      (i > 0 ? '<button class="btn btn--sm btn--ghost" type="button" data-prev>上一句</button>' : '') +
      (i < c.sentences.length - 1
        ? '<button class="btn btn--primary btn--huge" type="button" data-next>下一句</button>'
        : '<button class="btn btn--primary btn--huge" type="button" data-to-compare>对照原文</button>') +
      '</div>' +
      ttsNotice() +
      '</div>'
    );
  }

  function markedHtml(text, marks) {
    return TXT.markedTokens(text, marks)
      .map(function (t) {
        if (!t.isWord) return A.esc(t.text);
        if (t.mark === 'hit') return A.esc(t.text);
        return '<span class="diff-miss">' + A.esc(t.text) + '</span>';
      })
      .join('');
  }

  function renderCompare() {
    var c = clip();
    var typedList = c.sentences.map(function (_, i) {
      return ST.typed[i] || '';
    });
    var result = TXT.compareClip(c.sentences, typedList);
    ST.marked = result;
    var split = result.content;
    ST.content = split.content;
    ST.funcWords = split.functionWord;

    var lines = c.sentences
      .map(function (s, i) {
        var r = result.perSentence[i];
        var mine = ST.typed[i] || '';
        var extra = r.extra.length
          ? '<span class="faint">多写了：' + A.esc(r.extra.join(' ')) + '</span>'
          : '';
        var mineLine = mine.trim()
          ? '<p class="diff-mine">我写的：' + A.esc(mine) + ' ' + extra + '</p>'
          : '<p class="diff-mine faint">我写的：（这一句空着）</p>';
        return (
          '<div class="diff-block">' +
          '<p class="diff-line">' + markedHtml(s, r.marks) + '</p>' +
          mineLine +
          '</div>'
        );
      })
      .join('');

    var classify = ST.content.length
      ? ST.content
          .map(function (w, i) {
            var label = ST.labels[w] || '';
            var gloss = A.wordGloss(w);
            return (
              '<div class="classify" data-word="' + A.esc(w) + '">' +
              '<div class="classify-word"><b>' + A.esc(w) + '</b>' +
              (gloss ? ' <span class="faint">' + A.esc(gloss.slice(0, 40)) + '</span>' : ' <span class="faint">（词表里没有，自己查一下）</span>') +
              '</div>' +
              '<div class="btn-row" style="margin-top:0">' +
              '<button class="chip" type="button" data-label-idx="' + i + '" data-kind="recog" aria-pressed="' +
              (label === 'recog') + '">认识，但没听出来</button>' +
              '<button class="chip" type="button" data-label-idx="' + i + '" data-kind="unknown" aria-pressed="' +
              (label === 'unknown') + '">压根不认识</button>' +
              '</div>' +
              '</div>'
            );
          })
          .join('')
      : '<p class="muted">没漏掉任何实词。这一段对你太简单了，换难一点的。</p>';

    return (
      '<div class="card">' +
      '<h2>逐句对照</h2>' +
      '<p class="faint">红色 = 没听出来的词。对照原文是整件事里最值钱的一步，别跳。</p>' +
      lines +
      '</div>' +
      '<div class="card">' +
      '<h2>没听出来的词：分两类</h2>' +
      '<p class="muted"><b>认识但没听出来</b> → 音义映射断了，这类最好修；<b>压根不认识</b> → 单词问题。</p>' +
      classify +
      (ST.funcWords.length
        ? '<p class="faint" style="margin-top:14px">漏掉的虚词（不计入统计）：' + A.esc(ST.funcWords.join(' · ')) + '</p>'
        : '') +
      '<div class="btn-row">' +
      (ST.content.length ? '<button class="btn btn--sm" type="button" data-label-rest>剩下的都算「认识但没听出来」</button>' : '') +
      '<button class="btn btn--primary btn--huge" type="button" data-to-shadow>进入跟读</button>' +
      '</div>' +
      '</div>'
    );
  }

  function renderShadow() {
    var c = clip();
    var i = ST.index;
    var tips = (c.tips || [])
      .map(function (t) {
        return '<li>' + A.esc(t) + '</li>';
      })
      .join('');
    return (
      '<div class="card">' +
      '<p class="muted">跟着念，模仿连读、弱读、语调。<b>念不顺的地方就是耳朵没抓住的地方。</b></p>' +
      (tips ? '<ul class="prose" style="padding-left:20px">' + tips + '</ul>' : '') +
      rateChips() +
      '<div class="study-word">' + A.esc(c.sentences[i]) + '</div>' +
      '<div class="btn-row">' +
      (TTS.supported ? '<button class="btn btn--primary btn--huge" type="button" data-play-one>▶ 播放这句</button>' : '') +
      (i < c.sentences.length - 1
        ? '<button class="btn btn--huge" type="button" data-next>下一句</button>'
        : '<button class="btn btn--ok btn--huge" type="button" data-finish>跟完了，结束这一篇</button>') +
      '</div>' +
      '<p class="faint">第 ' + (i + 1) + ' / ' + c.sentences.length + ' 句</p>' +
      ttsNotice() +
      '</div>'
    );
  }

  function renderDone() {
    var c = clip();
    var state = S.read();
    var tally = A.listenTally(state);
    var mine = ST.marked ? ST.marked.content : { content: [] };
    var rec = (state.listen.clips || {})[c.id] || {};
    var words = rec.words || {};
    var recog = 0;
    var unknown = 0;
    Object.keys(words).forEach(function (w) {
      if (words[w] === 'recog') recog++;
      else if (words[w] === 'unknown') unknown++;
    });
    var total = tally.recognized + tally.unknown;
    var ratio = total ? Math.round((tally.recognized / total) * 100) : 0;

    return (
      '<h1>这一篇做完了</h1>' +
      '<div class="card">' +
      '<h2>' + A.esc(c.title) + '</h2>' +
      '<div class="stats">' +
      '<div class="stat"><b class="num">' + recog + '</b><span>认识但没听出来</span></div>' +
      '<div class="stat"><b class="num">' + unknown + '</b><span>压根不认识</span></div>' +
      '<div class="stat"><b class="num">' + (ST.funcWords || mine.content || []).length + '</b><span>漏掉的虚词</span></div>' +
      '</div>' +
      '<p class="faint">明天会提醒你重听这一篇（不写，只听，听懂八成就算过）。</p>' +
      '<p class="muted">全站累计：认识但没听出来 <b>' + tally.recognized + '</b> 个 · 不认识 <b>' + tally.unknown +
      '</b> 个 —— 其中「认识但没听出来」占 <b>' + ratio + '%</b>。</p>' +
      '<p class="faint">这个比例下降，比听写正确率上涨更能说明你在变好。所以这个站不给你看正确率。</p>' +
      '<div class="btn-row">' +
      '<a class="btn btn--primary btn--huge" href="index.html">回今日页</a>' +
      '<a class="btn" href="listening.html">回精听列表</a>' +
      '<a class="btn btn--ghost" href="progress.html">看进度</a>' +
      '</div>' +
      '</div>'
    );
  }

  function renderClip() {
    var c = clip();
    if (!c) {
      renderList();
      return;
    }
    var right = c.title + ' · 共 ' + c.sentences.length + ' 句';
    if (ST.step === 'dictate' || ST.step === 'shadow') right = '第 ' + (ST.index + 1) + ' / ' + c.sentences.length + ' 句 · ' + c.title;
    var body =
      ST.step === 'blind'
        ? renderBlind()
        : ST.step === 'dictate'
        ? renderDictate()
        : ST.step === 'compare'
        ? renderCompare()
        : ST.step === 'shadow'
        ? renderShadow()
        : renderDone();

    var back = ST.step === 'done' ? '' : '<p class="faint"><a href="listening.html">← 回精听列表（进度会留着）</a></p>';
    main.innerHTML =
      stepMeta(ST.step, right) +
      '<div class="card card--tight"><b>' + A.esc(c.title) + '</b> <span class="faint">' + TYPES[c.type].label + '</span>' +
      '<p class="faint" style="margin:6px 0 0">练的是：' + A.esc(c.focus) + ' · 本站自产，不是真题</p></div>' +
      body +
      back;
  }

  function render() {
    if (!ST.clipId) renderList();
    else renderClip();
  }

  /* ---------- 收尾入账 ---------- */

  function finish(pass, relistenPass) {
    var key = nowKey();
    var c = clip();
    S.patch(function (state) {
      var rec = S.clip(state, c.id);
      rec.rounds += 1;
      rec.lastDone = key;
      rec.blindPlays += ST.blindPlays;
      var replays = 0;
      Object.keys(ST.plays).forEach(function (k) {
        replays += Math.max(0, (ST.plays[k] || 0) - 1);
      });
      rec.replays += replays;
      Object.keys(ST.labels).forEach(function (w) {
        rec.words[w] = ST.labels[w];
      });
      if (relistenPass) rec.due = SRS.addDays(key, pass ? 4 : 1);
      else rec.due = SRS.addDays(key, 1);
      var day = S.day(state, key);
      day.listenDone += 1;
      A.applyGoals(state, key);
    });
    ST.step = 'done';
    render();
    window.scrollTo(0, 0);
  }

  /* ---------- 事件 ---------- */

  main.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-rate],[data-play-all],[data-stop],[data-gist],[data-next-step],[data-play-one],[data-next],[data-prev],[data-to-compare],[data-label-idx],[data-label-rest],[data-to-shadow],[data-show-text],[data-pass],[data-fail],[data-finish]') : null;
    if (!t) return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

    if (t.hasAttribute('data-rate')) {
      setRate(Number(t.getAttribute('data-rate')));
      render();
      return;
    }
    if (t.hasAttribute('data-play-all')) {
      playAll();
      return;
    }
    if (t.hasAttribute('data-stop')) {
      stop();
      render();
      return;
    }
    if (t.hasAttribute('data-gist')) {
      ST.gistShown = true;
      render();
      return;
    }
    if (t.hasAttribute('data-show-text')) {
      ST.textShown = true;
      render();
      return;
    }
    if (t.hasAttribute('data-next-step')) {
      ST.step = 'dictate';
      ST.index = 0;
      render();
      return;
    }
    if (t.hasAttribute('data-play-one')) {
      var box = main.querySelector('[data-typed]');
      if (box && ST.step === 'dictate') ST.typed[ST.index] = box.value;
      playSentence(ST.index);
      return;
    }
    if (t.hasAttribute('data-next')) {
      if (ST.step === 'dictate') {
        var b = main.querySelector('[data-typed]');
        if (b) ST.typed[ST.index] = b.value;
      }
      ST.index += 1;
      render();
      return;
    }
    if (t.hasAttribute('data-prev')) {
      var p = main.querySelector('[data-typed]');
      if (p && ST.step === 'dictate') ST.typed[ST.index] = p.value;
      ST.index = Math.max(0, ST.index - 1);
      render();
      return;
    }
    if (t.hasAttribute('data-to-compare')) {
      var b2 = main.querySelector('[data-typed]');
      if (b2) ST.typed[ST.index] = b2.value;
      ST.step = 'compare';
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (t.hasAttribute('data-label-idx')) {
      var idx = Number(t.getAttribute('data-label-idx'));
      var kind = t.getAttribute('data-kind');
      var word = ST.content[idx];
      if (word) ST.labels[word] = ST.labels[word] === kind ? '' : kind;
      render();
      return;
    }
    if (t.hasAttribute('data-label-rest')) {
      ST.content.forEach(function (w) {
        if (!ST.labels[w]) ST.labels[w] = 'recog';
      });
      render();
      return;
    }
    if (t.hasAttribute('data-to-shadow')) {
      ST.step = 'shadow';
      ST.index = 0;
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (t.hasAttribute('data-finish')) {
      finish(false, false);
      return;
    }
    if (t.hasAttribute('data-pass')) {
      finish(true, true);
      return;
    }
    if (t.hasAttribute('data-fail')) {
      finish(false, true);
    }
  });

  // 听写文本框里的内容随时记下来（换句、退出都不丢）
  main.addEventListener('input', function (ev) {
    if (!ev.target.hasAttribute || !ev.target.hasAttribute('data-typed')) return;
    ST.typed[ST.index] = ev.target.value;
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (ev.target && /TEXTAREA|INPUT/.test(ev.target.tagName || '')) return;
    if (ev.key === ' ' || ev.key === 'Spacebar') {
      ev.preventDefault();
      var btn = main.querySelector('[data-play-one],[data-play-all]');
      if (btn) btn.click();
    }
  });

  window.addEventListener('beforeunload', function () {
    TTS.cancel();
  });

  window.CET4_APP.onImport = render;
  render();
})();
