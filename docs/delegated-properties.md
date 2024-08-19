일반적인 프로퍼티들에 대해, 필요할 때마다 매번 구현할 수도 있지만 한 번만 구현하여 라이브러리에 추가하고 재사용하는 것이 더 도움이 될 것입니다.
예를 들어:

- **지연된** 프로퍼티: 그의 값이 첫 접근 시에만 초기화됩니다.
- **추적할 수 있는** 프로퍼티: 그의 값에 대한 변경이 추적자에게 알려집니다.
- 각 프로퍼티들을 별도의 필드가 아닌 **map** 에 저장하려는 경우

위를 비롯한 여러 다른 케이스들을 핸들링하기 위해, Kotlin 은 **위임된 프로퍼티**를 지원합니다:

```kotlin
class Example {
    var p: String by Delegate()
}
```

이는 `val/var <property name>: <Type> by <expression>` 와 같은 문법으로 표현됩니다.
`by` 키워드 뒤의 표현이 해당 프로퍼티의 `get()`(과 `set()`) 동작을 `getValue()` 와 `setValue()` 를 통해 위임받으므로 **수임자**가 됩니다.
프로퍼티의 수임자들은 어떠한 인터페이스도 구현할 필요가 없지만, 대신 `getValue()`(`var` 로 설정할 수 있다면 `setValue()` 도 같이) 연산자 함수를 제공해야합니다.

예를 들어:

```kotlin
import kotlin.reflect.KProperty

class Delegate {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): String {
        return "$thisRef, thank you for delegating '${property.name}' to me!"
    }

    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        println("$value has been assigned to '${property.name}' in $thisRef.")
    }
}
```

이렇게 정의된 수임자에 대해 `p` 를 읽으려고 하면, 이 행위가 `Delegate` 인스턴스에게 위임되며 그의 `getValue()` 함수가 호출됩니다.
이 함수의 첫 파라미터는 `p` 프로퍼티가 정의된 인스턴스이며, 두 번째 파라미터는 리플렉션을 통한 `p` 자체에 대한 정보입니다. 예를 들어 이 필드의 이름인 `"p"` 를 가져올 수도 있겠지요.

```kotlin
val e = Example()
println(e.p)
```

와 같은 코드는 아래처럼 출력합니다:

`Example@33a17727, thank you for delegating 'p' to me!`

비슷하게, `p` 에 값을 쓸 수도 있으며, 이럴 때는 `setValue()` 가 호출됩니다. 앞쪽 두 파라미터는 `getValue()` 의 그것과 같고, 세 번째 파라미터는 할당하려고 시도한 값이 전달됩니다:

```kotlin
e.p = "NEW"
```

와 같은 코드는 아래를 출력합니다:

`NEW has been assigned to 'p' in Example@33a17727.`

