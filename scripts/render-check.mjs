// 过线 · 渲染自检
//
// 数据自检（scripts/check-data.mjs）只看字段对不对，看不出页面是不是坏了。
// 这个脚本负责另一半：真的用浏览器把页面打开，量几何、抓控制台报错，
// 把摸底点一遍、把词表筛一遍，顺手出几张截图。
//
// 用法：node scripts/render-check.mjs [--shot] [--out=目录] [--url=线上地址]
//   默认不截图；加 --shot 才截图（默认写到系统临时目录，不污染仓库）。
//   加 --url=https://zc040315.github.io/cet4 就改成测线上那一份（发布之后再跑一遍）。
//   只需要本机装了 Chrome 或 Edge（脚本自己找），不需要 npm 装任何东西。

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=?(.*)$/.exec(a)
    return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true]
  })
)

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = args.out ? path.resolve(String(args.out)) : path.join(os.tmpdir(), 'cet4-qa')
const WANT_SHOTS = Boolean(args.shot)
const LIVE = args.url ? String(args.url).replace(/\/+$/, '') : ''

// ---------- 造几份假进度，用来验证「摸底扫完 / 学了一阵」之后的样子 ----------

function loadWords() {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'words-core.js'), 'utf8')
  const sandbox = { window: {} }
  vm.createContext(sandbox)
  vm.runInContext(src, sandbox, { filename: 'data/words-core.js' })
  return sandbox.window.CET4_WORDS_CORE.words
}

