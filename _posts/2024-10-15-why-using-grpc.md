---
layout: post
title: "gRPC 를 도입하는 이유에 대해서 알아보자 (feat. HTTP 1.0 vs HTTP 1.1 vs HTTP 2.0)"
description: "About gRPC"
excerpt: "HTTP 1.0, HTTP 1.1 의 문제와 gRPC 가 MSA 구조에 도입되면 어떤 이점이 있는지 알아보자."
category: gRPC
comments: true
---

<div id ="notice--info">

    <p style='margin-top:1em;'>
        <b>🐱 Meow, meow </b>
    </p>
    gRPC 는 Google 이 개발한 모든 환경에서 실행할 수 있는 오픈 소스 고성능 RPC 프레임워크이다. <br>
    Monolithic → MSA 로 가면서, 여러개의 서비스로 분리가 되어졌는데, <br>
    그렇다보니, 하나의 응답을 처리하기 위해서 빈번하게 네트워크 통신이 발생하게 되어 Latency 가 증가할 수가 있게 되었다. <br>
    MSA 에서 gRPC 를 도입하면 어떤 이점이 있는지? 그리고 어떤 부분을 해소할 수 있는지 알아보자. <br>
    더불어서 HTTP 1.0 vs HTTP 1.1 vs HTTP 2.0 에 대해서도 알아보자.
    <p style='margin-top:1em;'/>  

</div>

## Monolithic → MSA 전환시 Network Latency

---

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/monolithic.png" alt="monolithic" />
</div>

Monolithic 아키텍처에서는 하나의 Machine 에서 동일한 프로세스 내에서 실행되고, 각 서비스 간의 통신은 **메서드 호출** 로 이루어지므로 별도의 **네트워크 통신이 필요 없다.**
또한, 하나의 어플리케이션의 모든 서비스와 모듈이 동일한 메모리 공간에서 실행된다.


<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/msa-network-latency.png" alt="msa-network-latency" />
</div>

하지만, MSA 구조에서는 동일 장비가 아닐 수도 있는 여러 장비에 각각의 프로세스로 분리되다보니,  
보통 **REST 통신**을 통해 메시지를 주고 받는 구조가 되는데(서버간 통신이 발생한다.), 이 때, <span style="color:red"><b>잠재적인 latency</b></span> 가 존재한다.  
다른 Server 나 Frontend 에서 요청을 할 때 MSA 구간별 통신이 필요하다면, <span style="color:red"><b>응답속도가 저하된다는 단점</b></span> 이 존재하게 된다.  

<br>

## Q. 어떤 요인으로 인해 응답 속도 저하가 발생할까?

---

A. HTTP 는 기본적으로 TCP 위에서 동작하기 때문에,  
데이터 송수신에 앞서서 `3-way handshake` 과정을 거치고, `4-way handshake` 과정을 통해 종료가 되는데,  
MSA 구조와 같이 서버간 통신이 빈번하게 일어나서 데이터를 전송하고 응답을 받는 상황이면,  
이로 인해서 <span style="color:blue"><b>매번 연결을 맺고 종료하는 과정</b></span>이 발생해서 <span style="color:red"><b>비효율</b></span> 이 발생한다.

<br>

### Tip) TCP 연결 / 종료 과정

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/tcp-process.png" alt="tcp-process" />
</div>

### TCP Connection Process (3-way handshake)

<br>

#### 1) SYN
* Client 가 서버에 연결 요청을 보낸다.
* Client 는 `SYN` 플래그가 설정된 `TCP` 패킷을 보내고, 이 패킷엔 Client 초기 순서 번호`(Initial Sequence Number, ISN)` 이 포함된다.

<div id="notice--note">

    📘 Client → Server : SYN (ISN=1000)

</div>

<br>

#### 2) SYN + ACK
* Server 는 Client 요청을 수신하고, Client 의 `SYN` 패킷을 수락하고 Client 에 응답을 한다.
* 응답 패킷에는 `SYN` 과 `ACK` 플래그가 설정된다.
* `ACK` 플래그는 Client 의 `SYN` 을 확인했다는 신호
* Server 는 자신의 `ISN` 을 Client 에 보낸다.

<div id="notice--note">

    📘 Server → Client : SYN-ACK (ISN=2000, ACK=1001), ACK = Client ISN + 1 

