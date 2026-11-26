import {
  UNASSIGNED, STORAGE_KEY, LEGACY_STORAGE_KEY, PROJECT_COLORS, PERSON_COLORS, TYPE_COLORS,
  localDate, dateAt, addDays, monthOf, offsetMonth, monthWeeks, calendarMonthOf, shortDate, participants,
  scopeTasks, setTaskDate, duplicateTask, seedWorkspace, migrateWorkspace,
} from "./model.js";

const icons = {
  logo: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18m-13-7v4m8-4v4"/><rect x="12" y="13" width="5" height="5" rx="1" fill="currentColor" stroke="none"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18m-13-7v4m8-4v4m-7 8h1m4 0h1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  tag: '<path d="M12.5 3H5a2 2 0 0 0-2 2v7.5l8.4 8.4a2 2 0 0 0 2.8 0l6.7-6.7a2 2 0 0 0 0-2.8z"/><circle cx="7.5" cy="7.5" r="1"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M16 5a3 3 0 0 1 0 6m3 9v-2a5 5 0 0 0-3-4"/>',
  columns: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14m6-14v14"/>',
  rows: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M3 14h18"/>',
  left: '<path d="m14 6-6 6 6 6"/>',
  right: '<path d="m10 6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  move: '<path d="M12 3v18M3 12h18m-12-6 3-3 3 3m-9 3-3 3 3 3m3 3 3 3 3-3m3-9 3 3-3 3"/>',
  device: '<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  pen: '<path d="m12 19 7-7-7-7-7 7-2 9 9-2Zm0-14 2-2a1.5 1.5 0 0 1 2 0l5 5a1.5 1.5 0 0 1 0 2l-2 2M3 21l6-6"/><circle cx="10" cy="14" r="1"/>',
  diamond: '<path d="m12 3 8 9-8 9-8-9 8-9Z"/>',
  circle: '<path d="M20 12c0 5-3 8-8 8s-8-3-8-8 3-8 8-8 8 3 8 8Z"/>',
  bulb: '<path d="M9 17v-2a6 6 0 1 1 6 0v2m-6 0h6m-5 4h4"/>',
  flask: '<path d="M9 3h6m-5 0v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3L14 9V3m-6 12h8"/>',
  flag: '<path d="M5 21V4c5-3 9 4 14 1v9c-5 3-9-4-14-1"/>',
  review: '<path d="M20 4H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4v3l4-3h8a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Zm-12 7 3 3 5-5"/>',
  star: '<path d="m12 3 2.6 5.6 6.1.8-4.5 4.4 1 6.1-5.2-3-5.4 3 1-6.1-4.5-4.4 6.1-.8L12 3Z"/>',
  spark: '<path d="M12 2c0 6-4 10-10 10 6 0 10 4 10 10 0-6 4-10 10-10-6 0-10-4-10-10Z"/>',
};

const typeIcons = {
  diamond: "菱形", circle: "圆点", bulb: "灯泡", flask: "烧瓶", flag: "旗帜",
  review: "反馈", star: "星星", spark: "闪光", pen: "笔尖", tag: "标签",
};
const defaultTypeIcons = { milestone: "diamond", todo: "circle", design: "bulb", test: "flask", launch: "flag", review: "review" };
const APPEARANCE_KEY = "timeboard.appearance";
const HANDWRITING_FONT_KEY = "timeboard.handwriting-font";
const BATCH_COPY_LIMIT = 366;

const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const $ = selector => document.querySelector(selector);
const board = $("#board");
const scroller = $("#board-scroll");
const pages = $("#calendar-pages");
const weekdayHeader = $("#calendar-weekdays");
const dialog = $("#editor");
const dialogContent = $("#editor-content");
const copyDialog = $("#copy-editor");
const scopeSelect = $("#scope");
const typeSelect = $("#type-filter");
const handwritingFontSelect = $("#handwriting-font");
const toast = $("#toast");
const today = () => localDate();
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

let storageAvailable = true;
let state = loadWorkspace();
let month = calendarMonthOf(today());
let firstMonth = offsetMonth(month, -1);
let lastMonth = offsetMonth(month, 2);
let appearance = loadAppearance();
let axis = "project";
let layout = "merged";
let typeFilter = "";
const scopes = { project: "", person: "" };
const collapsedGroups = new Set();
let draggingId = "";
let toastTimer;
let returnFocus;
let scrollFrame = 0;

function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) return migrateWorkspace(JSON.parse(saved));
  } catch {
    storageAvailable = false;
  }
  return seedWorkspace(today());
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}

function loadPreference(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The selection still applies while this page is open.
  }
}

function loadAppearance() {
  return loadPreference(APPEARANCE_KEY) === "handwritten" ? "handwritten" : "minimal";
}

function loadHandwritingFont() {
  const options = [...handwritingFontSelect.options];
  const value = loadPreference(HANDWRITING_FONT_KEY, options[0].value);
  return options.some(option => option.value === value) ? value : options[0].value;
}

function escapeHtml(value) {
  const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, character => replacements[character]);
}

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

function avatar(name) {
  const characters = Array.from(name);
  const tone = characters.reduce((total, character) => total + character.codePointAt(0), 0) % PERSON_COLORS.length;
  return `<span class="avatar" style="--person-bg:${PERSON_COLORS[tone]}" aria-hidden="true">${escapeHtml(characters[0])}</span>`;
}

function projectDot(project) {
  return `<span class="project-dot" style="--project-color:${PROJECT_COLORS[project?.color] ?? PROJECT_COLORS[0]}" aria-hidden="true"></span>`;
}

