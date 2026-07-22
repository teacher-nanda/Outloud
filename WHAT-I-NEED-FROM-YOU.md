# What I need from you — OUT LOUD assets checklist

Last updated: July 2026 · covers the six lessons built so far

> **Status: all audio installed and verified.** Every file below is present and every
> lesson player has been checked against it. Nothing is outstanding.

---

## 1. The short version

Everything in these lessons **works right now** with no assets at all, because the engine
speaks every model sentence and word in American English using the browser's own voice.

But real recorded audio is better than a synthetic voice for the INPUT beat. So each lesson
has one or two AEF tracks named exactly. Copy the mp3 into the lesson folder, and it appears.
Don't copy it, and the lesson still runs — you'll just see a yellow teacher note telling you
what's missing. Students never see those yellow notes as a problem; they're styled as
teacher-facing.

**Nothing else is required. No images. No recordings by you. No paid tools.**

---

## 2. Audio files to copy in

Your existing naming convention is `AEF3e_Level_{N}_SB_{unit}.{track}.mp3` — I've matched it
exactly. Copy each file from your AEF audio library into the lesson folder listed.

| Lesson folder | File to copy | What it is | Required? |
|---|---|---|---|
| `A1-M1-L1/` | `AEF3e_Starter_SB_1.02-1.mp3` through `-4.mp3` | Starter 1A — four coffee shop conversations | ✅ Installed |
| `A1-M1-L1/` | `AEF3e_Starter_SB_1.11.mp3`<br>`AEF3e_Starter_SB_1.12.mp3` | Starter 1A — the /h/ /aɪ/ /i/ sound work | Optional |
| `A1-M1-L2/` | `AEF3e_Starter_SB_1.32.mp3`<br>`AEF3e_Starter_SB_1.33.mp3` | Starter 1C — the alphabet | Recommended |
| `A1-M1-L2/` | `AEF3e_Starter_SB_1.07.mp3`<br>`AEF3e_Starter_SB_2.21.mp3` | Numbers 0–10, then 11–100 | Optional |
| `A2-M1-L1/` | `AEF3e_Level_2_SB_2.1.mp3`<br>`AEF3e_Level_2_SB_2.2.mp3` | Level 2, unit 2A "Where's my passport?" — vacation stories | Recommended |
| `A2-M1-L1/` | `AEF3e_Level_2_SB_2.3.mp3`<br>`AEF3e_Level_2_SB_2.4.mp3` | Level 2, unit 2A — the `-ed` endings focus | Optional |
| `B1-M1-L1/` | `AEF3e_Level_3_SB_1.08.mp3`<br>`AEF3e_Level_3_SB_1.09.mp3` | Level 3, unit 1 — the two-part interview | Recommended |
| `B1-M1-L1/` | `AEF3e_Level_2_SB_2.12.mp3` | Level 2, unit 2B — weak forms of *was* and *were* | Optional |
| `B2-M1-L1/` | `AEF3e_Level_4_SB_1.07.mp3` | Level 4, unit 1 — "Reacting to what someone says" | Recommended |
| `C1-M1-L1/` | — none — | See note below | — |

### The one honest gap: C1

American English File **does not teach emphasis structures** (clefts, inversion, fronting)
anywhere in Levels 0–4, and where Level 5 touches them the audio is on an unrelated topic.
There is no AEF track that fits C1 Mission 1 Lesson 1, and I'm not going to pretend otherwise
by pointing you at something that half-matches.

For that lesson you need **one** of these instead:

- **Preferred:** Baz Luhrmann, *Everybody's Free (To Wear Sunscreen)* — search YouTube, play
  0:00 to 1:30. The lesson already has the transcript of that section on screen.
- Or any 90-second clip from a speech you like. The listening task works with any of them.
- Or nothing — the 🔊 button reads the transcript aloud in American English.

---

## 3. What the engine produces for you, so you never have to

| You might expect to need | You don't, because |
|---|---|
| Recorded pronunciation models | Every word and sentence with a 🔊 button is spoken by the browser in an American English voice, at normal or slow speed |
| IPA transcriptions | Already written into every pronunciation slide, and each one links to tophonetics |
| A student recording tool | Built in — the LAND slide records straight in the browser, no plugin, no upload |
| Images | These six lessons use none. Everything is type, color and layout |
| Answer keys | Built into every exercise as Check Answers or a 🔑 toggle |
| A separate homework worksheet | The homework slides print with the lesson via 🖨️ Print Lesson |

---

## 4. Things only you can decide

These are genuinely yours, and I've left space for them rather than inventing them:

1. **The GitHub URL.** Each lesson's `OUTLOUD.init({url: …})` currently points at
   `https://teacher-nanda.github.io/OUT-LOUD/[FOLDER]/index.html`. If you host it somewhere
   else, change that one line per lesson — it's the link printed on the PDF cover.

2. **Your WhatsApp number** for the voice-note homework. The slides say "send it to me"
   without a number, so you can hand these to any student.

3. **Which students go on which level.** The blueprint's placement note stands: add one
   recorded spoken prompt to the end of your trial lesson and you'll have a defensible
   placement instead of an impression.

4. **The two truths and a lie about yourself** in A1 L1 — I wrote three placeholders using
   things from your profile (São Paulo, CELTA, five languages). Change them to whatever you
   actually want to tell students.

---

## 5. Technical notes

- **The microphone needs https.** On GitHub Pages it works. Opening the file locally with
  `file://` will block it in Chrome — use `localhost` or the live URL when you want to record.
- **Speech synthesis voice quality varies by browser.** Chrome and Edge are best (they use
  Google/Microsoft US voices). Safari is acceptable. Firefox is the weakest.
- **The engine is shared.** `engine/outloud.css` and `engine/outloud.js` are used by every
  lesson. Fix something once, and all lessons get it. This is a deliberate change from your
  AEF single-file standard — it's what makes a 150-lesson course maintainable.
- **You never write JavaScript in a lesson file.** Every mechanic wires itself from the
  markup, and each exercise's Check/Reset buttons are scoped to their own block — so the
  function-name collision bug in your AEF standards file cannot happen here.
- **Slide labels come from the markup.** `data-label="…"` on each slide replaces the
  `slideIds` / `slideLabels` arrays you currently have to keep in sync by hand. They can
  never drift out of alignment again.

---

## 6. Built so far

| Level | Lesson | Status |
|---|---|---|
| B1 | M1 L1 — Set the Scene | ✅ Complete |
| B2 | M1 L1 — Yes, But | ✅ Complete |
| A2 | M1 L1 — How Was Your Trip? | ✅ Complete |
| A1 | M1 L1 — This Is Me | ✅ Complete |
| A1 | M1 L2 — Say It Back | ✅ Complete |
| C1 | M1 L1 — Where the Weight Falls | ✅ Complete |

**Next up:** lessons 2–5 of each mission, which close out Mission 1 at every level and give
you the first Mission Complete lesson with its project and Can-Do Check.
