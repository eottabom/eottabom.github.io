---
layout: post
title: "Lombok 사용 시 유의해야 할 사항 + Lombok 의 단점"
description: "Points to Note When Using Lombok + Disadvantages of Lombok"
excerpt: "Java 에서 Lombok 사용 시 유의해야 할 사항과 단점에 대해서 알아보자."
category: [Java, Lombok]
comments: true
---

<div id ="notice--info">

    <p style='margin-top:1em;'>
        <b>🐱 Meow, meow </b>
    </p>
    Lombok 은 보일러플레이트(boilerpalte) 코드를 줄이기 위해 사용되는 유용한 라이브러리다. <br>
    하지만, Lombok 을 사용할 때 유의해야 할 사항들이 몇가지 있는데, 어떤 것들이 있을까?
    그리고, Lombok 의 단점에 대해서 간략히 알아보자.
    <p style='margin-top:1em;'/>  

</div>


## JPA + Lombok 에서 주의 사항 

---

### equals and hashCode

Entity 에는 주로 `@EqualsAndHashCode` 또는 `@Data` 어노테이션을 붙인다.


<div id="notice--note">

    <p style='margin-top:1em;'> 
      <b> 📘 Note </b> 
    </p>
    ✏️ `@Data` 어노테이션은 `@Getter`, `@Setter`, `@ToString`, `@EqualsAndHashCode`, final 필드나, `@NonNull` 이 붙은 필드를 초기화 하는 생성자(`@RequiredArgsConstructor`)도 생성한다.
    <p style='margin-top:1em;' />

</div>

<br>

`@EqualsAndHashCode` 의 문서[(바로 가기)](https://projectlombok.org/features/EqualsAndHashCode)에는 아래와 같이 명시되어 있다.

<br>

> By default, it'll use all non-static, non-transient fields, 
> but you can modify which fields are used (and even specify that the output of various methods is to be used) 
> by marking type members with `@EqualsAndHashCode.Include` or `@EqualsAndHashCode.Exclude`

<br>

`@EqualsAndHashCode.Include` 또는 `@EqualsAndHashCode.Exclude` 로 사용하는 필드를 지정할 수 있다.  

JPA Entity 에 대한 `equals()` 와 `hashCode()` 구현은 신중해야 한다.  

<br>

JPA Entity 는 일반적으로 가변적(mutable) 인데, 이 때 `equals()` 와 `hashCode()` 메서드는 동등성 비교에 사용된다.  
따라서, JPA Entity 에서 `@EqualsAndHashCode` 또는 `@Data` 을 사용하게 되면 문제가 발생할 수가 있다.  

<br>

#### 1. ID 의 지연 할당
* 대부분의 경우 Entity 의 `id` 필드는 database 에 Entity 가 처음으로 저장될 때 생성되는데, 이 때 `id` 가 없거나, 아직 설정되지 않을 수가 있다.
* Entity 를 새로 생성하고 이를 영속화(persist) 하기 전까지는 `id` 가 `null` 일 수 있어서, `equals()` 와 `hashCode()` 를 작성할 때 `id` 를 사용하는 것은 문제가 될 수 있다.

<br>

아래와 같은 `User` 객체가 있다고 할 때,

<pre class="prettyprint lang-java">
@Entity
@Table(name = "users")
@NoArgsConstructor
@RequiredArgsConstructor
@Data
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NonNull
	private String name;

	@NonNull
	private String email;

}
</pre>

<br>

영속화 이전에는 id 가 null 이므로, `equals()`와 `hashCode()`가 같게 동작하지만,  
영속화 이후 id 가 할당되면, 서로 다른 객체로 인식 되는 문제가 있다.

