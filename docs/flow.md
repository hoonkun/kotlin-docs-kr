# 비동기 Flow

Kotlin 의 Flow 는 ‘정지 함수는 비동기적으로 하나의 값을 리턴하지만, 여러 개의 비동기적으로 계산된 값들은 어떻게 리턴해야할까?’ 에서 시작합니다.

## 여러 개의 값들을 표현하기

여러 값들은 Kotlin 에서 [collections](https://kotlinlang.org/docs/reference/collections-overview.html) 를 통해 표현될 수 있습니다. 예를 들어, 세 개의 요소로 구성된 [List](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-list/) 를 반환하는 `simple` 함수가 있을 때 그 값들을 출력하기 위해 [forEach](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/for-each.html) 를 사용할 수 있습니다:

```kotlin
fun simple(): List<Int> = listOf(1, 2, 3)
 
fun main() {
    simple().forEach { value -> println(value) } 
}
```

이 코드는 아래와 같이 출력합니다:

```
1
2
3
```

### Sequence

한 요소의 계산에 CPU가 소모되는 작업을 한다면, [Sequence](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/) 를 사용하여 표현할 수도 있습니다:

```kotlin
fun simple(): Sequence<Int> = sequence { // sequence 빌더
    for (i in 1..3) {
        Thread.sleep(100) // 계산하는 척 합니다.
        yield(i) // 다음 값을 내보냅니다.
    }
}

fun main() {
    simple().forEach { value -> println(value) } 
}
```

이 코드는 동일한 숫자들을 출력하지만, 매 출력마다 100ms 를 기다립니다.

### 정지 함수들

그러나 이 계산 작업은 메인 스레드를 막습니다. 이 값들이 비동기 코드에서 계산된다면 `simple` 함수를 `suspend` 수정자로 표기할 수 있습니다. 그러면 그 작업을 스레드를 막지 않고 진행하여 리스트로 돌려줄 수 있습니다:

```kotlin
suspend fun simple(): List<Int> {
    delay(1000) // 여기에서 뭔가 비동기적인 작업을 하는 척 합니다.
    return listOf(1, 2, 3)
}

fun main() = runBlocking<Unit> {
    simple().forEach { value -> println(value) } 
}
```

이 코드는 1초 뒤에 같은 숫자들을 출력합니다.

### Flow

리턴 타입에 `List<Int>` 를 사용한다는 것은, 모든 요소들을 한 번에 전부 리턴해야함을 의미합니다. 
비동기적으로 계산되는 여러 값들을 표현할 때는, 동기적으로 계산되는 여러 값들에 `Sequence<Int>` 를 사용했던 것 처럼 `Flow<Int>` 를 사용할 수 있습니다:

```kotlin
fun simple(): Flow<Int> = flow { // flow builder
    for (i in 1..3) {
        delay(100) // 뭔가 유용한 일을 하는 척 합니다.
        emit(i) // 다음 값을 방출합니다.
    }
}

fun main() = runBlocking<Unit> {
    // 메인 스레드가 블락되었는지 확인하기 위해 아래의 코루틴을 시작합니다.
    launch {
        for (k in 1..3) {
            println("I'm not blocked $k")
            delay(100)
        }
    }
    // 플로우를 수집합니다.
    simple().collect { value -> println(value) } 
}
```

이 코드는 스레드를 막지 않고 매 숫자를 출력하기 전 100ms 를 기다립니다. 이것은 동일한 메인 스레드에서 동작하는, "I’m not blocked" 를 100ms 간격으로 출력하는 별도의 코루틴이 제대로 동작하는 것으로 증명됩니다.

```
I'm not blocked 1
1
I'm not blocked 2
2
I'm not blocked 3
3
```

그 이전에 있던 코드와 플로우를 사용한 예제의 차이점을 비교해보세요:

- [Flow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow/index.html) 타입의 빌더는 [flow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow.html) 입니다.
- `flow { ... }` 블럭 안의 코드는 정지할 수 있습니다.
- `simple` 함수는 더이상 `suspend` 수정자로 표기되지 않습니다.
- 값들은 [emit](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow-collector/emit.html) 함수를 통해 Flow에서 **방출**됩니다.
- 값들은 [collect](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect.html) 함수를 통해 Flow에서 **수집**됩니다.

## Flow는 차갑습니다

플로우는 시퀀스와 비슷하게 **차갑습니다** — [flow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow.html) 빌더 안의 코드는 플로우가 수집될때까지 실행되지 않습니다. 아래 예제로 이것을 명확히 알 수 있습니다:

```kotlin
fun simple(): Flow<Int> = flow { 
    println("Flow started")
    for (i in 1..3) {
        delay(100)
        emit(i)
    }
}

fun main() = runBlocking<Unit> {
    println("Calling simple function...")
    val flow = simple()
    println("Calling collect...")
    flow.collect { value -> println(value) } 
    println("Calling collect again...")
    flow.collect { value -> println(value) } 
}
```

위 코드는 아래처럼 출력합니다:

```
Calling simple function...
Calling collect...
Flow started
1
2
3
Calling collect again...
Flow started
1
2
3
```

이것이 `simple` 함수가 `suspend` 수정자로 표시되지 않는 이유입니다. `simple` 함수는 아무것도 기다리지 않고 곧바로 리턴합니다. 플로우는 매번 수집될 때마다 새롭게 다시 시작되며, 그것이 "Flow started" 메시지가 매번 `collect` 를 다시 호출할 때마다 출력되는 이유입니다.

## Flow 취소의 기초

플로우는 코루틴의 협조적인 취소 규칙을 준수합니다. 플로우의 수집은 그 플로우가 취소될 수 있는 정지 함수(예를 들면 [delay](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html) 같은)로 정지되었을 때 취소될 수 있습니다. 아래의 예제는 플로우가 [withTimeoutOrNull](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-timeout-or-null.html) 안에서 어떻게 취소되고 그 동작을 중지하는지 보여줍니다:

```kotlin
fun simple(): Flow<Int> = flow { 
    for (i in 1..3) {
        delay(100)          
        println("Emitting $i")
        emit(i)
    }
}

fun main() = runBlocking<Unit> {
    withTimeoutOrNull(250) { // 250ms 이후에 타임아웃됩니다. 
        simple().collect { value -> println(value) } 
    }
    println("Done")
}
```

아래의 출력에서 보이듯 `simple` 함수로부터 돌아온 플로우에서 두 값만이 방출되었습니다:

```
Emitting 1
1
Emitting 2
2
Done
```

더 자세한 사항은아래의 플로우에서의 취소 추적 영역을 확인해보세요.

## Flow 빌더

이전 예제에서 사용된 `flow { ... }` 빌더는 여러 빌더 중 가장 기반이 되는 것입니다. 플로우를 정의할 수 있는 다른 여러 빌더 들이 있습니다:

- [flowOf](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow-of.html) 빌더는 고정된 집합의 값들을 방출하는 플로우를 정의합니다.
- 몇몇 컬렉션과 시퀀스들은 `.asFlow()` 확장 함수를 통해 플로우로 변환될 수 있습니다.

예를 들어, 플로우로부터 1 에서 3을 출력하는 스니펫은 아래처럼 다시 작성할 수도 있습니다:

```kotlin
// Convert an integer range to a flow
(1..3).asFlow().collect { value -> println(value) }
```

## 중간 Flow 연산

플로우는 다른 컬렉션이나 시퀀스들과 동일한 방식으로 중간 연산자를 통해 변환될 수 있습니다. 중간 연산자들은 상류의 플로우에 적용되어 하류의 플로우를 리턴합니다. 플로우가 그렇듯 이 연산자들도 차갑습니다. 이러한 연산 함수들은 정지하지 않으며 빠르게 변환된 새 Flow 를 리턴합니다.

기본 연산자들은 [map](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/map.html) 이나 [filter](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/filter.html) 같이 익숙한 이름을 가지고 있습니다. 시퀀스의 확장 함수와의 중요한 차이점은 해당 블럭 안의 코드는 정지 함수를 호출할 수 있다는 점입니다.

예를 들어, 들어오는 요청에 대한 플로우는 [map](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/map.html) 함수를 통해 실제 그 블럭 안에서 수행되는 것이 긴 정지 함수임에도 요청에 대한 결과로 매핑될 수 있습니다:

```kotlin
suspend fun performRequest(request: Int): String {
    delay(1000) // 긴 비동기 작업을 흉내냅니다.
    return "response $request"
}

fun main() = runBlocking<Unit> {
    (1..3).asFlow() // a flow of requests
        .map { request -> performRequest(request) }
        .collect { response -> println(response) }
}
```

위의 코드는 아래처럼 한 줄 한 줄 사이에 1초의 간격을 두고 총 세 줄을 출력합니다:

```
response 1
response 2
response 3
```

### 변환 연산자

변환 연산자 사이에서, 가장 범용적이게 쓰이는 하나는 [transform](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/transform.html) 입니다. 이는 간단한 변환인 [map](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/map.html) 이나 [filter](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/filter.html) 처럼 사용할 수도 있으며, 더 복잡한 변환도 구현할 수 있습니다. [transform](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/transform.html) 연산자를 사용해, 아무 값들을 아무 떄나 [emit](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow-collector/emit.html) 할 수 있습니다.

예를 들어, [transform](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/transform.html) 를 사용해 긴 비동기 요청을 처리하기 전에 단순한 문자열을 방출하고, 응답을 뒤따르게 할 수 있습니다:

```kotlin
(1..3).asFlow() // a flow of requests
    .transform { request ->
        emit("Making request $request") 
        emit(performRequest(request)) 
    }
    .collect { response -> println(response) }
```

위의 코드는 아래처럼 출력합니다:

```
Making request 1
response 1
Making request 2
response 2
Making request 3
response 3
```

### 갯수 제한 연산자

[take](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/take.html) 등과 같은 갯수 제한 중간연산자는 지정한 갯수에 다다르면 플로우의 실행을 취소합니다. 코루틴의 취소가 예외에 의해 진행되므로, 리소스 관리 함수들도 반드시 적절히(`try { … } finally { … }` 등으로) 핸들링되어야 합니다:

```kotlin
fun numbers(): Flow<Int> = flow {
    try {                          
        emit(1)
        emit(2) 
        println("This line will not execute")
        emit(3)    
    } finally {
        println("Finally in numbers")
    }
}

fun main() = runBlocking<Unit> {
    numbers() 
        .take(2) // take only the first two
        .collect { value -> println(value) }
}            
```

이 예제의 출력은 `numbers()` 함수 안의 `flow { ... }` 블럭 실행이 두 번째 값의 방출 이후 취소되었음을 확실히 보여줍니다:

```
1
2
Finally in numbers
```

## 종단 Flow 연산자

플로우의 종단 함수들은 그의 수집을 시작하는 **정지 함수**입니다. [collect](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect.html) 함수가 가장 기반이 되는 것이고, 작업을 더 쉽게 만들어주는 다른 여러 종단 연산자들이 있습니다:

- [toList](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/to-list.html) 나 [toSet](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/to-set.html) 등과 같은 Collection 으로의 변환 함수
- Flow 의 첫 값을 가져오는 [first](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/first.html) 나 Flow가 하나의 값만을 방출하도록 보장하는 [single](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/single.html)
- [reduce](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/reduce.html) 나 [fold](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/fold.html) 등과 같은 축약 함수

예를 들어:

```kotlin
val sum = (1..5).asFlow()
    .map { it * it } // 1 에서 5 까지의 수를 제곱합니다.                           
    .reduce { a, b -> a + b } // 그들을 모두 더합니다. (종단 연산자)
println(sum)
```

위의 코드는 하나의 수를 출력합니다:

```
55
```

## Flow는 순차적입니다

각 플로우의 수집은 여러 플로우에 대해 작동하는 특별한 연산자가 사용되지 않는 한 순차적으로 동작합니다. 수집 동작은 종단 연산자를 호출하는 그 코루틴에서 진행되며, 기본적으로 새 코루틴을 만들지 않습니다. 각 방출된 값들은 상류에서 하류로 모든 중간 연산자를 거쳐 종단 연산자로 전달됩니다.

짝수만 필터하고 그것들을 문자열로 변환하는 아래의 예제를 확인해보세요:

```kotlin
(1..5).asFlow()
    .filter {
        println("Filter $it")
        it % 2 == 0              
    }              
    .map { 
        println("Map $it")
        "string $it"
    }.collect { 
        println("Collect $it")
    }  
```

위의 코드는 아래처럼 출력합니다:

```
Filter 1
Filter 2
Map 2
Collect string 2
Filter 3
Filter 4
Map 4
Collect string 4
Filter 5
```

## Flow 컨텍스트

플로우의 수집은 그것을 호출하는 코루틴의 컨텍스트에서 발생합니다. 예를 들어, `simple` Flow 가 있을 때, 아래의 코드에서 수집 동작은 `simple` 함수의 구현 상세와 무관하게 이 코드의 작성자가 정한 컨텍스트에서 발생합니다.

```kotlin
withContext(context) {
    simple().collect { value ->
        println(value) // 특정 컨텍스트에서 실행됩니다.
    }
}
```

이러한 플로우의 특징을 **컨텍스트 보존**이라고 부릅니다.

그러므로, 기본적으로, `flow { ... }` 빌더 안의 코드는 수집가가 제공한 컨텍스트에서 실행됩니다. 예를 들어, 호출되었을 때 자신의 스레드를 출력하고 3 개의 숫자를 방출하는 `simple` 함수를 생각해보세요:

```kotlin
fun simple(): Flow<Int> = flow {
    log("Started simple flow")
    for (i in 1..3) {
        emit(i)
    }
}  

fun main() = runBlocking<Unit> {
    simple().collect { value -> log("Collected $value") } 
}   
```

이 코드는 아래처럼 출력합니다:

```
[main @coroutine#1] Started simple flow
[main @coroutine#1] Collected 1
[main @coroutine#1] Collected 2
[main @coroutine#1] Collected 3
```

`simple().collect` 도 메인 스레드에서 호출되었고, `simple` 함수의 플로우 블럭도 메인 스레드에서 호출되었습니다. 이것은 빠르게 실행되거나 실행 컨텍스트를 상관하지 않고 호출측을 막지 않는, 비동기적인 코드의 완벽한 예시입니다.

### withContext 을 사용할 때 빠지기 쉬운 일반적인 함정

CPU를 사용하며 길게 실행되는 코드는 일반적으로 [Dispatchers.Default](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 을 사용한 컨텍스트에서 실행되어야 하고, UI에 반영하는 코드는 주로 [Dispatchers.Main](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-main.html) 에서 실행됩니다.
[withContext](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-context.html) 는 현재 사용 중인 코루틴의 컨텍스트를 변경하는데 사용하지만, `flow { ... }` 빌더 블럭 안의 코드는 컨텍스트 유지 특성을 따라야 하며 다른 컨텍스트에서 [emit](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow-collector/emit.html) 하는 것이 허용되지 않습니다.

아래의 코드를 실행하려고 해보세요:

```kotlin
fun simple(): Flow<Int> = flow {
    // CPU 를 소모하는 작업으로 인한 컨텍스트 스위칭의 잘못된 방식
    kotlinx.coroutines.withContext(Dispatchers.Default) {
        for (i in 1..3) {
            Thread.sleep(100) // CPU 소모적인 작업을 하는 흉내를 냅니다.
            emit(i) // 다음 값을 방출합니다.
        }
    }
}

fun main() = runBlocking<Unit> {
    simple().collect { value -> println(value) } 
}            
```

위의 코드는 아래와 같은 예외를 발생시킵니다:

```kotlin
Exception in thread "main" java.lang.IllegalStateException: Flow invariant is violated:
        Flow was collected in [CoroutineId(1), "coroutine#1":BlockingCoroutine{Active}@5511c7f8, BlockingEventLoop@2eac3323],
        but emission happened in [CoroutineId(1), "coroutine#1":DispatchedCoroutine{Active}@2dae0000, Dispatchers.Default].
        Please refer to 'flow' documentation or use 'flowOn' instead
    at ...
```

### flowOn 연산자

예외 메시지를 보면, 플로우의 방출에서 컨텍스트를 변경하려면 [flowOn](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow-on.html) 연산자를 사용해야한다고 인용하고 있습니다. 
플로우에서 컨텍스트를 전환하는 올바른 방법은 아래의 예제에서 보여주고 있으며, 어떤 스레드에서 동작하고 있는지도 추가적으로 출력하여 이 방법이 어떻게 적용되는지도 보여줍니다:

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        Thread.sleep(100) // CPU 소모적인 작업을 하는 척 합니다.
        log("Emitting $i")
        emit(i) // 다음 값을 방출합니다.
    }
}.flowOn(Dispatchers.Default) // CPU 를 소모하는 작업으로 인한 컨텍스트 스위칭의 올바른 방식

