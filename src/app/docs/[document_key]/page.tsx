import fs from "fs"

import React from "react"
import { BaseProcessor, GlobalMarkdownComponents, GlobalRehypeReactOptions } from "@/utils/MarkdownProcessor"
import rehypeReact from "rehype-react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { findDocumentation, flatDocumentation, titleOf } from "@/utils/Documentation"
import {
  DocumentPageTemplate,
  DocumentPageTemplateProps,
  NotYetTranslated
} from "@/components/documents/DocumentPageTemplate"

import Documents from "@/../docs/registry.json"
import { DocumentHome } from "@/components/documents/DocumentHome"
import { TabHost, TabItem } from "@/components/markdown/Tab"

export default async function DocumentPage(props: { params: { document_key: string } }) {
  const { params: { document_key: key } } = props

  if (key !== "home" && !key.endsWith(".md"))
    notFound()

  const documents = (Documents as RawDocumentData[]).map(documentItemMapper)
  const flattenDocuments = flatDocumentation(documents)
  const foundDocumentation = findDocumentation(documents, key)
  if (!foundDocumentation)
    notFound()

  const [document, breadcrumbs] = foundDocumentation
  const sections: DocumentSection[] = [{ type: "h1", text: titleOf(document) }]

  const DocumentPageTemplateProps: Omit<DocumentPageTemplateProps, "hasContent"> = {
    document, documents, documentKey: key, sections, breadcrumbs
  }

  if (key === "home") {
    return <DocumentPageTemplate {...DocumentPageTemplateProps} withoutAdditionalUi disableWidthLimiting><DocumentHome/></DocumentPageTemplate>
  }

  if (!fs.existsSync(`./docs/${key}`)) {
    return <DocumentPageTemplate {...DocumentPageTemplateProps}><NotYetTranslated documentKey={key}/></DocumentPageTemplate>
  }

  let markdown: string = fs.readFileSync(`./docs/${key}`, { encoding: "utf8" })

  const footnoteRefs = Array.from(markdown.matchAll(/\{\^\[(?<number>[0-9]+)]}/gi))
  const footnoteContents = Array.from(markdown.matchAll(/\{&\[(?<number>[0-9]+)]}/gi))

  markdown = replaceFootnotes(markdown, footnoteRefs, { documentKey: key, type: "ref" }, buildFootnoteRefDOM)
  markdown = replaceFootnotes(markdown, footnoteContents, { documentKey: key, type: "content" }, buildFootnoteContentDOM)

  markdown = replaceTabHosts(markdown)
  markdown = replaceTabs(markdown)

  markdown = replaceNonExistingReferenceToOriginal(markdown, flattenDocuments)

  markdown = replaceSurvey(markdown)

  markdown = replaceQuoteTypes(markdown)

  markdown = replaceLargeSpacingLists(markdown)

  markdown = replaceDocumentPager(markdown, flattenDocuments)

  const html = await BaseProcessor()
    .process(markdown)

  const content = await BaseProcessor()
    .use(
      rehypeReact,
      {
        ...GlobalRehypeReactOptions,
        components: {
          ...GlobalMarkdownComponents,
          img: props => <ContentImage {...props} documentKey={key}/>,
          tabs: (props: any) => <TabHost {...props}>{props.children}</TabHost>,
          tab: (props: any) => <TabItem {...props}/>
        }
      }
    )
    .process(markdown)
    .then(it => it.result)

  sections.push(
    ...Array.from(html.value.toString().matchAll(/<(?<opening>h1|h2|h3|h4|h5|h6)>(?<text>.+?)<\/(?<closing>h1|h2|h3|h4|h5|h6)>/gi))
      .map(it => ({ type: it.groups?.["opening"] ?? "h6", text: removeTags(it.groups?.["text"] ?? "") }))
  )

  return <DocumentPageTemplate {...DocumentPageTemplateProps} hasContent>{content}</DocumentPageTemplate>
}

export async function generateStaticParams() {
  return flatDocumentation((Documents as RawDocumentData[]).map(documentItemMapper))
    .map(it => ({ document_key: it.href }))
}

export async function generateMetadata({ params }: { params: { document_key: string } }) {
  const { document_key: key } = params

  if (key !== "home" && !key.endsWith(".md"))
    return { title: "404 | Kotlin 문서" }

  const documents = (Documents as RawDocumentData[]).map(documentItemMapper)
  const document = findDocumentation(documents, key)

  if (!document)
    return { title: "404 | Kotlin 문서" }

  const title = key === "home" ? "Kotlin 문서" : `${titleOf(document[0])} | Kotlin 문서`

  return {
    title,
    icons: {
      icon: { url: "/favicon.svg", type: "image/svg+xml" }
    },
    openGraph: {
      title,
      description: "",
      images: {
        url: "https://kotlinlang.org/assets/images/open-graph/docs.png"
      },
      siteName: "Kotlin Help",
      locale: "ko_KR",
      type: "website"
    },
    twitter: {
      title,
      description: "",
      card: "summary_large_image",
      site: "@kotlin",
      creator: "@kotlin",
      images: ["https://kotlinlang.org/assets/images/open-graph/docs.png"]
    }
  }
}

