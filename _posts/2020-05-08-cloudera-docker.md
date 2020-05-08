---
layout: post
title: "Docker 기반 Cloudera 환경 구성"
description: "Cloudera Hadoop(1개의 HeadNode와 3개의 DataNodes)를 Docker로 구성하기"
excerpt: "Cloudera Hadoop(1개의 HeadNode와 3개의 DataNodes)를 Docker로 구성하기"
category: Docker
comments: true
---

<br><br>

### Summary
---
docker 환경으로 `cloudera service` 구축하기 <br>
`docker network`로 각각의 서버간의 통신을 할 수 있게 설정 <br>
data volume을 별도로 관리하여 docker 환경이 아닌 외부에서도 data에 접근 할 수 있도록 구성 <br>

<br>

### Tree structures
---
```{.bash}
├── build.sh
├── DataNodes
│   └── Dockerfile
├── docker_cluster_hosts
├── docker-compose.yml
├── HeadNodes
│   ├── cloudera-manager.repo
│   ├── create_databases.sql
│   ├── Dockerfile
│   └── my.cnf
├── README.md
└── up.sh
```
DataNodes 디렉토리 안에 centsos 6.9 기반의 깡통 서버를 만들기 위한 Dockerfile 작성 <br>
HeadNodes 디렉토리 안에 centsos 6.9 기반의 cloudera manager, cloudera server, cloudera db, mysql가 설치된 서버를 만들기 위한 Dockerfile을 작성 <br>
docker_cloudera_hosts는 각 서버들에게 사설 ip를 고정적으로 할당하기 위하여 사용 <br>
build.sh는 docker-compose를 build하고 필요한 디렉토리를 자동 생성하게끔 구성 <br>
up.sh docer-compose를 up 하기 위한 실행파일

<br>

### DataNodes Dockerfile
---
```{.bash}
## INSTALL CENTOS
FROM centos:6.9

## MISCELANEOUS PACKAGES
RUN yum update -y
RUN yum install  -y nano
RUN yum install  -y sudo
RUN yum -y install openssh-server; yum -y install openssh-clients
RUN yum install -y wget
RUN yum install -y tar.x86_64
RUN yum clean all

## INSTALL PYTHON RELATED PACKAGES

RUN yum -y update; yum clean all
RUN yum -y install python-devel
RUN yum -y install epel-release; yum clean all
RUN yum -y install python-pip; yum clean all
RUN wget https://bootstrap.pypa.io/2.6/get-pip.py
#RUN python get-pip.py 
RUN yum install -y zlib-devel
RUN yum install -y bzip2-devel
RUN yum install -y openssl-devel
RUN yum install -y ncurses-devel
RUN yum install -y sqlite-devel
RUN yum install -y readline-devel
RUN yum install -y tk-devel
RUN yum install -y gdbm-devel
RUN yum install -y db4-devel
RUN yum install -y libpcap-devel
RUN yum install -y xz-devel
RUN yum install -y expat-devel
RUN yum install -y postgresql-libs
RUN yum install -y python-psycopg2

## CHANGE PASSWORD FOR root user
RUN echo "admin" |passwd root --stdin

CMD ["/bin/bash"]
```

<br>

