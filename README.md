# cet4 · 四级备考站

> 一个纯静态的备考工具站。**先读 [网站建设计划规划书.md](网站建设计划规划书.md)** —— 所有设计决策都在那里，本文件只讲「怎么继续做」。

---

## 交接说明（换会话 / 换项目后，先读这一节）

这个项目是从另一个会话搬过来的。那边积累了一些在这里看不到的信息，**开工前请读完本节**。

### 位置与仓库

- 本地路径：`C:\Users\周超\Documents\ChatGPT\AI-MAKE-Web Site\cet4\`
- 它属于「AI-MAKE-Web Site」这个网站项目下的一个子站，和 `economics-map/` 平级
- **独立 git 仓库**：已 `git init`，分支 `main`，本地配置已就绪
- **远端仓库已建、已上线**（2026-10-11）：`https://github.com/ZC040315/cet4`（公开仓库）
  - **线上地址：<https://zc040315.github.io/cet4/>** ← 手机上就用这个，双击本地文件只在电脑上有效
  - Pages：`main` 分支根目录，改完 push 之后 30 秒～2 分钟内自动重新发布

### 凭据：不需要重新申请令牌

Windows 凭据管理器里已经存着一把 classic PAT（scopes `repo` + `workflow`），**是机器级的**，
在本项目里照样有效。但有四个细节必须知道：

1. **远端地址必须带用户名**，否则凭据查找对不上，表现为反复弹 GitHub 登录窗：
   ```
   git remote set-url origin https://ZC040315@github.com/ZC040315/cet4.git
   ```
2. 本仓库已设 `credential.interactive = false`：认证失败时直接报错，**不会弹窗**
3. **不要跑 `git credential fill`** —— 它会触发浏览器 OAuth 授权窗口。判断凭据是否正常，
   用一次 `git push`（`git ls-remote` 不行：公开仓库可以匿名读，凭据坏了也会成功）
4. 令牌 **2027-01-05 过期**
5. **推送要开 HTTP/1.1。** 本仓库已设 `git config http.version HTTP/1.1`（已生效，不用再设）。
   不设的话 `git push` 会报 `Recv failure: Connection was reset` —— 这是网络层掐掉
   `git-receive-pack`，重试几次也没用，加这一条就通。`api.github.com` 不受影响。

### 远端仓库是怎么建的（已经建完了，留在这里备查）

**不要再跑一遍** —— 仓库和 Pages 都已经存在，重复 POST 只会报错：

```powershell
$tok = $null
$g = ("protocol=https`nhost=github.com`nusername=ZC040315`n`n" | git credential-manager get 2>&1)
foreach ($l in $g) { if ($l -like 'password=*') { $tok = $l.Substring(9) } }
$h = @{ Authorization = "Bearer $tok"; 'User-Agent' = 'cet4'; Accept = 'application/vnd.github+json' }
# 建仓库
Invoke-WebRequest -UseBasicParsing -Uri 'https://api.github.com/user/repos' -Method Post -Headers $h `
  -ContentType 'application/json' -Body '{"name":"cet4","description":"四级备考站","private":false,"has_issues":true}'
# 开启 Pages（免费版 Pages 只能用在公开仓库）
Invoke-WebRequest -UseBasicParsing -Uri 'https://api.github.com/repos/ZC040315/cet4/pages' -Method Post -Headers $h `
  -ContentType 'application/json' -Body '{"source":{"branch":"main","path":"/"}}'
```

上线地址是 `https://zc040315.github.io/cet4/`。

### 已定死的技术决策（不要在下一个会话里重新讨论）

1. **纯静态 HTML + CSS + 原生 JS，零依赖零构建。** 不用 React / Vite。
   理由：这个站寿命只有 62 天，要的是「手机上打开就能背、明天就能开始」，零依赖失败点最少。
2. **不放真题原文。** 版权 + 无法核实（记错的「真题」比不背更糟）。
3. **不做后端、账号系统、排行榜、AI 对话练习。**
4. **视觉：浅色、大字、一屏一件事。** 不做动画、渐变、卡片阴影。

