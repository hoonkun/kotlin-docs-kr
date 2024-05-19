"use client"

import React from "react";
import styled from "styled-components";

import KotlinIcon from "@/resources/kotlin-header-icon.svg"

export const Header: React.FC = () => {
    return (
        <Root>
            <KotlinIcon/>
            <Description>코틀린 문서 비공식 한국어 번역</Description>
            <Spacer/>
            <HeaderLink>GitHub</HeaderLink>
            <HeaderTab>문서</HeaderTab>
        </Root>
    )
}

const Root = styled.header`
    background-color: #27282c;
    height: 64px;
    display: flex;
    color: white;
    padding: 0 48px 0 32px;
    align-items: center;
    
    & > svg {
        width: 100px;
        height: 24px;
    }
`

const Description = styled.span`
    color: hsla(0,0%,100%,0.7);
    font-size: 12px;
    margin-top: -12px;
    font-weight: 200;
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
`

const HeaderLink = styled.a`
    font-weight: 300;
    margin-right: 32px;
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
