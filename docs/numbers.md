## 정수 타입

Kotlin 은 숫자를 표현하는 built-in 타입을 제공합니다.  
정수의 범위에는, 서로 크기가 다르고 따라서 표현할 수 있는 범위도 다른 4개의 타입이 있습니다:

| 타입      | 크기(비트) | 최소 표현 가능 값                                   | 최대 표현 가능 값                                     |
|---------|--------|----------------------------------------------|------------------------------------------------|
| `Byte`  | 8      | -128                                         | 127                                            |
| `Short` | 16     | -32768                                       | 32767                                          |
| `Int`   | 32     | -2,147,483,648 (-2<sup>31</sup>)             | 2,147,483,647 (2<sup>31</sup> - 1)             |
| `Long`  | 64     | -9,223,372,036,854,775,808 (-2<sup>63</sup>) | 9,223,372,036,854,775,807 (2<sup>63</sup> - 1) |

특정한 타입을 명시하지 않고 정수형 변수를 선언하면, 컴파일러는 표현된 상수 리터럴을 가질 수 있는 `Int` 이상의 가장 작은 크기를 가진 타입으로 그 변수의 타입을 유추합니다.
즉, `Int` 의 범위를 넘지 않으면 그 변수의 타입은 `Int` 가 되고, 그렇지 않다면 `Long` 이 됩니다. 할당한 정수 리터럴이 `Long` 값임을 명시하려면, 수 뒤에 `L` 을 붙히면 됩니다.
타입을 명시하면 컴파일러가 할당한 상수 리터럴이 지정된 타입이 표현할 수 있는 범위 안에 있는지에 대한 유효성 검사를 하게 합니다.

```kotlin
val one = 1 // Int
val threeBillion = 3000000000 // Long
val oneLong = 1L // Long
val oneByte: Byte = 1
```

{>tip}
> 정수형 타입에 더해, Kotlin 은 부호 없는 정수 타입도 지원합니다. [](/docs/unsigned-integer-types.md) 문서에서 더 많은 정보를 확인해보세요.

## 부동 소수점 타입

