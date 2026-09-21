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
  ])
}

// --- UPDATE ---
pub type Msg {
  DeleteUser(Int)
  AddUser(name: String, role: String)
}

fn update(model: Model, msg: Msg) -> Model {
  case msg {
    DeleteUser(target_id) -> {
      let filtered_users =
        list.filter(model.users, fn(user) { user.id != target_id })
      Model(users: filtered_users)
    }

    AddUser(name, role) -> {
      let next_id =
        list.fold(model.users, 0, fn(acc, user) {
          case user.id > acc {
            True -> user.id
            False -> acc
          }
        })
        + 1

      let new_user = User(id: next_id, name: name, role: role)
      let updated_users = list.append(model.users, [new_user])
      Model(users: updated_users)
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

// --- JSON DECODER ---
// ⭕ 最新の Gleam stdlib (v1.x) で確実に動作する複合ネストデコーダの決定版
fn add_user_decoder() -> decode.Decoder(Msg) {
  // 1. まず JavaScript 側から飛んでくる detail オブジェクト内の「name」を掘り下げて取得
  use name <- decode.subfield(["detail", "name"], decode.string)
  
  // 2. 次に detail オブジェクト内の「role」を掘り下げて取得
  use role <- decode.subfield(["detail", "role"], decode.string)
  
  // 3. 両方が無事に取得できたら、それらを AddUser メッセージに包んで返します
  decode.success(AddUser(name:, role:))
}

// --- VIEW ---
pub fn view(model: Model) -> Element(Msg) {
  html.div(
    [attribute.class("max-w-4xl mx-auto p-8 bg-gray-50 min-h-screen")], 

    [
         html.h1(
        [attribute.class("text-3xl font-extrabold text-gray-900 tracking-tight mb-6")], 
        [element.text("Lustre & SolidJS ユーザー管理")]
      ),
      element.element(
        "solid-user-list",
        [
          // 1. データ送信
          attribute.attribute("users-data", encode_users(model.users)),
          
          // 2. 削除イベント受信
          event.on(
            "delete-user",
            decode.at(["detail", "id"], decode.int)
              |> decode.map(DeleteUser),
          ),
          
          // 3. 追加イベントの受信 (作成したデコーダを配置)
          event.on("add-user", add_user_decoder()),
        ],
        []
      ),
    ]
  )
}

