// 过线 · 生成词表数据（主干词 + 叶子词）
//
// 用法：
//   node scripts/fetch-words.mjs              # 先下字典源，再生成 data/words-*.js
//   node scripts/fetch-words.mjs --dry        # 只打印统计，不写文件
//   node scripts/fetch-words.mjs --core=1500  # 改主干词目标数量（默认 1500）
//   node scripts/fetch-words.mjs --source=D:\path\ecdict.csv   # 用本地字典源
//
// 数据来源（规划书第五节「内容来源规则」：词表和释义都标来源，不自己编）：
//   ECDICT —— 开源英汉词典数据库，MIT 许可。https://github.com/skywind3000/ECDICT
//     字段：word 单词 / phonetic 音标 / translation 中文释义 /
//           tag 考试大纲标签（含 cet4 即四级大纲词汇）/ bnc 英国国家语料库词频顺序 /
//           frq 当代语料库词频顺序 / collins 柯林斯星级 / oxford 是否牛津三千核心词。
//     也就是说：哪些词属于四级、每个词的中文释义是什么，都是这份数据里带的；
//     这个脚本只做筛选、去重、排序，不改写任何释义。
//
// 分层规则（规划书第四节第 2 条：主干 = 高频核心，叶子 = 低频生僻）：
//   1. 取出 tag 里带 cet4 的词条；
//   2. 同一个词只留一条（留信息最全的那条）；
//   3. 按词频排序：先比当代语料库顺序 frq，再比 BNC 顺序 bnc，两个都没有的排最后；
//   4. 前 1500 个 = 主干词，其余 = 叶子词。
//      为什么是 1500：规划书第十一节写的是「一天扫 500 个，三天扫完主干词」。

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = /^--([^=]+)=?(.*)$/.exec(a)
    return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true]
  })
)

const CORE_TARGET = Number(args.core || 1500)
const DRY = Boolean(args.dry)
const SOURCE_URLS = [
  'https://ghproxy.net/https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv',
  'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv',
]

// ---------------- 拿字典源 ----------------

function run(curl, argv) {
  const r = spawnSync(curl, argv, { stdio: 'inherit' })
  if (r.error) return r
  return r
}

function download(url, dest) {
  console.log('下载字典源：' + url)
  // 用系统自带 curl：省掉一整个下载库的依赖
  const argv = ['-sS', '-L', '-C', '-', '--max-time', '2400', '-o', dest, url]
  let r = run('curl.exe', argv)
  if (r.error) r = run('curl', argv)
  if (r.error) throw r.error
  if (r.status !== 0) throw new Error('curl 退出码 ' + r.status)
}

function readSource() {
  if (args.source) {
    const p = path.resolve(String(args.source))
    if (!fs.existsSync(p)) throw new Error('找不到 --source 指定的文件：' + p)
    console.log('用本地字典源：' + p)
    return fs.readFileSync(p, 'utf8')
  }
  const cache = path.join(os.tmpdir(), 'cet4-ecdict.csv')
  const cached = fs.existsSync(cache) && fs.statSync(cache).size > 60 * 1024 * 1024
  if (cached) {
    console.log('用已缓存的字典源：' + cache)
  } else {
    let lastErr = null
    for (const url of SOURCE_URLS) {
      try {
        download(url, cache)
        if (fs.existsSync(cache) && fs.statSync(cache).size > 60 * 1024 * 1024) {
          lastErr = null
          break
        }
        lastErr = new Error('下到的文件不完整：' + fs.statSync(cache).size + ' 字节')
      } catch (e) {
        lastErr = e
      }
    }
    if (lastErr) throw lastErr
  }
  return fs.readFileSync(cache, 'utf8')
}

// ---------------- 解析 CSV ----------------
// ECDICT 的释义字段里有换行和逗号，所以必须是正经的 CSV 解析，不能按行切。

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') inQuotes = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') field += ch
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

// ---------------- 加工 ----------------

