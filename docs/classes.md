Kotlin 에서 클래스는 `class` 키워드를 사용하여 정의합니다:

```kotlin
class Person { /*...*/ }
```

클래스 정의는 클래스의 이름과 헤더(파라미터나 주생성자, 기타 다른 요소들), 그리고 중괄호로 감싸진 몸체로 구성됩니다.
헤더와 몸체는 선택적인 요소로, 클래스의 몸체가 없으면 중괄호는 생략될 수 있습니다.

```kotlin
class Empty
```

## 생성자

Kotlin 에서 클래스는 **주생성자**와 하나 이상의 **부생성자**들을 가집니다. 주생성자는 클래스의 헤더의 이름 뒤에, 선택적인 타입 파라미터와 함께 정의됩니다.

```kotlin
class Person constructor(firstName: String) { /*...*/ }
```

주생성자에 아무런 어노테이션도 없고 가시성 수정자가 없다면, `constructor` 키워드는 생략할 수 있습니다:

```kotlin
class Person(firstName: String) { /*...*/ }
```

주생성자는 클래스의 인스턴스와 그의 프로퍼티들을 초기화하며, 어떠한 실행 가능한 코드를 포함할 수 없습니다.
오브젝트 생성 시 어떠한 코드를 실행해야 한다면, 클래스 몸체에 **초기화 블럭**을 사용하세요. 초기화 블럭은 `init` 키워드와 뒤따르는 중괄호로 정의됩니다.
그 중괄호 안에 실행하려는 코드를 작성하세요.

인스턴스의 초기화 중에, 초기화 불럭이 실행되며 그 순서는 사이사이에 끼어들 수 있는 프로퍼티 초기화 문장을 포함하여 클래스의 몸체에 정의된 순서를 따릅니다:

```kotlin
class InitOrderDemo(name: String) {
    val firstProperty = "First property: $name".also(::println)
    
    init {
        println("First initializer block that prints $name")
    }
    
    val secondProperty = "Second property: ${name.length}".also(::println)
    
    init {
        println("Second initializer block that prints ${name.length}")
    }
}
```

위의 코드는 아래처럼 출력합니다:

```
First property: hello
First initializer block that prints hello
Second property: 5
Second initializer block that prints 5
```

주생성자의 파라미터들은 초기화 블럭 안에서 사용할 수 있습니다. 
물론 클래스 몸체에 있는 프로퍼티 초기화 구문에서도 사용할 수 있습니다.

```kotlin
class Customer(name: String) {
    val customerKey = name.uppercase()
}
```

Kotlin 은 주생성자에서의 간결한 프로퍼티 선언과 초기화 구문을 가지고 있습니다:

```kotlin
class Person(val firstName: String, val lastName: String, var age: Int)
```

주생성자 내의 프로퍼티에 기본값도 설정해줄 수 있습니다:

```kotlin
class Person(val firstName: String, val lastName: String, var isEmployed: Boolean = true)
```

그리고 끝단 쉼표도 허용됩니다:

```kotlin
class Person(
    val firstName: String,
    val lastName: String,
    var age: Int, // trailing comma
) { /*...*/ }
```

다른 일반적인 프로퍼티들과 동일하게, 주생성자의 프로퍼티들도 변경 가능하거나(`var`) 변경 불가능(`val`)할 수 있습니다.

주생성자가 가시성 수정자나 어노테이션을 가진다면, `constructor` 키워드가 반드시 필요하며 수정자들이 왼쪽에 표기됩니다:

```kotlin
class Customer public @Inject constructor(name: String) { /*...*/ }
```

