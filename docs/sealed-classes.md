**봉인된(sealed)** 클래스와 인터페이스는 그에 대한 상속 계층 형성에 대한 제어권을 제공합니다.
모든 직계 서브클래스들이 컴파일 타임에 정해지며, 해당 봉인된 클래스가 정의된 모듈과 패키지 바깥에서 
새로운 서브클래스가 만들어지는 것을 허용하지 않습니다. 같은 로직이 봉인된 인터페이스와 그들의 구현체에게도 적용되며, 
한 번 봉인된 인터페이스가 포함된 모듈이 컴파일되면 다른 구현체가 추가될 수 없습니다.

> 직계 서브클래스들은 그들의 슈퍼클래스로부터 곧바로 상속, 확장하는 클래스입니다.
> 
> 간접 서브클래스들은 그들의 슈퍼클래스로부터 두 단계 이상 더 물려받아 확장하는 클래스입니다.

봉인된 클래스나 인터페이스를 `when` 표현과 함께 사용하면, 가능한 모든 서브클래스들에 대한 처리를 모두 핸들링하며
그것이 누락되지 않도록 보장할 수 있습니다. 즉, 새로운 서브클래스가 추가되지 않으므로 모든 알려진 경우들을 누락되지
않게 핸들링할 수 있습니다.

봉인된 클래스들은 아래와 같은 시나리오에서 최적의 효과를 발휘합니다:

