import { render } from 'solid-js/web';
import { createSignal, onCleanup } from 'solid-js';

function SolidSplitPanel(props: { left: Element[]; right: Element[] }) {
  // 左側パネルの横幅（％）の初期値
  const [leftWidth, setLeftWidth] = createSignal(50);
  let containerRef: HTMLDivElement | undefined;
  let isDragging = false;

  const startDrag = (e: PointerEvent) => {
    e.preventDefault();
    isDragging = true;
    
    // ドラッグ中はポインターの動きをこの要素にキャプチャする（枠外に行っても外れないようにするブラウザ標準API）
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDrag = (e: PointerEvent) => {
    if (!isDragging || !containerRef) return;

    // コンテナ全体の幅と左端からの位置を取得
    const rect = containerRef.getBoundingClientRect();
    
    // マウス位置から新しい左側パネルの割合（%）を算出
    let newPercentage = ((e.clientX - rect.left) / rect.width) * 100;

    // パネルが潰れすぎないように制限（20% 〜 80%）
    if (newPercentage < 20) newPercentage = 20;
    if (newPercentage > 80) newPercentage = 80;

    setLeftWidth(newPercentage);
  };

  const stopDrag = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      ref={containerRef} 
      class="flex w-full h-[500px] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300"
    >
      {/* 1. 左側スロットコンテナ */}
      <div 
        style={{ 'flex-basis': `${leftWidth()}%` }} 
        class="overflow-auto p-4 min-w-0"
      >
        {/* Lustre から渡されたHTML（子要素）を直接挿入 */}
        <div ref={(el) => el.append(...props.left)} />
      </div>

      {/* 2. 中央の分割つまみバー（Grip Bar） */}
      <div
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={stopDrag}
        class="w-2 bg-gray-100 hover:bg-blue-400 dark:bg-gray-800 dark:hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-colors select-none touch-none active:bg-blue-600"
      >
        {/* 中央のドット（見た目のアクセント） */}
        <div class="w-1 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>

      {/* 3. 右側スロットコンテナ */}
      <div 
        style={{ 'flex-basis': `${100 - leftWidth()}%` }} 
        class="overflow-auto p-4 min-w-0 bg-gray-50/50 dark:bg-gray-950/20"
      >
        {/* Lustre から渡されたHTML（子要素）を直接挿入 */}
        <div ref={(el) => el.append(...props.right)} />
      </div>
    </div>
  );
}

class SolidSplitPanelElement extends HTMLElement {
  private dispose?: () => void;

  connectedCallback() {
    // 💡 Lustre 側からスロット分けされて渡ってきた子要素を取得する
    // カスタム要素の中に `slot="left"` や `slot="right"` を指定した子要素を探します
    const leftElements = Array.from(this.querySelectorAll('[slot="left"]'));
    const rightElements = Array.from(this.querySelectorAll('[slot="right"]'));

    this.dispose = render(
      () => <SolidSplitPanel left={leftElements} right={rightElements} />,
      this
    );
  }

  disconnectedCallback() {
    if (this.dispose) this.dispose();
  }
}

if (!customElements.get('solid-split-panel')) {
  customElements.define('solid-split-panel', SolidSplitPanelElement);
}

