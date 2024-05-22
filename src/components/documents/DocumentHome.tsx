"use client"

import React, { PropsWithChildren } from "react"
import styled from "styled-components"

import GettingStartedIcon from "$/docs/images/home/getting-started.svg"
import KotlinOnlineIcon from "$/docs/images/home/kotlin-online.svg"
import { LessThen640 } from "@/utils/ReactiveStyles"

export const DocumentHome: React.FC = () => {
  return (
    <>
      <Title>Kotlin 문서</Title>
      <LatestStableVersion>최신 안정 버전: 1.9.24<sup>outdated 되었을 수 있으므로, <a href="https://kotlinlang.org/docs/home.html">여기</a>에서 실제 정보를 확인해주세요.</sup></LatestStableVersion>
      <DocumentHomeItems>
        <DocumentHomeItem
          title={"Kotlin 시작하기"}
          icon={GettingStartedIcon}
          href={"getting-started.md"}
        >
          Kotlin 의 첫 프로젝트를 IntelliJ IDEA 혹은 Android Studio 를 사용하여 마음에 드는 플랫폼에서 시작해보세요.
        </DocumentHomeItem>
        <DocumentHomeItem
          title={"Kotlin 온라인 시도해보기"}
          icon={KotlinOnlineIcon}
          href={"https://play.kotlinlang.org/"}
        >
          브라우저에서 곧바로 Kotlin 코드를 작성하고, 수정하고, 실행하고, 공유해보세요!
        </DocumentHomeItem>
      </DocumentHomeItems>
      <h2>첫 발 내딛기</h2>
      <DocumentHomeItems>
        <DocumentHomeItem
          title={"기본 문법"}
          href={"basic-syntax.md"}
        >
          키워드, 연산자, 프로그래밍 구조 등의 Kotlin 문법을 빠르게 소개합니다.
        </DocumentHomeItem>
        <DocumentHomeItem
          title={"코틀린 여행"}
          enabled={false}
        >
          Kotlin 프로그래밍 언어의 기본기를 위한 여행을 떠나보세요.
        </DocumentHomeItem>
        <DocumentHomeItem
          title={"Koans"}
          enabled={false}
        >
          Kotlin 에 익숙해지기 위한 프로그래밍 연습을 해보세요.
        </DocumentHomeItem>
        <DocumentHomeItem
          title={"커맨드라인 컴파일러"}
          href={"command-line.md"}
        >
          Kotlin 컴파일러를 다운로드하고 설치해보세요.
        </DocumentHomeItem>
      </DocumentHomeItems>
      <Dark>
        <h2>인기있는 주제</h2>
        <DocumentHomeItems>
          <DocumentHomeItem
            title={"표준 라이브러리 API 레퍼런스"}
            href={"https://kotlinlang.org/api/latest/jvm/stdlib/"}
          >
            Kotlin 과의 매일매일을 위한 모든 기반: IO, 파일, 스레딩, 컬렉션, 기타 많은 것들!
          </DocumentHomeItem>
          <DocumentHomeItem
            title={"Gradle"}
            enabled={false}
          >
            빌드 프로세스를 관리하고 자동화하기 위한 빌드 시스템 도구
          </DocumentHomeItem>
          <DocumentHomeItem
            title={"기본 타입"}
            href={"basic-types.md"}
          >
            Kotlin 타입 시스템: 숫자, 문자열, 배열, 그리고 다른 built-in 타입들
          </DocumentHomeItem>
          <DocumentHomeItem
            title={"컬렉션"}
            href={"collections-overview.md"}
          >
            컬렉션: 리스트, 집합, 그리고 맵
          </DocumentHomeItem>
          <DocumentHomeItem
            title={"스코프 함수"}
            href={"scope-functions.md"}
          >
            스코프 함수들: let, with, run, apply, 그리고 also
          </DocumentHomeItem>
          <DocumentHomeItem
            title={"코루틴"}
            href={"coroutines-overview.md"}
          >
            동시성: 코루틴, 플로우, 채널
          </DocumentHomeItem>
        </DocumentHomeItems>
      </Dark>
      <h2>최신 소식</h2>
      <DocumentHomeItems>
        <DocumentHomeItem
          title={"Kotlin 1.9.20 의 새로운 기능"}
          enabled={false}
        >
          최신 소식: Kotlin K2 가 Beta 단계에 있으며 Kotlin Multiplatform 이 Stable 단계가 되었습니다.
        </DocumentHomeItem>
        <DocumentHomeItem
          title={"Kotlin 공식 로드맵"}
          href={"roadmap.md"}
        >
          Kotlin 개발에 대한 미래의 계획
        </DocumentHomeItem>
      </DocumentHomeItems>
      <h2>Kotlin 멀티플랫폼</h2>
      <DocumentHomeItems>
        <DocumentHomeItem
          title={"어째서 Kotlin 멀티플랫폼인가"}
          href={"https://www.jetbrains.com/kotlin-multiplatform/"}
        >
          어떻게 Kotlin 멀티플랫폼이 플랫폼 사이에서 코드를 공유하는지 알아봅니다.
        </DocumentHomeItem>
        <DocumentHomeItem
          title={"Kotlin 멀티플랫폼 마법사"}
          href={"https://kmp.jetbrains.com/"}
        >
          멀티플랫폼 프로젝트 템플릿을 빠르게 만들고 다운로드합니다.
        </DocumentHomeItem>
        <DocumentHomeItem
          title={"Kotlin 멀티플랫폼 시작하기"}
          href={"https://www.jetbrains.com/help/kotlin-multiplatform-dev/multiplatform-getting-started.html"}
        >
          안드로이드와 iOS 에서 모두 동작하는 모바일 어플리케이션을 만들어보세요.
        </DocumentHomeItem>
        <DocumentHomeItem
          title={"Compose 멀티플랫폼 시작하기"}
          href={"https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-multiplatform-getting-started.html"}
        >
          Compose 멀티플랫폼을 사용하여 모든 플랫폼에서 동작하는 사용자 인터페이스를 한 번에 구현해보세요.
        </DocumentHomeItem>
      </DocumentHomeItems>

      <p className="survey">
        이 페이지가 도움이 되셨다면, <a className="api-doc" href="https://kotlinlang.org/docs/home.html">원문 페이지</a>에 방문해 엄지척을 해주세요!
      </p>
    </>
  )
}

