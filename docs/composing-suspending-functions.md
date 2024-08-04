이 문서에서는 정지 함수를 구성하는 몇 가지 접근에 대해 다룹니다.

## 기본적으로 순차적입니다

어떤 유용한 무언가를 수행하는 정지 함수가 있다고 해봅시다. 실제로는 이 예제의 목적을 위해 1초를 기다리기만 하는 함수이지만, 일단 유용한 것이라고 해보겠습니다:

```kotlin
suspend fun doSomethingUsefulOne(): Int {
    delay(1000L) // 뭔가 유용하고 복잡한 일을 하는 척 합니다.
    return 13
}

suspend fun doSomethingUsefulTwo(): Int {
    delay(1000L) // 여기서도 뭔가 유용하고 복잡한 일을 하는 척 합니다.
    return 29
}
```

이 두 함수들이 **순차적**으로 실행되게 하려면 어떻게 할까요 — 먼저 `doSomethingUsefulOne` 을 호출하고 **그러고 나서** `doSomethingUsefulTwo` 를 호출하겠지요? 
실제로, 우리는 첫 함수의 결과를 두 번째 함수의 호출 자체의 여부를 결정하거나 그의 실행에서 사용한다면 이렇게 합니다.

우리는 평범한 순차적 호출방식을 사용합니다. 왜냐하면 코루틴 내의 코드는 여타 다른 코드와 같이 기본적으로 순차적이기 때문입니다. 아래의 코드는 두 정지 함수의 총 실행 시간을 측정하는 예제입니다:

```kotlin
val time = measureTimeMillis {
    val one = doSomethingUsefulOne()
    val two = doSomethingUsefulTwo()
    println("The answer is ${one + two}")
}
println("Completed in $time ms")
```

위의 코드는 아래와 비슷하게 출력합니다:

```
The answer is 42
Completed in 2017 ms
```

## async 를 통한 동시성

