/* 过线 · 背词 / 复习（规划书阶段 2 的主循环：背 → 测 → 记录）

   三种模式，都是同一套卡片流程：
     study.html?mode=new     今天的新词：直接给释义，问「记住了 / 还不熟」
     study.html?mode=review  今天到期的复习：先只给单词，自己回忆，再对答案
     study.html?mode=book    错词本练习：跟复习一样，但从错词本里取词

   两个刻意的设计：
     1. 复习是先考再给答案 —— 一上来就看释义等于没考，这是间隔重复能起作用的前提；
     2. 「模糊 / 忘了 / 还不熟」的词在本轮末尾再问一遍（最多再来一次），
        不搞无限循环，也不让它就这么滑过去。 */

(function () {
  var A = window.CET4_APP;
  var S = window.CET4_STORE;
  var SRS = window.CET4_SRS;
  var main = document.getElementById('main');
  if (!main) return;

  var BOOK_LIMIT = 60;
  var params = new URLSearchParams(location.search);
  var MODE = params.get('mode') || 'new';
  if (MODE !== 'new' && MODE !== 'review' && MODE !== 'book') MODE = 'new';

  var TITLES = { new: '新词', review: '复习', book: '错词本' };
  var queue = [];
  var index = 0;
  var revealed = false;
  var startedAt = Date.now();
  var requeued = {}; // 本轮已经重排过一次的词
  var counted = {}; // 本轮已经计入「今日完成」的词
  var session = { newDone: 0, reviewDone: 0, bookDone: 0, touched: 0 };

  function table() {
    return A.coreTable();
  }

  function buildQueue() {
    var state = S.read();
    var words = A.coreWords();
    var key = A.todayKey();
    var tier = A.modeFor(state, key);
    var srs = state.srs || {};
    if (MODE === 'new') return SRS.pickNew(srs, words, A.answers(), tier.newWords);
    if (MODE === 'review') return SRS.pickReview(srs, words, key, tier.reviewCap || 0);
    return SRS.pickBook(srs, words, BOOK_LIMIT);
  }

  /* 打分：写 SRS、记今日完成、决定要不要本轮再问一遍 */
  function submit(g) {
    if (index >= queue.length) return;
    var word = queue[index];
    var key = A.todayKey();
    S.patch(function (state) {
      var entry = S.entry(state, word.w, key);
      state.srs[word.w] = SRS.grade(entry, g, key);

      if (MODE !== 'book' && !counted[word.w]) {
        counted[word.w] = 1;
        var day = S.day(state, key);
        if (MODE === 'new') day.newDone += 1;
        else day.reviewDone += 1;
      }
      A.applyGoals(state, key);
    });

    if (MODE === 'new') session.newDone++;
    else if (MODE === 'review') session.reviewDone++;
    else session.bookDone++;
    session.touched++;

    if (g !== 'known' && !requeued[word.w]) {
      requeued[word.w] = 1;
      queue.push(word); // 本轮末尾再来一遍
    }

    index++;
    revealed = false;
    if (index >= queue.length) finish();
    else render();
  }

  function finish() {
    var key = A.todayKey();
    var ms = Date.now() - startedAt;
    var day;
    S.patch(function (state) {
      day = S.day(state, key);
      day.ms = (Number(day.ms) || 0) + ms;
      A.applyGoals(state, key);
    });

    var book = SRS.bookList(S.read().srs || {}, A.coreWords()).length;
    var lines = [];
    if (MODE === 'new') lines.push('新词 ' + session.newDone + ' 个');
    if (MODE === 'review') lines.push('复习 ' + session.reviewDone + ' 个');
    if (MODE === 'book') lines.push('错词本练了 ' + session.bookDone + ' 个');
    lines.push('用时 ' + Math.max(1, Math.round(ms / 60000)) + ' 分钟');

    main.innerHTML =
      '<h1>这一轮结束了</h1>' +
      '<div class="card">' +
        '<div class="stats">' +
          '<div class="stat"><b class="num">' + session.touched + '</b><span>过了一遍的词</span></div>' +
          '<div class="stat"><b class="num">' + Math.max(1, Math.round(ms / 60000)) + '</b><span>分钟</span></div>' +
          '<div class="stat"><b class="num">' + book + '</b><span>错词本</span></div>' +
        '</div>' +
        '<p class="muted">' + lines.join(' · ') + '</p>' +
        '<p class="faint">不需要把今天的量做完才算数。做了多少就记多少，明天接着来。</p>' +
        '<div class="btn-row">' +
          '<a class="btn btn--primary btn--huge" href="index.html">回今日页</a>' +
          '<button class="btn" type="button" data-again>再来一轮</button>' +
          (book > 0 ? '<a class="btn btn--ghost" href="study.html?mode=book">练一遍错词本</a>' : '') +
        '</div>' +
      '</div>';
  }

  function cardHtml(word) {
    var state = S.read();
    var entry = (state.srs || {})[word.w];
    var head =
      '<div class="probe-meta" data-study-index="' + index + '">' +
        '<span>第 <b class="num">' + (index + 1) + '</b> / ' + queue.length +
          ' <span class="faint">· ' + TITLES[MODE] + '</span></span>' +
        '<span class="faint">' + (entry && entry.seen ? '见过 ' + entry.seen + ' 次' : '第一次见') + '</span>' +
      '</div>' +
      '<div class="bar"><i style="width:' + Math.round((index / queue.length) * 100) + '%"></i></div>';

    var body;
    if (MODE === 'new') {
      body =
        '<div class="study-word">' + A.esc(word.w) + '</div>' +
        '<div class="probe-phon">' + (word.ph ? '/' + A.esc(word.ph) + '/' : '') + '</div>' +
        '<div class="study-answer"><b>' + A.esc(word.zh) + '</b></div>' +
        '<div class="btn-row btn-row--split" style="margin-top:18px">' +
          '<button class="btn btn--no btn--huge" type="button" data-grade="missed">还不熟</button>' +
          '<button class="btn btn--ok btn--huge" type="button" data-grade="known">记住了</button>' +
        '</div>';
    } else {
      body =
        '<div class="study-word" data-study-word="' + A.esc(word.w) + '">' + A.esc(word.w) + '</div>' +
        '<div class="probe-phon">' + (word.ph ? '/' + A.esc(word.ph) + '/' : '') + '</div>' +
        (revealed
          ? '<div class="study-answer"><b>' + A.esc(word.zh) + '</b></div>' +
            '<div class="btn-row" style="margin-top:14px">' +
              '<button class="btn btn--ok btn--huge" type="button" data-grade="known">记得</button>' +
              '<button class="btn btn--huge" type="button" data-grade="fuzzy">有点模糊</button>' +
              '<button class="btn btn--no btn--huge" type="button" data-grade="missed">忘了</button>' +
            '</div>'
          : '<div class="study-answer is-hidden"></div>' +
            '<div class="btn-row"><button class="btn btn--primary btn--huge" type="button" data-reveal>看释义</button></div>' +
            '<p class="faint">先自己想一遍再看答案，这一步才有效果。</p>');
    }

    var foot =
      '<div class="btn-row" style="margin-top:18px">' +
        '<a class="btn btn--sm btn--ghost" href="index.html">退出（做过的已经存好）</a>' +
      '</div>' +
      '<p class="faint">键盘：' +
        (MODE === 'new' ? '<b>1</b> 记住了 · <b>2</b> 还不熟' : '<b>空格</b> 看释义 · <b>1</b> 记得 · <b>2</b> 模糊 · <b>3</b> 忘了') +
      '</p>';

    return head + '<div class="card" data-study-card>' + body + foot + '</div>';
  }

  function render() {
    if (!table()) {
      main.innerHTML = '<div class="card"><h2>词表没加载出来</h2><p class="muted">缺少 data/words-core.js。</p></div>';
      return;
    }
    if (index >= queue.length) return finish();
    var word = queue[index];
    main.innerHTML = cardHtml(word);
  }

  function emptyState() {
    var key = A.todayKey();
    var state = S.read();
    var msg = {
      new: '不认识的主干词已经全部学完了 —— 单词这块可以收工，去练精听。',
      review: '今天没有到期的复习词。',
      book: '错词本现在是空的。背错的词会自动进来。',
    }[MODE];
    main.innerHTML =
      '<h1>' + TITLES[MODE] + '没有要做的</h1>' +
      '<div class="card"><p>' + msg + '</p>' +
      '<div class="btn-row"><a class="btn btn--primary" href="index.html">回今日页</a>' +
      '<a class="btn" href="progress.html">看进度</a></div></div>';
  }

  main.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-grade],[data-reveal],[data-again]') : null;
    if (!t) return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (t.hasAttribute('data-grade')) submit(t.getAttribute('data-grade'));
    else if (t.hasAttribute('data-reveal')) {
      revealed = true;
      render();
    } else if (t.hasAttribute('data-again')) {
      queue = buildQueue();
      index = 0;
      revealed = false;
      requeued = {};
      counted = {};
      session = { newDone: 0, reviewDone: 0, bookDone: 0, touched: 0 };
      startedAt = Date.now();
      if (!queue.length) emptyState();
      else render();
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var k = ev.key;
    if (MODE === 'new') {
      if (k === '1') { ev.preventDefault(); submit('known'); }
      else if (k === '2') { ev.preventDefault(); submit('missed'); }
      return;
    }
    if (k === ' ' || k === 'Spacebar') {
      ev.preventDefault();
      if (!revealed) { revealed = true; render(); }
      return;
    }
    if (!revealed) return;
    if (k === '1') { ev.preventDefault(); submit('known'); }
    else if (k === '2') { ev.preventDefault(); submit('fuzzy'); }
    else if (k === '3') { ev.preventDefault(); submit('missed'); }
  });

  queue = buildQueue();
  if (!queue.length) emptyState();
  else render();
})();
