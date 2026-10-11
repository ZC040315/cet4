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

// ---------- 造一份「摸底已扫完」的假进度，用来验证首页和词表的结果态 ----------

function loadWords() {
  const src = fs.readFileSync(path.join(ROOT, 'data', 'words-core.js'), 'utf8')
  const sandbox = { window: {} }
  vm.createContext(sandbox)
  vm.runInContext(src, sandbox, { filename: 'data/words-core.js' })
  return sandbox.window.CET4_WORDS_CORE.words
}

function seedStore() {
  const words = loadWords()
  const answers = {}
  words.forEach((w, i) => {
    answers[w.w] = i % 5 === 0 ? 0 : 1 // 五分之一标「不认识」
  })
  return {
    probe: {
      core: {
        answers,
        cursor: words.length,
        startedAt: '2026-10-11T10:00:00.000Z',
        updatedAt: '2026-10-11T11:00:00.000Z',
        doneAt: '2026-10-11T11:00:00.000Z',
      },
    },
    plan: null,
    settings: { theme: '' },
  }
}

const SEEDED = seedStore()
const SEED = JSON.stringify(SEEDED)
const SEEDED_UNKNOWN = Object.values(SEEDED.probe.core.answers).filter((v) => v === 0).length

const PAGES = [
  { file: 'index.html', name: 'index', test: 'INDEX' },
  { file: 'index.html', name: 'index-done', test: 'INDEX_DONE', seed: true },
  { file: 'probe.html', name: 'probe', test: 'PROBE' },
  { file: 'words.html', name: 'words', test: 'WORDS' },
  { file: 'words.html', name: 'words-unknown', test: 'WORDS_UNKNOWN', seed: true, hash: '?mark=0' },
  { file: 'about.html', name: 'about', test: 'ABOUT', needsData: false },
]

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
  if (info.unknownRows !== ${SEEDED_UNKNOWN}) problems.push('带进度进「不认识」应该有 ${SEEDED_UNKNOWN} 个，实际 ' + info.unknownRows);
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
  if (!info.exportButton || !info.importButton) problems.push('说明页缺导出 / 导入按钮');
  if (json.length < 20) problems.push('导出的 JSON 是空的');
  if (!info.roundTrip) problems.push('导出的 JSON 不能再导入回来');
  if (!info.rejectsGarbage) problems.push('导入乱文件时没有报错');
  if (!info.hasReset) problems.push('说明页缺「清空摸底记录」');
  return { info, problems };
})()`

// 首页：没扫过的时候只说一件事 —— 去摸底
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

// 首页：扫完之后给出「每天背多少」和四档对照
const INDEX_DONE_TEST = `(() => {
  const problems = [];
  const info = {};
  const text = document.body.innerText;
  info.says = text.split('\\n').filter(Boolean).slice(0, 6).join(' / ');
  info.hasResult = /摸底结果/.test(text);
  const m = text.match(/每天背 (\\d+) 个新词/);
  info.perDay = m ? Number(m[1]) : null;
  info.tableRows = document.querySelectorAll('.table tbody tr').length;
  info.hereRow = document.querySelectorAll('.table tbody tr[data-here]').length;
  if (!info.hasResult) problems.push('扫完之后首页没有显示「摸底结果」');
  if (!info.perDay) problems.push('首页没算出「每天背 N 个新词」');
  if (info.tableRows !== 4) problems.push('四档表应该有 4 行，实际 ' + info.tableRows);
  if (info.hereRow !== 1) problems.push('四档表里应该正好标出一个「你在这」，实际 ' + info.hereRow);
  return { info, problems };
})()`

const TESTS = {
  PROBE: PROBE_TEST,
  WORDS: WORDS_TEST,
  WORDS_UNKNOWN: WORDS_UNKNOWN_TEST,
  INDEX: INDEX_TEST,
  INDEX_DONE: INDEX_DONE_TEST,
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
  const r = await send('Runtime.evaluate', { expression, returnByValue: true })
  if (r.exceptionDetails) {
    throw new Error('页面里报错：' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text || '').split('\n')[0])
  }
  return r.result.value
}

async function run() {
  const problems = []
  const report = []
  let shots = 0

  for (const page of PAGES) {
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

        // 每个用例都从干净的进度开始；要验「扫过之后」的用例，先塞一份假进度再刷新
        await evaluate(
          send,
          page.seed
            ? `localStorage.setItem('cet4.v1', ${JSON.stringify(SEED)}); 'seeded'`
            : `localStorage.clear(); 'cleared'`
        )
        await send('Page.reload')
        await sleep(900)

        const geo = (await evaluate(send, GEOMETRY)) || {}
        report.push(
          `${page.name}/${vp.label}: 溢出 ${geo.hOverflow}px · 高度 ${geo.pageHeight} · 词表${geo.dataLoaded ? '已' : '未'}加载`
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

        logs.forEach((l) => problems.push(`${page.name}/${vp.label} ${l}`))

        if (WANT_SHOTS) {
          fs.mkdirSync(OUT, { recursive: true })
          const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
          fs.writeFileSync(path.join(OUT, `${page.name}-${vp.label}.png`), Buffer.from(shot.data, 'base64'))
          shots++
        }
      } catch (e) {
        problems.push(`${page.name}/${vp.label} 探测失败：${e.message}`)
      } finally {
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