<pre class="prettyprint lang-java">
	@Test
	@Transactional
	void equalsAndHashCodeBeforeAndAfterPersist() {
		User firstUser = new User("tester", "tester@example.com");
		User secondUser = new User("tester", "tester@example.com");

		// 영속화 전에는 id가 null 이므로, equals()와 hashCode()가 같게 동작한다.
		assertThat(firstUser).isEqualTo(secondUser);
		assertThat(firstUser.hashCode()).isEqualTo(secondUser.hashCode());

		this.entityManager.persist(firstUser);
		this.entityManager.persist(secondUser);
		this.entityManager.flush(); // 실제로 DB에 반영하여 id 할당

		// 영속화 이후에 id 가 할당되면, 서로 다른 객체로 인식될 수 있다.
		assertThat(firstUser).isNotEqualTo(secondUser);
		assertThat(firstUser.hashCode()).isNotEqualTo(secondUser.hashCode());
	}
</pre>

<br>

#### 2. equals 와 hashCode 의 구현 어려움
* `hashCode()` 는 객체의 고유 식별 정보를 바탕으로 계산되는데, Entity 가 처음 생성될 때 고유 식별자가 없어서, 어떤 필드도 `hashCode()` 를 안정적으로 계산하는데 사용 할 수 없다.
* `equals()` 와 `hashCode()` 에서 `id` 를 사용할 때 `id` 가 할당되지 않은 상태에서 같은 객체를 다르게 판단하거나 같은 Entity 여도 다른 hashCode 를 가질 수 있다. 
  * 이로 인해서 `HashSet` 이나 `HashMap` 같은 컬렉션에서 예상치 못한 동작이 발생할 수 있다.

<br>

<pre class="prettyprint lang-java">
	@Test
	@Transactional
	void hashCodeIssueWithIdAssignment() {
		Set&#60;User&#62; users = new HashSet&#60;&#62;();

		User user = new User("tester", "tester@example.com");

		assertThat(users.add(user)).isTrue(); // 성공적으로 추가됨
		assertThat(users.contains(user)).isTrue(); // Set 에 포함됨

		user.setId(1L);

		// 같은 객체임에도 불구하고 id가 바뀌었으므로 Set 에서 찾을 수 없음
		// assertThat(users.contains(user)).isFalse(); // 여기서 실패.

		// Set 에 다시 추가할 경우, 같은 객체임에도 불구하고 다시 추가될 수 있음
		// assertThat(users.add(user)).isTrue();

		users.add(user); // 같은 객체임에도 id 가 null 에서 1L 로 변경이 되어서, 
		assertThat(users).hasSize(2); // 다시 추가되어서 Set 의 size 가 2가 된다.
	}
</pre>

<br>

### Accidentally Loading Lazy Attributes

