/* 过线 · 说明页的两个破坏性动作：重新摸底、清空全部。
   （导出 / 导入在 app.js 里，全站共用。） */

(function () {
  var S = window.CET4_STORE;

  function wire(buttonSel, noteSel, confirmText, clear, doneText) {
    var btn = document.querySelector(buttonSel);
    if (!btn) return;
    var note = document.querySelector(noteSel);
    btn.addEventListener('click', function () {
      if (!window.confirm(confirmText)) return;
      S.patch(function (s) {
        clear(s);
      });
      if (note) note.textContent = doneText;
    });
  }

  wire(
    '[data-reset]',
    '[data-reset-note]',
    '清空摸底记录？已经扫过的判断会全部消失（背词记录会留着）。这个动作不能撤销。',
    function (s) {
      s.probe = {};
      s.plan = null;
    },
    '已清空。回摸底页就是从头开始，背词记录还在。'
  );

  wire(
    '[data-reset-all]',
    '[data-reset-all-note]',
    '清空全部进度？摸底、背词、错词本、连续天数全部归零，这个动作不能撤销。',
    function (s) {
      s.probe = {};
      s.plan = null;
      s.srs = {};
      s.days = {};
      if (s.settings) s.settings.tier = '';
    },
    '全部清空了。导出的备份文件还在你手上，想找回来就导入它。'
  );

  /* 页脚的考试日期跟着 plan.js 解析出来的结果走（支持 ?exam= 覆盖），
     免得日期在代码和文案里各写一份。about.html 里的静态文案是兜底：
     万一脚本没跑起来，也不会开天窗。 */
  (function () {
    var P = window.CET4_PLAN;
    var el = document.querySelector('[data-exam-note]');
    if (!P || !el) return;
    el.textContent =
      '考试日期：' + P.EXAM_LABEL + '。倒计时按本机时间算。' +
      (P.isOver() ? '这一场已经结束。' : '') +
      '要用在别的场次，在网址后面加 ?exam=2027-06-12 这样的日期即可。';
  })();
})();
