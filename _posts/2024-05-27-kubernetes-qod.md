---
layout: post
title: "Pod QoS, Quality of Service Classes"
description: "Pod Qos, Quality of Service Classes"
excerpt: "Pod Quality of Service Classes 에 대해서 알아보자"
category: Kubernetes
comments: true
---

<div id ="notice--info">

    kubernetes 에서는 Pod 에 대한 QoS(Quality of Service) 클래스를 제공하고 있고, <br>
    QoS 에 대해서 간략하게 정리

</div>


### Pod 의 QoS 클래스 분류

---

QoS 는 Resource Requests 리소스 상한을 정하는 **Resource Limits** 조건을 바탕으로 우선순위가 정해진다.

|구분| 내용                                                                                      | Case                                     |
|--|-----------------------------------------------------------------------------------------|------------------------------------------|
|BestEffort| 우선순위가 가장 낮고 <br> 메모리가 부족한 경우 kill                                                       | Container 의 Request 와 Limit 이 설정되지 않은 경우 |
|Burstable| 최소한의 리소스를 보장 받으며, <br> 필요한 경우 더 많은 리소스를 할당 받음 <br> 메모리가 부족한 경우 다른 BestEffort 가 없다면 kill | Container 의 Request 와 Limit 이 일치하지 않는 경우 <br> Container 의 Request 와 Limit 중 하나만 설정된 경우 <br>  Request 와 Limit 이 설정되지 않은 Container 가 있는 경우| 
|Guaranteed| <span style="color:blue"> **우선순위가 높고** </span>, <br> Limits 를 넘지 않는 한 kill 되지 않음이 보장    | 모든 Container 의 Request 와 Limit 이 설정 되어 있고, <br> 각각 Container 의 Request 와 Limit 이 일치하는 경우|


<br> 

#### Case

| CPU              | Memory           |Qos Classes|
|------------------|------------------|----------|
| -                | -                |BestEffort|
| -                | Reqeust < Limits |Burstable|
| -                | Reqeust = Limits |Burstable|
| Reqeust < Limits | -                |Burstable|
| Reqeust < Limits | Reqeust < Limits |Burstable|
| Reqeust < Limits | Reqeust = Limits |Burstable|
| Reqeust = Limits | Reqeust < Limits |Burstable|
| Reqeust = Limits | Reqeust = Limits |Guaranteed|

<br>

<div id ="notice--note">

    <p style="font-weight: bold!important;"> 📘 Note </p>
    만일 side-car 를 사용한다면, 모든 side-car 의 CPU / Memory Request = Limit 를 맞춰야 Guaranteed 가 된다는 것이다.

</div>


#### QoS 예시

**1) BestEffort**

```yaml
...
    spec:
      containers:
        - name: app
          image: busybox
        - name: fluentd
          image: fluent/fluentd
...
```

<br>

**2) Burstable**

```yaml
...
spec:
  containers:
    - name: app
      image: busybox
      resources:
        request:
          memory: "128Mi" ### request, limit 의 memory 를 다르게 설정
          cpu: "500m" 
        limit:
          memory: "256Mi"
          cpu: "500m"
    - name: fluentd
      image: fluent/fluentd
      resources:
        request:
          memory: "128Mi"
          cpu: "500m"
        limit:
          memory: "128Mi"
          cpu: "500m"
...
```
<br>

```yaml
...
spec:
  containers:
    - name: app
      image: busybox
      resources:
        request:
          memory: "128Mi" 
          cpu: "500m" 
        limit:
          memory: "128Mi"
          cpu: "500m"
    - name: fluentd
      image: fluent/fluentd
      resources:
        request:
          memory: "128Mi"
          cpu: "200m" ### side-car 의 request, limit 의 cpu 를 다르게 설정
        limit:
          memory: "128Mi"
          cpu: "500m"
...

```

<br>

**3) Guaranteed**

```yaml
...
spec:
  containers:
    - name: app
      image: busybox
      resources:
        request: ### request, limit memory, cpu 동일하게 설정
          memory: "128Mi"
          cpu: "500m" 
        limit:
          memory: "128Mi"
          cpu: "500m"
    - name: fluentd
      image: fluent/fluentd
      resources:
        request: ### request, limit memory, cpu 동일하게 설정
          memory: "128Mi"
          cpu: "200m"
        limit:
          memory: "128Mi"
          cpu: "200m"
...

```


<br><br>

### 우선 순위 매커니즘

---

kubernetes 에서 리소스가 부족하면 QoS 에 따라 어떤 Pod 의 Container 의 Application 을 Kill 할지 추정한다.  

```text
BestEffort < Burstable < Guaranteed
```
<br>

Guaranteed 는 node 에서 메모리를 필요로 하는 경우에만 kill 된다.  

