클래스들은 다른 클래스들 안에 중첩될 수 있습니다:

```kotlin
class Outer {
    private val bar: Int = 1
    class Nested {
        fun foo() = 2
    }
}

val demo = Outer.Nested().foo() // == 2
```

중첩 구조에 인터페이스도 사용할 수 있습니다. 
모든 클래스와 인터페이스의 중첩 구조가 허용됩니다: 인터페이스 안에 클래스, 클래스 안에 인터페이스, 인터페이스 안에 인터페이스 까지도요.

```kotlin
interface OuterInterface {
    class InnerClass
    interface InnerInterface
}

class OuterClass {
    class InnerClass
    interface InnerInterface
}
```

## 안쪽(inner) 클래스

`inner` 로 표기된 클래스가 다른 클래스 안쪽에 중첩되면, 그 바깥쪽 클래스의 멤버 필드에 접근할 수 있습니다.
안쪽 클래스가 바깥쪽 클래스 오브젝트의 래퍼런스를 가지고 있습니다:

```kotlin
class Outer {
    private val bar: Int = 1
    inner class Inner {
        fun foo() = bar
    }
}

val demo = Outer().Inner().foo() // == 1
```

안쪽 클래스의 `this` 모호성에 대해 더 알아보기 위해 [꼬리표가 붙은 this 표현](/docs/this-expressions.md#꼬리표가-붙은-this)을 살펴보세요.

## 익명 안쪽 클래스

익명 안쪽 클래스의 인스턴스들은 [object 표현](/docs/object-declarations.md#오브젝트-표현식)을 통해 생성됩니다:

```kotlin
window.addMouseListener(object : MouseAdapter() {

    override fun mouseClicked(e: MouseEvent) { ... }

    override fun mouseEntered(e: MouseEvent) { ... }
})
```

> JVM 에서, 오브젝트가 함수형 자바 인터페이스(단 하나의 추상 메서드를 가지는 자바의 인터페이스)라면 인터페이스의 타입 뒤에 뒤따르는 람다 표현을 사용하여 오브젝트를 만들 수도 있습니다:
> ```kotlin
> val listener = ActionListener { println("clicked") }
> ```

{&?}
