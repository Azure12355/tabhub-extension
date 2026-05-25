# TabHub

> 把浏览器里散落的标签摊在桌面上，按域名自动归类，一眼看到哪些站开太多了，顺手清。

一个 Chrome MV3 扩展，把当前打开的所有标签按域名聚合成瀑布卡。米黄底 + 衬线大字 + 几何配色，**点扩展图标弹出，⌘T 还是原生新标签页**，不抢你的新标签页。

![icon](icons/icon-128.png)

## 截图

打开后是这样：左上角 hero 写着「当前打开 N 个标签，来自 M 个域名」，下面是按域名瀑布流。每张卡：网站 favicon + 域名 + 标签数；点任意一行 tab 跨窗切过去并高亮反馈；点 × 关单个；点卡头 × 或「全部关掉」连同窗口里这个域名所有标签一并关闭。

## 特性

- **真实数据**：用 `chrome.tabs` API 读取所有窗口、所有 tab，按 hostname (eTLD+1 简化) 分组
- **真实 favicon**：用 Chrome 内置 `_favicon` API（需 `favicon` 权限），离线也能拿到
- **真实切 Tab**：点一行 tab → 先把目标窗口提前台 → 再激活 tab，附 300ms flash 反馈
- **实时刷新**：监听 `onCreated / onRemoved / onUpdated / onActivated / onMoved / onAttached / onDetached`，120ms 防抖
- **⌘K 搜索面板**：模糊匹配标题/域名/路径，关键字高亮
- **不抢新标签页**：点扩展图标弹 TabHub；`⌘T` 仍是浏览器原生新标签页
- **零依赖**：纯 HTML + CSS + JS，无打包步骤，clone 完直接装

## 安装

```bash
git clone https://github.com/Azure12355/tabhub-extension.git
```

1. 打开 `chrome://extensions`
2. 右上角开「开发者模式」
3. 点「加载已解压的扩展程序」，选 `tabhub-extension` 目录
4. （可选）点工具栏 🧩 图标，在 TabHub 那行点 📌 把它钉到工具栏上
5. 点 TabHub 图标 → 弹出 TabHub 页

## 使用

| 操作 | 行为 |
|---|---|
| 点工具栏 TabHub 图标 | 弹 TabHub 页（若已开则聚焦） |
| 点卡里某行 tab | 跨窗切过去 + flash 反馈 |
| 点 tab 右侧 × | 关闭那个 tab |
| 点卡头 × / 「全部关掉」 | 关闭该域名所有 tab |
| `⌘K` / `Ctrl K` | 打开搜索面板 |
| 「归档」按钮 | 当前与「全部关掉」同效（占位，未来接收藏） |

## 项目结构

```
tabhub-extension/
├── manifest.json       MV3 manifest, permissions: tabs / favicon
├── background.js       service worker, 仅一个 chrome.action.onClicked
├── tabhub.html         主页面壳 (UI)
├── tabhub.js           所有逻辑：tabs query / 分组 / 渲染 / 切换 / 搜索
└── icons/
    ├── icon.svg        源文件（几何拼接：米黄底 + 暗方块 + 橙菱 + 黄三角 + 黑圆点）
    ├── icon.html       Playwright 截图用的 SVG 容器
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

## 开发

不需要任何构建工具。改完代码：

1. `chrome://extensions` → TabHub 那行点🔄刷新
2. 重开 TabHub 页或 `⌘R`

想本地预览 UI（无真实数据，走 mock）：

```bash
cd tabhub-extension
python3 -m http.server 8769
# 浏览器开 http://localhost:8769/tabhub.html
```

mock 数据见 `tabhub.js` 的 `MOCK_DATA` 数组。

### 改图标

改 `icons/icon.svg` 后，三种尺寸 PNG 需要重新导出。推荐用 Playwright：

```bash
# 让 icon.html 跑在 http server 上
python3 -m http.server 8769

# 用 playwright 截 16 / 48 / 128 三个尺寸
# (或者直接用任何 SVG → PNG 工具)
```

## 路线图

- [ ] 接 `chrome.tabGroups` 支持原生分组着色
- [ ] 「归档」真接收藏夹或 IndexedDB 持久化
- [ ] 拖拽合并 / 拆窗
- [ ] 闲置时长热力图

## License

MIT
