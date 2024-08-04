Kotlin 의 함수들은 [일급 시민](https://en.wikipedia.org/wiki/First-class_function)입니다. 
이는 이들이 변수나 기타 데이터 구조에 저장될 수 있고, 어떤 또다른 [고차 함수](#고차-함수)의 인수로 전달되거나 그의 리턴으로 
돌려받을 수 있음을 의미합니다. 다른 함수가 아닌 값들에게 행하는 모든 오퍼레이션을 함수에도 동일하게 수행할 수 있습니다.

이를 가능하게 하기 위해, 정적 타입 언어인 Kotlin 에서는 [함수 타입](#함수-타입)을 사용하며 [람다 표현](#람다-표현과-익명-함수)과 같은
문법적 요소를 제공합니다.

## 고차 함수
고차 함수는 함수를 인수로 받거나, 함수를 리턴하는 함수를 말합니다.

고차 함수의 좋은 예시는, 컬렉션에서 사용되는 [함수형 프로그래밍에서의 fold](https://en.wikipedia.org/wiki/Fold_(higher-order_function)) 입니다.
이 함수는 초기 누산값(initial)과 조합 함수(combine)를 받으며, 현재 누산값(accumulator)을 
각 컬렉션의 모든 요소와 연속적으로 조합(combine)한 뒤 리턴합니다:

```kotlin
fun <T, R> Collection<T>.fold(
    initial: R,
    combine: (acc: R, nextElement: T) -> R
): R {
    var accumulator: R = initial
    for (element: T in this) {
        accumulator = combine(accumulator, element)
    }
    return accumulator
}
```

위의 코드에서, `combine` 파라미터는 [함수 타입](#함수-타입)인 `(R, T) -> R` 을 가지며, 
이는 '각각 `R` 과 `T` 타입을 가지는 두 개의 파라미터를 받고 `R` 타입의 값을 리턴하는 함수'를 표현합니다.
이는 `for` 반복 내에서 [호출](#함수-타입-인스턴스의-호출)되며, 그의 리턴 값이 `accumulator` 에 할당됩니다.

`fold` 를 호출하려면, [함수 타입의 인스턴스](#함수-타입-인스턴스의-생성)를 인수로 전달해야하며, 
아래에서 더 자세히 기술될 람다 표현이 이와 같은 고차 함수의 호출 측에서 널리 사용됩니다:

```kotlin
val items = listOf(1, 2, 3, 4, 5)

// 람다는 중괄호로 감싼 코드의 블럭입니다.
items.fold(0, { 
    // 람다가 파라미터를 받는다면, 그들이 가장 먼저 온 뒤 '->' 가 뒤따라야 합니다.
    acc: Int, i: Int -> 
    print("acc = $acc, i = $i, ") 
    val result = acc + i
    println("result = $result")
    // 마지막의 '표현'이 람다의 리턴 값으로 평가됩니다.
    result
})

// 람다의 파라미터 타입은, 컨텍스트에 의해 유추될 수 있다면 생략 가능합니다.
val joinedToString = items.fold("Elements:", { acc, i -> acc + " " + i })

// 고차 함수의 호출 시 다른 함수의 레퍼런스도 사용 가능합니다.
val product = items.fold(1, Int::times)
```

## 함수 타입
Kotlin 은 `(Int) -> String` 같은 함수 타입을 사용합니다. 
선언할 때는 `val onClick: () -> Unit = ...` 와 같은 형태입니다.

이러한 타입들은 받고자 하는 함수의 시그니쳐에서 '파라미터'와 '리턴 값' 대응하는 특별한 표기법이 있습니다:

- 모든 함수 타입들은 괄호로 묶인 파라미터 목록과 리턴 타입을 표기해야합니다: 
  `(A, B) -> C` 라는 함수 타입은 각각 `A` 와 `B` 라는 타입을 가지는 2개의 파라미터를 받고 `C` 라는 타입을 리턴하는 함수를 표현합니다. 
  파라미터의 목록은 비어있을 수 있으며, 이런 경우 `() -> A` 와 같이 표현합니다. [`Unit` 리턴 타입](/docs/functions.md#Unit-을-리턴하는-함수) 이 람다에서는 생략될 수 없습니다.
- 함수 타입들은 **수신자**타입을 가질 수 있으며, 기존 표기의 앞에 점을 찍고 표현합니다. `A.(B) -> C` 는 `A` 타입을 가지는 수신자 오브젝트에 대해, `B` 를 인수로 받아 `C` 를 리턴하는 함수로서 호출될 수 있습니다.
  [수신자를 갖는 함수 리터럴](#수신자를-갖는-함수-리터럴)의 타입을 이 방식으로 정의합니다.
- [정지 함수](/docs/coroutines-basics.md#리팩터링---함수로-분리) 들은 **suspend** 수정자를 표기하며,
  `suspend () -> Unit` 이나 `suspend A.(B) -> C` 같은 형태입니다.

함수 타입 표기에 `(x: Int, y: Int) -> Point` 와 같이 파라미터의 이름들을 표기할 수도 있습니다.
이 이름들은 각 인수가 어떤 것을 의미하는지 표기할 때 사용할 수 있습니다.

만약 어떤 함수의 타입이 [nullable](/docs/null-safety.md#nullable-타입과-nullable-하지-않은-타입) 하다면, 
`((Int, Int) -> Int)?` 처럼 괄호로 감싸 표현합니다.

함수 타입들은 `(Int) -> ((Int) -> Unit)` 와 같이 괄호를 사용하여 조합될 수도 있습니다.

> 화살표 표기법은 오른쪽부터 결합됩니다. 즉, `(Int) -> (Int) -> Unit` 는 바로 위의 타입과 동일하며, `((Int) -> (Int)) -> Unit` 와 다릅니다.

[타입 별칭](/docs/type-aliases.md) 를 사용하여 함수 타입에 이름을 붙힐 수도 있습니다:

```kotlin
typealias ClickHandler = (Button, ClickEvent) -> Unit
```

### 함수 타입 인스턴스의 생성

함수 타입의 인스턴스를 만드는 방법은 몇 가지가 있습니다:

- 아래에서 서술하는 형태의, 코드 블럭을 포함하는 함수 리터럴:
  - [람다 표현](#람다-표현과-익명-함수): `{ a, b -> a + b }`
  - [익명 함수](#익명-함수): `fun(s: String): Int { return s.toIntOrNull() ?: 0 }`
  수신자를 갖는 함수 타입에는 [수신자를 갖는 함수 리터럴](#수신자를-갖는-함수-리터럴)이 사용됩니다.
- 이미 존재하는 함수 정의의 레퍼런스:
  - 최상위 레벨, 로컬, 멤버, 확장 [함수](/docs/reflection.md#함수-레퍼런스): `::isOdd`, `String::toInt`
  - 최상위 레벨, 멤버, 확장 [프로퍼티](/docs/reflection.md#프로퍼티-레퍼런스): `List<Int>::size`
  - [생성자](/docs/reflection.md#생성자-레퍼런스): `::Regex`
  
  이들은 `foo::toString` 와 같은 어떤 특정한 인스턴스의 멤버 함수를 가리키는 [바인딩된 호출 가능한 레퍼런스](/docs/reflection.md#바인딩된-함수-레퍼런스와-프로퍼티-레퍼런스) 도 포함합니다.
- 함수 타입을 인터페이스로서 확장하는 커스텀 클래스 인스턴스:
  ```kotlin
  class IntTransformer: (Int) -> Int {
    override operator fun invoke(x: Int): Int = TODO()
  }
    
  val intFunction: (Int) -> Int = IntTransformer()
  ```
  
충분한 정보가 주어진다면 컴파일러가 알아서 함수 리터럴의 타입을 유추합니다:
```kotlin
val a = { i: Int -> i + 1 } // (Int) -> Int 로 유추됩니다.
```

**리터럴이 아닌** 함수 타입 값들은 수신자가 있는 것과 없는 것 사이에서 서로 교환 가능합니다.
이럴 때는 수신자가 첫 파라미터가 됩니다. 예를 들어, `(A, B) -> C` 타입을 갖는 값은 `A.(B) -> C` 타입의 값을 기대하는 변수나 파라미터에 할당되거나 전달될 수 있고, 그 반대도 가능합니다:

```kotlin 
val repeatFun: String.(Int) -> String = { times -> this.repeat(times) }
val twoParameters: (String, Int) -> String = repeatFun // OK

fun runTransformation(f: (String, Int) -> String): String {
    return f("hello", 3)
}
val result = runTransformation(repeatFun) // OK
```

> 함수 타입은 어떤 확장 함수의 레퍼런스이더라도 기본적으로 수신자가 없는 것으로 유추됩니다. 
> 이를 막으려면, 변수의 타입을 명시적으로 설정하세요.

---
{&^---}

위의 팁은 아래 내용을 설명합니다.
```kotlin
// 아래와 같은 확장 함수가 있을 때,
fun A.someExtension(b: B): C { ... }

// 아래 변수의 타입은 `(A, B) -> C` 로 유추됩니다(정확히는 KFunction2<A, B, C> 입니다).
val extensionReference = A::someExtension

// 이를 수신자를 가지는 함수 리터럴로 설정하려면, 아래처럼 타입을 명시해야합니다.
val extensionReference: A.(B) -> C = A::someExtension
```

{&$---}

### 함수 타입 인스턴스의 호출

함수 타입의 값의 호출은 그의 [`invoke(...)` 연산자](/docs/operator-overloading.md#호출-연산자) 를 사용하여 `f.invoke(x)` 처럼 하거나 `f(x)` 로 수행합니다.

값의 타입이 리시버를 가진다면, 그 리시버 타입을 갖는 오브젝트를 첫 인수로 전달하거나(`foo(1, 2)`) [확장 함수](/docs/extensions.md)와 동일하게(`1.foo(2)`) 사용합니다.
```kotlin
val stringPlus: (String, String) -> String = String::plus
val intPlus: Int.(Int) -> Int = Int::plus

println(stringPlus.invoke("<-", "->"))
println(stringPlus("Hello, ", "world!"))

println(intPlus.invoke(1, 1))
println(intPlus(1, 2))
println(2.intPlus(3)) // extension-like call
```

### 인라인 함수

때때로 [인라인 함수](/docs/inline-functions.md) 를 사용하는 것이 고차 함수의 유연한 흐름 제어를 위해 도움이 될 때도 있습니다.

## 람다 표현과 익명 함수

람다 표현과 익명 함수는 모두 **함수 리터럴**입니다. 함수 리터럴은 선언되지 않았지만 표현으로써 곧바로 전달됩니다.
아래와 같은 예제를 생각해볼까요:

```kotlin
max(strings, { a, b -> a.length < b.length })
```

`max` 함수는 다른 함수를 두 번째 파라미터로 받는 고차 함수입니다.
전달한 두 번째 인수는 함수 리터럴로 명명되는, 그 자체로 함수인 표현이며 아래의 기명 함수와 동일합니다.

```kotlin
fun compare(a: String, b: String): Boolean = a.length < b.length
```

### 람다 표현 문법

람다 표현의 완전한 문법적 형태는 아래와 같습니다:

```kotlin
val sum: (Int, Int) -> Int = { x: Int, y: Int -> x + y } 
```

- 람다 표현은 항상 중괄호로 둘러싸입니다.
- 파라미터 정의는 중괄호 안에 작성되며, 타입 표기는 다른 컨텍스트로부터 유추 가능하다면 생략할 수 있습니다.
- 실제 코드 몸체는 `->` 뒤에 작성됩니다.
- 람다의 유추된 리턴타입이 `Unit` 이 아니면, 마지막 표현(혹은 유일한 표현)이 람다의 리턴값으로 평가됩니다.

가능한 한 많은 표기를 생략한다면, 위의 표현은 아래처럼 다시 표기됩니다.
```kotlin
val sum = { x: Int, y: Int -> x + y }
```

### 함수의 가장 마지막 파라미터에 람다를 전달하기

Kotlin 의 문법 규약에 따라, 어떤 함수의 마지막 파라미터가 함수라면, 해당 람다 표현은 괄호 바깥쪽에 배치됩니다:

```kotlin
val product = items.fold(1) { acc, e -> acc * e }
```

이러한 문법은 **뒤따르는 람다(trailing lambda)** 라고도 알려져 있습니다.

만약 이 람다가 함수의 유일한 인수라면, 괄호 마저도 생략될 수 있습니다:

```kotlin
run { println("...") }
```

### it: 유일한 파라미터의 암시적 이름

람다식이 단 하나의 파라미터를 가지는 상황은 아주 흔합니다.

만약 컴파일러가 유일 파라미터의 타입을 유추할 수 있다면, 람다 표현의 첫머리에 파라미터가 정의되지 않아도 되며 `->` 도 생략할 수 있습니다.
이런 경우 그 유일 파라미터는 암시적으로 `it` 이라는 이름과 함께 선언됩니다:

```kotlin
ints.filter { it > 0 } // this literal is of type '(it: Int) -> Boolean'
```

### 람다식에서 값을 리턴하기

[라벨이 붙은 리턴](/docs/returns.md#라벨이-붙은-리턴) 문법을 사용하여, 람다에서 어떤 값을 명시적으로 리턴할 수 있습니다.
그렇지 않을 때는, 마지막 표현이 암시적으로 리턴됩니다.

그러므로, 아래의 두 스니펫은 동일합니다.

```kotlin
ints.filter {
    val shouldFilter = it > 0
    shouldFilter
}

ints.filter {
    val shouldFilter = it > 0
    return@filter shouldFilter
}
```

이러한 [괄호 바깥에 함수를 전달](#함수의-가장-마지막-파라미터에-람다를-전달하기)하는 형태는 
[LINQ-스타일](https://learn.microsoft.com/en-us/dotnet/csharp/linq/)의 코드를 작성할 수 있게 합니다:

```kotlin
strings.filter { it.length == 5 }.sortedBy { it }.map { it.uppercase() }
```

### 사용되지 않는 파라미터에 언더바 사용하기

만약 람다의 파라미터가 사용되지 않는다면, 이름 대신 언더바를 배치합니다:

```kotlin
map.forEach { (_, value) -> println("$value!") }
```

---
{&^---}

만약 사용되지 않는 변수가 여러 개라면, 언더바를 여러 개 사용합니다:
```kotlin
map.forEach { (_, __) -> println("ASDF") }
```

{&$---}

### 람다에서의 분해형 선언

람다에서 구조 분해는 [](/docs/destructing-declarations.md) 문서에 기술되어 있습니다.

### 익명 함수

위의 람다 표현 문법에서는 함수의 리턴 타입을 명시할 수 있는 방법이 없습니다. 
일반적으로는 리턴 타입이 자동으로 유추되므로 이것을 명시할 필요가 없습니다. 
그러나 만약 이를 명확하게 정해야 한다면, **익명 함수** 문법을 사용할 수 있습니다.

```kotlin
fun(x: Int, y: Int): Int = x + y
```

익명 함수는 일반적인 함수의 선언과 매우 유사하며, 유일한 차이점은 이름이 생략되었다는 점입니다.
그의 몸체는 일반 함수와 동일하게 표현이거나(위의 예제처럼), 아래처럼 블럭일 수 있습니다:

```kotlin
fun(x: Int, y: Int): Int {
    return x + y
}
```

파라미터와 리턴 타입은 일반적인 함수와 동일하게 작성되지만, 배경상황으로부터 유추될 수 있다면 생략할 수 있습니다:

```kotlin
ints.filter(fun(item) = item > 0)
```

익명 함수의 리턴 타입 유추는 일반적인 함수와 동일하게 이루어집니다: 익명 함수의 몸체가 표현이라면 자동으로 유추되고, 
그렇지 않다면 리턴 타입이 `Unit` 이 아닌 이상 명확하게 타입을 표기해야합니다.

> 익명 함수를 파라미터로 전달할 때에는 반드시 괄호 안쪽에 해야합니다. 파라미터로 전달하는 함수를 괄호 바깥에 배치하는 문법은 람다 표현에만 사용할 수 있습니다.

람다 표현과 익명 함수의 또다른 차이점은 [비지역적 리턴](/docs/inline-functions.md#비지역적-리턴)에 있습니다.
라벨이 없는 `return` 문장은 항상 가장 가까운 `fun` 으로 선언된 함수를 리턴합니다. 이는 람다의 `return` 은 그 람다를 포함하는 가장 가까운 `fun` 함수에서 벗어나지만, 익명 함수의 `return` 은 그 자신을 벗어남을 의미합니다.

---
{&^---}

아래와 같은 예제를 살펴보죠.
```kotlin
fun someFunction() {
    val someLambda = { return } // 실제로는 컴파일되지 않습니다: 'return' is not allowed here.
    
    // 만약 위의 문장이 컴파일되었다면,
    someLambda() // 이 문장에서 someFunction 이 리턴됩니다.
    println("Unreachable") // 그렇기 때문에 이 문장은 실행되지 않을 것임을 의미합니다.
}
```
그러면 실제로는 컴파일되지 않기 때문에 의미가 없는 설명을 왜 하고 있는지를 살펴볼까요.   
아래와 같은 함수가 있다고 생각해 보겠습니다.
```kotlin
inline fun someInlineFunction(lambda: () -> Unit) {
    lambda()
    println("Reached!")
}
```
이 함수는 인라인 함수이며, 그에 전달하는 람다 파라미터가 `crossinline` 이 아니므로 아래처럼 라벨이 없는 `return` 을 사용하는것이 허용됩니다.
```kotlin
someInlineFunction { return }
```
이렇게 작성하면, 아무것도 출력하지 않고 이 함수를 호출한 가장 가까운 `inline` 이 아니면서 `fun` 으로 정의된 함수를 리턴합니다.

이번에는 람다가 아닌 익명 함수로 작성해보겠습니다.
```kotlin
someInlineFunction(fun() { return })
```
익명 함수의 `return` 구문은 익명함수 자신만 리턴합니다. 따라서 `Reached!` 를 출력합니다.

따라서 만약 아래처럼 한다면, 첫 번째 `someInlineFunction` 에서 `main` 을 리턴해버리기 때문에 결과적으로 아무것도 출력하지 않습니다.
```kotlin
fun main() {
    someInlineFunction { return }
    someInlineFunction(fun() { return })
}
```
자세한 사항은 [인라인 함수](/docs/inline-functions.md) 문서를 확인해보세요.

{&$---}

### 클로저

람다 표현이나 익명 함수 들은, 로컬 함수나 오브젝트 표현과 동일하게 그들 자신의 **클로저**에 접근할 수 있습니다. 
이 클로저는 바깥쪽에 정의된 변수들을 포함하며, 클로저에서 캡쳐된 변수를 람다 안에서 수정할 수도 있습니다.

```kotlin
var sum = 0
ints.filter { it > 0 }.forEach {
    sum += it
}
print(sum)
```

### 수신자를 갖는 함수 리터럴

`A.(B) -> C` 와 같은 수신자를 갖는 [함수 타입](#함수-타입)들은 '수신자를 갖는 함수 리터럴'이라는 특별한 형태의 함수 리터럴로 구체화될 수 있습니다.

위에서도 언급했듯이, Kotlin 에서는 제공되는 **수신자 오브젝트**와 함께 [함수의 인스턴스를 호출](#함수-타입-인스턴스의-호출)할 수 있습니다.

수신자 오브젝트는 함수 리터럴의 몸체 안에서 암시적으로 `this` 가 되며, 그러므로 그 수신자의 멤버에 별다른 접근자 없이 접근하거나 [this 표현](/docs/this-expressions.md) 을 통해 접근할 수 있습니다.

이는 람다 함수 내에서 그 수신자 오브젝트의 멤버에 접근할 수 있는 [](/docs/extensions.md)와 비슷합니다.

아래는 전달되는 수신자의 `plus` 함수를 호출하는, 수신자를 갖는 함수 리터럴의 예제입니다.

```kotlin
val sum: Int.(Int) -> Int = { other -> plus(other) }
```

익명 함수 문법 또한 수신자의 타입을 지정할 수 있도록 허용합니다. 이 형태는 함수 타입의 변수를 미리 만들어두고 나중에 사용할 때 유용합니다.

```kotlin
val sum = fun Int.(other: Int): Int = this + other
```

람다 표현들은, 수신자의 타입이 배경상황으로부터 유추 가능하다면 수신자를 갖는 함수 리터럴로 사용될 수 있습니다.
이런 케이스들의 가장 대표적인 예시는 [타입안정성을 갖는 빌더](/docs/type-safe-builders.md) 입니다:

```kotlin
class HTML {
    fun body() { ... }
}

fun html(init: HTML.() -> Unit): HTML {
    val html = HTML()  // create the receiver object
    html.init()        // pass the receiver object to the lambda
    return html
}

html {       // lambda with receiver begins here
    body()   // calling a method on the receiver object
}
```
---
{&^---}

`fun html(...)` 는 아래처럼 작성될 수도 있습니다. 환상적이죠!
```kotlin
fun html() = HTML().apply(init)
```

{&$---}

{&?}