import { render } from 'solid-js/web';
import { createSignal, For } from 'solid-js';

interface User {
  id: number;
  name: string;
  role: string;
}

function SolidUserList(props: { users: () => User[]; onDelete: (id: number) => void }) {
  return (
    <div style={{
      border: '2px dashed #4483c1',
      padding: '15px',
      'border-radius': '8px',
      'background-color': '#f0f7ff',
      'margin-top': '20px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4483c1' }}>SolidJS ユーザーリスト</h3>
      
      <table style={{ width: '100%', 'border-collapse': 'collapse', 'background-color': '#fff' }}>
        <thead>
          <tr style={{ 'background-color': '#e2f0ff', 'text-align': 'left' }}>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>ID</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>名前</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>役割</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.users()}>
            {(user) => (
              <tr>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{user.id}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{user.name}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>{user.role}</td>
                <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                  {/* ⭕ 削除ボタンを追加 */}
                  <button 
                    style={{ color: 'red', cursor: 'pointer', padding: '2px 8px' }}
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
  );
}

class SolidUserListElement extends HTMLElement {
  static get observedAttributes() {
    return ['users-data'];
  }

  private dispose?: () => void;
  private setUsersSignal?: (v: User[]) => void;

  // ⭕ Lustreへカスタムイベントを通じて通知するメソッド
  public notifyDeleteUser(id: number) {
    const event = new CustomEvent('delete-user', {
      detail: { id: id }, // オブジェクト構造でIDをパッケージング
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
      () => <SolidUserList users={users} onDelete={(id) => this.notifyDeleteUser(id)} />,
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

