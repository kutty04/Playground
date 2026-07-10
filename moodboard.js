const S = LoopStore;
S.requireSession();

const projectId = S.selectedProjectId();
const project = S.getProject(projectId);
if (!project) location.replace("projects.html");
S.selectProject(project.id);

const els = {
  title: document.getElementById("projectTitle"),
  hero: document.getElementById("moodHero"),
  passport: document.getElementById("passportLink"),
  board: document.getElementById("moodboard"),
  add: document.getElementById("addPinButton"),
  quick: document.getElementById("quickAdd"),
  arrange: document.getElementById("arrangeButton"),
  arrangeHint: document.getElementById("arrangeHint"),
  tidy: document.getElementById("tidyButton"),
  clearNew: document.getElementById("clearNewButton"),
  modal: document.getElementById("pinModal"),
  modalTitle: document.getElementById("modalTitle"),
  close: document.getElementById("closeModalButton"),
  cancel: document.getElementById("cancelButton"),
  form: document.getElementById("pinForm"),
  id: document.getElementById("pinId"),
  type: document.getElementById("pinType"),
  pinTitle: document.getElementById("pinTitle"),
  content: document.getElementById("pinContent"),
  url: document.getElementById("pinUrl"),
  color: document.getElementById("pinColor"),
  font: document.getElementById("pinFont"),
  contentField: document.getElementById("contentField"),
  urlField: document.getElementById("urlField"),
  urlHelp: document.getElementById("urlHelp"),
  colorField: document.getElementById("colorField"),
  fontField: document.getElementById("fontField"),
  toast: document.getElementById("toast"),
  footer: document.getElementById("footerMessage"),
  logout: document.getElementById("logoutButton")
};

let pins = S.getPins(project.id);
let arranging = true;
let interaction = null;

els.title.innerHTML = `${S.escapeHtml(project.title)} <span>wall.</span>`;
els.hero.dataset.personality = project.personality;
els.passport.href = `project.html?project=${encodeURIComponent(project.id)}`;
S.setFooterRotation(els.footer);

function pinBody(pin) {
  const type = pin.type;
  if (type === "color") {
    return `
      <div class="color-bottom">
        <span class="pin-type">Colour</span>
        <h3 class="pin-title">${S.escapeHtml(pin.title)}</h3>
        <p class="pin-content">${S.escapeHtml(pin.color.toUpperCase())}</p>
      </div>`;
  }

  if (type === "image") {
    const url = S.safeUrl(pin.url);
    return `
      ${url ? `<img class="pin-image" src="${S.escapeHtml(url)}" alt="${S.escapeHtml(pin.title)}" onerror="this.style.display='none'" />` : ""}
      <div class="pin-caption">
        <span class="pin-type">Image reference</span>
        <h3 class="pin-title">${S.escapeHtml(pin.title)}</h3>
        <p class="pin-content">${S.escapeHtml(pin.content)}</p>
      </div>`;
  }

  if (type === "quote") {
    return `
      <span class="pin-type">Quote</span>
      <h3 class="pin-title">${S.escapeHtml(pin.title)}</h3>
      <blockquote class="pin-quote">“${S.escapeHtml(pin.content)}”</blockquote>`;
  }

  if (type === "font") {
    return `
      <span class="pin-type">Font</span>
      <h3 class="pin-title">${S.escapeHtml(pin.title)}</h3>
      <div class="font-sample" style="--pin-font:'${S.escapeHtml(pin.font)}'">Aa Bb Cc</div>
      <p class="pin-content">${S.escapeHtml(pin.font)}${pin.content ? `\n${S.escapeHtml(pin.content)}` : ""}</p>`;
  }

  if (type === "link") {
    const url = S.safeUrl(pin.url);
    return `
      <span class="pin-type">Link</span>
      <h3 class="pin-title">${S.escapeHtml(pin.title)}</h3>
      <p class="pin-content">${S.escapeHtml(pin.content)}</p>
      ${url ? `<p class="pin-content" style="margin-top:14px"><a href="${S.escapeHtml(url)}" target="_blank" rel="noopener">Open reference ↗</a></p>` : ""}`;
  }

  return `
    <span class="pin-type">${S.escapeHtml(type)}</span>
    <h3 class="pin-title">${S.escapeHtml(pin.title)}</h3>
    <p class="pin-content">${S.escapeHtml(pin.content)}</p>
    ${type === "decision" ? `<span class="locked-stamp">LOCKED IN ✓</span>` : ""}`;
}

