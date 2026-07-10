const S = LoopStore;
const currentSession = S.requireSession();

const els = {
  memberEmail: document.getElementById("memberEmail"),
  logout: document.getElementById("logoutButton"),
  newProject: document.getElementById("newProjectButton"),
  grid: document.getElementById("projectGrid"),
  filters: document.getElementById("filters"),
  total: document.getElementById("totalProjects"),
  active: document.getElementById("activeProjects"),
  average: document.getElementById("averageProgress"),
  activity: document.getElementById("activityList"),
  today: document.getElementById("todayCard"),
  stuck: document.getElementById("stuckButton"),
  globalStuck: document.getElementById("globalStuckButton"),
  stuckOutput: document.getElementById("stuckOutput"),
  modal: document.getElementById("projectModal"),
  modalTitle: document.getElementById("modalTitle"),
  closeModal: document.getElementById("closeModalButton"),
  cancel: document.getElementById("cancelButton"),
  form: document.getElementById("projectForm"),
  id: document.getElementById("projectId"),
  title: document.getElementById("projectTitle"),
  description: document.getElementById("projectDescription"),
  status: document.getElementById("projectStatus"),
  deadline: document.getElementById("projectDeadline"),
  tech: document.getElementById("projectTechnologies"),
  personality: document.getElementById("projectPersonality"),
  toast: document.getElementById("toast"),
  footer: document.getElementById("footerMessage")
};

let filter = "All";
let projects = S.getProjects();
els.memberEmail.textContent = currentSession?.email || "Member";
S.setFooterRotation(els.footer);

function projectName(projectId) {
  return projects.find((p) => p.id === projectId)?.title || "A project";
}

function renderToday() {
  const move = S.getTodayTask();
  if (!move) {
    els.today.innerHTML = `
      <span class="eyebrow">Today's tiny move</span>
      <h3>Everything is beautifully complete.</h3>
      <p>Add a new mission to keep the creative machine humming.</p>
      <div class="today-actions">
        <button class="small-button" type="button" onclick="openCreateModal()">Start a project</button>
      </div>`;
    return;
  }

  els.today.innerHTML = `
    <span class="eyebrow">Today's tiny move</span>
    <h3>${S.escapeHtml(move.task.title)}</h3>
    <p>From <strong>${S.escapeHtml(move.project.title)}</strong>. One useful move, then you may dramatically stare out a window.</p>
    <div class="today-actions">
      <button class="small-button" type="button" onclick="completeToday('${move.project.id}','${move.task.id}')">Mark done ✓</button>
      <button class="small-button" type="button" onclick="S.openProject('${move.project.id}')">Open project ↗</button>
    </div>`;
}

window.completeToday = function (projectId, taskId) {
  const result = S.toggleTask(projectId, taskId);
  projects = S.getProjects();
  renderAll();
  if (result.milestone) {
    S.showToast(els.toast, `${result.milestone.threshold}% — ${result.milestone.message}`, true);
    S.confetti(result.milestone.threshold === 100 ? 90 : 48);
  } else {
    S.showToast(els.toast, "DONE. NICE ONE. ✦");
  }
};

function renderStats() {
  els.total.textContent = projects.length;
  els.active.textContent = projects.filter((p) => S.calculateProgress(p) < 100 && p.status !== "Shipped").length;
  const avg = projects.length
    ? Math.round(projects.reduce((sum,p) => sum + S.calculateProgress(p),0) / projects.length)
    : 0;
  els.average.textContent = `${avg}%`;
}

function renderActivity() {
  const activity = S.getActivity().slice(0,12);
  if (!activity.length) {
    els.activity.innerHTML = `<div class="activity-entry">Your scrapbook is waiting for its first tiny victory.</div>`;
    return;
  }
  els.activity.innerHTML = activity.map((item) => `
    <article class="activity-entry">
      ${S.escapeHtml(item.text)}
      <time>${S.escapeHtml(projectName(item.projectId))} • ${S.formatDate(item.at,{short:true})}</time>
    </article>`).join("");
}

function cardBack(project) {
  const next = S.nextMission(project);
  const pins = S.getPins(project.id).length;
  const recent = S.getActivity(project.id)[0];
  return `
    <article class="project-card back" data-personality="${S.escapeHtml(project.personality)}">
      <div class="card-top">
        <span class="personality-sticker">${S.escapeHtml(S.personalityLabel(project.personality))}</span>
        <button class="icon-button" type="button" title="Flip front" onclick="flipCard('${project.id}')">↩</button>
      </div>
      <h3 class="project-title">Behind the project.</h3>
      <div class="card-back-list">
        <div class="back-detail"><span>Next mission</span><strong>${S.escapeHtml(next?.title || "Add the next useful move")}</strong></div>
        <div class="back-detail"><span>Last activity</span><p>${S.escapeHtml(recent?.text || "No activity yet")}</p></div>
        <div class="back-detail"><span>Moodboard</span><strong>${pins} ${pins === 1 ? "pin" : "pins"}</strong></div>
      </div>
      <div class="card-footer">
        <button class="small-button" type="button" onclick="S.openProject('${project.id}')">Open passport ↗</button>
        <button class="small-button" type="button" onclick="S.openProject('${project.id}','moodboard.html')">Moodboard ✦</button>
      </div>
    </article>`;
}

