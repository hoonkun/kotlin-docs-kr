문자들은 `Char` 타입에 의해, `'1'` 처럼 작은 따옴표 안에 묶여 표현됩니다.

> JVM 에서, 문자들은 16비트 유니코드를 사용하는 `char` 원시 타입의 형태로 메모리에 저장됩니다.

탈출 문자들은 역슬래시로 시작하며, Kotlin 에서는 아래와 같은 것들을 지원합니다.

- `\t` - 탭
- `\b` - 백스페이스
- `\n` - 개행 (라인피드, LF)
- `\r` - 캐리지 리턴 (CR)
- `\'` - 작은 따옴표
- `\"` - 큰 따옴표
- `\\` - 역슬래시
- `\$` - 달러 기호

다른 어떤 문자를 인코드하려면, `\uFF00` 과 같은 Unicode escape sequence 문법을 사용하세요.

```kotlin
val aChar: Char = 'a'

println(aChar)
println('\n') // Prints an extra newline character
println('\uFF00')
```

문자의 값이 숫자 한 자리라면, `digitToInt()` 를 통해 명시적으로 `Int` 로 변환할 수 있습니다.

> JVM 에서, [숫자들](/docs/numbers.md#jvm-에서의-숫자-표현)과 동일하게 문자열도 nullable 레퍼런스가 필요할 때 Java 의 클래스로 포장(boxed)되며, 해당 인스턴스에 대한 참조적 동일성은 유지되지 않습니다.

{&?}
