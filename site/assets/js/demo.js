/* Dearvell demo: bindery, tactile page simulator, study shelf, and sanctuary settings */
(() => {
  "use strict";

  const root = document.querySelector("[data-demo]");
  if (!root) return;

  const tabs = Array.from(root.querySelectorAll("[data-demo-tab]"));
  const panels = Array.from(root.querySelectorAll("[data-demo-panel]"));

  function activateTab(name, focusTab) {
    tabs.forEach((tab) => {
      const active = tab.dataset.demoTab === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus();
    });
    panels.forEach((panel) => {
      const active = panel.dataset.demoPanel === name;
      panel.hidden = !active;
      if (active) panel.scrollTop = 0;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.demoTab));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      activateTab(tabs[next].dataset.demoTab, true);
    });
  });

  /* Bindery workshop */
  const cover = root.querySelector("[data-cover]");
  const coverTitle = root.querySelector("[data-cover-title]");
  const titleInput = root.querySelector("[data-title-input]");
  const swatches = Array.from(root.querySelectorAll("button[data-dye]"));

  function chooseDye(dye) {
    if (!cover) return;
    cover.dataset.dye = dye;
    swatches.forEach((swatch) => {
      swatch.setAttribute("aria-pressed", String(swatch.dataset.dye === dye));
    });
  }

  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => chooseDye(swatch.dataset.dye));
  });

  if (titleInput && coverTitle) {
    titleInput.addEventListener("input", () => {
      const value = titleInput.value.trim();
      coverTitle.textContent = value || "The Quiet Hours";
    });
  }

  /* Tactile page editor */
  const editor = root.querySelector("[data-editor]");
  const liveStatus = root.querySelector("[data-live-status]");
  const wordCount = root.querySelector("[data-word-count]");
  const page = root.querySelector("[data-editor-page]");
  let savedRange = null;
  let dictationTimer = null;
  let dictationLine = null;

  function setStatus(message) {
    if (liveStatus) liveStatus.textContent = message;
  }

  function countWords() {
    if (!editor || !wordCount) return;
    const words = editor.innerText.trim().split(/\s+/).filter(Boolean);
    wordCount.textContent = `${words.length} ${words.length === 1 ? "word" : "words"}`;
  }

  function rememberSelection() {
    if (!editor) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
  }

  function rangeForInk() {
    let range = savedRange;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      const lastBlock = editor.querySelector("p:last-of-type") || editor;
      range.selectNodeContents(lastBlock);
      return range;
    }
    if (range.collapsed) {
      let node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const block = node.closest("p") || editor;
      range = document.createRange();
      range.selectNodeContents(block);
    }
    return range;
  }

  function applyInk(ink) {
    if (!editor) return;
    const range = rangeForInk();
    const marker = document.createElement("span");
    marker.dataset.ink = ink;
    try {
      range.surroundContents(marker);
    } catch (error) {
      marker.appendChild(range.extractContents());
      range.insertNode(marker);
    }
    editor.normalize();
    savedRange = null;
    editor.focus();
    const names = { amber: "Amber", rose: "Rose", sage: "Sage" };
    setStatus(`${names[ink] || "Ink"} highlighter applied. Select another line to keep marking.`);
    countWords();
  }

  const inkButtons = Array.from(root.querySelectorAll("[data-ink-choice]"));
  inkButtons.forEach((button) => {
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      const alreadyActive = button.getAttribute("aria-pressed") === "true";
      const selection = window.getSelection();
      const hasSelection = selection && selection.rangeCount > 0 && !selection.isCollapsed && editor.contains(selection.getRangeAt(0).commonAncestorContainer);
      inkButtons.forEach((item) => item.setAttribute("aria-pressed", "false"));
      if (alreadyActive && !hasSelection) {
        setStatus("Highlighter lifted. Pick another ink when you are ready.");
        return;
      }
      button.setAttribute("aria-pressed", "true");
      applyInk(button.dataset.inkChoice);
    });
  });

  if (editor) {
    document.addEventListener("selectionchange", rememberSelection);
    editor.addEventListener("input", countWords);
    editor.addEventListener("keyup", rememberSelection);
    editor.addEventListener("mouseup", rememberSelection);
    countWords();
  }

  const stampButton = root.querySelector("[data-stamp]");
  if (stampButton && editor) {
    stampButton.addEventListener("click", () => {
      const stamp = document.createElement("span");
      stamp.className = "paper-stamp";
      stamp.contentEditable = "false";
      stamp.textContent = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date()).toUpperCase();
      const range = savedRange && editor.contains(savedRange.commonAncestorContainer) ? savedRange : null;
      if (range) {
        range.collapse(false);
        range.insertNode(stamp);
        const after = document.createRange();
        after.setStartAfter(stamp);
        after.collapse(true);
        savedRange = after.cloneRange();
      } else {
        editor.appendChild(document.createTextNode(" "));
        editor.appendChild(stamp);
      }
      editor.focus();
      setStatus("Date stamp pressed into the paper. This demo never leaves your browser.");
      countWords();
    });
  }

  const dictateButton = root.querySelector("[data-dictate]");
  const phrase = "The room is quiet enough to hear the lamp breathing. I think I will stay here a while.";

  function stopDictation(completed) {
    if (dictationTimer) window.clearInterval(dictationTimer);
    dictationTimer = null;
    if (page) page.classList.remove("is-listening");
    if (dictateButton) {
      dictateButton.classList.remove("is-listening");
      dictateButton.setAttribute("aria-pressed", "false");
      const label = dictateButton.querySelector("[data-dictate-label]");
      if (label) label.textContent = "Dictate";
    }
    setStatus(completed ? "Dictation complete. Every word stayed in this browser tab." : "Dictation paused. Tap Dictate to try again.");
    countWords();
  }

  function startDictation() {
    if (!editor) return;
    const words = phrase.split(" ");
    dictationLine = document.createElement("p");
    dictationLine.className = "dictation-line";
    editor.appendChild(dictationLine);
    if (page) page.classList.add("is-listening");
    if (dictateButton) {
      dictateButton.classList.add("is-listening");
      dictateButton.setAttribute("aria-pressed", "true");
      const label = dictateButton.querySelector("[data-dictate-label]");
      if (label) label.textContent = "Listening";
    }
    setStatus("Simulated dictation. Mic permission is never requested in this demo.");
    let index = 0;
    dictationTimer = window.setInterval(() => {
      if (!dictationLine || index >= words.length) {
        stopDictation(true);
        return;
      }
      dictationLine.textContent += `${index ? " " : ""}${words[index]}`;
      index += 1;
      setStatus(`Listening · ${index} of ${words.length} words transcribed on device`);
      countWords();
    }, 210);
  }

  if (dictateButton) {
    dictateButton.addEventListener("click", () => {
      if (dictationTimer) {
        stopDictation(false);
        return;
      }
      startDictation();
    });
  }

  /* Study shelf and sanctuary settings */
  const settingsPanel = root.querySelector("[data-settings-panel]");
  const openButtons = Array.from(root.querySelectorAll("[data-settings-open]"));
  const closeButton = root.querySelector("[data-settings-close]");
  const shelfScene = root.querySelector("[data-shelf-scene]");
  let activeTrigger = null;
  let closeTimer = null;

  function openSettings(trigger) {
    if (!settingsPanel) return;
    window.clearTimeout(closeTimer);
    activeTrigger = trigger || null;
    settingsPanel.hidden = false;
    window.requestAnimationFrame(() => settingsPanel.classList.add("is-open"));
    openButtons.forEach((button) => button.setAttribute("aria-expanded", "true"));
    if (closeButton) closeButton.focus();
  }

  function closeSettings() {
    if (!settingsPanel || settingsPanel.hidden) return;
    settingsPanel.classList.remove("is-open");
    openButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
    closeTimer = window.setTimeout(() => { settingsPanel.hidden = true; }, 220);
    if (activeTrigger) activeTrigger.focus();
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", () => openSettings(button));
  });
  if (closeButton) closeButton.addEventListener("click", closeSettings);
  if (settingsPanel) {
    settingsPanel.addEventListener("click", (event) => {
      if (event.target === settingsPanel) closeSettings();
    });
    settingsPanel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSettings();
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(settingsPanel.querySelectorAll("button, input, [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  const lamp = root.querySelector("[data-lamp-toggle]");
  const lampRange = root.querySelector("[data-lamp-range]");
  function paintLamp() {
    if (!shelfScene) return;
    const on = !lamp || lamp.checked;
    const value = lampRange ? Number(lampRange.value) / 100 : 0.72;
    shelfScene.style.setProperty("--shelf-light", on ? String(0.07 + value * 0.28) : "0.035");
    shelfScene.dataset.lamp = on ? "on" : "off";
  }
  if (lamp) lamp.addEventListener("change", paintLamp);
  if (lampRange) lampRange.addEventListener("input", paintLamp);
  paintLamp();
})();
