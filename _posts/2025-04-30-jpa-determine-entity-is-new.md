---
layout: post
title: "Spring Data JPA - 새로운 Entity 판별"
description: "How Does Spring Data JPA Determine if an Entity is New?"
excerpt: "Spring Data JPA 에서 Entity 가 새로운 것인지 판단하는 방법에 대해서 알아보자."
category: Study
comments: true
---

<div id ="notice--info">

    <p style='margin-top:1em;'>
        <b>🐱 Meow, meow </b>
    </p>
    Spring Data JPA 를 사용하다보면 save() 메서드 호출 시 내부적으로 persist() 를 호출할지, merge() 를 호출할지 결정하게 된다. <br>
    이 결정은 해당 Entity 가 새로운 Entity 인지 여부에 따라 이루어지는데, Spring Data JPA 는 Entity 가 새로운지 어떻게 판단하는지 알아보자.
    <p style='margin-top:1em;'/>  

</div>


## 신규 Entity 판단 방식

--- 

Spring Data JPA 는 내부적으로 `JpaEntityInformation` 의 `isNew(T entity)` 메서드를 호출해서 판단한다.

<pre class="prettyprint lang-java">
@Override
public boolean isNew(T entity) {
    if (versionAttribute.isEmpty()
        || versionAttribute.map(Attribute::getJavaType).map(Class::isPrimitive).orElse(false)) {
        return super.isNew(entity);
    }
    BeanWrapper wrapper = new DirectFieldAccessFallbackBeanWrapper(entity);
    return versionAttribute.map(it -> wrapper.getPropertyValue(it.getName()) == null).orElse(true);
}
</pre>

1) @Version 필드가 있다면 → null 여부로 판단  
2) @Version 필드가 없다면 → @Id 필드가 null 이거나, primitive 타입인 경우 0인지 확인

<div id="notice--warning">

    🏷️ 즉, ID 가 null 이면 <b> 신규 Entity </b> 로 간주하여 <b>  persist() </b> 가 호출된다.

</div>

<br>

### 직접 ID 를 지정한 경우의 동작

---

ID 를 직접 지정하면 JPA 는 해당 Entity 가 이미 존재하는 것으로 판단하여 `merge()` 를 호출한다.  
하지만, Database 에는 존재하지 않는 경우 다음과 같은 문제가 발생하는데,
* SELECT 쿼리로 존재 여부 확인
* 실제 INSERT 가 아닌 **UPDATE** 시도
* <span style="color:red"> → 실패하거나 잘못된 데이터 상태 유발!! </span>

이를 해결하기 위한 방법으로는 `Persistable<T>` 인터페이스를 구현하면 된다.  

<pre class="prettyprint lang-java">
// User.class

@Entity
@Table(name = "users")
@EntityListeners(UserEntityListener.class)
public class User implements Persistable&#60;String&#62; {

	@Id
	private String id;

	private String name;

	private boolean isNew = true;

	protected User() {

	}

	public User(String id, String name) {
		this.id = id;
		this.name = name;
	}

	@Override
	public String getId() {
		return this.id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return this.name;
	}

	@Override
	public boolean isNew() {
		return this.isNew;
	}

	public void setIsNew(boolean isNew) {
		this.isNew = isNew;
	}

}

// UserEntityListener.class

public class UserEntityListener {
	@PostPersist
	@PostLoad
	public void setNotNew(User user) {
		System.out.println("@PostPersist/@PostLoad called");
		user.setIsNew(false);
	}

}
</pre>

<br>

### persist() vs merge()

---

|구분|persist()|merge()|
|--|--|--|
|동작|새로운 Entity 를 영속성 컨텍스트에 등록|준영속 객체를 병합하여 관리|
|SELECT 쿼리|❌|✅ 먼저 조회 후 merge|
|ID 필요 여부|❌|✅|
|성능|빠름 (직접 INSERT)|느릴수 있다 (SELECT + UPDATE)|

<div id="notice--warning">

    🏷️ 신규 객체를 merge() 로 처리하면 불필요한 SELECT 쿼리가 발생하고 성능 저하 가능성이 존재한다.

</div>

<br>

### 신규 Entity 판단이 중요한 이유는 무엇일까?

---

Spring Data JPA 의 `SimpleJpaRepository` 는 `save()` 에서 다음과 같이 동작한다.

<pre class="prettyprint lang-java">
@Transactional
public &#60;S extends T&#62; S save(S entity) {
    if (entityInformation.isNew(entity)) {
        entityManager.persist(entity); // INSERT
    } else {
        return entityManager.merge(entity); // SELECT → UPDATE
    }
}
</pre>

ID 를 직접 설정했지만 `isNew()` 는 false 가 되어, `merge()` 를 호출하게 되고,  
Database 에는 해당 ID 가 존재하지 않지만, 신규 Entity 임에도 불구하고,  
`SELECT` 후 `UPDATE` 를 하게 되어(Database 조회) <span style="color:red"> 실패 또는 데이터 무결성 오류 </span> 가 발생할 수 있고, 비효율적이다.  

<div id="notice--warning">

    🏷️ 정확한 isNew() 제어는 성능, 정합성, 쿼리 효율성 측면에서 매우 중요하다.

</div>

<br>

### 정리

---

|상황| 처리방식                                     |
|--|------------------------------------------|
|ID 없거나 null → 신규 Entity | persist()                                |
|ID가 존재하지만 실제 DB 에는 없음 | merge() 호출 → 실패 가능성 / 비효율                |
|ID 를 직접 설정한 신규 Entity| Persistable&#60;T&#62; + isNew() 로 명시 필요 |

<div id="notice--warning">

    🏷️ <a href="https://github.com/eottabom/let-me-code/tree/main/src/main/java/com/eottabom/letmecode/example/_01_jpa_entity">예제 코드 보러가기 (클릭)</a> <br>

</div>


<br><br>


<div id="notice--success">

    <p style='margin-top:1em;'>
      <b> 📗 요약 </b> 
    </p>
    🖐 Spring Data JPA 는 내부적으로 isNew() 를 통해서 신규 Entity 여부를 판단한다. <br>
    🖐 ID 는 존재하지만 실제 DB 에 없는 경우 SELECT + UPDATE 후 merge 를 하므로 정합성이 떨어질 수 있고, 비효율적이다. <br>
    🖐 ID 를 직접 설정했을 경우는 Persistable&#60;T&#62; + isNew() 로 명시하는 것이 필요하다. <br>
    
    <p style='margin-top:1em;' />

</div>


<br><br>


## Reference

---

* [Spring Docs - JpaEntityInformation](https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/support/JpaEntityInformation.html)
* [Spring Docs - entity-persistence](https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html)

<br><br>
