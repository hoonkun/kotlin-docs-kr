import React, { PropsWithChildren, ReactNode } from "react"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import rehypeReact, { Components as RehypeReactComponents, Options as RehypeReactOptions } from "rehype-react"
import Link from "next/link"
import Image from "next/image"
import { CodeBlock, InlineCode, PreTag, PreTagSpacer } from "@/components/markdown/CodeBlock"
import { BlockQuote } from "@/components/markdown/BlockQuote"
import * as ProductionReact from "react/jsx-runtime"
import { H1, H2, H3, H4, H5, H6, HeadingAnchor } from "@/components/markdown/HeadingAnchor"
import { TabHost, TabHostProps, TabItem, TabItemProps } from "@/components/markdown/Tab"
import { Component } from "@/libs/rehype/types"
import rehypeParse from "rehype-parse"

const { jsx, jsxs, Fragment } = ProductionReact

const MarkdownToHtmlProcessor = () => unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)

export const MarkdownToHtml = (markdown: string): Promise<string> => MarkdownToHtmlProcessor()
  .process(markdown)
  .then(it => it.value.toString())

export const MarkdownToReact = (markdown: string, documentKey?: string) => MarkdownToHtmlProcessor()
  .use(rehypeReact, GlobalRehypeReactOptions(documentKey))
  .process(markdown)
  .then(it => it.result)

export const HtmlToReact = (html: string, documentKey?: string): Promise<JSX.Element> => unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeReact, GlobalRehypeReactOptions(documentKey))
  .process(html)
  .then(it => it.result)

type KotlinDocsKrElements = { tabs: TabHostProps, tab: TabItemProps }
type KotlinDocsKrComponents = { [TagName in keyof KotlinDocsKrElements]: Component<KotlinDocsKrElements[TagName]> | keyof KotlinDocsKrElements }

export const GlobalRehypeReactOptions = (documentKey?: string): RehypeReactOptions => ({
  jsx: jsx as any,
  jsxs: jsxs as any,
  Fragment,
  development: false,
  components: GlobalMarkdownComponents(documentKey)
})

export const GlobalMarkdownComponents = (documentKey?: string): Partial<RehypeReactComponents & KotlinDocsKrComponents> => ({
  pre: props => <PreTag {...props}>{props.children}<PreTagSpacer/></PreTag>,

  code: props => props.className ?
    <CodeBlock className={props.className}>{props.children}</CodeBlock> :
    <InlineCode {...props}/>,

  a: props => props.href!.startsWith("/") || props.href!.startsWith("#") ?
    <Link {...props} href={props.href!} className={`local-link ${props.className ?? ""}`}/> :
    <a {...props} className={props.href?.startsWith("https://kotlinlang.org/") ? "api-doc" : "external-link"}/>,

  blockquote: props => <BlockQuote {...props}/>,

  table: props => <div className={"table-wrapper"}><table {...props}/></div>,

  h1: props => Heading(props.children, H1),
  h2: props => Heading(props.children, H2),
  h3: props => Heading(props.children, H3),
  h4: props => Heading(props.children, H4),
  h5: props => Heading(props.children, H5),
  h6: props => Heading(props.children, H6),

  // eslint-disable-next-line @next/next/no-img-element
  img: props => documentKey ? <ContentImage {...props} documentKey={documentKey}/> : <img alt={props.alt} src={props.src}/>,

  tabs: props => <TabHost {...props}>{props.children}</TabHost>,
  tab: props => <TabItem {...props}/>,
})

const ContentImage: React.FC<{ alt?: string, documentKey: string, src?: string }> = async (props) => {
  if (!props.src) return <></>

  const Source = await import(`$/docs/images/${props.documentKey}${props.src}`)
  if (typeof Source.default === "function") return <Source.default/>

  return <Image src={Source.default} alt={props.alt ?? ""} style={{ width: "100%", height: "auto", marginTop: 15 }} />
}

const Heading = (children: React.ReactNode, Head: React.FC<PropsWithChildren>) => {
  const korId = retrieveKorId(children)
  const engId = retrieveEngId(children)

  const sanitizedChildren = retrieveChildren(children)

  return <HeadingAnchor korId={korId} engId={engId}><Head>{sanitizedChildren}</Head></HeadingAnchor>
}

type ClientReactElement = Exclude<ReactNode, string | number | bigint | boolean | null | undefined | Iterable<ReactNode> | Promise<React.AwaitedReactNode>>

const retrieveKorId = (children: React.ReactNode) =>
  replaceSigns(removeOriginalAnchors(retrieveNodeText(children)))

const retrieveEngId = (children: React.ReactNode) =>
  retrieveOriginalAnchors(retrieveNodeText(children))

const retrieveChildren = (node: React.ReactNode): React.ReactNode => {
  if (typeof node === "string") return removeOriginalAnchors(node)
  return node
}

const retrieveNodeText = (node: React.ReactNode): string => {
  if (typeof node === "string") return node
  if (typeof node === "number") return `${node}`
  if (typeof node === "bigint") return ""
  if (typeof node === "boolean") return `${node}`

  if (!node) return ""

  if (typeof node !== "object") return ""

  if (node.hasOwnProperty(Symbol.iterator))
    return Array.from(node as Iterable<ReactNode>).map(retrieveNodeText).join('')

  return retrieveNodeText((node as ClientReactElement).props.children)
}

const removeOriginalAnchors = (textNode: string): string => textNode
  .replace(/ \{#(.+)}/, "")

const retrieveOriginalAnchors = (textNode: string): string | undefined => textNode
    .match(/ \{#(.+?)}/)?.[1]

const replaceSigns = (input: string): string => input
  .replaceAll(' ', "-")
  .replaceAll(/[()\[\]:{}]/gi, "")

