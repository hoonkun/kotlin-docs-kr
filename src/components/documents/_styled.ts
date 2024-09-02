import { createGlobalStyle } from "styled-components"
import { LessThen } from "@/utils/ReactiveStyles"

export const DocumentGlobalStyle = createGlobalStyle`
  :root {
    --arranger-max-width: 1166px;
    --arranger-left-padding: 32px;
    --arranger-right-padding: 22px;
    
    --article-max-width: 706px;
    --article-base-width: calc(100vw - var(--navigator-width) - var(--article-summary-width) - var(--article-padding));
    --article-width: min(var(--article-max-width), var(--article-base-width));
    --article-padding: calc(var(--arranger-left-padding) + var(--arranger-right-padding));

    --article-quote-padding: 16px;
    --article-quote-icon-size: 24px;
    --article-quote-icon-margin: 16px;
    
    --article-quote-code-block-max-width: 634px;
    --article-quote-code-block-width: min(var(--article-quote-code-block-max-width), var(--article-base-width) - var(--article-quote-icon-size) - var(--article-quote-icon-margin) - var(--article-quote-padding) * 2);
    
    --article-table-max-width: 100%;
    --article-table-width: min(var(--article-table-max-width), var(--article-base-width));
    
    --article-summary-width: 241px;
    
    --navigator-width: 311px;

    ${LessThen(1540)} {
      --navigator-width: 301px;
    }

    ${LessThen(1276)} {
      --navigator-width: 273px;
    }
    
    ${LessThen(1000)} {
      --navigator-width: 100vw;
      --article-base-width: calc(100vw - var(--article-padding));
      --arranger-left-padding: 22px;
      --arranger-right-padding: 22px;
    }
    
    ${LessThen(640)} {
      --arranger-left-padding: 16px;
      --arranger-right-padding: 16px;
    }
  }
`
