/* 过线 · 首屏主题引导（theme boot）

   为什么单独一个文件、而且必须在 <head> 里同步执行：

   浏览器解析完 <head> 就可以首绘，而 data-theme 一直是 app.js 在
   DOMContentLoaded 才写上去的 —— 对选了深色的人来说，中间那一帧就是白屏闪烁，
   每次跳页都会闪一次。这里在首绘之前把属性补上。

   这里只做一件最小的事：读本机进度里的主题，写到 <html> 上。
   存储读不到、JSON 坏了、隐私模式禁用 localStorage —— 一律安静退出，交给 app.js 兜底。

   另外把存储键挂在 window 上，让 store.js 用同一个常量，
   避免 "cet4.v1" 在两个文件里各写一遍、以后改版本时漏掉一处。 */

(function () {
  var KEY = 'cet4.v1';
  window.CET4_STORE_KEY = KEY;

  var dark = false;
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var state = JSON.parse(raw);
      dark = Boolean(state && state.settings && state.settings.theme === 'dark');
    }
  } catch (e) {
    dark = false;
  }
  if (!dark) return;

  document.documentElement.setAttribute('data-theme', 'dark');

  /* 顶栏按钮的静态文案固定写着「深色」（意思是"点我变深色"），
     所以深色用户会先看到一个错的标签。按钮一进 DOM 就改过来，不等 app.js。 */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn && document.documentElement.getAttribute('data-theme') === 'dark') btn.textContent = '浅色';
  });
})();
