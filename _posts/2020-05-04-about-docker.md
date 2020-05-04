---
layout: post
title: "Docker 기본 개념"
description: "About Docker"
excerpt: "Docker란? 무엇인가?"
category: Docker
comments: true
---

### Docker란?
2013년 3월 PyCon Conference에서 dotCould의 창업자인 `Solomon Hykes` 가 [The future of Linux Containers](https://www.youtube.com/watch?v=wW9CAH9nSLs&feature=youtu.be)
라는 세션을 발표하면서 공개가 되었다. <br>
기존 리눅스에 있는 컨테이너 기술을 활용한 기술로, 애플리케이션을 컨테이너로 좀 더 쉽게 사용할 수 있게 만든 오픈 소스 프로젝트이다. <br>
쉽게 말해, Docker는 `컨테이너 기반의 오픈 소스 가상화 플랫폼` 이다. <br>

<br>
----
### Docker가 주목 받는 이유?
```text
1. 가상 머신보다 가벼운 컨테이너로 효율적인 리소스 활용
2. 이미지 빌드, 배포, 롤백으로 서비스의 상태 관리
3. 단순 빌드, 배포 
4. 어플리케이션의 높은 이식성
```

<br>
----
### Vms VS Containers
<img class="post_image" src="{{site.baseurl}}/img/post/docker/containers-vms.png" />

| Vms | Container |
|--|--|
| OS 탑재, 부팅시 시간 소요 | 프로세스만 실행 |
| 커널과 라이브러리 등 포함 | 호스트 운영체제의 커널을 공유해서 사용 <br> 리눅스 자체 기능인 `chroot`, `namespace`, `cgroup` 사용 |
| 용량이 크다 | 견량화되어 가볍다 |
| 가상화된 하드웨어 및 하이퍼바이저를 통해 처리 오버 헤드 필요 | 가상화 커널 공유 방식으로 각 컨테이너는 개별의 프로세스(오버헤드 x) |

<img class="post_image" src="{{site.baseurl}}/img/post/docker/sysbench.png" />

sysbench 라는 벤치마크 도구를 사용해서 성능 측정한 결과로, 물리적 시스템과 컨테이너 형 가상화인 Docker의 성능은 모든 항목에서 비슷하다.
하드웨어 가상화는 `메모리`, `파일 IO`는 `약 2배`, `CPU`는 `약 5배`의 시간이 걸린다. 따라서 `Docker는 물리 머신과 비교해도 성능 저하가 거의 없다.`

<br>
---- 
### Docker Architecture
<img class="post_image" src="{{site.baseurl}}/img/post/docker/docker-architecture.png" />

> Client : Docker Container를 관리하고 실행하기 위해 Deamon과 상호 작용하는 Binary 파일
> Registry : Docker image가 저장된 장소
> Daemon : Host에 설치되어 Docker Container를 관리하는 Daemon 프로세스, Client와 상호 작용
> Image : Docker Daemon을 통해 Container로 실행 가능하도록 필요한 프로그램, 라이브러리, 소스 등이 설치된 파일
> Container : Image를 실행한 상태 

<br>
---- 
### Reference
> [초보를 위한 도커 안내서 - 도커란 무엇인가?](https://subicura.com/2017/01/19/docker-guide-for-beginners-1.html) <br>
> [도커 Docker 기초 확실히 다지기](https://futurecreator.github.io/2018/11/16/docker-container-basics/)