fun main() = runBlocking<Unit> {
    simple().collect { value ->
        log("Collected $value") 
    } 
} 
```

`flow { ... }` 는 백그라운드 스레드에서 동작하지만, 수집은 메인 스레드에서 동작하는 것을 확인할 수 있습니다.

한 가지 더 이 예제에서 확인해야 하는 점은 [flowOn](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow-on.html) 연산자가 플로우의 기본적인 순차 실행 생태계를 변경했다는 점입니다. 
이제 플로우의 수집이 하나의 코루틴("coroutine#1")에서 일어나고 방출이 또다른 코루틴("coroutine#2")에서 일어납니다.
[flowOn](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow-on.html) 연산자는 컨텍스트를 변경해야할 때 상류 플로우에 대한 새로운 코루틴을 만듭니다.

## 버퍼링

서로 다른 플로우의 부분들을 서로 다른 코루틴에서 실행하는 것은, 긴 비동기 작업을 필요로하는 플로우의 각 항목을 수집하기 위해서는 많은 시간이 걸린다는 견해에 유용할 수 있습니다. 
예를 들면 요소 하나의 방출에 100ms 가 걸리고, 그것 하나를 수집하는데도 300ms 라는 긴 시간이 걸린다고 생각해봅시다. 이런 상황에서 세 개의 요소를 가진 플로우를 수집할 때 얼마나 걸리는지 봅시다:

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100) // 비동기 적으로 100ms를 기다립니다.
        emit(i) // 다음 값을 방출합니다.
    }
}

fun main() = runBlocking<Unit> { 
    val time = measureTimeMillis {
        simple().collect { value -> 
            delay(300) // 300 ms 동안 처리하는 척을 합니다.
            println(value) 
        } 
    }   
    println("Collected in $time ms")
}
```

