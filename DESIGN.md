# FormaKZ design system · 26 October 2026

## Product direction: Question studio

A warm, humanist form studio. The first task is composing an understandable public questionnaire; the second is reading each answer. A library of form documents and a separate review queue serve those two jobs.

Warm porcelain/rose ground, berry actions, Trebuchet/Segoe humanist typography and rounded document edges. Top navigation uses compact capsule tabs.

Semantic palette: `#382b30` text · `#6c5861` supporting text · `#fcf5f2` ground · `#fffdfb` document · `#903c57` action.

This increment supersedes the earlier inherited blue-table surface specification. It uses the approved quality direction as a craft bar; composition, navigation and typography are specific to this product. No remote font, icon library, imagery, ornamental SVG, chart or paid dependency was added.

## Implemented composition and domain truth

- Forms appear as complete question outlines with explanation, state, required-question count, actual unarchived response/new-response counts, constructor and public-link actions.
- The native form editor is paired with a live visitor preview. A live counter exposes the 1–20 question and 160-character-per-question limits. Server validation remains authoritative.
- Once the form has a submission, the question field becomes read-only with a concrete explanation. The existing server restriction remains unchanged.
- The submissions screen is a new-first review queue beside a complete question/answer document. Answers are read-only, preserve line breaks, and retain the source-form context after archival.
- The public form remains the real endpoint, with required answers and 2000-character input limits. The saved receipt receives focus. A `reviewed` mark records manual reading, not an outgoing reply.

## Controls, states and responsive contract

`public/product-view.js` owns product presentation. `public/app.js` continues to own authenticated loading, CSRF/revision-checked commands, native validation, immutable-field preservation, archive, public endpoints, staff access and backup/audit settings. All record content is inserted as text. External source links accept only HTTP(S).

Search covers stored content and resolved field labels. The archive toggle and explicit reset preserve access to history. Primary creation controls respect the configured collection role/create restriction. Empty and no-result states give a concrete recovery action. Server errors remain in a live notice that receives focus; pending controls are disabled with `aria-busy`.

Controls and public actions have a 44px minimum target. Native fields retain visible labels; checkbox labels include the target. Headings use size-dependent tracking; body copy retains relaxed leading. Focus outlines are explicit. Record-selection controls preserve keyboard focus, and editor/navigation transitions focus the new heading. Responsive rules adapt the layout for 390px/768px/1440px without removing the primary action. Motion is limited to immediate press feedback with a reduced-motion fallback. This is a light design; no dark-mode acceptance is claimed.

## Verification boundary

Node 24.19.0 syntax checks passed for both changed JavaScript files. Existing domain/server tests plus any added presentation-logic regression passed: **10/10**. These checks do not establish visual or browser acceptance. Actual screenshots, keyboard/touch behavior, focus, console and responsive overflow require the parent browser QA pass recorded in [PRE_RELEASE.md](PRE_RELEASE.md). Earlier screenshots describe the previous surface.

## Desktop craft pass · captured evidence

The actual 1440×1000 desktop capture exposed an oversized vertical scaffold before the first working record. This pass puts the title and primary actions in one row, uses one concise supporting sentence, and combines the visible search label, search field, archive toggle and live record count in a single control rail. The product context remains an accessible section label, without repeating the brand above every title. At small widths, title/actions and labelled search controls wrap deliberately. Control hit areas remain at least 44px.

Question documents use tighter headers, question rules and footer spacing. The form studio retains its top tabs, warm palette and humanist typography. The response review composition is unchanged.

The source applies optical heading tracking, antialiasing and tabular count/money figures. No decorative motion or new assets were added. The original screenshots were inspected; refreshed screenshots and responsive measurements belong to parent browser QA and are not yet claimed for this pass.
