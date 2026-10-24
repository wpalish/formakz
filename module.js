import {
  F,
  S,
  R,
  C,
  live,
  rows,
  byId,
  unique,
  required,
  minor,
  amount,
  interval,
  noOverlap,
  changed,
  immutable,
  admin,
  totalLines,
  summary,
  clock,
  label,
} from "./core/rules.js";
const definition = {
  slug: "formakz",
  reference: 99,
  title: "FormaKZ",
  description:
    "Настройка текстовой формы и приём публичных заявок в закрытый кабинет с проверкой обязательных ответов.",
  limitations:
    "Одна организация · Собственный сервер · Ручной ввод · Без банковских и внешних интеграций",
  collections: [
    C(
      "forms",
      "Формы",
      [
        F("name", "Название"),
        F("description", "Объяснение посетителю", "textarea"),
        F("questions", "Обязательные вопросы, по одному на строку", "textarea"),
        S("status", "Состояние", [
          ["draft", "Черновик"],
          ["published", "Публичная форма"],
        ]),
      ],
      { writeRole: "admin", publicLinks: true },
    ),
    C(
      "submissions",
      "Заявки",
      [
        R("form", "Форма", "forms", { readOnly: true }),
        F("answers", "Ответы посетителя", "answers", {
          readOnly: true,
          maxLength: 45000,
        }),
        S("status", "Состояние", [
          ["new", "Новая"],
          ["reviewed", "Просмотрена"],
        ]),
      ],
      { createDisabled: true },
    ),
  ],
  validate(state, before, command, actor) {
    for (const f of rows(state, "forms")) {
      const questions = f.questions
        .split(String.fromCharCode(10))
        .filter((x) => x.trim());
      required(
        questions.length > 0 &&
          questions.length <= 20 &&
          questions.every((q) => q.trim().length <= 160),
        "Нужно 1–20 текстовых вопросов.",
      );
    }
    for (const entry of rows(state, "submissions")) {
      const form = byId(state, "forms", entry.form);
      let answers;
      try {
        answers = JSON.parse(entry.answers);
      } catch {
        required(false, "Неверный формат ответов.");
      }
      required(
        Array.isArray(answers) &&
          answers.length ===
            form.questions
              .split(String.fromCharCode(10))
              .filter((x) => x.trim()).length &&
          answers.every(
            (x) =>
              typeof x === "string" && x.trim().length > 0 && x.length <= 2000,
          ),
        "Заполните каждый обязательный ответ, до 2000 символов.",
      );
      const old = changed(before, "submissions", entry.id);
      if (old) immutable(old, entry, ["form", "answers"]);
    }
    for (const f of rows(state, "forms")) {
      const old = changed(before, "forms", f.id);
      if (old && rows(state, "submissions").some((s) => s.form === f.id))
        immutable(
          old,
          f,
          ["questions"],
          "Вопросы формы с заявками не меняются. Создайте новую форму.",
        );
    }
  },
  summarize(state) {
    return rows(state, "forms").map((f) =>
      summary(
        f.name,
        "Состояние: " + label(definition, "forms", "status", f.status),
        "Заявок: " +
          rows(state, "submissions").filter((s) => s.form === f.id).length,
      ),
    );
  },
  publicForm(state, id) {
    const f = rows(state, "forms").find(
      (x) => x.id === id && !x.archived && x.status === "published",
    );
    return f
      ? {
          title: f.name,
          description: f.description,
          fields: f.questions
            .split(String.fromCharCode(10))
            .filter((x) => x.trim())
            .map((label, i) => ({ key: "q" + i, label, type: "text" })),
        }
      : null;
  },
  publicCommand(state, id, input) {
    const f = byId(state, "forms", id);
    const answers = f.questions
      .split(String.fromCharCode(10))
      .filter((x) => x.trim())
      .map((_, i) => input["q" + i]);
    return {
      collection: "submissions",
      data: { form: id, answers: JSON.stringify(answers), status: "new" },
    };
  },
};
export default definition;
