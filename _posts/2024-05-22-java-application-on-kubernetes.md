---
layout: post
title: "Java Application on kubernetes"
description: "Java Application on kubernetes"
excerpt: "컨테이너 환경에서의 Java Application 설정 관련 Best Practices 에 대해서 알아보자."
category: Java
comments: true
---

kubernetes 환경에서 Java Application 의 리소스(`CPU`, `Memory`)는 현재 서비스의 트래픽과 같은..   
지표 기반으로 조정하는 것이 가장 바람직하다.  
신규 서비스나 아직 지표를 정확히 알 수 없는 상황에서  
어떻게 설정하는 것이 가장 좋은지에 대해서 궁금해서 찾아본 내용들을 정리해보았다. 

### Best Practices: Java Memory Arguments for Containers

---

[Best Practices: Java Memory Arguments for Containers](https://dzone.com/articles/best-practices-java-memory-arguments-for-container) 에 대한 내용

<br>

#### 모범 사례 1

힙 크기 구성에 사용하는 옵션 (`-XX: MaxRAMFraction`, `-XX: MaxRAMPercentage`, `-Xmx`) 에 관계 없이 항상 컨테이너에
<span style="color:red"> 최소 25% </span>
더 많은 메모리를 할당한다.

- Java Thread, Garbage Collection, Metaspace, Native Memory, Socket buffers 를 위한 공간이 필요
- ex) MaxRAMPercentage: 75

<br>

#### 모범 사례 2

초기 힙 크기(`-XX:InitialRAMFraction`, `-XX:InitialRAMPercentage`, `-Xms`) 를  
최대 힙 크기(`-XX: MaxRAMFraction`, `-XX: MaxRAMPercentage`, `-Xmx`) 와 동일한 크기로 설정한다.

