---
title: "Remap Capslock to Escape and Ctrl"
description: ""
pubDate: 2020-12-31T09:57:46+03:00
categories: ["Tutorial"]
tags: ["capslock", "escape", "ctrl", "remap", "linux"]
---

# Remap Capslock to Escape and Ctrl

In this post I'm gonna be showing you how I remapped *capslock* to *ctrl* when you hold it,
and *esc* when you tap it.

The need for this comes from people using window managers, or keyboard driven text editors
like vim, and emacs or just you use the *ctrl* key a lot and you hate the weird motion
you have to do to get to it.

> Capslock is a useless key in the perfect postion
> 
> -- <cite>*Geeks*</cite>

## Installing The Packages

The programs I used to achieve this are `xcape`, and `setxkbmap`. Which can be installed 
like so on arch based systems.

```bash
sudo pacman -S xcape xorg-setxkbmap
```

## How to use them

`xcape` allows a key to be treated as another key when pressed for a short period of time.

`setxkbmap`, the man page states it can be used to map the keyboard to use the layout
determined by the options that are passed to it, and we are going to use it to swap 
capslock with ctrl. 


## The setup

To swap the Capslock key with The Ctrl key:

```sh
# make CapsLock behave like Ctrl:
setxkbmap -option ctrl:swapcaps
```

Since the Capslock key now acts as a ctrl key, we tell the xcape to make the Ctrl key
behave as Escape key when pressed for a short period of time.

```sh
# make short-pressed Ctrl behave like Escape:
xcape -e 'Control_L=Escape'
```

Now combine These put them in a script and make them run on a startup.

```sh
#!/bin/sh

# make CapsLock behave like Ctrl:
setxkbmap -option ctrl:swapcaps

# make short-pressed Ctrl behave like Escape:
xcape -e 'Control_L=Escape'
```

For example

```sh
chmod +x keyb.sh
# you probably want to put before starting your window manager, but you get the idea
echo "keyb.sh" >> ~/.xinitrc
```

Your Done