`@EqulasAndHashCode` 는 기본적으로 모든 필드를 포함하는데, `@ToString` 도 마찬가지다. [(문서 바로가기)](https://projectlombok.org/features/ToString)

> Any class definition may be annotated with @ToString to let lombok generate an implementation of the toString()method.
> By default, it'll print your class name, along with each field, in order, separated by commas.

<br>

기본적으로 객체의 모든 필드에서 `equals()`, `hashCode()`, `toString()` 을 호출한다.  
JPA Entity 에서 Lazy 속성을 로드하는 것과 같은 실수를 유발한다.

예를 들어, Lazy `@OneToMany` 에서 `hashCode()` 를 호춯하면 모든 엔티티를 가져 올 수 있는데, 이때 어플리케이션 성능에 영향을 미치게 된다.  
트랜잭션 외부에서 발생하는 경우에는 `LazyInitializationException` 으로 이어질 수도 있다.

`@ToString` 은 Lazy 필드를 제외해야하고, 제거하고 싶은 필드에/사용하고 싶은 필드에 `@ToString.Exclude/@ToString.Include` 를 사용하거나,  
클래스에 `@ToString(exclude = {"필드명"})` 을 사용하여 원하는 필드를 제외하거나,  
`@ToString(of = {"필드명"})` 를 사용하여 `toString()` 에 포함하고 싶은 필드만 명시적으로 설정할 수 있다.


<br>

### Missing No-Argument Constructor

JPA 스펙에 따르면, 모든 Entity 클래스는 public, protected 인 기본 생성자가 필요하다.

<div id="notice--note">

    <p style='margin-top:1em;'> 
      <b> 📘 Note </b> 
    </p>
    ✏️ JPA 구현체가 Entity 를 리플렉션을 통해 인스턴스화 할 때 사용되고, 기본 생성자가 있어야 JPA 가 데이터베이스에서 데이터를 읽고 해당 데이터를 Entity 객체로 변환할 수 있다.
    <p style='margin-top:1em;' />

</div>

하지만, `@AllArgsConstructor` 는 기본 생성자를 제공하지 않는다. `@Builder` 도 마찬가지다.  
따라서, 항상 `@NoArgsConstructor` 와 함께 사용해야한다.

<br>

<div id="notice--warning">

    <p style='margin-top:1em;'> 
      <b> 🏷️ Lombok 을 사용할 때 유의해야하는 점</b> 
    </p>
    ✏️ JPA Entity 를 사용할 때 `@EqualsAndHashCode` 와 `@Data` 를 같이 사용하지 않는다. <br>
    ✏️ `@ToString` 을 사용할 때는 항상 lazy 속성을 제외한다. <br>
    ✏️ `@Builder`, `@AllArgsConstructor` 를 사용할 때 `@NoArgsConstrcutor` 를 사용해라. 
    <p style='margin-top:1em;' />

</div>

<br>


## Lombok 사용시, Entity 동등성 비교와 해시코드를 제대로 구현하는 방법

--- 


#### 1) 비즈니스 Key 사용

* Entity 의 자연 키(natural key) 또는 비즈니스 키를 사용하여 `equals()` 와 `hashCode()` 를 구현한다.  
* `User` 객체에서 `name`, `email` 필드를 비즈니스 키로 사용하여 `equals()` 와 `hashCode()` 로 구현할 수 있다.  

<br>

<pre class="prettyprint lang-java">
@Entity
@Table(name = "users")
@NoArgsConstructor
@RequiredArgsConstructor
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String name;

    @NonNull
    private String email;

    // 비즈니스 키인 name 과 email 을 기반으로 equals, hashCode 재정의
    @Override
    public boolean equals(Object o) {
        if (this == o) {
          return true;
        }
        if (o == null || getClass() != o.getClass()) {
          return false;
        }
        User user = (User) o;
        return Objects.equals(name, user.name) &&
               Objects.equals(email, user.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, email);
    }
}
</pre>

<br>

#### 2) 불변 필드 사용

* `name` 과 `email` 필드에 `final` 키워드를 추가하여 생성 시에만 값을 설정하고, 이후에는 변경 할 수 없도록 할 수 있다.
이러한 방법은 Entity 의 상태가 예기치 못하게 변경되는 것을 방지한다.
* JPA 는 기본 생성자가 필요한데, `@NoArgsConstructor(access = AccessLevel.PROTECTED)` 를 사용하여 기본 생성자를 `protected` 로 선언하여, JPA 각 객체를 생성할 수 있도록 허용하지만, 다른 곳에서는 기본 생성자를 호출하지 못하도록 한다.
* `name` 과 `email` 필드는 생성 후 변경 할 수 없으므로, `setter` 메서드를 제공하지 않아 필드 값이 변경되지 않도록 설계할 수 있다.

<br>

<pre class="prettyprint lang-java">
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA 를 위한 기본 생성자
@Getter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // id는 JPA 가 자동으로 할당

    @NonNull
    @Column(nullable = false)
    private final String name;

    @NonNull
    @Column(nullable = false, unique = true)
    private final String email;

    // 비즈니스 키인 name 과 email 을 기반으로 equals, hashCode 재정의
    @Override
    public boolean equals(Object o) {
        if (this == o) {
          return true;
        }
        if (o == null || getClass() != o.getClass()) {
          return false;
        }
        User user = (User) o;
        return Objects.equals(name, user.name) &&
               Objects.equals(email, user.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, email);
    }
}
</pre>