</div>

<br>

#### 3) ACK
* Client 는 서버의 `SYN-ACK` 패킷을 받고, 이를 확인했다는 의미로 `ACK` 플래그가 설정된 패킷을 다시 Server 로 보낸다.
* Client 는 서버의 ISN 에 1을 더한 값을 `ACK` 값으로 설정하여 서버의 응답을 확인한다.

<div id="notice--note">

    📘 Client → Server : ACK (ACK=2001) 

</div>

<br>

### TCP Connection Termination Process (3-way handshake)

<br>

#### 1) FIN (Finish)
* Client 또는 Server 중 하나가 연결을 종료하고자 할 때, `FIN` 플래그가 설정된 TCP 패킷을 보낸다.

<div id="notice--note">

    📘 Client → Server : FIN 

</div>

<br>

#### 2) ACK
* Server 는 Client 의 `FIN` 패킷을 받고, 이를 확인했다는 의미로 `ACK` 플래그가 설정된 패킷을 보낸다.

<div id="notice--note">

    📘 Server → Client : ACK 

</div>

<div id="notice--warning">

    🏷️ Server 는 아직 데이터 전송이 끝나지 않았을 수도 있고, 더 전송할 데이터가 있을 수도 있다.

</div>

<br>

#### 3) FIN
* Server 가 `FIN` 플래그가 설정된 패킷을 Client 에게 보낸다.
* Server 는 연결을 종료할 준비가 됐다는 것을 알린다.

<div id="notice--note">

    📘 Server → Client : FIN 

</div>

<br>

#### 4) ACK
* Client 는 서버의 `FIN` 패킷을 받고, 확인했다는 의미로 `ACK` 플래그가 설정된 패킷을 다시 Server 에게 보낸다.
* TCP 연결은 완전히 종료된다.

<div id="notice--note">

    📘 Client → Server : ACK 

</div>

`HTTP 1.0` 은 요청과 응답을 하기 앞서서 매번 Connection 을 맺고 끊어야 해서 연결 요청과 해제 비용이 많이 들고, 이로 인해서 <span style="color:red"><b>Network Latency</b></span> 가 발생하게 된다.

<br>

## HTTP 1.1

---

`HTTP 1.0` 의 각 요청마다 새로운 TCP 연결을 맺고, 요청을 처리하고 연결을 끊는 방식이다보니,  
`3-way handshake` 와 `4-way handshake` 하는 과정에서 <span style="color:red"><b>오버헤드가 발생해서 비효율적이다.</b></span>  
그리고, 각 요청에 대한 응답을 받은 후에 다음 요청을 보낼 수 있어서 요청/응답이 순차적/직렬적으로 처리되어 <span style="color:red"><b>Latency</b></span> 가 발생했다.  

`HTTP 1.1` 에서는 이런 문제를 해결하기 위해서 `Persistent Connection` 과 `Pipelining` 을 지원한다.  

### 1) Persistent Connection (지속 연결)

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/persistent-connection.png" alt="persistent-connection" />
</div>

* Client ↔ Server 간 연결을 한 번 맺으면 여러 요청을 그 연결에서 처리 할 수 있게 한다.
* `Connection: keep-alive` 헤더가 설정되어, Client 나 Server 가 명시적으로 연결을 끊지 않는 한 연결이 유지된다.

### 2) Pipelining

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/pipeliining.png" alt="pipeliining" />
</div>

* `Pipelining` 은 Client 가 Server 에 여러 요청을 <span style="color:blue"><b>연속적</b></span> 으로 보내고 순서대로 처리하는 방식이다.
  * 단, 응답 순서가 맞지 않을 경우 지연이 발생할 수 있다.
* `Pipelining` 이 적용되면 <span style="color:blue"><b> 하나의 Connection 으로 다수의 요청과 응답을 처리할 수 있게 해서 Latency 를 줄일 수 있다.</b></span>

<div id="notice--warning">

    🏷️ 하지만, 완전한 멀티플렉싱이 아닌 응답 처리를 미루는 방식이여서 각 응답의 처리는 순차적으로 처리되며, 결국 후순위 응답은 지연될 수 밖에 없다.

</div>
    
<br>

## HTTP 1.1 의 문제점

---

