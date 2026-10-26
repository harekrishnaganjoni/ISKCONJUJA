# Course System: General Setup Specification

Spec for building a reusable, database-driven course platform for ISKCON Juja's custom HTML/CSS/JS site with Supabase. The first course built on it is the public "Introduction to ISKCON". Later courses (harmonium, mṛdaṅga, Bhagavad-gītā, Bhakti-śāstri, Sadācāra) use the same system with no code changes.

**Scope:** this document covers structure, behaviour and data. Course content (text, quotes, quiz questions) is NOT hardcoded. It lives in the database and is entered separately.

---

## 1. Principles

1. **Content is data, structure is code.** Only the engine (page templates, block renderers, quiz engine, dashboards) is in code. Every title, quote, image link, video link and quiz question is a database record, editable from the admin side.
2. **One system, many course types.** Differences between courses (self-paced vs monitored, public vs members, learn vs skill) are settings on the course record, not separate code paths.
3. **Entitlement-based visibility.** People see only what they are entitled to. No locked cards, no teasers for hidden courses.
4. **Enforce rules in the database.** Visibility and permissions are enforced with Supabase Row-Level Security (RLS), not only by hiding things in the UI.
5. **Add blocks, not features.** New lesson content types are added as new block types without schema redesign.
6. **Calm, mobile-first design.** Many learners will be on phones with limited data. Keep pages light, lazy-load media.

---

## 2. Content hierarchy

```
Course
 └─ Module (chapter)
     └─ Lesson (one screen, ~3–5 min)
         └─ Block (text, quote, video, etc.; ordered)
     └─ Quiz (module review)
 └─ Final assessment (optional)
```

- Every level has `order_index`, `title`, `status` (draft/published), and timestamps.
- Reordering is done by changing `order_index`, never by rewriting content.

---

## 3. Course settings (fields on the course record)

| Setting | Values | Notes |
|---|---|---|
| `title`, `subtitle`, `description`, `cover_image_url` | text | |
| `category` | free tag/category table | for catalogue filters |
| `level` | beginner / intermediate / advanced | |
| `course_type` | learn / skill / certification | presets that switch defaults, see section 7 |
| `delivery_mode` | self_paced / monitored | monitored needs teacher + cohort |
| `visibility` | public / members / internal | see section 4 |
| `internal_group_id` | nullable | restricts an internal course to a group |
| `status` | draft / published / archived | only published appears to learners |
| `prerequisite_course_id` | nullable | must complete before enrolling |
| `estimated_minutes` | number | shown on cards |
| `discussion_mode` | off / ask_question / forum | see section 9 |
| `reviews_enabled` | boolean | |
| `lesson_feedback_enabled` | boolean | "Was this clear?" thumbs |
| `certificate_enabled` | boolean | |
| `pass_mark_percent` | number (default 70) | applies to final assessment |
| `accent_color` | hex, optional | per-course accent, defaults to site colour |

---

## 4. Visibility rule (core requirement)

> A visitor sees only what is relevant to them. The public sees only public courses. A logged-in member sees public and member courses. Teachers and internal groups additionally see their own.

| Viewer | Sees |
|---|---|
| Not logged in / guest | `visibility = public` AND `status = published` |
| Registered learner (non-member) | same as guest |
| Member | public + members |
| Internal group member | public + members + internal courses of their group |
| Teacher | the above + courses they are assigned to (including drafts they teach) |
| Course editor | courses they have edit rights on |
| Admin | everything |

**Implementation requirement:** write RLS policies so that `courses`, `modules`, `lessons`, `blocks`, `quizzes` and `questions` rows are only selectable if the parent course is visible to the requesting user. A hidden course's lessons must not be fetchable by guessing IDs. Draft content must never be returned to learners.

---

## 5. Identity and progress (guest → learner → member)

Progress must persist without forcing a password.

### Level 1: Guest (automatic)
- When a visitor opens a public course, create an **anonymous Supabase auth session** (`signInAnonymously`).
- Save progress, quiz attempts and notes against that anonymous user ID.
- No form shown at this stage.

### Level 2: Learner (name + email, passwordless)
- Prompt at natural points: end of Module 1, before the final test, before a certificate, or via a persistent "Save my progress" link.
- Collect: display name, email, and a one-line consent checkbox for data use.
- Email a **one-time code or magic link** (Supabase OTP). On verification, **link the email to the existing anonymous user** (`updateUser` with email) so no progress is lost.
- Returning on another device: enter email, receive code, progress restored.