위의 코드는 아래와 같은 결과를 출력하는데, 총 수집 시간이 1200ms 정도 걸립니다(하나의 값에 400ms 씩 3개의 값):

```
1
2
3
Collected in 1220 ms
```

이럴 때 우리는 [buffer](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/buffer.html) 연산자를 사용하여 기존 순차적이던 `simple` 플로우의 방출을 동시에 진행할 수 있습니다:

```kotlin
val time = measureTimeMillis {
    simple()
        .buffer() // 방출 값을 버퍼링하고, 기다리지 않습니다.
        .collect { value -> 
            delay(300) // 300 ms 동안 처리하는 척을 합니다.
            println(value) 
        } 
}
```

같은 값들을 더 빠르게 산출합니다. 플로우의 효율적인 처리 파이프라인을 만들었기 떄문에, 플로우에서 첫 값이 방출될 때까지의 100ms와 나머지 각 요소가 완전히 수집되기까지 각 300ms 만을 기다려 총 약 1000ms 가 소요되었습니다:

```
1
2
3
Collected in 1071 ms
```

> 코루틴 디스패쳐를 변경해야하는 상황에서는 [flowOn](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow-on.html) 연산자도 동일한 버퍼링 메커니즘을 사용합니다. 하지만 이 예제에서는 실행 컨텍스트를 바꾸는 대신 명시적으로 버퍼링을 요청했습니다.

