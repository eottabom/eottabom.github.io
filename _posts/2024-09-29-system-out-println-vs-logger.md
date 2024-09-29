---
layout: post
title: "Logger vs System.out.println (feat. 코드 까보기)"
description: "Logger vs System.out.println (Dig into the code)"
excerpt: "로거와 System.out.println 를 비교해보고, 왜 System.out.println 을 프러덕션 코드에서 사용하면 안되는지에 대해서 알아보자."
category: Java
comments: true
---

<div id ="notice--info">

    <p style='margin-top:1em;'>
        <b>🐱 Meow, meow </b>
    </p>
    운영 중인 Application 에서는 System.out.print 대신에 Logger 를 이용해야 하는데, <br>
    쓰지 말아야 하는 이유와 어떻게 동작하는지에 대해서 알아보자. (jdk 21 기반으로 작성됨)
    <p style='margin-top:1em;'/>  

</div>

## System.out.println

---

`System.out.print` 에서 `out` 은 static 변수로 `PrintStream` 클래스로 할당되고, 이 변수는 JVM 이 초기화 될 때 설정된다.  


<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/print/print-stream-out.png" alt="print-stream-out" />
</div>

<br>

`PrintStream` 은 매개변수로 전달받은 값을 console 에 출력하게 되고,  

<pre class="prettyprint lang-java">

    private final InternalLock lock;
    
    (....)
    
    public void println(String x) {
        if (getClass() == PrintStream.class) {
            writeln(String.valueOf(x));
        } else {
            synchronized (this) {
                print(x);
                newLine();
            }
        }
    }
    
    (....)
    
    private void writeln(char[] buf) {
        try {
            if (lock != null) {
                lock.lock(); // lock 객체가 있으면 락을 걸어준다.
                try {
                    implWriteln(buf);
                } finally {
                    lock.unlock(); // lock 해제
                }
            } else {
                synchronized (this) {
                    implWriteln(buf); // lock 객체가 없으면 this 객체에 대해서 동기화 처리
                }
            }
        }
        catch (InterruptedIOException x) {
            Thread.currentThread().interrupt();
        }
        catch (IOException x) {
            trouble = true;
        }
    }

</pre>

<br>

내부적으로 `synchronized` 와 `lock (InternalLock)` 으로 `thread-safe` 하게 동작하게 설계 되어 있다.  
하지만, 메서더를 호출하는 스레드가 해당 블록 내의 작업을 **단일 스레드로 처리** 하게 만들기 때문에  
여러 스레드가 동시에 이 메서드에 접근할 경우 **병목** 이 발생할 수 있다.  

<br>

`synchronized` 나 `lock` 를 사용한 동기화는 **Race Condition(경쟁 조건)** 을 막아주만, 성능 상의 문제를 일으킬 수 있다.  

### System.out.println 장단점

|장점|단점|
|--|--|
|사용이 간단하고 직관적|Thread-safe 를 위해 동기화를 사용하므로 성능 저하가 발생|
|별도의 설정이나 라이브러리가 필요 없음|로그 레벨 구분이나 파일 출력 등 고급 기능이 없음|
|즉시 콘솔에 출력되어 디버깅에 유용|프러덕션 환경에서 사용하기 어려움|


<br>

## Logback

---

`Logback` 의 `AsyncAppenderBase` 는 비동기적으로 로그 이벤트를 처리하는 클래스이다.  
이 클래스는 `AppenderBase` 를 상속 받아 구현되어 있는데, 비동기 처리 방식으로 로그를 쌓고 치리하는 기능을 제공한다.  


<div style="text-align: center;">
  <img src="{{site.baseurl}}/img/post/print/async-appender-base.png" alt="async-appender-base" />
</div>

<br>

위의 코드에서 `BlockingQueue<E> blockingQueue`, `worker`, `discardedCount` 가 비동기처리를 위한 중요한 역할을 하는데,  
* `BlockingQueue<E> blockingQueue`
  * 로그 이벤트를 임시로 저장하는 Queue
  * `BlockingQueue` 는 이벤트가 처리되지 않았을 때 스레드가 대기 할 수 있도록 설계됨
