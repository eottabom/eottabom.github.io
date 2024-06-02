---
layout: post
title: "Clean Code - Meaningful Names(의미 있는 이름)에 대한 이야기"
description: "Clean Code - About Meaningful Names Story"
excerpt: "Clean Code 관점에서의 Meaningful Names(의미 있는 이름)에 대한 이야기"
category: Clean Code
comments: true
---

<div id ="notice--info">

    <p style='margin-top:1em;'>
        <b>🐱 Meow, meow </b>
    </p>
    개발을 하다보면 package, class, method 등 naming 에 대한 고민을 많이 하게 되고, <br>
    때로는 naming 을 짓는 시간을 아까워 하기도 한다. <br>
    사실 naming 의 핵심은 "의미 전달"이 모호하지 않고 명확한지가 가장 중요하긴 하다. <br>
    그래도, Clean Code 관점에서의 naming 은 어떤지, <br>
    naming 에 대한 best practice 가 있는지 알아본 것을 정리하였다.
    
    <p style='margin-top:1em;'/>

</div>


# Clean Code

---


<div id ="notice--success">

    <p style='margin-top:1em;'>
        <b>🍏️ About </b>
    </p>
    로버트 C. 마틴의 Clean Code 의 책 중에서 2장. Meaningful Names 에 대한 내용 정리
    <p style='margin-top:1em;'/>

</div>

<br>

### 1. 의도를 드러내는 이름을 사용해라 (Use intention revealing names)

의도를 분명히 하는 변수명을 짓는데 고민하는 시간이 아까워도 투자 해야한다.  
그 이름을 지으면서 절약하는 시간이 더 많기 때문이다.  


<pre class="prettyprint lang-java">
// Bad
int d; // elapsed time in days

// Good
int elapsedTimeInDays;
int daysSinceCreation;
int daysSinceModification;
int fileAgeInDays;
</pre>
🖐 주석이 필요하다면 의도를 분명히 드러내지 못했다는 것이다.  

<br>
<pre class="prettyprint lang-java">
// Bad
public List&#60;int[]]&#62; getThem()
{
    List&#60;int[]&#62; list1 = new ArrayList&#60;int[]&#62;();
    for (int[] x :theList) // theList 에는 어떤게 들어가는지?
        if (x[0] ==4) // theList 의 0 번째가 뭔지?, 4의 값이 뭔지?
            list1.add(x);
    return list1; // 반환되는 목록은 뭔지?
}

// 🖐 의미를 정확히 알기 어렵다.

// Good
public List&#60;Cell&#62; getFlaggedCells() {
    List&#60;Cell> flaggedCells = new ArrayList&#60;Cell&#62;();
    for (Cell cell :gameBoard)
        if (cell.isFlagged())
            flaggedCells.add(cell);
    return flaggedCells;
}
</pre>

<span style="color:red"><b>나쁜 코드</b></span> 의 경우는 해당 코드를 읽는 사람에게 **가정**을 바란다는 점이다.    
<span style="color:blue"><b>좋은 코드</b></span> 의 경우는 어떤 의도인지를 명확하게 드러낸다.

<br>

### 2. 그릇된 정보를 피해라 (Avoid Disinformation)
코드의 의미를 모호하게 하는 거짓 단서를 남기는 것을 피해야한다.    

<br>

#### 1) 널리 쓰이는 의미가 있는 단어를 다른 의미로 사용하지 말자
<pre class="prettyprint lang-java">
// Bad
// 아래와 같은 naming 들은 의미가 불명확하다.
int hp;
int ax;
int sco;
</pre>

예를 들어 hp 는 hypotenuse 직각 삼각형의 빗변을 약어로 썼다고 하면,  
<b>(사실 주석이나, 누군가가 말을 해주지 않는다면)<b>, 그 의미가 불명확하다.  

<br>

#### 2) List
<pre class="prettyprint lang-java">
// Bad
int accountList;
// Good
String[] accountList = {"yukeun", "tester"}
</pre>

실제 List 가 아닌 이상 xxxList 와 같이 변수명을 붙이지 말고, `accountGroup`, `bunchOfAccounts`, `accounts` 등으로 명명하자.  
Collection 인 경우 xxxList 보다는 `accounts` 와 같은 **복수형**을 쓰는게 더 좋다.  

<br>

#### 3) 비슷해 보이는 단어를 지양하자
<pre class="prettyprint lang-java">
// Bad
XYZControllerForEfficientHandlingOfStrings;
XTZControllerForEfficientStorageOfStrings;
</pre>

