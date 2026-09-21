import { render } from 'solid-js/web';
import { createSignal, createMemo } from 'solid-js';
import { SolidApexCharts } from 'solid-apexcharts';

interface DashboardStats { revenue: number; total_users: number; }

// === A. ダッシュボードコンポーネント (グラフ) ===
function SolidDashboard(props: { stats: () => DashboardStats; theme: () => string; onSimulate: (rev: number, users: number) => void }) {
  const arpu = createMemo(() => { const s = props.stats(); return s.total_users > 0 ? Math.round(s.revenue / s.total_users) : 0; });
  const simulateActivity = () => {
    const current = props.stats();
    props.onSimulate(current.revenue + Math.floor(Math.random() * 80000) + 20000, current.total_users + Math.floor(Math.random() * 20) + 2);
  };
  const chartOptions = createMemo(() => {
    const stats = props.stats(); const isDark = props.theme() === 'dark';
    return {
      series: [
        { name: '総売上 (x10円)', data: [30000, 40000, 35000, 50000, Math.round(stats.revenue / 10)] },
        { name: 'アクティブユーザー数', data: [800, 950, 910, 1100, stats.total_users] }
      ],
      options: {
        chart: { type: 'area', height: 350, toolbar: { show: false }, animations: { enabled: true, speed: 800 } },
        theme: { mode: isDark ? 'dark' : 'light' },
        colors: ['#3b82f6', '#10b981'],
        stroke: { curve: 'smooth', width: 3 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100]} },
        xaxis: { categories: ['4月', '5月', '6月', '7月', '現在'], labels: { style: { colors: isDark ? '#9ca3af' : '#6b7280' } } },
        yaxis: { labels: { style: { colors: isDark ? '#9ca3af' : '#6b7280' } } },
        dataLabels: { enabled: false }, grid: { borderColor: isDark ? '#374151' : '#f3f4f6' }
      }
    };
  });

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <span class="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase">総売上額</span>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-2">¥{props.stats().revenue.toLocaleString()}</h3>
        </div>
        <div class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <span class="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase">アクティブユーザー</span>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-2">{props.stats().total_users.toLocaleString()} 人</h3>
        </div>
        <div class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-800/20 dark:to-gray-900 transition-colors duration-300">
          <span class="text-sm font-medium text-blue-500 dark:text-blue-400 uppercase font-semibold">ARPU (顧客平均単価)</span>
          <h3 class="text-3xl font-bold text-blue-900 dark:text-blue-200 mt-2">¥{arpu().toLocaleString()}</h3>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div class="w-full min-h-[350px]">
          <SolidApexCharts type="area" height={350} series={chartOptions().series} options={chartOptions().options} />
        </div>
      </div>
      <div class="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <button onClick={simulateActivity} class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer">
          ⚡ 仮想トランザクションを発生させる
        </button>
      </div>
    </div>
  );
}

class SolidDashboardElement extends HTMLElement {
  static get observedAttributes() { return ['stats-data', 'theme']; }
  private dispose?: () => void;
  private setStatsSignal?: (v: DashboardStats) => void;
  private setThemeSignal?: (t: string) => void;

  connectedCallback() {
    const [stats, setStats] = createSignal<DashboardStats>(JSON.parse(this.getAttribute('stats-data') || '{"revenue":0,"total_users":0}'));
    const [theme, setTheme] = createSignal<string>(this.getAttribute('theme') || 'light');
    this.setStatsSignal = setStats; this.setThemeSignal = setTheme;
    this.dispose = render(() => <SolidDashboard stats={stats} theme={theme} onSimulate={(r, u) => {
      this.dispatchEvent(new CustomEvent('update-stats', { detail: { revenue: r, total_users: u }, bubbles: true, composed: true }));
    }} />, this);
  }
  attributeChangedCallback(name: string, _o: string | null, newVal: string | null) {
    if (newVal === null) return;
    if (name === 'stats-data' && this.setStatsSignal) this.setStatsSignal(JSON.parse(newVal));
    if (name === 'theme' && this.setThemeSignal) this.setThemeSignal(newVal);
  }
  disconnectedCallback() { if (this.dispose) this.dispose(); }
}
if (!customElements.get('solid-dashboard')) customElements.define('solid-dashboard', SolidDashboardElement);

