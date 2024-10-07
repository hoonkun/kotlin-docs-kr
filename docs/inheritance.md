Kotlin 의 모든 클래스는 `Any` 라는 슈퍼클래스의 자손입니다. 
이는 아무런 슈퍼타입이 명시되지 않은 클래스에 기본적으로 적용됩니다.

```kotlin
class Example // 암시적으로 Any 를 확장합니다.
```

`Any` 는 세 개의 함수를 가지는데, `equals()`, `hashCode()`, `toString()` 이 그들입니다.
즉, 이 세 함수들은 모든 Kotlin 의 클래스들에 정의됩니다.

Kotlin 의 클래스들은 기본적으로 다른 클래스들에 의해 확장될 수 없도록 final 입니다.
이를 가능하게 하려면, `open` 키워드로 표시합니다:

```kotlin
open class Base // 다른 클래스가 이 클래스를 확장할 수 있도록 허용합니다.
```

명시적인 슈퍼타입을 선언하려면, 클래스의 헤더에 콜론을 붙히고 타입을 적습니다.

```kotlin
open class Base(p: Int)

class Derived(p: Int): Base(p)
```

만약 파생된 클래스가 주생성자를 가지면, 그의 기반 클래스는 그 파생된 클래스의 주생성자 단계에서 
기반 클래스가 요구하는 생성자 파라미터들과 함께 반드시 초기화되어야 합니다.

파생된 클래스가 주생성자가 없다면, 각 부생성자들은 기반 타입을 `super` 키워드를 사용하여 초기화하거나 이 행위를 하는
다른 부생성자에게 초기화를 위임해야합니다. 이 경우에는 서로 다른 부생성자가 기반 클래스의 서로 다른 생성자를 호출할 수 있음을
기억하세요:

```kotlin
class MyView : View {
    constructor(ctx: Context) : super(ctx)

    constructor(ctx: Context, attrs: AttributeSet) : super(ctx, attrs)
}
```

## 함수의 재정의

Kotlin 에서는 재정의 가능한 함수와 재정의된 함수들에 모두 명시적인 수정자가 필요합니다:

```kotlin
open class Shape {
    open fun draw() { /*...*/ }
    fun fill() { /*...*/ }
}

class Circle() : Shape() {
    override fun draw() { /*...*/ }
}
```

`Circle.draw()` 함수에 `override` 수정자가 필요합니다. 누락되면 컴파일러가 오류를 보고합니다.
만약 `Shape.fill()` 처럼 함수에 `open` 키워드가 없다면, 
파생 클래스에 같은 형태를 가지는 함수를 정의하는것이 `override` 키워드의 유무와 관계없이 불가능합니다.

`override` 로 표시된 함수는 이미 그 자체로 `open` 이므로, 다른 클래스에 의해 재정의될 수 있습니다.
이러한 재정의된 함수의 또다른 재정의를 막으려면, `final`을 사용할 수 있습니다:

```kotlin
open class Rectangle() : Shape() {
    final override fun draw() { /*...*/ }
}
```

## 프로퍼티의 재정의

재정의 매커니즘은 함수와 동일하게 프로퍼티에 대해서도 적용됩니다. 
슈퍼 클래스에 정의된 프로퍼티가 파생 클래스에서 다시 정의될 때는 반드시 `override` 를 앞에 붙혀야 하고, 호환되는 타입을 가져야합니다.
각 선언된 프로퍼티들은 초기화 구문을 통하거나 `get` 접근자를 통해 재정의될 수 있습니다:

```kotlin
open class Shape {
    open val vertexCount: Int = 0
}

class Rectangle : Shape() {
    override val vertexCount = 4
}
```

`val` 프로퍼티에 대해, `var` 로 프로퍼티를 재정의할 수 있으나, 그 반대는 안됩니다. 
이런 것이 가능한 이유는 `val` 프로퍼티가 기본적으로 `get` 을 제공하고, 
그것을 `var` 로 재정의하는 것은 `set` 을 파생 클래스에 추가하는 의미가 되기 때문입니다.

주생성자의 프로퍼티 선언부에도 `override` 키워드를 사용할 수 있음을 기억하세요:

```kotlin
interface Shape {
    val vertexCount: Int
}

class Rectangle(override val vertexCount: Int = 4) : Shape // Always has 4 vertices

class Polygon : Shape {
    override var vertexCount: Int = 0  // Can be set to any number later
}
```