### Level 3: Member
- A learner promoted to member (see Open Decisions, section 16) gains access to `members` courses and the forum.

### Notes
- Anonymous users who never add an email are retained for a configurable period (suggest 180 days of inactivity), then purged.
- Never use browser-only storage as the source of truth. It may be used as a cache only.

---

## 6. Roles and permissions

Store roles in a `user_roles` table (a user can have several). Do not put roles in editable profile fields.

| Role | Capabilities |
|---|---|
| Guest | View public published courses, save progress (anonymous session) |
| Learner | Guest + persistent account, reviews, questions, certificates |
| Member | Learner + member courses + forum participation |
| Teacher | See assigned courses/cohorts/students, mark submissions, answer questions, moderate their course's discussion, view student progress |
| Editor | Create/edit/publish content for courses they are granted |
| Admin | All of the above + user/role management, groups, certificate admin, settings |

Permission checks live in RLS policies and in server-side logic (Supabase functions), never solely in client JS.

---

## 7. Course type presets

`course_type` sets sensible defaults. Each default can be overridden per course.

| Preset | Defaults |
|---|---|
| **learn** | Reading + quotes + media; module review quizzes (ungraded); final test; ask-a-question |
| **skill** (harmonium, mṛdaṅga) | Demo video first; slow-motion/loop clips; play-along audio; practice log; self-check; optional teacher feedback on recordings; no final exam by default |
| **certification** (Bhakti-śāstri style) | Longer modules; graded exams; pass mark; teacher marking of written answers; certificate; usually monitored |

---

## 8. Delivery modes

### Self-paced
- Learner enrols (or auto-enrols) and starts any time.
- Automatic marking only (multiple choice, true/false, matching).
- Lessons may be strictly sequential or freely accessible (course-level toggle `sequential_unlock`).

### Monitored
- Course has one or more **teachers** and **cohorts**.
- A cohort has: name, optional start/end date, teacher(s), list of students.
- Teachers may unlock modules for the cohort on a schedule or manually.
- Enables human-marked question types (section 11) and teacher feedback threads.
- Learner progress visible to the assigned teacher.

---

## 9. Questions, discussion and forum

`discussion_mode` per course:

| Mode | Behaviour |
|---|---|
| `off` | Nothing shown |
| `ask_question` | "Ask a question" box per lesson. Visible only to teachers/admins. A teacher can **promote** an answered question to a public FAQ entry on that lesson. |
| `forum` | Course discussion board: threads, replies, display names, report button. For member/internal courses. |

Rules:
- Use a **display name** in all public discussion (never expose email or required real name).
- Public-facing threads are **pre-moderated** (approved before appearing). Member forums may be post-moderated with a report/hide flow.
- Soft-delete only; keep moderation history.
- Suggested default for the public introduction course: `ask_question`.

---

## 10. Reviews and feedback

Two layers:

1. **Lesson feedback** (if `lesson_feedback_enabled`): after each lesson, "Was this clear?" thumbs up/down, optional one-line comment. Aggregated per lesson in the teacher dashboard so confusing lessons are easy to spot.
2. **Course review** (if `reviews_enabled`): at course end, 1–5 stars, "what worked", "what should improve".
   - Private to admins/editors by default.
   - Admin can mark selected reviews as publishable (shown on the course page with display name only).

---

## 11. Block types (lesson building pieces)

A lesson is an ordered list of blocks. Each block has `type`, `order_index`, `content` (JSON), and `status`.

| Block type | Content fields |
|---|---|
| `text` | rich text (limited formatting: headings, bold, lists, links) |
| `quote` | `quote_text`, `speaker`, `source_reference`, `source_url` (e.g. Vedabase link), `verified` (bool), `verified_by`, `verified_at` |
| `image` | `url`, `alt_text`, `caption`, `credit`, `permission_note` |
| `gallery` | list of image items (timeline layouts supported) |
| `video` | `provider` (youtube/vimeo/self-hosted), `url`, `start_seconds`, `transcript`, `credit` |
| `audio` | `url`, `transcript`, `credit` |
| `analogy` | `title`, `explanation`, `image_url` (diagram), `quote_block_ref` (optional) |
| `key_point` | one highlighted takeaway sentence |
| `reflection` | `prompt`, `allow_private_note` (bool) |
| `practice` | `steps` (ordered list), `demo_video_ref`, `loop_audio_ref`, `log_enabled` |
| `download` | `file_url`, `label`, `type` (pdf, sheet music, śloka sheet) |
| `callout` | `style` (note/caution), `text` |
| `quiz_ref` | points to a quiz (inline mini-quiz) |

