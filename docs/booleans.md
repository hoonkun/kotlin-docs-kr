`Boolean` 타입은 `true` 와 `false` 두 개의 값을 가질 수 있는 논리 오브젝트를 표현합니다.
`Boolean` 의 nullable 한 타입인 `Boolean?` 도 있습니다.

> JVM 에서, boolean 들은 일반적으로 8 비트를 사용하는 원시 `boolean` 타입으로 메모리에 저장됩니다.

논리 값들에 대한 built-in 연산자들은 아래와 같습니다:

- `||` - 분리 (논리적 **OR**)
- `&&` - 결합 (논리적 **AND**)
- `!` - 반전 (논리적 **NOT**)

예를 들면 아래와 같습니다:

```kotlin
val myTrue: Boolean = true
val myFalse: Boolean = false
val boolNull: Boolean? = null

println(myTrue || myFalse)
// true
println(myTrue && myFalse)
// false
println(!myTrue)
// false
println(boolNull)
// null
```

`||` 와 `&&` 는 아래에서 서술하듯이 '게으르게' 동작합니다.

- `||` 의 왼쪽 피연산자가 `true` 라면, 오른쪽 피연산자는 평가되지 않습니다.
- `&&` 이 왼쪽 피연산자가 `false` 라면, 오른쪽 피욘산자는 평가되지 않습니다.

> JVM 에서, boolean 의 nullable 레퍼런스는 [숫자들](/docs/numbers.md#jvm-에서의-숫자-표현)과 동일하게 Java 클래스로 포장(boxed) 됩니다.

{&?}