### HeadNode Dockerfile
---
```{.bash}
## INSTALL CENTOS
FROM centos:6.9

## INSTALL JDK 7
RUN yum update -y
RUN yum install -y  java-1.8.0-openjdk*

## MISCELANEOUS PACKAGES 
RUN yum update -y
RUN yum install  -y nano
RUN yum install  -y sudo
RUN yum -y install openssh-server; yum -y install openssh-clients
RUN yum install -y wget
RUN yum install -y tar.x86_64
RUN yum clean all

## INSTALL PYTHON RELATED PACKAGES

RUN yum -y update; yum clean all
RUN yum -y install python-devel
RUN yum -y install epel-release; yum clean all
RUN yum -y install python-pip; yum clean all
RUN wget https://bootstrap.pypa.io/2.6/get-pip.py
#RUN python get-pip.py
RUN yum install -y zlib-devel
RUN yum install -y bzip2-devel
RUN yum install -y openssl-devel
RUN yum install -y ncurses-devel
RUN yum install -y sqlite-devel
RUN yum install -y readline-devel
RUN yum install -y tk-devel
RUN yum install -y gdbm-devel
RUN yum install -y db4-devel
RUN yum install -y libpcap-devel
RUN yum install -y xz-devel
RUN yum install -y expat-devel
RUN yum install -y postgresql-libs
RUN yum install -y python-psycopg2

# INSTALL MYSQL DATABASE

RUN yum install -y mysql-server
COPY create_databases.sql /var/lib/mysql

## COPY CLOUDERA REPO FILE
WORKDIR "/root"
#RUN wget https://archive.cloudera.com/cm5/redhat/6/x86_64/cm/cloudera-manager.repo && \
#cp cloudera-manager.repo /etc/yum.repos.d/
COPY cloudera-manager.repo /etc/yum.repos.d

## INSTALL CLOUDERA MANAGER SERVER PACKAGES
RUN yum -y install openssl;yum -y install openssl-devel;yum -y install gcc;yum -y install sqlite-devel
RUN yum clean all
RUN yum install -y cloudera-manager-daemons cloudera-manager-server cloudera-manager-server-db-2 cloudera-manager-agent

## CHANGE PASSWORD FOR root user
RUN echo "admin" |passwd root --stdin

## CREATE DATABASES IN MYSQL 
RUN wget https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-5.1.45.tar.gz --no-check-certificate
RUN tar zxvf mysql-connector-java-5.1.45.tar.gz
RUN sudo mkdir -p /usr/share/java/
RUN sudo cp mysql-connector-java-5.1.45/mysql-connector-java-5.1.45-bin.jar /usr/share/java/mysql-connector-java.jar
RUN sudo service mysqld start && sudo service mysqld stop
RUN sudo /sbin/chkconfig mysqld on
COPY create_databases.sql /etc/create_databases.sql
COPY my.cnf /etc/my.cnf
RUN sudo service mysqld start && \
mysql -e "UPDATE mysql.user SET Password = PASSWORD('admin') WHERE User = 'root'" && \
mysql -e "FLUSH PRIVILEGES" && \
mysql -h "localhost" -u "root" "-padmin" < "/etc/create_databases.sql"

CMD ["/bin/bash"]
```

<br>

### Docker compose
---
```{.bash}
version: '3.4'
services:
   datanode1:
     build:
       context: ./DataNodes
       dockerfile: Dockerfile
     image: image/datanode1
     container_name: datanode1
     hostname: datanode1.cluster
     privileged: true
     networks:
       dev_cluster:
         ipv4_address: 192.168.123.5
     volumes:
       - /etc/hosts:/etc/hosts
       - /data/cloudera/datanode1/data:/data
       - /data/cloudera/datanode1/mysql:/var/lib/mysql
       - /data/cloudera/datanode1/mysql_files/my.cnf:/etc/mysql_files
     command: bash -c "sudo chkconfig sshd on && sudo service sshd start && tail -f /dev/null"
   datanode2:
     build:
       context: ./DataNodes
       dockerfile: Dockerfile
     image: image/datanode2
     container_name: datanode2
     hostname: datanode2.cluster
     privileged: true
     networks:
       dev_cluster:
         ipv4_address: 192.168.123.2
     volumes:
       - /etc/hosts:/etc/hosts
       - /data/cloudera/datanode2/data:/data
       - /data/cloudera/datanode2/mysql:/var/lib/mysql
       - /data/cloudera/datanode2/mysql_files:/etc/mysql_files
     command: bash -c "sudo chkconfig sshd on && sudo service sshd start && tail -f /dev/null"
    datanode3:
     build:
       context: ./DataNodes
       dockerfile: Dockerfile
     image: image/datanode3
     container_name: datanode3
     hostname: datanode3.cluster
     privileged: true
     networks:
       dev_cluster:
         ipv4_address: 192.168.123.3
     volumes:
       - /etc/hosts:/etc/hosts
       - /data/cloudera/datanode3/data:/data
       - /data/cloudera/datanode3/mysql:/var/lib/mysql
       - /data/cloudera/datanode3/mysql_files:/etc/mysql_files
     command: bash -c "sudo chkconfig sshd on && sudo service sshd start && tail -f /dev/null"
   headnode1:
     build:
       context: ./HeadNodes
       dockerfile: Dockerfile
     image: image/headnode1
     ports:
       - 10060:7180
       - 10068:8888
       - 10061:9092 # kafaka
       - 10062:60010 # hbase
     container_name: headnode1
     hostname: headnode1.cluster
     privileged: true
     networks:
       dev_cluster:
         ipv4_address: 192.168.123.4
     volumes:
       - /etc/hosts:/etc/hosts
       - /data/cloudera/headnode1/data:/data
       - /data/cloudera/headnode1/mysql:/var/lib/mysql
       - /data/cloudera/headnode1/mysql_files:/etc/mysql_files
     command: bash -c "sudo chkconfig sshd on && sudo service sshd start && sudo service mysqld start && sudo service cloudera-scm-server-db start && sudo service cloudera-scm-server start && tail -f /dev/null"
networks:
  dev_cluster:
    driver: bridge
    ipam:
      config:
        - subnet: 192.168.123.0/24
```

