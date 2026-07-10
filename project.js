const S = LoopStore;
S.requireSession();

const projectId = S.selectedProjectId();
let project = S.getProject(projectId);
if (!project) location.replace("projects.html");
S.selectProject(project.id);

const els = {
  hero: document.getElementById("projectHero"),
  title: document.getElementById("projectTitle"),
  description: document.getElementById("projectDescription"),
  personality: document.getElementById("personalityLabel"),
  progress: document.getElementById("projectProgress"),
  tags: document.getElementById("projectTags"),
  moodNav: document.getElementById("moodboardNav"),
  tabs: document.getElementById("tabs"),
  overview: document.getElementById("tab-overview"),
  missions: document.getElementById("missionList"),
  missionForm: document.getElementById("missionForm"),
  missionInput: document.getElementById("missionInput"),
  milestone: document.getElementById("milestoneMessage"),
  moodTab: document.getElementById("tab-moodboard"),
  noteForm: document.getElementById("noteForm"),
  noteInput: document.getElementById("noteInput"),
  notes: document.getElementById("noteGrid"),
  timeline: document.getElementById("timeline"),
  stuck: document.getElementById("stuckButton"),
  toast: document.getElementById("toast"),
  footer: document.getElementById("footerMessage"),
  logout: document.getElementById("logoutButton")
};

els.moodNav.href = `moodboard.html?project=${encodeURIComponent(project.id)}`;
S.setFooterRotation(els.footer);

function refreshProject() {
  project = S.getProject(project.id);
}

function progressMessage(progress) {
  if (progress >= 100) return "SHIP IT. The project has officially escaped the workshop.";
  if (progress >= 75) return "Polish mode unlocked. The edges are asking for attention.";
  if (progress >= 50) return "Halfway through the beautiful chaos.";
  if (progress >= 25) return "The idea has legs.";
  return "Complete missions to unlock your first progress stamp.";
}

function renderHeader() {
  const progress = S.calculateProgress(project);
  els.hero.dataset.personality = project.personality;
  els.personality.textContent = S.personalityLabel(project.personality);
  els.title.innerHTML = `${S.escapeHtml(project.title)} <span>passport.</span>`;
  els.description.textContent = project.description;
  els.progress.textContent = `${progress}%`;
  els.tags.innerHTML = project.technologies.length
    ? project.technologies.map((tag) => `<span class="tech-tag">${S.escapeHtml(tag)}</span>`).join("")
    : `<span class="tech-tag">No tags yet</span>`;
  els.milestone.textContent = progressMessage(progress);
}