만약 `doSomethingUsefulOne` 과 `doSomethingUsefulTwo` 사이에 어떠한 의존 관계도 없고 그 둘을 **동시에** 실행하여 결과를 더 빠르게 내고싶다면 어떨까요? 
이 때를 위해 [async](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 가 등장합니다.

개념적으로, [async](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 는 [launch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 와 비슷합니다. 
그것은 가벼운 스레드이며 다른 코루틴들과 동시에 실행되는 별도의 코루틴을 시작합니다. 그 둘의 차이는 `launch` 는 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 을 리턴하고 아무런 기타 결과값을 가지지 않지만 `async` 는 [Deferred](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-deferred/index.html) — ‘가볍고 블락하지 않는, 특정 결과를 언젠가 제공한다는 약속을 표현하는 미래’를 리턴합니다. `.await()` 를 연기된 오브젝트에 사용하여 그의 일어날 수 있는 결과를 가져올 수 있을 뿐더러, `Deffered` 도 `Job` 의 확장이므로 필요하다면 취소할 수 있습니다.

```kotlin
val time = measureTimeMillis {
    val one = async { doSomethingUsefulOne() }
    val two = async { doSomethingUsefulTwo() }
    println("The answer is ${one.await() + two.await()}")
}
println("Completed in $time ms")
```

위의 코드는 아래와 비슷하게 출력합니다:

```
The answer is 42
Completed in 1017 ms
```

두 코루틴이 동시에 실행되기 때문에, 두 배 빠른 결과입니다. 코루틴의 동시성은 항상 명시적임을 기억해두세요.

## 나중에 시작되는 async

선택적으로, [async](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 는 그의 `start` 인수에 [CoroutineStart.LAZY](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-start/-l-a-z-y/index.html) 를 전달함으로써 나중에 시작되도록 할 수도 있습니다. 이 모드에서는 그의 결과값이 [await](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-deferred/await.html) 에 의해 필요하게 되거나, `Job` 의 [start](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/start.html) 가 불리면 그 때 실행이 시작됩니다. 아래의 코드를 실행해보세요:

```kotlin
val time = measureTimeMillis {
    val one = async(start = CoroutineStart.LAZY) { doSomethingUsefulOne() }
    val two = async(start = CoroutineStart.LAZY) { doSomethingUsefulTwo() }
    // 여타 다른 계산들
    one.start() // 첫 번째 계산을 시작
    two.start() // 두 번째 계산을 시작
    println("The answer is ${one.await() + two.await()}")
}
println("Completed in $time ms")
```

위의 코드는 아래와 비슷한 결과를 출력합니다:

```
The answer is 42
Completed in 1017 ms
```

이 예제에서 두 개의 코루틴이 선언되었지만 해당 시점에 시작되지 않았고, 대신 그의 제어권이 개발자에게 넘어가 정확히 언제 이것들을 [start](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/start.html) 를 통해 시작해야하는지 정할 수 있게 되었습니다.

만약 우리가 [start](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/start.html) 를 호출하지 않고 `println` 에서 [await](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-deferred/await.html) 만 호출했다면, [await](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-deferred/await.html) 이 결과값이 도출될 때까지 코루틴을 정지시키기 때문에 순차적으로 행동했을 것입니다. 이는 의도했던 '게으른{^[1]}' 사용케이스가 아니죠. `async(start = CoroutineStart.LAZY)` 는 표준 `lazy` 함수의 블럭에서 정지 함수를 사용하기 위한 대체제로 사용되곤 합니다.

--- 

{&[1]} 원문: laziness

## async-style 함수들

> 이 async 함수들을 사용한 프로그래밍 스타일은 그저 다른 언어들에서 자주 쓰이는 스타일이기 때문에 그의 의미를 전달하기 위한 것일 뿐입니다. 이 스타일을 Kotlin 에서 사용하는 것은 아래에서 서술할 이유료 **강하게 비권장**됩니다.

[async](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 와 [GlobalScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-global-scope/index.html) 를 사용해 구조적 동시성에서 벗어난 async-스타일의 함수를 만들고, `doSomethingUsefulOne` 과 `doSomethingUsefulTwo` 를 동시에 실행할 수도 있습니다. 
이 함수들의 이름 뒤에 "...Async" 를 붙혀, 그들이 비동기 계산 작업을 시작하기만 하며 그 값을 실제로 가져오려면 리턴으로 전달되는 연기된 값을 통해야한다는 사실을 명시하겠습니다.

> [GlobalScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-global-scope/index.html) 는 섬세하여 다루기 어려운 API로써 아래에서 설명될 것 처럼 복잡한 경로로 버그를 만들어낼 수 있기 때문에, 반드시 `GlobalScope` 를 사용하겠음을 `@OptIn(DelicateCoroutinesApi::class)` 를 통해 밝혀야 합니다.

```kotlin
// somethingUsefulOneAsync 의 리턴 타입은 Deferred<Int> 입니다.
@OptIn(DelicateCoroutinesApi::class)
fun somethingUsefulOneAsync() = GlobalScope.async {
    doSomethingUsefulOne()
}

// somethingUsefulTwoAsync 의 리턴 타입은 Deferred<Int> 입니다.
@OptIn(DelicateCoroutinesApi::class)
fun somethingUsefulTwoAsync() = GlobalScope.async {
    doSomethingUsefulTwo()
}
```

`xxxAsync` 함수는 **정지 함수가 아니라는 사실**을 기억하세요. 때문에 어디서든 사용될 수 있지만, 그들의 사용은 항상 동시적입니다.

아래의 예제는 코루틴 바깥에서의 그들의 사용을 보여주고 있습니다:

```kotlin
// 이 예제에서는 `main` 바로 안에서 `runBlocking` 을 호출하지 않습니다.
fun main() {
    val time = measureTimeMillis {
        // we can initiate async actions outside of a coroutine
        val one = somethingUsefulOneAsync()
        val two = somethingUsefulTwoAsync()
        // but waiting for a result must involve either suspending or blocking.
        // here we use `runBlocking { ... }` to block the main thread while waiting for the result
        runBlocking {
            println("The answer is ${one.await() + two.await()}")
        }
    }
    println("Completed in $time ms")
}
```

만약 `val one = somethingUsefulOneAsync()` 과 `one.await()` 사이에서 문제가 발생하여 예외를 던졌고, 결과적으로 코드 진행이 중단되면 어떻게 될지 생각해봅시다. 
일반적으로 전역적 에러핸들러가 그 예외를 잡고 로깅이나 개발자에게 오류를 보고하는 등의 작업을 하겠지만, 전체 프로그램은 그것에 개의치 않고 다른 작업을 계속 이어서 할 수도 있습니다. 
그러나 해당 호출이 발생한 작업 자체가 예외로 인해 중지되었음에도 불구하고, `somethingUsefulOneAsync()` 에 의한 작업은 백그라운드에서 계속 실행되고 있습니다. 
이런 문제는 아래에서 설명하듯 구조화된 동시성의 경계 안에서는 발생하지 않습니다.

## async 와 구조화된 동시성

*async 를 통한 동시성* 영역의 예제를 잠시 가져와, 동시에 `doSomethingUsefulOne` 과 `doSomethingUsefulTwo` 를 수행하고 그의 합을 구하는 별도 함수를 만들어봅시다. 
[coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 가 필요한 이유는 [async](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 코루틴 빌더가 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 의 확장 함수이기 때문입니다.

```kotlin
suspend fun concurrentSum(): Int = coroutineScope {
    val one = async { doSomethingUsefulOne() }
    val two = async { doSomethingUsefulTwo() }
    one.await() + two.await()
}
```

이 접근에서, `concurrentSum` 함수에서 무언가 문제가 발생하면 예외를 발생시키고 모든 시작된 코루틴이 취소됩니다.

```kotlin
val time = measureTimeMillis {
    println("The answer is ${concurrentSum()}")
}
println("Completed in $time ms")
```

아래의 출력에서 보이듯 여전히 동시 실행이 이루어집니다.

```
The answer is 42
Completed in 1017 ms
```

또한, 취소는 항상 코루틴의 계층 구조를 따라 전파됩니다:

```kotlin
fun main() = runBlocking<Unit> {
    try {
        failedConcurrentSum()
    } catch(e: ArithmeticException) {
        println("Computation failed with ArithmeticException")
    }
}

suspend fun failedConcurrentSum(): Int = coroutineScope {
    val one = async<Int> { 
        try {
            delay(Long.MAX_VALUE) // Emulates very long computation
            42
        } finally {
            println("First child was cancelled")
        }
    }
    val two = async<Int> { 
        println("Second child throws an exception")
        throw ArithmeticException()
    }
    one.await() + two.await()
}
```

첫 `async` 와 그 결과값들을 기다리는 부모가 그의 자식 중 하나(two로 명명된)에서 발생한 예외로 인해 모두 취소되었음을 확인할 수 있습니다.

```
Second child throws an exception
First child was cancelled
Computation failed with ArithmeticException
```

{&?}

{~}
{<~cancellation-and-timeouts.md} {~>coroutine-context-and-dispatchers.md}
{/~}