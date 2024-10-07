Kotlin 의 인터페이스들은 추상 함수들의 선언을 비롯한 함수의 구현을 가질 수 있습니다.
추상 클래스와의 차이점은 인터페이스들은 상태를 가질 수 없다는 점입니다. 프로퍼티를 가질 수는 있으나, 
추상 프로퍼티이거나 접근자 구현만을 제공할 수 있습니다.

인터페이스는 `interface` 키워드를 사용해 정의됩니다:

```kotlin
interface MyInterface {
    fun bar()
    fun foo() {
      // optional body
    }
}
```

## 인터페이스의 구현

클래스나 오브젝트는 하나 이상의 인터페이스를 구현할 수 있습니다:

```kotlin
class Child : MyInterface {
    override fun bar() {
        // body
    }
}
```

## 인터페이스의 프로퍼티

인터페이스에는 프로퍼티를 정의할 수 있습니다. 인터페이스의 프로퍼티는 추상적이거나 접근자에 대한 구현 중 하나의 형태로 가능합니다.
인터페이스에 정의된 프로퍼티는 기반 필드를 가질 수 없으며, 그렇기 때문에 인터페이스에 정의된 접근자들이 참조할 수 없습니다:

```kotlin
interface MyInterface {
    val prop: Int // abstract

    val propertyWithImplementation: String
        get() = "foo"

    fun foo() {
        print(prop)
    }
}

class Child : MyInterface {
    override val prop: Int = 29
}
```

## 인터페이스의 상속

인터페이스는 다른 인터페이스로부터 파생될 수 있으며, 이는 그 다른 인터페이스를 구현하고 또다른 함수와 프로퍼티를 정의할 수
있음을 의미합니다. 물론이지만, 이러한 파생된 인터페이스들을 클래스가 구현할 때는 멤버 중 구현이 없는 것들만 추가하면 됩니다:

```kotlin
interface Named {
    val name: String
}

interface Person : Named {
    val firstName: String
    val lastName: String

    override val name: String get() = "$firstName $lastName"
}

data class Employee(
    // implementing 'name' is not required
    override val firstName: String,
    override val lastName: String,
    val position: Position
) : Person
```

## 재정의 충돌 해결하기

슈퍼타입 목록에 여러 타입이 있다면, 같은 함수에 대해 서로 다른 구현이 있을 수도 있습니다:

```kotlin
interface A {
    fun foo() { print("A") }
    fun bar()
}

interface B {
    fun foo() { print("B") }
    fun bar() { print("bar") }
}

class C : A {
    override fun bar() { print("bar") }
}

class D : A, B {
    override fun foo() {
        super<A>.foo()
        super<B>.foo()
    }

    override fun bar() {
        super<B>.bar()
    }
}
```

인터페이스 **A** 와 **B** 는 모두 **foo()** 와 **bar()** 를 정의합니다.
둘 모두 **foo()** 를 구현하며, **B** 만 **bar()** 를 구현합니다(**bar()** 는 **A** 에서 추상적으로 표기되지 않았습니다, 
이는 인터페이스에서 몸체가 없는 함수는 기본적으로 추상적이기 때문입니다). 이제, **A** 로부터 **C** 를 파생하려면 **bar()** 만을 재정의하여 구현하면 됩니다.

그러나 **D** 를 **A** 와 **B** 로부터 파생하려고 한다면, 이 인터페이스들의 모든 함수들을 재정의해야 하며, **D** 가 정확히 어떤 행동을 해야하는지 명확히 해야합니다.
이 규칙은 하나의 구현을 확장한 함수(**bar()**)와 두 개의 서로 다른 구현을 확장한 함수(**foo()**)에 대해 적용됩니다.

{&?}
