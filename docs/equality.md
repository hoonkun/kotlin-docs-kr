Kotlin 에서, 동일성에는 두 가지 종류가 있습니다:

- 구조적 동일성(`==`) - `equals()` 함수를 사용하여 비교합니다.
- 참조적 동일성(`===`) - 두 레퍼런스가 서로 같은 오브젝트를 가리키는지 비교합니다.

## 구조적 동일성

구조적 동일성은 두 오브젝트가 같은 내용이나 구조를 가지는지 확인합니다.
구조적 동일성은 `==` 연산자와 그의 반전된 연산자인 `!==` 에 의해 이루어지며, 규약 상 `a == b` 같은 표현은 아래와 같이 번역됩니다:
```kotlin
a?.equals(b) ?: (b === null)
```

만약 `a` 가 `null` 이 아니면, `equals(Any?)` 함수를 호출합니다. 그렇지 않으면, `b` 가 `null` 과 참조적으로 동일한지 확인합니다:

```kotlin
fun main() {
    var a = "hello"
    var b = "hello"
    var c = null
    var d = null
    var e = d

    println(a == b)
    // true
    println(a == c)
    // false
    println(c == e)
    // true
}
```

`null` 과의 명확한 비교를 진행할 때는 어떠한 최적화도 이루어지지 않음을 기억하세요. `a == null` 은 `a === null` 로 변환될 뿐입니다.

Kotlin 에서, `equals()` 함수는 모든 클래스가 `Any` 로부터 상속받는 함수입니다. 기본적으로, `equals()` 는 [참조적 동일성](/docs/equality.md#참조적-동일성) 판단 로직을 가집니다.
그러나, Kotlin 의 클래스들은 `equals()` 를 재정의하여 커스텀 동일성 판단 로직을 제공할 수 있으며 이 경우에는 구조적 동일성으로 판단하게 됩니다.

값 클래스(value class) 나 데이터 클래스(data class) 들은 Kotlin 에서 자동으로 `equals()` 함수를 재정의하는 두 개의 특별한 타입들입니다.
그것이 그들이 기본적으로 구조적 동일성 판단 로직을 가지는 이유입니다.

그러나, 데이터 클래스들은 그의 부모 클래스에서 `equals()` 함수가 `final`로 표기되어있을 경우 그 동작을 재정의하지 않습니다.

그 외의 클래스(`data` 수정자가 없는 클래스) 들은 `equals()` 를 자동으로 재정의하지 않으며, 참조적 동일성을 판단하는 `Any` 의 그것을 그대로 둡니다.
구조적 동일성 판단 로직을 구현하려면, 비-데이터 클래스들은 그들의 동일성 비교 로직을 `equals()` 함수를 재정의함으로서 제공해주어야 합니다.

그러기 위해서, [`equals(other: Any?): Boolean`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-any/equals.html) 함수를 재정의하세요:

```kotlin
class Point(val x: Int, val y: Int) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Point) return false

        // Compares properties for structural equality
        return this.x == other.x && this.y == other.y
    }
}
```

> eqauls() 함수를 재정의할 때, 동일성과 해싱 사이의 일관성을 유지하고 이들의 올바른 동작을 보장하기 위해 [hashCode() 함수](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-any/hash-code.html)도 같이 재정의해주어야 합니다.

같은 이름의 다른 시그니쳐를 가진 함수(`equals(other: Foo)` 같은 것)들은 `==` 와 `!=` 연산자의 동작에 영향을 주지 않습니다.

구조적 동일성은 `Comparable<...>` 인터페이스가 정의하는 것과는 아무런 관계가 없으며, 그러므로 커스텀 `equals(Any?)` 구현만이 연산자의 동작을 바꿀 수 있습니다.

## 참조적 동일성

참조적 동일성은 어떤 두 오브젝트의 메모리 주소가 완전히 일치하여 서로 같은 인스턴스인지 판단합니다.

참조적 동일성은 `===` 연산자와 그의 반전된 연산자인 `!==` 에 의해 이루어지며, `a === b` 는 `a` 와 `b` 가 서로 같은 오브젝트를 가리킬 때 `true` 로 평가됩니다:

```kotlin
fun main() {
    var a = "Hello"
    var b = a
    var c = "world"
    var d = "world"

    println(a === b)
    // true
    println(a === c)
    // false
    println(c === d)
    // true

}
```

런타임에 원시적인 값들은(`Int` 같은), `===` 확인이 `==` 와 동일하게 동작합니다.

{>tip}
> 참조적 동일성은 Kotlin/JS 플랫폼에서 다르게 구현됩니다. 이것에 대한 더 자세한 사항은 [Kotlin/JS](/docs/js-interop.md#equality) 문서를 확인해보세요.

## 부동 소수점 수들의 동일성

만약 동일성 판단의 피연산자들이 `Float` 이거나 `Double` 이면, [IEEE 754 부동 소수점 연산 표준](https://en.wikipedia.org/wiki/IEEE_754)의 판단을 따릅니다.

이 행동은 부동 소수점 수인 것으로 정적-타이핑되지 않는 피연산자들에 따라 다릅니다. 이러한 경우에는, 구조적 동일성이 구현됩니다.
결과적으로, 부동 소수점 수로 정적-타이핑되지 않은 피연산자들 사이의 비교는 IEEE 표준을 다릅니다. 이 시나리오에서:

- `NaN` 은 그 자신과 같습니다.
- `NaN` 은 `POSITIVE_INFINITY` 를 포함하여 다른 어떠한 값보다도 큽니다.
- `-0.0` 은 `0.0` 과 다릅니다.

더 자세한 사항은 [부동 소수점 수의 비교](/docs/numbers.md#부동-소수점-수의-비교) 문서를 확인해보세요.

## 배열의 동일성

두 배열이 서로 같은 요소들을 가지고 있는지 확인하려면, [`contentEquals()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/content-equals.html) 를 사용합니다.

더 자세한 사항은, [배열의 비교](/docs/arrays.md#compare-arrays) 문서를 확인해보세요.

{&?}
