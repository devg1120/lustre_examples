import cors_builder as cors
import exception
import gleam/http.{Get, Post}
import wisp

pub fn middleware(
  req: wisp.Request,
  handle_request: fn(wisp.Request) -> wisp.Response,
) -> wisp.Response {
  let run = fn() {
    use req <- wisp.handle_head(req)
    use req <- cors.wisp_middleware(req, cors_config())
    handle_request(req)
  }

  case req.method == Post && wisp.path_segments(req) == ["api", "panic"] {
    True -> rescue_without_logging(run)
    False -> wisp.log_request(req, fn() { wisp.rescue_crashes(run) })
  }
}

fn rescue_without_logging(handler: fn() -> wisp.Response) -> wisp.Response {
  case exception.rescue(handler) {
    Ok(response) -> response
    Error(_) -> wisp.internal_server_error()
  }
}

fn cors_config() {
  cors.new()
  |> cors.allow_origin("http://localhost:1234")
  |> cors.allow_method(Get)
  |> cors.allow_method(Post)
}
