import { render } from 'solid-js/web';
import { createSignal } from 'solid-js';

// 通常の SolidJS コンポーネント
// 引数（props）で「Lustreへ通知するための関数」を直接受け取る設計にします
function SolidCounter(props: { count: () => number; onNotify: (val: number) => void }) {
  const increment = () => {
    const nextValue = props.count() + 1;
    // イベントオブジェクトに一切頼らず、親から渡された関数を実行するだけ
    props.onNotify(nextValue);
  };

  return (
    <div style={{
      border: '2px dashed #4483c1',
      padding: '15px',
      'border-radius': '8px',
      'background-color': '#f0f7ff',
      'margin-top': '10px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4483c1' }}>SolidJS コンポーネント</h3>
      <p>Lustre から同期された値: <strong>{props.count()}</strong></p>
      <button 
        style={{ padding: '6px 12px', cursor: 'pointer' }} 
        onClick={increment}
      >
        Solid側でインクリメント
      </button>
    </div>
  );
}

// 自前で Web Component を定義するクラス
class SolidCounterElement extends HTMLElement {
  static get observedAttributes() {
    return ['count'];
  }

  private dispose?: () => void;
  private setCountSignal?: (v: number) => void;

  constructor() {
    super();
  }

  // ⭕ 解決の要: カスタム要素自身からLustreへ確実にイベントを飛ばす専用メソッド
  public notifyLustre(nextValue: number) {
    const event = new CustomEvent('count-change', {
      detail: { value: nextValue },
      bubbles: true,
      composed: true, // Lustre側で確実にキャッチするために必須
    });
    // this（＝このsolid-counter要素そのもの）から安全にディスパッチ
    this.dispatchEvent(event);
  }

  connectedCallback() {
    const initialCount = Number(this.getAttribute('count') || 0);
    const [count, setCount] = createSignal(initialCount);
    this.setCountSignal = setCount;

    // SolidJSコンポーネントに、要素のメソッドを直接バインドして渡す
    this.dispose = render(
      () => <SolidCounter count={count} onNotify={(val) => this.notifyLustre(val)} />,
      this
    );
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'count' && this.setCountSignal && newValue !== null) {
      this.setCountSignal(Number(newValue));
    }
  }

  disconnectedCallback() {
    if (this.dispose) this.dispose();
  }
}

if (!customElements.get('solid-counter')) {
  customElements.define('solid-counter', SolidCounterElement);
}

