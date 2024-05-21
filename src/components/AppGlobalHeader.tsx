"use client"

import React, { useEffect, useRef, useState } from "react"
import styled, { css } from "styled-components"
import { LessThen, LessThen1000, LessThen640 } from "@/utils/ReactiveStyles"
import {
  DocumentNavigatorExpandedEvent,
  DocumentNavigatorExpandedEvents
} from "@/components/documents/DocumentNavigator"
import { usePathname } from "next/navigation"
import Link from "next/link"

import KotlinIcon from "@/resources/kotlin-header-icon.svg"
import KotlinIconLarge from "@/resources/kotlin-header-icon-large.svg"
import KotlinIconSmall from "@/resources/kotlin-header-icon-small.svg"
import { GitRepository } from "@/config"

export const AppGlobalHeader: React.FC = () => {

  const [expanded, setExpanded] = useState(false)
  const savedScrollState = useRef(0)

  const pathname = usePathname()
  const isInDocument = pathname.startsWith("/docs/")
  const isHome = pathname === "/"

  useEffect(() => {
    const handler = (e: Event) => {
      if (!(e instanceof DocumentNavigatorExpandedEvent)) return
      setExpanded(prevState => {
        const { newState } = e
        if (prevState === newState) return newState
        if (newState) {
          if (document.scrollingElement!.classList.contains("disabled-scroll")) return newState
          savedScrollState.current = document.scrollingElement!.scrollTop
          document.scrollingElement!.classList.add("disabled-scroll")
        } else {
          if (!document.scrollingElement!.classList.contains("disabled-scroll")) return newState
          document.scrollingElement!.scrollTo({ top: savedScrollState.current, behavior: "instant" })
          document.scrollingElement!.classList.remove("disabled-scroll")
        }
        return newState
      })
    }

    DocumentNavigatorExpandedEvents.addEventListener("state_changed", handler)
    return () => DocumentNavigatorExpandedEvents.removeEventListener("state_changed", handler)
  }, [])

  return (
    <Root id="app-global-header" $darker={isHome}>
      <Link href={"/"}>
        {isHome ? <KotlinIconLarge className={"wide"}/> : <KotlinIcon className={"wide"}/>}
        <KotlinIconSmall className={"narrow"}/>
      </Link>
      <HeaderTitle className={"narrow"}>문서</HeaderTitle>
      <Description className={"description"}>비공식 한국어 번역</Description>
      <Spacer/>
      <HeaderLink href={GitRepository}>GitHub</HeaderLink>
      <HeaderTab
        href={"/docs/home"}
        className={"force-display-when-narrow-home"}
        $selected={isInDocument}
      >
        문서
      </HeaderTab>
      {expanded ?
        <Close className={"force-hide-when-narrow-home"} onClick={DocumentNavigatorExpandEvents.toggleNavigator}/> :
        <Hamburger className={"force-hide-when-narrow-home"} onClick={DocumentNavigatorExpandEvents.toggleNavigator}/>
      }
    </Root>
  )
}

export const DocumentNavigatorExpandEvents = new class extends EventTarget {
  toggleNavigator = () => this.dispatchEvent(new Event("navigator_toggle"))
}

type ClickableButtonProps = { onClick: React.MouseEventHandler<HTMLButtonElement>, className?: string }

const Hamburger: React.FC<ClickableButtonProps> = props =>
  <HeaderButton {...props}>
    <svg viewBox="0 0 24 24" data-test="icon-hamburger" className="hamburger">
      <path fill="currentColor" d="M4 5h16v2H4zm0 6h16v2H4zm0 6h16v2H4z"></path>
    </svg>
  </HeaderButton>

const Close: React.FC<ClickableButtonProps> = props =>
  <HeaderButton {...props}>
    <svg viewBox="0 0 24 24" data-test="icon-close" className="close">
      <path
        fill="currentColor"
        d="M19.707 5.707l-1.414-1.414L12 10.586 5.707 4.293 4.293 5.707 10.586 12l-6.293 6.293 1.414 1.414L12 13.414l6.293 6.293 1.414-1.414L13.414 12l6.293-6.293z"></path>
    </svg>
  </HeaderButton>


const DarkerAppHeaderStyles = ({ $darker }: { $darker: boolean }) => !$darker ?
  css`
    ${LessThen640} {
      & > a > svg.wide { display: none }
      & > a > svg.narrow { display: block }
      & > span.narrow { display: block } 
      & > span.description { margin-left: 4px }
    }
  ` :
  css`
    background-color: #19191C;
    ${LessThen1000} {
      & > .force-display-when-narrow-home { display: flex !important }
      & > .force-hide-when-narrow-home { display: none !important }
      padding: 0 16px 0 16px;
    }
  `

const Root = styled.header<{ $darker: boolean }>`
  position: fixed;
  top: 0;
  z-index: 5;
  width: 100vw;
  
  flex-shrink: 0;
  
  background-color: #27282c;
  height: 64px;
  display: flex;
  color: white;
  padding: 0 32px;
  align-items: center;
  
  & > a > svg.wide {
    display: block;
    width: 100px;
    height: 24px;
  }

  & > a > svg.narrow {
    display: none;
    width: 20px;
    height: 20px;
  }

  ${LessThen1000} {
    height: 52px;
    padding: 0 0 0 16px;
  }

  ${DarkerAppHeaderStyles}
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

const HeaderTitle = styled.span`
  display: none;
  margin-left: 12px;
`

const Description = styled.span`
  color: hsla(0, 0%, 100%, 0.7);
  font-size: 12px;
  margin-top: -12px;
  font-weight: 200;
`

const Spacer = styled.div`
  flex: 1;
`

const HeaderTab = styled(Link)<{ $selected: boolean }>`
  font-weight: 300;
  align-self: stretch;
  border-bottom: 2px solid ${({ $selected }) => $selected ? "white" : "transparent"};
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
  
  ${LessThen(1000)} {
    &:before {
      bottom: 16px;
    }
  }
`
