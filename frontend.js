function removeAllSelectOptions(selector) {
    while (selector.options.length > 0) { selector.remove(0); }
}

function addSelectOption(selector, text, enabled, value) {
    let option = new Option(text, value);
    option.disabled = !enabled;
    selector.add(option, undefined);
}

function getElementById(id) {
    const elem = document.getElementById(id);
    if (elem == null) throw new Error("Expected to find element with id: " + id);
    return elem;
}

function readString(id) { return getElementById(id).value; }

function familyChanged() {
    const family = readString("family");
    const testSelector = document.getElementById("test");
    removeAllSelectOptions(testSelector);
    if (family == "exact") {
        addSelectOption(testSelector, "Correlation: Bivariate normal model", true, 1);
    } else if (family == "f") {
        addSelectOption(testSelector, "ANCOVA: Fixed effects, main effects, and interactions", true, 'ANCOVA');
        addSelectOption(testSelector, "ANOVA: Fixed effects, omnibus, one-way", true, 'oneWayANOVA');
        addSelectOption(testSelector, "ANOVA: Fixed effects, special, main effects, and interactions", true, 'twoWayANOVA');
        addSelectOption(testSelector, "ANOVA: Repeated measures, between factors", true, 'betweenRepeatedANOVA');
        addSelectOption(testSelector, "ANOVA: Repeated measures, within factors", true, 'withinRepeatedANOVA');
        addSelectOption(testSelector, "ANOVA: Repeated measures, within-between interaction", true, 'withinBetweenRepeatedANOVA');
        addSelectOption(testSelector, "Hotelling's T²: One group mean vector", true, 'hotellingsOneGroup');
        addSelectOption(testSelector, "Hotelling's T²: Two group mean vectors", true, 'hotellingsTwoGroups');
        addSelectOption(testSelector, "MANOVA: Global effects", true, 'manovaGlobalEffects');
        addSelectOption(testSelector, "Linear multiple regression: Fixed model, R² deviation from zero", true, 'deviationFromZeroMultipleRegression');
        addSelectOption(testSelector, "Linear multiple regression: Fixed model, R² increase", true, 'increaseMultipleRegression');
    } else if (family == "t") {
        addSelectOption(testSelector, "Means: Difference between two dependent means (matched pairs)", true, 'dependentSamplesTTest');
        addSelectOption(testSelector, "Means: Difference between two independent means (two groups)", true, 'independentSamplesTTest');
        addSelectOption(testSelector, "Means: Difference from constant (one sample case)", true, 'oneSampleTTest');
    } else if (family == "chi") {
        addSelectOption(testSelector, "Goodness-of-fit tests: Contingency tables", true, 1);
    } else if (family == "z") {
        addSelectOption(testSelector, "Correlations: Two independent Pearson r's", true, 'twoIndependentCorrelations');
        addSelectOption(testSelector, "Correlations: Two dependent Pearson r's (common index)", true, 'twoDependentCorrelationsCommon');
        addSelectOption(testSelector, "Correlations: Two dependent Pearson r's (no common index)", true, 'twoDependentCorrelationsNoCommon');
        addSelectOption(testSelector, "Logistic regression", true, 'logisticRegression');
    }
    updateNumberOutputAreas();
}

function removeAllTableRows(container) { container.innerHTML = ''; }

function addTableOption(container, description, element) {
    let styledElement = element;
    if (element.includes('<input') && !element.includes('class='))
        styledElement = element.replace('<input', '<input class="m3-input"');
    else if (element.includes('<select') && !element.includes('class='))
        styledElement = element.replace('<select', '<select class="m3-select"');
    let idMatch = element.match(/id=['"]([^'"]+)['"]/);
    let forAttr = idMatch ? ` for="${idMatch[1]}"` : '';
    const rowHTML = `<div class="m3-input-row"><label${forAttr}>${description}:</label>${styledElement}</div>`;
    container.insertAdjacentHTML('beforeend', rowHTML);
}

