<!--
SYNC IMPACT REPORT
Version change: (unversioned template) → 1.0.0
Bump type: MINOR — initial ratification; all content is new (no prior principles defined)
Modified principles: None (initial ratification, all are new)
Added sections: Core Principles (I–V), Quality & Testing Standards, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — "Constitution Check" section is generic; aligns with principles as-is
  ✅ .specify/templates/spec-template.md — No constitution-specific content; no update required
  ✅ .specify/templates/tasks-template.md — Generic phase/task structure aligns with all five principles; no update required
  ✅ .windsurf/rules/specify-rules.md — Technology context file; principle-agnostic; no update required
Deferred items: None
-->

# Firefox Ebook Reader Extension Constitution

## Core Principles

### I. Privacy by Default

User data MUST never leave the user's device. The extension MUST NOT make any network
requests at runtime — no analytics, no telemetry, no crash reporting, no CDN asset
loading. All book content, reading progress, bookmarks, annotations, and preferences
MUST be stored exclusively in browser-local storage (IndexedDB and
`browser.storage.local`). Any future feature that would transmit user data externally
requires an explicit amendment to this constitution and MUST be opt-in with clear
user consent.

### II. Offline-First

The extension MUST be fully functional with no internet connection. Every dependency
(libraries, fonts, icons) MUST be vendored into the extension package at build time.
No feature MAY fall back to a network request as a secondary path. Features that
inherently require connectivity (e.g., downloading ebooks from the web) are out of
scope unless defined by a future spec that passes a constitution amendment gate.

### III. User Data Ownership

Users MUST retain full control over their data at all times. Specifically:
- Users MUST be able to remove any book from the library, which MUST delete all
  associated data (file bytes, cover, reading session, bookmarks, annotations).
- No data MUST be retained after a user-initiated removal.
- Data formats used for storage (JSON in `browser.storage.local`) MUST be
  human-readable and self-describing to allow manual inspection or migration.
- A future export feature (not in v1 scope) MUST be the natural path for data
  portability, not a workaround.

### IV. Reading Experience First

Every feature decision MUST serve the reading experience. UI elements, animations,
and background processes MUST NOT interrupt, slow, or distract from active reading.
Specifically:
- Reading position saves MUST be debounced (≥500ms) so that rapid page turns do
  not cause perceptible lag.
- Theme and font changes MUST apply in under 200ms with no page reload.
- Side panels (TOC, bookmarks, annotations) MUST be dismissible without affecting
  the reading view state.
- Features that require user attention (e.g., error messages) MUST not block the
  reading view during active reading; use non-modal notifications where possible.

### V. Simplicity Over Complexity

The extension MUST use the simplest implementation that correctly satisfies a
requirement. YAGNI (You Aren't Gonna Need It) applies to all architectural decisions.
Specifically:
- No build pipeline or transpilation step is required; vanilla JavaScript (ES2022)
  targets Firefox directly.
- External dependencies MUST be justified by clear benefit over a native browser API
  equivalent; epub.js is justified by EPUB 3 specification complexity.
- Manifest V2 is used over V3 to avoid service-worker lifecycle complexity for
  local file I/O; migration to V3 requires a spec-justified amendment.
- New abstractions MUST solve a demonstrated problem, not a hypothetical one.

## Quality & Testing Standards

All code changes MUST pass `web-ext lint` before being considered complete.

Unit tests (Jest + jsdom) MUST cover:
- All storage service functions (`storage.js`, `library-service.js`,
  `annotation-service.js`)
- Book ID generation logic
- All message handler branches in `background.js`

Manual integration testing in Firefox MUST be performed for each user story before
marking it complete. The checklist in `quickstart.md` defines the minimum validation
steps.

Performance benchmarks from the spec (SC-001 through SC-010) serve as acceptance
criteria and MUST be validated during integration testing for the relevant user story.

## Development Workflow

1. Every new feature or change MUST begin with an updated or new spec (`spec.md`)
   reviewed against this constitution's principles.
2. Implementation planning (`plan.md`) MUST include a Constitution Check section
   that explicitly evaluates compliance with all five principles.
3. Tasks are organized by user story (per `tasks-template.md`) so each story can be
   independently validated before the next begins.
4. All user data flows introduced by a new feature MUST be reviewed against
   Principle I (Privacy by Default) and Principle III (User Data Ownership) before
   implementation begins.
5. Vendored dependencies (in `vendor/`) MUST be pinned to an exact version and
   updated deliberately — never automatically.

## Governance

This constitution supersedes all other development practices for this project.

**Amendment procedure**:
- Any change to this constitution requires a documented rationale in the Sync Impact
  Report (prepended as an HTML comment).
- MAJOR amendments (principle removal or redefinition) require explicit user approval
  before taking effect.
- MINOR amendments (new principles or material expansions) are approved by completing
  the `/speckit.constitution` workflow and verifying all dependent templates are
  consistent.
- PATCH amendments (wording, typo fixes) may be applied directly.

**Versioning**: Semantic versioning — MAJOR.MINOR.PATCH as defined above.

**Compliance**: All plan.md files MUST include a Constitution Check section. Any
violation of a principle MUST be listed in the Complexity Tracking table with
justification. Unjustified violations are blockers.

**Version**: 1.0.0 | **Ratified**: 2026-07-31 | **Last Amended**: 2026-07-31