### Conflation

플로우가 부분적인 결과 혹은 작업 상태 업데이트만을 표현한다면, 각 값들을 모두 처리하기보다는 대신 가장 최근의 값을 처리할 수도 있습니다. 
이 예제에서, [conflate](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/conflate.html) 연산자는 수집기의 수집 속도가 방출되는 값을 처리하기에 너무 느릴 때 중간 값들을 일부 건너뛰게 하기 위해 사용되었습니다.

```kotlin
val time = measureTimeMillis {
    simple()
        .conflate() // 방출 값들을 융합하고, 각각 처리하지 않습니다.
        .collect { value -> 
            delay(300) // 300 ms 동안 처리하는 척을 합니다.
            println(value) 
        } 
}   
println("Collected in $time ms")
```

첫 값은 여전히 처리가 되었고, 곧바로 세 번째 값이 처리되었습니다. 즉, 두 번째 값은 융합되어 가장 최근의 값(세 번째 값)만이 수집기에 전달되었습니다.

```
1
3
Collected in 758 ms
```

### 가장 최근 값만을 처리하기

Conflation 은 방출기와 수집기의 속도가 모두 느릴 때 처리 속도를 올리기 위해 유용합니다. 
이는 방출되는 값을 버리기 때문이며, 또다른 방안으로 매 방출마다 기존 수집기의 처리를 취소하고 다시 시작하는 방법도 있습니다. 
몇몇 `xxxLatest` 라는 이름을 가진 연산자들은 `xxx` 라는 이름의 연산자들과 동일한 역할을 하지만, 새 값이 방출되면 그 블럭 내부의 코드를 취소합니다. 이전 예제에서 [conflate](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/conflate.html) 를 [collectLatest](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect-latest.html) 로 변경하고 다시 시도해보죠.

```kotlin
val time = measureTimeMillis {
    simple()
        .collectLatest { value -> // 이전 값에 대한 작업을 취소하고 가장 최근 값으로 다시 시작합니다.
            println("Collecting $value") 
            delay(300) // 300 ms 동안 처리하는 척을 합니다.
            println("Done $value") 
        } 
}   
println("Collected in $time ms")
```

각 [collectLatest](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect-latest.html) 에 300ms가 소요되지만 각 값의 방출은 100ms 가 걸리기 떄문에 매 수집의 시작은 항상 이루어지지만 수집의 완료는 마지막 값에만 이루어지는 것을 확인할 수 있습니다.

```
Collecting 1
Collecting 2
Collecting 3
Done 3
Collected in 741 ms
```

## 여러 Flow 의 구성

여러 플로우를 구성하는 방법에는 많은 것들이 있습니다.

### Zip

Kotlin 표준 라이브러리의  [Sequence.zip](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/zip.html) 처럼, 플로우에도 도 두 플로우의 각 값을 조합하는 [zip](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/zip.html) 이라는 연산자가 있습니다:

```kotlin
val nums = (1..3).asFlow() // numbers 1..3
val strs = flowOf("one", "two", "three") // strings 
nums.zip(strs) { a, b -> "$a -> $b" } // compose a single string
    .collect { println(it) } // collect and print
```

이 코드는 아래와 같이 출력합니다:

```
1 -> one
2 -> two
3 -> three
```

### Combine

만약 플로우가 동작이나 변수의 가장 최신의 값만을 나타낸다면, 해당 플로우의 가장 최신의 값에 맞게 상류 플로우가 값을 방출할 때마다 계산을 다시할 필요가 있을 수도 있습니다. 그럴 때 쓰는 연산자를 [combine](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/combine.html) 이라고 합니다.

예를 들어, 이전 예제에서 Int 의 Flow가 300ms 마다 업데이트되고, String 의 Flow가 400ms 마다 업데이트된다고 가정했을 때 [zip](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/zip.html) 연산자는 매 출력에 400ms 를 소요하며 이전과 동일한 결과를 출력합니다.

> 이 예제에서 [onEach](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-each.html) 라는 중간 연산자를 사용해 Flow 의 예제 값들의 방출 사이에 딜레이를 주면서 더 선언적이고 짧게 작성했습니다.