`HTTP 1.1` 은 `Persistent Connection` 과 `Pipelining` 같은 기능을 통해서 `HTTP 1.0` 의 단점을 개선했지만,  
여전히 여러 **문제점** 이 남아 있다.

### 1) Head-of-Line Blocking (HOLB)

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/head-of-line-blocking.png" alt="head-of-line-blocking" />
</div>

* Client 가 세 개의 요청 (Request1, Request2, Request3) 을 동시에 보내지만, Server 는 순차적으로 처리한다.
* 첫 번째 요청 (Process1) 이 처리되는 동안 다른 요청들 (Process2, Process3) 은 차단(Blocked) 되어 대기 한다.
<br>

<div id="notice--note">

    <p style='margin-top:1em;'> 
      <b> 📘 Note - Head-of-Line Blocking 가 발생하는 이유 </b> 
    </p>
    ✏️ 순차적 처리 <br>
    - HTTP 1.1 에서는 하나의 연결 위에서 요청이 순서대로 처리되어야 한다. <br>
    ✏️ 직렬 응답 <br>
    - 서버는 요청 받은 순서대로 응답해야하므로, 하나의 요청이 지연되면 다음 요청도 자연스럽게 지연된다. <br>
    ✏️ 리소스 다운로드 <br>
    - 브라우저가 여러 리소스를 요청할 때, 큰 파일(이미지, 동영상) 이 먼저 다운로드 되면, 더 중요한 작은 파일들(css, js)이 대기한다. 
    <p style='margin-top:1em;' />

</div>

<br>

### 2) Connection 관리의 비효율성

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/high-server-load.png" alt="high-server-load" />
</div>

* 여러 Client 가 각각 Server 와 Persistent Connection 을 유지하게 되는 경우 서버는 여러 연결을 동시에 관리해야해서 서버에 부하가 갈 수 있다.
<br>
 
### 3) Header Overhead

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/header-overhead.png" alt="header-overhead" />
</div>

* Client 가 Server 에 여러 요청을 보낼 때, 각 요청마다 동일한 Header 를 반복해서 전송하게 된다.
* 중복된 Header 정보는 불필요한 대역폭을 차지하게 되어서 효율성이 떨어지게 된다.

<br>

## HTTP 2.0

---

### 1) Multiplexing

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/multiplexing.png" alt="multiplexing" />
</div>

* `HTTP 2` 는 요청과 응답을 **병렬로 처리** 할 수 있는 **멀티 플렉싱** 이다.
  * 여러 TCP 연결을 설정할 필요가 없어서 네트워크 오버헤드가 감소된다.
* Client 가 여러 요청을 동시에 보내도, 각 요청이 독립적으로 처리되어서 **Head-of-Line Blocking** 문제를 해결한다.
* 각 스트림에 **우선 순위** 를 할당하여 중요한 리소스 먼저 전송할 수 있다.

<div id="notice--note">

    <p style='margin-top:1em;'> 
      <b> 📘 Note </b> 
    </p>
    ✏️ Head-of-Line Blocking 이 해결 되었다는 것은, Application Layer 에서 Head-of-Line Blocking 이 해결되었다는 것이다. <br>
    ✏️ HTTP/2 도 결국엔 TCP 위에서 동작하기 때문에 Transport Layer 에서의 Head-of-Line Blocking 이 존재한다. <br>
    ➡️ TCP 는 순서 보장을 위한 프로토콜이라 중간에 패킷 손실되면, 손실된 패킷을 다시 전송받을 때까지 나머지 패킷의 처리가 지연 <br>
    ➡️ 하나의 TCP 연결에서 여러 요청이 stream 으로 요청이 된다고 해도 중간에 패킷 손실되면, 지연이 발생한다는 의미 <br>
    ✏️ Head-of-Line Blocking 문제는 UDP 기반의 QUIC 프로토콜(HTTP/3) 에서 해결가능하다. 
    <p style='margin-top:1em;' />

</div>

### 2) Header 압축 (HPACK)

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/HPACK.png" alt="HPACK" />
</div>

* `HPACK` 이라는 **헤더 압축** 방식을 통해 반복적으로 전송되는 헤더 정보를 효율적으로 관리하며, **데이터 전송량** 을 줄이고, **대역폭 사용** 을 최적화한다.
<br>

