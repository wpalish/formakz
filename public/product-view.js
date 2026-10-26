// Product surfaces only. All mutations stay in app.js and the validated server API.
const node = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
const money = (value, currency = "KZT", minor = false) =>
  `${new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor ? Number(value) / 100 : Number(value))} ${currency}`;
const time = (value) =>
  value
    ? new Date(value).toLocaleString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Не указано";
function flag(row, labels) {
  return node(
    "span",
    row.archived ? "Архив" : labels[row.status] || row.status,
    "record-state " + (row.archived ? "archived" : row.status),
  );
}
function fact(host, label, value, cls = "") {
  const block = node("div", undefined, "fact " + cls);
  block.append(node("dt", label), node("dd", value ?? "—"));
  host.append(block);
  return block;
}
function external(label, url, cls = "text-link") {
  const a = node("a", label, cls);
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw Error("scheme");
    a.href = parsed.href;
    a.target = "_blank";
    a.rel = "noopener";
  } catch {
    a.removeAttribute("href");
    a.textContent = label + " · ссылка недоступна";
  }
  return a;
}
function focusRecord(host, id) {
  const target = [...host.querySelectorAll("[data-record-id]")].find(
    (e) => e.dataset.recordId === id,
  );
  target?.focus({ preventScroll: true });
}
function publicLink(row, label = "Открыть публичную форму") {
  return external(
    label,
    location.origin + "/#public=" + encodeURIComponent(row.id),
    "button secondary",
  );
}
function header(ctx, title, copy, context) {
  const { screen } = ctx;
  screen.replaceChildren();
  const heading = node("section", undefined, "workspace-heading");
  heading.setAttribute("aria-label", context);
  const titleRow = node("div", undefined, "workspace-title-row");
  titleRow.append(node("h1", title));
  heading.append(titleRow, node("p", copy, "workspace-description"));
  screen.append(heading);
  return heading;
}
function tools(ctx) {
  const {
    screen,
    config,
    active,
    user,
    button,
    input,
    create,
    refresh,
    query,
    showArchived,
    search,
    archive,
  } = ctx;
  const collection = config.collections.find((item) => item.key === active);
  const actions = node("div", undefined, "actions heading-actions");
  if (
    !collection.createDisabled &&
    (collection.writeRole !== "admin" || user.role === "admin")
  )
    actions.append(
      button(collection.addLabel || "Добавить запись", create, "primary"),
    );
  actions.append(button("Обновить", refresh));
  screen.querySelector(".workspace-title-row").append(actions);
  const toolbar = node("div", undefined, "workspace-toolbar");
  const searchBox = node("div", undefined, "search-tools");
  const queryInput = input(
    searchBox,
    "search",
    "Найти в разделе",
    query,
    "search",
    false,
  );
  queryInput.placeholder = "Название, статус или содержание";
  queryInput.addEventListener("input", () => search(queryInput.value));
  const archivedLabel = node("label", "С архивом");
  const archivedInput = node("input");
  archivedInput.type = "checkbox";
  archivedInput.checked = showArchived;
  archivedInput.addEventListener("change", () =>
    archive(archivedInput.checked),
  );
  archivedLabel.prepend(archivedInput);
  searchBox.append(archivedLabel);
  toolbar.append(searchBox);
  screen.append(toolbar);
  const host = node("section");
  host.id = "records";
  host.setAttribute("aria-label", "Рабочие записи");
  screen.append(host);
}
function empty(ctx, description, dependency) {
  const {
    host,
    values,
    state,
    active,
    query,
    button,
    clear,
    create,
    user,
    config,
    navigate,
  } = ctx;
  if (values.length) return false;
  const c = config.collections.find((x) => x.key === active),
    hasRecords = state.data[active].length > 0;
  const box = node("section", undefined, "empty-records");
  box.append(
    node(
      "h2",
      hasRecords
        ? query
          ? "Ничего не найдено"
          : "Здесь только архивные записи"
        : "Начните с первой записи",
    ),
    node(
      "p",
      hasRecords
        ? "Измените поиск или покажите архив. Сохранённая история остаётся доступной."
        : description,
    ),
  );
  if (hasRecords) box.append(button("Сбросить поиск и показать архив", clear));
  else if (dependency)
    box.append(
      button(dependency.label, () => navigate(dependency.key), "primary"),
    );
  else if (
    !c.createDisabled &&
    (c.writeRole !== "admin" || user.role === "admin")
  )
    box.append(button(c.addLabel || "Добавить запись", create, "primary"));
  else
    box.append(
      node(
        "p",
        c.createDisabled
          ? "Ответы появляются только после отправки публичной формы."
          : "Записи в этом разделе подготавливает администратор.",
        "muted",
      ),
    );
  host.append(box);
  return true;
}
function count(ctx) {
  const toolbar = ctx.host.previousElementSibling;
  let counter = toolbar.querySelector(".record-count");
  if (!counter) {
    counter = node("p", undefined, "record-count");
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");
    toolbar.append(counter);
  }
  counter.textContent = `Показано ${ctx.values.length} из ${ctx.state.data[ctx.active].length}`;
}
function editorLayout(screen, form, aside) {
  const layout = node("div", undefined, "editor-layout");
  form.before(layout);
  layout.append(form, aside);
  return layout;
}
function note(title, text, cls = "context-note") {
  const e = node("aside", undefined, cls);
  e.append(node("h2", title), node("p", text));
  return e;
}
function publicLayout({ screen, form, E }, eyebrow, help) {
  const intro = node("section", undefined, "public-intro"),
    title = screen.querySelector(":scope > h1"),
    description = title.nextElementSibling;
  title.before(intro);
  intro.append(node("p", eyebrow, "eyebrow"), title, description);
  document.getElementById("identity").textContent = "Публичная форма";
  const aside = note("Перед отправкой", help);
  const layout = node("div", undefined, "public-layout");
  form.before(layout);
  layout.append(form, aside);
}
const formStates = { draft: "Черновик", published: "Принимает ответы" };
const submissionStates = { new: "Новая заявка", reviewed: "Просмотрена" };
const questions = (row) =>
  (row?.questions || "").split("\n").filter((x) => x.trim());
