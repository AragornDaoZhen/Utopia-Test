# 乌托邦测试 — Utopia Test

> 寻找你心中的理想社会形态。一个社会形态偏好测试工具。
> Discover your ideal societal form. A social preference test tool.

## 立项过程

- **执行者**：DeepSeek V4
- **设计者 / 打杂的**：AragornDaoZhen

## 项目结构

```
utopia-test/
├── app.py                    # Flask 本地开发入口
├── api/index.py              # Vercel Serverless 入口
├── vercel.json               # Vercel 部署配置
├── deploy.sh                 # 服务器一键部署脚本
├── migrate_data.py           # 数据迁移脚本
├── requirements.txt          # Python 依赖
├── data/
│   ├── dimensions.py         # 4维度×4取值定义+卡片颜色
│   ├── results.py            # 16结果类型+描述+举例
│   └── __init__.py
├── templates/
│   ├── index.html            # 主页
│   └── admin.html            # 统计管理面板
└── public/static/
    ├── css/style.css          # 主样式
    └── js/
        ├── app.js             # 主逻辑(卡片交互/滑动/结果/导出)
        └── i18n.js            # 国际化脚本
```

## 核心机制

- **4维度 × 4取值** = 256种组合
- ABBR_MAP 收敛到 2^4 = 16 个结果类型
- 每维度 4 张卡片（图案面→点击翻转为文字面）
- 每维度选 1 张，共选 4 张
- 16 张卡片全部翻开 + 4 张全部选定 → 查看结果

## 本地运行

```powershell
cd utopia-test
pip install -r requirements.txt
python app.py
# 浏览器打开 http://127.0.0.1:5000
```

## 服务器部署

```bash
ssh root@<your-server-ip>
cd /opt/utopia-test && git pull
systemctl restart utopia-test
```

管理面板: `http://<your-server-ip>:5000/admin`

## GitHub

- 仓库: `https://github.com/AragornDaoZhen/Utopia-Test`
- 主要分支: `main`
- 回溯版本: `git log --oneline` → `git checkout <commit-id>`

