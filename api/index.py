# -*- coding: utf-8 -*-
"""乌托邦测试 — Vercel Serverless 入口"""

import os, sys, json

# Make project root importable
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from flask import Flask, render_template, request, jsonify

from data.dimensions import DIMENSIONS, get_abbr_code
from data.results import RESULTS

app = Flask(__name__,
            template_folder=os.path.join(PROJECT_ROOT, 'templates'))
app.secret_key = os.urandom(24)

# ---------- 数据存储（Vercel 使用内存，无需文件）----------
_stats = {"results": [], "total": 0}

def calc_distribution(stats):
    results_list = stats.get("results", [])
    total = len(results_list)
    if total == 0:
        return {"dimensions": [2, 2, 2, 2], "total": 0,
                "dim_avg_raw": [0, 0, 0, 0],
                "distribution": {}, "codes": {}}
    dim_sums = [0, 0, 0, 0]
    code_counts = {}
    for r in results_list:
        vals = r if isinstance(r, list) else r.get("values", [])
        for i, v in enumerate(vals):
            if i < 4:
                dim_sums[i] += v
        try:
            code = get_abbr_code(vals)
            code_counts[code] = code_counts.get(code, 0) + 1
        except:
            pass
    dim_avg = [round(s / total, 2) for s in dim_sums]
    dim_mapped = [(v + 2) / 4 * 4 for v in dim_avg]
    dist = {}
    for code, count in sorted(code_counts.items(), key=lambda x: -x[1]):
        dist[code] = {"count": count, "pct": round(count / total * 100, 1)}
    return {"dimensions": dim_mapped, "dim_avg_raw": dim_avg,
            "total": total, "distribution": dist, "codes": code_counts}

# ---------- 路由 ----------

@app.route("/")
def index():
    return render_template("index.html",
                           dimensions=DIMENSIONS,
                           results=RESULTS)

@app.route("/api/submit", methods=["POST"])
def submit_result():
    data = request.get_json()
    values = data.get("values", [])
    if len(values) != 4:
        return jsonify({"ok": False, "error": "Invalid values count"}), 400
    _stats.setdefault("results", [])
    _stats["results"].append(values)
    _stats["total"] = len(_stats["results"])
    return jsonify({"ok": True, "total": _stats["total"]})

@app.route("/api/stats", methods=["GET"])
def get_stats():
    return jsonify(calc_distribution(_stats))