function floatInputElement(id, defaultValue, step) {
    return `<input id="${id}" type="number" value="${defaultValue}" onchange="updateOutput()" min="0" max="999999" step="${step}">`;
}

function disableOutputElement(id) { getElementById(id).disabled = true; }
function enableOutputElement(id) { getElementById(id).disabled = false; }
function getInputTable() { return document.getElementById("input"); }

function updateNumberOutputAreas() {
    const inputTable = getInputTable();
    removeAllTableRows(inputTable);
    const family = readString("family");
    const test = readString("test");
    const analysis = readString("analysis");

    if (family == "f") {
        if (test == "deviationFromZeroMultipleRegression") {
            addTableOption(inputTable, "Number of predictors", "<input onchange='updateOutput()' id='nPredictors' value='2' min='0' max='1000' step='5'>");
        } else if (test == "increaseMultipleRegression") {
            addTableOption(inputTable, "Number of tested predictors", "<input onchange='updateOutput()' id='q' value='2' min='0' max='1000' step='1'>");
            addTableOption(inputTable, "Total number of predictors", "<input onchange='updateOutput()' id='p' value='5' min='0' max='1000' step='1'>");
        } else if (test == "oneWayANOVA") {
            addTableOption(inputTable, "Number of groups", "<input onchange='updateOutput()' id='k' value='5' min='1' max='1000' step='1'>");
        } else if (test == "twoWayANOVA") {
            addTableOption(inputTable, "Numerator df", "<input onchange='updateOutput()' id='q' value='10' min='1' max='1000' step='1'>");
            addTableOption(inputTable, "Number of groups", "<input onchange='updateOutput()' id='k' value='5' min='1' max='1000' step='1'>");
        } else if (test == "ANCOVA") {
            addTableOption(inputTable, "Numerator df", "<input onchange='updateOutput()' id='q' value='10' min='1' max='1000' step='1'>");
            addTableOption(inputTable, "Number of groups", "<input onchange='updateOutput()' id='k' value='5' min='1' max='1000' step='1'>");
            addTableOption(inputTable, "Number of covariates", "<input onchange='updateOutput()' id='p' value='2' min='2' max='1000' step='1'>");
        } else if (test == "betweenRepeatedANOVA") {
            addTableOption(inputTable, "Number of groups", "<input onchange='updateOutput()' id='k' value='2' min='0' max='1000' step='1'>");
            addTableOption(inputTable, "Number of measurement", "<input onchange='updateOutput()' id='m' value='2' min='2' max='1000' step='1'>");
            addTableOption(inputTable, "Corr among rep measures", "<input onchange='updateOutput()' id='rho' value='0.5' min='0' max='1' step='0.1'>");
        } else if (test == "withinRepeatedANOVA" || test == "withinBetweenRepeatedANOVA") {
            addTableOption(inputTable, "Number of groups", "<input onchange='updateOutput()' id='k' value='2' min='0' max='1000' step='1'>");
            addTableOption(inputTable, "Number of measurement", "<input onchange='updateOutput()' id='m' value='2' min='2' max='1000' step='1'>");
            addTableOption(inputTable, "Corr among rep measures", "<input onchange='updateOutput()' id='rho' value='0.5' min='0' max='1' step='0.1'>");
            addTableOption(inputTable, "Nonsphericity correction ε", "<input onchange='updateOutput()' id='epsilon' value='1' min='0' max='1' step='0.1'>");
        } else if (test == "hotellingsOneGroup" || test == "hotellingsTwoGroups") {
            addTableOption(inputTable, "Number of dependent variables", "<input onchange='updateOutput()' id='p' value='3' min='1' max='100' step='1'>");
        } else if (test == "manovaGlobalEffects") {
            addTableOption(inputTable, "Number of dependent variables", "<input onchange='updateOutput()' id='p' value='3' min='1' max='100' step='1'>");
            addTableOption(inputTable, "Number of groups", "<input onchange='updateOutput()' id='k' value='3' min='2' max='100' step='1'>");
        }
    } else if (family == "t") {
        addTableOption(inputTable, "Tail(s)", "<select onchange='updateOutput()' id='tail'><option value=1>One tail</option><option value=2>Two tails</option></select>");
    } else if (family == "chi") {
        addTableOption(inputTable, "Df", "<input onchange='updateOutput()' id='df' value='5' min='1' max='1000' step='1'>");
    } else if (family == "z") {
        addTableOption(inputTable, "Tail(s)", "<select onchange='updateOutput()' id='tail'><option value=1>One tail</option><option value=2>Two tails</option></select>");
        if (test == "twoDependentCorrelationsCommon") {
            addTableOption(inputTable, "Common sample size", "<input onchange='updateOutput()' id='nCommon' value='50' min='4' max='99999' step='1'>");
        }
        if (test == "logisticRegression") {
            addTableOption(inputTable, "Pr(Y=1|X=1) H0", "<input onchange='updateOutput()' id='p0' value='0.5' min='0.01' max='0.99' step='0.01'>");
            addTableOption(inputTable, "R² other X", "<input onchange='updateOutput()' id='r2' value='0' min='0' max='0.99' step='0.01'>");
        }
    }

    // Handle compromise mode
    const betaAlphaRow = document.getElementById("betaAlphaRow");
    if (betaAlphaRow) betaAlphaRow.style.display = (analysis === "compromise") ? "" : "none";

    enableOutputElement("n");
    enableOutputElement("alpha");
    enableOutputElement("power");
    enableOutputElement("es");

    if (analysis == "n") { disableOutputElement("n"); }
    else if (analysis == "alpha") { disableOutputElement("alpha"); }
    else if (analysis == "power") { disableOutputElement("power"); }
    else if (analysis == "es") { disableOutputElement("es"); }
    else if (analysis == "compromise") {
        disableOutputElement("alpha");
        disableOutputElement("power");
    }

    updateOutput();
}

