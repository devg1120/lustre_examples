import { render } from 'solid-js/web';
import { createSignal, For } from 'solid-js';

interface User {
  id: number;
  name: string;
  role: string;
}

function SolidUserList(props: { 
  users: () => User[]; 
  onDelete: (id: number) => void;
  onAdd: (name: string, role: string) => void;
}) {
  // 入力フォーム用の状態（シグナル）
  const [name, setName] = createSignal('');
  const [role, setRole] = createSignal('Developer');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name().trim()) return;
    
    // 親（Lustre）に追加データを通知
    props.onAdd(name(), role());
    
    // フォームをリセット
    setName('');
  };

return (
  <div class="border-2 border-dashed border-blue-400 p-6 rounded-xl bg-blue-50/50 mt-6 shadow-sm">
    <h3 class="text-lg font-bold text-blue-600 mb-4">SolidJS ユーザー管理</h3>
    
    {/* 追加フォーム */}
    <form onSubmit={handleSubmit} class="mb-6 flex flex-wrap gap-3">
      <input 
        type="text" 
        placeholder="名前を入力" 
        value={name()} 
        onInput={(e) => setName(e.currentTarget.value)}
        class="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
      <select 
        value={role()} 
        onChange={(e) => setRole(e.currentTarget.value)}
        class="px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="Admin">Admin</option>
        <option value="Developer">Developer</option>
        <option value="Designer">Designer</option>
      </select>
      <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors cursor-pointer">
        ユーザー追加
      </button>
    </form>

    {/* テーブル */}
    <div class="overflow-hidden border border-gray-200 rounded-lg shadow-inner bg-white">
      <table class="w-full border-collapse text-left text-sm text-gray-600">
        <thead class="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
          <tr>
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">名前</th>
            <th class="px-4 py-3">役割</th>
            <th class="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <For each={props.users()}>
            {(user) => (
              <tr class="hover:bg-gray-50/70 transition-colors">
                <td class="px-4 py-3 font-mono text-gray-400">{user.id}</td>
                <td class="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td class="px-4 py-3">
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'Admin' ? 'bg-red-50 text-red-700 border border-red-100' :
                    user.role === 'Developer' ? 'bg-green-50 text-green-700 border border-green-100' :
                    'bg-purple-50 text-purple-700 border border-purple-100'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button 
                    class="text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer transition-colors"
                    onClick={() => props.onDelete(user.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  </div>
);

}

class SolidUserListElement extends HTMLElement {
  static get observedAttributes() {
    return ['users-data'];
  }

  private dispose?: () => void;
  private setUsersSignal?: (v: User[]) => void;

  public notifyDeleteUser(id: number) {
    const event = new CustomEvent('delete-user', {
      detail: { id: id },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  // ⭕ 新規追加のためのカスタムイベントを発火するメソッド
  // detailに { name: string, role: string } のオブジェクトを乗せて送信
  public notifyAddUser(name: string, role: string) {
    const event = new CustomEvent('add-user', {
      detail: { name: name, role: role },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  connectedCallback() {
    const rawData = this.getAttribute('users-data') || '[]';
    const [users, setUsers] = createSignal<User[]>(JSON.parse(rawData));
    this.setUsersSignal = setUsers;

    this.dispose = render(
      () => (
        <SolidUserList 
          users={users} 
          onDelete={(id) => this.notifyDeleteUser(id)} 
          onAdd={(name, role) => this.notifyAddUser(name, role)} 
        />
      ),
      this
    );
  }

  attributeChangedCallback(name: string, _oldVal: string | null, newVal: string | null) {
    if (name === 'users-data' && this.setUsersSignal && newVal !== null) {
      this.setUsersSignal(JSON.parse(newVal));
    }
  }

  disconnectedCallback() {
    if (this.dispose) this.dispose();
  }
}

if (!customElements.get('solid-user-list')) {
  customElements.define('solid-user-list', SolidUserListElement);
}

