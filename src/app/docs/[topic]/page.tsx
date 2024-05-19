import fs from "fs"

import React from "react"
import {NotYetTranslated, Padding, TopicDocumentRoot} from "@/app/docs/[topic]/_styled";
import {BaseProcessor, GlobalMarkdownComponents, GlobalRehypeReactOptions} from "@/utils/MarkdownProcessor";
import rehypeReact from "rehype-react";
import {DocumentContentWithAside} from "@/components/DocumentContentWithAside";
import {TopicsBreadcrumb, TopicsNavigation, TopicTitle} from "@/components/TopicsNavigation";
import NavigationItems from "@/../docs/registry.json"


export default async function TopicDocument(props: { params: { topic: string } }) {
    const {params: {topic}} = props

    const navigations = (NavigationItems as RawNavigationItemData[]).map(navigationItemMapper)

    if (!topic.endsWith(".md") || !fs.existsSync(`./docs/${topic}`))
        return (
            <TopicDocumentRoot>
                <TopicsNavigation items={navigations} topic={topic}/>
                <DocumentContentWithAside items={navigations} topic={topic}>
                    <TopicsBreadcrumb items={navigations} topic={topic}/>
                    <TopicTitle items={navigations} topic={topic}/>
                    <NotYetTranslated>
                        아직 번역되지 않았어요...
                        <span>GitHub 에 방문하여 번역에 기여해보세요!</span>
                    </NotYetTranslated>
                </DocumentContentWithAside>
            </TopicDocumentRoot>
        )

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
            <TopicsNavigation items={navigations} topic={topic}/>
            <DocumentContentWithAside summary={summary} items={navigations} topic={topic}>
                <TopicsBreadcrumb items={navigations} topic={topic}/>
                <TopicTitle items={navigations} topic={topic}/>
                {content}
                <Padding>&nbsp;</Padding>
            </DocumentContentWithAside>
        </TopicDocumentRoot>
    )
}

type RawNavigationItemData = { title: string, href?: string, children?: RawNavigationItemData[] }
export type NavigationItemData = Omit<RawNavigationItemData, "children"> & { enabled: boolean, children?: NavigationItemData[] }
const navigationItemMapper: (it: RawNavigationItemData) => NavigationItemData = it => it.children ?
    { ...it, enabled: true, children: it.children.map(navigationItemMapper) } :
    { ...it, enabled: fs.existsSync(`./docs/${it.href}`), children: undefined }

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

        const heading = findNearestHeading(content, it.index + indexShifted) ?? "root"

        const replaceWith = transform(heading.replaceAll(" ", "-"), number)
        content = content.replace(it[0], replaceWith)
        indexShifted += (replaceWith.length - it.length)
    })

    return content
}