<br>

#### 3) 복합 키 사용

* 복합 키를 사용하여 여러 필드를 조합하여 고유성을 보장하고, `@EqualsAndHashCode` 를 사용하여 특정 필드들을 묶어 고유성을 검증 할 수 있다.

<br>

<pre class="prettyprint lang-java">
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@RequiredArgsConstructor
@EqualsAndHashCode(of = {"name", "category", "brand"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String name;

    @NonNull
    private String category;

    @NonNull
    private String brand;
}
</pre>

<br>

#### 4) 별도의 식별자 필드 도입

* 데이터베이스 ID 와는 별도로 어플리케이션 레벨에서 고유한 식별자를 생성하고, 이를 엔티티 생성시 즉시 할당하는 방식
* `UUID` 를 사용해서 어플리케이션 레벨의 고유성을 보장하는 필드로 사용하고 데이터베이스와 독립적인 고유한 식별자를 생성한다.

<br>

<pre class="prettyprint lang-java">
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@RequiredArgsConstructor
@EqualsAndHashCode(of = {"uuid"})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private final UUID uuid = UUID.randomUUID();  // 엔티티 생성 시 UUID 할당

    @NonNull
    private String customerName;
}
</pre>

<br>

#### 5) 지연 해시코드 계산 
* `hashCode()` 를 초음 호출할 때 계산하고, 그 결과를 캐시하여 재사용하는 방법
* 성능 최적화를 할 수 있고, ID 가 할당된 후에만 해시코드를 계산할 수 있다.

<br>

<pre class="prettyprint lang-java">
@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
@RequiredArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String email;

    @NonNull
    private String name;

    private int cachedHashCode = 0;

    @Override
    public int hashCode() {
        if (cachedHashCode == 0) {
            cachedHashCode = Objects.hash(id != null ? id : email, name);
        }
        return cachedHashCode;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
          return true;
        }
        if (o == null || getClass() != o.getClass()) {
          return false;
        }
        Customer customer = (Customer) o;
        return Objects.equals(email, customer.email) && Objects.equals(name, customer.name);
    }
}
</pre>

<br>

#### 6) 동등성 비교 전략 분리
* `equals()` 와 `hashCode()` 에서 ID 가 없을 때는 비즈니스 필드로 비교하고, ID 가 있을 때는 ID 로 비교한다.

<br>

<pre class="prettyprint lang-java">
@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@RequiredArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String name;

    @NonNull
    private String email;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
          return true;
        }
        if (o == null || getClass() != o.getClass()) {
          return false;
        }
        Employee employee = (Employee) o;

        // ID가 null 일 때는 비즈니스 필드를 사용해 비교
        if (id == null || employee.id == null) {
            return Objects.equals(name, employee.name) && Objects.equals(email, employee.email);
        }

        // ID가 존재할 경우, ID로 비교
        return Objects.equals(id, employee.id);
    }

    @Override
    public int hashCode() {
        // ID가 존재할 경우, ID로 해시코드 계산
        if (id != null) {
            return Objects.hash(id);
        }
        // ID가 없을 경우, 비즈니스 필드로 해시코드 계산
        return Objects.hash(name, email);
    }
}
</pre>

<br>

#### 7) 명시적 버전 필드 사용
* Entity 의 버전 필드인 `@Version` 을 사용하여 버전 관리 및 동등성 계산에 포함시킨다.

<br>

<pre class="prettyprint lang-java">
@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@RequiredArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    private String title;

    @Version
    private int version;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
          return true;
        }
        if (o == null || getClass() != o.getClass()) {
          return false;
        }
        Document document = (Document) o;
        return Objects.equals(title, document.title) &&
               Objects.equals(version, document.version);
    }

    @Override
    public int hashCode() {
        return Objects.hash(title, version);
    }
}
</pre>

