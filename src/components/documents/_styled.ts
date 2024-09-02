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
    
    --home-dark-content-max-width: 1166px;
    --home-dark-aroundings: calc((100vw - var(--navigator-width) - min(100vw - var(--navigator-width), var(--home-dark-content-max-width))) / 2 + var(--arranger-left-padding));
    
    --home-dark-width: calc(100vw - var(--navigator-width));
    --home-dark-margin: 48px calc(var(--home-dark-aroundings) * -1) 0 calc(var(--home-dark-aroundings) * -1);
    --home-dark-padding: 0 var(--home-dark-aroundings) 48px var(--home-dark-aroundings);

    ${LessThen(1540)} {
      --navigator-width: 301px;
    }

    ${LessThen(1276)} {
      --navigator-width: 273px;
    }
    
    ${LessThen(1000)} {
      --arranger-left-padding: 22px;
      --arranger-right-padding: 22px;
      
      --article-base-width: calc(100vw - var(--article-padding));
      
      --navigator-width: 100vw;

      --home-dark-width: 100vw;
      --home-dark-margin: 48px calc(var(--arranger-left-padding) * -1) 0 calc(var(--arranger-left-padding) * -1);
      --home-dark-padding: 0 var(--arranger-left-padding) 48px var(--arranger-left-padding);
    }
    
    ${LessThen(640)} {
      --arranger-left-padding: 16px;
      --arranger-right-padding: 16px;
    }
  }
`
