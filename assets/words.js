/* 过线 · 词表

   主干词 / 叶子词两层，各自可以按「全部 / 不认识 / 认识 / 未扫」筛。
   这个页面对应规划书第四节第 2 条：分层，是为了让你知道先背哪个、放过哪个。
   列表一次只画 200 行，手机上滑起来不卡。 */

(function () {
  var A = window.CET4_APP;
  var main = document.getElementById('main');
  var PAGE = 200;

  if (!main) return;

  var TABLES = [
    { id: 'core', label: '主干词', data: window.CET4_WORDS_CORE },
    { id: 'leaf', label: '叶子词', data: window.CET4_WORDS_LEAF },
  ].filter(function (t) {
    return t.data && t.data.words && t.data.words.length;
  });

  if (!TABLES.length) {
    main.innerHTML =
      '<div class="card"><h2>词表没加载出来</h2>' +
      '<p class="muted">页面里的 <code>data/words-core.js</code> 没读到。' +
      '如果这是刚克隆下来的仓库，先跑一次 <code>node scripts/fetch-words.mjs</code> 生成词表。</p></div>';
    return;
  }

  var params = new URLSearchParams(location.search);
  var view = {
    layer: params.get('layer') || 'core',
    filter: 'all',
    q: '',
    shown: PAGE,
  };
  if (!TABLES.some(function (t) { return t.id === view.layer; })) view.layer = TABLES[0].id;
  if (params.get('mark') === '0') view.filter = 'unknown';
  if (params.get('mark') === '1') view.filter = 'known';
  if (params.get('filter')) view.filter = params.get('filter');

  var FILTERS = [
    { id: 'all', label: '全部' },
    { id: 'unknown', label: '不认识' },
    { id: 'known', label: '认识' },
    { id: 'unscanned', label: '未扫' },
  ];

  function table() {
    for (var i = 0; i < TABLES.length; i++) if (TABLES[i].id === view.layer) return TABLES[i];
    return TABLES[0];
  }

  // 每次渲染读一次本机进度：只有主干词扫过，叶子词一律按「未扫」算
  var current = {};

  function loadAnswers() {
    current = view.layer === 'core' ? window.CET4_STORE.layer(window.CET4_STORE.read(), 'core').answers : {};
  }

  function markOf(word) {
    var v = current[word.w];
    return v === 1 ? 'known' : v === 0 ? 'unknown' : 'unscanned';
  }

  function filtered() {
    var base = table().data.words;
    var q = view.q.trim().toLowerCase();
    var out = [];
    for (var i = 0; i < base.length; i++) {
      var w = base[i];
      if (q && w.w.toLowerCase().indexOf(q) < 0 && String(w.zh).toLowerCase().indexOf(q) < 0) continue;
      if (view.filter !== 'all') {
        var m = markOf(w);
        if (m !== view.filter) continue;
      }
      out.push(w);
    }
    return out;
  }

  function counts() {
    var base = table().data.words;
    var c = { all: base.length, unknown: 0, known: 0, unscanned: 0 };
    if (view.layer !== 'core') {
      c.unscanned = base.length;
      return c;
    }
    for (var i = 0; i < base.length; i++) {
      var v = current[base[i].w];
      if (v === 1) c.known++;
      else if (v === 0) c.unknown++;
      else c.unscanned++;
    }
    return c;
  }

  function render() {
    var t = table();
    loadAnswers();
    var c = counts();
    var rows = filtered();
    var shown = rows.slice(0, view.shown);

    var head = t.data.meta || {};
    var layerChips = TABLES.map(function (x) {
      return '<button class="chip" type="button" data-layer="' + x.id + '" aria-pressed="' +
        (x.id === view.layer) + '">' + A.esc(x.label) + ' · ' + x.data.words.length + '</button>';
    }).join('');

    var filterChips = FILTERS.map(function (f) {
      return '<button class="chip" type="button" data-filter="' + f.id + '" aria-pressed="' +
        (f.id === view.filter) + '">' + f.label + ' · ' + c[f.id] + '</button>';
    }).join('');

    var list = shown.map(function (w) {
      var m = view.layer === 'core' ? markOf(w) : 'unscanned';
      var label = m === 'known' ? '认识' : m === 'unknown' ? '不认识' : '未扫';
      return '<li class="row" data-word="' + A.esc(w.w) + '">' +
        '<button class="row-word row-say" type="button" data-say="' + A.esc(w.w) + '"' +
          ' aria-label="朗读 ' + A.esc(w.w) + '">' + A.esc(w.w) +
          '<span class="say-mark" aria-hidden="true">▶</span></button>' +
        '<span class="row-body">' +
          (w.ph ? '<span class="row-phon">/' + A.esc(w.ph) + '/</span> ' : '') +
          '<span class="row-zh">' + A.esc(w.zh) + '</span>' +
        '</span>' +
        '<span class="row-mark" data-m="' + (m === 'known' ? 1 : m === 'unknown' ? 0 : '') + '">' + label + '</span>' +
        '</li>';
    }).join('');

    main.innerHTML =
      '<h1>词表</h1>' +
      '<p class="lede">' + A.esc(head.note || '') + '</p>' +
      '<div class="chips">' + layerChips + '</div>' +
      '<div class="toolbar">' +
        '<input class="search" type="search" placeholder="搜单词或释义" value="' + A.esc(view.q) + '" data-q>' +
      '</div>' +
      '<div class="chips">' + filterChips + '</div>' +
      '<p class="faint" data-count>筛出 <b class="num">' + rows.length + '</b> 个，已显示 ' + shown.length + ' 个</p>' +
      '<ul class="rows" data-rows="' + rows.length + '" data-visible="' + shown.length + '">' + list + '</ul>' +
      (rows.length > shown.length
        ? '<div class="btn-row"><button class="btn" type="button" data-more>再看 ' + PAGE + ' 个</button></div>'
        : '') +
      (head.source ? '<p class="faint" style="margin-top:18px">' + A.esc(head.source) + '</p>' : '');
  }

  main.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-layer],[data-filter],[data-more],[data-say]') : null;
    if (!t) return;
    if (t.hasAttribute('data-say')) {
      A.say(t.getAttribute('data-say'));
      return;
    }
    if (t.hasAttribute('data-layer')) {
      view.layer = t.getAttribute('data-layer');
      view.shown = PAGE;
    } else if (t.hasAttribute('data-filter')) {
      view.filter = t.getAttribute('data-filter');
      view.shown = PAGE;
    } else if (t.hasAttribute('data-more')) {
      view.shown += PAGE;
      render();
      return;
    }
    render();
  });

  main.addEventListener('input', function (ev) {
    if (!ev.target.hasAttribute || !ev.target.hasAttribute('data-q')) return;
    view.q = ev.target.value;
    view.shown = PAGE;
    var pos = ev.target.selectionStart;
    render();
    var input = main.querySelector('[data-q]');
    if (input) {
      input.focus();
      try {
        input.setSelectionRange(pos, pos);
      } catch (e) {
        /* 类型不支持就算了 */
      }
    }
  });

  window.CET4_APP.onImport = render;
  render();
})();
