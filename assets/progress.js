/* 过线 · 进度页（规划书第四节第 5 条）

   刻意做得克制：不做排行榜、不做华丽图表、不写「你已超过 87% 的用户」。
   只显示：连续天数、最长记录、完成率、还有几天，以及错词本。

   一条特别规则：断档不清零 —— 只显示「最长记录」。
   用清零惩罚断档，只会让你不敢回来看这个页面。 */

(function () {
  var A = window.CET4_APP;
  var S = window.CET4_STORE;
  var SRS = window.CET4_SRS;
  var P = window.CET4_PLAN;
  var main = document.getElementById('main');
  if (!main) return;

  var BOOK_SHOWN = 60;
  var STRIP_DAYS = 14;

  function shortDate(key) {
    var p = String(key).split('-');
    return Number(p[1]) + '/' + Number(p[2]);
  }

  function render() {
    if (!A.coreTable()) {
      main.innerHTML = '<div class="card"><h2>词表没加载出来</h2><p class="muted">缺少 data/words-core.js。</p></div>';
      return;
    }
    var state = S.read();
    var key = A.todayKey();
    var words = A.coreWords();
    var srs = state.srs || {};
    var days = state.days || {};

    var stat = SRS.stats(days, key);
    var start = A.startKey();
    var elapsed = SRS.elapsedDays(start, key);
    var rate = Math.round((stat.doneDays / elapsed) * 100);
    var book = SRS.bookList(srs, words);
    var learned = 0;
    var dueToday = 0;
    for (var k in srs) {
      if (!srs[k] || !srs[k].seen) continue;
      learned++;
      if (srs[k].due <= key) dueToday++;
    }

    // 最近 14 天：完成的实心、做了一部分的对半、没动的空着
    var strip = [];
    for (var i = STRIP_DAYS - 1; i >= 0; i--) {
      var d = SRS.addDays(key, -i);
      var rec = days[d];
      var cls = 'day-cell';
      if (rec && rec.done) cls += ' is-done';
      else if (rec && (rec.newDone > 0 || rec.reviewDone > 0)) cls += ' is-part';
      strip.push('<span class="' + cls + '" title="' + d + '">' + shortDate(d).split('/')[1] + '</span>');
    }

    var bookRows = book.slice(0, BOOK_SHOWN).map(function (x) {
      return '<li class="row">' +
        '<span class="row-word">' + A.esc(x.word.w) + '</span>' +
        '<span class="row-body">' +
          (x.word.ph ? '<span class="row-phon">/' + A.esc(x.word.ph) + '/</span> ' : '') +
          '<span class="row-zh">' + A.esc(x.word.zh) + '</span>' +
        '</span>' +
        '<span class="row-mark" data-m="0">错 ' + x.entry.wrong + ' 次</span>' +
        '</li>';
    }).join('');

    main.innerHTML =
      '<h1>进度</h1>' +
      '<p class="lede">只记该记的，不给你压力。</p>' +
      '<div class="card">' +
        '<div class="stats">' +
          '<div class="stat"><b class="num">' + stat.current + '</b><span>连续天数</span></div>' +
          '<div class="stat"><b class="num">' + stat.longest + '</b><span>最长记录</span></div>' +
          '<div class="stat"><b class="num">' + rate + '%</b><span>完成率（' + stat.doneDays + '/' + elapsed + ' 天）</span></div>' +
          '<div class="stat"><b class="num">' + P.daysLeft() + '</b><span>距考试（天）</span></div>' +
        '</div>' +
        '<p class="faint">断档不清零：中断了就当重新开始，最长记录一直留在这儿。</p>' +
      '</div>' +
      '<div class="card">' +
        '<h2>最近 ' + STRIP_DAYS + ' 天</h2>' +
        '<div class="days-strip" data-strip>' + strip.join('') + '</div>' +
        '<p class="faint">实心 = 当天做完；半格 = 做了一部分；空格 = 没碰。从 ' + start + ' 开始算。</p>' +
      '</div>' +
      '<div class="card">' +
        '<h2>错词本 · ' + book.length + ' 个</h2>' +
        '<p class="faint">背错的词自动进来；连着两次「记得」就自动出去。不用手动删。</p>' +
        (book.length
          ? '<div class="btn-row" style="margin-top:0"><a class="btn btn--primary" href="study.html?mode=book">练一遍错词本</a></div>'
          : '') +
        (book.length ? '<ul class="rows" data-book="' + book.length + '" style="margin-top:14px">' + bookRows + '</ul>' : '') +
        (book.length > BOOK_SHOWN ? '<p class="faint">先列了错得最多的 ' + BOOK_SHOWN + ' 个，还有 ' + (book.length - BOOK_SHOWN) + ' 个。</p>' : '') +
      '</div>' +
      '<div class="card">' +
        '<h2>学过多少</h2>' +
        '<p class="muted">已经进过卡片的主干词 <b class="num">' + learned + '</b> 个；今天到期的复习词 <b class="num">' + dueToday + '</b> 个。</p>' +
        '<p class="faint">主干词一共 ' + words.length + ' 个，其中摸底标「不认识」的 ' + A.summary().unknown + ' 个。</p>' +
      '</div>';
  }

  window.CET4_APP.onImport = render;
  render();
})();
