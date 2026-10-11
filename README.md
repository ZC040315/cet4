# cet4 · 四级备考站

> 一个纯静态的备考工具站。**先读 [网站建设计划规划书.md](网站建设计划规划书.md)** —— 所有设计决策都在那里，本文件只讲「怎么继续做」。

---

## 交接说明（换会话 / 换项目后，先读这一节）

这个项目是从另一个会话搬过来的。那边积累了一些在这里看不到的信息，**开工前请读完本节**。

### 位置与仓库

- 本地路径：`C:\Users\周超\Documents\ChatGPT\AI-MAKE-Web Site\cet4\`
- 它属于「AI-MAKE-Web Site」这个网站项目下的一个子站，和 `economics-map/` 平级
- **独立 git 仓库**：已 `git init`，分支 `main`，本地配置已就绪
- **远端仓库还没建**：GitHub 上还没有 `ZC040315/cet4`

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

### 怎么建远端仓库（用现有令牌，不要新建）

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

上线地址会是 `https://zc040315.github.io/cet4/`。

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
| 远端仓库 + GitHub Pages | ⬜ ← 从这里继续 |
| 阶段 1：主干词数据 + 摸底模式 | ✅ 做完（2026-10-11），**当天就能开始扫词** |
| 阶段 2：今日页 + 间隔重复 + 错词本 | ⬜ |
| 阶段 3：精听页（TTS 朗读 + 听写对照） | ⬜ |
| 阶段 4：短读 | ⬜ |
| 阶段 5：上线 | ⬜ |

## 本地怎么看

纯静态，做完之后**双击 `index.html`** 就行，不需要服务器、不需要 npm。

---

## 阶段 1 交付了什么（2026-10-11）

```
cet4/
├── index.html            ← 首页：倒计时 + 「今天只有一件事」。扫完词之后这里变成「每天背几个」
├── probe.html            ← 摸底模式：认识 / 不认识，两个键扫完；每 500 个停一次
├── words.html            ← 词表：主干词 / 叶子词，可搜、可按「不认识」筛
├── about.html            ← 说明：来源、怎么用、四档、导出 / 导入、重新摸底
├── assets/
│   ├── style.css         ← 全站样式（浅色、大字、一屏一件事；深色开关）
│   ├── store.js          ← localStorage 读写 + 导出 / 导入 JSON
│   ├── plan.js           ← 考试日期 + 「每天背多少」的算法
│   ├── app.js            ← 顶栏、主题、进度汇总、「每天背多少」那段结论
│   ├── home.js / probe.js / words.js / about.js
├── data/
│   ├── words-core.js     ← 主干词 1500（自动生成，约 200KB）
│   └── words-leaf.js     ← 叶子词 2346（自动生成，约 290KB）
└── scripts/
    ├── fetch-words.mjs   ← 从 ECDICT 重新生成上面两个文件
    ├── check-data.mjs    ← 数据自检
    └── render-check.mjs  ← 渲染 + 交互自检（自带无头浏览器驱动）
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

### 两个自检脚本

```powershell
node scripts/check-data.mjs      # 数据：字段、重复、主干/叶子重叠、词频顺序
node scripts/render-check.mjs    # 渲染：横向溢出、控制台报错、摸底点击、词表筛选
node scripts/render-check.mjs --shot   # 顺便出截图（默认写到系统临时目录）
```

两个都过 = 数据没坏、页面能点、手机宽度不溢出。改完东西记得各跑一遍。

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
