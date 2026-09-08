// Pollutant Metadata Configuration
const POLLUTANT_CONFIG = {
    pm25: { label: 'PM2.5', unit: 'µg/m³', color: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' },
    pm10: { label: 'PM10', unit: 'µg/m³', color: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)' },
    co2:  { label: 'eCO₂', unit: 'ppm', color: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)' },
    tvoc: { label: 'TVOC', unit: 'mg/m³', color: '#a855f7', fill: 'rgba(168, 85, 247, 0.1)' }
};


window.appState = {
    activePollutant: 'pm25',
    theme: 'dark',
    system: {
        powerSource: '--',
        batteryLevel: '--',
        temperature: '--',
        humidity: '--'
    },
    predictions: {
        pm25: { h1: '--', h3: '--', h6: '--' },
        pm10: { h1: '--', h3: '--', h6: '--' },
        co2:  { h1: '--', h3: '--', h6: '--' },
        tvoc: { h1: '--', h3: '--', h6: '--' }
    },
    telemetryHistory: {
        labels: [],
        pm25: [],
        pm10: [],
        co2: [],
        tvoc: []
    },
    filters: [
        {
            id: 'filter-1',
            name: 'Filter Unit 1',
            status: 'Inactive',
            healthPct: '--',
            sensors: { pm25: '--', pm10: '--', co2: '--', tvoc: '--' }
        }
    ]
};

let chartInstance = null;


function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    function applyTheme(theme) {
        window.appState.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (theme === 'light') {
            themeIcon.className = 'fa-solid fa-sun';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
        }

        updateChartThemeColors(theme);
    }
}

function updateChartThemeColors(theme) {
    if (!chartInstance) return;

    const gridColor = theme === 'light' ? '#cbd5e1' : '#334155';
    const textColor = theme === 'light' ? '#64748b' : '#94a3b8';
    const legendColor = theme === 'light' ? '#0f172a' : '#e2e8f0';

    chartInstance.options.scales.x.grid.color = gridColor;
    chartInstance.options.scales.x.ticks.color = textColor;
    chartInstance.options.scales.y.grid.color = gridColor;
    chartInstance.options.scales.y.ticks.color = textColor;
    chartInstance.options.plugins.legend.labels.color = legendColor;

    chartInstance.update();
}