// === B. 左右分割パネル ===
function SolidSplitPanel(props: { left: Element[]; right: Element[] }) {
  const [leftWidth, setLeftWidth] = createSignal(50);
  let ref: HTMLDivElement | undefined; let drag = false;
  return (
    <div ref={ref} class="flex w-full h-[200px] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300">
      <div style={{ 'flex-basis': `${leftWidth()}%` }} class="overflow-auto p-4 min-w-0"><div ref={(el) => el && el.append(...props.left)} /></div>
      <div onPointerDown={(e) => { e.preventDefault(); drag = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
           onPointerMove={(e) => { if (!drag || !ref) return; const r = ref.getBoundingClientRect(); let p = ((e.clientX - r.left) / r.width) * 100; setLeftWidth(p < 20 ? 20 : p > 80 ? 80 : p); }}
           onPointerUp={(e) => { drag = false; (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); }}
           class="w-2 bg-gray-100 hover:bg-blue-400 dark:bg-gray-800 dark:hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-colors touch-none active:bg-blue-600">
        <div class="w-1 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
      <div style={{ 'flex-basis': `${100 - leftWidth()}%` }} class="overflow-auto p-4 min-w-0 bg-gray-50/50 dark:bg-gray-950/20"><div ref={(el) => el && el.append(...props.right)} /></div>
    </div>
  );
}
class SolidSplitPanelElement extends HTMLElement {
  connectedCallback() { render(() => <SolidSplitPanel left={Array.from(this.querySelectorAll('[slot="left"]'))} right={Array.from(this.querySelectorAll('[slot="right"]'))} />, this); }
}
if (!customElements.get('solid-split-panel')) customElements.define('solid-split-panel', SolidSplitPanelElement);

// === C. 上下分割パネル ===
function SolidSplitPanelVertical(props: { top: Element[]; bottom: Element[] }) {
  const [topHeight, setTopHeight] = createSignal(50);
  let ref: HTMLDivElement | undefined; let drag = false;
  return (
    <div ref={ref} class="flex flex-col w-full h-[250px] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300">
      <div style={{ 'flex-basis': `${topHeight()}%` }} class="overflow-auto p-4 min-w-0"><div ref={(el) => el && el.append(...props.top)} /></div>
      <div onPointerDown={(e) => { e.preventDefault(); drag = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
           onPointerMove={(e) => { if (!drag || !ref) return; const r = ref.getBoundingClientRect(); let p = ((e.clientY - r.top) / r.height) * 100; setTopHeight(p < 20 ? 20 : p > 80 ? 80 : p); }}
           onPointerUp={(e) => { drag = false; (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); }}
           class="h-2 bg-gray-100 hover:bg-blue-400 dark:bg-gray-800 dark:hover:bg-blue-500 cursor-row-resize flex items-center justify-center transition-colors touch-none active:bg-blue-600">
        <div class="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
      <div style={{ 'flex-basis': `${100 - topHeight()}%` }} class="overflow-auto p-4 min-w-0 bg-gray-50/50 dark:bg-gray-950/20"><div ref={(el) => el && el.append(...props.bottom)} /></div>
    </div>
  );
}
class SolidSplitPanelVerticalElement extends HTMLElement {
  connectedCallback() { render(() => <SolidSplitPanelVertical top={Array.from(this.querySelectorAll('[slot="top"]'))} bottom={Array.from(this.querySelectorAll('[slot="bottom"]'))} />, this); }
}
if (!customElements.get('solid-split-panel-vertical')) customElements.define('solid-split-panel-vertical', SolidSplitPanelVerticalElement);