`XYZControllerForEfficientHandlingOfStrings` 와 `XTZControllerForEfficientStorageOfStrings` 의 차이점을 찾아내는데,  
시간이 오래 걸린다. 비슷한 이름을 사용하지 않도록 유의하자.

<br>

#### 4) 비슷해 보이는 단어를 지양하자
<pre class="prettyprint lang-java">
// Bad
int a = l;
if ( O == l )
    a = O1;
else
    l = 01;
</pre>
소문자 l 과 숫자1, 대문자 O와 숫자 0과 같이 헷갈리는 문자는 쓰지 말자.

<br>

### 3. 의미 있게 구분하라 (Make Meaningful Distinctions

<br>

#### 1) 연속된 숫자를 덧붙이는 경우
`[a1, a2 .... ]` 와 같이 숫자로 구분하지 말아라.  

<pre class="prettyprint lang-java">
// Bad
public static void copyChars(char a1[], chara2[]) {
    for (int i = 0; i &#60; a1.length; i++) {
        a2[i] = a1
    }
}

// Good
public static void copyChars(char source[], char destination[]) {
    for (int i = 0; i &#60; source.length; i++) {
        destination[i] = source[i];
    }
}
</pre>

<br>

#### 2) 불용어를 추가하는 경우  

<pre class="prettyprint lang-java">
// 1) ProductInfo, ProductData
// Bad
public class ProductInfo {}
public class ProductData {}

// 2) naming
// Bad
getActiveAccount()
getActiveAccounts()
getActiveAccountInfo()

// 3)
// Bad
String nameString;

// 4) a, the
// message theMessage
// Bad
String message;
String theMessage;
</pre>

<br>

### 4. 발음하기 쉬운 이름을 사용하라 (Use Pronounceable Names)
많은 의미를 담은 단어를 사용할 수록 좋다.  

<pre class="prettyprint lang-java">
// Bad
class DtaRcrd102 {
    private Date genymdhms;
    private Date modymdhms;
    private final String pszqint = "102";
    /* ... */
};

// Good
class Customer {
    private Date generationTimestamp;
    private Date modificationTimestamp;
    private final String recordId = "102";
    /* ... */
};
</pre>

<br>

### 5. 검색하기 쉬운 이름을 사용하라 (Use Searchable Names)
<pre class="prettyprint lang-java">
// Bad
// 여기에서 34, 4, 5 를 코드에서 찾기 어렵다.
for (int j=0; j&#60;34; j++) {
    s += (t[j]*4)/5;
}

// Good
// 대신, realDaysPerIdealDay, WORK_DAYS_PER_WEEK, NUMBER_OF_TASKS 는 코드에서 찾기 수월해진다.
int realDaysPerIdealDay = 4;
const int WORK_DAYS_PER_WEEK = 5;
int sum = 0;
for (int j=0; j &#60; NUMBER_OF_TASKS; j++) {
    int realTaskDays = taskEstimate[j] * realDaysPerIdealDay;
    int realTaskWeeks = (realdays / WORK_DAYS_PER_WEEK);
    sum += realTaskWeeks;
}

</pre>

<br>

### 6. 인코딩을 피하라 (Avoid Encodings)

<br>

#### 1) 헝가리안 표기법 (Hungarian Notation)
<pre class="prettyprint lang-java">
// Bad
// 변수명에 해당 변수의 Type 을 적지 마라.
PhoneNumber phoneString;
</pre>

<br>

#### 2) 멤버 변수 접두어 (Member Prefixes) 
<pre class="prettyprint lang-java">
// Bad
public class Part {
    private String m_dsc; // The textual description
    void setName(String name) {
    m_dsc = name;
    }
}

// Good
public class Part {
    String description;
    void setDescription(String description) {
        this.description = description;
    }
}
</pre>

<br>

#### 3) 인터페이스와 구현 (Interfaces and Implementations)
인터페이스 클래스와 구현 클래스를 나눠야 한다면 구현 클래스의 이름에 정보를 인코딩하자.  

| Do / Don't |Interface class|Concreate(Implementations class)|
|------------|--|--|
| Don't      |IShapeFactory|ShapeFactory|
| Do         |ShapeFactory|ShapeFactoryImp|
| Do         |ShapeFactory|CSShapeFactory|

<br>

### 8. 자신의 기억력을 자랑하지 마라 (Avoid Mental Mapping)
다른 사람이 머릿속으로 한 번 더 생각해 변환해야 할 만한 변수명을 쓰지마라.  
(ex. URL 에서 호스트와 프로토콜을 제외한 소문자 주소를 r 이라는 변수로 명명하는 일)  
똑똑한 프로그래머와 전문가 프로그래머를 나누는 기준 한가지는 **Clarity(명료함)** 이다.  