<br>

#### 8) 불변 엔티티 설계
* Entity 를 불변으로 설계하여 Entity 가 생성된 이후에는 상태를 변경할 수 없도록 한다.
* 동등성 문제를 원천적으로 방지하는 방법이다.

<br>

<pre class="prettyprint lang-java">
@Entity
@Table(name = "addresses")
@Getter
@RequiredArgsConstructor
public final class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private final Long id;

    @NonNull
    private final String street;

    @NonNull
    private final String city;

    @NonNull
    private final String zipCode;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
          return true;
        }
        if (o == null || getClass() != o.getClass()) {
          return false;
        }
        Address address = (Address) o;
        return Objects.equals(street, address.street) &&
               Objects.equals(city, address.city) &&
               Objects.equals(zipCode, address.zipCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(street, city, zipCode);
    }
}

</pre>




<br><br>

## Q. 주의 사항을 잘 지킨다면, Lombok 을 사용하는 것이 좋은거 아닐까요?

---

A. 사실 실제로도 많은 커뮤니티에서는[바로가기](https://www.reddit.com/r/java/comments/mpd0gw/is_using_project_lombok_actually_an_good_idea/) `Lombok` 사용에 대한 찬성과 반대가 많이 이루어지고 있어서 좋다 나쁘다를 명확히 설명하긴 어려울 것 같다. <br>
반대하는 입장에서는 Lombok 을 사용할 때의 단점들 때문인데, 그 단점에 대해서 간단히 알아보자. <br>


### 1. 코드 가독성 저하

* 아래의 코드는 간단해 보일 수도 있지만, 실제로는 많은 메서드들을 생성한다.
* 코드의 실제 동작을 파악하기 위해서는 Lombok 에 대한 깊은 이해가 필요하다.

<pre class="prettyprint lang-java">
@Data
public class User {
    private String name;
    private int age;
}
</pre>

<br>

### 2. IDE 지원 문제

* `IntelliJ` 기준으로 `Lombok plugin` 설치가 필요하다.
* 때에 따라서는, IntelliJ 버전이 올라가면서 `Lombok plugin` 이 동작하지 않을 수도 있다.

<br>

### 3. 컴파일 시간 증가

* `Lombok` 은 컴파일 시점에 코드를 추가로 생성하므로, 프로젝트 규모가 커질수록 컴파일 시간이 증가할 수 있다.
* 이는 빌드 시간이 중요한 대규모 프로젝트에서는 생산성을 떨어뜨리는 요인이 될 수 있다.

<br>

### 4. 디버깅의 어려움

* `Lombok` 이 자동으로 생성하는 코드는 컴파일 타임에 추가되기 때문에, 디버깅 시 해당 코드의 실제 동작을 확인 하기 어렵다.
* 아래 코드에서 생성된 builder 메서드 내부 구현을 디버거에서 직접 볼 수 없어서, 문제 발생 시 원인 파악이 어려울 수 있다.

<pre class="prettyprint lang-java">
@Builder
public class Car {
    private String brand;
    private String model;
}
</pre>

<br>

### 5. 버전 호환성 문제

* Java 나 다른 라이브러리 버전 업그레이드 시 Lombok 과의 호환성 문제가 발생할 수 있다.
* 특히, Java 의 주요 버전 변경시 주의가 필요하게 된다.

> https://github.com/projectlombok/lombok/issues/2681

<br>

### 6. 과도한 사용 위험

* 모든 클래스에 무분별하게 `@Data` 를 사용하게 되면, 불필요한 메서드들이 생성되어 객체의 책임이 불분명해질 수 있다.
* 클래스의 모든 필드가 무분별하게 노출될 위험이 존재하고, 이로 인해 객체 캡슐화 원칙이 흐려질 수 있다.

<br>

### 7. 학습 곡선 

* `Lombok` 을 처음 접하는 개발자는 각 어노테이션이 생성하는 코드나 동작 방식을 명확히 이해하기 위해 시간이 필요하다.
* `Lombok` 에 의존하는 코드가 많아질수록 이해하고 적응하는데 시간이 오래 걸릴 수가 있다.

<br>

<pre class="prettyprint lang-java">
@Value
@Builder
public class ImmutablePerson {
String firstName;
String lastName;
}
</pre>

<br>

위의 코드는 `@Value` 어노테이션으로 클래스를 불변으로 만들고, <br>
모든 필드를 `private` 과 `final` 로 만들고, 모든 필드에 대한 getter 메서드를 생성한다. <br>
`toString()`, `equals()`, `hashCode()` 메서드를 자동으로 생성하며, <br>
기본 생성자를 `private` 으로 만들어 직접적인 인스턴스 생성을 방지하고, <br>
모든 필드를 포함하는 생성자를 자동으로 생성한다. <br>

`@Builder` 어노테이션을 빌더 패턴을 구현하는 내부 클래스를 생성한다. <br>

이 코드에서 `Lombok` 을 제거했을 때 아래와 같은 코드가 된다. <br>


<pre class="prettyprint lang-java">
public final class ImmutablePerson {
    private final String firstName;
    private final String lastName;

    private ImmutablePerson(String firstName, String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ImmutablePerson that = (ImmutablePerson) o;
        return Objects.equals(firstName, that.firstName) &&
               Objects.equals(lastName, that.lastName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(firstName, lastName);
    }

    @Override
    public String toString() {
        return "ImmutablePerson{" +
               "firstName='" + firstName + '\'' +
               ", lastName='" + lastName + '\'' +
               '}';
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String firstName;
        private String lastName;

        private Builder() {}

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public ImmutablePerson build() {
            return new ImmutablePerson(firstName, lastName);
        }
    }
}
</pre>

<br>

### 8. 추상화로 인한 코드 제어력 감소

* `Lombok` 은 자동으로 많은 부분을 처리해주지만, 개발자가 코드의 세부 동작을 직접 제어하거나 수정하기 어렵게 만들 수 있다.
* 커스터마이징이 필요한 상황에서 `Lombok` 이 작성한 코드를 다시 작성해야하는 경우가 발생할 수 있다.


<br>

<br>

<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 개인적인 생각 </b> 
    </p>
    📣 Lombok 은 반복되는 코드를 줄이는데 유용한 라이브러리는 맞다고 생각한다. <br>
    🖐 하지만, JPA Entity 와 사용할 때 고려해야하는 부분들을 보았을 땐, 오히려 코드가 복잡해질 수 있다는 단점이 있는 것 같다. <br>
    🖐 또한, Java 14 부터 도입된, `record` keyword 를 사용하면 불변 객체를 쉽게 정의할 수 있는 구조체를 만들 수 있다. <br>
      ➡️ (`@Data`, `@Value` 와 유사하게 불변 클래스를 만들 수 있다.) <br>
    🖐 유지보수성, 빠른 생산성, 디버깅의 어려움, 개발환경의 번거로움 등의 단점이 있는 `Lombok` 을 써야 하나 하는 의문이 들기도 한다.

</div>

<br>
<br>

## Reference

---

* [Lombok and JPA: What Could Go Wrong?](https://dzone.com/articles/lombok-and-jpa-what-may-go-wrong)
* [Ultimate Guide to Implementing equals() and hashCode() with Hibernate](https://thorben-janssen.com/lombok-hibernate-how-to-avoid-common-pitfalls/)
* [Lombok: The Good, The Bad, and The Controversial](https://dev.to/felixcoutinho/thoughts-on-lombok-5dlk) 
* [Is using Project Lombok actually an good idea?](https://www.reddit.com/r/java/comments/mpd0gw/is_using_project_lombok_actually_an_good_idea/)

<br>
<br>
