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
