# Kotlin 문서 비공식 한국어 번역 프로젝트
저장소 소유자(이하 필자)가 개인적으로 코틀린 공부를 위해 시작한 프로젝트입니다.  
필자가 시간이 날 때마다 [코틀린 문서](https://kotlinlang.org/docs/home.html)에 있는 내용 중 일부를 랜덤하게 번역하며, 그 내용은 [이 페이지](https://kotlin-docs-kr.hoonkun.kiwi)에서 확인하실 수 있습니다.

현재는 코루틴 관련 문서밖에 번역이 되어있지 않습니다.  
개인적으로 공부하려고 노션에 작성하던 것을, 비루한 영어 실력으로 작성된 번역이지만 다른 분들에게 공유하면 좋겠다 싶어 시작한 프로젝트이기 때문에 아직 진행이 그렇게 많이 되지도 않았습니다.

## 진행 상황
현재 번역을 진행할 계획이 있는 문서(원문)들은 아래와 같습니다:  
*필자에 의해 진행되는 순서는 완전히 랜덤합니다.

- Home, Get started
- Kotlin overview 의 하위 문서
- Releases and roadmap 의 하위문서
- Basics 의 하위문서
- Concepts 의 하위문서
- Standard library 의 하위문서
- Official libraries 의 하위문서
- Language reference 하위의 외부 링크가 아닌 문서
- Compilers and plugins 의 하위문서

이 중 번역이 완료된 문서들은 아래와 같습니다:

- Home, Get started
- Basics/
  - [Basic syntax](/docs/basic-syntax.md)
- Concepts/
  - Types/
    - BasicTypes/
      - [Overview](/docs/basic-types.md) 를 비롯한 모든 하위문서
  - [Packages and imports](/docs/packages.md)
  - Classes and objects/
    - [Classes](/docs/classes.md)
    - [Generics: in, out, where](/docs/generics.md)
    - [Object expressions and declarations](/docs/object-declarations.md)
  - Functions/
    - [Functions](/docs/functions.md)
  - [Null-safety](/docs/null-safety.md)
  - [Equality](/docs/equality.md)
  - [This expressions](/docs/this-expressions.md)
  - [Asynchronous programming techniques](/docs/async-programming.md)
  - [Coroutines](/docs/coroutines-overview.md)
- Official libraries/Coroutines (kotlinx.coroutines)
  - [Coroutines guide](/docs/coroutines-guide.md) 를 비롯한 일부 하위 문서

### 기여할 수 있나요?
필자가 번역 프로젝트를 진행/기여해본 경험이 전혀 없어서, 기여를 원하시면 진행을 위한 조언을 같이 부탁드리고자 합니다. 

## 문서 내의 다른 문서로의 링크
문서 내에서, 오른쪽에 ↗ 표시가 붙은 링크는 모두 원문(영어)으로 링크됩니다.  
그렇지 않은 모든 링크는 이 번역된 사이트 내의 페이지로 이동됩니다.

## 코드와 관련하여

Next.js App Router - static export 를 사용합니다.  

개발 환경은 node 의 yarn 패키지 매니저를 사용합니다.  
yarn 4 (berry) 를 사용하며, Zero-Install 은 사용하지 않습니다.  
~~처음에는 썼었는데 다 하고 푸시하려고 보니 Git 용량 문제가 터져서 filter-repo 한 번 돌렸습니다...~~

각 문서의 마크다운은 /docs 디렉터리에 있으며, 파일 이름은 실제 공식 코틀린 문서에서 사용하는 것과 동일합니다.  
다만, pure 마크다운 문법만으로 구성되지는 않으며 각주 및 기타 기능을 위한 별도 문법이 일부 존재합니다.  
당장은 코루틴 문서밖에 없어서 기본적인 각주, 페이지 끝의 '이 페이지가 도움이 되셨나요?' 의 축약형 문법 정도가 있지만, 추후 다른 문서에서 사용되는 탭 등의 기능들도 추가될 가능성이 있습니다.  

