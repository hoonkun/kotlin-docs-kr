연기된 값들은 하나의 값을 코루틴 사이에서 전달할 때 유용합니다. 채널은 값들의 흐름을 전달할 수 있는 방법을 제시합니다.

{#channel-basics}
## 채널 기초

채널은 개념적으로 `BlockingQueue` 와 매우 유사합니다. 가장 큰 차이점은 블락하는 `put` 오퍼레이션 대신 정지하는 [send](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-send-channel/send.html) 가, 블락하는 `take` 오퍼레이션 대신 정지하는 [receive](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-receive-channel/receive.html) 가 존재합니다.

```kotlin
val channel = Channel<Int>()
launch {
    // 이 동작은 CPU 를 소모하는 무거운 로직일 수도 있지만 여기서는 그냥 다섯 개의 제곱들을 전송합니다.
    for (x in 1..5) channel.send(x * x)
}
// 여기에서 수신한 다섯 개의 숫자를 출력합니다.
repeat(5) { println(channel.receive()) }
println("Done!")
```

이 코드의 출력은 아래와 같습니다:

```
1
4
9
16
25
Done!
```

{#closing-and-iteration-over-channels}
## 채널의 폐쇄와 반복

큐와 다르게, 채널은 닫음으로써 더이상 요소가 들어오지 않을 것임을 나타낼 수 있습니다. 수신 측에서는 일반적인 `for` 반복을 통해 편하게 채널에서 요소를 수신할 수 있습니다.

개념적으로, [close](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-send-channel/close.html) 는 특별한 닫는 토큰을 채널을 통해 전달하는 것과 같습니다. 이 닫는 토큰이 수신되면 곧바로 반복이 종료되며, 모든 닫히기 전에 전송된 요소들이 수신됨을 보장합니다:

```kotlin
val channel = Channel<Int>()
launch {
    for (x in 1..5) channel.send(x * x)
    channel.close() // 다 보냈습니다.
}
// `for` 루프를 사용해 채널이 닫힐 때까지 수신한 값들을 출력합니다.
for (y in channel) println(y)
println("Done!")
```

위의 코드는 아래와 같이 출력합니다:

```
1
4
9
16
25
Done!
```

{#building-channel-producers}
## 채널 생산자 만들기

코루틴이 어떠한 요소들의 나열을 만들어내는 경우는 꽤 흔합니다. 이것은 동시적인 코드에서 자주 찾을 수 있는 생산자-소비자 패턴의 한 부분입니다. 그러한 생산자는 채널을 인수로 받는 함수로 추상화될 수 있지만, 이는 함수로부터 리턴되는 것이 결과라는 일반적인 통념에 반합니다.

생산자의 측면에서 이를 편리하게 해주는 [produce](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/produce.html) 라는 이름을 가진 코루틴 빌더와, 소비자의 측면에서 `for` 반복을 대체할 [consumeEach](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/consume-each.html) 라는 이름을 가진 확장 함수가 있습니다:

```kotlin
fun CoroutineScope.produceSquares(): ReceiveChannel<Int> = produce {
    for (x in 1..5) send(x * x)
}

fun main() = runBlocking {
    val squares = produceSquares()
    squares.consumeEach { println(it) }
    println("Done!")
}
```

위의 코드는 아래처럼 출력합니다:

```
1
4
9
16
25
Done!
```

{#pipelines}
## 파이프라인

파이프라인은 하나의 코루틴이 무한한 값들을 생산할 가능성이 있을 때 사용되는 패턴입니다:

```kotlin
fun CoroutineScope.produceNumbers() = produce<Int> {
    var x = 1
    while (true) send(x++) // 1부터 시작하는 무한한 숫자들의 스트림
}
```

위에서 만든 생산자와 더불어 또다른 코루틴이 해당 스트림을 소비하여 무언가의 처리를 하고 새로운 결과를 생산할 수도 있습니다. 아래의 예제에서, 숫자들은 제곱되어 다시 생산됩니다:

```kotlin
fun CoroutineScope.square(numbers: ReceiveChannel<Int>): ReceiveChannel<Int> = produce {
    for (x in numbers) send(x * x)
}
```

메인 코드는 전체 파이프라인을 시작하고 연결합니다:

```kotlin
val numbers = produceNumbers() // 1부터 무한히 숫자를 생산합니다.
val squares = square(numbers) // 숫자들을 제곱합니다.
repeat(5) {
    println(squares.receive()) // 첫 다섯 개를 출력합니다.
}
println("Done!") // 다 했습니다.
coroutineContext.cancelChildren() // 자식 코루틴들을 취소합니다.
```

위의 코드는 아래와 같이 출력합니다:

```
1
4
9
16
25
Done!
```

> 모든 코루틴 빌더들은 [CoroutineScope](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/index.html) 의 확장 함수이므로, 구조화된 동시성에 의해 어플리케이션의 전역적 코루틴을 방해하지 않는다는 것을 확신할 수 있습니다.

{#prime-numbers-with-pipeline}
## 파이프라인과 소수(Prime numbers)

파이프라인으로 소수를 찾아내는 예제를 통해 파이프라인을 골로 보내봅시다. 우선 무한한 숫자를 나열하는 것부터 시작해볼까요.

```kotlin
fun CoroutineScope.numbersFrom(start: Int) = produce<Int> {
    var x = start
    while (true) send(x++) // start 로부터의 무한히 증가하는 수의 스트림
}
```

아래의 파이프라인은 들어오는 수들을 필터하여 각각에 대해 전달되는 소수로 나누어 떨어지지 않는 것만을 남깁니다:

```kotlin
fun CoroutineScope.filter(numbers: ReceiveChannel<Int>, prime: Int) = produce<Int> {
    for (x in numbers) if (x % prime != 0) send(x)
}
```

이제 2부터 시작하는 숫자들의 나열을 개시하고, 현재 채널로부터 소수를 찾아낸 다음, 그 찾아낸 소수로 새로운 파이프라인을 시작하도록 구성합니다:

```
numbersFrom(2) -> filter(2) -> filter(3) -> filter(5) -> filter(7) ...
```

아래의 예제는 모든 파이프라인을 메인 스레드의 컨텍스트에서 수행하며 첫 10개의 소수를 출력합니다. 모든 코루틴이 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html) 의 컨텍스트에서 실행되므로, 시작한 코루틴들을 직접 관리할 필요가 없습니다. [cancelChildren](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/cancel-children.html) 확장 함수를 통해 첫 10개의 소수를 출력한 이후에는 모든 자식 코루틴을 취소시킬 수 있습니다.

```kotlin
var cur = numbersFrom(2)
repeat(10) {
    val prime = cur.receive()
    println(prime)
    cur = filter(cur, prime)
}
coroutineContext.cancelChildren() // main 이 끝나게 하기 위해 모든 자식 코루틴을 취소합니다.
```

의 코드의 출력은 아래와 같습니다:

```
2
3
5
7
11
13
17
19
23
29
```

같은 파이프라인을 표준 라이브러리의 [`iterator`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/iterator.html) 라는 코루틴 builder 를 사용해서 만들 수도 있습니다. `produce` 를 `iterator` 로, `send` 를 `yield` 로, `receive` 를 `next` 로, `ReceiveChannel` 를 `Iterator` 로, 그리고 코루틴 스코프 수신자를 제거합니다. `runBlocking` 도 필요하지 않겠죠. 그러나 위의 채널을 통한 파이프라인의 구현의 장점은 [Dispatchers.Default](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html) 를 통해 실행하여 여러 CPU 코어를 사용할 수 있다는 점입니다.

물론, 이 예제는 소수를 찾는것에 있어서 굉장히 이상한 구현입니다. 그리고 실제로는, 파이프라인은 다른 정지하는 작업(원격 서비스로의 비동기 호출 등)을 수행하고, `sequence` 나 `iterator` 는 `produce` 와 다르게 정지를 허용하지 않으므로 그들로 구성할 수 없습니다.

{#fan-out}
## Fan-out

여러 개의 코루틴이 그들 사이에서 작업을 기여하며 하나의 채널로부터 수신받을 수도 있습니다. 일정 간격을 두고 정수를 생산(1초에 10개)하는 생산자를 만들어봅시다:

```kotlin
fun CoroutineScope.produceNumbers() = produce<Int> {
    var x = 1 // 1부터 시작합니다.
    while (true) {
        send(x++) // 다음 값을 전송합니다.
        delay(100) // 0.1s 를 기다립니다.
    }
}
```

그리고 몇 개의 처리자 코루틴이 있습니다. 이 예제에서는 그들의 아이디와 수신받은 숫자를 출력합니다:

```kotlin
fun CoroutineScope.launchProcessor(id: Int, channel: ReceiveChannel<Int>) = launch {
    for (msg in channel) {
        println("Processor #$id received $msg")
    }
}
```

이제 다섯 개의 처리자를 시작하여 약 1초 정도 작동하게 해봅시다. 무슨 일이 일어날까요:

```kotlin
val producer = produceNumbers()
repeat(5) { launchProcessor(it, producer) }
delay(950)
producer.cancel() // 생산자 코루틴을 취소하여 모든 소비자까지 같이 취소합니다.
```

출력은 아래와 비슷합니다. 각 숫자를 수신한 프로세서의 아이디는 각각 다를 수 있겠지만요:

```
Processor #2 received 1
Processor #4 received 2
Processor #0 received 3
Processor #1 received 4
Processor #3 received 5
Processor #2 received 6
Processor #4 received 7
Processor #0 received 8
Processor #1 received 9
Processor #3 received 10
```

생상자의 작업을 취소하였기 때문에 채널도 닫혔으며, 즉 그것을 수신하던 처리자들의 반복적인 작업까지도 모두 완료되었습니다.

또, fan-out 을 수행하기 위해 `launchProcessor` 코드 안에서 어떻게 명시적으로 `for` 를 사용하였는지 주목하세요. `consumeEach` 와 다르게, 이 `for` 패턴은 여러 개의 코루틴 사이에서 사용해도 명백하게 안전합니다. 하나의 처리자 코루틴이 실패하더라도, 나머지 코루틴들은 마저 작업을 처리합니다. `consumeEach` 는 정상적이거나 비정상적인 종료 시 차지한 채널 하나를 반드시 소비(취소)하는 것에 반하죠.

{#fan-in}
## Fan-in

여러 개의 코루틴이 하나의 채널에 값을 발신할 수도 있습니다. 예를 들어, 문자열의 채널 하나가 있고 반복적으로 특정한 시간을 기다린 후 어떤 문자열을 발신하는 정지 함수가 있다고 해봅시다:

```kotlin
suspend fun sendString(channel: SendChannel<String>, s: String, time: Long) {
    while (true) {
        delay(time)
        channel.send(s)
    }
}
```

이제, 문자열을 발신하는 두 개의 코루틴을 시작하면 어떤 일이 일어나는지 살펴봅시다(이 예제에서는 메인 스레드에서 시작된 메인 코루틴의 자식으로서 시작합니다):

```kotlin
val channel = Channel<String>()
launch { sendString(channel, "foo", 200L) }
launch { sendString(channel, "BAR!", 500L) }
repeat(6) { // 첫 6개를 수신합니다.
    println(channel.receive())
}
coroutineContext.cancelChildren() // main 이 끝나게 하기 위해 모든 자식 코루틴을 취소합니다.
```

출력은 아래와 같습니다:

```
foo
foo
BAR!
foo
foo
BAR!
```

{#buffered-channels}
## 버퍼된 채널

지금까지 등장한 채널들은 버퍼가 없습니다. 버퍼가 없는 채널들은 발신자와 수신자가 서로 결합해야 합니다. 발신이 먼저 수행되었을 경우 그는 수신이 수행될때까지 정지되며, 수신이 먼저 수행되었을 경우 발신이 수행될때까지 정지합니다.

[Channel()](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-channel.html) 팩토리 함수와 [produce](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/produce.html) 빌더 모두 선택적으로 `capacity` 인수를 통해 **버퍼의 크기**를 지정할 수 있습니다. 버퍼는 정지하기 전에 여러 개의 요소를 발신할 수 있게 하며, 마찬가지로 버퍼의 크기가 지정된 BlockingQueue 가 가득 차면 막는(원문: blocking) 것과 비슷합니다.

아래의 코드가 어떻게 동작하는지 한 번 살펴보세요:

```kotlin
val channel = Channel<Int>(4) // 버퍼된 채널을 만듭니다.
val sender = launch { // 발신자 코루틴을 시작합니다.
    repeat(10) {
        println("Sending $it") // 각 요소를 보내기 전에 출력합니다.
        channel.send(it) // 버퍼가 가득 차면 이 문장에서 정지합니다.
    }
}
// 아무것도 수신하지 않습니다... 그냥 기다립니다....
delay(1000)
sender.cancel() // 발신자 코루틴을 취소합니다.
```

**4**의 한계치가 있는 채널에 대해 **5**개의 요소의 발신 시도를 출력했습니다.

```
Sending 0
Sending 1
Sending 2
Sending 3
Sending 4
```

첫 4개의 요소는 버퍼에 추가되었고, 다섯 번째 요소를 추가하려고 할 때 정지했습니다.

{#channels-are-fair}
## 채널은 공정합니다

여러 코루틴 사이에서, 채널에 보내거나 받는 오퍼레이션은 호출된 순서에 따라 공정합니다. 먼저 들어온 것에 대해 먼저 응답하며, 처음 `receive` 를 호출한 코루틴이 값을 받습니다. 아래의 예제는 두 개의 "ping" 과 "pong" 의 이름을 가진 코루틴이 공유된 "table" 채널로부터 "ball" 오브젝트를 수신합니다:

```kotlin
data class Ball(var hits: Int)

fun main() = runBlocking {
    val table = Channel<Ball>() // 공유된 테이블
    launch { player("ping", table) }
    launch { player("pong", table) }
    table.send(Ball(0)) // 공을 던집니다
    delay(1000) // 1초 기다립니다.
    coroutineContext.cancelChildren() // 게임 끝, 취소합니다.
}

suspend fun player(name: String, table: Channel<Ball>) {
    for (ball in table) { // 반복 안에서 공을 수신합니다.
        ball.hits++
        println("$name $ball")
        delay(300) // 잠시 기다립니다.
        table.send(ball) // 다시 공을 보냅니다.
    }
}
```

"ping" 코루틴이 먼저 시작되었으므로, 해당 코루틴이 먼저 공을 받습니다. "ping" 코루틴이 해당 공을 다시 보내고 곧바로 수신을 기다리기 시작했지만, "pong" 코루틴이 이미 기다리고 있었기 때문에 그것이 공을 받습니다:

```
ping Ball(hits=1)
pong Ball(hits=2)
ping Ball(hits=3)
pong Ball(hits=4)
```

사용된 executor 의 컨텍스트와 환경에 따라서 채널의 동작이 가끔 공정하지 않은 것 처럼 보일 때도 있습니다. 그럴 때는 [이 이슈](https://github.com/Kotlin/kotlinx.coroutines/issues/111)를 확인해보세요.

{#ticker-channels}
## Ticker 채널

Ticker 채널은 특별하게 이 채널의 마지막 소비로부터 일정 시간 이후에 `Unit` 을 생산하는 채널입니다. 혼자서 쓰이는 것이 무의미하게 보일 수도 있지만, 몇몇 복잡한 시간 기반의 [produce](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/produce.html) 파이프라인과 시간에 의존하여 윈도잉하는 연산자를 사용할 때 유용합니다. Ticker 채널은 "틱이 이루어졌을 때" 어떤 행동을 수행하기 위해 [select](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.selects/select.html) 안에서 사용됩니다.

이 채널을 만드려면 [ticker](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/ticker.html) 라는 팩토리 함수를 사용합니다. 더이상 요소가 필요가 없다면 [ReceiveChannel.cancel](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-receive-channel/cancel.html) 를 사용할 수 있습니다.

아래 예제를 통해 실제로 어떻게 동작하는지 보도록 하죠:

```kotlin
fun main() = runBlocking<Unit> {
    val tickerChannel = ticker(delayMillis = 200, initialDelayMillis = 0) // 틱킹 채널을 만듭니다.
    var nextElement = withTimeoutOrNull(1) { tickerChannel.receive() }
    println("Initial element is available immediately: $nextElement") // 초기 딜레이는 없습니다.

    nextElement = withTimeoutOrNull(100) { tickerChannel.receive() } // 모든 후열 요소들은 200ms 의 대기시간이 있습니다.
    println("Next element is not ready in 100 ms: $nextElement")

    nextElement = withTimeoutOrNull(120) { tickerChannel.receive() }
    println("Next element is ready in 200 ms: $nextElement")

    // 소비를 길게 딜레이합니다. 
    println("Consumer pauses for 300ms")
    delay(300)
    // 다음 요소는 곧바로 사용 가능합니다.
    nextElement = withTimeoutOrNull(1) { tickerChannel.receive() }
    println("Next element is available immediately after large consumer delay: $nextElement")
    // `receive` 명령 사이의 일시정지가, 다음 요소가 더 빨리 수신되도록 영향을 주었음을 확인할 수 있습니다.
    nextElement = withTimeoutOrNull(120) { tickerChannel.receive() }
    println("Next element is ready in 100ms after consumer pause in 300ms: $nextElement")

    tickerChannel.cancel() // indicate that no more elements are needed
}
```

위의 코드조각은 아래를 출력합니다:

```
Initial element is available immediately: kotlin.Unit
Next element is not ready in 100 ms: null
Next element is ready in 200 ms: kotlin.Unit
Consumer pauses for 300ms
Next element is available immediately after large consumer delay: kotlin.Unit
Next element is ready in 100ms after consumer pause in 300ms: kotlin.Unit
```

[ticker](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/ticker.html) 는 소비자가 멈출 수도 있음을 알고 있고, 기본적으로는 다음으로 생산될 요소의 딜레이를 조절하여 고정된 생산 시간비를 유지하려고 시도합니다.

선택적으로 `mode` 인수에 [TickerMode.FIXED_DELAY](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-ticker-mode/-f-i-x-e-d_-d-e-l-a-y/index.html) 를 전달하여 항상 고정된 딜레이를 설정할 수 있습니다.

{&?}


{~}
{<~flow.md} {~>exception-handling.md}
{/~}