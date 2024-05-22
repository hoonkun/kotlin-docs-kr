## Nullable 타입과 Nullable 하지 않은 타입

Kotlin 의 타입 시스템은 null 레퍼런스의 위험을 제거하는데 초점이 맞춰저 있습니다. 
이는 또한 [10억 달러의 실수](https://en.wikipedia.org/wiki/Null_pointer#History) 라고도 알려져있지요.

Java 를 포함한 많은 프로그래밍 언어에서 보이는 가장 큰 함정은, null 레퍼런스의 멤버에 접근하면 null 레퍼런스 예외를 발생시킨다는 점입니다. 
Java 에서 이것은 `NullReferenceException` 이라고 불리며, 줄여서 **NPE** 라고도 합니다.

Kotlin 에서 NPE 가 발생하는 경우는 아래에 나열된 원인들 뿐입니다:

- 명시적으로 `throw NullPointerException()` 를 하는 경우
- 아래에서 설명할 `!!` 연산자를 사용하는 경우
- 아래와 같은, 데이터의 초기화와 연관된 불명확성:
  - constructor 에서만 사용 가능한 초기화되지 않은 `this` 가 어딘가로 넘어가서 사용되는 경우("누수된 `this`")
  - 슈퍼클래스의 생성자가, 파생 클래스의 「아직 초기화되지 않은 요소를 사용하도록 구현된 open 멤버」를 호출하는 경우{^[1]}
- Java 상호운용
  - [플랫폼 타입](/docs/java-interop.md#null-safety-and-platform-types)으로 숨겨진 null 레퍼런스로의 멤버 접근
  - Java 상호 운용을 위해 사용된 Generic 타입으로부터의 Nullablity 이슈. 
    예를들어, Java 코드 조각이 `MutableList<String>` 에 `null` 을 추가할 수 있기 때문에 이 문제를 방지하려면 `MutableList<String?>` 을 사용해야합니다.
  - 외부 Java 코드에 의한 원인

Kotlin 에서는, `null` 을 가질 수 있는 타입과 그렇지 않은 타입을 명확하게 구분합니다. 예를 들어, 일반적인 `String` 타입의 변수는 `null` 을 가질 수 없습니다.

```kotlin
var a: String = "abc" // 기본적으로 일반적인 할당은 non-nullable 하게 취급합니다.
a = null // 컴파일 오류
```

null들을 허용하려면, `String?` 타입을 사용하여 변수를 nullable 문자열로 선언할 수 있습니다.

```kotlin
var b: String? = "abc" // null 로 설정할 수 있습니다.
b = null // OK
print(b)
```

이제, 변수 `a` 로부터 그의 멤버함수나 프로퍼티에 접근할 때 NPE가 터지지 않는다는 것을 보장하기 때문에 안전하게 아래처럼 사용할 수 있습니다:

```kotlin
val l = a.length
```

그러나 같은 속성을 `b` 로부터 접근하려고 한다면, 이것은 안전하지 않을 수 있으므로 컴파일러가 오류를 일으킵니다:

```kotlin
val l = b.length // 오류: 변수 'b' null 일 수 없습니다.
```

물론 여전히 이 프로퍼티에 접근할 필요는 있겠지요? 몇 가지 방법이 있습니다.

--- 
{&[1]} 예를 들면 슈퍼 클래스의 `open fun foo()` 함수가 있다고 해봅시다. 그의 파생 클래스는 이 `foo` 함수를 재정의하여, 그 안에서 자신만의 어떠한 필드를 사용합니다. 
상속 관계에서, 생성자의 호출 순서는 조상 -> 자식 순이기 때문에 슈퍼 클래스가 `foo` 함수를 호출하면 아직 초기화되지 않은 파생 클래스의 속성을 참조하게 되어 NPE 가 발생합니다.  
&nbsp;  
[이 예제(Kotlin Online)](https://pl.kotl.in/YjKDFK_0I)를 통해 어떤 일이 일어나는지 살펴보세요.

## 조건문을 통해 null 인지 아닌지 체크하는 방법

첫 번째로, `b` 가 `null`인지 조건문을 통해 명시적으로 확인하여 두 경우를 각각 핸들링하는 방법입니다:

```kotlin
val l = if (b != null) b.length else -1
```

컴파일러가 여러분이 진행한 체크에 대한 내용을 추적하여, `if` 의 안쪽에서 `length` 프로퍼티의 참조를 허용합니다. 더 복잡한 조건도 상관 없습니다:

```kotlin
val b: String? = "Kotlin"
if (b != null && b.length > 0) {
    print("String of length ${b.length}")
} else {
    print("Empty string")
}
```

이 방식은 `b` 가 변경 불가능(null 체크와 접근 사이에서 변경되지 않은 로컬 변수이거나, 기반 필드를 가지면서 재정의할 수 없는 val 멤버변수)할 때만 사용할 수 있습니다. 
이외의 경우에는, 체크 이후에 다른 요인에 의해 `null` 로 변경될 가능성이 있기 때문입니다.

---
기반 필드(backing field) 는 어떤 값을 저장하기 위한 실제 변수를 말합니다. 
예를 들어, `get()` 만을 가지는 `val` 프로퍼티나, `get()` 과 `set()` 을 가지지만 다른 변수로부터 값을 참조하기만 하는 `var` 필드는 자기 자신의 데이터를 따로 저장할 필요가 없습니다. 
이런 경우에는 기반 필드를 가지지 않으며, 초기화에서 어떤 실제 값을 할당하는 경우 혹은 `set()` 에서 `field` 를 참조하는 경우에 기반 필드를 가진다고 표현합니다.


## 안전한 호출

두 번째로는, nullable 프로퍼티에 `?.` 연산자를 사용하여 안전하게 접근하는 방법입니다:

```kotlin
val a = "Kotlin"
val b: String? = null
println(b?.length)
println(a?.length) // 불필요한 안전 호출
```

`b` 가 `null` 이 아니면 `b.length` 를, `b` 가 `null` 이면 `null` 을 결과로 돌려줍니다. 이 표현의 타입은 `Int?` 입니다.

안전한 호출은 체인에서 유용합니다. 예를 들어 Bob 은 어떤 회사의 직원이며, 부서가 정해지거나 정해지지 않을 수 있다고 해봅시다. 그 부서는 또다른 직원을 부서장으로 가질 수도 있다고도 해보죠.
Bob 이 속한 부서의 부서장 이름을 가져오려고 한다고 할 때(만약 존재 한다면), 아래처럼 표현할 수 있습니다.

```kotlin
bob?.department?.head?.name
```

위의 표현은 접근한 프로퍼티 중 하나가 `null` 인 경우 `null` 을 리턴합니다.

어떤 작업을 non-null 한 값들에 대해서만 수행하고 싶다면, [`let`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/let.html) 을 안전 호출 연산자와 함께 사용할 수 있습니다:

```kotlin
val listWithNulls: List<String?> = listOf("Kotlin", null)
for (item in listWithNulls) {
    item?.let { println(it) } // Kotlin 만을 출력하며 null 은 무시합니다.
}
```

안전한 호출은 할당의 왼편에서도 사용할 수 있습니다. 이러한 경우, 접근한 프로퍼티 중 하나가 `null` 이면 할당 동작을 건너뛰며 할당 연산자의 오른편 문장은 평가(실행)하지 않습니다.

```kotlin
// `person` 이나 `person.department` 이 null 이면, 오른편의 함수는 호출되지 않습니다.
person?.department?.head = managersPool.getManager()
```

## Nullable 수신자

확장 함수가 [Nullable 수신자](/docs/extensions.md#nullable-수신자)를 사용할 수도 있습니다. 이렇게 하면 매번 호출할 때마다 null 체크를 하지 않아도 null에 대한 처리를 할 수 있습니다. 

예를 들어, [`toString()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/to-string.html) 함수는 nullable 수신자를 사용하여 정의되어 있습니다. 
이 함수는 `null` 값에 대응하여 "null" 이라는 문자열을 리턴합니다. 이 행동은 일부 상황에서 유용할 수 있습니다.
예를 들면, 아래처럼 로깅을 하려는 상황을 생각해볼 수 있습니다.
```kotlin
val person: Person? = null
logger.debug(person.toString()) // "null" 을 출력하고, 예외를 던지지 않습니다.
```

만약 `toString()` 이 그대로 `null` 을 리턴하게 하고자 한다면, 여전히 [안전 호출 연산자 `?.`](#안전한-호출) 를 사용할 수 있습니다:

```kotlin
var timestamp: Instant? = null
val isoTimestamp = timestamp?.toString() // `null` 인 String? 오브젝트를 리턴합니다.
if (isoTimestamp == null) {
   // timestamp 가 null 일 때에 대한 핸들링을 수행합니다.
}
```

## Elvis 연산자

nullable 한 레퍼런스 `b`를 가지고 있을 때, "`b`가 `null` 이 아니면 그걸 쓰고, `null` 이면 다른 `null` 이 아닌 무언가를 쓰고싶어" 라고 할 수도 있습니다:

```kotlin
val l: Int = if (b != null) b.length else -1
```

이렇게 완전한 `if` 문장을 작성하는 대신, Elvis 연산자인 `?:` 를 사용할 수도 있습니다:

```kotlin
val l = b?.length ?: -1
```

연산자 `?:` 의 왼쪽이 `null`이 아니면 그것을 바로 리턴하고, 그렇지 않으면 오른쪽 것을 리턴합니다. 
오른쪽의 표현식은 왼쪽 것이 `null` 일 때만 평가(실행)됨을 기억하세요.

Kotlin 에서 `throw` 와 `return` 은 표현식이므로, Elvis 연산자 오른쪽에 사용될 수 있습니다. 
이 방식은 함수의 인수를 확인하는 등의 여러 작업에서 꽤 편리합니다:

```kotlin
fun foo(node: Node): String? {
    val parent = node.getParent() ?: return null
    val name = node.getName() ?: throw IllegalArgumentException("name expected")
    // ...
}
```

## !! 연산자

세 번째 방법은 기존의 NPE를 너무나 사랑했던 분들을 위한 것입니다. 
`!!` 연산자는 null 이 아니라고 강제하여, 어떤 값이던 Non-Nullable 타입으로 변환하려고 시도하며 만약 그것이 `null` 이었으면 예외를 던집니다.
`b!!` 라고 작성하면 non-nullable 한 타입이 되며(예제에서는 `String` 이었습니다), 만약 런타임에 `b` 가 `null` 이었으면 NPE 를 던집니다.

```kotlin
val l = b!!.length
```

그러므로, NPE 를 원하신다면 사용하셔도 되지만, 명백하게 요청을 해야만 이런 일이 발생하고 뜻밖의 상황에서 갑자기 일어나지는 않습니다.

## 안전한 캐스팅

일반적인 캐스팅은 캐스팅하려는 타입과 원본 타입이 맞지 않으면 `ClassCastException` 이 발생합니다.
이럴 때는 만약 두 타입이 맞지 않을 때 `null` 을 리턴하는 안전한 캐스팅 연산자를 사용할 수 있습니다:

```kotlin
val aInt: Int? = a as? Int
```

## nullable 타입의 컬렉션

nullable 한 요소들을 가지는 컬렉션이 있고 그 중 null 이 아닌 것만 골라내려 한다면, `filterNotNull` 을 쓸 수 있습니다:

```kotlin
val nullableList: List<Int?> = listOf(1, 2, null, 4)
val intList: List<Int> = nullableList.filterNotNull()
```

## 더 알아보기

- [Java 와 Kotlin 사이에서 null 을 처리하는 방법](/docs/java-to-kotlin-nullability-guide.md)에 대해 알아보세요.
- [명백하게 null 일 수 없는](/docs/generics.md#definitely-non-nullable-types) 제너릭 타입에 대해 알아보세요.

{&?}
