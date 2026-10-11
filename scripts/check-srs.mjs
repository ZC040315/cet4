// 过线 · 间隔重复的逻辑自检
//
// 用法：node scripts/check-srs.mjs
//
// assets/srs.js 和 assets/plan.js 都是纯计算，不碰 DOM、不碰 localStorage，
// 所以可以在这里当成普通函数直接验：盒号怎么走、什么时候进错词本、
// 什么时候出错词本、连续天数怎么算、「每天背多少」推出来对不对。
// 页面是不是真的能点，交给 scripts/render-check.mjs。

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const ROOT = path.resolve(import.meta.dirname, '..')

const sandbox = { window: {}, console }
vm.createContext(sandbox)
for (const file of ['assets/srs.js', 'assets/plan.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file })
}
const SRS = sandbox.window.CET4_SRS
const PLAN = sandbox.window.CET4_PLAN

const problems = []
let checks = 0

function eq(actual, expected, what) {
  checks++
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) problems.push(what + '：期望 ' + b + '，实际 ' + a)
}

const T = '2026-10-11'

/* ---------- 日期 ---------- */

eq(SRS.addDays(T, 1), '2026-10-12', '加一天')
eq(SRS.addDays(T, 0), T, '加零天')
eq(SRS.addDays('2026-10-31', 1), '2026-11-01', '跨月')
eq(SRS.addDays('2026-12-31', 1), '2027-01-01', '跨年')
eq(SRS.addDays(T, -1), '2026-10-10', '往回一天')
eq(SRS.diffDays(T, '2026-10-14'), 3, '相差天数')
eq(SRS.diffDays('2026-10-11', '2026-12-12'), 62, '距考试 62 天')

/* ---------- 盒号 → 间隔 ---------- */

eq(SRS.BOX_DAYS, [1, 3, 7, 16, 35], '间隔阶梯')
eq([1, 2, 3, 4, 5].map((b) => SRS.intervalDays(b)), [1, 3, 7, 16, 35], '各盒间隔')
eq(SRS.intervalDays(0), 1, '盒号 0 当 1 算')
eq(SRS.intervalDays(9), 35, '盒号越界按最大算')

/* ---------- 打分：新词记住了 ---------- */

let e = SRS.blankEntry(T)
eq(SRS.isNew(e), true, '新记录算没学过')
e = SRS.grade(e, 'known', T)
eq([e.box, e.due, e.seen, e.ok, e.wrong, e.inBook], [1, '2026-10-12', 1, 1, 0, false], '新词记住了 → 盒 1、明天再见')

// 第二天连着记得 → 盒 2（3 天后）
e = SRS.grade(e, 'known', '2026-10-12')
eq([e.box, e.due], [2, '2026-10-15'], '再记得 → 盒 2、3 天后')

// 盒 3 → 7 天，盒 4 → 16 天，盒 5 → 35 天，且封顶
e = SRS.grade(e, 'known', '2026-10-15')
eq([e.box, e.due], [3, '2026-10-22'], '盒 3 → 7 天后')
e = SRS.grade(e, 'known', '2026-10-22')
eq([e.box, e.due], [4, '2026-11-07'], '盒 4 → 16 天后')
e = SRS.grade(e, 'known', '2026-11-07')
eq([e.box, e.due], [5, '2026-12-12'], '盒 5 → 35 天后')
e = SRS.grade(e, 'known', '2026-12-12')
eq([e.box, e.due], [5, '2027-01-16'], '盒号封顶在 5')

/* ---------- 打分：模糊 / 忘了 ---------- */

let f = SRS.blankEntry(T)
f = SRS.grade(f, 'known', T)
f = SRS.grade(f, 'known', '2026-10-12')
eq([f.box, f.inBook], [2, false], '先走到盒 2')
const fuzzy = SRS.grade(f, 'fuzzy', '2026-10-15')
eq([fuzzy.box, fuzzy.due, fuzzy.inBook, fuzzy.wrong, fuzzy.streakOk], [1, '2026-10-16', true, 1, 0], '模糊 → 盒减一、明天、进错词本')

const missed = SRS.grade(f, 'missed', '2026-10-15')
eq([missed.box, missed.due, missed.inBook], [1, '2026-10-16', true], '忘了 → 打回盒 1、进错词本')

/* ---------- 错词本：连着两次记得才出去 ---------- */

let b = SRS.blankEntry(T)
b = SRS.grade(b, 'missed', T)
eq(b.inBook, true, '错了就进错词本')
b = SRS.grade(b, 'known', '2026-10-12')
eq([b.inBook, b.streakOk], [true, 1], '第一次记得还留着')
b = SRS.grade(b, 'known', '2026-10-15')
eq([b.inBook, b.streakOk], [false, 2], '连着两次记得就出去')

let c = SRS.blankEntry(T)
c = SRS.grade(c, 'missed', T)
c = SRS.grade(c, 'known', '2026-10-12')
c = SRS.grade(c, 'fuzzy', '2026-10-15')
c = SRS.grade(c, 'known', '2026-10-16')
eq([c.inBook, c.streakOk], [true, 1], '中间错一次，计数从头再来')

// 原记录不能被打分改掉（srs.js 里 grade 只返回新对象）
const original = SRS.blankEntry(T)
const snapshot = JSON.stringify(original)
SRS.grade(original, 'known', T)
eq(JSON.stringify(original), snapshot, 'grade 不修改传进来的记录')

/* ---------- 挑词 ---------- */

const words = [
  { w: 'alpha', zh: '甲' },
  { w: 'bravo', zh: '乙' },
  { w: 'charlie', zh: '丙' },
  { w: 'delta', zh: '丁' },
  { w: 'echo', zh: '戊' },
]
const answers = { alpha: 0, bravo: 1, charlie: 0, delta: 0, echo: 1 }

