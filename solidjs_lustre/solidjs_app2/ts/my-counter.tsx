import { render } from 'solid-js/web';
import { createSignal, For } from 'solid-js';

// SolidJS 側の型定義
interface User {
  id: number;
  name: string;
  role: string;
}

function SolidUserList(props: { users: () => User[] }) {
  return (
    <div style={{
      border: '2px dashed #4483c1',
      padding: '15px',
      'border-radius': '8px',
      'background-color': '#f0f7ff',
      'margin-top': '20px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4483c1' }}>SolidJS Area (ユーザーリスト)</h3>
      
      <table style={{ width: '100%', 'border-collapse': 'collapse', 'background-color': '#fff' }}>
        <thead>
          <tr style={{ 'background-color': '#e2f0ff', 'text-align': 'left' }}>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>ID</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>名前</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>役割</th>
          </tr>
        </thead>
        <tbody>
          {/* SolidJSの高速なリストレンダリング最適化モジュール */}
          <For each={props.users()}>
            {(user) => (
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{user.id}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{user.name}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  <span style={{
                    'background-color': user.role === 'Admin' ? '#ffdee2' : '#e4ffd6',
                    padding: '2px 6px',
                    'border-radius': '4px',
                    'font-size': '12px'
                  }}>{user.role}</span>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}

class SolidUserListElement extends HTMLElement {
  // ⭕ 監視する属性名を "users-data" に指定
  static get observedAttributes() {
    return ['users-data'];
  }

  private dispose?: () => void;
  private setUsersSignal?: (v: User[]) => void;

  connectedCallback() {
    // 1. 文字列をパースして初期配列を生成
    const rawData = this.getAttribute('users-data') || '[]';
    const initialUsers: User[] = JSON.parse(rawData);
    
    // 2. 配列を保持する Signal を作成
    const [users, setUsers] = createSignal<User[]>(initialUsers);
    this.setUsersSignal = setUsers;

    this.dispose = render(
      () => <SolidUserList users={users} />,
      this
    );
  }

  // ⭕ Lustre側でリストに要素が追加・削除・変更されたら、ここが自動で発火する
  attributeChangedCallback(name: string, _oldVal: string | null, newVal: string | null) {
    if (name === 'users-data' && this.setUsersSignal && newVal !== null) {
      try {
        // 新しいJSON文字列をパースして、SolidのSignalを最速でアップデート
        this.setUsersSignal(JSON.parse(newVal));
      } catch (e) {
        console.error("JSONのパースに失敗しました", e);
      }
    }
  }

  disconnectedCallback() {
    if (this.dispose) this.dispose();
  }
}

if (!customElements.get('solid-user-list')) {
  customElements.define('solid-user-list', SolidUserListElement);
}

