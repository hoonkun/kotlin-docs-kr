import {CSSProperties} from "react"

const reset: Record<string, CSSProperties> = {
    "code[class*=\"language-\"]": {
        "color": "#27282c",
        "fontFamily": "JetBrains Mono, monospace",
        "direction": "ltr",
        "textAlign": "left",
        "whiteSpace": "pre",
        "wordSpacing": "normal",
        "wordBreak": "normal",
        "lineHeight": "24px",
        "MozTabSize": "4",
        "OTabSize": "4",
        "tabSize": "4",
        "WebkitHyphens": "none",
        "MozHyphens": "none",
        "msHyphens": "none",
        "hyphens": "none",
        "display": "block"
    },
    "pre[class*=\"language-\"]": {
        "color": "#27282c",
        "fontFamily": "JetBrains Mono, monospace",
        "direction": "ltr",
        "textAlign": "left",
        "whiteSpace": "pre",
        "wordSpacing": "normal",
        "wordBreak": "normal",
        "lineHeight": "24px",
        "MozTabSize": "4",
        "OTabSize": "4",
        "tabSize": "4",
        "WebkitHyphens": "none",
        "MozHyphens": "none",
        "msHyphens": "none",
        "hyphens": "none",
        "margin": ".5em 0",
        "overflow": "auto",
        "background": "rgba(25, 25, 28, 0.05)",
        "padding": "16px 32px",
        "borderRadius": "8px"
    },
    "pre[class*=\"language-\"]::-moz-selection": {
        "color": "inherit",
        "background": "rgba(33, 66, 131, .85)"
    },
    "pre[class*=\"language-\"] ::-moz-selection": {
        "color": "inherit",
        "background": "rgba(33, 66, 131, .85)"
    },
    "code[class*=\"language-\"]::-moz-selection": {
        "color": "inherit",
        "background": "rgba(33, 66, 131, .85)"
    },
    "code[class*=\"language-\"] ::-moz-selection": {
        "color": "inherit",
        "background": "rgba(33, 66, 131, .85)"
    },
    "pre[class*=\"language-\"]::selection": {
        "color": "inherit",
        "background": "rgba(33, 66, 131, .85)"
    },
    "pre[class*=\"language-\"] ::selection": {
        "color": "inherit",
        "background": "rgba(33, 66, 131, .85)"
    },
    "code[class*=\"language-\"]::selection": {
        "color": "inherit",
        "background": "rgba(33, 66, 131, .85)"
    },
    "code[class*=\"language-\"] ::selection": {
        "color": "inherit",
        "background": "rgba(33, 66, 131, .85)"
    },
    ":not(pre) > code[class*=\"language-\"]": {
        "background": "rgb(30, 31, 34)",
        "padding": ".1em",
        "borderRadius": ".3em"
    }
};

export default reset
