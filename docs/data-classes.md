Kotlin 의 데이터 클래스는 주로 데이터를 저장하기 위해 쓰입니다. 각 데이터 클래스들에 대해, 컴파일러는
자동으로 몇 개의 편리한 멤버 함수(적절한 문자열 출력이나, 인스턴스 간 비교, 인스턴스 복제 등을 위한 함수를 비롯한 기타 함수)들을 생성합니다.
데이터 클래스들은 `data` 수정자로 표기됩니다:

```kotlin
data class User(val name: String, val age: Int)
```

컴파일러는 주생성자에 포함된 프로퍼티들로부터 자동으로 아래의 멤버들을 추가합니다:

- `.equals()` 및 `.hashCode()` 쌍
- `"User(name=John, age=42)"` 와 같은 구조의 문자열을 리턴하는 `.toString()`
- 주생성자에 선언된 프로퍼티들의 순서에 맞는 [`.componentN()` 함수](/docs/destructuring-declarations.md)들
- `.copy()` 함수(아래 내용을 확인해보세요)

생성되는 코드의 일관적이고 유의미한 행동을 보장하기 위해, 데이터 클래스들은 아래의 몇 가지 요구사항을 만족해야 합니다:

- 주생성자는 반드시 하나 이상의 파라미터를 가져야합니다.
- 모든 주생성자의 파라미터들은 `val` 이나 `var` 로 표기되어야 합니다.
- 데이터 클래스들은 추상적이거나(abstract), 열렸거나(open), 봉인되었거나(sealed), 안쪽(inner) 클래스일 수 없습니다.

추가적으로, 생성되는 데이터 클래스의 멤버들은 멤버의 확장/상속에 대해 아래와 같은 규칙들을 준수합니다:

- 데이터 클래스 내에 `.equals()`, `.hashCode()`, `.toString()` 의 명시적인 구현이 있거나, 그의 슈퍼 클래스에 `final` 구현이 있다면, 이러한 함수들이 생성되지 않고 기존 것을 사용합니다.
- 슈퍼타입에 `.componentN()` 가 존재하고 열려있으며(open), 그것들이 호환되는 타입을 리턴한다면, 이러한 함수들이 생성 및 슈퍼타입으로부터 재정의됩니다. 만약 그 슈퍼타입의 `componentN` 함수들이 최종이어서 재정의할 수 없거나, 호환되지 않는 시그니쳐를 가졌다면 오류가 보고됩니다.
- 데이터 클래스에 명시적인 `.componentN()` 이나 `.copy()` 함수를 제공하는 것은 허용되지 않습니다.

데이터 클래스들은 다른 클래스를 확장할 수 있습니다(예제들은 [](/docs/sealed-classes.md)를 확인해보세요).

> JVM 에서, 이러한 데이터 클래스들이 파라미터가 없는 생성자를 가져야 한다면, 프로퍼티들에 대해 적절한 기본값들이 제공되어야 합니다([생성자](/docs/classes.md#생성자) 를 확인해보세요).
> ```kotlin
> data class User(val name: String = "", val age: Int = 0)
> ```

## 클래스 몸체에 정의된 프로퍼티

컴파일러는 자동 생성되는 함수들에 주생성자 안에 있는 프로퍼티들만 사용합니다.
생성되는 함수의 구현에서 제외하려면, 클래스 몸체에 선언하세요:

```kotlin
data class Person(val name: String) {
    var age: Int = 0
}
```

아래 예제에서 보이듯이, `.toString()`, `.equals()`, `hashCode()`, 그리고 `.copy()` 함수에 `name` 프로퍼티만 사용되었고 단 하나의 `.component1()` 함수만 존재합니다.
클래스 몸체에 포함된 `age` 프로퍼티는 제외되었습니다. 
그러므로, 같은 `name` 값을 가지는 두 개의 `Person` 오브젝트는 그 `age` 값이 다르더라도 같은 것으로 간주합니다.
생성되는 `.equals()` 함수가 주생성자에 있는 프로퍼티만 포함하기 때문에요:

```kotlin
val person1 = Person("John")
val person2 = Person("John")
person1.age = 10
person2.age = 20

println("person1 == person2: ${person1 == person2}")
// person1 == person2: true

println("person1 with age ${person1.age}: ${person1}")
// person1 with age 10: Person(name=John)

println("person2 with age ${person2.age}: ${person2}")
// person2 with age 20: Person(name=John)
```

## 복사

`.copy()` 함수를 사용하여 **몇 개**의 프로퍼티는 기존 값으로 유지하면서 오브젝트를 복사할 수 있습니다.
`User` 클래스에서 이 함수의 구현은 아래와 같을 것입니다:

```kotlin
fun copy(name: String = this.name, age: Int = this.age) = User(name, age)
```

그리고 아래처럼 작성할 수 있습니다:

```kotlin
val jack = User(name = "Jack", age = 1)
val olderJack = jack.copy(age = 2)
```

---
{&^---}

위에서 계속 언급하지만 예제에서 드러나지 않는데, `copy` 함수는 주생성자 밖의 프로퍼티를 포함하지 않습니다.
즉, 아래와 같은 사용은 `21`이 아닌 `0`을 출력합니다.

```kotlin
data class User(
    val name: String
) {
    var age: Int = 0
}

print(User("John").apply { age = 21 }.copy().age)
```

더해서, `copy` 는 얕은 복사이므로 **다른 데이터 클래스를 포함하여** 리스트 등의 오브젝트 레퍼런스를 넣으면 의도한대로 동작하지 않을 수 있습니다.

```kotlin
data class Page(
    val lines: MutableList<String> = mutableListOf(),
    val section: IndexSection = IndexSection()
)

data class IndexSection(
    var title: String = "Default Title"
)

// 원본 페이지를 만듭니다.
val firstPage = Page()

// 아무 것도 하기 전에 복제합니다.
val secondPage = firstPage.copy()

// 원본 페이지를 변경합니다.
firstPage.lines.add("Some Line")
firstPage.section.title = "First Page Section Title"

// 복제된 페이지도 같이 변경됩니다.
println(secondPage.lines.first()) // Some Line
println(secondPage.section.title) // First Page Section Title
```

{&$---}

## 데이터 클래스와 분해형 정의

데이터 클래스는 **컴포넌트 함수들**이 생성되어 [](/docs/destructuring-declarations.md)에 사용할 수 있습니다:

```kotlin
val jane = User("Jane", 35)
val (name, age) = jane
println("$name, $age years of age")
// Jane, 35 years of age
```

## 표준 데이터 클래스

표준 라이브러리는 `Pair` 및 `Triple` 클래스를 제공합니다. 그러나 많은 케이스에서, 명확한 이름을 가진 데이터 클래스가 
더 나은 설계적 선택입니다. 이들은 각 프로퍼티에 유의미한 이름을 붙힘으로서 코드를 더 읽기 쉽게 만들기 때문입니다.

{&?}
