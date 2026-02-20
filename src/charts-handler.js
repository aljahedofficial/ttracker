import Chart from 'chart.js/auto';

export class ChartsHandler {
    constructor() {
        this.charts = {};
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { family: 'Inter' } }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(51, 65, 85, 0.5)' }
                },
                x: {
                    ticks: { color: '#64748b' },
                    grid: { color: 'rgba(51, 65, 85, 0.5)' }
                }
            }
        };
    }

    initDashboardCharts() {
        this.createVelocityChart();
        this.createDistributionChart();
        this.createForecastChart();
    }

    createVelocityChart() {
        const ctx = document.getElementById('velocity-chart').getContext('2d');
        this.charts.velocity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
                datasets: [{
                    label: 'Sections/Week',
                    data: [6, 6, 5, 9, 7, 2],
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 6
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: { legend: { display: false } }
            }
        });
    }

    createDistributionChart() {
        const ctx = document.getElementById('distribution-chart').getContext('2d');
        this.charts.distribution = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Ch1', 'Ch2', 'Ch3', 'Ch4', 'Ch5', 'Ch6', 'Ch7'],
                datasets: [{
                    data: [6, 6, 5, 9, 7, 5, 2],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.6)',
                        'rgba(168, 85, 247, 0.6)',
                        'rgba(16, 185, 129, 0.6)',
                        'rgba(245, 158, 11, 0.6)',
                        'rgba(239, 68, 68, 0.6)',
                        'rgba(59, 130, 246, 0.6)',
                        'rgba(139, 92, 246, 0.6)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: { legend: { display: false } },
                scales: {
                    r: { ticks: { display: false }, grid: { color: 'rgba(51, 65, 85, 0.3)' } }
                }
            }
        });
    }

    createForecastChart() {
        const fCtx = document.getElementById('forecast-chart').getContext('2d');
        this.charts.forecast = new Chart(fCtx, {
            type: 'line',
            data: {
                labels: ['Now', 'W1', 'W2', 'W3', 'W4', 'W5', 'Deadline'],
                datasets: [{
                    label: 'Projected',
                    data: [0, 20, 40, 60, 80, 95, 100],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Required',
                    data: [0, 15, 35, 55, 75, 90, 100],
                    borderColor: '#6366f1',
                    borderDash: [5, 5],
                    pointRadius: 0
                }]
            },
            options: this.defaultOptions
        });
    }

    renderAnalytics(thesisStructure, progressState) {
        this.renderCumulativeChart(thesisStructure, progressState);
        this.renderPapersChart(thesisStructure, progressState);
        this.renderWordsChart(thesisStructure, progressState);
    }

    renderCumulativeChart(thesisStructure, progressState) {
        const ctx = document.getElementById('cumulative-chart').getContext('2d');
        if (this.charts.cumulative) this.charts.cumulative.destroy();

        const data = [];
        let cumulative = 0;
        thesisStructure.forEach((item, index) => {
            if (progressState[index]?.completed) cumulative++;
            data.push(cumulative);
        });

        this.charts.cumulative = new Chart(ctx, {
            type: 'line',
            data: {
                labels: thesisStructure.map((t, i) => `D${i + 1}`),
                datasets: [{
                    label: 'Sections Completed',
                    data: data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: this.defaultOptions
        });
    }

    renderPapersChart(thesisStructure, progressState) {
        const ctx = document.getElementById('papers-chart').getContext('2d');
        if (this.charts.papers) this.charts.papers.destroy();

        const paperCounts = {};
        thesisStructure.forEach((item, index) => {
            if (progressState[index]?.completed) {
                const key = item.paper.split(' ')[0] + ' et al.';
                paperCounts[key] = (paperCounts[key] || 0) + 1;
            }
        });

        this.charts.papers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(paperCounts),
                datasets: [{
                    label: 'Times Used',
                    data: Object.values(paperCounts),
                    backgroundColor: ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444'],
                    borderRadius: 4
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: { legend: { display: false } }
            }
        });
    }

    renderWordsChart(thesisStructure, progressState) {
        const ctx = document.getElementById('words-chart').getContext('2d');
        if (this.charts.words) this.charts.words.destroy();

        const wordsByChapter = {};
        thesisStructure.forEach((item, index) => {
            if (progressState[index]?.completed) {
                wordsByChapter[`Ch ${item.chapter}`] = (wordsByChapter[`Ch ${item.chapter}`] || 0) + item.words;
            }
        });

        this.charts.words = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(wordsByChapter),
                datasets: [{
                    data: Object.values(wordsByChapter),
                    backgroundColor: ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'],
                    borderWidth: 0
                }]
            },
            options: {
                ...this.defaultOptions,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}
