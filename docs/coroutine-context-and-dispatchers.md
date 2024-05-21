코루틴은 항상 Kotlin 표준 라이브러리의 [CoroutineContext](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/) 타입이 표현하는 어떠한 컨텍스트의 안에서 실행됩니다.

코루틴 컨텍스트는 몇가지 요소들의 집합입니다. 이전에 봤던 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 도 이 요소 중 하나이며, 디스패쳐가 이 문서에서 설명할 또다른 메인 요소입니다.

## 디스패쳐와 스레드

코루틴 컨텍스트는 코루틴이 실행될 스레드(들)를 결정하는 코루틴 디스패쳐([CoroutineDispatcher](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-dispatcher/index.html))를 포함합니다. 디스패쳐는 코루틴의 실행을 특정 스레에 가두거나, 스레드풀에 파견하거나, 갇히지 않은 상태로 두기도 합니다.

[launch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 나 [async](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) 등의 모든 코루틴 빌더는 새 코루틴에 직접 디스패쳐를 지정하거나 다른 요소를 설정할 수 있는 선택적인 [CoroutineContext](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/) 인수를 받습니다.

아래의 예제를 실행해보세요:

```kotlin
launch { // 부모의 컨텍스트를 물려받습니다. 즉, main 함수의 runBlocking 코루틴의 그것입니다.
    println("main runBlocking      : I'm working in thread ${Thread.currentThread().name}")
}
launch(Dispatchers.Unconfined) { // 갇히지 않았습니다. -- 일단 main 스레드에서 동작합니다.
    println("Unconfined            : I'm working in thread ${Thread.currentThread().name}")
}
launch(Dispatchers.Default) { // DefaultDispatcher 에게 파견됩니다. 
    println("Default               : I'm working in thread ${Thread.currentThread().name}")
}
launch(newSingleThreadContext("MyOwnThread")) { // 자신만의 독자 스레드를 가집니다.
    println("newSingleThreadContext: I'm working in thread ${Thread.currentThread().name}")
}
```

위의 예제는 아래와 같은 출력을 냅니다(순서는 다를 수 있습니다):

```
Unconfined            : I'm working in thread main
Default               : I'm working in thread DefaultDispatcher-worker-1
newSingleThreadContext: I'm working in thread MyOwnThread
main runBlocking      : I'm working in thread main
```

`launch { ... }` 가 파라미터 없이 사용되면, 이 코루틴을 실행한 부모의 디스패쳐를 포함한 컨텍스트를 그대로 물려받습니다. 이 경우에는, 메인 함수의 `runBlocking` 이 부모이므로 메인 스레드에서 동작합니다.

[Dispatchers.Unconfined](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-unconfined.html) 는 특별한 디스패쳐로, 메인 스레드에서 동작하는 것으로 보이지만 사실은 이후에 설명할 조금 다른 메커니즘을 가지고 있습니다.

특정 스코프에 명시적으로 다른 디스패쳐가 설정되어있지 않다면, [Dispatchers.Default](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 로 표현되는 기본 디스패쳐를 사용하며 전역적인 스레드풀을 사용합니다.

[newSingleThreadContext](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/new-single-thread-context.html) 는 코루틴의 실행을 위해 새로운 스레드를 만듭니다. 전용 스레드는 매우 무거운 리소스이므로, 실제 어플리케이션에서는 반드시 사용 완료 후 [close](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-executor-coroutine-dispatcher/close.html) 함수를 통해 놓아주거나 top-level 에 정의되어 어플리케이션 내에서 재사용되어야 합니다.

## 갇히지 않은 디스패쳐 vs 갇힌 디스패쳐

[Dispatchers.Unconfined](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-unconfined.html) 는 코루틴을 기존에 실행되던 스레드에서 실행하지만, 첫 정지 포인트까지만 그렇게 합니다. 정지가 끝난 이후에 실행될 스레드는 첫 정지를 유발한 함수에 의해 결정됩니다. 갇히지 않은 디스패쳐는 CPU 시간을 잡아먹지 않고 특정 스레드에 갇힌 공유 자원을 건드리지 않는 코루틴들에 적합합니다.

반면에, 디스패쳐는 바깥의 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 의 그것을 그대로 물려받습니다. 특히 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 코루틴의 기본 디스패쳐는 해당 함수가 호출된 스레드에 갇히며, 그러므로 이것을 물려받는 것은 예측 가능한 FIFO 스케줄링을 가지는 스레드에 가두는 효과가 있습니다.

```kotlin
launch(Dispatchers.Unconfined) { // not confined -- will work with main thread
    println("Unconfined      : I'm working in thread ${Thread.currentThread().name}")
    delay(500)
    println("Unconfined      : After delay in thread ${Thread.currentThread().name}")
}
launch { // context of the parent, main runBlocking coroutine
    println("main runBlocking: I'm working in thread ${Thread.currentThread().name}")
    delay(1000)
    println("main runBlocking: After delay in thread ${Thread.currentThread().name}")
}
```

위의 코드는 아래와 같이 출력합니다:

```
Unconfined      : I'm working in thread main
main runBlocking: I'm working in thread main
Unconfined      : After delay in thread kotlinx.coroutines.DefaultExecutor
main runBlocking: After delay in thread main
```

모두 main 스레드에서 시작한 두 코루틴에 대해, 컨텍스트를 `runBlocking {...}` 으로부터 물려받아 갇힌 코루틴은 `main` 스레드에서 이어서 작업하지만, 갇히지 않은 코루틴은 [delay](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html) 함수가 사용하는 default executor 스레드에서 재게되는 것을 볼 수 있습니다.

> 갇히지 않은 디스패쳐는 고급 매커니즘으로, 일부 나중에 실행할 필요가 없거나 특정할 수 없는 부수효과를 만드는, 곧바로 실행되어야 하는 경우 등의 코너 케이스에 도움이 될 수 있습니다. 갇히지 않은 디스패쳐는 일반적인 코드에서는 사용하지 않는 것이 좋습니다.

---
[이 문서](/docs/coroutines-basics.md#리팩터링_-_함수로_분리) 에서 설명한 바와 같이, suspend 함수로 표시된 정지 함수라도 실제로 그 안에서 정지하지 않으면 해당 코루틴이 갇힌 스레드를 막습니다.
즉, 어떤 코루틴이 적절한 타이밍에 '정지' 하지 않으면 해당 스레드를 막으며, 그러면 다른 해당 스레드에 '갇힌' 코루틴들은 막힌다는 의미가 됩니다.  
[이 예제 소스(Kotlin Online)](https://pl.kotl.in/8HChOu22p)를 통해 '실제로 정지하는 함수'와 스레드 사이의 관계를 확인해보세요.  

## 코루틴과 스레드의 디버깅
코루틴은 어떤 스레드에서 정지하여 다른 스레드에서 재게될 수 있습니다. 싱글스레드 디스패쳐를 사용하더라도 특별한 도구를 사용하지 않으면 코루틴이 무엇을 하고 있는지 찾아내기 어려울 수 있습니다.

### IDEA 로 디버깅
코틀린 플러그인인 코루틴 디버거가 Intellij IDEA 에서 코루틴의 디버깅을 편리하게 합니다.  

> 디버깅은 `kotlinx-coroutines-core` 버전 1.3.8 과 그 이후부터 사용할 수 있습니다.

**Debug** 도구 윈도우는 **Coroutines** 탭을 포함합니다. 이 탭에서, 현재 동작중이거나 정지한 코루틴들의 정보를 찾아볼 수 있습니다. 코루틴들은 그들이 동작중인 디스패쳐로 그룹화됩니다.

![Debug 도구 윈도우의 Coroutine 탭](/coroutine-idea-debugging-1.png)

코루틴 디버거를 사용하면, 아래와 같은 일들을 할 수 있습니다:

{*large-spacing}
- 각 코루틴의 상태를 확인합니다.
- 실행 중이거나 정지된 코루틴의 로컬 변수, 캡쳐된 변수 등을 확인합니다.
- 코루틴 내부의 콜스택을 비롯한 코루틴 생성 스택을 확인합니다. 각 스택은 모든 프레임과 각각의 변수 값들을 포함하며 표준 디버깅 내에서 잃어버리지 않습니다.
- 코루틴의 상태와 스택을 포함한 완전한 보고서를 가져올 수 있습니다. 가져오려면, **Coroutines** 탭에서 우클릭하여 **Get Coroutines Dump** 를 선택합니다.

코루틴 디버깅을 시작하려면, 중단점을 설정하고 어플리케이션을 디버그 모드에서 실행하기만 하면 됩니다.  

코루틴 디버깅에 대한 더 자세한 내용을 [이 튜토리얼](https://kotlinlang.org/docs/tutorials/coroutines/debug-coroutines-with-idea.html) 에서 알아보세요.

### 로깅으로 디버깅
스레드를 사용하는 어플리케이션을, Coroutine Debugger 를 사용하지 않고 디버깅하는 또다른 접근은 로그파일의 각 문장에 스레드의 이름을 출력하는 방법입니다.
이 기능은 보편적으로 로깅 프레임워크들에 의해 지원되고 있습니다. 코루틴을 사용할 때는 스레드의 이름만으로는 충분한 정보를 가져올 수 없으므로, `kotlinx.coroutines` 는 그를 더 쉽게 하기 위한 도구들을 포함합니다.  

아래 코드를 `-Dkotlinx.coroutines.debug` JVM 옵션과 함께 실행해보세요:

```kotlin
val a = async {
    log("I'm computing a piece of the answer")
    6
}
val b = async {
    log("I'm computing another piece of the answer")
    7
}
log("The answer is ${a.await() * b.await()}")
```

여기에는 세 개의 코루틴이 있습니다. `runBlocking` 안쪽의 메인 코루틴(#1), 그리고 두 개의 연기된 값들을 계산하는 a(#2) 와 b(#3) 두 개의 코루틴입니다.
그들은 모두 `runBlocking` 의 컨텍스트를 사용하므로, 메인 스레드에 갇혀있습니다. 코드의 출력은 아래와 같습니다:

```
[main @coroutine#2] I'm computing a piece of the answer
[main @coroutine#3] I'm computing another piece of the answer
[main @coroutine#1] The answer is 42
```

`log` 함수는 스레드의 이름을 대괄호 안에 출력하며, 그와 같이 현재 실행 중인 코루틴의 ID가 뒤따르는 것을 볼 수 있습니다.
이 ID는 디버그 모드가 켜져있을 때 모든 생성된 코루틴에게 연속적으로 부여됩니다.

> 디버그 모드는 JVM 이 `-ea` 옵션과 함께 실행되었을 때도 켜집니다. 디버그 도구에 대한 더 자세한 내용을 [DEBUG_PROPERTY_NAME](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-d-e-b-u-g_-p-r-o-p-e-r-t-y_-n-a-m-e.html) 프로퍼티의 문서에서 확인할 수 있습니다.

## 스레드 사이를 오가기

아래의 코드를 `-Dkotlinx.coroutines.debug` JVM 옵션과 함께 실행해보세요:

```kotlin
fun log(msg: String) = println("[${Thread.currentThread().name}] $msg")

fun main() {
    newSingleThreadContext("Ctx1").use { ctx1 ->
        newSingleThreadContext("Ctx2").use { ctx2 ->
            runBlocking(ctx1) {
                log("Started in ctx1")
                withContext(ctx2) {
                    log("Working in ctx2")
                }
                log("Back to ctx1")
            }
        }
    }
}
```

위의 예제는 몇 가지 새로운 테크닉을 제시합니다. 하나는 명시적으로 컨텍스트가 제공된 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 의 사용이고, 다른 하나는 현재의 코루틴에 계속 남아있는 상태로 컨텍스트를 변경하는 [withContext](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-context.html) 의 사용입니다. 아래의 출력으로 확인해볼 수 있습니다:

```
[Ctx1 @coroutine#1] Started in ctx1
[Ctx2 @coroutine#1] Working in ctx2
[Ctx1 @coroutine#1] Back to ctx1
```

이 예제에서는 Kotlin 표준 라이브러리에 포함된 `use` 의 사용을 통해 [newSingleThreadContext](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/new-single-thread-context.html) 로부터 만들어진 뒤 사용이 끝난 스레드를 놓아주고 있습니다.

## 컨텍스트에서의 Job

코루틴의 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 은 컨텍스트의 부분이므로, `coroutineContext[Job]` 표현으로 접근할 수 있습니다:

```kotlin
println("My job is ${coroutineContext[Job]}")
```

디버그 모드에서, 위의 코드는 아래와 같이 출력합니다.

```kotlin
My job is "coroutine#1":BlockingCoroutine{Active}@6d311334
```

[CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 의 [isActive](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/is-active.html) 확장 프로퍼티는 `coroutineContext[Job]?.isActive == true` 의 문법적 설탕과 같습니다.

## 코루틴의 자식

어떤 코루틴이 다른 코루틴의 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 안에서 시작되면, 그 코루틴의 컨텍스트는 해당하는 [CoroutineScope.coroutineContext](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/coroutine-context.html) 로부터 물려받으며, 새로운 코루틴의 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 은 부모 코루틴이 가지는 그것의 **자식**이 됩니다. 부모의 코루틴이 중지되면, 모든 자식들까지 재귀적으로 취소됩니다.

하지만 이 부모-자식 관계는 아래의 두 방법을 통해 명시적으로 재정의 될 수 있습니다:

1. 다른 스코프가 코루틴을 시작할 때 명시적으로 지정되면, 그 때는 부모 스코프의 `Job` 을 물려받지 않습니다.
2. 따로 생성된 `Job` 오브젝트가 코루틴을 시작할 때 컨텍스트에 전달되면, 그것을 부모의 그것 대신 사용합니다.

두 경우 모두에서, 시작된 코루틴은 그것이 시작된 스코프에 묶이지 않으며 독립적으로 작동합니다.

```kotlin
// 어떤 요청을 처리하기 위한 코루틴을 시작합니다.
val request = launch {
    // 두 개의 서로 다른 작업을 시작합니다.
    launch(Job()) { 
        println("job1: I run in my own Job and execute independently!")
        delay(1000)
        println("job1: I am not affected by cancellation of the request")
    }
    // 나머지 하나는 부모의 컨텍스트를 물려받습니다.
    launch {
        delay(100)
        println("job2: I am a child of the request coroutine")
        delay(1000)
        println("job2: I will not execute this line if my parent request is cancelled")
    }
}
delay(500)
request.cancel() // 요청의 처리를 취소합니다.
println("main: Who has survived request cancellation?")
delay(1000) // 잠시 대기하여 무슨 일이 일어나는지 확인합니다.
```

위의 코드는 아래와 같이 출력합니다:

```
job1: I run in my own Job and execute independently!
job2: I am a child of the request coroutine
main: Who has survived request cancellation?
job1: I am not affected by cancellation of the request
```

## 부모의 책임

부모 코루틴은 항상 모든 자식이 완료될때까지 기다립니다. 부모는 자식들의 실행 상태를 추적할 필요가 없으며, 마지막에 자식들에 대한 [Job.join](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/join.html) 으로 모든 작업이 끝나기를 기다릴 필요도 없습니다.

```kotlin
// 어떤 요청을 처리하기 위한 코루틴을 시작합니다.
val request = launch {
    repeat(3) { i -> // 몇 개의 자식 작업을 시작합니다.
        launch  {
            delay((i + 1) * 200L) // 변하는 딜레이 200ms, 400ms, 600ms 를 각각 줍니다.
            println("Coroutine $i is done")
        }
    }
    println("request: I'm done and I don't explicitly join my children that are still active")
}
request.join() // 그의 자식들을 포함하여, 요청의 처리가 모두 완료될 때까지 기다립니다.
println("Now processing of the request is complete")
```

위의 코드는 아래와 같이 출력합니다:

```
request: I'm done and I don't explicitly join my children that are still active
Coroutine 0 is done
Coroutine 1 is done
Coroutine 2 is done
Now processing of the request is complete
```

## 디버깅을 위해 코루틴에 이름짓기

자동으로 할당되는 id 들은 코루틴들이 로깅을 자주하거나 단순히 서로 같은 코루틴으로부터 오는 로그들을 취합할 때는 좋습니다. 그러나 특정 요청에 국한된 처리나 백그라운드 작업을 한다면, 디버깅 목적으로 명시적인 이름을 짓는게 더 좋습니다. [CoroutineName](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-name/index.html) 컨텍스트 요소는 스레드의 이름과 동일한 목적의 기능을 제공합니다. 그것은 디버그 모드가 켜저있을 때 로그에 표기되는 스레드의 이름에 포함될 것입니다.

아래의 예제가 위의 사용예를 보여줍니다:

```kotlin
log("Started main coroutine")
// 두 개의 백그라운드 값 계산을 시작합니다.
val v1 = async(CoroutineName("v1coroutine")) {
    delay(500)
    log("Computing v1")
    6
}
val v2 = async(CoroutineName("v2coroutine")) {
    delay(1000)
    log("Computing v2")
    7
}
log("The answer for v1 * v2 = ${v1.await() * v2.await()}")
```

위의 코드는 `-Dkotlinx.coroutines.debug` JVM 옵션을 통해 실행하면 아래와 비슷하게 출력합니다:

```
[main @main#1] Started main coroutine
[main @v1coroutine#2] Computing v1
[main @v2coroutine#3] Computing v2
[main @main#1] The answer for v1 * v2 = 42
```

## 컨텍스트 요소의 조합

때때로 여러 요소들을 하나의 코루틴 컨텍스트에 조합해야할 수 있습니다. 그럴 때는 `+` 오퍼레이터를 사용합니다. 
예를 들어, 이름과 디스패쳐가 지정된 코루틴을 아래와 같이 시작할 수 있습니다:

```kotlin
launch(Dispatchers.Default + CoroutineName("test")) {
    println("I'm working in thread ${Thread.currentThread().name}")
}
```

위의 코드는 `-Dkotlinx.coroutines.debug` JVM 옵션을 통해 실행하면 아래와 같이 출력합니다:

```
I'm working in thread DefaultDispatcher-worker-1 @test#2
```

## 코루틴 스코프

이제, 알게된 컨텍스트와 그의 자식, Job에 대한 내용을 한 곳으로 모아봅시다. 우리의 어플리케이션이 생명주기를 가지는 어떤 오브젝트를 가지고 있다고 가정해보세요. 
예를 들면 우리가 안드로이드 어플리케이션을 작성하고 있으며, 몇 개의 코루틴을 안드로이드의 Activity 에서 네트워크 패칭이나 애니메이션 등의 비동기적인 작업을 위해 시작한다던지요. 
이 모든 코루틴은 이 activity 가 파괴(destroy) 되면 메모리 누수를 막기 위해 반드시 중지되어야 합니다. 우리는 물론 컨텍스트를 직접 만들어 activity 의 생명주기에 맞게 조절해줄 수도 있지만, `kotlinx.corotuines` 는 그것을 캡슐화하는 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 를 제공합니다. 
이미 모든 코루틴 빌더가 가 이것의 확장이므로 익숙할 것입니다.

activity 의 생명주기에 묶인 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 인스턴스를 만들어 코루틴들의 생명주기를 관리할 수 있습니다. 
`CoroutineScope` 인스턴스는 [CoroutineScope()](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope.html) 나 [MainScope()](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-main-scope.html) 같은 함수들로부터 만들어질 수 있는데,
전자는 범용의 스코프를 생성하고 후자는 [Dispatchers.Main](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-main.html) 을 기본 디스패쳐로 사용하는 UI 어플리케이션을 위한 스코프를 생성합니다:

```kotlin
class Activity {
    private val mainScope = MainScope()

    fun destroy() {
        mainScope.cancel()
    }
    // to be continued ...
```

이제 정의된 `mainScope` 를 사용하여 이 `Activity` 에서 코루틴을 시작할 수 있습니다. 그 예시로, 서로 다른 시간동안 대기하는 10개의 코루틴을 시작해보겠습니다:

```kotlin
// class Activity continues
    fun doSomething() {
        // 10개의 서로 다른 시간동안 작업하는 코루틴들을 시작합니다.
        repeat(10) { i ->
            mainScope.launch {
                delay((i + 1) * 200L) // 변하는 딜레이 200ms, 400ms, ... 등등을 줍니다.
                println("Coroutine $i is done")
            }
        }
    }
} // class Activity ends
```

activity 를 시작하는 메인 함수에서, 테스트 함수인 `doSomething` 함수를 호출하고, 500ms 뒤에 파괴해봅시다. 이는 `doSomething` 에서 시작한 모든 코루틴을 취소합니다. 아래의 출력에서, activity 를 파괴한 뒤 조금 더 기다려도 아무것도 출력되지 않았음을 확인할 수 있습니다.

```kotlin
val activity = Activity()
activity.doSomething() // 테스트 함수를 실행합니다.
println("Launched coroutines")
delay(500L) // 0.5초를 기다립니다.
println("Destroying activity!")
activity.destroy() // 모든 코루틴을 중지합니다.
delay(1000) // 더이상 코루틴이 동작하지 않음을 확인합니다.
```

위의 예제는 아래와 같이 출력합니다:

```
Launched coroutines
Coroutine 0 is done
Coroutine 1 is done
Destroying activity!
```

위에서 확인할 수 있듯, 첫 두개의 코루틴만 메시지를 출력했으며 나머지는 `Activity.destroy()` 의 `job.cancel()` 에 의해 취소되었음을 알 수 있습니다.

> 안드로이드에는 생명주기를 가지는 엔티티에 대한 코루틴 스코프의 지원이 이미 있습니다. 자세한 내용은 [해당 문서](https://developer.android.com/topic/libraries/architecture/coroutines?hl=ko#lifecyclescope)를 확인해보세요.

### 스레드 로컬 데이터

때때로 스레드 로컬 데이터를 코루틴 간에 넘기면 편리할 때가 있습니다. 그러나 코루틴들은 특정 스레드의 경계 안에 있지 않기 때문에, 이를 직접 구현하면 보일러플레이트가 될 수 있습니다.

[`ThreadLocal`](https://docs.oracle.com/javase/8/docs/api/java/lang/ThreadLocal.html) 의 확장 함수인 [asContextElement](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/as-context-element.html) 확장 함수가 이 때를 위해서 등장합니다. 이 함수는 제공된 `ThreadLocal` 을 유지하는 추가 컨텍스트 요소를 생성하며, 코루틴이 컨텍스트를 변경할 때마다 그 값을 복원(원문: restore)합니다.

아래와 같이 쉽게 확인해볼 수 있습니다:

```kotlin
threadLocal.set("main")
println("Pre-main, current thread: ${Thread.currentThread()}, thread local value: '${threadLocal.get()}'")
val job = launch(Dispatchers.Default + threadLocal.asContextElement(value = "launch")) {
    println("Launch start, current thread: ${Thread.currentThread()}, thread local value: '${threadLocal.get()}'")
    yield()
    println("After yield, current thread: ${Thread.currentThread()}, thread local value: '${threadLocal.get()}'")
}
job.join()
println("Post-main, current thread: ${Thread.currentThread()}, thread local value: '${threadLocal.get()}'")
```

이 예제에서 새로운 코루틴을 [Dispatchers.Default](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 을 사용해 시작했으므로, 백그라운드 스레드 풀의 서로 다른 스레드에서 동작하지만 코루틴이 어떤 스레드에 있던 여전히 코루틴을 시작하기 전에 `threadLocal.asContextElement(value = "launch")` 로 지정한 값을 가지고 있습니다. 그러므로 디버그모드에서의 출력은 아래와 같습니다:

```
Pre-main, current thread: Thread[main @coroutine#1,5,main], thread local value: 'main'
Launch start, current thread: Thread[DefaultDispatcher-worker-1 @coroutine#2,5,main], thread local value: 'launch'
After yield, current thread: Thread[DefaultDispatcher-worker-2 @coroutine#2,5,main], thread local value: 'launch'
Post-main, current thread: Thread[main @coroutine#1,5,main], thread local value: 'main'
```

컨텍스트의 요소로 지정하는 것을 깜빡하기 쉽습니다. 스레드 로컬 변수는 서로 다른 스레드에 있는 코루틴에서 접근할 경우 예상치 못한 값을 가져올 수도 있습니다. 이런 상황을 막기 위해, [ensurePresent](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/ensure-present.html) 를 사용하여 잘못된 사용을 빠르게 오류로 처리하는 것을 권장합니다.

`ThreadLocal` 에는 `kotlinx.coroutines` 가 제공하는 모든 원시값을 사용할 수 있습니다. 다만 한 가지 중요한 한계가 있습니다: 스레드 로컬 데이터가 변경되었을 때, 새로운 값이 코루틴 호출자에게 전파되지 않습니다. 이는 컨텍스트 요소가 모든 `ThreadLocal` 오브젝트에의 접근을 추적할 수 없기 때문입니다. 그리고 변경된 값은 다음 정지에서 소실됩니다. 코루틴 안에서 스레드 로컬 데이터를 변경하려면 [withContext](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-context.html) 를 사용하세요. 자세한 내용은 [asContextElement](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/as-context-element.html) 에 기술되어 있습니다.

대안으로, 값을 `class Counter(var i: Int)` 같은 변경 가능한 객체(원문: box)에 넣고 스레드 로컬 변수에 저장할 수도 있습니다. 그러나 이 경우에는 여러분에게 해당 객체의 변수에 대한 동시 수정을 완전히 동기화해야할 책임이 있습니다.

MDC 와 통합된 로깅이나 트랜잭션 컨텍스트, 데이터 전달에 스레드 로컬 데이터를 사용하는 기타 라이브러리 등과 같이 더 고차원적으로 사용하려면, [ThreadContextElement](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-thread-context-element/index.html) 인터페이스의 구현과 관련된 문서를 참고해주십시오.

{&?https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html}


{~}
{<~composing-suspending-functions.md} {~>flow.md}
{/~}