---
layout: post
title: "Docker 기반 Hadoop 환경 구축"
description: "3개의 DataNode와 1개의 NameNode가 각각의 Container로 구성된 Docker 환경을 구성"
excerpt: "3개의 DataNode와 1개의 NameNode가 각각의 Container로 구성된 Docker 환경을 구성"
category: Docker
comments: true
---

<br><br>

### Summary
---
`3개의 DataNode`와 `1개의 NameNode`가 각각의 Container로 구성된 Hadoop(v.2.9.2) Docker 환경을 구성한다. 
각 Hadoop server가 실행 중인 Container 간에 Data 공유가 필요하기 때문에 `volume`을 이용하여 Data를 관리한다.
사실 `bind mounts`, `tmpfs` 방식으로 Data를 안전하게 존속시킬 수 있는 방식이 있으나, 특별한 경우를 제외하고 `volume`을 사용하는 것을 추천한다.

<br>
Container의 Writable Layer에서 Data를 저장할 수 있지만, 아래와 같은 문제점으로 별도로 Data를 관리하는 방법을 추천한다.

```text
1. Container가 삭제되면 Data 삭제
2. 다른 프로세스에서 Container에 저장된 Data를 사용하기 어려움
3. Data를 다른 곳으로 쉽게 옮길 수 없음
    : Container의 Writable Layer에는 Container가 실행 중인 Host Machine과 밀접하게 연결되어 있기 때문에..
4. File System은 Host File System에 직접 쓰는 data volume 보다 성능이 떨어짐
    : Container의 Writable Layer에 Data를 저장하기 위해서는 File System을 관리하는 Storage Driver가 필요하고, 
Storage Driver는 Linux 커널을 사용하여 공용 File System을 제공
```

<br>

### Tree structures
---
+ hadoop의 기본 환경 구성하는 base image `build`, base image 를 기반으로 namenode, 
datanode의 Dockerfile을 작성하여 직접 image를 `build`, `docker-compose`를 활용해 배포하는 방법을 활용한다.

```{.bash}
├── base
│   ├── Dockerfile
│   └── core-site.xml
├── datanode
│   ├── Dockerfile
│   ├── hdfs-site.xml
│   └── start.sh
├── docker-compose.xml
└── namenode
    ├── Dockerfile
    ├── hdfs-site.xml
    └── start.sh
```

<br>

### Base
---

#### 1. Base Dockerfile

```{.bash}
# 기반이 되는 이미지를 설정. ubuntu 18 기반인 zulu의 openjdk 8버전을 선택
FROM azul/zulu-openjdk:8
RUN sed -i 's/archive.ubuntu.com/ftp.neowiz.com/g' /etc/apt/sources.list
 
# 바이너리를 내려받기 위해 설치
RUN apt-get update && apt-get install -y curl openssh-server wget vim
 
ENV HADOOP_VERSION=2.9.2
ENV HADOOP_URL=http://mirror.apache-kr.org/hadoop/common/hadoop-$HADOOP_VERSION/hadoop-$HADOOP_VERSION.tar.gz
 
# SSH 관련 설정
RUN mkdir /var/run/sshd
RUN sed -ri 's/^#?PermitRootLogin\s+.*/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -ri 's/UsePAM yes/#UsePAM yes/g' /etc/ssh/sshd_config
 
# Hadoop 내려받고 /opt/hadoop에 압축 해제
RUN curl -fSL "$HADOOP_URL" -o /tmp/hadoop.tar.gz \
    && tar -xvf /tmp/hadoop.tar.gz -C /opt/ \
    && rm /tmp/hadoop.tar.gz
 
# 데이터 디렉토리 생성 및 설정 폴더의 심볼릭 링크 생성
RUN ln -s /opt/hadoop-$HADOOP_VERSION /opt/hadoop \
    && mkdir /opt/hadoop/dfs \
    && ln -s /opt/hadoop-$HADOOP_VERSION/etc/hadoop /etc/hadoop \
    && rm -rf /opt/hadoop/share/doc
 
# 로컬의 core-site.xml 파일을 복제
ADD core-site.xml /etc/hadoop/
 
# 실행 환경에 필요한 환경 변수 등록
ENV HADOOP_PREFIX /opt/hadoop
ENV HADOOP_CONF_DIR /etc/hadoop
ENV PATH $HADOOP_PREFIX/bin/:$PATH
ENV JAVA_HOME /usr/lib/jvm/zulu-8-amd64
EXPOSE 22
CMD /usr/sbin/sshd -D
```

