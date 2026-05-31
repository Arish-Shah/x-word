const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  @layer {
    :root {
      --x-word-bg: #000000;
      --x-word-fg: #ffffff;
      --x-word-select: #ffda00;
      --x-word-highlight: #a7d8ff;
      --x-word-font: georgia;
    }

    x-word {
      font-family: var(--x-word-font);
    }
  }
`);

if (!document.adoptedStyleSheets.includes(sheet)) {
  document.adoptedStyleSheets.push(sheet);
}
