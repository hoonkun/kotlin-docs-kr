"use client"

import styled from "styled-components";
import React, {PropsWithChildren} from "react";

import BlockquoteIcon from "@/resources/blockquote-icon.svg"
import Link from "next/link";

export const TopicDocumentRoot = styled.div`
    display: flex;
    width: 100vw;
    flex: 1;
    min-height: 0;
`

export const TopicsNavigation = styled.nav`
    width: 310px;
    border-right: 1px solid #d1d1d2;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    
    @media only screen and (max-width: 1276px) {
        width: 272px;
    }
    
    @media only screen and (max-width: 1540px) {
        width: 300px;
    }
`

export const TopicNavigationItem = styled(Link)<{ $background: string, $depth: number, $color: string, $disabled: boolean }>`
    background-color: ${({ $background }) => $background};
    padding: 8px 0 8px ${({ $depth }) => `${22 + ($depth + 1) * 16}px`};
    font-size: 13px;
    line-height: 20px;
    color: ${({ $color }) => $color};
    font-weight: 300;
    
    pointer-events: ${({ $disabled }) => $disabled ? "none" : "auto"};
    
    &:hover {
        background-color: ${({ $background, $depth, $disabled }) => !$disabled && $depth === 2 ? "rgba(25, 25, 28, 0.1)" : $background};
    }
    
    & > svg.expand-icon {
        width: 14px;
        height: 14px;
        margin-left: -20px;
        margin-right: 8px;
        transform: rotateZ(90deg);
    }
    
    & > svg.expand-icon.opacity-0 {
        opacity: 0;
    }
`

export const Padding = styled.div`
    min-height: 128px;
`

export const InlineCode = styled.code`
    padding: 2px 6px;
    background-color: #19191C0D;
    border-radius: 3px;
    font-size: 15px;
`

export const BlockQuote: React.FC<PropsWithChildren> = props =>
    <BlockQuoteTag>
        <BlockquoteIcon/>
        {props.children}
    </BlockQuoteTag>

const BlockQuoteTag = styled.blockquote`
    display: flex;
    flex-direction: row;
    margin: 32px 0 0 0;
    padding: 16px;
    background-color: rgba(77, 187, 95, 0.2);
    color: rgba(25, 25, 28, 0.7);
    border-radius: 6px;

    & > svg {
        flex-shrink: 0;
        margin-right: 16px;
        width: 24px;
        height: 24px;
        color: #4dbb5f;
        fill: currentColor;
    }

    & p {
        margin-top: 0 !important;
    }

    .quote-author + & {
        background-color: rgba(77, 154, 187, 0.2);
    }
    
    .quote-author + & > svg {
        color: #4D9ABB;
    }
`