function renderOverview() {
  const progress = S.calculateProgress(project);
  const next = S.nextMission(project);
  const deadline = S.deadlineState(project.deadline);
  const pins = S.getPins(project.id);
  const done = project.tasks.filter((task) => task.done).length;

  els.overview.innerHTML = `
    <div class="content-grid">
      <div>
        <article class="today-card">
          <span class="eyebrow">Today's tiny move</span>
          <h3>${S.escapeHtml(next?.title || "Add the next useful mission.")}</h3>
          <p>${next ? "One clear move is more useful than ten dramatic plans." : "The project needs a fresh mission before it can move."}</p>
          <div class="today-actions">
            ${next ? `<button class="small-button" type="button" onclick="makeToday('${next.id}')">Make this today's move</button>` : ""}
            ${next ? `<button class="small-button" type="button" onclick="completeMission('${next.id}')">Mark done ✓</button>` : `<button class="small-button" type="button" onclick="openTab('missions')">Add mission</button>`}
          </div>
        </article>

        <div class="quick-stats">
          <div class="quick-stat"><strong>${done}/${project.tasks.length}</strong><span>Missions complete</span></div>
          <div class="quick-stat"><strong>${pins.length}</strong><span>Moodboard pins</span></div>
          <div class="quick-stat"><strong>${project.notes.length}</strong><span>Loose notes</span></div>
        </div>

        <div class="paper-panel">
          <h3 class="panel-title">Next missions.</h3>
          <div class="mission-list" style="margin-top:20px">
            ${project.tasks.filter((task) => !task.done).slice(0,4).map(missionMarkup).join("") || `
              <div class="empty-state" style="min-height:220px"><div><h3>Nothing left to chase.</h3><p>Add a new mission or enjoy the rare silence.</p></div></div>`}
          </div>
        </div>
      </div>

      <aside>
        <div class="paper-panel tint-yellow">
          <h3 class="panel-title">Project pulse.</h3>
          <div class="back-detail" style="margin-top:18px"><span>Status</span><strong>${S.escapeHtml(project.status)}</strong></div>
          <div class="back-detail"><span>Deadline</span><strong>${S.escapeHtml(deadline.label)}</strong></div>
          <div class="back-detail"><span>Progress</span><strong>${progress}% from missions</strong></div>
        </div>

        <div class="stuck-card" style="margin-top:22px">
          <h3>Stuck button.</h3>
          <p id="overviewStuckOutput">Press it. Receive one useful nudge. No inspirational fog.</p>
          <button class="small-button" type="button" onclick="stuckMove()">Give me a move</button>
        </div>
      </aside>
    </div>`;
}

function missionMarkup(task) {
  return `
    <article class="mission-item ${task.done ? "done" : ""} ${task.today ? "today" : ""}">
      <input class="mission-check" type="checkbox" ${task.done ? "checked" : ""} onchange="completeMission('${task.id}')" aria-label="Complete mission" />
      <div class="mission-copy">
        <strong>${S.escapeHtml(task.title)}</strong>
        <small>${task.today ? "Today's tiny move" : task.sourcePinId ? "Born from a moodboard pin" : "Project mission"}</small>
      </div>
      <div class="mission-actions">
        ${!task.done ? `<button type="button" onclick="makeToday('${task.id}')">Today</button>` : ""}
        <button type="button" onclick="editMission('${task.id}')">Edit</button>
        <button type="button" onclick="removeMission('${task.id}')">Delete</button>
      </div>
    </article>`;
}

function renderMissions() {
  els.missions.innerHTML = project.tasks.length
    ? project.tasks.map(missionMarkup).join("")
    : `<div class="empty-state"><div><h3>No missions yet.</h3><p>Break the project into small actions. Progress will calculate itself from the checkboxes.</p></div></div>`;
}

function renderMoodboard() {
  const pins = S.getPins(project.id);
  els.moodTab.innerHTML = `
    <div class="paper-panel">
      <div class="section-heading" style="margin-top:0">
        <div><h2>Moodboard preview.</h2><p>Inspiration becomes useful when it can turn directly into a mission.</p></div>
        <a class="button-link" href="moodboard.html?project=${encodeURIComponent(project.id)}">Open full wall ↗</a>
      </div>
      <div class="preview-grid">
        ${pins.slice(0,9).map((pin) => `
          <article class="preview-pin">
            <small>${S.escapeHtml(pin.type)}</small>
            <h4>${S.escapeHtml(pin.title)}</h4>
            <p>${S.escapeHtml(pin.content || pin.color || pin.font || "Visual reference")}</p>
          </article>`).join("") || `
          <div class="empty-state"><div><h3>The wall is waiting.</h3><p>Add notes, colours, decisions, fonts, images and feature ideas.</p></div></div>`}
      </div>
    </div>`;
}

function renderNotes() {
  els.notes.innerHTML = project.notes.length
    ? project.notes.map((note) => `
      <article class="note-card">
        <button class="note-delete" type="button" onclick="removeNote('${note.id}')">×</button>
        <p>${S.escapeHtml(note.text)}</p>
        <footer>${S.formatDate(note.createdAt)}</footer>
      </article>`).join("")
    : `<div class="empty-state"><div><h3>No loose notes.</h3><p>This is either impressive focus or suspicious silence.</p></div></div>`;
}

function renderHistory() {
  const activity = S.getActivity(project.id);
  els.timeline.innerHTML = activity.length
    ? activity.map((item) => `
      <article class="timeline-entry">
        <strong>${S.escapeHtml(item.text)}</strong>
        <time>${S.formatDate(item.at)}</time>
      </article>`).join("")
    : `<div class="empty-state"><div><h3>No receipts yet.</h3><p>Complete a mission, add a pin or make a decision and it will appear here.</p></div></div>`;
}

function renderAll() {
  refreshProject();
  renderHeader();
  renderOverview();
  renderMissions();
  renderMoodboard();
  renderNotes();
  renderHistory();
}

window.completeMission = function (taskId) {
  const result = S.toggleTask(project.id,taskId);
  renderAll();
  if (result.milestone) {
    S.showToast(els.toast,`${result.milestone.threshold}% — ${result.milestone.message}`,true);
    S.confetti(result.milestone.threshold === 100 ? 95 : 50);
  } else {
    S.showToast(els.toast,"Mission updated.");
  }
};

window.makeToday = function (taskId) {
  S.setTodayTask(project.id,taskId);
  renderAll();
  S.showToast(els.toast,"Today's tiny move selected.");
};

window.editMission = function (taskId) {
  const task = project.tasks.find((item) => item.id === taskId);
  if (!task) return;
  const title = prompt("Edit mission:",task.title);
  if (!title?.trim()) return;
  S.editTask(project.id,taskId,title);
  renderAll();
};

window.removeMission = function (taskId) {
  const task = project.tasks.find((item) => item.id === taskId);
  if (!task || !confirm(`Delete "${task.title}"?`)) return;
  S.deleteTask(project.id,taskId);
  renderAll();
  S.showToast(els.toast,"Mission removed.");
};

window.removeNote = function (noteId) {
  S.deleteNote(project.id,noteId);
  renderAll();
  S.showToast(els.toast,"Note removed.");
};

window.stuckMove = function () {
  const output = document.getElementById("overviewStuckOutput");
  if (output) output.textContent = S.randomStuckAction();
};

window.openTab = function (name) {
  document.querySelector(`[data-tab="${name}"]`)?.click();
};

els.missionForm.addEventListener("submit",(event) => {
  event.preventDefault();
  const title = els.missionInput.value.trim();
  if (!title) return;
  S.addTask(project.id,title);
  els.missionInput.value = "";
  renderAll();
  S.showToast(els.toast,"Mission added.");
});

els.noteForm.addEventListener("submit",(event) => {
  event.preventDefault();
  const text = els.noteInput.value.trim();
  if (!text) return;
  S.addNote(project.id,text);
  els.noteInput.value = "";
  renderAll();
  S.showToast(els.toast,"Note pinned.");
});

els.tabs.addEventListener("click",(event) => {
  const button = event.target.closest("[data-tab]");
  if (!button) return;
  document.querySelectorAll(".tab-button").forEach((item) => item.classList.toggle("active",item === button));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active",panel.id === `tab-${button.dataset.tab}`));
});

els.stuck.addEventListener("click",() => {
  openTab("overview");
  setTimeout(stuckMove,50);
});
els.logout.addEventListener("click",S.logout);

renderAll();
