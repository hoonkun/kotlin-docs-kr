"use client"

import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { LessThen1000, LessThen640 } from "@/utils/ReactiveStyles"

import KotlinIcon from "@/resources/kotlin-header-icon.svg"
import KotlinIconSmall from "@/resources/kotlin-header-icon-small.svg"
import {
  DocumentNavigatorExpandedEvent,
  DocumentNavigatorExpandedEvents
} from "@/components/documents/DocumentNavigator"

export const AppGlobalHeader: React.FC = () => {

  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      if (!(e instanceof DocumentNavigatorExpandedEvent)) return
      setExpanded(e.newState)
    }

    DocumentNavigatorExpandedEvents.addEventListener("state_changed", handler)
    return () => DocumentNavigatorExpandedEvents.removeEventListener("state_changed", handler)
  }, [])

  return (
    <Root>
      <KotlinIcon className={"wide"}/>
      <KotlinIconSmall className={"narrow"}/>
      <HeaderTitle>문서</HeaderTitle>
      <Description>코틀린 문서 비공식 한국어 번역</Description>
      <Spacer/>
      <HeaderLink>GitHub</HeaderLink>
      <HeaderTab>문서</HeaderTab>
      {expanded ?
        <Close onClick={DocumentNavigatorExpandEvents.toggleNavigator}/> :
        <Hamburger onClick={DocumentNavigatorExpandEvents.toggleNavigator}/>
      }
    </Root>
  )
}

export const DocumentNavigatorExpandEvents = new class extends EventTarget {
  toggleNavigator = () => this.dispatchEvent(new Event("navigator_toggle"))
}

type ClickableButtonProps = { onClick: React.MouseEventHandler<HTMLButtonElement> }

const Hamburger: React.FC<ClickableButtonProps> = ({ onClick }) =>
  <HeaderButton onClick={onClick}>
    <svg viewBox="0 0 24 24" data-test="icon-hamburger" className="hamburger">
      <path fill="currentColor" d="M4 5h16v2H4zm0 6h16v2H4zm0 6h16v2H4z"></path>
    </svg>
  </HeaderButton>

const Close: React.FC<ClickableButtonProps> = ({ onClick }) =>
  <HeaderButton onClick={onClick}>
    <svg viewBox="0 0 24 24" data-test="icon-close" className="close">
      <path
        fill="currentColor"
        d="M19.707 5.707l-1.414-1.414L12 10.586 5.707 4.293 4.293 5.707 10.586 12l-6.293 6.293 1.414 1.414L12 13.414l6.293 6.293 1.414-1.414L13.414 12l6.293-6.293z"></path>
    </svg>
  </HeaderButton>

const Root = styled.header`
  background-color: #27282c;
  height: 64px;
  display: flex;
  color: white;
  padding: 0 48px 0 32px;
  align-items: center;

  & > svg.wide {
    width: 100px;
    height: 24px;
  }

  & > svg.narrow {
    display: none;
    width: 20px;
    height: 20px;
  }

  ${LessThen1000} {
    height: 52px;
    padding: 0 0 0 16px;
  }

  ${LessThen640} {
    & > svg.wide {
      display: none
    }

    & > svg.narrow {
      display: block
    }
  }
`

const HeaderButton = styled.button`
  display: none;
  
  width: 52px;
  height: 52px;
  padding: 12px;
  background: none;
  border: none;
  color: white;
  margin-left: 8px;
  
  ${LessThen1000} {
    display: block;
  }
`

const HeaderTitle = styled.a`
  display: none;
  margin-left: 12px;

  ${LessThen640} {
    display: block;
  }
`

const Description = styled.span`
  color: hsla(0, 0%, 100%, 0.7);
  font-size: 12px;
  margin-top: -12px;
  font-weight: 200;

  ${LessThen640} {
    margin-left: 4px;
  }
`

const Spacer = styled.div`
  flex: 1;
`

const HeaderTab = styled.div`
  font-weight: 300;
  align-self: stretch;
  border-bottom: 2px solid white;
  display: flex;
  align-items: center;
  margin-left: 32px;

  ${LessThen1000} {
    display: none;
  }
`

const HeaderLink = styled.a`
  font-weight: 300;
  align-self: stretch;
  display: flex;
  align-items: center;
  position: relative;

  &:hover:before {
    opacity: 0.5;
  }

  &:before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 22px;
    height: 1px;
    background-color: white;
    opacity: 0.25;
    transition: opacity 0.1s linear;
  }

  &:after {
    content: "\\2197";
    display: inline-block;
    transform: translateY(2px);
  }
`
