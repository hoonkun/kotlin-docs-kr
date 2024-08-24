[고차 함수](/docs/lambdas.md)의 사용은 몇 가지 런타임 페널티를 부과합니다.
모든 함수는 결국 오브젝트이며, 함수의 몸체에서 접근할 수 있는 변수들의 스코프인 클로저를 캡쳐합니다.
메모리 할당(함수의 오브젝트와 클래스들 모두)이나 가상 호출은 런타임의 오버헤드를 야기합니다.

하지만 이런 종류의 오버헤드는, 람다 표현을 인라인함으로써 제거할 수 있습니다.
아래에 제시된 예시가 이러한 상황의 좋은 예시입니다. `lock()` 함수는 쉽게 호출 측에 인라인될 수 있습니다.
아래의 예제를 살펴볼까요:

```kotlin
lock(l) { foo() }
```

람다 함수의 오브젝트를 만들어 인수로 전달하고 호출하는 대신, 컴파일러가 아래의 코드로 대치해도 됩니다:

```kotlin
l.lock()
try {
    foo()
} finally {
    l.unlock()
}
```

컴파일러가 이렇게 하도록 지시하려면, `lock()` 함수를  `inline` 수정자로 표기하면 됩니다:

```kotlin
inline fun <T> lock(lock: Lock, body: () -> T): T { ... }
```

`inline` 수정자는 모든 전달되는 람다와 그 함수 자체가 호출 측에 인라인되게 함으로써, 그 함수 자체와 전달하는 람다들 모두에 영향을 줍니다.

인라인하는 행위는 생성되는 코드의 크기를 늘릴 가능성이 있습니다. 
그러나, 합리적인 형태로 사용한다면 성능 측면에서 이익을 챙길 수 있습니다. 
특히, 매번 변할 가능성이 있는 객체를 참조{^[1]}하는 루프 내의 호출 측에서는 더더욱이요.

