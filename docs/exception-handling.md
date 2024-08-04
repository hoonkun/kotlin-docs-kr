이 영역에서는 예외의 핸들링과 예외 시 취소에 관한 내용을 다룹니다. 우리는 취소된 코루틴이 정지 포인트에서 [CancellationException](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-cancellation-exception/index.html) 를 던진다는 것을 알고 있고, 코루틴의 작동에서 무시된다는 것을 알고 있습니다. 여기서는 취소 중에 예외가 발생하거나 하나의 코루틴의 여러 자식들이 각각 예외를 발생시킬 때 어떤 일이 일어나는지를 살펴봅니다.

{#exception-propagation}
## 예외의 전파

예외와 관련하여 코루틴 빌더들은 두 종류로 분류됩니다: [launch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 처럼 자동으로 예외를 전파하거나, 혹은 [async](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 나 [produce](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/produce.html) 처럼 사용자에게 노출하는 경우입니다. 
만약 이러한 빌더들이 **자식**이 아닌 최상위 수준의 **루트** 코루틴을 만들었다면, 이전에 언급한(자동으로 예외를 전파하는) 빌더는 `Thread.uncaughtExceptionHandler` 와 비슷하게 발생한 예외를 **처리되지 않은** 것으로 간주합니다. 이후에 언급한 builder 는 사용자가 해당 값을 최종적으로 언제 소비하느냐에 따라 달라지는 것과 다르게요.

이는 [GlobalScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-global-scope/index.html) 를 사용해 루트 코루틴을 만들어봄으로써 쉽게 재현해볼 수 있습니다:

> [GlobalScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-global-scope/index.html) 는 일반적이지 않은 사용으로 버그를 만들어낼 수 있는 섬세한 API 입니다. 전체 어플리케이션에 대해 루트 코루틴을 만드는 것은 `GlobalScope` 를 사용하는 몇 안되는 정당한 이유 중 하나이므로, 그것을 사용할 때 `@OptIn(DelicateCoroutinesApi::class)` 를 사용해 명시적으로 opt-in 해주어야 합니다.

```kotlin
@OptIn(DelicateCoroutinesApi::class)
fun main() = runBlocking {
    val job = GlobalScope.launch { // launch 를 통한 루트 코루틴
        println("Throwing exception from launch")
        throw IndexOutOfBoundsException() // Thread.defaultUncaughtExceptionHandler 에 의해 콘솔에 출력됩니다.
    }
    job.join()
    println("Joined failed job")
    val deferred = GlobalScope.async { // async 를 통한 루트 코루틴
        println("Throwing exception from async")
        throw ArithmeticException() // 사용자가 await 를 호출하기 전까지 아무것도 출력하지 않습니다.
    }
    try {
        deferred.await()
        println("Unreached")
    } catch (e: ArithmeticException) {
        println("Caught ArithmeticException")
    }
}
```

이 코드의 [debug](https://github.com/Kotlin/kotlinx.coroutines/blob/master/docs/coroutine-context-and-dispatchers.md#debugging-coroutines-and-threads) 모드가 활성화된 상태에서의 출력은 아래와 같습니다:

```
Throwing exception from launch
Exception in thread "DefaultDispatcher-worker-1 @coroutine#2" java.lang.IndexOutOfBoundsException
Joined failed job
Throwing exception from async
Caught ArithmeticException
```

{#coroutineexceptionhandler}
## CoroutineExceptionHandler

**처리되지 않은** 예외가 콘솔에 출력되는 동작을 커스텀할 수도 있습니다. **루트** 코루틴으로의 [CoroutineExceptionHandler](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-exception-handler/index.html) 컨텍스트 요소는 이 코루틴과 그의 자식들이 발생시키는 예외에 대한 일반적인 `catch` 블럭처럼 사용될 수 있습니다. 이는 [`Thread.uncaughtExceptionHandler`](https://docs.oracle.com/javase/8/docs/api/java/lang/Thread.html#setUncaughtExceptionHandler-java.lang.Thread.UncaughtExceptionHandler-) 와 비슷합니다.
예외가 발생한 시점에 해당 코루틴은 완전히 종료되며 이 핸들러가 불리는 시점은 그 이후이기 때문에, `CoroutineExceptionHandler` 로부터 실행을 복구하는 것은 불가능합니다. 일반적으로 이런 핸들러는 예외 로깅을 위해서, 혹은 몇몇 에러 메시지를 띄우거나, 어플리케이션을 재시작하는데 사용합니다.

`CoroutineExceptionHandler` 는 처리되지 않은 예외에 대해서만 적용됩니다. 그 외의 예외에에 대해서는 적용되지 않습니다. 특히, 모든 자식 코루틴들은 자신의 예외 핸들링을 부모에게 위임하므로, 부모도 그의 부모에게 위임하며 즉 루트 코루틴으로까지 위임받습니다. 따라서 자식들의 컨텍스트에 설정된 `CoroutineExceptionHandler` 는 절대 사용되지 않습니다. 그에 더해, [async](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 빌더는 모든 예외를 잡아버리고 그것을 [Deffered](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-deferred/index.html) 오브젝트에 표현하기 때문에 `CoroutineExceptionHandler` 가 아무런 효과를 발휘하지 못합니다.

> 지도자 코루틴은 예외를 부모에게 전파하지 않으며 이 규칙에서 벗어납니다. 이 문서의 지도자 영역에서 더 자세하게 다룹니다.

```kotlin
val handler = CoroutineExceptionHandler { _, exception -> 
    println("CoroutineExceptionHandler got $exception") 
}
val job = GlobalScope.launch(handler) { // GlobalScope 에서 실행되는 루트 코루틴
    throw AssertionError()
}
val deferred = GlobalScope.async(handler) { // 역시 루트이지만, launch 가 아닌 async 입니다.
    throw ArithmeticException() // deferred.await() 가 불릴 때까지 아무것도 출력하지 않습니다.
}
joinAll(job, deferred)
```

위 코드의 출력은 아래와 같습니다:

```kotlin
CoroutineExceptionHandler got java.lang.AssertionError
```

{#cancellation-and-exceptions}
## 취소와 예외

취소는 예외와 밀접한 관련이 있습니다. 코루틴은 내부적으로 취소에 `CancellationException` 를 사용하며, 이 예외는 모든 핸들러가 무시합니다. 따라서 이들은 `catch` 블럭으로 수집할 수 있는 기타 추가적인 디버깅 정보로만 사용되어야합니다. 코루틴이 [Job.cancel](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/cancel.html) 에 의해 취소되면 해당 코루틴은 제거되지만 그 부모까지 취소하지는 않습니다.

```kotlin
val job = launch {
    val child = launch {
        try {
            delay(Long.MAX_VALUE)
        } finally {
            println("Child is cancelled")
        }
    }
    yield()
    println("Cancelling child")
    child.cancel()
    child.join()
    yield()
    println("Parent is not cancelled")
}
job.join()
```

출력은 아래와 같습니다:

```
Cancelling child
Child is cancelled
Parent is not cancelled
```

만약 코루틴이 `CancellationException` 가 아닌 다른 예외를 만나면, 그 부모까지 해당 예외로 취소합니다. 이 행동은 재정의될 수 없으며, 안정적인 구조화된 동시성 계층을 제공하기 위해 필수적입니다. [CoroutineExceptionHandler](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-exception-handler/index.html) 의 구현은 자식 코루틴들에 사용되지 않습니다.

> 아래의 예제들에서, [GlobalScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-global-scope/index.html) 에서 만들어지는 코루틴들에는 [CoroutineExceptionHandler](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-exception-handler/index.html) 가 항상 설치되어 있습니다. 예외 핸들러를 메인 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 의 스코프에서 실행된 코루틴에 설치하는 것은 메인 코루틴이 자식이 예외와 함께 완료되었을 때 예외 핸들러의 설치와 무관하게 항상 취소되기 때문에 의미가 없습니다.
>

원본 예외가 모든 자식 코루틴이 제거된 이후에 부모에 의해 처리됨을 아래 예제에서 확인할 수 있습니다.

```kotlin
val handler = CoroutineExceptionHandler { _, exception -> 
    println("CoroutineExceptionHandler got $exception") 
}
val job = GlobalScope.launch(handler) {
    launch { // 첫 번째 자식
        try {
            delay(Long.MAX_VALUE)
        } finally {
            withContext(NonCancellable) {
                println("Children are cancelled, but exception is not handled until all children terminate")
                delay(100)
                println("The first child finished its non cancellable block")
            }
        }
    }
    launch { // 두 번째 자식
        delay(10)
        println("Second child throws an exception")
        throw ArithmeticException()
    }
}
job.join()
```

출력은 아래와 같습니다:

```
Second child throws an exception
Children are cancelled, but exception is not handled until all children terminate
The first child finished its non cancellable block
CoroutineExceptionHandler got java.lang.ArithmeticException
```

{#exceptions-aggregation}
## 예외의 뭉침

여러 개의 자식 코루틴이 예외에 의해 실패하면, 일반적인 규칙은 "먼저 던져진 예외가 이긴다" 입니다. 따라서 먼저 발생한 예외가 핸들링되고, 그 이후에 발생하는 모든 예외는 첫 예외에 부착됩니다:

```kotlin
@OptIn(DelicateCoroutinesApi::class)
fun main() = runBlocking {
    val handler = CoroutineExceptionHandler { _, exception ->
        println("CoroutineExceptionHandler got $exception with suppressed ${exception.suppressed.contentToString()}")
    }
    val job = GlobalScope.launch(handler) {
        launch {
            try {
                delay(Long.MAX_VALUE) // 다른 형제가 IOException 으로 실패하면 취소됩니다.
            } finally {
                throw ArithmeticException() // 두 번째 예외를 던집니다.
            }
        }
        launch {
            delay(100)
            throw IOException() // 첫 번째 예외입니다.
        }
        delay(Long.MAX_VALUE)
    }
    job.join()  
}
```

위의 코드는 아래처럼 출력합니다:

```
CoroutineExceptionHandler got java.io.IOException with suppressed [java.lang.ArithmeticException]
```

> 위의 예제는 JVM 의 Java 버전 1.7 이상에서만 작동하며, JS 나 Native 에 적용된 제한은 미래에 풀릴 것입니다.

`CancellationException` 은 투명하며 기본적으로 언박싱됩니다:

```kotlin
val handler = CoroutineExceptionHandler { _, exception ->
    println("CoroutineExceptionHandler got $exception")
}
val job = GlobalScope.launch(handler) {
    val innerJob = launch { // all this stack of coroutines will get cancelled
        launch {
            launch {
                throw IOException() // the original exception
            }
        }
    }
    try {
        innerJob.join()
    } catch (e: CancellationException) {
        println("Rethrowing CancellationException with original cause")
        throw e // cancellation exception is rethrown, yet the original IOException gets to the handler  
    }
}
job.join()
```

위의 코드는 아래처럼 출력합니다:

```
Rethrowing CancellationException with original cause
CoroutineExceptionHandler got java.io.IOException
```

{#supervision}
## 지도자

앞에서 알아보았듯이, 예외에 의한 취소는 전체 코루틴 계층에 전파되는 양방향 관계입니다. 그런데 만약 단방향 취소가 필요할 때는 어떻게 해야할지 살펴보죠.

이 상황에서 쓰기 좋은 예시는 Job 이 어떤 UI 컴포넌트의 스코프에서 정의된 경우입니다. 해당 UI 컴포넌트의 자식 중 하나가 실패했다고 하더라도 해당 UI 컴포넌트의 모든 자식을 제거할 필요는 없을 수도 있습니다. 
그러나 해당 UI 컴포넌트가 화면에서 제거되면 모든 자식을 제거해야하겠죠.

또다른 예시로는 서버의 프로세스로서 여러 자식 코루틴들을 생성하여 그들의 실행을 지도해야할 경우입니다. 이럴 때는 그들의 실패를 추적하여 다시 실행해주어야 합니다.

{#supervision-job}
### 지도자 Job

[SupervisorJob](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-supervisor-job.html) 가 이 목적을 위해 사용될 수 있습니다. 일반적인 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job.html) 과 비슷하지만 예외가 아래쪽으로만 전파됩니다. 이는 아래 예제를 통해 쉽게 재현해볼 수 있습니다.

```kotlin
val supervisor = SupervisorJob()
with(CoroutineScope(coroutineContext + supervisor)) {
    // 첫 자식을 시작합니다 -- 이 예제에서는 해당 예외가 무시됩니다. (실제로는 하지 마세요!)
    val firstChild = launch(CoroutineExceptionHandler { _, _ ->  }) {
        println("The first child is failing")
        throw AssertionError("The first child is cancelled")
    }
    // 두 번째 자식을 시작합니다.
    val secondChild = launch {
        firstChild.join()
        // 첫 번째 자식의 예외로 인한 취소가 두 번째 자식에게로 전파되지 않습니다.
        println("The first child is cancelled: ${firstChild.isCancelled}, but the second one is still active")
        try {
            delay(Long.MAX_VALUE)
        } finally {
            // 그러나 지도자의 취소는 전파됩니다.
            println("The second child is cancelled because the supervisor was cancelled")
        }
    }
    // 첫 자식이 예외로 인해 취소되고, 완료될 때까지 기다립니다.
    firstChild.join()
    println("Cancelling the supervisor")
    supervisor.cancel()
    secondChild.join()
}
```

이 코드의 출력은 아래와 같습니다:

```
The first child is failing
The first child is cancelled: true, but the second one is still active
Cancelling the supervisor
The second child is cancelled because the supervisor was cancelled
```

{#supervision-scope}
#### 지도자 스코프

범위 내로 제한된 동시성을 위해, [coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 대신 [supervisorScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/supervisor-scope.html) 를 쓸 수 있습니다. 그것은 예외로 인한 취소를 한쪽 방향으로만 전파하며 그 자신이 실패했을 때만 모든 자식을 제거합니다. [coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 와 마찬가지로 모든 자식이 완료될때까지 기다립니다.

```kotlin
try {
    supervisorScope {
        val child = launch {
            try {
                println("The child is sleeping")
                delay(Long.MAX_VALUE)
            } finally {
                println("The child is cancelled")
            }
        }
        // yield 를 통해 child 가 실행되고 출력할 틈을 줍니다. 
        yield()
        println("Throwing an exception from the scope")
        throw AssertionError()
    }
} catch(e: AssertionError) {
    println("Caught an assertion error")
}
```

위의 코드는 아래처럼 출력합니다:

```
The child is sleeping
Throwing an exception from the scope
The child is cancelled
Caught an assertion error
```

### 지도된 코루틴에서 발생하는 예외

일반적인 Job과 지도자 Job 사이의 가장 큰 차이점은 예외에 대한 핸들링에 있습니다. 지도지 Job 에서, 모든 자식들은 자신에게서 발생하는 예외를 직접 처리해야합니다. 이 차이는 자식의 예외가 부모에게로 전파되지 않는다는 사실이 시사합니다. 이는 또한 [supervisorScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/supervisor-scope.html) 에서 곧바로 파생된 코루틴은 루트 코루틴과 동일하게 그의 스코프에 설치된 [CoroutineExceptionHandler](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-exception-handler/index.html) 를 사용한다는 것을 의미합니다.

```kotlin
val handler = CoroutineExceptionHandler { _, exception -> 
    println("CoroutineExceptionHandler got $exception") 
}
supervisorScope {
    val child = launch(handler) {
        println("The child throws an exception")
        throw AssertionError()
    }
    println("The scope is completing")
}
println("The scope is completed")
```

위의 코드의 출력은 아래와 같습니다:

```
The scope is completing
The child throws an exception
CoroutineExceptionHandler got java.lang.AssertionError
The scope is completed
```

{&?}


{~}
{<~channels.md} {~>shared-mutable-state-and-concurrency.md}
{/~}