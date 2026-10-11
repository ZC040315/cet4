/* 过线 · 考试日期与「每天背多少」的算法（零依赖）

   这一条直接对应规划书第十一节：
     摸底 → 知道自己有多少词真的不认识 → 拿这个数字 + 剩余天数 + 每天时长，算出每天该背多少。

   三个约定，写死在代码里，页面上也会原样显示，方便你自己核对：
     1. 考试日期 2026-12-12 上午 9:00（已核实，见规划书标题下方）；
     2. 摸底本身要占天数：一天最多扫 500 个（规划书第十一节）；
     3. 考前留 14 天给真题音频和写作翻译（规划书第三节：写作翻译考前两周再管），
        也就是背词要在考前 14 天收尾。 */

(function () {
  var EXAM_ISO = '2026-12-12T09:00:00+08:00';
  var SCAN_PER_DAY = 500;
  var RESERVE_DAYS = 14;
  var MIN_STUDY_DAYS = 7;

  /* 规划书第十一节的四档。这里的数字是从规划书那句校准话推出来的：
     「单词 25 分钟对应大约 20 个新词 + 50–60 个复习词」——
     所以标准档 = 每天 20 个新词 + 55 个复习，保底和充足按 20/25/30 分钟的单词时长等比缩。 */
  var MODES = [
    {
      id: 'min',
      label: '只有 10 分钟',
      newWords: 10,
      reviewCap: 0,
      minutes: '10 分钟',
      note: '今天只做最重要的 10 个词。状态最差的那天也能完成，它的意义是不让你断档。',
    },
    {
      id: 'floor',
      label: '保底',
      newWords: 15,
      reviewCap: 40,
      minutes: '30 分钟',
      note: '单词 20 分钟（15 新词 + 40 复习）+ 短读 10 分钟。',
    },
    {
      id: 'std',
      label: '标准',
      newWords: 20,
      reviewCap: 55,
      minutes: '80 分钟',
      note: '单词 25 分钟（20 新词 + 55 复习）+ 精听 25 + 短读 15 + 真题音频 15。',
    },
    {
      id: 'full',
      label: '充足',
      newWords: 25,
      reviewCap: 70,
      minutes: '100 分钟',
      note: '上限档，做不到也不叫失败。',
    },
  ];

  function modeById(id) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i].id === id) return MODES[i];
    return null;
  }

  function daysLeft(now) {
    var exam = new Date(EXAM_ISO).getTime();
    var t = (now ? now.getTime() : Date.now());
    var diff = exam - t;
    return diff <= 0 ? 0 : Math.ceil(diff / 86400000);
  }

  function dayLabel(n) {
    return '2026 年 12 月 12 日（周六）上午 9:00';
  }

  /* planFor({ unknown, remainingScan, now })
     unknown       摸底标了「不认识」的词数
     remainingScan 摸底还没扫完的词数（0 = 摸底已结束）
     返回一份可以整段渲染给用户看的结论 */
  function planFor(input) {
    var unknown = Math.max(0, Math.round(input.unknown || 0));
    var remainingScan = Math.max(0, Math.round(input.remainingScan || 0));
    var left = daysLeft(input.now);

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
    EXAM_LABEL: dayLabel(),
    SCAN_PER_DAY: SCAN_PER_DAY,
    RESERVE_DAYS: RESERVE_DAYS,
    MODES: MODES,
    modeById: modeById,
    daysLeft: daysLeft,
    planFor: planFor,
  };
})();
