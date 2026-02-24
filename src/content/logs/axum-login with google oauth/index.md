---
title: "Axum & Google Sitting in a Tree: A Guide to axum-login"
pubDate: 2026-02-17
description: Setting up axum-login to use Google Oauth
tags: [axum, axum-login, google, oauth2]
categories: [Tutorial]
draft: true
---

After struggling with outdated AI-generated code and a lack of clear, commented
tutorials, I decided to document the process myself. Setting up axum-login with
Google OAuth doesn't have to be a nuclear science.

In this guide, we’ll walk through the specific traits you need to implement and
the "OAuth dance" required to get axum-login and Google playing nicely together.

> Note: For the absolute latest source, the
> [axum-login](https://github.com/maxcountryman/axum-login/tree/main/examples/oauth2)
> example repo is your best reference. This post is a beginner-friendly deep
> dive into how it actually works.


## Initial Setup

> Disclaimer: If you want keep sane copy the Cargo.toml file as is,
> but if you think any of these packages are outdate use `cargo add`
> with your own discretion

`Cargo.toml`:

```toml
[package]
name = "axum_login_google_oauth2"
version = "0.1.0"
edition = "2024"

[dependencies]
axum = "0.8.8"
axum-login = "0.18.0"
oauth2 = "5.0.0"
serde = { version = "1.0.228", features = ["serde_derive"] }
tokio = { version = "1.49.0", features = ["rt-multi-thread"] }

# `oauth2` already has reqwest as an export but, it doesn't have the json
# field enabled and google returns the user data as a json
reqwest = { version = "0.13.2", features = ["json"] }

# to make life easier you can replace them with what makes you happy
color-eyre = "0.6.5"
maud = "0.27.0"
thiserror = "2.0.18"

# Had to change the version to make it compatible with axum-login
tower-sessions = "0.14.0"
```

## The main funciton

`src/main.rs`:

```rs
use axum::Router;
use axum_login::{
    AuthManagerLayerBuilder,
    tower_sessions::{SessionManagerLayer, cookie::SameSite},
};
use tokio::net::TcpListener;
use tower_sessions::MemoryStore;

#[tokio::main]
async fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;

    // Don't use this in production you should use something like
    // `tower_sessions_sqlx_store` or implement the SessionStore trait
    // for your own store
    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(false) // deafult is true
        .with_same_site(SameSite::Lax); // default is strict

    // This is where your users data is stored and validated, more on it later.
    let backend = Backend::new();
    let auth_layer = AuthManagerLayerBuilder::new(backend, session_layer).build();

    let mut app = Router::new()
        .route("/", handlers::index)
        .route("/auth/google/login", handlers::google_login)
        .route("/auth/google/callback", handlers::google_callback)
        .route("/auth/lgout", handlers::logout)
        .layer(auth_layer); // this is where the session managment is handled by axum-login

    let listener = TcpListener::bind("127.0.0.1:3000").await?;
    println!("Server started serving on: {}", listener.local_addr()?);

    Ok(())
}
```

Let's break it down now.

### SessionStore

`axum-login` needs a place to store your session. In production, you’d use
something like a database. For development purposes, we’ll use the `MemoryStore`
that comes from the tower-sessions crate.

> Foot gun warning: There is a re-export the `tower-sessions` crate from `axum-login` but at the
> time of this writing it doesn't enable the `memory-store` feature which means
> you can't access it.

If your store of choice is supported by the
[tower_sessions_sqlx_store](https://docs.rs/crate/tower-sessions-sqlx-store/latest)
you are in luck you could use one of those, else you can implement the
[SessionStore](https://docs.rs/tower-sessions/latest/tower_sessions/trait.SessionStore.html)
trait for your choice of store, you can find an example
[here](https://docs.rs/tower-sessions/latest/tower_sessions/session_store/index.html)

### What's up with that `Backend` thingy

The `AuthManagerLayerBuilder` needs its first argument to be something that
implements the
[AuthnBackend](https://docs.rs/axum-login/latest/axum_login/trait.AuthnBackend.html)
trait. Essentially, this is a contract maintaining that you, the developer, will
provide:

- *A User*: An entity which would be considered authenticated (or not) in your system.
- *Credentials*: A blueprint of what a user has to provide to get access.
- *An Error*: What kind of disaster is going to happen when this _dance of authentication_ goes wrong.

And this things might change in different scenarios, for example if you are
going to authenticate the user with username and password.

The trait looks like this in it's very simplified, and sugared form:

```rs
pub trait AuthnBackend {
    type User;
    type Credentials;
    type Error;

    async fn authenticate(&self, creds: Self::Credentials,) -> Result<Option<Self::User>, Self::Error>;
    async fn get_user(&self, user_id: &axum_login::UserId<Self>) -> Result<Option<Self::User>, Self::Error>;
}
```

Provided a `Credentials` the `authenticate` funciton will have to _authenticate_
and return the user for which the `Credentials` belong to.

To get started let's first write our `Backend` struct.

```rs
use std::collections::HashMap;

pub type UserId = String;

pub struct Backend {
    pub users: HashMap<UserId, User>,
}

impl Backend {
    pub fn new() -> Self {
        Self {
            users: HashMap::default(),
        }
    }
}
```

And the user:
```rs
#[derive(Debug, Clone)]
pub struct User {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub session_token: String,
}
```

#### Implementing `AuthnBackend`

To implement this trait we have two more structs we have to create; the `Credentials`, and `Error` structs.

```rs
use oauth2::CsrfToken;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Credentials {
    pub code: String,
    pub old_state: CsrfToken,
    pub new_state: CsrfToken,
}

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("OAuth2 exchange failed: {0}")]
    OAuthExchange(String),

    #[error("Identity provider request failed: {0}")]
    Network(#[from] reqwest::Error),

    #[error("CSRF token validation failed: security mismatch")]
    CsrfMismatch,
}
```

Don't worrry about the contents of `Credentials` we will explain it later when we get to the `handlers`.

Before we get to implementing `AuthnBacked` for our `Backend`, we have to implement `AuthUser` for our `User` type,
Because `AuthnBackend` expectes it to.

```rs
use axum_login::AuthUser;

impl AuthUser for User {
    type Id = UserId;

    fn id(&self) -> Self::Id {
        self.id.clone()
    }

    fn session_auth_hash(&self) -> &[u8] {
        self.session_token.as_bytes()
    }
}
```

The `session_auth_hash` is a security feature which is used by `axum-login` as a
kill switch to determine the validity of the user. 

Imagine a user logs in and gets a session cookie. That cookie is like an ID
badge. Normally, as long as they have the badge, they're in.

But what if the user changes their password? Or what if they click "Log out of
all devices" because they left their laptop at a shady coffee shop?

If you only checked the `id()`, the old session cookies would still work until
they naturally expired. By using `session_auth_hash`, you're giving the security
guard a way to verify if the "ID badge" is still current.
