import fs from "fs"

import React from "react"
import {notFound} from "next/navigation";
import {Padding, TopicDocumentRoot, TopicNavigationItem, TopicsNavigation} from "@/app/docs/[topic]/_styled";
import {BaseProcessor, GlobalMarkdownComponents, GlobalRehypeReactOptions} from "@/utils/MarkdownProcessor";
import rehypeReact from "rehype-react";
import {Breadcrumb, DocumentContentWithAside} from "@/components/DocumentContentWithAside";


export default async function TopicDocument(props: { params: { topic: string } }) {
    const {params: {topic}} = props

    if (!topic.endsWith(".md") || !fs.existsSync(`./docs/${topic}`))
        notFound()

    let markdown: string = fs.readFileSync(`./docs/${topic}`, {encoding: "utf8"})

    const footnoteRefs = Array.from(markdown.matchAll(/\{\^\[(?<number>[0-9]+)]}/gi))
    const footnoteContents = Array.from(markdown.matchAll(/\{&\[(?<number>[0-9]+)]}/gi))

    const survey = markdown.match(/\{&\?(?<doc_url>.+?)}/)

    markdown = replaceFootnotes(markdown, footnoteRefs, {topic, type: "ref"}, buildFootnoteRefDOM)
    markdown = replaceFootnotes(markdown, footnoteContents, {topic, type: "content"}, buildFootnoteContentDOM)

    markdown = replaceSurvey(markdown, survey)

    markdown = replaceAuthorQuote(markdown)

    const html = await BaseProcessor()
        .process(markdown)

    const content = await BaseProcessor()
        .use(rehypeReact, {...GlobalRehypeReactOptions, components: {...GlobalMarkdownComponents}})
        .process(markdown)
        .then(it => it.result)

    const summary = Array.from(html.value.toString().matchAll(/<(?<opening>h1|h2|h3|h4|h5|h6)>(?<text>.+?)<\/(?<closing>h1|h2|h3|h4|h5|h6)>/gi))
        .map(it => ({type: it.groups?.["opening"] ?? "h6", text: replaceTag(it.groups?.["text"] ?? "")}))

    return (
        <TopicDocumentRoot>
            <TopicsNavigation>
                {TopicNavigationItems.map((it, index) => {
                    const selected = topic === it.href?.split("/")[2]
                    return (
                        <TopicNavigationItem
                            key={index}
                            $background={selected ? "#7f52ff" : it.depth === 0 ? "#F9F9F9" : "#F4F4F4"}
                            $color={selected ? "white" : "inherit"}
                            $depth={it.depth}
                            $disabled={selected}
                            href={it.href ?? "#"}
                        >
                            <ExpandArrow hidden={it.depth === 2}/>
                            {it.title}
                        </TopicNavigationItem>
                    )
                })}
            </TopicsNavigation>
            <DocumentContentWithAside summary={summary}>
                <Breadcrumb>
                    <li>공식 라이브러리</li>
                    <li>코루틴 (kotlinx.coroutines)</li>
                    <li>{TopicNavigationItems.find(it => it.href === `/docs/${topic}`)?.title}</li>
                </Breadcrumb>
                {content}
                <Padding>&nbsp;</Padding>
            </DocumentContentWithAside>
        </TopicDocumentRoot>
    )
}

const ExpandArrow: React.FC<{ hidden: boolean }> = props =>
    <svg
        viewBox="-5 -3 24 24"
        data-test="toc-expander"
        className={`expand-icon ${props.hidden ? "opacity-0" : ""}`}
    >
        <path d="M11 9l-6 5.25V3.75z"></path>
    </svg>

const TopicNavigationItems = [
    {title: "공식 라이브러리", depth: 0},
    {title: "코루틴 (kotlinx.coroutines)", depth: 1},
    {title: "코루틴 사용 설명서", depth: 2, href: "/docs/coroutines-guide.md"},
    {title: "코루틴의 기초", depth: 2, href: "/docs/coroutines-basics.md"},
    {title: "취소와 타임아웃", depth: 2, href: "/docs/cancellation-and-timeouts.md"},
    {title: "정지 함수의 구성", depth: 2, href: "/docs/composing-suspending-functions.md"},
    {title: "코루틴의 컨텍스트와 디스패쳐", depth: 2, href: "/docs/coroutine-context-and-dispatchers.md"},
    {title: "비동기 Flow", depth: 2, href: "/docs/flow.md"},
    {title: "채널", depth: 2, href: "/docs/channels.md"},
    {title: "코루틴의 예외 핸들링", depth: 2, href: "/docs/exception-handling.md"},
    {title: "변경 가능한 공유 자원과 동시성", depth: 2, href: "/docs/shared-mutable-state-and-concurrency.md"}
]

const replaceTag = (input: string): string => input
    .replaceAll(/<([0-z]+)>/g, "")
    .replaceAll(/<\/([0-z]+)>/g, "")

const buildSurveyDOM = (url: string): string =>
    `<p class="survey">이 페이지가 도움이 되셨다면, <a href="${url}">원문 페이지</a>에 방문해 엄지척을 해주세요!</p>`

const buildFootnoteRefDOM = (heading: string, number: string): string =>
    `<sup id="${heading}-ref-${number}" class="footnote-ref">${number}</sup>`

const buildFootnoteContentDOM = (heading: string, number: string) =>
    `<span id="${heading}-content-${number}" class="footnote-content">[${number}]&nbsp;</span>`

const replaceSurvey = (markdown: string, survey: RegExpMatchArray | null) => {
    if (!survey) return markdown

    const replaceTarget = survey[0]
    const url = survey.groups?.["doc_url"]
    if (replaceTarget && url)
        return markdown.replace(replaceTarget, buildSurveyDOM(url))

    return markdown
}

const replaceAuthorQuote = (markdown: string) =>
    markdown.replaceAll("{>author}", `<div class="quote-author"></div>\n`)

const findNearestHeading = (content: string, position: number) =>
    content
        .slice(0, position)
        .split("\n")
        .findLast(it => it.startsWith("# ") || it.startsWith("## "))
        ?.slice(2)
        ?.trim()

const replaceFootnotes = (
    markdown: string,
    items: RegExpExecArray[],
    debugging: { topic: string, type: "ref" | "content" },
    transform: (normalizedHeading: string, number: string) => string
) => {
    const {topic, type} = debugging

    let content = markdown
    let indexShifted = 0
    items.forEach(it => {
        const number = it.groups?.["number"]
        if (!number)
            throw Error(`Assertion Failure: Cannot parse number for ${topic}'s footnote ${type} with position ${it.index}`)

        const heading = findNearestHeading(content, it.index + indexShifted)
        if (!heading)
            throw Error(`Assertion Failure: Cannot find nearest heading for ${topic}'s footnote ${type} with position ${it.index}`)

        const replaceWith = transform(heading.replaceAll(" ", "-"), number)
        content = content.replace(it[0], replaceWith)
        indexShifted += (replaceWith.length - it.length)
    })

    return content
}
