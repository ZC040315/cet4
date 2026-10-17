/* 过线 · 考试日期与「每天背多少」的算法（零依赖）

   这一条直接对应规划书第十一节：
     摸底 → 知道自己有多少词真的不认识 → 拿这个数字 + 剩余天数 + 每天时长，算出每天该背多少。

   三个约定，写死在代码里，页面上也会原样显示，方便你自己核对：
     1. 考试日期 2026-12-12 上午 9:00（已核实，见规划书标题下方）；
        下一届复用不必改代码：网址后面加 ?exam=2027-06-12（或完整 ISO）就能覆盖，
        页面上的日期文案也从它推出来，不会和常量各写一份、改了一处漏一处；
     2. 摸底本身要占天数：一天最多扫 500 个（规划书第十一节）；
     3. 考前留 14 天给真题音频和写作翻译（规划书第三节：写作翻译考前两周再管），
        也就是背词要在考前 14 天收尾。 */

(function () {
  var DEFAULT_EXAM_ISO = '2026-12-12T09:00:00+08:00';
  var SCAN_PER_DAY = 500;
  var RESERVE_DAYS = 14;
  var MIN_STUDY_DAYS = 7;

  /* ?exam=2027-06-12 或 ?exam=2027-06-12T09:00:00+08:00 都能覆盖考试日期。
     参数不合法就退回默认那一场 —— 宁可显示默认值，也不要因为网址手抖把整页算崩。 */
  function resolveExamIso() {
    var raw = '';
    try {
      raw = new URLSearchParams(window.location.search).get('exam') || '';
    } catch (e) {
      raw = '';
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw + 'T09:00:00+08:00';
    if (raw && !isNaN(new Date(raw).getTime())) return raw;
    return DEFAULT_EXAM_ISO;
  }

  var EXAM_ISO = resolveExamIso();

  /* 规划书第十一节的四档。这里的数字是从规划书那句校准话推出来的：
     「单词 25 分钟对应大约 20 个新词 + 50–60 个复习词」——
     所以标准档 = 每天 20 个新词 + 55 个复习，保底和充足按 20/25/30 分钟的单词时长等比缩。 */
  var MODES = [
    {
      id: 'min',
      label: '只有 10 分钟',
      newWords: 10,
      reviewCap: 15,
      listen: 0,
      realAudio: 0,
      read: 0,
      readMinutes: 0,
      minutes: '10 分钟',
      note: '今天只做最要紧的 10 个新词 + 15 个到期的复习词。它是台阶，不是妥协 —— 复习断了间隔重复就废了，所以这一档可以少，但不能没有复习。',
    },
    {
      id: 'floor',
      label: '保底',
      newWords: 15,
      reviewCap: 40,
      listen: 0,
      realAudio: 0,
      read: 1,
      readMinutes: 10,
      minutes: '30 分钟',
      note: '单词 20 分钟（15 新词 + 40 复习）+ 短读 10 分钟。',
    },
    {
      id: 'std',
      label: '标准',
      newWords: 20,
      reviewCap: 55,
      listen: 1,
      realAudio: 15,
      read: 1,
      readMinutes: 15,
      minutes: '80 分钟',
      note: '单词 25 分钟（20 新词 + 55 复习）+ 精听 25 + 短读 15 + 真题音频 15。',
    },
    {
      id: 'full',
      label: '充足',
      newWords: 25,
      reviewCap: 70,
      listen: 1,
      realAudio: 20,
      read: 1,
      readMinutes: 20,
      minutes: '100 分钟',
      note: '上限档，做不到也不叫失败。',
    },
  ];

  function modeById(id) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i].id === id) return MODES[i];
    return null;
  }

  function examTime() {
    return new Date(EXAM_ISO).getTime();
  }

  /* 考完没有。所有「每天该背多少」的算法都要先问这一句：
     考完之后再拿剩余天数去摊，会算出「每天背 500 个新词」这种没人做得到的结论。 */
  function isOver(now) {
    return examTime() - (now ? now.getTime() : Date.now()) <= 0;
  }

  function daysLeft(now) {
    var diff = examTime() - (now ? now.getTime() : Date.now());
    return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
  }

  /* 日期文案从 EXAM_ISO 推出来，不再手写第二遍。
     星期用 UTC 构造日期来算，避免受本机时区影响；时间按 ISO 里写的那个时区显示。 */
  function examDateShort() {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(EXAM_ISO);
    if (!m) return EXAM_ISO;
    return m[1] + ' 年 ' + Number(m[2]) + ' 月 ' + Number(m[3]) + ' 日';
  }

  function examLabel() {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(EXAM_ISO);
    if (!m) return EXAM_ISO;
    var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var dow = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay();
    var hour = Number(m[4]);
    var h12 = hour % 12 === 0 ? 12 : hour % 12;
    return examDateShort() + '（' + week[dow] + '）' + (hour < 12 ? '上午 ' : '下午 ') + h12 + ':' + m[5];
  }

  /* planFor({ unknown, remainingScan, now })
     unknown       摸底标了「不认识」的词数
     remainingScan 摸底还没扫完的词数（0 = 摸底已结束）
     返回一份可以整段渲染给用户看的结论 */
  function planFor(input) {
    var unknown = Math.max(0, Math.round(input.unknown || 0));
    var remainingScan = Math.max(0, Math.round(input.remainingScan || 0));
    var left = daysLeft(input.now);

    /* 考完了就不再排每日额度。这里返回一个结构完整、但 recommended = 0 的结果，
       让渲染方（app.js 的 planHtml）只需判断 plan.over，不必各自重算一遍。 */
    if (isOver(input.now)) {
      return {
        over: true,
        unknown: unknown,
        daysLeft: 0,
        probeDaysLeft: Math.ceil(remainingScan / SCAN_PER_DAY),
        remainingScan: remainingScan,
        studyDays: 0,
        shortened: false,
        raw: 0,
        recommended: 0,
        exceedsMax: false,
        modes: MODES.map(function (m) {
          return {
            id: m.id,
            label: m.label,
            newWords: m.newWords,
            minutes: m.minutes,
            note: m.note,
            days: 0,
            fits: false,
            here: false,
          };
        }),
      };
    }

    var probeDaysLeft = Math.ceil(remainingScan / SCAN_PER_DAY);
    var studyDays = left - probeDaysLeft - RESERVE_DAYS;
    var shortened = false;
    if (studyDays < MIN_STUDY_DAYS) {
      // 时间不够时不再留那 14 天，否则会算出「今天就要背 60 个」这种没人做得到的数字
      studyDays = Math.max(1, left - probeDaysLeft);
      shortened = true;
    }

    var raw = studyDays > 0 ? unknown / studyDays : unknown;
    // 取整到 5 的倍数：人记「每天 10 个」，记不住「每天 9.3 个」
    var recommended = unknown === 0 ? 0 : Math.max(5, Math.ceil(raw / 5) * 5);

    var modes = MODES.map(function (m) {
      var days = unknown === 0 ? 0 : Math.ceil(unknown / m.newWords);
      return {
        id: m.id,
        label: m.label,
        newWords: m.newWords,
        minutes: m.minutes,
        note: m.note,
        days: days,
        fits: days <= studyDays,
        here: false,
      };
    });

    // recommended 落在哪一档：取第一档「每天新词 >= recommended」的
    var picked = null;
    for (var i = 0; i < modes.length; i++) {
      if (modes[i].newWords >= recommended) { picked = modes[i]; break; }
    }
    if (picked) picked.here = true;

    return {
      over: false,
      unknown: unknown,
      daysLeft: left,
      probeDaysLeft: probeDaysLeft,
      remainingScan: remainingScan,
      studyDays: studyDays,
      shortened: shortened,
      raw: raw,
      recommended: recommended,
      exceedsMax: recommended > MODES[MODES.length - 1].newWords,
      modes: modes,
    };
  }

  window.CET4_PLAN = {
    EXAM_ISO: EXAM_ISO,
    EXAM_LABEL: examLabel(),
    EXAM_DATE_SHORT: examDateShort(),
    SCAN_PER_DAY: SCAN_PER_DAY,
    RESERVE_DAYS: RESERVE_DAYS,
    MODES: MODES,
    modeById: modeById,
    examTime: examTime,
    isOver: isOver,
    daysLeft: daysLeft,
    planFor: planFor,
  };
})();
