---
title: "Tunneling HTTPS Through HTTP"
description: ""
pubDate: 2023-03-08T09:32:26+03:00
draft: false
heroImage: featured-image.jpg
---

# Amica - Devlog #1

In this post we will be exploring how `HTTP` proxies handle `HTTPS` request.

If you haven't read the last [post](/posts/lets-write-a-proxy-server/) go check it out first, this will make more
sense if you read that first.

To tunnel `https` requests `http` proxies use the `CONNECT` `http` method.
Using this method the proxy establishes a `TCP` connection with the `client`
and the `server` and relays the `tcp packets` back and forth between these
two's `tcp` connection. Let's look how this is done.

## HTTP CONNECT method

The negotiation goes like this. The client will send a request resembling the
following to the `proxy server`.

```txt
CONNECT google.com:443 HTTP/1.1
```

Upon receiving this the `proxy` knows that the `client` wants a `tcp` connection to
`google.com:443`, through this connection the `client` and `server` can establish 
a secure connection. If the `proxy` supports tunneling `tcp` connections, it will send
the following response to the `client`.

```txt
HTTP/1.1 200 OK
```

The proxy will then open a `tcp` connection to the `server`, `google.com:433` in this case,
and starts to send the `tcp` packets back and forth. Let's look at the code to do this
in `Rust`.

## Rust implementation

The code in this section will continue from the last
[post](/posts/lets-write-a-proxy-server/). Last time we where able to handle
`http` request with the following code.

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

We will add the following just after the function declaration starts.

```rust
async fn handle_client(client_tcp_stream: TcpStream) {

    let mut buf = [0; 512];
    client.peek(&mut buf).await.unwrap();

    if buf.starts_with(&[67, 79, 78, 78, 69, 67, 84]) {
        let nbytes = client.read(&mut buf).await.unwrap();

        let head = String::from_utf8_lossy(&buf[..nbytes]);
        let host = head.split_whitespace().nth(1).unwrap();

        let server = TcpStream::connect(host).await.unwrap();

        client.write_all(b"HTTP/1.1 200 OK\r\n\r\n").await.unwrap();

        bidi_read_write(server, client).await;
    }
    let _ = Http::new()
        .serve_connection(

    ...snip...
```

Let's look at the important parts.

On line `4` we are `peeking` because we don't the kind of the request and we 
don't want to empty the inner buffer. If we `read` to the buffer and it turns out
that the request is not a `CONNECT` method, then the code below line `18` wouldn't
know what to do with the request, because we took part of the request.

Line `6` checks if what we have `peeked` `starts_with` `CONNECT` string, the numbers
are `CONNECT` spelled in ascii. we are doing this because we don't want to allocate
memory by creating a string from it.

Line `7` if it turns out to be a `CONNECT` request, we empty the `read` buffer.

Line `9` and `10` extract the `host` from the request, we are using `from_utf8_lossy`
because we don't care if the string has invalid characters.

Line `12` and `14` we connect to the server and inform the client we support `tunneling`
`tcp` connections.

Line `16` then we give the `client` and `server` to `bidi_read_write` to handle the
`tcp` back and forth. Let's have a look at that.

```rust
async fn bidi_read_write(mut stream_one: TcpStream, mut stream_two: TcpStream) {
    let (mut stream_one_rx, mut stream_one_tx) = stream_one.split();
    let (mut stream_two_rx, mut stream_two_tx) = stream_two.split();

    let mut server_buf = [0; 4096];
    let mut client_buf = [0; 4096];
    loop {
        tokio::select! {
            Ok(n) = stream_one_rx.read(&mut server_buf) => {
                if n == 0 {
                    break;
                }
                stream_two_tx.write_all(&server_buf[..n]).await.unwrap();
            },
            Ok(n) = stream_two_rx.read(&mut client_buf) => {
                if n == 0 {
                    break;
                }
                stream_one_tx.write_all(&client_buf[..n]).await.unwrap();
            }
        }
    }
}
```

On line `2` and `3` we split the streams to get the `read` and `write` end.



Line `7` to `22` We are using `tokio::select` to see who has data on thier `read` buffer
and forward it to the `write` end of the other one. We are matching on `Ok(n)` on line
`9` and `15` because read returns a `Result` with the number of bytes read. If the 
number of bytes read on both ends is `0` that means we have reached `EOF` and we should
break the loop.

## Testing with netcat

The thing about this is it works with any kind of `server` and `client` connection over
tcp.

For example we can setup a server and client with `netcat` and tunnel the connection
through our `proxy server`.

First we run our `proxy server` with `cargo run`. Let's assume the `proxy` is listening
on `127.0.0.1:9001`

And the `netcat` server is listening on `127.0.0.1:9001`.

```bash
nc -lnvp 9002
```

In another window we run the following to connect to the proxy server.

```bash
nc 127.0.0.1 9001
```

An send the followin line

```bash
CONNECT 127.0.0.1:9002 HTTP/1.1

```

This tells the proxy "we want a tcp connection to `127.0.0.1:9002`". The proxy responds
with:

```bash
HTTP/1.1 200 OK
```

Telling us we are good to go. from this point onward everything we type in the `client`
window will appear on the `server` window and vice versa.

This commit can be found [here](https://github.com/omer-biz/amica/tree/99d456e66d485f0c002acc0d3649e024d4328423).
