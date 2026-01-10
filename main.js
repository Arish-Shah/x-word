import "./lib/x-word.js";

const defaultIpuzSrc = "puzzles/27112025-nyt-mini.ipuz";

const params = new URLSearchParams(location.search);
let ipuzSrc = params.get("ipuz");

if (!ipuzSrc) {
  ipuzSrc = defaultIpuzSrc;
  history.replaceState(null, null, `?ipuz=${defaultIpuzSrc}`);
}

const xWord = document.createElement("x-word");
xWord.src = ipuzSrc;

document.body.appendChild(xWord);

const button = document.createElement("button");
button.textContent = "change";
button.addEventListener("click", () => {
  xWord.src = "./puzzles/guardian-mini-24.ipuz";
});

document.body.appendChild(button);
