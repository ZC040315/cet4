/* 过线 · 背词 / 复习（规划书阶段 2 的主循环：背 → 测 → 记录）

   三种模式，都是同一套「四选一」：
     study.html?mode=new     今天的新词：看单词，选它的中文意思
     study.html?mode=review  今天到期的复习：看中文意思，选对应的单词
     study.html?mode=book    错词本练习：跟复习一样，从错词本里取词

   两个刻意的设计：
     1. 新词认脸（单词 → 中文），复习反过来（中文 → 单词）；同一个词从两个方向各过一遍，
        比只看一遍释义牢，也比「点开答案再自评」少一点自我欺骗；
     2. 答错的词在本轮末尾再问一遍（最多再来一次），不搞无限循环，
        也不让它就这么滑过去。 */

(function () {
  var A = window.CET4_APP;
  var S = window.CET4_STORE;
  var SRS = window.CET4_SRS;
  var main = document.getElementById('main');
  if (!main) return;

  var BOOK_LIMIT = 60;
  var LETTERS = ['A', 'B', 'C', 'D'];
  var params = new URLSearchParams(location.search);
  var MODE = params.get('mode') || 'new';
  if (MODE !== 'new' && MODE !== 'review' && MODE !== 'book') MODE = 'new';

  var TITLES = { new: '新词', review: '复习', book: '错词本' };
  var KICKERS = {
    new: '看单词，选出正确的中文意思',
    review: '看中文意思，选出对应的单词',
    book: '看中文意思，选出对应的单词',
  };

  var queue = [];
  var index = 0;
  var answered = null; // { pick: 选项序号, ok: 对/错 }
  var startedAt = Date.now();
  var requeued = {}; // 本轮已经重排过一次的词
  var counted = {}; // 本轮已经计入「今日完成」的词
  var roundWords = {}; // 本轮出现过的词（重做不重复计数）
  var session = { newDone: 0, reviewDone: 0, bookDone: 0, touched: 0, attempts: 0, correct: 0 };

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

  /* ---------- 题面：把 ECDICT 的长释义压成一眼能扫完的一条 ----------

     词典原文动辄五六个词性、十几个义项（state 那条有 60 多个字），四个选项并排会糊成一片。
     这里只做删减，不改写：去掉 [计] 这类领域标注，只留第一个词性段，最多三个义项。 */

  var POS_RE = /\b(?:a|ad|adv|aux|conj|int|n|num|prep|pron|v|vi|vt)\.\s/g;

  function firstPosSegment(s) {
    POS_RE.lastIndex = 0;
    var m = POS_RE.exec(s);
    if (!m) return s;
    var start = m.index;
    var next = POS_RE.exec(s);
    return s.slice(start, next ? next.index : s.length).trim();
  }

  function shortZh(zh) {
    var s = String(zh == null ? '' : zh).replace(/\\r\\n|\\n|\\r/g, ' ');
    var cut = s.indexOf('[');
    if (cut > 0) s = s.slice(0, cut);
    else if (cut === 0) s = s.replace(/\[[^\]]*\]/g, ' ');
    s = firstPosSegment(s.trim());
    if (!s) s = String(zh || '').replace(/\[[^\]]*\]/g, ' ').trim();

    var parts = s.split(/[,，]/);
    if (parts.length > 1) {
      var keep = [];
      for (var i = 0; i < parts.length && keep.length < 3; i++) {
        var p = parts[i].trim();
        if (p) keep.push(p);
      }
      s = keep.join(', ');
    }

    if (s.length > 28) {
      var at = s.lastIndexOf(', ', 26);
      s = (at > 6 ? s.slice(0, at) : s.slice(0, 26)).replace(/[,，、;；\s]+$/, '') + '…';
    }
    return s;
  }

  /* ---------- 选项：同一个词、同一天，选项和顺序是固定的 ----------
     用 word + 日期 + 模式做种子，重绘（答完题、误触刷新）不会把选项打乱。 */

  function hash32(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seeded(seed) {
    var s = seed >>> 0;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function quizFor(word) {
    var pool = A.coreWords();
    var rnd = seeded(hash32(word.w + '|' + A.todayKey() + '|' + MODE));
    var isEn = MODE !== 'new'; // 复习 / 错词本：选项是英文单词
    var correct = isEn ? word.w : shortZh(word.zh);
    var promptGloss = shortZh(word.zh);
    var picked = [];
    var used = {};
    used[correct] = 1;

    var guard = 0;
    while (picked.length < 3 && guard < 400) {
      guard++;
      var cand = pool[Math.floor(rnd() * pool.length)];
      if (!cand || cand.w === word.w) continue;
      var candGloss = shortZh(cand.zh);
      var text = isEn ? cand.w : candGloss;
      if (!text || used[text]) continue;
      // 看中文选单词时，释义一样的词不能当干扰项（finally / eventually 这种）
      if (isEn && candGloss === promptGloss) continue;
      used[text] = 1;
      picked.push(text);
    }
    // 兜底：随机挑不满时，按词表顺序补（正常不会走到这里）
    for (var i = 0; i < pool.length && picked.length < 3; i++) {
      var pg = shortZh(pool[i].zh);
      var text2 = isEn ? pool[i].w : pg;
      if (pool[i].w === word.w || !text2 || used[text2]) continue;
      if (isEn && pg === promptGloss) continue;
      used[text2] = 1;
      picked.push(text2);
    }

    var options = [{ text: correct, ok: true }].concat(
      picked.map(function (x) {
        return { text: x, ok: false };
      })
    );
    // 正确项不总在第一个
    for (var j = options.length - 1; j > 0; j--) {
      var k = Math.floor(rnd() * (j + 1));
      var tmp = options[j];
      options[j] = options[k];
      options[k] = tmp;
    }
    return { options: options, correct: correct };
  }

  /* ---------- 作答：写 SRS、记今日完成、错词本轮再来一遍 ---------- */

  function recordAnswer(word, ok) {
    var key = A.todayKey();
    S.patch(function (state) {
      var entry = S.entry(state, word.w, key);
      state.srs[word.w] = SRS.grade(entry, ok ? 'known' : 'missed', key);

      if (MODE !== 'book' && !counted[word.w]) {
        counted[word.w] = 1;
        var day = S.day(state, key);
        if (MODE === 'new') day.newDone += 1;
        else day.reviewDone += 1;
      }
      A.applyGoals(state, key);
    });

    session.attempts++;
    if (!roundWords[word.w]) {
      roundWords[word.w] = 1;
      session.touched++;
      if (MODE === 'new') session.newDone++;
      else if (MODE === 'review') session.reviewDone++;
      else session.bookDone++;
    }
    if (ok) session.correct++;

    if (!ok && !requeued[word.w]) {
      requeued[word.w] = 1;
      queue.push(word); // 本轮末尾再来一遍
    }
  }

  function choose(i) {
    if (answered || index >= queue.length) return;
    var word = queue[index];
    var quiz = quizFor(word);
    var opt = quiz.options[i];
    if (!opt) return;
    answered = { pick: i, ok: Boolean(opt.ok) };
    recordAnswer(word, Boolean(opt.ok));
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    render();
  }

  function advance() {
    if (!answered) return;
    answered = null;
    index++;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
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
    var mins = Math.max(1, Math.round(ms / 60000));
    var acc = session.attempts ? Math.round((session.correct / session.attempts) * 100) : 0;
    var lines = [];
    if (MODE === 'new') lines.push('新词 ' + session.newDone + ' 个');
    if (MODE === 'review') lines.push('复习 ' + session.reviewDone + ' 个');
    if (MODE === 'book') lines.push('错词本练了 ' + session.bookDone + ' 个');
    lines.push('用时 ' + mins + ' 分钟');

    main.innerHTML =
      '<h1>这一轮结束了</h1>' +
      '<div class="card">' +
        '<div class="stats stats--finish">' +
          '<div class="stat"><b class="num">' + session.touched + '</b><span>过了一遍的词</span></div>' +
          '<div class="stat"><b class="num">' + acc + '%</b><span>答对率</span></div>' +
          '<div class="stat"><b class="num">' + mins + '</b><span>分钟</span></div>' +
          '<div class="stat"><b class="num">' + book + '</b><span>错词本</span></div>' +
        '</div>' +
        '<p class="muted">' + lines.join(' · ') + '</p>' +
        '<p class="faint">这一轮答对 ' + session.correct + ' / ' + session.attempts +
          '（含答错后重做的）。答错的词已经在本轮末尾又过了一遍，也进了错词本。</p>' +
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
    var quiz = quizFor(word);
    var zhPrompt = MODE !== 'new';

    var head =
      '<div class="probe-meta" data-study-index="' + index + '">' +
        '<span>第 <b class="num">' + (index + 1) + '</b> / ' + queue.length +
          ' <span class="faint">· ' + TITLES[MODE] + '</span></span>' +
        '<span class="faint">' + (entry && entry.seen ? '见过 ' + entry.seen + ' 次' : '第一次见') + '</span>' +
      '</div>' +
      '<div class="bar"><i style="width:' + Math.round((index / queue.length) * 100) + '%"></i></div>';

    var prompt = zhPrompt
      ? '<div class="study-word study-word--zh" data-study-word="' + A.esc(word.w) + '">' +
          A.esc(shortZh(word.zh)) + '</div>'
      : '<div class="study-word" data-study-word="' + A.esc(word.w) + '">' + A.esc(word.w) + '</div>' +
        '<div class="probe-phon">' + (word.ph ? '/' + A.esc(word.ph) + '/' : '') + '</div>';

    var options = quiz.options.map(function (o, i) {
      var cls = 'choice' + (zhPrompt ? ' choice--en' : '');
      if (answered && o.ok) cls += ' is-right';
      if (answered && !o.ok && i === answered.pick) cls += ' is-wrong';
      return (
        '<button class="' + cls + '" type="button" data-opt="' + i + '"' + (o.ok ? ' data-ok="1"' : '') +
        (answered ? ' disabled' : '') + '>' +
          '<span class="choice-key">' + LETTERS[i] + '</span>' +
          '<span class="choice-text">' + A.esc(o.text) + '</span>' +
          (answered && o.ok ? '<span class="choice-flag">✓</span>' : '') +
          (answered && !o.ok && i === answered.pick ? '<span class="choice-flag">✗</span>' : '') +
        '</button>'
      );
    }).join('');

    var feedback = '';
    if (answered) {
      if (answered.ok) feedback = '<b>✓ 答对了</b>';
      else {
        feedback =
          '<b>✗ 正确答案：</b>' + A.esc(quiz.correct) +
          (zhPrompt && word.ph ? ' <span class="faint">/' + A.esc(word.ph) + '/</span>' : '');
      }
    }

    return (
      head +
      '<div class="card" data-study-card>' +
        '<div class="study-kicker">' + KICKERS[MODE] + '</div>' +
        prompt +
        '<div class="choices">' + options + '</div>' +
        '<div class="study-feedback' + (answered ? (answered.ok ? ' is-ok' : ' is-no') : '') +
          '" aria-live="polite">' + feedback + '</div>' +
        (answered
          ? '<button class="btn btn--primary btn--huge btn--block" type="button" data-next>' +
            (index + 1 >= queue.length ? '看结果' : '下一个') + '</button>'
          : '') +
        '<div class="btn-row" style="margin-top:18px">' +
          '<a class="btn btn--sm btn--ghost" href="index.html">退出（做过的已经存好）</a>' +
        '</div>' +
        '<p class="faint">键盘：<b>1–4</b> 选答案' + (answered ? ' · <b>空格</b> 下一个' : '') + '</p>' +
      '</div>'
    );
  }

  function render() {
    if (!table()) {
      main.innerHTML = '<div class="card"><h2>词表没加载出来</h2><p class="muted">缺少 data/words-core.js。</p></div>';
      return;
    }
    if (index >= queue.length) return finish();
    main.innerHTML = cardHtml(queue[index]);
  }

  function emptyState() {
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
    var t = ev.target.closest ? ev.target.closest('[data-opt],[data-next],[data-again]') : null;
    if (!t) return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (t.hasAttribute('data-opt')) choose(Number(t.getAttribute('data-opt')));
    else if (t.hasAttribute('data-next')) advance();
    else if (t.hasAttribute('data-again')) {
      queue = buildQueue();
      index = 0;
      answered = null;
      requeued = {};
      counted = {};
      roundWords = {};
      session = { newDone: 0, reviewDone: 0, bookDone: 0, touched: 0, attempts: 0, correct: 0 };
      startedAt = Date.now();
      if (!queue.length) emptyState();
      else render();
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var k = ev.key;
    if (answered) {
      if (k === ' ' || k === 'Spacebar' || k === 'Enter') {
        ev.preventDefault();
        advance();
      }
      return;
    }
    if (k >= '1' && k <= '4') {
      ev.preventDefault();
      choose(Number(k) - 1);
    }
  });

  queue = buildQueue();
  if (!queue.length) emptyState();
  else render();
})();
