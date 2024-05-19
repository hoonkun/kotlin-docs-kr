"use client"

import React, { PropsWithChildren } from "react"
import styled from "styled-components"
import { LessThen1000 } from "@/utils/ReactiveStyles"


type HeadingAnchorProps = {
  id: string
}

export const HeadingAnchor: React.FC<PropsWithChildren<HeadingAnchorProps>> = props => {
  return (
    <Root className={"anchor-container"}>
      <Anchor id={props.id}/>
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
