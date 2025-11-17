// src/components/DayLog.js

import { memoryStore } from "../services/memoryStore.js";

export function initDayLog() {
  const textarea = document.getElementById("daylog-text");
  const saveBtn = document.getElementById("daylog-save");
  const showBtn = document.getElementById("daylog-show-random");
  const feedback = document.getElementById("daylog-feedback");

  if (!textarea || !saveBtn || !showBtn || !feedback) return;

  saveBtn.addEventListener("click", () => {
    const text = textarea.value.trim();
    if (!text) {
      feedback.textContent = "Bitte schreibe etwas.";
      return;
    }

    memoryStore.save(text);
    feedback.textContent = "💛 Gespeichert. Schön, dass du dir Zeit nimmst.";
    textarea.value = "";
  });

  showBtn.addEventListener("click", () => {
    const entry = memoryStore.random();
    if (entry) {
      feedback.textContent = `📅 ${new Date(entry.date).toLocaleDateString()}: ${entry.text}`;
    } else {
      feedback.textContent = "Noch keine Einträge – leg heute los!";
    }
  });
}