// 页面逻辑里那些纯计算的模块也拉到 Node 里来，测试就能算出「应该是多少」再对答案，
// 而不是把数字写死在断言里（写死的话，换一天跑就会假报警）。
const PARTS = (() => {
  const sandbox = { window: {}, console }
  vm.createContext(sandbox)
  for (const f of ['assets/plan.js', 'assets/srs.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f })
  }
  return sandbox.window
})()
const PLAN = PARTS.CET4_PLAN

function defaultModeFor(unknown) {
  const rec = PLAN.planFor({ unknown, remainingScan: 0 }).recommended
  return PLAN.MODES.filter((m) => m.newWords >= rec)[0] || PLAN.MODES[PLAN.MODES.length - 1]
}

const WORDS = loadWords()

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

// 今天 ± n 天的日期键，和 assets/srs.js 用的格式一致（本机时区）
function dayKey(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

function stamp(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

// every 个词标一个「不认识」；答案的键是单词本身
function answersFor(every) {
  const answers = {}
  WORDS.forEach((w, i) => {
    answers[w.w] = i % every === 0 ? 0 : 1
  })
  return answers
}

function probeRecord(answers) {
  return {
    core: {
      answers,
      cursor: WORDS.length,
      startedAt: stamp(-3),
      updatedAt: stamp(-2),
      doneAt: stamp(-2),
    },
  }
}

// 只做完摸底：300 个不认识 → 推荐每天 10 个 → 默认落在「只有 10 分钟」档
const SEED_PROBE = {
  probe: probeRecord(answersFor(5)),
  plan: null,
  srs: {},
  days: {},
  settings: { theme: '', tier: '' },
}

// 摸底 + 学了一阵：500 个不认识 → 推荐每天 15 个 → 默认「保底」档；
// 前 80 个已经学过，其中 30 个今天到期、25 个在错词本里；前两天都做完了
const SEED_STUDY = (() => {
  const answers = answersFor(3)
  const unknown = WORDS.filter((w) => answers[w.w] === 0)
  const srs = {}
  const learned = unknown.slice(0, 80)
  learned.forEach((w, i) => {
    srs[w.w] = {
      box: (i % 5) + 1,
      due: i < 30 ? dayKey(-1) : dayKey(5 + (i % 7)),
      seen: (i % 4) + 1,
      ok: 1 + (i % 5),
      wrong: i < 25 ? 3 : 0,
      streakOk: i % 2,
      inBook: i < 25,
      first: dayKey(-6),
      last: dayKey(-1),
    }
  })
  const days = {}
  days[dayKey(-2)] = { tier: 'std', newGoal: 20, newDone: 20, reviewGoal: 0, reviewDone: 0, done: true, ms: 900000 }
  days[dayKey(-1)] = { tier: 'std', newGoal: 20, newDone: 20, reviewGoal: 10, reviewDone: 10, done: true, ms: 900000 }

  // 精听记录：pass-01 昨天做过、今天该重听；pass-02 做过、过几天再重听
  const listen = {
    clips: {
      'pass-01': {
        rounds: 1,
        lastDone: dayKey(-1),
        due: dayKey(0),
        replays: 2,
        blindPlays: 2,
        words: { permanent: 'recog', sleep: 'recog', researchers: 'unknown' },
      },
      'pass-02': {
        rounds: 1,
        lastDone: dayKey(0),
        due: dayKey(3),
        replays: 1,
        blindPlays: 1,
        words: { species: 'unknown', residents: 'recog', planners: 'unknown' },
      },
    },
  }
  return {
    probe: probeRecord(answers),
    plan: null,
    srs,
    days,
    listen,
    readings: {
      'read-01': { rounds: 1, lastDone: dayKey(-1), ms: 300000 },
      'read-02': { rounds: 1, lastDone: dayKey(0), ms: 280000 },
    },
    settings: { theme: '', tier: '' },
  }
})()

const SEEDS = {
  none: '',
  probe: JSON.stringify(SEED_PROBE),
  study: JSON.stringify(SEED_STUDY),
}

// 各份假进度里「事先说好」的数字，测试直接拿它们对答案
const FACTS = {
  probeUnknown: Object.values(SEED_PROBE.probe.core.answers).filter((v) => v === 0).length, // 300
  studyUnknown: Object.values(SEED_STUDY.probe.core.answers).filter((v) => v === 0).length, // 500
  studyLearned: Object.keys(SEED_STUDY.srs).length, // 80
  studyDue: Object.values(SEED_STUDY.srs).filter((e) => e.due <= dayKey(0)).length, // 30
  studyBook: Object.values(SEED_STUDY.srs).filter((e) => e.inBook).length, // 25
  studyDayDone: 2,
  listenClipsDone: 2,
  listenRecog: 3,
  listenUnknown: 3,
  listenDue: 1,
  readingsDone: 2,
  studyRate: Math.round((2 / 3) * 100), // 开始那天到今天共 3 天，完成 2 天
  daysLeft: PLAN.daysLeft(),
  // 今日页的默认档位、复习上限，都由「摸底结果 + 四档」算出来，不写死
  new300: defaultModeFor(300).newWords,
  new500: defaultModeFor(500).newWords,
  review500: Math.min(defaultModeFor(500).reviewCap, Object.values(SEED_STUDY.srs).filter((e) => e.due <= dayKey(0)).length),
  perDay500: PLAN.planFor({ unknown: 500, remainingScan: 0 }).recommended,
}

function seedScript(name) {
  if (name === 'none') return `localStorage.clear(); 'cleared'`
  // 注意这里要 stringify 两次：SEEDS 里已经是 JSON 文本，还要再包一层引号，
  // 否则 setItem 收到的是对象字面量，存进去会变成 "[object Object]"
  return `localStorage.setItem('cet4.v1', ${JSON.stringify(SEEDS[name])}); 'seeded'`
}

const PAGES = [
  { file: 'index.html', name: 'today-未摸底', test: 'INDEX' },
  { file: 'index.html', name: 'today-刚摸底完', test: 'TODAY_LIGHT', seed: 'probe' },
  { file: 'index.html', name: 'today-学了一阵', test: 'TODAY', seed: 'study' },
  { file: 'probe.html', name: 'probe', test: 'PROBE' },
  { file: 'probe.html', name: 'probe-扫完了', test: 'PROBE_DONE', seed: 'study' },
  { file: 'words.html', name: 'words', test: 'WORDS' },
  { file: 'words.html', name: 'words-unknown', test: 'WORDS_UNKNOWN', seed: 'study', hash: '?mark=0' },
  { file: 'study.html', name: 'study-new', test: 'STUDY_NEW', seed: 'study', hash: '?mode=new' },
  { file: 'study.html', name: 'study-review', test: 'STUDY_REVIEW', seed: 'study', hash: '?mode=review' },
  { file: 'study.html', name: 'study-book', test: 'STUDY_BOOK', seed: 'study', hash: '?mode=book' },
  { file: 'progress.html', name: 'progress', test: 'PROGRESS', seed: 'study' },
  {
    file: 'listening.html',
    name: 'listen-list',
    test: 'LISTEN_LIST',
    seed: 'study',
  },
  {
    file: 'listening.html',
    name: 'listen-flow',
    test: 'LISTEN_FLOW',
    seed: 'probe',
    hash: '?clip=news-01',
  },
  {
    file: 'listening.html',
    name: 'listen-relisten',
    test: 'LISTEN_RELISTEN',
    seed: 'study',
    hash: '?clip=pass-01&mode=relisten',
  },
  { file: 'reading.html', name: 'read-list', test: 'READ_LIST', seed: 'study' },
  { file: 'reading.html', name: 'read-flow', test: 'READ_FLOW', seed: 'study', hash: '?id=read-01' },
  { file: 'about.html', name: 'about', test: 'ABOUT', needsData: false },
]

// --only=study 只跑名字里含 study 的用例（改一个页面时不用等全部跑完）
const ONLY = args.only ? String(args.only) : ''
const RUN_PAGES = ONLY ? PAGES.filter((p) => p.name.indexOf(ONLY) >= 0) : PAGES

const VIEWPORTS = [
  { w: 1280, h: 900, label: 'desktop' },
  { w: 414, h: 860, label: 'mobile' },
]

// ---------- 找浏览器 ----------

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

const BROWSER = CANDIDATES.find((p) => {
  try {
    return fs.statSync(p).isFile()
  } catch {
    return false
  }
})

if (!BROWSER) {
  console.error('找不到 Chrome / Edge。可以设环境变量 CHROME_PATH 指向浏览器可执行文件。')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const PORT = 9500 + Math.floor(Math.random() * 200)
const CDP = `http://127.0.0.1:${PORT}`
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cet4-render-'))

const child = spawn(
  BROWSER,
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--allow-file-access-from-files',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' }
)

let up = false
for (let i = 0; i < 40; i++) {
  await sleep(400)
  try {
    const r = await fetch(`${CDP}/json/version`)
    if (r.ok) {
      up = true
      break
    }
  } catch {
    /* 还没起来 */
  }
}
if (!up) {
  child.kill()
  console.error('浏览器没能在 16 秒内启动调试端口，放弃。')
  process.exit(1)
}

// ---------- 页面里跑的检测表达式 ----------

const GEOMETRY = `(() => {
  const de = document.documentElement;
  const o = { hOverflow: de.scrollWidth - de.clientWidth, pageHeight: de.scrollHeight };
  const off = [];
  document.querySelectorAll('body *').forEach((n) => {
    const r = n.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      return;
    }
    if (r.right > de.clientWidth + 1.5 || r.left < -1.5) {
      off.push((n.className || n.tagName) + '[' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
    }
  });
  o.hOffenders = off.slice(0, 6);
  o.dataLoaded = Boolean(window.CET4_WORDS_CORE && window.CET4_WORDS_CORE.words);
  o.text = document.body.innerText.split('\\n').filter(Boolean).slice(0, 6).join(' / ');
  // 假进度有没有真的写进 localStorage（诊断用：数字不对就说明注入那一步没生效）
  o.storageLen = (function () {
    try {
      var raw = localStorage.getItem('cet4.v1');
      return raw ? raw.length + ' 字节' : '空';
    } catch (e) {
      return '读不到';
    }
  })();
  return o;
})()`

// 摸底：看释义 → 判「认识」→ 撤销，三步都要真的动到页面和 localStorage
const PROBE_TEST = `(() => {
  const problems = [];
  const info = {};
  const cursorOf = () => {
    const el = document.querySelector('[data-probe-cursor]');
    return el ? Number(el.getAttribute('data-probe-cursor')) : null;
  };
  if (cursorOf() === null) {
    problems.push('摸底页没渲染出单词卡片');
    return { info, problems };
  }
  info.cursor0 = cursorOf();
  const word0 = document.querySelector('.probe-word').textContent;
  const btn = document.querySelector('[data-verdict="1"]');
  const box = btn.getBoundingClientRect();
  info.wordFontPx = Math.round(parseFloat(getComputedStyle(document.querySelector('.probe-word')).fontSize));
  info.buttonsInView = box.bottom <= window.innerHeight + 1;
  info.buttonBottom = Math.round(box.bottom);
  info.viewportH = window.innerHeight;

  document.querySelector('[data-reveal]').click();
  const answer = document.querySelector('.probe-answer').textContent;
  const entry = window.CET4_WORDS_CORE.words.filter((w) => w.w === word0)[0];
  info.revealWorks = Boolean(entry) && answer.indexOf(entry.zh.slice(0, 4)) >= 0;

  document.querySelector('[data-verdict="1"]').click();
  info.cursor1 = cursorOf();
  info.wordChanged = document.querySelector('.probe-word').textContent !== word0;
  const raw = localStorage.getItem('cet4.v1');
  info.stored = Boolean(raw) && JSON.parse(raw).probe.core.answers[word0] === 1;
  info.lastLine = document.querySelector('.card .faint') ? document.querySelector('.card .faint').textContent.slice(0, 30) : '';

  document.querySelector('[data-undo]').click();
  info.cursor2 = cursorOf();

  if (info.cursor0 !== 0) problems.push('摸底起始位置不是第 1 个：' + info.cursor0);
  if (info.wordFontPx < 36) problems.push('单词字号偏小（' + info.wordFontPx + 'px），手机上一眼扫不清');
  if (!info.buttonsInView) problems.push('「认识 / 不认识」两个按钮掉到了屏幕外（' + info.buttonBottom + ' > ' + info.viewportH + '）');
  if (!info.revealWorks) problems.push('点「看一眼释义」没有显示释义');
  if (info.cursor1 !== info.cursor0 + 1) problems.push('点「认识」之后位置没往前走：' + info.cursor0 + ' → ' + info.cursor1);
  if (!info.wordChanged) problems.push('点「认识」之后没有换下一个词');
  if (!info.stored) problems.push('判断没有写进 localStorage');
  if (info.cursor2 !== info.cursor0) problems.push('撤销没有退回上一个：' + info.cursor1 + ' → ' + info.cursor2);
  return { info, problems };
})()`

// 词表：搜索、按「不认识」筛、再看更多
const WORDS_TEST = `(() => {
  const problems = [];
  const info = {};
  const rows = () => document.querySelector('[data-rows]');
  const fire = (v) => {
    const input = document.querySelector('[data-q]');
    input.value = v;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };
  if (!rows()) {
    problems.push('词表页没渲染出列表');
    return { info, problems };
  }
  info.total = Number(rows().getAttribute('data-rows'));
  info.visible = Number(rows().getAttribute('data-visible'));

  fire('abandon');
  info.searchHit = Number(rows().getAttribute('data-rows'));
  info.searchWord = document.querySelector('.row-word') ? document.querySelector('.row-word').textContent : '';

  fire('zzqqxx这个词不存在');
  info.searchMiss = Number(rows().getAttribute('data-rows'));
  fire('');
  info.restored = Number(rows().getAttribute('data-rows'));

  document.querySelector('[data-filter="unknown"]').click();
  info.unknownRows = Number(rows().getAttribute('data-rows'));
  document.querySelector('[data-filter="all"]').click();

  const more = document.querySelector('[data-more]');
  if (more) {
    more.click();
    info.visibleAfterMore = Number(rows().getAttribute('data-visible'));
  }

  if (info.visible !== 200) problems.push('首屏不是 200 行：' + info.visible);
  if (info.total !== window.CET4_WORDS_CORE.words.length) problems.push('词表总数不对：' + info.total);
  if (!(info.searchHit > 0 && info.searchHit < info.total)) problems.push('搜索「abandon」应该有命中：' + info.searchHit);
  if (String(info.searchWord).indexOf('abandon') !== 0) problems.push('搜索命中的第一条不是 abandon：' + info.searchWord);
  if (info.searchMiss !== 0) problems.push('搜一个不存在的词还剩 ' + info.searchMiss + ' 行');
  if (info.restored !== info.total) problems.push('清空搜索后没有恢复全部：' + info.restored);
  if (info.unknownRows !== 0) problems.push('没扫过任何词时「不认识」应该是 0 行，实际 ' + info.unknownRows);
  if (more && info.visibleAfterMore !== 400) problems.push('「再看 200 个」没生效：' + info.visibleAfterMore);
  return { info, problems };
})()`

// 扫过之后：?mark=0 直接落在「不认识」这一档
const WORDS_UNKNOWN_TEST = `(() => {
  const problems = [];
  const info = {};
  const rows = document.querySelector('[data-rows]');
  if (!rows) {
    problems.push('词表页没渲染出列表');
    return { info, problems };
  }
  info.unknownRows = Number(rows.getAttribute('data-rows'));
  const chip = document.querySelector('[data-filter="unknown"]');
  info.chipOn = Boolean(chip) && chip.getAttribute('aria-pressed') === 'true';
  info.marks = Array.from(document.querySelectorAll('.row-mark')).map((n) => n.textContent);
  info.allUnknown = info.marks.length > 0 && info.marks.every((m) => m === '不认识');
  if (info.unknownRows !== ${FACTS.studyUnknown}) problems.push('带进度进「不认识」应该有 ${FACTS.studyUnknown} 个，实际 ' + info.unknownRows);
  if (!info.chipOn) problems.push('「不认识」筛选没有选中');
  if (!info.allUnknown) problems.push('列表里混进了别的标记：' + info.marks.slice(0, 5).join('/'));
  return { info, problems };
})()`

// 说明页：导出 / 导入必须能跑（这是换设备唯一的搬家方式）
const ABOUT_TEST = `(() => {
  const problems = [];
  const info = {};
  const S = window.CET4_STORE;
  info.exportButton = Boolean(document.querySelector('[data-export]'));
  info.importButton = Boolean(document.querySelector('[data-import]'));
  const json = S.exportJson();
  info.exportBytes = json.length;
  info.roundTrip = S.importJson(json).ok === true;
  info.rejectsGarbage = S.importJson('这不是 JSON').ok === false;
  info.hasReset = Boolean(document.querySelector('[data-reset]'));
  info.hasResetAll = Boolean(document.querySelector('[data-reset-all]'));
  if (!info.exportButton || !info.importButton) problems.push('说明页缺导出 / 导入按钮');
  if (json.length < 20) problems.push('导出的 JSON 是空的');
  if (!info.roundTrip) problems.push('导出的 JSON 不能再导入回来');
  if (!info.rejectsGarbage) problems.push('导入乱文件时没有报错');
  if (!info.hasReset) problems.push('说明页缺「清空摸底记录」');
  if (!info.hasResetAll) problems.push('说明页缺「清空全部」');
  return { info, problems };
})()`

// 今日页：没扫过的时候只说一件事 —— 去摸底
const INDEX_TEST = `(() => {
  const problems = [];
  const info = {};
  const text = document.body.innerText;
  info.hasCountdown = /距 2026 年 12 月 12 日还有/.test(text);
  info.says = text.split('\\n').filter(Boolean).slice(0, 5).join(' / ');
  if (!info.hasCountdown) problems.push('首页没有倒计时那一行');
  if (!/摸底/.test(text)) problems.push('首页没有指向摸底');
  if (/摸底结果/.test(text)) problems.push('还没扫词，首页却显示了摸底结果');
  return { info, problems };
})()`

// 今日页：刚扫完摸底、还没背过任何词 —— 300 个不认识 → 推荐每天 10 个 → 默认「只有 10 分钟」档
const TODAY_LIGHT_TEST = `(() => {
  const problems = [];
  const info = {};
  const text = document.body.innerText;
  info.says = text.split('\\n').filter(Boolean).slice(0, 8).join(' / ');
  info.newLine = (text.match(/新词 (\\d+) 个/) || [])[1] || null;
  info.reviewLine = (text.match(/复习 (\\d+) 个/) || [])[1] || null;
  info.tierChips = document.querySelectorAll('[data-tier]').length;
  info.minButton = Boolean(document.querySelector('[data-min]'));
  info.hasStreak = /连续/.test(text);
  if (info.newLine !== '${FACTS.new300}') problems.push('推荐每天 ${FACTS.new300} 个 → 今日页新词应该是 ${FACTS.new300} 个，实际 ' + info.newLine);
  if (info.reviewLine !== '0') problems.push('还没学过任何词 → 复习应该是 0 个，实际 ' + info.reviewLine);
  if (info.tierChips !== 4) problems.push('应该有 4 个档位可选，实际 ' + info.tierChips);
  if (info.minButton) problems.push('已经在「只有 10 分钟」档了，不该再显示那个按钮');
  if (!info.hasStreak) problems.push('今日页没有连续天数');
  return { info, problems };
})()`

// 今日页：学了一阵 —— 500 个不认识 → 推荐 15 个 → 默认「保底」档，复习有 30 个到期
const TODAY_TEST = `(() => {
  const problems = [];
  const info = {};
  const text = document.body.innerText;
  info.newLine = (text.match(/新词 (\\d+) 个/) || [])[1] || null;
  info.reviewLine = (text.match(/复习 (\\d+) 个/) || [])[1] || null;
  info.dayNumber = (text.match(/第 (\\d+) 天/) || [])[1] || null;
  info.minButton = Boolean(document.querySelector('[data-min]'));
  info.doneRows = document.querySelectorAll('.task[data-done="1"]').length;

  if (info.newLine !== '${FACTS.new500}') problems.push('推荐每天 ${FACTS.new500} 个 → 默认档新词应该是 ${FACTS.new500}，实际 ' + info.newLine);
  if (info.reviewLine !== '${FACTS.review500}') problems.push('今天到期 ${FACTS.studyDue} 个、档位上限之内 → 复习应该是 ${FACTS.review500}，实际 ' + info.reviewLine);
  if (!info.minButton) problems.push('不在最轻档时应该显示「只有 10 分钟」按钮');
  if (info.dayNumber !== '3') problems.push('两周前开始、今天应该是第 3 天，实际 ' + info.dayNumber);

  // 换到标准档：精听和真题音频这两行才会出现（规划书第十一节的表）
  document.querySelector('[data-tier="std"]').click();
  const stdText = document.body.innerText;
  info.stdNew = (stdText.match(/新词 (\\d+) 个/) || [])[1] || null;
  info.hasListenRow = Boolean(document.querySelector('[data-task="listen"]'));
  info.hasRealRow = Boolean(document.querySelector('[data-task="realaudio"]'));
  info.hasReadRow = Boolean(document.querySelector('[data-task="read"]'));
  if (info.stdNew !== '20') problems.push('标准档新词应该是 20，实际 ' + info.stdNew);
  if (!info.hasListenRow) problems.push('标准档应该出现精听任务');
  if (!info.hasRealRow) problems.push('标准档应该出现真题音频打卡');
  if (!info.hasReadRow) problems.push('标准档应该出现短读任务');
  if (info.hasReadRow) {
    info.readRowSays = document.querySelector('[data-task="read"] .faint').textContent;
    if (!/15 分钟/.test(info.readRowSays)) problems.push('标准档短读应该写 15 分钟：' + info.readRowSays);
  }
  if (info.hasListenRow) {
    info.listenRowSays = document.querySelector('[data-task="listen"] .faint').textContent;
    if (!/重听|25 分钟/.test(info.listenRowSays)) problems.push('精听任务说明不对：' + info.listenRowSays);
  }
  document.querySelector('[data-real-audio]').click();
  info.realAudio = JSON.parse(localStorage.getItem('cet4.v1')).days[window.CET4_SRS.dateKey()].realAudio === true;
  if (!info.realAudio) problems.push('真题音频打卡没有写进存储');

  // 点「只有 10 分钟」应该立刻把今天的量降下来
  document.querySelector('[data-min]').click();
  const after = document.body.innerText;
  info.afterMin = (after.match(/新词 (\\d+) 个/) || [])[1] || null;
  info.minGone = !document.querySelector('[data-min]');
  info.listenRowGone = !document.querySelector('[data-task="listen"]');
  info.readRowGone = !document.querySelector('[data-task="read"]');
  const stored = JSON.parse(localStorage.getItem('cet4.v1'));
  info.storedTodayTier = stored.days[window.CET4_SRS.dateKey()].tier;
  info.storedDefaultTier = stored.settings.tier || '(没设过)';
  if (info.afterMin !== '10') problems.push('点了「只有 10 分钟」后新词应该变成 10 个，实际 ' + info.afterMin);
  if (!info.minGone) problems.push('点了「只有 10 分钟」后按钮应该消失');
  if (info.storedTodayTier !== 'min') problems.push('今天的档位没有存进 localStorage：' + info.storedTodayTier);
  if (info.storedDefaultTier === 'min') problems.push('「只有 10 分钟」不该改默认档位 —— 它只是今天的台阶');
  if (!info.listenRowGone) problems.push('降到最轻档之后不该再要精听（那一档只保单词不断档）');
  if (!info.readRowGone) problems.push('降到最轻档之后不该再要短读');
  return { info, problems };
})()`

// 摸底页：扫完之后的结果页（每天背多少 + 四档对照）
const PROBE_DONE_TEST = `(() => {
  const problems = [];
  const info = {};
  const text = document.body.innerText;
  info.says = text.split('\\n').filter(Boolean).slice(0, 6).join(' / ');
  info.hasResult = /摸底扫完了/.test(text);
  const m = text.match(/每天背 (\\d+) 个新词/);
  info.perDay = m ? Number(m[1]) : null;
  info.tableRows = document.querySelectorAll('.table tbody tr').length;
  info.hereRow = document.querySelectorAll('.table tbody tr[data-here]').length;
  if (!info.hasResult) problems.push('扫完之后没有显示摸底结果');
  if (info.perDay !== ${FACTS.perDay500}) problems.push('${FACTS.studyUnknown} 个不认识，按剩余天数算 → 每天 ${FACTS.perDay500} 个，实际 ' + info.perDay);
  if (info.tableRows !== 4) problems.push('四档表应该有 4 行，实际 ' + info.tableRows);
  if (info.hereRow !== 1) problems.push('四档表里应该正好标出一个「你在这」，实际 ' + info.hereRow);
  return { info, problems };
})()`

// ---------- 背词：新词、复习、错词本 ----------

// 队列长度从「第 1 / 15 · 新词」这行里读，免得把数字写死在断言里
const QUEUE_LEN = `const queueLen = () => {
  const t = document.querySelector('.probe-meta').textContent;
  return Number(t.split('/')[1].trim().split(' ')[0]);
};`

const STUDY_NEW_TEST = `(() => {
  const problems = [];
  const info = {};
  const SRS = window.CET4_SRS;
  const key = SRS.dateKey();
  ${QUEUE_LEN}
  const card = document.querySelector('[data-study-card]');
  if (!card) {
    problems.push('新词卡片没渲染出来');
    return { info, problems };
  }
  info.queueLen = queueLen();
  const word = document.querySelector('.study-word').textContent;
  info.word = word;
  info.meaningShown = document.querySelector('.study-answer').textContent.trim().length > 0;
  info.grades = Array.from(document.querySelectorAll('[data-grade]')).map((b) => b.getAttribute('data-grade'));

  // 第一张：记住了 → 进盒 1，今天的新词完成数 +1
  document.querySelector('[data-grade="known"]').click();
  let store = JSON.parse(localStorage.getItem('cet4.v1'));
  const e1 = store.srs[word];
  info.afterKnown = e1 ? [e1.box, e1.seen, e1.inBook] : null;
  info.dayNewDone = store.days[key] ? store.days[key].newDone : null;
  info.advanced = Number(document.querySelector('[data-study-index]').getAttribute('data-study-index')) === 1;

  // 第二张：还不熟 → 进错词本，而且本轮末尾会再问一遍
  const word2 = document.querySelector('.study-word').textContent;
  document.querySelector('[data-grade="missed"]').click();
  store = JSON.parse(localStorage.getItem('cet4.v1'));
  const e2 = store.srs[word2];
  info.afterMissed = e2 ? [e2.box, e2.inBook, e2.wrong] : null;
  info.dayNewDone2 = store.days[key].newDone;
  info.queueAfterMissed = queueLen();

  if (info.queueLen !== ${FACTS.new500}) problems.push('默认档的新词队列应该是 ${FACTS.new500} 个，实际 ' + info.queueLen);
  if (!info.meaningShown) problems.push('新词卡片应该直接给出释义');
  if (JSON.stringify(info.grades) !== JSON.stringify(['missed', 'known'])) problems.push('新词卡片应该是「还不熟 / 记住了」两个按钮：' + JSON.stringify(info.grades));
  if (JSON.stringify(info.afterKnown) !== JSON.stringify([1, 1, false])) problems.push('「记住了」应该进盒 1 且不进错词本：' + JSON.stringify(info.afterKnown));
  if (info.dayNewDone !== 1) problems.push('今日新词完成数应该是 1：' + info.dayNewDone);
  if (!info.advanced) problems.push('打完分没有换下一张卡');
  if (JSON.stringify(info.afterMissed) !== JSON.stringify([1, true, 1])) problems.push('「还不熟」应该进错词本、盒 1：' + JSON.stringify(info.afterMissed));
  if (info.dayNewDone2 !== 2) problems.push('今日新词完成数应该是 2：' + info.dayNewDone2);
  if (info.queueAfterMissed !== ${FACTS.new500} + 1) problems.push('「还不熟」的词应该在本轮末尾再问一遍：' + info.queueAfterMissed);
  return { info, problems };
})()`

const STUDY_REVIEW_TEST = `(() => {
  const problems = [];
  const info = {};
  const SRS = window.CET4_SRS;
  const key = SRS.dateKey();
  ${QUEUE_LEN}
  const card = document.querySelector('[data-study-card]');
  if (!card) {
    problems.push('复习卡片没渲染出来');
    return { info, problems };
  }
  info.queueLen = queueLen();
  const word = document.querySelector('[data-study-word]').getAttribute('data-study-word');
  info.word = word;
  info.noGradesYet = document.querySelectorAll('[data-grade]').length === 0;
  info.answerHidden = document.querySelector('.study-answer').textContent.trim() === '';

  document.querySelector('[data-reveal]').click();
  info.gradesAfterReveal = Array.from(document.querySelectorAll('[data-grade]')).map((b) => b.getAttribute('data-grade'));
  info.answerShown = document.querySelector('.study-answer').textContent.trim().length > 0;

  document.querySelector('[data-grade="missed"]').click();
  const store = JSON.parse(localStorage.getItem('cet4.v1'));
  const e = store.srs[word];
  info.after = e ? [e.box, e.inBook, e.due === SRS.addDays(key, 1)] : null;
  info.dayReviewDone = store.days[key].reviewDone;

  if (info.queueLen !== ${FACTS.review500}) problems.push('今天到期 ${FACTS.studyDue} 个复习词、档位上限 ${FACTS.review500} → 队列应该是 ${FACTS.review500}，实际 ' + info.queueLen);
  if (!info.noGradesYet) problems.push('复习卡片一开始不该有自评按钮 —— 要先自己回忆');
  if (!info.answerHidden) problems.push('复习卡片一开始就把释义露出来了');
  if (JSON.stringify(info.gradesAfterReveal) !== JSON.stringify(['known', 'fuzzy', 'missed'])) problems.push('看释义后应该是三档自评：' + JSON.stringify(info.gradesAfterReveal));
  if (!info.answerShown) problems.push('点了「看释义」还是没有释义');
  if (JSON.stringify(info.after) !== JSON.stringify([1, true, true])) problems.push('「忘了」应该打回盒 1、明天再见、进错词本：' + JSON.stringify(info.after));
  if (info.dayReviewDone !== 1) problems.push('今日复习完成数应该是 1：' + info.dayReviewDone);
  return { info, problems };
})()`

const STUDY_BOOK_TEST = `(() => {
  const problems = [];
  const info = {};
  const SRS = window.CET4_SRS;
  const key = SRS.dateKey();
  ${QUEUE_LEN}
  const card = document.querySelector('[data-study-card]');
  if (!card) {
    problems.push('错词本卡片没渲染出来');
    return { info, problems };
  }
  info.queueLen = queueLen();
  const word = document.querySelector('[data-study-word]').getAttribute('data-study-word');
  info.word = word;
  const before = JSON.parse(localStorage.getItem('cet4.v1'));
  info.pickedInBook = Boolean(before.srs[word]) && before.srs[word].inBook === true;

  document.querySelector('[data-reveal]').click();
  document.querySelector('[data-grade="known"]').click();
  const store = JSON.parse(localStorage.getItem('cet4.v1'));
  const e = store.srs[word];
  info.after = e ? [e.inBook, e.streakOk] : null;
  const today = store.days[key];
  info.dayUntouched = !today || (!today.newDone && !today.reviewDone);

  if (info.queueLen !== ${FACTS.studyBook}) problems.push('错词本里有 ${FACTS.studyBook} 个词 → 队列应该是 ${FACTS.studyBook}，实际 ' + info.queueLen);
  if (!info.pickedInBook) problems.push('错词本练习取到的词不在错词本里：' + word);
  if (JSON.stringify(info.after) !== JSON.stringify([true, 1])) problems.push('错词本里第一次「记得」还应该留着（连着两次才出）：' + JSON.stringify(info.after));
  if (!info.dayUntouched) problems.push('错词本是加练，不该算进今天的完成数');
  return { info, problems };
})()`

// ---------- 精听 ----------

const LISTEN_LIST_TEST = `(() => {
  const problems = [];
  const info = {};
  const text = document.body.innerText;
  info.clips = document.querySelectorAll('.clip-card').length;
  info.typeHeadings = Array.from(document.querySelectorAll('h2')).map((h) => h.textContent.trim().split(' ')[0]);
  info.dueLink = Boolean(document.querySelector('.clip-card a[href*="mode=relisten"]'));
  info.notReal = /不是真题/.test(text);
  info.five = /盲听/.test(text) && /逐句听写/.test(text) && /对照原文/.test(text) && /跟读/.test(text);
  if (info.clips !== 9) problems.push('应该有 9 篇精听材料，实际 ' + info.clips);
  if (info.typeHeadings.length !== 3) problems.push('应该按三种类型分三组，实际 ' + info.typeHeadings.length + ' 组');
  if (!info.dueLink) problems.push('有到期该重听的篇目，列表里应该出现「重听」入口');
  if (!info.notReal) problems.push('没有写明「不是真题」');
  if (!info.five) problems.push('没有把五步流程说清楚');
  return { info, problems };
})()`

// 把语音合成换成立刻回调：无头浏览器里没有声音引擎，真播会一直等
const TTS_STUB = `
  window.speechSynthesis.speak = function (u) { setTimeout(function () { if (u.onend) u.onend(); }, 0); };
  window.speechSynthesis.cancel = function () {};
  const wait = (ms) => new Promise(function (r) { setTimeout(r, ms); });`

const LISTEN_FLOW_TEST = `(async () => {
  const problems = [];
  const info = {};
  const SRS = window.CET4_SRS;
  const key = SRS.dateKey();
  const clip = window.CET4_LISTENING.clips.filter((c) => c.id === 'news-01')[0];
  ${TTS_STUB}
  const step = () => {
    const el = document.querySelector('[data-step]');
    return el ? el.getAttribute('data-step') : null;
  };

  info.step0 = step();
  info.gistHidden = document.querySelector('.study-answer') === null;

  document.querySelector('[data-play-all]').click();
  // 连读时每句之间留了 420ms，7 句全播完大约 3 秒
  await wait(3600);
  info.playLabel = document.querySelector('[data-play-all]').textContent.trim();
  document.querySelector('[data-gist]').click();
  info.gistShown = /大意/.test(document.querySelector('.study-answer').textContent);

  document.querySelector('[data-next-step]').click();
  info.step1 = step();
  const total = clip.sentences.length;
  for (let i = 0; i < total; i++) {
    const box = document.querySelector('[data-typed]');
    if (!box) { problems.push('第 ' + (i + 1) + ' 句没有听写框'); break; }
    box.value = i === 0 ? clip.sentences[0] : '';
    box.dispatchEvent(new Event('input', { bubbles: true }));
    const next = document.querySelector('[data-next]');
    const toCompare = document.querySelector('[data-to-compare]');
    if (next) next.click();
    else if (toCompare) { toCompare.click(); break; }
    else { problems.push('第 ' + (i + 1) + ' 句没有「下一句」按钮'); break; }
  }

  info.step2 = step();
  info.diffBlocks = document.querySelectorAll('.diff-block').length;
  info.diffMiss = document.querySelectorAll('.diff-miss').length;
  info.classifyRows = document.querySelectorAll('.classify').length;
  info.funcLine = /漏掉的虚词/.test(document.body.innerText);

  const rows = () => document.querySelectorAll('.classify');
  const word0 = rows()[0].getAttribute('data-word');
  const word1 = rows()[1] ? rows()[1].getAttribute('data-word') : null;
  rows()[0].querySelector('[data-kind="recog"]').click();
  info.label0 = rows()[0].querySelector('[data-kind="recog"]').getAttribute('aria-pressed');
  if (word1) {
    rows()[1].querySelector('[data-kind="unknown"]').click();
    info.label1 = rows()[1].querySelector('[data-kind="unknown"]').getAttribute('aria-pressed');
  }

  document.querySelector('[data-to-shadow]').click();
  info.step3 = step();
  let guard = 0;
  while (document.querySelector('[data-next]') && guard++ < 40) document.querySelector('[data-next]').click();
  document.querySelector('[data-finish]').click();
  info.step4 = step();

  const store = JSON.parse(localStorage.getItem('cet4.v1'));
  const rec = store.listen.clips['news-01'];
  info.rounds = rec.rounds;
  info.dueTomorrow = rec.due === SRS.addDays(key, 1);
  info.savedLabels = [rec.words[word0], word1 ? rec.words[word1] : null];
  info.listenDone = store.days[key].listenDone;
  info.doneShowsClasses = /认识但没听出来/.test(document.body.innerText) && /压根不认识/.test(document.body.innerText);

  if (info.step0 !== 'blind') problems.push('应该从盲听开始，实际 ' + info.step0);
  if (!info.gistHidden) problems.push('盲听这一步一开始不该把大意摊开');
  if (!/第 2 次/.test(info.playLabel)) problems.push('播过一次之后按钮应该变成「再听一遍」：' + info.playLabel);
  if (!info.gistShown) problems.push('点「对一下大意」没有显示大意');
  if (info.step1 !== 'dictate') problems.push('应该进入逐句听写，实际 ' + info.step1);
  if (info.diffBlocks !== total) problems.push('逐句对照应该有 ' + total + ' 段，实际 ' + info.diffBlocks);
  if (!(info.diffMiss > 0)) problems.push('留空的句子应该判出没听出来的词');
  if (!(info.classifyRows > 0)) problems.push('没有可以分类的词');
  if (!info.funcLine) problems.push('没有把漏掉的虚词单独列出来');
  if (info.label0 !== 'true' || info.label1 !== 'true') problems.push('分类按钮点了没有选中');
  if (info.step3 !== 'shadow') problems.push('应该进入跟读，实际 ' + info.step3);
  if (info.step4 !== 'done') problems.push('跟完应该进小结，实际 ' + info.step4);
  if (info.rounds !== 1) problems.push('做完一篇 rounds 应该是 1，实际 ' + info.rounds);
  if (!info.dueTomorrow) problems.push('做完应该排到明天重听');
  if (info.savedLabels[0] !== 'recog' || (word1 && info.savedLabels[1] !== 'unknown')) {
    problems.push('分类没有存进存储：' + JSON.stringify(info.savedLabels));
  }
  if (info.listenDone !== 1) problems.push('今天精听完成数应该是 1，实际 ' + info.listenDone);
  if (!info.doneShowsClasses) problems.push('小结里没有把两类分开显示');
  return { info, problems };
})()`

const LISTEN_RELISTEN_TEST = `(async () => {
  const problems = [];
  const info = {};
  const SRS = window.CET4_SRS;
  const key = SRS.dateKey();
  ${TTS_STUB}
  const step = () => document.querySelector('[data-step]').getAttribute('data-step');

  info.step0 = step();
  info.hasPass = Boolean(document.querySelector('[data-pass]'));
  info.hasFail = Boolean(document.querySelector('[data-fail]'));
  info.saysEighty = /八成/.test(document.body.innerText);

  document.querySelector('[data-play-all]').click();
  await wait(600);
  document.querySelector('[data-pass]').click();
  info.step1 = step();

  const store = JSON.parse(localStorage.getItem('cet4.v1'));
  const rec = store.listen.clips['pass-01'];
  info.rounds = rec.rounds;
  info.dueIn4 = rec.due === SRS.addDays(key, 4);
  info.listenDone = store.days[key].listenDone;

  if (info.step0 !== 'blind') problems.push('重听应该从盲听开始，实际 ' + info.step0);
  if (!info.hasPass || !info.hasFail) problems.push('重听页面缺「听懂了 / 还不行」两个按钮');
  if (!info.saysEighty) problems.push('没有说明「听懂八成就算过」');
  if (info.step1 !== 'done') problems.push('点「听懂了」之后应该进小结，实际 ' + info.step1);
  if (info.rounds !== 2) problems.push('重听一次之后 rounds 应该是 2，实际 ' + info.rounds);
  if (!info.dueIn4) problems.push('听懂了之后应该排到 4 天后');
  if (info.listenDone !== 1) problems.push('重听也该算今天的精听，实际 ' + info.listenDone);
  return { info, problems };
})()`

// ---------- 短读 ----------

const READ_LIST_TEST = `(() => {
  const problems = [];
  const info = {};
  const text = document.body.innerText;
  info.cards = document.querySelectorAll('[data-reading]').length;
  info.notReal = /不是真题/.test(text);
  info.progressLine = /读过 ${FACTS.readingsDone} \\/ 6 篇/.test(text);
  info.wordCounts = Array.from(document.querySelectorAll('[data-reading] .faint')).map((p) => p.textContent);
  info.saysWords = /\\d+ 词/.test(text) && /个生词/.test(text);
  if (info.cards !== 6) problems.push('应该有 6 篇短读，实际 ' + info.cards);
  if (!info.notReal) problems.push('没有写明「不是真题」');
  if (!info.progressLine) problems.push('没有显示「读过 ${FACTS.readingsDone} / 6 篇」');
  if (!info.saysWords) problems.push('没有标出每篇的词数和生词数');
  return { info, problems };
})()`

const READ_FLOW_TEST = `(() => {
  const problems = [];
  const info = {};
  const SRS = window.CET4_SRS;
  const key = SRS.dateKey();
  const r = window.CET4_READINGS.readings.filter((x) => x.id === 'read-01')[0];
  const step = () => {
    const el = document.querySelector('[data-step]');
    return el ? el.getAttribute('data-step') : null;
  };

  info.step0 = step();
  info.marked = document.querySelectorAll('.rword').length;
  info.gistHidden = !new RegExp(r.gist.slice(0, 6)).test(document.body.innerText);

  // 点第一个生词 → 释义条 + 加进错词本
  const word = document.querySelector('.rword').getAttribute('data-w');
  document.querySelector('.rword').click();
  const glossEl = document.querySelector('[data-gloss]');
  info.glossWord = glossEl ? glossEl.getAttribute('data-gloss') : null;
  info.glossText = glossEl ? glossEl.textContent.trim().slice(0, 40) : '';
  info.glossFromVocab = glossEl ? window.CET4_APP.wordGloss(word).slice(0, 6) : '';
  info.glossShowsMeaning = Boolean(glossEl) && info.glossText.indexOf(info.glossFromVocab) >= 0;

  document.querySelector('[data-add]').click();
  const store1 = JSON.parse(localStorage.getItem('cet4.v1'));
  const e = store1.srs[word];
  info.booked = [Boolean(e), e ? e.inBook : null, e ? e.due === SRS.addDays(key, 1) : null, e ? e.src : null];
  info.bookMark = /已在错词本/.test(document.body.innerText);

  // 读完 → 中文说明 + 生词表
  document.querySelector('[data-finish]').click();
  info.step1 = step();
  info.gistShown = document.body.innerText.indexOf(r.gist.slice(0, 10)) >= 0;
  info.wordRows = document.querySelectorAll('.classify').length;
  const store2 = JSON.parse(localStorage.getItem('cet4.v1'));
  info.rounds = store2.readings['read-01'].rounds;
  info.readDone = store2.days[key].readDone;

  if (info.step0 !== 'read') problems.push('应该从「读」开始，实际 ' + info.step0);
  if (info.marked !== r.words.length) problems.push('标注的生词应该都能点：期望 ' + r.words.length + '，实际 ' + info.marked);
  if (!info.gistHidden) problems.push('还没读完就把中文说明露出来了');
  if (!info.glossShowsMeaning) problems.push('点生词没有显示词表里的释义：' + JSON.stringify(info));
  if (!info.booked[0] || !info.booked[1] || !info.booked[2] || info.booked[3] !== 'reading') {
    problems.push('「加进错词本」没写对：' + JSON.stringify(info.booked));
  }
  if (!info.bookMark) problems.push('加进错词本之后没有标记出来');
  if (info.step1 !== 'done') problems.push('点「读完了」之后应该进小结，实际 ' + info.step1);
  if (!info.gistShown) problems.push('小结里没有那句中文说明');
  if (info.wordRows !== r.words.length) problems.push('小结里的生词表应该有 ' + r.words.length + ' 行，实际 ' + info.wordRows);
  if (info.rounds !== 2) problems.push('读完之后 rounds 应该是 2（种子里有 1），实际 ' + info.rounds);
  if (info.readDone !== 1) problems.push('今天的短读完成数应该是 1，实际 ' + info.readDone);
  return { info, problems };
})()`

// ---------- 进度页 ----------

const PROGRESS_TEST = `(() => {
  const problems = [];
  const info = {};
  const stats = Array.from(document.querySelectorAll('.stat b')).map((b) => b.textContent.trim());
  info.stats = stats;
  info.cells = document.querySelectorAll('.day-cell').length;
  info.doneCells = document.querySelectorAll('.day-cell.is-done').length;
  const book = document.querySelector('[data-book]');
  info.bookRows = book ? Number(book.getAttribute('data-book')) : 0;
  info.bookHeading = /错词本 · ${FACTS.studyBook} 个/.test(document.body.innerText);
  info.listenHeading = /精听 · 做过 ${FACTS.listenClipsDone} \\/ 9 篇/.test(document.body.innerText);
  info.listenWordRows = document.querySelector('[data-listen-words]')
    ? Number(document.querySelector('[data-listen-words]').getAttribute('data-listen-words'))
    : 0;

  if (stats[0] !== '${FACTS.studyDayDone}') problems.push('连续天数应该是 ${FACTS.studyDayDone}，实际 ' + stats[0]);
  if (stats[1] !== '${FACTS.studyDayDone}') problems.push('最长记录应该是 ${FACTS.studyDayDone}，实际 ' + stats[1]);
  if (stats[2] !== '${FACTS.studyRate}%') problems.push('完成率应该是 ${FACTS.studyRate}%，实际 ' + stats[2]);
  if (stats[3] !== '${FACTS.daysLeft}') problems.push('距考试应该是 ${FACTS.daysLeft} 天，实际 ' + stats[3]);
  if (info.cells !== 14) problems.push('近日条应该有 14 格，实际 ' + info.cells);
  if (info.doneCells !== ${FACTS.studyDayDone}) problems.push('近日条里应该有 ${FACTS.studyDayDone} 个实心格，实际 ' + info.doneCells);
  if (info.bookRows !== ${FACTS.studyBook}) problems.push('错词本列表应该有 ${FACTS.studyBook} 行，实际 ' + info.bookRows);
  if (!info.bookHeading) problems.push('错词本标题里的数量不对');
  if (!info.listenHeading) problems.push('精听那一段没写上「做过 ${FACTS.listenClipsDone} / 9 篇」');
  if (info.listenWordRows !== ${FACTS.listenUnknown}) problems.push('听力生词应该有 ${FACTS.listenUnknown} 个，实际 ' + info.listenWordRows);
  if (!/认识但没听出来/.test(document.body.innerText)) problems.push('进度页没有「认识但没听出来」这一类');
  if (!/不显示正确率|不是听写正确率/.test(document.body.innerText)) problems.push('进度页没说明为什么不显示正确率');
  if (!/短读读过 ${FACTS.readingsDone} \\/ 6 篇/.test(document.body.innerText)) {
    problems.push('进度页没写「短读读过 ${FACTS.readingsDone} / 6 篇」');
  }
  return { info, problems };
})()`

const TESTS = {
  STUDY_NEW: STUDY_NEW_TEST,
  STUDY_REVIEW: STUDY_REVIEW_TEST,
  STUDY_BOOK: STUDY_BOOK_TEST,
  LISTEN_LIST: LISTEN_LIST_TEST,
  LISTEN_FLOW: LISTEN_FLOW_TEST,
  LISTEN_RELISTEN: LISTEN_RELISTEN_TEST,
  READ_LIST: READ_LIST_TEST,
  READ_FLOW: READ_FLOW_TEST,
  PROGRESS: PROGRESS_TEST,
  PROBE: PROBE_TEST,
  PROBE_DONE: PROBE_DONE_TEST,
  WORDS: WORDS_TEST,
  WORDS_UNKNOWN: WORDS_UNKNOWN_TEST,
  INDEX: INDEX_TEST,
  TODAY: TODAY_TEST,
  TODAY_LIGHT: TODAY_LIGHT_TEST,
  ABOUT: ABOUT_TEST,
}

// ---------- 通过 CDP 遥控浏览器 ----------

async function connect(target) {
  const ws = new WebSocket(target)
  let seq = 0
  const pending = new Map()
  const logs = []
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
      return
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails
      logs.push('异常：' + String(d.exception?.description || d.text || '').split('\n')[0].slice(0, 160))
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      logs.push('console.error：' + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 160))
    }
  })
  await new Promise((res) => ws.addEventListener('open', res, { once: true }))
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq
      pending.set(id, (m) => (m.error ? reject(new Error(method + ' ' + JSON.stringify(m.error))) : resolve(m.result)))
      ws.send(JSON.stringify({ id, method, params }))
    })
  return { ws, send, logs }
}