* `worker`
  * 실제로 이벤트를 처리하는 `worker` 스레드로 `AsyncAppenderBase` 가 시작 되면 **백그라운드**에서 실행되며, `blockingQueue` 에서 이벤트를 꺼내서 로그로 출력한다.
* `discardedCount`
  * Queue 가 꽉 차서 더 이상 이벤트를 추가하지 못할 때, 버려진 로그 이벤트의 수를 기록하는 필드

<br>

### `AsyncAppenderBase` 의 주요 동작 흐름
<br>

#### 1) 로그 이벤트 추가
* `append()` 메서드가 호출되면 로그 이벤트를 `blockingQueue` 에 추가
* Queue 가 가득 찼을 때의 동작은 설정에 따라 다르다 (blocking or 이벤트 폐기)

#### 2) 이벤트 처리
* `worker` 스레드가 지속적으로 `blockingQueue` 에서 이벤트를 가져와 처리
* 이 과정은 main thread 와 별개로 동작하여 성능 향상의 이점

#### 3) 종료 처리
* `stop()` 메서드 호출시 남은 이벤트를 모두 처리하고 `worker` 스레드를 안정하게 종료 

<br>

따라서, Logback 의 `AsyncAppender` 를 이용하면,  
로그 메시지를 비동기적으로 처리하여 I/O 작업이 메인 스레드의 성능에 영향을 미치지 않도록 하고,  
Queue 를 사용하여 메인 스레드가 로그 출력에 시간을 소비하지 않도록 하여 동시성 문제를 방지한다.  

<div id="notice--warning">

    🏷️ 비동기 처리로 인해서 로그의 순서가 약간 뒤바뀔 수도 있고, Application 비정상 종료시에 마지막 로그가 손실 될 수도 있다. <br>

</div>

<br>

## System.out.println vs java.util.logging vs logback Benchmark

---

`System.out.println` 과 `java.util.logging` 그리고 `logback` 을 이용해서 멀티스테드 환경에서 JMH(Java Microbenchmark Harness) 로 로깅 성능 비교를 해보았다.  
logger 는 logger 를 켰을 때와 OFF 시켰을 때, 그리고 `logback` 의 `AsyncAppender` 설정을 추가하여, 로그 메시지를 비동기적으로 처리하여 테스트 하였다.

<div id="notice--note">

    <p style='margin-top:1em;'> 
      <b> 📘 Note - logback 에서 AsyncAppender 를 사용하면? </b> 
    </p>
    ✏️ <b> 메인 쓰레드의 부하 감소 </b> <br> 
    - 로그 이벤트는 즉시 처리되는 대신, 큐에 저장되었다가 별도의 쓰레드가 처리해서 메인 쓰레드의 작업은 빠르게 된다. <br>
    ✏️ <b> 쓰레드 간 I/O 경쟁 감소 </b> <br>
    - 동기적인 로깅은 많은 쓰레드가 동시에 출력하려고 할 때 I/O 작업에서 병목이 발생할 수 있는데, 이를 완화해준다.
    <p style='margin-top:1em;' />

</div>

<br>

logback 의 `AsyncAppender` 설정 예시

<pre class="prettyprint lang-java">
&#60;configuration&#62;
    &#60;appender name=&#34;STDOUT&#34; class=&#34;ch.qos.logback.core.ConsoleAppender&#34;&#62;
        &#60;encoder&#62;
            &#60;pattern&#62;%d{HH:mm:ss.SSS} [&#37;thread] &#37;-5level &#37;logger{36} - &#37;msg&#10; &#60;/pattern&#62;
        &#60;/encoder&#62;
    &#60;/appender&#62;

    &#60;appender name=&#34;ASYNC&#34; class=&#34;ch.qos.logback.classic.AsyncAppender&#34;&#62;
        &#60;appender-ref ref=&#34;STDOUT&#34;&#47;&#62;
    &#60;/appender&#62;

    &#60;root level=&#34;info&#34;&#62;
        &#60;appender-ref ref=&#34;ASYNC&#34;&#47;&#62;
    &#60;/root&#62;
