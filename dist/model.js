export const UNASSIGNED = "未分配";
export const STORAGE_KEY = "timeboard.workspace.v2";
export const LEGACY_STORAGE_KEY = "timeboard.workspace.v1";
export const PROJECT_COLORS = ["#8b7cb6", "#589378", "#bf8256", "#6389ad", "#a97490", "#a88c46"];
export const PERSON_COLORS = ["#ede9f5", "#e0eee5", "#f6ecd9", "#e3edf7", "#f6e6ec"];
export const TYPE_COLORS = {
  slate: { name: "灰色", ink: "#505a62", background: "#edf0f2", accent: "#a7b1b9" },
  amber: { name: "琥珀", ink: "#7d5a24", background: "#f8efd9", accent: "#cbb06d" },
  violet: { name: "紫色", ink: "#5e508a", background: "#eee9f8", accent: "#aa9ac9" },
  blue: { name: "蓝色", ink: "#3f6385", background: "#e7eff8", accent: "#8daaca" },
  green: { name: "绿色", ink: "#355f4c", background: "#e6f0e9", accent: "#88ad98" },
  rose: { name: "玫红", ink: "#875268", background: "#f5e8ee", accent: "#c593a7" },
  orange: { name: "橙色", ink: "#86563c", background: "#f8ece3", accent: "#c69b81" },
};

const defaultTypes = [
  ["milestone", "里程碑", "amber"],
  ["todo", "待办", "slate"],
  ["design", "出方案", "violet"],
  ["test", "测试", "blue"],
  ["launch", "上线", "green"],
  ["review", "评审", "rose"],
];

export function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateAt(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(value, amount) {
  const date = dateAt(value);
  date.setDate(date.getDate() + amount);
  return localDate(date);
}

export function monthOf(value) {
  return value.slice(0, 7) + "-01";
}

export function offsetMonth(value, amount) {
  const date = dateAt(monthOf(value));
  date.setMonth(date.getMonth() + amount);
  return localDate(date);
}

export function weekStart(value) {
  return addDays(value, -((dateAt(value).getDay() + 6) % 7));
}

export function calendarMonthOf(value) {
  return monthOf(addDays(weekStart(value), 3));
}

export function monthWeeks(month) {
  const start = weekStart(addDays(monthOf(month), 3));
  const end = weekStart(addDays(offsetMonth(month, 1), 3));
  const weeks = [];
  for (let date = start; date < end; date = addDays(date, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(date, index)));
  }
  return weeks;
}

export function shortDate(value) {
  const date = dateAt(value);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function participants(task) {
  return [...new Set([task.ownerId, ...task.collaboratorIds].filter(Boolean))];
}

export function scopeTasks(tasks, projects, axis, scope) {
  if (!scope) return tasks;
  const separator = scope.indexOf(":");
  const kind = scope.slice(0, separator);
  const value = scope.slice(separator + 1);
  if (axis === "person") {
    return tasks.filter(task => kind === "unassigned" ? !participants(task).length : participants(task).includes(value));
  }
  if (kind === "project") return tasks.filter(task => task.projectId === value);
  const projectIds = new Set(projects.filter(project => project.business === value).map(project => project.id));
  return tasks.filter(task => projectIds.has(task.projectId));
}

export function setTaskDate(task, date) {
  if (date === task.date) return task;
  return { ...task, date, moves: [...task.moves, { from: task.date, to: date }] };
}

export function duplicateTask(task, date, id) {
  return { ...task, id, date, collaboratorIds: [...task.collaboratorIds], done: false, moves: [], demo: false };
}

export function migrateWorkspace(source) {
  if (Array.isArray(source.people) && Array.isArray(source.types)) return source;

  const peopleByName = new Map();
  function memberId(value, demo) {
    const name = value?.trim();
    if (!name) return "";
    if (!peopleByName.has(name)) {
      peopleByName.set(name, { id: `member-${peopleByName.size + 1}`, name, team: "", demo: Boolean(demo) });
    }
    const member = peopleByName.get(name);
    if (!demo) member.demo = false;
    return member.id;
  }

  const tasks = source.tasks.map(({ owner, collaborators, type, ...task }) => {
    const ownerId = memberId(owner, task.demo);
    const collaboratorIds = [...new Set(collaborators.map(name => memberId(name, task.demo)))].filter(id => id && id !== ownerId);
    return { ...task, ownerId, collaboratorIds, typeId: type };
  });
  return {
    projects: source.projects, tasks, people: [...peopleByName.values()],
    types: defaultTypes.map(([id, name, color]) => ({ id, name, color })),
  };
}

export function seedWorkspace(today) {
  const first = monthOf(today);
  const current = dateAt(today).getDate() - 1;
  const projects = [
    { id: "web", name: "官网改版", business: "产品体验", color: 0, demo: true },
    { id: "help", name: "AI 帮助中心", business: "产品体验", color: 1, demo: true },
    { id: "campaign", name: "冬季活动", business: "市场运营", color: 2, demo: true },
  ];
  const entries = [
    [1, "web", "milestone", "确认改版范围", "林然", ["周宁"]],
    [2, "help", "todo", "梳理常见问题", "陈墨", []],
    [4, "campaign", "design", "输出活动初稿", "许知远", ["林然"]],
    [5, "help", "review", "评审知识库结构", "陈墨", ["周宁"]],
    [8, "web", "design", "交付首页线框稿", "林然", ["周宁"]],
    [10, "help", "test", "验证助手回答", "周宁", ["陈墨"]],
    [11, "campaign", "todo", "对齐主视觉方向", "许知远", ["林然"]],
    [12, "web", "review", "设计方案评审", "林然", ["周宁"]],
    [15, "web", "todo", "补齐移动端方案", "周宁", ["林然"]],
    [17, "help", "test", "回归测试知识库", "陈墨", ["周宁"]],
    [18, "campaign", "milestone", "活动页定稿", "许知远", ["陈墨"]],
    [19, "help", "launch", "发布帮助中心", "陈墨", []],
    [22, "web", "test", "验证移动端页面", "周宁", ["林然"]],
    [24, "campaign", "review", "活动上线验收", "许知远", ["陈墨"]],
    [25, "web", "launch", "官网灰度上线", "林然", ["周宁"]],
    [26, "campaign", "launch", "发布冬季活动", "许知远", []],
  ];
  const tasks = entries.map(([offset, projectId, type, title, owner, collaborators], index) => {
    const date = addDays(first, offset);
    const moves = index === 8 ? [{ from: addDays(date, -2), to: date }] : [];
    const done = offset < current && index < 9 && index !== 8;
    return { id: `sample-${index}`, projectId, type, title, owner, collaborators, done, date, moves, notes: "", demo: true };
  });
  return migrateWorkspace({ projects, tasks });
}