function option(value, label, selected) {
  return `<option value="${escapeHtml(value)}"${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function projectOptions(selected, includeBusinesses = false) {
  const businesses = [...new Set(state.projects.map(project => project.business))];
  return businesses.map(business => {
    const selection = state.projects.filter(project => project.business === business).map(project => {
      const value = includeBusinesses ? `project:${project.id}` : project.id;
      return option(value, project.name, selected === value);
    });
    if (includeBusinesses) selection.unshift(option(`business:${business}`, `全部${business}项目`, selected === `business:${business}`));
    return `<optgroup label="${escapeHtml(business)}">${selection.join("")}</optgroup>`;
  }).join("");
}

function typeStyle(colorId) {
  const color = TYPE_COLORS[colorId] ?? TYPE_COLORS.slate;
  return `--type-bg:${color.background};--type-ink:${color.ink};--type-accent:${color.accent}`;
}

function typeTag(type) {
  return `<span class="type-tag" title="${escapeHtml(type?.name ?? "未分类")}" style="${typeStyle(type?.color)}">${escapeHtml(type?.name ?? "未分类")}</span>`;
}

function typeIconName(type) {
  if (Object.hasOwn(typeIcons, type?.icon)) return type.icon;
  if (Object.hasOwn(defaultTypeIcons, type?.id)) return defaultTypeIcons[type.id];
  const choices = ["star", "spark", "pen", "tag"];
  const index = [...(type?.id ?? "")].reduce((sum, character) => sum + character.codePointAt(0), 0);
  return choices[index % choices.length];
}

function memberLabel(person) {
  return [person.name, person.team, person.archived ? "已归档" : ""].filter(Boolean).join(" · ");
}

function visibleMembers(taskList) {
  const assigned = new Set(taskList.flatMap(participants));
  return state.people.filter(person => !person.archived || assigned.has(person.id));
}

function renderScope() {
  const scope = scopes[axis];
  if (axis === "project") {
    scopeSelect.innerHTML = option("", "全部项目", !scope) + projectOptions(scope, true);
    scopeSelect.setAttribute("aria-label", "筛选项目或业务");
    $("#scope-icon").innerHTML = icon("folder");
  } else {
    const people = visibleMembers(state.tasks);
    let options = option("", "全部人员", !scope);
    for (const person of people) options += option(`person:${person.id}`, memberLabel(person), scope === `person:${person.id}`);
    if (state.tasks.some(task => !participants(task).length)) {
      options += option("unassigned:", UNASSIGNED, scope === "unassigned:");
    }
    scopeSelect.innerHTML = options;
    scopeSelect.setAttribute("aria-label", "筛选人员");
    $("#scope-icon").innerHTML = icon("users");
  }
  scopes[axis] = scopeSelect.value;
  document.querySelectorAll("[data-axis]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.axis === axis)));
  document.querySelectorAll("[data-layout]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.layout === layout)));
  $("#project-shortcuts").innerHTML = state.projects.length ? `<p class="sidebar-label">项目快捷筛选</p>${state.projects.map(project => `
    <button class="nav-button" type="button" data-project-shortcut="${escapeHtml(project.id)}" aria-pressed="${axis === "project" && scopes.project === `project:${project.id}`}" title="${escapeHtml(project.business)}">${projectDot(project)}<span>${escapeHtml(project.name)}</span></button>`).join("")}` : "";
}

function monthLabel(value) {
  const date = dateAt(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function renderControls(allTasks) {
  const end = offsetMonth(month, 1);
  const tasks = allTasks.filter(task => task.date >= month && task.date < end);
  const businesses = new Set(state.projects.map(project => project.business));
  const memberCount = state.people.filter(person => !person.archived).length;
  const summary = [`${businesses.size} 个业务`, `${state.projects.length} 个项目`, `${memberCount} 位成员`];
  $("#workspace-summary").innerHTML = summary.map(label => `<span>${label}</span>`).join('<span class="summary-dot" aria-hidden="true"></span>');
  const done = tasks.filter(task => task.done).length;
  $("#progress").innerHTML = `<span>本月完成</span><strong>${done} / ${tasks.length}</strong>
    <progress class="progress-bar" value="${done}" max="${tasks.length || 1}" aria-label="本月完成进度"></progress>`;
  $("#month-title").textContent = monthLabel(month);
  const storage = `${icon("device")}<span>${storageAvailable ? "数据保存在此浏览器" : "浏览器存储不可用，刷新可能丢失更改"}</span>`;
  $("#storage-status").innerHTML = storage;
  $("#footer-storage").innerHTML = storage;

  const usedTypes = new Set(state.tasks.map(task => task.typeId));
  const types = state.types.filter(type => !type.archived || usedTypes.has(type.id));
  const counts = new Map();
  for (const task of tasks) counts.set(task.typeId, (counts.get(task.typeId) ?? 0) + 1);
  typeSelect.innerHTML = option("", `全部类型 · ${tasks.length}`, !typeFilter) + types.map(type =>
    option(type.id, `${type.name}${type.archived ? "（已归档）" : ""} · ${counts.get(type.id) ?? 0}`, typeFilter === type.id)).join("");
  typeFilter = typeSelect.value;
}

function taskCard(task, lookups, personId) {
  const project = lookups.projects.get(task.projectId);
  const type = lookups.types.get(task.typeId);
  const latestMove = task.moves.at(-1);
  const delayed = latestMove && task.date > latestMove.from;
  const owner = lookups.people.get(task.ownerId);
  const collaboratorNames = task.collaboratorIds.map(id => lookups.people.get(id)?.name).filter(Boolean);
  const person = lookups.people.get(personId) ?? owner ?? lookups.people.get(task.collaboratorIds[0]);
  const people = [owner ? `负责人 ${owner.name}` : "", collaboratorNames.length ? `协作人 ${collaboratorNames.join("、")}` : ""].filter(Boolean).join(" · ");
  return `<article class="task-card${task.done ? " is-done" : ""}" style="${typeStyle(type?.color)}" data-task-id="${escapeHtml(task.id)}" draggable="true">
    <div class="card-main">
      <button class="task-check" data-complete="${escapeHtml(task.id)}" type="button" aria-pressed="${task.done}" aria-label="${escapeHtml(`${task.done ? "标为未完成" : "标为完成"} ${task.title}`)}" title="${escapeHtml(type?.name ?? "未分类")}">
        <span class="completion-mark">${task.done ? icon("check") : ""}</span><span class="paper-glyph">${icon(typeIconName(type))}</span>
      </button>
      <button class="task-title" type="button" data-open="${escapeHtml(task.id)}">${escapeHtml(task.title)}</button>
      <button class="task-copy" type="button" data-copy="${escapeHtml(task.id)}" aria-label="复制 ${escapeHtml(task.title)}" title="复制到日期">${icon("copy")}</button>
    </div>
    <div class="card-meta">
      <span class="card-tags">${typeTag(type)}
      ${delayed ? `<span class="delay-tag" title="原定 ${latestMove.from}">延期</span>` : ""}</span>
      <span class="task-project" title="${escapeHtml(project ? `${project.business} · ${project.name}` : "")}">${projectDot(project)}<span>${escapeHtml(project?.name ?? "未指定项目")}</span></span>
      ${person ? `<span class="task-person" title="${escapeHtml(people)}" aria-label="${escapeHtml(people)}">${avatar(person.name)}</span>` : ""}
    </div>
  </article>`;
}

function calendar(weeks, tasks, lookups, groupKey = "", group) {
  const tasksByDay = new Map();
  for (const task of tasks) {
    if (!tasksByDay.has(task.date)) tasksByDay.set(task.date, []);
    tasksByDay.get(task.date).push(task);
  }
  const now = today();
  return weeks.map(week => `<div class="board-row calendar-week" data-week="${week[0]}" data-anchor="${escapeHtml(groupKey + "/" + week[0])}">${week.map((date, index) => {
    const isToday = date === now;
    const day = dateAt(date);
    const startsMonth = day.getDate() === 1;
    const buttons = (tasksByDay.get(date) ?? []).map(task => taskCard(task, lookups, group?.personId));
    return `<div class="day-cell${index > 4 ? " is-weekend" : ""}${isToday ? " is-today" : ""}" data-date="${date}">
      <div class="day-head"><span class="date-label"><time class="date-number" datetime="${date}" aria-label="${date}"${isToday ? ' aria-current="date"' : ""}>${day.getDate()}</time>
        ${isToday ? '<span class="today-label">今天</span>' : startsMonth ? `<span class="day-month">${day.getMonth() + 1}月</span>` : ""}</span>
        <button class="day-add" type="button" data-add="${date}" data-project="${escapeHtml(group?.projectId)}" data-person="${escapeHtml(group?.personId)}" aria-label="添加 ${shortDate(date)}${group ? ` · ${escapeHtml(group.name)}` : ""} 的事项">${icon("plus")}</button>
      </div>${buttons.join("")}
    </div>`;
  }).join("")}</div>`).join("");
}

function activeGroups(allTasks) {
  const scope = scopes[axis];
  if (axis === "project") {
    const projects = state.projects.filter(project => !scope || scope === `project:${project.id}` || scope === `business:${project.business}`);
    return projects.map(project => ({
      id: `project:${project.id}`, name: project.name, context: project.business, marker: projectDot(project), projectId: project.id,
      matches: task => task.projectId === project.id,
    }));
  }
  const people = visibleMembers(allTasks).filter(person => !scope || scope === `person:${person.id}`);
  const groups = people.map(person => ({
    id: `person:${person.id}`, name: person.name, context: person.team, personId: person.id, marker: avatar(person.name),
    matches: task => participants(task).includes(person.id),
  }));
  if ((!scope || scope === "unassigned:") && allTasks.some(task => !participants(task).length)) {
    groups.push({ id: "unassigned:", name: UNASSIGNED, marker: icon("users"), matches: task => !participants(task).length });
  }
  return groups;
}

let calendarView;

function monthSection(value) {
  const { filtered, groups, lookups } = calendarView;
  const weeks = monthWeeks(value);
  const start = weeks[0][0];
  const end = weeks.at(-1).at(-1);
  const matching = filtered.filter(task => task.date >= start && task.date <= end);
  const content = groups.length ? groups.map(group => {
    const tasks = matching.filter(group.matches);
    const groupKey = value + "/" + group.id;
    return `<details class="group" data-group-key="${escapeHtml(groupKey)}"${collapsedGroups.has(groupKey) ? "" : " open"}>
      <summary class="group-heading"><span class="disclosure">${icon("right")}</span>${group.marker}<span>${escapeHtml(group.name)}</span>
        ${group.context ? `<span class="group-context">${escapeHtml(group.context)}</span>` : ""}
        <span class="group-count">${tasks.length} 项</span></summary>
      ${calendar(weeks, tasks, lookups, groupKey, group)}
    </details>`;
  }).join("") : calendar(weeks, matching, lookups);
  return `<section class="calendar-month" data-month="${value}" aria-label="${monthLabel(value)}">
    <h3 class="calendar-month-label">${monthLabel(value)}</h3>${content}</section>`;
}

function calendarTop() {
  return scroller.getBoundingClientRect().top + scroller.clientTop + weekdayHeader.offsetHeight;
}

function currentWeekAnchor() {
  const top = calendarTop();
  const row = [...pages.querySelectorAll("[data-anchor]")].find(element => element.getBoundingClientRect().bottom > top);
  if (!row) return null;
  return { key: row.dataset.anchor, week: row.dataset.week, offset: row.getBoundingClientRect().top - top };
}

function restoreWeekAnchor(anchor) {
  if (!anchor) return;
  const row = pages.querySelector(`[data-anchor="${CSS.escape(anchor.key)}"]`)
    ?? [...pages.querySelectorAll(`[data-week="${CSS.escape(anchor.week)}"]`)].find(element => element.offsetHeight > 0);
  if (row?.offsetHeight) scroller.scrollTop += row.getBoundingClientRect().top - calendarTop() - anchor.offset;
}

function render(preserveAnchor = true) {
  const anchor = preserveAnchor ? currentWeekAnchor() : null;
  renderScope();
  const allTasks = scopeTasks(state.tasks, state.projects, axis, scopes[axis]);
  renderControls(allTasks);
  calendarView = {
    allTasks,
    filtered: typeFilter ? allTasks.filter(task => task.typeId === typeFilter) : allTasks,
    groups: layout === "grouped" ? activeGroups(allTasks) : [],
    lookups: {
      projects: new Map(state.projects.map(project => [project.id, project])),
      people: new Map(state.people.map(person => [person.id, person])),
      types: new Map(state.types.map(type => [type.id, type])),
    },
  };
  const sections = [];
  for (let value = firstMonth; value <= lastMonth; value = offsetMonth(value, 1)) {
    sections.push(monthSection(value));
  }
  pages.innerHTML = sections.join("");
  restoreWeekAnchor(anchor);
}

function activeDate() {
  if (monthOf(today()) === month) return today();
  const week = currentWeekAnchor()?.week;
  return week && monthOf(week) === month ? week : month;
}

function ensureMonth(value) {
  if (value >= firstMonth && value <= lastMonth) return;
  firstMonth = offsetMonth(value, -1);
  lastMonth = offsetMonth(value, 2);
  render(false);
}

function updateVisibleMonth() {
  const sections = [...pages.children];
  const top = calendarTop() + 34;
  const active = sections.findLast(section => section.getBoundingClientRect().top <= top) ?? sections[0];
  if (active && active.dataset.month !== month) {
    month = active.dataset.month;
    renderControls(calendarView.allTasks);
  }
}

function revealDate(date, taskId = "", alwaysAlign = true) {
  ensureMonth(calendarMonthOf(date));
  const cell = taskId
    ? pages.querySelector(`[data-open="${CSS.escape(taskId)}"]`)?.closest(".day-cell")
    : pages.querySelector(`[data-date="${CSS.escape(date)}"]`);
  if (!cell) return;
  const group = cell.closest(".group");
  if (group) group.open = true;
  const bounds = cell.getBoundingClientRect();
  const top = calendarTop();
  const viewport = scroller.getBoundingClientRect();
  if (alwaysAlign || bounds.top < top || bounds.top + Math.min(bounds.height, 58) > viewport.bottom) {
    scroller.scrollTop += bounds.top - top - 5;
  }
  if (bounds.left < viewport.left || bounds.right > viewport.right) {
    scroller.scrollLeft += bounds.left - viewport.left - (scroller.clientWidth - cell.clientWidth) / 2;
  }
  if (taskId) cell.querySelector(`[data-open="${CSS.escape(taskId)}"]`)?.focus({ preventScroll: true });
  updateVisibleMonth();
}

function changeMonth(value) {
  ensureMonth(value);
  const section = pages.querySelector(`[data-month="${CSS.escape(value)}"]`);
  if (section) scroller.scrollTop += section.getBoundingClientRect().top - calendarTop();
  updateVisibleMonth();
}

function extendCalendar() {
  if (!calendarView || !scroller.clientHeight) return;
  if (scroller.scrollTop < 210) {
    firstMonth = offsetMonth(firstMonth, -1);
    const previousHeight = scroller.scrollHeight;
    pages.insertAdjacentHTML("afterbegin", monthSection(firstMonth));
    scroller.scrollTop += scroller.scrollHeight - previousHeight;
  }
  if (scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 440) {
    lastMonth = offsetMonth(lastMonth, 1);
    pages.insertAdjacentHTML("beforeend", monthSection(lastMonth));
  }
  updateVisibleMonth();
}

function applyAppearance(value, save = false) {
  const anchor = currentWeekAnchor();
  appearance = value;
  if (value === "handwritten") document.documentElement.dataset.style = value;
  else delete document.documentElement.dataset.style;
  $("#handwriting-font-control").hidden = value !== "handwritten";
  document.querySelectorAll("[data-appearance]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.appearance === value));
  });
  restoreWeekAnchor(anchor);
  if (save) savePreference(APPEARANCE_KEY, value);
}

function applyHandwritingFont(value, save = false) {
  const anchor = currentWeekAnchor();
  document.documentElement.dataset.handwritingFont = value;
  handwritingFontSelect.value = value;
  restoreWeekAnchor(anchor);
  if (save) savePreference(HANDWRITING_FONT_KEY, value);
}

function showToast(message, undo) {
  clearTimeout(toastTimer);
  toast.innerHTML = `<span>${escapeHtml(message)}</span>${undo ? '<button type="button">撤销</button>' : ""}`;
  toast.hidden = false;
  if (undo) toast.querySelector("button").addEventListener("click", () => {
    undo();
    persist();
    render();
    showToast("已撤销");
  }, { once: true });
  toastTimer = setTimeout(() => { toast.hidden = true; }, undo ? 8000 : 3800);
}

function showDialog(title, body, actions, formId = "") {
  const content = `<div class="dialog-head"><h2 id="dialog-title">${title}</h2>
    <button type="button" class="icon-button" data-dialog-close aria-label="关闭">${icon("close")}</button></div>
    <div class="dialog-body">${body}</div><div class="dialog-actions">${actions}</div>`;
  dialogContent.innerHTML = formId ? `<form id="${formId}">${content}</form>` : content;
  if (!dialog.open) {
    returnFocus = document.activeElement;
    dialog.showModal();
  }
  (dialogContent.querySelector("[autofocus]") ?? dialogContent.querySelector("[data-dialog-close]"))?.focus();
}

function closeDialog() {
  if (dialog.open) dialog.close();
}

function retainFocus(fallback = "#new-item") {
  if (returnFocus?.isConnected) returnFocus.focus();
  else $(fallback)?.focus();
}

function defaultProject() {
  const scope = scopes.project;
  if (axis === "project" && scope.startsWith("project:")) return scope.slice("project:".length);
  if (axis === "project" && scope.startsWith("business:")) {
    return state.projects.find(project => project.business === scope.slice("business:".length))?.id;
  }
  return state.projects[0]?.id;
}


function openCopy(task) {
  const nextDate = addDays(task.date, 1);
  copyDialog.innerHTML = `<form id="copy-form">
    <div class="dialog-head"><h2 id="copy-title">复制到日期</h2>
      <button class="icon-button" type="button" data-copy-close aria-label="关闭复制">${icon("close")}</button></div>
    <div class="dialog-body editor-fields">
      <p class="copy-subject">${escapeHtml(task.title)}</p>
      <div class="field-row">
        <label class="field">目标日期<input name="start" type="date" min="1900-01-01" max="9999-12-31" value="${nextDate}" required autofocus></label>
        <label class="field">结束日期（选填）<input name="end" type="date" min="${nextDate}" max="9999-12-31"></label>
      </div>
      <p class="empty-message">填写结束日期可复制到连续几天。每份副本都从未完成开始。</p>
    </div>
    <div class="dialog-actions"><div class="actions-right">
      <button class="button" type="button" data-copy-close>取消</button><button class="button primary" type="submit">复制事项</button>
    </div></div>
  </form>`;
  copyDialog.showModal();
  const form = $("#copy-form");
  const { start, end } = form.elements;
  form.addEventListener("input", () => {
    end.min = start.value;
    end.setCustomValidity("");
  });
  form.querySelectorAll("[data-copy-close]").forEach(button => {
    button.addEventListener("click", () => copyDialog.close());
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const lastDate = end.value || start.value;
    const days = Math.round((dateAt(lastDate) - dateAt(start.value)) / 86400000) + 1;
    if (days > BATCH_COPY_LIMIT) {
      end.setCustomValidity(`一次最多复制 ${BATCH_COPY_LIMIT} 天。`);
      end.reportValidity();
      return;
    }
    const copies = Array.from({ length: days }, (_, index) => duplicateTask(task, addDays(start.value, index), newId()));
    const ids = new Set(copies.map(copy => copy.id));
    state.tasks = [...state.tasks, ...copies];
    copyDialog.close();
    closeDialog();
    persist();
    render();
    revealDate(copies[0].date, copies[0].id, false);
    showToast(days === 1 ? `已复制到 ${shortDate(start.value)}` : `已复制到 ${days} 天`, () => {
      state.tasks = state.tasks.filter(entry => !ids.has(entry.id));
    });
  });
}

function openTask(existing, defaults = {}) {
  const date = defaults.date || activeDate();
  const scope = scopes.person;
  const selectedPerson = axis === "person" && scope.startsWith("person:") ? scope.slice("person:".length) : "";
  const proposedOwner = defaults.person || selectedPerson;
  const defaultOwner = state.people.find(person => person.id === proposedOwner && !person.archived)?.id ?? "";
  if (!state.projects.length) {
    openProjectEditor(null, { date, person: defaultOwner });
    return;
  }
  const enabledTypes = state.types.filter(type => !type.archived);
  const defaultType = enabledTypes.find(type => type.id === typeFilter) ?? enabledTypes.find(type => type.id === "todo") ?? enabledTypes[0];
  const item = existing ?? {
    title: "", projectId: defaults.project || defaultProject(), typeId: defaultType.id,
    date, ownerId: defaultOwner, collaboratorIds: [], notes: "", moves: [], done: false,
  };
  const people = visibleMembers([item]);
  const ownerOptions = option("", "未分配负责人", !item.ownerId) + people.map(person =>
    option(person.id, memberLabel(person), item.ownerId === person.id)).join("");
  const collaboratorOptions = people.map(person => `<label class="people-option">
    <input type="checkbox" name="collaboratorIds" value="${escapeHtml(person.id)}"${item.collaboratorIds.includes(person.id) ? " checked" : ""}>
    <span>${escapeHtml(memberLabel(person))}</span></label>`).join("");
  const typeOptions = state.types.filter(type => !type.archived || type.id === item.typeId).map(type =>
    option(type.id, type.name + (type.archived ? "（已归档）" : ""), item.typeId === type.id)).join("");
  const history = item.moves.length ? `<details class="delay-history"><summary>改期记录（${item.moves.length}）</summary><ul>${item.moves.map(move =>
    `<li><time datetime="${move.from}">${move.from}</time> 改至 <time datetime="${move.to}">${move.to}</time></li>`).join("")}</ul></details>` : "";
  const body = `<div class="editor-fields">
    <label class="field">事项名称<input name="title" value="${escapeHtml(item.title)}" maxlength="100" placeholder="例如：完成灰度上线验证" required autofocus></label>
    <div class="field-row">
      <label class="field">项目<span class="select-wrap"><select name="projectId" required>${projectOptions(item.projectId)}</select></span></label>
      <label class="field">计划日期<input name="date" type="date" value="${item.date}" min="1900-01-01" max="9999-12-31" required></label>
    </div>
    <label class="field">事项类型<span class="select-wrap"><select name="typeId" required>${typeOptions}</select></span></label>
    <div class="field-row">
      <label class="field">负责人<span class="select-wrap"><select name="ownerId">${ownerOptions}</select></span></label>
      <div class="field picker-field">
        <span id="collaborators-label">协作人</span>
        <details class="people-picker">
          <summary aria-labelledby="collaborators-label collaborator-summary"><span id="collaborator-summary">选择协作人</span><span class="disclosure">${icon("right")}</span></summary>
          <div class="people-list">${collaboratorOptions}<p id="no-collaborators" class="empty-message" hidden>${people.length ? "暂无其他可选人员" : "在「人员」中添加成员后即可选择。"}</p></div>
        </details>
      </div>
    </div>
    <label class="field">备注<textarea name="notes" maxlength="2000" placeholder="记录进展或完成后的补充信息">${escapeHtml(item.notes)}</textarea></label>
    ${existing ? `<div class="reschedule"><span class="group-context">快捷改期</span><button type="button" class="button" data-postpone="1">延期一天</button><button type="button" class="button" data-postpone="7">延期一周</button></div>${history}` : ""}
  </div>`;
  const actions = `${existing ? `<div class="actions-left"><button class="button text-danger" type="button" data-delete>删除</button><button class="button" type="button" data-open-copy>${icon("copy")}复制到日期</button></div>` : ""}
    <div class="actions-right"><button class="button" type="button" data-cancel>取消</button><button class="button primary" type="submit">${existing ? "保存修改" : "创建事项"}</button></div>`;
  showDialog(existing ? "编辑事项" : "新建事项", body, actions, "task-form");
  const form = $("#task-form");
  form.querySelector("[data-open-copy]")?.addEventListener("click", () => openCopy(existing));
  const checkboxes = [...form.querySelectorAll('[name="collaboratorIds"]')];
  const updateCollaborators = () => {
    const selected = [];
    for (const box of checkboxes) {
      box.disabled = box.value === form.elements.ownerId.value;
      box.closest(".people-option").hidden = box.disabled;
      if (box.disabled) box.checked = false;
      if (box.checked) selected.push(people.find(person => person.id === box.value).name);
    }
    const label = selected.join("、") || "选择协作人";
    $("#collaborator-summary").textContent = label;
    $("#collaborator-summary").title = label;
    $("#no-collaborators").hidden = checkboxes.some(box => !box.disabled);
  };
  form.elements.ownerId.addEventListener("change", updateCollaborators);
  checkboxes.forEach(box => box.addEventListener("change", updateCollaborators));
  updateCollaborators();

  form.elements.title.addEventListener("input", () => form.elements.title.setCustomValidity(""));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const title = String(data.get("title")).trim();
    if (!title) {
      form.elements.title.setCustomValidity("请输入事项名称。");
      form.elements.title.reportValidity();
      return;
    }
    const ownerId = String(data.get("ownerId"));
    const next = setTaskDate({
      ...item, id: existing?.id ?? newId(), title, ownerId, projectId: data.get("projectId"), typeId: data.get("typeId"),
      collaboratorIds: [...new Set(data.getAll("collaboratorIds"))].filter(id => id !== ownerId),
      notes: String(data.get("notes")).trim(), demo: false,
    }, String(data.get("date")));
    if (existing) state.tasks = state.tasks.map(task => task.id === next.id ? next : task);
    else state.tasks.push(next);
    if (typeFilter && typeFilter !== next.typeId) typeFilter = next.typeId;
    if (!scopeTasks([next], state.projects, axis, scopes[axis]).length) scopes[axis] = "";
    closeDialog();
    persist();
    render();
    revealDate(next.date, next.id, false);
    const moved = existing && existing.date !== next.date;
    showToast(moved ? `已改至 ${shortDate(next.date)}` : existing ? "已保存修改" : "已添加事项");
  });
  for (const button of form.querySelectorAll("[data-postpone]")) {
    button.addEventListener("click", () => {
      const field = form.elements.date;
      if (field.value) field.value = addDays(field.value, Number(button.dataset.postpone));
      field.focus();
    });
  }
  form.querySelector("[data-delete]")?.addEventListener("click", () => {
    const index = state.tasks.findIndex(task => task.id === existing.id);
    state.tasks.splice(index, 1);
    closeDialog();
    persist();
    render();
    retainFocus();
    showToast("已删除事项", () => { state.tasks.splice(index, 0, existing); });
  });
}

function openProjectManager() {
  const list = state.projects.length ? `<ul class="manage-list">${state.projects.map(project => `
      <li>${projectDot(project)}<span class="manage-label"><strong>${escapeHtml(project.name)}</strong><span class="group-context">${escapeHtml(project.business)}</span></span>
        <button class="button actions-right" type="button" data-edit-project="${escapeHtml(project.id)}" aria-label="编辑 ${escapeHtml(project.name)}">编辑</button></li>`).join("")}</ul>`
    : '<p>创建项目后就可以安排事项。</p>';
  const hasSamples = state.projects.some(project => project.demo) || state.tasks.some(task => task.demo) || state.people.some(person => person.demo);
  const actions = `${hasSamples ? '<button class="button text-danger" type="button" id="clear-samples">移除示例</button>' : ""}
    <div class="actions-right"><button class="button primary" type="button" id="add-project">${icon("plus")}创建项目</button></div>`;
  showDialog("管理项目", list, actions);
  $("#add-project").addEventListener("click", () => openProjectEditor());
  dialogContent.querySelectorAll("[data-edit-project]").forEach(button => {
    button.addEventListener("click", () => openProjectEditor(state.projects.find(project => project.id === button.dataset.editProject)));
  });
  $("#clear-samples")?.addEventListener("click", () => {
    const before = state;
    const tasks = state.tasks.filter(task => !task.demo);
    const projects = state.projects.filter(project => !project.demo || tasks.some(task => task.projectId === project.id));
    const assigned = new Set(tasks.flatMap(participants));
    const people = state.people.filter(person => !person.demo || assigned.has(person.id));
    state = { ...state, projects, tasks, people };
    closeDialog();
    persist();
    render();
    showToast("已移除示例数据", () => { state = before; });
  });
}

function openProjectEditor(existing, taskDefaults) {
  const businesses = [...new Set(state.projects.map(project => project.business))];
  const body = `<div class="editor-fields">
    ${taskDefaults ? '<p>先创建一个项目，再添加事项。</p>' : ""}
    <label class="field">项目名称<input name="name" maxlength="60" value="${escapeHtml(existing?.name)}" required autofocus placeholder="例如：官网改版"></label>
    <label class="field">所属业务<input name="business" list="known-businesses" maxlength="60" value="${escapeHtml(existing?.business)}" placeholder="例如：产品体验"></label>
    <datalist id="known-businesses">${businesses.map(business => option(business, business, false)).join("")}</datalist>
  </div>`;
  const actions = `<div class="actions-right"><button class="button" type="button" ${taskDefaults ? "data-cancel" : "data-back-projects"}>取消</button><button class="button primary" type="submit">${existing ? "保存项目" : "创建项目"}</button></div>`;
  showDialog(existing ? "编辑项目" : "创建项目", body, actions, "project-form");
  const form = $("#project-form");
  const nameField = form.elements.namedItem("name");
  form.addEventListener("input", () => nameField.setCustomValidity(""));
  form.querySelector("[data-back-projects]")?.addEventListener("click", openProjectManager);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = nameField.value.trim();
    const business = form.elements.business.value.trim() || "未分类";
    if (!name || state.projects.some(project => project.id !== existing?.id && project.name === name && project.business === business)) {
      nameField.setCustomValidity(name ? "此业务下已有同名项目。" : "请输入项目名称。");
      nameField.reportValidity();
      return;
    }
    const next = { id: existing?.id ?? newId(), name, business, color: existing?.color ?? state.projects.length % PROJECT_COLORS.length, demo: false };
    if (existing) state.projects = state.projects.map(project => project.id === next.id ? next : project);
    else state.projects.push(next);
    persist();
    render();
    if (taskDefaults) openTask(null, { ...taskDefaults, project: next.id });
    else {
      openProjectManager();
      showToast(existing ? "已保存项目" : "已创建项目");
    }
  });
}

function updateTask(task) {
  state.tasks = state.tasks.map(previous => previous.id === task.id ? task : previous);
  persist();
  render();
}

function clearDrag() {
  draggingId = "";
  board.querySelector(".is-dragging")?.classList.remove("is-dragging");
  board.querySelectorAll(".drag-over").forEach(cell => cell.classList.remove("drag-over"));
}

const registries = {
  person: { key: "people", title: "管理人员", noun: "人员", create: "添加人员" },
  type: { key: "types", title: "管理事项类型", noun: "类型", create: "新建类型" },
};

function openRegistry(kind) {
  const registry = registries[kind];
  const records = state[registry.key];
  const activeCount = records.filter(record => !record.archived).length;
  const ordered = [...records].sort((a, b) => Number(Boolean(a.archived)) - Number(Boolean(b.archived)));
  const list = ordered.length ? `<ul class="manage-list">${ordered.map(record => {
    const label = kind === "person"
      ? `${avatar(record.name)}<span class="manage-label"><strong>${escapeHtml(record.name)}</strong>${record.team ? `<span class="group-context">${escapeHtml(record.team)}</span>` : ""}</span>`
      : `<span class="managed-type-icon">${icon(typeIconName(record))}</span>${typeTag(record)}`;
    const archived = record.archived ? '<span class="archived-label">已归档</span>' : "";
    const staysActive = kind === "type" && !record.archived && activeCount === 1;
    return `<li>${label}${archived}<div class="actions-right">
      <button class="button" type="button" data-edit-record="${escapeHtml(record.id)}" aria-label="编辑 ${escapeHtml(record.name)}">编辑</button>
      ${staysActive ? "" : `<button class="button" type="button" data-archive-record="${escapeHtml(record.id)}" aria-label="${record.archived ? "恢复" : "归档"} ${escapeHtml(record.name)}">${record.archived ? "恢复" : "归档"}</button>`}
    </div></li>`;
  }).join("")}</ul>` : '<p class="empty-message">添加成员后，就可以在事项里选择负责人和协作人。</p>';
  showDialog(registry.title, list, `<div class="actions-right"><button id="add-record" class="button primary" type="button">${icon("plus")}${registry.create}</button></div>`);
  $("#add-record").addEventListener("click", () => openRegistryEditor(kind));
  dialogContent.querySelectorAll("[data-edit-record]").forEach(button => {
    button.addEventListener("click", () => openRegistryEditor(kind, records.find(record => record.id === button.dataset.editRecord)));
  });
  dialogContent.querySelectorAll("[data-archive-record]").forEach(button => {
    button.addEventListener("click", () => {
      const record = records.find(record => record.id === button.dataset.archiveRecord);
      state[registry.key] = records.map(entry => entry.id === record.id ? { ...entry, archived: !entry.archived, demo: false } : entry);
      persist();
      render();
      openRegistry(kind);
      const action = record.archived ? "归档" : "恢复";
      dialogContent.querySelector(`[data-archive-record="${CSS.escape(record.id)}"][aria-label^="${action}"]`)?.focus();
    });
  });
}

function openRegistryEditor(kind, existing) {
  const registry = registries[kind];
  const isPerson = kind === "person";
  const nameLabel = isPerson ? "姓名" : "类型名称";
  const extra = isPerson
    ? `<label class="field">团队或角色（可选）<input name="team" maxlength="60" value="${escapeHtml(existing?.team)}" placeholder="例如：产品设计"></label>`
    : `<fieldset class="fieldset"><legend>标签颜色</legend><div class="color-options">${Object.entries(TYPE_COLORS).map(([id, color]) =>
      `<label class="color-choice" style="${typeStyle(id)}"><input name="color" type="radio" value="${id}" aria-label="${color.name}"${(existing?.color ?? "slate") === id ? " checked" : ""}><span title="${color.name}">${icon("check")}</span></label>`).join("")}</div></fieldset>
      <fieldset class="fieldset"><legend>手写图标</legend><div class="color-options">${Object.entries(typeIcons).map(([id, name]) =>
        `<label class="color-choice glyph-choice"><input name="glyph" type="radio" value="${id}" aria-label="${name}"${typeIconName(existing) === id ? " checked" : ""}><span title="${name}">${icon(id)}</span></label>`).join("")}</div></fieldset>`;
  const body = `<div class="editor-fields"><label class="field">${nameLabel}<input name="name" required autofocus maxlength="${isPerson ? 60 : 24}" value="${escapeHtml(existing?.name)}" placeholder="${isPerson ? "例如：林然" : "例如：模型评测"}"></label>${extra}</div>`;
  const action = existing ? `保存${registry.noun}` : registry.create;
  showDialog(existing ? `编辑${registry.noun}` : action, body, `<div class="actions-right"><button class="button" type="button" id="back-registry">取消</button><button class="button primary" type="submit">${action}</button></div>`, "registry-form");
  const form = $("#registry-form");
  const nameField = form.elements.namedItem("name");
  $("#back-registry").addEventListener("click", () => openRegistry(kind));
  form.addEventListener("input", () => nameField.setCustomValidity(""));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const name = nameField.value.trim();
    const fields = isPerson ? { team: form.elements.team.value.trim(), demo: false } : {
      color: form.elements.color.value, icon: form.elements.glyph.value,
    };
    const records = state[registry.key];
    const duplicate = records.some(record => record.id !== existing?.id && record.name === name && (!isPerson || record.team === fields.team));
    if (!name || duplicate) {
      nameField.setCustomValidity(!name ? `请输入${nameLabel}。` : "已有相同的记录。");
      nameField.reportValidity();
      return;
    }
    const record = { ...existing, id: existing?.id ?? newId(), name, ...fields };
    state[registry.key] = existing ? records.map(entry => entry.id === record.id ? record : entry) : [...records, record];
    persist();
    render();
    openRegistry(kind);
    dialogContent.querySelector(`[data-edit-record="${CSS.escape(record.id)}"]`)?.focus();
  });
}

document.querySelectorAll("[data-icon]").forEach(element => { element.innerHTML = icon(element.dataset.icon); });
weekdayHeader.innerHTML = weekdays.map(day => `<div class="weekday">${day}</div>`).join("");
document.querySelectorAll("[data-appearance]").forEach(button => {
  button.addEventListener("click", () => applyAppearance(button.dataset.appearance, true));
});
handwritingFontSelect.addEventListener("change", () => applyHandwritingFont(handwritingFontSelect.value, true));
$("#manage-projects").addEventListener("click", openProjectManager);
$("#manage-people").addEventListener("click", () => openRegistry("person"));
$("#manage-types").addEventListener("click", () => openRegistry("type"));
$("#new-item").addEventListener("click", () => openTask());
$("#prev-month").addEventListener("click", () => changeMonth(offsetMonth(month, -1)));
$("#next-month").addEventListener("click", () => changeMonth(offsetMonth(month, 1)));
$("#today").addEventListener("click", () => revealDate(today()));

$("#calendar-nav").addEventListener("click", () => {
  axis = "project";
  layout = "merged";
  scopes.project = "";
  typeFilter = "";
  render();
  revealDate(today());
});

$("#project-shortcuts").addEventListener("click", event => {
  const button = event.target.closest("[data-project-shortcut]");
  if (!button) return;
  const id = button.dataset.projectShortcut;
  const nextScope = `project:${id}`;
  scopes.project = axis === "project" && scopes.project === nextScope ? "" : nextScope;
  axis = "project";
  render();
  document.querySelector(`[data-project-shortcut="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
});

