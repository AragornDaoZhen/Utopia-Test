/* ==============================================
   乌托邦测试 — 主应用逻辑（静态版 / GitHub Pages）
   舍弃了 Flask 后端依赖：无 API 调用，纯本地运行
   ============================================== */

(function () {
    'use strict';

    // ---------- Global Data (loaded from JSON) ----------
    let DIMS = [];
    let RESULTS = [];

    // ---------- State ----------
    const selections = {};
    const cardStates = {};
    let confirmShown = false;
    let idleTimer = null;
    let resultShown = false;

    function cardKey(dim, val) { return dim + '-' + val; }
    function $card(dim, val) { return document.querySelector('.card[data-dim="' + dim + '"][data-value="' + val + '"]'); }

    // ---------- Toast ----------
    function showToast(msg, duration) {
        if (!duration) duration = 2500;
        var toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.remove('hidden');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(function () { toast.classList.add('hidden'); }, duration);
    }

    // ---------- Build Cards Section ----------
    function buildCardsSection() {
        var section = document.getElementById('cards');
        var html = '';
        DIMS.forEach(function (dim) {
            var vals = [-2, -1, 1, 2];
            html += '<div class="dimension-group" id="dim-' + dim.id + '" data-dim="' + dim.id + '">';
            html += '<h2 class="dim-title"><span class="dim-num">' + (dim.id + 1) + '</span>' + dim.name + '</h2>';
            html += '<div class="card-row">';
            vals.forEach(function (v) {
                var card = dim.cards[String(v)];
                html += '<div class="card-wrapper">';
                html += '<div class="card" data-dim="' + dim.id + '" data-value="' + v + '">';
                html += '<div class="card-face card-front" style="background: linear-gradient(135deg, ' + card.color + ', rgba(0,0,0,0.4));">';
                html += '<div class="card-front-pattern"><span class="card-front-label">' + card.abbr + '</span></div>';
                html += '</div>';
                html += '<div class="card-face card-back">';
                html += '<span class="card-back-text">' + card.text + '</span>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
            html += '<div class="dim-progress">';
            vals.forEach(function (v) {
                html += '<span class="dot" data-dim="' + dim.id + '" data-dot="' + v + '"></span>';
            });
            html += '</div>';
            html += '</div>';
        });
        html += '<div id="bottom-trigger" class="bottom-trigger"></div>';
        section.innerHTML = html;
    }

    // ---------- Card Interaction ----------
    function initCards() {
        document.querySelectorAll('.card').forEach(function (card) {
            card.addEventListener('click', handleCardClick);
        });
    }

    function handleCardClick(e) {
        var card = e.currentTarget;
        var dim = parseInt(card.dataset.dim);
        var val = parseInt(card.dataset.value);
        var key = cardKey(dim, val);
        var wrapper = card.parentElement;
        var currentState = cardStates[key] || 'idle';
        if (currentState === 'selected') return;

        wrapper.classList.add('card-press');
        setTimeout(function () { wrapper.classList.remove('card-press'); }, 200);

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
                var prevVal = selections[dim];
                cardStates[cardKey(dim, prevVal)] = 'flipped';
                cleanSelection(dim, prevVal);
                updateDot(dim, prevVal, 'revealed');
            }
            cardStates[key] = 'selected';
            selections[dim] = val;
            wrapper.classList.add('selected');
            updateDot(dim, val, 'selected');
            updateSideProgress();

            var dimData = DIMS[dim];
            var label = dimData.labels[String(val)] || '';
            showToast(dimData.name + '：' + label, 1500);

            if (allDimsComplete() && allCardsFlipped()) {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(showConfirmation, 1200);
            }
        }
    }

    function cleanSelection(dim, prevVal) {
        var card = $card(dim, prevVal);
        if (card) { card.parentElement.classList.remove('selected'); }
    }

    // ---------- Dust Particles ----------
    function spawnDust(wrapper) {
        var rect = wrapper.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        for (var i = 0; i < 8; i++) {
            var p = document.createElement('span');
            p.className = 'dust-particle';
            var angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
            var dist = 20 + Math.random() * 30;
            p.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;--dx:' + (Math.cos(angle) * dist) + 'px;--dy:' + (Math.sin(angle) * dist) + 'px;animation:dustBurst .5s ease-out forwards;';
            var front = wrapper.querySelector('.card-front');
            p.style.backgroundColor = front ? window.getComputedStyle(front).backgroundColor : '#ccc';
            document.body.appendChild(p);
            setTimeout(function () { p.remove(); }, 600);
        }
    }

    // ---------- Progress Dots ----------
    function updateDot(dim, val, state) {
        var dot = document.querySelector('.dot[data-dim="' + dim + '"][data-dot="' + val + '"]');
        if (!dot) return;
        dot.classList.remove('revealed', 'selected');
        if (state) dot.classList.add(state);
    }

    // ---------- Side Progress Bar ----------
    function updateSideProgress() {
        for (var i = 0; i < 4; i++) {
            var dot = document.querySelector('.sp-dot[data-sp="' + i + '"]');
            if (!dot) continue;
            dot.classList.remove('done', 'current');
            if (selections[i] !== undefined) dot.classList.add('done');
        }
        for (var j = 0; j < 4; j++) {
            if (selections[j] === undefined) {
                var cd = document.querySelector('.sp-dot[data-sp="' + j + '"]');
                if (cd) cd.classList.add('current');
                break;
            }
        }
    }

    // ---------- Validation ----------
    function isDimComplete(dim) { return selections[dim] !== undefined; }
    function allDimsComplete() { return DIMS.every(function (d) { return selections[d.id] !== undefined; }); }
    function allCardsFlipped() {
        return DIMS.every(function (dim) {
            return [-2, -1, 1, 2].every(function (v) {
                var s = cardStates[cardKey(dim.id, v)] || 'idle';
                return s === 'flipped' || s === 'selected';
            });
        });
    }
    function getSelectionArray() { return DIMS.map(function (d) { return selections[d.id] || null; }); }

    // ---------- Bottom Hint ----------
    function updateBottomHint() {
        var hint = document.getElementById('bottom-hint');
        if (allDimsComplete() && allCardsFlipped()) hint.classList.add('hidden');
        else hint.classList.remove('hidden');
    }

    // ---------- Confirmation Modal ----------
    function showConfirmation() {
        if (confirmShown || resultShown) return;
        if (!allDimsComplete() || !allCardsFlipped()) return;
        confirmShown = true;
        document.getElementById('bottom-hint').classList.add('hidden');
        var modal = document.getElementById('confirm-modal');
        modal.classList.remove('hidden');
        document.getElementById('btn-yes').onclick = function () {
            if (!allDimsComplete() || !allCardsFlipped()) {
                showToast('请翻开所有卡片并选择4张', 2000);
                return;
            }
            modal.classList.add('hidden');
            showResult();
        };
        document.getElementById('btn-no').onclick = function () {
            modal.classList.add('hidden');
            confirmShown = false;
        };
    }

    // ---------- Scroll Control ----------
    function initScrollControl() {
        var dimGroups = document.querySelectorAll('.dimension-group');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var dim = parseInt(entry.target.dataset.dim);
                    if (!isNaN(dim) && dim === 3 && allDimsComplete() && allCardsFlipped() && !confirmShown && !resultShown) {
                        clearTimeout(idleTimer);
                        idleTimer = setTimeout(showConfirmation, 800);
                    }
                }
            });
        }, { threshold: 0.15 });
        dimGroups.forEach(function (g) { observer.observe(g); });

        var bottomTrigger = document.getElementById('bottom-trigger');
        if (bottomTrigger) {
            var bottomObserver = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting && !resultShown && !confirmShown) {
                    if (allDimsComplete() && allCardsFlipped()) showConfirmation();
                    else updateBottomHint();
                }
            }, { threshold: 0.1 });
            bottomObserver.observe(bottomTrigger);
        }
    }

    // ---------- Result Logic ----------
    var CHAR_MAP = { 0: { I: '独', C: '协' }, 1: { E: '平', C: '阶' }, 2: { H: '和', C: '竞' }, 3: { C: '守', P: '进' } };
    var ABBR_MAP = {
        0: { '-2': 'I', '-1': 'I', '1': 'C', '2': 'C' },
        1: { '-2': 'E', '-1': 'E', '1': 'C', '2': 'C' },
        2: { '-2': 'H', '-1': 'H', '1': 'C', '2': 'C' },
        3: { '-2': 'C', '-1': 'C', '1': 'P', '2': 'P' }
    };
    var POLE_LABELS = [
        { left: '独立', right: '协作' }, { left: '平等', right: '阶级' },
        { left: '和谐', right: '竞争' }, { left: '保守', right: '进步' }
    ];

    function getCode(values) {
        var code = '';
        for (var i = 0; i < values.length; i++) {
            code += ABBR_MAP[i][values[i] < 0 ? '-2' : String(values[i])] || '?';
        }
        return code;
    }

    function getCNName(values) {
        var code = getCode(values);
        return (CHAR_MAP[0][code[0]] || '') + (CHAR_MAP[1][code[1]] || '') + (CHAR_MAP[2][code[2]] || '') + (CHAR_MAP[3][code[3]] || '');
    }

    function lookupResult(values) {
        var code = getCode(values);
        for (var i = 0; i < RESULTS.length; i++) {
            if (RESULTS[i][0] === code) {
                return { abbr: RESULTS[i][0], combo: RESULTS[i][1], cn_name: RESULTS[i][2], description: RESULTS[i][3], examples: RESULTS[i][4] };
            }
        }
        return null;
    }

    function showResult() {
        resultShown = true;
        document.getElementById('bottom-hint').classList.add('hidden');
        document.getElementById('side-progress').style.display = 'none';
        var values = getSelectionArray();
        var section = document.getElementById('result');
        section.innerHTML = '<div id="result-content">' + generateResultHTML(values) + '</div>';
        section.classList.remove('hidden');
        section.scrollIntoView({ behavior: 'smooth' });
        loadChartJS(function () { drawRadarChart(values); });
        initShareButton();
    }

    function generateResultHTML(values) {
        var result = lookupResult(values);
        var code = getCode(values);
        var cnName = getCNName(values);
        if (!result) return '<div class="result-error">未能找到对应结果类型</div>';

        var dimTags = values.map(function (v, i) {
            var dim = DIMS[i];
            var card = dim.cards[String(v)];
            var pole = v < 0 ? POLE_LABELS[i].left : POLE_LABELS[i].right;
            return '<span class="res-dim-tag" style="background:' + card.color + '22;color:' + card.color + ';border-color:' + card.color + '">' + dim.name + '：' + pole + '</span>';
        }).join('');

        var examples = (result.examples || []).map(function (ex, i) {
            return '<div class="example-item"><div class="example-header"><span class="example-name">' + (i + 1) + '. ' + ex[0] + '</span><span class="example-type">[' + ex[1] + ']</span></div><div class="example-desc">' + ex[2] + '</div></div>';
        }).join('');

        var dimDetails = values.map(function (v, i) {
            var dim = DIMS[i];
            var card = dim.cards[String(v)];
            var label = dim.labels[String(v)] || '';
            return '<div class="dim-detail-item"><div class="dim-detail-header"><span class="dim-detail-name">' + dim.name + '</span><span class="dim-detail-label" style="color:' + card.color + '">' + label + '</span></div><div class="dim-detail-text">' + card.text + '</div></div>';
        }).join('');

        return '<div class="result-container">' +
            '<div class="result-illustration" style="background:linear-gradient(135deg,#e8e4dd,#f0ece5)!important">' +
            '<div class="result-code">' + code + '</div>' +
            '</div>' +
            '<div class="result-title">' + cnName + '</div>' +
            '<div class="result-dim-tags">' + dimTags + '</div>' +
            '<p style="text-align:left;line-height:1.8;color:var(--text-secondary);margin-bottom:1.5rem;font-size:.95rem">' + result.description + '</p>' +
            '<div class="result-examples">' +
            '<h3 class="section-heading">相似社会形态举例</h3>' +
            examples +
            '</div>' +
            '<div class="result-dim-details">' +
            '<h3 class="section-heading">你的维度选择详情</h3>' +
            dimDetails +
            '</div>' +
            '<div class="result-chart-section">' +
            '<h3 class="section-heading">维度对比</h3>' +
            '<div class="chart-wrapper"><canvas id="radar-chart"></canvas></div>' +
            '</div>' +
            '<div class="result-ending">' +
            '<div class="ending-sep">结 语</div>' +
            '<p>每个人理想的社会形态都不尽相同，传统的终极乌托邦思想常沦反乌托邦，并不存在一个所有人都认可的乌托邦。但无需否定乌托邦的意义，因为当它作为理想社会的代名词时，每个人心中的理想社会都不可轻易否定，且每时每刻都在影响现实。根本问题也并非在于如何将理想变为现实（实际上，有的人已经处在乌托邦中，但是乌托邦不属于所有人），而是如何让尽可能多的人可以将各自的理想变为和平共处的各自追求的可检验与选择的现实，避免"彼之天堂，吾之地狱"的局面。</p>' +
            '<p class="result-ending-hint">20世纪的哲学家罗伯特·诺齐克（Robert Nozick）在政治哲学领域提出了"元乌托邦"（meta-utopia）或"乌托邦的框架"（framework for utopia）的概念，为解决此根本问题提供了思路和方向。</p>' +
            '</div>' +
            '<button id="share-btn" class="share-btn">保存结果图片</button>' +
            '<a id="github-btn" class="github-btn" href="https://github.com/AragornDaoZhen/Utopia-Test" target="_blank" rel="noopener">' +
            '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>' +
            '<span>GitHub</span></a>' +
            '</div>';
    }

    // ---------- Radar Chart ----------
    function loadChartJS(callback) {
        if (window.Chart) { callback(); return; }
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    function drawRadarChart(values) {
        var canvas = document.getElementById('radar-chart');
        if (!canvas || !window.Chart) return;

        var poleLabels = ['独立', '平等', '和谐', '保守', '协作', '阶级', '竞争', '进步'];
        var userData8 = [];
        for (var i = 0; i < 4; i++) {
            var v = values[i];
            if (v < 0) { userData8[i] = Math.abs(v); userData8[i + 4] = 0; }
            else { userData8[i] = 0; userData8[i + 4] = v; }
        }

        var sectorLabelsPlugin = {
            id: 'sectorLabels',
            afterDraw: function (chart) {
                var meta = chart.getDatasetMeta(0);
                if (!meta || !meta.data || !meta.data.length) return;
                var rScale = chart.scales.r;
                if (!rScale) return;
                var ctx = chart.ctx;
                var cx = rScale.xCenter || rScale.x;
                var cy = rScale.yCenter || rScale.y;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                chart.data.labels.forEach(function (label, i) {
                    var arc = meta.data[i];
                    if (!arc || arc.startAngle === undefined) return;
                    var midAngle = (arc.startAngle + arc.endAngle) / 2;
                    var r = rScale.drawingArea + 8;
                    var x = cx + Math.cos(midAngle) * r;
                    var y = cy + Math.sin(midAngle) * r;
                    ctx.font = "bold 14px 'Noto Serif SC','Source Han Serif CN',serif";
                    ctx.fillStyle = '#111';
                    ctx.fillText(label, x, y);
                });
            }
        };

        new Chart(canvas, {
            type: 'polarArea',
            data: {
                labels: poleLabels,
                datasets: [{
                    label: '你的选择',
                    data: userData8,
                    backgroundColor: '#3d7ec7aa',
                    borderColor: '#3d7ec7',
                    borderWidth: 1.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                layout: { padding: 22 },
                scales: {
                    r: {
                        beginAtZero: true, max: 2, min: 0,
                        ticks: { stepSize: 1, display: false, backdropColor: 'transparent' },
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        angleLines: { color: 'rgba(0,0,0,0.06)' },
                        pointLabels: { display: false }
                    }
                },
                plugins: { legend: { display: false } }
            },
            plugins: [sectorLabelsPlugin]
        });
    }

    // ---------- Share & Export ----------
    function initShareButton() {
        var btn = document.getElementById('share-btn');
        if (!btn) return;
        btn.addEventListener('click', exportImage);
    }

    function loadHtml2Canvas(callback) {
        if (window.html2canvas) { callback(); return; }
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    function exportImage() {
        var btn = document.getElementById('share-btn');
        btn.textContent = '生成中...'; btn.disabled = true;
        loadHtml2Canvas(function () {
            var container = document.querySelector('.result-container');
            if (!container) { btn.textContent = '保存结果图片'; btn.disabled = false; return; }
            var ending = container.querySelector('.result-ending');
            if (ending) ending.style.display = 'none';
            btn.style.display = 'none';
            var qrEl = document.createElement('div');
            qrEl.style.cssText = 'position:absolute;bottom:8px;right:8px;z-index:10;pointer-events:none;';
            qrEl.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=40x40&data=https%3A%2F%2Faragorndaozhen.github.io%2FUtopia-Test%2F&margin=0" style="width:40px;height:40px;opacity:.3">';
            container.style.position = 'relative';
            container.appendChild(qrEl);
            setTimeout(function () {
                html2canvas(container, { backgroundColor: '#f5f3ef', scale: 2, useCORS: true, allowTaint: true, logging: false }).then(function (canvas) {
                    var link = document.createElement('a');
                    link.download = '乌托邦测试结果.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showToast('结果图片已保存');
                }).catch(function () {
                    showToast('图片保存失败，请截图保存');
                }).finally(function () {
                    qrEl.remove();
                    container.style.position = '';
                    if (ending) ending.style.display = '';
                    btn.style.display = '';
                    btn.textContent = '保存结果图片'; btn.disabled = false;
                });
            }, 200);
        });
    }

    // ---------- Init ----------
    function init() {
        DIMS = window.DIMENSIONS_DATA || [];
        RESULTS = window.RESULTS_DATA || [];
        window.DIMENSIONS = DIMS;
        window.RESULTS = RESULTS;

        if (!DIMS.length) {
            console.error('数据加载失败：DIMENSIONS_DATA 为空');
            showToast('数据加载失败，请刷新页面重试', 5000);
            return;
        }

        buildCardsSection();
        initCards();
        initScrollControl();
        updateSideProgress();
        updateBottomHint();
        console.log('乌托邦测试已加载（静态版）');
    }

    window.addEventListener('DOMContentLoaded', init);

    window._utopia = {
        getSelections: getSelectionArray, allComplete: allDimsComplete,
        selections: selections, cardStates: cardStates, showToast: showToast, showResult: showResult
    };
})();