수임자 오브젝트가 가져야하는 요구 사항들은 [아래](#프로퍼티-수임자-구현의-요구사항)에 더 자세히 기술되어있습니다.

위임된 프로퍼티는 함수나 코드 블럭 안에서도 정의할 수 있으며 반드시 클래스의 멤버여야 할 필요는 없습니다. 
아래에서 [예제](#지역적으로-위임된-프로퍼티)를 확인할 수 있습니다.

## 표준 수임자

Kotlin 표준 라이브러리는 몇몇 쓸만한 위임 프로퍼티를 위한 팩토리 함수를 제공합니다.

### 지연된 프로퍼티
[`lazy()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/lazy.html) 는 람다를 프로퍼티로 받아 `Lazy<T>` 인스턴스를 리턴하는 함수로, 지연된 프로퍼티에 대한 구현을 수임받았습니다.
가장 첫 `get()` 호출이 `lazy()` 함수에 전달된 람다를 실행하고, 그 결과를 기억합니다. 이후에 뒤따르는 `get()` 호출은 곧바로 기억된 결과를 리턴합니다.

```kotlin
val lazyValue: String by lazy {
    println("computed!")
    "Hello"
}

fun main() {
    println(lazyValue)
    println(lazyValue)
}
```

---
{&^---}

위의 코드는 아래처럼 출력합니다:
```text
computed!
Hello
Hello
```

{&$---}

&nbsp;  
기본적으로는, 지연된 프로퍼티들의 계산은 **동기화됩니다**: 단 하나의 스레드에서만 계산되지만, 모든 스레드에서 같은 값을 확인할 수 있습니다.
만약 이러한 프로퍼티 초기화 과정에서의 동기화가 필요 없고 여러 스레드가 동시적으로 계산하는 것을 허용하려면, 
`lazy()` 함수의 파라미터로 `LazyThreadSafetyMode.PUBLICATION` 를 전달할 수도 있습니다.

만약 이 프로퍼티의 초기화가 그것을 사용하려는 곳과 동일한 스레드에서 일어난다고 확신할 수 있다면, 
스레드 안정성을 제공하지 않지만 이 모든 동기화 오버헤드를 제거할 수 있는 `LazyThreadSafetyMode.NONE` 를 사용할 수 있습니다.

### 추적할 수 있는 프로퍼티

[`Delegates.observable()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.properties/-delegates/observable.html) 함수는, 
프로퍼티의 초기값과 그의 변경 시에 불릴 핸들러를 받습니다.

이 핸들러는 매번 프로퍼티에 값을 쓰면 그 값의 할당이 이루어진 **이후에** 호출되며, '할당되려는 프로퍼티 자신', '기존 값', '새 값'으로 총 3개의 파라미터가 있습니다.

```kotlin
import kotlin.properties.Delegates

class User {
    var name: String by Delegates.observable("<no name>") {
        prop, old, new ->
        println("$old -> $new")
    }
}

fun main() {
    val user = User()
    user.name = "first"
    user.name = "second"
}
```

만약 할당 연산을 가로채서 일정 조건에 따라 그 연산 자체를 거부하고 싶다면, [`vetoable()`](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.properties/-delegates/vetoable.html)을 대신 사용하세요. 
`vetoable` 에 전달되는 핸들러는 할당 동작이 이루어지기 **전에** 호출됩니다.

## 또다른 프로퍼티에게 위임하기

프로퍼티는 자신의 getter 와 setter 를 다른 프로퍼티에게 위임할 수 있습니다. 이러한 위임은 최상위 레벨이나 클래스 프로퍼티(멤버나 확장)에 대해서만 가능합니다.
위임받는 수임자 프로퍼티는 다음 중 하나일 수 있습니다:

- 최상의 레벨의 프로퍼티
- 같은 클래스의 멤버나 확장 프로퍼티
- 다른 클래스의 멤버나 확장 프로퍼티

어떤 프로퍼티를 다른 프로퍼티에게로 위임하려면, 수임받을 프로퍼티의 이름을 `::` 뒤에 표기합니다. 예를 들면, `this::delegate` 나 `MyClass::delegate` 등입니다.

```kotlin
var topLevelInt: Int = 0
class ClassWithDelegate(val anotherClassInt: Int)

class MyClass(var memberInt: Int, val anotherClassInstance: ClassWithDelegate) {
    var delegatedToMember: Int by this::memberInt
    var delegatedToTopLevel: Int by ::topLevelInt

    val delegatedToAnotherClass: Int by anotherClassInstance::anotherClassInt
}
var MyClass.extDelegated: Int by ::topLevelInt
```

이러한 위임은 어떤 프로퍼티의 이름을 이전 버전과의 호환성을 유지하면서 변경하고 싶을 때 유용합니다:
새로운 프로퍼티를 만들고, 기존 것을 `@Deprecated` 로 표기한 뒤, 그의 구현을 새 프로퍼티에게로 위임할 수 있습니다.

```kotlin
class MyClass {
   var newName: Int = 0
   @Deprecated("Use 'newName' instead", ReplaceWith("newName"))
   var oldName: Int by this::newName
}
fun main() {
   val myClass = MyClass()
   // Notification: 'oldName: Int' is deprecated.
   // Use 'newName' instead
   myClass.oldName = 42
   println(myClass.newName) // 42
}
```

## 프로퍼티를 Map 에 저장

또다른 일반적인 사용처는 프로퍼티들을 Map 에 저장하는 경우입니다. 
이러한 상황은 JSON 을 파싱하려고 하거나 데이터의 타입이 유동적인 작업을 할 때 주로 발생합니다.
이럴 때는, Map 의 인스턴스를 수임자로 곧바로 사용할 수 있습니다.

```kotlin
class User(val map: Map<String, Any?>) {
    val name: String by map
    val age: Int     by map
}
```

이 예제에서, 생성자는 아래처럼 Map 을 받습니다:

```kotlin
val user = User(mapOf(
    "name" to "John Doe",
    "age"  to 25
))
```

프로퍼티를 수임받은 Map 은 자신에게서 프로퍼티의 이름을 표현하는 문자열 키를 사용해 값을 꺼냅니다:

```kotlin
println(user.name) // Prints "John Doe"
println(user.age)  // Prints 25
```

`var` 프로퍼티에도 읽을 수만 있는 `Map` 대신 `MutableMap` 으로 위임하면 기대한 대로 동작합니다:

```kotlin
class MutableUser(val map: MutableMap<String, Any?>) {
    var name: String by map
    var age: Int     by map
}
```

## 지역적으로 위임된 프로퍼티

로컬 변수도 위임된 프로퍼티로 선언할 수 있습니다. 예를 들어, 로컬 변수를 지연되도록 만들 수 있습니다:

```kotlin
fun example(computeFoo: () -> Foo) {
    val memoizedFoo by lazy(computeFoo)

    if (someCondition && memoizedFoo.isValid()) {
        memoizedFoo.doSomething()
    }
}
```

`momoizedFoo` 변수는 그의 첫 접근 시에만 계산됩니다. 만약 `someCondition` 이 실패하면, 한 번도 계산되지 않습니다.

## 프로퍼티 수임자 구현의 요구사항

**읽기 전용** 프로퍼티(`val`) 들의 수임자는, 아래의 파라미터들을 가지는 연산자 함수인 `getValue()` 를 제공해야합니다:

- `thisRef`은 반드시 위임하는 **프로퍼티의 소유자**의 타입이나 그의 슈퍼타입을 가져야 합니다(확장 프로퍼티라면 확장되는 타입이어야 합니다).
- `property` 는 반드시 `KProperty<*>` 이거나 그의 슈퍼타입이어야 합니다.

그리고, `getValue()` 가 리턴하는 값은 반드시 프로퍼티의 타입과 일치하거나 그의 서브타입이어야 합니다.

```kotlin
class Resource

class Owner {
    val valResource: Resource by ResourceDelegate()
}

class ResourceDelegate {
    operator fun getValue(thisRef: Owner, property: KProperty<*>): Resource {
        return Resource()
    }
}
```

수정 가능한 프로퍼티(`val`) 들의 수임자는, `setValue()` 라는 연산자 함수를 추가적으로 제공해야합니다:

- `thisRef`은 반드시 위임하는 **프로퍼티의 소유자**의 타입이나 그의 슈퍼타입을 가져야 합니다(확장 프로퍼티라면 확장되는 타입이어야 합니다).
- `property` 는 반드시 `KProperty<*>` 이거나 그의 슈퍼타입이어야 합니다.
- `value` 는 반드시 프로퍼티와 같은 타입이나 그의 슈퍼타입을 가져야 합니다.

`getValue()` 와 `setValue()` 는 함수들은 수임자 클래스의 멤버이거나 확장 함수로 제공될 수 있습니다.
후자는 이러한 함수들을 제공하지 않는 오브젝트에게 어떤 프로퍼티를 위임하려고 할 때 유용합니다.
이 두 함수는 모두 `operator` 키워드로 표기되어야 합니다.

수임자에 대한 클래스를 직접 만들지 않고도, Kotlin 표준 라이브러리에 포함된 `ReadOnlyProperty` 와 `ReadWriteProperty`를 구현하는 
익명 오브젝트를 통해 프로퍼티를 위임할 수 있습니다. `ReadOnlyProperty` 는 `getValue()` 를 가지며, `ReadWriteProperty` 가 그것을 확장하고 `setValue()` 를 추가합니다.
즉, `ReadWriteProperty` 를 `ReadOnlyProperty` 의 자리에 전달할 수 있음을 의미합니다.

```kotlin
fun resourceDelegate(resource: Resource = Resource()): ReadWriteProperty<Any?, Resource> =
    object : ReadWriteProperty<Any?, Resource> {
        var curValue = resource
        override fun getValue(thisRef: Any?, property: KProperty<*>): Resource = curValue
        override fun setValue(thisRef: Any?, property: KProperty<*>, value: Resource) {
            curValue = value
        }
    }

val readOnlyResource: Resource by resourceDelegate()  // ReadWriteProperty as val
var readWriteResource: Resource by resourceDelegate()
```

## 위임된 프로퍼티들의 변환 규칙

블랙박스의 안쪽에서, Kotlin 컴파일러가 몇몇 종류의 위임된 프로퍼티에 대해 보조적인 프로퍼티를 추가하고, 그들에게 위임합니다.

> 최적화의 측면에서, 컴파일러가 [보조적인 프로퍼티를 생성하지 않는 경우](#위임된-프로퍼티의-최적화된-케이스)도 있습니다.
> [다른 프로퍼티에 위임](#다른-프로퍼티에-위임할-때의-변환-규칙)하는 예제에 대한 최적화를 살펴보세요.

예를 들어, `prop` 프로퍼티에 대해 컴파일러는 숨겨진 프로퍼티인 `prop$delegate` 를 추가하며, 
원본 프로퍼티의 접근자들을 단순히 이 숨겨진 프로퍼티에 위임합니다:

```kotlin
class C {
    var prop: Type by MyDelegate()
}

// 이 코드는 컴파일러에 의해 생성되는 코드입니다.
class C {
    private val prop$delegate = MyDelegate()
    var prop: Type
        get() = prop$delegate.getValue(this, this::prop)
        set(value: Type) = prop$delegate.setValue(this, this::prop, value)
}
```

Kotlin 컴파일러는 `prop` 의 모든 정보를 인수로 전달합니다: 첫 인수인 `this` 는 바깥쪽 클래스인 `C` 이며, 
`this::prop` 은 `prop` 그 자체를 표현하는 리플렉션 오브젝트입니다.

### 위임된 프로퍼티의 최적화된 케이스

`$delegate` 필드는 위임자가 아래 중 하나이면 생략됩니다:

- 다른 프로퍼티의 레퍼런스
  ```kotlin
  class C<Type> {
      private var impl: Type = ...
      var prop: Type by ::impl
  }
  ```

- 선언된 이름이 있는 오브젝트
  ```kotlin
  object NamedObject {
      operator fun getValue(thisRef: Any?, property: KProperty<*>): String = ...
  }

  val s: String by NamedObject
  ```

- 기반 필드를 가지면서 기본 getter 가 같은 모듈에 존재하는 최종(final) `val` 프로퍼티:
  ```kotlin
  val impl: ReadOnlyProperty<Any?, String> = ...

  class A {
      val s: String by impl
  }
  ```

- 상수 표현, 열거형 항목, `this`, `null`. `this` 에 대한 예시는 아래와 같습니다:
  ```kotlin
  class A {
      operator fun getValue(thisRef: Any?, property: KProperty<*>) ...

      val s by this
  }
  ```

### 다른 프로퍼티에 위임할 때의 변환 규칙

어떤 프로퍼티가 또 다른 프로퍼티에게 자신의 접근자를 위임하는 경우, Kotlin 컴파일러는 리플렉션을 통해 
레퍼런스된 프로퍼티로 수임자를 생성합니다. 이것은 컴파일러가 `prop$delegate` 을 만들지 않는 다는 것을 의미합니다.
이 최적화는 메모리를 아끼는데 도움이 됩니다.

예를 들어, 아래의 코드를 살펴볼까요:

```kotlin
class C<Type> {
    private var impl: Type = ...
    var prop: Type by ::impl
}
```

`prop` 의 접근자가 수임된 프로퍼티의 `getValue()` 와 `setValue()`를 생략하고 곧바로 `impl` 로 위임되었습니다. 
그러므로, `KProperty` 레퍼런스 오브젝트가 필요하지 않습니다.

위의 코드로부터, 컴파일러는 아래의 코드를 생성합니다:

```kotlin
class C<Type> {
    private var impl: Type = ...

    var prop: Type
        get() = impl
        set(value) {
            impl = value
        }

    fun getProp$delegate(): Type = impl // This method is needed only for reflection
}
```

## 수임자 제공하기

`provideDelegate` 함수를 정의함으로써, 수임자 객체를 생성하는 로직을 확장할 수 있습니다.
만약 `provideDelegate` 를 멤버나 확장으로서 정의하는 어떤 오브젝트가 `by` 뒤에 사용되면,
그 함수가 수임자 인스턴스를 생성하기 위해 호출됩니다.

`provideDelegate` 의 일반적인 사용 케이스는 위임자 프로퍼티의 일관성을 확인할 때입니다.

얘를 들어, 바인딩하기 전에 위임자 프로퍼티의 이름을 확인하려면, 이렇게 생긴 무언가를 작성해야합니다:

```kotlin
class ResourceDelegate<T> : ReadOnlyProperty<MyUI, T> {
    override fun getValue(thisRef: MyUI, property: KProperty<*>): T { ... }
}

class ResourceLoader<T>(id: ResourceID<T>) {
    operator fun provideDelegate(
            thisRef: MyUI,
            prop: KProperty<*>
    ): ReadOnlyProperty<MyUI, T> {
        checkProperty(thisRef, prop.name)
        // create delegate
        return ResourceDelegate()
    }

    private fun checkProperty(thisRef: MyUI, name: String) { ... }
}

class MyUI {
    fun <T> bindResource(id: ResourceID<T>): ResourceLoader<T> { ... }

    val image by bindResource(ResourceID.image_id)
    val text by bindResource(ResourceID.text_id)
}
```

`provideDelegate` 의 파라미터 구성은 `getValue()` 와 동일합니다:

- `thisRef`은 반드시 위임하는 **프로퍼티의 소유자**의 타입이나 그의 슈퍼타입을 가져야 합니다(확장 프로퍼티라면 확장되는 타입이어야 합니다).
- `property` 는 반드시 `KProperty<*>` 이거나 그의 슈퍼타입이어야 합니다.

`provideDelegate` 함수는 `MyUI` 인스턴스의 초기화 과정 중 매 프로퍼티들에 대해 각각 호출되며,
그에 대한 유효성 검증을 곧바로 실행합니다.

이러한 프로퍼티와 수임자 간의 바인딩을 가로채는 기능 없이 위의 예제에서 표현하는 기능을 구현하려면
프로퍼티의 이름을 명시적으로 전달해야하므로 굉장히 불편합니다:

```kotlin
// "provideDelegate" 기능 없이 프로퍼티의 이름을 확인합니다.
class MyUI {
    val image by bindResource(ResourceID.image_id, "image")
    val text by bindResource(ResourceID.text_id, "text")
}

fun <T> MyUI.bindResource(
        id: ResourceID<T>,
        propertyName: String
): ReadOnlyProperty<MyUI, T> {
    checkProperty(this, propertyName)
    // create delegate
}
```

컴파일러에 의해 생성되는 코드에서, `provideDelegate` 함수가 `prop$delegate` 보조 프로퍼티를 초기화하기 위해 호출됩니다.
`provideDelegate` 함수가 정의되지 않았을 때, [위](#위임된-프로퍼티들의-변환-규칙)에서도 확인할 수 있는 `val prop: Type by MyDelegate()` 에 대해 생성되었던 코드와 비교해보세요:

```kotlin
class C {
    var prop: Type by MyDelegate()
}

// 이 코드는 컴파일러에 의해 생성되는 코드입니다.
// 'provideDelegate' 함수가 사용 가능한 경우:
class C {
    // "provideDelegate" 를 호출하여 보조 $delegate 프로퍼티를 초기화합니다.
    private val prop$delegate = MyDelegate().provideDelegate(this, this::prop)
    var prop: Type
        get() = prop$delegate.getValue(this, this::prop)
        set(value: Type) = prop$delegate.setValue(this, this::prop, value)
}
```

`provideDelegate` 함수는 오직 보조 프로퍼티의 초기화에만 사용되고 같이 생성되는 getter 및 setter 에는 영향을 주지 않는다는 것을 기억하세요.

Kotlin 표준 라이브러리의 `PropertyDelegateProvider` 인터페이스를 사용하면, 별도의 클래스를 만들지 않고 수임자 제공자를 정의할 수 있습니다.

```kotlin
val provider = PropertyDelegateProvider { thisRef: Any?, property ->
    ReadOnlyProperty<Any?, Int> {_, property -> 42 }
}
val delegate: Int by provider
```

{&?}
