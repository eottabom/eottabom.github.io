---
layout: post
title: "utterances로 댓글 기능 추가하기"
description: "Adding commemt features with utterances"
excerpt: "github 이슈 기반으로 연동하는 utterances 댓글 기능 추가"
category: Etc
comments: true
---

### Utterances?
----
[Utterances](https://utteranc.es/)는 Github Issue 기반으로 comment를 작성할 수 있게 한다.

<br>
----
### Utterances의 장점과 사용하게 된 이유
----
다른 네이버나 tistory 블로그를 운영(?)하였을 때에는 자체적인 댓글 기능이 있어서 신경을 쓰지 않았다.
개발자라면 github로 블로그를 만들어야지! 라는 생각으로 시작한 만큼, 제대로 관리하기 위해서 댓글 기능을 찾아 보게 되었다.
사실 Jekyll 테마를 사용하면 블로그 주석 호스팅 서비스인 `disqus`를 이용해서 댓글 기능을 추가할 수 있다. 
하지만, `disqus`는 별개의 서비스라는 생각이 강하고, 페이지 한 눈에 보이는 경우 로드가 늦게 되는 것을 자주 확인 하였다. <br>
그래서 다른 댓글 시스템을 찾아보았더니 `utteracnes` 를 알게 되었다. 댓글을 달게 되면 Github 저장소의 Issue에 댓글이 남겨진다.
뭔가 더 개발자스러운 블로그가 되겠지...라는 생각으로 사용하게 되었다.
(사실 댓글을 쓰는 사람도 없을 것 같지만...)


### Utterances 적용
`Utterances`는 정말 간단하게 적용할 수 있다는 매력이 있다.
1. `Utterances` 사이트 에 접속 [https://utteranc.es/](https://utteranc.es/)
2. configuration 에서 repo 설정을 한다. <br>
`사용자명/저장소이름`, ex) `eottabom/eottabom.github.io`  <br>
![configuration]({{site.baseurl}}/img/post/utterances/configuration.png) 
<br>


3. Blog ↔️ Issue Mapping 설정 <br>
본인이 원하는 내용을 선택하면 된다. <br>
![issue-mapping]({{site.baseurl}}/img/post/utterances/issue-mapping.png) <br>
  (1) 이슈 제목에 페이지 경로 이름이 포함 <br>
  (2) 이슈 제목에 페이지 URL 포함 <br>
  (3) 이슈 제목에 페이지 제목이 포함 <br>
  (4) 이슈 제목은 og: title 페이지를 포함 <br>
  (5) 특정 번호  <br>
  (6) 이슈 제목에는 특정 용어가 포함 <br><br>
4. 해당 스크립트 복사 후 post 레이 아웃등 원하는 곳에 `include`
![copy-script]({{site.baseurl}}/img/post/utterances/copy-script.png) <br>
