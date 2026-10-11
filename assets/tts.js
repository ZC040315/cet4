/* 过线 · 浏览器语音合成（Web Speech API）

   规划书第三节定的方案：不托管任何 mp3，用浏览器自带的语音合成现场朗读文本。
   零音频文件、零版权风险、原文天然成立（因为文本就是我们写的）。

   两个真实现状需要兜住：

     1. **没有语音引擎的浏览器**：headless Chrome、某些 Linux 发行版、部分安卓浏览器里
        getVoices() 返回空数组，speak() 不会出声、也不会触发 onend。
        所以这里给每次朗读加了一个**按文本长度估算的看门狗**：到点还没结束就当作结束，
        页面不会卡在「正在播放…」上转圈。宁可提前放过，也不能卡死。
     2. **系统里没有英语语音**：getVoices() 有声音但没有 en-*，那就退回 lang='en-US' 交给浏览器挑。

   另外：iOS Safari 要求由用户手势触发第一次朗读，所以本站所有播放都是按钮点的，
   不做「进入页面自动开读」。 */

(function () {
  var synth = window.speechSynthesis;
  var supported = Boolean(synth && window.SpeechSynthesisUtterance);
  var voices = [];
  var stopFlag = null;

  function refreshVoices() {
    voices = supported ? synth.getVoices() || [] : [];
    return voices;
  }

  // 只列英语嗓音；没有就返回空数组，页面据此提示
  function englishVoices() {
    refreshVoices();
    return voices.filter(function (v) {
      return /^en(-|_|$)/i.test(v.lang || '');
    });
  }

  function pickVoice(name) {
    refreshVoices();
    if (!voices.length) return null;
    if (name) {
      for (var i = 0; i < voices.length; i++) if (voices[i].name === name) return voices[i];
    }
    var en = voices.filter(function (v) {
      return /^en(-|_|$)/i.test(v.lang || '');
    });
    var pool = en.length ? en : voices;
    // 优先美音，其次英音
    var prefer = ['en-US', 'en_US', 'en-GB', 'en_GB'];
    for (var p = 0; p < prefer.length; p++) {
      for (var k = 0; k < pool.length; k++) {
        if (String(pool[k].lang).replace('-', '_') === prefer[p].replace('-', '_')) return pool[k];
      }
    }
    return pool[0];
  }

  function cancel() {
    stopFlag = null;
    if (supported) {
      try {
        synth.cancel();
      } catch (e) {
        /* 有些浏览器在没在说话时 cancel 会抛，忽略 */
      }
    }
  }

  // 按词数估算最长播放时间，用来兜住「引擎不出声也不回调」的情况
  function watchdogMs(text, rate) {
    var w = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    var perWord = 620 / (rate || 1);
    return Math.round(w * perWord + 4000);
  }

  function makeUtterance(text, opts) {
    var u = new window.SpeechSynthesisUtterance(text);
    u.lang = (opts && opts.lang) || 'en-US';
    u.rate = (opts && opts.rate) || 1;
    u.pitch = 1;
    var v = pickVoice(opts && opts.voice);
    if (v) u.voice = v;
    return u;
  }

  /* 读一段。返回 { cancel }。
     opts: { rate, voice, lang, onstart, onend, onerror } */
  function speak(text, opts) {
    opts = opts || {};
    cancel();
    if (!supported) {
      if (opts.onerror) opts.onerror('unsupported');
      return { cancel: function () {} };
    }
    var done = false;
    var fired = false;
    var u = makeUtterance(text, opts);
    var timer = null;

    function finish(reason) {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      if (reason === 'error' && opts.onerror) opts.onerror('error');
      else if (opts.onend) opts.onend();
    }

    u.onend = function () {
      finish('end');
    };
    u.onerror = function () {
      finish('error');
    };

    timer = setTimeout(function () {
      // 看门狗：引擎没反应也当作读完了，别让页面卡住
      finish('timeout');
    }, watchdogMs(text, u.rate));

    try {
      synth.speak(u);
      fired = true;
    } catch (e) {
      fired = false;
    }
    if (!fired) finish('error');
    if (opts.onstart) opts.onstart();

    return {
      cancel: function () {
        finish('cancel');
        cancel();
      },
    };
  }

  /* 逐句连读。返回 { cancel }。
     opts: { rate, voice, gap, onProgress(index, total), onend, onerror } */
  function speakAll(sentences, opts) {
    opts = opts || {};
    cancel();
    if (!supported) {
      if (opts.onerror) opts.onerror('unsupported');
      return { cancel: function () {} };
    }
    var list = (sentences || []).slice();
    var i = 0;
    var stopped = false;
    stopFlag = function () {
      stopped = true;
    };
    var handle = { cancel: function () {} };

    function next() {
      if (stopped) return;
      if (i >= list.length) {
        if (opts.onend) opts.onend();
        return;
      }
      var idx = i++;
      if (opts.onProgress) opts.onProgress(idx, list.length);
      var gap = opts.gap == null ? 380 : opts.gap;
      handle = speak(list[idx], {
        rate: opts.rate,
        voice: opts.voice,
        lang: opts.lang,
        onend: function () {
          if (stopped) return;
          setTimeout(next, gap);
        },
        onerror: function () {
          if (stopped) return;
          setTimeout(next, gap);
        },
      });
      // speak() 内部会 cancel 掉上一个，但连读时我们自己管顺序，所以不能让它互相取消：
      // 这里把 handle 记下来只是为了能整体停掉
      stopFlag = function () {
        stopped = true;
        if (handle && handle.cancel) handle.cancel();
      };
    }

    next();

    return {
      cancel: function () {
        if (stopFlag) stopFlag();
        cancel();
      },
    };
  }

  if (supported) {
    refreshVoices();
    // 嗓音列表在很多浏览器里是异步填好的
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', refreshVoices);
    } else {
      synth.onvoiceschanged = refreshVoices;
    }
  }

  window.CET4_TTS = {
    supported: supported,
    voices: englishVoices,
    refresh: refreshVoices,
    pickVoice: pickVoice,
    speak: speak,
    speakAll: speakAll,
    cancel: cancel,
    watchdogMs: watchdogMs,
  };
})();