const ContentImage: React.FC<{ alt?: string, documentKey: string, src?: string }> = async (props) => {
  if (!props.src) return <></>

  const Source = await import(`$/docs/images/${props.documentKey}${props.src}`)
  if (typeof Source.default === "function") return <Source.default/>

  return <Image src={Source.default} alt={props.alt ?? ""} style={{ width: "100%", height: "auto", marginTop: 15 }} />
}

export const viewport = {
  themeColor: "#19191C"
}

type RawDocumentData = { title: string, page_title?: string, href?: string, children?: RawDocumentData[] }
export type DocumentData = Omit<RawDocumentData, "children"> & { enabled: boolean, children?: DocumentData[] }
export type DocumentSection = { type: string, text: string }

const documentItemMapper: (it: RawDocumentData) => DocumentData = it => it.children ?
  { ...it, enabled: true, children: it.children.map(documentItemMapper) } :
  { ...it, enabled: it.href === "home" || fs.existsSync(`./docs/${it.href}`), children: undefined }

const buildSurveyDOM = (url: string): string =>
  `<p class="survey">이 페이지가 도움이 되셨다면, <a href="${url}">원문 페이지</a>에 방문해 엄지척을 해주세요!</p>`

const buildFootnoteRefDOM = (heading: string, number: string): string =>
  `<sup id="${heading}-ref-${number}" class="footnote-ref">${number}</sup>`

const buildFootnoteContentDOM = (heading: string, number: string) =>
  `<span id="${heading}-content-${number}" class="footnote-content">[${number}]&nbsp;</span>`

const replaceSurvey = (markdown: string) => {
  const survey = markdown.match(/\{&\?(?<doc_url>.+?)}/)
  if (!survey) return markdown

  const replaceTarget = survey[0]
  const url = survey.groups?.["doc_url"]
  if (replaceTarget && url)
    return markdown.replace(replaceTarget, buildSurveyDOM(url))

  return markdown
}

const removeTags = (input: string): string => input
  .replaceAll(/<([0-z]+)>/g, "")
  .replaceAll(/<\/([0-z]+)>/g, "")

const replaceNonExistingReferenceToOriginal = (markdown: string, flattenDocuments: DocumentData[]) => {
  const links = Array.from(markdown.matchAll(/\[(?<text>.+?)]\((?<href>.+?)\)/g))

  for (const link of links) {
    const reference = link.groups!.href
    if (!reference.startsWith("/docs/")) continue
    if (fs.existsSync(`.${reference}`)) continue

    markdown = markdown.replace(reference, `https://kotlinlang.org${reference.replace(".md", "")}.html`)
  }

  return markdown
}

const replaceDocumentPager = (markdown: string, flattenDocuments: DocumentData[]) => {
  markdown = markdown.replaceAll("{~}", `<div class="document-pager">`)
  markdown = markdown.replaceAll("{/~}", `</div>`)
  const previous = markdown.match(/\{<~(?<href>.+?)}/)
  if (previous) {
    const key = previous.groups!.href
    const title = titleOf(flattenDocuments.find(it => it.href === key)!)
    markdown = markdown.replaceAll(previous[0], `<a class="previous" href="/docs/${key}">${title}</a>`)
  }
  const next = markdown.match(/\{~>(?<href>.+?)}/)
  if (next) {
    const key = next.groups!.href
    const title = titleOf(flattenDocuments.find(it => it.href === key)!)
    markdown = markdown.replaceAll(next[0], `<a class="next" href="/docs/${key}">${title}</a>`)
  }

  return  markdown
}

const replaceLargeSpacingLists = (markdown: string) =>
  markdown.replaceAll("{*large-spacing}", `<div class="large-spacing"></div>\n`)

const replaceQuoteTypes = (markdown: string) =>
  markdown
    .replaceAll("{>author}", `<div class="quote-author"></div>\n`)
    .replaceAll("{>tip}", `<div class="quote-tip"></div>\n`)

const findNearestHeading = (content: string, position: number) =>
  content
    .slice(0, position)
    .split("\n")
    .findLast(it => it.startsWith("# ") || it.startsWith("## "))
    ?.slice(2)
    ?.trim()

const replaceTabHosts = (markdown: string) => markdown
  .replaceAll("{-}", "<tabs>")
  .replaceAll("{/-}", "</tabs>")
const replaceTabs = (markdown: string) => markdown
  .replaceAll(/\{--(.+?)--(.+?)}/g, `<tab title="$1" identifier="$2">`)
  .replaceAll(/\{\/--(.*?)}/g, `</tab>`)

const replaceFootnotes = (
  markdown: string,
  items: RegExpExecArray[],
  debugging: { documentKey: string, type: "ref" | "content" },
  transform: (normalizedHeading: string, number: string) => string
) => {
  const { documentKey, type } = debugging

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
