/* 过线 · 听写对照的纯逻辑（不碰 DOM，可单独测）

   规划书第三节第 3 步：「对照原文 —— 这是全部价值所在」。
   这个文件干的就是这件事：拿你听写的内容和原文逐词比，指出哪些词没听出来。

   三个刻意的处理：

     1. **标点、大小写不影响判定**。写成 "The library." 和 "the library" 算你听对了；
        逗号句号漏了不倒扣 —— 听写练的是耳朵，不是标点。
     2. **语序用一个简单的最长公共子序列来对齐**，不是硬按位置比。
        你少写一个词，后面整句不会全判错。
     3. **功能词单独拎出来**。漏掉 a / the / of / is 这类词，属于「没抓住语法虚词」，
        和「这个单词我压根不认识」是两回事，混在一起会把统计数字搞脏。
        所以它们不计入「认识但没听出来 / 不认识」这两类，页面上单独列一行。 */

(function () {
  var FUNCTION_WORDS = [
    'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'but',
    'is', 'are', 'was', 'were', 'be', 'been', 'am', 'do', 'does', 'did',
    'has', 'have', 'had', 'it', 'its', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our', 'their',
    'me', 'him', 'them', 'us', 'as', 'for', 'with', 'from', 'by', 'so', 'if',
    'not', 'no', 'there', 'here', 'will', 'would', 'can', 'could', 'shall', 'should',
    'may', 'might', 'must', 'than', 'then', 'too', 'very', 's',
  ];
  var FUNCTION_SET = {};
  FUNCTION_WORDS.forEach(function (w) {
    FUNCTION_SET[w] = 1;
  });

  // 归一化：小写、统一撇号、标点当分隔符，连字符保留（four-week 算一个词）
  function normalize(text) {
    return String(text == null ? '' : text)
      .toLowerCase()
      .replace(/[\u2018\u2019\u02bc]/g, "'")
      .replace(/[^a-z0-9'\-\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function words(text) {
    var n = normalize(text);
    return n ? n.split(' ') : [];
  }

  /* 把原文切成「词 / 非词」两种片段，标点原样保留。
     这样给原句加红标时，句号逗号不会丢，而且第 i 个词片段正好对应 words() 里的第 i 个词。 */
  function tokens(text) {
    var raw = String(text == null ? '' : text).match(/[A-Za-z0-9'’\u2018\u2019\u02bc\-]+|[^A-Za-z0-9'’\u2018\u2019\u02bc\-]+/g) || [];
    var out = [];
    var wordIndex = 0;
    raw.forEach(function (piece) {
      var isWord = /[A-Za-z0-9]/.test(piece.charAt(0));
      if (isWord) {
        out.push({ text: piece, isWord: true, index: wordIndex++ });
      } else {
        out.push({ text: piece, isWord: false });
      }
    });
    return out;
  }

  /* 逐词对照。返回：
       a       原文的词（已归一化）
       b       你写的词（已归一化）
       marks   与 a 等长，每项 'hit' / 'miss'
       extra   你多写的词（原文里没有）
       hit/miss/total/similarity */
  function compare(original, typed) {
    var a = words(original);
    var b = words(typed);
    var n = a.length;
    var m = b.length;

    var dp = [];
    var i, j;
    for (i = 0; i <= n; i++) {
      dp.push(new Array(m + 1).fill(0));
    }
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    var marks = new Array(n).fill('miss');
    var usedB = new Array(m).fill(false);
    i = 0;
    j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        marks[i] = 'hit';
        usedB[j] = true;
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        i++;
      } else {
        j++;
      }
    }

    var extra = [];
    for (j = 0; j < m; j++) if (!usedB[j]) extra.push(b[j]);
    var hit = marks.filter(function (x) {
      return x === 'hit';
    }).length;

    return {
      a: a,
      b: b,
      marks: marks,
      extra: extra,
      hit: hit,
      miss: n - hit,
      total: n,
      similarity: n ? hit / n : 0,
    };
  }

  // 给原句套上判定结果，返回可直接渲染的片段（标点原样保留）
  function markedTokens(original, marks) {
    return tokens(original).map(function (t) {
      if (!t.isWord) return t;
      return { text: t.text, isWord: true, index: t.index, mark: marks[t.index] || 'miss' };
    });
  }

  function isFunction(word) {
    return Boolean(FUNCTION_SET[normalize(word)]);
  }

  /* 把没听出来的词分成两类。
     content      —— 需要你自己判断「认识但没听出来 / 不认识」的实词（去重、保持出现顺序）
     functionWord —— 漏掉的虚词（a/the/of…），不计入统计 */
  function splitMissed(marks, wordList) {
    var content = [];
    var functionWord = [];
    var seen = {};
    (wordList || []).forEach(function (w, i) {
      if (marks[i] !== 'miss') return;
      if (seen[w]) return;
      seen[w] = 1;
      if (isFunction(w)) functionWord.push(w);
      else content.push(w);
    });
    return { content: content, functionWord: functionWord };
  }

  // 整篇的对照结果：逐句跑一遍，再汇总漏词
  function compareClip(sentences, typedList) {
    var perSentence = [];
    var allMissed = [];
    var hit = 0;
    var total = 0;
    (sentences || []).forEach(function (sentence, i) {
      var result = compare(sentence, (typedList || [])[i] || '');
      perSentence.push(result);
      hit += result.hit;
      total += result.total;
      result.a.forEach(function (w, k) {
        if (result.marks[k] === 'miss') allMissed.push(w);
      });
    });
    var seen = {};
    var unique = [];
    allMissed.forEach(function (w) {
      if (!seen[w]) {
        seen[w] = 1;
        unique.push(w);
      }
    });
    return {
      perSentence: perSentence,
      missed: unique,
      hit: hit,
      total: total,
      similarity: total ? hit / total : 0,
      content: splitMissed(
        unique.map(function () {
          return 'miss';
        }),
        unique
      ),
    };
  }

  window.CET4_TEXT = {
    FUNCTION_WORDS: FUNCTION_WORDS,
    normalize: normalize,
    words: words,
    tokens: tokens,
    compare: compare,
    compareClip: compareClip,
    markedTokens: markedTokens,
    isFunction: isFunction,
    splitMissed: splitMissed,
  };
})();