<br>

#### 2. Base core-site.xml
+ fs.defaultFS : Namenode의 위치를 찾는 설정으로 읽기 / 쓰기 요청 할 때 사용하는 항목
+ URI hostname : Namenode container의 host name 지정

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://namenode:9000/</value>
    <description>NameNode URI
    </description>
  </property>
</configuration>
```
<br>

#### 3. Build
```{.bash}
docker build -t hadoop-base:2.9.2 .
```

<br>

### Namenode
---
+ base image를 기반으로 Namenode Container 빌드하기 위한 환경 구성
+ Namenode 용 hdfs-site.xml
+ FsImage, EditLog 저장하기 위한 로컬 파일 시스템 경로

<br>

#### 1. Dockerfile
```{.bash}
# 로컬에 생성한 base 이미지
FROM hadoop-base:2.9.2
 
# NameNode Web UI 응답 여부를 통해 Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD curl -f http://localhost:50070/ || exit 1
 
# 설정 파일 복제
ADD hdfs-site.xml /etc/hadoop/
 
# FsImage, EditLog 파일 경로를 volume으로 연결
RUN mkdir /opt/hadoop/dfs/name
VOLUME /opt/hadoop/dfs/name
 
# 실행 스크립트 복제
ADD start.sh /start.sh
RUN chmod a+x /start.sh
 
# NameNode의 HTTP, IPC 포트 노출
EXPOSE 50070 9000
 
# 시작 명령어 등록
CMD ["/start.sh", "/opt/hadoop/dfs/name", "/usr/sbin/sshd"]
```
<br>

#### 2. Namenode hdfs-site.xml
+ dfs.namenode.name.dir : FSImage / EditLog 파일을 저장하는 경로
+ dfs.blocksize : HDFS 파일 블록의 크기
+ 이외의 설정은[하둡 문서](https://hadoop.apache.org/docs/r2.9.2/hadoop-project-dist/hadoop-hdfs/hdfs-default.xml)에서 확인

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
  <property>
    <name>dfs.namenode.name.dir</name>
    <value>file:///opt/hadoop/dfs/name</value>
  </property>
  <property>
    <name>dfs.blocksize</name>
    <value>10485760</value>
  </property>
  <property>
    <name>dfs.client.use.datanode.hostname</name>
    <value>true</value>
  </property>
  <property>
    <name>dfs.namenode.rpc-bind-host</name>
    <value>0.0.0.0</value>
  </property>
  <property>
    <name>dfs.namenode.servicerpc-bind-host</name>
    <value>0.0.0.0</value>
  </property>
  <property>
    <name>dfs.namenode.http-bind-host</name>
    <value>0.0.0.0</value>
  </property>
  <property>
    <name>dfs.namenode.https-bind-host</name>
    <value>0.0.0.0</value>
  </property>
</configuration>
```

<br>

#### 3. Namenode start.sh
+ 시작 스크립트인 Start.sh에서는 Namenode의 네임스페이스가 포맷되었는지 확인하고, 포맷되기 전이라면 구동전 포맷을 먼저 진행

