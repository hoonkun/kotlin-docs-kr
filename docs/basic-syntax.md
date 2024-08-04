이 문서는 Kotlin 의 기본적인 문법적 요소들을 다룹니다. 매 섹션의 끝에서, 관련 주제의 세부 사항을 기술하고 있는 문서의 링크를 찾아보실 수 있습니다.  

또한, Jetbrains Academy 의 [Kotlin Core track](https://hyperskill.org/tracks?category=4&utm_source=jbkotlin_hs&utm_medium=referral&utm_campaign=kotlinlang-docs&utm_content=button_1&utm_term=22.03.23) 을 통해 무료로 Kotlin 의 기초를 배울 수 있습니다.  

## 패키지 정의와 임포트

패키지 정의는 파일의 가장 위에 위치해야합니다:

```kotlin
package my.demo

import kotlin.text.*

// ...
```

패키지 이름이 해당 파일이 포함되는 디렉터리 구조와 일치할 필요는 없습니다: 소스파일은 패키지와 관계없이 파일 시스템의 어디든 위치할 수 있습니다.

[패키지와 임포트](/docs/packages.md) 문서를 확인해보세요.

## 프로그램 엔트리 포인트

Kotlin 어플리케이션의 엔트리 포인트는 `main` 함수입니다:

```kotlin
fun main() {
    println("Hello world!")
}
```

정해지지 않은 갯수의 `String` 입력들을 수신하기 위한 `main` 함수의 다른 형태입니다:

```kotlin
fun main(args: Array<String>) {
    println(args.contentToString())
}
```

## 표준 출력 스트림에 쓰기

`print` 함수는 그의 인수를 표준 출력 스트림에 씁니다:

```kotlin
print("Hello ")
print("world!")
```

`println` 은 그의 인수를 출력하고, 뒤에 개행을 추가합니다. 즉, 그 다음에 출력하는 것이 다음 줄에 써집니다:

```kotlin
println("Hello world!")
println(42)
```

## 표준 입력 스트림으로부터 읽기 {#read-from-the-standard-input}

`readln()` 함수는 표준 입력 스트림으로부터 읽습니다. 이 함수는 사용자가 입력한 전체 한 줄을 문자열로 리턴합니다.

`println()`, `print()`, `readln()` 을 사용하여 들어온 요청과 사용자가 입력한 입력을 출력할 수 있습니다:

```kotlin
// Prints a message to request input
println("Enter any word: ")

// Reads and stores the user input. For example: Happiness
val yourWord = readln()

// Prints a message with the input
print("You entered the word: ")
print(yourWord)
// You entered the word: Happiness
```

더 많은 내용은 [](/docs/read-standard-input.md) 를 살펴보세요.


## 함수

두 개의 `Int` 파라미터와 `Int` 리턴형을 가지는 함수입니다:

```kotlin
fun sum(a: Int, b: Int): Int {
    return a + b
}
```

함수의 몸체는 표현식일 수 있습니다. 이 경우 리턴 타입은 자동으로 유추됩니다:

```kotlin
fun sum(a: Int, b: Int) = a + b
```

아무런 유의미한 값을 리턴하지 않는 함수는 아래처럼 씁니다:

```kotlin
fun printSum(a: Int, b: Int): Unit {
    println("sum of $a and $b is ${a + b}")
}
```

`Unit` 리턴타입은 생략될 수 있습니다:

```kotlin
fun printSum(a: Int, b: Int) {
    println("sum of $a and $b is ${a + b}")
}
```

[](/docs/functions.md) 문서를 확인해보세요.

## 변수

Kotlin 에서, 변수는 `val` 이나 `var` 키워드를 시작으로 그 뒤에 변수 이름을 적어 정의합니다.

`val` 키워드는 단 한 번만 값이 할당되는 변수를 선언할 때 사용합니다. 이들은 변경할 수 없고, 읽을 수만 있는 로컬 변수로 초기화 이후 다른 값으로 덮어쓸 수 없습니다:

```kotlin
// x 라는 변수를 선언하고 5 라는 값으로 초기화합니다.
val x: Int = 5
// 5
```

`var` 키워드는 다시 할당될 수 있는 변수를 선언할 때 사용합니다. 이들은 초기화 이후에 값을 변경할 수 있습니다:

```kotlin
// x 라는 변수를 선언하고 5 라는 값으로 초기화합니다.
var x: Int = 5
// 변수 x 를 6이라는 값으로 덮어씁니다.
x += 1
// 6
```

Kotlin 은 타입 유추를 지원하며 선언된 변수의 타입을 자동으로 알아냅니다. 변수를 선언할 때, 변수명 뒤의 타입을 생략할 수도 있습니다:

```kotlin
// x 라는 변수를 선언하고 5 라는 값으로 초기화합니다; `Int` 타입이 유추됩니다.
val x = 5
// 5
```

변수는 초기화 이후부터 사용할 수 있습니다. 변수를 선언하는 순간에 초기화할 수도 있고, 선언을 먼저 하고 나중에 초기화할 수도 있습니다. 두 번째 경우에서는, 변수의 데이터형을 반드시 명시해주어야 합니다:

```kotlin
// x 변수를 선언과 동시에 초기화합니다; 타입이 필요하지 않습니다.
val x = 5
// c 변수를 초기화 없이 선언만 합니다; 타입이 필요합니다.
val c: Int
// 선언한 뒤에 변수 c 를 초기화합니다. 
c = 3
// 5 
// 3
```

변수는 최상위 레벨에 선언할 수도 있습니다:

```kotlin
val PI = 3.14
var x = 0

fun incrementX() {
    x += 1
}
// x = 0; PI = 3.14
// incrementX()
// x = 1; PI = 3.14
```

[](/docs/properties.md) 문서 에서 클래스의 프로퍼티를 선언하는 방법에 대해 살펴보세요.

## 클래스와 인스턴스의 생성

클래스를 정의하려면 `class` 키워드를 사용합니다:

```kotlin
class Shape
```

클래스의 프로퍼티는 그의 클래스 정의나 몸체에 선언될 수 있습니다:

```kotlin 
class Rectangle(val height: Double, val length: Double) {
    val perimeter = (height + length) * 2
}
```

클래스 정의에 열거된 인수는 기본 생성자에서 사용가능합니다:

```kotlin
class Rectangle(val height: Double, val length: Double) {
    val perimeter = (height + length) * 2 
}
fun main() {
    val rectangle = Rectangle(5.0, 2.0)
    println("The perimeter is ${rectangle.perimeter}")
}
```

클래스 사이의 상속은 콜론(`:`) 를 통해 정의됩니다. 클래스들은 기본적으로 `final` 이기 때문에, 그것을 상속받을 수 있게 하려면 `open` 수정자로 마킹하세요:

```kotlin
open class Shape

class Rectangle(val height: Double, val length: Double): Shape() {
    val perimeter = (height + length) * 2
}
```

[](/docs/classes.md) 문서와 [](/docs/object-declarations.md) 문서에서 생성자와 상속에 대한 더 많은 정보를 확인해보세요.

## 주석

다른 현대 프로그래밍 언어와 동일하게, Kotlin 은 한 라인(라인 끝)과 여러 라인(블럭) 주석을 지원합니다:

```kotlin
// 라인 끝의 주석입니다.

/* 여러 줄에 걸친
   블럭 주석입니다. */
```

Kotlin 에서 블럭 주석은 중첩될 수 있습니다.

```kotlin
/* 주석이 여기에서 시작하며,
/* 중첩된 주석을 포함할 수 있고 */
여기에서 끝납니다. */
```

[코틀린 코드의 문서화](https://kotlinlang.org/docs/kotlin-doc.md) 문서에서 문서화 주석 문법에 대해 더 알아보실 수 있습니다.

## 템플릿 문자열

```kotlin
var a = 1
// 단순한 이름의 템플릿
val s1 = "a is $a" 

a = 2
// 아무 표현을 포함한 템플릿
val s2 = "${s1.replace("is", "was")}, but now is $a"
```

더 자세한 사항은 [템플릿 문자열](/docs/strings.md#템플릿-문자열) 섹션을 확인해보세요.

## 조건적인 표현

```kotlin
fun maxOf(a: Int, b: Int): Int {
    if (a > b) {
        return a
    } else {
        return b
    }
}
```

Kotlin 에서, `if` 문은 표현식으로 사용될 수 있습니다:

```kotlin
fun maxOf(a: Int, b: Int) = if (a > b) a else b
```

[`if`-표현](/docs/control-flow.md#if-표현식) 섹션을 확인해보세요.

## for 반복

```kotlin
val items = listOf("apple", "banana", "kiwifruit")
for (item in items) {
    println(item)
}
```

혹은 아래처럼 합니다:

```kotlin
val items = listOf("apple", "banana", "kiwifruit")
for (index in items.indices) {
    println("item at $index is ${items[index]}")
}
```

[for 반복](/docs/control-flow.md#for-반복) 섹션을 확인해보세요.

## while 반복

```kotlin
val items = listOf("apple", "banana", "kiwifruit")
var index = 0
while (index < items.size) {
    println("item at $index is ${items[index]}")
    index++
}
```

[while 반복](/docs/control-flow.md#while-반복) 섹션을 확인해보세요.

## when 표현

```kotlin
fun describe(obj: Any): String =
    when (obj) {
        1          -> "One"
        "Hello"    -> "Greeting"
        is Long    -> "Long"
        !is String -> "Not a string"
        else       -> "Unknown"
    }
```

[when 표현](/docs/control-flow.md#when-표현식) 섹션을 확인해보세요.

## 범위

어떠한 수가 범위 내에 있는지는 `in` 연산자를 통해 확인합니다:

```kotlin
val x = 10
val y = 9
if (x in 1..y+1) {
    println("fits in range")
}
```

범위 밖에 있는지를 확인하려면:

```kotlin
val list = listOf("a", "b", "c")

if (-1 !in 0..list.lastIndex) {
    println("-1 is out of range")
}
if (list.size !in list.indices) {
    println("list size is out of valid list indices range, too")
}
```

범위를 순회하려면:

```kotlin
for (x in 1..5) {
    print(x)
}
```

수열을 통해 순회하려면:

```kotlin
for (x in 1..10 step 2) {
    print(x)
}
println()
for (x in 9 downTo 0 step 3) {
    print(x)
}
```

[](/docs/ranges.md) 문서를 확인해보세요.

## 컬렉션

컬렉션을 순회하려면:

```kotlin
for (item in items) {
    println(item)
}
```

컬렉션이 어떤 값을 포함하는지 확인하려면 `in` 연산자를 사용합니다:

```kotlin
when {
    "orange" in items -> println("juicy")
    "apple" in items -> println("apple is fine too")
}
```

컬렉션을 필터하거나 매핑하려면 [](/docs/lambdas.md)를 사용합니다:

```kotlin
val fruits = listOf("banana", "avocado", "apple", "kiwifruit")
fruits
    .filter { it.startsWith("a") }
    .sortedBy { it }
    .map { it.uppercase() }
    .forEach { println(it) }
```

[](/docs/collections-overview.md) 문서를 확인해보세요.

## Nullable 값들과 null 체크

어떠한 레퍼런스는 `null` 이 할당 가능할 경우 반드시 nullable 로 마킹되어야 합니다. Nullable 한 타입들은 뒤에 `?` 가 따라붙습니다.

`str` 이 숫자를 표현하지 않을 때는 `null` 을 리턴하려면:

```kotlin
fun parseInt(str: String): Int? {
    // ...
}
```

함수가 리턴한 Nullable 한 값을 사용하려면:

```kotlin
fun printProduct(arg1: String, arg2: String) {
    val x = parseInt(arg1)
    val y = parseInt(arg2)

    // 여기에서 바로 `x * y` 를 사용하면 그들 각각이 null 일 수 있기 때문에 오류가 발생합니다.
    if (x != null && y != null) {
        // x 와 y 가 null 체크 이후 자동으로 null 이 아닌 타입으로 캐스팅되었습니다.
        println(x * y)
    }
    else {
        println("'$arg1' or '$arg2' is not a number")
    }    
}
```

혹은:

```kotlin
// ...
if (x == null) {
    println("Wrong number format in arg1: '$arg1'")
    return
}
if (y == null) {
    println("Wrong number format in arg2: '$arg2'")
    return
}

// x 와 y 가 null 체크 이후 자동으로 null 이 아닌 타입으로 캐스팅되었습니다.
println(x * y)
```

[](/docs/null-safety.md) 문서를 확인해보세요.

---
null 체크 이후에 자동으로 진행되는 `x`, `y` 변수의 `Int` 타입으로의 캐스팅을 포함하여, 조건문을 통해 어떤 변수가 어떤 타입을 가지는지 확인한 뒤에 자동으로 진행되는 캐스팅을 '스마트 캐스팅' 이라고 부르기도 합니다.  
후자에 대한 설명은 바로 아래에서 이어집니다.

## 타입 체크와 자동 캐스트

`is` 연산자는 어떤 표현식이 특정한 타입의 인스턴스인지를 확인합니다. 변경할 수 없는 로컬 변수가 특정 타입인지 확인되면, 명시적으로 캐스팅할 필요가 없습니다:

```kotlin
fun getStringLength(obj: Any): Int? {
    if (obj is String) {
        // `obj` 는 이 조건문 브랜치에서 `String` 으로 자동으로 캐스팅됩니다.
        return obj.length
    }

    // 위의 조건문 브랜치 밖에서 `obj` 는 여전히 `Any` 입니다.
    return null
}
```

혹은,

```kotlin
fun getStringLength(obj: Any): Int? {
    if (obj !is String) return null

    // 이 위치에서 `obj` 는 `String` 으로 자동 캐스팅됩니다.
    return obj.length
}
```

아니면 이렇게도 할 수 있습니다:

```kotlin
fun getStringLength(obj: Any): Int? {
    // `obj` 는 `&&` 연산자의 오른쪽에서 `String` 으로 자동 캐스팅됩니다.
    if (obj is String && obj.length > 0) {
        return obj.length
    }

    return null
}
```

[](/docs/classes.md) 문서와 [](/docs/typecasts.md) 문서를 확인해보세요.

{&?}
