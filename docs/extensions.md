Kotlin 은 어떤 클래스나 인터페이스에 대해, 그것들을 직접 확장하거나 **데코레이터** 등의 디자인 패턴을 사용하지 않고도 새로운 기능을 추가할 수 있는 방법을 제공합니다.
이들은 **익스텐션** 이라는 이름의 선언으로 이루어집니다.

예를 들어, 서드 파티 라이브러리여서 수정할 수 없는 어떤 클래스나 인터페이스에 대해 새로운 함수를 추가할 수도 있습니다.
이러한 함수들은 원래부터 그 클래스에 존재했던 것처럼 일반적인 방법으로 호출될 수 있습니다. 이 매커니즘은 **확장 함수**(익스텐션 함수) 라고 부릅니다.
이외에도 **확장 프로퍼티**(익스텐션 프로퍼티)라는, 존재하는 클래스에 새로운 프로퍼티를 정의할 수 있는 매커니즘도 존재합니다.

## 확장 함수

확장 함수를 정의하려면, 이름 앞에 **수신자 타입**을 덧붙히면 됩니다. 이 타입은 확장하려는 대상의 타입입니다.
아래의 예제는 `MutableList<Int>` 에 `swap` 함수를 추가합니다:

```kotlin
fun MutableList<Int>.swap(index1: Int, index2: Int) {
    val tmp = this[index1] // 'this' 는 이 리스트입니다.
    this[index1] = this[index2]
    this[index2] = tmp
}
```

익스텐션 함수 안쪽의 `this` 키워드는 수신자 오브젝트(이 함수를 호출하기 위한 점(.) 앞에 제시된 오브젝트)입니다.
이제, 아무 `MutableList<Int>` 에 대해 이 함수를 호출할 수 있습니다:

```kotlin
val list = mutableListOf(1, 2, 3)
list.swap(0, 2) // 'swap()' 함수 안쪽의 'this' 는 'list' 가 됩니다.
```

이 함수가 아무 `MutableList<T>` 에 대해서 통용될 수 있다면, 이를 제너릭으로 만들 수 있습니다:

```kotlin 
fun <T> MutableList<T>.swap(index1: Int, index2: Int) {
    val tmp = this[index1] // 'this' 는 이 리스트입니다.
    this[index1] = this[index2]
    this[index2] = tmp
}
```

제너릭 타입 파라미터를 함수 이름 앞에 제시하여야 수신자의 타입 표현에 사용할 수 있습니다. 
이와 관련된 자세한 내용은 [제너릭 함수](/docs/generics.md)를 살펴보세요.

## 익스텐션들은 정적으로 수집됩니다
익스텐션은 사실 확장하는 클래스를 수정하지 않습니다. 익스텐션을 정의하는 행위는 클래스를 수정하는 것이 아닌, 
그저 확장하는 타입에 대해 점 표기법을 통해 선언한 함수를 호출할 수 있도록 할 뿐입니다.

확장 함수들은 **정적으로** 파견됩니다. 즉, 어떤 익스텐션 함수가 호출될 수 있는지가 수신자 타입에 기반해 컴파일 타임에 이미 모두 알려져 있습니다.
예를 들어:

```kotlin 
open class Shape
class Rectangle: Shape()

fun Shape.getName() = "Shape"
fun Rectangle.getName() = "Rectangle"

fun printClassName(s: Shape) {
    println(s.getName())
}

printClassName(Rectangle())
```

이 예제는 **Shape** 를 출력합니다. 그 이유는 호출된 확장 함수가 `Shape` 타입으로 선언된 파라미터 `s` 에만 의존하기 때문입니다.

만약 클래스에 어떤 멤버 함수가 있었고, 확장 함수가 같은 수신자 타입과 같은 이름, 그리고 호환되는 인수들을 가졌다면, **멤버 함수가 항상 우선**하여 사용됩니다.
예를 들어:

```kotlin
class Example {
    fun printFunctionType() { println("Class method") }
}

fun Example.printFunctionType() { println("Extension function") }

Example().printFunctionType()
```

이 코드는 **Class method** 를 출력합니다.

그러나, 동일한 이름을 가졌지만 서로 다른 형태를 가지도록 익스텐션을 만들어 오버로드하는 것은 물론 가능합니다:

```kotlin
class Example {
    fun printFunctionType() { println("Class method") }
}

fun Example.printFunctionType(i: Int) { println("Extension function #$i") }

Example().printFunctionType(1)
```

---

위의 코드는 `Extension function #1` 을 출력합니다.

## Nullable 한 수신자

익스텐션들은 nullable 한 수신자 타입에 대해서도 선언될 수 있습니다. 
이러한 익스텐션들은 그 값이 null 인 오브젝트 변수들에 대해서도 호출될 수 있습니다.
만약 수신자가 `null` 이면, `this` 도 역시 `null` 입니다.
그러므로 nullable 한 수신자 타입에 대해 익스텐션을 만들 때는 컴파일 에러를 막기 위해 함수 안에서 `this == null` 체크를 수행하는 것을 권장합니다.

Kotlin 에서는 이미 확장함수에 의해 `null` 체크가 수행되므로 `toString()` 을 직접 체크하지 않아도 호출할 수 있습니다.

```kotlin
fun Any?.toString(): String {
    if (this == null) return "null"
    // After the null check, 'this' is autocast to a non-nullable type, so the toString() below
    // resolves to the member function of the Any class
    return toString()
}
```

## 익스텐션 프로퍼티

Kotlin 은 익스텐션 함수가 지원하는 것과 비슷하게 익스텐션 프로퍼티도 지원합니다:

