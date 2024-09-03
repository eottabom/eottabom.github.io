---
layout: post
title: "컴파일 과정과 Lombok 의 동작 원리"
description: "Compilation Process and Lombok Principles of Operation"
excerpt: "컴파일 과정과 Lombok 의 동작 원리에 대해서 알아보자"
category: [Java, Lombok]
comments: true
---


<div id ="notice--info">

    <p style='margin-top:1em;'>
        <b>🐱 Meow, meow </b>
        Lombok 은 개발자가 코드에서 사용할 수 있는 다양한 어노테이션을 제공하는 유용한 라이브러리이다. <br>
        그렇다면, Lombok 은 어떻게 동작할까?
    </p>

</div>

<br>

## 컴파일 과정에서 Lombok 동작 Flow

---

<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/lombok/lombok-process.png" alt="lombok-process" />
</div>

<br>

전체적인 흐름은 위와 같고, Lombok 은 컴파일 단계에서 `Annotation Processing` 에서 수행된다.

<br><br>

## Lombok 동작 원리

---

#### 1. javac 가 소스 파일을 파싱하여 AST(Abstract Syntax Tree, 추상 구문 트리) 를 만든다.
* **소스 파일 읽기**
    * `javac` (자바 컴파일러)는 먼저 입력된 자바 소스 파일(`.java` 확장자를 가진 일반 텍스트 파일)을 읽는다.
* **파싱(Parsing)**
    * 소스 파일을 읽은 후 `javac` 는 이를 구문 분석(parser) 를 통해 AST 로 변환한다.


<div id="notice--note">

    📘 <span style="font-weight: bold!important;"> Note </span> <br> 
    소스 코드는 문법적인 구조로 변환되어 트리 형태로 나타난다. <br>
    예를 들어, `int a = b + 5;` 라는 코드가 있을 때, <br>
    AST 로 변환하면 `ASSIGN`(할당), `VAR a`(변수), `ADD`(덧셈), `VAR b`(변수), `CONST 5`(상수) 등의 노드로 구성된 트리가 만들어진다.

</div>

<pre class="prettyprint lang-java">
       ASSIGN
      /      \
   VAR a      ADD
            /    \
         VAR b   CONST 5
</pre>

<div id="notice--note">

    📘 <span style="font-weight: bold!important;"> Note - AST(Abstract Syntax Tree, 추상 구문 트리) 의 구성</span> <br> 
    노드(Node) : AST 의 각 노드는 프로그램의 특정 요소(예: 변수, 연산자, 함수 호출 등)을 나타냄 <br>
    리프(Leaf) : 리프는 더 이상 나뉘지 않는 트리의 끝 부분으로, 보통 변수명이나 상수와 같은 기본 단위를 나타냄 <br>
    자식 노드(Children) : 각 노드는 다른 여러 자식 노드를 가질 수 있으며, 이는 해당 요소의 구성 요소를 나타냄

</div>

<br>

#### 2. Lombok 의 Annotation Processor 가 AST 를 수정하고 새로운 노드(소스 코드)를 추가한다.
* **Annotation Processing**
  * `javac`는 소스 코드를 컴파일하는 과정에서 어노테이션을 처리하기 위해서 `Annotaion Processing` 단계를 거친다. Lombok 은 이 과정에서 동작한다.
* **Lombok 의 Annotation Processor**
  * Lombok 은 자체적으로 제공하는 `Annotation Processor` 를 통해 AST 를 수정하고,
* **Lombok 의 Annotation handler**
  * `Annotation handler` 로 어노테이션에 따라 필요한 코드를 추가하고, 이로 인해 AST 가 다시 수정된다.
* **AST 수정**
  * Lombok 은 AST 에서 특정 위치를 찾아 노드를 추가하거나 기존 노드를 수정한다.
  * 예를 들어, `@Getter` 가 필드 `private int age;` 에 붙어 있으면, Lombok 은 해당 클래스의 AST 에 `public int getAge() { return this.age; }` 라는 메서드 노드를 삽입한다.

<div id="notice--note">

    📘 <span style="font-weight: bold!important;"> Note </span> <br> 
    이 과정에서 `javac` (컴파일러) 는 Lombok 이 지정한 어노테이션을 붙은 코드를 찾고, Lombok 은 해당 부분의 AST(Abstract Syntax Tree, 추상 구문 트리) 를 조작한다. <br>
    예를 들어서 `@Getter` 어노테이션이 있는 필드에 대해서 Lombok 은 해당 클래스에 자동으로 getter 메서드를 생성하고, <br>
    AST(Abstract Syntax Tree, 추상 구문 트리) 에 새로운 메서드 노드를 추가한다.

