import gleam/dynamic/decode
import gleam/json
import lustre
import lustre/attribute.{class}
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

// --- MODEL ---
pub type Page {
  DashboardPage
  SettingsPage
}

pub type Model {
  Model(current_page: Page, revenue: Int, total_users: Int)
}

fn init(_) -> Model {
  Model(current_page: DashboardPage, revenue: 1_240_500, total_users: 1240)
}

// --- UPDATE ---
pub type Msg {
  NavigateTo(Page)
  UpdateStats(revenue: Int, total_users: Int)
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    NavigateTo(page) -> Model(..model, current_page: page)
    UpdateStats(rev, users) -> Model(..model, revenue: rev, total_users: users)
  }
}

// --- DECODER ---
fn stats_decoder() -> decode.Decoder(Msg) {
  use revenue <- decode.subfield(["detail", "revenue"], decode.int)
  use total_users <- decode.subfield(["detail", "total_users"], decode.int)
  decode.success(UpdateStats(revenue:, total_users:))
}

// --- VIEW ---
pub fn view(model: Model) -> Element(Msg) {
  html.div([class("flex min-h-screen bg-gray-100 font-sans")], [
    // 1. サイドバー（Lustreで描画）
    html.aside([class("w-64 bg-gray-900 text-white flex flex-col")], [
      html.div([class("p-6 text-xl font-bold border-b border-gray-800 text-blue-400")], [
        element.text("Gleam OS")
      ]),
      html.nav([class("flex-1 p-4 space-y-2")], [
        html.button(
          [
            class(case model.current_page {
              DashboardPage -> "w-full text-left px-4 py-2.5 rounded-lg bg-blue-600 font-medium text-white"
              _ -> "w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            }),
            event.on_click(NavigateTo(DashboardPage)),
          ],
          [element.text("📊 ダッシュボード")]
        ),
        html.button(
          [
            class(case model.current_page {
              SettingsPage -> "w-full text-left px-4 py-2.5 rounded-lg bg-blue-600 font-medium text-white"
              _ -> "w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            }),
            event.on_click(NavigateTo(SettingsPage)),
          ],
          [element.text("⚙️ 設定画面")]
        ),
      ]),
    ]),

    // 2. メインコンテンツエリア
    html.main([class("flex-1 p-8 overflow-y-auto")], [
      case model.current_page {
        DashboardPage ->
          html.div([], [
            html.h2([class("text-2xl font-bold text-gray-800 mb-6")], [
              element.text("ダッシュボード概況")
            ]),
            
            // ⭕ SolidJS のリッチなダッシュボードUIコンポーネントを埋め込む
            element.element(
              "solid-dashboard",
              [
                // Lustre の状態を JSON 文字列にして受け渡す
                attribute.attribute(
                  "stats-data",
                  json.object([
                    #("revenue", json.int(model.revenue)),
                    #("total_users", json.int(model.total_users)),
                  ])
                    |> json.to_string,
                ),
                // SolidJS 側のシミュレーションボタンが叩かれた時のイベントハンドラ
                event.on("update-stats", stats_decoder()),
              ],
              []
            ),
          ])

        SettingsPage ->
          html.div([class("bg-white p-6 rounded-xl shadow-sm border border-gray-200")], [
            html.h2([class("text-2xl font-bold text-gray-800 mb-4")], [element.text("設定")]),
            html.p([class("text-gray-600")], [element.text("ここはLustreネイティブで描画されているSPAの別ページです。")]),
          ])
      },
    ]),
  ])
}