<div id="notice--note">

    <p style='margin-top:1em;'> 
      <b> 📘 Note </b> 
    </p>
    ✏️ 정적 테이블 <br>
    - 자주 사용되는 헤더 필드를 미리 정의하여 참조 <br>
    ✏️ 동적 테이블 <br>
    - 이전에 전송된 헤더 필드를 저장하고 참조 <br>
    ✏️ 허프만 인코딩 <br>
    - 헤더 값을 효율적으로 인코딩하여 크기를 줄임 <br>
    <p style='margin-top:1em;' />

</div>

### 3) 서버 푸시 (Server Push)

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/server-push.png" alt="server-push" />
</div>

* Client 가 요청하지 않은 리소스도 Server 가 미리 전송할 수 있게 하여 페이지 로딩 속도를 개선한다.
* 여러 요청/응답 사이클을 줄여 네트워크 사용을 최적화 한다.
* **우선 순위** 지정하여 중요한 리소스를 먼저 푸시 하여 페이지 렌더링 속도를 향상 시킬 수 있다.

<div id="notice--warning">

    🏷️ 과도한 서버 푸시는 불필요한 데이터 전송이 발생할 수 있다.

</div>

<br>

## HTTP 1.1 과 HTTP 2 의 차이점

---

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/http_1_1-vs2_0.png" alt="http_1_1-vs2_0" />
</div>

|특징|HTTP 1.1|HTTP 2.x|
|--|--|--|
|Connection|Persistent Connection (지속 연결) | Persistent Connection + Multiplexing|
|Request Handling|요청이 순차적으로 처리됨|요청이 동시에 처리 가능 (Multiplexing)|
|Header Compression|없음|HPACK 으로 헤더 압축|
|Protocol|텍스트 기반|Binary 기반|
|Prioritization|없음|스트림 우선 순위 설정 가능|
|Server Push|없음|있음|


<br>

## REST API 의 단점

---

MSA 구조에서 서버 간 통신을 `HTTP/2` 로만 변경하면 어느정도 성능을 향상 시킬 수 있지만,  
`REST` 통신을 하게 되면, `JSON` 으로 인한 문제가 성능에 영향을 미칠 수 있다.

### 1) Serialization / Deserialization

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/json-payload.png" alt="json-payload" />
</div>

* `JSON` 은 **텍스트 기반의 데이터 포맷** 으로, 네트워크 효율성이 떨어진다.
* 직렬화 / 역직렬화 과정에서 CPU 사용량이 많이 필요하여 MSA 간의 빈번한 데이터 교환이 있다면, 성능 저하가 될 수 있다.

<br>

### 2) 타입 제약
* `JSON` 은 복잡한 데이터 구조나 날짜, 시간, 이진 데이터를 처리할 때 추가적인 파싱이나, 인코딩이 필요하다.

<br>

### 3) 데이터 중복
* 필드를 key-value 쌍으로 표현하여 여러 개의 필드를 가진 객체에서 필드 이름이 반복되면 **데이트 크기가 증가**한다.

<br>

## Q. gRPC 에서는 REST 의 단점을 어떻게 해결 했을까?

---

A. gRPC 는 `protobuf(Protocol Buffers)` 로 **JSON 의 성능 문제** 를 해결했다.  

<div id="notice--note">

    <p style='margin-top:1em;'> 
      <b> 📘 Note - protobuf </b> 
    </p>
    ✏️ Google 이 개발한 <b> 언어 중립적 이고 플랫폼 중립적 </b> 인 데이터 직렬화 포맷이다. <br>
    ✏️ 다양한 프로그래밍 언어에서 동일한 스키마(proto 파일) 을 통해 데이터를 직렬화하고 역직렬화한다. <br>
    ✏️ gRPC 는 이 프로토콜을 활용해서 서버와 클리이언트 간의 효율적인 데이터 통신을 지원한다. <br>
    <p style='margin-top:1em;' />

</div>

### 1) Serialization / Deserialization

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/json_vs_protobuf.png" alt="json_vs_protobuf" />
</div>

* `protobuf` 는 바이너리 형식으로 인코딩 되어 더 작은 크기를 할당한다.
* 바이너리 형식은 파싱 속도가 더 빠르고, CPU 사용량도 적다.

<br><br>