async function evaluate(send, expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) {
    throw new Error('页面里报错：' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text || '').split('\n')[0])
  }
  return r.result.value
}

async function run() {
  const problems = []
  const report = []
  let shots = 0

  for (const page of RUN_PAGES) {
    const file = path.join(ROOT, page.file)
    if (!LIVE && !fs.existsSync(file)) {
      problems.push(page.file + ' 不存在')
      continue
    }
    for (const vp of VIEWPORTS) {
      const created = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
      const { send, logs } = await connect(created.webSocketDebuggerUrl)
      try {
        await send('Page.enable')
        await send('Runtime.enable')
        await send('Emulation.setDeviceMetricsOverride', {
          width: vp.w,
          height: vp.h,
          deviceScaleFactor: 1,
          mobile: vp.w < 700,
        })

        const url = LIVE ? `${LIVE}/${page.file}${page.hash || ''}` : pathToFileURL(file).href + (page.hash || '')
        await send('Page.navigate', { url })
        await sleep(900)

        // 每个用例都从干净的进度开始；要验「扫完 / 学了一阵」的用例，先塞一份假进度再刷新
        await evaluate(send, seedScript(page.seed || 'none'))
        await send('Page.reload')
        await sleep(900)

        const geo = (await evaluate(send, GEOMETRY)) || {}
        report.push(
          `${page.name}/${vp.label}: 溢出 ${geo.hOverflow}px · 高度 ${geo.pageHeight} · 词表${geo.dataLoaded ? '已' : '未'}加载 · 进度${geo.storageLen}字节\n      「${geo.text}」`
        )
        if (geo.hOverflow > 0) problems.push(`${page.name}/${vp.label} 横向溢出 ${geo.hOverflow}px`)
        if (geo.hOffenders && geo.hOffenders.length) problems.push(`${page.name}/${vp.label} 元素越界：${geo.hOffenders.join(' ')}`)
        if (page.needsData !== false && !geo.dataLoaded) {
          problems.push(`${page.name}/${vp.label} 词表数据没加载（data/words-core.js 可能还没生成）`)
        }

        const test = TESTS[page.test]
        if (test) {
          const val = (await evaluate(send, test)) || { info: {}, problems: ['检测脚本没有返回值'] }
          report.push('  └ ' + JSON.stringify(val.info))
          val.problems.forEach((p) => problems.push(`${page.name}/${vp.label} ${p}`))
        }

        if (WANT_SHOTS) {
          fs.mkdirSync(OUT, { recursive: true })
          const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
          fs.writeFileSync(path.join(OUT, `${page.name}-${vp.label}.png`), Buffer.from(shot.data, 'base64'))
          shots++
        }
      } catch (e) {
        problems.push(`${page.name}/${vp.label} 探测失败：${e.message}`)
      } finally {
        // 页面里的报错不管测试有没有跑完都要报出来
        logs.forEach((l) => problems.push(`${page.name}/${vp.label} ${l}`))
        try {
          await fetch(`${CDP}/json/close/${created.id}`)
        } catch {
          /* 关不掉就算了 */
        }
      }
    }
  }

  console.log('渲染自检：')
  console.log('  目标：' + (LIVE || '本地文件（file://）'))
  report.forEach((r) => console.log('  ' + r))
  if (WANT_SHOTS) console.log(`\n截图 ${shots} 张 → ${OUT}`)

  if (problems.length) {
    console.log('\n问题：')
    problems.forEach((p) => console.log('  ✗ ' + p))
    return 1
  }
  console.log('\n渲染自检通过 ✓')
  return 0
}

let code = 1
try {
  code = await run()
} catch (e) {
  console.error('自检本身出错：', e)
} finally {
  child.kill()
  await sleep(300)
  try {
    fs.rmSync(profile, { recursive: true, force: true })
  } catch {
    /* Windows 上偶尔删不掉，不影响结果 */
  }
}
process.exit(code)
