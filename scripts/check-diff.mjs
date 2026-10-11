// 过线 · 听写对照的逻辑自检
//
// 用法：node scripts/check-diff.mjs
//
// assets/diff.js 是纯计算（不碰 DOM、不碰 localStorage），所以可以直接当函数验。
// 这里要挡住的是「对照结果算错了」这类问题：少写一个词会不会把后面整句判错、
// 多写的词有没有认出来、标点大小写算不算错、哪些词不该进统计。

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const ROOT = path.resolve(import.meta.dirname, '..')
const sandbox = { window: {}, console }
vm.createContext(sandbox)
for (const file of ['assets/diff.js', 'data/listening.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file })
}
const TXT = sandbox.window.CET4_TEXT
const CLIPS = sandbox.window.CET4_LISTENING.clips

const problems = []
let checks = 0

function eq(actual, expected, what) {
  checks++
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) problems.push(what + '：期望 ' + b + '，实际 ' + a)
}

/* ---------- 归一化 ---------- */

eq(TXT.normalize('The Library.  Stay OPEN!'), 'the library stay open', '忽略大小写和标点')
eq(TXT.normalize('I don’t know'), "i don't know", '把弯引号统一成直引号')
eq(TXT.normalize('   a   b  '), 'a b', '压掉多余空白')
eq(TXT.words('four-week trial'), ['four-week', 'trial'], '连字符算一个词')
eq(TXT.words(''), [], '空文本没有词')
eq(TXT.words(null), [], 'null 也不炸')

/* ---------- 切词片段：标点要留住，词的下标要和 words() 对上 ---------- */

const tk = TXT.tokens('Hello, world!')
eq(tk.map((t) => t.text), ['Hello', ', ', 'world', '!'], '标点原样保留')
eq(tk.filter((t) => t.isWord).map((t) => t.index), [0, 1], '词片段带正确下标')

/* ---------- 逐词对照 ---------- */

const exact = TXT.compare('The library will stay open until midnight.', 'The library will stay open until midnight')
eq([exact.hit, exact.miss, exact.extra.length], [7, 0, 0], '一模一样：全中、没有多余')
eq(exact.similarity, 1, '一模一样：相似度 1')

const punct = TXT.compare('Hello, world!', 'hello world')
eq([punct.hit, punct.miss], [2, 0], '标点和大小写不算错')

const missing = TXT.compare('I can not find mine today', 'I can not find today')
eq(missing.marks, ['hit', 'hit', 'hit', 'hit', 'miss', 'hit'], '少写一个词：只有那个词判错')
eq(missing.miss, 1, '少写一个词：只扣一个')

const extra = TXT.compare('I left them in the classroom', 'I left them there in the classroom')
eq(extra.hit, 6, '多写一个词：原文的词还都是对的')
eq(extra.extra, ['there'], '多写的词被单独列出来')

const reordered = TXT.compare('the cat and the dog', 'the dog and the cat')
// 听写里词序错了就是错了：the / and / the 三个对得上，两个名词一个算漏、一个算多写
eq(reordered.hit, 3, '换了顺序：公共部分认出来，剩下的算一漏一多')
eq([reordered.miss, reordered.extra.length], [2, 2], '换了顺序：漏两个、多两个')

const empty = TXT.compare('This sentence has five words', '')
eq([empty.hit, empty.miss, empty.similarity], [0, 5, 0], '一个字没写：全判没听出来')

eq(TXT.compare('one yuan instead of two', 'one yuan instead of 2').miss, 1, '数字写法不同算没听出来（故意这么严）')

/* ---------- 原句加标记：标点不丢 ---------- */

const marked = TXT.markedTokens('Hello, world!', ['hit', 'miss'])
eq(marked.map((t) => t.text).join(''), 'Hello, world!', '加标记之后原句一个字符都没变')
eq(marked.filter((t) => t.isWord).map((t) => t.mark), ['hit', 'miss'], '标记落在词上')

/* ---------- 功能词不算进统计 ---------- */

eq(TXT.isFunction('the'), true, 'the 是功能词')
eq(TXT.isFunction('Of'), true, '功能词判断忽略大小写')
eq(TXT.isFunction('library'), false, '实词不是功能词')

const split = TXT.splitMissed(['miss', 'miss', 'miss', 'hit'], ['the', 'library', 'of', 'open'])
eq(split.content, ['library'], '实词进统计')
eq(split.functionWord, ['the', 'of'], '虚词单独列，不进统计')

const dup = TXT.splitMissed(['miss', 'miss'], ['sleep', 'sleep'])
eq(dup.content, ['sleep'], '同一个词漏两次只算一个')

/* ---------- 整篇对照 ---------- */

const sentences = ['The library is open.', 'Students asked for longer hours.']
const clipResult = TXT.compareClip(sentences, ['The library open', 'Students for longer hours'])
eq(clipResult.total, 9, '整篇：原文总词数')
eq(clipResult.perSentence.length, 2, '整篇：逐句都有结果')
eq(clipResult.hit, 7, '整篇：命中数')
eq(clipResult.missed, ['is', 'asked'], '整篇：漏掉的词去重后按出现顺序')
eq(clipResult.content.content, ['asked'], '整篇：实词才进分类')
eq(clipResult.content.functionWord, ['is'], '整篇：虚词单独列')

const perfect = TXT.compareClip(sentences, sentences)
eq([perfect.hit, perfect.total, perfect.missed.length], [9, 9, 0], '整篇全对')

/* ---------- 精听材料本身 ---------- */

eq(CLIPS.length, sandbox.window.CET4_LISTENING.meta.count, 'meta.count 和实际篇数一致')
eq(CLIPS.filter((c) => c.type === 'passage').length, 3, '听力篇章（分值最高）放了三篇')
eq([...new Set(CLIPS.map((c) => c.type))].sort(), ['conversation', 'news', 'passage'], '三种类型都有')

let sentTotal = 0
CLIPS.forEach((c) => {
  sentTotal += c.sentences.length
  if (!c.id || !c.title || !c.gist || !c.focus) problems.push(c.id + ' 缺字段')
  if (!c.sentences.length) problems.push(c.id + ' 没有句子')
  c.sentences.forEach((s, i) => {
    if (!/[.!?]$/.test(s.trim())) problems.push(c.id + ' 有句子结尾没标点：' + s)
    if (!/^[A-Z]/.test(s.trim())) problems.push(c.id + ' 有句子没大写开头：' + s)
    if (i && s.trim() === c.sentences[i - 1].trim()) problems.push(c.id + ' 有重复句子')
  })
  checks += 1
})

// 自产材料里不该出现「这是真题」这类说法
const raw = fs.readFileSync(path.join(ROOT, 'data', 'listening.js'), 'utf8')
eq(/真题原文|历届真题|考试原题/.test(raw), false, '材料里没有「这是真题」这类说法')

/* ---------- 结果 ---------- */

console.log('听写对照自检：跑了 ' + checks + ' 条断言')
console.log('精听材料：' + CLIPS.length + ' 篇 · ' + sentTotal + ' 句')
if (problems.length) {
  console.log('')
  console.log('问题：')
  problems.forEach((p) => console.log('  ✗ ' + p))
  process.exit(1)
}
console.log('')
console.log('听写对照自检通过 ✓')
