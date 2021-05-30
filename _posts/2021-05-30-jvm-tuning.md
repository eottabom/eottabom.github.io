---
layout: post
title: "JVM Tuning"
description: "JVM Tuning"
excerpt: "JVM Memory 영역, Life Cycle, Non-Standard Options 에 대해서 알아보자"
category: Study
comments: true
---

`JVM Memory 영역`, `JVM Life Cycle`, `OOME(Out Of Memory Error) 가 발생하는 Case` / JVM 메모리 할당과 Java Stack/Heap Space 와 메모리 할당 정리
JVM 표준 옵션인 Standard Options 와 JVM 버전와 OS 종류에 따라 존재 여부가 결정되는 Non-Standard Options 중, `Non-Standard Options` 에 대해서 정리

<br>

### JVM Memory 영역
---
![jvm-memory]({{site.baseurl}}/img/post/study/jvm/jvm-memory.png) <br>
 
1. Heap Memory <br>
JVM 이 객체 또는 동적 데이터를 저장하는 곳 / Garbage Collection 이 일어 나는 곳
2. Thread Stack <br>
Stack Memory 영역이며, 프로세스의 쓰레드 당 하나의 스택 메모리가 있고, 메소드의 결과 / 반환 값을 저장하거나 지역변수를 저장하는 용도
3. MetaSpace <br>
클래스 로더에서 클래스 정의를 저장하는데 사용 / 이 공간이 계속 커지면 OS는 여기에 저장된 데이터를 가상 메모리로 이동하여
애플리케이션 속도를 저하시킬 수 있음
4. Code Cache <br>
컴파일러가 데이터를 저장하는 영역
5. Sharded Library
애플이케이션에서 사용할 공유 라이브러리가 기계어로 변환된 채 저장된 영역

<br>

### JVM Life Cycle
---
![jvm-life-cycle]({{site.baseurl}}/img/post/study/jvm/jvm-life-cycle.png) 

<br>

#### Minor Garbage Collection
---
- New 영역에서 일어나는 Garbage Collection 
- Eden 영역에 객체가 가득 차게 되면 첫번째 Garbage Collection 발생 
- Survivor 1 영역에 값 복사 
- Survivor 2 영역을 제외한 나머지 영역의 객체들 삭제 
- Eden 영역과 Survivor 1 영역의 메모리가 기준치 이상일 경우, Eden 영역에 생성된 객체와 Survivor 1 영역에 있는 객체 중 참조되고 있는 객체가 있는 검사 
- 참조되고 있는 객체를 Survivor 2 영역에 복사 
- Survivor 2 영역을 제외한 영역의 객체들을 삭제 
- 일정 시간 이상 참조 되고 있는 객체들을 Old 영역으로 이동

<br>

#### Major Garbage Collection
---
- Old 영역에 있는 모든 객체들을 검사
- 참조되지 않은 객체들을 한번에 삭제  
Minor Garbage Collection 에 비해 시간이 오래 걸리고 실행 중 프로세스가 정지

<br>

### OOME(OutOfMemoryError) 발생하는 Cases
---

<br>

#### 1. 'java.lang.OutOfMemoryError': Java heap space

- Java Heap 공간에 새로운 개체를 생성할 수 없을 때 발생
- 지정한 Heap 크키가 Application 에 충분하지 않은 경우 발생 <br>
→ Heap Size 조정

<br>

#### 2. 'java.lang.OutOfMemoryError': Metaspace

- Java class metadata 는 원시 메모리에 할당되는데, class metadata 가 할당될 메타공간이 모두 소모 되면 발생 <br> 
→ MaxMetaSpaceSize 값을 늘려 설정, Heap Size를 줄이면 더 많은 공간을 확보 할 수 있음(Heap과 동일한 주소 공간에 할당 됨)

<br>

#### 3. 'java.lang.OutOfMemoryError': requested <size> bytes for <reason>. Out of swap space?

- JVM은 Heap 외에도 자체 구동을 위해 native heap 사용하는데, native heap 이 부족할 때 발생(Heap Size 가 너무 클 경우)
- heap 영역과 perm 영역을 과하게 설정한 경우, native, stack 영역이 적은 공간으로 설정되어 두 영역의 공간 부족이 나는 경우 <br>
→ 메모리가 부족해서 swap 을 쓰는 경우 성능이 급격히 저하되므로, 원인을 찾아 제거

<br>

#### 4. 'java.lang.OutOfMemoryError': GC Overhead limit exceeded

