때때로 오브젝트를 **분해하여** 몇 개의 변수로 선언하면 편리할 때가 있습니다. 예를 들어 아래와 같이요.

```kotlin
val (name, age) = person
```

이 문법은 **분해형 정의**라고 합니다. 분해형 정의는 여러 변수를 한 번에 만들며, 위의 예제에서 `name` 과 `age` 변수를 만들었고 각각을 독립적으로 사용할 수 있습니다:

```kotlin
println(name)
println(age)
```

분해형 정의는 아래처럼 컴파일됩니다:

```kotlin
val name = person.component1()
val age = person.component2()
```

`component1()` 과 `component2()` 는 Kotlin 에서 널리 사용되는 **개념에 대한 규약**입니다(`+` 나 `*`, `for` 반복 같은 예시를 생각해보세요). 
어떤 것이던 컴포넌트 함수의 갯수만큼 분해형 정의에 사용할 수 있고, 즉 위의 예제에서 `age`의 오른쪽에 더 많은 값들을 추가할 수 있습니다.
이 경우에서 오른쪽에 오는 것들은 `component3()` 과 `component4()` 등이 되겠지요.

> `componentN()` 함수는 `operator` 수정자로 표시되어야 분해형 정의에서 사용할 수 있습니다.

`for` 반복에서도 분해형 정의가 동작합니다:

```kotlin
for ((a, b) in collection) { ... }
```

`a` 와 `b` 변수에는 컬렉션의 각 요소 하나하나에서 `component1()` 과 `component2()` 의 결과가 할당됩니다.

## 예제: 함수로부터 두 개의 값을 리턴하기

하나의 함수로부터 두 개의 값을 리턴해야한다고 생각해봅시다 - 예를 들어, 결과 오브젝트와 그의 상태를 같이 리턴해야한다고 가정해볼게요.
Kotlin 에서 이를 깔끔하게 수행하는 방법은 [데이터 클래스](/docs/data-classes.md)를 선언하고 그의 인스턴스를 리턴하는 것입니다:

```kotlin
data class Result(val result: Int, val status: Status)
fun function(...): Result {
    // computations

    return Result(result, status)
}

// Now, to use this function:
val (result, status) = function(...)
```

데이터 클래스들은 `componentN()` 함수들을 자동으로 정의하여 추가하므로, 분해형 정의가 동작합니다.

> 표준 클래스인 `Pair` 를 `function()` 함수의 리턴으로 사용하여 `Pair<Int, Status>` 를 돌려주어도 동일하게 동작하지만, 
> 명확하게 이름이 부여된 데이터 클래스를 사용하는 것이 더 나을 때가 많습니다.

## 예제: 분해형 정의와 맵

맵을 순회하기 위한 가장 멋진 방법은 이겁니다:

```kotlin
for ((key, value) in map) {
   // do something with the key and the value
}
```

이렇게 동작하게 하려면, 아래와 같은 사항을 따라야합니다.

- `map`이 `iterator()` 함수를 제공하여 어떤 값들의 순차를 표현해야 합니다.
- `map`을 구성하는 요소 각각이 `component1()` 와 `component2()` 를 제공해야합니다.

실제로도, 표준 라이브러리는 이러한 확장 함수들을 포함합니다:

```kotlin
operator fun <K, V> Map<K, V>.iterator(): Iterator<Map.Entry<K, V>> = entrySet().iterator()
operator fun <K, V> Map.Entry<K, V>.component1() = getKey()
operator fun <K, V> Map.Entry<K, V>.component2() = getValue()
```

## 사용하지 않는 변수에 대해 언더바 사용하기

분해형 정의에서 사용하지 않는 변수가 있다면, 이름 대신 언더바를 사용할 수 있습니다:

```kotlin
val (_, status) = getResult()
```

이렇게 하면, 언더바로 표시된 컴포넌트들의 `componentN()` 함수는 호출되지 않습니다.

## 람다에서 분해하기

분해형 문법을 람다의 매개변수에도 사용할 수 있습니다. 만약 람다의 매개변수가 `Pair` 타입(이거나 `Map.Entry` 등의 적절한 `componentN()` 함수를 가진 타입)이면, 이들을 하나의 변수로 선언하는 대신 괄호로 감싸 여러 개의 새로운 매개변수들로 풀어 쓸 수 있습니다:

```kotlin
map.mapValues { entry -> "${entry.value}!" }
map.mapValues { (key, value) -> "$value!" }
```

두 개의 서로 다른 매개변수를 표기할 때와, 하나의 매개변수 내의 컴포넌트를 분해하는 문법의 차이를 기억하세요:

```kotlin
{ a -> ... } // 한 개의 매개변수
{ a, b -> ... } // 두 개의 매개변수
{ (a, b) -> ... } // 분해된 하나의 Pair 매개변수
{ (a, b), c -> ... } // 분해된 하나의 Pair 매개변수와 또다른 매개변수
```

분해된 매개변수에서 쓰이지 않는 값이 있으면, 그의 이름 대신 언더바를 쓰면 됩니다:

```kotlin
map.mapValues { (_, value) -> "$value!" }
```

분해하려는 매개변수에 타입을 지정할 수도 있지만, 분해된 컴포넌트 각각에 타입을 지정할 수도 있습니다:

```kotlin
map.mapValues { (_, value): Map.Entry<Int, String> -> "$value!" }

map.mapValues { (_, value: String) -> "$value!" }
```

{&?}