<br>

### 8. 클래스 이름 (Class Names)

<br>

#### 1) 명사 혹은 명사구를 사용하라
<pre class="prettyprint lang-java">
// Good
Customer, WikiPage, Account, AddressParser ...
</pre>

<br>

#### 2) Manager, Processor, Data, Info 와 같은 단어는 피하자.

<br>

#### 3) 동사는 사용하지 않는다

<br>

### 9. 메서드 이름 (Method Names)

<br>

#### 1) 동사 혹은 동사구를 사용하라
<pre class="prettyprint lang-java">
// Good
postPayment, deletePayment, deletePage, save ...
</pre>

<br>

#### 2) 접근자, 변경자, 조건자는 get, set, is 로 시작하자 (should, has... )

<br>

#### 3) 생성자를 오버라이드 할 경우 정적 팩토리 메서드를 사용하고 해당 생성자를 private 으로 선언한다.
<pre class="prettyprint lang-java">
// Bad
Complex fulcrumPoint = new Complex(23.0);

// Good
Complex fulcrumPoint = Complex.FromRealNumber(23.0);
</pre>

<br>

### 10. 기발한 이름은 피해라 (Don't Be Cute)
특정 문화에서만 사용되는 이름보다는 의도를 분명히 표현한 이름을 사용하자.  

<pre class="prettyprint lang-java">
// Bad
HolyHandGrenade

// Good
DeleteTimes

// Bad
whack()

// Good
kill()
</pre>

<br>

### 11. 한 개념에 한 단어를 사용하라 (Pick One Word per Concept)
fetch, retrieve, get  
controller, manager, driver  
이런 단어들을 혼용해서 사용하지 말고, 한 단어를 선택했으면 그 단어를 고수해서 명명해라.  

<br>

### 12. 말 장난 하지 마라 (Don't Pun)
의미론적으로 행동이 다른 상황이나, 일반적으로 부르는 이름이 같은데,  
행위가 다르다면, 다른 단어를 사용하는 것이 좋다.
<br>

<pre class="prettyprint lang-java">
// Bad
public static String add(String message, String messageToAppend) // A + B
public List&#60;Element&#62; add(Element element) // List 에 추가한다는 의미

// Good
public static String add(String message, String messageToAppend)
public List&#60;Element&#62; append(Element element) // append or insert
</pre>

<br>

### 13. 해법 영역에서 가져온 이름을 사용하라 (Use Solution Domain Names)
전산용어, 알고리즘 이름, 패턴 이름, 수학 용어 등을 사용하자.  
개발자라면 당연히 알고 있을 `JobQueue`, `AccountVisitor(Visitor pattern)` 등을 사용하지 않을 이유가 없다.  

<br>

### 14. 문제 영역에서 가져온 이름을 사용하라 (Use Problem Domain Names)
적절한 해법 영역의 용어가 없거나, 문제 영역과 관련이 깊은 용어의 경우 문제 영역 용어를 사용하라  

<br>

### 15. 의미 있는 맥락을 추가하라 (Add Meaningful Context) 
클래스, 함수, namespace 등으로 감싸서 맥락(Context) 를 표현하라.  
그래도 불분명하다면 접두어를 사용해라  

<br>

<pre class="prettyprint lang-java">
// Bad
private void printGuessStatistics(char candidate, int count) {
    String number;
    String verb;
    String pluralModifier;
    if (count == 0) {
        number = "no";
        verb = "are";
        pluralModifier = "s";
    } else if (count == 1) {
        number = "1";
        verb = "is";
        pluralModifier = "";
    } else {
        number = Integer.toString(count);
        verb = "are";
        pluralModifier = "s";
    }
    String guessMessage = String.format("There %s %s %s%s", verb,
    number, candidate, pluralModifier );
    print(guessMessage);
}

// Good
public class GuessStatisticsMessage {
    private String number;
    private String verb;
    private String pluralModifier;
    public String make(char candidate, int count) {
        createPluralDependentMessageParts(count);
        return String.format("There %s %s %s%s", verb, number, candidate, pluralModifier );
    }
    private void createPluralDependentMessageParts(int count) {
        if (count == 0) {
            thereAreNoLetters();
        } else if (count == 1) {
            thereIsOneLetter();
        } else {
            thereAreManyLetters(count);
        }
    }
    private void thereAreManyLetters(int count) {
        number = Integer.toString(count);
        verb = "are";
        pluralModifier = "s";
    }
    private void thereIsOneLetter() {
        number = "1";
        verb = "is";
        pluralModifier = "";
    }
    private void thereAreNoLetters() {
        number = "no";
        verb = "are";
        pluralModifier = "s";
    }
}
</pre>