function pinMarkup(pin) {
  const isNew = S.isNew(pin.createdAt) && !pin.newCleared;
  return `
    <article
      class="pin-card ${pin.pinned ? "pinned" : ""} ${pin.locked ? "locked" : ""} ${isNew ? "new-pin" : ""}"
      data-id="${pin.id}"
      data-type="${pin.type}"
      style="--x:${pin.x}px;--y:${pin.y}px;--w:${pin.w}px;--h:${pin.h}px;--rotation:${pin.rotation}deg;--z:${pin.z};--pin-color:${pin.color};"
    >
      <div class="pin-actions">
        <button type="button" title="Edit" data-action="edit">✎</button>
        <button type="button" title="Turn into mission" data-action="task">✓</button>
        <button type="button" title="Rotate" data-action="rotate">↻</button>
        <button type="button" title="Bring forward" data-action="front">↑</button>
        <button type="button" title="${pin.pinned ? "Unpin" : "Pin important"}" data-action="pin">◆</button>
        <button type="button" title="${pin.locked ? "Unlock" : "Lock position"}" data-action="lock">${pin.locked ? "🔒" : "○"}</button>
        <button type="button" title="Delete" data-action="delete">×</button>
      </div>
      ${pinBody(pin)}
      ${!pin.locked ? `<span class="resize-handle" data-action="resize"></span>` : ""}
    </article>`;
}

function render() {
  pins = S.getPins(project.id);
  if (!pins.length) {
    els.board.innerHTML = `
      <div class="empty-state" style="position:absolute;inset:28px">
        <div>
          <h3>The wall is waiting.</h3>
          <p>Add a note, colour, image, link, quote, font, feature or final decision. Empty walls are suspiciously well behaved.</p>
          <button class="primary-button" type="button" onclick="openPinModal('note')">+ Add the first pin</button>
        </div>
      </div>`;
    return;
  }
  els.board.innerHTML = pins.map(pinMarkup).join("");
}

function updateFields() {
  const type = els.type.value;
  els.urlField.classList.toggle("hidden", !["image","link"].includes(type));
  els.colorField.classList.toggle("hidden", type !== "color");
  els.fontField.classList.toggle("hidden", type !== "font");
  els.contentField.classList.toggle("hidden", type === "color");

  els.url.required = ["image","link"].includes(type);
  els.content.required = ["note","quote","feature","decision"].includes(type);

  if (type === "image") {
    els.urlHelp.textContent = "Use a direct public image URL beginning with http or https.";
    els.content.placeholder = "Optional caption or reason you saved it...";
  } else if (type === "link") {
    els.urlHelp.textContent = "Paste the page you want to remember.";
    els.content.placeholder = "Why does this reference matter?";
  } else if (type === "decision") {
    els.content.placeholder = "Write the final choice you are locking in...";
  } else if (type === "feature") {
    els.content.placeholder = "Describe the feature clearly enough to turn it into a mission...";
  } else {
    els.content.placeholder = "Write the thought before it runs away...";
  }
}

function openModal(type = "note", pin = null) {
  els.form.reset();
  els.id.value = pin?.id || "";
  els.type.value = pin?.type || type;
  els.pinTitle.value = pin?.title || "";
  els.content.value = pin?.content || "";
  els.url.value = pin?.url || "";
  els.color.value = pin?.color || "#ff8fa3";
  els.font.value = pin?.font || "Georgia";
  els.modalTitle.textContent = pin ? "Edit pin" : `Add ${type}`;
  updateFields();
  els.modal.classList.add("open");
  els.modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  setTimeout(() => els.pinTitle.focus(),50);
}

