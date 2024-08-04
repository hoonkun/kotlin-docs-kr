Kotlin 의 클래스들은 Java와 동일하게 타입 파라미터들을 가질 수 있습니다:

```kotlin
class Box<T>(t: T) {
    var value = t
}
```
이러한 클래스들의 인스턴스를 생성하려면, 타입 인수를 제공하면 됩니다:

```kotlin
val box: Box<Int> = Box<Int>(1)
```

물론 이 타입 파라미터가 컴파일러에 의해 생성자의 인수로부터 유추가 가능하다면, 생략하여 작성할 수 있습니다:

```kotlin
val box = Box(1) // 1 은 Int 이므로, 컴파일러가 이 인스턴스의 타입 파라미터 값이 Box<Int> 임을 유추할 수 있습니다.
```

{#variance}
## 가변성

Java 의 타입 시스템에서 가장 머리아픈 부분은 와일드카드 타입입니다([Java 의 제너릭 FAQ](http://www.angelikalanger.com/GenericsFAQ/JavaGenericsFAQ.html) 를 확인해보세요).
Kotlin 에는 이런 것이 없는 대신, 선언 측의 가변성과 타입 투사가 있습니다.

{#variance-and-wildcards-in-java}
### 가변성과 Java 의 와일드카드

Java 가 이런 미스터리한 와일드카드를 왜 필요로하는지 생각해볼까요. 
첫 번째로, Java 의 제너릭 타입은 불변합니다. 즉, `List<String>` 은 `List<Object>` 의 서브타입이 **아니며**, 만약 그랬다면 Java 의 배열과 별반 차이가 없어졌을 것입니다.
만약 그런다고 했을 때 이러한 코드가 컴파일이 된다고 해도 런타임에서 예외가 발생할 것이기 때문입니다:

```java
// Java
List<String> strs = new ArrayList<String>();

// Java 는 이 라인에서 타입이 맞지 않는다는 컴파일 단계의 에러를 보고합니다.
List<Object> objs = strs;

// 만약 그렇지 않았다면 어떨까요?
// String의 리스트에 1을 넣을 수 있었을 것입니다. 
objs.add(1);

// 그리고 런타임에서는, 아래 문장으로부터
// ClassCastException 이 발생합니다: Int 는 String 이 아니기 때문에요.
String s = strs.get(0);
```

Java 는 이러한 행동을 런타임 안전성을 위해 금지하고 있으며, 분명히 의미가 있습니다. 
예를 들어, `Collection` 인터페이스의 `addAll()` 함수를 생각해보죠. 이 함수의 시그니쳐는 어떻게 될까요?
직관적으로 생각하신다면, 아래와 같을 것입니다:

```java
// Java
interface Collection<E> ... {
    void addAll(Collection<E> items);
}
```

하지만 이렇게 하면 아래와 같이는 작성할 수 없습니다(완벽하게 안전한데도요).

```java
// Java

// addAll 의 명백한 정의로 인해 아래 코드는 컴파일되지 않습니다:
// Collection<String> 는 Collection<Object> 의 서브타입이 아닙니다.
void copyAll(Collection<Object> to, Collection<String> from) {
    to.addAll(from);
}
```

그렇기 때문에, `addAll()` 의 시그니쳐는 실제로는 아래와 같습니다:

```java
// Java
interface Collection<E> ... {
    void addAll(Collection<? extends E> items);
}
```

**와일드 카드 타입 인수** `? extends E` 는 이 함수가 '**`E` 나 `E` 의 서브타입**을 요소로 가진 컬렉션을 파라미터로 받는다'는 것을 나타냅니다.
이는 우리가 이 컬렉션의 아이템들이 `E` 의 서브타입이기 때문에 안전하게 `E` 임으로 간주하고 **읽을** 수 있지만, 실제 타입이 어떤 것인지는 모르기 때문에 **쓸(write)** 수는 없습니다.
이러한 제한을 통해, 우리는 `Collection<String>` 가 `Collection<? extends Object>` 의 서브타입 **임을** 알아챌 수 있습니다.
다르게 말하면, 와일드 카드의 **상속**경계(**상한**선)가 타입에 공변성을 가지게 합니다.

이렇게 동작하는 이유를 이해하기 위한 열쇠는 생각보다 단순합니다: 만약 우리가 컬렉션에서 단순히 요소를 **가져올 수만 있다면**, `String` 컬렉션을 만들어서 `Object` 로 읽는 것이 별로 문제되지 않습니다.
마찬가지로, 만약 요소를 넣을 수만 있다면 `Object` 의 컬렉션을 만들어서 `String` 을 넣는 것도 딱히 문제되지 않습니다: Java 에는 `List<? super String>` 이라는, `String` 이나 그의 슈퍼 타입으로 구성되는 리스트를 표현하는 타입이 있습니다.

뒤에서 설명한 것은 **반변성**이라고 하는데, 위에서 표현한 `List<? super String>` 의 인스턴스 함수들에서 값을 넣는 함수들은 모두 `String` 을 파라미터로 가지며(`add(String)`, `set(int, String)` 등이 있습니다), 값을 읽는 함수들은 모두 `String` 이 아닌 `Object` 를 반환합니다.

Joshua Bloch 는 그의 저서 [Effective Java, 3rd Edition](http://www.oracle.com/technetwork/java/effectivejava-136174.html) 에서 이 문제에 대해 설명합니다(Item 31: "Use bounded wildcards to increase API flexibility"). 
그는 읽을 수만 있는 오브젝트에 **생산자(Producer)** 라는 이름을, 쓸 수만 있는 오브젝트에 **소비자(Consumer)** 라는 이름을 붙혔습니다. 그는 이렇게 추천합니다:

{>tip}
> "최대한의 유연성을 위해, 와일드카드 타입은 생산자와 소비자를 표현하는 입력 파라미터에 사용하십시오."

그리고 그는 이러한 기억법을 제안했습니다: PECS - Producer-Extends, Consumer-Super.

> 만약 생산자 오브젝트를 사용한다고 말한다면, `List<? extends Foo>` 라고 작성할 것이고 `add()` 나 `set()` 등은 호출하도록 허용되지 않습니다.
> 그러나, 여전히 그것이 수정 불가능하지는 않습니다. 리스트의 모든 요소를 삭제하는 `clear()` 함수는 아무런 파라미터도 받지 않으므로, 이를 호출하는 것을 막을 이유는 없습니다.
> 
> 와일드카드나 다른 타입 가변적인 타입들이 보장하는 것은 **타입 안전성** 뿐입니다. 수정이 가능한지 그렇지 않은지는 전혀 다른 문제입니다.

{#declaration-site-variance}
### 선언측 가변성

어떠한 인터페이스 `Source<T>` 가 있고, `T` 를 가져가는 함수는 없으며 `T` 를 리턴하는 함수만 있다고 해봅시다.

```java
// Java
interface Source<T> {
    T nextT();
}
```

그러면 이 인터페이스에는 다른 값을 쓰는 소비자 메서드가 없기 때문에, `Source<String>` 을 `Source<Object>` 타입 변수에 넣는 것이 안전합니다.
그러나 Java 는 이러한 컨텍스트를 알 수 없기 때문에, 여전히 이를 금지합니다:

```java
// Java
void demo(Source<String> strs) {
    Source<Object> objects = strs; // !!! Java 에서 허용되지 않습니다.
    // ...
}
```

이를 해결하기 위해서는, `objects` 변수의 타입을 `Source<? extends Object>` 로 선언해야합니다. 
물론 이것은 별로 의미가 없는데, 선언 타입을 변경하기 전과 완전히 동일한 메서드들을 호출할 수 있기 때문이며 더 복잡한 타입으로 작성할 필요가 없습니다.
단지 컴파일러가 이러한 배경을 모르기 때문에 표시할 뿐입니다.

Kotlin 에서는, 이러한 것들을 컴파일러에게 알려줄 수 있는 방법이 있습니다. 
이는 **선언측 가변성**이라고 하며, `Source` 의 **타입 파라미터** `T` 가 항상 **리턴**(생산)되기만 하고, 소비되지는 않는다는 것을 명시할 수 있습니다.  
이러한 경우, `out` 수정자를 사용합니다:

```kotlin
interface Source<out T> {
    fun nextT(): T
}

fun demo(strs: Source<String>) {
    val objects: Source<Any> = strs // This is OK, since T is an out-parameter
    // ...
}
```

일반적인 규칙은 다음과 같습니다:
클래스 `C` 의 타입 파라미터 `T` 가 `out` 으로 선언되면 그 `T` 가 `C` 로부터 **나가는** 위치에만 있을 수 있음을 의미하고,
`C<Base>` 로 리턴된 타입은 안전하게 `C<Derived>` 의 서브타입입니다.

다르게 말하면, 우리는 '클래스 `C` 가 파라미터 `T` 에 대해 공변적이다', 혹은 '`T`는 공변적인 타입 파라미터이다'라고 말할 수 있습니다.
즉 `C` 가 `T` 에 대한 **생산자**이고, **소비자**는 아닌 것으로 생각할 수 있습니다.

`out` 수정자는 **가변성 어노테이션**이라고 불리며, 이것은 타입 파라미터의 선언측에서만 사용 가능하므로 **선언측 가변성**을 제공합니다.
이는 Java 에서의, 사용하는 측에서 타입의 공변성을 만드는 **사용측 가변성**과는 상반됩니다.

`out` 뿐만 아니라, `in` 이라는 그에 반대되는 가변성 어노테이션도 제공합니다. 이는 타입 파라미터를 반변적으로 만들며, 소비될 수만 있고 생산될 수는 없음을 의미하게 됩니다.
반변적 타입의 훌륭한 예시는 `Comparable` 입니다:

```kotlin
interface Comparable<in T> {
    operator fun compareTo(other: T): Int
}

fun demo(x: Comparable<Number>) {
    x.compareTo(1.0) // 1.0 은 Number 의 서브타입인 Double 입니다.
    // 따라서, x 를 Comparable<Double> 에 할당할 수 있습니다
    val y: Comparable<Double> = x // OK!
}
```

**in** 과 **out** 이라는 명칭은 그 자체가 자신에 대해 성공적으로 표현하므로(C#에서 꽤 옛날부터 꽤 성공적으로 쓰였던 것처럼), 위에서 언급한 것과 같은 별도의 기억법이 필요가 없습니다.
사실 이것은 더 고수준의 추상으로 다시 표현될 수 있습니다:

**The Existential Transformation: Consumer in, Producer out!**:-)

{#type-projections}
## 타입 투사

{#use-site-variance-type-projections}
### 사용측 가변성: 타입 투사

타입 파라미터 `T` 를 `out` 으로 표기하여 사용처에서 서브타이핑하는 고통에서 쉽게 벗어날 수 있지만, 당연히도 어떤 클래스들은 `T` 가 나가는 측에만 사용되도록 제한될 수 **없습니다**. 이의 좋은 예시는 `Array` 입니다:

```kotlin
class Array<T>(val size: Int) {
    operator fun get(index: Int): T { ... }
    operator fun set(index: Int, value: T) { ... }
}
```

이 클래스는 `T` 에 대해 공변적이지도 않고 반변적이지도 않습니다. 이러한 점은 몇몇 경직된 동작을 하게 만드는데, 아래의 함수를 살펴보세요:

```kotlin
fun copy(from: Array<Any>, to: Array<Any>) {
    assert(from.size == to.size)
    for (i in from.indices)
        to[i] = from[i]
}
```

이 함수는 배열의 요소를 복사하는 역할을 합니다. 실제로 한 번 사용해볼까요.

```kotlin
val ints: Array<Int> = arrayOf(1, 2, 3)
val any = Array<Any>(3) { "" }
copy(ints, any)
//   ^ type is Array<Int> but Array<Any> was expected
```

여기에서, 익숙한 문제와 마주칩니다: `Array<T>` 는 `T` 에 대해 불변하므로, `Array<Int>` 와 `Array<Any>` 는 모두 서로의 서브타입이 아닙니다.
왜일까요? 다시 언급하는 말이지만, `copy` 가 예상하지 않은 동작을 할 수 있기 때문입니다. 
예를 들면 이 함수는 나중에 `String` 을 `from` 에 쓰려고 할 지도 모르고, 만약 거기에 `Int` 의 배열이 있었다면 `ClassCastException` 이 발생할 것입니다.

`copy` 함수가 `from` 에 **값을 쓰는것**을 금지하려면, 아래처럼 할 수 있습니다:

```kotlin
fun copy(from: Array<out Any>, to: Array<Any>) { ... }
```

이것은 **타입 투사**입니다. 여기에서 `from` 은 일반적인 배열이 아니며, 제한된(**투사된**) 배열입니다.
이 배열을 통해서는 `T` 를 리턴하는 함수만 호출할 수 있으며, 이 경우에서는 `get()` 함수만 호출할 수 있음을 의미합니다.
이것이 우리의 **사용측 가변성**에 대한 접근입니다. Java 의 `Array<? extends Object>` 보다는 꽤 간단합니다.

물론이지만 `in` 으로도 투사할 수 있습니다:

```kotlin
fun fill(dest: Array<in String>, value: String) { ... }
```

`Array<in String>` 은 Java 의 `Array<? super String>` 과 대응하며, 이는 `CharSequence` 나 `Object` 의 배열만이 `fill()` 함수에 들어올 수 있음을 의미합니다.

{#star-projections}
### 별 투사

때로는 들어올 타입 인수에 대해 아는 것이 없지만 그래도 안전하게 사용하고싶을 때가 있을것입니다.
이러한 때 안전한 방법은, 그 제너릭 타입의 모든 구체적인 인스턴스가 그 투사의 서브타입인 것으로 정의하는 것입니다.

Kotlin 은 이것을 **별 투사**라는 이름으로 제공합니다.

- `Foo<out T: TUpper>` 에서 `T` 는 상한선이 `TUpper` 인 공변적인 타입 파라미터이고, 이 때 `Foo<*>` 는 `Foo<out TUpper>` 와 동일합니다.
  이것은 `T` 가 무엇인지 알 수 없을 때, `Foo<*>` 로부터 안전하게 `TUpper` 의 값들을 읽을 수 있음을 의미합니다.
- `Foo<in T>` 에서 `T` 는 반변적인 타입 파라미터이고, 이 때 `Foo<*>` 는 `Foo<in Nothing>` 와 동일합니다.
  이것은 `T` 가 무엇인지 알 수 없을 때, `Foo<*>` 로 그것을 쓸 수 있는 안전한 방법이 없음을 의미합니다.
- `Foo<T: TUpper>` 에서 `T` 는 상한선이 `TUpper` 인 불변적인 타입파라미터이고, 이 때 `Foo<*>` 는 값을 읽을 때는 `Foo<out TUpper>` 로 동작하며 값을 쓸 때는 `Foo<in Nothing>` 과 동일합니다.

만약 제너릭 타입이 여러 개의 타입 파라미터를 가지고 있다면, 그들 각각이 독립적으로 투사될 수 있습니다.
예를 들어, 타입이 `interface Function<in T, out U>` 로 정의되었다면, 아래와 같은 별 투사를 사용할 수 있습니다:

- `Function<*, String>` 는 `Function<in Nothing, String>` 를 의미합니다.
- `Function<Int, *>` 는 `Function<Int, out Any?>` 를 의미합니다.
- `Function<*, *>` 는 `Function<in Nothing, out Any?>` 를 의미합니다.

> 별 투사는 Java 의 raw 타입과 매우 유사하지만, 안전합니다.

{#generic-functions}
## 제너릭 함수

클래스 선언만 유일하게 타입 파라미터를 가질 수 있는 것은 아닙니다. 함수도 타입 파라미터를 가질 수 있고, 이러한 경우 함수의 이름 **앞에** 배치됩니다:

```kotlin
fun <T> singletonList(item: T): List<T> {
    // ...
}

fun <T> T.basicToString(): String { // extension function
    // ...
}
```

제너릭 함수를 호출하려면, 일반적인 문법으로 작성하되 타입 인수를 호출 측에서 함수의 이름 **뒤에** 표기하면 됩니다.

```kotlin
val l = singletonList<Int>(1)
```

함수의 인수나 수신자 등의 컨텍스트로 타입 파라미터가 유추 가능하면, 생략해도 괜찮습니다:

```kotlin
val l = singletonList(1)
```

{#generic-constraints}
## 제너릭의 제약

제시된 타입 파라미터로 대체될 수 있는 타입들은 **제너릭 제약**으로 제한될 수 있습니다. 

{#upper-bounds}
### 상한선

가장 일반적인 제약은 **상한선**으로, Java 의 **extends** 키워드와 대응됩니다:

```kotlin
fun <T : Comparable<T>> sort(list: List<T>) { ... }
```

콜론 뒤에 제시된 타입이 **상한선** 이며, 이 경우에서는 `Comparable<T>` 만이 `T` 에 대치될 수 있음을 나타냅니다. 예를 들면 아래와 같습니다.

```kotlin
sort(listOf(1, 2, 3)) // OK. Int 는 Comparable<Int> 의 서브타입입니다.
sort(listOf(HashMap<Int, String>())) // Error: HashMap<Int, String> 는 Comparable<HashMap<Int, String>> 의 서브타입이 아닙니다.
```

기본적으로 설정되는 상한선은 `Any?` 입니다. 꺽쇠괄호 안에는 하나의 타입 파라미터에 하나의 상한선만 표기될 수 있으며, 만약 하나의 타입 파라미터에 여러 개의 상한선이 필요하면 별도의 `where` 절을 사용해야 합니다:

```kotlin
fun <T> copyWhenGreater(list: List<T>, threshold: T): List<String>
    where T : CharSequence,
          T : Comparable<T> {
    return list.filter { it > threshold }.map { it.toString() }
}
```

전달된 타입은 반드시 모든 `where` 절에 제공된 조건을 만족해야합니다. 
즉, 위의 예제에서 `T` 는 `CharSequence` 와 `Comparable` 을 **모두** 구현해야합니다.

{#definitely-non-nullable-types}
## 명백하게 null 이 아닌 타입

Java 의 제너릭 클래스와 인터페이스들과의 더 쉬운 상호운용성을 위해, Kotlin 은 제너릭 타입 파라미터를 **명백하게 null 이 아닌 타입**으로 설정할 수 있습니다.

제너릭 타입 `T` 를 그러한 타입으로 설정하려면, `& Any` 와 함께 표기하세요. 예를 들면, `T & Any` 가 될 수 있습니다.

이런 제너릭 타입 파라미터들은 반드시 nullable 한 [상한선](#상한선)을 가져야합니다.

이러한 타입을 선언하는 가장 일반적인 경우는 Java 의 `@NotNull` 을 파라미터로 가지는 함수를 재정의할 때입니다. 
예를 들어, 아래의 `load()` 함수를 살펴볼까요:

```java
import org.jetbrains.annotations.*;

public interface Game<T> {
    public T save(T x) {}
    @NotNull
    public T load(@NotNull T x) {}
}
```

이 `load()` 함수를 Kotlin 에서 재정의하려면, T1 이 반드시 null 이 아닌 것으로 선언해야합니다:

```kotlin
interface ArcadeGame<T1> : Game<T1> {
    override fun save(x: T1): T1
    // T1 is definitely non-nullable
    override fun load(x: T1 & Any): T1 & Any
}
```

Kotlin 으로만 작업할 때는, 이 부분을 컴파일러가 대신 신경쓰므로 위에서 서술한 것 처럼 할 필요가 없습니다.

{#type-erasure}
## 타입의 지워짐

Kotlin 이 제너릭 타입에 대해 진행하는 안전성 체크는 컴파일 시점에 이루어집니다. 
런타임에서, 제너릭 타입들의 인스턴스들은 자신의 타입 파라미터에 어떤 타입이 들어왔는지에 대한 정보를 가지지 않습니다.
이것을 타입 정보가 **지워졌다** 라고 말합니다. 예를 들어, `Foo<Bar>` 와 `Foo<Baz?>` 는 런타임에서 모두 `Foo<*>` 로 지워집니다.

{#generics-type-checks-and-casts}
### 제너릭의 타입 체크와 캐스트

컴파일 이후 타입 파라미터에 대한 정보가 지워졌기 때문에, 런타임에서 제너릭 타입의 인스턴스가 어떤 특정한 타입으로 생성되었는지 확인할 수 있는 일반적인 방법이 없습니다.
그리고, 그렇기 때문에, 컴파일러 또한 코드에서 `ints is List<Int>` 나 `lists is T` 와 같은 제너릭 타입의 `is` 체크를 금지합니다.
그러나, 인스턴스가 별 투사된 타입을 가지는지는 확인할 수 있습니다:

```kotlin
if (something is List<*>) {
    something.forEach { println(it) } // 요소들 각각은 `Any?` 입니다.
}
```

비슷하게, 컴파일 시점에서 이미 어떠한 인스턴스의 제너릭 타입 파라미터 체크를 정적으로 진행했다면, 제너릭 타입 중 비-제너릭 부분의 타입 체크를 `is` 를 통해 수행할 수 있습니다.
이 경우에는 꺽쇠 괄호와 그 내용이 생략됨을 주의하세요:

```kotlin
fun handleStrings(list: MutableList<String>) {
    if (list is ArrayList) {
        // `list` is smart-cast to `ArrayList<String>`
    }
}
```

같은 문법으로 동일하게 `as` 키워드를 사용한 `list as ArrayList` 같은 캐스팅도 가능합니다.

제너릭 함수의 타입 인수 체크도 컴파일 시점에 진행됩니다. 함수의 몸체 안에서 타입 파라미터들은 어떤 값의 타입을 체크하는데 사용될 수 없으며, 마찬가지로 어떤 값에 대한 타입 파라미터로의 캐스팅은 체크되지 않습니다.
유일한 예외는 [구체화된 타입 파라미터](/docs/inline-functions.md#구체화된-타입-파라미터)를 가지는 인라인 함수들로, 그들의 실제 타입이 호출 측에서 인라인되는 경우 뿐입니다.
이 경우에는 타입 파라미터들에 대해 타입 체크나 캐스팅을 할 수 있습니다.
그러나 위에서 언급한 제약이 체크나 캐스팅에서 왼쪽에 사용되는 제너릭 타입의 인스턴스들에도 여전히 적용됩니다.
예를 들어, `args is T` 같은 타입 체크는, `args` 가 제너릭 타입의 인스턴스이면 그의 타입 인수가 여전히 지워져 있습니다.

```kotlin
inline fun <reified A, reified B> Pair<*, *>.asPairOf(): Pair<A, B>? {
    if (first !is A || second !is B) return null
    return first as A to second as B
}

val somePair: Pair<Any?, Any?> = "items" to listOf(1, 2, 3)

val stringToSomething = somePair.asPairOf<String, Any>()
val stringToInt = somePair.asPairOf<String, Int>()
val stringToList = somePair.asPairOf<String, List<*>>()
val stringToStringList = somePair.asPairOf<String, List<String>>() // 컴파일되지만 타입 안전성을 망가뜨립니다! 

fun main() {
    println("stringToSomething = " + stringToSomething)
    println("stringToInt = " + stringToInt)
    println("stringToList = " + stringToList)
    println("stringToStringList = " + stringToStringList)
    //println(stringToStringList?.second?.forEach() {it.length}) // 이 문장은 리스트의 요소가 String 이 아니기 때문에 ClassCastException 을 던집니다.
}
```

{#unchecked-casts}
### 확인되지 않은 캐스팅

어떤 제너릭 타입에 구체적인 타입 파라미터를 가진 타입으로의 캐스팅은 런타임에 확인될 수 없습니다.  
이런 확인되지 않은 캐스팅은 고수준의 프로그램 로직에 의거해 타입이 안전함을 내포하고 있을 때 사용할 수는 있지만, 컴파일러가 바로 유추할 수는 없습니다.
아래 예제를 확인해보세요.

```kotlin
fun readDictionary(file: File): Map<String, *> = file.inputStream().use {
    TODO("Read a mapping of strings to arbitrary elements.")
}

// 이 파일에서는 맵의 값들이 `Int` 임을 보장할 수 있다고 가정합니다.
val intsFile = File("ints.dictionary")

// Warning: Unchecked cast: `Map<String, *>` 의 `Map<String, Int>` 로의 캐스팅
val intsDictionary: Map<String, Int> = readDictionary(intsFile) as Map<String, Int>
```

마지막 줄의 캐스팅에서 경고가 발생합니다. 컴파일러가 실제로 맵의 값들이 `Int` 인지, 즉 이것이 안전한지 제대로 확인할 수 없기 때문입니다.

이런 확인되지 않은 캐스팅을 피하기 위해, 프로그램의 구조를 다시 디자인할 수 있습니다. 
위의 예제에서, `DictionaryReader<T>` 와 `DictionaryWriter<T>` 인터페이스를 사용해 여러 다른 타입들에 대해 안전하게 구현할 수 있습니다.
혹은, 체크되지 않은 캐스팅을 호출측이 아닌 상세 구현측으로 옮기기 위해 어떤 합리적인 추상화를 도입할 수도 있습니다.
[가변적인 제너릭](#가변성)을 적절히 사용하는 것도 도움이 될 수 있습니다.

제너릭 함수들은, [구체화된 타입 파라미터](/docs/inline-functions.md#구체화된-타입-파라미터)를 사용하여 `arg as T` 같은 캐스팅이 '`arg` 가 별도 **자신만의** 지워진 타입 파라미터를 가지 않는 한' 적절하게 확인되도록 하세요.

확인되지 않은 캐스팅에 대한 경고는 문장이나 선언을 `@Suppress("UNCHECKED_CAST")` 로 어노테이션하여 막을 수 있습니다:
```kotlin
inline fun <reified T> List<*>.asListOfType(): List<T>? =
    if (all { it is T })
        @Suppress("UNCHECKED_CAST")
        this as List<T> else
        null
```

> **JVM 에서는** [배열 타입](/docs/arrays.md)에 한해 그의 요소에 대한 지워진 타입 정보를 유지하며, 그에 대한 타입 캐스팅은 부분적으로 확인됩니다:
> null 의 가능 여부나 요소 자체의 타입 파라미터 정보는 여전히 지워진 상태이기 때문에요. 예를 들어, `foo as Array<List<String>?>` 같은 캐스팅은 `foo` 가 아무 `List` 를 요소로 가지는 배열이면 그 요소의 `null` 여부나 `List` 의 타입 파라미터에 관계 없이 성공합니다.

{#underscore-operator-for-type-arguments}
## 타입 인수에 사용하는 언더바 연산자

타입 파라미터의 인수에는 언더바 연산자 `_` 가 사용될 수 있습니다. 
여러 타입 파라미터가 서로 연관되어있고 그 중 하나로부터 나머지 하나를 유추할 수 있을 때, 그 나머지 하나의 타입 파라미터에 사용합니다:

```kotlin
abstract class SomeClass<T> {
    abstract fun execute() : T
}

class SomeImplementation : SomeClass<String>() {
    override fun execute(): String = "Test"
}

class OtherImplementation : SomeClass<Int>() {
    override fun execute(): Int = 42
}

object Runner {
    inline fun <reified S: SomeClass<T>, T> run() : T {
        return S::class.java.getDeclaredConstructor().newInstance().execute()
    }
}

fun main() {
    //  SomeImplementation 이 SomeClass<String> 로부터 파생되기 때문에 T 가 String 으로 유추될 수 있습니다.
    val s = Runner.run<SomeImplementation, _>()
    assert(s == "Test")

    //  OtherImplementation 이 SomeClass<Int> 로부터 파생되기 때문에 T 가 Int 로 유추될 수 있습니다.
    val n = Runner.run<OtherImplementation, _>()
    assert(n == 42)
}
```
--- 
`run()` 함수의 `S` 와 `T` 타입 파라미터의 순서를 바꾸고, `main()` 함수의 구현 측에서 `run<_, SomeImplementation>()` 나 `run<_, OtherImplementation>()` 라고 적어도 괜찮습니다.

{&?}