<br>

### 16. 불필요한 맥락을 없애라 (Don't Add Gratuitous Context)
예를 들어 Gas Station Delux 라는 어플리케이션을 작성한다고 해서 클래스 이름 앞에 GSD 를 붙이지 말자.  
접두어를 붙이는 경우 모듈의 재사용 관점에서도 좋지 못하다. 재사용 하려면 이름을 바꾸어야 한다.  
(ex. GSDAccountAddress 대신 Address 라고만 해도 충분하다.)  

<br>

<div id ="notice--note">

    <p style='margin-top:1em;'>
        <b>📘 ️ Note </b>
    </p>
    좋은 이름은 여러 능력을 요구하는 일이긴 한데, (설명 능력, 문화적 배경 등등)  <br>
    다른 개발자가 반대할까봐, 말을 하지 않는 것보다, 두려워하지 말고 서로의 명명을 지적하고 고쳐야 한다. <br>
    그래야 <b> "자연스럽게 읽히는 코드" </b> 를 짜는데 더 집중 할 수 있다. <br>   
    <p style='margin-top:1em;' />

</div>

<br><br>

# Specific Naming Conventions

---


<div id ="notice--success">

    <p style='margin-top:1em;'>
        <b>🍏️ About </b>
    </p>
    <a href = "https://geosoft.no/javastyle.html"> Java Programming Style Guidelines </a> 의 내용 중
    Specific Naming Conventions 에 대한 내용
    <p style='margin-top:1em;'/>

</div>

### 1. get/set 메서드는 속성에 대해서 직접적인 접근을 할 때 사용해라 
**The terms get/set must be used where an attribute is accessed directly**
<pre class="prettyprint lang-java">
employee.getName();
employee.setName(name);

matrix.getElement(2, 4);
matrix.setElement(2, 4, value);
</pre>

<br>

### 2. is 키워드는 boolean 타입의 변수나 boolean 타입을 리턴하는 메서드 앞에 붙여라 
**is prefix should be used for boolean variables and methods**
<pre class="prettyprint lang-java">

// Bad
// isStatus isFlag 는 적합하지 않다.
isStatus
isFlag
boolean setter( get/set is/set )

// Good
// Setter 메서드에는 다음과 같이 접두어가 설정 되어 있어야 한다.
void setFound(boolean isFound)

// Good
// is 에 대한 대안으로는 has, can, should 접두사가 있다.
boolean hasLicense();
boolean canEvaluate();
boolean shouldAbort = false;
</pre>

<br>

### 3. 어떤 것을 계산하는 경우에는 compute 키워드를 메서드 앞에 붙일 수 있다 
**The term compute can be used in methods where something is computed**
<pre class="prettyprint lang-java">
// 잠재적인 시간 소모적 작업이라는 즉각적인 단서를 제공하고,
// 반복적으로 사용하는 경우 결과를 캐시하는 것을 고려 할 수 있다.
// 용어를 일관되게 사용하면 가독성이 향상된다.
valueSet.computeAverage();
matrix.computeInverse();
</pre>

<br>

### 4. 어떤 것을 찾을 경우에는 find 키워드를 메서드 앞에 붙일 수 있다 
**The term find can be used in methods where somethings is looked up**
<pre class="prettyprint lang-java">
node.findShortestPath(Node destinationsNode);
matrix.findSmallestElement();
</pre>

<br>

### 5. Object 나 어떤 확정적인 작업의 초기화를 할 경우는 initialize 키워드를 메서드 앞에 붙일 수 있다 
**The term initialize can be used where an object or a concept is established**
<pre class="prettyprint lang-java">
// 영국식 initialise 보다 미국식 initialize 를 사용해라.
// init 이라는 단어는 피해라.
printer.initializeFontSet();
</pre>

<br>

### 6. 사용자 인터페이스 구성 요소 이름에는 요소 유형이 접미사로 붙어야 한다 
**User interface components names should be suffixed by the element type**
<pre class="prettyprint lang-java">
widthScale, nameTextField, leftScrollbar, mainPanel, fileToggle, minLabel, printerDialog
</pre>

<br>

### 7. Collection 이나 배열 타입 변수 이름은 복수 형태로 이름을 지어라 
**Plural form should be used on names representing a collection of objects**
<pre class="prettyprint lang-java">
Collection&#60;Point&#62; points;
int[] values;
</pre>

