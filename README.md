# 乌托邦测试 — Utopia Test

> 寻找你心中的理想社会形态。一个社会形态偏好测试工具。
> Discover your ideal societal form. A social preference test tool.

> ⚠️ 本仓库仅包含项目设计与前端代码。后端与部署相关代码未公开。

## 在线体验

👉 [开始测试](https://aragorndaozhen.github.io/Utopia-Test/)（GitHub Pages 静态版，免后端）

## 项目结构

```
├── docs/                      # 静态版（GitHub Pages 部署）
│   ├── index.html             # 纯前端入口
│   ├── data/
│   └── static/
├── data/
│   ├── dimensions.py         # 4维度×4取值定义+卡片颜色
│   ├── results.py            # 16结果类型+描述+举例
│   └── __init__.py
├── templates/
│   ├── index.html            # 主页模板 (Jinja2)
│   └── admin.html            # 统计面板模板 (Jinja2)
├── public/static/
│   ├── css/style.css          # 主样式
│   └── js/
│       ├── app.js             # 核心逻辑 (卡片交互/滑动/结果/导出)
│       └── i18n.js            # 国际化脚本
├── README.md                  # 中文说明
├── README_EN.md               # 英文说明
└── .gitignore
```

## 核心机制

- **4维度 × 4取值** = 256种组合
- ABBR_MAP 收敛到 2^4 = 16 个结果类型
- 每维度 4 张卡片（图案面→点击翻转为文字面）
- 每维度选 1 张，共选 4 张
- 16 张卡片全部翻开 + 4 张全部选定 → 查看结果

## 技术栈 (前端)

- HTML5 / CSS3 / Vanilla JavaScript
- Chart.js 4.4 — 极区图 (polarArea)
- html2canvas 1.4 — 结果导出
- Noto Serif SC (思源宋体) — Google Fonts

## GitHub

- 仓库: `https://github.com/AragornDaoZhen/Utopia-Test`
- 主要分支: `main`

## 立项过程

- **执行者**：DeepSeek V4
- **设计者 / 打杂的**：AragornDaoZhen
