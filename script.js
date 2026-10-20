const STORAGE_KEY = "webtech-assignment04-markdown";

const starterMarkdown = `# Welcome to Markdown Slides

## A simple presentation app

Create your slides in the editor on the left.

- Write headings and paragraphs
- Add lists and **bold text**
- Separate each slide with three dashes

---

# Second Slide

## How it works

Edit the Markdown and the preview updates automatically.

- Use the arrow buttons to move between slides
- Press the right or left arrow key
- Press Ctrl+S to save your work

---

# Thank You!

Questions?

This is the end of the sample presentation.
`;

const editorPage = document.getElementById("editorPage");
const presentationPage = document.getElementById("presentationPage");
const markdownInput = document.getElementById("markdownInput");
const previewSlide = document.getElementById("previewSlide");
const presentationSlide = document.getElementById("presentationSlide");
const statusMessage = document.getElementById("statusMessage");

let slides = [];
let currentSlide = 0;
let statusTimer;

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.add("show");
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => statusMessage.classList.remove("show"), 1800);
}

// Small Markdown renderer for common Markdown syntax used in slides.
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function inlineMarkdown(text) {
  let safe = escapeHTML(text);
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  return safe;
}

function markdownToHTML(markdown) {
  const lines = markdown.split("\n");
  const output = [];
  let inList = false;
  let inCode = false;
  let codeLines = [];

  function closeList() {
    if (inList) {
      output.push("</ul>");
      inList = false;
    }
  }

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      closeList();
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        output.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        output.push("<ul>");
        inList = true;
      }
      output.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      closeList();
      output.push(`<blockquote>${inlineMarkdown(trimmed.slice(2))}</blockquote>`);
      continue;
    }

    closeList();
    output.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeList();

  if (inCode) {
    output.push(`<pre><code>${escapeHTML(codeLines.join("\n"))}</code></pre>`);
  }

  return output.join("\n");
}

function getSlidesFromMarkdown(markdown) {
  const parts = markdown.split(/^\s*---\s*$/m);
  const cleaned = parts.map(part => part.trim()).filter(part => part.length > 0);
  return cleaned.length ? cleaned : ["# Empty Slide\n\nStart typing in the Markdown editor."];
}

function renderCurrentSlide() {
  slides = getSlidesFromMarkdown(markdownInput.value);

  if (currentSlide >= slides.length) {
    currentSlide = slides.length - 1;
  }
  if (currentSlide < 0) {
    currentSlide = 0;
  }

  const html = markdownToHTML(slides[currentSlide]);
  previewSlide.innerHTML = html;
  presentationSlide.innerHTML = html;

  const count = `${currentSlide + 1} / ${slides.length}`;
  document.getElementById("previewCounter").textContent = count;
  document.getElementById("previewCount").textContent = count;
  document.getElementById("presentationCount").textContent = count;

  const atFirst = currentSlide === 0;
  const atLast = currentSlide === slides.length - 1;

  document.getElementById("previewPrev").disabled = atFirst;
  document.getElementById("presentPrev").disabled = atFirst;
  document.getElementById("previewNext").disabled = atLast;
  document.getElementById("presentNext").disabled = atLast;
}

function goToSlide(index) {
  currentSlide = index;
  renderCurrentSlide();
}

function saveSlides(showMessage = true) {
  try {
    localStorage.setItem(STORAGE_KEY, markdownInput.value);
    if (showMessage) showStatus("Slides saved in this browser.");
  } catch (error) {
    showStatus("Could not save. Browser storage may be disabled.");
  }
}

function loadSlides() {
  try {
    const savedMarkdown = localStorage.getItem(STORAGE_KEY);
    markdownInput.value = savedMarkdown === null ? starterMarkdown : savedMarkdown;
  } catch (error) {
    markdownInput.value = starterMarkdown;
    showStatus("Browser storage is unavailable.");
  }
  renderCurrentSlide();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    const target = presentationPage.classList.contains("hidden")
      ? previewSlide
      : presentationPage;
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(() => showStatus("Full screen was not available."));
    }
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function updateFullscreenButtons() {
  const isFullscreen = Boolean(document.fullscreenElement);
  const label = isFullscreen ? "⛶ Exit Full Screen" : "⛶ Full Screen";
  document.getElementById("previewFullscreen").textContent = label;
  document.getElementById("presentationFullscreen").textContent = label;
}

function startPresentation() {
  editorPage.classList.add("hidden");
  presentationPage.classList.remove("hidden");
  renderCurrentSlide();
}

function exitPresentation() {
  presentationPage.classList.add("hidden");
  editorPage.classList.remove("hidden");
  renderCurrentSlide();
}

markdownInput.addEventListener("input", () => {
  renderCurrentSlide();
});

document.getElementById("saveBtn").addEventListener("click", () => saveSlides());
document.getElementById("presentBtn").addEventListener("click", startPresentation);
document.getElementById("exitPresent").addEventListener("click", exitPresentation);

document.getElementById("previewPrev").addEventListener("click", () => goToSlide(currentSlide - 1));
document.getElementById("presentPrev").addEventListener("click", () => goToSlide(currentSlide - 1));
document.getElementById("previewNext").addEventListener("click", () => goToSlide(currentSlide + 1));
document.getElementById("presentNext").addEventListener("click", () => goToSlide(currentSlide + 1));
document.getElementById("previewFullscreen").addEventListener("click", toggleFullscreen);
document.getElementById("presentationFullscreen").addEventListener("click", toggleFullscreen);

document.addEventListener("fullscreenchange", updateFullscreenButtons);

document.addEventListener("keydown", event => {
  const target = event.target;
  const typingInEditor = target === markdownInput;

  if (event.ctrlKey && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveSlides();
    return;
  }

  if (event.key === "F11") {
    event.preventDefault();
    toggleFullscreen();
    return;
  }

  // Let the arrow keys move the text cursor while the Markdown editor is focused.
  if (typingInEditor) {
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (currentSlide < slides.length - 1) goToSlide(currentSlide + 1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  } else if (event.key === "Escape" && !presentationPage.classList.contains("hidden")) {
    exitPresentation();
  }
});

loadSlides();
