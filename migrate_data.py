# -*- coding: utf-8 -*-
"""Migrate legacy data files into unified data.json."""
import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE, 'data')

# --- read legacy files ---
stats = {"results": [], "total": 0}
stats_path = os.path.join(DATA_DIR, 'stats.json')
if os.path.exists(stats_path):
    with open(stats_path, 'r', encoding='utf-8') as f:
        stats = json.load(f)

examples = []
ex_path = os.path.join(DATA_DIR, 'examples.json')
if os.path.exists(ex_path):
    with open(ex_path, 'r', encoding='utf-8') as f:
        examples = json.load(f)

submitted = {}
sub_path = os.path.join(DATA_DIR, 'submitted_ips.json')
if os.path.exists(sub_path):
    with open(sub_path, 'r', encoding='utf-8') as f:
        submitted = json.load(f)

# --- merge into unified records ---
records = []

# Legacy test results (no IP traceability — mark as "legacy")
for vals in stats.get('results', []):
    records.append({
        "ip": "legacy",
        "values": vals,
        "text": None,
        "time": None
    })

# Examples — try to match with known IPs
# submitted_ips.json maps IP → time for example submissions
# We'll match by approximate timestamp
for ex in examples:
    ip = "legacy"
    ex_time = ex.get('time', '')
    # Try to find a matching IP from submitted_ips
    for known_ip, known_time in submitted.items():
        if isinstance(known_time, str) and known_time[:16] == ex_time[:16]:
            ip = known_ip
            break
    records.append({
        "ip": ip,
        "values": None,
        "text": ex.get('text', ''),
        "code": ex.get('code', ''),
        "time": ex_time
    })

# Write unified data.json
out_path = os.path.join(DATA_DIR, 'data.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

# --- whitelist: IPs from submitted_ips.json ---
whitelist = [ip for ip in submitted.keys() if isinstance(submitted[ip], str)]
wl_path = os.path.join(DATA_DIR, 'whitelist.json')
with open(wl_path, 'w', encoding='utf-8') as f:
    json.dump(whitelist, f, ensure_ascii=False)

print(f"data.json: {len(records)} records")
print(f"whitelist.json: {whitelist}")
print("Migration complete.")