eq(SRS.pickNew({}, words, answers, 10).map((x) => x.w), ['alpha', 'charlie', 'delta'], '新词只取摸底标「不认识」的')
eq(SRS.pickNew({}, words, answers, 2).map((x) => x.w), ['alpha', 'charlie'], '新词按词表顺序、受数量限制')
eq(SRS.countNewPool({}, words, answers), 3, '新词池计数')

const srs1 = {
  alpha: { box: 3, due: '2026-10-11', seen: 5, ok: 4, wrong: 1, streakOk: 1, inBook: false },
  bravo: { box: 1, due: '2026-10-09', seen: 2, ok: 1, wrong: 1, streakOk: 0, inBook: true },
  charlie: { box: 1, due: '2026-10-20', seen: 1, ok: 1, wrong: 0, streakOk: 1, inBook: false },
  delta: { box: 0, due: '2026-10-11', seen: 0, ok: 0, wrong: 0, streakOk: 0, inBook: false },
}
eq(SRS.countNewPool(srs1, words, answers), 1, '学过的不再算新词')
eq(SRS.countDue(srs1, words, T), 2, '到期的才复习（没学过的、没到期的都不算）')
eq(SRS.pickReview(srs1, words, T, 10).map((x) => x.w), ['bravo', 'alpha'], '复习先排盒号小的')

const book = SRS.bookList(
  {
    alpha: { box: 1, due: T, seen: 3, wrong: 3, inBook: true },
    bravo: { box: 1, due: T, seen: 3, wrong: 1, inBook: true },
    charlie: { box: 1, due: T, seen: 3, wrong: 0, inBook: false },
  },
  words
)
eq(book.map((x) => x.word.w), ['alpha', 'bravo'], '错词本只放在本里的，错的多的在前')

/* ---------- 连续天数：断档不清零 ---------- */

const days = {
  '2026-10-01': { done: true },
  '2026-10-02': { done: true },
  '2026-10-03': { done: true },
  // 10-04 断了
  '2026-10-05': { done: true },
  '2026-10-06': { done: true },
  '2026-10-07': { done: true },
  '2026-10-08': { done: true },
  '2026-10-09': { done: true },
  '2026-10-10': { done: true },
  '2026-10-11': { done: true },
}
const st = SRS.stats(days, T)
eq(st.current, 7, '当前连续 = 最近连着做完的天数')
eq(st.longest, 7, '最长记录')
eq(st.doneDays, 10, '累计完成天数')

// 今天还没做完时，从昨天往回数（今天不算断）
eq(SRS.stats(days, '2026-10-12').current, 7, '今天没做完也不算断')
eq(SRS.stats(days, '2026-10-13').current, 0, '空了一天之后重新开始')
eq(SRS.stats(days, '2026-10-13').longest, 7, '断档不清零，最长记录还在')

eq(SRS.elapsedDays('2026-10-05', T), 7, '第几天按含头含尾算')
eq(SRS.dayDone({ newGoal: 20, newDone: 20, reviewGoal: 55, reviewDone: 55 }), true, '两个目标都到才算完成')
eq(SRS.dayDone({ newGoal: 20, newDone: 20, reviewGoal: 55, reviewDone: 54 }), false, '复习差一个就还没完成')
eq(SRS.dayDone({ newGoal: 10, newDone: 10, reviewGoal: 0, reviewDone: 0 }), true, '只有 10 分钟档：没复习任务也算完成')

/* ---------- 「每天背多少」的推算 ---------- */

const plan = PLAN.planFor({ unknown: 300, remainingScan: 0, now: new Date('2026-10-11T12:00:00+08:00') })
eq(plan.daysLeft, 62, '距考试天数')
eq(plan.studyDays, 48, '扣掉考前 14 天后的背词天数')
eq(plan.recommended, 10, '300 个不认识 → 每天 10 个')
eq(plan.modes.length, 4, '四档')
eq(plan.modes.filter((m) => m.here).length, 1, '四档里正好标一个「你在这」')
eq(plan.modes.map((m) => m.newWords), [10, 15, 20, 25], '四档每天新词数')
eq(plan.modes.map((m) => m.days), [30, 20, 15, 12], '四档各自要多少天')
eq(plan.modes.every((m) => m.fits), true, '48 天里四档都来得及')

const tight = PLAN.planFor({ unknown: 900, remainingScan: 1500, now: new Date('2026-10-11T12:00:00+08:00') })
eq(tight.probeDaysLeft, 3, '1500 个还没扫 = 还要 3 天摸底')
eq(tight.studyDays, 45, '扣掉摸底 3 天和考前 14 天')
eq(tight.recommended, 20, '900 个不认识 ÷ 45 天 → 每天 20 个')
eq(tight.exceedsMax, false, '每天 20 个还在充足档之内，不报警')

const over = PLAN.planFor({ unknown: 1500, remainingScan: 0, now: new Date('2026-10-11T12:00:00+08:00') })
eq(over.recommended > PLAN.MODES[PLAN.MODES.length - 1].newWords, true, '词太多时给出超过充足档的提醒')

const light = PLAN.planFor({ unknown: 0, remainingScan: 0, now: new Date('2026-10-11T12:00:00+08:00') })
eq(light.recommended, 0, '全认识 → 不用背新词')

/* ---------- 结果 ---------- */

console.log('逻辑自检：跑了 ' + checks + ' 条断言')
if (problems.length) {
  console.log('')
  console.log('问题：')
  problems.forEach((p) => console.log('  ✗ ' + p))
  process.exit(1)
}
console.log('')
console.log('逻辑自检通过 ✓')
