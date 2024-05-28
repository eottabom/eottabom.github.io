---
layout: post
title: "Spring formatter 와 Check Style 사용하기"
description: "Using Spring formatter and Check Style"
excerpt: "IntelliJ 에서 Spring formatter 와 Check Style 로 일관성 있는 코드 작성하기"
category: Java
comments: true
---

<div id ="notice--info">

    🐱 IntelliJ 에서 Spring formatter 와 Check Style 을 이용해서 일관성 있는 코드 작성하기 <br>
    팀 내 Code Convention 이 있겠지만, Spring formatter 와 Check Style 을 적용하면 <br>
    일관성 있는 코드 작성하기 편해진다.

</div>


### Spring Formatter plugin 설치하기

---

Maven Central 에서 Spring formatter 를 다운 받아서 설치한다. [다운로드](https://repo1.maven.org/maven2/io/spring/javaformat/spring-javaformat-intellij-idea-plugin/0.0.38/)  
IntelliJ > settings > Plugins 에서 다운 받은 Spring formatter 를 추가한다.  

![settings]({{site.baseurl}}/img/post/java/spring-formatter/settings.png) <br><br><br>

설치한 Plugin 은 아래 3가지 조건 중에 하나라도 만족 하는 경우 활성화 (![enbale]({{site.baseurl}}/img/post/java/spring-formatter/enable.png)) 된다.

<div id="notice--note">

    📘 <span style="font-weight: bold!important;"> Note </span> <br> 
    <a href="https://github.com/spring-io/spring-javaformat?tab=readme-ov-file#intellij-idea"> IntelliJ-IDEA 참고 </a>

</div>

#### 1) .springjavaformatconfig 파일이 존재하는 경우

<br>

#### 2) Maven 은 spring-java-format-maven-plugin 이 pom.xml 에 정의된 경우

```{.bash}
<build>
    <plugins>
        <plugin>
            <groupId>io.spring.javaformat</groupId>
            <artifactId>spring-javaformat-maven-plugin></artifactId>
            <version>0.0.41</version>
        </<plugin>
    </plugins>
</build>
```
<br>

#### 3) Gradle 은 io.spring.javaformat 플러그인이 적용 된 경우
```{.bash}
buildscript {
	repositories {
		mavenCentral()
	}
	dependencies {
		classpath("io.spring.javaformatter:spring-javaformat-gradle-plugin:0.0.41")
	}
}

apply plugin: 'io.spring.javaformatter'
```

<br><br>

활성화가 되면 IntelliJ IDEA 우측 하단에 활성화 표시가 생성된다.  
![plugin-enable]({{site.baseurl}}/img/post/java/spring-formatter/plugin-enable.png) <br>


<br>

### CheckStyle Plugin 설치하기

---

#### Step1) IntelliJ > settings > Plugins > Marketplace 에서 `CheckStyle-IDEA` 을 다운 받아서 설치한다.

![check-style]({{site.baseurl}}/img/post/java/spring-formatter/check-style.png) <br>

<br>


#### Step2) Maven Central 에서 `spring-javaformat-checkstyle.jar` , `spring-javaformat-config.jar` 를 다운 받는다.


* <a href="https://repo1.maven.org/maven2/io/spring/javaformat/spring-javaformat-checkstyle/0.0.41"> spring-javaformat-checkstyle.jar </a> 
* <a href="https://repo1.maven.org/maven2/io/spring/javaformat/spring-javaformat-config/0.0.41"> spring-javaformat-config.jar </a>

<br>

#### Step3) Tools > CheckStyle 에서 Thrid-Party Checks 에 `spring-javaformat-checkstyle.jar`, `spring-javaformat-config.jar` 를 추가한다.

![settings-checkstyle-3rdparty]({{site.baseurl}}/img/post/java/spring-formatter/settings-checkstyle-3rdparty.png) <br>

<br>

#### Step4) Tools > CheckStyle 에서 `checkstyle.xml` 를 추가한다.

![config]({{site.baseurl}}/img/post/java/spring-formatter/config.png) <br>


<br>

#### Step5) check style run!

실행을 하게 되면 현재 파일에서 `checkStyle` 이 맞지 않는 부분을 체크 해준다. <br>  

![run]({{site.baseurl}}/img/post/java/spring-formatter/run.png) <br>

<br><br>


💡 **Tips**

___

1) 현재 파일에 대한 Check run 은 `Keymap` (settings - keymap) 으로 설정 가능하다. <br>

![keymap]({{site.baseurl}}/img/post/java/spring-formatter/keymap.png) <br>

<br>


2) 현재 파일에 warning 이나 error 표시를 끌 수 있고, checkStyle scan 파일 범위를 저정할 수 있다. <br>
![second_tips]({{site.baseurl}}/img/post/java/spring-formatter/second_tips.png) <br>

<br><br>

### Reference

---

[Spring-javaformat Git](https://github.com/spring-io/spring-javaformat)


<br><br><br>