```{.bash}
#!/bin/bash
 
# 네임스페이스 디렉토리를 입력받아서 
NAME_DIR=$1
echo $NAME_DIR
 
# 비어있지 않다면 이미 포맷된 것이므로 건너뛰고
if [ "$(ls -A $NAME_DIR)" ]; then
  echo "NameNode is already formatted."
 
# 비어있다면 포맷을 진행
else
  echo "Format NameNode."
  $HADOOP_PREFIX/bin/hdfs --config $HADOOP_CONF_DIR namenode -format
fi
 
# NameNode 기동
$HADOOP_PREFIX/bin/hdfs --config $HADOOP_CONF_DIR namenode
```

<br>

#### 4. Build
```{.bash}
sudo docker build -t hadoop-basename:2.9.2 .
```

<br>

### DataNode
---
+ 파일 블록을 저장하는 로컬 파일 시스템 경로
+ Datanode용 hdfs-site.xml 설정

<br>

#### 1. Dockerfile
```{.bash}
FROM hadoop-base:2.9.2
 
# DataNode Web UI 응답 여부를 통해 Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3  CMD curl -f http://localhost:50075/ || exit 1
RUN mkdir /opt/hadoop/dfs/data
VOLUME /opt/hadoop/dfs/data
ADD start.sh /start.sh
RUN chmod a+x /start.sh
 
# WebUI, 데이터전송
EXPOSE 50075 50010
CMD ["/start.sh", "/usr/sbin/sshd"]
``` 

<br>

#### 2. Datanode hdfs-site.xml
```xml
<configuration>
  <property>
    <name>dfs.datanode.data.dir</name>
    <value>file:///opt/hadoop/dfs/data</value>
  </property>
  <property>
    <name>dfs.blocksize</name>
    <value>10485760</value>
  </property>
  <property>
    <name>dfs.datanode.use.datanode.hostname</name>
    <value>true</value>
  </property>
</configuration>
```

<br>

#### 3. Datanode start.sh
```{.bash}
#!/bin/sh
$HADOOP_PREFIX/bin/hdfs --config $HADOOP_CONF_DIR datanode
```

<br>

#### 4. Build
```{.bash}
sudo docker build -t hadoop-datanode:2.9.2 .
```
 
<br>

### Docker-compose
```{.bash}
version: "3.4"
# 이미지와 네트워크 정보에 대한 base service를 지정
x-datanode_base: &datanode_base
  image: hadoop-datanode:2.9.2
  networks:
    - bridge
services:
  namenode:
    image: hadoop-namenode:2.9.2
    container_name: namenode
    hostname: namenode
    ports:
      - 50070:50070
            #- 9870:9870
      - 9000:9000
    volumes:
      - /data/hadoop_data/name:/opt/hadoop/dfs/name
      - /tmp:/tmp
    networks:
      - bridge
  datanode01:
    <<: *datanode_base
    container_name: datanode01
    hostname: datanode01
    volumes:
      - /data/hadoop_data/name:/opt/hadoop/dfs/data
  datanode02:
    <<: *datanode_base
    container_name: datanode02
    hostname: datanode02
    volumes:
      - /data/hadoop_data/name:/opt/hadoop/dfs/data
  datanode03:
    <<: *datanode_base
    container_name: datanode03
    hostname: datanode03
    volumes:
      - /data/hadoop_data/name:/opt/hadoop/dfs/data
volumes:
  namenode:
  datanode01:
  datanode02:
  datanode03:
```

#### start
```{.bash}
sudo docker-compose -f docker-compose.yml up -d
```

<br>

### Hadoop 3.0.0-Alpha 1 이후 변경된 포트
---
+ Hadoop 2.x 버전에서 Hadoop 3.0.0-Alpha 1 으로 버전 업이 되면서 포트들이 많이 변경 되었는데, 참고하면 될 것 같다. <br><br>

|구분|Hadoop 2.x|Hadoop 3.x|
|--|--|--|
|Namenode|50470|9871|
||50070|9870|
||8020|9820|
|Secondary NN|50091|9869|
||50090|9868|
|Datanode|50020|9867|
||50475|9865|
||50075|9864|

<br>

해당 파일들은 [hadoop-docker](https://github.com/eottabom/hadoop-docker.git) 에서 확인 가능 

<br>