배열은 고정된 갯수의 서로 같은 타입의 값들을 저장하는데 쓰이는 자료 구조입니다. 
Kotlin 에서 가장 흔한 배열 타입은 오브젝트 타입의 배열로, [`Array`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-array/) 클래스에 의해 표현됩니다.

> 오브젝트 타입의 배열에 원시 값을 사용하면, 그 원시 값들 각각이 오브젝트로 포장되기 때문에 성능 이슈가 발생합니다. 
> 이러한 포장 오버헤드를 방지하려면, [원시 타입 배열](#원시-타입-배열)을 사용하세요.

{#when-to-use-arrays}
## 언제 배열을 써야하는가

Kotlin 에서는, 만족시켜야 하는 어떤 저수준의 필요사항이 있을 때 사용합니다.
예를 들어, 일반적인 어플리케이션 이상의 성능 요구 사항이 있거나, 커스터마이징된 자료 구조를 만들 때 등이 있습니다.
이러한 제한 사항이 없다면, [컬렉션](/docs/collection-overview.md)을 대신 사용하세요.

컬랙션은 배열에 비해 아래와 같은 이점들이 있습니다:

- 컬렉션은 읽기 전용이 될 수 있으며, 여러분에게 더 세세한 조절과 명확한 의도를 가진 본격적인 코드를 작성하도록 해줍니다.
- 컬렉션은 요소를 추가하거나 제거하기 쉽습니다. 배열은 크기가 고정되는 것과 비교되는 사항이죠. 배열에서 요소를 추가하거나 제거하는 유일한 방법은, 매번 비효율적으로 새로운 배열을 만드는 것 뿐입니다:
  ```kotlin
  var riversArray = arrayOf("Nile", "Amazon", "Yangtze")

  // Using the += assignment operation creates a new riversArray,
  // copies over the original elements and adds "Mississippi"
  riversArray += "Mississippi"
  println(riversArray.joinToString())
  // Nile, Amazon, Yangtze, Mississippi
  ```
- 컬렉션은 동일성 비교 연산자(`==`)를 사용하여 그들의 내용이 같은지 구조적 동일성을 비교할 수 있습니다. 
  하지만 배열에서는 같은 연산자가 참조적 동일성을 비교하기 때문에 이 방식을 사용할 수 없고 [배열의 비교](#배열의-비교) 문단에서 서술하는 특수한 함수를 사용해야합니다. 

컬렉션에 대한 더 자세한 사항은 [컬렉션 훑어보기](/docs/collection-overview.md) 문서를 확인해보세요.

{#create-arrays}
## 배열 만들기

Kotlin 에서 배열을 만드려면, 아래 방법 중 하나를 사용할 수 있습니다:

- [`arrayOf()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/array-of.html), [`arrayOfNulls()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/array-of-nulls.html#kotlin$arrayOfNulls(kotlin.Int)), [`emptyArray()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/empty-array.html) 와 같은 함수
- `Array` 생성자

아래의 예제는 [`arrayOf()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/array-of.html) 를 사용하여 각 요소를 전달합니다:

```kotlin
// Creates an array with values [1, 2, 3]
val simpleArray = arrayOf(1, 2, 3)
println(simpleArray.joinToString())
// 1, 2, 3
```

아래의 예제는 [`arrayOfNulls()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/array-of-nulls.html#kotlin$arrayOfNulls(kotlin.Int)) 를 사용하여 주어진 길이의 `null`로 채워진 배열을 생성합니다.

```kotlin
// Creates an array with values [null, null, null]
val nullArray: Array<Int?> = arrayOfNulls(3)
println(nullArray.joinToString())
// null, null, null
```

아래의 예제는 [`emptyArray()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/empty-array.html) 를 사용하여 빈 배열을 생성합니다:

```kotlin
var exampleArray = emptyArray<String>()
```

> 빈 배열의 타입은 Kotlin 의 타입 유추에 의거해 할당 연산자의 왼쪽과 오른쪽 모두에 사용할 수 있습니다.
> 
> 예를 들면 아래와 같습니다.
> ```kotlin
> var exampleArray = emptyArray<String>()
> var exampleArray: Array<String> = emptyArray()
> ```

`Array` 생성자는 배열의 크기와 인덱스에 따라 값을 산출하는 함수를 인수로 받습니다:

```kotlin
// Creates an Array<Int> that initializes with zeros [0, 0, 0]
val initArray = Array<Int>(3) { 0 }
println(initArray.joinToString())
// 0, 0, 0

// Creates an Array<String> with values ["0", "1", "4", "9", "16"]
val asc = Array(5) { i -> (i * i).toString() }
asc.forEach { print(it) }
// 014916
```

> 대부분의 프로그래밍 언어와 동일하게, 인덱스는 0부터 시작합니다.

{#nested-arrays}
### 중첩된 배열

배열은 다차원 배열을 만들기 위해 서로 간에 중첩될 수도 있습니다:

```kotlin
// Creates a two-dimensional array
val twoDArray = Array(2) { Array<Int>(2) { 0 } }
println(twoDArray.contentDeepToString())
// [[0, 0], [0, 0]]

// Creates a three-dimensional array
val threeDArray = Array(3) { Array(3) { Array<Int>(3) { 0 } } }
println(threeDArray.contentDeepToString())
// [[[0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0]], [[0, 0, 0], [0, 0, 0], [0, 0, 0]]]
```

> 안쪽의 중첩된 배열들은 서로 같은 타입이나 길이를 가지지 않아도 됩니다.

---
예제에는 나타나있지 않지만, `arrayOf()` 등의 배열을 만드는 함수를 사용해도 중첩된 배열을 만들 수 있습니다.

{#access-and-modify-elements}
## 요소에의 접근과 수정

배열은 항상 변경 가능합니다. 배열의 요소에 접근하고 수정하려면, [인덱스 접근 연산자 `[]`](/docs/operator-overloading.md#인덱스-접근-연산자)를 사용합니다:

```kotlin
val simpleArray = arrayOf(1, 2, 3)
val twoDArray = Array(2) { Array<Int>(2) { 0 } }

// Accesses the element and modifies it
simpleArray[0] = 10
twoDArray[0][0] = 2

// Prints the modified element
println(simpleArray[0].toString()) // 10
println(twoDArray[0][0].toString()) // 2
```

Kotlin 의 배열 타입은 **불변**합니다. 
이는 Kotlin 이 `Array<String>` 을 `Array<Any>` 에 할당하는 것을 허용하지 않는다는 것을 의미합니다.
이럴 때는 `Array<out Any>`를 사용할 수 있으며, 이와 관련된 자세한 사항은 [타입 투사](/docs/generics.md#타입-투사) 문서를 확인해보세요.

{#work-with-arrays}
## 배열과의 작업

Kotlin 에서는, 배열을 정해지지 않은 갯수의 매개변수를 가지는 함수에 인수로 전달하거나, 물론이지만 그 자체에 어떠한 작업도 할 수 있습니다.
예를 들면, 배열들을 비교하거나 그 내용을 변경하거나, 배열을 컬렉션으로 변환하는 등이 있습니다.

{#pass-variable-number-of-arguments-to-a-function}
### 정해지지 않은 갯수의 인수를 함수에 전달하기

Kotlin 에서는 정해지지 않은 수의 인수를 `vararg` 매개변수에 전달할 수 있습니다. 
이는 메시지를 포매팅하거나 SQL 쿼리를 작성할 때 등 구현 측에서 몇 개의 인수가 올지 알 수 없을 때 유용합니다.

정해지지 않은 수의 인수들을 가진 배열을 함수에 전달하려면, **펼치기** 연산자(`*`)를 사용합니다.
펼치기 연산자는 배열의 각 요소를 독립적인 인수로 함수에 전달합니다:

```kotlin
fun main() {
    val lettersArray = arrayOf("c", "d")
    printAllStrings("a", "b", *lettersArray)
    // abcd
}

fun printAllStrings(vararg strings: String) {
    for (string in strings) {
        print(string)
    }
}
```

더 많은 정보는 [정해지지 않은 갯수의 매개변수 (varargs)](/docs/functions.md#정해지지-않은-갯수의-매개변수) 문단을 확인해보세요.

{#compare-arrays}
### 배열의 비교

배열이 서로 같은 요소를 같은 순서로 가지고 있는지 확인하려면, [`.contentEquals()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/content-equals.html) 나 [`.contentDeepEquals()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/content-deep-equals.html) 를 사용합니다:

```kotlin
val simpleArray = arrayOf(1, 2, 3)
val anotherArray = arrayOf(1, 2, 3)

// Compares contents of arrays
println(simpleArray.contentEquals(anotherArray))
// true

// Using infix notation, compares contents of arrays after an element 
// is changed
simpleArray[0] = 10
println(simpleArray contentEquals anotherArray)
// false
```

{>caution}
> 배열의 내용을 비교하기 위해 동일성 판단 연산자(`==`, `!=`)를 사용하면 안됩니다. 이 연산자들은 두 피연산자가 서로 같은 오브젝트를 가리키는지 비교하는 참조적 동일성을 판단합니다.
> 
> Kotlin 의 배열이 왜 이렇게 동작하는지에 대해서는, [이 블로그의 포스트](https://blog.jetbrains.com/kotlin/2015/09/feedback-request-limitations-on-data-classes/?_gl=1*1jn2tzg*_ga*NzY5NzU4NDQ1LjE2OTIxNjIwNDA.*_ga_9J976DJZ68*MTcxNjQ0MjQ0OC4xMDQuMS4xNzE2NDQzODMxLjUzLjAuMA..&_ga=2.164268863.1241882561.1715957889-769758445.1692162040#Appendix.Comparingarrays)를 살펴보세요.


{#transform-arrays}
### 배열의 변환

Kotlin 에는 배열을 변환하기 위한 많은 쓸만한 함수들이 있습니다. 
이 문서에서는 몇몇 가지만 소개하지만, 이들로 국한되지 않습니다.
전체 목록을 확인하려면, [API 레퍼런스](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-array/)를 확인해보세요.

#### Sum

모든 배열 요소의 합을 구하려면, [`.sum()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/sum.html) 함수를 사용합니다:

```kotlin
val sumArray = arrayOf(1, 2, 3)

// Sums array elements
println(sumArray.sum())
// 6
```

> `.sum()` 함수는 배열이 [숫자형 데이터 타입](/docs/numbers.md)을 요소로 가질 때만 사용 가능합니다. 예를 들면 `Int` 등이 있습니다.

#### Shuffle

배열 안의 데이터를 랜덤한 순서로 섞으려면, [`.shuffle()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/shuffle.html) 함수를 사용합니다:

```kotlin
val simpleArray = arrayOf(1, 2, 3)

// Shuffles elements [3, 2, 1]
simpleArray.shuffle()
println(simpleArray.joinToString())

// Shuffles elements again [2, 3, 1]
simpleArray.shuffle()
println(simpleArray.joinToString())
```

{#convert-arrays-to-collections}
#### 컬렉션으로의 변환

어떤 건 배열을 쓰고 어떤 건 컬렉션을 쓰는 서로 다른 API들로 작업중이라면, 배열을 [컬렉션](/docs/collections-overview.md) 등으로 변환할 수 있습니다:

##### 리스트나 집합으로의 변환

배열을 `List` 나 `Set` 으로 변환하려면, [`.toList()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-list.html) 나 [`.toSet()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-set.html) 를 사용하세요.

```kotlin
val simpleArray = arrayOf("a", "b", "c", "c")

// Converts to a Set
println(simpleArray.toSet())
// [a, b, c]

// Converts to a List
println(simpleArray.toList())
// [a, b, c, c]
```

##### Map 으로의 변환

배열을 `Map` 으로 변환하려면, [`.toMap()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-map.html) 함수를 사용하세요.

단, `Pair<K, V>` 타입을 요소로 가지는 배열만이 `Map`으로 변환될 수 있습니다. `Pair` 인스턴스의 첫 값(`first`)이 Map 의 키가 되고, 두 번째 값(`second`)이 Map 의 값이 됩니다.
이 예제에서는 `Pair` 인스턴스를 만들기 위해 [`to`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/to.html) 함수를 [infix 표기법](/docs/functions.md#infix-표기법)으로 호출했습니다.

```kotlin
val pairArray = arrayOf("apple" to 120, "banana" to 150, "cherry" to 90, "apple" to 140)

// Converts to a Map
// The keys are fruits and the values are their number of calories
// Note how keys must be unique, so the latest value of "apple"
// overwrites the first
println(pairArray.toMap())
// {apple=140, banana=150, cherry=90}
```

{#primitive-type-arrays}
## 원시 타입 배열

`Array` 클래스를 통해 원시 타입의 값들을 요소로 가지게 하면, 모든 값들이 그에 해당하는 Java 클래스의 오브젝트로 포장됩니다.
대안으로, 미리 준비된 원시타입 배열들을 사용해 원시 값들을 오버헤드 없이 배열에 저장할 수 있습니다:

| 원시 타입 배열                                                                              | Java 의 동일한 데이터타입 |
|---------------------------------------------------------------------------------------|------------------|
| [`BooleanArray`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-boolean-array/) | `boolean[]`      |
| [`ByteArray`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-byte-array/)       | `byte[]`         |
| [`CharArray`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-char-array/)       | `char[]`         |
| [`DoubleArray`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-double-array/)   | `double[]`       |
| [`FloatArray`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-float-array/)     | `float[]`        |
| [`IntArray`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-int-array/)         | `int[]`          |
| [`LongArray`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-long-array/)       | `long[]`         |
| [`ShortArray`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-short-array/)     | `short[]`        |

이 클래스들은 `Array` 클래스와 상속관계에 있지 않지만, `Array` 가 가지는 함수들을 모두 그대로 가지고 있습니다.

이 예제는 `IntArray` 클래스의 인스턴스를 만듭니다:

```kotlin
// Creates an array of Int of size 5 with the values initialized to zero
val exampleArray = IntArray(5)
println(exampleArray.joinToString())
// 0, 0, 0, 0, 0
```

> 원시 타입의 배열을 오브젝트 타입의 배열로 변환하려면, [`.toTypedArray()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-typed-array.html) 함수를 사용합니다.
> 
> 오브젝트 타입의 배열을 원시 타입의 배열로 변환하려면, [`.toBooleanArray()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-boolean-array.html), [`.toByteArray()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-byte-array.html), [`.toCharArray()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/to-char-array.html) 등을 사용합니다.

{#what-s-next}
## 더 알아보기

- 대부분의 경우에서 컬렉션을 사용하기를 권장하는 이유에 대해 알아보려면, [컬렉션 훑어보기](/docs/collections-overview.md) 문서를 살펴보세요.
- 다른 [기본 타입](/docs/basic-types.md)들에 대해 살펴보세요.
- 만약 당신이 Java 개발자라면, [Collection 에 대한 Java 에서 Kotlin 으로의 마이그레이션 가이드](/docs/java-to-kotlin-collections-guide.md) 를 읽어보세요.

{&?}
