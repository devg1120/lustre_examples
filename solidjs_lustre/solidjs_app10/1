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
  Model(
    current_page: Page,
    revenue: Int,
    total_users: Int,
    sidebar_open: Bool, // ⭕ サイドバーの開閉状態を追加
  )
}

fn init(_) -> Model {
  Model(
    current_page: DashboardPage,
    revenue: 1_240_500,
    total_users: 1240,
    sidebar_open: True, // 初期状態は「開」
  )
}

// --- UPDATE ---
pub type Msg {
  NavigateTo(Page)
  UpdateStats(revenue: Int, total_users: Int)
  ToggleSidebar // ⭕ サイドバーをトグルするメッセージを追加
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    NavigateTo(page) -> Model(..model, current_page: page)
    UpdateStats(rev, users) -> Model(..model, revenue: rev, total_users: users)
    ToggleSidebar -> Model(..model, sidebar_open: !model.sidebar_open) // 状態反転
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
  html.div([class("min-h-screen bg-gray-100 font-sans flex flex-col")], [
    // ----------------------------------------------------
    // ⭕ 1. 固定ヘッダー (Top Fixed Header)
    // ----------------------------------------------------
    html.header(
      [
        class(
          "fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6 shadow-sm",
        ),
      ],
      [
        html.div([class("flex items-center gap-4")], [
          // ハンバーガーメニューボタン (Lustre側でクリックを処理)
          html.button(
            [
              class(
                "p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer",
              ),
              event.on_click(ToggleSidebar),
            ],
            [
              // 三本線アイコン (簡易的な文字列またはSVG)
              element.text("☰"),
            ],
          ),
          html.span([class("text-xl font-black text-gray-800 tracking-tight")], [
            element.text("Gleam OS"),
          ]),
        ]),
        html.div([class("text-sm text-gray-500 font-medium")], [
          element.text("管理者アカウント"),
        ]),
      ],
    ),

    // ヘッダー下のメインコンテンツコンテナ (ヘッダーの高さ 16 分を上部パディングで確保)
    html.div([class("pt-16 flex flex-1 h-[calc(100vh-4rem)]")], [
      // ----------------------------------------------------
      // ⭕ 2. 開閉式サイドバー (Toggleable Sidebar)
      // ----------------------------------------------------
      html.aside(
        [
          class(
            "bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out "
            <> case model.sidebar_open {
              True -> "w-64 opacity-100"
              False -> "w-0 opacity-0 pointer-events-none overflow-hidden"
            },
          ),
        ],
        [
          html.nav([class("flex-1 p-4 space-y-2 w-64")], [
            html.button(
              [
                class(case model.current_page {
                  DashboardPage -> "w-full text-left px-4 py-2.5 rounded-lg bg-blue-600 font-medium text-white shadow-sm shadow-blue-500/20"
                  _ -> "w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
                }),
                event.on_click(NavigateTo(DashboardPage)),
              ],
              [element.text("📊 ダッシュボード")]
            ),
            html.button(
              [
                class(case model.current_page {
                  SettingsPage -> "w-full text-left px-4 py-2.5 rounded-lg bg-blue-600 font-medium text-white shadow-sm shadow-blue-500/20"
                  _ -> "w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
                }),
                event.on_click(NavigateTo(SettingsPage)),
              ],
              [element.text("⚙️ 設定画面")]
            ),
          ]),
        ],
      ),

      // ----------------------------------------------------
      // 3. メインビューエリア
      // ----------------------------------------------------
      html.main([class("flex-1 p-8 overflow-y-auto bg-gray-50/50")], [
        case model.current_page {
          DashboardPage ->
            html.div([], [
              html.h2([class("text-2xl font-bold text-gray-800 mb-6")], [
                element.text("ダッシュボード概況"),
              ]),
              element.element(
                "solid-dashboard",
                [
                  attribute.attribute(
                    "stats-data",
                    json.object([
                      #("revenue", json.int(model.revenue)),
                      #("total_users", json.int(model.total_users)),
                    ])
                      |> json.to_string,
                  ),
                  event.on("update-stats", stats_decoder()),
                ],
                [],
              ),
            ])

          SettingsPage ->
            html.div(
              [class("bg-white p-6 rounded-xl shadow-sm border border-gray-200")],
              [
                html.h2([class("text-2xl font-bold text-gray-800 mb-4")], [
                  element.text("設定"),
                ]),
                html.p([class("text-gray-600")], [
                  element.text(
                    "ここはLustreネイティブで描画されているSPAの別ページです。",
                  ),
                ]),
              ],
            )
        },
      ]),
    ]),
  ])
}

