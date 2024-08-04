때때로, 명시적으로 서브클래스를 정의하지 않은, 아주 약간의 수정만 이루어진 클래스의 인스턴스를 만들 필요도 있을 수 있습니다.
Kotlin 은 이를 **오브젝트 표현식**과 **오브젝트 선언**을 통해 핸들링할 수 있습니다.

{#object-expressions}
## 오브젝트 표현식

**오브젝트 표현식**은, 명시적으로 `class` 키워드로 정의되지 않은 익명 클래스의 오브젝트를 생성합니다.
이러한 클래스들은 한 번 쓰고 끝날 때 유용합니다. 아무 기반 없이 만들 수도 있고, 어떤 클래스에서 파생시킬 수도 있으며, 인터페이스를 구현할 수도 있습니다.
이 익명 클래스들의 인스턴스는 어떤 이름이 아니라 표현식으로부터 만들어졌기 때문에 **익명 오브젝트**라고도 불립니다.

{#creating-anonymous-objects-from-scratch}
### 아무런 기반 없이 익명 오브젝트 만들기

오브젝트 표현식은 `object` 키워드로부터 시작됩니다.

만약 어떠한 특별한 슈퍼타입도 가지지 않는 오브젝트가 필요하다면, `object` 의 바로 뒤에 중괄호를 열고 멤버들을 작성합니다:

```kotlin
val helloWorld = object {
    val hello = "Hello"
    val world = "World"
    // 오브젝트 표현은 Any 를 확장하므로, `toString()` 함수의 선언에 `override` 가 필요합니다.
    override fun toString() = "$hello $world"
}

print(helloWorld)
```

{#inheriting-anonymous-objects-from-supertypes}
### 어떤 슈퍼타입으로부터 오브젝트 파생시키기

어떤 타입(들)을 상속받는 익명 클래스의 오브젝트를 만드려면, `object` 와 콜론(`:`) 뒤에 이 타입들을 명시합니다.
그러고 나서 마치 [상속](/docs/inheritance.md)받았을 때처럼 구현이나 재정의를 추가하면 됩니다:

```kotlin
window.addMouseListener(object : MouseAdapter() {
    override fun mouseClicked(e: MouseEvent) { /*...*/ }

    override fun mouseEntered(e: MouseEvent) { /*...*/ }
})
```

만약 어떤 슈퍼타입이 생성자를 가지고있다면, 적절한 생성자의 인수를 전달하세요. 
여러 슈퍼타입들은 콜론 뒤에 쉼표로 구분되어 병기될 수 있습니다:

```kotlin
open class A(x: Int) {
    public open val y: Int = x
}

interface B { /*...*/ }

val ab: A = object : A(1), B {
    override val y = 15
}
```

{#using-anonymous-objects-as-return-and-value-types}
### 익명 오브젝트를 리턴과 값의 타입으로 사용하기

만약 어떤 함수나 프로퍼티의 선언이 로컬이거나 [private](/docs/visibility-modifiers.md#packages) 하면서, 동시에 [inline](/docs/inline-functions.md) 이 아닌 경우 
해당 함수나 프로퍼티로부터 돌아온 오브젝트 내부의 모든 멤버에 접근할 수 있습니다:

```kotlin
class C {
    private fun getObject() = object {
        val x: String = "x"
    }

    fun printX() {
        println(getObject().x)
    }
}
```

만약 이 선언이 public 이거나 private-inline 이라면, 오브젝트의 실제 타입은:

- 어떠한 슈퍼타입도 가지지 않는다면, `Any` 입니다.
- 단 하나의 슈퍼타입만 가진다면, 그 슈퍼 타입입니다.
- 둘 이상의 슈퍼타입을 가진다면, 명시적으로 정의된 타입입니다.

모든 케이스에서, 익명 오브젝트에 추가된 멤버들은 접근 불가능합니다.
다만, 함수나 프로퍼티의 명시적인 타입에 존재하는, 재정의된 멤버들은 접근 가능합니다:

```kotlin
interface A {
    fun funFromA() {}
}
interface B

class C {
    // 리턴 타입은 Any 입니다; x 에 접근할 수 없습니다.
    fun getObject() = object {
        val x: String = "x"
    }

    // 리턴 타입은 A 입니다; x 에 접근할 수 없습니다.
    fun getObjectA() = object: A {
        override fun funFromA() {}
        val x: String = "x"
    }

    // 리턴 타입은 B 입니다; funFromA() 와 x 에 접근할 수 없습니다.
    fun getObjectB(): B = object: A, B { // 명시적인 리턴 타입이 필요합니다.
        override fun funFromA() {}
        val x: String = "x"
    }
}
```

{#accessing-variables-from-anonymous-objects}
### 익명 오브젝트의 변수 접근

오브젝트 표현 안의 코드들은 그 바깥 스코프의 변수에 접근할 수 있습니다:

```kotlin
fun countClicks(window: JComponent) {
    var clickCount = 0
    var enterCount = 0

    window.addMouseListener(object : MouseAdapter() {
        override fun mouseClicked(e: MouseEvent) {
            clickCount++
        }

        override fun mouseEntered(e: MouseEvent) {
            enterCount++
        }
    })
    // ...
}
```

{#object-declarations-overview}
## 오브젝트 선언

몇 가지 경우에서는, [싱글톤](https://en.wikipedia.org/wiki/Singleton_pattern) 패턴이 유용합니다.
Kotlin 에서는 이러한 싱글톤을 쉽게 선언할 수 있습니다:

```kotlin
object DataProviderManager {
    fun registerDataProvider(provider: DataProvider) {
        // ...
    }

    val allDataProviders: Collection<DataProvider>
        get() = // ...
}
```

이것은 **오브젝트 선언**라고 부르고, 항상 `object` 키워드에 뒤따르는 이름을 가집니다.
변수 선언과 동일하게 오브젝트 선언은 표현이 아니며, 할당문의 오른쪽에 사용될 수 없습니다.

오브젝트 선언의 초기화는 thread-safe 하며 첫 접근 시에 수행됩니다.

이 오브젝트를 나타내려면, 그의 이름을 바로 사용합니다:

```kotlin
DataProviderManager.registerDataProvider(...)
```

이러한 오브젝트들도 슈퍼타입을 가질 수 있습니다:

```kotlin
object DefaultListener : MouseAdapter() {
    override fun mouseClicked(e: MouseEvent) { ... }

    override fun mouseEntered(e: MouseEvent) { ... }
}
```

> 오브젝트 선언은 로컬일 수 없습니다. 이는 즉 어떤 함수 안에 있을 수 없다는 의미이지만, 어떤 또다른 `inner`가 아닌 클래스나 오브젝트 선언 안에는 있을 수 있습니다. 

{#data-objects}
### 데이터 오브젝트

어떤 `object` 선언이 나타내는 오브젝트를 출력하면, 출력되는 문자열에 그의 이름과 해시가 포함됩니다:

```kotlin
object MyObject

fun main() {
    println(MyObject) // MyObject@1f32e575
}
```

[데이터 클래스](/docs/data-classes.md)들과 동일하게, `object` 선언에도 `data` 수정자를 표기할 수 있습니다.
이는 해당 오브젝트에 몇 개의 함수들을 생성하도록 컴파일러에게 지시합니다:

- 데이터 오브젝트의 이름을 반환하는 `toString()`
- `equals()` 및 `hashCode()`
  > `data object` 는 `equals()` 와 `hashCode()` 를 재정의할 수 없습니다.

데이터 오브젝트의 `toString()` 함수는 해당 오브젝트의 이름을 리턴합니다:

```kotlin
data object MyDataObject {
    val x: Int = 3
}

fun main() {
    println(MyDataObject) // MyDataObject
}
```

`data object` 의 `equals()` 함수는 그 데이터 오브젝트의 타입을 가지는 모든 오브젝트들이 서로 동일함을 보장합니다. 
일반적인 경우에서, 어떠한 데이터 오브젝트에 대해 런타임에는 단 하나의 인스턴스만 존재할 것입니다(`data object` 도 언급했던것들과 마찬가지로 싱글톤입니다). 
그러나, 드물게 같은 데이터 오브젝트 타입의 서로 다른 인스턴스가 런타임에 생성될 수도 있습니다
(예를 들면, `java.lang.Reflect` 를 사용한 플랫폼 reflection 이나 이들을 내부적으로 사용하는 JVM 직렬화 라이브러리 등으로 인해).
이러한 경우에서도 이러한 오브젝트들이 모두 항상 같음을 보장합니다.

{>caution}
> `data object` 들을 비교할 때, 반드시 구조적으로만(`==`) 비교하고 참조적(`===`)으로는 비교하지 마세요.
> 이는 런타임에 당신의 데이터 오브젝트 인스턴스가 여러 개일 수 있다는 함정을 피할 수 있게 해줍니다.

```kotlin
import java.lang.reflect.Constructor

data object MySingleton

fun main() {
    val evilTwin = createInstanceViaReflection()

    println(MySingleton) // MySingleton
    println(evilTwin) // MySingleton

    // 어떤 라이브러리가 강제로 MySingleton 의 두 번째 인스턴스를 만들어도, 이들은 여전히 같습니다(`equals` 가 `true` 를 리턴합니다).
    println(MySingleton == evilTwin) // true

    // 데이터 오브젝트는 === 로 비교하지 마세요.
    println(MySingleton === evilTwin) // false
}

fun createInstanceViaReflection(): MySingleton {
    // Kotlin reflection 은 데이터 오브젝트의 초기화를 허용하지 않습니다.
    // 아래 줄은 MySingleton 인스턴스를 Java reflection 을 통해 "강제적으로" 만듭니다.
    // 따라하지 마세요!
    return (MySingleton.javaClass.declaredConstructors[0].apply { isAccessible = true } as Constructor<MySingleton>).newInstance()
}
```

생성되는 `hashCode()` 함수도 `equals()` 와 동일하게 행동하며, 따라서 어떤 하나의 `data object` 에 대해 런타임의 모든 인스턴스들은 동일한 해시코드를 가집니다.


### 데이터 오브젝트와 데이터 클래스의 차이

`data object` 와 `data class` 는 종종 같이 쓰이기도 하고 비슷한 면도 있지만, `data object` 에서는 생성되지 않는 몇 개의 함수들이 있습니다:

- `copy()` 함수가 없습니다. `data object` 는 하나의 인스턴스만 사용됨을 의도로 하고 있기 때문에, `copy()` 함수를 만들지 않습니다.
  싱글톤 패턴은 해당 클래스의 새로운 인스턴스가 초기화되는 것을 제한하며, 즉 싱글톤 인스턴스를 복제하여 새로 만드는 것은 이에 위배됩니다.
- `componentN()` 함수가 없습니다. `data class` 와 다르게, `data object` 는 데이터 프로퍼티가 없습니다. 
  데이터 프로퍼티 없이 그의 데이터를 분해할 수는 없으므로, `componentN()` 함수를 만들지 않습니다.

### 봉인된 계층에서의 데이터 오브젝트

데이터 오브젝트 선언은 특히 [봉인된 클래스나 인터페이스](/docs/sealed-classes.md)같은 봉인된 계층에서 유용합니다.
그 이유는 그들과 함께 정의되었을 수 있는 데이터 클래스들과의 대칭성을 유지할 수 있기 때문입니다.
이 예제에서는, `EndOfFile` 을 일반적인 `object` 가 아닌 `data object` 로 선언하여, 별도로 재정의할 필요 없이 `toString()` 함수를 제공받을 수 있습니다:

```kotlin
sealed interface ReadResult
data class Number(val number: Int) : ReadResult
data class Text(val text: String) : ReadResult
data object EndOfFile : ReadResult

fun main() {
    println(Number(7)) // Number(number=7)
    println(EndOfFile) // EndOfFile
}
```

{#companion-objects}
## 동반 오브젝트 (companion object)

어떠한 클래스 안에 있는 오브젝트 선언은 `companion` 키워드로 표기될 수 있습니다:

```kotlin
class MyClass {
    companion object Factory {
        fun create(): MyClass = MyClass()
    }
}
```

동반 오브젝트의 멤버들은 간단하게 해당 클래스의 이름을 통해 호출될 수 있습니다:

```kotlin
val instance = MyClass.create()
```

동반 오브젝트의 이름은 생략될 수 있으며, 그럴 경우 기본값인 `Companion` 이 사용됩니다:

```kotlin
class MyClass {
    companion object { }
}

val x = MyClass.Companion
```

클래스의 멤버들은 그에 대응하는 동반 오브젝트의 private 한 멤버들에 접근할 수 있습니다.

클래스의 이름이 다른 이름을 가리키지 않고 자기 자신으로 쓰이면, 해당 클래스의 동반 오브젝트(이름이 지어졌던, 그렇지 않던)를 참조합니다:

```kotlin
class MyClass1 {
    companion object Named { }
}

val x = MyClass1

class MyClass2 {
    companion object { }
}

val y = MyClass2
```

동반 오브젝트의 멤버들이 다른 언어들에서의 정적 멤버와 비슷하게 생겼지만, 이들은 여전히 어떤 실제 오브젝트의 인스턴스 멤버이며, 그렇기 때문에, 예를 들면 인터페이스를 구현할 수도 있습니다:

```kotlin
interface Factory<T> {
    fun create(): T
}

class MyClass {
    companion object : Factory<MyClass> {
        override fun create(): MyClass = MyClass()
    }
}

val f: Factory<MyClass> = MyClass
```

그러나, JVM 환경에서 동반 오브젝트의 멤버가 실제로 static 메서드와 필드들로 변환되도록 `@JvmStatic` 을 사용할 수도 있습니다. [Java 상호운용성](/docs/java-to-kotlin-interop.md#static-fields) 문서를 확인해보세요.

{#semantic-difference-between-object-expressions-and-declarations}
### 오브젝트 표현과 선언의 의미론적인 차이

오브젝트 표현과 선언 사이에는 중요한 의미론적인 차이가 있습니다:

- 오브젝트 표현은 그 표현이 평가되는 **즉시** 실행되고 초기화됩니다.
- 오브젝트 정의는 그것에 처음 접근하는 시점까지 **지연된 뒤에** 초기화됩니다.
- 동반 오브젝트는 Java 의 정적 초기화에 맞춰 해당 클래스가 로드(resolve)될 때 초기화됩니다.

{&?}
