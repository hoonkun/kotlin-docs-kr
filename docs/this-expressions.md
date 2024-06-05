**수신자**를 표현하기 위해서, `this` 표현을 사용할 수 있습니다:

- 클래스의 멤버에서, `this` 는 현재 클래스의 인스턴스 오브젝트를 말합니다.
- [확장 함수](/docs/extensions.md)나 [수신자를 가진 함수 리터럴](/docs/lambdas.md#수신자를-가진-함수-리터럴)에서 `this` 는 점 왼쪽에 전달된 **수신자** 매개변수의 오브젝트를 표현합니다.

`this` 표현에 특정한 꼬리표가 없으면, **가장 안쪽으로 둘러싸인 스코프**의 그것을 의미합니다. 바깥쪽의 `this` 를 쓰려면, **꼬리표**를 사용해야합니다.

## 꼬리표가 붙은 this

바깥쪽 스코프로부터 `this` 를 참조하려면([클래스](/docs/classes.md), [확장함수](/docs/extensions.md), [라벨링된 함수 리터럴의 수신자](/docs/lambdas.md#수신자를-가진-함수-리터럴)), `this@label` 이라고 표현합니다. 
이 때, `@label` 은 [꼬리표](/docs/returns.md)로, `this` 가 어디에서 오는지를 표현합니다:

```kotlin
class A { // 암시적으로 @A
    inner class B { // 암시적으로 @B
        fun Int.foo() { // 암시적으로 @foo
            val a = this@A // A의 this
            val b = this@B // B의 this

            val c = this // foo() 의 수신자, Int
            val c1 = this@foo // foo() 의 수신자, Int

            val funLit = lambda@ fun String.() {
                val d = this // funLit 의 수신자, String
            }

            val funLit2 = { s: String ->
                // 가장 가까운 스코프가 수신자를 가지지 않으므로,
                // foo() 의 수신자입니다.
                val d1 = this
            }
        }
    }
}
```

## 암시적인 this

`this` 에 속한 어떤 멤버 함수를 호출할 때, `this` 는 생략할 수 있습니다. 
단, 멤버 함수가 아니면서 같은 이름을 가지는 다른 함수가 있으면, 의도하지 않는 다른 함수가 불릴 수 있으므로 주의해야합니다:

```kotlin
fun printLine() { println("Top-level function") }

class A {
    fun printLine() { println("Member function") }

    fun invokePrintLine(omitThis: Boolean = false)  { 
        if (omitThis) printLine()
        else this.printLine()
    }
}

A().invokePrintLine() // 멤버 함수
A().invokePrintLine(omitThis = true) // 최상위 레벨 함수
```

{&?}
