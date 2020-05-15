---
layout: post
title: "Jekyll을 이용한 Bitbucket Blog 만들기"
description: "Bitbucket에서 Jekyll blog를 pipeline로 자동 배포하기"
excerpt: "Bitbucket에서 Jekyll blog를 pipeline로 자동 배포하기"
category: Jekyll
comments: true
---

개인적으로 bitbucket을 사용하게 될 일이 있어서, bitbucket blog 기능을 검토 하게 되었다.
 
Jekyll은 Github pages의 내부 엔진이기 때문에 `{username}.github.io` 형태의 Repository를 만들고,
소스를 올려주기만 하면 호스팅 서비스를 이용할 수 있다. 하지만, bitbucket은 html 파일만을 정적으로 읽어주기 때문에
Jekyll을 이용하게 된다면, 로컬에서 build 한 후, 그 결과를 bitbucket으로 push 해주어야 한다.
 
쉽게 블로그를 만들 수 있을 것이라고 생각하였지만, 오히려 여럿이 사용하는 blog 형태라면 각자 개발 PC에 Jekyll 개발 환경이 구축되어 있어야 하는 불편함이 존재한다.

그래서 bitbucket의 장점인 pipeline을 이용하여 자동 배포하는 방법을 테스트 해보았다.

<br>

### {username}.bitbucket.io Repository 생성
---
github처럼 `{username}.bitbucket.io` Repository 를 생성한다.

<br>

### pipeline 설정
---
1. `{username}.bitbuckt.io` 저장소에 들어간다. 
2. Repository settings
3. PIPELINES 항목의 Settings
4. Enable Pipelines 활성화

![pipelines-settings]({{site.baseurl}}/img/post/jekyll/bitbucket-blog/pipelines-settings.png)

활성화를 해주면 해당 저장소의 root 디렉토리 안에 `bitbucket-pipelines.yml` 파일이 생성 된다.

![yaml]({{site.baseurl}}/img/post/jekyll/bitbucket-blog/yaml.png)
  
<br>

### bitbucket-pipelines.yml
---
```yaml
image: ruby

pipelines:
  default:
    - step:
        script:
          - git config --global user.email "snoopy12oyk@gmail.com"
          - git config --global user.name "eottabom"
          - gem install jekyll
          - bundle install
          - rm -rf .git
          - rm -rf _site
          - git clone https://eottabom:$SITE_PASSWD@bitbucket.org/eottabom/eottabom.bitbucket.io.git _site
          - bundle exec jekyll build
          - cd _site
          - git add . && git commit -m "New version - $BITBUCKET_COMMIT"
          - git push origin master
```
+ Jekyll은 Ruby Gem으로 작성된 Framework 이기 때문에 `imgea: ruby` 로 작성한다. 
+ bundle build를 위해서는 `Gemfile`과 `Gemfile.lock` 파일이 필요하다.
    - Jekyll theme를 이용하는 경우에는 두 파일이 존재한다. 
+ Jekyll은 빌드할 때 `_site` 폴더에 생성된 페이지들을 정적으로 보여주기 때문에 
먼저 생성 되어 있는 `_site`를 지워주고, git에서 이미 빌드했었던, `_site`파일을 가져 와야 한다. 
+ git clone 할때에 계정정보가 필요하다.
    - 패스워드를 직접 입력할 수도 있지만, 환경변수를 추가하여 사용할 수 있다. 
    - Repository settings > PIPELINES 하위의 Repository variables
+ 수정하고 pipeline을 확인하면 아래와 같이 나온다.

![success]({{site.baseurl}}/img/post/jekyll/bitbucket-blog/success.png)

<br>

### bitbucket.io 접속하기 
---

![bitbucket-io]({{site.baseurl}}/img/post/jekyll/bitbucket-blog/bitbucket-io.png)


### Result
bitbucket을 이용하여 Jekyll 블로그를 사용하게 되면 github보다 다소 번거로운 작업을 거치는 것 같다.
익숙하지 않아서 그런지... 원래 그런지 정확히는 조금 더 살펴봐야겠지만, Repository 의 tree 구조가 변경 되서 불편한 감이 있다.
또한, 협업으로 블로그 포스팅을 하기에는 배보다 배꼽이 큰 상황이지 않을까 하는 생각이 든다.
그래서 bitbucket - Jekyll blog를 이용 하고 싶다면, pipeline을 통해서 bitbucket에서 github로 배포하는 방법을 추천한다.

여담이지만, 개인적으로는 bitbucket 보다는 github를 선호한다. bitbucket은 구글링을 통해서 얻을 수 있는 정보가 부족한 것이 가장 큰 원인이다. 
하지만 ,bitbucket pipeline 이라는 CI/CD를 이용하면 클라우드 등으로 자동배포를 할 수 있다는 장점도 있는 것 같다.
