---
title: "Let's Write a Proxy Server"
pubDate: 2023-03-04T19:00:19+03:00
description: "A tale about a humble proxy server"
draft: false
heroImage: ./featured-image.jpg
---

# Amica - Devlog #0

## A tale about a humble proxy server

Lately I've been trying to learn Rust using the [book](https://doc.rust-lang.org/stable/book/). While
reading the book I was able to write a simple date convertions
[library](https://github.com/omer-biz/zemen), writing a library is a good way
to get your feet wet, in my opinion. After finishing the book I was, naturally,
looking for other project ideas and I landed with this. In these series we will
be looking at implementing our own proxy server.

## Goal

The initial goal is to build a simple
[http](https://en.wikipedia.org/wiki/Proxy_server) proxy server. This server
won't work with [https]() for now. We will implement that in the next post. We
will also embed [lua]() in the coming series to maniuplate the `http` request
and response.

## Get coding

To get started we will need two crates [hyper](https://hyper.rs), and
[tokio](https://tokio.rs) which both can be added to out project like the
following, we will also enable some features these crates have.

```sh
cargo add tokio -F tokio-macros,rt-multi-thread,macros
cargo add hyper -F client,http1,http2,tcp,server
```

From this point forward I will first be posting the code and then I will explain it.

Replace the code in `src/main.rs` with the following.

```rust
use hyper::{server::conn::Http, service::service_fn, Body, Request};
use tokio::net::{TcpListener, TcpStream};


#[tokio::main]
async fn main() {
    let address = "127.0.0.1:9001";
    let tcp_listener = TcpListener::bind(address).await.unwrap();
    println!("listening on {}", address);

    loop {
        let (client_tcp_stream, _sock_addr) = tcp_listener.accept().await.unwrap();
        tokio::spawn(async move {
            handle_client(client_tcp_stream).await;
        });
    }
}
```

This code is relatively simple to grasp so I'm just gonna skim over it. On line
`3` we have where and which port we are listening on. Line `4` is where we will
create, and bind our tcp socket, `Rust` makes it easy by combining two steps
into one in most popular languages you would have to create a socket and then
bind it to an available ip and port.

Note that we are using `unwrap`, for now we won't be worried about errors, we
will worry about them in a future post.

Starting on line `7`, upto `12` we have an endless loop. In this loop we accept
and send to the `handle_client` function in a separate thread or as `tokio`
calls them `green threads`. This allows us to handle multiple clients at a
time.

{{< admonition type=note title="Note" open=true >}}
`tokio`'s threads are not the same as `os` threads.
{{< /admonition >}}

```rust
async fn handle_client(client_tcp_stream: TcpStream) {
    let _ = Http::new()
        .serve_connection(
            client_tcp_stream,
            service_fn(|req: Request<Body>| async {
                let hyper_client = hyper::Client::new();
                let r = hyper_client.request(req).await.unwrap();

                Ok::<_, String>(r)
            }),
        )
        .await;
}
```

We are creating a new `Http` protocol instance with the underlying tcp stream
being `client_tcp_stream` which means this will handle the protocol rules we
just have to send and receive based on the rules. On line `5` we also pass in a
service. A service, as far as I can understand, is something that will make a
`Response` based on a `Request`. In our case we take the clients `Request` and
make the request as if we are making the request, using the `hyper` `http`
client we created on line `6`. And then replay to our client with the
`Response` we got from the `hyper` `http` client on line `9`. 


{{< admonition type=note title="Note" open=true >}}
We are adding `String` as a generic, because the compiler cannot infer the type
of the `E` in `Result<T, E>`. So we are helping the compiler. at first I
thought of putting `std::error::Error` but this is just a trait, and it's size
cannot be know at compile time.

It can, however, infer the type of `T` because we are passing it in.
{{< /admonition >}}


Let's test this with curl. Let's start an http server using the following command.

```sh
echo "<h1>This is the about page</h1>" > about.html
php -S 192.168.43.49:8000
```

Once the server is started all we have to do start the program like this.

```sh
cargo run
```

And connect through it using curl like this.

```sh
curl http://192.168.43.49:8000 --proxy http://127.0.0.1:9001
```

[demo](./demo.mp4)

You can check the source code [here](https://github.com/omer-biz/amica/tree/dd0711d6feb436990ce1aca9825174ba6038188d).