### 2) 타입 제약

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/json_vs_protobuf2.png" alt="json_vs_protobuf2" />
</div>

* `protobuf` 는 각 필드의 타입을 명확히 지정한다.
* `JSON` 에서는 `age` 가 문자열로 되지만, `protobuf` 에서는 정수형으로 정의되어 타입 불일치를 방지한다.
* `Address` 와 같은 중첩된 구조를 명확하게 정의할 수 있다.

<br>

### 3) 데이터 중복

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/json_vs_protobuf3.png" alt="json_vs_protobuf3" />
</div>

* `JSON` 에서는 각 객체마다 필드 이름이 반복되지만, `protobuf` 는 스키마에 한 번만 정의된다.

<br>

### JSON vs Protobuf 벤치마크

간단하게 http 기반 벤치마크를 돌려보면, `protobuf`(protobufBenchmark) 가 `JSON`(jsonBenchmark) 에 비해서 초당 처리할 수 있는 수가 많은 것을 알 수 있다.

| Benchmark                               | Mode | Cnt | Score    | Error    | Units |
|-----------------------------------------|------|-----|----------|----------|-------|
| SerializationBenchmark.jsonBenchmark    | thrpt | 10  | 3550.345 | ± 46.399 | ops/s |
| SerializationBenchmark.protobufBenchmark | thrpt | 10  | 4203.831 | ± 97.497 | ops/s |


<div id="notice--warning">

    🏷️ <a href="https://github.com/eottabom/lego-piece/tree/main/benchmark">벤치 마크 결과 보기 (클릭)</a> <br>
    🏷️ <a href="https://github.com/eottabom/lego-piece/tree/main/benchmark/src/main/java/lego/benchmark/serialization">벤치 마크 코드 보러가기 (클릭)</a>

</div>

<br>


## Tips) gRPC 서버와 클라이언트 동작 원리

---

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/grpc/why/grpc.png" alt="grpc" />
</div>

출처 : https://grpc.io/docs/what-is-grpc/introduction/

### gRPC 서버
* Client 가 호출할 `RPC(Remote Procedure Call)` 메서드를 구현
* 서버는 `Protocol Buffers` 로 정의된 **서비스 인터페이스(proto 파일)** 에 따라 서버측 비즈니스 로직을 구현
* gRPC 서버는 클라이언트로부터 호출될 메서드를 구현체를 제공

<br>

### gRPC 클라이언트
* 서버와 통신하기 위한 `stub` 이라는 객체 사용
* `stub` 은 클라이언트가 마치 서버에 직접 메서드를 호출하는 것처럼 RPC 메서드를 호출하는 인터페이스 제공
* `stub` 객체가 RPC 호출을 네트워크 요청으로 변환하여 gRPC 서버로 전송
* 서버는 요청을 처리한 후 응답을 클라이언트로 다시 반환

<br>

#### 1) Protocol buffers 정의
* `.proto` 파일에 gRPC 서비스를 정의한다. (`GetPerson`)

<pre class="prettyprint lang-java">
syntax = "proto3";

option java_package = "lego.example";
option java_outer_classname = "PersonProto";

service PersonService {
  rpc GetPerson(PersonRequest) returns (PersonResponse);
}

message PersonRequest {
  string name = 1;
}

message PersonResponse {
  Person person = 1;
}

message Person {
  string name = 1;
  int32 age = 2;
  string phoneNumber = 3;
  Address address = 4;
}

message Address {
  string city = 1;
  string zipCode = 2;
}
</pre>

<br>

#### 2) gRPC 서버 구현
* 서버는 `.proto` 파일에 정의한 서비스를 메서드를 실제로 구현하는 역할을 한다.
* `PersonServiceImpl` 은 `.proto` 파일에 정의된 `PersonService` 의 메서드를 실제로 구현하는 클래스

<pre class="prettyprint lang-java">
public final class PersonServer {

	private static final Logger logger = LoggerFactory.getLogger(PersonServer.class);

	private PersonServer() {

	}

	public static void main(String[] args) throws IOException, InterruptedException {
		Server server = ServerBuilder.forPort(50051).addService(new PersonServiceImpl()).build();

		logger.info("gRPC server start");
		server.start();

		server.awaitTermination();
	}

	static class PersonServiceImpl extends PersonServiceGrpc.PersonServiceImplBase {

