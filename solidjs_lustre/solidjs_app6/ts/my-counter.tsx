import { render } from 'solid-js/web';
import { createSignal, createMemo } from 'solid-js';
// ⭕ ApexChartsのコンポーネントをインポート
import { SolidApexCharts } from 'solid-apexcharts';

interface DashboardStats {
  revenue: number;
  total_users: number;
}

function SolidDashboard(props: { stats: () => DashboardStats; onSimulate: (rev: number, users: number) => void }) {
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

  // ⭕ グラフの設定とオプション定義（リアクティブなMemoで管理）
  const chartOptions = createMemo(() => {
    const stats = props.stats();
    
    return {
      // グラフのデータ（Lustreの最新状態が常にここに注入される）
      series: [
        {
          name: '総売上 (x10円)',
          data: [30000, 40000, 35000, 50000, Math.round(stats.revenue / 10)] // 最終地点にLustreの値を反映
        },
        {
          name: 'アクティブユーザー数',
          data: [800, 950, 910, 1100, stats.total_users] // 最終地点にLustreの値を反映
        }
      ],
      // グラフの外観設定
      options: {
        chart: {
          type: 'area',
          height: 350,
          toolbar: { show: false },
          animations: { enabled: true, easing: 'easeinout', speed: 800 } // アニメーション有効
        },
        colors: ['#3b82f6', '#10b981'], // Tailwindカラーに合わせたブルーとグリーン
        stroke: { curve: 'smooth', width: 3 },
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] }
        },
        xaxis: {
          categories: ['4月', '5月', '6月', '7月', '現在 (Lustre同期)'],
          labels: { style: { colors: '#9ca3af', fontFamily: 'sans-serif' } }
        },
        yaxis: {
          labels: { style: { colors: '#9ca3af' } }
        },
        dataLabels: { enabled: false },
        grid: { borderColor: '#f3f4f6' }
      }
    };
  });

  return (
    <div class="space-y-6">
      {/* 統計グリッド（前回同様） */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <span class="text-sm font-medium text-gray-400 uppercase">総売上額</span>
          <h3 class="text-3xl font-bold text-gray-900 mt-2">¥{props.stats().revenue.toLocaleString()}</h3>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <span class="text-sm font-medium text-gray-400 uppercase">アクティブユーザー</span>
          <h3 class="text-3xl font-bold text-gray-900 mt-2">{props.stats().total_users.toLocaleString()} 人</h3>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 bg-gradient-to-br from-blue-50 to-white">
          <span class="text-sm font-medium text-blue-500 uppercase font-semibold">ARPU (顧客平均単価)</span>
          <h3 class="text-3xl font-bold text-blue-900 mt-2">¥{arpu().toLocaleString()}</h3>
        </div>
      </div>

      {/* ⭕ 追加：ApexChartsによるリッチな時系列グラフ表示カード */}
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 class="text-lg font-bold text-gray-800 mb-4">月次パフォーマンス推移</h4>
        <div class="w-full min-h-[350px]">
          {/* コンポーネントを配置。Optionsの変更をSolidが検知して差分描画します */}
          <SolidApexCharts 
            type="area" 
            height={350} 
            series={chartOptions().series} 
            options={chartOptions().options} 
          />
        </div>
      </div>

      {/* アクションエリア */}
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 class="text-lg font-bold text-gray-800 mb-2">リアルタイム・データシミュレータ</h4>
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
  static get observedAttributes() {
    return ['stats-data'];
  }

  private dispose?: () => void;
  private setStatsSignal?: (v: DashboardStats) => void;

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
    const [stats, setStats] = createSignal<DashboardStats>(JSON.parse(rawData));
    this.setStatsSignal = setStats;

    this.dispose = render(
      () => <SolidDashboard stats={stats} onSimulate={(rev, users) => this.notifyStatsUpdate(rev, users)} />,
      this
    );
  }

  attributeChangedCallback(name: string, _oldVal: string | null, newVal: string | null) {
    if (name === 'stats-data' && this.setStatsSignal && newVal !== null) {
      this.setStatsSignal(JSON.parse(newVal));
    }
  }

  disconnectedCallback() {
    if (this.dispose) this.dispose();
  }
}

if (!customElements.get('solid-dashboard')) {
  customElements.define('solid-dashboard', SolidDashboardElement);
}