<br>

### build
---
build 스크립트를 실행 시키면 docker-compose로 DataNodes, HeadNodes에 있는 Dockfile을 각각 빌드 하게 된다

```{.bash}
sh build.sh
```

<br>

### start docker container
---
```{.bash}
sh up.sh
```

or

```{.bash}
docker-compose -f docker-compose.yml up -d
```

<br>

### stop docker container 
---
```{.bash}
docker stop {container_id}
```

<br>

### Tips
---
```text
docker-compose down을 하게 되면 docker image 파일들이 전부 삭제된다.
docker-compose 내용을 수정하려면 각 docker container를 정지 시킨다.
```

<br>

### Result
---
```{.bash}
(base) yukeun@mint:/data/cloudera$ docker ps
CONTAINER ID        IMAGE                        COMMAND                  CREATED             STATUS              PORTS                                                                                                                          NAMES
cbb6df40f43e        image/datanode1              "bash -c 'sudo chkco…"   2 hours ago         Up 2 hours                                                                                                                                         datanode1
6f24c31338bd        image/datanode3              "bash -c 'sudo chkco…"   2 hours ago         Up 2 hours                                                                                                                                         datanode3
d542f8fee35a        image/datanode2              "bash -c 'sudo chkco…"   2 hours ago         Up 2 hours                                                                                                                                         datanode2
967a8be66dc6        image/headnode1              "bash -c 'sudo chkco…"   2 hours ago         Up 2 hours          0.0.0.0:10060->7180/tcp, 0.0.0.0:10068->8888/tcp, 0.0.0.0:10063->9090/tcp, 0.0.0.0:10061->9092/tcp, 0.0.0.0:10062->60010/tcp   headnode1
```

<br>

### Install packages...
---
cloudera manager로 하둡 등 필요한 패키지를 설치 하면 된다. 
[cloudera manager로 하둡 설치하기](https://lsjsj92.tistory.com/432?category=762556) <br>  
![cloudera-docker.png]({{site.baseurl}}/img/post/docker/cloudera/cloudera-docker.png) <br>


<br>

### Data Volumes
---
```{.bash}
/data/cloudera
├── datanode1
│   ├── data
│   │   └── yarn
│   │       ├── container-logs
│   │       └── nm
│   │           ├── filecache
│   │           ├── nmPrivate [error opening dir]
│   │           └── usercache
│   ├── mysql
│   └── mysql_files
│       └── my.cnf
│           └── yarn
│               └── container-logs
├── datanode2
│   ├── data
│   │   └── yarn
│   │       ├── container-logs
│   │       └── nm
│   │           ├── filecache
│   │           ├── nmPrivate [error opening dir]
│   │           └── usercache
│   ├── mysql
│   └── mysql_files
│       └── yarn
│           └── container-logs
├── datanode3
│   ├── data
│   │   └── yarn
│   │       ├── container-logs
│   │       └── nm
│   │           ├── filecache
│   │           ├── nmPrivate [error opening dir]
│   │           └── usercache
│   ├── mysql
│   └── mysql_files
│       └── yarn
│           └── container-logs
├── etc
│   └── hosts
└── headnode1
    ├── data
    │   └── dfs
    │       ├── nn
    │       │   └── current
    │       │       ├── edits_0000000000000000001-0000000000000000001
    │       │       ├── edits_0000000000000000002-0000000000000000002
    │       │       ├── edits_inprogress_0000000000000000003
    │       │       ├── fsimage_0000000000000000000
    │       │       ├── fsimage_0000000000000000000.md5
    │       │       ├── seen_txid
    │       │       └── VERSION
    │       └── snn
    │           └── current
    ├── mysql
    │   ├── ibdata1
    │   ├── ib_logfile0
    │   ├── ib_logfile1
    │   ├── mysql [error opening dir]
    │   ├── mysql.sock
    │   └── test [error opening dir]
    └── mysql_files
```
<br>

해당 파일들은 [cloudera-docker](https://github.com/eottabom/cloudera-docker.git) 에서 확인 가능 

<br>