### 可以直接复用的现成资产

兄弟项目 `C:\Users\周超\Documents\ChatGPT\AI-SELF-TEXT\前沿雷达\` 里有：

| 资产 | 用途 |
| --- | --- |
| `scripts/check-data.mjs` | 数据自检：必填字段、类别合法性、id/链接重复、日期格式 |
| `scripts/render-check.mjs` | 渲染自检：横向溢出、控制台报错、交互验证、自动截图（自带无头 Chrome 驱动，零依赖） |
| `scripts/build-feed.mjs` | 生成 RSS 订阅源的写法（备考站以后可能也要） |
| `assets/` + `data/` 的分层 | 数据放 `.js` 而不是 `.json`，本地双击打开才不会被 CORS 拦 |

前沿雷达的 README 里还有一节「为什么 workflow 推不上去」，记录了几个真实踩过的坑，
值得扫一眼再动手。

---

## 当前进度

| 阶段 | 状态 |
| --- | --- |
| 规划书定稿 | ✅ |
| 本地目录 + 独立 git 仓库 | ✅ |
| 远端仓库 + GitHub Pages | ✅ 已上线：https://zc040315.github.io/cet4/ |
| 阶段 1：主干词数据 + 摸底模式 | ✅ 做完（2026-10-11），**当天就能开始扫词** |
| 阶段 2：今日页 + 间隔重复 + 错词本 + 四档降级 | ✅ 做完（2026-10-11），线上可直接用 |
| 阶段 3：精听页（TTS 朗读 + 听写对照） | ⬜ |
| 阶段 4：短读 | ⬜ |
| 阶段 5：上线 | ⬜ |

## 本地怎么看

纯静态，做完之后**双击 `index.html`** 就行，不需要服务器、不需要 npm。

---

## 现在有哪些文件（阶段 1 + 阶段 2 都已交付）

```
cet4/
├── index.html            ← 今日：今天背几个新词、复习几个词；没摸底时先让你去摸底
├── probe.html            ← 摸底模式：认识 / 不认识，两个键扫完；每 500 个停一次
├── study.html            ← 背词 / 复习 / 错词本练习（?mode=new / review / book）
├── words.html            ← 词表：主干词 / 叶子词，可搜、可按「不认识」筛
├── progress.html         ← 进度：连续天数、最长记录、完成率、错词本
├── about.html            ← 说明：来源、怎么用、四档、导出 / 导入、重新摸底
├── assets/
│   ├── style.css         ← 全站样式（浅色、大字、一屏一件事；深色开关）
│   ├── store.js          ← localStorage 读写 + 导出 / 导入 JSON
│   ├── plan.js           ← 考试日期 + 「每天背多少」的算法
│   ├── srs.js            ← 间隔重复的纯逻辑（盒号、错词本、连续天数），不碰 DOM
│   ├── app.js            ← 顶栏、主题、进度汇总、「每天背多少」那段结论
│   ├── today.js / probe.js / study.js / words.js / progress.js / about.js
├── data/
│   ├── words-core.js     ← 主干词 1500（自动生成，约 200KB）
│   └── words-leaf.js     ← 叶子词 2346（自动生成，约 290KB）
├── scripts/
│   ├── fetch-words.mjs   ← 从 ECDICT 重新生成上面两个文件
│   ├── check-data.mjs    ← 数据自检
│   ├── check-srs.mjs     ← 间隔重复 / 每天背多少 的逻辑自检（纯函数，57 条断言）
│   └── render-check.mjs  ← 渲染 + 交互自检（自带无头浏览器驱动）
└── THIRD-PARTY.md        ← 词表数据的来源与 MIT 许可声明
```

### 词表数据从哪来（这一节最重要）

**不放真题。词表和释义都取自 ECDICT**（开源英汉词典数据库，MIT 许可，
https://github.com/skywind3000/ECDICT），脚本只做筛选、去重、排序，**不改写任何释义**：

| 字段 | 意思 |
| --- | --- |
| `tag` 含 `cet4` | 四级大纲词汇（ECDICT 里这样的词条有 3849 行，去重后 **3846 个词**）|
| `zh` | ECDICT 的中文释义原文 |
| `f` / `b` | 当代语料库 / BNC 的词频顺序，**数字越小越高频** |
| `c` / `ox` | 柯林斯星级 / 牛津三千核心词 |

**主干词 = 这些词里词频最高的 1500 个**（规划书第十一节：一天扫 500 个，三天扫完），
**叶子词 = 剩下的 2346 个**（低频、生僻，看一眼就过）。

重新生成（会把两个 data 文件覆盖重写）：

```powershell
node scripts/fetch-words.mjs --dry                      # 先看统计，不写文件
node scripts/fetch-words.mjs                            # 下载字典源（约 66MB，会缓存在系统临时目录）再生成
node scripts/fetch-words.mjs --source=D:\path\ecdict.csv # 已经有一份 ecdict.csv 时，跳过下载
```

国内直连 `raw.githubusercontent.com` 很慢，脚本里第一个用的是 `ghproxy.net` 镜像，
失败才回落到官方地址。下载一次会缓存在 `%TEMP%\cet4-ecdict.csv`，之后不再重复下。

### 每天该背多少，是怎么算的

写在 `assets/plan.js` 里，页面上也会原样显示，方便核对：

1. 考试日期 2026-12-12 上午 9:00 → 剩余天数；
2. 扣掉还没扫完的摸底天数（一天算 500 个）；
3. 再扣掉考前 14 天（规划书：写作翻译和真题音频留到最后两周）→ 剩下的是背词天数；
4. `不认识的词数 ÷ 背词天数`，向上取整到 5 的倍数 = 每天新词数；
5. 同时给出四档（10 / 20 / 25 / 30）各自要多少天、来不来得及，并标出推荐的落点。

如果算出来超过充足档的 30 个，页面会直接说要取舍，不硬扛。

### 间隔重复怎么排（阶段 2 的核心规则）

规则写在 `assets/srs.js`，**刻意做得能一眼看懂**，不搞 SM-2 那种玄学：

```
盒号 → 下次见面：1 → 1 天    2 → 3 天    3 → 7 天    4 → 16 天    5 → 35 天

