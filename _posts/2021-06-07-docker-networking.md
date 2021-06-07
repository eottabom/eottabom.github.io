---
layout: post
title: "Docker Network"
description: "Docker Network"
excerpt: "Docker의 네트워크에 대해서 알아보고, bridge network 를 만들어보자"
category: Docker
comments: true
---

같은 Docker host 내에서 실행 중인 Container 간의 연결을 돕는 논리적 네트워크와 같은 `Docker Network` 에 대해서 알아보고,
bridge Network 를 만들어보자. (docker tutorial 내용)

<br>

### Legacy container links
---

docker hub 에 등록된 많은 애플리케이션들이  `--link` 를 사용하여 container 간 통신을 이용하였지만,
[docker 공식 홈페이지](https://docs.docker.com/network/links/) 에 따르면, docker network 사용을 가이드 하고 있다.

> Warning <br>
> The `--link` flag is a legacy feature of Docker. It may eventually be removed. Unless you absolutely need to continue using it, we recommend that you use user-defined networks to facilitate communication between two containers instead of using `--link`. One feature that user-defined networks do not support that you can do with `--link` is sharing environment variables between containers. However, you can use other mechanisms such as volumes to share environment variables between containers in a more controlled way.
> **[See Differences between user-defined bridges and the default bridge](https://docs.docker.com/network/bridge/#differences-between-user-defined-bridges-and-the-default-bridge)** for some alternatives to using --link.


<br>

### Docker Network Drivers
---

docker network 의 목록을 조회하면, 기본적으로 bridge, host, none 을 볼 수 있다. 

```shell
yukeun@mint:~$ sudo docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
666401337cdd        bridge              bridge              local
e741b65ee331        host                host                local
9e2ca85f2355        none                null                local
```

<br>

1) bridge
- 가장 기본적인 네트워크 드라이버로, Container 가 외부와 통신하기 위한 Virtual Bridge <br>
- bridge 는 `ifconfig` 명령어로 확인 할 수 있는데, 기본적으로 `docker0` 으로 자동 설정 <br> 
- Driver 를 설정하지 않으면 자동 지정 <br>

![docker-bridge]({{site.baseurl}}/img/post/docker/network/docker-bridge.png) <br>

2) host
- 호스트와 네트워크를 공유 <br>

3) overlay
- 여러 Dokcer 데몬을 함께 연결 하고 swarm 서비스가 서로 통신 하도록 <br>
→ Container 간 OS 라우팅을 수행할 필요 x

4) macvlan
- 컨테이너에 MAC 주소를 할당하여 네트워크에서 물리적 장치를 표시할 수 있음 <br>

5) none
- 모든 네트워크 비활성화 <br> 

6) network plugin
- Dokcer 와 함께 타사 네트워크 plugin 을 설치하고 사용할 수 있음 <br>

Docker Network 는 172.x 대역대의 가상 IP 를 가진다. 
아래의 예시에서는 `172.17.0.0/16` Subnet 주소를 가진 것을 확인 할 수 있다. 
네트워크를 지정하지 않으면, Docker 는 항상 bridge network 에서 컨테이너를 시작한다.

<br>

<br>

### Bridge Network connect & disconnect
---

#### Step1) Container 실행

<br>

eottabom 이라는 이름을 가진 Container 를 생성하여 실행

> sudo docker run -itd --name=eottabom ubuntu

`-d` container 백그라운드 실행 <br>
`-i` 표준 입력을 유지 <br>
`-t` 가상 터미널 연결 옵션 <br> 
`--name` container 이름 부여 <br>

<br>

```shell
yukeun@mint:~$ sudo docker run -itd --name=eottabom ubuntu
e8b2df927301965a788094b28740f39ef7c892e063c04774c62f193ff6db6a38
yukeun@mint:~$ sudo docker run -itd --name=eottabom ubuntu
```

<br><br>

#### Step2) bridge network 상세 정보 확인

> sudo docker network inspect bridge

