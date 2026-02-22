import "./src/x-word.js";

const params = new URLSearchParams(location.search);
let ipuzSrc = params.get("ipuz");

if (!ipuzSrc) {
  ipuzSrc = "./puzzles/guardian-mini-24.ipuz";
  history.replaceState(null, null, "?ipuz=" + ipuzSrc);
}

const xWord = document.createElement("x-word");
xWord.src = ipuzSrc;
document.body.appendChild(xWord);
