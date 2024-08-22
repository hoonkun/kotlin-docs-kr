클래스, 오브젝트, 인터페이스, 생성자, 함수, 프로퍼티와 그들의 setter 들은 **가시성 수정자**를 가질 수 있습니다.
getter 들은 프로퍼티 자체와 같은 가시성을 가집니다.

Kotlin 에는 `private`, `protected`, `internal`, `public` 의 총 네 개의 가시성 수정자가 있습니다.
기본적으로는 `public` 입니다.

이 페이지에서는, 그것이 정의되는 스코프에 따라 각 수정자가 어떻게 적용되는지에 대해 알아봅니다.

## 패키지

함수, 프로퍼티, 클래스, 오브젝트, 인터페이스들은 어떤 패키지의 "최상위 레벨"에 선언될 수 있습니다:

```kotlin
// file name: example.kt
package foo

fun baz() { ... }
class Bar { ... }
```

- 아무런 가시성 수정자가 없다면, `public` 이 사용됩니다. 어느 곳에서든 보이고 사용할 수 있습니다.
- 선언을 `private` 으로 설정하면, 선언된 파일 안에서만 보입니다.
- `internal` 로 설정하면, 같은 [모듈](#모듈) 안에서만 보입니다.
- `protected` 가시성 수정자는 최상위 레벨 선언에서 사용할 수 없습니다.

> 최상위 레벨 선언을 다른 패키지에서 사용하려면, [import](/docs/packages.md#임포트) 해야합니다.

예제는 아래와 같습니다:

```kotlin
// file name: example.kt
package foo

private fun foo() { ... } // visible inside example.kt

public var bar: Int = 5 // property is visible everywhere
    private set         // setter is visible only in example.kt

internal val baz = 6    // visible inside the same module
```

## 클래스 멤버

클래스의 안쪽에 선언된 멤버들에게는 아래와 같은 규칙이 적용됩니다:

- `private` 멤버는 그 멤버가 그 클래스 안에서만 보임을 의미합니다(그를 확장하는 자식 클래스들에서도 보이지 않습니다).
- `protected` 멤버는 `private` 과 동일하지만 그를 확장하는 자식들에서는 보입니다.
- `internal` 멤버는 그것을 정의하는 클래스가 보이는 모든 **같은 모듈 내**의 클라이언트에게 보임을 의미합니다.
- `public` 멤버는 그것을 정의하는 클래스에 접근할 수 있는 모든 클라이언트에게 보입니다.

> Kotlin 에서는, 안쪽 클래스의 private 멤버를 바깥쪽 클래스가 볼 수 없습니다.

`protected` 나 `internal` 로 표기된 멤버를 재정의할 때 아무런 가시성 수정자를 붙히지 않으면, 
재정의된 멤버는 원본의 그것과 같은 가시성을 가지게 됩니다.

예제는 아래와 같습니다:

```kotlin
open class Outer {
    private val a = 1
    protected open val b = 2
    internal open val c = 3
    val d = 4  // public by default

    protected class Nested {
        public val e: Int = 5
    }
}

class Subclass : Outer() {
    // a is not visible
    // b, c and d are visible
    // Nested and e are visible

    override val b = 5   // 'b' is protected
    override val c = 7   // 'c' is internal
}

class Unrelated(o: Outer) {
    // o.a, o.b are not visible
    // o.c and o.d are visible (same module)
    // Outer.Nested is not visible, and Nested::e is not visible either
}
```

### 생성자

주생성자의 가시성을 설정하려면 아래와 같은 문법을 사용할 수 있습니다:

> 명시적인 `constructor` 키워드가 필요합니다.

```kotlin
class C private constructor(a: Int) { ... }
```

이 생성자는 `private` 입니다. 기본적으로는, 모든 생성자는 `public` 이며 클래스가 보이는 모든 곳에서 사용할 수 있습니다(`internal` 클래스의 생성자는 같은 모듈 안에서만 보임을 의미합니다).

봉인된 클래스들에서는, 생성자들이 기본적으로 `protected` 입니다. 더 많은 정보는 [](/docs/sealed-classes.md) 를 확인해보세요.

### 로컬 선언

로컬 변수, 함수, 클래스들은 가시성 수정자를 가질 수 없습니다.

## 모듈

`internal` 가시성 수정자의 의미는 그 멤버가 같은 모듈 안에서만 보인다는 것입니다.
특히, 모듈은 함께 컴파일되는 Kotlin 소스 파일의 집합을 말합니다. 예를 들어:

- 하나의 Intellij IDEA 모듈
- 하나의 Maven 프로젝트
- 하나의 Gradle 소스 집합 (예외적으로 `test` 소스 집합에서는 `main` 소스 집합의 내부 선언에 접근할 수 있습니다)
- 한 번의 `<kotlinc>` Ant 태스크 실행에 컴파일되는 소스들의 집합

{&?}