function closeModal() {
  els.modal.classList.remove("open");
  els.modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

window.openPinModal = function (type) { openModal(type); };

function nextPosition() {
  const index = pins.length;
  const cols = 3;
  return {
    x: 35 + (index % cols) * 320,
    y: 40 + Math.floor(index / cols) * 260
  };
}

els.form.addEventListener("submit",(event) => {
  event.preventDefault();
  const existing = pins.find((pin) => pin.id === els.id.value);
  const pos = existing || nextPosition();
  const url = els.url.value.trim();

  if (["image","link"].includes(els.type.value) && !S.safeUrl(url)) {
    S.showToast(els.toast,"Please use a valid http or https URL.");
    return;
  }

  const pin = {
    ...(existing || {}),
    id: existing?.id || S.id("pin"),
    projectId: project.id,
    type: els.type.value,
    title: els.pinTitle.value.trim(),
    content: els.content.value.trim(),
    url,
    color: els.color.value,
    font: els.font.value.trim() || "Georgia",
    x: existing?.x ?? pos.x,
    y: existing?.y ?? pos.y,
    w: existing?.w ?? 280,
    h: existing?.h ?? (els.type.value === "image" ? 300 : 210),
    rotation: existing?.rotation ?? (Math.random() * 4 - 2),
    z: existing?.z ?? (Math.max(0,...pins.map((item) => item.z)) + 1),
    pinned: existing?.pinned || false,
    locked: existing?.locked || els.type.value === "decision",
    newCleared: existing?.newCleared || false,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  S.upsertPin(pin);
  S.recordActivity(project.id,existing ? "pin-edited" : "pin-added",`${existing ? "Updated" : "Added"} ${pin.type} pin: ${pin.title}`);
  closeModal();
  render();
  S.showToast(els.toast,existing ? "Pin updated." : "New pin added.");
});

function persistGeometry(card,pin) {
  const style = getComputedStyle(card);
  pin.x = parseFloat(card.style.left || style.left) || pin.x;
  pin.y = parseFloat(card.style.top || style.top) || pin.y;
  pin.w = card.offsetWidth;
  pin.h = card.offsetHeight;
  pin.updatedAt = new Date().toISOString();
  S.upsertPin(pin);
}

function startDrag(event,card,pin) {
  if (!arranging || pin.locked || innerWidth <= 720) return;
  event.preventDefault();
  const rect = card.getBoundingClientRect();
  const boardRect = els.board.getBoundingClientRect();
  interaction = {
    mode:"drag",
    pointerId:event.pointerId,
    card,pin,
    startX:event.clientX,
    startY:event.clientY,
    originX:rect.left - boardRect.left,
    originY:rect.top - boardRect.top
  };
  card.classList.add("dragging");
  card.setPointerCapture(event.pointerId);
}

function startResize(event,card,pin) {
  if (!arranging || pin.locked || innerWidth <= 720) return;
  event.preventDefault();
  event.stopPropagation();
  interaction = {
    mode:"resize",
    pointerId:event.pointerId,
    card,pin,
    startX:event.clientX,
    startY:event.clientY,
    originW:card.offsetWidth,
    originH:card.offsetHeight
  };
  card.classList.add("dragging");
  card.setPointerCapture(event.pointerId);
}

els.board.addEventListener("pointerdown",(event) => {
  const card = event.target.closest(".pin-card");
  if (!card) return;
  const pin = pins.find((item) => item.id === card.dataset.id);
  if (!pin) return;

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "resize") return startResize(event,card,pin);
  if (action || event.target.closest("a,button,input,textarea")) return;
  startDrag(event,card,pin);
});

els.board.addEventListener("pointermove",(event) => {
  if (!interaction || event.pointerId !== interaction.pointerId) return;
  const {card} = interaction;
  if (interaction.mode === "drag") {
    const maxX = Math.max(0,els.board.clientWidth - card.offsetWidth);
    const maxY = Math.max(0,els.board.clientHeight - card.offsetHeight);
    const x = Math.min(maxX,Math.max(0,interaction.originX + event.clientX - interaction.startX));
    const y = Math.min(maxY,Math.max(0,interaction.originY + event.clientY - interaction.startY));
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
  } else {
    const width = Math.max(190,interaction.originW + event.clientX - interaction.startX);
    const height = Math.max(150,interaction.originH + event.clientY - interaction.startY);
    card.style.width = `${Math.min(width,els.board.clientWidth - 20)}px`;
    card.style.minHeight = `${height}px`;
    card.style.setProperty("--h",`${height}px`);
  }
});

function finishInteraction(event) {
  if (!interaction || event.pointerId !== interaction.pointerId) return;
  const {card,pin} = interaction;
  card.classList.remove("dragging");
  persistGeometry(card,pin);
  interaction = null;
}

els.board.addEventListener("pointerup",finishInteraction);
els.board.addEventListener("pointercancel",finishInteraction);

els.board.addEventListener("click",(event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.dataset.action === "resize") return;
  const card = button.closest(".pin-card");
  const pin = pins.find((item) => item.id === card?.dataset.id);
  if (!pin) return;

  const action = button.dataset.action;

  if (action === "edit") openModal(pin.type,pin);

  if (action === "delete" && confirm(`Remove "${pin.title}" from the wall?`)) {
    S.deletePin(pin.id);
    render();
    S.showToast(els.toast,"Pin removed.");
  }

  if (action === "rotate") {
    pin.rotation = (pin.rotation + 3) % 360;
    S.upsertPin(pin);
    render();
  }

  if (action === "front") {
    pin.z = Math.max(0,...pins.map((item) => item.z)) + 1;
    S.upsertPin(pin);
    render();
  }

  if (action === "pin") {
    pin.pinned = !pin.pinned;
    S.upsertPin(pin);
    render();
    S.showToast(els.toast,pin.pinned ? "Important pin highlighted." : "Pin highlight removed.");
  }

  if (action === "lock") {
    pin.locked = !pin.locked;
    S.upsertPin(pin);
    render();
    S.showToast(els.toast,pin.locked ? "Position locked." : "Pin unlocked.");
  }

  if (action === "task") {
    const taskTitle = prompt("Turn this inspiration into a mission:",pin.type === "feature" ? pin.content : pin.title);
    if (!taskTitle?.trim()) return;
    S.addTask(project.id,taskTitle,pin.id);
    S.showToast(els.toast,"Moodboard pin became a project mission ✓");
  }
});

