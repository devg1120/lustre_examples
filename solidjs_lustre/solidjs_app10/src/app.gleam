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

@external(javascript, "./theme_helper.js", "toggle_html_theme")
fn toggle_html_theme_ffi(is_dark: Bool) -> Nil

pub type Page { DashboardPage SettingsPage }
pub type Theme { LightTheme DarkTheme }

pub type Model {
  Model(current_page: Page, revenue: Int, total_users: Int, sidebar_open: Bool, current_theme: Theme)
}

fn init(_) -> Model {
  Model(current_page: DashboardPage, revenue: 1_240_500, total_users: 1240, sidebar_open: True, current_theme: LightTheme)
}

pub type Msg { NavigateTo(Page) UpdateStats(revenue: Int, total_users: Int) ToggleSidebar ToggleTheme }

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    NavigateTo(page) -> Model(..model, current_page: page)
    UpdateStats(rev, users) -> Model(..model, revenue: rev, total_users: users)
    ToggleSidebar -> Model(..model, sidebar_open: !model.sidebar_open)
    ToggleTheme -> {
      let next_theme = case model.current_theme { LightTheme -> DarkTheme DarkTheme -> LightTheme }
      case next_theme { DarkTheme -> toggle_html_theme_ffi(True) LightTheme -> toggle_html_theme_ffi(False) }
      Model(..model, current_theme: next_theme)
    }
  }
}

fn stats_decoder() -> decode.Decoder(Msg) {
  use revenue <- decode.subfield(["detail", "revenue"], decode.int)
  use total_users <- decode.subfield(["detail", "total_users"], decode.int)
  decode.success(UpdateStats(revenue:, total_users:))
}

pub fn view(model: Model) -> Element(Msg) {
  html.div([class("min-h-screen font-sans flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300")], [
    // 1. 固定ヘッダー
    html.header([class("fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 flex items-center justify-between px-6 shadow-sm transition-colors duration-300")], [
      html.div([class("flex items-center gap-4")], [
        html.button([class("p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 cursor-pointer"), event.on_click(ToggleSidebar)], [element.text("☰")]),
        html.span([class("text-xl font-black text-gray-800 dark:text-white tracking-tight")], [element.text("Gleam OS")])
      ]),
      html.div([class("flex items-center gap-4")], [
        html.button([class("px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"), event.on_click(ToggleTheme)], [
          element.text(case model.current_theme { LightTheme -> "🌙 ダークモードへ" DarkTheme -> "☀️ ライトモードへ" })
        ]),
        html.div([class("text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:block")], [element.text("管理者")])
      ])
    ]),

    // メイン領域レイアウト
    html.div([class("pt-16 flex flex-1 h-[calc(100vh-4rem)]")], [
      // 2. サイドバー
      html.aside([class("bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 flex flex-col transition-all duration-300 ease-in-out " <> case model.sidebar_open { True -> "w-64 opacity-100" False -> "w-0 opacity-0 pointer-events-none overflow-hidden" })], [
        html.nav([class("flex-1 p-4 space-y-2 w-64")], [
          html.button([class(case model.current_page { DashboardPage -> "w-full text-left px-4 py-2.5 rounded-lg bg-blue-600 font-medium text-white shadow-sm" _ -> "w-full text-left px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all" }), event.on_click(NavigateTo(DashboardPage))], [element.text("📊 ダッシュボード")]),
          html.button([class(case model.current_page { SettingsPage -> "w-full text-left px-4 py-2.5 rounded-lg bg-blue-600 font-medium text-white shadow-sm" _ -> "w-full text-left px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all" }), event.on_click(NavigateTo(SettingsPage))], [element.text("⚙️ 設定画面")])
        ])
      ]),

      // 3. メインコンテンツエリア
      html.main([class("flex-1 p-8 overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300")], [
        case model.current_page {
          DashboardPage -> html.div([], [
            html.h2([class("text-2xl font-bold text-gray-800 dark:text-white mb-6")], [element.text("ダッシュボード概況")]),
            
            // 3-a. 統計グラフ
            element.element("solid-dashboard", [
              attribute.attribute("stats-data", json.object([#("revenue", json.int(model.revenue)), #("total_users", json.int(model.total_users))]) |> json.to_string),
              attribute.attribute("theme", case model.current_theme { LightTheme -> "light" DarkTheme -> "dark" }),
              event.on("update-stats", stats_decoder())
            ], []),

            // 3-b. 左右リサイズ分割パネル
            html.div([class("mt-8")], [
              html.h3([class("text-lg font-bold text-gray-700 dark:text-gray-300 mb-4")], [element.text("ワークスペース分割プレビュー（左右）")]),
              element.element("solid-split-panel", [], [
                html.div([attribute.attribute("slot", "left"), class("space-y-2")], [
                  html.h4([class("font-bold text-blue-600 dark:text-blue-400")], [element.text("← 左側エリア")]),
                  html.p([class("text-sm text-gray-500 dark:text-gray-400")], [element.text("この表示内容は、Lustre (Gleam) 側で制御されています。")])
                ]),
                html.div([attribute.attribute("slot", "right"), class("space-y-2")], [
                  // ⭕ 修正箇所：第2引数として [element.text("...")] を追加
                  html.h4([class("font-bold text-emerald-600 dark:text-emerald-400")], [element.text("右側エリア →")]),
                  html.p([class("text-sm text-gray-500 dark:text-gray-400")], [element.text("バーをドラッグすると、SolidJSがスタイル幅をリアルタイムに変更します。")])
                ])
              ])
            ]),

            // 3-c. 上下リサイズ分割パネル
            html.div([class("mt-8")], [
              html.h3([class("text-lg font-bold text-gray-700 dark:text-gray-300 mb-4")], [element.text("ログ・ターミナル分割プレビュー（上下）")]),
              element.element("solid-split-panel-vertical", [], [
                html.div([attribute.attribute("slot", "top"), class("space-y-2")], [
                  // ⭕ 修正箇所：第2引数を追加
                  html.h4([class("font-bold text-blue-600 dark:text-blue-400")], [element.text("↑ 上側メインエリア")]),
                  html.p([class("text-sm text-gray-500 dark:text-gray-400")], [element.text("上側にはメインのドキュメントや主要なプレビューを表示できます。")])
                ]),
                html.div([attribute.attribute("slot", "bottom"), class("space-y-2")], [
                  // ⭕ 修正箇所：第2引数を追加
                  html.h4([class("font-bold text-gray-600 dark:text-gray-400")], [element.text("↓ 下部ターミナル")]),
                  html.p([class("text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700")], [
                    element.text("$ gleam run --target javascript\nCompiled successfully in 120ms.")
                  ])
                ])
              ])
            ])
          ])

          SettingsPage -> html.div([class("bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors duration-300")], [
            html.h2([class("text-2xl font-bold text-gray-800 dark:text-white mb-4")], [element.text("設定")]),
            html.p([class("text-gray-600 dark:text-gray-400")], [element.text("ここはLustreネイティブで描画されているSPAの設定ページです。")])
          ])
        }
      ])
    ])
  ])
}

