import fs from "fs"

import React from "react"
import {DocumentEndPadding, DocumentPageRoot, NotYetTranslated} from "@/app/docs/[document_key]/_styled";
import {BaseProcessor, GlobalMarkdownComponents, GlobalRehypeReactOptions} from "@/utils/MarkdownProcessor";
import rehypeReact from "rehype-react";
import {DocumentMain} from "@/components/DocumentMain";
import {DocumentBreadcrumb, DocumentNavigator, DocumentTitle} from "@/components/DocumentNavigator";
import {notFound} from "next/navigation";
import {findDocumentation} from "@/utils/DocumentationFinder";

import Documents from "@/../docs/registry.json"

export default async function DocumentPage(props: { params: { document_key: string } }) {
    const { params: { document_key: key } } = props

    if (!key.endsWith(".md"))
        notFound()

    const navigations = (Documents as RawDocumentData[]).map(documentItemMapper)

    if (!fs.existsSync(`./docs/${key}`))
        return (
            <DocumentPageRoot>
                <DocumentNavigator items={navigations} documentKey={key}/>
                <DocumentMain items={navigations} documentKey={key}>
                    <DocumentBreadcrumb items={navigations} documentKey={key}/>
                    <DocumentTitle items={navigations} documentKey={key}/>
                    <NotYetTranslated>
                        아직 번역되지 않았어요...
                        <span>GitHub 에 방문하여 번역에 기여해보세요!</span>
                    </NotYetTranslated>
                </DocumentMain>
            </DocumentPageRoot>
        )

    let markdown: string = fs.readFileSync(`./docs/${key}`, {encoding: "utf8"})

    const footnoteRefs = Array.from(markdown.matchAll(/\{\^\[(?<number>[0-9]+)]}/gi))
    const footnoteContents = Array.from(markdown.matchAll(/\{&\[(?<number>[0-9]+)]}/gi))

    const survey = markdown.match(/\{&\?(?<doc_url>.+?)}/)

    markdown = replaceFootnotes(markdown, footnoteRefs, {documentKey: key, type: "ref"}, buildFootnoteRefDOM)
    markdown = replaceFootnotes(markdown, footnoteContents, {documentKey: key, type: "content"}, buildFootnoteContentDOM)

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
        <DocumentPageRoot>
            <DocumentNavigator items={navigations} documentKey={key}/>
            <DocumentMain summary={summary} items={navigations} documentKey={key}>
                <DocumentBreadcrumb items={navigations} documentKey={key}/>
                <DocumentTitle items={navigations} documentKey={key} withGithub/>
                {content}
                <DocumentEndPadding>&nbsp;</DocumentEndPadding>
            </DocumentMain>
        </DocumentPageRoot>
    )
}

export async function generateMetadata({ params }: { params: { document_key: string } }) {
    const { document_key: key } = params

    if (!key.endsWith(".md"))
        return { title: "404 | Kotlin 문서" }

    const documents = (Documents as RawDocumentData[]).map(documentItemMapper)
    const document = findDocumentation({ title: "_", children: documents, enabled: true }, key)

    if (!document)
        return { title: "404 | Kotlin 문서" }

    return {
        title: `${document[0].title} | Kotlin 문서`,
        icons: {
            icon: { url: "/favicon.svg", type: "image/svg+xml" }
        },
        openGraph: {
            title: `${document[0].title} | Kotlin 문서`,
            description: "",
            images: {
                url: "https://kotlinlang.org/assets/images/open-graph/docs.png"
            },
            siteName: "Kotlin Help",
            locale: "ko_KR",
            type: "website"
        },
        twitter: {
            title: `${document[0].title} | Kotlin 문서`,
            description: "",
            card: "summary_large_image",
            site: "@kotlin",
            creator: "@kotlin",
            images: ["https://kotlinlang.org/assets/images/open-graph/docs.png"]
        }
    }
}

type RawDocumentData = { title: string, href?: string, children?: RawDocumentData[] }
export type DocumentData = Omit<RawDocumentData, "children"> & { enabled: boolean, children?: DocumentData[] }
const documentItemMapper: (it: RawDocumentData) => DocumentData = it => it.children ?
    { ...it, enabled: true, children: it.children.map(documentItemMapper) } :
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
    debugging: { documentKey: string, type: "ref" | "content" },
    transform: (normalizedHeading: string, number: string) => string
) => {
    const {documentKey, type} = debugging

    let content = markdown
    let indexShifted = 0
    items.forEach(it => {
        const number = it.groups?.["number"]
        if (!number)
            throw Error(`Assertion Failure: Cannot parse number for ${documentKey}'s footnote ${type} with position ${it.index}`)

        const heading = findNearestHeading(content, it.index + indexShifted) ?? "root"

        const replaceWith = transform(heading.replaceAll(" ", "-"), number)
        content = content.replace(it[0], replaceWith)
        indexShifted += (replaceWith.length - it.length)
    })

    return content
}