<br>

### 8. object의 갯수를 나타낼 경우는 n 키워드를 변수 앞에 붙일 수 있다 
**n prefix should be used for variables representing a number of objects**
<pre class="prettyprint lang-java">
nPoint, nLine
</pre>

<br>

### 9. 엔티티의 번호를 나타낼 경우에는 No 키워드를 변수 뒤에 붙일 수 있다 
**No suffix should be used for variables representing an entity number**
<pre class="prettyprint lang-java">
tableNo, employeeNo
</pre>

<br>

### 10. iterator 변수들은 i, j, k 등과 같은 이름을 사용해라 
**iterator variables should be called, i, j, k etc**
<pre class="prettyprint lang-java">
for (Iterator i = points.iterator(); i.hasNext(); ) {
  :
}

for (int i = 0; i &#60; nTables; i++) {
  :
}
</pre>

<br>

### 11. 대응 되는 단어를 사용해서 이름을 지어라 
**Complement names must be used for complement entities**
<pre class="prettyprint lang-java">
get/set, add/remove, create/destroy, start/stop, insert/delete,
increment/decrement, old/new, begin/end, first/last, up/down, min/max,
next/previous, old/new, open/close, show/hide, suspend/resume, etc.
</pre>

<br>

### 12. 되도록 축약형을 쓰지 말아라 
**Abbreviations in names should be avoided**
<pre class="prettyprint lang-java">
computeAverage(); // NOT: compAvg();
ActionEvent event; // NOT: ActionEvent e;
catch (Exception exception) { // NOT: catch (Exception e) {
// 일반적인 단어는 축약해서는 안된다.
cmd instead of command
comp instead of compute
cp instead of copy
e instead of exception
init instead of initialize
pt instead of point
etc.
// 약어를 통해 알려진 도메인 문구는 축약해서 사용해라.
HypertextMarkupLanguage instead of html
CentralProcessingUnit instead of cpu
PriceEarningRatio instead of pe
etc.
</pre>

<br>

### 13. boolean 타입 변수 이름은 부정적인 의미로 쓰지 마라 
**Negated boolean variable names must be avoided**
<pre class="prettyprint lang-java">
bool isError; // NOT: isNoError
bool isFound; // NOT: isNotFound
</pre>

<br>

### 14. 서로 관련이 있는 상수들은 상수 앞에 공통 단어를 붙여주는 것이 좋다 
**Associated constants (final variables) should be prefixed by a common type name**
<pre class="prettyprint lang-java">
final int  COLOR_RED   = 1;
final int  COLOR_GREEN = 2;
final int  COLOR_BLUE  = 3;

interface Color
{
    final int RED   = 1;
    final int GREEN = 2;
    final int BLUE  = 3;
}
</pre>

<br>

### 15. 예외 클래스는 클래스 뒤에 Exception 키워드를 붙여라 
**Exception classes should be suffixed with exception** 
<pre class="prettyprint lang-java">
class AccessException extends Exception
{
    :
}
</pre>

<br>

### 16. 디폴트 인터페이스는 인터페이스 앞에 Default 키워드를 붙여라 
**Default interface implementations can be prefixed by default**
<pre class="prettyprint lang-java">
class DefaultTableCellRenderer implements TableCellRenderer
{
  :
}
</pre>

<br>

### 17. 싱글톤 패턴을 구현한 클래스에서 인스턴스를 리턴하는 메서드 이름은 getInstance 라고 붙여라 
**Singleton classes should be return their sole instance through method getInstance**
<pre class="prettyprint lang-java">
public final class UnitManager
{
    private final static UnitManager instance_ = new UnitManager();

    private UnitManager()
    {
        :
    }

    public static UnitManager getInstance()  // NOT: get() or instance() or unitManager() etc.
    {
        return instance_;
    }
}
</pre>

<br>

### 18. 팩토리 패턴을 구현한 클래스에서 인스턴스를 리턴하는 메서드 앞에 new 키워드를 쓸 수 있다 
**Classed that creates instances on behalf of others (factories) can do so through method new [ClassName]**
<pre class="prettyprint lang-java">
class PointFactory
{
    public Point newPoint(...)
    {
        ...
    }
}
</pre>

<br>

### 19. 함수(객체를 반환하는 메서드)는 반환하는 이름을 따서 명명해야 하며 프로시저(void 메서드)는 수행하는 작업을 따라 이름을 지정해야 한다
**Functions (methods returning an object) should be named after what they return and procedures (void methods) after what they do.**
리턴 타입이 void 인 메서드의 경우(procedures) 에는 **무엇을 처리하는지** 를 이름에 쓰는 것이 좋으며,  
object 타입이나 자료형과 같이 리턴 타입이 있는 메서드(functions) 의 경우는 **처리 후 무엇을 리턴하는 지** 를 이름에 쓰는 것이 좋다.  

<br>

# Best practices for java naming convention in programming

---

<div id ="notice--success">

    <p style='margin-top:1em;'>
        <b>🍏️ About </b>
    </p>
    <a href="https://www.dineshonjava.com/best-practices-for-java-naming-convention-in-programming/">
        Best Practices in Programming to Decide Name of Variables, Methods, Classes and Packages 에 대한 내용
    </a>
    <p style='margin-top:1em;'/>

</div>

### 1. Java 네이밍 컨벤션을 따라라 (Follow Java Naming Convention)

| 구분                              | 내용                     |
|---------------------------------|------------------------|
| 클래스 이름 | 대문자로 시작해야 하며, 명사여야 한다  |
| 인터페이스 이름 | 대문자로 시작해야 하며, 형용사여야 한다| 
| 메서드 이름 | 소문자로 시작해야 하며, 동사여야 한다|  
| 변수 이름 | 소문자로 시작해야 한다|           
| 패키지 이름 | 소문자여야 한다               |
|상수 이름 |대문자여야 한다|


<br>

### 2. 의미 없는 변수 이름은 피해라 (Avoid Meaningless Names of Variables) 
xvz, a, aa, bbb, temp 등과 같은 의미 없는 변수 이름은 피해야 한다.  
의미 없는 이름은 의도를 드러내지 않으며 가독성을 떨어뜨린다.  
Hello Java 프로젝트를 만들더라도 무의미하거나 의미 없는 이름을 사용하면 습관이 되기 때문에 절대 사용해서는 안된다  


<br>

### 3. 항상 의미 있는 변수 이름을 사용해라 (Always use Meaningful Names of Variables)

<br>

### 4. 긴 이름보다 짧은 이름이 바람직함 (Shorter name preferable over longer name )
의도가 명확히 드러나는 경우, 긴 이름보다는 짧은 이름이 항상 선호된다. 

<br>

### 5. 짧은 형식보다 설명적인 이름을 선호한다 (Prefer descriptive name over short form)
위의 내용과 대응되는 점인데, 의도가 완전히 드러나는 경우에만 짧은 이름을 선호하고,   
그렇지 않은 경우에는 더 길고 설명이 포함된 이름을 선택해라.  

<br>

### 6. 비슷한 이름은 피해라 (Avoid Similar Names)
예를 들면 employee and employees 와 같은 변수를 사용하지 말아라.  
이는 버그의 원인이 될 수 있고, 코드 검토 중에 이러한 이름을 찾기 어렵다.  
단일 직원인 경우 Employee 를 사용하고, 목록 지원의 경우 listOfEmployees 를 사용해라  

<br>

### 7. 메서드 명명의 일관성 (Consistency in Naming of Methods)
프로그래밍의 모범 사례에 따르면 프로젝트에서는 항상 일관된 명명 규칙을 사용해야한다.  
리소스를 해제하기 위해서 `close()`, `finish()`, `kill()` 등을 사용하는 프로젝트의 경우 이러한 이름은 일관성이 없으므로 리소스 해제를 위해 항상 하나의 이름으로 구성한다.  
이렇게 하면 프로그래머가 더 쉽게 예측하고 검색할 수 있으므로, API 를 더 유용하게 사용할 수 있다.  

<br><br>

# Code Complete 

--- 

<div id ="notice--success">

    <p style='margin-top:1em;'>
        <b>🍏️ About </b>
    </p>
    <a href="https://github.com/xianshenglu/document/blob/master/Code%20Complete%202nd%20Edition.pdf/">
        Code Complete 2 
    </a>
    중에서 Considerations in Choosing Good Names(11.1), Good Routine Names(7.3) 에 대한 내용
    <p style='margin-top:1em;'/>

</div>

## Considerations in Choosing Good Names
<pre class="prettyprint lang-java">
// Bad
x = x - xx;
xxx = fido + SalesTax( fido );
x = x + LateFee( x1, x ) + xxx;
x = x + Interest( x1, x );

// Good
balance = balance - lastPayment;
monthlyTotal = newPurchases + SalesTax( newPurchases );
balance = balance + LateFee( customerID, balance ) + monthlyTotal;
balance = balance + Interest( customerID, balance );
</pre>

<br>

### 네이밍시 가장 중요한 고려사항
**The Most Important Naming Consideration**  
이름이 완전하고, 변수가 나타내는 개체를 정확하게 설명한다.  
이름은 가능한 구체적이어야하고, 모호하거나 하나 이상의 목적으로 사용 될 수 있는 일반적인 이름은 나쁜 이름이다.  

<br>

|Purpose of Variable |Good Names, Good Descriptors |Bad Names, Bad Desciptors|
|--|--|--|
|Running total of checks written to date |runningTotal, checkTotal |written, ct, checks, CHKTTL, x, x1, x2|
|Velocity of a bullet tratin |velocity, trainVelocity, velocityInMph |velt, v, tv, x, x1, x2, train|
|Current date Lines per page |currentDte, todaysDate, linesPerPage |cd, current, c, x1, x2, date, lpp, lines, l, x, x1, x2|

<br>

### 최적의 이름 길이
**Optimum Name Length**  
일반적으로 변수 이름의 길이가 평균적으로 10~16 일 때 프로그램을 디버깅 하기 위해서 들이는 노력을 최소화 할 수 있고,    
변수의 평균 길이가 8 ~ 20인 프로그램은 디버깅 하기 쉽다.  
모든 변수의 이름을 10 ~ 16의 길이로 작성하기 위해 노력할 필요는 없겠지만,    
코드에 짧은 이름의 변수, 또는 굉장히 긴 이름의 변수를 보게 된다면 그 이름이 적절한지 확인 해야한다.    


|구분| 예시                                                                                                          |
|--|-------------------------------------------------------------------------------------------------------------|
|Too Long| numberOfPeopleOnTheUsOlympicTeam <br> numberOfSeatsInTheStadium <br> maximunNumberOfPointsInMordernOlympics |
|Too Short| n, np, ntm, <br> n, ns, nsisd <br> m, mp, max, points                                                       |
|Just Right| numTeamMembers, teamMemberCount <br> numSeatsInStadium, seatCount <br> teamPointsMax, pointsRecord |

<br>

### 범위가 변수명에 미치는 영향
**The Effect of Scope on Variable Names**  
많은 프로그램들은 계산된 값(총계, 평균, 최대값 등)을 보관하는 변수들을 갖는다.  
만약 변수의 이름에 Total, Sub, Average, Max, Min, Record, String, Pointer 등의 한정자를 사용해야 한다면,  
이름의 끝이 이런 수정자를 입력하는 것이 좋다.

<br>

|Good|Bad|
|--|--|
|revenueTotal <br> expenseAverage | totalRevenue <br> averageExpense|

<br>

단 예외적인 경우가 있는데, Num 한정자의 관습적인 위치이다.  
변수의 이름 앞에 있는 Num 은 총계를 가르킨다(numCustomer : 전체 고객의 수)  
변수의 이름 끝에 있는 Num 은 인덱스를 가르킨다(customerNum : 특정 고객의 번호)  
이런 혼란을 피하기 위해 Num 이라는 단어를 피하고 customerCount(전체 고객의 수), customerIndex(특정 고객의 번호) 와 같은 이름을 쓰는 것이 좋다.  

<br>

### 변수 이름에서의 계산값 한정자
**Computed-Value Qualifiers in Variable Names**  
많은 프로그램에는 계산된 값을 포함하는 변수가 있다. Total, Sum, Average, Max, Min, Record 과 같은 한정자를 사용하여 이름을 사용할 경우 **이름 끝에 수식어를 넣는다.**  
이 방법은 몇 가지 이점을 제공한다.  
첫째, 변수의 의미를 가장 많이 주는 부분인 name 이 맨 앞에 있어서 가장 눈에 띄고 먼저 읽힌다.  
둘째, 이 규칙을 제정함으로써 TotalRevenue 와 revenueTotal 을 모두 사용할 경우 발생할 수 있는 혼란을 방지 할 수 있다.  
셋째, revenueTotal, expensionTotal, revenueAverage, expensionAverage 와 같은 일련의 이름은 보기 좋은 대칭을 가지고 있다.  
넷째, 일관성은 가독성을 향상시키고 유지 보수를 용이하게 한다.  


<br>

### 변수 이름에서 일반적인 반대되는 항목
**Common Opposites in Variable Names**  
begin / end  
first / last  
locked / unlocked  
min / max  
next / previous  
old / new  
opened / closed  
visible / invisible  
source / target  
source / destination  
up / down  

<br>

## Good Routine Names
효과적인 이름을 만들기 위한 지침  

<br>

### 루틴이 하는 모든 것을 표현하라
**Describe everything the routine does**  
* ComputeReportTotals() 는 무엇을 하는지 모호하기 때문에 적절한 이름이 아니다.  
* ComputeReportTotalsAndOpenOutputFile() 은 적절한 이름이겠지만, 너무 길다.  
* 이에 대한 해결책은 부수적인 효과를 갖기보다는 직접적인 효과를 유발시키도록 프로그램을 작성하고 그에 맞게 새로운 이름을 짓는 것이다.  

<br>

### 의미가 없거나 모호하거나 뚜렷한 특징이 없는 동사들은 피하라
**Avoid meaningless, vague, or wishy-washy verbs**  
* 어떤 동사들은 신축성이 있고, 모든 의미를 다룬다.  
* HandleCalculation(), PerformServices(), OutputUser(), ProcessInput(), DealWithOutput() 과 같은 이름은 그 루틴이 무엇을 하는지 말해주지 않는다.  
* 루틴의 이름에 뚜렷한 특징이 없기 때문에 문제가 되기도 한다.
* HandleOutput() → FormatAndPorintOut() 으로 변경된다면 루틴이 수행하는 작업에 대해 꽤 잘 알 수 있다.
* 다른 경우에는 일상적인 작업이 수행되기 때문에 동사가 모호하다.
* 이런 경우 해당 루틴을 적절하게 리팩토링하여 명확한 처리를 하도록 해야 한다.

<br>

### 루틴 이름을 숫자만으로 구분하지 말라
**Don’t differentiate routine names solely by number**  
* Part1(), Part2() 또는 OutputUser1(), OutputUser2() 와 같은 이름은 잘못된 이름이다.
* 루틴의 이름 끝에 있는 숫자는 루틴이 표현하는 서로 다른 추상화에 대해서 아무런 정보를 제공하지 않는다.

<br>

### 불필요하게 긴 이름을 짓지마라
**Make names of routines as long as necessary**  
* 연구에 따르면 최적의 변수 이름의 평균 길이는 9~15 자이다.

<br>

### 함수의 이름을 지을 때 리턴 값에 대한 설명을 사용하라
**To name a function, use a description of the return value**
* 리턴 값을 따서 이름을 작성하는 것은 좋은 방법이다. 
* cos(), customerId.Next(), print.IsReady(), pen.CurrentColor() 는 함수가 리턴하는 것을 정확하게 보여주기 때문에 좋은 이름이다.

<br>

### 프로시저의 이름을 지을 때, 확실한 의미를 갖는 동사 다음에 객체를 사용하라
**To name a procedure, use a strong verb followed by an object**
* 프로시저의 이름은 프로시저가 무엇을 하는지를 반영해야 하기 때문에, 객체에 대한 연산은 동사 + 객체의 형태의 이름을 갖는다.
* PrintDocument(), ClacMonthlyRevenues(), CheckOrderInfo(), RepaginateDocument() 는 모두 좋은 프로시저 이름이다.

<br>

### 공통적인 연산을 위한 규약을 만들어라
**Use opposites precisely**

<pre class="prettyprint lang-java">
employee.id.Get()
dependent.GetId()
supervisor()
candidate.id()
</pre>

위 코드는 모두 특정 객체의 식별자를 얻기 위한 코드이다.  
Employee 클래스는 자신의 id 객체를 노출하고 id 객체는 Get() 루틴을 노출했으며,  
Dependent 클래스는 GetId() 루틴을 노출했다.  
Supervisor 클래스는 id 를 기본 리턴 값으로 만들었고,  
Candidate 클래스는 id 객체의 기본 리턴 값이 id 라는 사실을 이용하여 id 객체를 노출 시켰다.  
id 를 가져오는 이름 규칙이 있었다면 이러한 난잡한 코드가 생성되는 현상은 막을 수 있을 것이다.

<br>

<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 개인적인 생각 </b> 
    </p>
    📣 위의 내용을 한 줄로 정리하자면, <b> 의미 전달</b> 이 핵심이 되어야 한다는 것이다. <br>
    <p style='margin-top:1em;' />

</div>


<br><br>

### Reference

---

* [Java Programming Style Guidelines](https://geosoft.no/javastyle.html)
* [Best Practices in Programming to Decide Name of Variables, Methods, Classes and Packages](https://www.dineshonjava.com/best-practices-for-java-naming-convention-in-programming/)
* [Code Complete](https://github.com/xianshenglu/document/blob/master/Code%20Complete%202nd%20Edition.pdf)
* [개발자의 글쓰기](https://t1.daumcdn.net/cfile/tistory/998378465C7B49A329)


<br><br><br>


