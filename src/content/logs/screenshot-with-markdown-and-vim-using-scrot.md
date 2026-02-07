---
title: "Screenshot with Markdown and Vim Using Scrot"
description: ""
pubDate: 2020-12-29T18:50:01+03:00
categories: ["Tutorial"]
tags: ["Scrot", "Neo(vim)", "Screenshot", "linux"]
---

# Screenshot with Vim

In this post I will show you the easiest way I could come up with for taking
screenshots and inserting them to a markdown file while taking notes using
Neo(vim).

The title maybe confusing as I couldn't come up with a shorter title myself.
If you could come up with a shorter title please contact me.

I faced this problem while I was taking notes through
my playing of CTFs and doing pentests. 

I always run a command and forget to take a screenshot and put it into my notes, 
or just hate the hassle of taking a screenshots, creating a folder called Pictures 
for organization, move the screenshot to the Pictures folder and write the 
Markdown syntax to include the Pictures in my note.

## Needed Packages

To face this problem we are going to need the following packages:

* scrot, 
* neo(vim)
* xclip

To install `scrot`, `xclip`, and `neovim` on arch based system all you need to do is. 

```sh
sudo pacman -S scrot neovim xclip
```

On other systems you may have to google how to install it using your own package manager. 
And if you're using Windows think about your life choices for a bit.


## Scrot

Scrot is a minimalist screenshot taking utility, and has many features, but we
are going to use the `--select` option in our case, because it's rare that anyone
would like to take a fullscreen screenshot.

To take a fullscreen shot though all you need to do is invoke the `scrot` and
a screenshot will be taken and stored in the home directory.

```sh
scrot
```

To save the screenshot to a specific directory, supply the path to after the
command `scrot`.

```sh
scrot <path>
```

And to take a section of your screen all you have to is supply the `--select`
option to the `scrot` command. Your pointer will change and you can select the
area you want to take screenshot of.

```sh
scrot --select <path>
```

## Neo(vim)

Vim is a text editor and if you're reading this you probably know what vim is, if 
you don't it's fantastic text editor that uses key-bindings. You should really
try learning vim.

## xclip

xclip is a command line app that can be used to interact the system clipboard.
We will use to transfer the name of the screenshot we are taking from our custom
script to vim. xclip can use three clipboard we will be using the primary which is
the default.

## Taking a screenshot in Vim


### The script
First I wrote a shell script that takes a screenshot, makes a directory called `Pictures`,
puts the name of the screenshot to the clipboard, and save the screenshot to the 
directory. Not in that particular order though. Here is the script. Write this to a file
and put where you want, I have it in  `scripts` directory.

```sh
#!/bin/sh

pwd=$(pwd)
pic_name="screenshot_$(date "+%h_%d_%I:%M:%S_%p").png"

mkdir -p "$pwd/Pictures"
scrot --select "$pwd/Pictures/$pic_name"

echo -n "./Pictures/$pic_name" | xclip
```

And make it executable.

```sh
chmod +x script.sh
```

### Vim config

Put the following in your vim configuration. This maps `CTRL-s` to call the screenshoting
script and inserts a markdown syntax for images in the current line.

```vim
nnoremap <C-s> :!$HOME/.local/scripts/screenshot.sh<CR><CR>i![](<ESC>"*pA)<Home><Right><Right>
```

And that's it your done. Now ever time you want to insert a screenshot you just 
have to hit `CTRL-s` and insert the image name. Here is a demo of me trying to
record a video using `ffmpeg` and capture it's output.

{{< youtube 7q_VUwZU45E >}}