</div>

<br>

#### 3. javac 는 Lombok 에 의해 수정된 AST 를 기반으로 Byte Code 를 생성한다.
Lombok 의 Annotation Processing 이 완료된 직후의 시점.  
* **Byte Code 생성**
  * 수정된 AST 를 기반으로 `javac` 는 바이트 코드를 생성하고 `.class` 파일로 저장한다.
  * Lombok 에 의해 추가된 코드도 이 과정에서 바이트 코드로 변환된다

<div id="notice--note">

    📘 <span style="font-weight: bold!important;"> Note</span> <br>
    최종 바이트 코드는 자바 프로그램의 실행 논리를 포함하며, 런타임이 JVM 이 이 바이트 코드를 실행한다. <br>
    Lombok 에 의해 생성된 메서드나 필드 역시 바이트 코드로 변환되어 최종 `.class` 파일에 포함된다.

</div>

<br>

#### 4. 컴파일 과정에서의 Annotation Processing 및 Syntax Tree 접근
* **Annotation Processing 시작**
  * 컴파일 과정에서 `Enter` 및 `MemberEnter` 단계가 완료된 후, `Annotation Processing `이 시작되어 Lombok 이 AST 를 수정한다.
* **Syntax Tree 접근**
  * `com.sun.source.tree.*` 패키지를 통해 생성된 Syntax Tree 에 접근할 수 있다.
* **Data Model**
  * `com.sun.tools.javac.code.*` 패키지 내 클래스들은 자바 코드의 의미론적 정보를 제공하며, 이는 `Enter`, `MemberEnter`, `Annotation Visitor` 단계에서 생성된다.
* **컴파일러 재시작**
  * `Annotation Processing` 중에 새로운 파일이 생성될 경우, 컴파일이 재시작 될 수 있다.


<br><br><br>

## 컴파일 과정의 주요 단계

---

#### 1. 준비 및 초기화
* **준비 프로세스**
  * 컴파일러의 초기화 단계에서 플러그인 주석 프로세서가 초기화된다.

<br>

#### 2. 구문 분석 (Parsing)
* **Parse 단계**
  * 자바 소스 파일을 읽고 구문 분석하여 토큰 시퀀스 결과를 추상 구문 트리(AST) 노드에 매핑한다.
  * Lexical Analysis: 문자 스트림을 토큰(심볼)으로 변환한다.
  * Parsing: 토큰 순서에 따라 추상 구문 트리를 구성하고, 이를 기반으로 후속 작업을 위한 구문 트리를 구축한다.

<br>

#### 3. Enter 단계
* **EnterTrees**
  * 심볼 테이블을 채우는 과정으로, 클래스와 인터페이스의 기본 구조를 파악하고 심볼 테이블을 구축한다.
  * 첫 번째 단계: 모든 클래스를 해당 범위에 등록한다.
  * 두 번째 단계: 각 클래스 심볼의 MemberEnter 객체를 사용하여 클래스, 슈퍼 클래스, 인터페이스의 매개변수를 결정한다.

<br>

#### 4. MemberEnter 단계
* **클래스 멤버 스캔**
  * 각 클래스의 멤버들(필드, 메서드, 생성자 등)을 스캔하고, 이들에 대한 심볼 정보를 심볼 테이블에 등록한다.
  * 타입 체킹 및 상수 폴딩
  * 멤버들의 타입을 검증하고, 상수 값을 계산하여 최적화한다.

<br>

#### 5. Annotation Visitor 및 Annotation Processing
* **Annotate 단계**
  * 어노테이션을 스캔하고, 어노테이션 프로세서를 호출하여 어노테이션이 지시하는 작업을 처리한다.
  * Annotation Processor: 어노테이션 프로세서가 동작하며, AST 를 수정하거나 새로운 코드를 삽입한다.

<br>

<div id="notice--note">

    📘 <span style="font-weight: bold!important;"> Note</span> <br>
    이때, Lombok 과 같은 라이브러리들이 동작한다. <br>

</div>

<br>

#### 6. 의미 분석 (Semantic Analysis)
* **Attribute 단계**
  * 의미 분석을 통해 변수 선언, 타입 일치 여부 등을 확인하며, 상수 접기 작업이 이루어진다.
* **Flow 단계**
  * 데이터 및 제어 흐름 분석을 통해 프로그램의 논리를 검증한다.
  * 변수 사용 전 할당 여부, 메서드 경로에서의 반환 값 존재 여부, 예외 처리의 적절성 등을 확인한다.

