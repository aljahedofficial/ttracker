import gsap from 'gsap';
import { ChartsHandler } from './charts-handler.js';
import { thesisStructure } from './data.js';
import { ThesisScene } from './three-scene.js';

class ThesisTracker {
  constructor() {
    this.state = this.loadState();
    this.scene = new ThesisScene('canvas-container');
    this.charts = new ChartsHandler();
    this.activeView = 'dashboard';

    this.init();
  }

  init() {
    this.renderTracker();
    this.renderChapterRings();
    this.renderHeatmap();
    this.calculateMetrics();
    this.charts.initDashboardCharts();
    this.setupEventListeners();
    this.animateEntrance();
  }

  loadState() {
    const saved = localStorage.getItem('thesisProgress3D');
    if (saved) return JSON.parse(saved);

    const initialState = {};
    thesisStructure.forEach((item, index) => {
      initialState[index] = {
        completed: false,
        actualDate: item.date,
        notes: ''
      };
    });
    return initialState;
  }

  saveState() {
    const indicator = document.getElementById('save-indicator');
    indicator.textContent = 'Saving...';
    indicator.classList.add('bg-amber-500');
    indicator.classList.remove('bg-emerald-500');

    localStorage.setItem('thesisProgress3D', JSON.stringify(this.state));

    setTimeout(() => {
      indicator.textContent = 'Saved';
      indicator.classList.remove('bg-amber-500');
      indicator.classList.add('bg-emerald-500');
    }, 600);
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchView(e.currentTarget.dataset.view));
    });

    // Actions
    document.getElementById('reset-btn').onclick = () => this.resetAll();
    document.getElementById('export-btn').onclick = () => this.exportData();
    document.getElementById('import-trigger').onclick = () => document.getElementById('import-file').click();
    document.getElementById('import-file').onchange = (e) => this.importData(e.target);
  }

  switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${viewName}`).classList.remove('hidden');

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    this.activeView = viewName;

    if (viewName === 'tracker') this.renderTracker();
    if (viewName === 'gantt') this.renderGantt();
    if (viewName === 'analytics') this.charts.renderAnalytics(thesisStructure, this.state);
    if (viewName === 'three-d') this.update3DInfo();

    gsap.from(`#view-${viewName}`, { opacity: 0, y: 20, duration: 0.4 });
  }

  renderTracker() {
    const tbody = document.getElementById('tracker-body');
    tbody.innerHTML = '';

    let currentChapter = 0;

    thesisStructure.forEach((item, index) => {
      if (item.chapter !== currentChapter) {
        currentChapter = item.chapter;
        const divider = document.createElement('tr');
        divider.innerHTML = `<td colspan="7" class="h-1 bg-indigo-500/10"></td>`;
        tbody.appendChild(divider);
      }

      const state = this.state[index];
      const isComplete = state.completed;

      const tr = document.createElement('tr');
      tr.className = `group border-b border-slate-800/30 hover:bg-slate-800/20 transition-all ${isComplete ? 'row-complete' : ''}`;

      tr.innerHTML = `
                <td class="p-4">
                    <div class="checkbox-custom ${isComplete ? 'checked' : ''}" data-index="${index}"></div>
                </td>
                <td class="p-4 text-xs font-medium text-slate-400">
                    ${item.date}
                </td>
                <td class="p-4 text-center">
                    <span class="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-bold text-[10px]">CH${item.chapter}</span>
                </td>
                <td class="p-4">
                    <div class="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        ${item.section}
                        ${item.critical ? '<span class="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-black rounded-full">CRITICAL</span>' : ''}
                    </div>
                </td>
                <td class="p-4 hidden lg:table-cell text-xs text-slate-500 italic max-w-xs truncate">${item.concepts}</td>
                <td class="p-4 text-xs font-bold text-emerald-400/80">${item.function}</td>
                <td class="p-4 text-xs font-semibold text-purple-400/80">${item.paper}</td>
                <td class="p-4">
                    <button class="text-slate-600 hover:text-white transition-colors" onclick="this.closest('tr').nextElementSibling.classList.toggle('hidden')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                </td>
            `;

      tbody.appendChild(tr);

      // Checkbox logic
      tr.querySelector('.checkbox-custom').onclick = () => this.toggleComplete(index);

      // Expansion row
      const detailsTr = document.createElement('tr');
      detailsTr.className = 'hidden bg-indigo-500/[0.02] border-b border-slate-800/30';
      detailsTr.innerHTML = `
                <td colspan="7" class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="space-y-1">
                            <span class="text-[10px] uppercase font-black text-slate-600 tracking-widest">Theoretical Depth</span>
                            <p class="text-sm text-slate-400 font-medium">${item.concepts}</p>
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] uppercase font-black text-slate-600 tracking-widest">Target Contribution</span>
                            <p class="text-sm text-slate-300">${item.words.toLocaleString()} words</p>
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] uppercase font-black text-slate-600 tracking-widest">Progress Notes</span>
                            <input type="text" value="${state.notes || ''}" 
                                class="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-indigo-300 focus:border-indigo-500 outline-none"
                                placeholder="Add specific session notes..."
                                data-index="${index}">
                        </div>
                    </div>
                </td>
            `;
      tbody.appendChild(detailsTr);

      detailsTr.querySelector('input').onchange = (e) => {
        this.state[index].notes = e.target.value;
        this.saveState();
      };
    });
  }

  toggleComplete(index) {
    this.state[index].completed = !this.state[index].completed;
    this.saveState();
    this.renderTracker();
    this.renderChapterRings();
    this.calculateMetrics();
    this.renderHeatmap();

    // Update 3D
    const chapterNum = thesisStructure[index].chapter;
    this.scene.updateNodeProgress(chapterNum, this.getChapterProgress(chapterNum));
  }

  getChapterProgress(chapterNum) {
    const chapterItems = thesisStructure.filter(t => t.chapter === chapterNum);
    const completed = chapterItems.filter((_, i) => {
      const globalIndex = thesisStructure.findIndex((t, ti) => t.chapter === chapterNum && i === chapterItems.indexOf(t));
      // Correct way to find global index in order
      let count = 0;
      for (let j = 0; j < thesisStructure.length; j++) {
        if (thesisStructure[j].chapter === chapterNum) {
          if (count === i) return this.state[j].completed;
          count++;
        }
      }
    }).length;
    return Math.round((completed / chapterItems.length) * 100);
  }

  renderChapterRings() {
    const container = document.getElementById('chapter-rings');
    container.innerHTML = '';

    for (let i = 1; i <= 7; i++) {
      const progress = this.getChapterProgress(i);
      const ring = document.createElement('div');
      ring.className = 'flex flex-col items-center gap-3 group cursor-pointer';

      const color = progress === 100 ? '#10b981' : progress > 0 ? '#6366f1' : '#1e1e2d';
      const circumference = 2 * Math.PI * 34; // r=34
      const offset = circumference - (progress / 100) * circumference;

      ring.innerHTML = `
                <div class="relative w-20 h-20">
                    <svg class="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="6"/>
                        <circle cx="40" cy="40" r="34" fill="none" stroke="${color}" stroke-width="6" 
                            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                            stroke-linecap="round" class="transition-all duration-1000 ease-out"/>
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-xl font-black text-white">${i}</span>
                    </div>
                </div>
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors">Chapter ${i}</div>
            `;

      ring.onclick = () => this.switchView('tracker');
      container.appendChild(ring);

      // Sync with 3D at start
      this.scene.updateNodeProgress(i, progress);
    }
  }

  calculateMetrics() {
    const total = thesisStructure.length;
    const completed = Object.values(this.state).filter(s => s.completed).length;
    const percentage = Math.round((completed / total) * 100);

    document.getElementById('overall-progress').textContent = percentage + '%';
    document.getElementById('progress-bar-fill').style.width = percentage + '%';
    document.getElementById('completed-count').textContent = `${completed}/${total}`;

    // Days Left - Static for demo
    const endDate = new Date('2025-03-30');
    const today = new Date();
    const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    document.getElementById('days-left').textContent = Math.max(0, diff);

    // Words
    let words = 0;
    thesisStructure.forEach((item, i) => { if (this.state[i].completed) words += item.words; });
    document.getElementById('words-written').textContent = words.toLocaleString();

    // Next Focus
    const nextIndex = thesisStructure.findIndex((_, i) => !this.state[i].completed);
    if (nextIndex !== -1) {
      const next = thesisStructure[nextIndex];
      document.getElementById('next-section').textContent = next.section;
      document.getElementById('next-date').textContent = next.date;
      document.getElementById('current-chapter-display').textContent = `Ch ${next.chapter}`;
      document.getElementById('chapter-progress-text').textContent = `${this.getChapterProgress(next.chapter)}% ch done`;
    }
  }

  renderHeatmap() {
    const container = document.getElementById('heatmap-container');
    container.innerHTML = '';

    // Use a range from Feb 20 to Mar 30
    const start = new Date('2025-02-20');
    const end = new Date('2025-03-30');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${['Jan', 'Feb', 'Mar', 'Apr'][d.getMonth()]} ${d.getDate()}`;
      const itemsOnDate = thesisStructure.filter(t => t.date === dateStr);
      const isComplete = itemsOnDate.length > 0 && itemsOnDate.every((_, i) => {
        const idx = thesisStructure.findIndex(t => t.date === dateStr);
        return this.state[idx]?.completed;
      });
      const hasTask = itemsOnDate.length > 0;

      const cell = document.createElement('div');
      cell.className = `w-3 h-3 rounded-sm transition-transform hover:scale-150 cursor-help`;

      if (isComplete) cell.classList.add('bg-emerald-500', 'shadow-[0_0_5px_rgba(16,185,129,0.5)]');
      else if (hasTask) cell.classList.add('bg-indigo-500/40');
      else cell.classList.add('bg-slate-800/50');

      cell.title = `${dateStr}: ${hasTask ? (isComplete ? 'Complete' : 'Pending') : 'Rest Day'}`;
      container.appendChild(cell);
    }
  }

  renderGantt() {
    const container = document.getElementById('gantt-chart');
    container.innerHTML = '';

    thesisStructure.forEach((item, index) => {
      const isComplete = this.state[index].completed;
      const bar = document.createElement('div');
      bar.className = 'flex items-center gap-4 group';

      const progressWidth = isComplete ? 100 : (item.critical ? 0 : 20);

      bar.innerHTML = `
                <div class="w-40 text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter">${item.section}</div>
                <div class="flex-1 h-6 bg-slate-900/50 rounded-full overflow-hidden border border-slate-800/50">
                    <div class="h-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : (item.critical ? 'bg-amber-500/20' : 'bg-indigo-500/20')}" 
                         style="width: ${progressWidth}%"></div>
                </div>
                <div class="w-12 text-[10px] font-black text-slate-600">${item.date}</div>
            `;
      container.appendChild(bar);
    });
  }

  update3DInfo() {
    const total = thesisStructure.length;
    const completed = Object.values(this.state).filter(s => s.completed).length;
    document.getElementById('completion-3d').textContent = Math.round((completed / total) * 100) + '%';
  }

  animateEntrance() {
    gsap.from('.metric-card', {
      opacity: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power4.out'
    });

    gsap.from('.glass-panel', {
      opacity: 0,
      scale: 0.95,
      duration: 1.2,
      ease: 'elastic.out(1, 0.8)'
    });
  }

  // Tools
  resetAll() {
    if (confirm('Revolutionary Reset? This permanently deletes all progress.')) {
      localStorage.removeItem('thesisProgress3D');
      window.location.reload();
    }
  }

  exportData() {
    const dataStr = JSON.stringify(this.state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thesis-nexus-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        this.state = JSON.parse(e.target.result);
        this.saveState();
        window.location.reload();
      } catch (err) { alert('Format Error'); }
    };
    reader.readAsText(file);
  }
}

// Start the engine
document.addEventListener('DOMContentLoaded', () => {
  window.App = new ThesisTracker();
});