const WORD_RE = /^[a-z][a-z'’-]*$/

function zhOf(translation) {
  return String(translation || '')
    // ECDICT 把换行写成字面量 "\n"（两个字符），先还原成真换行再按行处理，
    // 否则界面上会原样显示出一个 \n
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('  ')
    .replace(/\s+/g, ' ')
    .trim()
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function rankOf(entry) {
  const frq = num(entry.f)
  const bnc = num(entry.b)
  if (frq && bnc) return Math.min(frq, bnc)
  return frq || bnc || Infinity
}

// 同一个词有好几行时，留信息最全的那行：先看柯林斯星级，再看有没有音标、有没有词频
function better(a, b) {
  const score = (e) => e.c * 100 + (e.ph ? 10 : 0) + (e.f ? 5 : 0) + (e.b ? 5 : 0)
  return score(a) > score(b)
}

function build(csvText) {
  const rows = parseCsv(csvText)
  const head = rows[0].map((h) => h.trim())
  const idx = {}
  head.forEach((h, i) => {
    idx[h] = i
  })
  for (const need of ['word', 'phonetic', 'translation', 'tag', 'bnc', 'frq', 'collins', 'oxford']) {
    if (!(need in idx)) throw new Error('字典源里没有这一列：' + need)
  }

  const byWord = new Map()
  let cet4Rows = 0
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const tag = r[idx.tag] || ''
    if (!/(^|\s)cet4(\s|$)/.test(tag)) continue
    cet4Rows++
    const word = String(r[idx.word] || '')
      .trim()
      .toLowerCase()
    if (!WORD_RE.test(word)) continue // 只收单个词：短语、缩写不进词表
    const zh = zhOf(r[idx.translation])
    if (!zh) continue // 没有中文释义的条目对背单词没用
    const entry = {
      w: word,
      ph: String(r[idx.phonetic] || '').trim(),
      zh,
      c: num(r[idx.collins]),
      ox: /^(1|true|yes)$/i.test(String(r[idx.oxford] || '').trim()) ? 1 : 0,
      f: num(r[idx.frq]),
      b: num(r[idx.bnc]),
    }
    const prev = byWord.get(word)
    if (!prev || better(entry, prev)) byWord.set(word, entry)
  }

  const all = Array.from(byWord.values())
  all.sort((a, b) => rankOf(a) - rankOf(b) || a.w.localeCompare(b.w))
  all.forEach((e, i) => {
    e.rank = i + 1
  })
  return { all, cet4Rows }
}

// ---------------- 写文件 ----------------

function line(e) {
  const parts = ['w:' + JSON.stringify(e.w)]
  if (e.ph) parts.push('ph:' + JSON.stringify(e.ph))
  parts.push('zh:' + JSON.stringify(e.zh))
  if (e.c) parts.push('c:' + e.c)
  if (e.ox) parts.push('ox:1')
  parts.push('f:' + (e.f || 0), 'b:' + (e.b || 0))
  return '  { ' + parts.join(', ') + ' },'
}

function fileText(meta, entries) {
  return (
    '// 过线 · ' + meta.title + '（自动生成，别手改；要改就改 scripts/fetch-words.mjs 再重新生成）\n' +
    '//\n' +
    '// 来源：ECDICT（MIT）https://github.com/skywind3000/ECDICT\n' +
    '//   tag 含 cet4 = 四级大纲词汇；zh 是 ECDICT 里的中文释义原文；\n' +
    '//   f = 当代语料库词频顺序，b = BNC 词频顺序（数字越小越高频）；c = 柯林斯星级；ox = 牛津三千核心词。\n' +
    '// ' + meta.note + '\n' +
    '// 生成时间：' + meta.generated + '\n' +
    '\n' +
    'window.' + meta.global + ' = {\n' +
    '  meta: {\n' +
    '    title: ' + JSON.stringify(meta.title) + ',\n' +
    '    count: ' + entries.length + ',\n' +
    '    generated: ' + JSON.stringify(meta.generated) + ',\n' +
    '    source: ' + JSON.stringify(meta.source) + ',\n' +
    '    note: ' + JSON.stringify(meta.note) + ',\n' +
    '  },\n' +
    '  words: [\n' +
    entries.map(line).join('\n') +
    '\n  ],\n' +
    '};\n'
  )
}

// ---------------- 主流程 ----------------

const csv = readSource()
const { all, cet4Rows } = build(csv)
if (!all.length) throw new Error('一条四级词都没解析出来，检查字典源对不对')
if (all.length < CORE_TARGET) {
  throw new Error('四级词总共只有 ' + all.length + ' 个，装不满 --core=' + CORE_TARGET + ' 个主干词')
}

const core = all.slice(0, CORE_TARGET)
const leaf = all.slice(CORE_TARGET)
const today = new Date().toISOString().slice(0, 10)
const source = 'ECDICT（MIT）· 词频取自当代语料库与 BNC，数字越小越高频'

console.log('字典源里带 cet4 标签的行：' + cet4Rows)
console.log('去重、去掉短语和没释义的之后：' + all.length + ' 个词')
console.log('主干词 ' + core.length + ' 个（词频前 ' + CORE_TARGET + '）')
console.log('叶子词 ' + leaf.length + ' 个（剩下的低频、生僻词）')
console.log('主干词开头 12 个：' + core.slice(0, 12).map((e) => e.w).join(' '))
console.log('主干词末尾 12 个：' + core.slice(-12).map((e) => e.w).join(' '))
console.log('叶子词开头 12 个：' + leaf.slice(0, 12).map((e) => e.w).join(' '))

if (DRY) {
  console.log('')
  console.log('--dry：只统计，不写文件。')
} else {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(
    path.join(DATA_DIR, 'words-core.js'),
    fileText(
      {
        title: '主干词',
        global: 'CET4_WORDS_CORE',
        generated: today,
        source,
        note: '主干词：四级大纲词汇里词频最高的一档，撑起阅读理解的大部分。先背完这一档。',
      },
      core
    )
  )
  fs.writeFileSync(
    path.join(DATA_DIR, 'words-leaf.js'),
    fileText(
      {
        title: '叶子词',
        global: 'CET4_WORDS_LEAF',
        generated: today,
        source,
        note: '叶子词：四级大纲里剩下的低频、生僻词。看一眼就过，不背；做题遇到再回来查。',
      },
      leaf
    )
  )
  console.log('')
  console.log('写好 data/words-core.js 和 data/words-leaf.js')
}
