import { render } from 'solid-js/web';
import { createSignal, createMemo } from 'solid-js';

interface DashboardStats {
  revenue: number;
  total_users: number;
}

function SolidDashboard(props: { stats: () => DashboardStats; onSimulate: (rev: number, users: number) => void }) {
  // 1ユーザーあたりの平均単価（ARPU）をリアクティブに算出
  const arpu = createMemo(() => {
    const s = props.stats();
    return s.total_users > 0 ? Math.round(s.revenue / s.total_users) : 0;
  });

  const simulateActivity = () => {
    // 擬似的にデータをランダムに上昇させ、Lustreに送り飛ばす
    const current = props.stats();
    const extraRevenue = Math.floor(Math.random() * 50000) + 10000;
    const extraUsers = Math.floor(Math.random() * 15) + 1;
    
    props.onSimulate(current.revenue + extraRevenue, current.total_users + extraUsers);
  };

  return (
    <div class="space-y-6">
      {/* 統計グリッドカード */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* カード1：総売上 */}
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <span class="text-sm font-medium text-gray-400 uppercase">総売上額</span>
            <h3 class="text-3xl font-bold text-gray-900 mt-2">¥{props.stats().revenue.toLocaleString()}</h3>
          </div>
          <div class="text-xs text-green-600 font-semibold mt-4 flex items-center gap-1">
            <span>↑ 12.5%</span> <span class="text-gray-400 font-normal">先月比</span>
          </div>
        </div>

        {/* カード2：総ユーザー数 */}
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <span class="text-sm font-medium text-gray-400 uppercase">アクティブユーザー</span>
            <h3 class="text-3xl font-bold text-gray-900 mt-2">{props.stats().total_users.toLocaleString()} 人</h3>
          </div>
          <div class="text-xs text-green-600 font-semibold mt-4 flex items-center gap-1">
            <span>↑ 4.8%</span> <span class="text-gray-400 font-normal">先月比</span>
          </div>
        </div>

        {/* カード3：SolidJSの計算型シグナル（ARPU） */}
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between bg-gradient-to-br from-blue-50 to-white">
          <div>
            <span class="text-sm font-medium text-blue-500 uppercase font-semibold">ARPU (顧客平均単価)</span>
            <h3 class="text-3xl font-bold text-blue-900 mt-2">¥{arpu().toLocaleString()}</h3>
          </div>
          <p class="text-xs text-gray-500 mt-4">
            SolidJSの <code class="bg-blue-100 text-blue-800 px-1 rounded">createMemo</code> でリアルタイム自動計算
          </p>
        </div>
      </div>

      {/* アクションエリア */}
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 class="text-lg font-bold text-gray-800 mb-2">リアルタイム・データシミュレータ</h4>
        <p class="text-sm text-gray-500 mb-4">
          以下のボタンを押すと、SolidJS側でトランザクションを生成し、その結果をLustreの「唯一の真実のソース(Model)」に送り出して同期します。
        </p>
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
      this.setUsersSignal ? this.setStatsSignal(JSON.parse(newVal)) : Object.assign(window, {}); 
      // 安全にシグナルへマッピング
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