```kotlin
val nums = (1..3).asFlow().onEach { delay(300) } // 1..3 을 매 300 ms 마다 방출합니다.
val strs = flowOf("one", "two", "three").onEach { delay(400) } // 문자열을 매 400 ms 마다 방출합니다.
val startTime = System.currentTimeMillis() // 시작 시간을 기억합니다.
nums.zip(strs) { a, b -> "$a -> $b" } // "zip" 을 사용하여 하나의 문자열을 구성합니다.
    .collect { value -> // 수집 후 출력합니다.
        println("$value at ${System.currentTimeMillis() - startTime} ms from start") 
    } 
```

그러나, [zip](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/zip.html) 대신 [combine](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/combine.html) 을 사용한다면:

```kotlin
val nums = (1..3).asFlow().onEach { delay(300) } // 1..3 을 매 300 ms 마다 방출합니다.
val strs = flowOf("one", "two", "three").onEach { delay(400) } // 문자열을 매 400 ms 마다 방출합니다.          
val startTime = System.currentTimeMillis() // 시작 시간을 기억합니다. 
nums.combine(strs) { a, b -> "$a -> $b" } // "combine" 을 사용하여 하나의 문자열을 구성합니다.
    .collect { value -> // 수집 후 출력합니다. 
        println("$value at ${System.currentTimeMillis() - startTime} ms from start") 
    } 
```

조금 다른 결과가 산출됩니다. num 플로우와 strs 플로우 각각이 값을 방출할 때마다 한 줄이 출력됩니다.

```
1 -> one at 452 ms from start
2 -> one at 651 ms from start
2 -> two at 854 ms from start
3 -> two at 952 ms from start
3 -> three at 1256 ms from start
```

## Flow 의 평탄화

플로우는 비동기적으로 수신되는 값들을 표현하므로, 각 값 하나하나가 또다른 여러 값들에 대한 요청을 트리거하는 상황과 마주하기 쉽습니다. 
예를 들어, 두 개의 문자열을 500ms 의 간격을 두고 방출하는 아래와 같은 함수가 있습니다:

```kotlin
fun requestFlow(i: Int): Flow<String> = flow {
    emit("$i: First")
    delay(500) // 500 ms 대기합니다.
    emit("$i: Second")
}
```

이제 3 개의 숫자를 가지는 Flow 를 만들고 그것을 `requestFlow` 로 매핑해보겠습니다:

```kotlin
(1..3).asFlow().map { requestFlow(it) }
```

그러면 우리는 이후 처리를 위해 **평탄화**될 필요가 있는 플로우들의 플로우(`Flow<Flow<String>>`) 를 얻게됩니다. 컬렉션과 시퀀스에는 이 작업을 위한 [flatten](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/flatten.html) 과 [flatMap](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/flat-map.html) 라는 연산자가 있지만, 플로우는 그의 비동기적인 생태계로 인해 여러 **모드**를 가진 평탄화 연산자가 존재합니다:

### flatMapConcat

플로우들의 플로우를 이어붙히는 동작은 [flatMapConcat](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-concat.html) 와 [flattenConcat](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flatten-concat.html) 가 재공합니다. 시퀀스의 그것과 가장 비슷한 연산자들이며, 이후 값의 수집이 시작되기 전 안쪽 플로우의 수집 작업이 완전히 완료될때까지 기다립니다.

```kotlin
val startTime = System.currentTimeMillis() // 시작 시간을 기억합니다. 
(1..3).asFlow().onEach { delay(100) } // 매 수를 100 ms 간격으로 방출합니다. 
    .flatMapConcat { requestFlow(it) }                                                                           
    .collect { value -> // 수집 후 출력합니다.
        println("$value at ${System.currentTimeMillis() - startTime} ms from start") 
    } 
```

순차적인 생태계로써의 [flatMapConcat](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-concat.html) 의 동작이 아래 출력에 명확하게 제시되어 있습니다:

```
1: First at 121 ms from start
1: Second at 622 ms from start
2: First at 727 ms from start
2: Second at 1227 ms from start
3: First at 1328 ms from start
3: Second at 1829 ms from start
```

### flatMapMerge

또다른 평탄화 연산자는 플로우로 들어오는 모든 값들을 하나하나 수집하고, 하나의 플로우로 병합하여 가능한 한 빠르게 값이 방출되도록 합니다. 이 작업은 [flatMapMerge](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-merge.html) 와 [flattenMerge](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flatten-merge.html) 에 의해 이루어지며, 선택적으로 한 번에 수집될 값들의 수를 제한할 수 있는 `concurrency` 라는 인수를 받습니다(기본값으로는 [DEFAULT_CONCURRENCY](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-d-e-f-a-u-l-t_-c-o-n-c-u-r-r-e-n-c-y.html) 를 가집니다):

```kotlin
val startTime = System.currentTimeMillis() // 시작 시간을 기억합니다. 
(1..3).asFlow().onEach { delay(100) } // 매 수를 100 ms 간격으로 방출합니다. 
    .flatMapMerge { requestFlow(it) }                                                                           
    .collect { value -> // 수집 후 출력합니다. 
        println("$value at ${System.currentTimeMillis() - startTime} ms from start") 
    } 
```

동시적인 생태계로써의 [flatMapMerge](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-merge.html) 또한 명확합니다.

```
1: First at 136 ms from start
2: First at 231 ms from start
3: First at 333 ms from start
1: Second at 639 ms from start
2: Second at 732 ms from start
3: Second at 833 ms from start flatMapMerge 
```

> [flatMapMerge](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-merge.html) 함수가 그의 블럭(이 예제에서는 `{ requestFlow(it) }`)을 순차적으로 호출하지만, 그의 결과에 대한 수집은 동시적으로 이루어진다는 사실을 기억하세요. 이는 순차적으로 `map { requestFlow(it) }` 을 먼저 수행하고 그 결과에 [flattenMerge](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flatten-merge.html) 를 수행하는 것과 동일합니다.

### flatMapLatest

[collectLatest](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect-latest.html) 와 비슷하게, 새로운 플로우가 방출되는 즉시 기존 수집을 취소하고 다시 시작하는 모드도 존재합니다. 이는 [flatMapLatest](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-latest.html) 를 통해 구현합니다:

```kotlin
val startTime = System.currentTimeMillis() // 시작 시간을 기억합니다. 
(1..3).asFlow().onEach { delay(100) } // 매 수를 100 ms 간격으로 방출합니다. 
    .flatMapLatest { requestFlow(it) }                                                                           
    .collect { value -> // 수집 후 출력합니다. 
        println("$value at ${System.currentTimeMillis() - startTime} ms from start") 
    } 
```

