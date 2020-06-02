---
layout: post
title: "JWT, JSON Web Token"
description: "About JWT, JSON Web Token"
excerpt: "토큰 기반 인증 방식인 JWT에 대해서 알아보자"
category: Study
comments: true
---

대부분의 웹 서비스에서 토큰 기반 인증을 많이 사용하고 있다. 과거에 토큰 기반의 인증이 없었을 때에는 서버 세션을 이용해서 인증을 했었다.
하지만, **서버 세션 인증**은 세션 데이터를 서버 메모리에 저장하여 로그인 유저가 많으면 **메모리 부하**가 많이 생기게 된다.
또한, 확장 시에 모든 서버가 접근 할 수 있도록 별도의 **중앙 세션 관리 시스템**이 필요하여 시스템 확장이 어렵다.
이러한 문제를 해결하기 위하여 등장한 토큰 기반의 인증 방법 중 `JSON Web Token` 에 대해서 알아보자.
 
`JSON Web Token`은 정보를 안전하게 전송하기 위해 정의된 공개된 표준 **[(RFC7519)](https://tools.ietf.org/html/rfc7519)** 이다.
또한, 필요한 정보를 토큰 body에 저장해 클라이언트가 가지고 있고 **증명서**처럼 사용하고, 사용자는 **Access Token(JWT Token)** 을 헤더에 실어 서버로 보낸다. 


<br>

### 기본 구성
---

기본 구성은 [JWT 공식 사이트](https://jwt.io) 에서 확인할 수 있고, 아래는 해당 사이트에서 캡쳐한 내용이다.

<br> 

![base-structure]({{site.baseurl}}/img/post/study/jwt/base-structure.png)

<br>


`JWT`는 Header.Payload.Signature 로 구성 되어 있고, `.`을 구분자로 사용한다.

+ Header : 3가지 정보를 암호화할 방식(alg), 타입(type) 이 들어간다.
+ Payload : 서버에서 보낼 데이터인 클라이언트에 대한 Meta data가 들어가고, 일반적으로 사용자의 ID, 유효기간이 들어간다.
+ Signature : Base64 방식으로 인코딩한 Header, Payload 그리고 **SECRET KEY** 가 들어간다.

<pre>
    Header(xxxx).Payload(yyyy).Signature(zzzz)
</pre>

<br>

<br>

**Header**, **Payload** 는 인코딩 될 뿐 SECRET KEY가 들어가지 않아, 암호화 되지 않는다.
Payload에 패스워드 등 중요한 정보가 들어가면 쉽게 노출 될 수 있다.

<br>

### 인증 절차
---

![process]({{site.baseurl}}/img/post/study/jwt/process.png)

1. 사용자가 로그인한다.
2. 사용자 확인 후(database), 사용자 고유 ID 부여하고 Payload에 넣고, 유효기간을 설정하여 생성한다. 
3. Secret key를 이용해 Access Token을 발급한다.
4. Access Token을 받아 인증이 필요한 요청마다 Token을 Header에 실어서 서버로 보낸다.
5. 서버에서 해당 Token을 복호화 하여 조작 여부, 유효기간을 확인한다.
6. 검증 완료시 Payload를 디코딩하여 요청에 대한 응답을 한다.

 
<br>

### 장점
---

+ Stateless
    - JWT 발급 후 검증만 하면 되기 때문에 추가 저장소가 필요가 없다.
    - 토큰을 Client-side 에 저장하기 때문에 완전히 stateless한 서버를 만들 수 있다.

+ Scalability
    - 서버를 확장하기 매우 적합한 환경을 제공한다.
    - Microservice Architechture 에서 인증 서버를 통해서 인증을 하게 되면 다른 서비스를 이용할 수 있다.

+ Extensibility
    - 토큰 기반의 다른 인증 시스템 접근이 가능하다.
    - 토큰에 선택적인 권한만 부여하여 발급을 받을 수 있다. 
    - ex) Facebook, LinkedIn, GitHub, Google 등의 계정으로 로그인 가능하다.

+ CORS
    - 서버측 어플리케이션의 응답 부분에 다음 헤더만 포함시켜주면, 여러 디바이스를 호환 시켜줄 수 있다. 

<br>

> Access-Control-Allow-Origin: *

<br>

### 단점
---

+ 한 번 발급된 JWT는 유효기간이 끝날 때까지 사용 가능하다.
    - 악의적인 사용자가 침입했을 때 유효기간이 끝날 때까지 정보를 탈탈 털어갈 수 있다.

<br>

> Refresh Token 으로 상대적으로 피해를 줄일 수 있다.

<br> 

+ Payload가 제한적이다.
    - Payload 는 따로 암호화하지 않기 때문에, 디코딩하면 정보를 쉽게 확인 할 수 있어서 중요 데이터를 넣을 수 없다.

+ JWT 길이 
    - JWT 길이가 길어질 수록 인증에 필요한 요청이 많아지고 이는 서버 자원 낭비로 이어질 수 있다. 

<br>

<br>
