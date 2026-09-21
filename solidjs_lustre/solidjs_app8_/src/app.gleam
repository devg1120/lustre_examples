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

// ⭕ テーマ状態の型定義
pub type Theme {
  LightTheme
  DarkTheme
}

pub type Model {
  Model(
    current_page: Page,
    revenue: Int,
    total_users: Int,
    sidebar_open: Bool,
    current_theme: Theme, // ⭕ モデルにテーマを追加
  )
}

fn init(_) -> Model {
  Model(
    current_page: DashboardPage,
    revenue: 1_240_500,
    total_users: 1240,
    sidebar_open: True,
    current_theme: LightTheme, // 初期状態はライトモード
  )
}

// --- UPDATE ---
pub type Msg {
  NavigateTo(Page)
  UpdateStats(revenue: Int, total_users: Int)
  ToggleSidebar
  ToggleTheme // ⭕ テーマを切り替えるメッセージを追加
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    NavigateTo(page) -> Model(..model, current_page: page)
    UpdateStats(rev, users) -> Model(..model, revenue: rev, total_users: users)
    ToggleSidebar -> Model(..model, sidebar_open: !model.sidebar_open)
    ToggleTheme -> {
      let next_theme = case model.current_theme {
        LightTheme -> DarkTheme
        DarkTheme -> LightTheme
      }
      Model(..model, current_theme: next_theme)
    }
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
  // ⭕ 最上位のコンテナに、現在のテーマに応じたクラス(dark)または属性を付与します
  let theme_class = case model.current_theme {
    LightTheme -> ""
    DarkTheme -> "dark" // Tailwindがこの下の `dark:` クラスを検知できるようにする
  }

  html.div([class("min-h-screen font-sans flex flex-col transition-colors duration-300 " <> theme_class)], [
    // ----------------------------------------------------
    // 1. 固定ヘッダー (Top Fixed Header)
    // ----------------------------------------------------
    html.header(
      [
        class(
          "fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between px-6 shadow-sm transition-colors duration-300",
        ),
      ],
      [
        html.div([class("flex items-center gap-4")], [
          html.button(
            [
              class(
                "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer",
              ),
              event.on_click(ToggleSidebar),
            ],
            [element.text("☰")],
          ),
          html.span([class("text-xl font-black text-gray-800 dark:text-white tracking-tight")], [
            element.text("Gleam OS"),
          ]),
        ]),
        
        // ⭕ ヘッダー右側にダークモード切り替えスイッチを設置
        html.div([class("flex items-center gap-4")], [
          html.button(
            [
              class("px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"),
              event.on_click(ToggleTheme)
            ],
            [
              element.text(case model.current_theme {
                LightTheme -> "🌙 ダークモードへ"
                DarkTheme -> "☀️ ライトモードへ"
              })
            ]
          ),
          html.div([class("text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:block")], [
            element.text("管理者アカウント"),
          ]),
        ]),
      ],
    ),

    // メイン領域
    html.div([class("pt-16 flex flex-1 h-[calc(100vh-4rem)]")], [
      // 2. 開閉式サイドバー
      html.aside(
        [
          class(
            "bg-gray-900 dark:bg-black text-white flex flex-col transition-all duration-300 ease-in-out "
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
                  _ -> "w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white transition-all"
                }),
                event.on_click(NavigateTo(DashboardPage)),
              ],
              [element.text("📊 ダッシュボード")]
            ),
            html.button(
              [
                class(case model.current_page {
                  SettingsPage -> "w-full text-left px-4 py-2.5 rounded-lg bg-blue-600 font-medium text-white shadow-sm shadow-blue-500/20"
                  _ -> "w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 dark:hover:bg-gray-900 hover:text-white transition-all"
                }),
                event.on_click(NavigateTo(SettingsPage)),
              ],
              [element.text("⚙️ 設定画面")]
            ),
          ]),
        ],
      ),

      // 3. メインビューエリア
      html.main([class("flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300")], [
        case model.current_page {
          DashboardPage ->
            html.div([], [
              html.h2([class("text-2xl font-bold text-gray-800 dark:text-white mb-6")], [
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
                  // ⭕ 現在のテーマがライトかダークかを文字列("light"/"dark")でSolidJS側へ伝える
                  attribute.attribute(
                    "theme",
                    case model.current_theme {
                      LightTheme -> "light"
                      DarkTheme -> "dark"
                    }
                  ),
                  event.on("update-stats", stats_decoder()),
                ],
                [],
              ),
            ])

          SettingsPage ->
            html.div(
              [class("bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300")],
              [
                html.h2([class("text-2xl font-bold text-gray-800 dark:text-white mb-4")], [
                  element.text("設定"),
                ]),
                html.p([class("text-gray-600 dark:text-gray-400")], [
                  element.text("ここはLustreネイティブで描画されているSPAの設定ページです。"),
                ]),
              ],
            )
        },
      ]),
    ]),
  ])
}

