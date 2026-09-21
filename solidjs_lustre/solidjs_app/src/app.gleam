
import gleam/dynamic/decode
import gleam/int
import lustre
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

// --- MODEL ---
pub type Model {
  Model(count: Int)
}

fn init(_) -> Model {
  Model(count: 0)
}

// --- UPDATE ---
pub type Msg {
  UserClickedLustreIncrement
  SolidCounterChanged(Int)
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    UserClickedLustreIncrement -> 
      Model(count: model.count + 1)

    // SolidJSのカスタムイベント経由で新しい値を受け取って更新
    SolidCounterChanged(new_value) -> 
      Model(count: new_value)
  }
}

// --- VIEW ---
pub fn view(model: Model) -> Element(Msg) {
  html.div(
    [attribute.attribute("style", "padding: 20px; font-family: sans-serif;")], 
    [
      html.h1([], [element.text("Lustre & SolidJS 共存アプリ")]),
      
      html.div(
        [attribute.attribute("style", "margin-bottom: 20px;")], 
        [
          element.text("Lustreの状態 (Model): "),
          html.strong([], [element.text(int.to_string(model.count))]),
          element.text(" "),
          html.button([event.on_click(UserClickedLustreIncrement)], [
            element.text("Lustre側でインクリメント")
          ])
        ]
      ),

      // --- SolidJS Web Component の埋め込み ---
      element.element(
        "solid-counter",
        [
          // 1. Lustre -> SolidJS: 属性経由で最新の数値を伝播
          attribute.attribute("count", int.to_string(model.count)),
          
          // 2. SolidJS -> Lustre: カスタムイベントを購読
          // 最新の Lustre (v5.x) では、`event.on` の第二引数に
          // `decode.Decoder(Msg)` オブジェクトを直接渡します。
          // 以下のコードは `["detail", "value"]` から Int を取り出し、
          // 直接 `SolidCounterChanged` メッセージにマッピングするデコーダです。
          event.on(
            "count-change",
            decode.at(["detail", "value"], decode.int)
              |> decode.map(SolidCounterChanged),
          ),
        ],
        []
      )
    ]
  )
}