- 초기 힙 크기 = 최대 힙 크기 설정 시 장점
    - [Benefits of setting initial and maximum memory size to the same value](https://blog.ycrash.io/benefits-of-setting-initial-and-maximum-memory-size-to-the-same-value/)
    - 힙 크기가 초기 할당 크기보다 커질 때 마다 JVM 이 일시 중지 되기 때문에,   
    초기 힙 크기 = 최대 힙 크기 설정 시 Garbage Collection pause time 이 낮아진다.

```{.bash}
ex) -Xms=500M -Xmx=500m
```

<br>

#### 모범 사례 3

- `XX: MaxRAMFraction`, `XX:MaxRAMPercentage` 보다는 `Xmx` 옵션을 사용해라.
- Container 의 메모리 설정에 따라 조정되는 것보다는 세밀하고 정밀한 값을 설정할 수 있다.


<br><br>

### Best Practices for Java Apps on Kubernetes

---

[Best Practices for Java Apps on Kubernetes](https://piotrminkowski.com/2023/02/13/best-practices-for-java-apps-on-kubernetes/) 일부 내용  

<br>

#### 1. Don't Set Limits Too Low  
 
+ CPU, Memory 는 Limit 을 너무 낮게 설정하지 마라.  
+ Java 는 일반적인 작업에서 많은 CPU 를 소비 하지 않더라도, 빠르게 시작하려면 많은 CPU 가 필요하다.
+ CPU 제한 설정을 권장하지 않는 글 : https://home.robusta.dev/blog/stop-using-cpu-limits
+ 해당 글에 대한 반박 글 : https://dnastacio.medium.com/why-you-should-keep-using-cpu-limits-on-kubernetes-60c4e50dfc61  
  → 결론적으로는 CPU limit 을 설정해야 좋다  
  → Memory 역시 Limit 을 설정하는 것이 좋다.

#### 2. Consider Memory Usage First  
Kubernetes 에서 앱을 실행하기 전에 최소한 예상 로드에서 앱이 소비하는 메모리 량을 측정 해야 한다.  

```{.bash}
Heap = Total Container Memory - Non heap - Headroom

Non Heap = Direct Memory + Metaspace + Reserved Code Cache + (Thread Stack * Thread Count)
```
<br>

#### 3. Proper Liveness and Readiness Probes  
+ `LivenessProbe` 는 컨테이너를 다시 시작할지 여부를 결정하는데 사용  
   어떤 이유로든 Application 을 사용할 수 없는 경우 컨테이너를 다시 시작하는 것이 합리적일 수 있음

+ `ReadinessProbe` 는 컨테이너가 들어오는 트래픽을 처리 할 수 있는지 결정하는데 사용  
   Pod 가 준비되지 않은 것으로 인식되면 로드밸런싱에서 제거됨  
   `ReadinessProbe` 가 실패해도 Pod 는 다시 시작되지 않음  

<br><br>

### Kubernetes and the JVM

---

[Kubernetes and the JVM](https://xebia.com/blog/kubernetes-and-the-jvm/) 의 일부 내용  

> If the JVM runs out of memory, it may result in the application crashing or other unexpected behavior.
> To avoid this, it's essential to set appropriate requests and limits for memory

#### Request, Limits and the JVM
+ request, limit 메모리 보다 작은 `-Xmx` 을 설정한다.
+ request / limit memory 는 동일하게 설정하는 것이 좋다. <span style="color:blue"> (QoS Guaranteed) </span>

<br> 

#### "Helpers" for configuring the Heap Size
+ `-XX: InitialRAMPercentage` / `-XX: MaxRAMPercentage` 로 사용 가능한 메모리의 백분율로 설정한다. (힙 고정 x)
+ Kubernetes 와 같이 Pod 확장, 노드 확장 / 기타 요인으로 인해 사용 가능한 메모리가 변동 될 수 있는 동적 환경에서 중요한 역할을 한다.  
+ request / limits 와 같이 사용하는 것이 Kubernetes 에서 메모리 사용량을 관리하기 위한 안정적이고 권장되는 접근 방법이다.  
→ 결국은 <span style="color:blue"> request / limits + -XX: InitialRAMPercentage / -XX: MaxRAMPercentage </span> 를 사용해라.

<br>

#### So, how could we find these kubernetes memory settings (request / limit) ?
+ Non heap memory 도 고려해라.  
+ -Xmx 힙이 아닌 메모리가 소진되어 OutOfMemoryError 가 발생할 수 있다.  
+ Metaspace Memory : -XX:MaxMetaspaceSize 로 구성 가능하고,  
  경험적인 규칙은 메모리 보다 16배 낮은 값으로 제한 하는 것이다.

```{.bash}
ex) JVM 에 사용 가능한 메모리가 4GB 일 때 = XX:MaxMetaspaceSize=256M
```
  
+ RAM 기반 파일 시스템도 영향을 미칠 수 있다.  

<br>

#### Garbage Collection
가비지 수집의 빈도와 시간은 JVM application 성능과 안정성에 영향을 미칠 수 있다.  
```{.bash}
-XX:+UseG1GC
-XX:MaxGCPauseMillis
```

### Some best practices when running JVM on the Kubernetes cluster

---

[Some best practices when running JVM on the Kubernetes cluster](https://softwaremill.com/jvm-and-kubernetes-walk-into-a-bar/)

<br>

#### 1. request / limit 설정을 하자. 
<br>
#### 2. request / limit 값을 동일한 값으로 설정해라 (QoS)
<br>
#### 3. XX: ActivePrecessorCount 플래그를 설정하여 사용 가능한 코어 수를 명시적으로 설정해라
<br>
#### 4. XX: MaxRAMPercentage 최대 힙 크기 값을 60% 정도로 맞추어라.
<br>
#### 5. UseContainerSupport 를 비활성화해라
+ 비활성화하면 jvm 이 container 가 실행중인 host 즉, worker node 의 리소스 정보를 바라본다.

<br><br><br>

### 그 외에도..

<br><br>

### alibaba cloud - Best practices for jvm heap size configuration

---
[alibaba cloud - Best practices for jvm heap size configuration](https://www.alibabacloud.com/help/en/sae/use-cases/best-practices-for-jvm-heap-size-configuration)

<br>

#### (Recommeneded) Use the -XX: MaxRAMPercentage option to manage the heap size  
* -Xmx 옵션을 사용하여 JVM 힙 크기를 제어할 수 있지만, 메모리 크기를 조정한 후에는 -Xmx 옵션을 재구성 해야 한다.  
* -Xmx 옵션을 잘못된 값으로 설정하고 힙 크기 상한에 도달하지 않으면 OOM 오류로 인해 컨테이너가 강제 종료 될 수 있다.

<br>

#### Use the -Xms and -Xms options to control heap size

<br>
#### 권장되는 JVM heap size  

|Memory|Heap Size|
|--|--|
|1 GB|600 MB|
|2 GB|1,434 MB|
|4 GB|2,867 MB|
|8 GB|5,734 MB|

<br>

```{.bash}
ex) 4GB 일 때, MaxRAMPercentage=70.0 으로 설정하면 JVM 은 최대 2.8GB 힙 메모리를 할당
```

<br><br>


### CloudBees - Java Heap settings Best Practice

---

[CloudBees - Java Heap settings Best Practice](https://docs.cloudbees.com/docs/cloudbees-ci-kb/latest/best-practices/jvm-memory-settings-best-practice)

<br>

#### Encure container memory limits / requests are equal and use -XX:InitialRAMPercentage / -XX:MaxRAMPercentage
<br>
#### -Xmx, -Xms 대신 -XX:InitialRAMPercentage / -XX: MaxRAMPercentage 을 사용해라.
<br>
#### JVM 힙 / 컨테이너 메모리 비율은 0.5 은 불안정한 것으로 알려졌다.

<br><br>

### Azure - Kubernetes 용 Java 애플리케이션 컨테이너화 / 자바 메모리 관리

---

[Azure - Kubernetes 용 Java 애플리케이션 컨테이너화](https://learn.microsoft.com/ko-kr/azure/developer/java/containers/overview)
[Azure - Kubernetes 용 Java 애플리케이션 메모리](https://learn.microsoft.com/en-us/azure/spring-apps/concepts-for-java-memory-management)

<br>

### CPU / Memory request / limit 을 동일한 값을 설정한다.  
### JVM 사용 가능한 프로세서 이해  
Kubernetes CPU 할당량은 프로세스에서 사용할 수 있는 CPU 수가 아니라 프로세스에서 CPU 에 소요되는 시간과 관련 있다.  
JVM 과 같은 다중 스레드 런타임은 여러 스레드가 있는 여러 프로세서를 동시에 사용할 수 있다.  
컨테이너 하나의 CPU 제한이 있더라도 JVM 에 사용 가능한 프로세스를 지정할 수 있다.

```{.bash}
-XX:ActiveProcessorCount=N  
```
<br>

### Default maximum heap size  
Azure Spring App 은 기본적으로 heap memory size 가 50~80% 으로 설정된다.

```{.bash}
1GB 보다 작으면 50%  
1GB < app memory < 2GB = 60%  
2GB < app memory < 3GB = 70%  
3GB < app memory = 80%  
```

<br><br>

### Pretius - JVM Kubernetes: Optimizing Kubernetes for Java Developers

---
[Pretius - JVM Kubernetes: Optimizing Kubernetes for Java Developers](https://pretius.com/blog/jvm-kubernetes/)

<br>

#### JVM Kubernetes - memory limit and usage
> "The default limits are very small, so you should always set the memory limits in your java application when running it in a container"
> 기본 설정은 낮으니 항상 memory limit 을 설정해라.

<br>

#### 메모리 사용량 계산 (Calculating memory usage)

<br>

##### SYSTEM AND CLASS DATA
시스템 및 클래스 데이터는 수십 MB만 사용할 가능성이 높으니 50MB 로 설정하는 게 좋다.

<br>

##### THREADS
사용중인 Thread 수에 자체 안전 계수를 곱하여 필요한 메모리를 추정해라.

<br>

##### MAXIMUM HEAP SIZE
컨테이너의 약 75~80% 로 초기 힙 사이즈를 지정해라.

<br>

##### JVM Kubernetes - CPU usage
> "if your container CPU limits is too low, your application will be extremely slow under heavy stress. Your SLA commitment on request handling time will likely be breached."
> CPU limit 이 너무 낮으면, 어플리케이션 속도가 느려질 수 있다.

<br>

##### Other impacts of Kubernetes CPU limits
-XX: ActiveProcessorCount 플래그를 사용하여 Java CPU 수를 limit ~ 2배로 설정한다.

<br>

##### Java 라이브러리의 중요한 pool 에 대해 스레드 수를 명시적으로 설정한다.

<br>

##### Garbage collection
* 일반적인 1GB memory, 2 CPU java 어플리케이션에는 병렬 GC 를 사용해라.

* 힙이 약 2~4GB 인 경우 G1(JDK < 17) /Z GC(JDK +17) 로 전환하는 것이 좋다.
 
<br><br><br>

## 위의 내용을 정리하면 !!

---

### 1) 초기 힙 사이즈와 최대 힙 사이즈를 동일하게 맞춰라.
```{.bash}
ex) -xms = -xmx
```

<br>

### 2) Guaranteed QoS 설정을 하자.  
* request / limit 동일하게 맞추지 않는다면, 너무 차이가 나지 않는 값으로 설정한다.
* request 는 <span style="color:blud"> 평균 사용량 + 10%, limit 은 peek 사용량 중 최대 사용량 </span> 으로 설정한다.

<br>

### 3) -xms, -xmx 보다는 MaxRAMPercentage 를 준다. (일부는 -xms, -xmx 와 같이 세밀한 값을 주는게 좋다고 말함)  
* MaxRAMPercentage 옵션을 주면 -xmx 옵션은 무시된다. (InitialRAMPercentage 옵션을 주면 -xms 는 무시됨)  
* 상황에 따라서 달라지겠지만, <span style="color:blud"> 대부분 70.0 ~75.0 정도로 권장 </span> 하고 많은 리소스를 낭비 하지 않는다.  
* 단, open jdk 17 부터 가능함 (원래는 jdk 8 부터 사용가능했지만, 버그가 있었고, jdk 13 에서 수정됨)  
* -xms, -xmx 을 사용해야 하는 상황이라면 request memory 기준으로 맞춘다. (request / limit 은 너무 차이가 나지 않는 값으로..)

<br>

### 4) LivenessProbe 와 ReadinessProbe 를 설정해준다.

<br>

### 5) XX: ActiveProcessorCount 플래그를 사용하여 limit CPU 의 2배로 설정한다.

<br>

### 6) 병렬 GC 를 사용하거나, 힙을 많이 사용하면 G1/Z GC 를 사용해라.


<br><br>


**개인적인 생각**  
request / limit memory, cpu 를 설정하는 것이 좋다.  
-xss(ThreadStackSize) 는 default 값이 1M 이므로 굳이 설정하지 않아도 좋다.  
xms / -xmx 을 동일한 값으로 설정하는 것이 좋다  
(단, 최대 힙 크기를 고정한다면 request / limit memory 의 60 ~ 80% 으로 맞추자.)  
QoS Guarantedd 인 Pod 를 생성하자  
livenessProbe, readnessProbe 를 설정하자.  
ActiveProcessorCount 플래그를 설정하는 것이 좋다.  
{: .notice--info}

<br><br>



### Reference

---

[JVM-in-Linux-containers-surviving-the-isolation](https://bell-sw.com/announcements/2020/10/28/JVM-in-Linux-containers-surviving-the-isolation/)

[컨테이너와 JVM의 메모리 Limit 및 Request](https://gist.github.com/petrbouda/92d794370134fc9dda1fdc05473c7165)

[JVM 어플리케이션 용 Kubernetes 의 힙크기, 메모리 사용량 및 리소스 제한](https://akobor.me/posts/heap-size-and-resource-limits-in-kubernetes-for-jvm-applications)

[컨테이너 환경에서의 Java 어플리케이션의 리소스와 메모리 설정](https://findstar.pe.kr/2022/07/10/java-application-memory-size-on-container/)

[Kubernetes 컨테이너 환경에서의 컴퓨팅 리소스 정보 및 제한](https://effectivesquid.tistory.com/entry/Kubernetes-%EC%BB%A8%ED%85%8C%EC%9D%B4%EB%84%88-%ED%99%98%EA%B2%BD%EC%97%90%EC%84%9C%EC%9D%98-%EC%BB%B4%ED%93%A8%ED%8C%85-%EB%A6%AC%EC%86%8C%EC%8A%A4-%EC%A0%95%EB%B3%B4-%EB%B0%8F-%EC%A0%9C%ED%95%9C)

[K8s 환경에서 더 나은 CPU 및 메모리 활용을 위해 JVM 컨테이너를 조정합니다.](https://medium.com/@anurag2397/solving-javas-core-problems-around-memory-and-cpu-4d0c97748c43)

[Kubernetes 의 JVM 14 메모리에 대한 실용적인 가이드](https://focusedlabs.io/blog/the-no-nonsense-guide-to-jvm-14-memory-on-kubernetes-508m)

[Kubernetes Resource Request와 Limit의 이해](https://online.cocktailcloud.io/2019/04/30/kubernetes-resource-request%EC%99%80-limit%EC%9D%98-%EC%9D%B4%ED%95%B4/)

[쿠버네티스에서 쉽게 저지르는 10가지 실수](https://coffeewhale.com/kubernetes/mistake/2020/11/29/mistake-10/)

<br><br><br>
