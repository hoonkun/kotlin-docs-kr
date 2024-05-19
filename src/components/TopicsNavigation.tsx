"use client"

import React, {useMemo, useState} from "react";
import styled from "styled-components";

import Link from "next/link";
import {Breadcrumb} from "@/components/DocumentContentWithAside";
import {NavigationItemData} from "@/app/docs/[topic]/page";
import GithubIcon from "@/resources/github-icon.svg"
import {findDocumentation} from "@/utils/DocumentationFinder";

type Props = {
    items: NavigationItemData[]
    topic: string
}

export const TopicsNavigation: React.FC<Props> = props => {
    const { items, topic } = props

    return (
        <Root>
            {items
                .map(it => ({ ...it, selected: topic === it.href }))
                .map((it, index) =>
                    <TopicNavigationItem key={`${it.title}_${it.href}`} item={it} depth={0} topic={topic}/>
                )}
        </Root>
    )
}

type TopicNavigationItemProps = {
    item: NavigationItemData & { selected: boolean }
    depth: number
    topic: string
}
const TopicNavigationItem: React.FC<TopicNavigationItemProps> = props => {
    const { item, depth, topic } = props

    const isRootNode = depth === 0
    const isLeafNode = useMemo(() => !!item.children?.every(it => !it.children), [item.children])

    const hasSelectedTopic = useMemo(() => !!findDocumentation(item, topic), [item, topic])
    const hasGrayBackground = useMemo(
        () => (isRootNode || isLeafNode) && hasSelectedTopic,
        [hasSelectedTopic, isRootNode, isLeafNode]
    )

    const [expanded, setExpanded] = useState(hasSelectedTopic)

    if (item.children) {
        return (
            <TopicNavigationChildrenContainer $hasGrayBackground={hasGrayBackground}>
                <TopicNavigationExpanderItem
                    $depth={depth}
                    $expanded={expanded}
                    onClick={() => setExpanded(prev => !prev)}
                >
                    <ExpandArrow hidden={!item.children}/>
                    {item.title}
                </TopicNavigationExpanderItem>
                {expanded && item.children
                    .map(it => ({ ...it, selected: it.href === topic }))
                    .map(it =>
                        <TopicNavigationItem key={`${it.title}_${it.href}`} item={it} depth={depth + 1} topic={topic}/>
                    )
                }
            </TopicNavigationChildrenContainer>
        )
    } else if (item.href) {
        return (
            <TopicNavigationLinkItem
                $depth={depth}
                $selected={item.selected}
                $disabled={!item.enabled}
                href={item.href}
            >
                {item.title}
            </TopicNavigationLinkItem>
        )
    }

    return <></>
}

export const TopicTitle: React.FC<{ items: NavigationItemData[], topic: string, withGithub?: boolean }> = props => {
    const { items, topic, withGithub } = props
    const title = useMemo(
        () => findDocumentation({ title: "_", children: items, enabled: true }, topic)![0].title,
        [items, topic]
    )
    return (
        <>
            <h1 id={title.replaceAll(" ", "_")}>{title}</h1>
            {withGithub &&
                <GithubEditRow>
                    <GithubIcon/>
                    <GithubEditPage href={"https://github.com/"}>편집하기</GithubEditPage>{/* TODO! */}
                </GithubEditRow>
            }
        </>
    )
}

const GithubEditRow = styled.div`
    display: flex;
    align-items: center;
    margin-top: 10px;
    margin-bottom: 32px;
    height: 26px;
    
    & > svg {
        width: 24px;
        height: 24px;
        margin-right: 2px;
    }
    
    & + p {
        margin-top: 0 !important;
    }
`

const GithubEditPage = styled.a`
    font-size: 13px;
    width: unset !important;
    line-height: 16px !important;
`

const TopicNavigationChildrenContainer = styled.div<{ $hasGrayBackground: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    
    background-color: ${({ $hasGrayBackground }) => $hasGrayBackground ? "rgba(25, 25, 28, 0.025)" : "transparent"};
`

const TopicNavigationExpanderItem = styled.button<{ $depth: number, $expanded: boolean }>`
    padding: 8px 0 8px ${({ $depth }) => `${22 + ($depth + 1) * 16}px`};
    
    text-align: left;
    background: none;
    border: none;
    font-family: inherit;
    
    & > svg.expand-icon {
        width: 14px;
        height: 14px;
        margin-left: -20px;
        margin-right: 8px;
        transform: rotateZ(${({ $expanded }) => $expanded ? "90deg" : "0"});
        transition: transform 0.1s linear;
    }
`

const TopicNavigationLinkItem = styled(Link)<{ $selected: boolean, $depth: number, $disabled: boolean }>`
    padding: 8px 0 8px ${({ $depth }) => `${22 + ($depth + 1) * 16}px`};
    
    background: ${({ $selected }) => $selected ? "#7f52ff !important" : "transparent"};
    color: ${({ $selected }) => $selected ? "white" : "#19191c"};
    
    opacity: ${({ $disabled }) => $disabled ? 0.4 : 1};
    cursor: ${({ $disabled }) => $disabled ? "auto" : "pointer"}
`

const ExpandArrow: React.FC<{ hidden: boolean }> = props =>
    <svg
        viewBox="-5 -3 24 24"
        data-test="toc-expander"
        className={`expand-icon ${props.hidden ? "opacity-0" : ""}`}
    >
        <path d="M11 9l-6 5.25V3.75z"></path>
    </svg>

export const TopicsBreadcrumb: React.FC<Props> = props => {
    const { items, topic } = props

    const parents = useMemo(
        () => findDocumentation({ title: "_", children: items, enabled: true }, topic)?.[1],
        [items, topic]
    )

    if (!parents)
        throw Error(`Assertion Error(from TopicsBreadcrumb): Cannot find parents from given topic: ${topic}`)

    return (
        <Breadcrumb>
            {parents.slice(1).map(it => <li key={`${it.title}_${it.href}`}>{it.title}</li>)}
        </Breadcrumb>
    )
}

export const Root = styled.nav`
    width: 311px;
    border-right: 1px solid #d1d1d2;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 8px 0;
    
    max-height: 100vw;
    overflow: auto;
    
    & a, button {
        font-size: 13px;
        line-height: 20px;
        font-weight: 300;
    }
    
    & a:hover, button:hover {
        background-color: rgba(25, 25, 28, 0.05);
    }
    
    @media only screen and (max-width: 1540px) {
        width: 301px;
    }
    
    @media only screen and (max-width: 1276px) {
        width: 273px;
    }
`

export const TopicNavigationItemRoot = styled(Link)<{ $background: string, $depth: number, $color: string, $disabled: boolean }>`
    background-color: ${({ $background }) => $background};
    padding: 8px 0 8px ${({ $depth }) => `${22 + ($depth + 1) * 16}px`};
    font-size: 13px;
    line-height: 20px;
    font-weight: 300;
    color: ${({ $color }) => $color};
    
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