아래의 출력이, [flatMapLatest](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-latest.html) 가 어떻게 동작하는지를 잘 보여주고 있습니다:

```
1: First at 142 ms from start
2: First at 322 ms from start
3: First at 425 ms from start
3: Second at 931 ms from start
```

> [flatMapLatest](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flat-map-latest.html) 는 새 값이 수신되었을 때 그의 블럭 안에 있는 모든 코드(`{ requestFlow(it) }`)를 취소시킨다는 것을 기억하세요. 이 예제에서는 `requestFlow` 가 정지하지 않고 취소될 수 없는 일반적인 함수이기 때문에 특별한 차이점을 만들어내지 않지만, `delay` 등을 `requestFlow` 내에서 사용한다면 다른 결과를 볼 수 있을 것입니다.

## Flow에서 발생하는 예외

플로우의 수집은 방출자나 연산자 안쪽의 코드에서 예외를 발생시키면 예외와 함께 완료될 수 있습니다.
아래에서 그 몇 가지 핸들링에 대해 설명합니다.

### 수집기의 try 와 catch

수집기는 예외를 핸들링하기 위해 Kotlin 의 [`try/catch`](https://kotlinlang.org/docs/reference/exceptions.html) 문을 사용할 수 있습니다:

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        println("Emitting $i")
        emit(i) // 다음 값을 방출합니다.
    }
}

fun main() = runBlocking<Unit> {
    try {
        simple().collect { value ->         
            println(value)
            check(value <= 1) { "Collected $value" }
        }
    } catch (e: Throwable) {
        println("Caught $e")
    } 
}   
```

위의 코드는 [collect](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect.html) 종단 연산자에서 발생하는 예외를 성공적으로 잡으며, 그 뒤로 아무런 값들도 방출되거나 수집되지 않습니다.

```
Emitting 1
1
Emitting 2
2
Caught java.lang.IllegalStateException: Collected 2
```

### 모든게 잡혔습니다.

이전의 예제는 사실 방출자나 중간연산자, 종단연산자 모두에서 발생하는 예외를 한 번에 다 잡았습니다. 예를 들어, 이번에는 방출된 값들이 문자열로 매핑되며 거기에서 예외를 던진다고 해봅시다:

```kotlin
fun simple(): Flow<String> = 
    flow {
        for (i in 1..3) {
            println("Emitting $i")
            emit(i) // 다음 값을 방출합니다.
        }
    }
    .map { value ->
        check(value <= 1) { "Crashed on $value" }                 
        "string $value"
    }

fun main() = runBlocking<Unit> {
    try {
        simple().collect { value -> println(value) }
    } catch (e: Throwable) {
        println("Caught $e")
    } 
}    
```

여전히 동일하게 예외가 발생하고 수집이 중단됩니다:

```
Emitting 1
string 1
Emitting 2
Caught java.lang.IllegalStateException: Crashed on 2
```

## 예외의 투명성

어떻게 방출자가 그에서 발생하는 예외 처리를 캡슐화 할 수 있을까요?

플로우는 반드시 예외에 대해 투명해야하고, `try/catch` 블럭 안에서 값을 [emit](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow-collector/emit.html) 하는 것은 그를 어기는 행위입니다. 
이 규칙은 이전 예제가 보여주듯 발생하는 예외가 항상 수집하는 측의 `try/catch` 를 통해 핸들링될 수 있음을 보장합니다.

이 때, 방출자는 [catch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/catch.html) 라는 연산자를 사용하여 이 예외 투명성을 보장하면서 그에 대한 처리를 캡슐화할 수 있습니다. `catch` 연산자의 람다는 에러를 분석하고 서로 다른 방식으로 반응할 수 있습니다.

- 발생한 예외를 `throw` 를 통해 다시 던질 수 있습니다.
- `catch` 의 람다 안에서 예외를 받아 다른 형태의 [emit](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow-collector/emit.html) 을 발생시킬 수 있습니다.
- 발생한 예외를 무시하거나, 로깅하거나, 혹은 다른 기타 처리를 수행할 수도 있습니다.

예를 들어, 예외를 잡을 때 텍스트를 방출하도록 해보겠습니다.

```kotlin
simple()
    .catch { e -> emit("Caught $e") } // 예외 발생 시 다른 값을 방출합니다.
    .collect { value -> println(value) }
```

코드에 더이상 try/catch 블럭이 없음에도 동일한 출력을 합니다.

### 투명하게 예외 잡기

[catch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/catch.html) 중간 연산자는 그의 상류에서 발생한 예외에 대한 투명성을 준수합니다(그의 위에서 발생한 예외는 잡지만, 그 아래에서 발생하는 것들은 잡지 않습니다). 즉, `collect { ... }` 블럭 내에서 발생하는 예외는 그대로 던져지며 로직을 벗어납니다:

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        println("Emitting $i")
        emit(i)
    }
}

fun main() = runBlocking<Unit> {
    simple()
        .catch { e -> println("Caught $e") } // 하류의 예외를 잡지 않습니다.
        .collect { value ->
            check(value <= 1) { "Collected $value" }                 
            println(value) 
        }
}         
```

`catch` 중간 연산자가 있음에도 "Caught …" 메시지가 출력되지 않습니다.

```
Emitting 1
1
Emitting 2
Exception in thread "main" java.lang.IllegalStateException: Collected 2
	at ...
```

### 선언적으로 예외 잡기

[catch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/catch.html) 연산자가 선언적 생태계 안에서 모든 예외를 핸들링하게 하기 위해, [collect](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect.html) 의 람다를 `catch` 연산자 위쪽의 [onEach](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-each.html) 로 이동할 수 있습니다. 이런 형태의 플로우는 반드시 `collect()` 와 같이 인수를 전달하지 않고 호출해야합니다.

```kotlin
simple()
    .onEach { value ->
        check(value <= 1) { "Collected $value" }                 
        println(value) 
    }
    .catch { e -> println("Caught $e") }
    .collect()
```

