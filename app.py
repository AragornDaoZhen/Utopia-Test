# -*- coding: utf-8 -*-
"""乌托邦测试 — Flask 应用"""
import json, os
from datetime import datetime
from flask import Flask, render_template, request, jsonify

from data.dimensions import DIMENSIONS
from data.results import RESULTS

app = Flask(__name__,
            static_folder='public/static',
            static_url_path='/static')
app.secret_key = os.urandom(24)

# ---------- 数据存储路径 ----------
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
DATA_FILE = os.path.join(DATA_DIR, 'data.json')
WHITELIST_FILE = os.path.join(DATA_DIR, 'whitelist.json')

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(records):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

def load_whitelist():
    if not os.path.exists(WHITELIST_FILE):
        return []
    with open(WHITELIST_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_client_ip():
    fwd = request.headers.get('X-Forwarded-For', request.remote_addr)
    if fwd and ',' in fwd:
        return fwd.split(',')[0].strip()
    return fwd or ''

def calc_distribution(records):
    """从统一 records 中提取有 values 的条目计算统计"""
    test_records = [r for r in records if r.get('values')]
    total = len(test_records)
    if total == 0:
        return {"dimensions": [2,2,2,2], "total": 0,
                "dim_avg_raw": [0,0,0,0], "pole_avg": [0]*8,
                "card_counts": {str(d): {str(v): 0 for v in [-2,-1,1,2]} for d in range(4)},
                "distribution": {}, "codes": {}}

    dim_sums = [0, 0, 0, 0]
    pole_sums = [0, 0, 0, 0, 0, 0, 0, 0]
    code_counts = {}
    card_counts = {str(d): {str(v): 0 for v in [-2,-1,1,2]} for d in range(4)}

    for r in test_records:
        vals = r['values']
        for i, v in enumerate(vals):
            if i < 4:
                dim_sums[i] += v
                card_counts[str(i)][str(v)] = card_counts[str(i)].get(str(v), 0) + 1
                if v < 0:
                    pole_sums[i] += abs(v)
                else:
                    pole_sums[i+4] += v
        from data.dimensions import get_abbr_code
        try:
            code = get_abbr_code(vals)
            code_counts[code] = code_counts.get(code, 0) + 1
        except:
            pass

    dim_avg = [round(s / total, 2) for s in dim_sums]
    dim_mapped = [(v + 2) / 4 * 4 for v in dim_avg]
    pole_avg = [round(s / total, 2) for s in pole_sums]
    dist = {}
    for code, count in sorted(code_counts.items(), key=lambda x: -x[1]):
        dist[code] = {"count": count, "pct": round(count / total * 100, 1)}

    return {
        "dimensions": dim_mapped, "dim_avg_raw": dim_avg, "pole_avg": pole_avg,
        "card_counts": card_counts, "total": total, "distribution": dist, "codes": code_counts,
    }


# ---------- 页面路由 ----------
@app.route("/")
def index():
    return render_template("index.html", dimensions=DIMENSIONS, results=RESULTS)


# ---------- API ----------
@app.route("/api/submit", methods=["POST"])
def submit_result():
    data = request.get_json()
    values = data.get("values", [])
    if len(values) != 4:
        return jsonify({"ok": False, "error": "Invalid values count"}), 400

    ip = get_client_ip()
    whitelist = load_whitelist()
    records = load_data()

    # Check existing test submission for this IP
    existing = next((r for r in records if r.get('ip') == ip and r.get('values')), None)
    if existing and ip not in whitelist:
        return jsonify({"ok": True, "duplicate": True, "total": len([r for r in records if r.get('values')])})

    now = datetime.now().isoformat()
    if existing:
        # Whitelisted IP — update existing record
        existing['values'] = values
        existing['time'] = now
    else:
        # Check for record with example only (no values yet)
        rec = next((r for r in records if r.get('ip') == ip and not r.get('values')), None)
        if rec:
            rec['values'] = values
            rec['time'] = now
        else:
            records.append({"ip": ip, "values": values, "text": None, "time": now})

    save_data(records)
    total = len([r for r in records if r.get('values')])
    return jsonify({"ok": True, "total": total})


@app.route("/api/submit-example", methods=["POST"])
def submit_example():
    data = request.get_json()
    text = (data.get("text") or "").strip()
    code = data.get("code", "")
    if not text:
        return jsonify({"ok": False, "error": "Empty text"}), 400

    ip = get_client_ip()
    whitelist = load_whitelist()
    records = load_data()

    # Check existing example submission
    existing = next((r for r in records if r.get('ip') == ip and r.get('text')), None)
    if existing and ip not in whitelist:
        return jsonify({"ok": False, "error": "Already submitted"}), 429

    now = datetime.now().isoformat()
    if existing:
        existing['text'] = text
        existing['code'] = code
        existing['time'] = now
    else:
        rec = next((r for r in records if r.get('ip') == ip and not r.get('text')), None)
        if rec:
            rec['text'] = text
            rec['code'] = code
            rec['time'] = now
        else:
            records.append({"ip": ip, "values": None, "text": text, "code": code, "time": now})

    save_data(records)
    return jsonify({"ok": True})


@app.route("/api/stats", methods=["GET"])
def get_stats():
    records = load_data()
    return jsonify(calc_distribution(records))


@app.route("/admin")
def admin_stats():
    records = load_data()
    dist = calc_distribution(records)
    test_records = [r for r in records if r.get('values')]
    examples = [r for r in records if r.get('text')]
    return render_template("admin.html", stats=dist,
                           raw=test_records[-100:], total=len(test_records),
                           examples=examples[-50:])


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
