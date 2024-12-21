{>caution}
> 이 문서는 아직 작업이 완전히 완료되지 않았습니다! 일부 문맥이 매끄럽지 않거나 잘못된 문장/어휘 사용이 있을 수 있습니다.

&nbsp;  

{*compact}
- **타입**: 디자인 제안
- **저자**: Andrey Breslav, Roman Elizarov
- **기여자**: Vladimir Reshetnikov, Stanislav Erokhin, Ilya Ryzhenkov, Denis Zharkov
- **상태**: Kotlin 1.3 (Revision 3.3) 부터 안정적, experimental in Kotlin 1.1-1.2 에서 실험적

--- 
낡은 정보일 수 있으므로, [이 페이지](https://github.com/Kotlin/KEEP/blob/master/proposals/coroutines.md)에서 원문을 확인해주세요.


## 개요

이 문서는 Kotlin 의 Coroutine 에 관한 것입니다. 이 개념은 아래처럼 알려지거나, 이들을 부분적으로 포함합니다:

{*compact}
- generators/yield
- async/await
- composable/delimited continuations

목표는 아래와 같습니다:

{*compact}
- Futures 를 비롯하여 비슷한 구현이 있는 어떠한 다른 라이브러리에도 의존하지 않을 것
- "async/await" 및 "generator blocks" 형태의 사용 케이스를 커버할 것
- Kotlin 의 Coroutine 을 Java 의 NIO 등과 비슷하게 별도 비동기 API 로서의 래퍼로 분리/도구화할 수 있을 것


## 사용 케이스

코루틴은 *정지할 수 있는 계산*들의 집합으로 간주될 수 있습니다. 예를 들어, 어떤 한 계산이 특정 시점에 정지하고
나중에 어떤 다른 스레드에서 계속 재개할 수 있습니다. 서로간에 호출되는 코루틴들(과 상호 교환되는 데이터들)은 
협동적인 멀티태스킹을 위한 매커니즘을 형성할 수 있습니다.

### 비동기적인 계산

코루틴에 대한 가장 중요한 사용 케이스는, C# 이나 다른 언어들에서 async/await 으로 핸들링되는 비동기적인 계산 작업들입니다.
이들이 콜백을 사용하면 어떻게 핸들링되는지 살펴보겠습니다. 
예를 들어 비동기 I/O 에 대한 로직을 살펴볼까요(아래의 예제는 간략화된 것입니다):

```kotlin
// asynchronously read into `buf`, and when done run the lambda
inChannel.read(buf) {
    // this lambda is executed when the reading completes
    bytesRead ->
    ...
    ...
    process(buf, bytesRead)
    
    // asynchronously write from `buf`, and when done run the lambda
    outChannel.write(buf) {
        // this lambda is executed when the writing completes
        ...
        ...
        outFile.close()          
    }
}
```

이 예제에서, 콜백 안에 콜백이 있다는 점에 주목해보겠습니다. 이미 많은 보일러플레이트를 생략했음에도, 들여쓰기가 매번 늘어나며 
그럴수록 많은 문제가 생길 수 있음을 예상할 수 있을 것입니다("callback hell" 이라고 구글링해보면 얼마나 많은 사람들이 JavaScript 에서 고통받는지 살펴볼 수 있습니다).

이러한 계산은 코루틴을 사용하여 조금 더 직관적으로 표현될 수 있습니다(기존 I/O API를 코루틴 요구사항에 맞게 조정하는 라이브러리가 있다면요):

```kotlin
launch {
    // suspend while asynchronously reading
    val bytesRead = inChannel.aRead(buf) 
    // we only get to this line when reading completes
    ...
    ...
    process(buf, bytesRead)
    // suspend while asynchronously writing   
    outChannel.aWrite(buf)
    // we only get to this line when writing completes  
    ...
    ...
    outFile.close()
}
```

`aRead()` 와 `aWrite()` 함수는 특수한 *정지 함수*입니다 -- 이들은 어떤 일련의 실행을 *정지*할 수 있으며, 자신의 작업이 끝나면 재개시킬 수 있습니다.
물론, 이러한 *정지*는 그것이 실행되는 스레드를 막는다(blocking)는 의미가 아닙니다.
`aRead()` 함수 뒤의 모든 로직과 `aWrite()` 뒤의 로직이 각각 모두 콜백에 감싸져있던 것을 생각하면, 
처음 제시했던 코드와 비교했을 때 동일한 흐름이지만 더 직관적입니다.

이것이 아주 일반적인 경우로써의 코루틴에 대한 명확한 목적입니다. 이 예제에서 `launch {}`, `aRead()`, `aWrite()` 는 
그저 코루틴을 사용하기 위한 **라이브러리 내의 함수**입니다. `launch` 는 *코루틴을 만드는 빌더*로 코루틴을 만들고 실행하며, `aRead()` 와 `aWrite()` 는 
암시적으로 *지속자*을 수신하는 특수한 *정지 함수*입니다(*지속자는 단순한 제너릭 콜백입니다*).

> `launch{}` 에 대한 예제는 [코루틴 빌더](#코루틴-빌더) 영역에, `.aRead()` 에 대한 예제는 [콜백 감싸기](#콜백-감싸기) 영역에서 기술합니다.

게다가 명시적으로 전달되는 콜백은 반복문 안에서 작업하기 까다롭지만, 코루틴을 사용하면 굉장히 평범한 형태로 작성될 수 있습니다:

```kotlin
launch {
    while (true) {
        // suspend while asynchronously reading
        val bytesRead = inFile.aRead(buf)
        // continue when the reading is done
        if (bytesRead == -1) break
        ...
        process(buf, bytesRead)
        // suspend while asynchronously writing
        outFile.aWrite(buf) 
        // continue when the writing is done
        ...
    }
}
```

이런 형태라면 예외를 처리하는것도 조금 더 간편하겠지요.

### Futures

비동기 계산을 표현하기 위한 또다른 형태도 있습니다. Promises 나 Deferreds 라고도 알려진 Futures 가 그것인데, 
예를 들어 어떤 이미지에 오버레이를 입히는 아래의 가상 API 를 한 번 생각해볼까요:

```kotlin
val future = runAfterBoth(
    loadImageAsync("...original..."), // creates a Future 
    loadImageAsync("...overlay...")   // creates a Future
) {
    original, overlay ->
    ...
    applyOverlay(original, overlay)
}
```

코루틴을 사용하면, 아래처럼 다시 작성될 수 있습니다:

```kotlin
val future = future {
    val original = loadImageAsync("...original...") // creates a Future
    val overlay = loadImageAsync("...overlay...")   // creates a Future
    ...
    // suspend while awaiting the loading of the images
    // then run `applyOverlay(...)` when they are both loaded
    applyOverlay(original.await(), overlay.await())
}
```

> `future{}` 에 대한 예제는 [future 만들기](#future-만들기) 영역에, `.await()` 에 대한 예제는 [정지 함수](#정지-함수) 영역에서 기술합니다.

마찬가지로, 조금 더 적은 들여쓰기로 구성되며 로직이 더 자연스럽게 흐릅니다(이 예제에서는 보여지지 않았지만 에러에 대한 핸들링까지도).
또한, 이러한 Future 를 사용하기 위해 C# 이나 JS 등에서 쓰이는 `await` 나 `async` 같은 어떠한 특별한 키워드도 사용되지 않았습니다.
`future {}` 와 `await` 는 그저 어떤 라이브러리의 함수일 뿐입니다.

### Generators

또다른 특수한 코루틴의 사용 케이스는 지연적으로 계산되는 반복적 요소들입니다(C#이나 Python 등의 많은 언어에서 `yield` 로 핸들링되기도 하지요).
이러한 시퀀스들은 순차적인 것처럼 보이는 코드로부터 생성되지만, 그것이 요청되었을 때만 계산됩니다:

```kotlin
// inferred type is Sequence<Int>
val fibonacci = sequence {
    yield(1) // first Fibonacci number
    var cur = 1
    var next = 1
    while (true) {
        yield(next) // next Fibonacci number
        val tmp = cur + next
        cur = next
        next = tmp
    }
}
```

이 코드는 [피보나치 수열](https://en.wikipedia.org/wiki/Fibonacci_number)을 내보내는 지연된 `Sequence` 를 만듭니다.
이 시퀀스는 잠재적으로 무한하지만(마치 [하스켈의 무한 리스트](http://www.techrepublic.com/article/infinite-list-tricks-in-haskell/) 처럼요), `take()` 같은 것을 사용하여 이 중의 몇 개만 사용할 수도 있지요:

```kotlin
println(fibonacci.take(10).joinToString())
```

> 이 코드는 `1, 1, 2, 3, 5, 8, 13, 21, 34, 55` 를 출력합니다. [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/sequence/fibonacci.kt)에서 확인해보실 수 있습니다.

제너레이터들의 강점은 모든 제어 흐름을 모두 사용할 수 있다는 점입니다. 위의 예제에서 보이는 `while` 을 비롯하여, `if`, `try`/`catch`/`finally` 등 다른 모든 것들을요:

```kotlin
val seq = sequence {
    yield(firstItem) // suspension point

    for (item in input) {
        if (!item.isValid()) break // don't generate any more items
        val foo = item.toFoo()
        if (!foo.isGood()) continue
        yield(foo) // suspension point        
    }
    
    try {
        yield(lastItem()) // suspension point
    }
    finally {
        // some finalization code
    }
} 
```

> `sequence{}` 와 `yield()` 에 대한 예제는 [제한된 정지](#제한된-정지) 영역에서 기술합니다.

이러한 접근은 `sequence{}` 나 `yield()` 처럼 `yieldAll(sequence)` 같은 표현을 라이브러리 함수로써 제공할 수 있게 하며,
다른 지연된 시퀀스들을 조합하는 등의 효율적인 구현을 가능하게 합니다.

### 비동기 UI

어떤 UI 어플리케이션들은 모든 UI 작업이 일어나는 이벤트 스레드가 존재합니다. 다른 스레드에서 UI 의 상태를 변경하는 것이
일반적으로는 허용되지 않습니다. 이러한 UI 라이브러리들은 모두 '어떠한 로직을 UI 스레드에서 실행하게끔 하는' 어떤 수단을
제공합니다. 예를 들어 Swing 은 [`SwingUtilities.invokeLater`](https://docs.oracle.com/javase/8/docs/api/javax/swing/SwingUtilities.html#invokeLater-java.lang.Runnable-)를,
JavaFX 는 [`Platform.runLater`](https://docs.oracle.com/javase/8/javafx/api/javafx/application/Platform.html#runLater-java.lang.Runnable-)를,
Android 는 [`Activity.runOnUiThread`](https://developer.android.com/reference/android/app/Activity.html#runOnUiThread(java.lang.Runnable)) 등이 있습니다.
아래는 어떤 Swing 어플레이케이션이 비동기적인 작업을 수행한 뒤 그 결과를 UI 에 표시하는 작업을 나타내고 있습니다:

```kotlin
makeAsyncRequest {
    // this lambda is executed when the async request completes
    result, exception ->
    
    if (exception == null) {
        // display result in UI
        SwingUtilities.invokeLater {
            display(result)   
        }
    } else {
       // process exception
    }
}
```

이 코드는 [비동기 계산](#비동기적인-계산) 에서 봤던 콜백 지옥과 유사합니다. 그러나 코루틴을 사용하면 더 멋진 형태로 
해결할 수 있습니다:

```kotlin
launch(Swing) {
    try {
        // suspend while asynchronously making request
        val result = makeRequest()
        // display result in UI, here Swing context ensures that we always stay in event dispatch thread
        display(result)
    } catch (exception: Throwable) {
        // process exception
    }
}
```

> `Swing` 컨텍스트에 대한 예제는 [지속자 가로채기](#지속자-가로채기) 영역에서 기술합니다.

모든 예외 처리 또한 일반적인 언어측 제어문으로 수행됩니다.

### 다른 사용 케이스들

코루틴은 아래와 같은 더 많은 사용 케이스들을 커버합니다:

{*compact}
- 채널 기반의 동시성(goroutines 나 channels 등의);
- Actor 기반의 동시성;
- 사용자 입력을 요구하는 백그라운드 작업;
- 상호작용 프로토콜: 각 행위자를 상태기계(state machine)이 아닌 sequence 로써 구현;
- 웹 어플리케이션 워크플로우: 사용자를 만들고, 이메일을 검증하고, 접근을 허용하는 등의(정지된 코루틴은 직렬화될 수 있으며 DB에 들어갈 수 있습니다),

## 코루틴 훑어보기

이 영역은 코루틴과 표준 라이브러리를 작성할 수 있게 하는 언어적인 매커니즘에 대한 빠른 훑어보기를 제공합니다.

### 용어 정의

- _코루틴_ -- _정지할 수 있는 계산들의 집합_. 개념상으로 코드 블럭을 가져가고 그들만의 생명주기를 가진다는 점에서 스레드와 비슷하게 *만들어*지고 *시작*되지만,
  이들은 어떠한 특정 스레드 안에 한정되어있지 않습니다. 이들은 어떤 한 스레드에서 그의 실행을 *정지*하고, 그리고 다른 스레드에서 그 *실행*을 재개할 수 있습니다.
  게다가, future 나 promise 와 비슷하게, 어떠한 결과와 함께 *완료*될 수도 있습니다(어떤 값이거나, 예외일 수도 있습니다).

- _정지 함수_ -- `suspend` 수정자로 표기된 함수. 이들은 또다른 정지 함수의 호출을 통해, 자신의 스레드를 막지 않고
  실행을 *정지*할 수 있습니다. 이러한 정지 함수는 일반적인 코드 흐름에서 호출될 수 없으며, 다른 정지 함수나 정지 람다 안에서만 호출될 수 있습니다.
  예를 들어, [사용 케이스](#사용-케이스)에서 소개된 `.await()` 나 `yield()` 들이 라이브러리에 정의될 수도 있는 정지함수들입니다.
  표준 라이브러리는 다른 모든 정지 함수들을 구현할 수 있는 수단으로써의 정지 함수들을 제공합니다.

- _정지 람다_ -- 코루틴 안쪽에서 실행되어야 하는 코드 블럭. 일반적인 [람다 표현](/docs/lambdas.md)과 똑같이 생겼지만,
  그의 함수 타입이 `suspend` 수정자로 표기됩니다. 일반적인 람다 표현이 익명의 로컬 함수인 것과 동일하게, 정지 람다 또한 정지하는 익명 함수입니다.
  그러므로 마찬가지로 어떠한 다른 정지 함수의 호출을 통하여 그의 스레드를 막지 않고 실행을 정지할 수 있습니다. 예를 들어,
  [사용 케이스](#사용-케이스)에서 소개된 `launch`, `future`, `sequence` 등에 뒤따르는 블럭이 정지 람다입니다.
  
  > 일반적인 람다들은 [비지역적 리턴](/docs/inline-functions.md#비지역적-리턴)이 허용되는 한 정지 함수를 그들의 몸체
  > 내부에서 호출할 수 있습니다. 즉, [`apply{}` 블럭](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/apply.html) 같은 것들 안에서 
  > 정지함수를 호출하는 것이 허용되지만, `noinline` 이나 `crossinline` 람다 안에서는 불가능합니다. 즉, *정지*는 
  > 비지역적 제어 이전으로 취급됩니다.

- _정지 함수 타입_ -- 정지 함수와 정지 람다들의 타입입니다. 일반적인 [함수 타입](/docs/lambdas.md#함수-타입)과 동일하지만,
  `suspend` 수정자와 함께합니다. 예를 들어, `suspend () -> Int` 는 인수 없이 `Int` 를 리턴하는 정지 함수입니다.
  `suspend fun foo(): Int` 로 선언되는 함수가 이러한 타입을 가집니다.

- _코루틴 빌더_ -- 정지 람다를 인수로 받는 함수로, 코루틴을 만들고 선택적으로 그를 제어하기 위한 어떠한 형태의 오브젝트를 리턴합니다.
  예를 들어, [사용 케이스](#사용-케이스)에서 소개된 `launch{}`, `future{}`, `sequence{}` 가 코루틴 빌더입니다.
  표준 라이브러리는 다른 모든 도구화된 코루틴 빌더들을 구현할 수 있도록 가장 기반이 되는 코루틴 빌더들을 제공합니다.

  > 몇몇 언어들에는 그들의 코루틴이 어떻게 생성/시작되고 그 결과가 어떻게 표현될지에 대해 하드코딩된 지원이 존재합니다.
  > 예를 들어, `generate` *키워드*는 코루틴을 정의하고 어떤 반복 가능한 오브젝트를 리턴할 수도 있고, 
  > `async` *키워드*는 코루틴을 정의하고 promise 나 task 를 표현하는 오브젝트를 리턴할 수도 있겠지요.
  > Kotlin 은 코루틴을 시작하기 위한 키워드나 수정자가 없습니다. 코루틴 빌더들은 라이브러리에 포함되는 하나의 함수일 뿐입니다.
  > 함수의 몸체와 같은 형태를 가지는 여러 다른 언어들에서의 코루틴 정의는, Kotlin 에서는 라이브러리의 사용 케이스에 맞는 코루틴 빌더가 사용된, 몸체가 표현식인 일반적인 함수로 작성될 것입니다:
  > ```kotlin
  > fun doSomethingAsync() = async { ... }
  > ```

- _정지 포인트_ -- 코루틴 내의, 그의 실행 중에 _정지할 수도 있는_ 어떤 시점입니다. 
  구문적으로는 정지 포인트가 어떤 정지 함수의 호출 시점을 나타내지만, *실제*로 정지가 일어나는 시점은 표준 라이브러리가 제공하는
  원초적인 정지함수들의 호출 시점입니다.

- _지속자_ -- 어떤 정지 포인트에서 그 정지된 코루틴의 상태입니다. 개념적으로는 이 정지 포인트가 지난 이후의 나머지 실행들을 표현합니다.
  예를 들어:
  ```kotlin
  sequence {
      for (i in 1..10) yield(i * i)
      println("over")
  }
  ```
  위의 예제에서, 정지 함수인 `yield()`를 호출할 때마다 코루틴이 정지합니다. 이 때 *나머지 실행*들이 지속자로 표현되며, 즉
  총 10개의 지속자를 위의 예제에서 확인할 수 있습니다: 첫 지속자가 `i = 2`의 루프를 실행하고 정지하고, 두 번째 지속자가 `i = 3`의 루프를 실행하고 정지하는 식이며
  가장 마지막의 지속자는 "over" 를 출력하고 코루틴을 종료합니다. 만약 *생성*되기만 하고 아직 *시작*되지 않은 코루틴은 
  `Continuation<Unit>` 타입을 가지는 *초기 지속자*로 표현되며 그의 모든 실행을 포함합니다.

위에서도 언급했듯, 코루틴의 목표중 하나는 유연성입니다: 기존에 존재하는 많은 비동기 API 와 기타 사용 케이스들을 지원하고자 하며, 
또한 컴파일러에 하드코딩되는 부분을 최소화해야합니다. 결과적으로 컴파일러에는 정지 함수, 정지 람다, 그에 따른 정지 함수 타입에 대한 지원 책임만을 돌려야 합니다. 
그리고 몇몇개의 기반적인 수단만이 표준 라이브러리에 포함되어야 하며 나머지는 어플리케이션 라이브러리가 구현하도록 남겨야 합니다.

### 지속자 인터페이스

제너릭 콜백 하나를 표현하는, 표준 라이브러리의 `kotlin.coroutines` 에 정의되는 [`Continuation`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-continuation/index.html) 인터페이스 정의는 아래와 같습니다.

```kotlin
interface Continuation<in T> {
   val context: CoroutineContext
   fun resumeWith(result: Result<T>)
}
```

`context` 와 관련한 내용은 [코루틴 컨텍스트](#코루틴-컨텍스트) 영역에서 다루며 사용자가 정의한 코루틴과 관련한 아무(어떤 종류던) 배경을 표현합니다.
`resumeWith` 함수는 _completion_ 콜백으로써 코루틴의 결과로 성공(+값)이나 실패(+예외) 중 하나를 보고하기 위해 사용됩니다.

이와 관련하여 두 개의 편의 익스텐션이 동일한 표준 라이브러리에서 제공됩니다:

```kotlin
fun <T> Continuation<T>.resume(value: T)
fun <T> Continuation<T>.resumeWithException(exception: Throwable)
```

### 정지 함수

`.await()` 같은 전형적인 정지함수의 구현은 아래와 같습니다:

```kotlin
suspend fun <T> CompletableFuture<T>.await(): T =
    suspendCoroutine<T> { cont: Continuation<T> ->
        whenComplete { result, exception ->
            if (exception == null) // the future has been completed normally
                cont.resume(result)
            else // the future has completed with an exception
                cont.resumeWithException(exception)
        }
    }
```

{>tip}
> 이 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/future/await.kt)에서 확인해보실 수 있습니다.

> 이 예제는 만약 이 CompletableFuture 가 완료되지 않는다면 영원히 코루틴을 정지합니다. 실제 표준 라이브러리의 구현은 취소를 지원합니다.

`suspend` 수정자는 이 함수가 그의 실행을 정지할 수 있음을 나타냅니다. 위의 예제에서 보이는 함수는 `CompletableFuture<T>` 의 [익스텐션](/docs/extensions.md)으로써 
이 함수의 사용이 좌측에서 우측으로 자연스럽게 읽히도록 합니다:

```kotlin
doSomethingAsync(...).await()
```

`suspend` 수정자는 아무 함수들에서나 사용할 수 있습니다: 최상위 레벨 함수, 확장 함수, 멤버 함수, 로컬 함수, 연산자 함수들에서까지요.

> 프로퍼티의 getter 와 setter, 생성자, 일부 연산자 함수(`getValue`, `setValue`, `provideDelegate`, `get`, `set`, `equals`)들은 
> `suspend` 수정자를 가질 수 없습니다. 이러한 제한들은 미래에 사라질 수도 있습니다.

정지 함수들은 일반적인 함수들처럼 호출될 수 있지만, 실제로 실행을 정지하기 위해서는 반드시 어떤 다른 정지함수 안에서 호출되어야 합니다.
특히, 이 `await` 함수의 구현은 표준 라이브러리 [kotlin.coroutines](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/suspend-coroutine.html)의 최상위 레벨에서 제공하는 정지 함수인 [`suspendCoroutine`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/suspend-coroutine.html)를 호출합니다:

```kotlin
suspend fun <T> suspendCoroutine(block: (Continuation<T>) -> Unit): T
```

`suspendCoroutine` 함수가 코루틴 내에서 불리면(물론 정지함수이므로 코루틴 안에서*밖에* 불릴 수 없습니다), 그의
실행 상태를 캡쳐하여 새 지속자 인스턴스에 전달한 후 그것을 `block` 에 인수로 전달합니다. 이 코루틴의 실행을 재개하려면
block 에서 `continuation.resumeWith()`(를 직접 호출하거나 `continuation.resume()` 혹은 `continuation.resumeWithException()` 를 호출하거나)를 
이 스레드나 또는 다른 스레드에서 이후의 어떤 시점에 호출합니다. *실제*로 코루틴의 정지는 `resumeWith` 없이 block 가 리턴될 때 일어납니다.
만약 block 이 리턴되기 전에 지속자가 재개되었다면, 이 코루틴은 정지된 적이 없는 것으로 간주되고 실행이 계속됩니다.

`continuation.resumeWith()` 에 전달된 결과가 곧 `suspendCoroutine` 호출의 결과가 되며, 즉 `.await()` 의 결과가 됩니다.

하나의 지속자에 대해 두 번 이상 재개하는 것은 허용되지 않으며, `IllegalStateException` 을 발생시킵니다.

> 이것이 Kotlin 과 다른 함수형 언어(Scheme 나 Haskell 같은)들에서의 지속자 간의 차이점입니다. 한 번만 재개 가능하도록
> 설계한 것은 단순히 어떤 [사용 케이스](#사용-케이스)에서도 여러 번 재개 가능한 지속자가 필요하지 않았기 때문이지만, 이러한 지속자들도
> 별도의 라이브러리에서 저수준의 [코루틴의 내부용 API](#코루틴의-내부용-API)을 통해 코루틴을 정지하고 지속자에 캡쳐된 코루틴의 상태를 복제한 뒤,
> 다시 재개하도록 추가 구현할 수도 있습니다.

### 코루틴 빌더

정지 함수들은 일반 함수 안에서 호출될 수 없기 때문에, 표준 라이브러리는 비-정지 스코프에서 코루틴을 시작하기 위한 함수를 제공합니다.
아래는 간단한 `launch{}` *코루틴 빌더*의 구현입니다:

```kotlin
fun launch(context: CoroutineContext = EmptyCoroutineContext, block: suspend () -> Unit) =
    block.startCoroutine(Continuation(context) { result ->
        result.onFailure { exception ->
            val currentThread = Thread.currentThread()
            currentThread.uncaughtExceptionHandler.uncaughtException(currentThread, exception)
        }
    })
```

{>tip}
> [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/run/launch.kt) 에서 이 코드를 확인해볼 수 있습니다.

이 구현은, 주어지는 `context` 를 사용해 `Continuation` 인터페이스를 구현하기 위해 kotlin.coroutines 에서 제공하는 단축어인 [`Continuation(context) { ... }`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-continuation.html) 함수를 사용합니다.

이 지속자는 마찬가지로 kotlin.coroutines 에서 제공하는 [`block.startCoroutine(...)`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/start-coroutine.html) 익스텐션으로 *완료 지속자*로써 전달됩니다.

코루틴의 완료는 그의 완료 지속자의 호출을 수반합니다. `resumeWith` 함수가 코루틴이 성공이나 실패로 *완료*되면 호출됩니다.
`launch` 는 실행하고 잊어버리는 코루틴을 만드므로, 사용되는 정지함수의 리턴 타입이 `Unit` 이며 실제로 `resume` 함수에서도 무시됩니다.
만약 코루틴이 예외와 함께 완료되면, 현 스레드의 처리되지 않은 예외 핸들러가 이를 보고하기 위해 사용됩니다.

> 이 예제는 `Unit` 을 리턴하며 만들어지는 코루틴에 대한 어떠한 접근 수단도 제공하지 않습니다.
> 실제 [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 라이브러리에서의 구현은 생성되는 코루틴을 제어하거나 취소할 수 있는 `Job` 인터페이스의 인스턴스를 리턴하기 때문에 조금 더 복잡합니다.

`startCoroutine` 은 현재 스레드에서 코루틴을 생성하고 그 즉시 시작하여(아래 인용 참고), 첫 정지 포인트까지 실행한 뒤, 리턴합니다.
정지 포인트는 코루틴 몸체 내의 몇몇 [정지 함수](#정지-함수)들의 호출 시점이며, 실행 재개를 어떻게 할지를 정의하는 해당 정지함수 아래쪽의 모든 코드입니다.

> context 로부터 제공되는 지속자 인터셉터는 [뒤쪽](#지속자-가로채기)에서 따로 다루며, 
> 이들은 초기 지속자를 포함하여 코루틴의 실행을 다른 스레드로 파견할 수도 있습니다.

### 코루틴 컨텍스트

코루틴 컨텍스트는 코루틴과 관계된 사용자 정의 오브젝트들의 집합입니다. 이륻은 코루틴의 이름과 식별자부터 스레딩 정책, 로깅, 
코루틴 실행 사이의 보안과 트랜잭션 영향들까지도 표현할 수 있습니다. 코루틴과 그들의 컨텍스트라는 모델에 대해 간단한 예시가 있습니다.
코루틴을 가벼운 스레드라고 한 번 생각해볼까요. 이 경우에서, 코루틴 컨텍스트는 스레드 로컬 변수들과 같습니다. 다만 
스레드 로컬 변수는 변경 가능하지만, 코루틴 컨텍스트는 변경 불가능합니다. 이들은 크게 중대한 제한은 아닌데, 왜냐하면 코루틴은
매우 가벼워서 컨텍스트의 변경이 필요하면 그냥 새 것을 만들어서 시작할 수 있기 때문입니다.

표준 라이브러리는 어떠한 컨텍스트 요소도 따로 구현하고 있지 않습니다. 그러나 물론 그들의 기반이 되는 인터페이스와 추상 클래스들은
포함하며, 그럼으로서 다른 라이브러리 내에서 구성 가능한 형태로, 같은 컨텍스트 내에서 서로 다른 요소들이 공존할 수 있게 합니다.

개념적으로, 코루틴 컨텍스트는 인덱싱된 요소들의 집합입니다. 즉, 모든 각 요소는 유일한 키가 있으며 집합과 맵의 혼합입니다.
각 요소들은 유일한 키를 가지지만, 집합과 더 유사하게 요소 자체와 연관됩니다. 표준 라이브러리는 `kotlin.coroutines` 패키지에 최소한의 [`CoroutineContext`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/index.html)
인터페이스를 정의합니다:

```kotlin
interface CoroutineContext {
    operator fun <E : Element> get(key: Key<E>): E?
    fun <R> fold(initial: R, operation: (R, Element) -> R): R
    operator fun plus(context: CoroutineContext): CoroutineContext
    fun minusKey(key: Key<*>): CoroutineContext

    interface Element : CoroutineContext {
        val key: Key<*>
    }

    interface Key<E : Element>
}
```

`CoroutineContext` 는 그 자신에 대해 4개의 코어 연산들을 제공합니다:

{*compact}

- [`get`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/get.html) 연산자는 
  키를 통해 타입에 안전하게 컨텍스트 요소에 접근할 수 있게 합니다. [Kotlin 연산자 오버로딩](/docs/operator-overloading.md) 문서에 기술된 것 처럼
  `[...]` 표기법을 사용할 수 있습니다.
- [`fold`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/fold.html) 함수는
  표준 라이브러리의 [`Collection.fold`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/fold.html) 확장처럼 동작하며, 모든 컨텍스트 내의 요소들을 순회할 수 있습니다.
- [`plus`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/plus.html) 연산자는
  표준 라이브러리의 [`Set.plus`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/plus.html) 확장처럼 동작하며, 
  더하기 연산자의 오른쪽에 있는 요소를 왼쪽의 동일한 키에 대치하여 리턴합니다.
- [`minusKey`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/minus-key.html) 함수는
  전달되는 키가 존재하지 않는 컨텍스트를 리턴합니다.

코루틴 컨텍스트의 [`Element`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-coroutine-context/-element/index.html)는 그 자체로 컨텍스트입니다.
이는 이 요소 자체만을 의미하는 싱글턴 컨텍스트입니다. 이러한 구현은 여러 라이브러리들의 컨텍스트 요소 구현과 `+` 연산자를 사용하여 합성 컨텍스트의 생성을 허용합니다.
예를 들어, 어떤 한 라이브러리가 사용자 인증 정보를 포함하는 `auth` 요소를 정의하고, 다른 어떤 라이브러리에서 어떤 실행 컨텍스트 정보를 포함하는 `threadPool` 오브젝트를 정의하고 있다면, 
우리는 `launch{}` [코루틴 빌더](#코루틴-빌더)를 조합된 코루틴 컨텍스트를 사용하여 `launch(auth + threadPool) { ... }` 처럼 작성할 수 있습니다.

> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 는 코루틴의 실행을 몇 개의 백그라운드 스레드 풀에 파견하는 `Dispatchers.Default` 과 같은 몇몇 컨텍스트 요소를 이미 제공합니다.

표준 라이브러리는 [`EmptyCoroutineContext`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-empty-coroutine-context/index.html) 라는 
아무런 요소도 없는 `CoroutineContext` 인스턴스를 제공합니다.

모든 서드파티 컨텍스트 요소들은 표준 라이브러리(`kotlin.coroutines`)가 제공하는 [`AbstractCoroutineContextElement`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-abstract-coroutine-context-element/index.html) 를 
확장하는 것이 좋습니다. 아래의 스타일이 라이브러리가 정의하는 컨텍스트 요소에 추천됩니다. 
이 예제는 사용자 이름을 포함하는 가상의 인증 컨텍스트를 표현하고 있습니다:

```kotlin
class AuthUser(val name: String) : AbstractCoroutineContextElement(AuthUser) {
    companion object Key : CoroutineContext.Key<AuthUser>
}
```

{>tip}
> 이 예제는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/context/auth.kt) 에서 확인할 수 있습니다.

컨텍스트의 `Key` 를 동반 오브젝트로 정의하는 것은 컨텍스트로부터 해당 컨텍스트 요소에 접근에 용이하게 합니다.
아래는 정지 함수 내에서 사용자의 이름을 확인하는 가상의 구현 예제입니다:

```kotlin
suspend fun doSomething() {
    val currentUser = coroutineContext[AuthUser]?.name ?: throw SecurityException("unauthorized")
    // do something user-specific
}
```

이 예제에서는 정지함수 내에서 현재 코루틴의 컨텍스트를 가져올 수 있는 `kotlin.coroutines`의 [`coroutineContext`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/coroutine-context.html) 를
사용하고 있습니다.

### 지속자 가로채기

[비동기 UI](#비동기-ui) 사용 케이스를 다시 떠올려보겠습니다. 여러 정지 함수들이 코루틴의 재개를 아무 스레드에서나 하는 것에 반하게,
비동기적인 UI 어플리케이션들은 코루틴 내 코드가 항상 UI 스레드에서 실행됨을 보장해야합니다. 이 문제는 *지속자 인터셉터*를 사용하여 해결할 수 있습니다.
이 이야기를 본격적으로 시작하기에 앞서, 우리는 코루틴의 생명주기를 완전히 이해해야합니다. 아래의 [`launch{}`](https://github.com/Kotlin/KEEP/blob/master/proposals/coroutines.md#coroutine-builders) 코루틴 빌더를
사용하는 코드 스니펫을 살펴볼까요.

```kotlin
launch(Swing) {
    initialCode() // execution of initial code
    f1.await() // suspension point #1
    block1() // execution #1
    f2.await() // suspension point #2
    block2() // execution #2
}
```

코루틴이 `initialCode` 의 실행과 함께 첫 정지 포인트까지 시작됩니다. 정지 포인트에 도달하면, 일단 정지되고 정지 함수에 
작성된 대로 나중의 어느 시점에 `block1` 을 실행하기 위해 재개됩니다. 그러고 나서 다시 정지하며, `block2` 를 실행하기 위해 재개될 것이고, 그러고 나면 완전히 *완료*됩니다.

지속자 인터셉터는 어떤 지속자가 재개될 때 그것을 가로채 `initialCode`, `block1`, `block2` 각각에 상응하는 실행을 감쌀 수 있는 기회가 주어집니다.
코루틴의 초기 코드는 그의 *초기 지속자*의 재개로 취급됩니다. 표준 라이브러리는 `kotlin.coroutines` 패키지를 통해 
[`ContinuationInterceptor`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines/-continuation-interceptor/index.html) 를
제공합니다.

```kotlin
interface ContinuationInterceptor : CoroutineContext.Element {
    companion object Key : CoroutineContext.Key<ContinuationInterceptor>
    fun <T> interceptContinuation(continuation: Continuation<T>): Continuation<T>
    fun releaseInterceptedContinuation(continuation: Continuation<*>)
}
```

`interceptContinuation` 함수가 코루틴의 지속자를 감쌉니다. 언제든 코루틴이 정지되면, 코루틴 프레임워크가 아래의 코드를 사용하여
후속 재개에 사용되는 실제 `continuation`을 감싸도록 합니다:

```kotlin
val intercepted = continuation.context[ContinuationInterceptor]?.interceptContinuation(continuation) ?: continuation
```

코루틴 프레임워크는 각 지속자 인스턴스에 대한 결과 지속자를 캐싱하며, 이들이 더이상 필요하지 않게 되면 `releaseInterceptedContinuation(intercepted)` 를 호출합니다.
더 자세한 사항은 [구현 상세](#구현-상세) 영역을 확인해보세요.

> `await` 같은 일부 정지 함수들은 코루틴의 실행을 정지할 수도, 정지하지 않을 수도 있습니다. 예를 들어, [정지 함수](#정지-함수) 영역에서
> 보여지는 `await` 의 구현은 future 가 이미 완료되었다면 코루틴을 정지하지 않습니다(곧바로 `resume` 을 부르고 실제 정지 없이 실행이 재개되기 때문에).
> 지속자는 실제로 코루틴의 정지가 발생했을 때만 발생하며, 즉 `suspendCoroutine` 의 블럭이 `resume` 호출 없이 리턴했을 때만 발생합니다.

이제 `Swing` 인터셉터의 예제를 살펴볼까요. 이 인터셉터는 자신의 모든 실행을 Swing UI 이벤트 스레드로 파견합니다.
`SwingUtilities.invokeLater` 를 사용해 Swing 이벤트 스레드로 파견하는 `SwingContinuation` 이라는 지속자에 대한 정의로 시작해보겠습니다:

```kotlin
private class SwingContinuation<T>(val cont: Continuation<T>) : Continuation<T> {
    override val context: CoroutineContext = cont.context
    
    override fun resumeWith(result: Result<T>) {
        SwingUtilities.invokeLater { cont.resumeWith(result) }
    }
}
```

그리고 `Swing` 이라는 오브젝트를 정의하여, 만든 지속자를 제공할 컨텍스트 요소를 `ContinuationInterceptor` 와 함께 구현합니다:

```kotlin
object Swing : AbstractCoroutineContextElement(ContinuationInterceptor), ContinuationInterceptor {
    override fun <T> interceptContinuation(continuation: Continuation<T>): Continuation<T> =
        SwingContinuation(continuation)
}
```

{>tip}
> [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/context/swing.kt) 에서 이 코드를 확인해볼 수 있습니다.

> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 패키지의 실제 `Swing` 오브젝트 구현은 
> 현재 실행중인 코루틴 및 스레드의 이름을 표시하는 등의 디버깅 요소들도 포함되어 있습니다.

이제, 우리는 `Swing` 오브젝트와 `launch{}` [코루틴 빌더](#코루틴-빌더)를 사용하여 완전하게 Swing 이벤트 스레드에서 동작하도록
할 수 있습니다.

> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 패키지 내 `Swing` 컨텍스트의 실제 구현은 시간과 통합되어있고 및 디버깅 요소들로 인해 더 복잡합니다.


### 제한된 정지

[제너레이터](#generators) 사용 케이스에서, `sequence{}` 와 `yield()` 는 서로 다른 종류의 구현이 필요합니다.
아래는 `sequence{}` 코루틴 빌더의 예제 구현을 나타내고 있습니다:

```kotlin
fun <T> sequence(block: suspend SequenceScope<T>.() -> Unit): Sequence<T> = Sequence {
    SequenceCoroutine<T>().apply {
        nextStep = block.createCoroutine(receiver = this, completion = this)
    }
}
```

이 예제에서는 [코루틴 빌더](#코루틴-빌더) 영역에서 잠깐 나왔던 `startCoroutine`과 비슷한, 표준 라이브러리의 `createCoroutine` 이라는 또다른 기반을 사용하고 있습니다.
그러나 이는 코루틴을 _만들기만_ 할 뿐, 그것을 *시작*하지는 않습니다. 대신, 그의 *초기 지속자*를 `Continuation<Unit>` 의 레퍼런스로써 리턴합니다.

```kotlin
fun <T> (suspend () -> T).createCoroutine(completion: Continuation<T>): Continuation<Unit>
fun <R, T> (suspend R.() -> T).createCoroutine(receiver: R, completion: Continuation<T>): Continuation<Unit>
```

이 빌더에서 사용되는 정지 람다 `block` 이 다른 것들과 가지는 또다른 차이점은, 그것이 `SequenceScope<T>` 수신자를 받는
[익스텐션 람다](/docs/lambdas.md#수신자를-갖는-함수-리터럴)라는 점입니다. `SequenceScope` 인터페이스는 제너레이터 블럭을 위한 *범위*를 제공하며,
라이브러리에 아래처럼 정의되어 있습니다:

```kotlin
interface SequenceScope<in T> {
    suspend fun yield(value: T)
}
```

여러 오브젝트가 생성되는 것을 막기 위해, `sequence{}` 는 `SequenceScope<T>` 를 확장 구현하는 `SequenceCoroutine<T>` 를 정의하며, 이는 또한
`Continuation<Unit>` 도 확장 구현하여 그것이 `createCoroutine` 함수의 `receiver` 이자 `completion` 일 수 있게 합니다.
간단한 `SequenceCoroutine<T>` 의 구현은 아래와 같습니다:

```kotlin
private class SequenceCoroutine<T>: AbstractIterator<T>(), SequenceScope<T>, Continuation<Unit> {
    lateinit var nextStep: Continuation<Unit>

    // AbstractIterator implementation
    override fun computeNext() { nextStep.resume(Unit) }

    // Completion continuation implementation
    override val context: CoroutineContext get() = EmptyCoroutineContext

    override fun resumeWith(result: Result<Unit>) {
        result.getOrThrow() // bail out on error
        done()
    }

    // Generator implementation
    override suspend fun yield(value: T) {
        setNext(value)
        return suspendCoroutine { cont -> nextStep = cont }
    }
}
```

{>tip}
> 이 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/sequence/sequence.kt) 에서 확인해보실 수 있습니다.

> 표준 라이브러리는 `kotlin.sequences` 내의 [`sequence`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/sequence.html)함수의 구현에 
> [`yieldAll`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/-sequence-scope/yield-all.html) 를 비롯한 내부적인 최적화를 함께 제공합니다.

> 실제 `sequence` 코드는 실험적인 `BuilderInference` 기능을 사용합니다. 이는 [제너레이터](#generators) 영역에서
> 제시한 바가 있는 `fibonacci` 의 구현이 보여주듯, 시퀀스의 타입 파라미터 T 를 직접 제시하지 않고 `yield` 의 호출로부터
> 유추하도록 합니다.

`yield` 의 구현은 `suspendCoroutine` [정지 함수](#정지-함수)를 사용하여 코루틴을 정지시키고, 그의 지속자를 캡쳐합니다.
그렇게 캡쳐된 지속자는 `nextStep` 에 저장되며, `computeNext` 가 불릴 때 재개됩니다.

그러나, 위에서 보이는 `sequence{}` 와 `yield()` 는 아무 정지 함수에서나 사용되어 그들의 지속자를 캡쳐할 수 있지는 않아야 합니다.
이들은 *동기적*으로 사용됩니다. 즉, 지속자가 캡쳐되는 시점, 저장되는 위치, 재개되는 시점에 대한 절대적인 제어가 필요하기 때문에,
그들에 대한 *정지 범위*는 *제한*되어야 합니다. 이러한 기능은 `@RestrictsSuspension` 어노테이션으로부터 제공되며, 
범위를 제공하는 클래스나 인터페이스에 배치할 수 있습니다. 위의 예제에서는 `SequenceScope`가 그것입니다:

```kotlin
@RestrictsSuspension
interface SequenceScope<in T> {
    suspend fun yield(value: T)
}
```

이 어노테이션은 그것의 영향을 받는 정지 함수에 `sequence{}` 를 비롯한 기타 동기적인 코루틴 빌더에서만 사용할 수 있도록
제한합니다. 더해서, 다른 *제한된 정지 범위*를 가지는 클래스나 인터페이스를 수신자로 받는 확장 정지 람다, 확장 정지 함수는
*제한된 정지 함수*라고 부릅니다. 이런 제한된 정지 함수는 그 인스턴스의 멤버나 그것을 확장하는 익스텐션 정지 함수만을 사용할 수 있습니다.

즉, 해당 범위 내의 `SequenceScope` 를 확장하는 람다는 `suspendCoroutine` 을 비롯한 다른 일반적인 정지 함수를
사용할 수 없음을 의미합니다. `sequnce` 의 코루틴을 정지하려면, 반드시 `SequenceScope.yield` 를 호출해야합니다.
단, `yield` 는 그 자신이 `SequenceScope` 의 멤버이므로 아무런 제한이 없습니다(*확장* 정지 람다와 함수들만 제한됩니다).

제한된 클래스나 인터페이스들 자체가 컨텍스트로 제공되는 `sequence` 같은 제한된 코루틴 빌더들에는 아무 컨텍스트나 넣어도 될 것 처럼 보이지만,
이런 제한된 코루틴들은 반드시 `EmptyCoroutineContext` 를 사용해야합니다. `SequenceCoroutine` 의 `context` 도 그것을 리턴하고 있으며,
`EmptyCoroutineContext` 외의 다른 컨텍스트를 사용하여 제한된 코루틴을 생성하려고 하면 `IllegalArgumentException` 이 발생합니다.

---

{&^---}

어떤 클래스나 인터페이스에 대해 `@RestrictedSuspension` 어노테이션을 붙히면, 아래와 같은 제한이 적용됩니다:

{*compact}
- 해당 어노테이션이 영향을 주는 모든 정지 함수(멤버, 익스텐션)와 익스텐션 람다는 해당 스코프의 안쪽으로 제한된 코루틴에서만 불릴 수 있습니다.
- 해당 클래스나 인터페이스에 대한 확장 함수나 확장 람다는 그것이 확장되는 인스턴스와 동일한 것이 제공하는 정지 함수가 아니면 호출할 수 없습니다.

아래 코드를 확인해보세요:

```kotlin_error_20_21_24_33_34_35
@RestrictsSuspension
class AnyScope {
    suspend fun member() {
        // 멤버 함수 안에서는 아무 제한이 없습니다.
        other()
        extensionFunction()
        delay(100)
    }
}

suspend fun AnyScope.other() { }

suspend fun AnyScope.extensionFunction() {
    // 이 함수(extensionFunction)가 확장하는 
    // 동일한 인스턴스가 제공하는 멤버나 확장이므로 사용할 수 있습니다.
    this.member()
    this.other()
    
    // 이 함수(extensionFunction)가 확장하는 것과
    // 다른 인스턴스의 멤버나 확장이므로 사용할 수 없습니다.
    AnyScope().member()
    AnyScope().other()
    
    // 멤버나 익스텐션이 아닌 정지 함수이므로 사용할 수 없습니다.
    delay(100)
}

suspend fun normalSuspendFunction() {
    // 일반적인 정지 함수 호출입니다.
    delay(100)

    // 이 함수(normalSuspendFunction)가 호출되는 스코프는 제한되지 않았으므로
    // AnyScope 내의 어떤 정지함수도 호출할 수 없습니다.
    AnyScope().member()
    AnyScope().other()
    AnyScope().extensionFunction()
}
```

{&$---}

## 구현 상세

이 영역에서는 코루틴의 실제 구현 상세에 대한 일견을 제공합니다. 아래의 내용들은 [코루틴 훑어보기](#코루틴-훑어보기)에서 
소개되지 않고 블랙박스 안으로 숨겨져 있으며, 이들이 만드는 내부적인 클래스들이나 코드 생성 전략 등은 그들이 공식 API 나
ABI 들을 변경하게 하지 않는 이상 언제든 변경될 수 있습니다.

### 지속자 전달 스타일

정지 함수들은 지속자 전달 스타일(Continuation-Passing-Style, CPS)을 통해 구현됩니다. 모든 정지 함수들과 정지 람다들은
호출될 때 추가적인 `Continuation` 인수가 암시적으로 전달됩니다. [`await` 정지 함수](#정지-함수)의 선언은 아래처럼 생겼었는데:

```kotlin
suspend fun <T> CompletableFuture<T>.await(): T
```

*CPS 변환*을 거친 실제 *구현*은 아래와 같은 형태가 됩니다:

```kotlin
fun <T> CompletableFuture<T>.await(continuation: Continuation<T>): Any?
```

함수의 리턴 타입이 지속자의 타입 파라미터로 이동했으며, 실 구현의 `Any?` 는 이 정지 함수의 동작을 나타내기 위한 것으로 
디자인되었습니다. 만약 정지 함수가 코루틴을 *정지*하면, 이는 특별한 마커인 `COROUTINE_SUSPENDED`(상세한 내용은
[코루틴의 내부용 API](#코루틴의-내부용-API) 영역을 확인해보세요) 를 리턴합니다. 만약 정지 함수가 코루틴을 정지하지 않는다면,
그의 리턴값을 그대로 리턴하거나 발생한 예외를 그대로 전파합니다. 이 방식에서, `await` 함수의 `Any?` 로 표현되는 실제
리턴 타입은 `COROUTINE_SUSPENDED` 이거나 `T` 이지만, 이는 Kotlin 의 타입 시스템으로는 표현할 수 없습니다.

정지 함수의 실제 구현에서는, 지속자를 직접 호출하는 것이 허용되지 않습니다. 만약 이러한 지속자 호출이 중첩될 수 있다면
복잡하거나 길게 실행되는 코루틴에서 스택오버플로우를 발생시킬 수 있기 때문입니다. 표준 라이브러리의 `suspendCoroutine` 은
지속자의 호출을 추적하여 언제, 어떻게 지속자가 호출되더라도 정지 함수의 실제 구현에 문제가 없도록 보장함으로써 
어플리케이션 개발자로부터 이러한 복잡성을 숨기고 있습니다.

### 상태 머신

코루틴을 효율적으로 구현하는 것은 매우 중요합니다. 그렇기에, 가능한 한 적은 클래스와 오브젝트들을 만들어야 합니다.
많은 언어들이 이들을 구현할 때 *상태 머신*을 사용하며, Kotlin 도 그렇습니다. Kotlin 의 경우 이 접근을 따르면, 
컴파일러는 내부에 여러 정지 포인트를 가질 수 있는 정지 블럭 하나에, 그에 상응하는 단 하나의 클래스만이 생성합니다.

전제: 정지 함수 하나가 하나의 상태 머신으로 컴파일되고, 그의 상태 각각이 정지 함수의 각 정지 포인트에 대응됩니다.
예를 들어 아래와 같이 두 개의 정지 포인트를 가지는 정지 블럭을 살펴볼까요:

```kotlin 
val a = a()
val y = foo(a).await() // suspension point #1
b()
val z = bar(a, y).await() // suspension point #2
c(z)
```

이 코드에는 총 3개의 상태가 있습니다:

{*compact}
- 초기(어떤 정지도 수행되기 전)
- 첫 정지포인트 이후
- 두 번째 정지포인트 이후

매 상태는 이 블럭 내의 지속자들 중 하나의 진입점이 됩니다(초기 지속자는 가장 첫 라인으로부터 시작됩니다).

이 코드는 상태 머신을 확장 구현하는 익명 클래스로 컴파일되고, 이 상태 머신의 현 상태를 가지는 필드와 상태들 사이에서
공유될 블럭 내 로컬 변수 들을 저장하는 필드로 구성됩니다(코루틴의 클로저에 해당하는 필드도 있을 수 있지만, 이 경우에는 
없습니다). 아래는, 지속자 전달 스타일을 사용하는 `await` 함수의 여러 호출들을 나타내는 의사-Java 코드입니다:

```java
class <anonymous_for_state_machine> extends SuspendLambda<...> {
    // The current state of the state machine
    int label = 0
    
    // local variables of the coroutine
    A a = null
    Y y = null
    
    void resumeWith(Object result) {
        if (label == 0) goto L0
        if (label == 1) goto L1
        if (label == 2) goto L2
        else throw IllegalStateException()
        
      L0:
        // result is expected to be `null` at this invocation
        a = a()
        label = 1
        result = foo(a).await(this) // 'this' is passed as a continuation 
        if (result == COROUTINE_SUSPENDED) return // return if await had suspended execution
      L1:
        // external code has resumed this coroutine passing the result of .await() 
        y = (Y) result
        b()
        label = 2
        result = bar(a, y).await(this) // 'this' is passed as a continuation
        if (result == COROUTINE_SUSPENDED) return // return if await had suspended execution
      L2:
        // external code has resumed this coroutine passing the result of .await()
        Z z = (Z) result
        c(z)
        label = -1 // No more steps are allowed
        return
    }          
}
```

`goto` 연산자와 라벨이 있는 이유는 이 예제가 소스코드 레벨이 아닌 바이트코드 레벨에서 발생하는 일을 묘사하고 있기 때문입니다.

이제, 코루틴이 처음 시작되면, `resumeWith()` 이 호출되고 `label` 은 `0`입니다. 그러므로 `L0` 으로 건너 뛰고, 
어떤 작업을 한 뒤, `label` 을 `1`로 설정합니다. 그 뒤에 `.await()` 을 호출하고, 코루틴이 정지되어 리턴합니다.
이후 코루틴을 재개할 준비가 되었을 때, 다시 `resumeWith()` 를 호출하고 곧바로 `L1` 으로 뛰며, 상태가 `2`가 되며, 
다시 정지되어 리턴합니다. 다음 번에는 `L3` 부터 계속하며 상태가 `-1`로 떨어지고 "더이상의 작업이 없다"를 의미하게 됩니다.

반복 안의 정지 포인트는 단 하나의 상태만 추가되는데, 반복 또한 (조건적인) `goto` 로 구성되기 때문입니다:

```kotlin
var x = 0
while (x < 10) {
    x += nextNumber().await()
}
```

위의 코드는 아래처럼 생성합니다:

```java
class <anonymous_for_state_machine> extends SuspendLambda<...> {
    // The current state of the state machine
    int label = 0
    
    // local variables of the coroutine
    int x
    
    void resumeWith(Object result) {
        if (label == 0) goto L0
        if (label == 1) goto L1
        else throw IllegalStateException()
        
      L0:
        x = 0
      LOOP:
        if (x >= 10) goto END
        label = 1
        result = nextNumber().await(this) // 'this' is passed as a continuation 
        if (result == COROUTINE_SUSPENDED) return // return if await had suspended execution
      L1:
        // external code has resumed this coroutine passing the result of .await()
        x += ((Integer) result).intValue()
        label = -1
        goto LOOP
      END:
        label = -1 // No more steps are allowed
        return 
    }          
}    
```

### 정지 함수의 컴파일

컴파일된 정지 함수의 실제 코드는 다른 정지 함수를 언제, 어떻게 호출하느냐에 따라 달라집니다. 가장 단순하다면 
어떤 정지 함수가 다른 정지 함수를 가장 마지막 오퍼레이션으로만 호출하여 끝단 호출이 일어나는 경우입니다.
이 경우는 [정지 함수](#정지-함수) 영역과 [콜백 감싸기](#콜백-감싸기) 영역에서 확인할 수 있는 특별한 형태의
정지 함수로서 저수준의 동기화 기반이 구현되거나, 콜백 함수로 감싸집니다. 이러한 함수들은 `suspendCoroutine` 같은
다른 정지 함수를 끝단 위치에서 호출합니다. 이런 함수들은 자신이 [CPS 변환](#지속자-전달-스타일)으로부터 받은 지속자가
다른 정지 함수의 끝단 정지 함수로 전달되지 않는 한 일반적인 비-정지 함수처럼 컴파일됩니다.

끝단이 아닌 위치에서 정지 함수의 호출이 존재하면, 컴파일러는 그 함수에 맞는 [상태 머신](#상태-머신)을 생성합니다.
그 상태 머신의 오브젝트 인스턴스는 실제 정지 함수의 호출이 일어나면 생성되며, 완료되면 삭제됩니다.

> 미래의 버전에서는 컴파일 전략이 상태 머신의 인스턴스를 가장 첫 정지 포인트에서만 생성하도록 더 최적화될 수도 있습니다.

이 상태 머신의 오브젝트는 차례로 *완료 지속자*로써 다음 비-끝단 정지 함수의 호출에 전달됩니다. 이 상태 머신 인스턴스는
함수가 다른 한 정지 함수를 여러 번 호출할 경우 업데이트되어 재사용됩니다. 이러한 점을 매 비동기 실행마다 분리되어 새로 할당되는 
클로저 기반의 다른 [비동기 프로그래밍 스타일](#비동기-프로그래밍-스타일)들과 비교해보세요.


### 코루틴의 내부용 API

Kotlin 표준 라이브러리는 `kotlin.coroutines.intrinsics` 패키지를 통해, 이 영역에서 설명하는 사용에 주의가 필요한
일부 코루틴의 내부적인 구현 상세와 매커니즘을 노출합니다. 일반적인 코드에서는 사용하지 않아도 되기 때문에, `kotlin.coroutines.intrinsics`
패키지는 IDE 의 자동완성 시스템에서 제외되어있습니다. 이 패키지의 선언들을 사용하려면 소스파일에 직접 아래의 문장을 추가해야 합니다:

```kotlin
import kotlin.coroutines.intrinsics.*
```

표준 라이브러리 안쪽 `suspendCoroutine` 정지 함수의 실제 구현은 `Kotlin` 으로 작성되었으며 그 소스 코드는 표준 라이브러리
소스 패키지의 일부로서 확인할 수 있습니다. 이 함수는, 코루틴의 안전한 사용을 위해 코루틴이 정지할 때마다 상태 머신에 대응하는 지속자를
추가적인 오브젝트로 감쌉니다. 이러한 내용은 일반적인 [비동기 계산](#비동기적인-계산)이나 [Futures](#futures) 사용 케이스들에는 
전혀 문제가 없습니다. 이것은 상응하는 비동기적 기반체의 런타임 비용이 추가적인 오브젝트 할당 비용보다 훨씬 크기 때문인데, 
[제너레이터](#generators) 사용 케이스에서는 이 상황이 역전됩니다. 그래서 이 패키지가 성능에 민감한 저수준의 코드를 제공합니다.

표준 라이브러리의 `kotlin.coroutines.intrinsics` 패키지에는 아래와 같은 형태를 가지는 
[`suspendCoroutineUninterceptedOrReturn`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines.intrinsics/suspend-coroutine-unintercepted-or-return.html)
이라는 이름의 함수가 있습니다:

```kotlin
suspend fun <T> suspendCoroutineUninterceptedOrReturn(block: (Continuation<T>) -> Any?): T
```

이 함수는 정지 함수의 `CPS`에 직접적인 접근을 허용하며, _가로채지지 않은_ 지속자의 레퍼런스를 노출합니다. 가로채지지 않았다는 의미는
[`ContinuationInterceptor`](#지속자-가로채기) 를 통하지 않는다는 의미입니다. 이러한 지속자는 
[제한적으로 정지](#제한된-정지)된 상황에서 동기적인 코루틴을 작성할 때(이런 상황일 때는 컨텍스트가 항상 비어있으므로), 
혹은 현재 실행되는 스레드가 이미 의도된 컨텍스트 안에 있음을 확신할 수 있을 때 사용할 수 있습니다. 
그렇지 않다면, [`intercepted`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines.intrinsics/intercepted.html) 확장 함수를 통해 가로채진 지속자를 반드시 획득해야합니다:

```kotlin
fun <T> Continuation<T>.intercepted(): Continuation<T>
```

그런 뒤에 가로채진 `Continuation` 의 `Continuation.resumeWith`를 호출해야합니다.

이제, `suspendCoroutineUninterceptedOrReturn`에 전달된 `block`은 코루틴이 정지하여(`Continuation.resumeWith` 가 이후 어느 시점에 단 한번만 불릴 때)
[`COROUTINE_SUSPENDED`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines.intrinsics/-c-o-r-o-u-t-i-n-e_-s-u-s-p-e-n-d-e-d.html)
마커를 리턴하거나, 혹은 그의 리턴 값 `T` 를 바로 리턴하거나 예외를 발생시켜야 합니다(두 경우 모두 `Continuation.resumeWith` 이 한 번도 불리지 않을 때).

`suspendCoroutineUninterceptedOrReturn` 함수를 사용할 때 위의 규칙을 따르지 않으면 테스트를 통해 재현하거나
추적하기 굉장히 어려운 버그를 만듭니다. 이러한 규칙은 `buildSequence`/`yield` 스타일의 코루틴들에서는 일반적으로 지키기 어렵지 않습니다.
그러나 비동기적인 `await` 스타일의 정지함수를 `suspendCoroutineUninterceptedOrReturn` 위에 작성하는 것은 
`suspendCoroutine` 의 도움 없이는 **굉장히 어렵기** 때문에 **비권장**됩니다.

이 패키지에는 아래의 형태를 가지는
[`createCoroutineUnintercepted`](http://kotlinlang.org/api/latest/jvm/stdlib/kotlin.coroutines.intrinsics/create-coroutine-unintercepted.html) 
라는 함수도 있습니다:

```kotlin
fun <T> (suspend () -> T).createCoroutineUnintercepted(completion: Continuation<T>): Continuation<Unit>
fun <R, T> (suspend R.() -> T).createCoroutineUnintercepted(receiver: R, completion: Continuation<T>): Continuation<Unit>
```

`createCoroutine` 과 비슷하게 동작하지만, 가로채지지 않은 초기 지속자의 레퍼런스를 리턴합니다. `suspendCoroutineUninterceptedOrReturn` 과
비슷하게 동기적인 코루틴 내에서 더 나은 성능을 위해 사용할 수 있습니다.

예를 들어, `createCoroutineUnintercepted` 를 사용하여 `sequence{}` 빌더를 조금 더 최적화할 수 있습니다:

```kotlin
fun <T> sequence(block: suspend SequenceScope<T>.() -> Unit): Sequence<T> = Sequence {
    SequenceCoroutine<T>().apply {
        nextStep = block.createCoroutineUnintercepted(receiver = this, completion = this)
    }
}
```

`suspendCoroutineUninterceptedOrReturn` 를 사용하여 `yield` 를 최적화하면 아래와 같아집니다. 이 경우에서,
`yield` 는 항상 정지하므로 블럭은 항상 `COROUTINE_SUSPENDED` 를 리턴합니다.

```kotlin
// Generator implementation
override suspend fun yield(value: T) {
    setNext(value)
    return suspendCoroutineUninterceptedOrReturn { cont ->
        nextStep = cont
        COROUTINE_SUSPENDED
    }
}
```

{>tip}
> 전체 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/sequence/optimized/sequenceOptimized.kt)에서 확인할 수 있습니다.

`startCoroutineUninterceptedOrReturn` 라고 불리는 `startCoroutine`([코루틴 빌더](#코루틴-빌더)에서 확인할 수 있는) 의
저수준 버전도 `kotlin.coroutines.intrinsics` 패키지에 추가적으로 제공됩니다:

```kotlin
fun <T> (suspend () -> T).startCoroutineUninterceptedOrReturn(completion: Continuation<T>): Any?
fun <R, T> (suspend R.() -> T).startCoroutineUninterceptedOrReturn(receiver: R, completion: Continuation<T>): Any?
```

이들은 `startCoroutine` 과 두 가지 측면에서 다릅니다. 한 가지는 [ContinuationInterceptor](#지속자-가로채기)
가 코루틴을 시작할 때 기본적으로 사용되지 않으므로, 필요하다면 호출자가 자신이 적절한 컨텍스트 위에 있음을 보장해야합니다.
또 한 가지는 코루틴이 정지하지 않았으면서 어떤 값을 리턴했거나 예외를 발생시켰다면 `startCoroutineUninterceptedOrReturn`
의 결과로 리턴한 값을 그대로 리턴하거나, 발생한 예외를 그대로 던집니다. 만약 코루틴이 정지했다면, `COROUTINE_SUSPENDED` 를 리턴합니다.

`startCoroutineUninterceptedOrReturn`의 주된 사용 케이스는 `suspendCoroutineUninterceptedOrReturn` 와
조합하여 같은 정지된 코루틴의 컨텍스트에서 재개하고 싶으나 다른 블럭의 코드 안에서 그래야할 경우입니다.

## 부록

이 영역은 어떤 새로운 언어적인 구조나 라이브러리 함수를 제시하지 않는 비-규범적 내용을 다루며, 몇몇 리소스 관리, 동시성, 
코드 스타일 등과 관련된 더 넓은 사용케이스 들에 대한 예제를 비롯한 추가적인 주제들에 대해 다룹니다.

### 리소스 관리와 GC

코루틴 그 자체는 off-힙 스토리지를 사용하거나 네이티브 리소스를 차지하지 않습니다. 적어도 코루틴 내부에서 그러한 파일이나 리소스를 열지 않는 한에는요.
코루틴 내부에서 연 파일과 같은 것들은 반드시 어떻게든 닫혀야 하지만, 코루틴 자체는 따로 정리될 필요가 없습니다.
코루틴이 정지하면, 그 지속자에 대한 레퍼런스를 통해 모든 상태가 보존됩니다. 그러므로 이 코루틴에 대한 지속자의 레퍼런스를 
잃어버리면, 최종적으로 이는 가비지 컬렉터에게 수집됩니다.

닫을 필요가 있는 리소스를 여는 코루틴을 사용할 때는 특별히 주의해야합니다. [제한된 정지](#제한된-정지) 영역의 
예제에서 잠시 나왔던, `sequence{}` 빌더를 사용하여 파일의 각 라인을 생산하는 아래의 예제를 살펴볼까요:

```kotlin
fun sequenceOfLines(fileName: String) = sequence<String> {
    BufferedReader(FileReader(fileName)).use {
        while (true) {
            yield(it.readLine() ?: break)
        }
    }
}
```

이 함수는 `Sequence<String>` 을 리턴하며 일반적인 방법으로 어떤 파일의 모든 라인들을 출력하는데 사용할 수 있습니다:

```kotlin
sequenceOfLines("https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/sequence/sequenceOfLines.kt")
    .forEach(::println)
```

{>tip}
> 전체 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/sequence/sequenceOfLines.kt) 에서 확인하실 수 있습니다.

이 코드는 `sequenceOfLines` 함수가 리턴한 시퀀스를 전부 순회하였으므로, 의도한 대로 동작합니다. 그러나 여기에서 만약 첫
몇 개의 라인만 출력하려고 한다면 어떨지 생각해보겠습니다:

```kotlin
sequenceOfLines("https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/sequence/sequenceOfLines.kt")
        .take(3)
        .forEach(::println)
```

그러면 코루틴은 첫 세 줄을 출력하는 과정에서 몇 번 정도 재개되고, 그 이후에는 _버려집니다_. 코루틴 자체가 버려지는 것은 
상관이 없으나, 열린 파일에 대해서는 아닙니다. 예제에서 보이는 [`use` 함수](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.io/use.html)는
전달되는 블럭의 실행을 완료하지 못하며, 그러므로 파일을 닫지도 못합니다. 그래서 GC 에 의해 수집되어 Java의 모든 파일에
존재하여 파일을 닫도록 하는 `finalizer`가 동작할 때까지 그 파일은 계속 열린 채로 남습니다.
이러한 점은 작거나 짧게 실행되는 프로그램들에는 크게 문제가 없지만, 멀티 기가바이트 힙을 가지는 큰 백엔드 
시스템들에게는 버려지는 파일 핸들로 인한 GC 트리거로 큰 재앙이 될 것입니다. 

이런 점은 라인들의 스트림을 생성하는 Java 의 [`Files.lines`](https://docs.oracle.com/javase/8/docs/api/java/nio/file/Files.html#lines-java.nio.file.Path-) 
함수와도 비슷합니다. 이 함수는 닫을 수 있는 Java 의 스트림을 리턴하는데, 대부분의 스트림 연산은 상응하는 `Stream.close`
를 따로 호출하지 않으며 사용자에게 닫을 필요가 있다는 것을 상기하게끔 합니다. Kotlin 에서 닫을 수 있는 시퀀스 제너레이터를 구현할 수도
있겠지만, 언어적으로 이러한 제너레이터들이 올바르게 닫히도록 보장할 수 없다는 문제가 비슷하게 발생합니다. Kotlin 의 코루틴에서
이러한 자동화된 리소스 관리에 대해 구현하는 것은 명백하게 범위 바깥의 행위입니다.

그러나, 일반적으로 이러한 문제들은 코루틴의 비동기 사용 케이스들에 영향을 주지 않습니다. 비동기 코루틴은 절대 버려지지 않고 그것이
완료될 때까지 동작하며, 정상적으로 완료된다면 코드 내의 로직이 정상적으로 리소스를 닫을 것이기 때문입니다.

### 동시성과 스레드

각각의 코루틴들은 스레드와 비슷하게 순차적으로 동작합니다. 즉, 코루틴 내의 아래와 같은 오퍼레이션은 완전히 안전함을 의미합니다:

```kotlin
launch { // starts a coroutine
    val m = mutableMapOf<String, String>()
    val v1 = someAsyncTask1() // start some async task
    val v2 = someAsyncTask2() // start some async task
    m["k1"] = v1.await() // map modification waiting on await
    m["k2"] = v2.await() // map modification waiting on await
}
```

모든 싱글 스레드에서 변경 가능한 일반적인 구조들을 특정 코루틴 안쪽의 범위에서 사용할 수 있습니다. 그러나, 이런 변경 가능한 상태를
서로 다른 코루틴 _사이에서_ 공유하면 잠재적으로 위험할 수 있습니다. 만약 코루틴 빌더가 '모든 코루틴을 
JS 스타일의 하나의 이벤트 파견 스레드에서 재개하도록 하는 파견자([지속자 가로채기](#지속자-가로채기) 영역의 Swing 인터셉터가 보이는 것과 비슷한)'를 사용한다면
일반적으로 그 하나의 스레드에서 모든 작업이 이루어지므로 공유된 오브젝트들을 사용하는 것이 크게 문제가 없습니다.
그러나 멀티 스레드 환경이나 여러 코루틴이 서로 다른 스레드에 파견될 수 있는 모든 환경에서는 이러한 공유된 상태를 사용하려면
스레드 안정성이 보장되는(동시적인) 데이터 구조를 사용해야 합니다.

이러한 배경에서 코루틴은 스레드와 비슷하며, 심지어 이들은 더 가볍습니다. 우리는 수백만 개의 코루틴을 단 몇 개의 스레드에서
모두 돌릴 수 있습니다. 동작중인 코루틴은 반드시 어떠한 스레드 안에서 실행됩니다. 그러나, _정지된_ 코루틴은 어떠한 스레드도
소비하지 않으며, 어떤 스레드의 경계 안에도 포함되어있지 않습니다. 이러한 코루틴을 재개하도록 하는 정지 함수가 
`Continuation.resumeWith` 의 호출을 통해 어느 스레드에서 재개될지를 결정하며, 코루틴의 지속자 인터셉텨가 이러한
결정을 재정의하여 코루틴의 실행을 다른 스레드로 파견할 수 있습니다.

### 비동기 프로그래밍 스타일

비동기 프로그래밍에는 몇 가지 서로 다른 스타일들이 있습니다.

콜백은 [비동기적인 계산](#비동기적인-계산) 영역에서도 다루었듯 일반적으로 가장 불편한 스타일이며, 그렇기 때문에 코루틴이
그것을 대체하도록 디자인되었습니다. 모든 콜백 스타일의 API는 [여기](#콜백-감싸기)에서도 서술하듯 그에 대응하는 정지함수로 감쌀 수 있습니다.

반복해봅시다. 예를 들어, 아래의 형태를 갖고, 다른 실행을 _막는_ `sendEmail` 함수로부터 시작해볼까요:

```kotlin
fun sendEmail(emailArgs: EmailArgs): EmailResult
```

이 함수는 자신이 실행되는 스레드를 막으며 잠재적으로 긴 시간동안 수행될 가능성이 있습니다.

이러한 함수를 블로킹하지 않게 만드려면, 예를 들어 선에러 형태의 [node.js 의 콜백 규약](https://www.tutorialspoint.com/nodejs/nodejs_callbacks_concept.htm)
을 사용하여 그의 블로킹하지 않는 버전을 아래 처럼 콜백 형태로 표현할 수 있습니다:

```kotlin
fun sendEmail(emailArgs: EmailArgs, callback: (Throwable?, EmailResult?) -> Unit)
```

그러나, 코루틴은 다른 스타일의 비동기이면서 블로킹하지 않는 프로그래밍 스타일을 사용할 수 있게 합니다. 그 중 하나가
다른 저명한 프로그래밍 언어들에서 지원되는 async/await 스타일입니다. Kotlin 에서는 이러한 스타일이 [Futures](#futures) 영역에서 보이듯 
`future{}` 와`.await()` 에 의해 동일하게 지원됩니다.

이러한 스타일은 콜백을 함수로 가져가는 대신 어떠한 형태의 '미래' 오브젝트를 리턴하도록 규약함으로써 그 의미를 가집니다.
이러한 async-스타일의 `sendEmail` 함수 형태는 아래와 같습니다:

```kotlin
fun sendEmailAsync(emailArgs: EmailArgs): Future<EmailResult>
```

이러한 함수의 이름 뒤에 `Async` 를 붙히는 것이 좋은 습관이며, 이는 함수의 파라미터가 블로킹하는 일반적인 함수들과 차이가 없고
쉽게 그 비동기성에 대한 내용을 잊도록 하기 때문에 그렇습니다. `sendEmailAsync` 함수는 _동시적이면서_ 비동기적인 동작을
시작하며, 잠재적으로 모든 동시성과 관련된 함정들을 그대로 적용합니다. 그러나, 많은 언어들이 이러한 스타일의 프로그래밍에 
`await` 과 비슷한 어떤 기능도 제공하여 순차적인 흐름에 적용될 수 있도록 합니다.

Kotlin 의 _네이티브_ 프로그래밍 스타일은 정지 함수에 기반합니다. 이러한 스타일에서는, `sendEmail` 함수는 일반적인 형태로
표현되며, 파라미터나 리턴 타입에 추가적인 것이 없지만 `suspend` 수정자가 앞에 붙습니다:

```kotlin
suspend fun sendEmail(emailArgs: EmailArgs): EmailResult
```

async 스타일과 정지하는 스타일은 지금까지 나왔던 기능들을 사용해 상호간에 쉽게 변환될 수 있습니다. 예를 들어, 
`sendEmailAsync` 함수는 정지하는 `sendEmail` 함수로 [`future` 코루틴 빌더](#future-만들기)를 사용하여 
변환될 수 있는데:

```kotlin
fun sendEmailAsync(emailArgs: EmailArgs): Future<EmailResult> = future {
    sendEmail(emailArgs)
}
```

정지하는 `sendEmail` 또한 `sendEmailAsync` 의 [`.await()` 정지 함수](#정지-함수) 를 통해 구현될 수 있습니다.

```kotlin
suspend fun sendEmail(emailArgs: EmailArgs): EmailResult = 
    sendEmailAsync(emailArgs).await()
```

그러므로 어떻게 보면 이 두 스타일은 서로 동일하며 둘 모두 콜백 스타일보다 편의성 면에서 훨씬 우수합니다.
그렇지만 `sendEmailAsync` 와 정지하는 `sendEmail` 사이의 차이점을 조금 더 깊게 살펴보겠습니다.

첫번째로, 그들이 어떻게 **구성**되는지를 먼저 살펴보겠습니다. 정지함수는 그냥 일반적인 함수 처럼 구성되는데:

```kotlin
suspend fun largerBusinessProcess() {
    // a lot of code here, then somewhere inside
    sendEmail(emailArgs)
    // something else goes on after that
}
```

이에 대응하는 async-스타일의 함수는 아래처럼 구성됩니다:

```kotlin
fun largerBusinessProcessAsync() = future {
   // a lot of code here, then somewhere inside
   sendEmailAsync(emailArgs).await()
   // something else goes on after that
}
```

관찰해보면, async 스타일의 함수 구성은 약간 장황하며, 오류가 발생하기 쉽습니다. 
async 스타일 함수에의 예제에서 만약 `.await()` 를 빼먹더라도, 코드는 그대로 문제없이 컴파일되고 실행되지만, 그렇게 되면
이메일 전송 프로세스가 비동기적이고 심지어는 *동시적*으로 실행되어 나머지 아래쪽의 큰 비즈니스 로직과 병행되며, 이러한 동작은
어떤 공유 상태를 변경하여 재현하기 굉장히 어려운 오류를 만들어낼 수도 있습니다.
반면에, 정지 함수들은 *기본적으로 순차적*입니다. 정지 함수를 사용하면, 어떠한 동시성이 필요한 상황일 때 소스코드에
`future{}` 를 비롯한 기타 비슷한 코루틴 빌더를 사용하여 그것을 명시적으로 표현해야합니다.

이러한 스타일들이 큰 프로젝트나 많은 라이브러리들에서 어떻게 **스케일링**되는지 비교해봅시다. 
Kotlin 에서 정지 함수들은 가볍도록 설계되었습니다. 모든 정지 함수들은 아무 제한되지 않은 Kotlin 의 코루틴 내에서 사용될 수 있습니다.
모든 Promise 나 Future 프레임워크들은 그들만의 `async` 스타일 함수를 정의해야하며 그의 리턴으로 그들만의 상응하는 클래스를 돌려줘야 하고,
또 그들만의 `await` 관련 함수도 만들어줘야 하겠지요.

그들의 **퍼포먼스**도 비교해볼까요. 정지 함수는 그의 호출에 최소화된 오버헤드만이 동반됩니다. [구현 상세](#구현-상세) 영역을 확인해보세요.
async-스타일의 함수는 꽤 무거울 수 있는 `Promise` 와 `Future` 관련 추상화가 정지와 관련된 매커니즘에 추가적으로 필요하며, 
몇몇 Future 오브젝트들은 반드시 async-스타일의 함수의 리턴으로부터 항상 리턴받아야 하며 이러한 형태는 함수가 굉장히 짧거나
간단하더라도 최적화될 수가 없습니다. async-스타일은 세밀하게 조정된 분해에 대해 잘 맞지는 않습니다.

마지막으로 JVM/JS 코드와의 **상호운용성**까지 비교해봅시다. async-스타일의 함수가 그들에 상응하는 Future 와 비슷한 추상화를 사용하는 
JVM/JS 코드와 더 쉽게 상호운용되기는 합니다. Java 나 JS 에서 그들은 단순히 Future와 비슷한 무언가를 리턴하는 함수입니다.
정지 함수는 [지속자 전달 스타일](#지속자-전달-스타일)을 지원하지 않는 다른 언어들의 입장에서 보면 굉장히 이상해보이기도 합니다.
그러나, 위의 예제에서 보이듯 정지 함수는 주어지는 Future 와 비슷한 무언가를 사용해 쉽게 일반 async-스타일의 함수로 변환됩니다.
그러므로, Kotlin 에서 정지 함수를 한 번만 작성하고, 단 한 줄의 코드로 다른 여러 Future/Promise 를 사용하는 환경에서의 
스타일로 `future{}` 를 비롯한 코루틴 빌더 함수를 사용해 변환할 수 있습니다.

### 콜백 감싸기

많은 비동기 API 들은 콜백 스타일의 인터페이스를 가지고 있습니다. 표준 라이브러리의 `suspendCoroutine` 정지 함수([정지 함수](#정지-함수) 영역을 살펴보세요)가 이러한 
콜백을 Kotlin 의 정지 함수를 감쌀 수 있는 편리한 방법을 제공합니다.

아래와 같은 간단한 형태의 함수를 살펴보겠습니다. 뭔가 긴 연산을 하는 `someLongComputation` 함수가 그 계산의 결과 
`Value` 를 응답받는 콜백 함수 하나를 받는다고 생각해보겠습니다.

```kotlin
fun someLongComputation(params: Params, callback: (Value) -> Unit)
```

이러한 형태의 함수는 아래와 같은 직관적인 코드를 사용하여 정지함수로 변환할 수 있습니다.

```kotlin
suspend fun someLongComputation(params: Params): Value = suspendCoroutine { cont ->
    someLongComputation(params) { cont.resume(it) }
} 
```

이제 이러한 계산의 리턴 타입이 명시적이며, 그럼에도 여전히 비동기적이고 스레드를 막지 않습니다.

> `kotlinx.coroutines` 는 코루틴의 협조적인 취소와 관련한 프레임워크를 포함합니다. 이들은 `suspendCoroutine` 과 비슷한
> `suspendCancellableCoroutine` 함수를 제공하며, 이들은 코루틴의 취소를 지원합니다. 더 자세한 내용은 [취소와 관련된 가이드](/docs/cancellation-and-timeouts.md)를 살펴보세요.

좀 더 복잡한 예제로, [비동기적인 계산](#비동기적인-계산) 영역에서 잠시 살펴보았던 `aRead()` 함수를 상기해보겠습니다.
이들은 Java NIO 에서 제공하는 [`AsynchronousFileChannel`](https://docs.oracle.com/javase/8/docs/api/java/nio/channels/AsynchronousFileChannel.html) 과
그의 [`CompletionHandler`](https://docs.oracle.com/javase/8/docs/api/java/nio/channels/CompletionHandler.html) 콜벡 인터페이스는 아래와 같은 정지하는 익스텐션 함수로 구현될 수 있습니다:

```kotlin
suspend fun AsynchronousFileChannel.aRead(buf: ByteBuffer): Int =
    suspendCoroutine { cont ->
        read(buf, 0L, Unit, object : CompletionHandler<Int, Unit> {
            override fun completed(bytesRead: Int, attachment: Unit) {
                cont.resume(bytesRead)
            }

            override fun failed(exception: Throwable, attachment: Unit) {
                cont.resumeWithException(exception)
            }
        })
    }
```

> 이 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/io/io.kt) 에서 확인해보실 수 있습니다.

{>tip}
> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 의 실제 구현은 길게 실행되는 IO 오퍼레이션을
> 취소할 수 있는 기능도 지원합니다.

만약 우리가 같은 타입의 콜백을 공유하는 많은 양의 함수들과 씨름하고 있다면, 일반적인 래퍼 함수 하나를 추가하여 나머지 모두를
쉽게 정지 함수로 변환할 수 있습니다. 예를 들어, [vert.x](http://vertx.io/) 는 그의 모든 비동기적인 작업에 대해
특정 컨벤션을 사용하여 특정한 `Handler<AsyncResult<T>>` 를 콜백으로 전달받습니다. 이러한 상황에서 아무 vert.x 함수를 코루틴에서 
간결하게 사용하려면 아래의 함수가 정의될 수 있습니다:

```kotlin
inline suspend fun <T> vx(crossinline callback: (Handler<AsyncResult<T>>) -> Unit) = 
    suspendCoroutine<T> { cont ->
        callback(Handler { result: AsyncResult<T> ->
            if (result.succeeded()) {
                cont.resume(result.result())
            } else {
                cont.resumeWithException(result.cause())
            }
        })
    }
```

이 함수를 사용하면, 어떤 vert.x 의 비동기 함수도(`async.foo(params. handler)`가 있다고 생각해보면) 코루틴 내에서 정지하도록 
`vx { async.foo(params, it) }` 처럼 사용될 수 있습니다.

### Future 만들기

[futures](#futures) 사용케이스에서 나타났던 `future{}` 빌더는, [코루틴 빌더](#코루틴-빌더) 영역에서 확인할 수 있는 
`launch{}` 빌더와 비슷하게 Future 나 Promise 관련 기능을 사용하도록 구현될 수 있습니다:

```kotlin
fun <T> future(context: CoroutineContext = CommonPool, block: suspend () -> T): CompletableFuture<T> =
        CompletableFutureCoroutine<T>(context).also { block.startCoroutine(completion = it) }
```

`launch{}` 와 다른 점은 이들은 [`CompletableFuture`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html)의 
구현체를 리턴한다는 점이며, 또다른 차이점은 기본적으로 `CommonPool` 컨텍스트를 사용하여 이들의 기본적인 실행 방식이 
`ForkJoinPool.commonPool` 을 사용하는 `CompletableFuture.supplyAsync` 와 비슷하도록 한다는 점입니다.
`CompletableFutureCoroutine` 의 기초적인 구현은 아래와 같이 꽤 직관적입니다:

```kotlin
class CompletableFutureCoroutine<T>(override val context: CoroutineContext) : CompletableFuture<T>(), Continuation<T> {
    override fun resumeWith(result: Result<T>) {
        result
            .onSuccess { complete(it) }
            .onFailure { completeExceptionally(it) }
    }
}
```

> 이 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/future/future.kt) 에서 
> 확인하실 수 있습니다. 

{>tip}
> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 의 실제 구현은 조금 더 복잡하며,
> 그 이유는 그의 취소를 전파하거나 함수의 결과로 이들을 취소할 수 있는 Future 를 리턴하기 때문입니다.

### 스레드를 막지 않는 Sleep

일반적으로 코루틴들은 스레드를 막아버리는 `Thread.sleep`을 사용하지 않습니다. 그러나, 정지하는 `delay` 함수를 Java 의
[`ScheduledThreadPoolExecutor`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ScheduledThreadPoolExecutor.html)
를 사용하여 구현하는 것은 꽤 간단합니다:

```kotlin
private val executor = Executors.newSingleThreadScheduledExecutor {
    Thread(it, "scheduler").apply { isDaemon = true }
}

suspend fun delay(time: Long, unit: TimeUnit = TimeUnit.MILLISECONDS): Unit = suspendCoroutine { cont ->
    executor.schedule({ cont.resume(Unit) }, time, unit)
}
```

{>tip}
> 전체 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/delay/delay.kt) 에서 확인하실 수 있습니다.

> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 패키지도 `delay` 함수를 제공합니다.

생각해야할 점은, 이러한 종류의 `delay` 함수들은 그것이 사용되는 코루틴을 하나의 "스케쥴러" 스레드에서 제개합니다. 물론 `Swing` 같이
[인터셉터](#지속자-가로채기)를 사용하는 코루틴들은 그 인터셉터가 적절한 스레드로 지속자를 파견하므로 이러한 스케쥴러 스레드에서
실행되지 않을 수도 있지만, 그렇지 않고 아무런 인터셉터가 없는 코루틴들은 이러한 스케쥴러 스레드에서 재개됩니다. 그러므로
이 예시는 어디까지나 예제로서 사용될 때는 편리하지만, 가장 효율적인 대안은 아닙니다. 오히려 이에 대응하는 인터셉터 레벨에서 
sleep 을 구현하는 것이 더 타당합니다.

`Swing` 인터셉터에 대해 구현되는, 스레드를 막지 않는 sleep 함수는 이러한 용도로 만들어진 
[Swing Timer](https://docs.oracle.com/javase/8/docs/api/javax/swing/Timer.html) 를 사용하는 것이
바람직합니다:

```kotlin
suspend fun Swing.delay(millis: Int): Unit = suspendCoroutine { cont ->
    Timer(millis) { cont.resume(Unit) }.apply {
        isRepeats = false
        start()
    }
}
```

{>tip}
> 전체 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/delay/delay.kt) 에서 확인하실 수 있습니다.

> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 가 제공하는 `delay` 도
> 특정 인터셉터에 맞는 sleep 의 구현에 대해 알고 있으며, 주어진 코루틴의 상황에 맞는 것을 자동으로 사용합니다.

### 협조적인 싱글 스레드 멀티태스킹

하나의 스레드에서 협조적으로 동작하는 어플리케이션을 작성하는것은 동시성 및 변경 가능한 공유자원과 관련한 문제에 대해
신경쓰지 않아도 되므로 굉장히 편리합니다. 대표적으로 JS나 Python 등이 그러하며, 이들은 그들만의 협조적인 멀티태스킹 기반이
갖추어져 있습니다.

[코루틴 인터셉터](#지속자-가로채기)는 모든 코루틴을 하나의 스레드에 가둠으로써 이러한 조건을 충족시킬 수 있는 꽤 직관적인 도구를 제공합니다.
[여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/context/threadContext.kt)에서
확인할 수 있는 예제 코드는 `newSingleThreadContext()` 함수를 정의하며, 이는 코루틴 인터셉터의 요구사항을 만족하고 
코루틴을 하나의 스레드에서 동작하도록 하는 서비스를 만듭니다.

이것을 [future 만들기](#future-만들기) 영역에서 정의되었던 `future{}` 코루틴 빌더에서 사용하여 이들이 하나의 스레드에서
동작하면서도 그 두 비동기적인 작업이 모두 활성화되어있음을 확인해보겠습니다.

{>tip}
> 실제로 동작하기 위한 전체 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/context/threadContext-example.kt) 에서 확인하실 수 있습니다.

> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines) 는 이미 그대로 가져다 쓸 수 있는
> `newSingleThreadContext` 구현을 제공합니다.

만약 전체 어플리케이션이 하나의 스레드에서 실행되어도 괜찮다면, 모든 코루틴이 그 스레드에서만 실행되도록 하는 하드코딩된 
컨텍스트를 만들고 그것을 사용하는 코루틴 빌더를 정의하는 것도 괜찮습니다.

## 비동기적인 시퀀스

[제한된 정지](#제한된-정지) 영역에서 제시되었던 `sequence{}` 코루틴 빌더는 _동기적인_ 코루틴의 예시입니다. 이들의 생산자는
소비자가 `Iterator.next()` 를 부르는 순간 같은 스레드의 코루틴 안에서 동기적으로 실행됩니다. `sequence{}` 코루틴 블럭은 
제한되어있으며, 이들은 [콜백 감싸기](#콜백-감싸기) 영역에서 제시된 것들과 같은, 다른 외부 정지 함수를 사용하여 실행을 정지할 수 없습니다.

_비동기적인_ 시퀀스 빌더는 모든 정지와 재개를 허용합니다. 이는 데이터가 아직 준비되지 않았을 때 이들의 소비자가 이런 케이스에
대해 대응할 수 있어야함을 의미합니다. 그리고 이것은 정지 함수의 일반적인 사용 케이스이기도 합니다. 여기에서 일반적인 [`Iterator`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/-iterator/)
인터페이스와 유사하지만 `next()` 와 `hasNext()` 가 정지함수인 `SuspendingIterator` 인터페이스를 정의해볼까요:

```kotlin
interface SuspendingIterator<out T> {
    suspend operator fun hasNext(): Boolean
    suspend operator fun next(): T
}
```

`SuspendingSequence` 의 정의는 일반적인 [`Sequence`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/-sequence/index.html)의
정의와 비슷하지만 `SuspendingIterator` 를 리턴합니다:

```kotlin
interface SuspendingSequence<out T> {
    operator fun iterator(): SuspendingIterator<T>
}
```

그리고 동기적인 시퀀스의 스코프와 비슷하지만 그의 정지가 제한되지 않은 별도의 스코프 인터페이스도 정의해보겠습니다:

```kotlin
interface SuspendingSequenceScope<in T> {
    suspend fun yield(value: T)
}
```

`suspendingSequence{}` 빌더는 동기적인 `sequence{}` 빌더와 비슷합니다. 그들 사이의 차이는 
`SuspendingIteratorCoroutine` 의 상세 구현 차이와, 이 경우에서는 선택적인 코루틴 컨텍스트를 받는 것이 
유의미하다는 점에서 입각합니다:

```kotlin
fun <T> suspendingSequence(
    context: CoroutineContext = EmptyCoroutineContext,
    block: suspend SuspendingSequenceScope<T>.() -> Unit
): SuspendingSequence<T> = object : SuspendingSequence<T> {
    override fun iterator(): SuspendingIterator<T> = suspendingIterator(context, block)
}
```

{>tip}
> 전체 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/suspendingSequence/suspendingSequence.kt) 에서 확인하실 수 있습니다.

> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines)는 같은 컨셉이면서
> 더 유용한 `Channel` 이라는 도구와 `produce{}` 라는 코루틴 빌더를 제공합니다.

[협조적인 싱글 스레드 멀티태스킹](#협조적인-싱글-스레드-멀티태스킹) 영역에서 보였던 `newSingleThreadContext{}`와 
[#스레드를-막지-않는-sleep](#스레드를-막지-않는-sleep) 영역에서 보였던 `delay` 함수를 가져와보겠습니다.
이들을 사용하여 우리는 스레드를 막지 않고 매 500ms 마다 1에서 10 사이의 정수를 내보내는 시퀀스를 구현할 수 있습니다:

```kotlin
val seq = suspendingSequence(context) {
    for (i in 1..10) {
        yield(i)
        delay(500L)
    }
}
```

그러면 소비자 코루틴은 이 시퀀스를 그들만의 페이스로 이 시퀀스를 소비할 수 있으며, 동시에 다른 라이브러리의 모든 정지 함수까지도
사용할 수 있습니다. Kotlin 의 [for 반복문](/docs/control-flow.md#for-loops)이 일반적인 통념대로 동작하므로
언어 레벨에서의 특수한 `await for` 반복 구조가 별도로 필요하지 않습니다. 일반 `for` 함수가 사용해 위에서 우리가 정의했던
비동기 시퀀스를 순회하는데 그대로 사용될 수 있습니다. 생산자가 아무런 값도 가지고있지 않으면 곧바로 정지됩니다:

```kotlin
for (value in seq) { // suspend while waiting for producer
    // do something with value here, may suspend here, too
}
```

> [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/suspendingSequence/suspendingSequence-example.kt) 에서
> 동작을 표현하는 로그가 포함된 전체 코드를 확인할 수 있습니다.


### 채널

Go-스타일의 안정적인 타입을 가지는 채널들은 Kotlin 에서 어떠한 라이브러리로 구현할 수 있습니다.
정지하는 `send` 함수를 가짐으로서, 보낼 수 있는 채널 인터페이스를 정의해볼까요:

```kotlin
interface SendChannel<T> {
    suspend fun send(value: T)
    fun close()
}
```

그리고 [비동기 시퀀스](#비동기적인-시퀀스)와 비슷하게 정지하는 함수인 `receive` 와 `operator iterator` 를 가짐으로서,
받을 수 있는 채널 인터페이스도 정의해 보겠습니다:

```kotlin
interface ReceiveChannel<T> {
    suspend fun receive(): T
    suspend operator fun iterator(): ReceiveIterator<T>
}
```

`Channel<T>` 클래스는 두 인터페이스를 동시에 구현합니다. `send` 는 채널의 버퍼가 가득 차면 정지하며, 
`receive`는 버퍼가 비어있으면 정지합니다. 이러한 방식은 Go-스타일의 코드를 거의 똑같이 Kotlin 으로 복사하여 사용할 수 있게 합니다.
[Go 훑어보기 중 4번째 동시성 예제](https://tour.golang.org/concurrency/4)에서 확인할 수 있는, `n` 개의 피보나치 수열을 보내는 `fibonacci` 함수는 Kotlin 에서 아래처럼 작성됩니다:

```kotlin
suspend fun fibonacci(n: Int, c: SendChannel<Int>) {
    var x = 0
    var y = 1
    for (i in 0..n - 1) {
        c.send(x)
        val next = x + y
        x = y
        y = next
    }
    c.close()
}
```

가벼운 여러 코루틴들을, 그들보다 실제로 무겁기 때문에 몇 개의 고정된 수 만을 가지는 멀티 스레드 풀로 파견하여 코루틴을 시작하는 Go-스타일의 `go{}` 블럭도 별도로 정의할 수 있습니다.
예제 구현은 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/channel/go.kt) 에서
확인할 수 있으며, 이는 Java 의 일반적인 [`ForkJoinPool`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html)에 기반하여
작성되었습니다.

`go` 코루틴 빌더를 사용하여, Go 코드에 상응하는 메인 함수는 아래처럼 작성되며, `mainBlocking` 은 `go{}` 가 사용하는 것과
동일한 풀을 공유할 수 있는 `runBlocking` 의 또다른 버전입니다:

```kotlin
fun main(args: Array<String>) = mainBlocking {
    val c = Channel<Int>(2)
    go { fibonacci(10, c) }
    for (i in c) {
        println(i)
    }
}
```

{>tip}
> 동작하는 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/channel/channel-example-4.kt)에서 확인할 수 있습니다.

또한, 퍼퍼 크기도 자유롭게 늘리거나 줄여볼 수 있습니다. 간단한 예제를 들기 위해 최소 버퍼 크기가 1인 채널(BufferedChannel)만 구현되었는데, 그 이유는
버퍼가 없는 채널은 개념상 이전에 다루었던 [비동기 시퀀스](#비동기적인-시퀀스)와 비슷하기 때문입니다.

어떤 하나의 동작이 가능해질 때까지 정지하는 Go-스타일의 `select` 제어 블럭 또한 Kotlin DSL 을 사용하여 구현될 수 있으며,
결과적으로 [Go 훑어보기 중 5번째 동시성 예제](https://tour.golang.org/concurrency/5)는 Kotlin 에서 
아래와 같이 표현됩니다:

```kotlin
suspend fun fibonacci(c: SendChannel<Int>, quit: ReceiveChannel<Int>) {
    var x = 0
    var y = 1
    whileSelect {
        c.onSend(x) {
            val next = x + y
            x = y
            y = next
            true // continue while loop
        }
        quit.onReceive {
            println("quit")
            false // break while loop
        }
    }
}
```

{^tip}
> 동작하는 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/channel/channel-example-5.kt)
> 에서 확인해볼 수 있습니다.

예제는 Kotlin 의 [`when` 표현](/docs/control-flow.md#when-expression) 과 비슷하게 여러 가지 중 
하나의 결과를 반환하는 `select {...}` 함수와 `while(select<Boolean> { ... })` 와 동일하지만 더 적은 괄호를 사용하는 
`whileSelect { ... }`를 모두 구현하고 있습니다.

[Go 훑어보기 중 6번째 동시성 예제](https://tour.golang.org/concurrency/6)에서 보이는 기본 선택 케이스는 
`select {...}` DSL 에 하나의 케이스만을 더 추가합니다:

```kotlin
fun main(args: Array<String>) = mainBlocking {
    val tick = Time.tick(100)
    val boom = Time.after(500)
    whileSelect {
        tick.onReceive {
            println("tick.")
            true // continue loop
        }
        boom.onReceive {
            println("BOOM!")
            false // break loop
        }
        onDefault {
            println("    .")
            delay(50)
            true // continue loop
        }
    }
}
```

{^tip}
> 동작하는 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/channel/channel-example-6.kt)
> 에서 확인해볼 수 있습니다.

`Time.tick` 와 `Time.after` 는 스레드를 막지 않는 `delay` 와 함께 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/channel/time.kt)에
간단하게 구현되어있습니다.

주석에 링크 및 그에 상응하는 Go 코드를 포함하는 또다른 예시들은 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/channel/)에서 같이 확인할 수 있습니다.

다만, 이 채널에 대한 구현 예제는 그의 내부적인 대기 리스트를 관리하기 위해 단 하나의 Lock 만을 사용합니다. 이는 
동작에 대한 이해를 더 쉽게 만들지만, 이 Lock 아래에서는 어떠한 다른 사용자 코드도 실행되지 않으며 그러므로 완전히 비동기적입니다.
이 Lock은 아주 많은 동시적인 스레드가 사용되는 환경에서 그 확장성을 제한하는 역할만 합니다.

> [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines)의
> 채널 및 `select` 와 관련한 실제 구현은, Lock 에서 자유로우며 서로가 간섭할 수 없는 데이터 구조에 기반합니다.

이 채널 구현은 코루틴 컨텍스트의 인터셉터와 별개입니다. [지속자 가로채기](#지속자-가로채기) 영역에서도 언급했던, 하나의 
이벤트 스레드애 기반하여 코루틴을 파견하는 UI 어플리케이션의 컨텍스트와 사용될 수도 있고, 그와 더불어 다른 인터셉터를 동시에
사용하거나, 혹은 아예 아무런 인터셉터 없이도 사용할 수 있습니다. 아무런 인터셉터 없이 사용한다면 그의 실행 스레드는 코루틴에서
사용된 다른 정지 함수의 환경에 의해 정해질 것입니다.

### 상호배제

확장 가능한 비동기 어플리케이션을 작성한다는 것은, 코드가 절대 스레드를 막아서는 안되며 정지 함수를 사용하여 정지해야 함을 의미합니다.
Java 의 동시성 도구 중 하나인 [`ReentrantLock`](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/ReentrantLock.html)는
스레드를 막으며 그들은 스레드를 막지 않는 코드에서는 일반적으로 사용되면 안됩니다. 공유 자원에 대한 접근을 제한하려면, `Mutex` 클래스를
정의하여 스레드를 막는 대신 코루틴의 실행을 정지하게 할 수 있습니다. 이 클래스의 대략적인 뼈대는 아래와 같을 것입니다:

```kotlin
class Mutex {
    suspend fun lock()
    fun unlock()
}
```

{^tip}
> 전체 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/mutex/mutex.kt) 에서
> 확인하실 수 있습니다.

> 실제 [kotlinx.coroutines](https://github.com/kotlin/kotlinx.coroutines)의 구현은 몇 가지 추가적인
> 기능들이 포함되어 있습니다.

이러한 스레드를 막지 않는 뮤텍스를 사용하면, [Go 훑어보기 중 9번째 동시성 예제](https://tour.golang.org/concurrency/9)는
Kotlin 에서 Go 의 `defer`와 비슷한 의도로 사용할 수 있는 [`try-finally`](/docs/exceptions.md)를 사용하여 아래처럼 변환될 수 있습니다:

```kotlin
class SafeCounter {
    private val v = mutableMapOf<String, Int>()
    private val mux = Mutex()

    suspend fun inc(key: String) {
        mux.lock()
        try { v[key] = v.getOrDefault(key, 0) + 1 }
        finally { mux.unlock() }
    }

    suspend fun get(key: String): Int? {
        mux.lock()
        return try { v[key] }
        finally { mux.unlock() }
    }
}
```

{>tip}
> 실제로 동작하는 코드는 [여기](https://github.com/kotlin/kotlin-coroutines-examples/tree/master/examples/channel/channel-example-9.kt) 에서 확인해볼 수 있습니다.

### 실험적 코루틴으로부터의 마이그레이션

코루틴은 Kotlin 1.1-1.2 버전 사이에서 실험적인 기능이었습니다. 이 버전에서는 상응하는 API 들이 `kotlin.coroutines.experimental` 패키지에
노출되어 있으며, Kotlin 1.3과 그 이후로부터 제공되는 코루틴의 안정 버전은 `kotlin.coroutines` 패키지를 사용합니다.
실험적 패키지는 여전히 표준 라이브러리에 포함되어 있으며 실험적 코루틴과 함께 컴파일된 코드도 이전과 동일하게 동작합니다.

Kotlin 1.3 컴파일러는 실험적인 코루틴이 사용된 라이브러리에 그들이 사용한 것과 상응하는 실험적인 정지함수나 정지 람다를 
전달할 수 있도록 적절한 기능을 지원합니다. 내부적으로는, 실험적인 것과 안정적인 것 사이를 연결하는 어뎁터 코루틴 인터페이스가 따로 생성됩니다.

### 레퍼런스

- 더 읽어보기:
  - [코루틴 사용 설명서](/docs/coroutines-guide.md) **가장 먼저 읽으세요!**
- 발표:
  - [Introduction to Coroutines](https://www.youtube.com/watch?v=_hfBv0a09Jc) (Roman Elizarov, KotlinConf 2017 에서, [발표자료](https://www.slideshare.net/elizarov/introduction-to-coroutines-kotlinconf-2017))
  - [Deep dive into Coroutines](https://www.youtube.com/watch?v=YrrUCSi72E8) (Roman Elizarov, KotlinConf 2017 에서, [발표자료](https://www.slideshare.net/elizarov/deep-dive-into-coroutines-on-jvm-kotlinconf-2017))
  - [Kotlin Coroutines in Practice](https://www.youtube.com/watch?v=a3agLJQ6vt8) (Roman Elizarov, KotlinConf 2018 에서, [발표자료](https://www.slideshare.net/elizarov/kotlin-coroutines-in-practice-kotlinconf-2018))
- 언어 디자인 훑어보기:
  - Part 1 (프로토타입 디자인): [Coroutines in Kotlin](https://www.youtube.com/watch?v=4W3ruTWUhpw) (Andrey Breslav, JVMLS 2016 에서)
  - Part 2 (현재 디자인): [Kotlin Coroutines Reloaded](https://www.youtube.com/watch?v=3xalVUY69Ok&feature=youtu.be) (Roman Elizarov, JVMLS 2017, [발표자료](https://www.slideshare.net/elizarov/kotlin-coroutines-reloaded))

### 피드백

피드백은 아래를 통해 전달해주세요:

- [Kotlin YouTrack](http://kotl.in/issue): 코루틴의 구현이나 Kotlin 컴파일러에서 발생하는 이슈나 기능 요청
- [`kotlinx.coroutines`](https://github.com/Kotlin/kotlinx.coroutines/issues) 이슈 트래커: 코루틴 공식 라이브러리에서 발생하는 이슈

## 변경 이력

이 영역에서는 코루틴 디자인과 관련된 몇 가지 버전 사이의 변경점을 기술합니다.

### 버전 3.3에서 발생한 변경점

- 코루틴은 더이상 실험적이지 않으며 `kotlin.coroutines` 패키지로 이동되었습니다.
- 실험적 상태의 모든 영역이 삭제되고, 마이그레이션 영역이 추가되었습니다.
- 크게 규범적이지 않은 코드 스타일이 명명 규칙의 변화를 반영하기 위해 변경되었습니다.
- Kotlin 1.3 에서 새롭게 구현된 기능에 대한 스펙이 갱신되었습니다:
  - 함수에 대해 더 많은 연산자와 서로 다른 타입들을 지원됩니다.
  - 내부 API 변경점:
    - `suspendCoroutineOrReturn` 이 삭제되고, `suspendCoroutineUninterceptedOrReturn` 이 대신 제공됩니다.
    - `createCoroutineUnchecked` 이 삭제되고, `createCoroutineUnintercepted` 이 대신 제공됩니다.
    - `startCoroutineUninterceptedOrReturn` 가 제공됩니다.
    - `intercepted` 확장 함수가 추가되었습니다.

### 버전 3.2에서 발생한 변경점

- `createCoroutineUncehcked` 내부 API 의 설명이 추가되었습니다.

### 버전 3.1에서 발생한 변경점

- `kotlin.coroutines` 패키지가 `kotlin.coroutines.experimental` 로 대체되었습니다.
- `SUSPENDED_MARKER` 가 `COROUTINE_SUSPENDED` 로 변경되었습니다.
- 추가된 코루틴들에 대한 실험적 상태를 명백히 했습니다.

### 버전 3에서 발생한 변경점

이 버전은 Kotlin 1.1-Beta 버전에서 구현되었습니다.

- 정지 함수는 다른 정지 함수를 어떤 위치에서든 호출할 수 있습니다.
- 코루틴 디스패쳐가 코루틴 컨텍스트로 일반화되었습니다:
  - `CoroutineContext` 인터페이스가 추가되었습니다.
  - `ContinuationDispatcher` 인터페이스가 `ContinuationInterceptor` 로 대체되었습니다.
  - `createCoroutine` 및 `startCoroutine` 의 `dispatcher` 파라미터가 제거되었습니다.
  - `Coutinuation` 인터페이스가 이제 `val context: CoroutineContext` 를 포함합니다.
- `CoroutineIntrinsics` 오브젝트가 `kotlin.coroutines.intrinsics` 패비지로 대체되었습니다.

### 버전 2에서 발생한 변경점

이 버전은 Kotlin 1.1-M04 버전에서 구현되었습니다.

- `coroutine` 키워드가 정지 함수 타입으로 대체되었습니다.
- 정지 함수의 `Continuation`가 호출측과 정의측에서 모두 명백하게 표현됩니다.
- 지속자를 캡쳐하기 위해 제공되는 `suspendContinuation` 함수는 필요한 경우 정지하는 합수입니다.
- 비-정지 호출에 대해 스택이 쌓이는 것을 막기 위해 지속자 전달 스타일 변환(CPS 변환)이 적용됩니다.
- `createCoroutine`/`startCoroutine` 코루틴 빌더가 추가되었습니다.
- 코루틴 컨트롤러에 대한 개념이 삭제되었습니다:
  - 코루틴 완료에 따른 결과는 `Continuation` 인터페이스를 통해 전달됩니다.
  - 코루틴 스코프는 코루틴의 `receiver` 를 통해 선택적으로 사용가능합니다.
  - 정지 함수는 최상위 레벨에서 수신자 없이 정의될 수 있습니다.
- `CoroutineIntrinsics` 오브젝트는 안전보다 속도가 우선되는 경우를 위한 저수준의 도구를 제공합니다.

{&?}
