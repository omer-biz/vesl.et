---
title: "Pandoc"
description: ""
pubDate: 2021-01-01T10:46:44+03:00
draft: false
categories: ["Tutorial"]
tags: ["document", "linux", "pandoc", "markdown"]
---

# Pandoc

Have you ever wanted to write a document, but you hate using applications like MicroSoft
Office, Libre Office, Google Docs, or anything of the sorts. Do you want to write your
documents just like you write codes, with your code editors perk. I for example use vim
and I would have loved, if these application supported vim bindings. 
Well look no further, you can just use pandoc.

Pandoc is a command-line app which can be used to convert a document of any type to any
other type. Basically use your text editor of choice to write your document in any markup
language like markdown, and then use pandoc to convert it to any format you want, be it pdf,
or docx. In our case will be using Markdown to write a document.

## Installing pandoc

Pandoc can be installed on Arch based systems like this

```bash
sudo pacman -S pandoc
```

In order to change documents to a pdf format pandoc uses what is called a `pdfengine`. The 
available pdfengine are.

* pdflatex
* lualatex
* xelatex
* tectonic
* wkhtmltopdf
* weasyprint
* prince
* context
* pdfroff

By default Pandoc uses the `pdflatex` engine, but you can download and use which ever one you
want. To specify your desired engine you can use the `--pdf-engine` option as we will see in a bit.
If you are a beginner I recommend using the `wkhtmltopdf` engine, which can be installed like so.

```bash
sudo pacman -S wkhtmltopdf
```

## Markdown

Markdown is a lightweight markup language like HTML, but much simpler. Here is an 
example.

```Markdown
# Section1

This a paragrah.

## Sub Section

This another paragrah.

**This is a bold text**
*This is italics*
***Bold and italics***
~~Strike Thourgh~~
`code with no syntax highlight`

Here is an image
![Pic](./Pictures/pic1.png)

To insert a link all you have to is
[DuckDuckGo](https://www.duckduckgo.com)

Here is a list

* List item 1
* List item 2
* List item 3

Here is a numbered list

1. List item one
2. List item two
3. List item three
```

In markdown the `#` is treated like a heading. Basically if have one `#`, it means it is the
first level heading, and if you have two `##` it's the second level heading, you get the idea.

I will leave some links down below if you want to know more about Markdown.


## Converting The Documents

To convert what you have written in markdown, save it with a `.md` extension, for example
`notes.md`, and issue the following command.

```bash
pandoc notes.md -o doc.pdf
```

Or if you want to specify a specific pdf engine.

```bash
pandoc notes.md -o doc.pdf --pdf-engine=wkhtmltopdf
```

Here is a sample pdf file I converted from a note I toke about `runit`.

[runit_shortnote.pdf](./runit_shortnote.pdf)
