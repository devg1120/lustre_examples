// 1. SolidJSのWeb Componentスクリプトを実行してカスタム要素を登録
import '../ts/my-counter.tsx';

// 2. Gleam (Lustre) アプリをビルド先からインポートして実行
// ※ プロジェクト名が変更されている場合は `solidjs_app` の部分を書き換えてください
//import { main } from '../build/dev/javascript/solidjs_app/app.mjs';
import { main } from '../build/dev/javascript/site/app.mjs';

main();

