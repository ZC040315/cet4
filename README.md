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
| 阶段 1：主干词数据 + 摸底模式 | ⬜ |
| 阶段 2：今日页 + 间隔重复 + 错词本 | ⬜ |
| 阶段 3：精听页（TTS 朗读 + 听写对照） | ⬜ |
| 阶段 4：短读 | ⬜ |
| 阶段 5：上线 | ⬜ |

## 本地怎么看

纯静态，做完之后**双击 `index.html`** 就行，不需要服务器、不需要 npm。
现在还没有页面文件。