记得   → 盒号 +1（封顶 5），按新盒号的间隔再来
模糊   → 盒号 −1（最低 1），明天再见，进错词本
忘了   → 打回盒 1，明天再见，进错词本
```

- **新词从哪来**：摸底标「不认识」、而且还没进过卡片的词，按词频顺序取，数量由档位决定。
  摸底标「认识」的词永远不进背词流程 —— 你说你认识，就不折腾你。
- **复习从哪来**：所有 `due <= 今天` 的词，先排盒号小的（最不熟的），再排拖得最久的。
  档位给一个复习上限，超出的部分明天再说 —— 断档攒下来的债不会一次性砸给你。
- **错词本是自愈的**：进 = 任何一次「模糊 / 忘了 / 还不熟」；出 = **连着两次「记得」**。
  不需要手动删，所以进度页没有删除按钮。
- **背错的词当轮末尾再问一遍**（同一轮最多重排一次），避免它就这么滑过去，也不会死循环。
- 复习卡片**先只给单词**，点「看释义」才出答案 —— 一上来就看释义等于没考。

### 四档：档位只决定「今天做多少」

档位和数字都在 `assets/plan.js` 的 `MODES` 里，`reviewCap` 是每天的复习上限：

| 档位 | 每天新词 | 复习上限 | 合计时间 |
| --- | --- | --- | --- |
| 只有 10 分钟 | 10 | 15 | 10 分钟 |
| 保底 | 15 | 40 | 30 分钟 |
| 标准 | 20 | 55 | 80 分钟 |
| 充足 | 25 | 70 | 100 分钟 |

默认档位 = 摸底推出来的推荐量落进哪一档（推荐 10 → 「只有 10 分钟」档）。
用户点了哪一档会存进 `settings.tier`，并记在当天记录里。

**两个数字是从规划书推出来的**：规划书写「单词 25 分钟对应大约 20 个新词 + 50–60 个复习词」，
所以标准档 = 20 新词 + 55 复习，保底和充足按单词时长（20 / 25 / 30 分钟）等比缩。
这条改动同时也改了摸底结果页的四档对照表（10 / 15 / 20 / 25）。

### 数据形状（阶段 2 新增的两个键）

```js
srs: {
  "abandon": { box: 2, due: "2026-10-14", seen: 3, ok: 2, wrong: 1, streakOk: 1, inBook: false, first, last }
},
days: {
  "2026-10-11": { tier: "std", newGoal: 20, newDone: 20, reviewGoal: 30, reviewDone: 30, done: true, ms: 900000 }
}
```

- `srs` 的键是单词本身（和摸底一样），所以词表加词、换顺序都不会串。
- 一天算「完成」= 新词到量 **且** 复习到量；`done` 由 `A.applyGoals()` 每次渲染时重算。
- 连续天数从 `days` 里 `done === true` 的日期算；今天还没做完**不算断**（从昨天往回数）。
- `ms` 是当天实际花掉的时间（每次进背词页记一次），不是估算。

### 三个自检脚本

```powershell
node scripts/check-data.mjs      # 数据：字段、重复、主干/叶子重叠、词频顺序
node scripts/check-srs.mjs       # 逻辑：盒号、错词本出入、连续天数、每天背多少
node scripts/render-check.mjs    # 渲染：横向溢出、控制台报错、摸底点击、词表筛选
node scripts/render-check.mjs --shot   # 顺便出截图（默认写到系统临时目录）
node scripts/render-check.mjs --only=study   # 只跑名字里含 study 的用例（改一个页面时用）
node scripts/render-check.mjs --url=https://zc040315.github.io/cet4   # 直接测线上那一份
```

三个都过 = 数据没坏、调度规则没算错、页面能点、手机宽度不溢出。改完东西记得各跑一遍。
**push 之后建议再跑一次带 `--url=` 的那条**，确认线上和本地是同一份东西。

`render-check.mjs` 里现在有 26 个用例（桌面 + 手机两种宽度 × 13 个场景），
包括：摸底三步、词表搜索与筛选、三档背词流程（点完真的去查 localStorage 对不对）、
今日页点「只有 10 分钟」之后数量变化、进度页的连续天数与错词本行数。
假进度是按「今天」相对生成的，所以哪天跑都不会假报警。

### 已知的口径和取舍（下个会话别重新推翻）

- **只有主干词进了摸底**。叶子词不扫、不背（规划书：叶子词看一眼就过）。
- **摸底顺序是固定种子打乱的**（`assets/probe.js` 里的 `SEED`）。不按字母、也不按词频，
  免得第一组全是简单词、最后一天全是硬骨头。种子不能随便改，改了断点就对不上了。
- **判断存在 `localStorage` 的 `cet4.v1`**，键是单词本身，不是下标 —— 词表以后加词、
  重排都不影响已经扫过的判断。**清除浏览器数据会连进度一起清掉**，所以说明页里放了导出 / 导入。
- **主干词按词频切，是规划书的定义**（高频核心）。所以它前面那些词（government、system…）
  你多半都认识，扫起来很快；真正的信息量在中间那几百个。如果扫完发现不认识的很少，
  那是好消息，页面会直接告诉你「别在单词上耗时间，去练精听」。
- **叶子词不是「没用」，是「不背」**。做题遇到再回来查，词表页能搜。
- **背词只背「摸底标不认识」的主干词**。认识的词不进流程，叶子词不进流程 ——
  这是「不另起一套和你生活无关的背单词任务」那条设计原则的落地。
- **「只有 10 分钟」档是台阶，不是默认值**。它带着 15 个复习上限，
  因为复习断了间隔重复就废了 —— 这一档可以少，但不能没有复习。
- **词表页还没有「错词本」筛选**（错词本在进度页里）。想做的话是加一个 chip 的事，
  但没必要重复两个入口。