function cardFront(project) {
  const progress = S.calculateProgress(project);
  const deadline = S.deadlineState(project.deadline);
  const status = progress === 100 ? "Shipped" : project.status;
  const tags = project.technologies.length
    ? project.technologies.slice(0,6).map((tag) => `<span class="tech-tag">${S.escapeHtml(tag)}</span>`).join("")
    : `<span class="tech-tag">No tags yet</span>`;

  return `
    <article class="project-card front" data-personality="${S.escapeHtml(project.personality)}">
      ${S.isNew(project.createdAt) ? `<span class="new-sticker">New!</span>` : ""}
      ${progress === 100 || status === "Shipped" ? `<span class="shipped-stamp">Shipped</span>` : ""}
      <div class="card-top">
        <div>
          <span class="status-sticker" style="--status:${S.statusColor(status)}">${S.escapeHtml(status)}</span>
          ${deadline.urgent ? `<span class="warning-ticket">${S.escapeHtml(deadline.label)}</span>` : ""}
        </div>
        <div class="card-buttons">
          <button class="icon-button" type="button" title="Flip card" onclick="flipCard('${project.id}')">↻</button>
          <button class="icon-button" type="button" title="Edit project" onclick="editProject('${project.id}')">✎</button>
          <button class="icon-button" type="button" title="Delete project" onclick="deleteProject('${project.id}')">×</button>
        </div>
      </div>

      <h3 class="project-title">${S.escapeHtml(project.title)}</h3>
      <p class="project-description">${S.escapeHtml(project.description)}</p>
      <div class="tech-list">${tags}</div>

      <div class="progress-wrap">
        <div class="progress-meta"><span>Mission progress</span><span>${progress}%</span></div>
        <div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div>
      </div>

      <div class="card-footer">
        <span class="deadline">${S.escapeHtml(deadline.label)}</span>
        <button class="small-button" type="button" onclick="S.openProject('${project.id}')">Open passport ↗</button>
      </div>
    </article>`;
}

function renderProjects() {
  const visible = filter === "All" ? projects : projects.filter((p) => (S.calculateProgress(p) === 100 ? "Shipped" : p.status) === filter);
  if (!visible.length) {
    els.grid.innerHTML = `
      <div class="empty-state">
        <div>
          <h3>This shelf is gloriously empty.</h3>
          <p>Add a project or choose another status. Empty space is useful, but it should not get too comfortable.</p>
          <button class="primary-button" type="button" onclick="openCreateModal()">+ Start something</button>
        </div>
      </div>`;
    return;
  }

  els.grid.innerHTML = visible.map((project) => `
    <div class="project-card-wrap" id="card-${project.id}">
      <div class="project-card-inner">
        ${cardFront(project)}
        ${cardBack(project)}
      </div>
    </div>`).join("");
}

window.flipCard = function (projectId) {
  document.getElementById(`card-${projectId}`)?.classList.toggle("flipped");
};

function openModal() {
  els.modal.classList.add("open");
  els.modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
  setTimeout(() => els.title.focus(),50);
}

function closeModal() {
  els.modal.classList.remove("open");
  els.modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
  els.form.reset();
  els.id.value = "";
  els.status.value = "Building";
  els.personality.value = "playful";
}

window.openCreateModal = function () {
  els.modalTitle.textContent = "Start a project";
  els.form.reset();
  els.id.value = "";
  els.status.value = "Building";
  els.personality.value = "playful";
  openModal();
};

window.editProject = function (projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  els.modalTitle.textContent = "Edit project";
  els.id.value = project.id;
  els.title.value = project.title;
  els.description.value = project.description;
  els.status.value = project.status;
  els.deadline.value = project.deadline;
  els.tech.value = project.technologies.join(", ");
  els.personality.value = project.personality;
  openModal();
};

window.deleteProject = function (projectId) {
  const project = projects.find((p) => p.id === projectId);
  if (!project || !confirm(`Delete "${project.title}", its missions and its moodboard?`)) return;
  S.deleteProject(projectId);
  projects = S.getProjects();
  renderAll();
  S.showToast(els.toast,"Project deleted.");
};

els.form.addEventListener("submit",(event) => {
  event.preventDefault();
  const existing = projects.find((p) => p.id === els.id.value);
  const project = {
    ...(existing || {}),
    id: existing?.id || S.id("project"),
    title: els.title.value.trim(),
    description: els.description.value.trim(),
    status: els.status.value,
    deadline: els.deadline.value,
    technologies: els.tech.value.split(",").map((x) => x.trim()).filter(Boolean).slice(0,8),
    personality: els.personality.value,
    tasks: existing?.tasks || [],
    notes: existing?.notes || [],
    milestones: existing?.milestones || [],
    legacyProgress: existing?.legacyProgress || 0,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  S.upsertProject(project);
  S.recordActivity(project.id, existing ? "project-edited" : "project-created", existing ? "Updated project details" : `Created project: ${project.title}`);
  projects = S.getProjects();
  closeModal();
  renderAll();
  S.showToast(els.toast, existing ? "Project updated." : "New project added.");
});

function stuck() {
  els.stuckOutput.textContent = S.randomStuckAction();
  els.stuckOutput.animate(
    [{transform:"rotate(-1deg) scale(.98)"},{transform:"rotate(1deg) scale(1.02)"},{transform:"none"}],
    {duration:320}
  );
}

els.stuck.addEventListener("click",stuck);
els.globalStuck.addEventListener("click",() => {
  stuck();
  els.stuckOutput.scrollIntoView({behavior:"smooth",block:"center"});
});

els.filters.addEventListener("click",(event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  document.querySelectorAll(".filter-button").forEach((item) => item.classList.toggle("active",item === button));
  renderProjects();
});

els.newProject.addEventListener("click",openCreateModal);
els.closeModal.addEventListener("click",closeModal);
els.cancel.addEventListener("click",closeModal);
els.modal.addEventListener("click",(event) => { if (event.target === els.modal) closeModal(); });
document.addEventListener("keydown",(event) => { if (event.key === "Escape") closeModal(); });
els.logout.addEventListener("click",S.logout);

function renderAll() {
  projects = S.getProjects();
  renderToday();
  renderStats();
  renderProjects();
  renderActivity();
}

renderAll();
