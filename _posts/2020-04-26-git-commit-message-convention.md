---
layout: post
title: "Git 커밋 메시지 컨벤션"
description: "Git Commit Message Convention"
excerpt: "협업과 코드 유지보수 가독성을 높히는 커밋 메시지 규칙에 대해서 알아보자"
category: Git
comments: true
---

### Git Commit Message Convention
----
커밋 메시지는 따로 정해진 룰이 없다. <br>
하지만 프로젝트 안에서 원칙을 정하고 일관적으로 작성해야 혼란을 줄일 수 있다. <br>
처음에는 많이 힘들고, 시간이 걸리겠지만... <br>
많은 연습을 해야 좋은 개발자가 되는 길이라고 생각한다... <br>
이미 커밋 메시지에 관한 좋은 내용들이 많아서 몇 가지 방법을 정리해본다. 

<br><br>

### Q. Git 커밋 메시지를 잘 쓰려고 노력하는 이유는?
----
1. 커밋 로그의 가독성
2. 협업과 리뷰 프로세스
3. 코드 유지 보수

<br><br>

### 1. The seven rules of a grate Git commit message
----
Chris Beams의 [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/)에서는 7가지의 약속을 제안하고 있다.

> Rule 1. Separate subject from body with a blank line <br>
> Rule 2. Limit the subject line to 50 characters <br>
> Rule 3. Capitalize the subject line <br>
> Rule 4. Do not end the subject line with a period <br>
> Rule 5. Use the imperative mood in the subject line <br>
> Rule 6. Warp the body at 72 characters <br>
> Rule 7. Use the body to explain what and why vs. how 

<br><br>

### 2. Udacity Git Commit Message Style Guide
----
Udacity라는 교육 기관에서는 Git Commit Message Style을 가이드로 제시하고 있다.
 
#### Message Structure
> type: subject <br>
> body <br>
> footer

#### Type
> feat : 새로운 기능 추가 <br> 
> update : 버전 등 업데이트 <br>
> fix : 수정 <br>
> fix typo : 오타 수정 <br>
> bugfix : 버그 수정 <br>
> docs : 문서 수정 <br>
> style : 코드 모캣팅, 세미콜론 누락, 코드 변경 없을 경우 <br>
> refactor : 코드 리펙토링 <br>
> test : 테스트 코드, 리펙토링 테스트 코드 추가 <br> 
> chore : 빌드 업무 수정, 패키지 수정 <br>

<br><br>

### 3. Angular JS Git Commit Message Conventions
----
Angular JS는 커밋 메시지에 대한 규칙이 정해져 있는 것 같다. 

#### Message Structure
> type(scope): subject <br>
> body <br>
> footer

#### Type
> feat(feature) <br>
> fix(bug fix) <br>
> docs(documentation) <br>
> style(formatting, missing semi colons) <br>
> refactor <br>
> test(when adding missing test) <br>
> chore(maintain) <br>


개인적으로는 Angular JS Git Commit Message Conventions 를 가장 선호한다. <br>
scope 대신에 domain 등을 쓰면 직관적으로 보일 수 있다는 장점이 있기 때문이다.. <br>
그래도 프로젝트 안에서 팀 컨벤션에 맞춰서 하는 것이 무엇보다 중요하다 :D

<br>

### Reference
----
> [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/) <br>
> [Udacity Git Commit Message Style Guide](https://udacity.github.io/git-styleguide/) <br>
> [AngularJS Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit)