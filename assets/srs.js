/* 过线 · 间隔重复的纯逻辑（不碰 DOM，所以能单独测）

   规划书阶段 2 要的四件事里，三件落在这个文件上：间隔重复、错词本、四档降级。
   它只做计算，不读也不写 localStorage —— 谁调用谁负责存。

   ---- 调度规则（刻意做得能一眼看懂，不搞 SM-2 那种玄学）----

   每个词有一个「盒号」box，盒号决定下次什么时候再见：

     box 1 → 1 天后     box 3 → 7 天后     box 5 → 35 天后（基本出师）
     box 2 → 3 天后     box 4 → 16 天后

   复习时三档自评的后果：

     记得   → 盒号 +1（最高 5），下次按新盒号的间隔再来
     模糊   → 盒号 -1（最低 1），明天再见，并且进错词本
     忘了   → 盒号打回 1，明天再见，并且进错词本

   新词只要「记住了」就直接进 box 1（明天复习一次），
   「还不熟」和「忘了」一样处理：box 1 + 进错词本 + 本轮稍后再问一遍。

   错词本的出入规则：进 = 任何一次「模糊 / 忘了 / 还不熟」；
   出 = **连着两次「记得」**。所以错词本是自愈的，不需要手删。 */

(function () {
  var BOX_DAYS = [1, 3, 7, 16, 35];

  /* ---------- 日期：全站只用 YYYY-MM-DD 字符串，按本地时区算 ---------- */

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function dateKey(value) {
    var d = value ? new Date(value) : new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseKey(key) {
    var p = String(key || '').split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function addDays(key, n) {
    var d = parseKey(key);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }

  function diffDays(from, to) {
    return Math.round((parseKey(to) - parseKey(from)) / 86400000);
  }

  function intervalDays(box) {
    var b = Number(box) || 1;
    if (b < 1) b = 1;
    if (b > BOX_DAYS.length) b = BOX_DAYS.length;
    return BOX_DAYS[b - 1];
  }

  // 给页面上看的说法，不出现「到期日 2026-10-14」这种话
  function dueLabel(due, today) {
    var d = diffDays(today, due);
    if (d < 0) return '已经拖了 ' + -d + ' 天';
    if (d === 0) return '今天';
    if (d === 1) return '明天';
    if (d < 7) return d + ' 天后';
    if (d < 30) return Math.round(d / 7) + ' 周后';
    return Math.round(d / 30) + ' 个月后';
  }

  /* ---------- 每个词的记录 ---------- */

  function blankEntry(today) {
    return {
      box: 0,
      due: today,
      seen: 0,
      ok: 0,
      wrong: 0,
      streakOk: 0, // 连续答对次数：到 2 就出错词本
      inBook: false,
      first: today,
      last: today,
    };
  }

  function isNew(entry) {
    return !entry || !entry.seen;
  }

  /* 给一个词打分，返回新的记录（不改原来的）。
     grade: 'known' 记得 / 'fuzzy' 模糊 / 'missed' 忘了（新词的「记住了」也用 'known'） */
  function grade(entry, g, today) {
    var e = {};
    var k;
    for (k in entry || {}) e[k] = entry[k];
    var base = blankEntry(today);
    for (k in base) if (e[k] === undefined) e[k] = base[k];

    e.seen = (e.seen || 0) + 1;
    e.last = today;

    if (g === 'known') {
      e.ok = (e.ok || 0) + 1;
      e.streakOk = (e.streakOk || 0) + 1;
      e.box = Math.min(BOX_DAYS.length, (e.box || 0) + 1);
      e.due = addDays(today, intervalDays(e.box));
      // 连着两次记得就出错词本
      if (e.inBook && e.streakOk >= 2) e.inBook = false;
    } else if (g === 'fuzzy') {
      e.wrong = (e.wrong || 0) + 1;
      e.streakOk = 0;
      e.box = Math.max(1, (e.box || 1) - 1);
      e.due = addDays(today, 1);
      e.inBook = true;
    } else {
      // 'missed'（新词的「还不熟」也走这里）：打回 box 1，明天再见
      e.wrong = (e.wrong || 0) + 1;
      e.streakOk = 0;
      e.box = 1;
      e.due = addDays(today, 1);
      e.inBook = true;
    }
    return e;
  }

  /* ---------- 挑今天要做哪些词 ---------- */

  // 新词：摸底标「不认识」、而且还没学过的，按词频顺序（词表本身的顺序）取前 limit 个
  function pickNew(srs, words, answers, limit) {
    var out = [];
    for (var i = 0; i < words.length && out.length < limit; i++) {
      var w = words[i];
      if (answers[w.w] !== 0) continue;
      if (srs[w.w] && srs[w.w].seen) continue;
      out.push(w);
    }
    return out;
  }

  // 新词池还剩多少（用来告诉用户「背完这批就没了」）
  function countNewPool(srs, words, answers) {
    var n = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (answers[w.w] !== 0) continue;
      if (srs[w.w] && srs[w.w].seen) continue;
      n++;
    }
    return n;
  }

  function indexWords(words) {
    var map = {};
    for (var i = 0; i < words.length; i++) map[words[i].w] = words[i];
    return map;
  }

  function dueList(srs, words, today) {
    var index = indexWords(words);
    var out = [];
    for (var k in srs) {
      var e = srs[k];
      if (!e || !e.seen) continue;
      if (e.due > today) continue;
      if (!index[k]) continue;
      out.push({ word: index[k], entry: e });
    }
    // 最不熟的先来：盒号小的、然后拖得最久的
    out.sort(function (a, b) {
      if (a.entry.box !== b.entry.box) return a.entry.box - b.entry.box;
      if (a.entry.due !== b.entry.due) return a.entry.due < b.entry.due ? -1 : 1;
      return a.word.w < b.word.w ? -1 : 1;
    });
    return out;
  }

  function pickReview(srs, words, today, limit) {
    return dueList(srs, words, today)
      .slice(0, limit)
      .map(function (x) {
        return x.word;
      });
  }

  function countDue(srs, words, today) {
    return dueList(srs, words, today).length;
  }

  // 错词本：错得多的排前面
  function bookList(srs, words) {
    var index = indexWords(words);
    var out = [];
    for (var k in srs) {
      var e = srs[k];
      if (!e || !e.inBook || !index[k]) continue;
      out.push({ word: index[k], entry: e });
    }
    out.sort(function (a, b) {
      if (b.entry.wrong !== a.entry.wrong) return b.entry.wrong - a.entry.wrong;
      if (a.entry.box !== b.entry.box) return a.entry.box - b.entry.box;
      return a.word.w < b.word.w ? -1 : 1;
    });
    return out;
  }

  function pickBook(srs, words, limit) {
    return bookList(srs, words)
      .slice(0, limit)
      .map(function (x) {
        return x.word;
      });
  }

  /* ---------- 连续天数 / 完成率 ---------- */

  function stats(days, today) {
    var done = [];
    for (var k in days) if (days[k] && days[k].done) done.push(k);
    done.sort();

    var longest = 0;
    var run = 0;
    var prev = null;
    done.forEach(function (key) {
      run = prev && diffDays(prev, key) === 1 ? run + 1 : 1;
      if (run > longest) longest = run;
      prev = key;
    });

    // 今天还没做完不算断：从昨天往回数
    var current = 0;
    var cursor = days[today] && days[today].done ? today : addDays(today, -1);
    while (days[cursor] && days[cursor].done) {
      current++;
      cursor = addDays(cursor, -1);
    }

    return { current: current, longest: longest, doneDays: done.length };
  }

  // 从开始那天到今天一共几天（含今天），用来算完成率
  function elapsedDays(startKey, today) {
    if (!startKey) return 1;
    return Math.max(1, diffDays(startKey, today) + 1);
  }

  function dayDone(state) {
    if (!state) return false;
    return (
      (state.newDone || 0) >= (state.newGoal || 0) &&
      (state.reviewDone || 0) >= (state.reviewGoal || 0) &&
      (state.listenDone || 0) >= (state.listenGoal || 0) &&
      (state.readDone || 0) >= (state.readGoal || 0)
    );
  }

  window.CET4_SRS = {
    BOX_DAYS: BOX_DAYS,
    dateKey: dateKey,
    addDays: addDays,
    diffDays: diffDays,
    intervalDays: intervalDays,
    dueLabel: dueLabel,
    blankEntry: blankEntry,
    isNew: isNew,
    grade: grade,
    pickNew: pickNew,
    countNewPool: countNewPool,
    pickReview: pickReview,
    countDue: countDue,
    bookList: bookList,
    pickBook: pickBook,
    stats: stats,
    elapsedDays: elapsedDays,
    dayDone: dayDone,
  };
})();
