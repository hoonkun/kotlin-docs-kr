이 문서는 코루틴의 기본적인 개념에 대해 다룹니다.

{#your-first-coroutine}
## 첫 코루틴

**코루틴**은 정지할 수 있는 계산들의 집합{^[1]}입니다. 
이는 ‘한 블럭의 코드를 가져가서 나머지 코드와 동시적으로 실행되도록’하는 스레드와 비슷한 면이 있지만, 코루틴은 어느 특정 스레드에도 한정되어있지 않습니다. 
코루틴은 어느 특정 스레드에서 실행이 정지되었다가, 서로 다른 스레드에서 재개될 수도 있습니다.

코루틴을 ‘가벼운 스레드’ 라고 생각할 수도 있지만, 실제 사용에서 스레드와 극명한 차이를 만드는 몇 가지 다른 점들이 있습니다.

아래의 코드를 실행해 여러분의 첫 코루틴을 한번 동작시켜보세요.

```kotlin
fun main() = runBlocking { // this: CoroutineScope
    launch { // 새로운 코루틴을 시작하고 계속합니다.
        delay(1000L) // 막지 않고 1초를 대기합니다(기본 시간 단위는 ms 입니다).
        println("World!") // 대기 후 출력합니다.
    }
    println("Hello") // 이전 코루틴은 딜레이 중이지만 메인 코루틴은 계속 진행됩니다.
}
```

아마 이런 출력이 나올것입니다:

```
Hello
World!
```

이 코드가 무얼 하는지 하나하나 뜯어봅시다.

[launch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 는 
**코루틴 빌더**{^[2]}입니다. 나머지 코드와 동시에, 독립적으로 동작하는 새 코루틴을 만들고 시작합니다. 
그것이 `Hello` 가 먼저 출력되는 이유입니다.

[delay](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html) 는 
특별한 **정지 함수** 입니다. 이 함수는 코루틴을 일정 시간동안 **정지**시킵니다. 
코루틴을 정지시켜도 그가 포함되는 thread 의 실행을 **막지 않고** 다른 코루틴들이 해당 스레드에서 자신의 코드들을 실행할 수 있게 합니다.

[runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 도 
**코루틴 빌더**로, 코루틴이 아닌 세상인 `fun main()` 과 `runBlocking { ... }` 의 블럭 내의 여러 코루틴 관련 코드들을 이어주는 다리입니다. 
IDE 에서는 이 함수에 전달되는 람다의 스코프를 `this: CoroutineScope` 라고 힌팅해줄 것입니다.

만약 `runBlocking` 을 치우거나 깜빡한다면, [launch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 
함수의 호출에서 에러를 만나게 될것입니다. 왜냐하면 `launch` 함수는 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/) 에만
정의되어 있기 때문입니다.

```
Unresolved reference: launch
```

이 `runBlocking` 의 이름은, 이 함수가 실행되는 스레드(이 경우에는 main thread)가 전달되는 람다의 코루틴들이 모두 작업을 마칠 때까지 **막힌다**는 것을 의미합니다.
스레드는 무거운 자원이고 그것을 막는 것은 비효율적이라서, 대부분의 경우 의도하지 않기 때문에 아마 여러 어플리케이션의 진입점 등과 같은 top-level 에서 많이 보이고 실제 코드에서는 거의 보이지 않을 것입니다.

{#structured-concurrency}
### 구조화된 동시성

코루틴은 그 생명주기를 제어하는 특정 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/) 에서만 실행될 수 있다는 **구조화된 동시성**{^[3]}이라는 원칙을 따릅니다. 
위의 예제에서 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 함수가 해당 스코프를 생성하고 있음을 보여주며, 그것이 위의 예제가 1초 뒤 `World!` 가 출력될 때까지만 기다리고 바로 종료되는 이유입니다.

실제 어플리케이션에서 여러분은 아마 수많은 코루틴을 시작하게 될 것입니다. 구조화된 동시성은 그것들을 잃어버리거나 누수되지 않도록 보장합니다. 
어떤 코루틴들의 부모가 되는 스코프는 그 자식 코루틴들의 작업이 모두 끝날 때까지 완료될 수 없습니다. 
구조화된 동시성은 코드의 실행 중 발생하는 오류를 적절하게 보고하고 잃어버리지 않는다는 것 또한 보장합니다.

---

{&[1]} 원문: instance of suspendable computation  
{&[2]} 원문: coroutine builder  
{&[3]} 원문: structured concurrency. 코루틴에서 사용되는 특정 개념을 지칭하는 표현.  

{#extract-function-refactoring}
## 리팩터링 - 함수로 분리

`launch { ... }` 블럭 안에 있는 코드를 별도의 함수로 분리해봅시다. 이 코드에 대해 "Extract function" 기능을 사용하면, `suspend` 수정자를 가진 새로운 함수를 만나게 될것입니다. 
이것이 여러분의 첫 **정지 함수**입니다. 정지 함수들은 코루틴 안에서 일반적인 함수처럼 사용될 수 있지만, 그들만의 특별한 점은 그들은 또다른 정지 함수(예제의 `delay` 등과 같은)를 사용하여 코루틴의 실행을 **정지**시킬 수 있다는 것입니다.

```kotlin
fun main() = runBlocking { // this: CoroutineScope
    launch { doWorld() }
    println("Hello")
}

// 이게 여러분의 첫 정지 함수입니다.
suspend fun doWorld() {
    delay(1000L)
    println("World!")
}
```
---
정지 함수를 만들고 코루틴 내에서 호출하면 무조건 동시적으로 실행된다는 오해에 빠지기 쉬운데, 사실은 그렇지 않습니다.  
우리가 실제로 만드는 함수의 suspend 수정자는 '정지할 수도 있다'라는 의미이지, 실제로 정지한다는 의미가 아닙니다.  
즉, 정지 함수를 만들어도 실제로 그 안에서 '정지' 하지 않으면 그 함수는 여전히 코루틴 안에서 해당 코루틴이 동작하는 스레드를 막으며, 그 스레드에 *갇힌* 다른 코루틴들이 동작할 수 없습니다.  
실제로 코루틴을 '정지' 시키는 정지 함수는 `kotlinx.coroutines` 패키지 안의 [delay](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/delay.html), [yield](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/yield.html) 등이며, 우리가 만든 정지 함수 안에서 이러한 함수들 중 하나를 호출해야 비로소 코루틴이 '정지' 하고, 다른 코루틴이 해당 스레드에서 동작할 수 있게 합니다.  
&nbsp;  
스레드나 '*갇힌*' 이라는 표현과 연관된, 예제를 동반한 더 자세한 내용은 [이 문서](/docs/coroutine-context-and-dispatchers.md) 에서 다룹니다.

{#scope-builder}
## Scope builder

다른 코루틴 빌더 함수들에 의해 제공되는 코루틴 스코프들에 더해, [coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 라는 빌더 함수를 사용하여 여러분만의 새로운 스코프를 정의할 수도 있습니다. 이 함수는 새로운 코루틴 스코프를 만들며 그 안에서 시작된 자식 코루틴들이 모두 끝날 때까지 완료되지 않습니다.

[runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 과 [coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 가 해당 함수의 람다가 모두 끝날때까지 기다린다는 점에서 비슷해보일 수도 있습니다. 
가장 큰 차이점은, [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 은 자신이 속한 스레드를 **막고** 실행이 끝날때까지 기다리지만 [coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 는 해당 코루틴을 정지시키기만 하고 자신이 속한 스레드를 다른 사용처에게 넘깁니다. 
이 차이로 인해 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 은 일반적인 함수이지만 [coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 는 정지함수입니다.

어떤 정지함수에서든 [coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 를 사용할 수 있습니다. 예를 들어, 동시적으로 `Hello` 와 `World` 를 출력하는 코드를 `suspend fun doWorld()` 함수로 분리할 수 있습니다:

```kotlin
fun main() = runBlocking {
    doWorld()
}

suspend fun doWorld() = coroutineScope {  // this: CoroutineScope
    launch {
        delay(1000L)
        println("World!")
    }
    println("Hello")
}
```

이 코드도 마찬가지로 아래처럼 출력합니다:

```
Hello
World!
```

{#scope-builder-and-concurrency}
## Scope builder 와 동시성

[coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 빌더는 여러 개의 동시적인 작업을 수행하려는 모든 정지 함수에서 사용될 수 있습니다. 
`doWorld` 정지 함수 안에서 두 개의 코루틴을 동시에 시작해봅시다:

```kotlin
// 순차적으로 doWorld 를 실행하고 "Done" 를 출력합니다.
fun main() = runBlocking {
    doWorld()
    println("Done")
}

// 동시적으로 두 영역 모두를 실행합니다.
suspend fun doWorld() = coroutineScope { // this: CoroutineScope
    launch {
        delay(2000L)
        println("World 2")
    }
    launch {
        delay(1000L)
        println("World 1")
    }
    println("Hello")
}
```

`launch { ... }` 블럭 안에 있는 두 코드 모두 **동시에** 실행되며, 실행 시작부터 1초 뒤에 `World 1` 이 출력되고 실행 시작부터 2초 뒤에 `World 2` 가 출력됩니다. 
`doWorld` 안의 [coroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/coroutine-scope.html) 는 두 작업이 모두 종료된 이후에야 비로소 완료되며, `doWorld` 가 종료되고 `Done` 문자열이 출력될 수 있도록 합니다.

```
Hello
World 1
World 2
Done
```

{#an-explicit-job}
## 명시적인 Job

[launch](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/launch.html) 빌더는, 해당 코루틴을 관리하며 그것이 종료될때까지 명시적으로 기다리게 할 수 있는 [Job](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/index.html) 오브젝트를 리턴합니다. 
예를 들어, 만든 코루틴이 완료될 때까지 기다리고 "Done" 을 출력할 수도 있습니다.

```kotlin
val job = launch { // 새로운 코루틴을 시작하고 그의 작업 오브젝트 레퍼런스를 보관합니다.
    delay(1000L)
    println("World!")
}
println("Hello")
job.join() // 작업 코루틴이 완료될때까지 기다립니다.
println("Done") 
```

이 코드는 아래와 같이 출력합니다:

```
Hello
World!
Done
```

{#coroutines-are-light-weight}
## 코루틴은 가볍습니다

코루틴은 JVM의 스레드보다 덜 무겁습니다. 스레드를 사용했을 때 JVM 의 사용 가능 메모리를 바닥낼 수 있는 코드가 코루틴을 사용하면 리소스 제한을 넘지 않고 실행{^[1]}될 수 있습니다.

예를 들어 아래의 코드는 '5초를 기다리고 점('.')을 출력'하는 50,000 개의 서로 다른 코루틴을 시작하지만, 아주 적은 메모리만을 사용합니다.

```kotlin
fun main() = runBlocking {
    repeat(50_000) { // launch a lot of coroutines
        launch {
            delay(5000L)
            print(".")
        }
    }
}
```

만약 같은 프로그램을 스레드를 사용하여 구현하면(`runBlocking` 을 제거하고, `launch` 를 `thread` 로 바꾸며, `delay` 를 `Thread.sleep` 로 바꿉니다), 아주 많은 메모리를 사용할 것입니다.

여러분이 사용하고있는 운영체제나 JDK의 버전, 그의 실행 설정에 따라 out-of-memory 문제를 발생시키거나 동시에 너무 많은 스레드가 생기지 않도록 아주 느리게 실행될 것입니다.

---

{&[1]} 원문: expressed


{&?}

{~}
{<~coroutines-guide.md} {~>cancellation-and-timeouts.md}
{/~}