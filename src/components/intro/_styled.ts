"use client"

import styled, { createGlobalStyle } from "styled-components"
import Image from "next/image"
import { LessThen, LessThen1000, LessThen640 } from "@/utils/ReactiveStyles"

export const HomeGlobalStyle = createGlobalStyle`
  html { background-color: #19191C }
`

export const HomeRoot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  
  max-width: 100vw;
  overflow-x: clip;
  position: relative;
  
  flex: 1;
  
  background-color: #19191c;
  color: white;
`

export const HomeArranger = styled.div`
  display: flex;
  
  width: 1144px;
  margin: 0 auto;
  padding-top: 72px;
  
  position: relative;
  
  overflow-y: clip;
  
  ${LessThen(1190)} {
    width: calc(952px + 16px * 2);
    padding-left: 16px;
    padding-right: 16px;
  }
  ${LessThen(1000)} {
    width: 760px;
    flex-direction: column;
  }
  ${LessThen(808)} {
    width: 568px;
  }
  ${LessThen(568 + 16 * 2)} {
    width: 100vw;
  }
`

export const HomeContent = styled.div`
  display: flex;
  flex-direction: column;
  z-index: 1;
  flex-shrink: 0;
  align-self: flex-start;

  margin-right: 128px;

  position: sticky;

  top: calc(64px + 96px + 150px);

  ${LessThen(1190)} {
    top: calc(64px + 72px + 150px);
    margin-right: 48px;
  }

  ${LessThen1000} {
    top: calc(52px + 72px + 150px);
  }

  ${LessThen(1000)} {
    position: static;
  }

  ${LessThen(568 + 16 * 2)} {
    width: calc(100vw - 32px);
  }
`

export const HomeTitle = styled.h1`
  font-size: 72px;
  font-weight: 530;
  font-family: "JetBrains Sans", sans-serif;
  margin-bottom: 0;
  margin-top: 0;
  margin-left: -4px;
  letter-spacing: -0.005em;
  line-height: 72px;
  
  &:before, &:after {
    content: '';
    left: 50%;
    position: absolute;
    filter: blur(45px);
    transform: translateZ(0);

    ${LessThen(1150)} {
      opacity: 0.6;
    }
  }

  &:before {
    width: 480px; height: 360px;
    background: linear-gradient(
      to bottom right,
      rgba(84, 56, 173, 0),
      rgba(84, 56, 173, 0),
      rgba(84, 56, 173, 0.3)
    );
    border-radius: 50%;
    margin: -200px 0 0 -450px;
  }

  &:after {
    width: 240px; height: 180px;
    background: radial-gradient(rgba(84, 56, 173, 0.4), rgba(84, 56, 173, 0));
    z-index: -1;
    margin: -100px 0 0 -50px;
  }
`

export const HomeSubtitle = styled.p`
  font-size: 29px;
  opacity: 0.5;
  font-weight: 300;
  margin: 0;
  line-height: 39px;
  
  ${LessThen640} {
    font-size: 24px;
  }
`

export const HomeTitleFooterRow = styled.div`
  display: flex;
  margin-top: 96px;
  
  & > svg {
    transform: scale(calc(52 / 54));
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  ${LessThen(1000)} {
    margin-top: 32px;
  }
`

export const GetStartedButton = styled.a`
  border: none;
  background-color: #7f52ff;
  height: 52px;
  border-radius: 26px;
  padding: 0 32px;
  font-size: 20px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`

export const HomeTitleFooterDivider = styled.div`
  height: 52px;
  border-left: 1px solid hsla(0, 0%, 100%, .2);
  margin: 0 24px;
  
  ${LessThen640} {
    margin: 0 20px;
  }
`

export const DevelopedBy = styled.p`
  font-family: "JetBrains Sans", sans-serif;
  font-size: 13px;
  margin: 0;
  align-self: center;
  
  letter-spacing: 0.0585px;

  & a {
    border-bottom: 1px solid hsla(0,0%,100%,.4 );
    padding-bottom: 1px;
  }
  
  & a:hover {
    border-bottom: 2px solid white;
    padding-bottom: 0;
  }
`

export const HeroImagePositioner = styled.div`
  position: absolute;
  top: 96px;
  right: 0;
  height: calc(100vh + 96px + 64px + 64px);
  
  ${LessThen(1190)} {
    top: 72px;
    right: 16px;
    height: calc(100vh + 72px + 64px + 64px);
  }

  ${LessThen(1000)} {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    
    top: 0;
    bottom: 0;
    left: 50%;
    height: unset;
    right: unset;
    transform: translate(-50%, 10%);
    z-index: 0;
  }
`

export const HeroImage = styled(Image)`
  width: 560px;
  height: 560px;
  position: sticky;
  top: calc(96px + 64px);
  
  filter: blur(64px);

  ${LessThen(1190)} {
    top: calc(72px + 64px);
  }
  
  ${LessThen(1000)} {
    top: unset;
    bottom: 0;
  }
`

export const HomeReadMeHeading = styled.p`
  font-size: 13px;
  line-height: initial !important;
  padding: 16px !important;
  margin: 0;
  border-radius: 8px 8px 0 0;
  background-color: #171717C0;
  
  position: sticky;
  top: 64px;
  backdrop-filter: blur(64px);
  -webkit-backdrop-filter: blur(64px);
  opacity: unset !important;
  z-index: 2;
  
  ${LessThen(1000)} {
    top: 52px;
  }
`

export const HomeReadMe = styled.div`
  background:
    radial-gradient(circle at 100% 100%, rgba(84, 56, 173, 0.25), transparent),
    radial-gradient(circle at 0 10%, rgba(134, 54, 111, 0.05), transparent),
    linear-gradient(to bottom, rgba(30, 30, 33, 0.4), rgba(30, 30, 33, 0.4));
  font-weight: 300;
  width: 100%;
  word-break: keep-all;
  border-radius: 8px;
  
  margin-top: -16px;
  
  position: relative;
  z-index: 1;
  
  margin-bottom: 64px;
  
  ${LessThen(1000)} {
    margin-top: 64px;
  }
  
  & h1, h2, h3, h4, h5 {
    font-weight: 500;
  }
  
  & ul {
    padding-inline-start: 32px;
    line-height: 24px;
  }
  
  & > ul {
    opacity: 0.75;
  }
  
  & > p {
    opacity: 0.75;
    line-height: 24px;
  }
  
  & > * {
    padding: 0 16px;
  }

  & a {
    border-bottom: 1px solid #d1d1d2;
    transition: border-color 0.1s linear;
  }

  & a:hover {
    border-bottom: 1px solid white;
  }
`