<div id ="notice--note">

    <p style="font-weight: bold!important;"> 📘 Note </p>
    kubelet 은 eviction 제거 순서를 결정하기 위해서 Pod 의 QoS 클래스를 사용하지 않는다.
    QoS 클래스를 사용하여 메모리와 같은 리소스를 회수할 때 가장 가능성이 높은 Pod 를 추정한다.    

</div>

<br><br>

#### Pod Qos 에 따른 oom_score_adj 값

|Pod Qos| oom_score_adj                                                                     |
|--|-----------------------------------------------------------------------------------|
|Guaranteed| -997 (고정)                                                                         |
|Burstable| min(max(2, 1000 - (1000 * memoryRequestBytes) / machineMemoryCapacityBytes), 999) |
|BestEffort| 1000 (고정)                                                                         |

<br>

`Guaranteed` 는 -997 의 고정 값을 가지고 있고,  
`BestEffort` 는 1000 의 고정 값을 가지고 있다.  
`Burstable` 는 Pod 의 Manifest 에 명시된 Container 의 Memory Request 값이 **높을수록 낮은 값**을 가지며, 2~999 사이의 값을 가진다.

<br>

Container 의 Process 의 oom_score 값과 kubernetes 가 설정한 oom_score_adj 값의 합이 높을 수록   
OOM Killer 에 의해서 선택될 확률이 높아진다.  
합이 0 이면 OOM Killer 선택 대상에서 제외되며, 합이 1000을 넘어가면 OOM Killer 에 의해서 반드시 제거된다.  

<br>

<div id="notice--success">
    
    <span style="font-weight: bold!important;"> Guaranteed Qos </span> 를 갖는 Pod 의 Container 는 
    <span style="font-weight: bold!important;"> OOM Killer </span> 에 의해서 거의 선택되지 않는다. <br>
    <span style="font-weight: bold!important;"> BestEffort Qos </span> 를 갖는 Pod 의 Container 는 
    <span style="font-weight: bold!important;"> OOM Killer </span> 에 의해서 반드시 선택되어 제거된다. <br>
    <span style="font-weight: bold!important;"> Burstable QoS </span> 를 갖는 Pod 의 Container 는 <br>
    Memory 사용량이 거의 없더라도 <span style="font-weight: bold!important;"> oom_score_adj </span> 값이 
    <span style="font-weight: bold!important;"> 999 </span> 가 되기 때문에 높은 확률로 
    <span style="font-weight: bold!important;"> OOM Killer </span> 에 의해서 제거될 확률이 높다. <br>
    Memory 사용량이 높으면 <span style="font-weight: bold!important;"> oom_score_adj </span> 값이 낮더라도 
    <span style="font-weight: bold!important;"> oom_score </span> 값이 높기 때문에 
    높은 확률로 <span style="font-weight: bold!important;"> OOM Killer </span> 에 의해서 선택 되어 제거 될 수 있다. <br>
    
</div>

<br><br>

### 간단한 예시

---

Pod1, Pod2, Pod3 이 각각 Guaranteed, Burstable, BestEffort QoS 분류가 되어 있다고 가정  

| Pod  |Qos|
|------|--|
| Pod1 |Guaranteed|
| Pod2 |Burstable|
| Pod3 |BestEffort|

<br>

#### Q. Pod1 이 리소스를 추가로 요청하고 node 에는 여유 리소스가 없는 상태일 때는?

<br>

A. Pod2 와 Pod3 이 같은 메모리 사용량을 사용하고 있다면, **BestEffort** 로 QoS 분류가 되어 있는 Pod3 을 죽이고,  
Pod3 에 있는 리소스들을 Pod1 이 필요한 만큼의 리소스를 할당하고 node 의 여유 자원으로 회수하게 된다.  

<div id="notice--warning">

    Pod2와 Pod3이 사용하는 메모리에 따라서 eviction 순서가 바뀔 수 있다.

</div>

<br>

#### Q. Pod1, Pod2 만 운영 중일때, Pod2 가 현재 node 의 여유자원 보다 많은 리소스를 요청하게 된 경우는?

<br>

A. Pod2 의 QoS 는 **Burstable** 이고, Pod1 의 QoS 는 **Guaranteed** 이므로,  
Pod2 의 우선순위가 낮기 때문에 추가적인 리소스를 할당 받지 못하고 죽게 될 가능성이 높다.

<br>

#### Q. 만일 같은 QoS 일 때는?

<br>

A. OutOfMemory Score 에 따라 어떤 Pod 를 Kill 할지 비교하여 정한다.


<br><br>

### Reference

---

* [Configure Quality of Service for Pods](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)
* [k8s 파드의 우선순위(Pod QoS, Quality of Service)](https://kimjingo.tistory.com/139)
* [Node-pressure Eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/#node-oom-behavior)
* [Another OOM killer rewrite](https://lwn.net/Articles/391222/)


<br><br><br>