		@Override
		public void getPerson(PersonProto.PersonRequest request,
				StreamObserver&#60;PersonProto.PersonResponse&#62; responseObserver) {

			String name = request.getName();
			PersonProto.PersonResponse response;

			PersonProto.Address address = PersonProto.Address.newBuilder().setCity("Seoul").setZipCode("1234").build();

			PersonProto.Person person = PersonProto.Person.newBuilder()
				.setName(name)
				.setAge(35)
				.setPhoneNumber("010-1234-1234")
				.setAddress(address)
				.build();

			response = PersonProto.PersonResponse.newBuilder().setPerson(person).build();

			responseObserver.onNext(response);
			responseObserver.onCompleted();
		}
	}
}
</pre>

<br>

#### 3) gRPC 클라이언트 구현
* `ManagedChannelBuilder` 로 서버와 통신할 채널 생성
* `stub` 생성 : `PersonServiceGrpc.PersonServiceBlockingStub stub = PersonServiceGrpc.newBlockingStub(channel)`
* `stub.getPerson(request)` 메서드를 호출하면 클라이언트는 gRPC 서버에 `GetPerson` 메서드를 원격 호출하게 된다.

<pre class="prettyprint lang-java">
public final class PersonClient {

	private static final Logger logger = LoggerFactory.getLogger(PersonClient.class);

	private PersonClient() {

	}

	public static void main(String[] args) {
		// gRPC 채널 생성
		ManagedChannel channel = ManagedChannelBuilder.forAddress("localhost", 50051)
			.usePlaintext()
			.build();

		// gRPC 서비스를 호출할 stub 생성
		PersonServiceGrpc.PersonServiceBlockingStub stub = PersonServiceGrpc.newBlockingStub(channel);

		PersonProto.PersonRequest request = PersonProto.PersonRequest.newBuilder()
			.setName("eottabom")
			.build();

		// 서버에 RPC 호출을 보내고 응답을 받음
		PersonProto.PersonResponse response = stub.getPerson(request);

		logger.info("Server response : \n {}", response.toString());

		// 채널 종료
		channel.shutdown();
	}

}
</pre>

<br>

<div id="notice--warning">

    🏷️ <a href="https://github.com/eottabom/lego-piece/tree/main/example/src/main/java/lego/example/grpc">예제 코드 보러가기 (클릭)</a> <br>

</div>


<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 결론 </b> 
    </p>
    🖐 MSA 구조에서는 빈번한 네트워크 통신이 발생하여 Latency 가 발생할 수 있다. <br>
    🖐 HTTP/2 는 Multiplexing 와 Header Compression 으로 HTTP 1.x 의 단점을 극복하여 지연 문제를 개선할 수 있다. <br>
    🖐 gRPC 는 기본적으로 HTTP/2 기반이여서 HTTP/2 의 장점이 그대로 있다. <br>
    ➡️ Multiplexing, Server Push, Header 압축.. <br>
    🖐 MSA 구조에서 REST 통신을 하게 되면 JSON Payload 로 인해서 데이트 크기, 파싱 성능 등의 문제가 발생할 수 있는데, gRPC 가 protobuf 를 사용하여 데이터 전송을 더 효율적으로 할 수 있다. <br>
    ➡️ 더 작은 크기의 데이터를 전송하고, 직렬화/역직렬화의 비용/시간을 줄일 수 있다. <br>
    🖐 protobuf 를 통해 데이터 구조와 타입이 명확히 정의되어 있어서 타입 불일치나 파싱 오류를 방지할 수 있다. <br>
    🖐 언어와 플랫폼이 독립적이어서 다양한 언어/플랫폼에서 동일한 proto 파일을 이용해서 구현이 가능하다.
    
    <p style='margin-top:1em;' />

</div>

<br><br>


## Reference

---
* [1. gRPC 개요](https://cla9.tistory.com/175)
* [The basics of gRPC](https://medium.com/@josemiguelmelo/the-basics-of-grpc-b017bbedb303)
* [What is gRPC?](https://blog.postman.com/what-is-grpc/)
* [What is gRPC? Protocol Buffers, Streaming, and Architecture Explained](https://www.freecodecamp.org/news/what-is-grpc-protocol-buffers-stream-architecture/)


<br><br>