$(".view-controls").addEventListener("click", event => {
  const axisButton = event.target.closest("[data-axis]");
  const layoutButton = event.target.closest("[data-layout]");
  if (axisButton) axis = axisButton.dataset.axis;
  if (layoutButton) layout = layoutButton.dataset.layout;
  if (axisButton || layoutButton) render();
});

scopeSelect.addEventListener("change", () => {
  scopes[axis] = scopeSelect.value;
  render();
});
typeSelect.addEventListener("change", () => {
  typeFilter = typeSelect.value;
  render();
});

board.addEventListener("toggle", event => {
  const group = event.target;
  if (!group.matches(".group")) return;
  if (group.open) collapsedGroups.delete(group.dataset.groupKey);
  else collapsedGroups.add(group.dataset.groupKey);
}, true);

scroller.addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    extendCalendar();
  });
}, { passive: true });

board.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const { add: date, project, person } = addButton.dataset;
    openTask(null, { date, project, person });
    return;
  }
  const card = event.target.closest("[data-task-id]");
  if (!card) return;
  const task = state.tasks.find(task => task.id === card.dataset.taskId);
  if (!task) return;
  const copyButton = event.target.closest("[data-copy]");
  if (copyButton) {
    openCopy(task);
    return;
  }
  const completeButton = event.target.closest("[data-complete]");
  if (completeButton) {
    const completeSelector = `[data-complete="${CSS.escape(task.id)}"]`;
    const matching = [...board.querySelectorAll(completeSelector)];
    const buttonIndex = matching.indexOf(completeButton);
    updateTask({ ...task, done: !task.done });
    board.querySelectorAll(completeSelector)[buttonIndex]?.focus({ preventScroll: true });
    showToast(task.done ? "已标为未完成" : "已标为完成");
    return;
  }
  openTask(task);
});