## 파생 클래스의 초기화 순서

파생된 클래스의 새로운 인스턴스를 초기화하는 과정에서는, 기반 클래스의 생성자에 전달되는 인수들의 평가에 뒤이어 
그 기반 클래스의 초기화가 가장 첫 단계로 완료됩니다. 즉, 파생 클래스의 초기화 로직보다 더 먼저 실행됩니다.

```kotlin
open class Base(val name: String) {

    init { println("Initializing a base class") }

    open val size: Int = 
        name.length.also { println("Initializing size in the base class: $it") }
}

class Derived(
    name: String,
    val lastName: String,
) : Base(name.replaceFirstChar { it.uppercase() }.also { println("Argument for the base class: $it") }) {

    init { println("Initializing a derived class") }

    override val size: Int =
        (super.size + lastName.length).also { println("Initializing size in the derived class: $it") }
}
```

---

{&^---}

아래와 같은 문장을 사용했을 때,
```kotlin
Derived("hello", "world")
```
위의 코드는 아래처럼 출력합니다:
```
Argument for the base class: Hello
Initializing a base class
Initializing size in the base class: 5
Initializing a derived class
Initializing size in the derived class: 10
```

{&$---}

&nbsp;  
이 결과가 의미하는 바는, 기반 클래스 생성자가 실행되는 시점에는 
파생되는 클래스의 프로퍼티들(재정의되는 것들을 포함하여)은 초기화되지 않았다는 점입니다. 
이러한 열린 프로퍼티들을 기반 클래스의 초기화 로직에서 직간접적으로 사용하는 것은 런타임에서 옳지 않은 동작을 할 수도 있습니다.
클래스를 디자인할 때, 생성자나 프로퍼티 초기화 구문, `init` 블럭 등에서는 `open` 으로 표시된 열린 멤버를 참조하지 않는 것이 좋습니다.

## 슈퍼클래스의 구현을 호출하기

파생 클래스의 코드는 `super` 키워드를 사용해 그의 슈퍼클래스의 함수나 프로퍼티 접근자를 호출할 수 있습니다:

```kotlin
open class Rectangle {
    open fun draw() { println("Drawing a rectangle") }
    val borderColor: String get() = "black"
}

class FilledRectangle : Rectangle() {
    override fun draw() {
        super.draw()
        println("Filling the rectangle")
    }

    val fillColor: String get() = super.borderColor
}
```

안쪽 클래스들에서는, 바깥쪽 클래스의 슈퍼 클래스에 접근하기 위해 `super@Outer` 와 같이 꼬리표가 붙은 `super` 표현을 사용합니다:

```kotlin
class FilledRectangle: Rectangle() {
    override fun draw() {
        val filler = Filler()
        filler.drawAndFill()
    }

    inner class Filler {
        fun fill() { println("Filling") }
        fun drawAndFill() {
            super@FilledRectangle.draw() // Calls Rectangle's implementation of draw()
            fill()
            println("Drawn a filled rectangle with color ${super@FilledRectangle.borderColor}") // Uses Rectangle's implementation of borderColor's get()
        }
    }
}
```

## 재정의 규칙

Kotlin 에서는, 파생 클래스의 구현은 몇몇 규칙에 의해 제한됩니다: 만약 어떤 클래스가 같은 형태의 서로 다른 멤버를 상속받는다면,
이 클래스는 반드시 그 멤버를 재정의하고 그에 대한 구현을 제공해야합니다(아마 여러 기반 타입에 있는 것들 중 하나겠지요).

이럴 때 어떤 슈퍼 타입의 구현을 사용하도록 할 지 표기하려면, `super<Base>` 처럼 슈퍼타입을 화살표 괄호로 감싸 표기합니다:

```kotlin
open class Rectangle {
    open fun draw() { /* ... */ }
}

interface Polygon {
    fun draw() { /* ... */ } // interface members are 'open' by default
}

class Square() : Rectangle(), Polygon {
    // The compiler requires draw() to be overridden:
    override fun draw() {
        super<Rectangle>.draw() // call to Rectangle.draw()
        super<Polygon>.draw() // call to Polygon.draw()
    }
}
```

`Rectangle` 과 `Polygon` 모두를 확장하는 것은 괜찮으나, 그들 각각이 `draw()` 구현을 가지므로
모호성을 방지하기 위해 `Square` 에서 `draw()` 를 재정의하여 별도의 구현을 제공해야합니다.

{&?}
