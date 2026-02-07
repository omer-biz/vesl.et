---
title: "Space | HackTheBox"
pubDate: 2022-11-09T20:29:58+03:00
draft: false
description: "Little space is all you need ;)"
tags: [symlinks]
categories: [Writeup]
heroImage: featured-image.jpg
---


### Disclaimer

This post is not meant to be an in depth tutorial, meaning it won't tell you
each and every step you need to take to solve the challenge, rather it's meant
to guide you, and give you a high level solution so you can solve the challenge
in your __own__ way.

## Intro

The binary is simple in structure and straight forward, you have a space of
`0x1f(31)` to fill, with `eip`'s offset being at `0x12(18)`.

The hard part, though, comes when you want to exploit this vulnerability, unless
you know how to prepare `0x12(18)` bytes of `execve` `shellcode` you pretty 
much have to attack this in multiple steps.

## Getting a leak

Problem number one: [ASLR](https://en.wikipedia.org/wiki/Address_space_layout_randomization)
. You just have to leak a stack address as everything
is already there except for some [gadgets](https://en.wikipedia.org/wiki/Return-oriented_programming)
in the `.text` section, and thankfully
the binary has disabled [PIE](https://www.redhat.com/en/blog/position-independent-executables-pie)

So, let's first defeat `ASLR`. If you make a break point on the `ret` instruction
just before overwriting `eip`, with is at `0x080491ce`, and run the binary with `gdb` you will see that
`eax` holds the address of our input string. This along with a
`call eax` gadget can help us to run some shellcode, but keep in mind this
the shellcode we are running can not be more than `0x12(18)` bytes in size. We
will use this to leak the address on the stack.

```asm
BITS 32


xor eax, eax
mov al, 4
xor ebx, ebx
inc ebx
xor edx, edx
mov dl,  0x38
mov ecx, esp
int 0x80

pop eax
ret
db "A"

dd 0x08049019 ; call eax
dd 0x080491cf ; main
```

The first line tells the assembler to assemble in `32bit` mode. The second
paragraph is just the equivalent of the following in assemble.

```c
write(1, esp, 0x38);
```

The next three lines are padding, fixing up the stack. Remember that every
time you `pop` from the stack you are increasing the `esp` register, and 
vice versa when your using the `push` instruction.

The first line from the last paragraph is where our first `eip` will land, the 
fact that we are using the `call` instruction helps to push `main`'s address
onto the stack (because that's the `call` instruction does it push the next
instruction's address to stack before jumping elsewhere) which means we can
use the `ret` at the end of our shellcode to return to `main`.

Oh, and don't forget to parse the output of the `write` `syscall`.

## Getting a shell

The fact that we are calling main again doesn't make the space problem go away,
it's still there, that's why we should now write another shellcode which will
helps to write as much as we want to memory.

```asm
BITS 32

pop ecx
pop ecx
xor eax, eax
mov al, 3
sub ebx, ebx
xor edx, edx
mov dl, 25
int 0x80
jmp ecx
```

```py
rop = [
    0x08049019, # call eax
    leak,
]
```

The first `pop` instruction gets rid of a junk value on the stack and the 
second `pop` instruction gets the leaked address which we put on the stack
with our [rop](https://en.wikipedia.org/wiki/Return-oriented_programming)
chain. The shellcode is equivalent to.

```c
read(0, ecx /*leak*/, 25);
ecx();
```

And that's it you send in your shellcode, and boom you a shell.

![demo](/images/space.gif)
