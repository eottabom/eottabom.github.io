---
layout: post
title: "불변임을 나타내는 keyword - Final"
description: "Keyword - Final to indicate invariant"
excerpt: "불변임을 나타내는 Final keyword 에 대해서, 그리고 언제 사용하는 것이 좋을까? 에 대한 내용"
category: Java
comments: true
---

<div id ="notice--info">

    <p style='margin-top:1em;'>
        <b>🐱 Meow, meow </b>
    </p>
    Final 은 불변이라는 것을 알려주는 keyword 이다. <br>
    Java 8 에서는 Effecitvely final 이 추가가 되었다고 하는데, 그렇다면 어떤 경우에 final keyword 를 쓰는 것이 좋을까?
    <p style='margin-top:1em;'/>

</div>


### Effectively final

---

Java 8 에 도입된 기능 중 하나는 `Effectively final` 이다.  
이를 통해 변수, 필드 및 매개 변수에 대해 `final` 을 쓰지 않고 `final` 처럼 효과적으로 처리하고 사용할 수 있다.  

JLS 4.12.4 에서는 컴파일 타임 오류 없이 유효한 프로그램의 매개변수나 지역 변수에 `final` 를 제거하면 `Effectively final` 이 된다고 명시하고 있다.  

[final Variables](https://docs.oracle.com/javase/specs/jls/se8/html/jls-4.html#jls-4.12)

> Certain variables that are not declared final are instead considered effectively final

하지만, Java 컴파일러는 `Effectively final` 변수에 대한 정적 코드 최적화를 수행하지 않는다.

`final` 로 선언된 문자열을 연결하는 코드가 있다면,

<pre class="prettyprint lang-java">
public static void main(String[] args) {
    final String hello = "hello";
    final String world = "world";
    String test = hello + " " + world;
    System.out.println(test);
}
</pre>

컴파일러는 기본 메서드에서 실행된 코드를 다음과 같이 변경한다.

<pre class="prettyprint lang-java">```
public static void main(String[] var0) {
    String var1 = "hello world";
    System.out.println(var1);
}
</pre>

반면에 final 을 제거하면 `Effectively final` 로 간주하지만,  
연결에만 사용되기 때문에 컴파일러는 이를 최적화하지 않는다.

사실, `final` keyword 를 사용하면 얻을 수 있는 성능 상의 이점은 매우 인기 있는 논쟁이다.  
어디에 적용하느냐에 따라 `final` 은 다른 목적과 성능에 미치는 영향을 가질 수 있다.

`final` 이 지역 변수에 적용될 때 값은 정확히 한 번 할당 되어야 한다.  
로컬 변수에 `final` 키워드를 사용하면 성능이 향상 될 수 있다.  

예를 들어, 문자열을 연결하는 코드를 JMH(Java Microbenchmark Harness) 로 벤치마킹하면

<pre class="prettyprint lang-java">
@Benchmark
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@BenchmarkMode(Mode.AverageTime)
public static String concatNonFinalStrings() {
    String x = "x";
    String y = "y";
    return x + y;
}


@Benchmark
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@BenchmarkMode(Mode.AverageTime)
public static String concatFinalStrings() {
    final String x = "x";
    final String y = "y";
    return x + y;
}  
</pre>

<br>

아래와 같은 결과를 볼 수 있다.  

| Benchmark                               |Mode|Cnt| Score    | Error           | Units |
|-----------------------------------------|--|--|----------|-----------------|-------|
|BenchmarkRunner.compilerOptimizationString|avgt|5|0.339|± 0.006|ns/op|
|BenchmarkRunner.finalStrings|avgt|5|0.340|± 0.004|ns/op|
|BenchmarkRunner.nonFinalStrings|avgt|5|4.404|± 0.188|ns/op|

<div id="notice--warning">

    🏷️ <a href="https://github.com/eottabom/lego-piece/tree/main/benchmark">벤치 마크 결과 보기(클릭)</a>

</div>

<br>

해당 메서드들을 컴파일해서 `javap` 커맨드로 바이트코드를 확인해보면,  

<pre class="prettyprint lang-java">
javac XXX.java  
javap -v -p -s XXX.class
</pre>

<pre class="prettyprint lang-java">
public class lego.benchmark.finalkeyword.Test
  minor version: 0
  major version: 61
  flags: (0x0021) ACC_PUBLIC, ACC_SUPER
  this_class: &#35;17                         // lego/benchmark/finalkeyword/Test
  super_class: &#35;2                         // java/lang/Object
  interfaces: 0, fields: 0, methods: 4, attributes: 3
Constant pool:
   &#35;1 = Methodref          &#35;2.&#35;3          // java/lang/Object."&#60;init&#62;":()V
   &#35;2 = Class              &#35;4             // java/lang/Object
   &#35;3 = NameAndType        &#35;5:&#35;6          // "&#60;init&#62;":()V
   &#35;4 = Utf8               java/lang/Object
   &#35;5 = Utf8               &#60;init&#62;
   &#35;6 = Utf8               ()V
   &#35;7 = String             &#35;8             // x
   &#35;8 = Utf8               x
   &#35;9 = String             &#35;10            // y
  &#35;10 = Utf8               y
  &#35;11 = InvokeDynamic      &#35;0:&#35;12         // &#35;0:makeConcatWithConstants:(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
  &#35;12 = NameAndType        &#35;13:&#35;14        // makeConcatWithConstants:(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
  &#35;13 = Utf8               makeConcatWithConstants
  &#35;14 = Utf8               (Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
  &#35;15 = String             &#35;16            // xy
  &#35;16 = Utf8               xy
  &#35;17 = Class              &#35;18            // lego/benchmark/finalkeyword/Test
  &#35;18 = Utf8               lego/benchmark/finalkeyword/Test
  &#35;19 = Utf8               Code
  &#35;20 = Utf8               LineNumberTable
  &#35;21 = Utf8               nonFinalStrings
  &#35;22 = Utf8               ()Ljava/lang/String;
  &#35;23 = Utf8               compilerOptimizationString
  &#35;24 = Utf8               finalStrings
  &#35;25 = Utf8               SourceFile
  &#35;26 = Utf8               Test.java
  &#35;27 = Utf8               BootstrapMethods
  &#35;28 = MethodHandle       6:&#35;29          // REF_invokeStatic java/lang/invoke/StringConcatFactory.makeConcatWithConstants:(Ljava/lang/invoke/MethodHandles&#36;Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/String;&#91;Ljava/lang/Object;)Ljava/lang/invoke/CallSite;
  &#35;29 = Methodref          &#35;30.&#35;31        // java/lang/invoke/StringConcatFactory.makeConcatWithConstants:(Ljava/lang/invoke/MethodHandles&#36;Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/String;&#91;Ljava/lang/Object;)Ljava/lang/invoke/CallSite;
  &#35;30 = Class              &#35;32            // java/lang/invoke/StringConcatFactory
  &#35;31 = NameAndType        &#35;13:&#35;33        // makeConcatWithConstants:(Ljava/lang/invoke/MethodHandles&#36;Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/String;&#91;Ljava/lang/Object;)Ljava/lang/invoke/CallSite;
  &#35;32 = Utf8               java/lang/invoke/StringConcatFactory
  &#35;33 = Utf8               (Ljava/lang/invoke/MethodHandles&#36;Lookup;Ljava/lang/String;Ljava/lang/invoke/MethodType;Ljava/lang/String;&#91;Ljava/lang/Object;)Ljava/lang/invoke/CallSite;
  &#35;34 = String             &#35;35            // &#92;u0001&#92;u0001
  &#35;35 = Utf8               &#92;u0001&#92;u0001
  &#35;36 = Utf8               InnerClasses
  &#35;37 = Class              &#35;38            // java/lang/invoke/MethodHandles&#36;Lookup
  &#35;38 = Utf8               java/lang/invoke/MethodHandles&#36;Lookup
  &#35;39 = Class              &#35;40            // java/lang/invoke/MethodHandles
  &#35;40 = Utf8               java/lang/invoke/MethodHandles
  &#35;41 = Utf8               Lookup
&#123;
  public lego.benchmark.finalkeyword.Test();
    descriptor: ()V
    flags: (0x0001) ACC_PUBLIC
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial &#35;1                  // Method java/lang/Object."&#60;init&#62;":()V
         4: return
      LineNumberTable:
        line 3: 0

  public static java.lang.String nonFinalStrings();
    descriptor: ()Ljava/lang/String;
    flags: (0x0009) ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=2, args_size=0
         0: ldc           &#35;7                  // String x, Constant Pool 에서 인덱스 &#35;7 에 해당하는 문자열 "x" 를 스택에 넣는다.
         2: astore_0                          // 스택의 값을 로컬 변수 0에 저장한다.
         3: ldc           &#35;9                  // String y, Constant Pool 인덱스 &#35;9 에 해당하는 문자열 "y" 를 스택에 넣는다.
         5: astore_1                          // 스택의 값을 로컬 변수 1에 저장한다.
         6: aload_0                           // 로컬 변수 0의 값을 스택에 로드한다.
         7: aload_1                           // 로컬 변수 1의 값을 스택에 로드한다.
         8: invokedynamic &#35;11,  0             // InvokeDynamic &#35;0:makeConcatWithConstants:(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;, 두 문자열을 연결하는 InvokeDynamic 호출을 수행한다.
        13: areturn                           // 연결된 문자열을 반환한다.
      LineNumberTable:
        line 6: 0
        line 7: 3
        line 8: 6

  public static java.lang.String compilerOptimizationString();
    descriptor: ()Ljava/lang/String;
    flags: (0x0009) ACC_PUBLIC, ACC_STATIC
    Code:
      stack=1, locals=1, args_size=0
         0: ldc           &#35;15                 // String xy, Constant Pool 에서 인덱스 &#35;15 에 해당하는 문자열 "xy" 를 스택에 넣는다.
         2: areturn                           // 문자열 "xy" 를 반환한다.
      LineNumberTable:
        line 12: 0

  public static java.lang.String finalStrings();
    descriptor: ()Ljava/lang/String;
    flags: (0x0009) ACC_PUBLIC, ACC_STATIC
    Code:
      stack=1, locals=0, args_size=0
         0: ldc           &#35;15                 // String xy, Constant Pool 에서 인덱스 &#35;15 에 해당하는 문자열 "xy" 를 스택에 넣는다.
         2: areturn                           // 문자열 "xy" 를 반환한다.
      LineNumberTable:
        line 19: 0
&#125;

</pre>

<br>

finalStrings 메서드는 **이미 최적화된 결과를 반환**하는 것을 볼 수 있다.  
하지만, 지역 변수 `final` 키워드를 추가하는 것이 바이트 코드 최적화에 큰 영향을 주지 않는다.  

그 이유는 여러가지가 있는데,  
**1) 컴파일러 최적화**  
- Java 컴파일러와 JIT(Just-In-Time) 컴파일러는 지역 변수를 효율적으로 처리하도록 설계되어 있다.
- 변수의 변경 가능 여부와 상관 없이 이미 최적화된 방식으로 지역 변수를 처리한다.
- `final` 키워드는 컴파일 타임에 주로 사용되며, 컴파일러에게 해당 변수가 변경 되지 않음을 알리는 역할이다.

**2) JVM 의 최적화**  
- JVM 의 JIT 컴파일러는 런타임에 최적화를 수행하고, 변수 사용 패턴을 분석하여 필요한 최적화를 자동으로 적용한다.
- 지역 변수 `final` 을 추가한다고 JIT 컴파일러가 특별한 최적화를 수행하지 않는다.
- JIT 컴파일러는 이미 최적화된 방식으로 코드를 실행하기 때문에 `final` 이 없더라도 효율적으로 코드를 실행할 수 있다.

**3) 지역 변수의 생명주기**  
- 지역 변수는 메서드가 실행될 때 생성되고 끝나면 소멸되는 특징을 가지고 있다.
- 지역 변수에 대한 최적화는 메서드의 스코프 안에서만 의미가 있고, `final` 이 추가된다고 메서드의 성능에 큰 영향을 미치지 않는다.

**4) 컴파일된 바이트 코드의 동일성**  
- 지역 변수에 `final` 을 추가하는 것은 컴파일된 바이트 코드에 큰 변화를 주지 않는다.
- `final` 은 주로 코드 레벨에서 의미가 있고 컴파일 결과물에는 거의 영향을 미치지 않는다.


하지만, 그 중의 핵심은 **객체 내부의 상태까지 불변을 보장 하지 않는다** 라는 점이다.  
`final` 키워드를 사용해서 최적할 수 있는 여러 기회를 제공하기는 하지만, 모든 경우에 해당되지 않는다는 것이다.

<pre class="prettyprint lang-java">
public class Example {
    
    private final SomeObject finalObject;

    public Example() {
        finalObject = new SomeObject();
    }

    public SomeObject getFinalObject() {
        return finalObject;
    }
}
</pre>

위의 코드에서 finalObject 은 `final` 로 선언되었기 때문에 생성자에서 한 번 초기화 된 후에 다시 할당 될 수 없는 상태가 된다.  
이것은 컴파일러에서 객체 finalObject 가 초기화 이후에는 불변하다는 것을 알려주고,
컴파일러는 최적화를 수행한다는 것이다.

그러나, 이러한 최적화는 객체나 배열에 포함되거나 객체의 상태가 변경되는 경우 제한 될 수 있다.

<pre class="prettyprint lang-java">
public class Example {

    private final List&#60;Integer&#62; numbers = new ArrayList&#60;&#62;();

    public Example() {
        numbers.add(1);
        numbers.add(2);
    }

    public List&#60;Integer&#62; getNumbers() {
        return numbers;
    }
}
</pre>

위의 코드에서 numbers 는 final 로 선언되었지만 list 자체는 불변이 아니다.  
final 키워드는 객체의 참조가 변경되지 않음을 보장하지만, **객체의 내부 상태까지 불변을 보장하지 않는다.**

<br>
<br>


### Q. final method 를 사용할 때의 장점은 무엇이 있을까?

---

`final` 을 사용하면 해당 메서드를 **오버라이딩 할 수 없게** 만든다.
메서드를 `final` 로 선언하면서 해당 메서드가 하위 클래스에서 오버라이딩 하지 않게 강제할 수 있으므로,  
특정 메서드의 동작이 변경되지 않도록 보장하여 코드의 무결성을 유지할 수 있다.  
그렇다보니, 상위 클래스에서 정의한 메서드 동작이 항상 동일하게 유지되면서 코드를 이해하기 쉬워진다.

<pre class="prettyprint lang-java">
// 부모 클래스 Animal
class Animal {
    // 메서드가 final로 선언되었음
    public final void makeSound() {
        System.out.println("The animal makes a sound");
    }

    // 일반 메서드
    public void move() {
        System.out.println("The animal moves");
    }
}

// 자식 클래스 Dog
class Dog extends Animal {
    // 오버라이딩을 시도하면 컴파일 오류가 발생함
    // public void makeSound() {
    //     System.out.println("The dog barks");
    // }

    // 일반 메서드는 오버라이딩 가능
    @Override
    public void move() {
        System.out.println("The dog runs");
    }
}

public class Main {
    public static void main(String[] args) {
        Dog dog = new Dog();
        dog.makeSound();  // 부모 클래스의 final 메서드 호출
        dog.move();       // 자식 클래스에서 오버라이딩한 메서드 호출
    }
}
</pre>

그리고, 약간의 성능 향상을 시킬 수 있다.  
JIT 컴파일러가 `final` 메서드가 오버라이딩 될 수 없다는 것을 알기 때문에,  
메서드 호출 시 가상 메서드 테이블을 사용하지 않고 직접 호출 할 수 있다.  
따라서, 메서드 호출의 성능을 약간 향상 시킬 수 있다.

아래의 코드를 간단히 benchmark 를 해보면 아래와 같은 결과를 얻을 수 있다. (단, benchmark 라는 것을 감안해야한다.)


<pre class="prettyprint lang-java">
public class MethodTest {

	private final int&#91;&#93; numbers = new int&#91;1000&#93;;

	public MethodTest() {
		for (int i = 0; i &#60; this.numbers.length; i++) {
			this.numbers&#91;i&#93; = i;
		}
	}

	public int nonFinalMethod() {
		int sum = 0;
		for (int number : this.numbers) {
			sum += complexCalculation(number);
		}
		return sum;
	}

	public final int finalMethod() {
		int sum = 0;
		for (int number : this.numbers) {
			sum += complexCalculationFinal(number);
		}
		return sum;
	}

	private int complexCalculation(int value) {
		return (value * 31) ^ (value &#62;&#62;&#62; 2);
	}

	private final int complexCalculationFinal(int value) {
		return (value * 31) ^ (value &#62;&#62;&#62; 2);
	}

}

</pre>

<br>

| Benchmark                               |Mode|Cnt| Score    | Error           | Units |
|-----------------------------------------|--|--|----------|-----------------|-------|
| BenchmarkRunner.finalMethodBenchmark    |avgt|5| 355.031  | ±6.035  | ns/op |
| BenchmarkRunner.nonFinalMethodBenchmark |avgt|5| 369.924  | ± 18.398  | ns/op |

<br>

benchmark 결과로는 `final` method 가 성능이 조금 더 좋은 것을 알 수 있다.  
하지만, `final` method 를 쓰면 무조건 성능이 잘나오는 다는 것은 아니다.  
이유는 기본적으로 JVM 의 JIT 컴파일러는 `final` 키워드가 없더라도 메서드를 잘 최적화 한다.  
JIT 컴파일러는 메서드가 오버라이드 되지 않는다고 판단되면 `final` 메서드처럼 최적화 한다.
(JIT 컴파일러가 인라인 최적화 할 때 메서드 호출 오버헤드를 없애기 때문)  
따라서, 간단한 연산을 하는 메서드의 경우는 오버헤드가 미미하여 `final` 의 효과가 크게 드러나지 않을 수 있다.

<div id="notice--warning">

    🏷️ <a href="https://github.com/eottabom/lego-piece/tree/main/benchmark">벤치 마크 결과 보기(클릭)</a>

</div>


<br>
<br>

## 그렇다면, final 은 언제 써야 하는게 좋을까??

<br>
<br>

### Best practices for using final keyword in Java

---

[Best practices for using final keyword in Java](https://sg.wantedly.com/companies/bebit/post_articles/366756) 에 대한 정리 내용

`final` keyword 는 다양하게 사용할 수 있다.
+ **final class**
  - 이 클래스는 상속 할 수 없다.

<pre class="prettyprint lang-java">
final class SomeClass {
}
</pre>

+ **final method**
  - 이 메서드는 하위 클래스에서 재정의할 수 없다.

<pre class="prettyprint lang-java">
class SomeClass {
   public final void someMethod() {
   }
}
</pre>

+ **final method parameters**
  - 이 매개변수는 메서드안에서 다시 할당 할 수 없다.

<pre class="prettyprint lang-java">
class SomeClass {
   public final void someMethod(final int someArgument) {
   }
}
</pre>

+ **final fields**
  - 이 필드는 객체 생성 중에 설정되고 다시 할당 할 수 없다.

<pre class="prettyprint lang-java">
class SomeClass {
   final int someField = 42;
}
</pre>

+ **final local variables**
  - 이 지역 변수는 한 번 할당 후에 다시 할당 할 수 없다.


<pre class="prettyprint lang-java">
class SomeClass {
   public void someMethod() {
      final int someVariable = getVar();
   }
}
</pre>

<br><br>

#### Best practices for final in method parameters

--- 

<pre class="prettyprint lang-java">
// with finals
class SomeClass {
   public void someMethod(final int arg1, final int arg2, final int arg3) {
   }
}
</pre>

이 코드는 안정성보다는, 어수선해보이고 가독성에 미치는 부정적인 영향이 크다는 내용이 많다.

<pre class="prettyprint lang-java">
// without finals
class SomeClass {
   public void someMethod(int arg1, int arg2, int arg3) {
   }
}
</pre>

대부분의 개발자는 매개변수가 재할당 되지 않도록 하는 것이 가장 좋다는 점에서는 동의한다.  
하지만, 매개 변수의 최종 동작이 기본 값이 아닌 경우가 많다.

<div id="notice--note">

    <p style="font-weight: bold!important;"> 📘 Note </p>
    따라서 전체 프로젝트에서 사용되지 않는다면, 굳이 매개변수에 final 을 사용할 필요가 없다.

</div>


<br><br>

#### Best practices for final in class fields

---

클래스 필드를 다시 할당 해야 하는 경우는 거의 없다.  
final 이 필드의 객체를 불변으로 만들지는 않지만, 최소한 참조는 보호된다는 점을 이해하는 것이 중요하다.  
즉, 객체의 불변성에 대해 별도로 작업해야 하지만 첫 단계는 필드를 final 로 만드는 것이다.

<div id="notice--note">

    <p style="font-weight: bold!important;"> 📘 Note </p>
    타당한 이유로 필드를 다시 할당 해야 한다고 확신하지 않는 한 클래스의 모든 필드에 final 을 사용해라.

</div>


<br><br>

#### Best practices for final in local variables

---

지역 변수에 final 을 사용하는 것은 Java 커뮤니티에서 가장 의견이 불일치한다.  
일반적으로 재할당이 불가능한 메서드 매개변수와는 달리 지역 변수는 재할당이 가능한 경우가 많다.  
따라서, final 은 코드에서 개발자의 의도를 보여줄 수 있는 유용한 도구이다.

<br>

**Simulating expressions**  
함수형 패러타임을 채택한 언어에서는 표현식을 사용해서 변수에 값을 할당 할 수 있는데,
Java 에서는 그런 구문이 없지만 final 은 그러한 표현식에 가까워지는데 도움이 될 수 있다.

<pre class="prettyprint lang-java">
public void someMethod() {
   final String result;
   if (someValue == 200) {
      result = "SUCCESS";
   } else {
      result = "FAIL";
   }
   ...
}
</pre>
이 경우에는 결과는 확실히 할당되고, if-else 표현식으로 결과가 출력되며 다시 할당되지 않는다.  
키워드 하나만 추가하면 제공할 수 있는 정보가 많다.

<br>

**Long methods**  
메서드가 길면 분할하는 것이고 이는 일반적으로 맞는 말이다.  
실제로 분할하고 싶지 않은 흐름의 메서드가 있을 수 있다.  
분할을 하게 되면 가독성이 떨어지고 순수하게 이름이 지정된 함수에 흐름이 숨겨질 수도 있다.

그런 경우 한 번 할당되고 그 시점부터 상수로 간주되는 지역 변수가 무엇인지, 메서드 실행 전발에 걸쳐서 변경될 변수가 무엇인지
알려주는게 훨씬 중요해진다.

지역 변수에 대한 final 사용에 대해 공식적인 규칙을 만드는 것은 매우 어렵다.  
하지만 위에서 언급된 예제는 final 을 언제 사용해야 하는지에 대한 아이디어를 제공할 수 있다.  


<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 개인적인 생각 </b> 
    </p>
    🖐 알고 쓰는 것과 모르고 쓰는 것은 차이가 있다고 생각한다! <br>
    🖐 가독성을 위해서 가급적이면 final 을 지양하는 것이 더 나은 선택일 수도 있다. <br>
    🖐 final 사용에 대한 규칙을 만드는 것은 어렵지만, 적절하게 사용하면 설계 의도를 드려낼 수 있다. <br> 
       ➡️ 메서드에 final 을 추가해서 오버라이딩을 하지 못하게 하여 상위 클래스의 설계 의도를 코드로 남기는 것은 좋을 것 같다. 
    <p style='margin-top:1em;' />

</div>

<br><br>

### Reference

---

* [final Variables](https://docs.oracle.com/javase/specs/jls/se8/html/jls-4.html#jls-4.12)
* [Best practices for using final keyword in Java](https://sg.wantedly.com/companies/bebit/post_articles/366756)


<br>

