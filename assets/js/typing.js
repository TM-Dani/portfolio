const typingTarget = document.querySelector("[data-typing]");
const typingWords = [
  "Software Developer",
  "Application Developer EFZ",
  "Homelab Builder",
  "DevOps Enthusiast"
];

let wordIndex = 0;
let characterIndex = 0;
let isDeleting = false;

function typeNextFrame() {
  if (!typingTarget) {
    return;
  }

  const currentWord = typingWords[wordIndex];
  const visibleText = currentWord.slice(0, characterIndex);
  typingTarget.textContent = visibleText;

  if (!isDeleting && characterIndex < currentWord.length) {
    characterIndex += 1;
    window.setTimeout(typeNextFrame, 72);
    return;
  }

  if (!isDeleting && characterIndex === currentWord.length) {
    isDeleting = true;
    window.setTimeout(typeNextFrame, 1200);
    return;
  }

  if (isDeleting && characterIndex > 0) {
    characterIndex -= 1;
    window.setTimeout(typeNextFrame, 38);
    return;
  }

  isDeleting = false;
  wordIndex = (wordIndex + 1) % typingWords.length;
  window.setTimeout(typeNextFrame, 260);
}

typeNextFrame();