function readFloat(id) { return parseFloat(getElementById(id).value); }

const highlightBorder = [{ border: '1px var(--favicon-red) solid' }];
const highlightTiming = { duration: 400, iterations: 1 };

function setFloat(id, value) {
    const elem = getElementById(id);
    elem.animate(highlightBorder, highlightTiming);
    elem.value = value;
}

function readInt(id) { return parseInt(getElementById(id).value); }
function tail() { return readInt("tail"); }
function alpha() { return readFloat("alpha"); }
function power() { return readFloat("power"); }
function es() { return readFloat("es"); }
function n() { return readFloat("n"); }

function restrictFloat(id) {
    const elem = getElementById(id);
    if (elem.max < elem.value) elem.value = elem.max;
}

function restrictInput() { restrictFloat("alpha"); }

function setError(text) { getElementById("error").innerText = text; }

function handleError(value) {
    if (value == -111 || value == -111.0) setError("Unable to find a solution for given input.");
}

function setOutput(id, out) { handleError(out); setFloat(id, out); }

function frontEndState() {
    const inputTable = getInputTable();
    const inputElements = inputTable.querySelectorAll("input, select");
    const analysis = readString("analysis");
    const test = readString("test");
    const state = { analysis, test, n: n(), alpha: alpha(), power: power(), es: es() };
    for (let i = 0; i < inputElements.length; i++) {
        state[inputElements[i].id] = inputElements[i].value;
    }
    if (analysis === "compromise") {
        state.betaAlphaRatio = readString("betaAlphaRatio");
    }
    return state;
}

function writeToPtr(ptr, text) {
    const buffer = HEAPU8.buffer;
    const view = new Uint8Array(buffer, ptr, 1024);
    const encoder = new TextEncoder();
    view.set(encoder.encode(text + "<END>"));
}

function readFromPtr(ptr) {
    const buffer = HEAPU8.buffer;
    const view = new Uint8Array(buffer, ptr, 1024);
    const length = view.findIndex(byte => byte === 0);
    return new TextDecoder().decode(new Uint8Array(buffer, ptr, length));
}

