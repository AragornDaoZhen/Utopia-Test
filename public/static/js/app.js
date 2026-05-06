/* ==============================================
   乌托邦测试 — 主应用逻辑
   ============================================== */

(function () {
    'use strict';
    const DIMS = window.DIMENSIONS || [];

    // ---------- State ----------
    const selections = {};
    const cardStates = {};
    let confirmShown = false;
    let idleTimer = null;
    let resultShown = false;

    function cardKey(dim, val) { return `${dim}-${val}`; }
    function $card(dim, val) { return document.querySelector(`.card[data-dim="${dim}"][data-value="${val}"]`); }

    // ---------- Toast ----------
    function showToast(msg, duration = 2500) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.remove('hidden');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.add('hidden'), duration);
    }

    // ---------- Card Interaction ----------
    function initCards() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', handleCardClick);
        });
    }

    function handleCardClick(e) {
        const card = e.currentTarget;
        const dim = parseInt(card.dataset.dim);
        const val = parseInt(card.dataset.value);
        const key = cardKey(dim, val);
        const wrapper = card.parentElement;
        const currentState = cardStates[key] || 'idle';
        if (currentState === 'selected') return;

        wrapper.classList.add('card-press');
        setTimeout(() => wrapper.classList.remove('card-press'), 200);

        if (currentState === 'idle') {
            spawnDust(wrapper);
            cardStates[key] = 'flipped';
            wrapper.classList.add('flipped-revealed');
            updateDot(dim, val, 'revealed');
            updateSideProgress();
            updateBottomHint();
            return;
        }

        if (currentState === 'flipped') {
            if (selections[dim] !== undefined) {
                const prevVal = selections[dim];
                cardStates[cardKey(dim, prevVal)] = 'flipped';
                $card(dim, prevVal).parentElement.classList.remove('selected');
                updateDot(dim, prevVal, 'revealed');
            }
            cardStates[key] = 'selected';
            selections[dim] = val;
            wrapper.classList.add('selected');
            updateDot(dim, val, 'selected');
            updateSideProgress();

            const dimData = DIMS[dim];
            const label = dimData.labels[String(val)] || '';
            showToast(`${dimData.name}：${label}`, 1500);

            if (allDimsComplete() && allCardsFlipped()) {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(showConfirmation, 1200);
            }
        }
    }

    // ---------- Dust Particles ----------
    function spawnDust(wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        for (let i = 0; i < 8; i++) {
            const p = document.createElement('span');
            p.className = 'dust-particle';
            const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
            const dist = 20 + Math.random() * 30;
            p.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist}px;animation:dustBurst .5s ease-out forwards;`;
            const front = wrapper.querySelector('.card-front');
            p.style.backgroundColor = front ? getComputedStyle(front).backgroundColor : '#ccc';
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 600);
        }
    }

    // ---------- Progress Dots ----------
    function updateDot(dim, val, state) {
        const dot = document.querySelector(`.dot[data-dim="${dim}"][data-dot="${val}"]`);
        if (!dot) return;
        dot.classList.remove('revealed', 'selected');
        if (state) dot.classList.add(state);
    }

    // ---------- Side Progress Bar ----------
    function updateSideProgress() {
        for (let i = 0; i < 4; i++) {
            const dot = document.querySelector(`.sp-dot[data-sp="${i}"]`);
            if (!dot) continue;
            dot.classList.remove('done', 'current');
            if (selections[i] !== undefined) {
                dot.classList.add('done');
            }
        }
        // Find first incomplete dim to mark as current
        for (let i = 0; i < 4; i++) {
            if (selections[i] === undefined) {
                const dot = document.querySelector(`.sp-dot[data-sp="${i}"]`);
                if (dot) dot.classList.add('current');
                break;
            }
        }
    }

    // ---------- Validation ----------
    function isDimComplete(dim) { return selections[dim] !== undefined; }
    function allDimsComplete() { return DIMS.every(d => selections[d.id] !== undefined); }
    function allCardsFlipped() {
        return DIMS.every(dim => {
            return [-2, -1, 1, 2].every(v => {
                const s = cardStates[cardKey(dim.id, v)] || 'idle';
                return s === 'flipped' || s === 'selected';
            });
        });
    }
    function getSelectionArray() { return DIMS.map(d => selections[d.id] || null); }

    // ---------- Bottom Hint ----------
    function updateBottomHint() {
        const hint = document.getElementById('bottom-hint');
        if (allDimsComplete() && allCardsFlipped()) {
            hint.classList.add('hidden');
        } else {
            hint.classList.remove('hidden');
        }
    }

    // ---------- Confirmation Modal ----------
    function showConfirmation() {
        if (confirmShown || resultShown) return;
        if (!allDimsComplete() || !allCardsFlipped()) return;
        confirmShown = true;
        document.getElementById('bottom-hint').classList.add('hidden');
        const modal = document.getElementById('confirm-modal');
        modal.classList.remove('hidden');
        document.getElementById('btn-yes').onclick = () => {
            if (!allDimsComplete() || !allCardsFlipped()) {
                showToast('请翻开所有卡片并选择4张', 2000);
                return;
            }
            modal.classList.add('hidden');
            showResult();
        };
        document.getElementById('btn-no').onclick = () => {
            modal.classList.add('hidden');
            confirmShown = false;
        };
    }

    // ---------- Scroll Control ----------
    function initScrollControl() {
        const dimGroups = document.querySelectorAll('.dimension-group');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const dim = parseInt(entry.target.dataset.dim);
                    if (!isNaN(dim)) {
                        if (dim === 3 && allDimsComplete() && allCardsFlipped() && !confirmShown && !resultShown) {
                            clearTimeout(idleTimer);
                            idleTimer = setTimeout(showConfirmation, 800);
                        }
                    }
                }
            });
        }, { threshold: 0.15 }); // Lower threshold for mobile
        dimGroups.forEach(g => observer.observe(g));

        // Bottom trigger observer
        const bottomTrigger = document.getElementById('bottom-trigger');
        if (bottomTrigger) {
            const bottomObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    if (!resultShown && !confirmShown) {
                        if (allDimsComplete() && allCardsFlipped()) {
                            showConfirmation();
                        } else {
                            updateBottomHint();
                        }
                    }
                }
            }, { threshold: 0.1 });
            bottomObserver.observe(bottomTrigger);
        }
    }

    // ---------- Result Display ----------
    const CHAR_MAP = {
        0: { I: '独', C: '协' }, 1: { E: '平', C: '阶' },
        2: { H: '和', C: '竞' }, 3: { C: '守', P: '进' },
    };
    const ABBR_MAP = {
        0: { '-2': 'I', '-1': 'I', '1': 'C', '2': 'C' },
        1: { '-2': 'E', '-1': 'E', '1': 'C', '2': 'C' },
        2: { '-2': 'H', '-1': 'H', '1': 'C', '2': 'C' },
        3: { '-2': 'C', '-1': 'C', '1': 'P', '2': 'P' },
    };
    const POLE_LABELS = [
        { left: '独立', right: '协作' }, { left: '平等', right: '阶级' },
        { left: '和谐', right: '竞争' }, { left: '保守', right: '进步' },
    ];

    function getCode(values) {
        let code = '';
        for (let i = 0; i < values.length; i++) {
            code += ABBR_MAP[i][values[i] < 0 ? '-2' : String(values[i])] || '?';
        }
        return code;
    }
    function getCNName(values) {
        const code = getCode(values);
        return (CHAR_MAP[0][code[0]]||'') + (CHAR_MAP[1][code[1]]||'') +
               (CHAR_MAP[2][code[2]]||'') + (CHAR_MAP[3][code[3]]||'');
    }
    function lookupResult(values) {
        const code = getCode(values);
        for (const r of (window.RESULTS || [])) {
            if (r[0] === code) return { abbr: r[0], combo: r[1], cn_name: r[2], description: r[3], examples: r[4] };
        }
        return null;
    }

    function showResult() {
        resultShown = true;
        document.getElementById('bottom-hint').classList.add('hidden');
        document.getElementById('side-progress').style.display = 'none';
        const values = getSelectionArray();
        const resultSection = document.getElementById('result');
        resultSection.innerHTML = `<div id="result-content">${generateResultHTML(values)}</div>`;
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth' });
        loadChartJS(() => drawRadarChart(values));
        initShareButton();
        initUserExampleSubmit();
        submitResult(values);
    }

    function generateResultHTML(values) {
        const result = lookupResult(values);
        const code = getCode(values);
        const cnName = getCNName(values);
        if (!result) return `<div class="result-error">未能找到对应结果类型</div>`;

        const dimLabels = values.map((v, i) => {
            const dim = DIMS[i];
            const card = dim.cards[String(v)];
            const pole = v < 0 ? POLE_LABELS[i].left : POLE_LABELS[i].right;
            return `<span class="res-dim-tag" style="background:${card.color}22;color:${card.color};border-color:${card.color}">${dim.name}：${pole}</span>`;
        }).join('');

        const examples = (result.examples || []).map((ex, i) => `
            <div class="example-item">
                <div class="example-header"><span class="example-name">${i+1}. ${ex[0]}</span><span class="example-type">[${ex[1]}]</span></div>
                <p class="example-desc">${ex[2]}</p>
            </div>`).join('');

        const dimDetails = values.map((v, i) => {
            const dim = DIMS[i];
            const card = dim.cards[String(v)];
            const label = dim.labels[String(v)] || '';
            return `<div class="dim-detail-item">
                <div class="dim-detail-header"><span class="dim-detail-name">${dim.name}</span><span class="dim-detail-label" style="color:${card.color}">${label}</span></div>
                <p class="dim-detail-text">${card.text}</p>
            </div>`;
        }).join('');

        return `
        <div class="result-container">
            <div class="result-illustration">
                <div class="result-illustration-inner"><span class="result-code">${code}</span></div>
            </div>
            <h2 class="result-title">${code} — ${cnName}</h2>

            <div class="result-examples">
                <h3 class="section-heading">相似社会形态举例</h3>
                <div class="examples-list">${examples}</div>
            </div>

            <div class="result-dim-details">
                <h3 class="section-heading">你的维度选择详情</h3>
                ${dimDetails}
            </div>

            <div class="result-chart-section">
                <h3 class="section-heading">维度对比</h3>
                <div class="chart-wrapper"><canvas id="radar-chart"></canvas></div>
                <div id="card-dot-matrix" class="card-dot-matrix" style="display:none"></div>
                <div id="rarity-module" class="rarity-module" style="display:none">
                    <div class="rarity-item"><div class="rarity-value" id="rarity-pct">--</div><div class="rarity-label">与你选择相同</div></div>
                    <div class="rarity-item"><div class="rarity-value" id="rarity-opposite">--</div><div class="rarity-label">与你选择相反</div></div>
                </div>
            </div>

            <div class="result-ending">
                <div class="ending-sep">结 语</div>
                <p>每个人理想的社会形态都不尽相同，传统的终极乌托邦思想常沦反乌托邦，并不存在一个所有人都认可的乌托邦。但无需否定乌托邦的意义，因为当它作为理想社会的代名词时，每个人心中的理想社会都不可轻易否定，且每时每刻都在影响现实。根本问题也并非在于如何将理想变为现实（实际上，有的人已经处在乌托邦中，但是乌托邦不属于所有人），而是如何让尽可能多的人可以将各自的理想变为和平共处的各自追求的可检验与选择的现实，避免"彼之天堂，吾之地狱"的局面。</p>
                <p class="result-ending-hint">20世纪的哲学家罗伯特·诺齐克（Robert Nozick）在政治哲学领域提出了"元乌托邦"（meta-utopia）或"乌托邦的框架"（framework for utopia）的概念，为解决此根本问题提供了思路和方向。</p>
            </div>

            <div class="user-example-section">
                <h3 class="section-heading">你的乌托邦举例（可选）</h3>
                <textarea id="user-example-input" class="user-example-input" placeholder="请随意" rows="3"></textarea>
                <button id="user-example-submit" class="user-example-submit-btn">提交</button>
                <div id="user-example-msg" class="user-example-msg" style="display:none"></div>
            </div>

            <button id="share-btn" class="share-btn">保存结果图片</button>
        </div>`;
    }

    // ---------- Radar Chart ----------
    function loadChartJS(callback) {
        if (window.Chart) { callback(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    let currentRarityData = null;
    let currentCardCounts = null;
    let currentCardTotal = 0;

    function drawRadarChart(values) {
        const canvas = document.getElementById('radar-chart');
        if (!canvas || !window.Chart) return;

        const poleLabels = ['独立','平等','和谐','保守','协作','阶级','竞争','进步'];
        const userData8 = [];
        for (let i = 0; i < 4; i++) {
            const v = values[i];
            if (v < 0) { userData8[i] = Math.abs(v); userData8[i + 4] = 0; }
            else { userData8[i] = 0; userData8[i + 4] = v; }
        }

        // Plugin: custom labels at sector symmetry lines
        const sectorLabelsPlugin = {
            id: 'sectorLabels',
            afterDraw(chart) {
                const meta = chart.getDatasetMeta(0);
                if (!meta || !meta.data || !meta.data.length) return;
                const rScale = chart.scales.r;
                if (!rScale) return;
                const ctx = chart.ctx;
                const cx = rScale.xCenter || rScale.x;
                const cy = rScale.yCenter || rScale.y;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                chart.data.labels.forEach((label, i) => {
                    const arc = meta.data[i];
                    if (!arc || arc.startAngle === undefined) return;
                    const midAngle = (arc.startAngle + arc.endAngle) / 2;
                    const r = rScale.drawingArea + 8;
                    const x = cx + Math.cos(midAngle) * r;
                    const y = cy + Math.sin(midAngle) * r;
                    ctx.font = "bold 14px 'Noto Serif SC','Source Han Serif CN',serif";
                    ctx.fillStyle = '#111';
                    ctx.fillText(label, x, y);
                });
            }
        };

        fetch('/api/stats')
            .then(r => r.json())
            .then(stats => {
                const poleAvg = (stats.pole_avg && stats.pole_avg.length === 8) ? stats.pole_avg : [0,0,0,0,0,0,0,0];
                const total = stats.total || 1;
                const dist = stats.distribution || {};
                const cardCounts = stats.card_counts || {};
                currentCardCounts = cardCounts;
                currentCardTotal = total;
                const code = getCode(values);
                const samePct = Math.round((dist[code]?.count||0) / total * 100);
                const oppositeCode = getCode(values.map(v => {if(v===-2)return 2;if(v===-1)return 1;if(v===1)return -1;if(v===2)return -2;return v;}));
                const oppositePct = Math.round((dist[oppositeCode]?.count||0) / total * 100);

                const rm = document.getElementById('rarity-module');
                if (rm && total > 0) { rm.style.display='flex'; document.getElementById('rarity-pct').textContent=samePct+'%'; document.getElementById('rarity-opposite').textContent=oppositePct+'%'; }
                const er = document.getElementById('export-rarity');
                if (er && total > 0) { er.textContent='相同 '+samePct+'%  |  相反 '+oppositePct+'%'; }

                drawCardDotMatrix(cardCounts, total);

                new Chart(canvas, {
                    type: 'polarArea',
                    data: {
                        labels: poleLabels,
                        datasets: [{
                            label: '你的选择',
                            data: userData8,
                            backgroundColor: '#3d7ec7aa',
                            borderColor: '#3d7ec7',
                            borderWidth: 1.5,
                        }, {
                            label: '全体平均',
                            data: poleAvg,
                            backgroundColor: 'rgba(184,132,46,0.45)',
                            borderColor: '#b8842e',
                            borderWidth: 1.5,
                            borderDash: [4, 2],
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: true,
                        layout: { padding: 22 },
                        scales: { r: { beginAtZero: true, max: 2, min: 0,
                            ticks: { stepSize: 1, display: false, backdropColor: 'transparent' },
                            grid: { color: 'rgba(0,0,0,0.06)' },
                            angleLines: { color: 'rgba(0,0,0,0.06)' },
                            pointLabels: { display: false },
                        }},
                        plugins: { legend: { display: false } }
                    },
                    plugins: [sectorLabelsPlugin]
                });
            })
            .catch(() => {
                new Chart(canvas, {
                    type: 'polarArea', data: { labels: poleLabels, datasets: [{
                        label: '你的选择', data: userData8,
                        backgroundColor: '#3d7ec7aa', borderColor: '#3d7ec7', borderWidth: 1.5,
                    }]},
                    options: {
                        responsive: true, maintainAspectRatio: true,
                        layout: { padding: 22 },
                        scales: { r: { beginAtZero: true, max: 2, min: 0,
                            ticks: { stepSize: 1, display: false }, grid: { color: 'rgba(0,0,0,0.06)' }, angleLines: { color: 'rgba(0,0,0,0.06)' },
                            pointLabels: { display: false },
                        }},
                        plugins: { legend: { display: false } }
                    },
                    plugins: [sectorLabelsPlugin]
                });
            });
    }

    // ---------- Card Dot Matrix ----------
    function drawCardDotMatrix(cardCounts, total) {
        const el = document.getElementById('card-dot-matrix');
        if (!el) return;
        const DIMS = window.DIMENSIONS || [];
        if (!DIMS.length) return;

        let html = '<div class="cm-title">全体平均</div>';
        DIMS.forEach((dim, di) => {
            html += `<div class="cm-row"><div class="cm-dim-name">${dim.name}</div><div class="cm-cards">`;
            [-2, -1, 1, 2].forEach(v => {
                const card = dim.cards[String(v)];
                const label = dim.labels[String(v)] || '';
                const count = (cardCounts[String(di)] && cardCounts[String(di)][String(v)]) || 0;
                const pct = total > 0 ? Math.round(count / total * 100) : 0;
                html += `<div class="cm-card" style="border-color:${card.color}">
                    <div class="cm-fill" style="background:${card.color};height:${Math.max(pct, 3)}%"></div>
                    <span class="cm-pct" style="color:${card.color}">${pct}%</span>
                    <span class="cm-label">${label}</span>
                </div>`;
            });
            html += '</div></div>';
        });
        el.innerHTML = html;
        el.style.display = 'block';
    }

    // ---------- API ----------
    async function submitResult(values) {
        try {
            await fetch('/api/submit', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ values }),
            });
        } catch (err) {}
    }

    // ---------- Share & Export ----------
    function initShareButton() {
        const btn = document.getElementById('share-btn');
        if (!btn) return;
        btn.addEventListener('click', exportImage);
    }
    function loadHtml2Canvas(callback) {
        if (window.html2canvas) { callback(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }
    function exportImage() {
        const btn = document.getElementById('share-btn');
        btn.textContent = '生成中...'; btn.disabled = true;
        loadHtml2Canvas(async () => {
            const container = document.querySelector('.result-container');
            if (!container) { btn.textContent = '保存结果图片'; btn.disabled = false; return; }
            const ending = container.querySelector('.result-ending');
            const example = container.querySelector('.user-example-section');
            // Temporarily hide ending + example + share button
            if (ending) ending.style.display = 'none';
            if (example) example.style.display = 'none';
            if (btn) btn.style.display = 'none';
            // Add QR overlay to the bottom-right of the container
            const qrUrl = 'https://utopia.org.cn';
            const qrEl = document.createElement('div');
            qrEl.style.cssText = 'position:absolute;bottom:8px;right:8px;z-index:10;pointer-events:none;';
            qrEl.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=${encodeURIComponent(qrUrl)}&margin=0" style="width:40px;height:40px;opacity:.3">`;
            container.style.position = 'relative';
            container.appendChild(qrEl);
            await new Promise(r => setTimeout(r, 200));
            try {
                const canvas = await html2canvas(container, { backgroundColor: '#f5f3ef', scale: 2, useCORS: true, allowTaint: true, logging: false });
                const link = document.createElement('a');
                link.download = '乌托邦测试结果.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
                showToast('结果图片已保存');
            } catch(e) {
                showToast('图片保存失败，请截图保存');
            }
            // Restore
            qrEl.remove();
            container.style.position = '';
            if (ending) ending.style.display = '';
            if (example) example.style.display = '';
            if (btn) btn.style.display = '';
            btn.textContent = '保存结果图片'; btn.disabled = false;
        });
    }

    function buildExportHTML() {
        const values = getSelectionArray();
        const result = lookupResult(values);
        const code = getCode(values);
        const cnName = getCNName(values);
        if (!result) return '';

        const examples = (result.examples || []).map((ex, i) =>
            `<div style="margin-bottom:4px;padding:4px 8px;font-size:10px;background:rgba(0,0,0,.02);border-radius:6px"><b>${i+1}. ${ex[0]}</b> <span style="color:#6e6e78">${ex[2]}</span></div>`
        ).join('');

        const dimDetails = values.map((v, i) => {
            const dim = DIMS[i]; const card = dim.cards[String(v)];
            const label = dim.labels[String(v)] || '';
            return `<div style="margin-bottom:4px;padding:4px 8px;background:#fafaf8;border-radius:6px;border:1px solid #ddd9d2"><span style="font-weight:600;font-size:10px">${dim.name}</span> <span style="font-size:10px;color:${card.color}">${label}</span></div>`;
        }).join('');

        const qrUrl = 'https://utopia.org.cn';

        let cardMatrixHtml = '';
        const DIMS = window.DIMENSIONS || [];
        if (currentCardCounts && currentCardTotal > 0 && DIMS.length) {
            cardMatrixHtml = '<div style="margin-top:8px;padding:8px;background:#fafaf8;border-radius:8px;border:1px solid #ddd9d2">';
            cardMatrixHtml += '<div style="text-align:center;font-size:11px;font-weight:700;color:#b8842e;margin-bottom:4px;font-family:\'Noto Serif SC\',serif">全体平均</div>';
            DIMS.forEach((dim, di) => {
                cardMatrixHtml += `<div style="display:flex;gap:3px;margin-bottom:2px;font-size:9px"><span style="color:#999;width:52px;flex-shrink:0">${dim.name}</span>`;
                [-2,-1,1,2].forEach(v => {
                    const card = dim.cards[String(v)];
                    const label = dim.labels[String(v)]||'';
                    const count = (currentCardCounts[String(di)]&&currentCardCounts[String(di)][String(v)])||0;
                    const pct = Math.round(count/currentCardTotal*100);
                    cardMatrixHtml += `<span style="flex:1;text-align:center;background:${card.color};color:#fff;border-radius:3px;padding:1px 2px;opacity:${Math.max(pct/100,.12)}">${pct}%</span>`;
                });
                cardMatrixHtml += '</div>';
            });
            cardMatrixHtml += '</div>';
        }

        return `<div style="text-align:center;position:relative;padding:16px 8px 20px;font-family:'Noto Serif SC','Source Han Serif CN',serif;color:#1e1e24">
        <div style="font-size:30px;font-weight:900;color:#3d7ec7;letter-spacing:.1em;font-family:'Noto Serif SC','Source Han Serif CN',serif">${code}</div>
        <div style="font-size:18px;font-weight:700;margin:2px 0 10px;font-family:'Noto Serif SC','Source Han Serif CN',serif">${cnName}</div>
        <div style="text-align:left;margin-bottom:8px"><div style="font-size:11px;font-weight:700;color:#3d7ec7;margin-bottom:4px">相似社会形态举例</div>${examples}</div>
        <div style="text-align:left;margin-bottom:8px"><div style="font-size:11px;font-weight:700;color:#3d7ec7;margin-bottom:4px">维度选择详情</div>${dimDetails}</div>
        <div style="margin:8px 0"><canvas id="export-radar" style="max-width:100%;width:100%"></canvas></div>
        ${cardMatrixHtml}
        <div style="text-align:center;padding:4px 0;font-size:12px;color:#6e6e78;font-family:'Noto Serif SC','Source Han Serif CN',serif" id="export-rarity">--</div>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(qrUrl)}&margin=0" style="position:absolute;bottom:8px;right:8px;width:40px;height:40px;opacity:.22" alt="" onerror="this.style.display='none'">
        </div>`;
    }

    // ---------- Init ----------
    function init() {
        initCards();
        initScrollControl();
        updateSideProgress();
        updateBottomHint();
        console.log('乌托邦测试已加载');
    }

    function initUserExampleSubmit() {
        const btn = document.getElementById('user-example-submit');
        const input = document.getElementById('user-example-input');
        const msg = document.getElementById('user-example-msg');
        if (!btn || !input) return;
        btn.addEventListener('click', async () => {
            const text = input.value.trim();
            if (!text) { msg.style.display = 'block'; msg.textContent = '请输入内容后再提交'; msg.style.color = '#d95645'; return; }
            btn.disabled = true; btn.textContent = '提交中...';
            msg.style.display = 'none';
            try {
                const resp = await fetch('/api/submit-example', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, code: getCode(getSelectionArray()) }),
                });
                const data = await resp.json();
                msg.style.display = 'block';
                if (data.ok) {
                    msg.textContent = '感谢你的分享！'; msg.style.color = '#5C8F37';
                    input.disabled = true; btn.style.display = 'none';
                } else if (resp.status === 429) {
                    msg.textContent = '你已经提交过了，每人仅限一次'; msg.style.color = '#b8842e';
                    input.disabled = true; btn.style.display = 'none';
                } else {
                    msg.textContent = '提交失败，请稍后重试'; msg.style.color = '#d95645';
                    btn.disabled = false; btn.textContent = '提交';
                }
            } catch(e) {
                msg.style.display = 'block'; msg.textContent = '提交失败，请稍后重试'; msg.style.color = '#d95645';
                btn.disabled = false; btn.textContent = '提交';
            }
        });
    }
    init();

    window._utopia = {
        getSelections: getSelectionArray, allComplete: allDimsComplete,
        selections, cardStates, showToast, showResult,
    };
})();
