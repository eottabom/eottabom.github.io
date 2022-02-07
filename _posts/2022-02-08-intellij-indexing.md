---
layout: post
title: "IntelliJ IDEA Indexing 기능 비활성화"
description: "Disable the auto-indexing function and perform manual indexing"
excerpt: "자동 인덱싱 기능을 비활성화하고 수동 인덱싱하기"
category: tools
comments: true
---

Intellij IEDA 의 indexing은 IDE 의 핵심 기능인 코드 완성, 검사, 사용법 찾기, 탐색, 구문 강조 표시 및 리팩토링을 담당한다.
프로젝트를 열 때, branch 를 전환, plug-in 을 load 하거나, 대규모 외부 파일 업데이트가 시작된다. 
하지만, indexing 이 무한 로딩이 되는 경우도 있고, 많은 시간이 걸리는 경우도 발생한다.
indexing 에 필요한 시간은 프로젝트에 따라 다르고, 프로젝트가 복잡할수록 indexing 하는데 시간이 더 걸린다.
인덱싱을 빠르게 하는 방법은 여러가지가 있지만, Auto Indexing 기능을 비활성화하고 수동 Indexing 하는 방법에 대해서 알아보자.
( IntelliJ IDEA 2021.3.2 Ultimate Edition )


<br>

### 파일 및 폴더 제외
---

동적으로 생성된 파일이나 폴더를 제외하여 인덱싱 및 전체 IDE 성능을 높일 수 있다.

**File > Settings > Build, Execution, Deployment - Compiler - Excludes** 에서 [+] 버튼을 눌러서, 폴더 또는 파일을 지정한다. <br>

![settings]({{site.baseurl}}/img/post/tools/intellij-indexing/settings.png) 

<br><br>

### 인덱싱 기능 비활성화
---

**File > Settings > Appearance & Behavior > System Settings** 에서 **synchronize external changer when switching to the IDE window or opening an editor tab** 체크 해제

![synchronize-off]({{site.baseurl}}/img/post/tools/intellij-indexing/synchronize-off.png)

<br><br>

### Invalidate Caches
---

모든 프로젝트에 대해 많은 수의 파일을 캐시하므로, 시스템 캐시가 과부하 될 수도 있다. <br>

**File > Invalidate Caches..** 

![invalidate-caches]({{site.baseurl}}/img/post/tools/intellij-indexing/invalidate-caches.png)

<br><br>

### 수동 인덱싱
---

파일 및 폴더 제외 하거나, 인덱싱 기능 비활성화를 하면 수동으로 인덱싱을 해줘야 하는 경우가 있다. <br>
ex) git pull 했을 때 새로 생긴 파일이 있을 경우 등 <br>

![invalidate-caches]({{site.baseurl}}/img/post/tools/intellij-indexing/invalidate-caches.png)

<br><br>

### Reference
----

[Intellij Indexing](https://www.jetbrains.com/help/idea/indexing.html) <br>
[Intellij invalidate Caches](https://www.jetbrains.com/help/idea/invalidate-caches.html) <br><br>