board.addEventListener("dragstart", event => {
  const card = event.target.closest("[data-task-id]");
  if (!card || !event.dataTransfer) return;
  draggingId = card.dataset.taskId;
  event.dataTransfer.setData("text/plain", draggingId);
  event.dataTransfer.effectAllowed = "move";
  requestAnimationFrame(() => { if (draggingId) card.classList.add("is-dragging"); });
});

board.addEventListener("dragover", event => {
  const cell = event.target.closest("[data-date]");
  if (!draggingId || !cell) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  board.querySelector(".drag-over:not(:hover)")?.classList.remove("drag-over");
  cell.classList.add("drag-over");
});

board.addEventListener("dragleave", event => {
  const cell = event.target.closest("[data-date]");
  if (cell && !cell.contains(event.relatedTarget)) cell.classList.remove("drag-over");
});

board.addEventListener("drop", event => {
  const cell = event.target.closest("[data-date]");
  const task = state.tasks.find(task => task.id === draggingId);
  if (!cell || !task) return;
  event.preventDefault();
  clearDrag();
  const date = cell.dataset.date;
  if (date === task.date) return;
  updateTask(setTaskDate(task, date));
  showToast(`已改至 ${shortDate(date)}`, () => {
    state.tasks = state.tasks.map(entry => entry.id === task.id ? task : entry);
  });
});

board.addEventListener("dragend", clearDrag);
dialog.addEventListener("click", event => {
  if (event.target.closest("[data-dialog-close], [data-cancel]")) closeDialog();
  if (event.target === dialog) {
    const rectangle = dialog.getBoundingClientRect();
    if (event.clientX < rectangle.left || event.clientX > rectangle.right ||
        event.clientY < rectangle.top || event.clientY > rectangle.bottom) closeDialog();
  }
});
dialog.addEventListener("close", () => {
  if (!dialog.open && document.activeElement === document.body) retainFocus();
});

window.addEventListener("storage", event => {
  if (event.storageArea === localStorage && event.key === APPEARANCE_KEY) applyAppearance(loadAppearance());
  if (event.storageArea === localStorage && event.key === HANDWRITING_FONT_KEY) applyHandwritingFont(loadHandwritingFont());
  if (event.storageArea === localStorage && [STORAGE_KEY, LEGACY_STORAGE_KEY].includes(event.key) && !dialog.open && !copyDialog.open) {
    state = loadWorkspace();
    render();
  }
});

applyHandwritingFont(loadHandwritingFont());
applyAppearance(appearance);
render(false);
revealDate(today());