let selectedResponse;
function questionList(row) {
  const list = node("ol", undefined, "question-outline");
  for (const question of questions(row)) list.append(node("li", question));
  return list;
}
export function renderWorkspace(ctx) {
  const forms = ctx.active === "forms";
  header(
    ctx,
    forms ? "Формы для первого контакта" : "Прочитайте каждый ответ",
    forms
      ? "Подготовьте вопросы, опубликуйте форму и прочитайте ответы."
      : "Ответы опубликованных форм. Отметка просмотра остаётся ручной.",
    "FormaKZ / Приём обращений",
  );
  tools(ctx);
}
export function renderProductRecords(ctx) {
  const { host, values, active, state, button, edit, navigate } = ctx;
  host.replaceChildren();
  count(ctx);
  if (
    empty(
      ctx,
      active === "forms"
        ? "Создайте форму из 1–20 обязательных текстовых вопросов. Затем проверьте её как посетитель."
        : "Опубликуйте форму и отправьте тестовые ответы по её открытой ссылке.",
      active === "submissions"
        ? { key: "forms", label: "Открыть формы" }
        : null,
    )
  )
    return;
  if (active === "forms") {
    const gallery = node("div", undefined, "form-library");
    for (const row of values) {
      const doc = node("article", undefined, "form-document"),
        head = node("div", undefined, "document-top"),
        responses = state.data.submissions.filter(
          (s) => s.form === row.id && !s.archived,
        ),
        unread = responses.filter((s) => s.status === "new").length;
      head.append(
        flag(row, formStates),
        node("span", `${questions(row).length} обязательных вопросов`, "muted"),
      );
      doc.append(
        head,
        node("h2", row.name),
        node("p", row.description, "preserve-lines"),
        questionList(row),
      );
      const footer = node("div", undefined, "form-document-footer");
      footer.append(
        node(
          "p",
          `Заявок вне архива: ${responses.length} · новых: ${unread}`,
          "response-caption",
        ),
      );
      const actions = node("div", undefined, "actions");
      actions.append(button("Открыть конструктор", () => edit(row), "primary"));
      if (row.status === "published" && !row.archived)
        actions.append(publicLink(row, "Открыть форму"));
      footer.append(actions);
      doc.append(footer);
      gallery.append(doc);
    }
    host.append(gallery);
    return;
  }
  const layout = node("div", undefined, "response-review"),
    index = node("div", undefined, "response-index"),
    document = node("article", undefined, "response-document");
  index.append(node("h2", "Очередь просмотра"));
  const ordered = [...values].sort(
    (a, b) =>
      Number(b.status === "new") - Number(a.status === "new") ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  const current = ordered.find((x) => x.id === selectedResponse) || ordered[0];
  selectedResponse = current.id;
  for (const row of ordered) {
    const form = state.data.forms.find((f) => f.id === row.form),
      choice = button(
        "",
        () => {
          selectedResponse = row.id;
          renderProductRecords(ctx);
          focusRecord(host, row.id);
        },
        "response-choice",
      );
    choice.dataset.recordId = row.id;
    choice.setAttribute("aria-pressed", String(row.id === current.id));
    choice.append(
      flag(row, submissionStates),
      node("strong", form?.name || "Форма из истории"),
      node("span", time(row.createdAt), "muted"),
    );
    index.append(choice);
  }
  const source = state.data.forms.find((f) => f.id === current.form),
    answers = JSON.parse(current.answers);
  document.append(
    node("p", "ОТВЕТЫ ПОСЕТИТЕЛЯ", "eyebrow"),
    node("h2", source?.name || "Форма из истории"),
    flag(current, submissionStates),
    node("p", `${time(current.createdAt)} · ${current.id}`, "document-caption"),
  );
  const answerList = node("dl", undefined, "answer-list");
  answers.forEach((answer, i) => {
    const item = node("div", undefined, "answer-block");
    item.append(
      node("dt", `${i + 1}. ${questions(source)[i] || "Ответ"}`),
      node("dd", answer, "preserve-lines"),
    );
    answerList.append(item);
  });
  document.append(answerList);
  if (source?.archived)
    document.append(
      node(
        "p",
        "Исходная форма в архиве. Прежние вопросы и ответы доступны для чтения.",
        "context-line",
      ),
    );
  document.append(
    node(
      "p",
      "Отметка «Просмотрена» фиксирует ручной просмотр сотрудником. Она не означает ответ посетителю.",
      "context-line",
    ),
    button("Открыть ответы и статус", () => edit(current), "primary"),
  );
  layout.append(index, document);
  host.append(layout);
}
export function decorateEditor({ screen, form, c, row, state }) {
  if (c.key === "forms") {
    const aside = note(
      "Вид для посетителя",
      "Предпросмотр обязательных текстовых вопросов. Все ответы обязательны; до 2000 символов каждый.",
      "builder-preview",
    );
    const preview = node("article", undefined, "form-preview");
    aside.append(preview);
    const q = form.elements.namedItem("questions"),
      counter = node("p", undefined, "question-count");
    q.after(counter);
    if (row && state.data.submissions.some((s) => s.form === row.id)) {
      q.readOnly = true;
      q.after(
        node(
          "p",
          "В форме уже есть заявки: вопросы зафиксированы. Для другого набора вопросов создайте новую форму.",
          "context-line",
        ),
      );
    }
    const update = () => {
      const data = new FormData(form),
        list = questions({ questions: data.get("questions") }),
        invalid =
          list.length < 1 ||
          list.length > 20 ||
          list.some((x) => x.trim().length > 160);
      counter.textContent = `${list.length} из 20 вопросов · до 160 символов в вопросе`;
      counter.classList.toggle("invalid", invalid);
      counter.setAttribute("role", "status");
      preview.replaceChildren(
        node("p", "ПРЕДПРОСМОТР", "eyebrow"),
        node("h3", data.get("name") || "Название формы"),
        node(
          "p",
          data.get("description") || "Объясните, зачем заполнять форму.",
          "preserve-lines",
        ),
      );
      const ol = node("ol", undefined, "preview-questions");
      for (const question of list) {
        const li = node("li");
        li.append(
          node("span", question),
          node("div", "Текстовый ответ · обязательно", "answer-placeholder"),
        );
        ol.append(li);
      }
      preview.append(ol);
    };
    form.addEventListener("input", update);
    update();
    editorLayout(screen, form, aside);
  } else if (row) {
    const aside = note(
        "Сохранённая заявка",
        "Вопросы и ответы доступны для чтения. Выберите статус после фактического просмотра.",
        "review-context",
      ),
      source = state.data.forms.find((f) => f.id === row.form);
    aside.append(
      node("p", source?.name || "Исходная форма"),
      node("p", `Поступила ${time(row.createdAt)}`),
    );
    if (source?.archived)
      aside.append(
        node("p", "Форма находится в архиве. Новые ответы не принимаются."),
      );
    const answerHeading = form.querySelector("h2");
    if (answerHeading) answerHeading.className = "review-answer-heading";
    editorLayout(screen, form, aside);
  }
}
export function decoratePublic(ctx) {
  for (const field of ctx.form.querySelectorAll('input[type="text"]'))
    field.maxLength = 2000;
  publicLayout(
    ctx,
    "FormaKZ / Открытая форма",
    "Каждый вопрос обязателен. До 2000 символов в ответе. Ответы будут сохранены в закрытом кабинете владельца этого сервера. Не вводите пароли, платёжные реквизиты или личные документы.",
  );
  const count = node(
    "p",
    `Обязательных вопросов: ${ctx.definition.fields.length}`,
    "public-question-count",
  );
  ctx.form.prepend(count);
}

// Fragment navigation and request generations are shared by initial load and browser history.
export function parseHashRoute(hash, collectionKeys) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.has("public")) return { kind: "public", id: params.get("public") };
  const section = params.get("section");
  return {
    kind: "workspace",
    section: collectionKeys.includes(section) ? section : null,
  };
}
export function createRouteGuard() {
  let current = 0;
  return {
    next: () => ++current,
    current: () => current,
    isCurrent: (ticket) => ticket === current,
  };
}
