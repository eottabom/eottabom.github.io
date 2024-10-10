---
layout: post
title: "try-with-resources 를 이용한 자원해제"
description: "Let's find out how to de-resource and operate using try-with-resources"
excerpt: "try-with-resources 를 이용한 자원해제와 동작 방식에 대해서 알아보자."
category: Java
comments: true
---

<div id ="notice--info">

    <p style='margin-top:1em;'>
        <b>🐱 Meow, meow </b>
    </p>
    Java 7 에서는 Try-With-Resources 라는 기능이 도입되었는데, <br>
    이 기능의 개념을 알아보고, 효과적으로 사용하는 방법에 대해서 알아보자.
    <p style='margin-top:1em;'/>  

</div>

## try-with-resources ?

---

[Java 7 - try-with-resources](https://docs.oracle.com/javase/7/docs/technotes/guides/language/try-with-resources.html) 에서 새로 나온 기능인,  
`try-with-resources` 는 "_자동 리소스 관리_" 기능인데, 여기서 **리소스** 란, 파일, 네트워크 연결과 같은 리소스를 의미한다.  
파일, 네트워크 연결과 같은 리소스는 사용하면 명시적으로 `close` 를 해야하는데, 이를 잊는 경우에는 리소스 누수가 발생하여 성능 문제로 이어질 수 있다.

<div id="notice--warning">

    🏷️ 보통 finally 블록을 이용해서 자원 해제(close) 해왔었다.

</div>

`try-with-resources` 를 사용하면, 더 이상 리소스가 필요하지 않을 때, 자동으로 `close` 하여, 리소스 관리를 간소화할 수 있게 된다.

<br>

아래 코드를 보면 명시적으로 `finally` 블록에서 `BufferedReader` 를 `close` 하여 수동으로 자원 해제를 했었는데,

<pre class="prettyprint lang-java">
public class WithoutTryWithResources {
    public static void main(String[] args) {
        BufferedReader reader = null;
        try {
            reader = new BufferedReader(new FileReader("example.txt"));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (reader != null) {
                try {
                    reader.close();  // 자원을 수동으로 해제
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
</pre>

<br>

`try-with-resources` 를 사용하게 되면, `try()` 구문에서 사용하는 리소스를 초기화하고,  
별도의 `close` 구문 없이 자원이 해제 시킬 수 있다.

<pre class="prettyprint lang-java">
public class WithTryWithResources {
    public static void main(String[] args) {
        try (BufferedReader reader = new BufferedReader(new FileReader("example.txt"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }  // 자원이 자동으로 해제됨
    }
}
</pre>

<div id="notice--warning">

    🏷️ 이 때, try() 에 있는 자원은 <b>AutoCloseable</b> 을 구현한 객체여야 한다.

</div>

<br>

## try-with-resources 동작 방식

---

<br>

### Q. 그러면 try-with-resources 는 어떻게 자원을 해제할까?

`try-with-resources` 는 `AutoCloseable` 인터페이스를 사용해서 구현되는데,  
위 예시에서 사용한 `BufferedReader` 는 `Reader` 를 상속받고,  
`Reader` 는 `AutoCloseable` 를 상속한 `Closeable` 인터페이스를 구현한 클래스다.  

`Reader` 는 `close()` 를 구현했기 때문에, `try-with-resources` 를 사용하면 별도의 자원 해제를 하지 않아도 자원이 해제된다.
`Reader` 의 소스 일부를 보면 `close()` 메서드에서 자원을 닫는 것을 볼 수 있다. 

<pre class="prettyprint lang-java">
public static Reader nullReader() {
    return new Reader() {
        private boolean closed = false;

        // 중략 ...
        @Override
        public int read(char[] cbuf, int off, int len) throws IOException {
            Objects.checkFromIndexSize(off, len, cbuf.length);
            if (closed) {
                throw new IOException("Stream closed");
            }
            return -1; // null reader 에서는 아무 것도 읽지 않음
        }

        @Override
        public void close() {
            closed = true;  // 자원을 닫음
        }
    };
}
</pre>

<br>

`AutoCloseable` 은 `close()` 메서드를 구현하도록 강제하는 인터페이스인데,  
`BufferedReader`, `FileInputStream`, `Connection` 과 같은 클래스들은 모두 `AutoCloseable` 또는 `Closeable` 인터페이스를 구현한다.

<div id="notice--warning">

    <b> 🏷️ AutoCloseable vs Closeable </b> <br>
    ➡️ AutoCloseable : close() 메서드를 반드시 구현해야하고, Excexption 을 던질 수 있다. <br>
    ➡️ Closeable : AutoCloseable 의 하위 인터페이스로 주로 I/O 클래스에서 사용되며, 명시적으로 IOException 을 던질 수 있다.
    <p style='margin-top:1em;' />

</div>

<div id="notice--note">

    <p style='margin-top:1em;'> 
      <b> 📘 Note - `try-with-resources` 의 구체적인 동작방식 </b> 
    </p>
    ✏️ 자원 생성 <br>
    ➡️ try() 괄호 안에 있는 자원 초기화 <br>
    ✏️ 블록 실행 <br>
    ➡️ try 블록 안의 코드가 실행 <br>
    ✏️ 자원 해제 <br>
    ➡️ try 블록이 끝나거나, 예외가 발생하면, close() 메서드가 자동으로 호출 <br>
    ➡️ try 블록 내에서 예외가 발생하고, close() 메서드에서도 예외가 발생하는 경우 <br>
    ➡️ 첫 번째 예외는 발생한 예외로 처리되고, close() 에서 발생한 예외는 suppressed exception 으로 저장되고 Trowable.getSuppressed() 를 통해 확인 가능하다.
    <p style='margin-top:1em;' />

</div>

#### AutoCloseable vs Closeable

##### 1) AutoCloseable
* Java 7 에서 도입된 인터페이스
* **어떤 종류의 예외(Exception)** 도 던질 수 있다.
* 모든 리소스를 처리할 수 있으며, I/O 관련 리소스 뿐만 아니라 다양한 자원에서 사용된다.
* `try-with-resources` 구문에서 리소스를 자동으로 닫을 수 있도록 해주는 기본 인터페이스

##### 2) Closeable
* Java 5 에서 도입된 인터페이스로, `AutoCloseable` 의 하위인터페이스
* **IOException** 을 던질수 있도록 제한됨
* I/O 스트림을 닫기 위한 목적으로 만들어짐

|구분|AutoCloseable|Closeable|
|--|--|--|
|도입시기|Java 7|Java 5|
|예외처리|어떤 종류의 예외도 던질수 있음|`IOException` 만 던질 수 있음|
|용도|다양한 자원 처리|주로 I/O 리소스 처리|


<br>

## try-with-resources 의 이점

---

### 1) 단순성
* `try-with-resources` 는 `try-catch-finally` 블록을 사용하는 것보다 더 간결하고 읽기 쉽게 만든다.

### 2) 자동 종료
* 예외가 발생하더라도 리소스가 항상 적절하게 해제되도록 보장하여 리소스 누출 가능성을 줄여준다.

### 3) 향상된 코드 품질
* `finally` 블록에서 리소스를 닫는 등의 보일러플레이트 코드가 필요 없게 된다.

### 4) 오류처리
* 같은 블록 내에서 예외를 직접 잡을 수 있기 때문에 예외 처리가 더 간결하다.

<br>

<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 요약 </b> 
    </p>
    🖐 try-with-resources 를 이용하면 AutoCloseable 인터페이스를 구현한 자원들은 try() 구문에서 자동으로 close() 된다. <br>
    🖐 finally 블록 없이 간결한 코드를 작성할 수 있고, 리소스 누출 가능성을 줄일 수 있다. <br>
    <p style='margin-top:1em;' />

</div>

<br><br>

## Reference

---

* [How To Use Try With Resource In Java  Exception Handing](https://medium.com/thefreshwrites/how-to-use-try-with-resource-in-java-9c0b4ae48d21)
* [Try-With-Resources In Java: Simplifying Resource Management](https://medium.com/@reetesh043/using-try-with-resources-in-java-simplifying-resource-management-bd9ed8cc8754)
* [Java – Try with Resources](https://www.baeldung.com/java-try-with-resources)
* [Java try-with-resources examples](https://www.codejava.net/java-core/the-java-language/using-try-with-resources-examples-java-7)
* [How To Write Better Java with Try-With-Resources](https://thecodinginterface.com/blog/java-try-with-resources/)

<br>
<br>
