---
layout: post
title: "MySQL Value '0000-00-00' can not be represented as java.sql.Date errors"
description: "MySQL Validation errors 원인과 해결 방법"
excerpt: "MySQL Validation errors 원인과 해결 방법"
category: MySQL
comments: true
---

흔하지 않은 경우이지만, 데이터를 조회할 때 **JAVA – Value '0000-00-00' can not be represented as java.sql.Date** 를 만나게 되었고,
원인과 오류 해결 방법에 대해서 알아보자.

<br>

### 상황
---
MySQL에서 Date 컬럼에 접근 할 때 에러가 발생하였다.
```
JAVA – Value ‘0000-00-00’ can not be represented as java.sql.Date
```

<br>

### 원인
---
MySQL에서 날짜 타입(date, datetime)에 값이 **'0000-00-00'**, **'0000-00-00 00:00:00'** 경우, `Connector/J driver`에서 에러로 판단해서 발생하게 된다.
MySQL의 `Connector/J 3.1` 또는 `Connector/J 5.x JDBC driver`를 사용할 때도 발생한다.


<br>

### 해결방법
---
+ 좋은 방법은 날짜 타입(date, datetime)에 값이 0이 아닌 값을 넣어 주는 것이지만, 임의로 데이터를 바꾸어 주는 것은 좋지 못하다고 생각한다.
+ 따라서, MySQL에 접속 할 때 자동으로 null로 변환해주는 옵션을 추가한다.
+ MySQL Connector/J 3.1 및 최신 버전은 **zeroDateTimeBehavior**의 **connectstring** 속성을 지원한다.
    - convertToNull(날짜 대신 Null을 리턴)
    - round(2001-01-01의 반올림 날짜를 리턴)
+ connectstring 값을 **zeroDateTimeBehavior=convertToNull**로 설정하면 데이터베이스에서 null 값이 반환되고, 출력에서 빈 문자열로 나타난다.
```
jdbc:mysql://{ip}:{port}/{dbname}?zeroDateTimeBehavior=convertToNull
```

<br><br>

> 개인적으로 datebase에 날짜를 insert를 하는 경우에는 특별한 경우가 없는 한, Null 대신에 시스템 날짜를 넣어 주는 것이 더 맞다고 생각한다. <br> 