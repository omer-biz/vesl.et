---
title: "Narnia 6 - OverTheWire"
description: "That other type of BufferOverflow ;)"
categories: [Writeup]
tags: [ctf, narnia, overthewire, narnia6, hacking]
pubDate: 2021-04-20T13:48:36+03:00
draft: false
---

# Narnia 6 - OverTheWire

## Introduction

This level is all about overflowing into a local variable, specifically to a local function 
pointer variable. When you run the program without any argument it will exit asking for
2 arguments. These two arguments are mapped or copied to the two local variables on the stack, namely `b1`, and `b2`.
They are copied using `strcpy` which we know is not a safe way of copying from user inputs.

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

extern char **environ;

// tired of fixing values...
// - morla
unsigned long get_sp(void) {
       __asm__("movl %esp,%eax\n\t"
               "and $0xff000000, %eax"
               );
}

int main(int argc, char *argv[]){
    char b1[8], b2[8];
    int  (*fp)(char *) = (int(*)(char *))&puts, i;

    if(argc!=3){ printf("%s b1 b2\n", argv[0]); exit(-1); }

    /* clear environ */
    for(i=0; environ[i] != NULL; i++)
            memset(environ[i], '\0', strlen(environ[i]));
    /* clear argz    */
    for(i=3; argv[i] != NULL; i++)
            memset(argv[i], '\0', strlen(argv[i]));

    strcpy(b1,argv[1]);
    strcpy(b2,argv[2]);
    //if(((unsigned long)fp & 0xff000000) == 0xff000000)
    if(((unsigned long)fp & 0xff000000) == get_sp())
            exit(-1);
    setreuid(geteuid(),geteuid());
    fp(b1);

    exit(1);
}
```

The first that may confuse you when you look at this code may be on line 18, the: 

```c
int (*fp)(char *) = (int(*)(char *))&puts;
```

This is the line where the function pointer is being declared, and assigned the address of 
the `puts` function, and letter called with one of our input. The signature of the `puts`:

```c
int puts(const char *s);
```

And if you try to compare this with the `int(*fp)(char *)` part of the previous code you will
see the resemblance. Take a note of this we will be using this in our exploit.

The next part that seems to peculiar is the following:

```c
unsigned long get_sp(void) {
       __asm__("movl %esp,%eax\n\t"
               "and $0xff000000, %eax"
               );
}
```

The `__asm__` function is used to include native Assembly code directly into C source code.
The `get_sp` function is anding what ever is on the stack with `0xff000000`, but I don't 
know why I will update this post when I figure it out. I'm really Sorry for the inconvenience.

## Examining

Moving on, If you try to get control of the `eip` register you can but that is no use because:

* The environment variables are all being zeroed out.
* The argument variables other than the first three are being zeroed out.
* The two buffers we have are only 8 bytes long, which can not hold the shellcode without 
  overwriting other important memory.

If you look closely though, you can see that we can overwrite the function pointer, `fp`,
that points to the `puts` function. This is very convenient because the function is being called 
later, it is being called with one of our inputs, and we can overwrite it with any function
we want. A good function that has the same signature with the `puts` that can be used to
spawn a shell is the `system` function.

```c
int system(const char *command);
```

If somehow we make the program execute this function with the `"/bin/sh"` string we are done.

Let's look at how we can do that. First lets look at some assembly code. This the disassembly 
of the main function.

![Loading puts](./Pictures/screenshot_Apr_21_12:32:39_AM.png)

The blue highlighted part is where the program loads the address of puts which is `0x8048430`
to the `fb` function pointer. You can check this by typing `x/x 0x8048430` on the `gdb` prompt

![Examining puts](./Pictures/screenshot_Apr_21_12:43:21_AM.png)

Now let's examine the stack after our inputs have loaded. For visibility I will load 
4 `A`s in the first argument and 4 `B`s in the second argument. But first I will set a break
point after the copy of both arguments is done.

![Examining The Stack](./Pictures/screenshot_Apr_21_12:51:25_AM.png)

The red highlighted part is the `b1` variable, and the blue highlighted part is `b2` variable.
Down bellow don't forget that `fp` is being called with `b1`. And note that `b1` is written
first.

## Exploiting

Which means to exploit this we can first overwrite what's on the `fp` with the address of
the `system` function using the `b1` buffer, and then overwrite the `b1` buffer to include
the `/bin/sh` string using `b2` buffer. To get the address of the system function you just 
have to type `print system` in gdb, you have to run the program first.

![Address of System](./Pictures/screenshot_Apr_21_01:21:36_AM.png)

After acquiring the address of `system` all you have to do is plug it in and you are done.

```
./narnia6 aaaaaaaa$(echo -en "\x50\xc8\xe4\xf7") 'bbbbbbbb/bin/sh'
```

![Done!!!](./Pictures/screenshot_Apr_21_01:24:24_AM.png)

Thank you for reading :)
