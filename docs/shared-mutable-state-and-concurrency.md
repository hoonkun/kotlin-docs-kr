코루틴은 [Dispatchers.Default](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 같은 디스패쳐를 사용하면 여러 스레드 사이에서 실행될 수 있습니다. 이는 모든 일반적인 동시성 문제도 포함합니다. 주로는 **변경 가능한 공유 자원**에의 접근 동기화입니다. 코루틴의 세상에서의 몇몇 솔루션은 멀티 스레딩 환경에서의 그것과 비슷하지만, 그렇지 않은 것들도 있습니다.

## 문제점

백 개의 같은 동작을 하는 코루틴을 시작해봅시다. 그리고 나중에 비교하기 위해 그의 속도를 측정해보죠.

[Dispatchers.Default](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 를 사용하여 여러 스레드에서 동작하도록 구성하고, 하나의 변경 가능한 공유자원의 값을 증가시키는 아주 단순한 코드로 시작해보겠습니다:

```kotlin
var counter = 0

fun main() = runBlocking {
    withContext(Dispatchers.Default) {
        massiveRun {
            counter++
        }
    }
    println("Counter = $counter")
}

suspend fun massiveRun(action: suspend () -> Unit) {
    val n = 100  // 실행할 코루틴의 수입니다.
    val k = 1000 // 각 코루틴 하나하나가 반복할 횟수입니다.
    val time = measureTimeMillis {
        coroutineScope { // 코루틴의 스코프
            repeat(n) {
                launch {
                    repeat(k) { action() }
                }
            }
        }
    }
    println("Completed ${n * k} actions in $time ms")
}
```

뭐가 출력될까요? 일단 “Counter = 100000” 는 아닐 가능성이 매우 높습니다. 그 이유는 백 개의 코루틴이 동기화 없이 counter 에 동시적으로 접근했기 때문입니다.

## Volatiles 는 소용 없습니다

`volatile` 이 동시성 문제를 해결해준다는 오해가 다소 있습니다. 시도해볼까요:

```kotlin
@Volatile // Kotlin 에서 `volatile` 는 어노테이션입니다. 
var counter = 0

fun main() = runBlocking {
    withContext(Dispatchers.Default) {
        massiveRun {
            counter++
        }
    }
    println("Counter = $counter")
}
```

이 코드는 조금 느려짐에도 여전히 항상 “Counter = 100000” 를 출력하지는 않습니다. 왜냐하면 volatile 은 읽고 쓰는 동작에 대한 원자성을 제공하지만, 더 큰 동작에 대한 원자성을 제공하지는 않습니다.

## 스레드 사이에서 안전한 데이터 구조

스레드와 코루틴 모두에서 적용되는 일반적인 해결책은, 공유된 자원에 적용되는 모든 오퍼레이션에 동기화 로직이 포함된 thread-safe 한(동기화된, 원자적이라고도 알려진) 데이터 구조를 사용하는 것입니다. 이 간단한 카운터 예제에서 우리는 원자적인 `incrementAndGet` 를 가진  `AtomicInteger` 를 사용할 수 있습니다.

```kotlin
val counter = AtomicInteger()

fun main() = runBlocking {
    withContext(Dispatchers.Default) {
        massiveRun {
            counter.incrementAndGet()
        }
    }
    println("Counter = $counter")
}
```

이 방식은 이 특정한 문제에 대해 가장 빠른 해결책이며, 단순한 카운터, 혹은 컬렉션이나 큐를 비롯한 다른 데이터 구조 및 기본적인 오퍼레이션에 적용됩니다. 그러나, 이는 바로 사용할 수 있는 thread-safe 한 구현이 없는 복잡한 상태나 오퍼레이션에 쉽게 적용하기는 힘듭니다.

## 세밀하게 스레드에 가두기

**스레드에 가두기**는 공유 자원 문제에 대해 해당 자원으로의 모든 접근을 하나의 스레드에 가두려는 접근입니다. 특히 모든 UI 상태를 하나의 스레드에 가두어버리는 UI 어플리케이션에서 자주 쓰입니다. 이는 Single-Threaded 컨텍스트를 사용함으로써 쉽게 반영할 수 있습니다:

```kotlin
val counterContext = newSingleThreadContext("CounterContext")
var counter = 0

fun main() = runBlocking {
    withContext(Dispatchers.Default) {
        massiveRun {
            // confine each increment to a single-threaded context
            withContext(counterContext) {
                counter++
            }
        }
    }
    println("Counter = $counter")
}
```

이 코드는 세밀하게 스레드에 가두었기 때문에 매우 느리게 동작합니다. 매 숫자의 증가 마다 멀티스레드인 [Dispatchers.Default](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 컨텍스트에서 싱글스레드인 [withContext(counterContext)](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/with-context.html) 컨텍스트로 전환합니다.

## 적당히 스레드에 가두기

실제로는, 스레드에 가두는 일은 몇 개의 큰 조각들로 나누어 진행됩니다. 예를 들어, 상태를 업데이트하는 비즈니스로직 전체를 하나의 스레드에 가둡니다. 아래의 예제는 바로 그런 방식을 나타내며, 하나의 스레드 내에서 각 코루틴을 실행합니다.

```kotlin
val counterContext = newSingleThreadContext("CounterContext")
var counter = 0

fun main() = runBlocking {
    // confine everything to a single-threaded context
    withContext(counterContext) {
        massiveRun {
            counter++
        }
    }
    println("Counter = $counter")
}
```

이제 같은 정확한 결과를 출력하는데 더 적은 시간이 소요됩니다.

## 상호 배제 (Mutual Exclusion, Mutex)

상호 배제 해결책은 모든 공유 자원으로의 수정 접근을, critical section 이라고 불리우는 절대로 동시에 실행되서는 안되는 코드의 일부 영역을 정의하여 보호합니다. 막히는 세상에서는 아마 `synchronized` 나 `ReentrantLock` 를 사용하셨을 겁니다. 코루틴의 세상에서는 [Mutex](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.sync/-mutex/index.html) 라고 불리며, critical section 을 정의하기 위한 [lock](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.sync/-mutex/lock.html) 와 [unlock](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.sync/-mutex/unlock.html) 를 제공합니다. 가장 큰 차이점은, `Mutex.lock()` 는 정지함수이며 스레드를 막지 않습니다.

`mutex.lock()`과 `try { ... } finally { mutex.unlock() }` 를 편리하게 표현하는 [withLock](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.sync/with-lock.html) 확장 함수도 존재합니다.

```kotlin
val mutex = Mutex()
var counter = 0

fun main() = runBlocking {
    withContext(Dispatchers.Default) {
        massiveRun {
            // protect each increment with lock
            mutex.withLock {
                counter++
            }
        }
    }
    println("Counter = $counter")
}
```

이 예제에서 의 locking 은 세밀하게 조정되었으므로 그만큼의 비용이 들어갑니다. 그러나, 명백하게 공유 자원에 점진적으로 값을 써야하지만 해당 오퍼레이션을 특별하게 가둘만한 스레드가 없는 상황일 때 적절한 해결책입니다.

{&?}

{~}
{<~exception-handling.md}
{/~}