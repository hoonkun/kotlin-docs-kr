"use client"

import React from "react"

import NotFoundMascot from "@/resources/404-mascot.svg"
import styled from "styled-components"
import { LessThen1000 } from "@/utils/ReactiveStyles"

export default function RootNotFoundPage() {
  return (
    <Root>
      <NotFoundMascot/>
      <Title>페이지를 찾을 수 없어요.</Title>
      <Description href={"/"}>홈에서 다시 시작해보세요!</Description>
    </Root>
  )
}

const Root = styled.div`
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 64px);
  
  ${LessThen1000} {
    min-height: calc(100vh - 52px);
  }
`

const Title = styled.h1`
  font-size: 43px;
  margin-top: 24;
`
const Description = styled.a`
  font-size: 16px;
  margin-top: 12px;
  position: relative;
  
  margin-bottom: 48px;
  
  &:after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    border-bottom: 1px solid #d1d1d2;
    transition: border-color 0.1s linear;
  }
  &:hover:after {
    border-bottom: 1px solid #19191c;
  }
`
