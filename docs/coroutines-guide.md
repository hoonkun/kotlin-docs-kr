Kotlin은 표준 라이브러리에 최소한의 저수준 API 만을 제공하여 다른 라이브러리가 코루틴을 더 쉽게 도구화 할 수 있게 합니다. 
비슷한 기능이 있는 다른 여려 언어들과 달리, `async` 및 `await` 는 Kotlin 에서 예약어가 아니며 표준 라이브러리에도 포함되지 않습니다.
게다가, Kotlin 의 **정지 함수**{^[1]}는 비동기 작업에 대해 Future 나 Promise 보다 더 안전하고 더 적은 문제를 일으키는{^[2]} 추상적인 개념을 제공합니다.

JetBrains 가 개발한 `kotlinx.coroutines` 는 코루틴을 위한 중요한 라이브러리입니다. 이 라이브러리에는 `launch` 나 `async` 함수 등을 포함하여 코루틴에서 사용할 수 있는, 곧 이 문서에서 설명할 고수준의 근본{^[3]}들이 들어있습니다.

이 문서는 `kotlinx.coroutines` 의 코어 기능들에 대한 가이드로서, 몇 개의 서로 다른 주제들로 나누어져 있습니다.

코루틴을 사용하는 이 문서의 예제를 따라하려면, [이 프로젝트의 README 문서](https://github.com/Kotlin/kotlinx.coroutines/blob/master/README.md#using-in-your-projects)에 설명된 대로 프로젝트의 종속에 `kotlinx-coroutines-core` 모듈을 추가해야합니다.   

--- 
{&[1]}원문: suspending function. Kotlin 에서 제공하는 특정 개념을 지칭하는 표현.  
{&[2]}원문: safer and less error-prone  
{&[3]}원문: primitives


## 이 문서의 내용

{*large-spacing}

- [코루틴 기초](/docs/coroutines-basics.md)
- [취소와 타임아웃](/docs/cancellation-and-timeouts.md)
- [정지함수의 구성](/docs/composing-suspending-functions.md)
- [코루틴의 컨텍스트와 디스패쳐](/docs/coroutine-context-and-dispatchers.md)
- [비동기 플로우](/docs/flow.md)
- [채널](/docs/channels.md)
- [코루틴의 예외 핸들링](/docs/exception-handling.md)
- [변경 가능한 공유 자원과 동시성](/docs/shared-mutable-state-and-concurrency.md)
- [Select 표현(실험적)](https://kotlinlang.org/docs/select-expressions.html)
- [튜토리얼: IntellijIDEA 를 사용하여 코루틴 디버깅](https://kotlinlang.org/docs/debug-coroutines-with-idea)
- [튜토리얼: IntellijIDEA 를 사용하여 Flow 디버깅](https://kotlinlang.org/docs/debug-flow-with-idea)

## 추가 레퍼런스

{*large-spacing}

- [코루틴을 사용한 UI 프로그래밍 가이드](https://github.com/Kotlin/kotlinx.coroutines/blob/master/ui/coroutines-guide-ui.md)
- [코루틴 디자인 문서 (KEEP)](https://github.com/Kotlin/KEEP/blob/master/proposals/coroutines.md)
- [전체 kotlinx.coroutines API 레퍼런스](https://kotlinlang.org/api/kotlinx.coroutines/)
- [안드로이드에서의 코루틴 사용 권장사항](https://developer.android.com/kotlin/coroutines/coroutines-best-practices)
- [코루틴 및 플로우와 관련된 추가적인 안드로이드 리소스](https://developer.android.com/kotlin/coroutines/additional-resources)

{&?https://kotlinlang.org/docs/coroutines-guide.html}

{~}
{~>coroutines-basics.md}
{/~}