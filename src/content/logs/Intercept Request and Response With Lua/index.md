---
title: "Intercept Request and Response With Lua"
description: ""
pubDate: 2023-03-25T00:47:56+03:00
draft: true
---

# Intercept Request and Response With Lua

Previously we successfully proxied requests and responses from clients to
servers and vice versa. Now we will look at modifying these on the way using lua.

In our simple case we will have two `lua` functions conveniently called
`on_http_request` which is going to be called on the client's request, and
`on_http_response` which will be called on the server's response. These functions
will have the following signitures.

```lua
function on_http_request(req)
  -- Do stuff with request
  return req
end

function on_http_response(res)
  -- Do stuff with response
  return res
end

```

Notice how these function are returning their arguments, which means we are not
modifiying the global state, and can be called concurrently on multiple
threads, More on this later.

## Lua Runtime

I went with [rlua](https://docs.rs/rlua/0.19.4/rlua/index.html) as my lua
runtime, it seems more mature. Let's take a quick crash course on `rlua`.

Loading a `lua` script from file.

Let's say we have a `lua` script with the following content and we want call the 
`say_hello` function form `rust`.

```lua
function say_hello(person)
  print("Hello " .. person)
end
```

What we can don on the rust side to call this function is.

```rust
let buf = read_to_string("./hello.lua")?;
let lua = Lua::new();

lua.context(|lua_context| {
  let globals = lua_context.globals();
  globals.load(buf).eval::<MultiValue>()?;

  let say_hello: Function = globals.get("say_hello")?;

  say_hello.call::<_, ()>("World")?:
});
```


