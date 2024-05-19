import {Processor, unified} from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import {CodeHighlighter, PreTag, PreTagSpacer} from "@/components/CodeHighlighter"
import Link from "next/link"
import {BlockQuote, InlineCode} from "@/app/docs/[topic]/_styled";

import * as ProductionReact from "react/jsx-runtime"

const { jsx, jsxs, Fragment } = ProductionReact

export const BaseProcessor: () => Processor<any, any, any, any, string> = () => unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)

const NodeTextRetriever = (node: any): string => {
    if (['string', 'number'].includes(typeof node)) return node
    if (node instanceof Array) return node.map(NodeTextRetriever).join('')
    if (typeof node === 'object' && node) return NodeTextRetriever(node.props.children)

    return ""
}

const SpaceReplacer = (input: string): string => input.replaceAll(" ", "_")

export const GlobalMarkdownComponents = {
    pre: (props: any) => <PreTag {...props}>{props.children}<PreTagSpacer/></PreTag>,
    code: (props: any) => props.className ?
        <CodeHighlighter className={props.className}>{props.children}</CodeHighlighter> :
        <InlineCode {...props}/>,
    a: (props: any) => props.href.startsWith("/") ?
        <Link href={props.href} className={"local-link"}>{props.children}</Link> :
        <a {...props} className={props.href?.startsWith("https://kotlinlang.org/") ? "api-doc" : "external-link"}>{props.children}</a>,
    blockquote: (props: any) => <BlockQuote {...props}/>,
    h1: (props: any) => <h1 id={SpaceReplacer(NodeTextRetriever(props.children))}>{props.children}</h1>,
    h2: (props: any) => <h2 id={SpaceReplacer(NodeTextRetriever(props.children))}>{props.children}</h2>,
    h3: (props: any) => <h3 id={SpaceReplacer(NodeTextRetriever(props.children))}>{props.children}</h3>,
    h4: (props: any) => <h4 id={SpaceReplacer(NodeTextRetriever(props.children))}>{props.children}</h4>,
    h5: (props: any) => <h5 id={SpaceReplacer(NodeTextRetriever(props.children))}>{props.children}</h5>,
    h6: (props: any) => <h6 id={SpaceReplacer(NodeTextRetriever(props.children))}>{props.children}</h6>
}

export const GlobalRehypeReactOptions: any = { jsx, jsxs, Fragment }