[가시성 수정자](/docs/visibility-modifiers.md#constructors) 에 대해 더 알아보세요.

### 부생성자

클래스는 `constructor` 키워드를 접두사로 가지는 부생성자도 정의할 수 있습니다:

```kotlin
class Person(val pets: MutableList<Pet> = mutableListOf())

class Pet {
    constructor(owner: Person) {
        owner.pets.add(this) // adds this pet to the list of its owner's pets
    }
}
```

클래스가 주생성자를 가지면, 각 부생성자들은 주생성자의 역할을 직접적(주생성자를 직접)으로던 간접적(다른 부생성자를 통해)으로던 위임받아야합니다. 
그렇게 하려면 `this` 키워드를 사용합니다:

```kotlin
class Person(val name: String) {
    val children: MutableList<Person> = mutableListOf()
    constructor(name: String, parent: Person) : this(name) {
        parent.children.add(this)
    }
}
```

초기화 블럭 안의 코드는 주생성자의 일부분이 됩니다.
주생성자로의 위임은 부생성자의 첫 문장 바로 직전에 실행되므로, 초기화 블럭이나 프로퍼티 초기화는 부생성자의 블럭보다 이전에 실행됩니다.

클래스가 주생성자를 가지지 않더라도, 위임은 여전히 암시적으로 발생하기 때문에 초기화 블럭도 적절히 실행됩니다.

```kotlin
class Constructors {
    init {
        println("Init block")
    }

    constructor(i: Int) {
        println("Constructor $i")
    }
}
```

위 코드의 출력은 아래와 같습니다:

```
Init block
Constructor 1
```

만약 비-추상적인 클래스가 아무런 생성자도 정의하지 않으면, 인수를 받지 않는 주생성자를 자동으로 생성합니다. 
이 생성자의 가시성은 public 입니다.

만약 생성자가 공개되지 않기를 원한다면, 아래처럼 빈 주생성자를 정의하고 가시성 수정자를 추가해줄 수 있습니다:

```kotlin
class DontCreateMe private constructor() { /*...*/ }
```

> JVM 에서, 모든 생성자의 매개변수가 기본값을 가지면, 컴파일러가 '모든 기본값을 사용하고 아무런 인수도 받지 않는 생성자'를 추가적으로 생성합니다.
> 이는 Kotlin 을 Jackson 이나 JPA 등과 같이 매개변수가 없는 생성자로부터 인스턴스를 만들어내는 라이브러리들과 함께 사용하기 쉽게 합니다.
> ```kotlin
> class Customer(val customerName: String = "")
> ```

## 클래스의 인스턴스 만들기

클래스의 인스턴스를 만드려면, 생성자를 일반적인 함수인 것 처럼 호출합니다. 
생성된 인스턴스를 [변수](/docs/basic-syntax.md#변수)에 할당할 수 있습니다.

```kotlin
val invoice = Invoice()

val customer = Customer("Joe Smith")
```

> Kotlin 에는 `new` 키워드가 없습니다.

중첩되거나, 안쪽의(inner), 혹은 익명 클래스들의 생성 과정은 [](/docs/nested-classes.md) 에서 기술합니다.

## 클래스의 멤버

클래스는 아래 목록이 나열하는 것들을 포함할 수 있습니다:

- [생성자와 초기화 블럭](#생성자)
- [](/docs/functions.md)
- [](/docs/properties.md)
- [](/docs/nested-classes.md)
- [](/docs/object-declarations.md)

## 물려받기

클래스들은 서로간에 파생될 수 있으며, 상속 계층을 형성할 수 있습니다. 
[Kotlin 에서 상속에 대해 자세히 알아보세요](/docs/inheritance.md).

## 추상 클래스

어떤 클래스는 몇몇, 혹은 전부의 멤버를 가지면서 동시에 `abstract` 로 선언될 수 있습니다.
추상적인 멤버는 그 클래스에 구현을 직접 포함하지 않습니다. 추상 클래스나 함수를 `open` 으로 표기하지 않아도 됩니다.

```kotlin
abstract class Polygon {
    abstract fun draw()
}

class Rectangle : Polygon() {
    override fun draw() {
        // draw the rectangle
    }
}
```

비 추상적인 `open` 멤버를 추상적인 멤버로 재정의할 수도 있습니다:

```kotlin
open class Polygon {
    open fun draw() {
        // some default polygon drawing method
    }
}

abstract class WildShape : Polygon() {
    // Classes that inherit WildShape need to provide their own
    // draw method instead of using the default on Polygon
    abstract override fun draw()
}
```

## 동료 오브젝트 (companion object)

클래스의 인스턴스 없이 쓸 수 있어야 하지만 클래스와 연관되어 사용되는 함수(팩토리 함수 같은)를 작성해아한다면, 
해당 클래스 안에서 작성한 [](/docs/object-declarations.md) 안쪽에 추가할 수 있습니다.

특히, 일반적인 클래스 안에 [동료 오브젝트(companion object)](/docs/object-declarations.md#동료-오브젝트-companion-object) 를 정의하면, 그 오브젝트의 멤버를 해당 클래스 이름만을 사용하여 접근할 수 있습니다.

{&?}
