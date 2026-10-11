/* 过线 · 说明页的两个小动作：重新摸底。
   （导出 / 导入在 app.js 里，全站共用。这里只处理「清空摸底记录」。） */

(function () {
  var S = window.CET4_STORE;
  var btn = document.querySelector('[data-reset]');
  if (!btn) return;
  var note = document.querySelector('[data-reset-note]');

  btn.addEventListener('click', function () {
    if (!window.confirm('清空摸底记录？已经扫过的判断会全部消失，这个动作不能撤销。')) return;
    S.patch(function (s) {
      s.probe = {};
      s.plan = null;
    });
    if (note) note.textContent = '已清空。回摸底页就是从头开始。';
  });
})();
