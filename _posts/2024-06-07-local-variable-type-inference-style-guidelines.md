---
layout: post
title: "Local Variable Type Inference Style Guidelines"
description: "Local Variable Type Inference Style Guidelines"
excerpt: "지역 변수 유형 추론 타입인 'var' 를 사용하는 방법"
category: [Java, Clean Code]
comments: true
---

<div id ="notice--success">

    <p style='margin-top:1em;'>
        <b>🍏️ About </b>
    </p>
    <a href = "https://openjdk.org/projects/amber/guides/lvti-style-guide"> 
        Local Variable Type Inference Style Guidelines
    </a> 
    에 대한 내용 정리 <br>
    Java SE 10 에는 
    <a href = "https://openjdk.org/jeps/286">
        지역 변수에 대한 유형 추론
    </a>
    이 도입되었다. <br>
    하지만, 어느 정도 논란이 있다. <br>
    중복 코드를 줄여서 가독성을 향상 시킬 수 있고, 코드가 간결하다는 점에서 좋은 점이 있지만, <br> 
    오히려, 중요한 정보를 제거해서 가독성을 낮출 수 있다. <br>
    var 를 언제 사용해야 좋은지에 대한 포괄적인 규칙은 없지만, 효과적인 사용을 위한 지침을 제공하고 있다. <br>
    <p style='margin-top:1em;'/>

</div>

<br>

## Principles

---

### P1. 코드를 작성하는 것보다 코드를 읽는 것이 더 중요하다. 
**Reading code is more important than writing code.**  

코드는 작성되는 것보다 읽히는 경우가 훨씬 많다. 또한 코드를 작성할 때는 보통 전체 문맥을 머릿속에 떠올리며 천천히 작성하지만,
코드를 읽을 때는 문맥이 바뀌는 경우가 많고 빠르게 읽는 경우가 많다. 특정 언어 기능의 사용 여부와 방법은 작성자가 아닌 프로그램 독자에게 미치는 영향으로 결정되어야 한다.
긴 프로그램보다는 짧은 프로그램이 바람직할 수 있지만, 프로그램을 너무 많이 줄이면 프로그램을 이해하는데 유용한 정보가 생략 될 수 있다.
여기에서 핵심적인 문제는 프로그램의 알맞는 크기를 찾아 **이해력을 극대화 하는 것**이다.  
 프로그램을 입력하거나 편집하는데 필요한 입력 양에는 특별한 관심이 없다.
<span style="color:blue"> <b> 간결함은 작성자에게는 좋은 보너스 일 수 있지만, 여기에 초점을 맞추면 프로그램의 이해도를 높이는 주된 목표를 놓치게 된다. </b> </span>  

<br>

### P2. 코드는 지역 추론에서 명확해야 한다.
**Code should be clear from local reasoning.**  

 코드를 읽는 사람은 선언된 변수의 사용과 함께 변수 선언을 보고 무슨 일이 일어나고 있는지 바로 이해할 수 있어야 한다.  
코드가 문맥의 snippet 이나 patch 만으로 쉽게 이해할 수 있어야 한다. <span style="color:blue"> <b> 변수 선언을 이해하기 위해 코드의 여러 위치를 봐야한다면, 코드 자체에 문제가 있을 수 있다는 것이다. </b> </span>  

<br>

### P3. 코드의 가독성은 IDE 에 의존해서는 안된다.
**Code readability shouldn’t depend on IDEs.**

 코드는 IDE 에서 작성되고 읽히기 때문에 IDE 의 코드 분석 기능에 크게 의존될 수 있다.
  IDE 외부에서 읽히는 경우가 많고, IDE 내에서도 코드를 읽을 때 변수에 대한 추가 정보를 확인하는 경우가 많다. 
 따라서, Type 선언의 경우 `var` 유형을 결정하기 위해서 항상 변수를 가리킬 수 있지만, 항상 사용해서는 안된다.  
 <span style="color:blue"> <b> 코드는 도구의 도움 없이도 표면적으로 이해할 수 있어야 한다. </b> </span>