이제는 `try/catch` 없이 모든 예외를 성공적으로 잡아 "Caught" 메시지가 출력됨을 확인할 수 있습니다.

```
Emitting 1
1
Emitting 2
Caught java.lang.IllegalStateException: Collected 2
```

## Flow 의 완료

어떠한 방식(정상적, 예외적)으로든 플로우의 수집이 완료되면, 어떠한 동작을 수행해야할 수 있습니다. 아마 이미 눈치채셨을 수 있지만, 명령적인 방법과 선언적인 방법 두 가지로 가능합니다.

### 명령적인 finally 블럭

`try`/`catch` 블럭에 더해, 수집기는 수집이 완료될 때 특정 액션을 취하기 위해 `finally` 블럭을 사용할 수 있습니다.

```kotlin
fun simple(): Flow<Int> = (1..3).asFlow()

fun main() = runBlocking<Unit> {
    try {
        simple().collect { value -> println(value) }
    } finally {
        println("Done")
    }
}     
```

이 코드는 `simple` 플로우로부터 온 세 개의 수를 출력한 뒤 "Done" 문자열을 출력합니다:

```
1
2
3
Done
```

### 선언적인 핸들링

선언적인 접근으로는, 플로우의 수집이 완전히 완료될 때 그의 람다를 호출하는 [onCompletion](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-completion.html) 라는 중간 연산자가 있습니다.

이전의 예제는 [onCompletion](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-completion.html) 를 사용하여 아래처럼 다시 작성하고 동일한 결과를 출력하게 할 수 있습니다:

```kotlin
simple()
    .onCompletion { println("Done") }
    .collect { value -> println(value) }
```

[onCompletion](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-completion.html) 의 중요한 이점은 수집이 정상적으로 종료되었는지, 아니면 그렇지 않은지를 판단할 수 있는 `Throwable?` 인수가 람다의 파라미터로 전달된다는 점입니다. 아래의 예제에서 `simple` Flow 는 숫자 1을 방출한 후 예외를 발생시킵니다:

```kotlin
fun simple(): Flow<Int> = flow {
    emit(1)
    throw RuntimeException()
}

fun main() = runBlocking<Unit> {
    simple()
        .onCompletion { cause -> if (cause != null) println("Flow completed exceptionally") }
        .catch { cause -> println("Caught exception") }
        .collect { value -> println(value) }
}    
```

예상하셨을 대로, 아래를 출력합니다:

```
1
Flow completed exceptionally
Caught exception
```

그러나 [onCompletion](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-completion.html) 는 [catch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/catch.html) 와 다르게, 예외를 핸들링하지 않습니다. 위의 예제에서 확인할 수 있듯이 예외가 하류로 계속 흐릅니다. `onCompletion` 를 지나 전달되는 `catch` 가 그것을 핸들링할 수 있을 것입니다.

### 성공적인 완료

[onCompletion](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-completion.html) 가 가지는 [catch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/catch.html) 와의 또다른 차이점은, 상류 및 하류 모두에서 발생할 수 있는 모든 예외들을 확인하고 아무런 문제가 없었을 때만 그의 람다가 null 을 수신한다는 점입니다.

```kotlin
fun simple(): Flow<Int> = (1..3).asFlow()

fun main() = runBlocking<Unit> {
    simple()
        .onCompletion { cause -> println("Flow completed with $cause") }
        .collect { value ->
            check(value <= 1) { "Collected $value" }                 
            println(value) 
        }
}
```

플로우의 수집이 하류의 예외에 의해 중단되어  `onCompletion` 람다의 인수로 받은 `cause` 가 null 이 아님을 확인할 수 있습니다.

```
1
Flow completed with java.lang.IllegalStateException: Collected 2
Exception in thread "main" java.lang.IllegalStateException: Collected 2
```

## 명령적 vs 선언적

이제 우리는 flow 를 수집하고, 완료와 예외를 명령적인 방법과 선언적인 방법 모두를 사용하여 어떻게 핸들링할 수 있는지 알고 있습니다. 이제 조금 본질적인, "어느 것이 더 선호되고 어째서 그럴까?" 라는 질문이 남았죠. 사실 하나의 라이브러리로서, 하나의 방식이 옳다고 지지하지 않고 두 방식 모두 유효하며 여러분의 기호나 코딩 스타일에 따라 선택하는 것이 맞다고 믿고있습니다.

## Flow 의 시작(Launch)

플로우는 어떤 근원지에서 발생하는 비동기적인 이벤트들을 표현하기 위한 수단으로 사용할 수도 있습니다. 이 경우에서, 들어오는 이벤트에 반응하고 다른 작업을 계속 할 수 있는 어떤 코드 조각을 등록하기 위한, `addEventListener` 와 비슷한 무언가가 필요합니다. 이 때 [onEach](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-each.html) 중간 연산자가 이 역할을 담당합니다. 그러나 `onEach` 는 중간 연산자일 뿐이기 때문에, 플로우를 모두 수집하기 위해 마지막에 종단 연산자를 반드시 사용해야합니다. 그렇지 않고 `onEach` 만 호출하는 것은 아무런 효과도 없습니다.

[onEach](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/on-each.html) 뒤에 [collect](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/collect.html) 를 사용하면, 수집이 모두 완료될때까지 기다립니다:

```kotlin
// 이벤트들의 플로우를 흉내냅니다.
fun events(): Flow<Int> = (1..3).asFlow().onEach { delay(100) }

fun main() = runBlocking<Unit> {
    events()
        .onEach { event -> println("Event: $event") }
        .collect() // <--- 플로우의 수집을 기다립니다.
    println("Done")
}     
```

위의 코드는 아래처럼 출력합니다:

```
Event: 1
Event: 2
Event: 3
Done
```

이러한 상황에서는 [launchIn](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/launch-in.html) 종단 연산자가 편리합니다. `collect` 를 `launchIn` 으로 대체하여, Flow 의 수집을 별도 코루틴으로 분리하여 실행하고, 그 이후의 코드를 계속하도록 만들 수 있습니다.

```kotlin
fun main() = runBlocking<Unit> {
    events()
        .onEach { event -> println("Event: $event") }
        .launchIn(this) // <--- 플로우를 새로운 코루틴에서 시작합니다.
    println("Done")
}
```