실수의 표현을 위해, Kotlin 은 [IEEE 754 표준](https://en.wikipedia.org/wiki/IEEE_754)을 따르는 부동 소수점 타입인 `Float` 와 `Double` 을 지원합니다.
`Float` 은 IEEE 754의 단정밀도 형태를 표현하며, `Double` 은 배정밀도 형태를 표현합니다.

이 타입들은 그들의 크기와 부동 소수점의 서로 다른 정밀도에 따른 메모리 공간을 제공합니다.

| 타입       | 크기(bits) | 가수부(부호 포함) | 지수부 | 십진 자리수 |
|----------|----------|------------|-----|--------|
| `Float`  | 32       | 24         | 8   | 6-7    |
| `Double` | 64       | 53         | 11  | 15-16  |

`Double` 과 `Float` 타입의 변수를 소수 부분을 포함하는 숫자 리터럴로 선언할 수 있습니다. 
소수 부분은 정수 부분과 점(`.`) 으로 분리되며, 소수 부분을 포함하는 숫자 리터럴을 컴파일러는 `Double` 로 유추합니다:

```kotlin
val pi = 3.14 // Double
// val one: Double = 1 // Error: Type mismatch
val oneDouble = 1.0 // Double
```

`Float` 타입으로 명시하고자 한다면, 리터럴에 `f` 혹은 `F` 를 추가하면 됩니다.
이러한 값들의 소수 부분이 6-7 자리 이상을 가지고 있으면, 반올림됩니다:

```kotlin
val e = 2.7182818284 // Double
val eFloat = 2.7182818284f // Float, 실제 값은 2.7182817 입니다.
```

다른 여러 언어들과 달리, Kotlin 은 암시적으로 더 큰 크기를 가지는 타입으로의 변환이 이루어지지 않습니다. 
예를 들어, `Double` 타입의 매개변수를 가지는 함수에는 `Double` 만 전달할 수 있으며, `Float`, `Int` 등의 기타 숫자 타입은 전달할 수 없습니다:

```kotlin
fun main() {
    fun printDouble(d: Double) { print(d) }

    val i = 1
    val d = 1.0
    val f = 1.0f

    printDouble(d)
//    printDouble(i) // Error: Type mismatch
//    printDouble(f) // Error: Type mismatch
}
```

숫자 값들을 다른 타입으로 변환하려면, [명시적 변환](#명시적-변환)을 사용하세요.

## 숫자 표현을 위한 상수 리터럴

아래에 몇몇 정수의 표현을 위한 상수 리터럴의 종류들이 나타나 있습니다:

- 십진수: `123`
- L 접미사로 표현된 Long: `123L`
- 16진수: `0x0F`
- 2진수: `0b00001011`

> 8진수 표기는 Kotlin 에서 지원하지 않습니다.

Kotlin 은 또한 부동 소수점 수의 규약적 표기법을 지원합니다:

- 기본적으로 Double 인 표현: `123.5`, `123.5e10`
- `f` 혹은 `F` 로 표기된 Float: `123.5f`

언더바를 사용하여 숫자 리터럴을 더 읽기 쉽게 만들 수 있습니다:

```kotlin
val oneMillion = 1_000_000
val creditCardNumber = 1234_5678_9012_3456L
val socialSecurityNumber = 999_99_9999L
val hexBytes = 0xFF_EC_DE_5E
val bytes = 0b11010010_01101001_10010100_10010010
```

{>tip}
> 부호 없는 정수 리터럴에도 특수한 표기법이 있습니다. [부호 없는 정수의 리터럴](/docs/unsigned-integer-types.md#부호-없는-정수의-리터럴) 문서에서 더 많은 정보를 확인해보세요.

## JVM 에서의 숫자 표현

JVM 플랫폼에서, 숫자들은 원시 타입인 `int` 와 `double` 등의 타입으로 저장됩니다. 
이 원칙 밖에 있는 예외는, `Int?` 같은 nullable 한 숫자 타입을 사용하거나 제너릭을 사용하는 경우입니다.
이러한 경우에는 Java 의 `Integer` 나 `Double` 등의 클래스에 담겨(boxed)집니다.

따라서, 같은 숫자로의 nullable 한 레퍼런스는 서로 다른 오브젝트를 참조할 수 있습니다:

```kotlin
val a: Int = 100
val boxedA: Int? = a
val anotherBoxedA: Int? = a

val b: Int = 10000
val boxedB: Int? = b
val anotherBoxedB: Int? = b

println(boxedA === anotherBoxedA) // true
println(boxedB === anotherBoxedB) // false
```

모든 nullable 한 `a` 로의 레퍼런스는 실제로 같은 오브젝트입니다. JVM 이 `-127` 부터 `128` 사이인 `Integer` 에 대해 메모리 최적화를 진행하기 때문입니다.
`b` 에는 그런 최적화가 적용되지 않기 때문에, 서로 다른 오브젝트입니다.

반면에, 그들은 여전히 같기는 합니다:

```kotlin
val b: Int = 10000
println(b == b) // Prints 'true'
val boxedB: Int? = b
val anotherBoxedB: Int? = b
println(boxedB == anotherBoxedB) // Prints 'true'
```

## 명시적 변환

표현 방식이 다르기 때문에, **작은 크기의 타입이 더 큰 타입의 서브타입이 아닙니다**. 
만약 그랬다면, 우리는 아래와 같은 상황에서 문제에 봉착합니다:

```kotlin
// 실제로 컴파일되지는 않는 가상의 코드입니다:
val a: Int? = 1 // java.lang.Integer 에 담긴 Int 값
val b: Long? = a // 암시적인 변환이 java.lang.Long 에 담긴 값을 만듭니다.
print(b == a) // 우와! 이 문장은 Long 의 `equals()` 가 비교 대상이 Long 인지 아닌지를 비교하기 때문에 "false" 출력하네요!
```

즉 동일성이 조용히 소실되며, 동일성에 대해 언급할 수 없게 됩니다.

그렇기 때문에, 더 작은 타입이 더 큰 타입으로 **암시적으로 변환되지 않습니다**. 
이는 더 작은 크기의 타입인 `Byte` 를 더 큰 값의 타입인 `Int` 에 다시 할당할 때 명시적인 변환을 필요로 함을 의미합니다:

```kotlin
val b: Byte = 1 // OK, literals are checked statically
// val i: Int = b // ERROR
val i1: Int = b.toInt()
```

모든 숫자 타입은 서로 다른 타입으로의 변환을 지원합니다:

- `toByte(): Byte`
- `toShort(): Short`
- `toInt(): Int`
- `toLong(): Long`
- `toFloat(): Float`
- `toDouble(): Double`

많은 경우에서, 타입이 컨텍스트로부터 유추되며 수학적 연산자들이 적절한 변환을 포함하여 오버로드되어 있기 때문에 명시적인 변환이 필요없습니다.

```kotlin
val l = 1L + 3 // Long + Int => Long
```

## 숫자에 대한 연산

Kotlin 은 숫자에 대한 일반적인 수학적 연산자 `+`, `-`, `*`, `/`, `%` 를 지원합니다. 
그들은 각각에 해당하는 클래스의 멤버로 정의되어있습니다.

```kotlin
println(1 + 2)
println(2_500_000_000L - 1L)
println(3.14 * 2.71)
println(10.0 / 3)
```

### 정수로 나누기

정수와 정수 사이의 나눗셈은 항상 정수를 반환합니다. 모든 소수 부분은 버려집니다.

```kotlin
val x = 5 / 2
//println(x == 2.5) // ERROR: Operator '==' cannot be applied to 'Int' and 'Double'
println(x == 2)
```

두 정수에 대한 나눗셈에서 아래는 `true` 입니다:

```kotlin
val x = 5L / 2
println(x == 2L)
```

부동 소수점 타입의 수를 반환받으려면, 둘 중 하나를 명시적으로 부동 소수점 타입으로 변환하세요:

```kotlin
val x = 5 / 2.toDouble()
println(x == 2.5)
```

### 비트 연산

Kotlin 은 정수에 대해 **비트 연산**을 지원합니다. 그들은 바이너리 단계의 숫자를 표현하는 비트에 직접 작용합니다. 
비트 연산자들은 infix 형태로 호출할 수 있는 함수들로 표현되고, `Int` 와 `Long` 에만 적용 가능합니다:

```kotlin
val x = (1 shl 2) and 0x000FF000
```

아래는 비트 연산자들의 전체 목록입니다.

- `shl(bits)` – 부호 있는 왼쪽 시프팅
- `shr(bits)` – 부호 있는 오른쪽 시프팅
- `ushr(bits)` – 부호 없는 오른쪽 시프팅{^[1]}
- `and(bits)` – 논리 비트 AND
- `or(bits)` – 논리 비트 OR
- `xor(bits)` – 논리 비트 XOR
- `inv()` – 비트 반전

---
{&[1]} 부호 없는 오른쪽 시프팅은 비트를 오른쪽으로 밀고 새로 생긴 공간을 항상 0으로 채웁니다. 부호 있는 오른쪽 시프팅은 밀기 전의 부호 비트를 따르는 것과는 상반되죠. 

### 부동 소수점 수의 비교

이 문단에서 기술하는 부동 소수점 수의 연산은 아래 내용들입니다:

- 동일성 비교: `a == b` 와 `a != b`
- 대소 비교: `a < b`, `b < a`, `a <= b` 와 `a >= b`
- 범위 생성과 포함 여부 판단: `a..b`, `x in a..b`, `x !in a..b`

`a` 와 `b` 가 정적으로 명백히 `Float` 이나 `Double` (을 포함한 그의 nullable 타입) 임을 정의된 타입이나 [스마트 캐스팅](/docs/typecasts.md#스마트-캐스팅)의 결과로 알 수 있을 때는,
숫자나 범위에 대한 연산이 [부동 소수점 연산을 위한 IEEE 754 표준](https://en.wikipedia.org/wiki/IEEE_754)을 따릅니다.

그러나, 만약 피연산자가 정적으로 부동 소수점 수임이 확인되지 **않으면** 그 행동이 달라집니다.
이는 제너릭이나 전순서(total ordering)를 제공해야하기 때문으로, 예를 들면 `Any` 이거나, `Comparable<...>` 이거나, `Collection<T>` 타입 등이 있습니다.
이런 경우에는, 연산에 `Float` 과 `Double` 의 `equals` 와 `compareTo` 를 사용합니다. 결과적으로:

- NaN 은 그 자신과 동일한 것으로 간주합니다.
- NaN 은 `POSITIVE_INFINITY` 를 포함하여 그 어떤 수보다도 큰 것으로 간주합니다.
- -0.0 은 0.0 보다 작은 것으로 간주합니다.

아래의 예제는 피연산자들이 정적으로 부동 소수점 수임을 알 수 있을 때와 그렇지 않을 때 어떤 차이를 보여주는지 나타내고 있습니다:

```kotlin
// 피연산자가 정적으로 부동 소수점 수임을 알 수 있을 때
println(Double.NaN == Double.NaN)                 // false
// 피연산자가 부동 소수점 수임을 정적으로 알 수 없을 때
// 따라서 NaN 은 그 자신과 같습니다.
println(listOf(Double.NaN) == listOf(Double.NaN)) // true

// 피연산자가 정적으로 부동 소수점 수임을 알 수 있을 때
println(0.0 == -0.0)                              // true
// 피연산자가 부동 소수점 수임을 정적으로 알 수 없을 때
// 따라서 -0.0 은 0.0 보다 작습니다.
println(listOf(0.0) == listOf(-0.0))              // false

println(listOf(Double.NaN, Double.POSITIVE_INFINITY, 0.0, -0.0).sorted())
// [-0.0, 0.0, Infinity, NaN]
```

{&?}