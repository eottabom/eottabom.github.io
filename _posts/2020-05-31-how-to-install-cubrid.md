---
layout: post
title: "CUBRID 설치"
description: "How to install CUBRID"
excerpt: "ORDBMS 인 CUBRID 를 설치해보자"
category: Database
comments: true
---

`CUBRID`는 **객체 관계형 데이터베이스 관리 시스템(ORDBMS)** 으로서, 데이터베이스 서버, 브로커, CUBRID 매니저로 구성 되어 있고,
사용자가 편리하게 사용할 수 있는 다양한 기능을 제공한다. 무엇보다 설치 및 실행, HA 구성 등이 상당히 간단하고, 마이그레이션 또한 쉽다.
개인적으로 Database는 크게 가리지는 않지만, 선택권이 주어진다면, `CUBRID`를 선택할 것 같다.(물론, 오라클을 제외한다면...) 이번 포스트에서는 
`CUBRID` 설치, 실행, 설정하는 방법에 대해서 알아보도록 하자. 

<br>

### 1. Cubrid 설치 / 실행
---
+ [다운로드 페이지](http://www.cubrid.com/zbxe/download)
+ [다운로드 페이지](http://www.cubrid.org//linux/64-bit/engine)
+ [운영 가이드](http://www.cubrid.org/manual/ko/9.3.0/quick_start.html#id2)

```{.bash}
[root@localhost] cd /data
[root@localhost] wget http://ftp.cubrid.org/CUBRID_Engine/10.0/CUBRID-10.0.0.1376-linux.x86_64.sh
[root@localhost] sh CUBRID-10.0.0.1376-linux.x86_64.sh
  
## install message
# Do you agree to the above license terms? (yes or no) : yes
# Do you want to install this software(CUBRID) to the default(/data/CUBRID) directory? (yes or no) [Default: yes] : yes
# Do you want to continue? (yes or no) [Default: yes] : yes
# CUBRID has been successfully installed.
[root@localhost] . /root/.cubrid.sh

#1. 큐브리드 서비스를 시작합니다.
[root@localhost] cubrid service start
 ## start messages
@ cubrid master start
++ cubrid master start: success
@ cubrid broker start
++ cubrid broker start: success
@ cubrid manager server start
++ cubrid manager server start: success
 
# 큐브리드 서비스의 상태를 확인합니다.
$> cubrid service status
@ cubrid master status
++ cubrid master (이)가 수행되고 있습니다.
@ cubrid server status
@ cubrid broker status
NAME PID PORT AS JQ REQ TPS AUTO SES SQLL CONN
===================================================================
* query_editorOFF
* broker1 30973 43000 5 0 0 --- ON OFF ON:A AUTO
@ cubrid manager server status
++ cubrid manager server (이)가 수행되고 있습니다.
@ cubrid replication status
```

<br>

### 2. 데이터베이스 생성
---

```{.bash}
#cd /data/CUBRID/databases
#mkdir test-db
#cd /data/CUBRID/databases/test-db
#cubrid createdb test-db en_US
#ls -l
-rw-------. 1 root root 536870912 Dec 26 10:36 test-db_lgar_t
-rw-------. 1 root root 536870912 Dec 26 10:39 test-db_lgat
-rw-------. 1 root root        43 Dec 26 10:18 test-db_lgat__lock
-rw-------. 1 root root       220 Dec 26 10:04 test-db_lginf
-rw-------. 1 root root       293 Dec 26 10:04 test-db_vinf
 
#vi ../databases.txt
#db-name        vol-path                db-host         log-path                lob-base-path
test-db         /data/CUBRID/databases/test-db     localhost       /data/CUBRID/databases/test-db     file:/data/CUBRID/databases/test-db/lob
demodb          /data/CUBRID/databases/demodb   localhost       /data/CUBRID/databases/demodb   file:/data/CUBRID/databases/demodb/lob
 
# 데이터베이스 시작
#cubrid server start test-db
```

<br>

### 3. iptables 설정
---

실제 서비스를 하기 위해서는 ***/etc/sysconfig/iptables*** 에서 해당 포트를 열어 줘야 한다.

```{.bash}
#-A INPUT -m state --state NEW -m tcp -p tcp --dport 8001 -j ACCEPT
#-A INPUT -m state --state NEW -m tcp -p tcp --dport 8002 -j ACCEPT
#-A INPUT -m state --state NEW -m tcp -p tcp --dport 1523 -j ACCEPT
#-A INPUT -m state --state NEW -m tcp -p tcp --dport 30000:30040 -j ACCEPT
#-A INPUT -m state --state NEW -m tcp -p tcp --dport 33000:33040 -j ACCEPT
```

+ 8001 : 큐브리드 매니저 서버와 클라이언트 간의 통신 포트
+ 8002 : 연결시 실사용 포트 
+ 1523 : 마스터 포트
+ 30000, 33000 : 브로커 포트

<br>

> 참고 :  [CUBRID 포트 정리](http://www.cubrid.com/faq/3794356)

<br>

### 4. Windows 큐브리드 설치 / 설정 / 계정 생성
---

<br>

#### 설치 

+  [다운로드 페이지](http://www.cubrid.com/downloads)

<br>

#### 설정 

![settings]({{site.baseurl}}/img/post/database/cubrid/cubrid-1.png)

+ 관리 모드 선택(Cubrid 매니저는 관리모드 / 질의모드가 있다.)
+ 호스트 추가
+ 호스트 정보 추가 연결 포트는 8001 / CM계정은 admin/admin
+ 로그인 후 해당 서버 우클릭 후 관리자 패스워드 변경

<br>

#### 계정 생성

<br>

step1) 먼저 dba 계정으로 로그인(초기 비밀번호 없음) <br>
![dba-login]({{site.baseurl}}/img/post/database/cubrid/cubrid-2.png)

<br>

step2) 사용자 계정 생성 <br>
![account]({{site.baseurl}}/img/post/database/cubrid/cubrid-3.png)

<br>

step3) 계정 설정 <br>
 ![account-settings]({{site.baseurl}}/img/post/database/cubrid/cubrid-4.png)


<br>

<br>