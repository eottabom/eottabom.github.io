---
layout: post
title: "파일 끝에 개행이 필요한 이유"
description: "File dose not end with a newline"
excerpt: "파일 끝에 개행이 필요한 이유와 POSIX 표준에 대해서 간략히 알아보자."
category: [Study, Clean Code]
comments: true
---

<div id ="notice--success">

    <p style='margin-top:1em;'>
        <b>🍏️ About </b>
    </p>
    파일 끝에 개행이 없는 경우에는 CheckStyle 을 돌리거나, github 으로 Pull Request 를 하면 경고가 뜨는 <br>
    이유는 POSIX 명세 때문인데, 그 현상과 POSIX 표준에 대해서 간략히 알아보자.
    <p style='margin-top:1em;'/>

</div>

<br>

### 파일 끝에 개행이 없는 경우의 현상

---

check style 의 결과로 `File does not end with a newline.` 경고가 발생한다.  
![check-style]({{site.baseurl}}/img/post/study/new-line/check-style-result.png)

<br>

github 에서 `Pull Request` 할 때 이상한 마크(![mark]({{site.baseurl}}/img/post/study/new-line/mark.png))도 표시되는 것을 볼 수 있다. 

![github-pr]({{site.baseurl}}/img/post/study/new-line/github-pr.png)

<br>

하지만, 프로그램을 돌리거나 코드 상에 이상이 있는 것은 전혀 아니다.
이는 `POSIX` 명세 때문에 경고로 알려주는 것이다.

<br>

### POSIX 표준이란?

---

`POSIX(Portable operating system interface)`는 운영체제 간의 호환성을 유지하기 위해 1980년대에 IEEE 에서 개발한 표준이다.   
소프트웨어가 `POSIX` 표준을 충족한다면 다른 `POSIX` 호환 운영 체제와도 호환되어야 하는 것과 같다.  

`POSIX` 표준은 1988년에 출시된 반면에 IEEE Std 1003.1-2017 은 2017에 출시되었다.  
`POSIX` 표준 개발에는 여러가지 이유가 있는데 그 중에서도 응용프로그램 개발과 이식성을 쉽게 하기 위해 만들어졌기 때문에   
UNIX 뿐만 아니라 다른 Non_UNIX 시스템에서도 사용할 수 있도록 만들었다. 
  
이 표준은 어플리케이션이나 운영체제의 개발을 정의하지 않고 단지 어플리케이션과 운영체제의 계약을 설명한다.  
`POSIX` 표준은 C언어로 작성되었지만 모든 언어와 함께 사용할 수 있다.  
`POSIX` 는 성능 저하 없이 이식성을 달성할 수 있도록 설계 되었고, 개발자의 시간과 비용을 절약할 수 있다.  
이식성을 달성할 수 없는 경우 모든 시스템에 대해서 코드를 작성해야하는데 이는 시간과 비용이 많이 드는 프로세스이다.  

간단히 말해서 `POSIX` 는 전 세계 개발자가 어플리케이션을 `POSIX` 표준 기능과 호환 되도록 만들기 위해 따르는 **일련의 규칙 및 지침이다.**  
이는 어플리케이션이 다른 운영 체제에서 실행될 수 있는 이유다.  
따라서, 파일에 개행이 없는 경우, 경고를 만나게 되는 것이다.  

추가적으로, [IEEE Std 1003.1-2001 표준](https://pubs.opengroup.org/onlinepubs/007904875/basedefs/xbd_chap03.html) 에 따르면,
Text File 은 `<newline>` 이 포함된 하나 이상의 줄로 구성된 문자가 포함된 파일이다.  

> Definitions - 3.392 Text File
> A file that contains characters organized into one or more lines.  
> The lines do not contain NUL characters and none can exceed {LINE_MAX} bytes in length, **including the <newline>.**  
> Although IEEE Std 1003.1-2001 does not distinguish between text files and binary files (see the ISO C standard), 
> many utilities only produce predictable or meaningful output when operating on text files. 
> The standard utilities that have such restrictions always specify "text files" in their STDIN or INPUT FILES sections.

<br>

Line 은 0개 이상의 `<newline>` 이 아닌 시작과 끝에 `<newline>` 을 더한 시퀀스이다.
> Definitions - 3.205 Line : **A sequence of zero or more non- <newline>s plus a terminating <newline>.**

<br><br>

IntelliJ 기준으로 자동으로 마지막 개행을 추가하는 옵션은 default 로 활성화 되어 있다.  
Preference > Editor > General > On Save >Ensure every saved file ends with a line break

![intellij-settings.png]({{site.baseurl}}/img/post/study/new-line/intellij-settings.png)



<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 개인적인 생각 </b> 
    </p>
    🖐 알고 쓰는 것과 모르고 쓰는 것은 차이가 있다고 생각한다! <br>
    🖐 POSIX 명세에 의해서 표준 기능과 호환 되도록 만들기 위해서 따르는 일련의 규칙과 지침을 잘 따라보자!
    <p style='margin-top:1em;' />

</div>

<br><br>

### Reference

---

* [IEEE Std 1003.1-2001 표준](https://pubs.opengroup.org/onlinepubs/007904875/basedefs/xbd_chap03.html)
* [A Guide to POSIX](https://www.baeldung.com/linux/posix)
* [POSIX](https://medium.com/@cloud.devops.enthusiast/posix-59d0ee68b498)


<br><br><br>

