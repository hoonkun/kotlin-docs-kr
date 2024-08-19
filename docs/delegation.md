[대리자(위임) 패턴](https://en.wikipedia.org/wiki/Delegation_pattern)은 구현 상속 확장{^[1]}의 좋은 대안으로 증명되어왔으며, 
Kotlin 은 이를 어떠한 보일러플레이트도 필요 없는 형태로 지원합니다.

---
{&[1]} 원문: implementation inheritance


`Derived` 클래스는 `Base` 인터페이스의 모든 멤버를 주어진 오브젝트에서 위임받아 구현될 수 있습니다:

```kotlin
interface Base {
    fun print()
}

class BaseImpl(val x: Int) : Base {
    override fun print() { print(x) }
}

class Derived(b: Base) : Base by b

fun main() {
    val base = BaseImpl(10)
    Derived(base).print()
}
```
---
{&^---}

위의 코드는 아래처럼 출력합니다:
```text
10
```

{&$---}

&nbsp;  
`Derived` 클래스의 슈퍼타입 목록에 표기된 `by` 구문은, `b` 가 `Derived` 타입의 오브젝트 내에 내부적으로 저장되며 
컴파일러가 모든 `Base` 의 구성요소들을 `b` 에게로 위임하게 함을 의미합니다.   

{#overriding-a-member-of-an-interface-implemented-by-delegation}
## 위임받은 인터페이스의 멤버를 재정의하기

[재정의](/docs/inheritance.md#함수의-재정의)는 예상하시는 대로 동작합니다: 컴파일러는 `override` 로 재정의된 함수는 주어진 오브젝트에게 위임하지 않습니다.
만약 `Derived` 에 `override fun printMessage() { print("abc") }` 를 추가한다면, `printMessage` 가 호출될 때 `10` 대신 `abc` 가 출력됩니다:

```kotlin
interface Base {
    fun printMessage()
    fun printMessageLine()
}

class BaseImpl(val x: Int) : Base {
    override fun printMessage() { print(x) }
    override fun printMessageLine() { println(x) }
}

class Derived(b: Base) : Base by b {
    override fun printMessage() { print("abc") }
}

fun main() {
    val base = BaseImpl(10)
    Derived(base).printMessage()
    Derived(base).printMessageLine()
}
```
---
{&^---}

위의 코드는 아래처럼 출력합니다:
```text
abc10
```

{&$---}

&nbsp;  
하지만 기억하세요, 이렇게 재정의된 함수는 위임하려는 오브젝트에서는 호출되지 못합니다. 위임하려는 오브젝트는 그 자신의 구현에만 접근할 수 있으니까요:

```kotlin
interface Base {
    val message: String
    fun print()
}

class BaseImpl(x: Int) : Base {
    override val message = "BaseImpl: x = $x"
    override fun print() { println(message) }
}

class Derived(b: Base) : Base by b {
    // 이 프로퍼티는 b 의 'print' 구현에서 접근할 수 없습니다.
    override val message = "Message of Derived"
}

fun main() {
    val b = BaseImpl(10)
    val derived = Derived(b)
    derived.print()
    println(derived.message)
}
```
---
{&^---}

위의 코드는 아래처럼 출력합니다:
```text
BaseImpl: x = 10
Message of Derived
```

{&$---}

&nbsp;  
[](/docs/delegated-properties.md)에 대해서도 자세히 알아보세요.

{&?}
