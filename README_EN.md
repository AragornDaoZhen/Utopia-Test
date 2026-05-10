# Utopia Test

> Discover your ideal societal form. A social preference test tool.

> ⚠️ This repository contains only the project design and frontend code. Backend and deployment code are not public.

## Live Demo

👉 [Take the test](https://aragorndaozhen.github.io/Utopia-Test/) (GitHub Pages, no backend required)

## Project Structure

```
├── docs/                      # Static version (GitHub Pages deployment)
│   ├── index.html             # Pure frontend entry
│   ├── data/
│   └── static/
├── data/
│   ├── dimensions.py         # 4 dims × 4 values, card colors
│   ├── results.py            # 16 result types with descriptions & examples
│   └── __init__.py
├── templates/
│   ├── index.html            # Main page template (Jinja2)
│   └── admin.html            # Dashboard template (Jinja2)
├── public/static/
│   ├── css/style.css          # Main stylesheet
│   └── js/
│       ├── app.js             # Core logic (cards, scrolling, results, export)
│       └── i18n.js            # i18n script
├── README.md                  # Chinese docs
├── README_EN.md               # English docs
└── .gitignore
```

## Core Mechanics

- **4 dimensions × 4 values each** = 256 possible combinations
- ABBR_MAP reduces to 2^4 = **16 result types**
- Each dimension: 4 cards (pattern face → tap to reveal text face)
- Pick 1 card per dimension (4 total)
- All 16 cards revealed + 4 selected → view result

## Dimensions

| # | Dimension | Left Pole | Right Pole |
|---|-----------|-----------|------------|
| 0 | Division of Labor | Independence (独) | Cooperation (协) |
| 1 | Social Stratification | Equality (平) | Hierarchy (阶) |
| 2 | Internal Competition | Harmony (和) | Competition (竞) |
| 3 | Attitude Toward Tech | Conservative (守) | Progressive (进) |

Each dimension has 4 graded positions (-2, -1, +1, +2), yielding nuanced profiles.

## Result Pages

Each result displays:
- **Type code** (4-letter abbreviation) and Chinese name
- **Similar societies** — curated examples from literature, games, film, history, and real-world movements
- **Dimension details** — your exact choices with descriptions
- **Polar area (rose) chart** — 8-axis visualization comparing your selection against the global average
- **Rarity stats** — percentage of users who chose identically / opposite
- **Card matrix** — per-card selection distribution across all users
- **Optional user submission** — share your own utopia example

## Tech Stack (Frontend)

- HTML5 / CSS3 / Vanilla JavaScript
- Chart.js 4.4 — polar area chart
- html2canvas 1.4 — result image export
- Noto Serif SC (Source Han Serif) via Google Fonts

## GitHub

- Repository: `https://github.com/AragornDaoZhen/Utopia-Test`
- Branch: `main`

## Project Origin

- **Executor**: DeepSeek V4
- **Designer / Jack-of-all-trades**: AragornDaoZhen
