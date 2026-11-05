// 过线 · 数据自检
//
// 用法：node scripts/check-data.mjs
//
// 这个脚本只看数据，不看页面。它要挡住的是「词表坏了但页面还是画出来了」这类问题：
// 缺字段、重复词、主干词和叶子词重叠、词频顺序乱了、释义里混进奇怪东西。
// 页面是不是真的能渲染、能点，交给 scripts/render-check.mjs。

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const ROOT = path.resolve(import.meta.dirname, '..')

function load(file, globalName) {
  const abs = path.join(ROOT, file)
  if (!fs.existsSync(abs)) {
    throw new Error('缺文件：' + file + '（跑 node scripts/fetch-words.mjs 生成）')
  }
  const src = fs.readFileSync(abs, 'utf8')
  const sandbox = { window: {} }
  vm.createContext(sandbox)
  vm.runInContext(src, sandbox, { filename: file })
  const data = sandbox.window[globalName]
  if (!data) throw new Error(file + ' 里没有 window.' + globalName)
  return data
}

const errors = []
const warns = []
const WORD_RE = /^[a-z][a-z'’-]*$/

function checkTable(data, file, expectTitle) {
  const meta = data.meta || {}
  const words = data.words || []
  if (meta.title !== expectTitle) errors.push(file + ' 的 meta.title 应该是「' + expectTitle + '」')
  for (const f of ['count', 'generated', 'source', 'note']) {
    if (!meta[f]) errors.push(file + ' 的 meta 缺字段：' + f)
  }
  if (meta.count !== words.length) {
    errors.push(file + ' 的 meta.count=' + meta.count + '，实际有 ' + words.length + ' 个词')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(meta.generated || ''))) {
    warns.push(file + ' 的 meta.generated 不是 YYYY-MM-DD：' + meta.generated)
  }

  const seen = new Set()
  let prevRank = 0 // 词频数字越小越高频，所以顺序应该是「不下降」的
  words.forEach((w, i) => {
    const where = file + ' 第 ' + (i + 1) + ' 条（' + (w && w.w) + '）'
    if (!w || typeof w !== 'object') {
      errors.push(where + ' 不是一个对象')
      return
    }
    if (!WORD_RE.test(String(w.w || ''))) errors.push(where + ' 的 w 不是规范的英文单词')
    if (!w.zh || !String(w.zh).trim()) errors.push(where + ' 没有中文释义')
    if (String(w.zh || '').length > 120) warns.push(where + ' 的释义很长（' + String(w.zh).length + ' 字），摘一小段更好看')
    if (/[\u4e00-\u9fa5]/.test(String(w.ph || ''))) errors.push(where + ' 的音标里混进了中文')
    if (typeof w.f !== 'number' || typeof w.b !== 'number') errors.push(where + ' 的 f / b 词频字段不是数字')
    if (seen.has(w.w)) errors.push(where + ' 是重复词')
    seen.add(w.w)

    // 词频顺序必须单调不乱：生成时排过序，乱了说明中间被人手改过。
    // 排序键和 fetch-words.mjs 里的 rankOf 保持一致（两个语料库取更好的那个）。
    const rank = w.f && w.b ? Math.min(w.f, w.b) : w.f || w.b || Infinity
    if (rank < prevRank - 0.5) {
      warns.push(where + ' 的词频顺序比前一个词高，词表可能被手改过')
    }
    prevRank = rank
  })
  return seen
}

let core = null
let leaf = null
try {
  core = load('data/words-core.js', 'CET4_WORDS_CORE')
} catch (e) {
  errors.push(e.message)
}
try {
  leaf = load('data/words-leaf.js', 'CET4_WORDS_LEAF')
} catch (e) {
  errors.push(e.message)
}