**Quote publishing guard (important):** a `quote` block with `verified = false` must not render on the public site, and the admin editor must show an "unverified" warning. This prevents unchecked quotations from going live.

Renderers are one function per block type. Adding a type means adding one renderer and one admin form.

---

## 12. Quizzes and assessments

### Entities
- `quizzes`: linked to a module (review), a lesson (inline), or a course (final). Fields: `kind` (review / final / practice), `pass_mark_percent`, `graded` (bool), `shuffle_questions`, `shuffle_options`, `max_attempts` (null = unlimited).
- `questions`: `type`, `prompt`, `media_ref` (optional image/audio), `explanation` (shown after answering), `points`, `order_index`.
- `question_options`: for choice-based types: `text`, `is_correct`.

### Question types
| Type | Marking |
|---|---|
| `multiple_choice` (single) | auto |
| `multi_select` | auto |
| `true_false` | auto |
| `matching` | auto |
| `audio_choice` (listen and identify, for music) | auto |
| `short_answer` | teacher (or keyword auto-check, optional) |
| `essay` | teacher |
| `file_submission` (audio/video/image upload) | teacher |

### Behaviour
- **Module review quizzes:** ungraded, gentle, no penalty; after each answer show the correct answer plus a one-line explanation; learner may retry freely.
- **Final assessment:** shows a score; pass mark gates the certificate.
- Store each attempt (`quiz_attempts`) with per-question answers (`attempt_answers`) and marks. Retain attempt history.
- Teacher-marked items sit in the **marking queue** with status `pending / marked`, a numeric mark, and a comment.

---

## 13. Certificates

- Controlled by `certificate_enabled` per course.
- **Issued when:** all required lessons are complete AND the final assessment is passed (if one exists).
- **Contents:** learner's display name (as entered), course title, completion date, ISKCON Juja, unique certificate ID.
- **Wording:** "Certificate of Completion" only. Never imply an accredited qualification.
- **Verification:** public page `/verify/<certificate_id>` showing name, course and date for a valid ID (no other personal data).
- **Template:** one per course (colour/title configurable), generated as PDF or printable page.
- **Admin:** list issued certificates, revoke, reissue.
- **Branding:** confirm with temple leadership before using any official ISKCON logo.

---

## 14. Data model (conceptual)

Field lists are indicative. Use UUID primary keys, `created_at` / `updated_at` everywhere.

**Content**
- `courses`: settings from section 3
- `modules`: `course_id`, `title`, `intro_text`, `order_index`, `status`
- `lessons`: `module_id`, `title`, `est_minutes`, `order_index`, `status`
- `blocks`: `lesson_id`, `type`, `content` (jsonb), `order_index`, `status`
- `quizzes`, `questions`, `question_options`: per section 12
- `lesson_faqs`: `lesson_id`, `question`, `answer`, `published`

**People and access**
- `profiles`: `user_id`, `display_name`, `consent_at`
- `user_roles`: `user_id`, `role`, optional `course_id` (for scoped teacher/editor)
- `groups`, `group_members`: for internal course access
- `course_groups`: which groups can see an internal course

**Delivery**
- `enrolments`: `user_id`, `course_id`, `cohort_id` (nullable), `status`, `enrolled_at`, `completed_at`
- `cohorts`: `course_id`, `name`, `starts_on`, `ends_on`
- `cohort_teachers`, `cohort_students`
- `module_unlocks`: `cohort_id`, `module_id`, `unlocked_at`

**Progress and results**
- `lesson_progress`: `user_id`, `lesson_id`, `status`, `completed_at`, `last_position`
- `quiz_attempts`, `attempt_answers`
- `practice_logs`: `user_id`, `lesson_id`, `logged_at`, `minutes`, `note`
- `submissions`: for file/essay answers, with `teacher_id`, `mark`, `feedback`, `status`
- `reflection_notes`: private learner notes

**Community and feedback**
- `questions_inbox`: `user_id`, `lesson_id`, `body`, `status`, `answered_by`, `answer`
- `forum_threads`, `forum_posts`: with `status` (pending/approved/hidden), `reported_count`
- `lesson_feedback`: `user_id`, `lesson_id`, `clear` (bool), `comment`
- `course_reviews`: `user_id`, `course_id`, `rating`, `worked`, `improve`, `publishable`

**Certificates**
- `certificates`: `certificate_id` (short unique code), `user_id`, `course_id`, `name_on_certificate`, `issued_at`, `revoked_at`

---