```kotlin
val <T> List<T>.lastIndex: Int
    get() = size - 1
```

> 익스텐션이 실제로 클래스에 멤버를 추가하는 행위가 아니기 때문에, 
> 익스텐션 프로퍼티가 [기반 필드](/docs/properties.md#기반_필드)를 가지게 할 효과적인 방법이 없습니다.
> 그렇기 때문에, **익스텐션 프로퍼티에는 초기화 표현이 허용되지 않습니다**. 
> 이들의 동작은 반드시 getter 와 setter 에 의해 정의되어야 합니다.

예를 들어: 

```kotlin
val House.number = 1 // error: initializers are not allowed for extension properties
```

## 동반 오브젝트의 익스텐션

어떤 클래스에 [동반 오브젝트](/docs/object-declarations.md#동반-오브젝트-companion-object)가 정의되어있다면, 
그 동반 오브젝트에 대한 익스텐션 함수나 프로퍼티도 정의할 수 있습니다. 일반적인 동반 오브젝트의 멤버와 동일하게, 클래스의 이름만을 사용하여 호출될 수 있습니다:

```kotlin
class MyClass {
    companion object { }  // "Companion" 라는 이름이 붙습니다.
}

fun MyClass.Companion.printCompanion() { println("companion") }

fun main() {
    MyClass.printCompanion()
}
```

## 확장함수의 스코프

대부분의 경우에서, 확장 함수는 패키지 바로 아래의 최상위 레벨에 정의됩니다:

```kotlin
package org.example.declarations

fun List<String>.getLongestString() { /*...*/}
```

확장 함수를 선언된 패키지 밖에서 사용하려면, 사용하는 측에서 import 해야합니다:

```kotlin
package org.example.usage

import org.example.declarations.getLongestString

fun main() {
    val list = listOf("red", "green", "blue")
    list.getLongestString()
}
```

이와 관련한 더 자세한 사항은 [Import](/docs/packages.md#임포트) 문서를 확인해보세요.

## 익스텐션을 멤버로 정의하기

어떤 한 타입에 대한 익스텐션을 또다른 클래스의 안쪽에 정의할 수도 있습니다. 
이런 익스텐션의 안쪽에는 식별자 없이 멤버에 접근할 수 있는 여러 개의 암시적 수신자가 존재하게 됩니다.
익스텐션이 선언된 클래스의 인스턴스는 **파견 수신자**라고 하고, 익스텐션 함수의 수신자 타입을 가지는 인스턴스는 **익스텐션 수신자**라고 합니다.

```kotlin
class Host(val hostname: String) {
    fun printHostname() { print(hostname) }
}

class Connection(val host: Host, val port: Int) {
    fun printPort() { print(port) }

    fun Host.printConnectionString() {
        printHostname()   // Host.printHostname() 를 호출합니다.
        print(":")
        printPort()   // Connection.printPort() 를 호출합니다.
    }

    fun connect() {
        /*...*/
        host.printConnectionString()   // 익스텐션 함수를 호출합니다.
    }
}

fun main() {
    Connection(Host("kotl.in"), 443).connect()
    //Host("kotl.in").printConnectionString()  // Connection 바깥쪽에서는 이 익스텐션 함수를 사용할 수 없습니다.
}
```

파견 수신자와 익스텐션 수신자 사이에 이름 충돌이 발생할 때는, 익스텐션 수신자가 우선순위를 가집니다.
파견 수신자의 그것을 사용하려면, [꼬리표가 붙은 `this` 문법](/docs/this-expressions.md#꼬리표가-붙은-this)을 사용합니다.

```kotlin
class Connection {
    fun Host.getConnectionString() {
        toString()         // Host.toString() 를 호출합니다.
        this@Connection.toString()  // Connection.toString() 를 호출합니다.
    }
}
```

멤버로 선언된 익스텐션은 `open` 일 수 있으며, 서브클래스에서 재정의될 수 있습니다.
이는 이러한 함수들에의 파견이 파견 수신자 타입에 대해 가상적임을 의미하지만, 익스텐션 수신자 타입에 대해 정적임을 의미합니다.

```kotlin
open class Base { }

class Derived : Base() { }

open class BaseCaller {
    open fun Base.printFunctionInfo() {
        println("Base extension function in BaseCaller")
    }

    open fun Derived.printFunctionInfo() {
        println("Derived extension function in BaseCaller")
    }

    fun call(b: Base) {
        b.printFunctionInfo()   // call the extension function
    }
}

class DerivedCaller: BaseCaller() {
    override fun Base.printFunctionInfo() {
        println("Base extension function in DerivedCaller")
    }

    override fun Derived.printFunctionInfo() {
        println("Derived extension function in DerivedCaller")
    }
}

fun main() {
    BaseCaller().call(Base())   // "Base extension function in BaseCaller"
    DerivedCaller().call(Base())  // "Base extension function in DerivedCaller" - dispatch receiver is resolved virtually
    DerivedCaller().call(Derived())  // "Base extension function in DerivedCaller" - extension receiver is resolved statically
}
```

## 가시성에 관련한 노트

익스텐션은 같은 스코프의 같은 가시성 수정자들에 대해 일반 함수와 동일하게 작동합니다. 예를 들어:

- 최상위 레벨에 정의된 익스텐션은 다른 `private`인 같은 파일 내 최상위 레벨의 선언들에 접근할 수 있습니다.
- 익스텐션이 수신자 타입의 바깥에 정의되어있다면, 익스텐션은 그 수신자 타입의 `private` 나 `protected` 멤버들에 접근할 수 없습니다.

{&?}
