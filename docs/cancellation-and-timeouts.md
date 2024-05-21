이 문서는 코루틴의 취소와 타임아웃에 대해 다룹니다.

## 코루틴 실행의 취소
긴 시간동안 실행되는 어플리케이션에서, 백그라운드 코루틴에 대한 세밀한 컨트롤이 필요할 수 있습니다. 
예를 들어, 사용자가 어떤 코루틴을 포함한 페이지를 닫거나 어떤 원인에 의해 결과가 필요 없어져서 취소해도 되는 작업이 생겼을 때 등이겠지요.
[launch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 함수는 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 을 리턴하며 실행되는 코루틴을 취소할 수 있습니다:

```kotlin
val job = launch {
    repeat(1000) { i ->
        println("job: I'm sleeping $i ...")
        delay(500L)
    }
}
delay(1300L) // 약간 기다립니다.
println("main: I'm tired of waiting!")
job.cancel() // 작업을 취소합니다.
job.join() // 작업의 완료까지 대기합니다. 
println("main: Now I can quit.")
```

위의 코드는 아래와 같이 출력합니다:

```
job: I'm sleeping 0 ...
job: I'm sleeping 1 ...
job: I'm sleeping 2 ...
main: I'm tired of waiting!
main: Now I can quit.
```

`job.cancel()` 의 호출 직후에 코루틴이 취소되어서, 해당 코루틴으로부터의 다른 출력이 보이지 않습니다. 
[cancel](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/cancel.html) 과 [join](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/join.html) 을 합쳐둔 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 의 다른 확장 함수로 [cancelAndJoin](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/cancel-and-join.html) 을 사용할 수 있습니다.

## 취소는 협조적입니다

코루틴의 취소는 **협조적**입니다. 즉, 코루틴 내의 코드는 그를 취소할 수 있도록 협조적이어야 합니다. 
모든 `kotlinx.coroutines` 내의 함수는 **취소할 수 있습니다**. 그들은 코루틴의 취소가 확인되면 [CancellationException](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/index.html) 을 던집니다. 
그러나, 만약 코루틴이 취소됨과 관계없이 계산 작업을 계속 한다면, 아래 예제가 보여주듯 취소할 수 없습니다:

```kotlin
val startTime = System.currentTimeMillis()
val job = launch(Dispatchers.Default) {
    var nextPrintTime = startTime
    var i = 0
    while (i < 5) { // 그저 CPU 를 낭비하는 계산 루프입니다.
        // 초당 두 개의 메시지를 출력합니다.
        if (System.currentTimeMillis() >= nextPrintTime) {
            println("job: I'm sleeping ${i++} ...")
            nextPrintTime += 500L
        }
    }
}
delay(1300L) // 잠시 기다립니다.
println("main: I'm tired of waiting!")
job.cancelAndJoin() // 작업을 취소하고 완료될 때까지 기다립니다.
println("main: Now I can quit.")
```

작업이 취소된 이후에도 다섯 번의 반복을 거쳐 스스로 작업이 완료될 때까지 계속 "I’m sleeping" 을 출력하는 것을 확인할 수 있습니다.

이 문제는 던져진 [CancellationException](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/index.html) 을 잡고 다시 던지지 않았을 때도 발생합니다:

```kotlin
val job = launch(Dispatchers.Default) {
    repeat(5) { i ->
        try {
            // 초당 두 개의 메시지를 출력합니다.
            println("job: I'm sleeping $i ...")
            delay(500)
        } catch (e: Exception) {
            // 예외를 로깅합니다.
            println(e)
        }
    }
}
delay(1300L) // 잠시 기다립니다.
println("main: I'm tired of waiting!")
job.cancelAndJoin() // 작업을 취소하고 완료될 때까지 기다립니다.
println("main: Now I can quit.")
```

`Excetption` 을 잡는게 안티패턴이긴 하지만, 이 문제는 이외에도 여러 경로를 통해 다양한 형태로 나타날 수 있습니다. 예를 들면 [CancellationException](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/index.html) 을 잡고 다시 던지지 않는 [`runCatching`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/run-catching.html) 등을 사용한다던지요.

## 계산하는 코드를 취소할 수 있도록 하기

계산중인 코드를 취소할 수 있게 할 수 있는 두 가지 접근 방법이 있습니다. 첫 번째는 주기적으로 정지 함수를 호출하여 취소되었는지를 확인하는 방법으로, [yield](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/yield.html) 라는 함수가 이 목적을 위한 좋은 선택입니다. 
두 번째는 명시적으로 취소 상태를 확인하는 방법입니다. 두 번째 접근을 시도해봅시다.

이전 예제의 `while (i < 5)` 문장을 `while (isActive)` 로 변경하고 재실행해보세요.

```kotlin
val startTime = System.currentTimeMillis()
val job = launch(Dispatchers.Default) {
    var nextPrintTime = startTime
    var i = 0
    while (isActive) { // 취소할 수 있는 계산 루프
        // 초당 두 개의 메시지를 출력합니다.
        if (System.currentTimeMillis() >= nextPrintTime) {
            println("job: I'm sleeping ${i++} ...")
            nextPrintTime += 500L
        }
    }
}
delay(1300L) // 잠시 기다립니다.
println("main: I'm tired of waiting!")
job.cancelAndJoin() // 작업을 취소하고 완료될 때까지 기다립니다.
println("main: Now I can quit.")
```

확인할 수 있듯이, 이젠 반복이 정상적으로 취소됩니다. [isActive](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/is-active.html) 는 코루틴 안에서 사용할 수 있는 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 의 확장 프로퍼티입니다.

## finally 를 사용해 리소스를 정리하기

취소할 수 있는 정지 함수는 취소되면 평범하게 핸들링할 수 있는 [CancellationException](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/index.html) 을 던집니다. 예를 들어, 코루틴이 취소되면 `try { ... } finally { ... }` 표현이나 Kotlin 의 `use` 함수는 그의 최종 정리 동작{^[1]}을 정상적으로 실행합니다.

```kotlin
val job = launch {
    try {
        repeat(1000) { i ->
            println("job: I'm sleeping $i ...")
            delay(500L)
        }
    } finally {
        println("job: I'm running finally")
    }
}
delay(1300L) // 잠시 기다립니다.
println("main: I'm tired of waiting!")
job.cancelAndJoin() // 작업을 취소하고 완료될 때까지 기다립니다.
println("main: Now I can quit.")
```

[join](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/join.html) 과 [cancelAndJoin](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/cancel-and-join.html) 함수 모두 최종 정리 동작을 끝낼때까지 기다리므로, 위의 예제는 아래와 같이 출력합니다:

```
job: I'm sleeping 0 ...
job: I'm sleeping 1 ...
job: I'm sleeping 2 ...
main: I'm tired of waiting!
job: I'm running finally
main: Now I can quit.
```

---

{&[1]} 원문: finalization actions

## 취소할 수 없는 블럭의 실행

위의 예제에서, `finally` 블럭 안에서의 모든 정지 함수의 사용 시도는 [CancellationException](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/index.html) 을 부릅니다. 
왜냐하면 해당 로직이 실행되는 코루틴은 이미 정지되었기 때문입니다. "일반적인{^[1]}" 리소스 닫기 동작은 보통 스레드를 막지 않으며 다른 정지 함수를 호출하지 않기 때문에, 대부분의 경우에서 이것은 문제가 되지 않습니다. 
그러나, 아주 예외적인 경우로 취소된 코루틴 내에서 정리 동작을 위해 코루틴을 정지하고 싶다면 아래 예제가 보여주듯 해당 코드를 [withContext](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-context.html) 함수와 [NonCancellable](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-non-cancellable/index.html) 컨텍스트를 사용해  `withContext(NonCancellable) {...}` 로 감쌀 수 있습니다:

```kotlin
val job = launch {
    try {
        repeat(1000) { i ->
            println("job: I'm sleeping $i ...")
            delay(500L)
        }
    } finally {
        withContext(NonCancellable) {
            println("job: I'm running finally")
            delay(1000L)
            println("job: And I've just delayed for 1 sec because I'm non-cancellable")
        }
    }
}
delay(1300L) // 잠시 기다립니다.
println("main: I'm tired of waiting!")
job.cancelAndJoin() // 작업을 취소하고 완료될 때까지 기다립니다.
println("main: Now I can quit.")
```

---

{&[1]} 원문: well-behaving

## 타임아웃

코루틴의 실행을 취소하는 가장 현실적인 이유는 그의 실행 시간이 최대 실행 가능 시간을 초과하는 경우입니다. 
[Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 의 레퍼런스와 서로 다른 코루틴에서 딜레이를 통해 작업을 취소하는 방법도 있지만, 그것을 알아서 해주는 [withTimeout](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-timeout.html) 함수도 있습니다. 
아래 예제를 살펴보세요:

```kotlin
withTimeout(1300L) {
    repeat(1000) { i ->
        println("I'm sleeping $i ...")
        delay(500L)
    }
}
```

위의 예제는 아래와 같이 출력합니다:

```
I'm sleeping 0 ...
I'm sleeping 1 ...
I'm sleeping 2 ...
Exception in thread "main" kotlinx.coroutines.TimeoutCancellationException: Timed out waiting for 1300 ms
```

[withTimeout](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-timeout.html) 이 던진 `TimeoutCancellationException` 는 [CancellationException](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/index.html) 의 서브클레스입니다. 
이전의 예제들에서는 예외의 스택이 콘솔에 출력되지 않았는데, 그것은 취소된 코루틴에서 발생하는 `CancellationException` 은 일반적인 코루틴 완료 사유이지만 이 예제에서는 `withTimeout` 함수를 main 함수의 바로 안쪽에 사용했기 때문입니다.

취소는 단순히 예외이기 때문에, 모든 리소스는 통상적으로 정리되어야 합니다. 
명시적으로 다른 작업을 추가로 해야할 경우 타임아웃 내의 코드를 `try {...} catch (e: TimeoutCancellationException) {...}` 로 감싸거나, 그럴 필요가 없다면  [withTimeout](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-timeout.html) 와 비슷하지만 취소되면 예외를 던지는 대신 `null` 을 리턴하는 [withTimeoutOrNull](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-timeout-or-null.html) 을 사용할 수도 있습니다.

```kotlin
val result = withTimeoutOrNull(1300L) {
    repeat(1000) { i ->
        println("I'm sleeping $i ...")
        delay(500L)
    }
    "Done" // 이 결과를 리턴하기 전에 취소됩니다.
}
println("Result is $result")
```

이 예제에서는 더이상 아무 예외도 던져지지 않습니다.

```
I'm sleeping 0 ...
I'm sleeping 1 ...
I'm sleeping 2 ...
Result is null
```

## 비동기 타임아웃과 리소스

[withTimeout](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-timeout.html) 안의 타임아웃 이벤트는, 실행되는 그의 블럭과 비동기적으로 언제든 발생할 수 있습니다. 
설사 그것이 타임아웃 블럭의 리턴 바로 직전일지라도요. 이 블럭 안에서 정리가 필요한 리소스를 만들기 전에 이 사실을 항상 기억하세요.

예를 들기 위해 아래의 예제에서 정리가 필요한 `Resource` 클래스를 만들어보겠습니다. 단순히 오브젝트가 생성될 때 `aquired` 를 증가시키고 `close` 함수를 통해 감소시키는 역할입니다.

이제 많은 코루틴을 생성해봅시다. 각 코루틴이 `withTimeout` 블럭 마지막에서 `Resource` 를 만들고, 그 바깥에서 해당 리소스를 정리합니다. 
`withTimeout` 블록이 완료된 직후에 타임아웃이 발생하기 쉽도록 약간의 딜레이를 주어 리소스 누수가 발생하도록 합니다.

```kotlin
var acquired = 0

class Resource {
    init { acquired++ } // 리소스를 차지합니다.
    fun close() { acquired-- } // 리소스를 놓아줍니다.
}

fun main() {
    runBlocking {
        repeat(10_000) { // 1만 개의 코루틴을 시작합니다.
            launch { 
                val resource = withTimeout(60) { // 60ms 의 타임아웃
                    delay(50) // 50ms 만큼 대기합니다.
                    Resource() // 리소스를 차지하고 그것을 withTimeout 의 리턴으로 돌립니다.     
                }
                resource.close() // 리소스를 놓아줍니다.
            }
        }
    }
    // runBlocking 의 바깥으로써 모든 코루틴이 완료되었습니다.
    println(acquired) // 아직 차지된 모든 리소스의 수를 출력합니다.
}
```

이 코드를 실행해보면, 타이밍에 기반해 때때로 0이 아닌 값을 출력합니다. 실제로 0이 아닌 값을 보려면 이 예제에서 타임아웃 값을 약간 바꿔야할 수도 있습니다.

> 이 예제에서, 여러 코루틴에서 전역적인 `aquired` 변수에의 할당은 완전히 thread-safe 합니다. 
> `runBlocking` 을 통해 항상 같은 스레드 안에서 실행되기 때문입니다. 
> 이에 대해서는 coroutine context 챕터에서 더 자세히 다룹니다.

이 문제를 해결하려면, 리소스의 레퍼런스를 `withTimeout` 블럭에서 리턴하기 전에 어딘가에 저장해야합니다.

```kotlin
runBlocking {
    repeat(10_000) { // Launch 10K coroutines
        launch { 
            var resource: Resource? = null // Not acquired yet
            try {
                withTimeout(60) { // Timeout of 60 ms
                    delay(50) // Delay for 50 ms
                    resource = Resource() // Store a resource to the variable if acquired      
                }
                // We can do something else with the resource here
            } finally {  
                resource?.close() // Release the resource if it was acquired
            }
        }
    }
}
// Outside of runBlocking all coroutines have completed
println(acquired) // Print the number of resources still acquired
```

이렇게 하면 항상 0을 출력합니다. 리소스가 누수되지 않습니다.

{&?https://kotlinlang.org/docs/cancellation-and-timeouts.html}


{~}
{<~coroutines-basics.md} {~>composing-suspending-functions.md}
{/~}