function calculateFromState(state) {
    const json = JSON.stringify(state);
    const ptr = Module._alloc();
    writeToPtr(ptr, json);
    Module._calculatePower(ptr);
    const returned = readFromPtr(ptr);
    Module._dealloc(ptr);
    return JSON.parse(returned);
}

function simulateFromState(state) {
    const json = JSON.stringify(state);
    const ptr = Module._alloc();
    writeToPtr(ptr, json);
    Module._simulatePower(ptr);
    const returned = readFromPtr(ptr);
    Module._dealloc(ptr);
    return JSON.parse(returned);
}

let powerChart = null;

function getChartThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        lineColor: style.getPropertyValue('--md-sys-color-primary').trim() || '#001735',
        fillColor: style.getPropertyValue('--chart-fill-color').trim() || 'rgba(0, 23, 53, 0.15)',
        textColor: style.getPropertyValue('--md-sys-color-on-surface').trim() || '#1b1b1f',
        gridColor: style.getPropertyValue('--md-sys-color-outline-variant').trim() || '#c4c6d0',
    };
}

function applyChartThemeColors(chart, theme) {
    if (!chart) return;
    const scales = chart.options.scales;
    for (const axis of Object.values(scales)) {
        if (axis.title) axis.title.color = theme.textColor;
        if (axis.ticks) axis.ticks.color = theme.textColor;
        if (axis.grid) axis.grid.color = theme.gridColor + '33';
    }
}

function updateChart() {
    if (!window.Chart) return;
    const xAxisVar = readString("chartXAxis");
    const state = frontEndState();
    state.analysis = "power";
    let labels = [], data = [], xAxisLabel = "";

    if (xAxisVar === "n") {
        xAxisLabel = "Sample Size";
        let currentN = n(); if (isNaN(currentN) || currentN <= 0) currentN = 100;
        let minN = Math.max(2, Math.floor(currentN * 0.2));
        let maxN = Math.floor(currentN * 2.5);
        let step = Math.max(1, Math.floor((maxN - minN) / 40));
        for (let i = minN; i <= maxN; i += step) {
            let r = calculateFromState(Object.assign({}, state, { n: i }));
            if (r && r.power !== undefined && r.power !== -111) { labels.push(i); data.push(r.power); }
        }
    } else if (xAxisVar === "es") {
        xAxisLabel = "Effect Size";
        let currentEs = es(); if (isNaN(currentEs) || currentEs <= 0) currentEs = 0.5;
        let minEs = Math.max(0.01, currentEs * 0.2), maxEs = currentEs * 2.5, step = (maxEs - minEs) / 40;
        for (let i = minEs; i <= maxEs; i += step) {
            let r = calculateFromState(Object.assign({}, state, { es: i }));
            if (r && r.power !== undefined && r.power !== -111) { labels.push(i.toFixed(3)); data.push(r.power); }
        }
    } else if (xAxisVar === "alpha") {
        xAxisLabel = "Alpha (α)";
        for (let a = 0.01; a <= 0.20; a += 0.005) {
            let r = calculateFromState(Object.assign({}, state, { alpha: a }));
            if (r && r.power !== undefined && r.power !== -111) { labels.push(a.toFixed(3)); data.push(r.power); }
        }
    }

    const ctx = document.getElementById('powerChart').getContext('2d');
    const theme = getChartThemeColors();

    if (powerChart) {
        powerChart.data.labels = labels;
        powerChart.data.datasets[0].data = data;
        powerChart.data.datasets[0].borderColor = theme.lineColor;
        powerChart.data.datasets[0].backgroundColor = theme.fillColor;
        powerChart.data.datasets[0].pointHoverBackgroundColor = theme.lineColor;
        powerChart.options.scales.x.title.text = xAxisLabel;
        applyChartThemeColors(powerChart, theme);
        powerChart.update();
    } else {
        powerChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Power', data, borderColor: theme.lineColor, backgroundColor: theme.fillColor, borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: theme.lineColor }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: xAxisLabel, color: theme.textColor }, ticks: { maxTicksLimit: 10, color: theme.textColor }, grid: { color: theme.gridColor + '33' } },
                    y: { title: { display: true, text: 'Power (1 - β)', color: theme.textColor }, ticks: { color: theme.textColor }, grid: { color: theme.gridColor + '33' }, min: 0, max: 1.05 }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false, callbacks: {
                        label: function(ctx) { return `Power: ${ctx.parsed.y.toFixed(4)}`; }
                    }}
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }
}