<br>

#### 7. Desugar
* **Desugar 단계**
  * 구문적 설탕(syntactic sugar)을 제거하고, 내부 클래스, 클래스 리터럴, 단언, foreach 루프 등을 처리하여 AST 를 재작성한다.

<br>

#### 8. Generate
* **Generate 단계**
  * 바이트코드를 생성하고, 인스턴스 생성자 메서드(<init>)와 클래스 생성자 메서드(<clinit>)를 추가한다.
  * 문자열 추가 작업을 StringBuffer 나 StringBuilder 로 변환한다.

<br>

#### 9. 바이트 코드 생성 및 출력
* **바이트 코드 생성 (Class Generation 단계)**
  * `javac` 는 수정된 AST 를 바탕으로 `.class` 파일에 들어갈 바이트 코드를 생성한다.
* **출력 (Output)**
  * 생성된 바이트 코드를 `.class` 파일로 저장하며, 이 `.class` 파일은 최종적으로 JVM 에 의해 실행된다.

<br>

<div id="notice--note">

    📘 <span style="font-weight: bold!important;"> Note</span> <br>
    소스 파일 → AST 생성 → Annotation Processing(Lombok) → AST 수정 → 바이트 코드 생성 → .class 파일 생성 및 출력 

</div>

<br>

Lombok 은 컴파일 과정의 `Annotation Processing` 단계에서 동작하여,  
소스 코드에 대한 AST 를 수정하거나 필요한 코드를 자동 생성합니다.  
이 수정된 AST 를 바탕으로 최종 바이트 코드가 생성되고, `.class` 파일로 출력됩니다.

