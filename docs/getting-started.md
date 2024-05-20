
{>author}
> 이 문서의 대부분의 링크는 번역되지 않았거나 외부 링크이기 때문에, 원문 페이지로 이동합니다.

Kotlin 은 개발자들을 행복하게 하기 위해 개발된, 현대적이지만 충분히 성숙한 프로그래밍 언어입니다. 
Kotlin 은 간결하고, 안전하며, Java 를 비롯한 다른 언어와 상호 운용이 가능합니다. 게다가 생산성 있는 개발을 위해, 여러 플랫폼 사이에서 코드를 공유하기 위한 여러 방안들도 제시합니다.  

시작하기에 앞서, 저희의 Kotlin 으로의 여정에 참여해보시는건 어떠세요? 이 여정에서는 Kotlin 프로그래밍 언어의 기본적인 사항들을 다룹니다.

[![Kotlin 여정 시작하기](/take_kotlin_tour.svg)](https://kotlinlang.org/docs/kotlin-tour-welcome.html)

## Kotlin 설치하기
Kotlin 은 각 [Intellij IDEA](https://www.jetbrains.com/idea/download/) 및 [Android Studio](https://developer.android.com/studio) 릴리즈에 포함되어있습니다. 
Kotlin 사용을 시작하려면 이 IDE 중 하나를 다운로드받고 설치하세요.

## Kotlin 사용처 고르기

{-}

{--Backend--backend}  

Kotlin 의 서버사이드 어플리케이션을 만들기 위한 첫 발자국을 어떻게 내딛을지에 대한 가이드입니다.  

1. **첫 백엔드 어플리케이션 만들기:**
   - 가볍게 시작하려면, [Intellij IDEA 프로젝트 마법사를 통해 JVM 플랫폼의 어플리케이션을 만드세요.](https://kotlinlang.org/docs/jvm-get-started.html)
   - 조금 더 큰 프로젝트를 시작하려면, 아래 중 하나의 프로젝트를 선택하여 프로젝트를 만드세요:
   
   <table width="100%" >
   <thead>
   <tr>
    <th>Spring</th>
    <th>Ktor</th>
   </tr>
   </thead>
   <tr>
   <td width="50%">
   백만명 이상의 개발자가 사용하는, 명백하게 정의된 생태계를 가진 완성된 프레임워크
   <br/>
   <ul>
    <li><a href="https://kotlinlang.org/docs/jvm-get-started-spring-boot.md">Spring Boot를 사용하여 RESTful 웹 서비스 만들기</a>.</li>
    <li><a href="https://spring.io/guides/tutorials/spring-boot-kotlin/">Spring Boot 와 Kotlin 으로 웹 어플리케이션 만들기</a>.</li>
    <li><a href="https://spring.io/guides/tutorials/spring-webflux-kotlin-rsocket/">Kotlin, RSocket 과 함께 Spring Boot 사용하기</a>.</li>
   </ul>
   </td>
   <td width="50%">
    구조적 결정의 자유로움을 중요하게 여기는 개발자를 위한, 가벼운 프레임워크
   <ul>
    <li><a href="https://ktor.io/docs/creating-http-apis.html">Ktor 로 HTTP API 만들기</a>.</li>
    <li><a href="https://ktor.io/docs/creating-web-socket-chat.html">Ktor 로 웹소켓 채팅 만들기</a>.</li>
    <li><a href="https://ktor.io/docs/creating-interactive-website.html">Ktor 로 상호작용할 수 있는 웹사이트 만들기</a>.</li>
    <li><a href="https://ktor.io/docs/heroku.html">서버사이드 Kotlin 어플리케이션 배포하기: Heroku 위의 Ktor</a>.</li>
   </ul>

   </td>
   </tr>
   </table>

2. **어플리케이션에 Kotlin 과 서드파티 라이브러리 사용하기.** [프로젝트에 라이브러리를 추가하는 방법](https://kotlinlang.org/docs/gradle-configure-project.html#configure-dependencies)에 대해 더 알아보세요.
   - [Kotlin 표준 라이브러리](https://kotlinlang.org/api/latest/jvm/stdlib/)는 [컬렉션](https://kotlinlang.org/docs/collections-overview.html) 이나 [코루틴](https://kotlinlang.org/docs/coroutines-guide.html) 등의 쓸만한 것들을 제공합니다.
   - [Kotlin 을 위한 서드파티 프레임워크, 라이브러리, 도구](https://blog.jetbrains.com/kotlin/2020/11/server-side-development-with-kotlin-frameworks-and-libraries/)들을 살펴보세요.

3. **서버사이드 Kotlin 에 대해 더 알아보기**
   - [첫 유닛 테스트를 작성하는 방법](https://kotlinlang.org/docs/jvm-test-using-junit.html)
   - [Kotlin 과 Java 코드를 같이 사용하는 방법](https://kotlinlang.org/docs/mixing-java-kotlin-intellij.html)

4. **Kotlin 서버사이드 커뮤니티에 참여하기**
   - Slack: [초대를 요청한 뒤](https://surveys.jetbrains.com/s3/kotlin-slack-sign-up), [#getting-started](https://kotlinlang.slack.com/archives/C0B8MA7FA), [#server](https://kotlinlang.slack.com/archives/C0B8RC352), [#spring](https://kotlinlang.slack.com/archives/C0B8ZTWE4), 혹은 [#ktor](https://kotlinlang.slack.com/archives/C0A974TJ9) 채널에 참여하세요.
   - StackOverflow: ["kotlin"](https://stackoverflow.com/questions/tagged/kotlin), ["spring-kotlin"](https://stackoverflow.com/questions/tagged/spring-kotlin), 혹은 ["ktor"](https://stackoverflow.com/questions/tagged/ktor) 태그를 구독하세요.

5. **Kotlin 을 구독하세요.**  
   [Twitter](https://twitter.com/kotlin), [Reddit](https://www.reddit.com/r/Kotlin/), 그리고 [Youtube](https://www.youtube.com/channel/UCP7uiEZIqci43m22KDl0sNw)를 통해 중요한 생태계 업데이트를 놓치지 마세요. 

문제점을 발견하셨거나 어려움을 겪고 계신다면, 저희의 [이슈 트래커](https://youtrack.jetbrains.com/issues/KT)에 보고해주세요. 

{/--}

{--Cross-platform--cross-platform}

여기에서 여러분은 [Kotlin Multiplatform](https://kotlinlang.org/lp/multiplatform/) 을 사용해 어떻게 크로스 플랫폼 어플리케이션을 개발하고, 개선할 수 있는지 배웁니다.

1. **[크로스 플랫폼 개발을 위한 환경 갖추기](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-setup.html).**

2. **iOS 와 Android 환경의 첫 어플리케이션 셋업하기:**

   * 스크래치로부터 시작하려면, [프로젝트 마법사를 통해 기본 크로스 플랫폼 어플리케이션을 만드세요](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-create-first-app.html).
   * 이미 Android 어플리케이션 프로젝트가 있고 그것을 크로스 플랫폼으로 전환하고 싶다면, [Android 어플리케이션을 iOS 에서 돌아가게 만들기](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-integrate-in-existing-app.html) 튜토리얼을 완료하세요.
   * 실사용 예제가 궁금하시다면, 네트워킹이나 데이터 스토리지 프로젝트 등의 예제 프로젝트를 [Ktor 와 SQLdelight 를 사용하는 멀티플랫폼 어플리케이션 만들기](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-ktor-sqldelight.html) 에서 클론하거나 기타 다른 [샘플 프로젝트](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-samples.html)를 클론하여 가지고 놀아보세요.

3. **수많은 멀티플랫폼 라이브러리를 사용**해 필요한 비즈니스 로직을 공유된 모듈에 단 한번만 구현하세요. [프로젝트에 라이브러리를 추가하는 방법](https://kotlinlang.org/docs/multiplatform-add-dependencies.md)에 대해 더 알아보세요.

   | Library       | Details                                                                                                                                                                                |
   |---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| 
   | Ktor          | [문서](https://ktor.io/docs/client.html)                                                                                                                                                 | 
   | Serialization | [문서](https://kotlinlang.org/docs/serialization.md) 및 [샘플](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-ktor-sqldelight.html#create-an-application-data-model) |
   | Coroutines    | [문서](coroutines-guide.md) 및 [샘플](coroutines-and-channels.md)                                                                                                                           |
   | DateTime      | [문서](https://github.com/Kotlin/kotlinx-datetime#readme)                                                                                                                                |
   | SQLDelight    | 서드 파티 라이브러리. [문서](https://cashapp.github.io/sqldelight/)                                                                                                                               |

   {>tip}
   > [커뮤니티 리스트](https://libs.kmp.icerock.dev/)에서도 멀티플랫폼 라이브러리를 찾아보실 수 있습니다.

4. **Kotlin 멀티플랫폼에 대해 더 알아보기:**
   * [Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform-get-started.md) 에서 Kotlin 멀티플랫폼에 대해 더 알아보세요.
   * [샘플 프로젝트](https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-samples.html)들을 둘러보세요.
   * [멀티플랫폼 라이브러리를 배포해보세요](https://kotlinlang.org/docs/multiplatform-publish-lib.md).
   * [Netflix](https://netflixtechblog.com/netflix-android-and-ios-studio-apps-kotlin-multiplatform-d6d4d8d25d23), [VMware](https://kotlinlang.org/lp/multiplatform/case-studies/vmware/), [Yandex](https://kotlinlang.org/lp/multiplatform/case-studies/yandex/), 그리고 [다른 여러 어플리케이션](https://kotlinlang.org/lp/multiplatform/case-studies/)에서 Kotlin 멀티플랫폼이 어떻게 사용되었는지 알아보세요.

5. **Kotlin 멀티플랫폼 커뮤니티에 참여하세요:**

   * Slack: [초대를 요청한 뒤](https://surveys.jetbrains.com/s3/kotlin-slack-sign-up), [#getting-started](https://kotlinlang.slack.com/archives/C0B8MA7FA) 그리고 [#multiplatform](https://kotlinlang.slack.com/archives/C3PQML5NU) 채널에 참여하세요.
   * StackOverflow: ["kotlin-multiplatform" tag](https://stackoverflow.com/questions/tagged/kotlin-multiplatform) 태그를 구독하세요.

6. **Kotlin 을 구독하세요**  
   [Twitter](https://twitter.com/kotlin), [Reddit](https://www.reddit.com/r/Kotlin/), 그리고 [Youtube](https://www.youtube.com/channel/UCP7uiEZIqci43m22KDl0sNw)를 통해 중요한 생태계 업데이트를 놓치지 마세요.

문제점을 발견하셨거나 어려움을 겪고 계신다면, 저희의 [이슈 트래커](https://youtrack.jetbrains.com/issues/KT)에 보고해주세요.

{/--}

{--Android--android}

* 안드로이드 개발을 위해 Kotlin 을 사용하시려면, [Android 에서 Kotlin 을 사용하기 위한 구글의 추천 사항](https://developer.android.com/kotlin/get-started)을 확인해보세요.

* 만약 안드로이드에 처음이고 Kotlin 을 사용하여 어플리케이션을 개발하려고 한다면, [이 Udacity 코스](https://www.udacity.com/course/developing-android-apps-with-kotlin--ud9012)를 확인해보세요.

[Twitter](https://twitter.com/kotlin), [Reddit](https://www.reddit.com/r/Kotlin/), 그리고 [Youtube](https://www.youtube.com/channel/UCP7uiEZIqci43m22KDl0sNw) 에서 Kotlin 을 구독하여 중요한 생태계 업데이트를 놓치지 마세요.

{/--}

{--Data analysis--data-analysis}

데이터 파이프라인부터 상용 기계학습 모델 제작까지, Kotlin 은 데이터 관련 작업이나 기타 관련된 작업들을 위한 훌륭한 선택입니다.

1. **IDE 를 통해 Notebook 을 만들고 원활하게 실행해보세요:**

   * [Kotlin Notebook 시작하기](https://kotlinlang.org/docs/get-started-with-kotlin-notebooks.md).

2. **데이터를 탐색하고 정제해보세요:**

   * [DataFrame](https://kotlin.github.io/dataframe/overview.html) – 데이터 분석과 취합을 위한 라이브러리.
   * [Kandy](https://kotlin.github.io/kandy/welcome.html) – 데이터 시각화를 위한 그래프를 그리는 라이브러리.

3. **Data Analysis 를 위한 Kotlin 의 최신 정보를 받아보세요:**

   * Slack: [초대를 요청한 뒤](https://surveys.jetbrains.com/s3/kotlin-slack-sign-up), [#datascience](https://kotlinlang.slack.com/archives/C4W52CFEZ) 채널에 참여하세요.
   * Twitter: [KotlinForData](http://twitter.com/KotlinForData) 를 구독하세요.

{/--}

{/-}

## 무언가 빠진게 있나요?

무언가 빠진게 있거나 헷갈리는 부분이 있으시다면, [피드백을 전달해주세요](https://surveys.hotjar.com/d82e82b0-00d9-44a7-b793-0611bf6189df).