Kotlin 의 함수는 `fun` 키워드를 통해 선언됩니다:

```kotlin
fun double(x: Int): Int {
    return 2 * x
}
```

## 함수의 사용

함수들은 일반적인 통념에 따라 호출할 수 있습니다:

```kotlin
val result = double(2)
```

멤버 함수를 호출할 때에는 dot-notation 을 사용합니다:

```kotlin
Stream().read() // Stream 클래스의 인스턴스를 생성하고 read() 함수를 호출합니다.
```

### 매개변수(파라미터)

함수의 매개변수는 Pascal-notation -- name: type 으로 선언합니다. 매개변수들은 쉼표로 구분되며, 모든 매개변수들은 타입을 명시해야합니다:

```kotlin
fun powerOf(number: Int, exponent: Int): Int { /*...*/ }
```

함수의 매개변수를 정의할 때, [끝단의 쉼표](/docs/coding-conventions.md#끝단-쉼표)를 사용할 수 있습니다:

```kotlin
fun powerOf(
    number: Int,
    exponent: Int, // 끝단 쉼표(trailing comma)
) { /*...*/ }
```

### 매개변수의 기본값

함수의 매개변수는 기본값을 가질 수 있고, 기본값을 가지는 매개변수는 호출 시 생략할 수 있습니다. 이를 통해 같은 함수의 오버로드를 줄일 수 있습니다.

```kotlin
fun read(
    b: ByteArray,
    off: Int = 0,
    len: Int = b.size,
) { /*...*/ }
```

매개변수의 기본값은 타입 뒤에 `=` 를 입력하여 설정할 수 있습니다.

재정의된 함수들은 부모의 기본 매개변수 값을 따라야합니다. 
매개변수의 기본값이 있는 함수를 재정의할 때는, 재정의된 함수의 시그니쳐에서 반드시 매개변수 기본값을 생략해야합니다.

```kotlin
open class A {
    open fun foo(i: Int = 10) { /*...*/ }
}

class B : A() {
    override fun foo(i: Int) { /*...*/ }  // 기본값이 허용되지 않습니다.
}
```

만약 기본값이 있는 매개변수가 기본값이 없는 매개변수보다 앞에 정의되면, 이 기본값은 뒤쪽 매개변수의 이름을 사용한 [이름이 명시된 인수](#이름이-명시된-인수) 표현 형태를 사용해야합니다.

```kotlin
fun foo(
    bar: Int = 0,
    baz: Int,
) { /*...*/ }

foo(baz = 1) // 기본값인 bar = 0 이 사용되었습니다.
```

기본값이 있는 매개변수의 뒤에 정의되는 마지막 매개변수가 [람다](/docs/lambdas.md#람다-표현식-문법)이면,
[이름이 명시된 인수](#이름이-명시된-인수) 로 표현하거나 [괄호 바깥에 표현](/docs/lambdas.md#마지막-람다의-전달)할 수도 있습니다.

```kotlin
fun foo(
    bar: Int = 0,
    baz: Int = 1,
    qux: () -> Unit,
) { /*...*/ }

foo(1) { println("hello") }     // 기본값 baz = 1 을 사용합니다.
foo(qux = { println("hello") }) // 두 기본값 bar = 0, baz = 1 를 모두 사용합니다.
foo { println("hello") }        // 이 표현 역시 두 기본값 bar = 0, baz = 1 를 모두 사용합니다.
```

### 이름이 명시된 인수

함수의 호출에서, 하나 이상의 인수 기입 시 매개변수의 이름을 병기할 수 있습니다. 이 표현 방식은 함수의 매개변수가 많고 인수와 매개변수를 관련지어 파악하기 힘들 때(특히 Boolean 이거나 null 이 많을 때) 유용합니다.

매개변수의 이름을 병기할 때는 그들의 순서를 자유롭게 변경할 수 있습니다. 매개변수들의 기본값을 사용하려 한다면 그저 그들을 생략하면 됩니다.

4 개의 기본값이 있는 매개변수를 가지는 `reformat()` 함수를 생각해보세요:

```kotlin
fun reformat(
    str: String,
    normalizeCase: Boolean = true,
    upperCaseFirstLetter: Boolean = true,
    divideByCamelHumps: Boolean = false,
    wordSeparator: Char = ' ',
) { /*...*/ }
```

이 함수를 호출할 때, 모든 매개변수의 이름을 병기할 필요가 없습니다:

```kotlin
reformat(
    "String!",
    false,
    upperCaseFirstLetter = false,
    divideByCamelHumps = true,
    '_'
)
```

기본값이 있는 모든 매개변수를 생략할 수도 있고:

```kotlin
reformat("This is a long String!")
```

그렇지 않고 기본값이 있는 어떤 특정한 매개변수만을 생략할 수도 있습니다. 
다만, 처음 생략된 매개변수 이후에 정의된 인수들은 모두 이름을 병기해야합니다.

```kotlin
reformat("This is a short String!", upperCaseFirstLetter = false, wordSeparator = '_')
```

또한, [정해지지 않은 갯수의 매개변수](#정해지지-않은-갯수의-매개변수)의 인수를 전달할 때 이름을 병기하고 `speard` 연산자를 사용할 수도 있습니다:

```kotlin
fun foo(vararg strings: String) { /*...*/ }

foo(strings = *arrayOf("a", "b", "c"))
```

> JVM 플랫폼에서 Java 함수를 호출할 때에는 매개변수의 이름을 병기할 수 없습니다. 그 이유는 Java 바이트코드가 함수의 매개변수 이름을 항상 유지하지는 않기 때문입니다.  

### Unit 을 리턴하는 함수

어떤 함수가 의미있는 값을 리턴하지 않는다면, 그의 리턴 타입은 `Unit` 입니다. `Unit` 은 하나의 유일한 값인 `Unit` 이 가지는 타입으로, 이 값을 명시적으로 리턴할 필요가 없습니다.

```kotlin
fun printHello(name: String?): Unit {
    if (name != null)
        println("Hello $name")
    else
        println("Hi there!")
    // `return Unit` 혹은 `return` 이 필요 없습니다.
}
```

`Unit` 의 리턴형 정의도 선택적입니다. 위의 코드는 아래와 동일합니다:

```kotlin
fun printHello(name: String?) { ... }
```

### 단일 표현식 함수

만약 함수의 몸체가 하나의 표현식만으로 구성되면, 중괄호가 생략되고 `=` 기호 뒤에 표현될 수 있습니다:

```kotlin
fun double(x: Int): Int = x * 2
```

컴파일러가 타입을 유추할 수 있는 경우, 리턴형을 명시적으로 정의하는 것 또한 선택적입니다:

```kotlin
fun double(x: Int) = x * 2
```

### 명시적인 리턴 타입

블럭의 몸체를 가지는 함수들은, [Unit 을 리턴하도록 의도된 것](#Unit-을-리턴하는-함수)이 아니라면 모두 그의 리턴형을 명시적으로 정의해야합니다.

Kotlin 은 블럭을 몸체로 가지는 함수들의 리턴타입을 유추하지 않습니다. 
이러한 함수들은 그의 몸체에 복잡한 컨트롤 흐름을 가지고 있을 가능성이 높아서, 코드를 읽는 사람이나 때때로는 심지어 컴파일러에게도 무엇을 리턴하는지 명백하지 않을 수 있기 때문입니다.

### 정해지지 않은 갯수의 매개변수

함수가 가지는 매개변수(일반적으로 가장 마지막 것)를 `vararg` 수정자로 표기할 수 있습니다.

```kotlin
fun <T> asList(vararg ts: T): List<T> {
    val result = ArrayList<T>()
    for (t in ts) // ts is an Array
        result.add(t)
    return result
}
```

이 경우에서, 함수의 인수로 정해지지 않은 수의 인수를 전달할 수 있습니다:

```kotlin
val list = asList(1, 2, 3)
```

`T` 의 타입을 가진 `vararg` 인수는, 함수의 안에서 `T` 의 배열 형태로 제공됩니다. 즉, 위의 예제에서 `ts` 매개변수의 타입은 `Array<out T>` 가 됩니다.

단 하나의 매개변수만이 `vararg` 로 정의될 수 있습니다. 만약 `vararg` 매개변수가 마지막 인수가 아니면, 나머지 뒤따르는 매개변수들은 모두 이름을 병기하거나 그것이 람다라면 괄호 바깥에 표기해야 합니다.

`vararg` 매개변수를 가진 함수를 호출할 때는, 예를 들면 `asList(1, 2, 3)` 같은 형태로 인수를 각각 독립적으로 전달할 수 있습니다. 이미 어떤 배열을 가지고 있고 그것을 함수의 인수들로 전달하려 한다면, **spread** 연산자를 사용하세요(배열 앞에 `*`를 붙힙니다):

```kotlin
val a = arrayOf(1, 2, 3)
val list = asList(-1, 0, *a, 4)
```

만약 [원시 타입을 가지는 배열](/docs/arrays.md#원시타입-배열)을 `vararg` 에 전달하고자 한다면, `toTypedArray()` 함수를 통해 일반 배열(타입이 있는)로 변환될 필요가 있습니다.

```kotlin
val a = intArrayOf(1, 2, 3) // IntArray 는 원시 타입의 배열입니다.
val list = asList(-1, 0, *a.toTypedArray(), 4)
```

### Infix 노테이션

`infix` 키워드로 마크된 함수들은 infix 노테이션(호출 시 점과 괄호를 생략)을 사용하여 호출될 수도 있습니다. Infix 함수는 반드시 아래 요구사항들을 만족해야합니다:

{*large-spacing}

- 반드시 멤버 함수이거나 [확장 함수](/docs/extensions.html)여야 합니다.
- 단 하나의 매개변수만 가져야합니다.
- [정해지지 않은 갯수의 매개변수](#정해지지-않은-갯수의-매개변수) 를 가져서는 안되며, 기본값 또한 가져서는 안됩니다.

```kotlin
infix fun Int.shl(x: Int): Int { ... }

// Infix 노테이션을 사용하여 함수를 호출합니다.
1 shl 2

// 이것은 아래와 같은 의미입니다.
1.shl(2)
```

> Infix 함수 호출은 수학적 연산자, 타입 캐스트, `rangeTo` 연산자보다 우선순위가 더 낮습니다. 아래를 확인해보세요:
> - `1 shl 2 + 3` 은 `1 shl (2 + 3)` 과 같습니다.
> - `0 until n * 2` 는 `0 until (n * 2)` 와 같습니다.
> - `xs union ys as Set<*>` 은 `xs union (ys as Set<*>)` 와 같습니다.
> 
> 그와는 다르게, infix 함수의 호출 우선순위는 `&&`, `||` 와 같은 논리 연산자나 `is`, `in` 같은 체크들보다 높습니다.
> 아래의 문장들도 확인해보세요:
> - `a && b xor c` 는 `a && (b xor c)` 와 같습니다.
> - `a xor b in c` 는 `(a xor b) in c` 와 같습니다.

infix 함수들은 반드시 그것을 수신하는 수신자와 매개변수가 모두 명시되어야한다는 점을 기억하세요. 현재 수신자의 함수를 infix 노테이션으로 호출하려고 한다면 `this` 를 명시하세요. 이는 불확실한 파싱을 막는데 필수적입니다.

```kotlin
class MyStringCollection {
    infix fun add(s: String) { /*...*/ }

    fun build() {
        this add "abc"   // Correct
        add("abc")       // Correct
        //add "abc"        // Incorrect: the receiver must be specified
    }
}
```

## 함수의 스코프

Kotlin 의 함수는 파일의 최상위 레벨에 선언될 수 있고, 이는 Java 나 C#, 스칼라([3 부터는 최상위 레벨의 함수 선언이 가능합니다](https://docs.scala-lang.org/scala3/book/taste-toplevel-definitions.html#inner-main)) 등 에서 했던 것과 같은 '함수를 포함할 클래스'를 정의하지 않아도 됨을 의미합니다.
최상위 레벨의 함수에 더해, Kotlin 함수는 다른 함수의 범위 안에서 로컬 멤버 함수 혹은 확장 함수로 선언될 수 있습니다.

### 로컬 함수

Kotlin 은 함수 안의 함수인 로컬 함수를 지원합니다.

```kotlin
fun dfs(graph: Graph) {
    fun dfs(current: Vertex, visited: MutableSet<Vertex>) {
        if (!visited.add(current)) return
        for (v in current.neighbors)
            dfs(v, visited)
    }

    dfs(graph.vertices[0], HashSet())
}
```

로컬 함수는 다른 바깥쪽 함수의 로컬 변수 (클로저)에 접근할 수 있습니다. 위의 예제에서는 `visited` 가 로컬 변수이네요.

```kotlin
fun dfs(graph: Graph) {
    val visited = HashSet<Vertex>()
    fun dfs(current: Vertex) {
        if (!visited.add(current)) return
        for (v in current.neighbors)
            dfs(v)
    }

    dfs(graph.vertices[0])
}
```

### 멤버 함수

멤버 함수는 클래스나 오브젝트 안에 정의된 함수입니다.

```kotlin
class Sample {
    fun foo() { print("Foo") }
}
```

멤버 함수들은 점을 찍어 호출할 수 있습니다:

```kotlin
Sample().foo() // Sample 클래스의 인스턴스를 만들고 foo 를 호출합니다.
```

## 제너릭 함수

함수들은 그의 이름 앞에 꺽쇠괄호를 통해 표현되는 제너릭 매개변수를 가질 수 있습니다:

```kotlin
fun <T> singletonList(item: T): List<T> { /*...*/ }
```

자세한 사항은 [제너릭](/docs/generics.html) 문서를 확인해보세요.

## Tail-recursive 함수

Kotlin 은 함수형 프로그래밍에서 [끝단-재귀](https://en.wikipedia.org/wiki/Tail_call)함수로 알려진 스타일을 지원합니다.
어떠한 루프를 사용하는 알고리즘에서는 재귀함수를 스택 오버플로우의 위험 없이 사용할 수 있습니다. 함수가 `tailrec` 수정자로 마크되고 일반적인 요구사항을 만족하면, 컴파일러가 재귀 호출을 빠르고 효율적인 루프 기반의 형태로 최적화합니다:

```kotlin
val eps = 1E-10 // "good enough", could be 10^-15

tailrec fun findFixPoint(x: Double = 1.0): Double =
    if (Math.abs(x - Math.cos(x)) < eps) x else findFixPoint(Math.cos(x))
```

이 코드는 수학적으로 상수인 코사인의 `fixpoint` 를 계산합니다. 간단하게 `Math.cos` 를 `1.0` 에서부터 시작하여 반복적으로 호출하며, `eps` 로 명시된 정확도에 이르러 그 결과가 변하지 않으면 중단합니다. 코드의 결과는 아래처럼 더 전통적인 스타일로 작성한 것과 동일합니다.  

```kotlin
val eps = 1E-10 // "good enough", could be 10^-15

private fun findFixPoint(): Double {
    var x = 1.0
    while (true) {
        val y = Math.cos(x)
        if (Math.abs(x - y) < eps) return x
        x = Math.cos(x)
    }
}
```

`tailrec` 수정자를 가지려면, 함수는 반드시 자기 자신을 마지막 오퍼레이션으로 호출해야합니다. `try`/`catch`/`finally` 를 포함하여 재귀 호출 이후에 다른 문장이 더 있는 함수나 재정의할 수 있는 함수들은 끝단 재귀 형태를 사용할 수 없습니다.
현재 끝단 재귀함수는 JVM 과 Kotlin/Native 플랫폼에서만 지원됩니다.


#### 더 알아보기:

{*large-spacing}

- [인라인 함수](/docs/inline-functions.md)
- [확장 함수](/docs/extensions.md)
- [함수 매개변수를 가지는 함수와 람다](/docs/lambdas.md)