if (core) {
  const coreWords = checkTable(core, 'data/words-core.js', '主干词')
  if (leaf) {
    const leafWords = checkTable(leaf, 'data/words-leaf.js', '叶子词')
    for (const w of leafWords) {
      if (coreWords.has(w)) errors.push('「' + w + '」同时出现在主干词和叶子词里')
    }
  }
  const target = 1500
  if (core.words.length !== target) {
    warns.push('主干词有 ' + core.words.length + ' 个，规划书第十一节按 1500 个设计（一天扫 500，三天扫完）')
  }
  if (core.words.length % 500 !== 0) {
    warns.push('主干词 ' + core.words.length + ' 个不是 500 的整数倍，摸底最后一组会不满额')
  }
}

/* ---------- 短读材料 ---------- */
// 规划书第四节第 4 条：100–150 词 + 标注生词 + 一句中文说明。
// 生词只标词不写释义，释义一律从词表查 —— 所以这里必须在词表里查得到，
// 而且必须真的出现在正文里（标了个正文里没有的词，页面上就会有一个点不开的坑）。

const WORD_RE_LOOSE = /[A-Za-z][A-Za-z'’-]*/g

function tokensOf(text) {
  return (String(text).toLowerCase().match(WORD_RE_LOOSE) || []).filter(Boolean)
}

let readings = null
try {
  readings = load('data/readings.js', 'CET4_READINGS')
} catch (e) {
  errors.push(e.message)
}

if (readings && core && leaf) {
  const vocab = new Set()
  ;[...core.words, ...leaf.words].forEach((w) => vocab.add(w.w))

  const meta = readings.meta || {}
  const list = readings.readings || []
  if (meta.count !== list.length) errors.push('data/readings.js 的 meta.count=' + meta.count + '，实际 ' + list.length + ' 篇')
  if (!meta.source) errors.push('短读数据缺 meta.source')

  const seenIds = new Set()
  let wordsTotal = 0
  list.forEach((r, i) => {
    const where = '短读 ' + (r.id || '第 ' + (i + 1) + ' 篇')
    if (!r.id || !r.title || !r.gist || !r.topic) errors.push(where + ' 缺字段（id/title/gist/topic）')
    if (seenIds.has(r.id)) errors.push(where + ' 的 id 重复')
    seenIds.add(r.id)
    if (!(r.level >= 1 && r.level <= 3)) errors.push(where + ' 的 level 应该是 1–3')
    const paras = r.paras || []
    if (paras.length < 2) errors.push(where + ' 至少要两段')
    const text = paras.join(' ')
    const count = tokensOf(text).length
    wordsTotal += count
    if (count < 100 || count > 150) {
      errors.push(where + ' 正文 ' + count + ' 词，规划书要求 100–150 词')
    }
    const inText = new Set(tokensOf(text))
    const marked = r.words || []
    if (!marked.length) errors.push(where + ' 没有标注生词')
    if (marked.length > 8) warns.push(where + ' 标了 ' + marked.length + ' 个生词，一屏里太多会变成负担')
    marked.forEach((w) => {
      const key = String(w).toLowerCase()
      if (!inText.has(key)) errors.push(where + ' 标注的生词「' + w + '」在正文里没有出现')
      if (!vocab.has(key)) errors.push(where + ' 标注的生词「' + w + '」在四级词表里查不到释义，页面上会点不开')
    })
    if (/\u2014/.test(text)) warns.push(where + ' 正文里有破折号，朗读/排版上容易被当成断句')
  })
  console.log('短读 ' + list.length + ' 篇 · 合计 ' + wordsTotal + ' 词')
}

/* ---------- 精读材料 ---------- */
// 精读比短读多四样东西：段落译文、长难句拆解、理解题、更长的正文。
// 校验重点不是「看起来对不对」，而是页面上真的点得开、答得出来：
// 标注生词必须在词表里且在正文里；长难句的英文必须能在正文里原样找到；
// 每道题必须正好四个选项、答案在范围内、正确项只有一个。

let intensive = null
try {
  intensive = load('data/intensive.js', 'CET4_INTENSIVE')
} catch (e) {
  errors.push(e.message)
}

if (intensive && core && leaf) {
  const vocab = new Set()
  ;[...core.words, ...leaf.words].forEach((w) => vocab.add(w.w))

  const meta = intensive.meta || {}
  const list = intensive.articles || []
  if (meta.count !== list.length) errors.push('data/intensive.js 的 meta.count=' + meta.count + '，实际 ' + list.length + ' 篇')
  if (!meta.source) errors.push('精读数据缺 meta.source')

  const seenIds = new Set()
  let wordsTotal = 0
  list.forEach((a, i) => {
    const where = '精读 ' + (a.id || '第 ' + (i + 1) + ' 篇')
    if (!a.id || !a.title || !a.gist || !a.topic) errors.push(where + ' 缺字段（id/title/gist/topic）')
    if (seenIds.has(a.id)) errors.push(where + ' 的 id 重复')
    seenIds.add(a.id)
    if (!(a.level >= 1 && a.level <= 3)) errors.push(where + ' 的 level 应该是 1–3')

    const paras = a.paras || []
    if (paras.length < 4) errors.push(where + ' 至少要四段（精读要比短读长）')
    const en = []
    paras.forEach((p, j) => {
      if (!p || typeof p !== 'object' || !p.en || !p.zh) {
        errors.push(where + ' 第 ' + (j + 1) + ' 段缺 en 或 zh（精读每段都要有译文）')
        return
      }
      if (/[\u4e00-\u9fa5]/.test(p.en)) errors.push(where + ' 第 ' + (j + 1) + ' 段的 en 里有中文')
      if (!/[\u4e00-\u9fa5]/.test(p.zh)) errors.push(where + ' 第 ' + (j + 1) + ' 段的 zh 里没有中文')
      en.push(p.en)
    })
    const text = en.join(' ')
    const count = tokensOf(text).length
    wordsTotal += count
    if (count < 220 || count > 420) {
      errors.push(where + ' 正文 ' + count + ' 词，精读按 220–420 词设计（短读是 100–150）')
    }

    const inText = new Set(tokensOf(text))
    const marked = a.words || []
    if (!marked.length) errors.push(where + ' 没有标注生词')
    if (marked.length > 8) warns.push(where + ' 标了 ' + marked.length + ' 个生词，一屏里太多会变成负担')
    marked.forEach((w) => {
      const key = String(w).toLowerCase()
      if (!inText.has(key)) errors.push(where + ' 标注的生词「' + w + '」在正文里没有出现')
      if (!vocab.has(key)) errors.push(where + ' 标注的生词「' + w + '」在四级词表里查不到释义，页面上会点不开')
    })

    const sents = a.sentences || []
    if (sents.length < 3) errors.push(where + ' 至少要拆三句长难句')
    sents.forEach((s, j) => {
      if (!s || !s.en) errors.push(where + ' 第 ' + (j + 1) + ' 个长难句缺 en')
      else if (!text.includes(s.en)) {
        errors.push(where + ' 第 ' + (j + 1) + ' 个长难句的英文在正文里找不到（改正文时把句子改坏了？）')
      }
      if (!s || !s.note || !s.zh) errors.push(where + ' 第 ' + (j + 1) + ' 个长难句缺 note 或 zh')
    })

    const qs = a.questions || []
    if (qs.length < 2) errors.push(where + ' 至少要两道理解题')
    const answers = new Set()
    qs.forEach((q, j) => {
      const qw = where + ' 第 ' + (j + 1) + ' 题'
      if (!q || !q.q) errors.push(qw + ' 缺题干')
      const opts = (q && q.options) || []
      if (opts.length !== 4) errors.push(qw + ' 应该有 4 个选项，现在是 ' + opts.length + ' 个')
      if (new Set(opts.map((o) => String(o))).size !== opts.length) errors.push(qw + ' 有两个一模一样的选项')
      opts.forEach((o, k) => {
        if (!String(o || '').trim()) errors.push(qw + ' 的第 ' + (k + 1) + ' 个选项是空的')
      })
      if (!(q && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < opts.length)) {
        errors.push(qw + ' 的 answer 不是 0–3 的整数（现在 ' + (q && q.answer) + '）')
      } else {
        answers.add(q.answer)
      }
      if (!q || !q.explain) errors.push(qw + ' 缺 explain（对答案时页面上要显示为什么）')
    })
    if (answers.size < 2 && qs.length > 1) warns.push(where + ' 所有题的正确答案都在同一个位置，猜一下就能全对')

    if (/\u2014/.test(text)) warns.push(where + ' 正文里有破折号，朗读/排版上容易被当成断句')
  })
  console.log('精读 ' + list.length + ' 篇 · 合计 ' + wordsTotal + ' 词')
}

/* ---------- 音标 ---------- */
// 音标是「教」的内容，错一个音标就是教错一个音，所以这里查得比别处严：
// 例词必须在词表里（否则点不出释义、也听不到熟悉的词）；
// 例词的注音必须真的含有这个音（用 48 个符号贪心切分，切不开就报错）；
// 干扰项必须真的不含这个音（否则那一道题有两个正确答案）。

let phon = null
try {
  phon = load('data/phonetics.js', 'CET4_PHON')
} catch (e) {
  errors.push(e.message)
}

if (phon && core && leaf) {
  const vocab = new Set()
  ;[...core.words, ...leaf.words].forEach((w) => vocab.add(w.w))

  const meta = phon.meta || {}
  const symbols = meta.symbols || []
  const groups = phon.groups || []
  const list = phon.phonemes || []
  // 和 data/phonetics.js 里的 type 一一对应：单元音、双元音、爆破、摩擦、破擦、鼻音、舌侧、半元音
  const TYPES = ['vowel', 'dip', 'stop', 'fric', 'aff', 'nasal', 'lat', 'semiv']

  if (meta.count !== list.length) errors.push('data/phonetics.js 的 meta.count=' + meta.count + '，实际 ' + list.length + ' 个')
  if (!meta.source) errors.push('音标数据缺 meta.source')
  if (symbols.length !== list.length) errors.push('meta.symbols 有 ' + symbols.length + ' 个，音标有 ' + list.length + ' 个')
  if (new Set(symbols).size !== symbols.length) errors.push('meta.symbols 里有重复的符号')

  // 贪心切分：长的符号优先（tʃ、iː 这种两个字符的必须整体匹配）
  const sorted = symbols.slice().sort((a, b) => b.length - a.length)
  function tokens(ipa) {
    const s = String(ipa || '').replace(/[ˈˌ.]/g, '')
    const out = []
    let i = 0
    while (i < s.length) {
      let hit = ''
      for (const sym of sorted) {
        if (s.startsWith(sym, i)) { hit = sym; break }
      }
      if (!hit) return null
      out.push(hit)
      i += hit.length
    }
    return out
  }

  const seenIds = new Set()
  const seenSyms = new Set()
  list.forEach((p, i) => {
    const where = '音标 ' + (p && p.id ? p.id : '第 ' + (i + 1) + ' 个')
    if (!p || !p.id || !p.sym || !p.name) { errors.push(where + ' 缺字段（id/sym/name）'); return }
    if (seenIds.has(p.id)) errors.push(where + ' 的 id 重复')
    seenIds.add(p.id)
    if (seenSyms.has(p.sym)) errors.push(where + ' 的 sym 重复：' + p.sym)
    seenSyms.add(p.sym)
    if (symbols.indexOf(p.sym) < 0) errors.push(where + ' 的 sym 不在 meta.symbols 里：' + p.sym)
    if (TYPES.indexOf(p.type) < 0) errors.push(where + ' 的 type 不在允许的取值里：' + p.type)

    const tips = p.tip || []
    if (tips.length < 2) errors.push(where + ' 至少要两条发音要点')
    tips.forEach((t, k) => { if (!String(t || '').trim()) errors.push(where + ' 的第 ' + (k + 1) + ' 条要点是空的') })

    const ex = p.ex || []
    if (ex.length !== 3) errors.push(where + ' 应该有 3 个例词，现在 ' + ex.length + ' 个')
    ex.forEach((e, k) => {
      const ew = where + ' 的第 ' + (k + 1) + ' 个例词'
      if (!e || !e.w || !e.ipa) { errors.push(ew + ' 缺 w 或 ipa'); return }
      if (!vocab.has(e.w)) errors.push(ew + '（' + e.w + '）不在四级词表里，页面上点不出释义')
      const tk = tokens(e.ipa)
      if (!tk) errors.push(ew + ' 的注音切不开（有不在 48 符号表里的字符）：' + e.ipa)
      else if (tk.indexOf(p.sym) < 0) errors.push(ew + ' 的注音里没有 ' + p.sym + '：' + e.ipa)
    })

    const c = p.contrast || {}
    if (!c.id) errors.push(where + ' 缺 contrast.id（最容易混的那个音）')
    else if (c.id === p.id) errors.push(where + ' 的 contrast.id 指向自己')
    if (!c.note) errors.push(where + ' 缺 contrast.note')

    const dis = p.distract || []
    if (dis.length !== 3) errors.push(where + ' 应该有 3 个干扰项，现在 ' + dis.length + ' 个')
    dis.forEach((d, k) => {
      const dw = where + ' 的第 ' + (k + 1) + ' 个干扰项'
      if (!d || !d.w || !d.ipa) { errors.push(dw + ' 缺 w 或 ipa'); return }
      if (!vocab.has(d.w)) errors.push(dw + '（' + d.w + '）不在四级词表里')
      const tk = tokens(d.ipa)
      if (!tk) errors.push(dw + ' 的注音切不开：' + d.ipa)
      else if (tk.indexOf(p.sym) >= 0) errors.push(dw + ' 的注音里含 ' + p.sym + '，那这道题会有两个正确答案')
    })
  })

  // contrast 必须指向真实存在的音标（全部收齐后再查）
  list.forEach((p) => {
    const c = (p && p.contrast) || {}
    if (c.id && !seenIds.has(c.id)) errors.push('音标 ' + p.id + ' 的 contrast.id 不存在：' + c.id)
  })

  // 每个音标必须恰好属于一个组
  const grouped = new Map()
  groups.forEach((g) => {
    const ids = (g && g.ids) || []
    if (!g || !g.id || !g.name) errors.push('音标组缺字段（id/name）')
    if (!ids.length) errors.push('音标组 ' + (g && g.id) + ' 里没有音标')
    ids.forEach((id) => {
      if (grouped.has(id)) errors.push('音标 ' + id + ' 同时出现在组 ' + grouped.get(id) + ' 和 ' + g.id)
      grouped.set(id, g.id)
      if (!seenIds.has(id)) errors.push('音标组 ' + g.id + ' 里的 ' + id + ' 不存在')
    })
  })
  list.forEach((p) => {
    if (p && p.id && !grouped.has(p.id)) errors.push('音标 ' + p.id + ' 不属于任何一组')
  })

  console.log('音标 ' + list.length + ' 个 · ' + groups.length + ' 组')
}

if (core) console.log('主干词 ' + core.words.length + ' 个')
if (leaf) console.log('叶子词 ' + leaf.words.length + ' 个')
if (core && leaf) console.log('合计 ' + (core.words.length + leaf.words.length) + ' 个')

if (warns.length) {
  console.log('')
  console.log('提醒：')
  warns.slice(0, 20).forEach((w) => console.log('  · ' + w))
  if (warns.length > 20) console.log('  · …还有 ' + (warns.length - 20) + ' 条')
}

if (errors.length) {
  console.log('')
  console.log('错误：')
  errors.slice(0, 30).forEach((e) => console.log('  ✗ ' + e))
  if (errors.length > 30) console.log('  ✗ …还有 ' + (errors.length - 30) + ' 条')
  process.exit(1)
}

console.log('')
console.log('数据自检通过 ✓')