els.add.addEventListener("click",() => openModal("note"));
els.quick.addEventListener("click",(event) => {
  const button = event.target.closest("[data-type]");
  if (button) openModal(button.dataset.type);
});

els.type.addEventListener("change",updateFields);
els.close.addEventListener("click",closeModal);
els.cancel.addEventListener("click",closeModal);
els.modal.addEventListener("click",(event) => { if (event.target === els.modal) closeModal(); });
document.addEventListener("keydown",(event) => { if (event.key === "Escape") closeModal(); });

els.arrange.addEventListener("click",() => {
  arranging = !arranging;
  els.board.classList.toggle("arrange-mode",arranging);
  els.arrange.textContent = arranging ? "Pause arranging" : "Resume arranging";
  els.arrangeHint.innerHTML = arranging
    ? "Arrange mode: ON<br />Drag cards and resize from the corner."
    : "Arrange mode: PAUSED<br />Buttons and links are ready.";
});

els.tidy.addEventListener("click",() => {
  const width = Math.max(320,els.board.clientWidth);
  const columns = width > 950 ? 3 : width > 620 ? 2 : 1;
  const cardWidth = Math.max(240,Math.floor((width - 70 - (columns - 1) * 24) / columns));
  pins.forEach((pin,index) => {
    pin.x = 28 + (index % columns) * (cardWidth + 24);
    pin.y = 30 + Math.floor(index / columns) * 245;
    pin.w = cardWidth;
    pin.h = pin.type === "image" ? 300 : 205;
    pin.rotation = (index % 2 ? 1 : -1);
    pin.z = index + 1;
    S.upsertPin(pin);
  });
  render();
  S.showToast(els.toast,"The wall has been tidied. Briefly.");
});

els.clearNew.addEventListener("click",() => {
  pins.forEach((pin) => {
    pin.newCleared = true;
    S.upsertPin(pin);
  });
  render();
  S.showToast(els.toast,"NEW stickers cleared.");
});

els.logout.addEventListener("click",S.logout);
updateFields();
render();