<br>

### P4. 명시적 Type 은 절충안이다.
**Explicit types are a tradeoff.**

 Java 는 역사적으로 지역 변수 선언에 명시적인 유형을 설정하는 것으로 요구되어 왔다. 명시적인 Type 은 매우 유용할 수 있지만, 
 때론 중요하지 않고 오히려 방해가 될 수 있다.  
 명시적 Type 은 이해도가 떨어지지 않는 경우에 사용하면 혼란을 줄일 수 있다. Type 뿐만 아니라, 변수 이름과 이니셜라이저 표현식으로 정보를 전달 할 수 있다.
 따라서, 여러 방법을 고려해서 Type 을 명시적으로 작성하지 않아도 된다.  

<br>

## Guidelines

---

### G1. 유용한 정보를 제공하는 변수 이름을 선택한다.
**Choose variable names that provide useful information.**  

 일반적으로 좋은 습관이지만, 변수의 맥락에서는 훨씬 더 중요하다. 변수 선언에서 의미와 용도에 대한 정볼르 전달 할 수 있고, `var` 로 대체할 때는 변수 이름을 개선하는 작업이 동반되어야 한다.  

<pre class="prettyprint lang-java">
// ORIGINAL
List&#60;Customer&#62; x = dbconn.executeQuery(query);

// GOOD
var custList = dbconn.executeQuery(query);

// 쓸모 없는 변수 이름은 var 와 할께 변수 유형을 포함된 이름으로 대체 되었다.
</pre>