위의 코드는 아래처럼 출력합니다:

```
Done
Event: 1
Event: 2
Event: 3
```

`launchIn` 의 필수 인수는 반드시 새로운 코루틴이 어느 스코프에서 시작될지를 명시해야합니다. 위의 예제에서 전달된 스코프는 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 로부터 왔으며, 그러므로 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 의 스코프가 main 함수 내에서 플로우를 수집하는 자식 코루틴이 모두 완료될때까지 기다리고 이 예제를 종료했습니다.

실제 어플리케이션에서 이 스코프는 제한된 생명주기를 가지는 엔티티로부터 전달될 것입니다. 이 엔티티의 생명주기가 제거되는 순간 연관되는 코루틴 스코프도 취소될 것이기 떄문에, 마찬가지로 플로우의 수집도 취소됩니다. 이러한 관점에서 `onEach { ... }.launchIn(scope)` 는 마치 `addEventListener` 처럼 동작하지만, 구조화된 동시성이 적절하게 플로우의 수집을 취소하므로 그에 상응하는 `removeEventListener` 를 따로 추가할 필요가 없습니다.

물론 [launchIn](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/launch-in.html) 는 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 을 리턴하므로, 필요할 경우 그 부모 전체의 코루틴을 취소하거나 할 필요 없이 [cancel](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/cancel.html) 을 통해 해당하는 코루틴을 취소하여 Flow 의 수집을 중단할 수 있습니다.

### Flow의 취소 확인

편의성을 위해, [flow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow.html) 빌더는 매번 값이 방출되기 전 [ensureActive](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/ensure-active.html) 통해 취소 여부 확인을 합니다. 그것은 `flow { ... }` 블럭 안의 방출은 취소가 가능하다는 것을 의미합니다:

```kotlin
fun foo(): Flow<Int> = flow { 
    for (i in 1..5) {
        println("Emitting $i") 
        emit(i) 
    }
}

fun main() = runBlocking<Unit> {
    foo().collect { value -> 
        if (value == 3) cancel()  
        println(value)
    } 
}
```

최대 3개까지의 숫자만 받을 수 있으며 그 이후의 값을 방출하려고 할 때 [CancellationException](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/index.html) 를 발생시킵니다:

```
Emitting 1
1
Emitting 2
2
Emitting 3
3
Emitting 4
Exception in thread "main" kotlinx.coroutines.JobCancellationException: BlockingCoroutine was cancelled; job="coroutine#1":BlockingCoroutine{Cancelled}@6d7b4f4c
```

그러나, 대부분의 다른 플로우 연산자는 성능상의 이유로 취소를 확인하지 않습니다. 예를 들어, [IntRange.asFlow](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/as-flow.html) 확장 함수를 사용해 같은 루프를 만든다면 아무 곳에서도 정지하지 않으며 취소 확인도 하지 않습니다:

```kotlin
fun main() = runBlocking<Unit> {
    (1..5).asFlow().collect { value -> 
        if (value == 3) cancel()  
        println(value)
    } 
}
```

1에서 5의 모든 숫자가 수집되었으며 `runBlocking` 이 종료되기 직전에 취소가 확인됩니다:

```
1
2
3
4
5
Exception in thread "main" kotlinx.coroutines.JobCancellationException: BlockingCoroutine was cancelled; job="coroutine#1":BlockingCoroutine{Cancelled}@3327bd23
```

### 바쁜 Flow 를 취소 가능하게 만들기

이러한 코루틴과 연관된 바쁜 Flow 에서는 명시적으로 취소를 확인해주어야 합니다. `.onEach { currentCoroutineContext().ensureActive() }` 를 추가할 수도 있지만, 이미 같은 동작을 하는 [cancellable](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/cancellable.html) 중간연산자가 제공되고 있습니다:

```kotlin
fun main() = runBlocking<Unit> {
    (1..5).asFlow().cancellable().collect { value -> 
        if (value == 3) cancel()  
        println(value)
    } 
}
```

`cancellable` 연산자를 사용하면 1에서 3까지의 숫자만 수집됩니다:

```
1
2
3
Exception in thread "main" kotlinx.coroutines.JobCancellationException: BlockingCoroutine was cancelled; job="coroutine#1":BlockingCoroutine{Cancelled}@5ec0a365
```

## Flow 와 Reactive Streams

[Reactive Streams](https://www.reactive-streams.org/) 나 RxJava 등의 반응형 프레임워크에 익숙하다면 플로우의 디자인이 매우 익숙하실 수도 있습니다.

실제로, 이 디자인은 Reactive Streams 와 그의 몇몇 구현에서 영감을 받았습니다. 그러나 Flow 의 주된 목표는 그것이 가능한 한 간단한 디자인을 가지면서, 코틀린스럽고{^[1]} 서스펜션(정지)에 친화적이며 구조화된 동시성을 준수하도록 하는 것입니다. 아마 이 목표는 반응형 디자인의 개척자들과 그들의 엄청난 업적이 아니었다면 달성할 수 없었을 것입니다. [Reactive Streams and Kotlin Flows](https://medium.com/@elizarov/reactive-streams-and-kotlin-flows-bfd12772cda4) 게시글에서 전체 스토리를 읽어보실 수 있습니다.

개념적으로 다르긴 하지만, Flow **는** reactive stream **이며** reactive 제공자나 기타 등등으로 변환될 수 있습니다. 이러한 변환 유틸리티들은 `kotlinx.coroutines` 바깥의, 상응하는 모듈(Reactive Stream 에서는 `kotlinx-coroutines-reactive`, Project Reactor 는 `kotlinx-coroutines-reactor`, RxJava2/RxJava3 는 `kotlinx-coroutines-rx2`/`kotlinx-coroutines-rx3`)에서 확인할 수 있습니다. 통합 모듈들은 Flow 로부터, 그리고 Flow 로의 변환 유틸리티를 포함하며, Reactor 의 `Context` 나 기타 Reactive 엔티티들과 작업하기 위한 서스펜션(정지) 친화적인 방법들을 제공합니다.

---

{&[1]}원문: be Kotlin

{&?https://kotlinlang.org/docs/flow.html}