const Title = styled.h1`
  margin-top: 88px !important;
  font-weight: 500 !important;
`

const LatestStableVersion = styled.h2`
  font-size: 29px !important;
  font-weight: 200 !important;
  margin-top: 12px !important;
  padding-top: 12px !important;
  
  & > sup {
    font-size: 14px;
  }

  & a {
    color: #7f52ff;
  }
  & a:after {
    content: "\\2197";
    transform: translateY(2px);
    display: inline-block;
  }
`

const Dark = styled.div`
  background-color: hsla(0, 0%, 95.7%, 0.7);
  margin: 48px -32px 0 -32px;
  padding: 0 32px 48px 32px;
  align-self: stretch;
  display: flex;
  flex-direction: column;
`

const DocumentHomeItems = styled.div<{ $noMargin?: boolean }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto;
  align-self: stretch;
  margin-top: ${({ $noMargin }) => $noMargin ? "0" : "48px"};
  grid-gap: 32px;
  
  ${LessThen640} {
    grid-template-columns: 1fr;
  }
`

type DocumentHomeItemProps = { title: string, icon?: React.FC, enabled?: boolean, href?: string }
const DocumentHomeItem: React.FC<PropsWithChildren<DocumentHomeItemProps>> = props => {
  const { title, icon: Icon, enabled = true, href, children } = props

  return (
    <DocumentHomeItemRoot href={href} $enabled={enabled}>
      {Icon && <Icon/>}
      <DocumentHomeItemTitle>{title}</DocumentHomeItemTitle>
      <DocumentHomeItemDescription>{children}</DocumentHomeItemDescription>
    </DocumentHomeItemRoot>
  )
}

const DocumentHomeItemRoot = styled.a<{ $enabled: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 24px;
  border: 1px solid #d1d1d1;
  background-color: white;
  pointer-events: ${({ $enabled }) => $enabled ? "auto" : "none"};
  opacity: ${({ $enabled }) => $enabled ? 1 : 0.4};
  
  align-self: stretch;
  min-height: 140px;
  
  transition: border 0.1s linear;
  
  &:hover {
    border: 1px solid #19191c;
  }
  
  & > svg {
    width: 72px;
    height: 72px;
    margin-bottom: 30px;
    
    color: #7f52ff;
  }
`

const DocumentHomeItemTitle = styled.h3`
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 12px !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
  line-height: 28px;
`

const DocumentHomeItemDescription = styled.p`
  margin-top: 0 !important;
  font-size: 16px;
  color: #19191CD3;
`
