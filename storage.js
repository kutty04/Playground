(function () {
  const KEYS = {
    USERS: "loopClubUsers",
    SESSION: "loopClubSession",
    REMEMBER: "loopClubRememberedEmail",
    PROJECTS: "loopClubProjects",
    PINS: "loopClubMoodboardItems",
    ACTIVITY: "loopClubActivity",
    SELECTED: "loopClubSelectedProject"
  };

  const MILESTONES = {
    25: "The idea has legs.",
    50: "Halfway through the beautiful chaos.",
    75: "Polish mode unlocked.",
    100: "SHIP IT."
  };

  const FOOTER_MESSAGES = [
    "MAKE IT WEIRD, THEN MAKE IT WORK.",
    "SMALL STEPS. LOUD IDEAS.",
    "PERFECT IS NOT INVITED.",
    "PIN THE FEELING. BUILD THE THING.",
    "A TINY MOVE STILL MOVES THE PROJECT.",
    "FINISHING IS A DESIGN SKILL."
  ];

  const STUCK_ACTIONS = [
    "Work on the smallest unfinished mission for ten minutes.",
    "Remove one feature the project does not truly need.",
    "Sketch three deliberately ugly versions before choosing one.",
    "Pick one moodboard pin and turn it into something visible.",
    "Write the project's goal in one sentence. Delete everything that fights it.",
    "Improve only the mobile version for the next fifteen minutes.",
    "Rename the next mission so it begins with a clear action verb.",
    "Open the oldest unfinished mission and make the first tiny change.",
    "Choose one colour, one font and one layout rule. Lock them in.",
    "Stop planning. Create the roughest possible first version."
  ];

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function id(prefix = "id") {
    return window.crypto?.randomUUID
      ? `${prefix}-${crypto.randomUUID()}`
      : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeUrl(value = "") {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function session() {
    return read(KEYS.SESSION, null);
  }

  function requireSession() {
    const current = session();
    if (!current?.email) {
      location.replace("index.html");
      return null;
    }
    return current;
  }

  function logout() {
    localStorage.removeItem(KEYS.SESSION);
    location.replace("index.html");
  }

  function starterProjects() {
    const now = new Date().toISOString();
    return [
      {
        id: "sample-portfolio",
        title: "Portfolio Redesign",
        description: "A bold editorial portfolio that feels personal, playful and impossible to confuse with a template.",
        status: "Building",
        deadline: "2026-08-15",
        technologies: ["HTML", "CSS", "JavaScript"],
        personality: "loud",
        createdAt: now,
        updatedAt: now,
        milestones: [25,50],
        notes: [
          { id: "note-p-1", text: "Keep every screen bold, warm and unmistakably personal.", createdAt: now }
        ],
        tasks: [
          { id: "task-p-1", title: "Choose the final colour palette", done: true, today: false, createdAt: now },
          { id: "task-p-2", title: "Design the login experience", done: true, today: false, createdAt: now },
          { id: "task-p-3", title: "Build the project page layout", done: true, today: false, createdAt: now },
          { id: "task-p-4", title: "Polish the mobile navigation", done: false, today: true, createdAt: now },
          { id: "task-p-5", title: "Test every link and interaction", done: false, today: false, createdAt: now }
        ]
      },
      {
        id: "sample-movie",
        title: "Movie Discovery App",
        description: "A cinematic recommendation space for finding hidden gems, chaotic favourites and perfect weekend watches.",
        status: "Spark",
        deadline: "",
        technologies: ["API", "JavaScript", "UI"],
        personality: "cinematic",
        createdAt: now,
        updatedAt: now,
        milestones: [],
        notes: [],
        tasks: [
          { id: "task-m-1", title: "Define the recommendation mood filters", done: true, today: false, createdAt: now },
          { id: "task-m-2", title: "Choose a movie data API", done: false, today: false, createdAt: now },
          { id: "task-m-3", title: "Sketch the discovery screen", done: false, today: false, createdAt: now },
          { id: "task-m-4", title: "Build a saved watchlist", done: false, today: false, createdAt: now },
          { id: "task-m-5", title: "Create the cinematic empty states", done: false, today: false, createdAt: now }
        ]
      }
    ];
  }

  function normalizeProject(project) {
    const p = { ...project };
    p.id = p.id || id("project");
    p.title = p.title || "Untitled Project";
    p.description = p.description || "A wonderfully unfinished idea.";
    p.status = p.status || "Spark";
    p.deadline = p.deadline || "";
    p.technologies = Array.isArray(p.technologies) ? p.technologies : [];
    p.personality = p.personality || "playful";
    p.createdAt = p.createdAt || new Date().toISOString();
    p.updatedAt = p.updatedAt || p.createdAt;
    p.milestones = Array.isArray(p.milestones) ? p.milestones : [];
    p.notes = Array.isArray(p.notes) ? p.notes : [];
    p.tasks = Array.isArray(p.tasks) ? p.tasks : [];
    p.legacyProgress = Number.isFinite(Number(p.legacyProgress))
      ? Number(p.legacyProgress)
      : Number(p.progress || 0);
    return p;
  }

  function getProjects() {
    let projects = read(KEYS.PROJECTS, null);
    if (!Array.isArray(projects)) {
      projects = starterProjects();
      write(KEYS.PROJECTS, projects);
    }
    const normalized = projects.map(normalizeProject);
    write(KEYS.PROJECTS, normalized);
    return normalized;
  }

  function saveProjects(projects) {
    return write(KEYS.PROJECTS, projects.map(normalizeProject));
  }

  function getProject(projectId) {
    return getProjects().find((project) => project.id === projectId) || null;
  }

  function upsertProject(project) {
    const projects = getProjects();
    const normalized = normalizeProject(project);
    const index = projects.findIndex((item) => item.id === normalized.id);
    if (index >= 0) projects[index] = normalized;
    else projects.unshift(normalized);
    saveProjects(projects);
    return normalized;
  }

  function deleteProject(projectId) {
    saveProjects(getProjects().filter((project) => project.id !== projectId));
    write(KEYS.PINS, getPins().filter((pin) => pin.projectId !== projectId));
    write(KEYS.ACTIVITY, getActivity().filter((item) => item.projectId !== projectId));
  }

  function calculateProgress(project) {
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
    if (!tasks.length) return Math.max(0, Math.min(100, Number(project?.legacyProgress || 0)));
    const done = tasks.filter((task) => task.done).length;
    return Math.round((done / tasks.length) * 100);
  }

  function nextMission(project) {
    return project?.tasks?.find((task) => task.today && !task.done)
      || project?.tasks?.find((task) => !task.done)
      || null;
  }

  function statusFromProgress(project) {
    const progress = calculateProgress(project);
    if (progress === 100) return "Shipped";
    if (project.status === "Shipped" && progress < 100) return "Polishing";
    return project.status;
  }

  function recordActivity(projectId, type, text) {
    const activity = getActivity();
    activity.unshift({
      id: id("activity"),
      projectId,
      type,
      text,
      at: new Date().toISOString()
    });
    write(KEYS.ACTIVITY, activity.slice(0, 300));
  }

  function getActivity(projectId = null) {
    const activity = read(KEYS.ACTIVITY, []);
    return projectId ? activity.filter((item) => item.projectId === projectId) : activity;
  }

  function addTask(projectId, title, sourcePinId = "") {
    const project = getProject(projectId);
    if (!project) return null;
    const task = {
      id: id("task"),
      title: title.trim(),
      done: false,
      today: false,
      sourcePinId,
      createdAt: new Date().toISOString()
    };
    project.tasks.push(task);
    project.legacyProgress = 0;
    project.updatedAt = new Date().toISOString();
    upsertProject(project);
    recordActivity(projectId, "task-added", `Added mission: ${task.title}`);
    return task;
  }

  function editTask(projectId, taskId, title) {
    const project = getProject(projectId);
    const task = project?.tasks?.find((item) => item.id === taskId);
    if (!task) return;
    task.title = title.trim();
    project.updatedAt = new Date().toISOString();
    upsertProject(project);
    recordActivity(projectId, "task-edited", `Updated mission: ${task.title}`);
  }

  function deleteTask(projectId, taskId) {
    const project = getProject(projectId);
    if (!project) return;
    const removed = project.tasks.find((task) => task.id === taskId);
    project.tasks = project.tasks.filter((task) => task.id !== taskId);
    project.updatedAt = new Date().toISOString();
    upsertProject(project);
    if (removed) recordActivity(projectId, "task-deleted", `Removed mission: ${removed.title}`);
  }

  function setTodayTask(projectId, taskId) {
    const projects = getProjects();
    projects.forEach((project) => {
      project.tasks.forEach((task) => { task.today = false; });
    });
    const project = projects.find((item) => item.id === projectId);
    const task = project?.tasks?.find((item) => item.id === taskId);
    if (task) {
      task.today = true;
      project.updatedAt = new Date().toISOString();
      recordActivity(projectId, "today", `Made "${task.title}" today's tiny move`);
    }
    saveProjects(projects);
    return task;
  }

  function getTodayTask() {
    for (const project of getProjects()) {
      const task = project.tasks.find((item) => item.today && !item.done);
      if (task) return { project, task };
    }
    for (const project of getProjects()) {
      const task = project.tasks.find((item) => !item.done);
      if (task) return { project, task };
    }
    return null;
  }

  function toggleTask(projectId, taskId) {
    const project = getProject(projectId);
    const task = project?.tasks?.find((item) => item.id === taskId);
    if (!task) return { project, milestone: null };

    const previous = calculateProgress(project);
    task.done = !task.done;
    if (task.done) task.today = false;
    project.updatedAt = new Date().toISOString();
    project.status = statusFromProgress(project);

    const next = calculateProgress(project);
    let milestone = null;
    for (const threshold of [25,50,75,100]) {
      if (previous < threshold && next >= threshold && !project.milestones.includes(threshold)) {
        project.milestones.push(threshold);
        milestone = { threshold, message: MILESTONES[threshold] };
      }
    }

    upsertProject(project);
    recordActivity(
      projectId,
      task.done ? "task-complete" : "task-reopened",
      `${task.done ? "Completed" : "Reopened"} mission: ${task.title}`
    );
    if (milestone) recordActivity(projectId, "milestone", `${milestone.threshold}% reached — ${milestone.message}`);
    return { project, milestone };
  }

  function addNote(projectId, text) {
    const project = getProject(projectId);
    if (!project) return;
    project.notes.unshift({ id: id("note"), text: text.trim(), createdAt: new Date().toISOString() });
    project.updatedAt = new Date().toISOString();
    upsertProject(project);
    recordActivity(projectId, "note", "Added a project note");
  }

  function deleteNote(projectId, noteId) {
    const project = getProject(projectId);
    if (!project) return;
    project.notes = project.notes.filter((note) => note.id !== noteId);
    upsertProject(project);
    recordActivity(projectId, "note-deleted", "Removed a project note");
  }

  function starterPins() {
    const now = new Date().toISOString();
    return [
      {
        id: "pin-p-1", projectId: "sample-portfolio", type: "note",
        title: "Design rule", content: "Oversized editorial typography, thick borders and zero generic glass cards.",
        x: 35, y: 45, w: 300, h: 210, rotation: -2, z: 3, pinned: true, locked: false, createdAt: now
      },
      {
        id: "pin-p-2", projectId: "sample-portfolio", type: "color",
        title: "Hero orange", color: "#ff6038",
        x: 380, y: 70, w: 250, h: 260, rotation: 2, z: 2, pinned: false, locked: false, createdAt: now
      },
      {
        id: "pin-p-3", projectId: "sample-portfolio", type: "decision",
        title: "Visual identity", content: "Poster energy, warm paper, hard shadows and asymmetry are officially locked in.",
        x: 675, y: 45, w: 360, h: 240, rotation: -1, z: 4, pinned: true, locked: true, createdAt: now
      },
      {
        id: "pin-p-4", projectId: "sample-portfolio", type: "feature",
        title: "Project cards", content: "Cards should flip to reveal the next mission, recent activity and moodboard count.",
        x: 95, y: 360, w: 340, h: 220, rotation: 1, z: 2, pinned: false, locked: false, createdAt: now
      },
      {
        id: "pin-m-1", projectId: "sample-movie", type: "quote",
        title: "Atmosphere", content: "The interface should feel like walking into a tiny independent cinema at midnight.",
        x: 45, y: 55, w: 350, h: 230, rotation: -2, z: 2, pinned: true, locked: false, createdAt: now
      },
      {
        id: "pin-m-2", projectId: "sample-movie", type: "color",
        title: "Cinema red", color: "#b7282e",
        x: 455, y: 85, w: 260, h: 250, rotation: 2, z: 1, pinned: false, locked: false, createdAt: now
      }
    ];
  }

  function normalizePin(pin) {
    return {
      id: pin.id || id("pin"),
      projectId: pin.projectId,
      type: pin.type || "note",
      title: pin.title || "Untitled pin",
      content: pin.content || "",
      url: pin.url || "",
      color: pin.color || "#ff8fa3",
      font: pin.font || "Georgia",
      x: Number(pin.x ?? 35),
      y: Number(pin.y ?? 35),
      w: Number(pin.w ?? 280),
      h: Number(pin.h ?? 200),
      rotation: Number(pin.rotation ?? 0),
      z: Number(pin.z ?? 1),
      pinned: Boolean(pin.pinned),
      locked: Boolean(pin.locked),
      newCleared: Boolean(pin.newCleared),
      createdAt: pin.createdAt || new Date().toISOString(),
      updatedAt: pin.updatedAt || pin.createdAt || new Date().toISOString()
    };
  }

  function getPins(projectId = null) {
    let pins = read(KEYS.PINS, null);
    if (!Array.isArray(pins)) {
      pins = starterPins();
      write(KEYS.PINS, pins);
    }
    const normalized = pins.map(normalizePin);
    write(KEYS.PINS, normalized);
    return projectId ? normalized.filter((pin) => pin.projectId === projectId) : normalized;
  }

  function upsertPin(pin) {
    const pins = getPins();
    const normalized = normalizePin(pin);
    const index = pins.findIndex((item) => item.id === normalized.id);
    if (index >= 0) pins[index] = normalized;
    else pins.unshift(normalized);
    write(KEYS.PINS, pins);
    return normalized;
  }

  function deletePin(pinId) {
    const pins = getPins();
    const pin = pins.find((item) => item.id === pinId);
    write(KEYS.PINS, pins.filter((item) => item.id !== pinId));
    if (pin) recordActivity(pin.projectId, "pin-deleted", `Removed moodboard pin: ${pin.title}`);
  }

  function formatDate(value, options = {}) {
    if (!value) return "No deadline";
    const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: options.short ? undefined : "numeric"
    });
  }

  function deadlineState(deadline) {
    if (!deadline) return { label: "No deadline", urgent: false, overdue: false, days: null };
    const due = new Date(`${deadline}T23:59:59`);
    const diff = Math.ceil((due - new Date()) / 86400000);
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, urgent: true, overdue: true, days: diff };
    if (diff === 0) return { label: "Due today", urgent: true, overdue: false, days: 0 };
    if (diff <= 7) return { label: `${diff}d left`, urgent: true, overdue: false, days: diff };
    return { label: `Due ${formatDate(deadline)}`, urgent: false, overdue: false, days: diff };
  }

  function isNew(value) {
    const date = new Date(value);
    return Date.now() - date.getTime() < 24 * 60 * 60 * 1000;
  }

  function personalityLabel(value) {
    return {
      loud: "⚡ Loud & Experimental",
      calm: "🌿 Calm & Minimal",
      cinematic: "🎬 Cinematic",
      playful: "🧃 Playful",
      technical: "🧠 Technical"
    }[value] || "🧃 Playful";
  }

  function statusColor(status) {
    return {
      Spark: "#ffd84d",
      Sketching: "#ff8fa3",
      Building: "#9be8c7",
      Polishing: "#ff6038",
      Shipped: "#3155ff"
    }[status] || "#ffd84d";
  }

  function selectedProjectId() {
    return new URLSearchParams(location.search).get("project")
      || localStorage.getItem(KEYS.SELECTED);
  }

  function selectProject(projectId) {
    localStorage.setItem(KEYS.SELECTED, projectId);
  }

  function openProject(projectId, page = "project.html") {
    selectProject(projectId);
    location.href = `${page}?project=${encodeURIComponent(projectId)}`;
  }

  function setFooterRotation(element) {
    if (!element) return;
    let index = Math.floor(Math.random() * FOOTER_MESSAGES.length);
    element.textContent = FOOTER_MESSAGES[index];
    setInterval(() => {
      element.style.opacity = "0";
      setTimeout(() => {
        index = (index + 1) % FOOTER_MESSAGES.length;
        element.textContent = FOOTER_MESSAGES[index];
        element.style.opacity = "1";
      }, 220);
    }, 4200);
  }

  function randomStuckAction() {
    return STUCK_ACTIONS[Math.floor(Math.random() * STUCK_ACTIONS.length)];
  }

  function showToast(element, message, milestone = false) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("milestone", milestone);
    element.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      element.classList.remove("show", "milestone");
    }, milestone ? 3300 : 2200);
  }

  function confetti(count = 54) {
    const colors = ["#ff6038","#ffd84d","#ff8fa3","#3155ff","#9be8c7","#aa8cff"];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--sx", `${(Math.random() - .5) * 120}px`);
      piece.style.setProperty("--ex", `${(Math.random() - .5) * 380}px`);
      piece.style.setProperty("--spin", `${Math.random() * 1000 - 500}deg`);
      piece.style.animationDelay = `${Math.random() * .3}s`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 1800);
    }
  }

  window.LoopStore = {
    KEYS, MILESTONES, FOOTER_MESSAGES,
    read, write, id, escapeHtml, safeUrl,
    session, requireSession, logout,
    getProjects, saveProjects, getProject, upsertProject, deleteProject,
    calculateProgress, nextMission, statusFromProgress,
    addTask, editTask, deleteTask, toggleTask, setTodayTask, getTodayTask,
    addNote, deleteNote,
    getPins, upsertPin, deletePin,
    recordActivity, getActivity,
    formatDate, deadlineState, isNew, personalityLabel, statusColor,
    selectedProjectId, selectProject, openProject,
    setFooterRotation, randomStuckAction, showToast, confetti
  };
})();