---
{&[1]} 원문: megamorphic. 인라인 캐싱과 관련된 용어로, 자세한 내용은 [이 위키백과](https://en.wikipedia.org/wiki/Inline_caching)에서 확인할 수 있습니다.


## noinline

인라인 함수로 전달되는 람다가 모두 인라인되기를 원하지는 않는다면, 몇몇 람다 파라미터를 `noinline` 으로 표기할 수 있습니다:

```kotlin
inline fun foo(inlined: () -> Unit, noinline notInlined: () -> Unit) { ... }
```

인라인 가능한 람다들은 반드시 인라인 함수나 그의 인라인 가능한 파라미터로 전달되었을 때만 호출될 수 있습니다.
그러나 `noinline` 람다들은, 다른 변수에 저장하거나 어딘가로 전달하는 등 어떠한 형태로든 사용할 수 있습니다.

> 만약 인라인 함수가 어떠한 인라인 가능한 람다 파라미터도 포함하지 않고 [구체화된 타입 파라미터](#구체화된-타입-파라미터) 조차도 가지지 않는다면,
> 컴파일러가 경고를 보고합니다. 왜냐하면 그런 형태의 인라인은 어떠한 이점도 없을 가능성이 매우 높기 때문입니다(반드시 인라인이 필요하다고 확신할 수 있다면 `@Suppress("NOTHING_TO_INLINE")`를 사용하여 경고를 막을 수 있습니다).

## 비지역적 리턴

Kotlin 에서, 일반적인 꼬리표가 없는 `return` 표현은 그와 가장 가까운 `fun` 으로 정의된 함수를 리턴하기 위해서만 사용할 수 있습니다.
람다에서 리턴하기 위해서는, [꼬리표](/docs/returns.md#꼬리표가-붙은-리턴)를 사용해야 합니다.
그냥 `return` 은 람다 안에서의 사용이 금지되며, 그 이유는 일반적인 람다는 함수 바깥으로 나갈 가능성이 있기 때문에 그것을 리턴할 수 없기 때문입니다:

```kotlin
fun foo() {
    ordinaryFunction {
        return // ERROR: cannot make `foo` return here
    }
}
```

그러나, 만약 함수가 인라인 가능하다면, 리턴문 조차도 인라인될 수 있습니다. 그러므로 아래와 같은 것이 가능합니다:

```kotlin
fun foo() {
    inlined {
        return // OK: the lambda is inlined
    }
}
```

이러한 람다 안에 있지만 그 바깥의 함수를 나가게 하는 리턴들을 **비지역적 리턴**이라고 합니다.
이러한 일들은 보통 인라인 함수를 사용하는 루프 안에서 발생합니다:

```kotlin
fun hasZeros(ints: List<Int>): Boolean {
    ints.forEach {
        if (it == 0) return true // returns from hasZeros
    }
    return false
}
```

단, 몇몇 인라인 함수들은 그들의 파라미터로 전달받은 람다를 인라인된 형태가 아닌 또다른 실행 컨텍스트에서 사용해야할 수도 있습니다.
예를 들면 로컬 오브젝트나 중첩된 함수 등에서요. 이러한 경우에서는, 비지역적 흐름제어가 허용되어서는 안됩니다.
이러한 문제를 해결하기 위해, 인라인되는 형태를 유지하면서 비지역적 흐름제어를 막으려면, 람다 파라미터에 `crossinline` 수정자를 사용합니다:

```kotlin
inline fun f(crossinline body: () -> Unit) {
    val f = object: Runnable {
        override fun run() = body()
    }
    // ...
}
```

> `break` 와 `continue` 는 아직 인라인된 람다에서 사용할 수 없습니다. 하지만 그들에 대한 지원도 계획하고 있습니다.

## 구체화된 타입 파라미터

몇몇 경우에서, 파라미터에 전달된 타입에 접근해야할 필요가 있을 수 있습니다:

```kotlin
fun <T> TreeNode.findParentOfType(clazz: Class<T>): T? {
    var p = parent
    while (p != null && !clazz.isInstance(p)) {
        p = p.parent
    }
    @Suppress("UNCHECKED_CAST")
    return p as T?
}
```

이 예제에서, 트리를 탐색하며 노드가 특정 타입인지 리플렉션을 통해 확인한 다음 그것을 리턴합니다.
문제는 없지만, 호출 측이 그다지 깔끔하지는 않습니다:

```kotlin
treeNode.findParentOfType(MyTreeNode::class.java)
```

더 나은 방안으로는 간단하게 타입만을 이 함수에 전달하는 방법일 것입니다. 즉, 아래처럼요:

```kotlin
treeNode.findParentOfType<MyTreeNode>()
```

이렇게 할 수 있게 하기 위해, 인라인 함수들은 **구체화된 타입 파라미터**들을 지원합니다.
즉, 아래처럼 할 수 있게요.

```kotlin
inline fun <reified T> TreeNode.findParentOfType(): T? {
    var p = parent
    while (p != null && p !is T) {
        p = p.parent
    }
    return p as T?
}
```

위의 코드는 타입 파라미터를 그 몸체 안에서 사용할 수 있게 하기 위해 `reified` 수정자로 표시하며, 거의 그것이 일반적인 클래스였을 때와 동일하게 동작합니다.
함수가 인라인되므로, 일반적인 `is` 나 `!is` 같은 연산이 가능하며 리플랙션이 필요하지 않습니다. 
더해서, 위에서 언급한 대로 호출 측에서는 `myTree.findParentOfType<MyTreeNodeType>()` 와 같이 사용할 수 있습니다.

대부분의 경우에서 리플렉션이 필요하지 않지만, 구체화된 타입 파라미터들에 대해서는 필요에 따라 리플렉션을 사용할 수도 있습니다:

```kotlin
inline fun <reified T> membersOf() = T::class.members

fun main(s: Array<String>) {
    println(membersOf<StringBuilder>().joinToString("\n"))
}
```

인라인으로 표기되지 않는 일반적인 함수들은 구체화된 파라미터들을 가질 수 없습니다.
또, 런타임에 표현되지 않는 타입들(구체화되지 않은 또다른 타입 파라미터들이나, `Nothing` 등의 가상 타입)은
구체화된 타입 파라미터의 인수로 사용될 수 없습니다.

## 인라인 프로퍼티

`inline` 수정자는 [기반 필드](/docs/properties.md#기반-필드)를 가지지 않는 프로퍼티들의 접근자에도 사용될 수 있습니다.
각각의 프로퍼티 접근자에 수정자를 붙힐 수 있습니다:

```kotlin
val foo: Foo
    inline get() = Foo()

var bar: Bar
    get() = ...
    inline set(v) { ... }
```

프로퍼티 자체에도 붙힐 수 있으며, 이렇게 하면 두 접근자 모두를 `inline` 으로 설정합니다:

```kotlin
inline var bar: Bar
    get() = ...
    set(v) { ... }
```

호출 측에서, 접근자들이 일반적인 인라인 함수들처럼 인라인됩니다.


## 공개된 인라인 API 들의 제한

어떤 인라인 함수가 `public` 이거나 `protected` 이지만 `private` 이나 `internal` 선언의 일부분이 아니면,
이러한 인라인 함수들은 [모듈](/docs/visibility-modifiers.md#모듈)의 공개 API 로 간주됩니다. 
이들은 다른 모듈에서 호출될 수 있으며 그들 각각의 호출 측에 인라인됩니다.

하지만 이는 바이너리의 호환성을 깨뜨릴 가능성을 내포하고 있습니다.
인라인 함수를 정의하는 모듈의 구현이 변경되었으나 호출측 모듈이 이 변경 이후에 다시 컴파일되지 않은 경우 등에서요.

**비공개** API 의 변경으로 인해 생기는 이러한 호환성 문제를 제거하기 위해, 공개된 인라인 함수들은 비공개 선언과 그들의 부분을 그들의 몸체에서 사용할 수 없습니다.

`internal` 선언은 `@PublishedApi`로 표기될 수 있으며, 이들은 공개된 인라인 함수에서 사용할 수 있습니다.
`internal` 인라인 함수가 `@PublishedApi`로 표기되면, 그의 몸체도 그것이 공개되었을 때처럼 확인됩니다.

---
{&^---}

이 문단에서 언급하는 '바이너리 호환성'은, 컴파일 시점이 다르다면 언제든지 발생할 수 있는 문제입니다.  
이런 상황에서 '비공개' API 만을 제한하는 이유는, Kotlin 의 디자인 철학 상 '공개' API는 컴파일 시점이 다르더라도 안정적으로 동작할 것이라고 보장해야 하는 API 이지만 '비공개' API 는 그렇지 않기 때문입니다.

즉, `private` 수정자를 가지는 모든 선언은 '비공개' API 이고, `internal` 이면 기본적으로 '비공개' API 이지만 `@PublishedApi` 어노테이션을 붙히면 '공개' API 가 된다는 내용을 시사하고 있습니다.

{&$---}
