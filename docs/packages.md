소스 파일은 패키지 정의와 함께 시작될 수 있습니다:

```kotlin
package org.example

fun printMessage() { /*...*/ }
class Message { /*...*/ }

// ...
```

클래스와 함수를 포함하여, 해당 소스 파일의 모든 내용은 이 패키지에 속하게 됩니다. 
즉, 위의 예제에서 `printMessage()` 의 전체 명칭은 `org.example.printMessage` 이 되고 `Message` 의 전체 명칭은 `org.example.Message` 가 됩니다. 

패키지가 정의되어있지 않은 파일의 내용은 이름이 없는 **default** 패키지에 포함됩니다.

## 기본 임포트

몇몇 개의 패키지는 Kotlin 소스 파일에 기본적으로 임포트됩니다:

{*large-spacing}

- [kotlin.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/index.html)
- [kotlin.annotation.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.annotation/index.html)
- [kotlin.collections.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/index.html)
- [kotlin.comparisons.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.comparisons/index.html)
- [kotlin.io.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.io/index.html)
- [kotlin.ranges.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.ranges/index.html)
- [kotlin.sequences.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.sequences/index.html)
- [kotlin.text.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.text/index.html)

타겟팅하는 플랫폼에 따라, 다음 패키지들이 기본으로 추가 임포트됩니다:

{*large-spacing}

- JVM:
  - java.lang.*
  - [kotlin.jvm.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.jvm/index.html)
- JS:
  - [kotlin.js.*](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.js/index.html)

## 임포트

기본 임포트와는 별개로, 소스 파일들은 자신의 독자적인 `import` 표현을 포함할 수 있습니다.  

하나의 전체 명칭을 통해 임포트 하거나:

```kotlin
import org.example.Message // Message 는 패키지 경로 없이 접근할 수 있습니다.
```

범위 안에 있는 모든 패키지, 클래스, 오브젝트 들을 임포트할 수 있습니다:

```kotlin
import org.example.* // 'org.example' 에 있는 모든 것들이 접근 가능합니다.
```

만약 이름에서 충돌이 발생하면, 이를 해당 파일 내에서 유일화하기 위해 `as` 를 사용할 수 있습니다:

```kotlin
import org.example.Message // Message 에 접근 가능합니다.
import org.test.Message as TestMessage // TestMessage 는 'org.test.Message' 로 작동합니다.
```

`import` 구문은 단지 클래스를 임포트하는 것으로 한정되지 않으며, 다른 정의된 엔티티들도 임포트할 수 있습니다:

- 최상위 레벨의 함수와 프로퍼티
- [오브젝트 정의](/docs/object-declarations.md#오브젝트-선언-훑어보기)에 포함된 함수와 프로퍼티
- [열겨형 상수](/docs/enum-classes.md)

## 최상위 레벨에 정의된 엔티티들의 가시성

최상위 레벨의 엔티티가 `private` 으로 마크되어 있으면 해당 엔티티는 그 엔티티가 정의된 파일 내에서만 사용할 수 있습니다([가시성 수정자](/docs/visibility-modifiers.md) 문서를 확인해보세요).
