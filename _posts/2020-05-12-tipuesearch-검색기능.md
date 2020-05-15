---
layout: post
title: "Tipue Search로 블로그 검색 기능 추가하기"
description: "Tipue Search로 블로그 내의 컨텐츠를 검색하는 기능 추가하기"
excerpt: "Tipue Search로 블로그 내의 컨텐츠를 검색하는 기능 추가하기"
category: Jekyll
comments: true
---

`jekyll theme`를 이용하다보니, 문득 많은 컨텐츠가 있으면, 옛날의 컨텐츠를 어떻게 찾지...? 라는 생각이 들었다.
타 블로그 들은 개별적인 검색 기능이 있어서 큰 고민을 하지 않았다. 내가 생각한 것은 이미 수 많은 사람들이 고민하고 이를 해결 했을 것이라는 진리...는 
역시나 변함이 없었다... [TipueSearch](https://tipue.com/search/) 라는 jQuery plugin 인 존재 하고 있었고, 
jQuery를 지원하는 브라우저에서 정상적으로 동작한다. 다른 Database 등의 기능이 필요 없다. 속도도 빠른 편이며, 무엇보다 오픈 소스이다.
`TipueSearch` 를 블로그에 적용하는 방법에 대해서 알아보고, 실제로 적용 시켜보자. 

<br>


### step1) [git](https://github.com/jekylltools/jekyll-tipue-search)에서 해당 소스를 내려받는다.
----

### step2) `search.html` 파일을 자신의 블로그 프로젝트의 최상위 디렉토리로 복사한다. 
----
ex)
```
eottabom.github.io
├── _includes
├── _layouts
...
├── `search.html`
...
```
### step3) `search.html` 파일을 수정한다.
----
ex)
```html
$(document).ready(function() {
    $('#tipue_search_input').tipuesearch({
        'wholeWords': false,
        'showTime': false,
        'minimumLength': 1
  });
});
```
옵션 중에서 본인이 원하는 것을 찾아서 적용 해주면 된다.
+ contextBuffer: true 
    - 컨텍스트에서 검색어 앞에 표시 되는 문자수(기본 값 60)
+ contextLength: true
    - 최소 문자수(기본 값 60)
+ contextStart: true
    - 검색어 앞에 설명 텍스트의 시작 위치가 컨텍스로 표시(기본 값 90)
+ debug: true
    - 검색 결과 표시(기본 값 false)
+ descriptiveWords
    - 검색에서 설명 텍스트에 표시되는 단어 수(기본 값 25)
+ footerPages
    - 페이지 바닥 글에 표시 되는 최대 페이지 선택 수(기본 값 3)
+ highlightTerms: true
    - 검색어가 강조 표시(기본 값 true)
+ imageZoom: true
    - true : 이미지 클릭시 이미지 미리보기 표시 
    - false : 이미지 클릭시 결과로 이동
+ minimumLength
    - 검색 쿼리의 최소 문자 길이(기본 값은 3)
+ newWindow: true
    - 검색 결과가 새 브라우저 탭에서 열림.(기본 값은 false)
+ show
    - 표시 되는 결과 수(기본 값은 10)
+ showContext: true
    - 검색어가 설명 텍스트에 컨텍스트로 표시(기본 값은 true)
+ showRelated: true
    - 관련 검색이 표시(기본 값은 true)
+ showTime
    - 검색 완료시 걸린 시간 표시(기본 값은 true)
+ showTitleCount
    - 문서 제목에 검색 결과 수가 표시(기본 값은 true)
+ showURL: true
    - 각 검색 결과에 URL이 표시(기본 값은 true)
+ wholeWords: true
    - 영어만 검색(기본 값은 true) 
    - 영어 이외의 언어를 사용하는 경우 false로 설정
<br>
<br>

### step4) `/assets/` 안에 있는 `tipuesearch` 폴더 역시 자신의 블로그 프로젝트의 최상위 디렉토리로 복사한다.
----
ex)
```
eottabom.github.io
├── _includes
├── _layouts
├── `assets`
     └── tipuesearch
         ├── css
         │   ├── normalize.css
         │   └── tipuesearch.css
         ├── search.png
         ├── tipuesearch.min.js
         ├── tipuesearch_content.js
         └── tipuesearch_set.js
├── search.html
...
```
<br>

### step5) `_config.yml` 파일을 수정한다.
----
```yaml
tipue_search:
  include:
    pages: false
    collections: []
  exclude:
    files: [search.html, index.html, tags.html]
    categories: []
    tags: []
```
<br>

### step6) `head.html`에서 `tipuesearch` jQuery plugin 과 css를 추가해준다.
----
```html
<!-- tipuesearch -->
<link rel="stylesheet" href="/assets/tipuesearch/css/tipuesearch.css">
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="/assets/tipuesearch/tipuesearch_content.js"></script>
<script src="/assets/tipuesearch/tipuesearch_set.js"></script>
<script src="/assets/tipuesearch/tipuesearch.min.js"></script>
```
<br>

### step7) 적용하고 싶은 html 파일에 tags 추가
---- 
적절히 원하는 대로 커스터마이징 하면 될 것 같다.
```html
<form action="/search">
    <div class="tipue_search_left">
        <img src="/assets/tipuesearch/search.png" class="tipue_search_icon">
    </div>
    <div class="tipue_search_right">
        <input type="text" name="q" id="tipue_search_input" pattern=".{1,}" title="At least 1 characters" required></div>
    <div style="clear: both;"></div>
 </form>
```