위의 과정을 JavaCompiler 코드를 보면 아래와 같다. [(코드보러가기)](https://github.com/openjdk/jdk/blob/03ba37e60ce08def6afd172efc1cdbbcc856c633/src/jdk.compiler/share/classes/com/sun/tools/javac/main/JavaCompiler.java#L910)

<br>

<pre class="prettyprint lang-java">
public void compile(Collection&#60;JavaFileObject&#62; sourceFileObjects,
                    Collection&#60;String&#62; classnames,
                    Iterable&#60;&#63; extends Processor&#62; processors,
                    Collection&#60;String&#62; addModules)
{
    // 1. 준비 및 초기화 단계
    if (!taskListener.isEmpty()) {
        taskListener.started(new TaskEvent(TaskEvent.Kind.COMPILATION));
    }

    if (hasBeenUsed)
        checkReusable();
    hasBeenUsed = true;

    options.put(XLINT_CUSTOM.primaryName + "-" + LintCategory.OPTIONS.option, "true");
    options.remove(XLINT_CUSTOM.primaryName + LintCategory.OPTIONS.option);

    start_msec = now();

    try {
        // 5. Annotation Visitor 및 Annotation Processing 단계
        initProcessAnnotations(processors, sourceFileObjects, classnames);

        for (String className : classnames) {
            int sep = className.indexOf('/');
            if (sep != -1) {
                modules.addExtraAddModules(className.substring(0, sep));
            }
        }

        for (String moduleName : addModules) {
            modules.addExtraAddModules(moduleName);
        }

        // 2. 구문 분석 (Parsing) 단계
        processAnnotations(
            enterTrees(
                stopIfError(CompileState.ENTER,
                    // 3. Enter 단계
                    initModules(stopIfError(CompileState.ENTER, 
                        parseFiles(sourceFileObjects))) // 여기서 파싱 수행
                )
            ),
            classnames
        );

        // 4. MemberEnter 단계
        // MemberEnter 단계는 Enter 단계의 일부분으로, 
        // 엔터트리 과정에서 클래스의 멤버를 스캔하고 심볼 테이블에 등록함

        if (taskListener.isEmpty() && 
            implicitSourcePolicy == ImplicitSourcePolicy.NONE) {
            todo.retainFiles(inputFiles);
        }

        if (!CompileState.ATTR.isAfter(shouldStopPolicyIfNoError)) {
            switch (compilePolicy) {
            case SIMPLE:
                // 6. 의미 분석 (Semantic Analysis) 단계 및 7. Desugar
                generate(desugar(flow(attribute(todo))));
                break;

            case BY_FILE: {
                    Queue&#60;Queue&#60;Env&#60;pre&#62;&#62;&#62; q = todo.groupByFile();
                    while (!q.isEmpty() && !shouldStop(CompileState.ATTR)) {
                        // 6. 의미 분석 (Semantic Analysis) 단계 및 7. Desugar
                        generate(desugar(flow(attribute(q.remove()))));
                    }
                }
                break;

            case BY_TODO:
                while (!todo.isEmpty()) {
                    // 6. 의미 분석 (Semantic Analysis) 단계 및 7. Desugar
                    generate(desugar(flow(attribute(todo.remove()))));
                }
                break;

            default:
                Assert.error("unknown compile policy");
            }
        }
    } catch (Abort ex) {
        if (devVerbose)
            ex.printStackTrace(System.err);
    } finally {
        if (verbose) {
            elapsed_msec = elapsed(start_msec);
            log.printVerbose("total", Long.toString(elapsed_msec));
        }

        reportDeferredDiagnostics();

        if (!log.hasDiagnosticListener()) {
            printCount("error", errorCount());
            printCount("warn", warningCount());
            printSuppressedCount(errorCount(), log.nsuppressederrors, "count.error.recompile");
            printSuppressedCount(warningCount(), log.nsuppressedwarns, "count.warn.recompile");
        }
        if (!taskListener.isEmpty()) {
            taskListener.finished(new TaskEvent(TaskEvent.Kind.COMPILATION));
        }
         
        // 8. Generate 및 바이트 코드 생성 단계
        // 바이트 코드가 생성된 후, 자원 정리 및 종료 작업을 수행
        close();
         
        if (procEnvImpl != null)
            procEnvImpl.close();
    }
    // 9. 바이트 코드 생성 및 출력 단계
    // 위의 generate 메서드 호출에서 바이트 코드가 생성되어, .class 파일로 저장됨
}
</pre>

<br>

위와 같은 과정을 거쳐서 아래의 코드를 컴파일하면,

<pre class="prettyprint lang-java">
@Data
public class User {

	private String id;

	private String name;

}
</pre>

<br>

아래와 같은 결과가 나온다.

<br>

<pre class="prettyprint lang-java">
public class User {
private String id;
private String name;

    @Generated
    public User() {
    }

    @Generated
    public String getId() {
        return this.id;
    }

    @Generated
    public String getName() {
        return this.name;
    }

    @Generated
    public void setId(final String id) {
        this.id = id;
    }

    @Generated
    public void setName(final String name) {
        this.name = name;
    }

    @Generated
    public boolean equals(final Object o) {
        if (o == this) {
            return true;
        } else if (!(o instanceof User)) {
            return false;
        } else {
            User other = (User)o;
            if (!other.canEqual(this)) {
                return false;
            } else {
                Object this$id = this.getId();
                Object other$id = other.getId();
                if (this$id == null) {
                    if (other$id != null) {
                        return false;
                    }
                } else if (!this$id.equals(other$id)) {
                    return false;
                }

                Object this$name = this.getName();
                Object other$name = other.getName();
                if (this$name == null) {
                    if (other$name != null) {
                        return false;
                    }
                } else if (!this$name.equals(other$name)) {
                    return false;
                }

                return true;
            }
        }
    }

    @Generated
    protected boolean canEqual(final Object other) {
        return other instanceof User;
    }

    @Generated
    public int hashCode() {
        int PRIME = true;
        int result = 1;
        Object $id = this.getId();
        result = result * 59 + ($id == null ? 43 : $id.hashCode());
        Object $name = this.getName();
        result = result * 59 + ($name == null ? 43 : $name.hashCode());
        return result;
    }

    @Generated
    public String toString() {
        String var10000 = this.getId();
        return "User(id=" + var10000 + ", name=" + this.getName() + ")";
    }
}
</pre>

<br>

<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 요약 </b> 
    </p>
    🖐 Lombok 은 컴파일 과정 중 <b> Annotation Processing </b> 영역에서 동작한다. <br>
    🖐 <b> 컴파일러 동작 방식 </b> <br>
       준비 및 초기화 ➡ 구문 분석 ➡ Enter ➡ MemberEnter ➡ Annotation Visitor / Annotation Processing ➡ 의미 분석 <br> 
      ➡ Desugar ➡ Generate ➡ 바이트 코드 생성 및 출력
    <p style='margin-top:1em;' />

</div>


<br><br>

## Reference

---

* [Lombok은 어떻게 동작되나? 간단정리](https://free-strings.blogspot.com/2015/12/lombok.html)
* [10 minutes to teach you how to hack the Java compiler](https://www.programmersought.com/article/42205547853/)


<br>