function renderFilters() {
    const container = document.getElementById('filters-container');
    if (!container) return;
    
    container.innerHTML = '';

    window.appState.filters.forEach((filter) => {
        const card = document.createElement('div');
        card.className = 'filter-card';
        card.innerHTML = `
            <div class="filter-card-header">
                <div class="filter-card-title">
                    <i class="fa-solid fa-wind brand-icon"></i>
                    <h3>${filter.name}</h3>
                </div>
                <div class="filter-card-meta">
                    <span>Health: <strong id="${filter.id}-health">${filter.healthPct}%</strong></span>
                    <span id="${filter.id}-status" class="filter-status-badge">${filter.status}</span>
                </div>
            </div>

            <div class="filter-metrics-grid">
                <div class="metric-box">
                    <span class="metric-label">PM2.5</span>
                    <span class="metric-value" id="${filter.id}-pm25">${filter.sensors.pm25}</span>
                    <span class="metric-unit"> µg/m³</span>
                </div>
                <div class="metric-box">
                    <span class="metric-label">PM10</span>
                    <span class="metric-value" id="${filter.id}-pm10">${filter.sensors.pm10}</span>
                    <span class="metric-unit"> µg/m³</span>
                </div>
                <div class="metric-box">
                    <span class="metric-label">eCO₂</span>
                    <span class="metric-value" id="${filter.id}-co2">${filter.sensors.co2}</span>
                    <span class="metric-unit"> ppm</span>
                </div>
                <div class="metric-box">
                    <span class="metric-label">TVOC</span>
                    <span class="metric-value" id="${filter.id}-tvoc">${filter.sensors.tvoc}</span>
                    <span class="metric-unit"> mg/m³</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}


function initChart() {
    const ctx = document.getElementById('liveChart').getContext('2d');
    const conf = POLLUTANT_CONFIG[window.appState.activePollutant];
    const theme = window.appState.theme;

    const gridColor = theme === 'light' ? '#cbd5e1' : '#334155';
    const textColor = theme === 'light' ? '#64748b' : '#94a3b8';
    const legendColor = theme === 'light' ? '#0f172a' : '#e2e8f0';

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: window.appState.telemetryHistory.labels,
            datasets: [{
                label: `${conf.label} Level (${conf.unit})`,
                data: window.appState.telemetryHistory[window.appState.activePollutant],
                borderColor: conf.color,
                backgroundColor: conf.fill,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor } },
                y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
            },
            plugins: { legend: { labels: { color: legendColor } } }
        }
    });
}


function updatePredictionView() {
    const key = window.appState.activePollutant;
    const conf = POLLUTANT_CONFIG[key];
    const preds = window.appState.predictions[key] || { h1: '--', h3: '--', h6: '--' };

    document.getElementById('active-pollutant-badge').innerText = conf.label;
    document.getElementById('prediction-footer-label').innerText = conf.label;

    document.getElementById('pred-1h').innerHTML = `${preds.h1} <span class="unit-text">${conf.unit}</span>`;
    document.getElementById('pred-3h').innerHTML = `${preds.h3} <span class="unit-text">${conf.unit}</span>`;
    document.getElementById('pred-6h').innerHTML = `${preds.h6} <span class="unit-text">${conf.unit}</span>`;
}


function setupTabSwitching() {
    const tabContainer = document.getElementById('pollutant-tabs');
    tabContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (!btn) return;

        const targetPollutant = btn.getAttribute('data-pollutant');
        if (targetPollutant === window.appState.activePollutant) return;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        window.appState.activePollutant = targetPollutant;

        const conf = POLLUTANT_CONFIG[targetPollutant];
        chartInstance.data.datasets[0].label = `${conf.label} Level (${conf.unit})`;
        chartInstance.data.datasets[0].borderColor = conf.color;
        chartInstance.data.datasets[0].backgroundColor = conf.fill;
        chartInstance.data.datasets[0].data = window.appState.telemetryHistory[targetPollutant];
        chartInstance.update();

        updatePredictionView();
    });
}


window.addFilterSlot = function(filterObj) {
    window.appState.filters.push(filterObj);
    renderFilters();
};

window.updateDashboard = function(payload) {
    if (payload.system) {
        if (payload.system.powerSource) document.getElementById('power-source-text').innerHTML = `<i class="fa-solid fa-bolt"></i> ${payload.system.powerSource}`;
        if (payload.system.batteryLevel) document.getElementById('battery-level-text').innerText = `${payload.system.batteryLevel}%`;
        if (payload.system.temperature) document.getElementById('temp-text').innerText = `${payload.system.temperature} °C`;
        if (payload.system.humidity) document.getElementById('humidity-text').innerText = `${payload.system.humidity} %`;
    }

    if (payload.predictions) {
        Object.assign(window.appState.predictions, payload.predictions);
        updatePredictionView();
    }

    if (payload.filters && Array.isArray(payload.filters)) {
        payload.filters.forEach(updatedFilter => {
            const target = window.appState.filters.find(f => f.id === updatedFilter.id);
            if (target) {
                Object.assign(target.sensors, updatedFilter.sensors || {});
                
                const pm25El = document.getElementById(`${target.id}-pm25`);
                const pm10El = document.getElementById(`${target.id}-pm10`);
                const co2El = document.getElementById(`${target.id}-co2`);
                const tvocEl = document.getElementById(`${target.id}-tvoc`);

                if (pm25El && updatedFilter.sensors.pm25 !== undefined) pm25El.innerText = updatedFilter.sensors.pm25;
                if (pm10El && updatedFilter.sensors.pm10 !== undefined) pm10El.innerText = updatedFilter.sensors.pm10;
                if (co2El && updatedFilter.sensors.co2 !== undefined) co2El.innerText = updatedFilter.sensors.co2;
                if (tvocEl && updatedFilter.sensors.tvoc !== undefined) tvocEl.innerText = updatedFilter.sensors.tvoc;
            }
        });
    }

    if (payload.timestamp && payload.readings) {
        const history = window.appState.telemetryHistory;
        history.labels.push(payload.timestamp);
        if (payload.readings.pm25 !== undefined) history.pm25.push(payload.readings.pm25);
        if (payload.readings.pm10 !== undefined) history.pm10.push(payload.readings.pm10);
        if (payload.readings.co2 !== undefined) history.co2.push(payload.readings.co2);
        if (payload.readings.tvoc !== undefined) history.tvoc.push(payload.readings.tvoc);

        if (history.labels.length > 10) {
            history.labels.shift();
            history.pm25.shift();
            history.pm10.shift();
            history.co2.shift();
            history.tvoc.shift();
        }

        chartInstance.data.datasets[0].data = history[window.appState.activePollutant];
        chartInstance.update();
    }
};


const aiToggleBtn = document.getElementById('ai-toggle-btn');
const aiCloseBtn = document.getElementById('ai-close-btn');
const aiDrawer = document.getElementById('ai-drawer');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const chatInput = document.getElementById('chat-input');
const chatWindow = document.getElementById('chat-window');

aiToggleBtn.addEventListener('click', () => aiDrawer.classList.toggle('hidden'));
aiCloseBtn.addEventListener('click', () => aiDrawer.classList.add('hidden'));

function appendMessage(text, isUser = false) {
    const msg = document.createElement('div');
    msg.className = isUser ? 'msg msg-user' : 'msg msg-assistant';
    msg.innerText = text;
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

sendBtn.addEventListener('click', () => {
    const query = chatInput.value.trim();
    if (!query) return;
    appendMessage(query, true);
    chatInput.value = '';
});

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    voiceBtn.addEventListener('click', () => {
        voiceBtn.classList.add('listening');
        recognition.start();
    });

    recognition.onresult = (event) => {
        chatInput.value = event.results[0][0].transcript;
        voiceBtn.classList.remove('listening');
    };

    recognition.onerror = () => voiceBtn.classList.remove('listening');
    recognition.onend = () => voiceBtn.classList.remove('listening');
}

window.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    renderFilters();
    initChart();
    setupTabSwitching();
    updatePredictionView();
});