function updateOutput() {
    setError(""); restrictInput();
    const analysis = readString("analysis");
    const state = frontEndState();
    console.log(`Sending: ${JSON.stringify(state)}`);
    const result = calculateFromState(state);
    console.log(`Received: ${JSON.stringify(result)}`);

    if (analysis === "compromise" && result.compromise) {
        setOutput("alpha", result.alpha);
        setOutput("power", result.power);
    } else {
        const id = Object.keys(result)[0];
        setOutput(id, result[id]);
    }
    updateChart();
}

function resetOutput() {
    setFloat("n", 50); setFloat("alpha", 0.05); setFloat("power", 0.95); setFloat("es", 0.5);
    updateOutput();
}

// ─── Export & Reporting ───

function getFormattedResults() {
    const familySelect = getElementById("family");
    const testSelect = getElementById("test");
    const analysisSelect = getElementById("analysis");
    let rows = [["Parameter", "Value"]];
    if (familySelect.selectedIndex >= 0) rows.push(["Test family", familySelect.options[familySelect.selectedIndex].text]);
    if (testSelect.selectedIndex >= 0) rows.push(["Statistical test", testSelect.options[testSelect.selectedIndex].text]);
    if (analysisSelect.selectedIndex >= 0) rows.push(["Type of power analysis", analysisSelect.options[analysisSelect.selectedIndex].text]);
    document.querySelectorAll("#input .m3-input-row").forEach(row => {
        const l = row.querySelector("label"), inp = row.querySelector("input, select");
        if (l && inp) {
            const label = l.innerText.replace(":", "").trim();
            let val = inp.value;
            if (inp.tagName === "SELECT" && inp.selectedIndex >= 0) val = inp.options[inp.selectedIndex].text;
            rows.push([label, val]);
        }
    });
    document.querySelectorAll("#output .m3-input-row").forEach(row => {
        const l = row.querySelector("label"), inp = row.querySelector("input");
        if (l && inp) rows.push([l.innerText.replace(":", "").trim(), inp.value]);
    });
    return rows;
}

function copyResultsTable(btn) {
    const tsv = getFormattedResults().map(r => r.join("\t")).join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(tsv).then(() => {
            const orig = btn.innerText; btn.innerText = "Copied!";
            setTimeout(() => { btn.innerText = orig; }, 2000);
        }).catch(e => console.error("Copy failed:", e));
    }
}

function exportResultsCSV() {
    const csv = getFormattedResults().map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadBlob(csv, 'text/csv;charset=utf-8;', 'power_analysis_results.csv');
}

function exportResultsTSV() {
    const tsv = getFormattedResults().map(r => r.join("\t")).join("\n");
    downloadBlob(tsv, 'text/tab-separated-values;charset=utf-8;', 'power_analysis_results.tsv');
}