## 15. Interface specification

### Learner side
- **Catalogue:** card grid (cover, title, duration, level, category). Filters by category and level. Cards for hidden courses never appear. A small "Members" tag appears on member courses only for members.
- **Course page:** short promo, "What you'll learn" list, module list with estimated times, progress summary, **Start / Continue** button, reviews (if published).
- **Lesson screen:** top progress bar and breadcrumb ("Module 2 · Lesson 3 of 6"); blocks stacked vertically with media before its explanatory text; one key point at the end; Back / Next buttons pinned at the bottom; large readable type; works at 360px width.
- **Quiz screen:** one question per screen; immediate gentle feedback with a short explanation; progress dots; final test shows score summary.
- **Save-progress prompt:** non-blocking banner or modal at natural breakpoints (section 5).
- **Completion screen:** congratulation, score (if any), certificate download (if earned), review prompt, suggested next course.
- **Account page:** progress overview, certificates, saved reflection notes, email/name settings.

### Look and feel
Calm and warm: generous white space, one accent colour, readable serif or humanist sans body font, consistent across all courses. Respect reduced-motion preferences. Provide alt text and captions/transcripts for all media (accessibility and low-bandwidth use).

### Teacher / admin dashboard
- **My courses:** content editor (add/reorder modules, lessons, blocks), preview as learner, publish/unpublish, status badges.
- **Students:** per course and cohort: progress, last active, stuck indicator (e.g. no activity in 7 days), message/nudge.
- **Marking queue:** pending submissions, mark + comment, bulk filters.
- **Questions inbox:** unanswered first; answer; "publish as FAQ".
- **Discussion moderation:** pending approvals, reports, pin/hide.
- **Reviews and lesson feedback:** per-lesson clarity scores, review text, publish toggle.
- **Cohorts:** create, assign teachers, add students, unlock modules.
- **Certificates:** issued list, revoke/reissue.
- **Users and roles (admin):** assign roles, groups, member status.
- **Media library:** upload and reuse images/audio; store credit and permission note.

The editor should offer a **content verification checklist** for quote blocks (verified flag, source link).

---

## 16. Open decisions (defaults assumed until confirmed)

1. **How someone becomes a member:** options are admin approval, invite code from the temple, or automatic on registration. *Default: admin approval, with invite-code support as a later add-on.*
2. **Introduction course identity flow:** guest session first, email prompt at end of Module 1. *Default: yes.*
3. **Introduction course discussion mode:** `ask_question` only. *Default: yes.*
4. **Certificates:** enabled for the introduction course. *Default: yes, with the pass mark set at 70%.*

Confirm or change these in the first course's configuration. None require code changes.

---

## 17. Privacy and safety

- Collect only: display name, email (optional until account upgrade), progress data, content the user writes.
- Show a short consent line at signup. Link a plain-language privacy notice.
- Never display emails or real names publicly. Use display names.
- Kenya's Data Protection Act applies. Have the temple's legal contact confirm registration and retention requirements.
- Uploaded student recordings are visible only to the student and assigned teachers.
- Provide the learner a way to delete their account and data.
- Rate-limit anonymous session creation, question submission and OTP requests to prevent abuse.
- Sanitise all user-entered and rich text content before rendering.

---

## 18. Suggested build order

1. Database schema + RLS policies (visibility rule first; test with guest, member, teacher, admin accounts).
2. Anonymous sessions + email upgrade flow.
3. Learner pages: catalogue, course page, lesson player, block renderers (text, quote, image, video, analogy, key point).
4. Quiz engine (auto-marked types) + progress tracking.
5. Completion screen + certificate generation and verification page.
6. Admin/teacher dashboard: content editor first, then students, then marking queue.
7. Questions inbox, lesson feedback, course reviews.
8. Cohorts and monitored mode.
9. Forum (for member/internal courses).
10. Skill-course blocks (practice log, audio loops, file submissions).

The content for each course is entered through the editor (or seeded via import) after step 6. A JSON import/export of a whole course is recommended so courses can be backed up and drafted outside the site.

---

## 19. Acceptance checks

- A logged-out visitor cannot retrieve any member/internal course data by any URL or API call.
- Unverified quotes never render on public pages.
- Guest progress survives email upgrade and works on a second device after code login.
- Changing a quote, question or video link in the admin updates the course immediately, with no code deploy.
- A new course of a different type (e.g. a skill course) can be created entirely from the dashboard.
- Certificate verification page shows only name, course and date.
- Pages are usable on a 360px-wide phone on a slow connection.
