# RELEASE//ZERO

A playable operations console, built as a DevOps / Platform / Cloud engineering portfolio for **Akansh Mowar**.

Most engineering portfolios ask you to read. This one asks you to operate a release — and if you only have ninety seconds, it hands you a guided brief instead.

---

## Three ways in

| Route | Time | What it is |
| --- | --- | --- |
| **Recruiter Deck** | 71 sec | An auto-playing narrated brief, a 3D skill map, a role-fit calculator, a scrubbable career timeline and a Q&A console you can interrogate. |
| **Story Mode** | 8 missions | Take one release from commit to production. Diagnose a broken build, hunt a vulnerable fragment, seal an image, ride the release rail, roll out across a cluster city, shift live traffic, recover an incident, assemble a golden path. |
| **Arcade** | 4 games | Four genuinely playable games, each one secretly an interview question. |

---

## The arcade

Every game runs on the same Three.js renderer as the rest of the site.

**Pipeline Runner** — a 3D endless runner down the deployment tunnel. Jump failed stages, duck blocked promotions, collect passing gates. Speed ramps with distance, spawn density tightens, three hits and the release rolls back.
*Tests:* throughput under pressure. Keyboard, touch swipe and on-screen controls.

**Cluster Defense** — a live cluster with pods failing in waves. Each symptom has exactly one correct remediation: restarting a saturated service does nothing, scaling a crash loop just gives you more crash loops. Wrong calls cost availability, and unresolved faults drain faster the longer they sit.
*Tests:* triage discipline.

**Incident Command** — a terminal drill with a clock on it. Read the alert, type the command that actually helps. Every answer is a command you would really run, and every wrong answer explains why it is wrong.
*Tests:* command muscle memory.

**Root Cause Matrix** — twelve nodes hiding six symptom-to-cause pairings, one 80-second window. The pairings are real failure modes: a 502 straight after a deploy usually is a memory limit; a rollout that never completes usually is a bad readiness probe.
*Tests:* correlation under time pressure.

Scores persist locally. Seventeen achievements span the campaign, the arcade and the recruiter deck.

---

## Rendering

Everything visual is generated at runtime. **No 3D models, textures or image assets are downloaded or bundled.**

- **Custom GLSL** — the holographic ground plane (dual-frequency analytic grid, radial scan sweep, distance-scaled line width, glitch tearing), the GPU particle fields, the fresnel hologram panels and the volumetric light shafts are all hand-written shaders.
- **Instancing** — Cluster City draws 352 workload towers plus 352 roof beacons as two `InstancedMesh` draw calls, with per-instance height, colour and a rolling deploy wave computed each frame.
- **Canvas-texture type** — in-world labels are drawn to 2D canvases and cached, so the 3D scenes carry crisp text without fetching a font file or shipping a glyph atlas.
- **Cinematic camera** — each stage is authored as a *shot* (position, look target, FOV, roll, shake, ambient drift) and the rig interpolates between them. Stage changes fire a short FOV punch so movement reads as a cut without one.
- **Adaptive quality** — four tiers driven by a live performance monitor, with DPR, antialiasing, particle counts and the postprocessing stack all scaling down together. Reduced-motion and small screens start lower.
- **Postprocessing** — bloom, vignette, film grain and chromatic aberration that tightens during incident and high-speed stages.

The world canvas unmounts entirely while a game runs, so the GPU only ever drives one scene.

---

## Stack

React 19 · TypeScript (strict, `noUnusedLocals`, `noUnusedParameters`) · Vite 7 · React Three Fiber · Three.js · Drei · Zustand · postprocessing

Audio is fully synthesised with the Web Audio API — an ambient drone with a breathing filter plus a twelve-voice SFX bank. No audio files ship.

---

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm run typecheck      # strict tsc
npm test               # 106-assertion runtime harness
npm run lint:shaders   # GLSL uniform/varying consistency
npm run build          # production bundle
npm run preview
```

### Tests

`npm test` mounts every DOM surface in jsdom and drives the real state machines:

- data integrity — no dangling skill-graph edges, role weights sum to 1, anchors resolve
- the Q&A resolver against 17 natural-language probes, including substring traps
- a full campaign playthrough, asserting that wrong answers *don't* advance
- arcade scoring and personal-best logic
- all 20 campaign stages render
- every recruiter deck panel renders and responds

`npm run lint:shaders` cross-checks that every GLSL uniform has a matching JS value, that no varying is read without being written, and that every shader stage has a `main()`.

---

## Structure

```
src/
  app/          shell, routing, stylesheet
  data/         profile — skills graph, timeline, projects, Q&A base, brief script
  state/        system (routing, quality, achievements) · mission · arcade
  world/        canvas, camera rig, effects
    fx/         HoloGrid, Particles, Primitives (streams, panels, labels, shafts)
    zones/      seven environments
  games/        runner · defense · terminal · rootcause
  recruiter/    CommandDeck, AutoBrief, SkillConstellation, FitCheck, AskConsole
  ui/           chrome, boot, gate, story, arcade, palette, toasts
  lib/          utils, Q&A resolver
  audio/        Web Audio synthesis engine
tests/          runtime harness
tools/          shader linter
```

---

## Notes on honesty

Simulation telemetry, game scores and mission outcomes are fictional and labelled as such throughout. Every career fact — roles, dates, scale figures, certifications, project descriptions — is real, and the recruiter deck includes an explicit "where this role would stretch him" panel rather than only listing strengths.

The Q&A console answers from a fixed knowledge base using deterministic keyword matching. It makes no model calls and cannot invent anything.

## Accessibility

Keyboard navigation throughout, a command palette on `⌘K` / `K`, visible focus rings, ARIA labelling on progress and live regions, `prefers-reduced-motion` respected (which also drops render quality), an accessible bypass for the click-to-find security mission, and a complete text-only fallback when WebGL2 is unavailable.

## Deploying

Static output in `dist/`. `vercel.json` rewrites all paths to `index.html`. Netlify, Cloudflare Pages or any static host works identically — build command `npm run build`, output directory `dist`.
