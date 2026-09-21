import gleam/dynamic/decode
import gleam/json
import gleam/list
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
pub type User {
  User(id: Int, name: String, role: String)
}

pub type Model {
  Model(users: List(User))
}

fn init(_) -> Model {
  Model(users: [
    User(id: 1, name: "Alice", role: "Admin"),
    User(id: 2, name: "Bob", role: "Developer"),
    User(id: 3, name: "Charlie", role: "Designer"),
  ])
}

// --- UPDATE ---
pub type Msg {
  DeleteUser(Int) // ⭕ 削除イベントを受け取るメッセージを追加
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    // ⭕ 指定されたIDのユーザーをリストから除外してModelを更新
    DeleteUser(target_id) -> {
      let filtered_users =
        list.filter(model.users, fn(user) { user.id != target_id })
      Model(users: filtered_users)
    }
  }
}

// --- JSON ENCODER ---
fn encode_users(users: List(User)) -> String {
  let user_encoder = fn(user: User) {
    json.object([
      #("id", json.int(user.id)),
      #("name", json.string(user.name)),
      #("role", json.string(user.role)),
    ])
  }
  json.array(users, user_encoder) |> json.to_string
}

// --- VIEW ---
pub fn view(model: Model) -> Element(Msg) {
  html.div(
    [attribute.attribute("style", "padding: 20px; font-family: sans-serif;")],
    [
      html.h1([], [element.text("Lustre & SolidJS 双方向データ通信")]),
      
      element.element(
        "solid-user-list",
        [
          // 1. Lustre -> SolidJS (JSON化したデータを属性経由で送信)
          attribute.attribute("users-data", encode_users(model.users)),
          
          // 2. SolidJS -> Lustre (カスタムイベントからIDをデコードしてMsgを発火)
          // JavaScript側から { detail: { id: X } } で送られてくる構造を解析
          event.on(
            "delete-user",
            decode.at(["detail", "id"], decode.int)
              |> decode.map(DeleteUser),
          ),
        ],
        []
      ),
    ]
  )
}

