---
title: axum & google on a tree
pubDate: 2026-02-17
description: Setting up axum-login to use Google Oauth
tags: [axum, axum-login, google, oauth2]
---

After struggling with AI giving me outdated code, and going through the hopes
and finding to no avail a single tutorial, or code with good comment on how to setup
axum-login with google, I deced to write one my self.

In this log we will be going over the traits we have to implemnt and the dance
we have to perform in order to get axum-login to get along with google.

If you want to get the latest code the example in the
[axum-login](https://github.com/maxcountryman/axum-login/tree/main/examples/oauth2)
repo will do you just fine, this more of the beginners.

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
```
