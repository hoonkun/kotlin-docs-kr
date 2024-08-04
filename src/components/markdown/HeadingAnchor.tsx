"use client"

import React, { PropsWithChildren } from "react"
import styled from "styled-components"
import { LessThen1000 } from "@/utils/ReactiveStyles"


type HeadingAnchorProps = {
  korId: string
  engId?: string
}

export const HeadingAnchor: React.FC<PropsWithChildren<HeadingAnchorProps>> = props => {
  return (
    <Root className={"anchor-container"}>
      <Anchor id={props.korId}/>
      {props.engId &&
        <Anchor id={props.engId}/>
      }
      {props.children}
    </Root>
  )
}

const Root = styled.div`
  position: relative;
`

const Anchor = styled.div`
  position: absolute;
  left: 0;
  top: -64px;
  
  ${LessThen1000} {
    top: -52px;
  }
`

export const H1: React.FC<PropsWithChildren> = props => <h1 {...props}/>
export const H2: React.FC<PropsWithChildren> = props => <h2 {...props}/>
export const H3: React.FC<PropsWithChildren> = props => <h3 {...props}/>
export const H4: React.FC<PropsWithChildren> = props => <h4 {...props}/>
export const H5: React.FC<PropsWithChildren> = props => <h5 {...props}/>
export const H6: React.FC<PropsWithChildren> = props => <h6 {...props}/>
