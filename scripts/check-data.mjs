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
