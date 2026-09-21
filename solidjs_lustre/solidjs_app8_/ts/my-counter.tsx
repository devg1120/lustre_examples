import { render } from 'solid-js/web';
import { createSignal, createMemo } from 'solid-js';
import { SolidApexCharts } from 'solid-apexcharts';

interface DashboardStats {
  revenue: number;
  total_users: number;
}

// ⭕ propsに「theme」を返す関数を追加
function SolidDashboard(props: { stats: () => DashboardStats; theme: () => string; onSimulate: (rev: number, users: number) => void }) {
  const arpu = createMemo(() => {
    const s = props.stats();
    return s.total_users > 0 ? Math.round(s.revenue / s.total_users) : 0;
  });

  const simulateActivity = () => {
    const current = props.stats();
    const extraRevenue = Math.floor(Math.random() * 80000) + 20000;
    const extraUsers = Math.floor(Math.random() * 20) + 2;
    props.onSimulate(current.revenue + extraRevenue, current.total_users + extraUsers);
  };

  // ⭕ グラフの設定：テーマ変更(props.theme)を検知してダーク・ライトのオプションをリアクティブに切り替える
  const chartOptions = createMemo(() => {
    const stats = props.stats();
    const isDark = props.theme() === 'dark';
    
    return {
      series: [
        { name: '総売上 (x10円)', data: [30000, 40000, 35000, 50000, Math.round(stats.revenue / 10)] },
        { name: 'アクティブユーザー数', data: [800, 950, 910, 1100, stats.total_users] }
      ],
      options: {
        chart: {
          type: 'area',
          height: 350,
          toolbar: { show: false },
          animations: { enabled: true, easing: 'easeinout', speed: 800 }
        },
        // ⭕ グラフ全体のテーマ（ツールチップや標準テキスト）をApexCharts側に指示
        theme: {
          mode: isDark ? 'dark' : 'light'
        },
        colors: ['#3b82f6', '#10b981'],
        stroke: { curve: 'smooth', width: 3 },
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
        },
        xaxis: {
          categories: ['4月', '5月', '6月', '7月', '現在'],
          labels: { style: { colors: isDark ? '#9ca3af' : '#6b7280', fontFamily: 'sans-serif' } }
        },
        yaxis: {
          labels: { style: { colors: isDark ? '#9ca3af' : '#6b7280' } }
        },
        dataLabels: { enabled: false },
        grid: { borderColor: isDark ? '#374151' : '#f3f4f6' } // グリッド線の色を変更
      }
    };
  });

  return (
    <div class="space-y-6">
      {/* ⭕ 統計グリッド（dark: ユーティリティを付与） */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <span class="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase">総売上額</span>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-2">¥{props.stats().revenue.toLocaleString()}</h3>
        </div>
        <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <span class="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase">アクティブユーザー</span>
          <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-2">{props.stats().total_users.toLocaleString()} 人</h3>
        </div>
        <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-800/20 dark:to-gray-900 transition-colors duration-300">
          <span class="text-sm font-medium text-blue-500 dark:text-blue-400 uppercase font-semibold">ARPU (顧客平均単価)</span>
          <h3 class="text-3xl font-bold text-blue-900 dark:text-blue-200 mt-2">¥{arpu().toLocaleString()}</h3>
        </div>
      </div>

      {/* ⭕ グラフカード（dark: ユーティリティを付与） */}
      <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <h4 class="text-lg font-bold text-gray-800 dark:text-white mb-4">月次パフォーマンス推移</h4>
        <div class="w-full min-h-[350px]">
          <SolidApexCharts type="area" height={350} series={chartOptions().series} options={chartOptions().options} />
        </div>
      </div>

      {/* ⭕ アクションエリア */}
      <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <h4 class="text-lg font-bold text-gray-800 dark:text-white mb-2">リアルタイム・データシミュレータ</h4>
        <button 
          onClick={simulateActivity}
          class="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
        >
          ⚡ 仮想トランザクションを発生させる
        </button>
      </div>
    </div>
  );
}

class SolidDashboardElement extends HTMLElement {
  // ⭕ 「theme」属性も新しく監視対象に追加します
  static get observedAttributes() {
    return ['stats-data', 'theme'];
  }

  private dispose?: () => void;
  private setStatsSignal?: (v: DashboardStats) => void;
  private setThemeSignal?: (t: string) => void; // ⭕ テーマ用のシグナル

  public notifyStatsUpdate(revenue: number, totalUsers: number) {
    const event = new CustomEvent('update-stats', {
      detail: { revenue: revenue, total_users: totalUsers },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  connectedCallback() {
    const rawData = this.getAttribute('stats-data') || '{"revenue":0,"total_users":0}';
    const rawTheme = this.getAttribute('theme') || 'light';
    
    const [stats, setStats] = createSignal<DashboardStats>(JSON.parse(rawData));
    const [theme, setTheme] = createSignal<string>(rawTheme);
    
    this.setStatsSignal = setStats;
    this.setThemeSignal = setTheme;

    this.dispose = render(
      () => <SolidDashboard stats={stats} theme={theme} onSimulate={(rev, users) => this.notifyStatsUpdate(rev, users)} />,
      this
    );
  }

  attributeChangedCallback(name: string, _oldVal: string | null, newVal: string | null) {
    if (newVal === null) return;

    if (name === 'stats-data' && this.setStatsSignal) {
      this.setStatsSignal(JSON.parse(newVal));
    }
    // ⭕ Lustre側からテーマ変更が通知されたら、SolidJSのシグナルに反映
    if (name === 'theme' && this.setThemeSignal) {
      this.setThemeSignal(newVal);
    }
  }

  disconnectedCallback() {
    if (this.dispose) this.dispose();
  }
}

if (!customElements.get('solid-dashboard')) {
  customElements.define('solid-dashboard', SolidDashboardElement);
}

