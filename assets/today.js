/* 过线 · 今日页（原首页）

   规划书第四节的「今日」：一屏之内看清今天要做什么，没有别的干扰。
   三个阶段：还没摸底 → 去摸底；摸底做完 → 今天的两个任务（新词 / 复习）；
   两个任务都完了 → 今天收工。

   「只有 10 分钟」是一个正式功能，不是妥协 —— 它存在的意义是：
   状态差的那天你有一级台阶可以退，而不是直接断掉。 */

(function () {
  var A = window.CET4_APP;
  var S = window.CET4_STORE;
  var P = window.CET4_PLAN;
  var SRS = window.CET4_SRS;
  var main = document.getElementById('main');
  if (!main) return;

  // 粗估用时：新词一个约 30 秒，复习一个约 16 秒（按规划书那句校准话反推）
  var SEC_NEW = 30;
  var SEC_REVIEW = 16;

  function minutes(seconds) {
    return Math.max(1, Math.round(seconds / 60));
  }

  function dateLabel(key) {
    var p = String(key).split('-');
    return Number(p[1]) + ' 月 ' + Number(p[2]) + ' 日';
  }

  function taskRow(id, title, sub, doneText, done, href, skip, actionHtml) {
    var action;
    if (done) action = '<span class="done-mark">✓ ' + doneText + '</span>';
    else if (actionHtml) action = actionHtml;
    else if (skip) action = '<span class="muted">今天不用做</span>';
    else action = '<a class="btn btn--primary btn--huge" href="' + href + '">开始</a>';
    return (
      '<div class="task" data-task="' + id + '" data-done="' + (done ? 1 : 0) + '">' +
      '<div class="task-head"><b>' + title + '</b>' + action + '</div>' +
      '<p class="faint">' + sub + '</p>' +
      '</div>'
    );
  }

  function render() {
    var table = A.coreTable();
    if (!table) {
      main.innerHTML =
        '<div class="card"><h2>词表没加载出来</h2>' +
        '<p class="muted">页面里的 <code>data/words-core.js</code> 没读到。' +
        '如果这是刚克隆下来的仓库，先跑一次 <code>node scripts/fetch-words.mjs</code> 生成词表。</p></div>';
      return;
    }

    var left = P.daysLeft();
    var probe = A.summary();

    if (!probe.done) {
      var pct = probe.total ? Math.round((probe.scanned / probe.total) * 100) : 0;
      var startLabel = probe.scanned > 0 ? '继续摸底' : '开始摸底';
      main.innerHTML =
        '<h1>距 2026 年 12 月 12 日还有 <span class="num">' + left + '</span> 天</h1>' +
        '<p class="lede">前三天不背单词，先摸底：只判断「认识 / 不认识」。扫完才知道每天该背多少。</p>' +
        '<div class="card">' +
          '<h2>摸底 · 主干词</h2>' +
          '<p class="muted">每个词两秒，一天扫 500 个，分 3 天扫完就行。</p>' +
          '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="probe-meta">' +
            '<span>已扫 <b class="num">' + probe.scanned + '</b> / ' + probe.total + '</span>' +
            '<span>还剩 <b class="num">' + probe.remaining + '</b> 个 · 约 ' + minutes(probe.remaining * 2) + ' 分钟</span>' +
          '</div>' +
          '<div class="btn-row">' +
            '<a class="btn btn--primary btn--huge" href="probe.html">' + startLabel + '</a>' +
            '<a class="btn" href="words.html">先看看词表</a>' +
          '</div>' +
        '</div>' +
        '<p class="faint">今天扫不完不要紧，进度会自动留着，明天打开接着扫。</p>';
      return;
    }

    // ---- 摸底做完了：今天的任务 ----
    var t = A.todayState();
    var day = t.day;
    var mode = t.mode;
    var key = t.key;
    var state = t.state;
    var srs = state.srs || {};
    var words = A.coreWords();
    var pool = SRS.countNewPool(srs, words, A.answers());
    var due = SRS.countDue(srs, words, key);
    var newDone = Math.min(day.newDone, day.newGoal);
    var reviewDone = Math.min(day.reviewDone, day.reviewGoal);
    var newOk = day.newGoal === 0 || day.newDone >= day.newGoal;
    var reviewOk = day.reviewGoal === 0 || day.reviewDone >= day.reviewGoal;
    var allDone = newOk && reviewOk;
    var stat = SRS.stats(state.days || {}, key);

    var head =
      '<h1>今天 · ' + dateLabel(key) + ' <span class="faint" style="font-size:16px">第 ' + A.dayNumber() + ' 天</span></h1>';

    var newSub;
    if (day.newGoal === 0) {
      newSub = '今天是「只有 10 分钟」档以外的选择？回去选一个档位。';
    } else if (pool === 0) {
      newSub = '不认识的主干词已经全部学完了 —— 单词这块可以收工，去练精听。';
    } else {
      newSub = '不认识的主干词还剩 ' + pool + ' 个 · 约 ' + minutes(day.newGoal * SEC_NEW) + ' 分钟';
    }
    var newSkip = day.newGoal === 0 || pool === 0;

    var reviewSub;
    if (day.reviewGoal === 0) {
      reviewSub = due === 0 ? '今天没有到期的复习词。' : '这一档不安排复习；到期的还有 ' + due + ' 个，明天会排上。';
    } else {
      reviewSub = '今天到期 ' + due + ' 个 · 约 ' + minutes(day.reviewGoal * SEC_REVIEW) + ' 分钟';
      if (due > day.reviewGoal) {
        reviewSub += '（还有 ' + (due - day.reviewGoal) + ' 个排在后面，不用赶）';
      }
    }
    var reviewSkip = day.reviewGoal === 0;

    // 精听：标准档及以上才有（规划书第十一节）
    var listenDue = A.listenDue(state, key).length;
    var listenSub;
    if (day.listenGoal === 0) listenSub = '';
    else if (listenDue) listenSub = '今天该重听 ' + listenDue + ' 篇（不写，只听，听懂八成就算过）· 约 3 分钟';
    else listenSub = '一段自产短文，五步约 25 分钟' + (mode.realAudio ? '' : '');
    var listenRow =
      day.listenGoal === 0
        ? ''
        : taskRow(
            'listen',
            '精听 ' + day.listenGoal + ' 篇',
            listenSub,
            '今天 ' + day.listenDone + ' 篇已完成',
            day.listenDone >= day.listenGoal,
            'listening.html'
          );

    // 真题音频：站点只做打卡，不托管任何音频（规划书第四节第 5 条 / 第五节）
    var realRow =
      mode.realAudio === 0
        ? ''
        : taskRow(
            'realaudio',
            '真题音频 ' + mode.realAudio + ' 分钟',
            '用官方出版物或学校发的真题音频，就着考场音响的感觉听，<b>不做逐句听写</b>。',
            '今天打过卡',
            Boolean(day.realAudio),
            '',
            false,
            '<button class="btn btn--sm" type="button" data-real-audio>打卡</button>'
          );

    // 短读：保底档及以上都有（规划书第十一节：阅读 10 / 15 / 20 分钟）
    var readRow =
      day.readGoal === 0
        ? ''
        : taskRow(
            'read',
            '短读 ' + day.readGoal + ' 篇',
            '一篇 100–150 词，读完对一句中文说明 · 约 ' + (mode.readMinutes || 10) + ' 分钟',
            '今天 ' + day.readDone + ' 篇已完成',
            day.readDone >= day.readGoal,
            'reading.html'
          );

    var tierChips = P.MODES.map(function (m) {
      return '<button class="chip" type="button" data-tier="' + m.id + '" aria-pressed="' +
        (m.id === mode.id) + '">' + m.label + ' · ' + m.newWords + ' 新词</button>';
    }).join('');

    var banner = allDone
      ? '<div class="card card--tight"><b>今天做完了 ✓</b> <span class="muted">新词 ' + day.newDone +
        ' 个、复习 ' + day.reviewDone + ' 个。</span>' +
        '<p class="faint" style="margin:8px 0 0">多了不用做，明天见。想加练就从下面的「错词本」进。</p></div>'
      : '';

    main.innerHTML =
      head +
      '<p class="lede">今天做这几件就够。</p>' +
      banner +
      '<div class="card">' +
        taskRow('new', '新词 ' + day.newGoal + ' 个', newSub,
          '今天 ' + day.newDone + ' 个已完成', day.newDone >= day.newGoal && day.newGoal > 0,
          'study.html?mode=new', newSkip) +
        taskRow('review', '复习 ' + day.reviewGoal + ' 个', reviewSub,
          '今天 ' + day.reviewDone + ' 个已完成', day.reviewGoal > 0 && day.reviewDone >= day.reviewGoal,
          'study.html?mode=review', reviewSkip) +
        listenRow +
        realRow +
        readRow +
      '</div>' +
      (mode.id === 'min' ? '' :
        '<button class="btn btn--block" type="button" data-min>只有 10 分钟？→ 今天只做最重要的 10 个词</button>' +
        '<p class="faint">这只是今天降一档，明天自动回到你选的那个档。</p>') +
      '<div class="chips" style="margin-top:14px">' + tierChips + '</div>' +
      '<p class="faint">' + mode.note + '</p>' +
      '<p class="faint">距考试还有 <b>' + left + '</b> 天 · 连续 <b>' + stat.current + '</b> 天（最长 ' +
        stat.longest + ' 天）· <a href="progress.html">看进度</a></p>';

    if (newDone > 0 || reviewDone > 0) {
      main.querySelectorAll('.task').forEach(function (el) {
        if (el.getAttribute('data-done') === '1') {
          var p = el.querySelector('.faint');
          if (p) p.insertAdjacentHTML('afterend', '<p class="faint">今天已经做过一轮，想再来一轮也可以。</p>');
        }
      });
    }
  }

  main.addEventListener('click', function (ev) {
    var tier = ev.target.closest ? ev.target.closest('[data-tier]') : null;
    if (tier) {
      A.setTier(tier.getAttribute('data-tier'));
      render();
      return;
    }
    var min = ev.target.closest ? ev.target.closest('[data-min]') : null;
    if (min) {
      A.setTierToday('min');
      render();
      window.scrollTo(0, 0);
      return;
    }
    var audio = ev.target.closest ? ev.target.closest('[data-real-audio]') : null;
    if (audio) {
      var key = A.todayKey();
      S.patch(function (state) {
        S.day(state, key).realAudio = true;
        A.applyGoals(state, key);
      });
      render();
    }
  });

  window.CET4_APP.onImport = render;
  render();
})();
