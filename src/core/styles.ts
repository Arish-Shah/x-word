const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  @layer {
    :root {
      --x-word-bg: #ffffff;
      --x-word-fg: #000000;
      --x-word-selected: #ffda00;
      --x-word-highlight: #a7d8ff;
      --x-word-font: georgia;
      --x-word-button: #bb3b80;
    }

    x-word {
      font-family: var(--x-word-font);
      -webkit-tap-highlight-color: transparent;
    }
  }
`);

if (!document.adoptedStyleSheets.includes(sheet)) {
  document.adoptedStyleSheets.push(sheet);
}
