import gleam/json
import lustre
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn main() {
  let app = lustre.simple(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}

// --- MODEL ---
pub type User {
  User(id: Int, name: String, role: String)
}

pub type Model {
  Model(users: List(User))
}

fn init(_) -> Model {
  // 初期データ（カスタムレコードのリスト）
  Model(users: [
    User(id: 1, name: "Alice", role: "Admin"),
    User(id: 2, name: "Bob", role: "Developer"),
    User(id: 3, name: "Charlie", role: "Designer"),
  ])
}

// --- UPDATE ---
pub type Msg {
  NoOp
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    NoOp -> model
  }
}

// --- JSON ENCODER ---
// GleamのデータをJSON文字列に変換する関数
fn encode_users(users: List(User)) -> String {
  let user_encoder = fn(user: User) {
    json.object([
      #("id", json.int(user.id)),
      #("name", json.string(user.name)),
      #("role", json.string(user.role)),
    ])
  }

  json.array(users, user_encoder)
  |> json.to_string
}

// --- VIEW ---
pub fn view(model: Model) -> Element(Msg) {
  html.div(
    [attribute.attribute("style", "padding: 20px; font-family: sans-serif;")],
    [
      html.h1([], [element.text("Lustre から SolidJS へ複雑なデータを渡す")]),
      
      // --- SolidJS Web Component の埋め込み ---
      element.element(
        "solid-user-list",
        [
          // ⭕ データをJSON文字列にシリアライズして、"users-data" 属性として渡す
          attribute.attribute("users-data", encode_users(model.users)),
        ],
        []
      ),
    ]
  )
}