&#60;/configuration&#62;

</pre>

<br>

아래와 같은 결과를 얻을 수 있는데,

<br>

| Benchmark                               |Mode|Cnt| Score    | Error           | Units |
|-----------------------------------------|--|--|----------|-----------------|-------|
| LoggingBenchmark.benchmarkJavaLoggerDisabled | thrpt| 10 | 2618.238 | ±  90.077  | ops/s |
| LoggingBenchmark.benchmarkJavaLoggerEnabled  | thrpt| 10   | 2.986 | ±   0.711  | ops/s |
| LoggingBenchmark.benchmarkLoggerDisabled     | thrpt| 10 | 2480.615 | ± 272.262 | ops/s |
| LoggingBenchmark.benchmarkLoggerEnabled      | thrpt| 10 | 1419.497 | ± 221.123 | ops/s |
| LoggingBenchmark.benchmarkSystemOutPrintln   | thrpt| 10  |    6.468 | ±   0.692 | ops/s |


<div id="notice--warning">

    🏷️ <a href="https://github.com/eottabom/lego-piece/tree/main/benchmark">벤치 마크 결과 보기 (클릭)</a> <br>
    🏷️ <a href="https://github.com/eottabom/lego-piece/tree/main/benchmark/src/main/java/lego/benchmark/logger">벤치 마크 코드 보러가기 (클릭)</a>

</div>

<br>

#### 1) LoggerDisabled vs LoggerEnabled 
* Logger 를 비활성화 했을 때 성능이 우수한 것을 볼 수 있는데, Logging 작업 자체가 어느 정도의 오버헤드를 가지고 있다는 것을 알 수 있다.

#### 2) JavaLoggerEnabled vs LoggerEnabled
* `Logback` 이 `java.util.logging` 보다 훨씬 높은 성능을 보여주는데, Logback 의 효율적인 구현과 비동기 처리 때문이다.

<div id="notice--warning">

    🏷️ `java.util.logging` 도 비동기 로깅을 하기 위해서 별도로 커스텀 핸들러를 구현하면 비동기처리가 가능하긴하다.

</div>

#### 3) SystemOutPrintln
* 동기적 처리와 I/O 작업의 직접적인 수행 때문에 가장 낮은 성능을 보여주고 있다. 

<br>
  
따라서, 프러덕션 환경에서 `System.out.println` 을 사용하는 경우 성능에 치명적인 영향을 줄 수 있다. 

<br>

<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 요약 </b> 
    </p>
    🖐 System.out.println 와 같은 방법은 사용이 간단하지만, 동기적 처리로 인해 <b>성능 저하</b> 와 <b>스레드 블로킹</b> 문제가 있다. <br>
    🖐 비동기 로깅 방식은 별도의 스레드와 큐를 사용해서 어플리케이션 성능 향상을 도모한다. <br>
    
    <p style='margin-top:1em;' />

</div>


<br><br>

## Reference

---

* [10. 로그는 반드시 필요한 내용만 찍자](https://velog.io/@jsj3282/10.-%EB%A1%9C%EA%B7%B8%EB%8A%94-%EB%B0%98%EB%93%9C%EC%8B%9C-%ED%95%84%EC%9A%94%ED%95%9C-%EB%82%B4%EC%9A%A9%EB%A7%8C-%EC%B0%8D%EC%9E%90)
* [코드로 뜯어보는 System.out.println 대신 logger 를 사용해야 하는 이유](https://liltdevs.tistory.com/180)
* [System.out.println() 동작원리 native method까지 까보기](https://code-run.tistory.com/8)

<br>
