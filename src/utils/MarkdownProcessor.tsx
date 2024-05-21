import { Processor, unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import Link from "next/link"
import { CodeBlock, InlineCode, PreTag, PreTagSpacer } from "@/components/markdown/CodeBlock"
import { BlockQuote } from "@/components/markdown/BlockQuote"

import * as ProductionReact from "react/jsx-runtime"
import { HeadingAnchor } from "@/components/markdown/HeadingAnchor"

const { jsx, jsxs, Fragment } = ProductionReact

export const BaseProcessor: () => Processor<any, any, any, any, string> = () => unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)

const retrieveNodeText = (node: any): string => {
  if (['string', 'number'].includes(typeof node)) return node
  if (node instanceof Array) return node.map(retrieveNodeText).join('')
  if (typeof node === 'object' && node) return retrieveNodeText(node.props.children)

  return ""
}

const replaceSpaces = (input: string): string => input.replaceAll(" ", "-")

export const GlobalMarkdownComponents = {
  pre: (props: any) => <PreTag {...props}>{props.children}<PreTagSpacer/></PreTag>,
  code: (props: any) => props.className ?
    <CodeBlock className={props.className}>{props.children}</CodeBlock> :
    <InlineCode {...props}/>,
  a: (props: any) => props.href.startsWith("/") || props.href.startsWith("#") ?
    <Link href={props.href} className={`local-link ${props.className ?? ""}`}>{props.children}</Link> :
    <a {...props}
       className={props.href?.startsWith("https://kotlinlang.org/") ? "api-doc" : "external-link"}>{props.children}</a>,
  blockquote: (props: any) => <BlockQuote {...props}/>,
  h1: (props: any) => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h1>{props.children}</h1></HeadingAnchor>,
  h2: (props: any) => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h2>{props.children}</h2></HeadingAnchor>,
  h3: (props: any) => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h3>{props.children}</h3></HeadingAnchor>,
  h4: (props: any) => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h4>{props.children}</h4></HeadingAnchor>,
  h5: (props: any) => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h5>{props.children}</h5></HeadingAnchor>,
  h6: (props: any) => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h6>{props.children}</h6></HeadingAnchor>
}

export const GlobalRehypeReactOptions: any = { jsx, jsxs, Fragment }

