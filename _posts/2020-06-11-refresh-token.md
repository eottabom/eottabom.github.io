---
layout: post
title: "Access Token + Refresh Token Authentication"
description: "Access Token + Refresh Token Authentication"
excerpt: "Access Token과 Refresh Token을 이용한 인증(Authentication)의 흐름에 대해서 알아보자."
category: Study
comments: true
---

**Access Token** 은 데이터를 요청할 때마다, 서버 측에 Token을 보내고 서버측에서 Token 검증을 하고 응답을 받는 구조이다.
그렇기 때문에, **Access Token**을 이용한 인증은 악의적인 사용자에 의해 한 번 탈취당할 경우 유효시간이 끝날 때까지 정보를 모두 뺏길 수 있다는 점에서 보안에 취약하다.
기존의 **Access Token**의 유효시간을 짧게 하고, 새로운 **Access Token**을 발급하기 위한 정보를 가진 `Refresh Token`을 통해 
새로운 **Access Token**을 발급 받으면 **Access Token** 을 탈취당했을 때, 상대적으로 피해를 줄일 수 있다.
따라서, **Access Token** 과 `Refresh Token`을 함께 사용하여 인증을 하게 된다면, **Access Token** 만 사용했을 때보다 안전하다고 할 수 있다.

<br>

### 인증 절차
---

![process]({{site.baseurl}}/img/post/study/refresh-token/process.png)

1. 사용자가 로그인한다.
2. 사용자 확인 후(database), 사용자 고유 ID 부여하고 payload에 넣고, 유효기간을 설정해서 생성할 때, Access Token과 Refresh Token을 함께 생성한다.
3. Refresh Token 정보를 database 에 저장을 한다.
4. 사용자는 Refresh Token을 안전한 저장소에 저장한 후에, Access Token 을 Header에 실어 데이터를 요청한다.
5. 서버에서 Token을 검증한다.
6. Access Token 이 만료가 된 상태가 된다.
7. 사용자는 Access Token을 Header에 실어 데이터를 요청한다.
8. 서버는 Access Token이 만료가 된 것을 확인한다.
9. Access Token이 만료가 되었다는 신호를 사용자에게 알려준다.
10. 다시 Access Token과 Refresh Token 재발급을 요청한다.
11. Refresh Token을 확인하여 정보가 일치한지 확인하고, 새로운 Access Token 을 생성한다.
12. 새로운 Access Token을 사용자에게 보내준다.


<br>

### 장점
---

+ Access Token 만 사용하였을 때보다 안전하다. 

<br>

### 단점
---

+ Token 검증하는 프로세스가 길기 때문에 구현이 복잡하다.
+ Access Token이 만료될 때 마다 새로운 Token을 발급하는 과정에서 http 요청 횟수가 많아 서버의 자원이 낭비 될 수 있다.


<br>
<br>
