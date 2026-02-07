---
title: "Mounting and unmounting with dmenu"
description: ""
pubDate: 2021-01-15T16:29:48+03:00
draft: false
categories: ["Tutorial"]
tags: ["linux", "dmeu", "udiskctl"]
---

# Mounting and unmounting with dmenu

Mounting devices with the `mount` command is a hassle, at least for me. To mount
devices with the `mount` command you need to be root but if you use any kind of
file manager to mount devices you don't need to be root. Have you ever wonder why is
that. Well it's simple they use a different kind of command it's called `udiskctl` here the help.

## Commands used 

### udiskctl

![udiskctl](./Pictures/screenshot_Jan_15_04:43:30_PM.png)

udiskctl has a lot commands. We will be using the `mount` and `unmount` commands.

Here is the help.

![help udiskctl](./Pictures/screenshot_Jan_15_04:47:10_PM.png)

### lsblk

What the `lsblk` command does is very simple, it lists block devices, and information
related to those devices, some of the information it displays are the mountpoint, label,
name, type, and so on. Here is an example

![lsblk](./Pictures/screenshot_Jan_15_08:39:38_PM.png)

### awk

Awk is a programming language, and whole new world of knowledge. I really recommend you
take your time and learn it, that dosen't mean by far I'm anywhere near of being perfect 
in `awk`, but I think I have some basic knowledge. We will use `awk` to filter the output of commands and
select certain columns of the output.

### cut

cut can be used to select and or remove some section in a line. Will be used here to parse
the output of awk, why ? you might ask, why don't I just use awk to do that too and the answer
as always is because I'm an idiot, and couldn't find any better way.

### dmenu

Dmenu is not a command it's sort of an app. What it dose is basally simple you give or rather
pipe a bunch
of data separated by newline to it, and it prompts you to chose from them once you select one of
them it prints it, the option you chose, to standard output.


For example

```bash
echo -e "choice 1\nchoice 2 \n choice 3" | dmenu
```

![dmenu](./Pictures/a.png)

## Mounting

Let's put these commands together to build a mounting script. First I'm gonna put the script
here and explain it after wards.

```bash
#! /bin/sh

mount=$(lsblk -l -o NAME,LABEL,TYPE,MOUNTPOINT | awk '/[part|disk] $/ {print $1 ": " $2}' | dmenu -i -p "mount: " | cut -d':' -f 1)
[ ! -z $mount ] && notify-send "$(udisksctl mount -b "/dev/$mount")"
```

The First line tells who ever is going to run this script to use `/bin/sh` to run it.
The `mount=` part is simply assigning a variable. The `$()` means to replace what every is 
returned or printed by what is inside the braces the alternative way is using ``. 

The `lsblk` command, with it's options, print the name, label, type, mountpoint. We will
use the name to differentiate the partitions. The label to get their name, and mountpoint
to know weather they need to mounted or not.

![lsblk with options](./Pictures/screenshot_Jan_15_09:19:06_PM.png)

The `awk '/[part|disk] $/ {print $1 ": " print $2}'` takes the output of lsblk and filters the
partitions which are not mounted and "prints" them with their "label".

![lsblk with awk](./Pictures/screenshot_Jan_15_09:23:15_PM.png)

Now pipe this to dmenu and you get your list of unmounted drives.

![lsblk, awk, and dmenu](./Pictures/b.png)

The last part i.e. `cut -f ':' -d 1` gets ride of the label and preserves the name of drive.

On The next line we check if the user chose anything, if so we mount and notify that it has
been mounted.

## Unmounting

The unmount script dose the same thing, but in reverse i.e. do use the `unmount` command with 
`udisksctl`

```bash
#!/bin/sh

unmount=$(lsblk -l -o NAME,LABEL,TYPE,MOUNTPOINT |  awk '/[part|disk] \/.*$/&&!/nvme/ {print $1 ": " $2}' | dmenu -i -p "unmount: " | cut -d ':' -f 1)
[ ! -z $unmount ] && notify-send "$(udisksctl unmount -f --no-user-interaction -b "/dev/$unmount")"
```

Although there is a bit of difference with the awk command. Here I'm using something different
to filter the output of `lsblk`. I'm using `'/[part|disk] \/.*$/&&!/nvme/'`. If you look 
closely these are two Regexp connected by an `and`(`&&`) operand, which means what ever
comes through awk must satisfy both of these Regexp. 

The first part `/[part|disk] \/.*$/` looks for mounted drives, and the second part `!/nvme/`
filters out my main internal drive. And that's it folks we have done it.