```shell
yukeun@mint:~$ sudo docker network inspect bridge
[
    {
        "Name": "bridge",
        "Id": "666401337cddb423221d56b3078ab80f6af4f91b2705093551ed65cd9c3f7069",
        "Created": "2021-06-07T22:24:19.765877374+09:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16", # bridge network 는 가상 ip 로 172.x 대역대를 가진다. 
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "e8b2df927301965a788094b28740f39ef7c892e063c04774c62f193ff6db6a38": {
                "Name": "eottabom", # 추가 된 Container 의 이름
                "EndpointID": "487383cdabe80af12399fca590183937430e5d88e4feb534ac2dff52257ae0e5",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

<br><br>

#### Step3) Container 연결 해제

> sudo docker network disconnect bridge eottabom
 
```shell
yukeun@mint:~$ sudo docker network inspect bridge
[
    {
        "Name": "bridge",
        "Id": "666401337cddb423221d56b3078ab80f6af4f91b2705093551ed65cd9c3f7069",
        "Created": "2021-06-07T22:24:19.765877374+09:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {},
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

<br><br>

### Make My Bridge Network
---

datebase 와 web application 간의 bridge 연결 하는 예제  

<br>

#### Step1) bridge Network 만들기 

> sudo docker network create -d bridge my-net-test

<br>

```shell
yukeun@mint:~$ sudo docker network create -d bridge my-net-test
93795419b77eab208cbe93d465cc8eae1a6b2da12a1481f1cc68bd17b065dbfd

yukeun@mint:~$ sudo docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
666401337cdd        bridge              bridge              local
e741b65ee331        host                host                local
1e7d494bb7f9        my-net              bridge              local
71117aa9afab        my-net2             bridge              local
93795419b77e        my-net-test         bridge              local
9e2ca85f2355        none                null                local

```

<br>

#### Step2) Network 에 Container 추가 & 상세 정보 확인 

> sudo docker run -d --net=my-net-test --name db-test training/postgres

<br>

```shell
yukeun@mint:~$ sudo docker run -d --net=my-net-test --name db-test training/postgres
Unable to find image 'training/postgres:latest' locally
latest: Pulling from training/postgres
Image docker.io/training/postgres:latest uses outdated schema1 manifest format. Please upgrade to a schema2 image for better future compatibility. More information at https://docs.docker.com/registry/spec/deprecated-schema-v1/
a3ed95caeb02: Pull complete 
6e71c809542e: Pull complete 
2978d9af87ba: Pull complete 
e1bca35b062f: Pull complete 
500b6decf741: Pull complete 
74b14ef2151f: Pull complete 
7afd5ed3826e: Pull complete 
3c69bb244f5e: Pull complete 
d86f9ec5aedf: Pull complete 
010fabf20157: Pull complete 
Digest: sha256:a945dc6dcfbc8d009c3d972931608344b76c2870ce796da00a827bd50791907e
Status: Downloaded newer image for training/postgres:latest
e8ed6d05f15eb32a9fddcabbff3671fa0480bfb88a36c2777fd72776d5c38f4c
```

<br>

> sudo docker inspect my-net-test

<br>

```shell
yukeun@mint:~$ sudo docker inspect my-net-test
[
    {
        "Name": "my-net-test",
        "Id": "93795419b77eab208cbe93d465cc8eae1a6b2da12a1481f1cc68bd17b065dbfd",
        "Created": "2021-06-08T00:47:27.041674378+09:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "172.20.0.0/16",
                    "Gateway": "172.20.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "e8ed6d05f15eb32a9fddcabbff3671fa0480bfb88a36c2777fd72776d5c38f4c": {
                "Name": "db-test",
                "EndpointID": "8137bc299f065fa37949767f48333cab3599ceaf4b7857fe09009ae1d5a1b838",
                "MacAddress": "02:42:ac:14:00:02",
                "IPv4Address": "172.20.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
  }
]

```

<br>

> sudo docker run -d --name web training/webapp python app.py

<br>

> sudo docker inspect --format='{{json .NetworkSettings.Networks}}'  web-test
> sudo docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web-test

<br>

```shell
yukeun@mint:~$ sudo docker inspect --format='{{json .NetworkSettings.Networks}}'  web-test
{"bridge":{"IPAMConfig":null,"Links":null,"Aliases":null,"NetworkID":"666401337cddb423221d56b3078ab80f6af4f91b2705093551ed65cd9c3f7069","EndpointID":"18d0f4732b329c71a8b67a4d93e24e6acef5ce0cf5f99a0bba6ddf5fde67045c","Gateway":"172.17.0.1","IPAddress":"172.17.0.2","IPPrefixLen":16,"IPv6Gateway":"","GlobalIPv6Address":"","GlobalIPv6PrefixLen":0,"MacAddress":"02:42:ac:11:00:02","DriverOpts":null}}

yukeun@mint:~$ sudo  docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web-test
172.17.0.2
```

<br>

> sudo docker container exec -it db-test bash

<br>

```shell
yukeun@mint:~$ sudo docker container exec -it db-test bash
root@e8ed6d05f15e:/# ping 172.17.0.2
PING 172.17.0.2 (172.17.0.2) 56(84) bytes of data.
^C
--- 172.17.0.2 ping statistics ---
3 packets transmitted, 0 received, 100% packet loss, time 2039ms
```

<br>

> sudo docker network connect my-net-test web-test

<br>

```shell
yukeun@mint:~$ sudo docker container exec -it db-test bash
root@e8ed6d05f15e:/# ping web-test
PING web-test (172.20.0.3) 56(84) bytes of data.
64 bytes from web-test.my-net-test (172.20.0.3): icmp_seq=1 ttl=64 time=0.091 ms
64 bytes from web-test.my-net-test (172.20.0.3): icmp_seq=2 ttl=64 time=0.060 ms
64 bytes from web-test.my-net-test (172.20.0.3): icmp_seq=3 ttl=64 time=0.060 ms
64 bytes from web-test.my-net-test (172.20.0.3): icmp_seq=4 ttl=64 time=0.058 ms
^C
--- web-test ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3052ms
rtt min/avg/max/mdev = 0.058/0.067/0.091/0.014 ms

```

<br><br>

### Reference
----
[Network containers](https://docs.docker.com/engine/tutorials/networkingcontainers/) <br><br>
