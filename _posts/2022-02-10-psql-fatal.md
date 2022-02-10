---
layout: post
title: "PostgreSQL psql:FATAL:role 'postgres' does not exist 해결 방법"
description: "PostgreSQL psql:FATAL:role 'postgres' does not exist solution"
excerpt: "Docker 로 PostgreSQL 를 실행했을 때 psql 로 DB 접속시 발생하는 오류 해결 방법"
category: database
comments: true
---

PostgreSQL 을 k8s 환경에서 install 하거나, docker 로 띄웠을 경우 DB에 접속하기 위해서 `psql` 명령어를 입력하면 오류가 발생한다. <br>


```shell
psql: FATAL: role "postgres" does not exist
```

<br>

postgres 는 Default User Name 이 `postgres` 라서 유저를 명시적으로 적어야 한다. <br>

```shell
psql --username [username] --dbname [dbname]
```

<br><br>