function downloadBlob(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function exportChartPNG() {
    if (!powerChart) return;
    const link = document.createElement("a");
    link.href = powerChart.toBase64Image();
    link.download = "power_curve.png";
    link.click();
}

// ─── Effect Size Calculator ───

function updateEsCalcInputs() {
    const type = readString("esCalcType");
    const container = getElementById("esCalcInputs");
    container.innerHTML = '';
    const fields = {
        d_means: [["m1","Group 1 Mean","0"],["m2","Group 2 Mean","1"],["sd","Pooled SD","1"]],
        d_t: [["tstat","t-statistic","2.5"],["dfCalc","Degrees of freedom","48"]],
        d_one_sample: [["m","Sample Mean","1"],["mu0","Population Mean (μ₀)","0"],["sdOne","SD","1"]],
        f_eta2: [["eta2","η² (partial)","0.06"]],
        f2_r2: [["r2Calc","R²","0.25"]],
        f2_delta_r2: [["deltaR2","ΔR²","0.05"],["r2Full","R² (full model)","0.30"]],
        w_proportions: [["pObs","Observed proportion","0.6"],["pExp","Expected proportion","0.5"]],
        or_2x2: [["cellA","Cell a","30"],["cellB","Cell b","20"],["cellC","Cell c","20"],["cellD","Cell d","30"]]
    };
    (fields[type] || []).forEach(([id, label, def]) => {
        addTableOption(container, label, `<input id="${id}" type="number" value="${def}" step="any" onchange="calcEffectSize()">`);
    });
    calcEffectSize();
}

function calcEffectSize() {
    const type = readString("esCalcType");
    let result = NaN;
    try {
        if (type === "d_means") result = (readFloat("m1") - readFloat("m2")) / readFloat("sd");
        else if (type === "d_t") result = 2 * readFloat("tstat") / Math.sqrt(readFloat("dfCalc"));
        else if (type === "d_one_sample") result = (readFloat("m") - readFloat("mu0")) / readFloat("sdOne");
        else if (type === "f_eta2") { const e = readFloat("eta2"); result = Math.sqrt(e / (1 - e)); }
        else if (type === "f2_r2") { const r = readFloat("r2Calc"); result = r / (1 - r); }
        else if (type === "f2_delta_r2") result = readFloat("deltaR2") / (1 - readFloat("r2Full"));
        else if (type === "w_proportions") {
            const o = readFloat("pObs"), e = readFloat("pExp");
            result = Math.sqrt(Math.pow(o - e, 2) / e + Math.pow((1-o) - (1-e), 2) / (1-e));
        }
        else if (type === "or_2x2") result = (readFloat("cellA") * readFloat("cellD")) / (readFloat("cellB") * readFloat("cellC"));
    } catch(e) {}
    getElementById("esCalcResult").innerText = isNaN(result) ? "—" : result.toFixed(4);
}

function useEsCalcResult() {
    const text = getElementById("esCalcResult").innerText;
    if (text !== "—") { setFloat("es", parseFloat(text)); updateOutput(); }
}

// ─── Monte Carlo Simulation (Web Worker) ───

let pValueChart = null;
let simWorker = null;
let simWorkerReady = false;
let simCallbackMap = {};
let simNextId = 1;

function initSimWorker() {
    return new Promise((resolve, reject) => {
        if (simWorkerReady) { resolve(); return; }
        if (typeof Worker === 'undefined') { reject(new Error('Web Workers not supported')); return; }

        try {
            simWorker = new Worker('simulation_worker.js');
        } catch (e) {
            reject(new Error('Failed to create worker: ' + e.message));
            return;
        }

        simWorker.onmessage = function(e) {
            const { type, id, result, error } = e.data;
            if (type === 'ready') {
                simWorkerReady = true;
                resolve();
            } else if (type === 'error' && !simWorkerReady) {
                reject(new Error(error));
            } else if (type === 'simulationResult' || type === 'calculationResult') {
                if (simCallbackMap[id]) { simCallbackMap[id].resolve(result); delete simCallbackMap[id]; }
            } else if (type === 'error') {
                if (simCallbackMap[id]) { simCallbackMap[id].reject(new Error(error)); delete simCallbackMap[id]; }
            }
        };

        simWorker.onerror = function(e) {
            console.error('Worker error:', e);
            if (!simWorkerReady) reject(new Error('Worker init error'));
        };

        // Send init message to load WASM in the worker
        simWorker.postMessage({ type: 'init', id: 0 });
    });
}

function workerSimulate(params) {
    return new Promise((resolve, reject) => {
        const id = simNextId++;
        simCallbackMap[id] = { resolve, reject };
        simWorker.postMessage({ type: 'simulate', id, params });
    });
}

function workerCalculate(params) {
    return new Promise((resolve, reject) => {
        const id = simNextId++;
        simCallbackMap[id] = { resolve, reject };
        simWorker.postMessage({ type: 'calculate', id, params });
    });
}

// Fallback: run simulation on main thread (blocks UI)
function mainThreadSimulate(params) {
    return simulateFromState(params);
}

async function runSimulation() {
    const btn = getElementById("runSimBtn");
    const progress = getElementById("simProgress");
    const results = getElementById("simResults");
    btn.disabled = true;
    btn.innerText = "Running...";
    progress.style.display = "flex";
    results.style.display = "none";

    const state = frontEndState();
    const simParams = Object.assign({}, state);
    simParams.nSim = parseInt(readString("nSim"));
    simParams.seed = parseInt(readString("simSeed"));
    delete simParams.analysis;

    try {
        let simResult, analyticalResult;

        // Try Web Worker first, fallback to main thread
        try {
            await initSimWorker();
            // Run simulation and analytical calculation in the worker
            const analyticalState = Object.assign({}, state, { analysis: "power" });
            [simResult, analyticalResult] = await Promise.all([
                workerSimulate(simParams),
                workerCalculate(analyticalState)
            ]);
        } catch (workerErr) {
            console.warn("Worker unavailable, running on main thread:", workerErr.message);
            // Fallback: run on main thread via setTimeout for minimal UI responsiveness
            simResult = await new Promise(resolve => {
                setTimeout(() => resolve(mainThreadSimulate(simParams)), 50);
            });
            const analyticalState = Object.assign({}, frontEndState(), { analysis: "power" });
            analyticalResult = calculateFromState(analyticalState);
        }

        getElementById("simAnalyticalPower").innerText = (analyticalResult.power !== undefined ? analyticalResult.power : "—");
        getElementById("simEmpiricalPower").innerText = simResult.empiricalPower;
        getElementById("simCount").innerText = simResult.nSim;
        getElementById("simSeedUsed").innerText = simResult.seed;

        renderPValueHistogram(simResult.histogram);
        results.style.display = "";
    } catch (e) {
        setError("Simulation error: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Run Simulation";
        progress.style.display = "none";
    }
}

function renderPValueHistogram(histogram) {
    if (!window.Chart || !histogram) return;
    const ctx = document.getElementById('pValueChart').getContext('2d');
    const labels = histogram.map((_, i) => ((i * 0.05) + 0.025).toFixed(3));
    const theme = getChartThemeColors();

    if (pValueChart) {
        pValueChart.data.labels = labels;
        pValueChart.data.datasets[0].data = histogram;
        pValueChart.data.datasets[0].backgroundColor = theme.lineColor + '80';
        pValueChart.data.datasets[0].borderColor = theme.lineColor;
        applyChartThemeColors(pValueChart, theme);
        pValueChart.update();
    } else {
        pValueChart = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Count', data: histogram, backgroundColor: theme.lineColor + '80', borderColor: theme.lineColor, borderWidth: 1 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'p-value', color: theme.textColor }, ticks: { maxTicksLimit: 5, color: theme.textColor }, grid: { color: theme.gridColor + '33' } },
                    y: { title: { display: true, text: 'Count', color: theme.textColor }, ticks: { color: theme.textColor }, grid: { color: theme.gridColor + '33' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

// ─── Init ───

function webAssemblySupport() {
    try {
        if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
            const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        }
    } catch (e) {}
    return false;
}

if (!webAssemblySupport()) {
    document.body.innerHTML = `<br><center>This site only works with WebAssembly. Enable WebAssembly in your browser to continue.</center>`;
} else {
    Module['onRuntimeInitialized'] = function() {
        console.log("Loading of the poweranalyses.wasm library succeeded.");
        familyChanged();
        updateNumberOutputAreas();
        updateOutput();
        updateEsCalcInputs();
    }
}