- **제한된 클래스의 확장이 요구될 때**: 만약 미리 정의된, 컴파일 타임에 모두 알려져야 하는 유한한 집합의 서브클래스를 가지는 어떤 클래스나 인터페이스가 있을 때.
- **안정적인 타입 설계가 필요할 때**: 코드 설계의 안정성이 프로젝트에서 우선적인 가치일 때. 특히 상태 관리나 복잡한 조건 핸들링이 필요할 떄. [봉인된 클래스와 when 표현](#봉인된-클래스와-when-표현) 를 살펴보세요.
- **고정된 API와 관련하여 작업할 때**: 서드파티 클라이언트들이 API 를 용도에 맞게 사용하게 하기 위해, 고정되면서 유지보수 가능한 API가 필요할 때.

예제 어플리케이션을 비롯한 더 자세한 사항은 [사용 케이스](#사용-케이스)를 살펴보세요.

{>tip}
> Java 15 에서 [비슷한 개념](https://docs.oracle.com/en/java/javase/15/language/sealed-classes-and-interfaces.html#GUID-0C709461-CC33-419A-82BF-61461336E65F)이 제시되었습니다. 
> Java 에서는 봉인된 클래스에 대해 `sealed` 키워드와 `permits` 절을 사용해 제한된 상속 계층 형성을 정의합니다.

## 봉인된 클래스 및 인터페이스의 정의

봉인된 클래스와 인터페이스를 정의하려면, `sealed` 수정자를 사용합니다:

```kotlin
// 봉인된 인터페이스를 정의합니다.
sealed interface Error

// 봉인된 인터페이스 Error를 구현하는 봉인된 클래스를 만듭니다.
sealed class IOError(): Error

// 봉인된 클래스 'IOError' 를 확장하는 서브클래스들을 정의합니다.
class FileReadError(val file: File): IOError()
class DatabaseError(val source: DataSource): IOError()

// 봉인된 인터페이스 Error를 구현하는 싱글톤 오브젝트를 만듭니다.
object RuntimeError : Error
```

이 예제는 어떤 에러들을 포함하는 라이브러리의 API를 표현합니다. 서드파티 클라이언트들은 이러한 에러들을 핸들링할 수 있습니다.
만약 이러한 상속 계층 내 구성 요소들이 공개적인 API 로 접근할 수 있다면, 서드파티 클라이언트가 이러한 요소들에 간섭하여
확장하는 행위를 막지 못합니다. 라이브러리는 클라이언트들이 어떤 구현을 추가할지 알 수 없으므로, 그의 내부 구현이 이들을
일관성 있게 핸들링할 수 없습니다.
그러나, 에러 클래스들을 **봉인된** 상속 계층 안에 가두면, 라이브러리 작성자가 모든 에러의 타입을 컴파일타임에 알 수 있으며 
다른 에러 타입이 새로 생기지 않을 것임을 보장할 수 있습니다.

이 예제의 상속 계층 구조는 아래와 같습니다:
![위의 예제가 표현하는 에러 클래스의 상속 계층 구조](/hierarchy.svg)

### 생성자

봉인된 클래스 자신은 항상 [추상 클래스](/docs/classes.md#추상-클래스)입니다. 그렇기 때문에, 곧바로 인스턴스화 될 수 없습니다.
그러나 자신만의 생성자를 가지거나 슈퍼클래스의 생성자를 물려받는 것은 가능합니다. 이러한 생성자들은 봉인된 클래스 자신이 아닌 
그의 서브클래스들을 위한 것입니다. `Error` 라는 이름을 가지는, 여러 서브클래스를 가지는 봉인된 클래스와 관련된 아래 예제를 확인해보세요:

```kotlin
sealed class Error(val message: String) {
    class NetworkError : Error("Network failure")
    class DatabaseError : Error("Database cannot be reached")
    class UnknownError : Error("An unknown error has occurred")
}

fun main() {
    val errors = listOf(Error.NetworkError(), Error.DatabaseError(), Error.UnknownError())
    errors.forEach { println(it.message) }
}
// Network failure 
// Database cannot be reached 
// An unknown error has occurred
```

[`enum`](/docs/enum-classes.md) 클래스를 봉인된 클래스들의 상태나 추가적인 정보를 제공하기 위해 사용할 수도 있습니다.
각 열거형 상수들은 **단 하나**의 인스턴스로 공유되지만, 봉인된 클래스의 서브클래스들은 **여러 개의** 인스턴스를 가질 수 있습니다.
예를 들어, 몇몇 서브클래스를 가지는 `sealed class Error` 는 `enum` 을 사용하여 오류의 치명도를 나타내고 있습니다. 
각 서브클래스들은 `severity` 를 초기화하고 그들 자신의 상태를 덧붙힙니다:

```kotlin
enum class ErrorSeverity { MINOR, MAJOR, CRITICAL }

sealed class Error(val severity: ErrorSeverity) {
    class FileReadError(val file: File): Error(ErrorSeverity.MAJOR)
    class DatabaseError(val source: DataSource): Error(ErrorSeverity.CRITICAL)
    object RuntimeError : Error(ErrorSeverity.CRITICAL)
    // Additional error types can be added here
}
```

봉인된 클래스들의 생성자들은 `protected` 와 `private` 의 두 가지 [가시성 수정자](/docs/visibility-modifiers.md)를 가질 수 있습니다.

```kotlin
sealed class IOError {
    // 기본적으로 protected 가시성 수정자가 부여됩니다. 이 클래스와 그들의 서브클래스에서 접근할 수 있습니다.
    constructor() { /*...*/ }

    // private 생성자입니다. 오직 자기 자신에서만 접근할 수 있습니다.
    // 봉인된 클래스에서 private 생성자를 사용하면 그들의 인스턴스화에 대해 정해진 로직만을 따르게 하여 더 강하게 제어할 수 있습니다. 
    private constructor(description: String): this() { /*...*/ }

    // 이러한 선언은 오류를 보고합니다. public 이나 internal 생성자는 봉인된 클래스에서 허용되지 않습니다.
    // public constructor(code: Int): this() {}
}
```

## 상속

봉인된 클래스들의 직계 서브클래스들은 반드시 그 봉인된 클래스와 같은 패키지에 작성되어야 합니다.
최상위 레벨에 존재하거나, 다른 이름이 있는 클래스, 인터페이스, 오브젝트들 안에 중첩되어있을 수도 있습니다.
서브클래스들은 Kotlin 의 일반적인 상속 규칙을 어긋나게 하지 않는 범위 내의 어떤 [가시성 수정자](/docs/visibility-modifiers.md)도 가질 수 있습니다.

봉인된 클래스의 서브클래스들은 적절한 이름을 가져야합니다. 로컬이거나 익명 오브젝트일 수 없습니다.

> `enum` 클래스는 봉인된 클래스를 확장할 수 없습니다. 그러나 봉인된 인터페이스를 구현할 수는 있습니다:
> ```kotlin
> sealed interface Error
>
> // Error 인터페이스를 확장하는 enum 클래스
>  enum class ErrorType : Error {
>     FILE_ERROR, DATABASE_ERROR
> }
> ```

이러한 제한은 간접 서브클래스들에는 적용되지 않습니다. 만약 봉인된 클래스의 어떤 직계 서브클래스가 봉인되지 않았다면, 그 수정자가 허용하는 대로 확장할 수 있습니다:

```kotlin
// 봉인된 인터페이스 'Error' 는 그의 구현체가 같은 모듈 내의 같은 패키지에만 존재합니다.
// Sealed interface 'Error' has implementations only in the same package and module
sealed interface Error

// 'Error' 를 확장하는 봉인된 클래스 'IOError' 도 마찬가지로 같은 모듈의 같은 패키지에서만 확장 가능합니다.
sealed class IOError(): Error

// 'Error' 를 확장하는 열린(open) 클래스 'CustomError' 는 그것이 '보이는' 어느 곳에서든 확장할 수 있습니다.
open class CustomError(): Error
```

### 멀티플랫폼 프로젝트에서의 확장

[멀티플랫폼 프로젝트](/docs/multiplatform-get-started.md)들에서는 봉인된 클래스들에서의 상속 제한이 하나 더 있습니다.
봉인된 클래스들의 직게 서브클래스들은 반드시 같은 [소스 집합](/docs/multiplatform-discover-project.html#source-sets) 안에 있어야 합니다.
이는 [expect 와 actual 수정자](/docs/multiplatform-expect-actual.md) 가 없는 봉인된 클래스들에게 적용됩니다.

만약 봉인된 클래스들이 common 소스 집합에서 `expect` 로 정의되었고 실제 `actual` 구현이 각 플랫폼의 소스 집합에 있었다면, 
`expect` 와 `actual` 버전 모두 그들 각각의 서브클래스를 각각의 소스 집합에 가질 수 있습니다.
더해서, 프로젝트에서 소스 집합 계층 구조를 사용하고 있다면, 어떤 소스 집합에서던 `expect` 및 `actual` 정의 사이에서 서브클래스들을 추가할 수 있습니다.

[멀티플랫폼 프로젝트에서 소스 집합 계층 구조에 대해 자세히 알아보세요.](/docs/multiplatform-hierarchy.md)

## 봉인된 클래스와 when 표현

봉인된 클래스를 사용할 때의 특별한 장점은 그들을 [`when`](/docs/control-flow.md#when-표현) 표현과 함께 사용할 때 보이기 시작합니다.
`when`은 봉인된 클래스와 함께 쓰일 때, 컴파일러가 철저한{^[1]} 가지 체크를 통해 모든 케이스가 핸들링되었는지에 대해 보장할 수 있게 합니다.
이러한 경우에는, `else` 절을 추가하지 않아도 됩니다:

```kotlin
// 에러를 출력하기 위한 함수
fun log(e: Error) = when(e) {
    is Error.FileReadError -> println("Error while reading file ${e.file}")
    is Error.DatabaseError -> println("Error while reading from database ${e.source}")
    Error.RuntimeError -> println("Runtime error")
    // 이미 모든 케이스가 핸들링되었으므로 `else` 절이 필요하지 않습니다.
}
```

> 멀티플랫폼 프로젝트에서, `when` 표현에 [expect 로 정의된 봉인된 클래스](/docs/multiplatform-expect-actual.md) 를 사용했다면 여전히 `else` 가지가 필요합니다.
> 이는 `actual` 로 정의된 각 플랫폼 소스 집합의 실제 구현들을 common 코드는 알 수 없기 때문입니다.

---
{&[1]} 원문: exhaustively

## 사용 케이스

봉인된 클래스나 인터페이스를 사용하면 좋은 몇 가지 예제 시나리오들을 살펴봅시다.

### UI 어플리케이션들의 상태 관리

서로 다른 UI 상태를 나타내기 위해 봉인된 클래스를 사용할 수 있습니다. 
이러한 접근은 UI 변경의 구조화되고 안전한 핸들링을 가능하게 합니다.
아래의 예제는 몇 가지의 UI 상태에 대해 어떻게 핸들링하는지를 나타냅니다:

```kotlin
sealed class UIState {
    data object Loading : UIState()
    data class Success(val data: String) : UIState()
    data class Error(val exception: Exception) : UIState()
}

fun updateUI(state: UIState) {
    when (state) {
        is UIState.Loading -> showLoadingIndicator()
        is UIState.Success -> showData(state.data)
        is UIState.Error -> showError(state.exception)
    }
}
```

### 결제 수단 핸들링

비즈니스 어플리케이션에서, 결제 수단에 대한 효율적인 핸들링은 일반적인 요구사항입니다. 
이럴 때 봉인된 클래스와 `when` 문장을 사용하여 이러한 비즈니스 로직을 구현할 수 있습니다.
서로 다른 결제 수단들을 봉인된 클래스의 서브클래스로 표현하면, 트랜잭션을 처리하는 명백하고 관리 가능한 구조를 수립할 수 있습니다.

```kotlin
sealed class Payment {
    data class CreditCard(val number: String, val expiryDate: String) : Payment()
    data class PayPal(val email: String) : Payment()
    data object Cash : Payment()
}

fun processPayment(payment: Payment) {
    when (payment) {
        is Payment.CreditCard -> processCreditCardPayment(payment.number, payment.expiryDate)
        is Payment.PayPal -> processPayPalPayment(payment.email)
        is Payment.Cash -> processCashPayment()
    }
}
```

`Payment` 는 전자 결제 시스템에서 서로 다른 결제 수단인 `CreditCard`, `PayPal`, `Cash` 를 표현할 수 있는 봉인된 클래스입니다.
각 서브클래스들은 그들만의 프로퍼티를 가질 수 있습니다. 예를 들어 `CreditCard` 라면 `number` 와 `expiryDate` 를, `PayPal` 이라면 `email` 을 가질 수 있겠지요.

`processPayment()` 함수가 서로 다른 결제 수단에 대해 어떻게 핸들링하는지를 보여줍니다.
이러한 접근은 모든 가능한 결제 수단들이 적절히 핸들링되었음을 보장하며, 그와 동시에 미래에 새로운 결제 수단을
추가해야할 때의 유연함도 제공합니다.

### API 요청-응답 핸들링

API 요청과 응답을 핸들링하는 사용자 인증 시스템을 구현할 때에도 봉인된 클래스를 사용할 수 있습니다.
이 인증 시스템은 로그인과 로그아웃 기능이 있다고 생각해볼게요. 
`ApiRequest` 라는 봉인된 클래스는 `LoginRequest` 와 `LogoutRequest` 라는 특정한 요청 타입을 표현합니다.
또다른 `ApiResponse` 라는 봉인된 클래스는 성공을 표현하는 `UserSuccess`와 존재하지 않음을 표현하는 `UserNotFound`, 기타 다른 모든 오류를 표현하는 `Error` 의 서로 다른 응답 시나리오들을 표현합니다.
`handleRequest` 함수가 이러한 요청들을 `getUserById` 함수와 `when` 표현을 사용하여 타입에 대해 안정적인 형태로 처리합니다.

```kotlin
// 필요한 모듈을 임포트합니다.
import io.ktor.server.application.*
import io.ktor.server.resources.*

import kotlinx.serialization.*

// API 요청들에 대한 봉인된 인터페이스를 Ktor resources 어노테이션과 함께 정의합니다.
@Resource("api")
sealed interface ApiRequest

@Serializable
@Resource("login")
data class LoginRequest(val username: String, val password: String) : ApiRequest

@Serializable
@Resource("logout")
object LogoutRequest : ApiRequest

// 자세한 응답 형태들과 함께 ApiResponse 라는 봉인된 클래스를 정의합니다.
sealed class ApiResponse {
    data class UserSuccess(val user: UserData) : ApiResponse()
    data object UserNotFound : ApiResponse()
    data class Error(val message: String) : ApiResponse()
}

// 성공 응답에 포함할 사용자에 대한 데이터 클래스
data class UserData(val userId: String, val name: String, val email: String)

// 사용자의 인증 정보를 검증합니다 (예제를 위한)
fun isValidUser(username: String, password: String): Boolean {
    // 어떠한 검증 로직 (이건 그냥 임시 코드입니다)
    return username == "validUser" && password == "validPass"
}

// API 요청을 처리하여 자세한 응답을 리턴하는 함수 
fun handleRequest(request: ApiRequest): ApiResponse {
    return when (request) {
        is LoginRequest -> {
            if (isValidUser(request.username, request.password)) {
                ApiResponse.UserSuccess(UserData("userId", "userName", "userEmail"))
            } else {
                ApiResponse.Error("Invalid username or password")
            }
        }
        is LogoutRequest -> {
            // 이 예제에서 로그아웃 요청은 항상 성공한다고 가정합니다.
            ApiResponse.UserSuccess(UserData("userId", "userName", "userEmail")) // 예제 용도
        }
    }
}

// getUserById 호출을 시뮬레이션하기 위한 함수
fun getUserById(userId: String): ApiResponse {
    return if (userId == "validUserId") {
        ApiResponse.UserSuccess(UserData("validUserId", "John Doe", "john@example.com"))
    } else {
        ApiResponse.UserNotFound
    }
    // 예외 핸들링도 Error 응답에 표현될 수 있습니다.
}

// 사용 예를 표현하기 위한 main 함수
fun main() {
    val loginResponse = handleRequest(LoginRequest("user", "pass"))
    println(loginResponse)

    val logoutResponse = handleRequest(LogoutRequest)
    println(logoutResponse)

    val userResponse = getUserById("validUserId")
    println(userResponse)

    val userNotFoundResponse = getUserById("invalidId")
    println(userNotFoundResponse)
}
```

{&?}
