# Utopia Test

> Discover your ideal societal form. A social preference test tool.

## Project Origin

- **Executor**: DeepSeek V4
- **Designer / Jack-of-all-trades**: AragornDaoZhen

## Project Structure

```
├── app.py                    # Flask dev entry point
├── api/index.py              # Vercel Serverless entry point
├── vercel.json               # Vercel deploy config
├── deploy.sh                 # One-click server deploy script
├── migrate_data.py           # Data migration script
├── requirements.txt          # Python dependencies
├── data/
│   ├── dimensions.py         # 4 dims × 4 values, card colors
│   ├── results.py            # 16 result types with descriptions & examples
│   └── __init__.py
├── templates/
│   ├── index.html            # Main page
│   └── admin.html            # Stats dashboard
└── public/static/
    ├── css/style.css          # Main stylesheet
    └── js/
        ├── app.js             # Core logic (cards, scrolling, results, export)
        └── i18n.js            # i18n script
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

## Local Development

```powershell
cd utopia-test
pip install -r requirements.txt
python app.py
# Open http://127.0.0.1:5000
```

## Server Deployment

```bash
ssh root@<your-server-ip>
cd /opt/utopia-test && git pull
systemctl restart utopia-test
```

Dashboard: `http://<your-server-ip>:5000/admin`

## Tech Stack

- **Backend**: Python Flask (dev) / Vercel Serverless (production)
- **Frontend**: Vanilla JS + CSS, Chart.js 4.4 (polarArea), html2canvas 1.4
- **Font**: Noto Serif SC (Source Han Serif) via Google Fonts
- **Data**: JSON flat-file storage (data.json — excluded from git)

## GitHub

- Repository: `https://github.com/AragornDaoZhen/Utopia-Test`
- Branch: `main`
