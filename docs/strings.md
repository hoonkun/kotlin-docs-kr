Kotlin 에서 문자열은  [`String`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-string/) 에 의해 표현됩니다.

> JVM 에서, UTF-16 인코딩을 가지는 `String` 타입 오브젝트는 글자 당 약 2 바이트의 크기를 가집니다.

일반적으로, 문자열 값은 문자들을 큰 따옴표(`"`)안에 나열해서 표현합니다:

```kotlin
val str = "abcd 123"
```

문자열의 각 요소는 문자이며, `s[i]` 와 같이 인덱싱 연산자로 접근할 수 있습니다. 
비슷하게, 문자들을 `for` 반복을 사용하여 반복할 수도 있습니다:

```kotlin
for (c in str) {
    println(c)
}
```

문자열들은 변경 불가능합니다. 한 번 문자열을 초기화하면, 그 값을 변경하거나 새 값을 할당할 수 없습니다.
모든 문자열을 변환하는 작업들은 그 결과를 새로운 `String` 오브젝트 안에 넣어 리턴하며, 기존 문자열은 변경하지 않습니다:

```kotlin
val str = "abcd"

// Creates and prints a new String object
println(str.uppercase())
// ABCD

// The original string remains the same
println(str) 
// abcd
```

문자열들을 이어붙히려면, `+` 연산자를 사용합니다. 이 연산자는 왼쪽 피연산자가 문자열이라면 문자열 외의 다른 타입을 이어붙힐 때도 사용할 수 있습니다:

```kotlin
val s = "abc" + 1
println(s + "def")
// abc1def    
```

> 대부분의 경우에서 문자열을 이어붙힐 때는 [템플릿 문자열](#템플릿-문자열)이나 [여러 줄 문자열](#여러-줄-문자열)이 더 선호됩니다.

## 문자열 리터럴

Kotlin 에는 두 가지 종류의 문자열 리터럴이 있습니다:

- [탈출 문자열](#탈출-문자열)
- [여러 줄 문자열](#여러-줄-문자열)

### 탈출 문자열

**탈출 문자열(escaped string)** 은 탈출 문자를 포함할 수 있습니다.  
아래는 탈출 문자열의 예시입니다:

```kotlin
val s = "Hello, world!\n"
```

탈출은 역슬래시(`\`)와 함께 일반적인 규약을 따릅니다. 지원하는 탈출 문자의 목록은 [문자](/docs/characters.md) 문서를 확인해보세요.

### 여러 줄 문자열

**여러 줄 문자열(multiline string)** 은 개행을 포함한 아무 텍스트나 포함할 수 있습니다. 
이들은 세 개의 큰따옴표(`"""`)로 묶이며, 탈출문자를 제외하고 개행과 아무 다른 문자들을 포함합니다.

```kotlin
val text = """
    for (c in "foo")
        print(c)
"""
```

앞쪽의 공백들을 제거하고싶다면, [`trimMargin()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/trim-margin.html) 를 사용합니다:

```kotlin
val text = """
    |Tell me and I forget.
    |Teach me and I remember.
    |Involve me and I learn.
    |(Benjamin Franklin)
    """.trimMargin()
```

기본적으로는 파이프 기호(`|`)가 마진의 접두사로 사용되지만, `trimMargin(">")` 같은 형태로 다른 문자를 인수로 전달할 수도 있습니다.

## 템플릿 문자열

문자열 리터럴들은 **템플릿 표현(template expressions)** 을 포함할 수 있습니다. 
이들은 런타임에 평가되어 그 결과값이 문자열에 이어붙혀지는 코드조각으로, Kotlin 에서 이러한 표현을 발견하면 자동으로 `toString()` 을 호출하여 문자열로 변환한 뒤에 이어붙힙니다.
템플릿 표현은 달러 기호로 시작하여 변수 이름을 적거나:

```kotlin
val i = 10
println("i = $i") 
// i = 10

val letters = listOf("a","b","c","d","e")
println("Letters: $letters") 
// Letters: [a, b, c, d, e]
```

혹은 중괄호로 묶어 어떤 표현식을 적을 수도 있습니다:

```kotlin
val s = "abc"
println("$s.length is ${s.length}") 
// abc.length is 3
```

템플릿은 탈출 문자와 여러 줄 문자 모두에 사용할 수 있습니다. 
탈출 문자를 지원하지 않는 여러 줄 문자열에서 [식별자](/docs/reference/grammar.md#식별자)의 첫 글자로 사용 가능한 문자 앞에 달러 기호를 쓰려면, 아래와 같이 씁니다:

```kotlin
val price = """
${'$'}_9.99
"""
```

## 문자열 포메팅

> `String.format()` 을 사용한 문자열 포메팅은 Kotlin/JVM 에서만 사용 가능합니다.

문자열을 필요에 맞게 포맷하려면, [`String.format()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/format.html) 함수를 사용할 수 있습니다.

`String.format()` 은 포맷 문자열과 하나 이상의 인수를 받습니다. 포맷 문자열은 그 뒤에 주어진 인수 하나당 하나의, `%`로 시작하며 포멧 특정자가 뒤따르는 대체 텍스트를 포함합니다.
포멧 특정자는 입력된 인수를 포맷하는 방식이며, 플래그나 너비, 정확도, 변환 타입 등의 정보를 포함합니다. 
종합적으로, 포멧 특정자는 출력 포맷의 형태를 결정합니다. 
일반적인 포맷 특정자는 숫자를 위한 `%d`나 부동 소수점 수를 위한 `%f`, 문자열을 위한 `%s` 같은 것들입니다.
같은 인수를 여러 번 다른 형태의 포맷으로 사용할 때는 `argument_index$` 형태의 표현을 사용할 수도 있습니다.

> 더 자세한 이해와 포멧 특정자에 대한 더 많은 목록을 확인하려면, [Java 의 Formatter 클래스 문서](https://docs.oracle.com/javase/8/docs/api/java/util/Formatter.html#summary)를 확인해보세요.

예제를 한 번 봅시다:

```kotlin
// 7 글자가 되도록 앞에 0를 붙혀 숫자를 포맷합니다.
val integerNumber = String.format("%07d", 31416)
println(integerNumber)
// 0031416

// 4 자리의 소수부와 앞에 +를 붙혀 부동 소수점 수를 포맷합니다.
val floatNumber = String.format("%+.4f", 3.141592)
println(floatNumber)
// +3.1416

// 각 대체 텍스트에 두 인수를 전달하고 각각을 대문자로 포맷합니다.
val helloString = String.format("%S %S", "hello", "world")
println(helloString)
// HELLO WORLD

// 전달된 음수를 괄호에 감싸고, 그것을 `argument_index$` 문법을 사용해 다른 포멧으로 다시 한 번 더 사용합니다.
val negativeNumberInParentheses = String.format("%(d means %1\$d", -31416)
println(negativeNumberInParentheses)
//(31416) means -31416
```

`String.format()` 함수는 문자열 템플릿과 비슷한 기능을 제공합니다. 
그러나 `String.format()` 은 많은 포매팅 옵션이 주어지기 때문에 더 유연합니다.

더해서, 포맷 문자열을 변수로부터 전달할 수도 있습니다. 이는 다국어를 지원할 때처럼 포맷 문자열이 변하는 경우에 유용합니다.

다만 `String.format()` 를 사용할 때는 전달하는 인수의 갯수나 위치가 대응하는 대체 텍스트와 어긋나기 쉬우므로 주의해야합니다.

{&?}