몇 십년 간, 개발자로서 마추지고 풀어야 했던 문제는 어떻게 어플리케이션이 '막히지 않게' 해야하는가에 대한 것이었습니다.
데스크톱, 모바일부터 서버사이드 어플리케이션까지, 우리는 사용자를 기다리게 하거나 우리의 어플리케이션이 성장하는데 발목을 잡는 병목 현상을 발생시키고 싶지 않았습니다.

아래 내용들을 포함하여, 이 문제를 해결하는데 여러 가지 접근이 있었습니다:

- [스레드(Threading)](#스레드-Threading)
- [콜백 함수(Callback)](#콜백-함수-Callback)
- [Future, Promise 를 비롯한 나머지](#Future-와-Promise-를-비롯한-나머지)
- [반응형 확장(Reactive Extensions)](#반응형-확장-Reactive-Extensions)
- [코루틴(Coroutine)](#코루틴-Coroutine)

코루틴에 대해 설명하기 전에, 다른 해결책들을 간단히 살펴봅시다.

## 스레드 (Threading)
스레딩은 어플리케이션이 '막히지 않게' 하기 위한, 지금까지 아마도 가장 널리, 잘 알려진 해결책일 것입니다.

```kotlin
fun postItem(item: Item) {
    val token = preparePost()
    val post = submitPost(token, item)
    processPost(post)
}

fun preparePost(): Token {
    // makes a request and consequently blocks the main thread
    return token
}
```

`preparePost` 가 길게 실행되는 작업이고, 사용자 인터페이스를 막을 가능성이 있는 로직이라고 해봅시다. 
여기에서 우리가 할 수 있는 일은 이 작업을 별도 스레드에서 실행하는 것입니다.
이는 UI 가 막히는 문제를 피할 수 있게 해줍니다. 
이것은 매우 일반적인 테크닉이지만, 몇몇 약점들이 있습니다:

- 스레드는 값싸지 않습니다. 스레드는 비싼 컨텍스트의 변경을 필요로 합니다.
- 스레드는 무한하지 않습니다. 한 번에 실행될 수 있는 스레드의 수는 운영체제에 따라 서로 다르게 제한됩니다. 특히 서버사이드 어플리케이션에서는 이러한 점이 병목이 될 수 있습니다.
- 스레드는 어디서나 사용가능하지는 않습니다. 몇몇 언어, 예를 들면 JavaScript 는 스레드를 지원하지 않습니다.
- 스레드는 어렵습니다. 스레드를 디버깅하고, race-condition{^[1]} 은 우리가 여러 스레드를 사용한 프로그래밍을 할 때 고통받는 일반적인 이슈입니다.

---
{&[1]} 여러 코드가 동시에 실행되는 환경에서, 랜덤한 타이밍으로 인해 실행 순서가 변경되어 동작이 바뀌는 현상을 말합니다.

## 콜백 함수 (Callback)

콜백 함수는 어떠한 작업이 완료된 뒤에 할 행동을 함수의 형태로 다른 함수에 인수로 전달하는 기법입니다.

```kotlin
fun postItem(item: Item) {
    preparePostAsync { token ->
        submitPostAsync(token, item) { post ->
            processPost(post)
        }
    }
}

fun preparePostAsync(callback: (Token) -> Unit) {
    // make request and return immediately
    // arrange callback to be invoked later
}
```

이 기법은 꽤 괜찮은 해결책 같지만, 마찬가지로 몇 가지 이슈가 있습니다:

- 중첩된 콜백들은 지저분합니다. 콜백으로 사용되는 함수들은 일반적으로 그만의 자체적인 다른 콜백을 다시 필요로 합니다.
  이는 콜백들이 여러 겹으로 중첩되게 만들며, 이해할 수 없는 코드가 되게 합니다.
  이 패턴은 여는 중괄호가 트리의 가지처럼 보인다고 해서 종종 제목이 달린 크리스마스 트리라고 불리기도 합니다.
- 에러 처리가 복잡합니다. 중첩된 구조는 에러의 핸들링이나 전파 등에 대해 복잡하고 어렵게 합니다.

JavaScript 같은 이벤트 루프 기반의 아키텍쳐에서 콜백은 꽤 일반적이지만, 그곳에서 마저도 사람들은 Promises 나 Reactive Extension 같은 것들로 넘어가려고 하고 있습니다.  

## Future 와 Promise 를 비롯한 나머지

Future 와 Promise(언어별로 다른 명칭을 사용하기도 합니다)가 만들어진 이유는, 우리가 그것을 호출할 때 미래의 어떤 특정 시점에 값을 리턴한다는 약속을 받아낸다고 여겼기 때문입니다.
```kotlin
fun postItem(item: Item) {
    preparePostAsync()
        .thenCompose { token ->
            submitPostAsync(token, item)
        }
        .thenAccept { post ->
            processPost(post)
        }

}

fun preparePostAsync(): Promise<Token> {
    // makes request and returns a promise that is completed later
    return promise
}
```

이 접근은 우리가 프로그래밍하는 방법에 대해 몇 가지 변화를 필요로 합니다:

- 콜백과 비슷하게, 프로그래밍 모델이 위에서 아래로 흐르는 선언적 접근에서 호출 체인으로 구성된 구성적 모델로 변화합니다.
- 일반적으로 `thenCompose` 나 `thenAccept` 같은, 플랫폼별로 서로 다를 수 있는 새로운 API 에 대해 공부해야합니다.
- 우리가 진짜로 필요로하는 리턴 타입이 없어지고 새로운 `Promise` 라는 타입을 리턴하는, 어쩌면 다시 생각해볼만한 행동을 합니다.
- 에러의 전파나 체인 구성은 항상 직관적이지는 않으며 대게 복잡하고 어렵습니다.

## 반응형 확장 (Reactive Extensions)
반응형 확장 (Reactive Extensions, Rx) 는 [Erik Meijer](https://en.wikipedia.org/wiki/Erik_Meijer_(computer_scientist)) 에 의해 C# 에 창안되었습니다.
처음 창안될 당시 이 기법은 명백하게 .NET 프레임워크 위에서만 사용될 수 있었고, Netflix 가 이것을 Java 로 가져온 뒤 RxJava 라는 이름을 붙히기 전까지는 주류로 채택되지 못했습니다.
그 때부터는 이를 JavaScript(RxJS) 를 비롯하여 여러 다른 플랫폼으로 가져오려는 시도가 있었습니다.

Rx 의 기본 아이디어는 무한한 양의 데이터를 관찰 가능한 스트림이라고 취급하기 시작하면서 발생했습니다. 
실제로, Rx 는 간단한 [관측자 패턴](https://en.wikipedia.org/wiki/Observer_pattern)으로써 우리가 데이터에 대해 작업할 수 있는 몇몇 확장을 제공합니다.

접근 방식은 Future 와 매우 비슷하지만 Future 는 개별 요소를 반환하는 반면 Rx는 스트림을 반환하는 것으로 생각할 수 있습니다.
그러나 이전 방식과 비슷하게, 우리가 프로그래밍하는 방식에 완전히 새로운 변화를 만듭니다. 일반적으로는 아래처럼 표현되기도 하죠.

`"everything is a stream, and it's observable"`

이 기법은 문제에 접근하는 굉장히 새로운 방식을 제안하며 우리가 익숙하게 동기적으로 작성했던 프로그래밍 방식으로부터의 중요한 도약을 필요로 합니다.
Future 에 비해 좋은 점은, 이것이 C#, Java, JavaScript 를 비롯한 매우 많은 플랫폼에서 우리가 어떤 것을 사용하던 일관적인 형태의 API 로 개발할 수 있다는 점입니다.

더해서, Rx 는 에러 핸들링에 대해 더 훌륭한 접근을 소개하기도 합니다.

## 코루틴 (Coroutine)
비동기적인 코드를 작성하는 것에 있어서 Kotlin 의 접근은, 코루틴(Coroutine)을 사용하는 것이었습니다. 
이는 정지할 수 있는 계산{^[1]}들의 집합이며, 즉 함수를 어떤 시점에 그 실행을 잠시 멈추고 그 뒤에 이어서 할 수 있는 것으로 취급함으로써 창안된 아이디어입니다.

코루틴이 개발자에게 가져다주는 이점 중 하나는, 비동기적인 코드를 기존에 우리가 작성하던 방식 그대로 작성할 수 있다는 것입니다.

아래 예제를 한 번 살펴보세요:

```kotlin
fun postItem(item: Item) {
    launch {
        val token = preparePost()
        val post = submitPost(token, item)
        processPost(post)
    }
}

suspend fun preparePost(): Token {
    // makes a request and suspends the coroutine
    return suspendCoroutine { /* ... */ }
}
```

이 코드는 길게 실행되는 작업을 스레드를 막지 않고 시작합니다. `preparePost` 함수는 `정지할 수 있는 함수` 라고 불리며, 그래서 함수 앞에 `suspend` 키워드가 따라붙습니다.
이것은 위에서도 언급했듯이, 함수가 실행되고, 언젠가 일시정지되며 다시 재게될 수 있음을 의미합니다.

- 함수의 시그니쳐가 전혀 변하지 않습니다. 유일한 차이는 `suspend` 키워드가 추가되었다는 점입니다. 리턴형도 우리가 원하는 데이터 자체의 타입을 가집니다.
- 코드가 우리가 동기적인 코드를 작성할 때와 동일합니다. 코루틴 자체를 시작하는 `launch` 함수 안에서는 별도의 특별한 문법 없이 위에서 아래로 흐릅니다.
- 프로그래밍 모델과 API 들이 변하지 않습니다. 우리는 기존에 사용하던 반복과 예외 처리와 같은 것들을 새로 배울 필요 없이 그대로 사용할 수 있습니다.
- 플랫폼에 의존적이지 않습니다. JVM 을 사용하던, JS 를 사용하던 어떤 플랫폼이건 간에 하나의 코드만 작성합니다. 보이지 않는 곳에서 컴파일러가 이들을 서로 다른 플랫폼으로 이전합니다.

코루틴은 새로운 개념이 아니며, Kotlin 에 의해 '발명된' 무언가도 아닙니다. 수십년간 주변에 존재해왔으며, Go 같은 다른 프로그래밍 언어에서는 유명합니다. 
그럼에도 이것이 Kotlin 으로 구현됨으로써 중요하게 생각해야하는 것은, 대부분의 기능이 라이브러리에게 위임된다는 것입니다. 
사실, `suspend` 를 제외한 그 어떤 것도 언어 레벨에서 추가되지 않습니다. 이는 C# 같은 언어에서 `async` 와 `await` 이 키워드인 점과는 다르죠.
Kotlin 에서, 이 모든 것들은 전부 라이브러리의 기능들입니다.

더 많은 정보는 [코루틴 훑어보기](/docs/coroutines-overview.md) 문서에서 확인해보세요.

---
{&[1]} 원문: suspendable computation


{&?}