- Garbage Collectior 실행과정에서 Java 프로그램이 느려지는 경우 발생
- Garbage 수집 후 Java Process가 Java Collection 을 수행하는데 걸리는 시간의 약 98% 이상 소비하고 Heap의 2% 미만이 복구 된 상태에서
지금까지 수행하는 과정에서 Garbage Collection 중 java.lang.OutOfMemoryError가 5번 이상 생성되는 경우 발생
- 데이터를 할당하는데 필요한 공간이 Heap에 없는 경우 발생 <br>
→ Heap Size를 늘린다.

> 참고) -XX:-UseGCOverheadLimit 로 초과 오버헤드 GC 제한 명령을 해제할 수 있음

<br>

### Non-Standard Options (일부)
---

| Section | Option | Description |
|--|--|--|
| Extra Options | Xss | 쓰레드 스택 크기(바이트)를 설정. 기본 값은 플랫폼에 따라 다름, (각 Thread에 할당되는 Stack Size 설정) <br> Default: Linux/x64(64bit): 1024KB / macOS(64bit): 1024KB / Oracle Solaris/x64(64bit): 1024KB, / Windows: 기본 값은 가상 메모리에 따라 다름|
| |  Xms(-XX:InitialHeap Size) | 초기 Heap Size 설정 <br> Default: JVM을 server class로 실행시 초기 heap size는 메모리의 1/64 |
| | Xmx(-XX:MaxHeapSize) | 최대 Heap Size 설정 <br> Default: JVM을 server class로 실행시 최대 heap size는 메모리의 1/4 |
| Advanced Runtime Options | XX:MaxDirectMemorySize | java.nio 패키지의 최대 총 크기(바이트)를 직접 버퍼 할당으로 설정. <br> JVM이 NIO Direct-buffer 할당의 크기를 자동적으로 선택함을 의미 <br> (default:0)|
| | XX:ActiveProcessorCount | Garbage Collection 과 ForkJoinPool 과 같은 다양한 작업에 사용할 쓰레드 풀의 크기를 계산하는데 VM이 사용할 CPU 수를 재정의 <br> 이 플래그는 도커 컨테이너에서 여러 Java 프로세스를 실행할 때 CPU 리소스를 분할 하는데 유용|
| Advanced Garbage Collection Options | XX:MaxMetaspaceSize | 클래스 메타데이터에 할당할 수 있는 최대 기본 메모리 양을 설정. <br> 기본적으로 크기 제한 X, 응용 프로그램의 메타데이터 크기는 응용 프로그램 자체, 실행 중인 다른 응용 프로그램 및 시스템에서 사용할 수 있는 메모리 양에 따라서 달라짐.|
| Advanced JIT Compiler Options | XX:ReservedCodeCacheSize | JIT 컴파일 코드에 대한 최대 코드 캐시 크기를 설정 <br> (default:240MB) |

<br>

### ALL
전체의 Options 은 [공식페이지](https://docs.oracle.com/en/java/javase/11/tools/java.html#GUID-3B1CE181-CD30-4178-9602-230B800D4FAE)에서 확인 <br>
큰 틀에서의 Options 구분은 아래와 같다.

| Section | Description |
|--|--|
| Extra Options | Java HotSpot Virtual Machine에만 해당 되는 범용 옵션 |
| Advanced Runtime Options | Java HotSpot VM의 런타임 동작을 제어 |
| Advanced JIT Compiler Options | Java HotSpot VM에서 수행하는 동적 JIT(Just-In-Time) 컴파일을 제어 |
| Advanced Serviceability Options | Java용 고급 서비스 가능성 옵션 |
| Advanced Garbage Collection Options | Garbage collection이 Java HotSpot VM에 의해 수행되는 방법 제어 |

<br>

### Tips
----

#### Xmx, XmX 동일하게 세팅

- init과 max 사이에서 Used 메모리가 committed까지 사용하게 되면, 신규 메모리 공간을 요구하는데 약 1초 가량 JVM 메모리 할당 중 멈춰버리는 경우가 발생할 수 있음
(init < used < committed < max)

> Setting -Xms and -Xmx to the same value increases predictability by removing the most important sizing decision from the virtual machine. However, the virtual machine is then unable to compensate if you make a poor choice.

<br>

#### 개별 Thread의 Stack Size(-Xss)
- Thread별 Stack Size를 과도하게 줄였을 경우 Stack Overflow Error 발생할 수 있음
- 많은 수의 Thread를 사용하는 Application 의 경우 Thread Stack에 의한 메모리 요구량이 높아지며 이로 인해서 Out Of Memory Error 발생할 수 있음

<br>

> 대부분의 블로그나 참고 자료들은 JDK 8 이하의 버전에 대해서 설명한 것들이 많으므로 걸러서 봐야한다.
> 대표적으로 JDK7 에서는 Heap Memory 영역에 Permanent Generation 영역이 있었지만, JDK8 에서는 Native Memory 영역에 MetaSpace 가 생김. 

<br>