<br>

 변수의 유형을 이름에 인코딩하여 사용하면 [Hungarian notation](https://en.wikipedia.org/wiki/Hungarian_notation) 이 된다.
 명시적 Type 과 마찬가지로 도움이 되긴 하지만, 복잡해지기도 한다.  
 위의 예시에서 `custList` 이라는 리스트를 반환하는 것을 의미하는데, 이는 중요하지 않다. 정확한 유형 대신 변수의 이름에 `customers` 와 같이 변수의 역할이나 특성을 표현하는 것이 더 좋을 수 있다.

<pre class="prettyprint lang-java">
// ORIGINAL
try (Stream&#60;Customer&#62; result = dbconn.executeQuery(query)) {
    return result.map(...)
                 .filter(...)
                 .findAny();
}

// GOOD
try (var customers = dbconn.executeQuery(query)) {
    return customers.map(...)
                    .filter(...)
                    .findAny();
}
</pre>

<br>

### G2. 로컬 변수의 범위를 최소화한다.
**Minimize the scope of local variables.**

 일반적으로 지역 변수의 범위를 제한하는 것이 좋다. Effective Java 의 Item 57 항목에 설명되어 있다. 변수가 사용 중인 경우 강력하게 적용된다.  
 다음 예에서 `add` 메서드는 특수 항목을 마지막 목록 요소로 명확하게 추가하므로 예상대로 마지막에 처리된다.  

<pre class="prettyprint lang-java">
var items = new ArrayList&#60;Item&#62;(...);
items.add(MUST_BE_PROCESSED_LAST);
for (var item : items) ...
</pre>

<br>

중복 항목을 제거하기 위해 `ArrayList` 대신 `HashSet` 를 사용한다고 가정해보자.  

<pre class="prettyprint lang-java">
var items = new HashSet&#60;Item&#62;(...);
items.add(MUST_BE_PROCESSED_LAST);
for (var item : items) ...
</pre>

<br>

 집합에 정의된 반복 순서가 없기 때문에 버그가 생긴다.  그러나 `items` 변수의 용도가 선언에 인접해 있어서 버그를 즉시 수정할 가능성이 높다.  

<pre class="prettyprint lang-java">
var items = new HashSet&#60;Item&#62;(...);

// ... 100 lines of code ...

items.add(MUST_BE_PROCESSED_LAST);
for (var item : items) ...
</pre>

<br>

위의 경우는 `items` 이 멀리 떨어진 곳에 정의 되어 있기 때문에 버그는 훨씬 더 오래 지속될 수 있다.  
`item` 이 명시적으로 `List<item>` 으로 선언된 경우 `Set<String>` 으로 변경되어야 한다.  
개발자는 이러한 변경으로 인해 영향을 받을 수 있는 코드가 있는지 나머지 메서드를 검사 해야 할 수도 있다. (그렇지 않을 수도 있다.)  
`var` 를 사용하면 이러한 메시지가 제거 되므로, 버그가 발생할 윟머이 높아진다.  

이것은 `var` 사용을 반대하는 것처럼 보일 수 있지만, `var` 를 사용할 때는 로컬 변수의 범위를 줄인 다음 사용하라는 것이다.  

<br>

### G3. 이니셜라이저가 충분한 정보를 제공하는 경우는 var 를 고려해라.
**Consider var when the initializer provides sufficient information to the reader.**

 로컬 변수는 생성자를 통해 초기화 되는 경우가 많다. 생성되는 클래스의 이름은 왼쪽에 명시적 유형으로 반복된다. Type 이름이 긴 경우 `var` 를 사용하면 정보 손실 없이 간결하게 표현할 수 있다.  

<pre class="prettyprint lang-java">
// ORIGINAL
ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

// GOOD
var outputStream = new ByteArrayOutputStream();
</pre>

<br>

초기화가 생성자 대신 정적 팩토리 메서드와 같이 메서드 호출인 경우, 그리고 그 이름에 충분한 Type 정보가 포함되어 있는 경우에도 `var` 를 사용 하는 것이 합리적이다.  

<pre class="prettyprint lang-java">
// ORIGINAL
BufferedReader reader = Files.newBufferedReader(...);
List&#60;String&#62; stringList = List.of("a", "b", "c");

// GOOD
var reader = Files.newBufferedReader(...);
var stringList = List.of("a", "b", "c");
</pre>

<br>

이러한 경우 메서더의 이름은 특정 반환 유형을 강력하게 암시하고 변수 Type 을 유추하는데 사용된다.  

### G4. 연속적으로 로컬 변수가 있는 곳과 중첩된 표현식을 분리하려면 var 를 사용한다. 
**Use var to break up chained or nested expressions with local variables.**

문자열 컬렉션을 가져와 가장 자주 발생하는 문자열을 찾는 코들르 생각해보면,  

<pre class="prettyprint lang-java">
return strings.stream()
              .collect(groupingBy(s -> s, counting()))
              .entrySet()
              .stream()
              .max(Map.Entry.comparingByValue())
              .map(Map.Entry::getKey);
</pre>

<br>

위의 코드는 정확하지만, 단일 스트림 파이프라인처럼 보이기 때문에 혼동 할 수 있다. 실제로는 짧은 스트림에 이어서 첫 번째 스트림의 결과에 대한 두 번째 스트림,
그리고 두 번째 스트림의 선택적 결과에 대한 매핑이 이어진다. 이 코드를 가장 읽기 쉽게 표현하는 방법은 아래와 같이 Map 으로 그룹화 한 이후에 key 추출 하는 것이 좋았을 것이다.  

<pre class="prettyprint lang-java">
Map&#60;String, Long&#62; freqMap = strings.stream()
                                           .collect(groupingBy(s -> s, counting()));

Optional&#60;Map.Entry&#60;String, Long&#62;&#62; maxEntryOpt = freqMap.entrySet()
                                                                       .stream()
                                                                       .max(Map.Entry.comparingByValue());
return maxEntryOpt.map(Map.Entry::getKey);
</pre>

<br>

그러나, 중간 변수의 유형을 작성하는 것이 부담스웠을 것이고, 그 대신에 제어 흐름이 왜곡되었을 것이다.  
이 때 `var` 를 사용하면 중간 변수 유형을 명시적으로 선언하는데 드는 높은 비용을 지불하지 않고도 더 자연스럽게 표현할 수 있다.  

<pre class="prettyprint lang-java">
var freqMap = strings.stream()
                     .collect(groupingBy(s -> s, counting()));

var maxEntryOpt = freqMap.entrySet()
                         .stream()
                         .max(Map.Entry.comparingByValue());

return maxEntryOpt.map(Map.Entry::getKey);
</pre>

<br>

하나의 긴 메서드 호출 체인이 있는 것을 선호 할 수 있다. 하지만 긴 메서드 체인을 분리하는 것이 가독성에 더 좋다. 이 과정에서 `var` 를 사용하는 것은 중간 변수에 Type 을 작성하는 것보다 좋은 대안이 될 수 있다.  
다른 많은 상황과 마찬가지로, `var` 를 사용하려면 무언가를 빼는 것(명시적 유형)과 다시 추가하는 것(더 나은 변수 이름, 더 나은 코드 구조화)가 모두 포함 될 수 있다.

<br>

### G5. 로컬 변수를 사용한 "인터페이스 프로그래밍" 에 너무 걱정하지 말아라.
**Don’t worry too much about “programming to the interface” with local variables.**

Java 프로그래밍은 일반적으로 구체적인 유형의 인스턴스를 구성하되, 이를 인터페이스 유형의 변수에 할당하는 것이다. 
이렇게 하면 코드가 추상화에 바인딩 되므로 코드 유지 관리시 유연성을 가질 수 있다.    

<pre class="prettyprint lang-java">
// ORIGINAL
List&#60;String&#62; list = new ArrayList&#60;&#62;();

// var 를 사용하면 인터페이스 대신 구체적인 유형이 추론된다.
// Inferred type of list is ArrayList&#60;String&#62;
var list = new ArrayList&#60;String&#62;();
</pre>

<br>

다시 강조 하지만, `var` 는 지역 변수에만 사용 할 수 있다. 필드 유형, 메서드 매개변수 유형, 메서드 반환 유형을 유추하는데 사용할 수 없다.
"인터페이스 프로그래밍" 이라는 원칙은 이러한 상황에서도 여전히 중요하다.  

가장 큰 문제는 변수를 사용하는 코드가 구체적인 구현에 종속성을 형성할 수 있다는 것이다. 변수의 이니셜라이저가 나중에 변경되면 유추된 유형이 변경되어 변수를 사용하는 후속 코드에서 오류나 버그가 발생할 수 있다.  

G2 에서 권장하는 대로 로컬 변수의 범위가 작으면 후속 코드에 영향을 줄 수 있는 구체적인 구현의 "누수"로 인한 위험이 제한된다.
변수가 몇 줄 떨어진 코드에서만 사용된느 경우 문제를 피하거나 문제가 발생하더라도 쉽게 해결할 수 있다.  

 이 특별한 경우, `ArrayList` 에는 `List` 에 없는 두 가지 메서드, 즉 `ensureCapacity`, `trimToSize` 만 포함된다. 이러한 메서드는 list 의 내용에 영향을 미치지 않으므로 정확성에 영향을 미치지 않는다.
이렇게 하면 추론된 유형이 인터페이스가 아닌 구체적인 구현인 경우 영향이 더욱 줄어든다.  

<br>

### G6. 다이아몬드 또는 일반 메서드와 함께 var 를 사용할 때 주의해라.
**Take care when using var with diamond or generic methods.**

`var` 와 `<>` 기능 모두 이미 존재하는 정보에서 파생할 수 있는 경우 명시적 유형 정보를 생략할 수 있다. 동일한 선언에서 두 가지 모두 사용할 수 있을까?  

다음을 고려해라.  

<pre class="prettyprint lang-java">
PriorityQueue&#60;Item&#62; itemQueue = new PriorityQueue&#60;Item&#62;();

// 유형 정보를 잃지 않고 다이아몬드 또는 var 를 사용해서 다시 작성할 수 있다.

// OK: both declare variables of type PriorityQueue&#60;Item&#62;
PriorityQueue&#60;Item&#62; itemQueue = new PriorityQueue&#60;&#62;();
var itemQueue = new PriorityQueue&#60;Item&#62;();

// var 와 다이아몬드 모두 사용하는 것은 합법적이지만 추론된 유형은 변경된다.
// DANGEROUS: infers as PriorityQueue&#60;Object&#62;
var itemQueue = new PriorityQueue&#60;&#62;();
</pre>

 추론을 위해 다이아몬드에서는 대항 유형 또는 생성자 인수의 유형을 사용할 수 있다. 둘다 존재 하지 않는 경우 `Object` 가 된다. 하지만 일반적으로 의도하는 것은 아니다.  

제네릭 메서드는 타입 추론을 매우 성공적으로 사용했기 때문에 개발자가 명시적인 타입 인수를 제공하는 경우는 드물다. 
제네릭 메서드에 대한 추론은 충분한 타입 정볼르 제공하지는 실제 메서드 인수가 없는 경우 대상 타입에 의존한다. 
`var` 선언에서는 대상 유형이 없으므로 다이아몬드와 비슷한 문제가 발생할 수 있다.  

<pre class="prettyprint lang-java">
// DANGEROUS: infers as List&#60;Object&#62;
var list = List.of();
</pre>

<br>

다이아몬드 메서드와 일반 메서드 모두 생성자나 메서드에 실제 인자를 추가 형 정보를 제공하여 의도한 유형을 유추할 수 있다.   

<pre class="prettyprint lang-java">
// OK: itemQueue infers as PriorityQueue&#60;String&#62;
Comparator&#60;String&#62; comp = ... ;
var itemQueue = new PriorityQueue&#60;&#62;(comp);

// OK: infers as List&#60;BigInteger&#62;
var list = List.of(BigInteger.ZERO);
</pre>

<br>

다이아몬드 또는 일반 메서드와 함께 `var`를 사용하기로 결정한 경우 
메서드 또는 생성자 인수가 유추된 유형이 의도와 일치하도록 충분한 유형 정보를 제공하는지 확인해야 한다. 
그렇지 않으면 동일한 선언에서 다이아몬드 또는 일반 메서드와 함께 `var` 를 모두 사용하지 말아라.  

<br>

### G7. 리터럴과 함게 var 를 사용할 때는 주의해라.
**Take care when using var with literals.**  

원시 리터럴은 `var` 선언의 이니셜라이저로 사용 할 수 있다. 일반적으로 유형 이름이 짧아서 `var` 를 사용하는 것이 큰 이점을 제공하지 않는다.
하지만, 변수 이름을 정렬할 때와 같이 변수가 유용할 때 가 있다.  
`boolean`, `char`, `long`, `string` 과 같이 리터럴에서 유추되는 유형은 정확해서 `var` 의 의미가 모호하지 않다.  

<pre class="prettyprint lang-java">
// ORIGINAL
boolean ready = true;
char ch = '\ufffd';
long sum = 0L;
String label = "wombat";

// GOOD
var ready = true;
var ch    = '\ufffd';
var sum   = 0L;
var label = "wombat";
</pre>

<br>

이니셜라이저가 숫자 값, 특히 정수 리터럴인 경우 특히 주의해야한다.   

<pre class="prettyprint lang-java">
// ORIGINAL
byte flags = 0;
short mask = 0x7fff;
long base = 17;

// DANGEROUS: all infer as int
var flags = 0;
var mask = 0x7fff;
var base = 17;
</pre>

<br>

`float`은 대부분 모호하지 않다.  

<pre class="prettyprint lang-java">
// ORIGINAL
float f = 1.0f;
double d = 2.0;

// GOOD
var f = 1.0f;
var d = 2.0;
</pre>

<br>

부동 소수점 리터럴은 자동으로 `double`로 확장될 수 있다. `var` 를 사용할 때는 다음과 같은 주의가 필요하다.  

<pre class="prettyprint lang-java">
// ORIGINAL
static final float INITIAL = 3.0f;
...
double temp = INITIAL;

// DANGEROUS: now infers as float
var temp = INITIAL;
</pre>

(실제로 위의 예는 이니셜라이저에 유형을 볼 수 있는 정보가 충분하지 않기 때문에 G3 를 위반한다.)  

<br>

## Examples

---

`var` 를 사용할 때 가장 큰 이점을 얻을 수 있는 위치에 대한 예는 아래와 같다.  
이터레이터 유형이 중첩된 와이드카드일 때, `var` 를 사용하고, for 문에서 사용하면 간결하게 쓸 수 있다.  

<pre class="prettyprint lang-java">
// ORIGINAL
void removeMatches(Map&#60;&#63; extends String, &#63; extends Number&#62; map, int max) {
    for (Iterator&#60;&#63; extends Map.Entry&#60;&#63; extends String, &#63; extends Number&#62;&#62; iterator =
             map.entrySet().iterator(); iterator.hasNext();) {
        Map.Entry&#60;&#63; extends String, &#63; extends Number&#62; entry = iterator.next();
        if (max &#62; 0 && matches(entry)) {
            iterator.remove();
            max--;
        }
    }
}
</pre>


<pre class="prettyprint lang-java">
// GOOD
void removeMatches(Map&#60;&#63; extends String, &#63; extends Number&#62; map, int max) {
    for (var iterator = map.entrySet().iterator(); iterator.hasNext();) {
        var entry = iterator.next();
        if (max &#62; 0 && matches(entry)) {
            iterator.remove();
            max--;
        }
    }
}
</pre>

<br>

`try-with-resources` 문을 사용할 때도 간단하게 사용할 수 있다.

<pre class="prettyprint lang-java">
// ORIGINAL
try (InputStream is = socket.getInputStream();
     InputStreamReader isr = new InputStreamReader(is, charsetName);
     BufferedReader buf = new BufferedReader(isr)) {
    return buf.readLine();
}

// GOOD
try (var inputStream = socket.getInputStream();
     var reader = new InputStreamReader(inputStream, charsetName);
     var bufReader = new BufferedReader(reader)) {
    return bufReader.readLine();
}
</pre>

<br>

## Result
`var` 를 사용하면 복잡함이 줄어들고, 더 중요한 정보를 돋보이게 하며 코드를 개선할 수 있다.  
반면, 무분별한 `var` 를 사용하면 반대가 될 수 있다. 적절하게 사용한다면 코드 개선에 도움이 되고 코드를 더 짧고 명확하게 만들 수 있다.

<br><br>

<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 개인적인 생각 </b> 
    </p>
    📣 무분별한 <b> var </b> 를 사용하는 것은 오히려 가독성에 저해가 될 수 있다. <br>
    📣 결국엔 <b> var </b> 를 사용하기 위해서는 <b> 의미 전달</b> 이 될 수 있는 네이밍을 사용 해야 한다. <br>
    📣 새로운 기술이나 문법이 나왔다고 무지성으로 쓰는 것보다는 역시 알고 쓰는 것이 중요한 것 같다.
    <p style='margin-top:1em;' />

</div>

<br><br>

### Reference

---

* [Local Variable Type Inference Style Guidelines](https://openjdk.org/projects/amber/guides/lvti-style-guide)
* [Java 10 LocalVariable Type-Inference](https://www.baeldung.com/java-10-local-variable-type-inference)


<br><br><br>


