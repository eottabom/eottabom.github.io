---
layout: post
title: "Git 브랜칭 전략"
description: "Git branch management strategy"
excerpt: "Git을 기반으로 프로젝트를 효율적으로 관리하기"
category: Git
comments: true
---

### Git branch management strategy
많은 개발자들이 Git을 접해보았을 것이지만, Git 브랜칭 전략에 대해서는 다소 생소할 것이다. <br>
개인이 사용할 때에는 큰 지장은 없겠지만, 협업을 할 때에는 많은 이슈를 발생시킬 가능성이 존재한다. <br>
무분별하게 생겨나는 branch로 인해서 어느 branch가 최신인지 헷갈릴 수도 있고, <br>
급하게 수정 후 배포를 해야하는 경우, 시간이 지연되는 등의 문제가 생길 수 있다. <br>
따라서, 지속적 통합/배포(CI/CD)를 위해서는 Git Workflow 전략이 필수적이라고 생각한다. <br><br>

대표적인 branching 전략에는 다음과 같은 세가지가 있다. <br>
1. Git Flow
2. Github Flow 
3. Gitlab Flow

<br>
----
### 1. Git flow
`Vincent Driessen`이 약 10년 전 제안한 Git의 workflow 디자인에 기반한 브랜칭 모델이다. <br>
현재는 Git으로 개발할 때 거의 표준과 같이 사용되는 방법론이다. <br>

`Vincent Driessen`은 총 5가지의 브랜치를 이용해 운영하는 것을 제안하였다.
> master : 기준이 되는 브랜치로 제품을 배포하는 브랜치 <br>
> develop : 개발 브랜치, 이 브랜치를 기준으로 각자 작업한 기능들을 merge <br>
> feature : 단위 기능을 개발하는 브랜치, 기능 개발 완료시 develop 브랜치에 merge <br>
> release : 배포를 위해 master 브랜치고 보내기 전에 먼저 QA를 위한 브랜치 <br>
> hotfix : master 브랜치로 배포 후 버그가 생겼을 때 긴급 수정하는 브랜치 <br>

Git flow에 대해서 검색하면 많이 접할 수 있는, Git flow 흐름에 관한 이미지이다. <br>

<img class="post_image" src="{{site.baseurl}}/img/post/gitBranch/gitflow.png" />

이 흐름에 대한 순서를 요약하면...
> 1. 기준이 되는 `master` 브랜치에 `develop` 브랜치를 생성한다. <br>
> 2. `feature-*` 브랜치들을 나누어서 개발자들이 기능단위로 개발을 진행한다. <br>
> 3. 각 기능 단위로 개발이 완료가 되면, `develop` 브랜치에 merge <br>
> 4. 모든 개발이 완료가 되면, `release` 브랜치를 통해 QA를 진행한다. <br>
> 5. QA가 끝나면 `master` 브랜치로 merge 하고, Tagging으로 버전을 관리한다. <br>
> 6. 제품을 release 시킨 후 발견 된 급한 버그는 `hotfix` 브랜치를 생성하고, 수정 후 다시 `master/develop` 브랜치에 merge 한다. <br>
> 7. 수정된 버전을 Tag로 다시 버전 관리를 진행한다. 

위의 순서를 반복적으로 진행하면서, Git workflow를 관리해주는 원리이다.

<br>
----
### 2. Github flow

<img class="post_image" src="{{site.baseurl}}/img/post/gitBranch/github-flow.png" />

Github flow는 `master` 브랜치가 릴리즈에 있어서 절대적인 역할을 한다. <br>
`master` 브랜치는 항상 최신 버전을 유지하고, 무조건적으로 stable 한 상태를 담보한다. <br>
`develop` 브랜치가 존재하지 않고, `feature` 브랜치는 `master` 브랜치에서 생성되고 병합한다. <br>
병합 할 때는 무조건 pull request를 하여 코드에 대한 검토를 받도록 한다. <br>
github flow는 CI가 필수적이다. <br>

<br>
----
### 3. Gitlab flow

<img class="post_image" src="{{site.baseurl}}/img/post/gitBranch/gitlab-flow.png" />

`production` 브랜치는 gitflow의 `master` 브랜치와 같은 역할을 한다. <br>
`preduction` 브랜치가 항상 최신이지 않아도 된다는 점에서 차이점이고, <br>
그 외에는 병합 할 때 pull request를 하여 코드에 대한 검토를 받는 등의 기능들은 Github flow와 유사한 특징을 가진다. <br>
gitflow와 github flow의 특징들만 가져온 느낌...

어느 workflow가 좋다고 말할 수는 없으며, 각 프로젝트의 상황과 팀의 상황에 따라서 달라질 수 있다. <br>
단, 이런 Git branching 전략이 있다는 것을 알고, 상황에 맞춰서 활용 할 줄 아는 것은 개발자의 역량이지 않을까... 

<br>
----
### Reference
> [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/) <br>
> [Understanding the GitHub flow](https://guides.github.com/introduction/flow/) <br>
> [Introduction to GitLab Flow](https://docs.gitlab.com/ee/topics/gitlab_flow.html)