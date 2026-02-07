---
title: "Utumno 3 - OverTheWire"
description: "Just get eip control"
pubDate: 2021-06-03T16:07:37+03:00
draft: true
---

# Utumno 3 - OverTheWire

To solve this level you have to understand how the stack works and how the `xor` operators
works. Lets start with how the `xor` operators works.

## xor and it's properties

The logic of xor goes a little like this. If both of the operands are the same it will 
evaluate to `false`, and if they differ it evaluates to `true`. The following is the truth 
table of `xor`.

| A     | B   | A xor B   |
| :---: | :-: | :-------: |
| 0     | 0   | 0         |
| 0     | 1   | 1         |
| 1     | 0   | 1         |
| 1     | 1   | 0         |
 
Another properties of xor we are going to use is

If `A xor B = C` is true then `A xor C = B` is also true.

Here is a link if you want to know more about `xor`

https://accu.org/journals/overload/20/109/lewin_1915/

## The stack

The stack is where our local variables, ebp, eip, and etc are stored. When a function is
called, a new stack frame is created and pushed on the stack. When the function 
returns the stack frame is popped/destroyed and execution continues. For example lets say
we have the following code

```c
int func1(int arg1, int arg2) {
    int lvar1;
    int lvar2;
    
    return 0;
}

int main(int argc, char **argv) {
    func1(1, 2);
} 
```

Here is a very poor graphic representing how the stack will like when main calls `func1`

{{< figure src="./stack.png" title="stack" >}}

## Analysis of the binary

Here is the decompiled part from Ghidra that we are interested in, I have renamed some parts

{{< figure src="./decom.png" >}}

The loop processes two characters per iteration. The first character passes through an `xor`
encryption and then is used as an index of an array, which is where our second input goes.

We obviously control what the second character is but if we could control where that character
is written i.e. control the index that is passed to the second array we can produce an 
arbitrary code execution by writing out of bounds and controlling `eip`.

The `xor` encryption goes like this

```
X = our_ipnut xor (counter * 3)
```

When you access an array with an index like `array[a]` this can be translated to `*(array + a)`
here is an example code to check this for your self if you want:

```c
#include <stdio.h>

int main(int argc, char **argv) {

    int ar[5] = {1, 2, 3, 4, 5};
    int a, b;
    int i = 3;

    a = ar[i];
    b = *(ar + i);

    printf("a: %d\n", a);
    printf("b: %d\n", b);

    return 0;
}
```

Where `array` is a pointer to the first element in the array.

Equipped with this knowledge; we can, by controlling the index of array `a`, overwrite the 
the return address. For example lets say the return address exists within `59` bytes of our
array `a`. 

To completely overwrite the return address we have to overwrite the bytes at 59, 60, 61, 62.

To get the first byte:

```
59 = y ^ 0 * 3
59 = y ^ 0
y = 59 ^ 0
y = 59
```

The second:

```
60 = y ^ 1 * 3
60 = y ^ 1
y = 60 ^ 1
y = 61
```

The third:

```
61 = y ^ 2 * 3
61 = y ^ 2
y = 61 ^ 2
y = 63
```

The fourth:

```
62 = y ^ 3 * 3
62 = y ^ 3
y = 62 ^ 3
y = 60
```

The bytes would be 59, 61, 63, 60. Which means if you want to overwrite the `eip` to
The traditional `41414141`. You would setup your payload like this.

`59\x4161\x4163\x4160\x41`

## Exploit


