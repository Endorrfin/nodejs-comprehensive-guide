import { renderToString } from "react-dom/server";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/lib/hashRouter.ts
function parseHash(raw) {
	const [seg, a] = raw.replace(/^#/, "").replace(/^\/+/, "").split("/");
	if (seg === "chapter" && a) return {
		name: "chapter",
		id: decodeURIComponent(a)
	};
	if (seg === "interview") return { name: "interview" };
	if (seg === "mental-models") return { name: "mental-models" };
	return { name: "map" };
}
/** Subscribe to hash-based routing. */
function useRoute() {
	const [route, setRoute] = useState(() => parseHash(location.hash));
	useEffect(() => {
		const onChange = () => {
			setRoute(parseHash(location.hash));
			window.scrollTo({
				top: 0,
				behavior: "auto"
			});
		};
		window.addEventListener("hashchange", onChange);
		return () => window.removeEventListener("hashchange", onChange);
	}, []);
	return route;
}
/** Programmatic navigation. `to` is a route path like "/chapter/event-loop". */
function go(to) {
	const target = to.startsWith("#") ? to : "#" + to;
	if (location.hash === target) window.scrollTo({
		top: 0,
		behavior: "auto"
	});
	else location.hash = target;
}
//#endregion
//#region src/data/concepts.ts
var GROUPS = [
	{
		id: "foundations",
		name: "Foundations & Mental Model",
		accent: "var(--grp-foundations)",
		blurb: "What Node is, why it exists, where it wins and loses, the big picture."
	},
	{
		id: "runtime",
		name: "The Runtime Core",
		accent: "var(--grp-runtime)",
		blurb: "The heart: event loop, async, V8 & GC, concurrency, streams, modules."
	},
	{
		id: "systems",
		name: "Building Real Systems",
		accent: "var(--grp-systems)",
		blurb: "Errors, HTTP internals, performance, security, production patterns."
	},
	{
		id: "mastery",
		name: "Mastery",
		accent: "var(--grp-mastery)",
		blurb: "Modern Node, the interview bank, mental models, the whole picture."
	}
];
var stub = (c) => ({
	sections: c.sections ?? [{
		kind: "prose",
		md: `This chapter is seeded with its mental model and key points; the full deep-dive (prose, diagrams, simulators, interview Q&A) lands in an upcoming session. The takeaways below are already accurate and exam-ready.`
	}],
	pitfalls: c.pitfalls ?? [],
	interview: c.interview ?? [],
	seeAlso: c.seeAlso ?? [],
	sources: c.sources ?? [],
	stub: true,
	...c
});
var CHAPTERS = [
	stub({
		id: "what-is-node",
		group: "foundations",
		order: 1,
		title: "What is Node.js",
		tagline: "A JavaScript runtime built on V8, with non-blocking I/O via libuv.",
		readMins: 6,
		mentalModel: "Node = V8 (runs JS) + libuv (event loop + async I/O + a 4-thread pool) + C++ bindings. Your JS is single-threaded; the waiting is offloaded.",
		keyPoints: [
			"Node runs JavaScript outside the browser, on Google's V8 engine.",
			"libuv provides the event loop, asynchronous I/O, and a small thread pool.",
			"Non-blocking by design: start I/O, register a callback, keep serving other work.",
			"One language across the whole stack, with the largest package ecosystem (npm)."
		],
		seeAlso: [
			"architecture",
			"event-loop",
			"strengths"
		]
	}),
	stub({
		id: "strengths",
		group: "foundations",
		order: 2,
		title: "Strengths",
		tagline: "Where Node shines — I/O-bound, real-time, one language end-to-end.",
		readMins: 5,
		mentalModel: "Node shines when the bottleneck is waiting (network, disk, DB), not computing.",
		keyPoints: [
			"I/O concurrency: thousands of sockets on a single thread via the event loop.",
			"Real-time (WebSockets, streaming) and JSON/HTTP APIs are a natural fit.",
			"One language front-to-back; huge ecosystem; fast iteration.",
			"Low memory per connection vs thread-per-request models."
		],
		seeAlso: [
			"weaknesses",
			"event-loop",
			"what-is-node"
		]
	}),
	stub({
		id: "weaknesses",
		group: "foundations",
		order: 3,
		title: "Weaknesses",
		tagline: "Where Node is weak and why — CPU-bound work on one thread.",
		readMins: 5,
		mentalModel: "One thread for JS: a long computation freezes everything. Offload or chunk it.",
		keyPoints: [
			"CPU-bound work blocks the single thread — throughput collapses.",
			"A long synchronous task in one request adds latency to all in-flight requests.",
			"Async control flow and error handling are easy to get subtly wrong.",
			"Heavy numeric/compute needs worker_threads or native addons."
		],
		seeAlso: [
			"strengths",
			"concurrency",
			"performance"
		]
	}),
	stub({
		id: "competitors",
		group: "foundations",
		order: 4,
		title: "Competitors",
		tagline: "Deno, Bun, Go, Python, Java, .NET, Rust, Elixir — when each wins.",
		readMins: 7,
		mentalModel: "Pick by bottleneck: I/O & ecosystem → Node; CPU & concurrency → Go/Rust/JVM; soft-real-time at scale → Elixir.",
		keyPoints: [
			"Deno & Bun: JS/TS runtimes — Bun chases speed, Deno web-standards & security.",
			"Go: goroutines for easy concurrency, single static binary, strong for CPU+I/O.",
			"Python: ecosystem & ML, but the GIL limits CPU parallelism.",
			"Java/.NET: mature, truly multi-threaded, strong for CPU-heavy enterprise services.",
			"Rust/Elixir: Rust for max performance & safety; Elixir/BEAM for massive concurrency."
		],
		seeAlso: [
			"strengths",
			"weaknesses",
			"modern-node"
		]
	}),
	stub({
		id: "architecture",
		group: "foundations",
		order: 5,
		title: "Top-level architecture",
		full: "Top-level architecture — who does what",
		tagline: "V8 · libuv · C++ bindings · core JS libraries, and how they interact.",
		readMins: 7,
		mentalModel: "Layers: your JS → core JS API → C++ bindings → { V8, libuv } → OS.",
		keyPoints: [
			"V8 executes JS and manages the heap; it knows nothing about files or sockets.",
			"libuv owns the event loop (6 phases), the async I/O abstraction, and the thread pool.",
			"C++ bindings bridge JS ↔ libuv/OS; the core JS library wraps them (fs, http, streams).",
			"The one rule: JavaScript is single-threaded; I/O is not."
		],
		seeAlso: [
			"what-is-node",
			"event-loop",
			"concurrency"
		]
	}),
	{
		id: "event-loop",
		group: "runtime",
		order: 6,
		title: "Event Loop",
		full: "The Event Loop — the heart of Node",
		tagline: "Six libuv phases per tick, plus the microtask checkpoints between them.",
		readMins: 12,
		mentalModel: "One thread walks six phases in a circle (timers → pending → poll → check → close). After every callback it drains microtasks: nextTick first, then Promises. Don't memorize phases — know where your callback runs.",
		sections: [
			{
				kind: "prose",
				md: "Node.js runs your JavaScript on a **single thread**. That same thread executes your code *and* runs the **event loop** — the mechanism that lets a single-threaded runtime juggle thousands of concurrent connections without blocking. The loop itself lives in **libuv** (written in C), not in V8. V8 runs your JS and owns its heap; **libuv** owns the loop, the OS event notifications (epoll/kqueue/IOCP), and a small thread pool."
			},
			{
				kind: "callout",
				tone: "senior",
				title: "The loop is not in V8",
				md: "A common misconception in interviews. V8 only knows how to execute JavaScript and manage its heap. The event loop, timers, sockets and the thread pool are all **libuv**. `node` is the glue between them."
			},
			{
				kind: "figure",
				fig: "event-loop-ring",
				caption: "One tick of the event loop: six phases, with microtasks draining between every callback."
			},
			{
				kind: "prose",
				md: "Each turn of the loop is a **tick**, and every tick walks through six phases in a fixed order. Each phase owns a FIFO queue of callbacks; the loop runs callbacks in the current phase until that queue empties (or a system limit is hit), then moves to the next phase."
			},
			{
				kind: "table",
				caption: "The six phases, in order.",
				head: [
					"#",
					"Phase",
					"What runs here",
					"Example"
				],
				rows: [
					[
						"1",
						"timers",
						"callbacks for expired setTimeout / setInterval",
						"setTimeout(fn, 100)"
					],
					[
						"2",
						"pending callbacks",
						"a few system callbacks deferred from the previous loop",
						"some TCP errors (ECONNREFUSED)"
					],
					[
						"3",
						"idle, prepare",
						"libuv internal only — never your code",
						"—"
					],
					[
						"4",
						"poll",
						"retrieve new I/O events; run almost all I/O callbacks; may block here",
						"fs.readFile, incoming sockets"
					],
					[
						"5",
						"check",
						"setImmediate callbacks",
						"setImmediate(fn)"
					],
					[
						"6",
						"close callbacks",
						"'close' events",
						"socket.on('close', …)"
					]
				]
			},
			{
				kind: "callout",
				tone: "tip",
				title: "Most of your code runs in poll",
				md: "HTTP handlers, DB results, file reads — their callbacks fire in the **poll** phase, which is why the vast majority of loop time lives there."
			},
			{
				kind: "prose",
				md: "Between phases — and after **every** callback — Node drains two **microtask** queues before continuing: first the **`process.nextTick`** queue, then the **Promise** queue (`.then` / `await` / `queueMicrotask`). Microtasks are **not** a loop phase; they run at every checkpoint. That is exactly why a flood of `nextTick` callbacks can *starve* the loop — the loop can't advance until the microtask queues are empty."
			},
			{
				kind: "sim",
				sim: "event-loop"
			},
			{
				kind: "prose",
				md: "So the execution order of the classic puzzle is: **all synchronous code**, then **`nextTick`**, then **Promises**, then the loop's macrotasks (timers / poll / check). Step through it in the simulator above, then read the program below."
			},
			{
				kind: "code",
				lang: "js",
				code: `console.log('start');                          // sync
setTimeout(() => console.log('timeout'), 0);   // timers phase
setImmediate(() => console.log('immediate'));  // check phase
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('end');                            // sync`,
				note: "Output: start, end, nextTick, promise, then timeout / immediate. In the MAIN module the order of setTimeout(0) vs setImmediate is NOT guaranteed — it depends on loop timing."
			},
			{
				kind: "compare",
				a: "setTimeout(fn, 0)",
				b: "setImmediate(fn)",
				rows: [
					[
						"Runs in phase",
						"timers (phase 1)",
						"check (phase 5)"
					],
					[
						"In the main module",
						"order vs setImmediate is non-deterministic",
						"order vs setTimeout is non-deterministic"
					],
					[
						"Inside an I/O callback",
						"runs on the NEXT tick",
						"runs first — same tick, right after poll"
					],
					[
						"Use it to",
						"defer by a real (minimum) delay",
						"run right after the current poll phase"
					]
				]
			},
			{
				kind: "callout",
				tone: "warn",
				title: "Never block the loop",
				md: "A synchronous CPU task (a huge `JSON.parse`, sync crypto, a tight loop) freezes the **entire** process — no I/O, no timers, no new connections. Offload to a `worker_thread` or break the work into chunks. See **Concurrency**."
			}
		],
		keyPoints: [
			"The event loop is single-threaded and lives in libuv, not V8.",
			"Six phases per tick, fixed order: timers → pending → idle/prepare → poll → check → close.",
			"Microtasks (nextTick, then Promise) drain after every callback and between phases — they are not a phase.",
			"process.nextTick has higher priority than Promise microtasks.",
			"Most application callbacks run in the poll phase.",
			"setImmediate fires in check; inside an I/O callback it beats setTimeout(0).",
			"Blocking the thread blocks everything — keep callbacks short, offload CPU work."
		],
		pitfalls: [
			{
				title: "Treating microtasks as a phase",
				body: "They aren't. nextTick/Promise callbacks run at every checkpoint, so recursive nextTick can starve I/O entirely — the loop never advances to its next phase."
			},
			{
				title: "Assuming setTimeout(0) runs before setImmediate",
				body: "In the main module the order is timing-dependent and not guaranteed. Determinism only holds inside an I/O callback, where setImmediate wins."
			},
			{
				title: "Using process.nextTick to mean 'later'",
				body: "nextTick is sooner than a Promise and far sooner than a timer. To defer work, queueMicrotask or setImmediate is usually correct; misusing nextTick starves the loop."
			},
			{
				title: "Confusing concurrency with parallelism",
				body: "The loop gives concurrency on one thread. CPU-bound work is still serial — it needs worker_threads for real parallelism."
			}
		],
		interview: [
			{
				q: "Walk me through the phases of the event loop.",
				a: "Six phases per tick in fixed order: timers (expired setTimeout/Interval), pending callbacks (a few deferred system callbacks), idle/prepare (internal), poll (retrieve & run I/O callbacks, may block), check (setImmediate), close callbacks. After every callback and between phases, microtasks drain: the nextTick queue first, then the Promise queue.",
				level: "senior"
			},
			{
				q: "nextTick vs Promise.then vs setImmediate vs setTimeout(0) — what order?",
				a: "Synchronous code first. Then microtasks: all nextTick, then all promises. Then macrotasks by phase: setTimeout(0) in timers, setImmediate in check. In the main module timeout-vs-immediate is non-deterministic; inside an I/O callback setImmediate runs first.",
				level: "senior"
			},
			{
				q: "How can you starve the event loop?",
				a: "Recursively scheduling process.nextTick (or, less aggressively, promises) keeps a microtask queue non-empty, so the loop never advances — timers and I/O never run. Any long synchronous CPU work also blocks the single thread.",
				level: "staff"
			},
			{
				q: "Why does setImmediate beat setTimeout(0) inside a file-read callback?",
				a: "The read callback runs in the poll phase. The next phase in the same tick is check (setImmediate), so the immediate fires first; the timer waits for the next tick's timers phase.",
				level: "staff"
			},
			{
				q: "Is the event loop part of V8?",
				a: "No. V8 executes JavaScript and manages its heap. The event loop, timers, the thread pool and OS I/O notifications are all libuv. Node wires them together.",
				level: "senior"
			}
		],
		seeAlso: [
			"async-model",
			"concurrency",
			"v8-gc",
			"streams"
		],
		sources: [
			{
				title: "Node.js — The event loop, timers, and process.nextTick()",
				url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick"
			},
			{
				title: "libuv — Design overview",
				url: "https://docs.libuv.org/en/v1.x/design.html"
			},
			{
				title: "Node.js docs — process.nextTick()",
				url: "https://nodejs.org/api/process.html#processnexttickcallback-args"
			}
		]
	},
	{
		id: "async-model",
		group: "runtime",
		order: 7,
		title: "Async model",
		full: "Async model — callbacks → promises → async/await",
		tagline: "Callbacks, promises, async/await, and micro- vs macro-task ordering.",
		readMins: 11,
		mentalModel: "await pauses the function, not the thread — its continuation becomes a microtask, so the loop keeps serving other work and resumes you at the next checkpoint.",
		sections: [
			{
				kind: "prose",
				md: "Node's whole value proposition is doing other work *while it waits*. The open question is how you **express** that waiting in code. Three styles evolved, each desugaring into the one before it: **callbacks** are the raw primitive libuv hands you; **promises** are objects representing a future value, turning nesting into a flat chain; **async/await** is syntax that makes promise-based code read like ordinary sequential code. They are not three engines — they are three *ergonomics* over the same event loop."
			},
			{
				kind: "callout",
				tone: "senior",
				title: "It's sugar, not a second engine",
				md: "`async`/`await` compiles down to promises and the microtask queue. `await x` evaluates `x`, wraps it in a promise if it isn't one already, **suspends** the function, and schedules the remainder as a microtask. The thread is never blocked — which is exactly why one `await` in a request handler doesn't stop the server from handling other requests."
			},
			{
				kind: "table",
				caption: "Same job, three ergonomics — all desugar to the layer above.",
				head: [
					"Aspect",
					"Callbacks",
					"Promises",
					"async/await"
				],
				rows: [
					[
						"Shape",
						"nested functions",
						"flat .then() chain",
						"linear, sync-looking"
					],
					[
						"Errors",
						"manual (err, …) per step",
						"one .catch()",
						"try / catch"
					],
					[
						"Compose",
						"awkward by hand",
						".then / Promise.all",
						"await / Promise.all"
					],
					[
						"Returns",
						"nothing — it calls back",
						"a Promise",
						"a Promise"
					],
					[
						"Underneath",
						"the primitive",
						"wraps callbacks",
						"sugar over Promises"
					]
				]
			},
			{
				kind: "code",
				lang: "js",
				code: `const fs = require('node:fs');
const fsp = require('node:fs/promises');

// 1) Callbacks — nesting grows with every step ('callback hell')
fs.readFile('config.json', 'utf8', (err, raw) => {
  if (err) return done(err);
  let cfg;
  try { cfg = JSON.parse(raw); } catch (e) { return done(e); }
  fetchUser(cfg.userId, (err, user) => {
    if (err) return done(err);          // error handling at every level
    done(null, user.name);
  });
});

// 2) Promises — a flat chain, one .catch for the whole pipeline
fsp.readFile('config.json', 'utf8')
  .then((raw) => JSON.parse(raw))
  .then((cfg) => fetchUser(cfg.userId))
  .then((user) => user.name)
  .catch((err) => { /* one place for every failure above */ });

// 3) async/await — reads top-to-bottom, errors via ordinary try/catch
async function getName() {
  try {
    const cfg  = JSON.parse(await fsp.readFile('config.json', 'utf8'));
    const user = await fetchUser(cfg.userId);
    return user.name;
  } catch (err) { /* the same failures, normal control flow */ }
}`,
				note: "All three register a continuation and return to the loop — identical at runtime. async/await only wins on readability and on putting every failure in one try/catch."
			},
			{
				kind: "prose",
				md: "So where does the code *after* an `await` actually run? Not on a timer, not vaguely 'soon' — it runs at the very next **microtask checkpoint**. Recall from the [Event Loop](#/chapter/event-loop) that after the synchronous script, and after *every* callback, Node drains two microtask queues — **`process.nextTick` first, then promises** — completely, before it touches the next macrotask. `await` schedules its continuation onto that promise queue. Therefore an awaited continuation **always beats `setTimeout(0)`** and **always loses to synchronous code**."
			},
			{
				kind: "figure",
				fig: "await-timeline",
				caption: "await suspends the function and queues its continuation as a single microtask — the one thread is freed, not blocked."
			},
			{
				kind: "table",
				caption: "The priority ladder. The whole microtask block (2–3) drains before any macrotask (4–5).",
				head: [
					"#",
					"Runs",
					"Queue / phase",
					"Scheduled by"
				],
				rows: [
					[
						"1",
						"All synchronous code",
						"the call stack",
						"plain statements; an async body up to its first await"
					],
					[
						"2",
						"process.nextTick callbacks",
						"nextTick queue (microtask)",
						"process.nextTick(fn)"
					],
					[
						"3",
						"Promise reactions",
						"microtask queue",
						"then / catch / finally · await · queueMicrotask(fn)"
					],
					[
						"4",
						"Timers",
						"timers phase (macrotask)",
						"setTimeout(fn, 0) · setInterval"
					],
					[
						"5",
						"setImmediate",
						"check phase (macrotask)",
						"setImmediate(fn)"
					]
				]
			},
			{
				kind: "prose",
				md: "That gives a strict, predictable order. Step a real program through it below — **predict each line before you advance**. The three scenarios build up: micro-vs-macro, then `await`, then two async functions interleaving."
			},
			{
				kind: "sim",
				sim: "async-order"
			},
			{
				kind: "callout",
				tone: "warn",
				title: "nextTick-vs-Promise order flips between CommonJS and ESM",
				md: "The simulator shows the canonical **CommonJS** 'main script' order, where `process.nextTick` drains before the Promise queue. In an **ES module**, the top-level body is *itself* evaluated during a microtask drain, so a top-level `Promise.then` can run **before** a top-level `process.nextTick`. Verified on Node 22. Lesson: never rely on nextTick-vs-promise ordering across module systems — and prefer `queueMicrotask` to `process.nextTick` for 'run right after this' work."
			},
			{
				kind: "prose",
				md: "Now without the visual aid. Five snippets — read the queues and call the exact output. Each answer was captured from real Node, and each explanation tells you *why*."
			},
			{
				kind: "sim",
				sim: "async-quiz"
			},
			{
				kind: "prose",
				md: "`await` is **sequential by default** — its great virtue and its classic trap. Awaiting inside a loop makes N independent calls run one after another, turning a 50 ms job into 50 × N ms. If the calls don't depend on each other, start them all and await together with `Promise.all`."
			},
			{
				kind: "code",
				lang: "js",
				code: `// ❌ Serial: each await waits for the previous — total ≈ sum of latencies
async function serial(ids) {
  const users = [];
  for (const id of ids) {
    users.push(await fetchUser(id));     // N round-trips, strictly one at a time
  }
  return users;
}

// ✅ Concurrent: start them all, then await — total ≈ the slowest one
async function concurrent(ids) {
  return Promise.all(ids.map((id) => fetchUser(id)));
}`,
				note: "Reach for Promise.allSettled when one failure shouldn't cancel the rest; Promise.all rejects as soon as any single call rejects."
			},
			{
				kind: "compare",
				a: "await in series",
				b: "Promise.all([...])",
				rows: [
					[
						"Execution",
						"one after another — each awaits the last",
						"all started up front, run concurrently"
					],
					[
						"Total latency",
						"≈ sum of every call",
						"≈ the slowest single call"
					],
					[
						"Use when",
						"each step needs the previous result",
						"the calls are independent"
					],
					[
						"On failure",
						"stops at the first throw",
						"rejects on the first rejection (allSettled keeps going)"
					]
				]
			},
			{
				kind: "callout",
				tone: "tip",
				title: "Handle every rejection — including the ones you forgot to await",
				md: "`try/catch` around `await` catches throws *and* rejected awaits — but **not** a promise you never awaited (a 'floating' promise), whose rejection becomes an `unhandledRejection`. Await it, `.catch()` it, or hand it to `Promise.all`. Use `Promise.allSettled` when one failure shouldn't sink the batch, and treat `process.on('unhandledRejection')` as a crash-and-restart backstop, not a handling strategy. See [Error handling](#/chapter/errors)."
			}
		],
		keyPoints: [
			"Three eras over one loop: callbacks → promises → async/await (sugar over promises).",
			"await pauses the function, not the thread; its continuation is a microtask scheduled at the next checkpoint.",
			"Microtasks drain fully before any macrotask: process.nextTick first, then promises, then timers/check.",
			"An awaited continuation beats setTimeout(0) but never beats synchronous code.",
			"async/await is sequential by default — use Promise.all for independent work (latency ≈ slowest, not sum).",
			"A promise you don't await or .catch() is a floating promise — its rejection is lost (unhandledRejection).",
			"CJS vs ESM: top-level nextTick-vs-promise ordering differs, because an ES module top level is already a microtask drain."
		],
		pitfalls: [
			{
				title: "await in a loop for independent work",
				body: "for (const x of xs) await f(x) runs strictly serially — N×latency. If the calls don't depend on each other, Promise.all(xs.map(f)) collapses it to ≈ one call's latency. Only keep the loop when each step truly needs the previous result."
			},
			{
				title: "Floating promises",
				body: "Calling an async function without await/.catch() (or in a forEach, which ignores returned promises) detaches it: errors surface as unhandledRejection, and ordering becomes a race. Await it, catch it, or collect it into Promise.all."
			},
			{
				title: "Thinking await yields fairly to I/O",
				body: "await only yields to the microtask queue, not to macrotasks. A tight loop of await null (or recursive promise chains) floods microtasks and starves timers and I/O — the same way recursive process.nextTick does."
			},
			{
				title: "The explicit-Promise-construction antipattern",
				body: "Wrapping an already-promise-returning API in new Promise((res, rej) => …) invites double-resolve bugs and swallowed errors. Only construct a Promise to adapt a raw callback/event API; otherwise just return the existing promise."
			},
			{
				title: "Assuming nextTick-before-promise everywhere",
				body: "True in CommonJS, but in an ES module the top level is already inside a microtask drain, so a top-level Promise.then can run before a top-level process.nextTick. Don't encode that ordering into logic."
			}
		],
		interview: [
			{
				q: "Is async/await just promises? What does await actually do?",
				a: "Yes — it's syntax over promises. await evaluates its operand, wraps a non-promise in a resolved promise, suspends the async function, and schedules the rest of the body as a microtask (one tick, since V8's await optimization). When the awaited promise settles, the continuation runs at the next microtask checkpoint. The thread is never blocked; the function is.",
				level: "senior"
			},
			{
				q: "process.nextTick vs Promise.then vs setTimeout(0) — what order, and why microtasks first?",
				a: "Synchronous code, then microtasks, then macrotasks. Within microtasks the nextTick queue drains before the promise queue (in CommonJS). setTimeout(0) is a timers-phase macrotask, so it runs after the entire microtask block. Microtasks run first because Node drains both microtask queues to empty after every callback and between phases — they are checkpoints, not a phase.",
				level: "senior"
			},
			{
				q: "You have 10 independent async calls. How do you run them, and what's the latency difference vs awaiting in a loop?",
				a: "Start them concurrently and join: await Promise.all(ids.map(fetch)). Awaiting in a loop is serial, so total ≈ sum of all 10 latencies; Promise.all overlaps them, so total ≈ the slowest one. If failures should not cancel the batch, use Promise.allSettled; for the first success, Promise.any; for the first to settle, Promise.race.",
				level: "senior"
			},
			{
				q: "Can promises or async/await starve the event loop?",
				a: "Yes. await only yields to the microtask queue. A recursive promise chain or a tight await-null loop keeps the microtask queue non-empty, so the loop never advances to timers or I/O — the same starvation pattern as recursive process.nextTick, just one priority tier lower. CPU-bound work between awaits still blocks the thread outright.",
				level: "staff"
			},
			{
				q: "Does try/catch catch all errors in an async function? What about Promise.all?",
				a: "try/catch catches synchronous throws and rejections of awaited promises. It does NOT catch a promise you didn't await (a floating promise) — that becomes an unhandledRejection. Promise.all rejects as soon as any input rejects, abandoning the others' results (they still run); use Promise.allSettled to get every outcome regardless of individual failures.",
				level: "staff"
			}
		],
		seeAlso: [
			"event-loop",
			"errors",
			"concurrency",
			"streams"
		],
		sources: [
			{
				title: "V8 — Faster async functions and promises (the await microtask optimization)",
				url: "https://v8.dev/blog/fast-async"
			},
			{
				title: "MDN — Using microtasks in JavaScript with queueMicrotask()",
				url: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide"
			},
			{
				title: "Node.js — The event loop, timers, and process.nextTick()",
				url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick"
			},
			{
				title: "MDN — async function",
				url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function"
			}
		]
	},
	{
		id: "v8-gc",
		group: "runtime",
		order: 8,
		title: "V8, JIT, memory & GC",
		full: "V8 · JIT · memory & garbage collection",
		tagline: "Hidden classes, the four JIT tiers, generational GC, and where the pauses come from.",
		readMins: 12,
		mentalModel: "Most objects die young. A fast Scavenge copies the few survivors out of the nursery and flips; objects that live long enough are promoted to old space, collected by the slower Mark-Sweep-Compact. Meanwhile V8 tiers hot functions up — and deoptimizes them when your assumptions break.",
		sections: [
			{
				kind: "prose",
				md: "V8 does two invisible jobs for you: it **compiles and runs** your JavaScript, and it **manages memory** so you never call `free()`. Both are silent until they become your bottleneck — a function that won't optimize, or a garbage collector that stalls the event loop. This chapter is about making the invisible legible: the **compilation pipeline** (Ignition → Sparkplug → Maglev → TurboFan), the **object model** (hidden classes + inline caches) that decides whether your code is fast, and the **generational garbage collector** (Orinoco) that decides when it pauses."
			},
			{
				kind: "prose",
				md: "V8 never waits to 'compile the whole program' — it starts fast and gets faster. Source is parsed to bytecode and run immediately by **Ignition**, the interpreter. As a function runs more, V8 *tiers it up* through progressively more optimizing compilers, trading compile time for faster machine code. Each tier is a bet that the function is worth optimizing and that its observed types will hold."
			},
			{
				kind: "table",
				caption: "V8's compilation tiers (Node 22 ships V8 12.4 — Maglev is enabled by default on x64/arm64).",
				head: [
					"Tier",
					"Role",
					"Compiles",
					"Code quality"
				],
				rows: [
					[
						"Ignition",
						"bytecode interpreter — runs everything first",
						"—",
						"baseline"
					],
					[
						"Sparkplug",
						"baseline JIT, no optimization",
						"near-instant",
						"modest"
					],
					[
						"Maglev",
						"mid-tier optimizing JIT (default in Node 22)",
						"fast",
						"good"
					],
					[
						"TurboFan",
						"top-tier optimizing JIT for the hottest code",
						"slow",
						"peak"
					]
				]
			},
			{
				kind: "callout",
				tone: "senior",
				title: "Optimization is speculative — and reversible",
				md: "Maglev and TurboFan optimize on **assumptions** gathered at lower tiers: 'this argument is always a small integer', 'this object always has this shape'. Violate an assumption at runtime — pass a string where a number always flowed, mutate an object's shape — and V8 **deoptimizes**: it throws away the optimized code and falls back to a lower tier. A hot path that keeps deopting is *slower* than one that never optimized. Keep the types and shapes at a call site **stable**."
			},
			{
				kind: "prose",
				md: "Why do shapes matter so much? JavaScript objects look dynamic, but V8 backs them with **hidden classes** (a.k.a. *maps* or *shapes*): two objects created the same way share one hidden class, so V8 can compile a property access into a fixed memory offset. **Inline caches** then memoize each property-access site by the shapes it has seen. Same shape every time (**monomorphic**) → the IC hits and access is near-C-speed. A handful of shapes (**polymorphic**) is fine; many shapes (**megamorphic**) blows the cache back to a slow dictionary lookup."
			},
			{
				kind: "code",
				lang: "js",
				code: `// ✅ One hidden class: same fields, same order, set up front
class Point { constructor(x, y) { this.x = x; this.y = y; } }
const a = new Point(1, 2);
const b = new Point(3, 4);   // a and b share a shape → inline caches hit

// ❌ Shape drift defeats the optimizer
const p = {}; p.x = 1; p.y = 2;
const q = {}; q.y = 2; q.x = 1;   // different insertion order → different shape
q.z = 3;                          // a late property mutates the shape again
delete p.x;                       // 'delete' drops the object to slow dictionary mode`,
				note: "Rule of thumb: initialize every field in the constructor, in the same order; don't add properties late or 'delete' them; don't mix types at a call site. Stable shapes are what let the JIT keep its optimized code."
			},
			{
				kind: "prose",
				md: "The second invisible job is memory. V8's heap is **generational**, built on one empirical observation — the *generational hypothesis*: **most objects die young**. So the heap is split into a small **young generation** (the nursery), collected very often and cheaply, and a larger **old generation**, collected rarely. The whole collector — codenamed **Orinoco** — is engineered to keep the main thread running by being parallel, incremental and concurrent."
			},
			{
				kind: "figure",
				fig: "gc-heap",
				caption: "The generational heap: objects are born in the young generation (two semi-spaces, collected by Scavenge) and promoted to the old generation (collected by Mark-Sweep-Compact)."
			},
			{
				kind: "prose",
				md: "The **minor GC** is the **Scavenger**. The young generation is two equal **semi-spaces**: allocation fills the active *From* space; when it's full, V8 copies the (few) live objects into the empty *To* space, abandons everything else in one stroke, and **flips** — *To* becomes the new active space. Its cost is proportional to **survivors, not garbage**, which is exactly why churning millions of short-lived objects stays cheap. An object that survives about **two** scavenges is **promoted** to old space. The Scavenge is parallel but **stop-the-world** — short enough to be negligible in most workloads."
			},
			{
				kind: "prose",
				md: "The **major GC** collects old space with **Mark-Sweep-Compact**: *mark* every reachable object, *sweep* the dead, and *compact* survivors to one end so fragmentation doesn't waste space. This is the expensive one — its cost scales with the live old-space size. Orinoco hides most of it: marking runs **concurrently** on helper threads while your JS keeps executing (cutting main-thread marking time by ~60–70%), with **incremental** steps and concurrent sweeping. But it cannot be fully free — there are still brief **stop-the-world** pauses to finalize. Step through both collections below."
			},
			{
				kind: "sim",
				sim: "gc"
			},
			{
				kind: "compare",
				a: "Minor GC — Scavenge",
				b: "Major GC — Mark-Sweep-Compact",
				rows: [
					[
						"Collects",
						"young generation (nursery)",
						"old generation"
					],
					[
						"Algorithm",
						"semi-space copy (From → To) + flip",
						"mark, sweep, then compact"
					],
					[
						"Cost scales with",
						"live survivors — cheap",
						"live old-space size — costly"
					],
					[
						"Frequency",
						"very frequent",
						"rare"
					],
					[
						"Pausing",
						"parallel, brief stop-the-world",
						"concurrent/incremental marking; short STW to finalize"
					],
					[
						"Triggered when",
						"the active semi-space fills",
						"old space crosses its limit"
					]
				]
			},
			{
				kind: "callout",
				tone: "warn",
				title: "GC shares your thread — so a leak becomes a latency problem",
				md: "Marking is concurrent, but GC is *not* free and the finalizing pauses run on the **main thread** — the same thread as the event loop. A large, growing old space means longer, more frequent major GCs, which surface as **event-loop stalls** and p99 latency spikes. A memory **leak** in Node is almost always *'old space that never shrinks'*: module-level caches/`Map`s that only grow, `EventEmitter` listeners added per request and never removed, timers that keep closures alive. Diagnose with heap snapshots and **retained size**, not just heap-used graphs. See [Performance & profiling](#/chapter/performance)."
			},
			{
				kind: "table",
				caption: "The flags and APIs worth knowing (defaults now scale with available/container memory).",
				head: ["Flag / API", "What it does"],
				rows: [
					["--max-old-space-size=N", "cap old space in MB; modern Node derives the default from available (and cgroup/container) memory"],
					["--max-semi-space-size=N", "size one young semi-space in MB; a bigger nursery means fewer minor GCs at the cost of memory"],
					["--trace-gc", "log every GC — kind, duration, before/after sizes — to stderr"],
					["--expose-gc → global.gc()", "force a collection; for tests and diagnostics only, never production logic"],
					["perf_hooks 'gc' · v8.getHeapStatistics()", "observe GC events and heap usage programmatically (used to verify this chapter's sim)"]
				]
			},
			{
				kind: "callout",
				tone: "tip",
				title: "Measured, not guessed",
				md: "The minor-vs-major ratio in the simulator isn't invented: a short workload that churns garbage while retaining a growing array, observed with the `perf_hooks` GC observer on **Node 22**, produced **52 minor GCs to 1 major** — and **271 : 1** with `--max-semi-space-size=1`. Minor collections dominate; that is the generational hypothesis in numbers."
			}
		],
		keyPoints: [
			"V8 tiers hot code up: Ignition (interpreter) → Sparkplug → Maglev (default in Node 22) → TurboFan.",
			"Optimization is speculative; violating type/shape assumptions causes deoptimization back to a slower tier.",
			"Hidden classes + inline caches make property access fast — keep object shapes stable and monomorphic.",
			"The heap is generational because most objects die young: a small nursery + a large old space.",
			"Minor GC (Scavenge) copies survivors between two semi-spaces and flips; cost ∝ survivors, not garbage.",
			"Surviving ~2 scavenges promotes an object to old space, collected by Mark-Sweep-Compact.",
			"Major GC marks concurrently but still has short stop-the-world pauses on the main thread — a leak (old space that never shrinks) becomes a latency problem."
		],
		pitfalls: [
			{
				title: "Polymorphic / shape-drifting objects on a hot path",
				body: "Adding properties late, in varying order, deleting properties, or mixing value types at a call site creates new hidden classes and makes inline caches megamorphic — V8 deopts to slow dictionary lookups. Initialize all fields in the constructor, same order, same types."
			},
			{
				title: "Reading micro-benchmarks as production truth",
				body: "A tiny loop will get fully optimized by TurboFan and may not represent real, polymorphic, GC-pressured code. Benchmark realistic shapes and data sizes, and watch for deopt/bailout traces (--trace-deopt)."
			},
			{
				title: "Treating 'heap used' as the leak signal",
				body: "Heap-used sawtooths up and down with GC — that's healthy. A leak shows as a rising floor and growing RETAINED size across snapshots. Compare snapshots and look at retainers, not a single gauge."
			},
			{
				title: "Bumping --max-old-space-size to 'fix' a leak",
				body: "Raising the limit delays the crash and makes the eventual major GC longer (bigger old space = longer pauses). Find the retainer instead; the flag is for genuinely large working sets, not leaks."
			},
			{
				title: "Calling global.gc() in production",
				body: "Forcing GC almost always hurts — you trigger stop-the-world pauses V8 would have scheduled more cheaply. It's a diagnostic tool (with --expose-gc), not a tuning knob."
			}
		],
		interview: [
			{
				q: "Explain V8's generational garbage collection.",
				a: "The heap is split by object age on the generational hypothesis that most objects die young. The young generation (two semi-spaces) is collected by a fast Scavenge: live objects are copied into the To-space and the rest abandoned, then the spaces flip; cost is proportional to survivors. Objects that survive ~2 scavenges are promoted to the old generation, collected by Mark-Sweep-Compact — mark live objects (concurrently, via Orinoco), sweep the dead, compact to avoid fragmentation. Minors are frequent and cheap; majors are rare and costly.",
				level: "senior"
			},
			{
				q: "Why keep object shapes stable, and what is a hidden class?",
				a: "V8 represents each object's structure as a hidden class (map/shape); objects built the same way share one, letting property access compile to a fixed offset cached by an inline cache. Stable, monomorphic shapes keep those caches hitting. Adding/removing/reordering properties or mixing types makes call sites polymorphic then megamorphic, blowing the cache to slow dictionary lookups and triggering deoptimization.",
				level: "staff"
			},
			{
				q: "What are V8's compilation tiers and what is deoptimization?",
				a: "Ignition interprets bytecode; Sparkplug is a near-instant baseline JIT; Maglev is a fast mid-tier optimizing JIT (default in Node 22 on x64/arm64); TurboFan is the peak optimizer for the hottest code. Optimizing tiers speculate on observed types/shapes. When a runtime value violates an assumption, V8 deoptimizes — discards the optimized code and falls back to a lower tier. Repeated deopt churn is slower than never optimizing.",
				level: "staff"
			},
			{
				q: "How does garbage collection interact with the event loop and tail latency?",
				a: "GC largely shares the main thread with your JS. Marking is concurrent, but finalizing pauses are stop-the-world on the main thread — so they show up as event-loop lag and p99 spikes. A large or leaking old space means longer, more frequent major GCs. Mitigate by reducing allocations/retention, not by forcing GC; watch event-loop lag and GC traces.",
				level: "staff"
			},
			{
				q: "A Node service's memory climbs until it OOMs. How do you find the leak?",
				a: "Confirm it's a leak (rising retained floor across heap snapshots, not just sawtoothing heap-used). Take snapshots over time and diff them; sort by retained size and inspect retainers — usually a module-level cache/Map that only grows, listeners added per request without removal, or closures held by timers. Fix the retainer; raising --max-old-space-size only delays the crash and lengthens pauses.",
				level: "senior"
			}
		],
		seeAlso: [
			"event-loop",
			"performance",
			"concurrency",
			"async-model"
		],
		sources: [
			{
				title: "V8 — Maglev, V8's fastest optimizing JIT",
				url: "https://v8.dev/blog/maglev"
			},
			{
				title: "V8 — Trash talk: the Orinoco garbage collector",
				url: "https://v8.dev/blog/trash-talk"
			},
			{
				title: "V8 — Concurrent marking",
				url: "https://v8.dev/blog/concurrent-marking"
			},
			{
				title: "V8 — Orinoco: young generation garbage collection (parallel Scavenger)",
				url: "https://v8.dev/blog/orinoco-parallel-scavenger"
			},
			{
				title: "Node.js — Understanding and tuning memory",
				url: "https://nodejs.org/learn/diagnostics/memory/understanding-and-tuning-memory"
			}
		]
	},
	{
		id: "concurrency",
		group: "runtime",
		order: 9,
		title: "Concurrency",
		full: "Concurrency — the thread pool, worker_threads, cluster, child_process",
		tagline: "The 4-thread pool, real parallelism, and which tool fits which bottleneck.",
		readMins: 12,
		mentalModel: "Two paths off the one JS thread: blocking work (fs/crypto/zlib/dns.lookup) goes to the libuv thread pool (default 4 slots); network sockets go to the kernel and hold no thread. For more CPU you add threads (worker_threads, shared memory) or processes (cluster/child_process, isolated) — but most 'I need concurrency' is really I/O the loop already handles.",
		sections: [
			{
				kind: "prose",
				md: "Your JavaScript runs on **one thread**. So how does Node do many things at once — and when do you need to reach for *real* parallelism? The honest first answer is: **usually you don't**. Most 'I need concurrency' is **I/O** — waiting on a socket, disk, or database — and the event loop plus the OS already overlap thousands of those on the single thread. You only need more execution units when you're **burning CPU in JavaScript**. This chapter covers the machinery: the **libuv thread pool** that hides blocking calls, and the three ways to get more — `worker_threads`, `cluster`, `child_process`."
			},
			{
				kind: "figure",
				fig: "thread-pool-kernel",
				caption: "Two async paths off the one JS thread: blocking work goes to the 4-thread libuv pool; network sockets are watched by the OS kernel with no pool thread held."
			},
			{
				kind: "prose",
				md: "Some 'async' operations have **no non-blocking OS primitive** — reading a file, hashing a password, compressing a buffer, resolving a hostname with `getaddrinfo`. libuv runs those on a small **thread pool** so they don't block the loop. The pool defaults to **4 threads** (raise it with `UV_THREADPOOL_SIZE`, up to 1024). What uses it: most async **`fs`**, the async **`crypto`** functions (`pbkdf2`, `scrypt`, `randomBytes`, `randomFill`, `generateKeyPair`), all async **`zlib`**, and **`dns.lookup`**. Network I/O (TCP/HTTP sockets) does **not** — that's the kernel's job. The catch: the pool is **fixed and shared**, so one slow `pbkdf2` can delay every other file read in the whole process."
			},
			{
				kind: "callout",
				tone: "senior",
				title: "dns.lookup uses the pool; dns.resolve() does not",
				md: "`dns.lookup()` (which `http`/`net` call by default for hostnames) wraps the OS's **blocking** `getaddrinfo`, so it runs on the **thread pool** — under a burst of connections to new hosts, slow DNS can quietly **exhaust all 4 threads** and stall unrelated `fs`/`crypto` work. The `dns.resolve*()` family instead uses **c-ares** over the network and holds **no** pool thread. For connection-heavy clients, prefer `dns.resolve` or a caching resolver, and consider raising `UV_THREADPOOL_SIZE`."
			},
			{
				kind: "prose",
				md: "Step the pool against the kernel below. Watch a fixed pool finish CPU-bound tasks in **waves**, change `UV_THREADPOOL_SIZE` and see the waves change, then watch the kernel run every network op at once with **no** thread held."
			},
			{
				kind: "sim",
				sim: "thread-pool"
			},
			{
				kind: "prose",
				md: "When the work really is **CPU-bound JavaScript** — parsing huge payloads, hashing, image or markdown processing, ML pre/post-processing — offload it to a **`worker_thread`**. Each worker is its **own V8 isolate with its own event loop**, so it runs truly in parallel on another core without blocking the main loop. Workers don't share variables; they communicate by **message passing** (`postMessage`, a structured-clone copy) or, for genuinely shared state, a **`SharedArrayBuffer`** coordinated with **`Atomics`**."
			},
			{
				kind: "code",
				lang: "js",
				code: `// main.js — offload a CPU-bound hash without blocking the event loop
const { Worker } = require('node:worker_threads');

function hashInWorker(password) {
  return new Promise((resolve, reject) => {
    const w = new Worker('./hash-worker.js', { workerData: password });
    w.once('message', resolve);     // structured-clone copy back to main
    w.once('error', reject);
    w.once('exit', (code) => {
      if (code !== 0) reject(new Error('worker stopped, exit ' + code));
    });
  });
}

// hash-worker.js — runs on its own thread + isolate
const { workerData, parentPort } = require('node:worker_threads');
const crypto = require('node:crypto');
const hash = crypto.pbkdf2Sync(workerData, 'salt', 1e6, 64, 'sha512');
parentPort.postMessage(hash);       // send the result home`,
				note: "Note pbkdf2Sync here: inside a worker, blocking is fine — that's the point. A real service reuses a small POOL of workers (e.g. Piscina) rather than spawning one per task: a worker boots a fresh V8 isolate, which isn't free."
			},
			{
				kind: "table",
				caption: "Three ways to get more execution — pick by what you actually need.",
				head: [
					"Tool",
					"Gives you",
					"Shares memory?",
					"Reach for it when"
				],
				rows: [
					[
						"worker_threads",
						"parallel JS threads, one isolate each",
						"yes — SharedArrayBuffer + Atomics",
						"CPU-bound JS: parsing, hashing, images, compression"
					],
					[
						"cluster",
						"N processes sharing one listening port",
						"no",
						"scale one HTTP server across all cores"
					],
					[
						"child_process",
						"spawn/exec separate programs",
						"no — IPC / streams",
						"run ffmpeg/git/python, or isolate risky work"
					]
				]
			},
			{
				kind: "compare",
				a: "worker_threads",
				b: "child_process",
				rows: [
					[
						"Unit of execution",
						"a thread in the same process",
						"a separate OS process"
					],
					[
						"Memory",
						"own isolate; can SHARE via SharedArrayBuffer",
						"fully isolated; data copied over IPC"
					],
					[
						"Start-up cost",
						"lighter — a new V8 isolate",
						"heavier — a whole new process"
					],
					[
						"Best for",
						"CPU-bound JS/TS inside your app",
						"running other programs; strong isolation"
					],
					[
						"Crash blast radius",
						"can take down the whole process",
						"contained to the child"
					]
				]
			},
			{
				kind: "prose",
				md: "To scale a **server** across cores, the classic tool is **`cluster`**: it forks N worker **processes** that all share one listening port, with the OS (or Node's round-robin) distributing incoming connections. Rule of thumb is **~one Node process per core**, with **stateless** handlers (shared state goes in Redis/DB, not process memory). In container-orchestrated setups, an external supervisor — **Kubernetes**, PM2 — often plays this role instead, running one process per container and scaling pods. Either way the model is *processes, not threads*: no shared memory, isolation by default."
			},
			{
				kind: "callout",
				tone: "tip",
				title: "Decision guide: start from the bottleneck",
				md: "**Waiting** on network/disk/DB → it's **I/O**: keep it async, add nothing. **Burning CPU** in JS → **`worker_threads`** (a pool of them). **Saturating one core** serving traffic → **`cluster`** or an orchestrator (~one process per core). Need to run **another binary** → **`child_process`**. The classic mistake is spinning up workers to 'speed up' database or HTTP calls — that work was never on your thread to begin with; the kernel already runs it concurrently."
			},
			{
				kind: "prose",
				md: "Finally, a few orderings the pool and the loop make **guaranteed** — and one they make a **race**. Call each before revealing it."
			},
			{
				kind: "sim",
				sim: "concurrency-quiz"
			}
		],
		keyPoints: [
			"JS is single-threaded; most concurrency you need is I/O the event loop already overlaps — reach for parallelism only for CPU-bound JS.",
			"The libuv thread pool (default 4, UV_THREADPOOL_SIZE up to 1024) backs async fs, crypto, zlib, and dns.lookup.",
			"Network sockets use the kernel (epoll/kqueue/IOCP), not the pool — one thread watches thousands of connections.",
			"dns.lookup() uses the pool (blocking getaddrinfo); dns.resolve*() uses the network (c-ares) and no pool thread.",
			"worker_threads give real parallel JS (own isolate); communicate by message-passing or share via SharedArrayBuffer + Atomics.",
			"cluster forks ~one process per core sharing a port; processes don't share memory — keep handlers stateless.",
			"child_process runs separate programs with isolation; heavier than a worker but contains crashes."
		],
		pitfalls: [
			{
				title: "Using worker_threads to 'speed up' I/O",
				body: "Network/DB/file calls are already concurrent via the loop and kernel (or pool). Wrapping them in workers adds isolate startup and structured-clone copying for zero throughput gain. Workers are for CPU-bound JS only."
			},
			{
				title: "Blocking the thread pool with one slow task",
				body: "The pool is fixed and shared. A long pbkdf2/scrypt, a giant sync zlib, or DNS exhaustion ties up slots so unrelated fs/crypto calls stall. Size UV_THREADPOOL_SIZE for the workload, move heavy CPU to worker_threads, and prefer dns.resolve for connection-heavy clients."
			},
			{
				title: "Spawning a worker (or child process) per task",
				body: "Each worker boots a fresh V8 isolate; each child boots a process. Under load that startup cost dominates. Reuse a bounded pool of long-lived workers (e.g. Piscina) and hand them tasks."
			},
			{
				title: "Expecting workers or cluster to share variables",
				body: "Workers have separate isolates and cluster has separate processes — neither shares your JS heap. Data is copied (postMessage/IPC) unless you explicitly use SharedArrayBuffer (workers only). Shared application state belongs in Redis/DB."
			},
			{
				title: "Assuming setTimeout(0) vs setImmediate is ordered, or pool order is FIFO at size > 1",
				body: "In the main module timeout-vs-immediate is a race (deterministic only inside an I/O callback). And pool tasks are FIFO-dispatched but run concurrently, so with the default 4 threads their completion order is not guaranteed — only a one-thread pool serializes them."
			}
		],
		interview: [
			{
				q: "worker_threads vs cluster vs child_process — when do you use each?",
				a: "worker_threads for CPU-bound JavaScript in-process: each worker is its own isolate running in parallel, sharing memory only via SharedArrayBuffer. cluster to scale a server across cores: it forks ~one process per core sharing a listening port, no shared memory. child_process to run a separate program (ffmpeg, git, python) or to isolate risky work in its own process. If the bottleneck is I/O, none of them — the event loop already handles it.",
				level: "senior"
			},
			{
				q: "What runs on the libuv thread pool, how big is it, and why does it matter?",
				a: "Most async fs, the async crypto functions (pbkdf2, scrypt, randomBytes, randomFill, generateKeyPair), all async zlib, and dns.lookup. It defaults to 4 threads (UV_THREADPOOL_SIZE, up to 1024). It matters because it's fixed and shared: one slow pool task delays every other pool task in the process, so a slow hash or DNS lookup can stall unrelated file reads.",
				level: "staff"
			},
			{
				q: "Why can DNS resolution stall a busy HTTP client, and how do you fix it?",
				a: "http/net resolve hostnames with dns.lookup, which wraps the blocking getaddrinfo and runs on the 4-thread pool. Under many connections to new hosts, slow lookups can exhaust the pool and block unrelated fs/crypto work. Fixes: use dns.resolve*() (c-ares, network-based, no pool thread) or a caching resolver, cache results, and raise UV_THREADPOOL_SIZE.",
				level: "staff"
			},
			{
				q: "How do worker_threads communicate, and what's the cost of message passing?",
				a: "By default via postMessage, which makes a structured-clone copy of the data — so large payloads cost serialization and memory. You can transfer an ArrayBuffer (zero-copy, ownership moves) or use a SharedArrayBuffer with Atomics for genuinely shared memory and lock-free coordination. Workers do not share ordinary variables; design around copies or shared buffers.",
				level: "staff"
			},
			{
				q: "If Node is single-threaded, how does it serve thousands of concurrent connections?",
				a: "Network I/O is non-blocking: libuv registers sockets with the OS event notifier (epoll/kqueue/IOCP) and the kernel signals readiness; one loop thread multiplexes them all, holding no thread per connection. Only blocking operations without an async OS primitive (files, crypto, compression, getaddrinfo) use the small thread pool. So concurrency for I/O is the kernel's job, not threads'.",
				level: "senior"
			}
		],
		seeAlso: [
			"event-loop",
			"v8-gc",
			"production",
			"performance"
		],
		sources: [
			{
				title: "libuv — Thread pool work scheduling",
				url: "https://docs.libuv.org/en/v1.x/threadpool.html"
			},
			{
				title: "Node.js — Don't block the event loop (or the worker pool)",
				url: "https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop"
			},
			{
				title: "Node.js — Worker threads",
				url: "https://nodejs.org/api/worker_threads.html"
			},
			{
				title: "Node.js — Cluster",
				url: "https://nodejs.org/api/cluster.html"
			},
			{
				title: "Node.js — DNS implementation considerations (lookup vs resolve)",
				url: "https://nodejs.org/api/dns.html#implementation-considerations"
			}
		]
	},
	stub({
		id: "streams",
		group: "runtime",
		order: 10,
		title: "Streams & Buffers",
		full: "Streams, Buffers & backpressure",
		tagline: "Process data in chunks; backpressure keeps memory bounded.",
		readMins: 10,
		mentalModel: "Producer faster than consumer → the buffer fills → write() returns false → pause until the 'drain' event.",
		keyPoints: [
			"Four stream types: Readable, Writable, Duplex, Transform.",
			"Backpressure: write() returns false past highWaterMark; wait for 'drain' before writing more.",
			"pipeline() propagates backpressure AND cleans up on error (prefer it over pipe()).",
			"Default highWaterMark is 64 KiB for byte streams in modern Node."
		],
		seeAlso: [
			"event-loop",
			"http",
			"performance"
		]
	}),
	stub({
		id: "modules",
		group: "runtime",
		order: 11,
		title: "Modules: CJS vs ESM",
		tagline: "require is sync, cached, value-copied; import is async with live bindings.",
		readMins: 8,
		mentalModel: "CJS = synchronous, cached, value copy. ESM = an async graph with live, read-only bindings.",
		keyPoints: [
			"CommonJS: require() is synchronous and cached; returns module.exports; __dirname exists.",
			"ESM: import is asynchronous & statically analyzable; live read-only bindings; uses import.meta.url.",
			"Modern Node allows require() of ESM; top-level await is ESM-only.",
			"Interop traps: named exports from CJS, __dirname in ESM, the dual-package hazard."
		],
		seeAlso: [
			"architecture",
			"modern-node",
			"async-model"
		]
	}),
	stub({
		id: "errors",
		group: "systems",
		order: 12,
		title: "Error handling",
		tagline: "Operational vs programmer errors; fail fast; AsyncLocalStorage.",
		readMins: 9,
		mentalModel: "Recover from operational errors; crash on programmer bugs. Never silently swallow.",
		keyPoints: [
			"Separate operational errors (bad input, ECONNREFUSED) from programmer bugs.",
			"Fail fast on bugs; handle and operate through operational errors.",
			"Log + crash on unhandledRejection / uncaughtException; let a supervisor restart.",
			"AsyncLocalStorage carries request context across async boundaries (domains are dead)."
		],
		seeAlso: [
			"async-model",
			"production",
			"http"
		]
	}),
	stub({
		id: "http",
		group: "systems",
		order: 13,
		title: "Networking & HTTP internals",
		tagline: "Sockets, the llhttp parser, keep-alive Agents, and the timeout triad.",
		readMins: 10,
		mentalModel: "A request is a stream of bytes parsed by llhttp; Agents pool and reuse the TCP sockets.",
		keyPoints: [
			"Sockets + the llhttp parser turn bytes into requests; responses stream back out.",
			"Keep-alive Agents reuse TCP connections; tune maxSockets and reuse.",
			"HTTP/1.1 head-of-line blocking vs HTTP/2 multiplexing over one connection.",
			"Mind the timeout triad: headersTimeout, requestTimeout, keepAliveTimeout (common 502 causes)."
		],
		seeAlso: [
			"streams",
			"performance",
			"production"
		]
	}),
	stub({
		id: "performance",
		group: "systems",
		order: 14,
		title: "Performance & profiling",
		tagline: "Measure first: flamegraphs, --prof, clinic, and event-loop lag.",
		readMins: 9,
		mentalModel: "Find the bottleneck with a profiler; the event-loop-lag meter is your service's pulse.",
		keyPoints: [
			"Measure before optimizing: flamegraphs (--prof, clinic, 0x), not guesses.",
			"Watch event-loop lag — the key health signal for a Node service.",
			"Avoid sync APIs on the hot path; stream large payloads; cache hot work.",
			"Diagnose GC pressure & leaks with heap snapshots and retained-size analysis."
		],
		seeAlso: [
			"v8-gc",
			"event-loop",
			"concurrency"
		]
	}),
	stub({
		id: "security",
		group: "systems",
		order: 15,
		title: "Security & supply chain",
		tagline: "CVEs, the npm supply chain, the permission model, hardening.",
		readMins: 9,
		mentalModel: "Your dependencies are your attack surface. Least privilege + patch fast.",
		keyPoints: [
			"Supply chain is the top risk: lockfiles, npm audit, fewer deps, verify provenance.",
			"Validate all input; avoid eval / child_process with untrusted data; set security headers.",
			"The permission model (--permission) restricts fs/net/child_process access.",
			"Keep Node patched — security releases fix real, exploited CVEs."
		],
		seeAlso: [
			"production",
			"modern-node",
			"http"
		]
	}),
	stub({
		id: "production",
		group: "systems",
		order: 16,
		title: "Production patterns",
		tagline: "Graceful shutdown, scaling, serverless cold starts.",
		readMins: 9,
		mentalModel: "On SIGTERM: stop intake → finish in-flight → close resources → exit(0).",
		keyPoints: [
			"Graceful shutdown: stop accepting, drain in-flight, close DB/sockets, then exit (handle SIGTERM).",
			"Scale with cluster or an orchestrator (≈one Node per core); keep handlers stateless.",
			"Health checks, structured logs, metrics, and a supervisor (PM2/systemd/k8s).",
			"Serverless: cold starts, statelessness, reuse connections outside the handler."
		],
		seeAlso: [
			"concurrency",
			"errors",
			"security"
		]
	}),
	stub({
		id: "modern-node",
		group: "mastery",
		order: 17,
		title: "Modern Node (2026)",
		tagline: "Versions & capabilities — the batteries now included.",
		readMins: 7,
		mentalModel: "Modern Node = batteries included: test runner, fetch, watch mode, --env-file, permissions.",
		keyPoints: [
			"Built-in test runner (node:test) + watch mode reduce tooling dependencies.",
			"Global fetch, WebStreams, and --env-file are standard in recent lines.",
			"require(ESM), the permission model, and a built-in SQLite are part of the modern toolkit.",
			"LTS cadence: even-numbered majors go LTS — track the active LTS for production. (Verify exact versions in S8.)"
		],
		seeAlso: [
			"modules",
			"security",
			"competitors"
		]
	}),
	stub({
		id: "interview",
		group: "mastery",
		order: 18,
		title: "40 Senior/Staff Questions",
		tagline: "A filterable interview bank, tagged by topic and level.",
		readMins: 4,
		mentalModel: "If you can answer these cold — with the diagram in your head — you're ready.",
		keyPoints: ["Curated senior/staff questions across every chapter.", "Filter by topic and difficulty; each links back to its chapter."],
		link: "/interview",
		seeAlso: [
			"event-loop",
			"v8-gc",
			"concurrency"
		]
	}),
	stub({
		id: "mental-models",
		group: "mastery",
		order: 19,
		title: "Mental Models",
		tagline: "The diagrams you must be able to draw from memory.",
		readMins: 4,
		mentalModel: "Hide the answer, draw it, then check. Repeat until the picture is automatic.",
		keyPoints: ["The six event-loop phases + microtask checkpoints.", "Thread pool vs kernel async; GC generations; backpressure."],
		link: "/mental-models",
		seeAlso: [
			"event-loop",
			"concurrency",
			"v8-gc"
		]
	}),
	stub({
		id: "summary",
		group: "mastery",
		order: 20,
		title: "Summary",
		tagline: "The whole picture on one page.",
		readMins: 4,
		mentalModel: "One thread runs JS; libuv + the OS do the waiting; never block the thread.",
		keyPoints: [
			"The single-threaded loop + offloaded I/O is the whole idea.",
			"Know the diagrams cold: 6 phases, thread-pool-vs-kernel, microtask priority, GC generations, backpressure.",
			"Strength = I/O concurrency; weakness = CPU on the main thread."
		],
		seeAlso: [
			"event-loop",
			"what-is-node",
			"mental-models"
		]
	})
];
var CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
function chaptersInGroup(groupId) {
	return CHAPTERS.filter((c) => c.group === groupId).sort((a, b) => a.order - b.order);
}
//#endregion
//#region src/lib/utils.ts
function cx(...parts) {
	return parts.filter(Boolean).join(" ");
}
//#endregion
//#region src/components/layout/TopBar.tsx
function Logo() {
	return /* @__PURE__ */ jsxs("svg", {
		className: "logo",
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ jsx("path", {
				d: "M16 4.2 L26.2 10.1 L26.2 21.9 L16 27.8 L5.8 21.9 L5.8 10.1 Z",
				fill: "#6CC24A"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M16 9.1 L21.95 12.55 L21.95 19.45 L16 22.9 L10.05 19.45 L10.05 12.55 Z",
				fill: "#0A0C0A"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "16",
				cy: "16",
				r: "2.4",
				fill: "#4ADE80"
			})
		]
	});
}
function SearchBox() {
	const [q, setQ] = useState("");
	const [open, setOpen] = useState(false);
	const boxRef = useRef(null);
	const results = useMemo(() => {
		const t = q.trim().toLowerCase();
		if (!t) return [];
		return CHAPTERS.filter((c) => c.title.toLowerCase().includes(t) || c.tagline.toLowerCase().includes(t) || c.keyPoints.some((k) => k.toLowerCase().includes(t))).slice(0, 7);
	}, [q]);
	const choose = (c) => {
		setQ("");
		setOpen(false);
		go(c.link ?? "/chapter/" + c.id);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "search-wrap",
		ref: boxRef,
		style: { position: "relative" },
		children: [/* @__PURE__ */ jsxs("div", {
			className: "search",
			children: [/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				style: { color: "var(--tx3)" },
				children: "⌕"
			}), /* @__PURE__ */ jsx("input", {
				type: "search",
				placeholder: "Search concepts…",
				"aria-label": "Search concepts",
				value: q,
				onChange: (e) => {
					setQ(e.target.value);
					setOpen(true);
				},
				onFocus: () => setOpen(true),
				onBlur: () => setTimeout(() => setOpen(false), 150),
				onKeyDown: (e) => {
					if (e.key === "Enter" && results[0]) choose(results[0]);
					if (e.key === "Escape") {
						setQ("");
						setOpen(false);
					}
				}
			})]
		}), open && results.length > 0 ? /* @__PURE__ */ jsx("ul", {
			className: "search-results",
			role: "listbox",
			children: results.map((c) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
				onMouseDown: () => choose(c),
				children: [/* @__PURE__ */ jsx("span", {
					className: "sr-title",
					children: c.title
				}), /* @__PURE__ */ jsx("span", {
					className: "sr-tag",
					children: c.tagline
				})]
			}) }, c.id))
		}) : null]
	});
}
function TopBar({ route }) {
	return /* @__PURE__ */ jsx("header", {
		className: "topbar",
		children: /* @__PURE__ */ jsxs("div", {
			className: "topbar-inner",
			children: [
				/* @__PURE__ */ jsxs("button", {
					className: "brand",
					onClick: () => go("/map"),
					"aria-label": "Home — concept map",
					children: [/* @__PURE__ */ jsx(Logo, {}), /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsxs("span", {
						className: "brand-title",
						children: ["Node.js ", /* @__PURE__ */ jsx("b", { children: "Comprehensive Guide" })]
					}), /* @__PURE__ */ jsx("span", {
						className: "brand-sub",
						children: "senior / staff · interactive deep-dive"
					})] })]
				}),
				/* @__PURE__ */ jsxs("nav", {
					className: "nav",
					"aria-label": "Primary",
					children: [
						/* @__PURE__ */ jsx("a", {
							href: "#/map",
							className: cx(route.name === "map" && "on"),
							children: "Map"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#/interview",
							className: cx(route.name === "interview" && "on"),
							children: "Interview"
						}),
						/* @__PURE__ */ jsx("a", {
							href: "#/mental-models",
							className: cx(route.name === "mental-models" && "on"),
							children: "Mental models"
						})
					]
				}),
				/* @__PURE__ */ jsx(SearchBox, {})
			]
		})
	});
}
//#endregion
//#region src/components/layout/Sidebar.tsx
function Sidebar({ activeId }) {
	return /* @__PURE__ */ jsx("nav", {
		className: "sidebar",
		"aria-label": "Chapters",
		children: GROUPS.map((g) => /* @__PURE__ */ jsxs("div", {
			className: "sb-group",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "sb-group-name",
				children: [/* @__PURE__ */ jsx("span", {
					className: "sb-dot",
					style: { background: g.accent },
					"aria-hidden": "true"
				}), g.name]
			}), chaptersInGroup(g.id).map((c) => /* @__PURE__ */ jsxs("button", {
				className: cx("sb-link", activeId === c.id && "on"),
				onClick: () => go(c.link ?? "/chapter/" + c.id),
				"aria-current": activeId === c.id ? "page" : void 0,
				children: [/* @__PURE__ */ jsx("span", {
					className: "sb-num",
					children: String(c.order).padStart(2, "0")
				}), /* @__PURE__ */ jsx("span", { children: c.title })]
			}, c.id))]
		}, g.id))
	});
}
//#endregion
//#region src/components/layout/Footer.tsx
function Footer() {
	return /* @__PURE__ */ jsx("footer", {
		className: "footer",
		children: /* @__PURE__ */ jsxs("div", {
			className: "footer-inner",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "flag",
					"aria-hidden": "true",
					style: { background: "linear-gradient(to bottom, #0057B7 0 50%, #FFD700 50% 100%)" }
				}),
				/* @__PURE__ */ jsx("strong", {
					style: {
						color: "var(--tx)",
						fontWeight: 600
					},
					children: "Vasyl Krupka"
				}),
				/* @__PURE__ */ jsx("span", {
					className: "sep",
					children: "·"
				}),
				/* @__PURE__ */ jsx("span", { children: "Senior Fullstack Engineer · Ukraine" }),
				/* @__PURE__ */ jsx("span", {
					className: "src",
					children: "Facts verified against Node.js · libuv · V8 docs. Built with Vite + React + TypeScript."
				})
			]
		})
	});
}
//#endregion
//#region src/data/mentalModels.ts
var MODELS = [
	{
		id: "loop-phases",
		title: "The six event-loop phases",
		chapter: "event-loop",
		prompt: "Draw one tick of the event loop: name the six phases in order and say where microtasks run.",
		answer: "timers → pending callbacks → idle/prepare (internal) → poll → check → close. Microtasks (nextTick, then Promise) drain after EVERY callback and between phases — they are not a phase."
	},
	{
		id: "microtask-priority",
		title: "Microtask priority",
		chapter: "event-loop",
		prompt: "Order these: sync code, setTimeout(0), setImmediate, Promise.then, process.nextTick.",
		answer: "Sync first → process.nextTick → Promise.then → then macrotasks: setTimeout(0) (timers) and setImmediate (check), whose relative order is non-deterministic in the main module."
	},
	{
		id: "pool-vs-kernel",
		title: "Thread pool vs kernel async",
		chapter: "concurrency",
		prompt: "Where do fs.readFile ×N and http.get ×N execute? Draw the pool and the kernel paths.",
		answer: "fs/crypto/dns.lookup/zlib go to the libuv thread pool (default 4 threads — extras queue). Network I/O (http/sockets) is handled by the OS (epoll/kqueue/IOCP) without pool threads; one thread can watch thousands of sockets."
	},
	{
		id: "gc-generations",
		title: "GC generations",
		chapter: "v8-gc",
		prompt: "Draw V8's heap: where are objects born, and how do they get collected?",
		answer: "Young space (nursery): fast Scavenge copies live objects between semi-spaces; survivors are promoted to old space, collected by mark-sweep-compact (mostly concurrent/incremental, with short stop-the-world pauses)."
	},
	{
		id: "backpressure",
		title: "Backpressure",
		chapter: "streams",
		prompt: "A fast producer writes to a slow consumer. Draw what bounds memory.",
		answer: "write() returns false once buffered bytes exceed highWaterMark; the producer pauses and resumes on the 'drain' event. pipeline() wires this automatically and cleans up on error."
	}
];
//#endregion
//#region src/components/map/ConceptMap.tsx
var hasSim = (c) => c.sections.some((s) => s.kind === "sim");
function ConceptMap() {
	return /* @__PURE__ */ jsxs("div", {
		className: "map-wrap",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "map-hero",
			children: [
				/* @__PURE__ */ jsxs("h1", { children: ["Node.js ", /* @__PURE__ */ jsx("b", { children: "Comprehensive Guide" })] }),
				/* @__PURE__ */ jsx("p", { children: "A deep, interactive, senior/staff tour of how Node really works — the event loop, V8 & GC, the async model, concurrency, streams and production internals — with live simulators and draw-from-memory mental models." }),
				/* @__PURE__ */ jsxs("div", {
					className: "map-stats",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "map-stat",
							children: [/* @__PURE__ */ jsx("b", { children: CHAPTERS.length }), "chapters"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "map-stat",
							children: [/* @__PURE__ */ jsx("b", { children: GROUPS.length }), "parts"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "map-stat",
							children: [/* @__PURE__ */ jsx("b", { children: MODELS.length }), "mental models"]
						})
					]
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "map-grid",
			children: GROUPS.map((g) => /* @__PURE__ */ jsxs("div", {
				className: "map-col",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "map-col-head",
					children: [/* @__PURE__ */ jsx("span", {
						className: "bar",
						style: { background: g.accent },
						"aria-hidden": "true"
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", { children: g.name }), /* @__PURE__ */ jsx("div", {
						className: "blurb",
						children: g.blurb
					})] })]
				}), chaptersInGroup(g.id).map((c) => /* @__PURE__ */ jsxs("button", {
					className: "card",
					onClick: () => go(c.link ?? "/chapter/" + c.id),
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "card-top",
							children: [/* @__PURE__ */ jsx("span", {
								className: "card-num",
								children: String(c.order).padStart(2, "0")
							}), /* @__PURE__ */ jsx("span", {
								className: "card-title",
								children: c.title
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "card-tag",
							children: c.tagline
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "card-foot",
							children: [
								/* @__PURE__ */ jsxs("span", { children: [c.readMins, " min"] }),
								hasSim(c) ? /* @__PURE__ */ jsx("span", {
									className: "pill hero",
									children: "▶ live simulator"
								}) : null,
								c.link ? /* @__PURE__ */ jsx("span", {
									className: "pill",
									children: "page"
								}) : c.stub ? /* @__PURE__ */ jsx("span", {
									className: "pill",
									children: "seeded"
								}) : /* @__PURE__ */ jsx("span", {
									className: "pill hero",
									children: "full"
								})
							]
						})
					]
				}, c.id))]
			}, g.id))
		})]
	});
}
//#endregion
//#region src/components/chapter/Md.tsx
/** Minimal, safe inline markdown: `code`, **bold**, *italic*, [text](url). */
function inline(text) {
	const nodes = [];
	const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(\*[^*]+\*)/g;
	let last = 0;
	let m;
	let k = 0;
	while ((m = re.exec(text)) !== null) {
		if (m.index > last) nodes.push(text.slice(last, m.index));
		const tok = m[0];
		if (tok.startsWith("`")) nodes.push(/* @__PURE__ */ jsx("code", { children: tok.slice(1, -1) }, k++));
		else if (tok.startsWith("**")) nodes.push(/* @__PURE__ */ jsx("strong", { children: tok.slice(2, -2) }, k++));
		else if (tok.startsWith("[")) {
			const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
			if (mm) {
				const internal = mm[2].startsWith("#");
				nodes.push(internal ? /* @__PURE__ */ jsx("a", {
					href: mm[2],
					children: mm[1]
				}, k++) : /* @__PURE__ */ jsx("a", {
					href: mm[2],
					target: "_blank",
					rel: "noreferrer",
					children: mm[1]
				}, k++));
			} else nodes.push(tok);
		} else nodes.push(/* @__PURE__ */ jsx("em", { children: tok.slice(1, -1) }, k++));
		last = m.index + tok.length;
	}
	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
}
/** Block-level: paragraphs (blank-line separated) and simple `- ` bullet lists. */
function Md({ md }) {
	return /* @__PURE__ */ jsx(Fragment, { children: md.trim().split(/\n{2,}/).map((b, i) => {
		const lines = b.split("\n");
		if (lines.every((l) => l.trim().startsWith("- "))) return /* @__PURE__ */ jsx("ul", { children: lines.map((l, j) => /* @__PURE__ */ jsx("li", { children: inline(l.trim().slice(2)) }, j)) }, i);
		return /* @__PURE__ */ jsx("p", { children: inline(b.replace(/\n/g, " ")) }, i);
	}) });
}
//#endregion
//#region src/lib/eventLoopEngine.ts
var PHASES = [
	{
		key: "timers",
		q: "timers",
		label: "timers"
	},
	{
		key: "pending",
		q: "pending",
		label: "pending callbacks"
	},
	{
		key: "idle",
		q: null,
		label: "idle, prepare"
	},
	{
		key: "poll",
		q: "poll",
		label: "poll"
	},
	{
		key: "check",
		q: "check",
		label: "check"
	},
	{
		key: "close",
		q: "close",
		label: "close callbacks"
	}
];
function queueOf(kind) {
	switch (kind) {
		case "timer": return "timers";
		case "io": return "poll";
		case "immediate": return "check";
		case "close": return "close";
		case "nextTick": return "nextTick";
		case "promise": return "promise";
		case "sync": return "timers";
	}
}
function simulate$3(s) {
	const q = {
		timers: [],
		pending: [],
		poll: [],
		check: [],
		close: [],
		nextTick: [],
		promise: []
	};
	const output = [];
	const frames = [];
	let nextId = 0;
	let iteration = 0;
	const CAP = 800;
	const clone = () => ({
		timers: [...q.timers],
		pending: [...q.pending],
		poll: [...q.poll],
		check: [...q.check],
		close: [...q.close],
		nextTick: [...q.nextTick],
		promise: [...q.promise]
	});
	const snap = (zone, phaseKey, caption, acted) => {
		frames.push({
			step: frames.length,
			zone,
			phaseKey,
			caption,
			acted,
			queues: clone(),
			output: [...output],
			iteration
		});
		if (frames.length > CAP) throw new Error("event-loop sim exceeded frame cap");
	};
	const schedule = (spec) => {
		const t = {
			...spec,
			id: nextId++
		};
		q[queueOf(spec.kind)].push(t);
	};
	const runTask = (t) => {
		output.push(t.log);
		if (t.schedules) for (const sp of t.schedules) schedule(sp);
	};
	const drainMicro = () => {
		while (q.nextTick.length || q.promise.length) if (q.nextTick.length) {
			const t = q.nextTick.shift();
			runTask(t);
			snap("micro", null, `process.nextTick() → '${t.log}'  ·  microtask (highest priority)`, {
				kind: t.kind,
				label: t.label,
				log: t.log
			});
		} else {
			const t = q.promise.shift();
			runTask(t);
			snap("micro", null, `Promise.then() → '${t.log}'  ·  microtask`, {
				kind: t.kind,
				label: t.label,
				log: t.log
			});
		}
	};
	for (const op of s.main) if (op.op === "log") {
		output.push(op.log);
		snap("main", null, `Synchronous: console.log('${op.log}')`, {
			kind: "sync",
			label: "sync",
			log: op.log
		});
	} else {
		schedule(op.spec);
		snap("main", null, `Schedule ${op.spec.label} → ${queueOf(op.spec.kind)} queue`, null);
	}
	snap("main", null, "Main script done, call stack empty → drain microtasks before the loop.", null);
	drainMicro();
	const hasMacro = () => q.timers.length > 0 || q.pending.length > 0 || q.poll.length > 0 || q.check.length > 0 || q.close.length > 0;
	while (hasMacro()) {
		iteration++;
		for (const ph of PHASES) {
			const list = ph.q ? q[ph.q] : null;
			let cap;
			if (ph.key === "idle") cap = "idle, prepare — libuv internal bookkeeping (not your code).";
			else if (!list || list.length === 0) if (ph.key === "poll") cap = q.check.length ? "poll — empty & setImmediate pending → don't block, continue to check." : q.timers.length ? "poll — empty; here the loop would wait for I/O or the nearest timer." : "poll — empty.";
			else cap = `${ph.label} — queue empty, skip.`;
			else cap = `Enter ${ph.label} phase — run its callbacks (FIFO).`;
			snap("phase", ph.key, `Iteration ${iteration} · ${cap}`, null);
			if (list) while (list.length) {
				const t = list.shift();
				runTask(t);
				const verb = ph.key === "timers" ? "setTimeout/Interval callback" : ph.key === "check" ? "setImmediate callback" : ph.key === "poll" ? "I/O callback" : ph.key === "close" ? "close callback" : "callback";
				snap("phase", ph.key, `${ph.label} — ${verb} → '${t.log}'`, {
					kind: t.kind,
					label: t.label,
					log: t.log
				});
				drainMicro();
			}
		}
	}
	snap("done", null, "No timers, I/O, immediates or close callbacks remain → the loop exits.", null);
	return frames;
}
var SCENARIOS$3 = [{
	id: "classic",
	title: "The classic order",
	blurb: "sync · setTimeout(0) · setImmediate · Promise · nextTick — predict the output.",
	code: `console.log('start');                          // sync
setTimeout(() => console.log('timeout'), 0);   // timers
setImmediate(() => console.log('immediate'));  // check
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('end');                            // sync`,
	main: [
		{
			op: "log",
			log: "start"
		},
		{
			op: "schedule",
			spec: {
				kind: "timer",
				label: "setTimeout(0) cb",
				log: "timeout"
			}
		},
		{
			op: "schedule",
			spec: {
				kind: "immediate",
				label: "setImmediate cb",
				log: "immediate"
			}
		},
		{
			op: "schedule",
			spec: {
				kind: "promise",
				label: "Promise.then cb",
				log: "promise"
			}
		},
		{
			op: "schedule",
			spec: {
				kind: "nextTick",
				label: "process.nextTick cb",
				log: "nextTick"
			}
		},
		{
			op: "log",
			log: "end"
		}
	],
	expected: [
		"start",
		"end",
		"nextTick",
		"promise",
		"timeout",
		"immediate"
	]
}, {
	id: "io-immediate",
	title: "Inside I/O: setImmediate wins",
	blurb: "Within an I/O callback, setImmediate always runs before setTimeout(0).",
	code: `const fs = require('fs');
console.log('start');
fs.readFile(__filename, () => {
  console.log('read file done');             // poll phase
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
console.log('end');`,
	main: [
		{
			op: "log",
			log: "start"
		},
		{
			op: "schedule",
			spec: {
				kind: "io",
				label: "fs.readFile cb",
				log: "read file done",
				schedules: [{
					kind: "timer",
					label: "setTimeout(0) cb",
					log: "timeout"
				}, {
					kind: "immediate",
					label: "setImmediate cb",
					log: "immediate"
				}]
			}
		},
		{
			op: "log",
			log: "end"
		}
	],
	expected: [
		"start",
		"end",
		"read file done",
		"immediate",
		"timeout"
	]
}];
//#endregion
//#region src/components/sims/EventLoopSim.tsx
var KIND_COLOR$2 = {
	timer: "#38BDF8",
	immediate: "#4ADE80",
	io: "#FF7A00",
	close: "#9CB3A0",
	nextTick: "#A78BFA",
	promise: "#C4B5FD",
	sync: "#9CB3A0"
};
function Chip$1({ t }) {
	const c = KIND_COLOR$2[t.kind];
	return /* @__PURE__ */ jsx("span", {
		className: "el-chip",
		style: {
			borderColor: c,
			color: c
		},
		title: t.label,
		children: t.log
	});
}
var PLAY_MS$3 = 950;
function EventLoopSim() {
	const [sIdx, setSIdx] = useState(0);
	const scenario = SCENARIOS$3[sIdx];
	const frames = useMemo(() => simulate$3(scenario), [scenario]);
	const [i, setI] = useState(0);
	const [playing, setPlaying] = useState(false);
	const timer = useRef(null);
	useEffect(() => {
		setI(0);
		setPlaying(false);
	}, [sIdx]);
	useEffect(() => {
		if (!playing) return;
		timer.current = window.setInterval(() => {
			setI((prev) => {
				if (prev >= frames.length - 1) {
					setPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, PLAY_MS$3);
		return () => {
			if (timer.current) window.clearInterval(timer.current);
		};
	}, [playing, frames.length]);
	const f = frames[i];
	const atEnd = i >= frames.length - 1;
	const zoneLabel = f.zone === "main" ? "main script (synchronous)" : f.zone === "micro" ? "microtask checkpoint" : f.zone === "done" ? "loop exited" : "loop phase";
	return /* @__PURE__ */ jsxs("div", {
		className: "el-sim",
		"aria-label": "Event loop simulator",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "el-tabs",
				role: "tablist",
				children: SCENARIOS$3.map((s, idx) => /* @__PURE__ */ jsx("button", {
					role: "tab",
					"aria-selected": idx === sIdx,
					className: idx === sIdx ? "on" : "",
					onClick: () => setSIdx(idx),
					children: s.title
				}, s.id))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "el-blurb",
				children: scenario.blurb
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "el-body",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "el-code",
					children: [/* @__PURE__ */ jsx("div", {
						className: "el-code-head",
						children: "program.js"
					}), /* @__PURE__ */ jsx("pre", { children: /* @__PURE__ */ jsx("code", { children: scenario.code }) })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "el-stage",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "el-phases",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "el-col-title",
							children: ["event loop phases", /* @__PURE__ */ jsxs("span", {
								className: "el-iter",
								children: ["tick ", f.iteration]
							})]
						}), PHASES.map((ph) => {
							const active = f.zone === "phase" && f.phaseKey === ph.key;
							const queue = ph.q ? f.queues[ph.q] : [];
							return /* @__PURE__ */ jsxs("div", {
								className: "el-phase" + (active ? " on" : "") + (ph.key === "idle" ? " muted" : ""),
								children: [/* @__PURE__ */ jsx("span", {
									className: "el-phase-name",
									children: ph.label
								}), /* @__PURE__ */ jsx("span", {
									className: "el-queue",
									children: ph.key === "idle" ? /* @__PURE__ */ jsx("span", {
										className: "el-empty",
										children: "internal"
									}) : queue.length ? queue.map((t) => /* @__PURE__ */ jsx(Chip$1, { t }, t.id)) : /* @__PURE__ */ jsx("span", {
										className: "el-empty",
										children: "—"
									})
								})]
							}, ph.key);
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "el-side",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "el-micro" + (f.zone === "micro" ? " on" : ""),
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "el-col-title",
									children: "microtasks (after every callback)"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "el-micro-row",
									children: [/* @__PURE__ */ jsx("span", {
										className: "el-micro-lbl",
										style: { color: "#A78BFA" },
										children: "nextTick"
									}), /* @__PURE__ */ jsx("span", {
										className: "el-queue",
										children: f.queues.nextTick.length ? f.queues.nextTick.map((t) => /* @__PURE__ */ jsx(Chip$1, { t }, t.id)) : /* @__PURE__ */ jsx("span", {
											className: "el-empty",
											children: "—"
										})
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "el-micro-row",
									children: [/* @__PURE__ */ jsx("span", {
										className: "el-micro-lbl",
										style: { color: "#C4B5FD" },
										children: "promise"
									}), /* @__PURE__ */ jsx("span", {
										className: "el-queue",
										children: f.queues.promise.length ? f.queues.promise.map((t) => /* @__PURE__ */ jsx(Chip$1, { t }, t.id)) : /* @__PURE__ */ jsx("span", {
											className: "el-empty",
											children: "—"
										})
									})]
								})
							]
						}), /* @__PURE__ */ jsxs("div", {
							className: "el-console",
							children: [/* @__PURE__ */ jsx("div", {
								className: "el-col-title",
								children: "console output"
							}), /* @__PURE__ */ jsxs("div", {
								className: "el-out",
								"aria-live": "polite",
								children: [f.output.length === 0 ? /* @__PURE__ */ jsx("span", {
									className: "el-empty",
									children: "(nothing yet)"
								}) : null, f.output.map((line, k) => /* @__PURE__ */ jsxs("div", {
									className: "el-line" + (k === f.output.length - 1 && f.acted ? " fresh" : ""),
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "el-gt",
											children: "›"
										}),
										" ",
										line
									]
								}, k))]
							})]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "el-caption",
				"aria-live": "polite",
				children: [/* @__PURE__ */ jsx("span", {
					className: "el-zone",
					children: zoneLabel
				}), f.caption]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "el-controls",
				children: [
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI(0);
						},
						disabled: i === 0 && !playing,
						children: "⤺ Reset"
					}),
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI((v) => Math.max(0, v - 1));
						},
						disabled: i === 0,
						children: "◀ Back"
					}),
					atEnd ? /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => {
							setI(0);
							setPlaying(true);
						},
						children: "↻ Replay"
					}) : /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => setPlaying((p) => !p),
						children: playing ? "⏸ Pause" : "▶ Play"
					}),
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI((v) => Math.min(frames.length - 1, v + 1));
						},
						disabled: atEnd,
						children: "Step ▶"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "el-progress",
						children: /* @__PURE__ */ jsx("div", {
							className: "el-progress-bar",
							style: { width: `${i / (frames.length - 1) * 100}%` }
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "el-step",
						children: [
							i + 1,
							"/",
							frames.length
						]
					})
				]
			}),
			atEnd ? /* @__PURE__ */ jsxs("div", {
				className: "el-expected",
				children: ["Final output: ", scenario.expected.map((e, k) => /* @__PURE__ */ jsx("span", {
					className: "el-chip",
					style: {
						borderColor: "#6CC24A",
						color: "#6CC24A"
					},
					children: e
				}, k))]
			}) : null
		]
	});
}
//#endregion
//#region src/lib/asyncEngine.ts
function simulate$2(s) {
	const micro = {
		nextTick: [],
		promise: []
	};
	const macro = {
		timeout: [],
		immediate: []
	};
	const output = [];
	const frames = [];
	const stack = [];
	let nextId = 0;
	const CAP = 600;
	const qOf = (k) => k === "nextTick" ? micro.nextTick : k === "promise" ? micro.promise : k === "timeout" ? macro.timeout : macro.immediate;
	const snap = (zone, caption, acted, line) => {
		frames.push({
			step: frames.length,
			zone,
			caption,
			acted,
			line,
			stack: [...stack],
			micro: {
				nextTick: [...micro.nextTick],
				promise: [...micro.promise]
			},
			macro: {
				timeout: [...macro.timeout],
				immediate: [...macro.immediate]
			},
			output: output.map((o) => ({ ...o }))
		});
		if (frames.length > CAP) throw new Error("async sim exceeded frame cap");
	};
	const emit = (text) => {
		output.push({
			n: output.length + 1,
			text
		});
	};
	const scheduleSpec = (spec) => {
		qOf(spec.kind).push({
			id: nextId++,
			kind: spec.kind,
			label: spec.label,
			text: spec.text,
			line: spec.line,
			schedules: spec.schedules
		});
	};
	const scheduleCont = (fn, rest) => {
		micro.promise.push({
			id: nextId++,
			kind: "promise",
			label: `${fn}() ⟳`,
			fn,
			rest,
			line: rest[0]?.line
		});
	};
	stack.push("(main script)");
	snap("sync", "Main script is on the call stack — synchronous code runs top to bottom.", null, null);
	for (const o of s.main) if (o.op === "log") {
		emit(o.text);
		snap("sync", `console.log('${o.text}') runs now — synchronously.`, {
			kind: "sync",
			text: o.text
		}, o.line ?? null);
	} else if (o.op === "schedule") {
		scheduleSpec(o.spec);
		snap("sync", `Register a callback → ${o.spec.kind === "nextTick" ? "the process.nextTick queue (microtask · highest priority)" : o.spec.kind === "promise" ? "the Promise / microtask queue" : o.spec.kind === "timeout" ? "the timers queue (macrotask)" : "the check queue (setImmediate · macrotask)"}. Nothing runs yet; the loop keeps going.`, {
			kind: o.spec.kind,
			text: o.spec.text
		}, o.spec.line ?? null);
	} else {
		stack.push(`${o.fn}()`);
		snap("sync", `Call ${o.fn}() — the async body runs synchronously until the first await.`, {
			kind: "call",
			text: `${o.fn}()`
		}, o.callLine ?? null);
		const seg0 = o.segs[0];
		for (const lg of seg0.logs) {
			emit(lg);
			snap("sync", `Inside ${o.fn}(): console.log('${lg}') — still synchronous.`, {
				kind: "sync",
				text: lg
			}, seg0.line ?? null);
		}
		if (o.segs.length > 1) {
			snap("sync", `await — ${o.fn}() suspends. The rest of the function becomes a microtask; control returns to the caller.`, {
				kind: "suspend",
				text: `${o.fn} await`
			}, seg0.awaitLine ?? null);
			stack.pop();
			scheduleCont(o.fn, o.segs.slice(1));
		} else stack.pop();
	}
	stack.pop();
	snap("sync", "Main script finished — the call stack is empty. Drain microtasks before any macrotask.", null, null);
	const runTask = (t, zone) => {
		stack.push(t.label);
		if (t.rest) {
			const seg = t.rest[0];
			for (const lg of seg.logs) {
				emit(lg);
				snap(zone, `${t.fn}() resumes after its await (it was a queued microtask): console.log('${lg}').`, {
					kind: "resume",
					text: lg
				}, seg.line ?? null);
			}
			if (t.rest.length > 1) {
				snap(zone, `await again — ${t.fn}() suspends; the next part is queued as another microtask.`, {
					kind: "suspend",
					text: `${t.fn} await`
				}, seg.awaitLine ?? null);
				stack.pop();
				scheduleCont(t.fn, t.rest.slice(1));
				return;
			}
			stack.pop();
			return;
		}
		if (t.text !== void 0) {
			emit(t.text);
			snap(zone, `${t.kind === "nextTick" ? "process.nextTick callback (microtask)" : t.kind === "promise" ? "Promise / queueMicrotask callback (microtask)" : t.kind === "timeout" ? "setTimeout callback (timers phase)" : "setImmediate callback (check phase)"}: console.log('${t.text}').`, {
				kind: t.kind,
				text: t.text
			}, t.line ?? null);
		}
		if (t.schedules) for (const sp of t.schedules) scheduleSpec(sp);
		stack.pop();
	};
	const drainMicro = () => {
		while (micro.nextTick.length || micro.promise.length) runTask(micro.nextTick.length ? micro.nextTick.shift() : micro.promise.shift(), "micro");
	};
	snap("micro", "Microtask checkpoint — drain process.nextTick first, then the Promise queue, completely.", null, null);
	drainMicro();
	const hasMacro = () => macro.timeout.length > 0 || macro.immediate.length > 0;
	if (hasMacro()) snap("macro", "Microtasks empty → the event loop runs the next macrotask (timers before check), then drains microtasks again.", null, null);
	while (hasMacro()) {
		runTask(macro.timeout.length ? macro.timeout.shift() : macro.immediate.shift(), "macro");
		drainMicro();
	}
	snap("done", "Call stack and every queue are empty → the program ends. That is the exact, predictable output order.", null, null);
	return frames;
}
var SCENARIOS$2 = [
	{
		id: "micro-macro",
		title: "Microtasks beat macrotasks",
		blurb: "sync · nextTick · Promise · queueMicrotask · setImmediate — the priority ladder, in one shot.",
		takeaway: "All synchronous code first. Then microtasks (nextTick before promises). Then a macrotask. Source order ≠ run order.",
		code: `console.log('1: sync start');
setImmediate(() => console.log('6: setImmediate (macro)'));
Promise.resolve().then(() => console.log('4: promise.then (micro)'));
queueMicrotask(() => console.log('5: queueMicrotask (micro)'));
process.nextTick(() => console.log('3: nextTick (micro)'));
console.log('2: sync end');`,
		main: [
			{
				op: "log",
				text: "1: sync start",
				line: 0
			},
			{
				op: "schedule",
				spec: {
					kind: "immediate",
					label: "setImmediate cb",
					text: "6: setImmediate (macro)",
					line: 1
				}
			},
			{
				op: "schedule",
				spec: {
					kind: "promise",
					label: "Promise.then cb",
					text: "4: promise.then (micro)",
					line: 2
				}
			},
			{
				op: "schedule",
				spec: {
					kind: "promise",
					label: "queueMicrotask cb",
					text: "5: queueMicrotask (micro)",
					line: 3
				}
			},
			{
				op: "schedule",
				spec: {
					kind: "nextTick",
					label: "nextTick cb",
					text: "3: nextTick (micro)",
					line: 4
				}
			},
			{
				op: "log",
				text: "2: sync end",
				line: 5
			}
		],
		expected: [
			"1: sync start",
			"2: sync end",
			"3: nextTick (micro)",
			"4: promise.then (micro)",
			"5: queueMicrotask (micro)",
			"6: setImmediate (macro)"
		]
	},
	{
		id: "await-suspends",
		title: "await suspends the function",
		blurb: "The sync part of an async function runs now; everything after await is a microtask — it beats a timer.",
		takeaway: "await pauses the function, not the thread. Code after await is a microtask, so it runs before setTimeout but after all sync code.",
		code: `console.log('1: sync start');
setTimeout(() => console.log('5: setTimeout (macro)'), 0);
async function run() {
  console.log('2: async — sync part');
  await null;                  // suspend → the rest is a microtask
  console.log('4: after await (micro)');
}
run();
console.log('3: sync end');`,
		main: [
			{
				op: "log",
				text: "1: sync start",
				line: 0
			},
			{
				op: "schedule",
				spec: {
					kind: "timeout",
					label: "setTimeout cb",
					text: "5: setTimeout (macro)",
					line: 1
				}
			},
			{
				op: "call",
				fn: "run",
				callLine: 7,
				segs: [{
					logs: ["2: async — sync part"],
					line: 3,
					awaitLine: 4
				}, {
					logs: ["4: after await (micro)"],
					line: 5
				}]
			},
			{
				op: "log",
				text: "3: sync end",
				line: 8
			}
		],
		expected: [
			"1: sync start",
			"2: async — sync part",
			"3: sync end",
			"4: after await (micro)",
			"5: setTimeout (macro)"
		]
	},
	{
		id: "interleave",
		title: "Two async functions interleave",
		blurb: "Each await splits a function into microtasks; two running functions take turns through the queue.",
		takeaway: "Concurrency, not parallelism: a() and b() interleave one microtask at a time. Their sync parts run first, then each resumption takes a turn.",
		code: `async function a() {
  console.log('a1');
  await null;
  console.log('a2');
  await null;
  console.log('a3');
}
async function b() {
  console.log('b1');
  await null;
  console.log('b2');
}
console.log('start');
a();
b();
console.log('end');`,
		main: [
			{
				op: "log",
				text: "start",
				line: 12
			},
			{
				op: "call",
				fn: "a",
				callLine: 13,
				segs: [
					{
						logs: ["a1"],
						line: 1,
						awaitLine: 2
					},
					{
						logs: ["a2"],
						line: 3,
						awaitLine: 4
					},
					{
						logs: ["a3"],
						line: 5
					}
				]
			},
			{
				op: "call",
				fn: "b",
				callLine: 14,
				segs: [{
					logs: ["b1"],
					line: 8,
					awaitLine: 9
				}, {
					logs: ["b2"],
					line: 10
				}]
			},
			{
				op: "log",
				text: "end",
				line: 15
			}
		],
		expected: [
			"start",
			"a1",
			"b1",
			"end",
			"a2",
			"b2",
			"a3"
		]
	}
];
//#endregion
//#region src/components/sims/AsyncOrderSim.tsx
var KIND_COLOR$1 = {
	nextTick: "#A78BFA",
	promise: "#C4B5FD",
	timeout: "#38BDF8",
	immediate: "#4ADE80"
};
var ZONE_LABEL = {
	sync: "synchronous · call stack",
	micro: "microtask checkpoint",
	macro: "macrotask · event loop",
	done: "program finished"
};
var ACT_TONE = {
	sync: "var(--tx2)",
	nextTick: "#A78BFA",
	promise: "#C4B5FD",
	timeout: "#38BDF8",
	immediate: "#4ADE80",
	suspend: "#FF7A00",
	resume: "#C4B5FD",
	call: "var(--accent-bright)"
};
var PLAY_MS$2 = 1e3;
function Chip({ t }) {
	const c = KIND_COLOR$1[t.kind];
	return /* @__PURE__ */ jsx("span", {
		className: "as-chip",
		style: {
			borderColor: c,
			color: c
		},
		title: t.label,
		children: t.text ?? t.label
	});
}
function QueueRow({ label, color, tasks }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "as-qrow",
		children: [/* @__PURE__ */ jsx("span", {
			className: "as-qlbl",
			style: { color },
			children: label
		}), /* @__PURE__ */ jsx("span", {
			className: "as-queue",
			children: tasks.length ? tasks.map((t) => /* @__PURE__ */ jsx(Chip, { t }, t.id)) : /* @__PURE__ */ jsx("span", {
				className: "as-empty",
				children: "—"
			})
		})]
	});
}
function AsyncOrderSim() {
	const [sIdx, setSIdx] = useState(0);
	const scenario = SCENARIOS$2[sIdx];
	const frames = useMemo(() => simulate$2(scenario), [scenario]);
	const codeLines = useMemo(() => scenario.code.split("\n"), [scenario]);
	const [i, setI] = useState(0);
	const [playing, setPlaying] = useState(false);
	const timer = useRef(null);
	useEffect(() => {
		setI(0);
		setPlaying(false);
	}, [sIdx]);
	useEffect(() => {
		if (!playing) return;
		timer.current = window.setInterval(() => {
			setI((prev) => {
				if (prev >= frames.length - 1) {
					setPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, PLAY_MS$2);
		return () => {
			if (timer.current) window.clearInterval(timer.current);
		};
	}, [playing, frames.length]);
	const f = frames[i];
	const atEnd = i >= frames.length - 1;
	const microCount = f.micro.nextTick.length + f.micro.promise.length;
	const macroCount = f.macro.timeout.length + f.macro.immediate.length;
	return /* @__PURE__ */ jsxs("div", {
		className: "as-sim",
		"aria-label": "Async execution-order simulator",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "as-tabs",
				role: "tablist",
				children: SCENARIOS$2.map((s, idx) => /* @__PURE__ */ jsx("button", {
					role: "tab",
					"aria-selected": idx === sIdx,
					className: idx === sIdx ? "on" : "",
					onClick: () => setSIdx(idx),
					children: s.title
				}, s.id))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "as-blurb",
				children: scenario.blurb
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "as-body",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "as-code",
					children: [/* @__PURE__ */ jsx("div", {
						className: "as-code-head",
						children: "program.js"
					}), /* @__PURE__ */ jsx("pre", { children: /* @__PURE__ */ jsx("code", { children: codeLines.map((ln, k) => /* @__PURE__ */ jsxs("div", {
						className: "as-cl" + (f.line === k ? " on" : ""),
						children: [/* @__PURE__ */ jsx("span", {
							className: "as-ln",
							children: String(k + 1).padStart(2, " ")
						}), /* @__PURE__ */ jsx("span", {
							className: "as-lt",
							children: ln === "" ? " " : ln
						})]
					}, k)) }) })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "as-stage",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "as-lanes",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "as-lane stack" + (f.zone === "sync" ? " on" : ""),
								children: [/* @__PURE__ */ jsxs("div", {
									className: "as-col-title",
									children: ["call stack ", /* @__PURE__ */ jsx("span", {
										className: "as-tag",
										children: "now"
									})]
								}), /* @__PURE__ */ jsx("div", {
									className: "as-stackbox",
									children: f.stack.length ? [...f.stack].reverse().map((fr, k) => /* @__PURE__ */ jsx("div", {
										className: "as-frame" + (k === 0 ? " top" : ""),
										children: fr
									}, k)) : /* @__PURE__ */ jsx("span", {
										className: "as-empty",
										children: "— empty —"
									})
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "as-lane micro" + (f.zone === "micro" ? " on" : ""),
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "as-col-title",
										children: ["microtasks ", /* @__PURE__ */ jsxs("span", {
											className: "as-tag",
											children: ["this tick · ", microCount]
										})]
									}),
									/* @__PURE__ */ jsx(QueueRow, {
										label: "nextTick",
										color: KIND_COLOR$1.nextTick,
										tasks: f.micro.nextTick
									}),
									/* @__PURE__ */ jsx(QueueRow, {
										label: "promise",
										color: KIND_COLOR$1.promise,
										tasks: f.micro.promise
									})
								]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "as-lane macro" + (f.zone === "macro" ? " on" : ""),
								children: [
									/* @__PURE__ */ jsxs("div", {
										className: "as-col-title",
										children: ["macrotasks ", /* @__PURE__ */ jsxs("span", {
											className: "as-tag",
											children: ["later · ", macroCount]
										})]
									}),
									/* @__PURE__ */ jsx(QueueRow, {
										label: "timers",
										color: KIND_COLOR$1.timeout,
										tasks: f.macro.timeout
									}),
									/* @__PURE__ */ jsx(QueueRow, {
										label: "check",
										color: KIND_COLOR$1.immediate,
										tasks: f.macro.immediate
									})
								]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "as-console",
						children: [/* @__PURE__ */ jsx("div", {
							className: "as-col-title",
							children: "console output — in the order it actually prints"
						}), /* @__PURE__ */ jsxs("div", {
							className: "as-out",
							"aria-live": "polite",
							children: [f.output.length === 0 ? /* @__PURE__ */ jsx("span", {
								className: "as-empty",
								children: "(nothing yet)"
							}) : null, f.output.map((o, k) => /* @__PURE__ */ jsxs("div", {
								className: "as-line" + (k === f.output.length - 1 && f.acted ? " fresh" : ""),
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "as-on",
										children: String(o.n).padStart(2, "0")
									}),
									/* @__PURE__ */ jsx("span", {
										className: "as-gt",
										children: "›"
									}),
									" ",
									o.text
								]
							}, k))]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "as-caption",
				"aria-live": "polite",
				children: [/* @__PURE__ */ jsx("span", {
					className: "as-zone",
					style: {
						color: f.acted ? ACT_TONE[f.acted.kind] : "var(--accent)",
						borderColor: "var(--accent-deep)"
					},
					children: ZONE_LABEL[f.zone]
				}), f.caption]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "as-controls",
				children: [
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI(0);
						},
						disabled: i === 0 && !playing,
						children: "⤺ Reset"
					}),
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI((v) => Math.max(0, v - 1));
						},
						disabled: i === 0,
						children: "◀ Back"
					}),
					atEnd ? /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => {
							setI(0);
							setPlaying(true);
						},
						children: "↻ Replay"
					}) : /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => setPlaying((p) => !p),
						children: playing ? "⏸ Pause" : "▶ Play"
					}),
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI((v) => Math.min(frames.length - 1, v + 1));
						},
						disabled: atEnd,
						children: "Step ▶"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "as-progress",
						children: /* @__PURE__ */ jsx("div", {
							className: "as-progress-bar",
							style: { width: `${i / (frames.length - 1) * 100}%` }
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "as-step",
						children: [
							i + 1,
							"/",
							frames.length
						]
					})
				]
			}),
			atEnd ? /* @__PURE__ */ jsxs("div", {
				className: "as-expected",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "as-exp-lbl",
						children: "Final order:"
					}),
					scenario.expected.map((e, k) => /* @__PURE__ */ jsx("span", {
						className: "as-chip",
						style: {
							borderColor: "#6CC24A",
							color: "#6CC24A"
						},
						children: e
					}, k)),
					/* @__PURE__ */ jsx("span", {
						className: "as-takeaway",
						children: scenario.takeaway
					})
				]
			}) : null
		]
	});
}
//#endregion
//#region src/lib/gcEngine.ts
var PROMOTE_AGE = 2;
var CAP$1 = 400;
var KIND_LABEL = {
	g: "garbage",
	p: "long-lived",
	t: "medium-lived"
};
function simulate$1(s) {
	const frames = [];
	let from = [];
	let to = [];
	let old = [];
	let nextId = 1;
	const stats = {
		alloc: 0,
		minor: 0,
		major: 0,
		promoted: 0,
		reclaimed: 0
	};
	const snap = (phase, gc, caption) => {
		const clone = (xs) => xs.map((c) => ({ ...c }));
		frames.push({
			step: frames.length,
			phase,
			gc,
			caption,
			from: clone(from),
			to: clone(to),
			old: clone(old),
			youngCap: s.youngCap,
			oldCap: s.oldCap,
			stats: { ...stats }
		});
		if (frames.length > CAP$1) throw new Error("gc sim exceeded frame cap");
	};
	const clearTones = (xs) => {
		for (const c of xs) c.tone = "normal";
	};
	const runMajor = () => {
		stats.major++;
		for (const c of old) c.tone = c.kind === "t" ? "dead" : "live";
		snap("major-mark", "major", `Old space is full → MAJOR GC (Mark-Sweep-Compact). Concurrent marking finds the live objects; the ${old.filter((c) => c.kind === "t").length} medium-lived ones are now unreachable.`);
		const before = old.length;
		old = old.filter((c) => c.kind !== "t");
		stats.reclaimed += before - old.length;
		clearTones(old);
		snap("major-sweep", "major", `Sweep the dead and COMPACT the survivors to one end — no fragmentation. Major GCs are rarer but costlier than minors, with brief stop-the-world pauses.`);
	};
	const runMinor = () => {
		stats.minor++;
		for (const c of from) c.tone = c.kind === "g" ? "dead" : "live";
		const deadN = from.filter((c) => c.kind === "g").length;
		snap("minor-mark", "minor", `Young space (From) is full → MINOR GC (Scavenge). Mark live objects: ${from.length - deadN} survive, ${deadN} are garbage. Most objects die young.`);
		to = [];
		let promotedNow = 0;
		for (const c of from) {
			if (c.kind === "g") {
				stats.reclaimed++;
				continue;
			}
			const aged = c.age + 1;
			if (aged >= PROMOTE_AGE) {
				if (old.length >= s.oldCap) runMajor();
				old.push({
					...c,
					age: aged,
					tone: "promoted"
				});
				stats.promoted++;
				promotedNow++;
			} else to.push({
				...c,
				age: aged,
				tone: "live"
			});
		}
		snap("minor-copy", "minor", `Copy the ${to.length} survivor${to.length === 1 ? "" : "s"} into the To-space${promotedNow ? `; ${promotedNow} that already survived twice are PROMOTED to old space` : ""}. Only live objects are touched — that is why a Scavenge is cheap.`);
		clearTones(old);
		from = to.map((c) => ({
			...c,
			tone: "normal"
		}));
		to = [];
		snap("minor-flip", "none", `FLIP: the To-space becomes the active young space; the old From space is now empty and free for new allocations.`);
	};
	snap("start", "none", "Empty heap. Objects will be born in the young generation (the nursery).");
	for (const spec of s.script) {
		if (from.length >= s.youngCap) runMinor();
		clearTones(from);
		const cell = {
			id: nextId,
			label: "#" + nextId,
			kind: spec.kind,
			age: 0,
			tone: "new"
		};
		nextId++;
		from.push(cell);
		stats.alloc++;
		snap("alloc", "none", `Allocate object ${cell.label} (${KIND_LABEL[spec.kind]}) in the young space — bump-pointer fast, no GC needed.`);
	}
	clearTones(from);
	snap("done", "none", `Done. ${stats.minor} minor GC${stats.minor === 1 ? "" : "s"} (Scavenge) vs ${stats.major} major GC${stats.major === 1 ? "" : "s"} (Mark-Sweep-Compact): minors dominate — exactly the generational hypothesis.`);
	return frames;
}
var g = { kind: "g" };
var p = { kind: "p" };
var SCENARIOS$1 = [{
	id: "scavenge",
	title: "Scavenge the nursery",
	blurb: "Most objects die young. One Scavenge reclaims the garbage, copies the survivor, and flips the semi-spaces.",
	youngCap: 5,
	oldCap: 3,
	takeaway: "The young generation is two semi-spaces. A Scavenge copies only the (few) survivors into the To-space and abandons the rest, then flips. Cost is proportional to survivors, not to garbage — so churning short-lived objects is cheap.",
	script: [
		g,
		p,
		g,
		g,
		g,
		g,
		p
	]
}, {
	id: "promote",
	title: "Promotion → major GC",
	blurb: "Survivors that live through two scavenges graduate to old space. When old fills, a Mark-Sweep-Compact runs.",
	youngCap: 5,
	oldCap: 3,
	takeaway: "Survive ~2 scavenges and you are promoted to old space, collected by the slower Mark-Sweep-Compact. Long-lived objects (caches, leaks) live here — a leak is really 'old space never shrinks'. Minors are frequent and cheap; majors are rare and costly.",
	script: [
		g,
		p,
		p,
		g,
		g,
		g,
		g,
		{ kind: "t" },
		p,
		g,
		g,
		g,
		g,
		p,
		g,
		g,
		g
	]
}];
//#endregion
//#region src/components/sims/GcSim.tsx
var KIND_COLOR = {
	g: "#6B7B6E",
	p: "#6CC24A",
	t: "#FBBF24"
};
var PLAY_MS$1 = 900;
function CellBox({ cell }) {
	const base = KIND_COLOR[cell.kind];
	const color = cell.tone === "dead" ? "#F87171" : base;
	return /* @__PURE__ */ jsxs("span", {
		className: "gc-cell tone-" + cell.tone,
		style: {
			borderColor: color,
			color
		},
		title: `${cell.label} · ${cell.kind === "g" ? "garbage" : cell.kind === "p" ? "long-lived" : "medium-lived"} · age ${cell.age}`,
		children: [cell.label, cell.age > 0 && cell.tone !== "dead" ? /* @__PURE__ */ jsx("span", {
			className: "gc-age",
			children: cell.age
		}) : null]
	});
}
function Space({ cells, cap, label, sub }) {
	const empties = Math.max(0, cap - cells.length);
	return /* @__PURE__ */ jsxs("div", {
		className: "gc-space",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "gc-space-head",
				children: [label, /* @__PURE__ */ jsxs("span", {
					className: "gc-space-fill",
					children: [
						cells.length,
						"/",
						cap
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "gc-cells",
				children: [cells.map((c) => /* @__PURE__ */ jsx(CellBox, { cell: c }, c.id)), Array.from({ length: empties }, (_, k) => /* @__PURE__ */ jsx("span", { className: "gc-slot" }, "e" + k))]
			}),
			sub ? /* @__PURE__ */ jsx("div", {
				className: "gc-space-sub",
				children: sub
			}) : null
		]
	});
}
function Stat({ n, label, accent }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "gc-stat",
		children: [/* @__PURE__ */ jsx("span", {
			className: "gc-stat-n",
			style: accent ? { color: accent } : void 0,
			children: n
		}), /* @__PURE__ */ jsx("span", {
			className: "gc-stat-l",
			children: label
		})]
	});
}
function GcSim() {
	const [sIdx, setSIdx] = useState(0);
	const scenario = SCENARIOS$1[sIdx];
	const frames = useMemo(() => simulate$1(scenario), [scenario]);
	const [i, setI] = useState(0);
	const [playing, setPlaying] = useState(false);
	const timer = useRef(null);
	useEffect(() => {
		setI(0);
		setPlaying(false);
	}, [sIdx]);
	useEffect(() => {
		if (!playing) return;
		timer.current = window.setInterval(() => {
			setI((prev) => {
				if (prev >= frames.length - 1) {
					setPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, PLAY_MS$1);
		return () => {
			if (timer.current) window.clearInterval(timer.current);
		};
	}, [playing, frames.length]);
	const f = frames[i];
	const atEnd = i >= frames.length - 1;
	return /* @__PURE__ */ jsxs("div", {
		className: "gc-sim",
		"aria-label": "Generational garbage-collection simulator",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "gc-tabs",
				role: "tablist",
				children: SCENARIOS$1.map((s, idx) => /* @__PURE__ */ jsx("button", {
					role: "tab",
					"aria-selected": idx === sIdx,
					className: idx === sIdx ? "on" : "",
					onClick: () => setSIdx(idx),
					children: s.title
				}, s.id))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "gc-blurb",
				children: scenario.blurb
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "gc-gen young" + (f.gc === "minor" ? " active" : ""),
				children: [/* @__PURE__ */ jsxs("div", {
					className: "gc-gen-head",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "gc-dot",
							style: { background: "#6CC24A" }
						}),
						"young generation (nursery)",
						f.gc === "minor" ? /* @__PURE__ */ jsx("span", {
							className: "gc-badge minor",
							children: "MINOR GC · Scavenge"
						}) : null
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "gc-semis",
					children: [
						/* @__PURE__ */ jsx(Space, {
							cells: f.from,
							cap: f.youngCap,
							label: "From (active)",
							sub: "allocations land here"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "gc-flip",
							"aria-hidden": "true",
							children: "⇄"
						}),
						/* @__PURE__ */ jsx(Space, {
							cells: f.to,
							cap: f.youngCap,
							label: "To (reserve)",
							sub: "survivors copied here, then flip"
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "gc-gen old" + (f.gc === "major" ? " active" : ""),
				children: [/* @__PURE__ */ jsxs("div", {
					className: "gc-gen-head",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "gc-dot",
							style: { background: "#38BDF8" }
						}),
						"old generation",
						f.gc === "major" ? /* @__PURE__ */ jsx("span", {
							className: "gc-badge major",
							children: "MAJOR GC · Mark-Sweep-Compact"
						}) : null
					]
				}), /* @__PURE__ */ jsx(Space, {
					cells: f.old,
					cap: f.oldCap,
					label: "old space",
					sub: "promoted survivors · mark-sweep-compact"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "gc-stats",
				children: [
					/* @__PURE__ */ jsx(Stat, {
						n: f.stats.alloc,
						label: "allocated"
					}),
					/* @__PURE__ */ jsx(Stat, {
						n: f.stats.minor,
						label: "minor GCs",
						accent: "#6CC24A"
					}),
					/* @__PURE__ */ jsx(Stat, {
						n: f.stats.major,
						label: "major GCs",
						accent: "#38BDF8"
					}),
					/* @__PURE__ */ jsx(Stat, {
						n: f.stats.promoted,
						label: "promoted",
						accent: "#FBBF24"
					}),
					/* @__PURE__ */ jsx(Stat, {
						n: f.stats.reclaimed,
						label: "reclaimed",
						accent: "#F87171"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "gc-legend",
				children: [
					/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
						className: "gc-key",
						style: {
							borderColor: KIND_COLOR.g,
							color: KIND_COLOR.g
						},
						children: "#"
					}), " garbage (dies young)"] }),
					/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
						className: "gc-key",
						style: {
							borderColor: KIND_COLOR.p,
							color: KIND_COLOR.p
						},
						children: "#"
					}), " long-lived"] }),
					/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
						className: "gc-key",
						style: {
							borderColor: KIND_COLOR.t,
							color: KIND_COLOR.t
						},
						children: "#"
					}), " medium-lived"] }),
					/* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
						className: "gc-key",
						style: {
							borderColor: "#F87171",
							color: "#F87171"
						},
						children: "#"
					}), " marked dead"] }),
					/* @__PURE__ */ jsx("span", {
						className: "gc-legend-note",
						children: "small number = scavenges survived (age)"
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "gc-caption",
				"aria-live": "polite",
				children: [/* @__PURE__ */ jsx("span", {
					className: "gc-phase",
					children: f.phase
				}), f.caption]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "gc-controls",
				children: [
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI(0);
						},
						disabled: i === 0 && !playing,
						children: "⤺ Reset"
					}),
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI((v) => Math.max(0, v - 1));
						},
						disabled: i === 0,
						children: "◀ Back"
					}),
					atEnd ? /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => {
							setI(0);
							setPlaying(true);
						},
						children: "↻ Replay"
					}) : /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => setPlaying((p) => !p),
						children: playing ? "⏸ Pause" : "▶ Play"
					}),
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI((v) => Math.min(frames.length - 1, v + 1));
						},
						disabled: atEnd,
						children: "Step ▶"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "gc-progress",
						children: /* @__PURE__ */ jsx("div", {
							className: "gc-progress-bar",
							style: { width: `${i / (frames.length - 1) * 100}%` }
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "gc-step",
						children: [
							i + 1,
							"/",
							frames.length
						]
					})
				]
			}),
			atEnd ? /* @__PURE__ */ jsxs("div", {
				className: "gc-takeaway",
				children: [/* @__PURE__ */ jsx("span", {
					className: "gc-take-lbl",
					children: "Takeaway"
				}), scenario.takeaway]
			}) : null
		]
	});
}
//#endregion
//#region src/lib/threadPoolEngine.ts
var CAP = 400;
function simulate(s, poolSizeOverride) {
	const poolSize = poolSizeOverride ?? s.poolSize;
	const frames = [];
	const poolTasks = s.tasks.filter((t) => t.lane === "pool");
	const kernelTasks = s.tasks.filter((t) => t.lane === "kernel");
	const queue = [...poolTasks];
	const slots = Array.from({ length: poolSize }, () => null);
	const kernel = kernelTasks.map((task) => ({
		task,
		remaining: task.cost
	}));
	const done = [];
	let now = 0;
	const snap = (event, caption, justFinished) => {
		frames.push({
			step: frames.length,
			now,
			event,
			caption,
			poolSize,
			queue: [...queue],
			slots: slots.map((sl) => sl ? {
				task: sl.task,
				remaining: sl.remaining
			} : null),
			kernel: kernel.map((k) => ({
				task: k.task,
				remaining: k.remaining
			})),
			done: [...done],
			justFinished
		});
		if (frames.length > CAP) throw new Error("thread-pool sim exceeded frame cap");
	};
	const fillSlots = () => {
		for (let i = 0; i < slots.length; i++) if (!slots[i] && queue.length) {
			const task = queue.shift();
			slots[i] = {
				task,
				remaining: task.cost
			};
		}
	};
	fillSlots();
	const kn = kernelTasks.length;
	const queued = queue.length;
	snap("dispatch", `Dispatch. ${kn ? `${kn} network op${kn > 1 ? "s" : ""} armed on the kernel at once (no thread held). ` : ""}${poolTasks.length ? `${Math.min(poolSize, poolTasks.length)} pool task${poolSize > 1 ? "s" : ""} take the ${poolSize} slot${poolSize > 1 ? "s" : ""}${queued ? `; ${queued} wait in the queue` : ""}.` : ""}`, []);
	const anyRunning = () => slots.some((sl) => sl !== null) || kernel.some((k) => k.remaining > 0) || queue.length > 0;
	while (anyRunning()) {
		now++;
		for (const sl of slots) if (sl) sl.remaining--;
		for (const k of kernel) if (k.remaining > 0) k.remaining--;
		const justFinished = [];
		for (let i = 0; i < slots.length; i++) {
			const sl = slots[i];
			if (sl && sl.remaining <= 0) {
				done.push({
					task: sl.task,
					finish: now
				});
				justFinished.push(sl.task.id);
				slots[i] = null;
			}
		}
		for (const k of kernel) if (k.remaining === 0 && !done.some((d) => d.task.id === k.task.id)) {
			done.push({
				task: k.task,
				finish: now
			});
			justFinished.push(k.task.id);
			k.remaining = -1;
		}
		if (justFinished.length) {
			const poolDone = justFinished.filter((id) => poolTasks.some((t) => t.id === id)).length;
			const kerDone = justFinished.length - poolDone;
			const waiting = queue.length;
			const parts = [];
			if (poolDone) parts.push(`${poolDone} pool task${poolDone > 1 ? "s" : ""} finished`);
			if (kerDone) parts.push(`${kerDone} network op${kerDone > 1 ? "s" : ""} finished`);
			let cap = `Tick ${now}: ${parts.join(" · ")}.`;
			if (poolDone && waiting) cap += ` ${Math.min(poolDone, waiting)} queued task${Math.min(poolDone, waiting) > 1 ? "s" : ""} now claim${Math.min(poolDone, waiting) > 1 ? "" : "s"} the freed slot${poolDone > 1 ? "s" : ""}.`;
			else if (poolDone && !waiting) cap += ` Their slots go idle — the queue is empty.`;
			fillSlots();
			snap("complete", cap, justFinished);
		} else snap("tick", `Tick ${now}: work in progress…`, []);
	}
	snap("done", "Everything completed. Notice the pool finished in waves; the kernel ops all finished together.", []);
	return frames;
}
var POOL_COST = 5;
var NET_COST = 6;
var poolTask = (n, label) => ({
	id: n,
	lane: "pool",
	label,
	cost: POOL_COST
});
var netTask = (n, label) => ({
	id: n,
	lane: "kernel",
	label,
	cost: NET_COST
});
var SCENARIOS = [
	{
		id: "saturate",
		title: "The pool saturates",
		blurb: "6 crypto.pbkdf2 hashes on a fixed pool — extras queue and finish in waves. Change the pool size and watch the waves change.",
		poolSize: 4,
		poolSizes: [
			2,
			4,
			6
		],
		takeaway: "The libuv pool is a fixed, shared resource (default 4). N CPU-bound pool tasks finish in ⌈N / poolSize⌉ waves — one slow pbkdf2 delays every other fs/crypto/zlib call in the process.",
		code: `const crypto = require('node:crypto');
// 6 CPU-bound hashes — each holds a pool thread
// for its whole duration (a blocking C call).
for (let i = 1; i <= 6; i++) {
  crypto.pbkdf2('pw', 's' + i, 1e6, 64, 'sha512', done);
}`,
		tasks: [
			poolTask(1, "pbkdf2 #1"),
			poolTask(2, "pbkdf2 #2"),
			poolTask(3, "pbkdf2 #3"),
			poolTask(4, "pbkdf2 #4"),
			poolTask(5, "pbkdf2 #5"),
			poolTask(6, "pbkdf2 #6")
		]
	},
	{
		id: "kernel",
		title: "The kernel needs no thread",
		blurb: "6 http.get requests — non-blocking sockets the OS watches. They all fly at once; the pool stays empty.",
		poolSize: 4,
		poolSizes: [2, 4],
		takeaway: "Network I/O is non-blocking: the kernel (epoll/kqueue/IOCP) watches every socket and the loop is notified on readiness. No pool thread is held, so thousands of connections scale on one thread — this is Node's core strength.",
		code: `const https = require('node:https');
// 6 network requests — non-blocking sockets the
// kernel watches; NO pool thread is held.
for (const p of ['/a','/b','/c','/d','/e','/f']) {
  https.get('https://api.example.com' + p, done);
}`,
		tasks: [
			netTask(1, "GET /a"),
			netTask(2, "GET /b"),
			netTask(3, "GET /c"),
			netTask(4, "GET /d"),
			netTask(5, "GET /e"),
			netTask(6, "GET /f")
		]
	},
	{
		id: "sidebyside",
		title: "Side by side",
		blurb: "4 pbkdf2 (pool) + 6 http.get (kernel) launched together — the reference 'live scheme'.",
		poolSize: 4,
		poolSizes: [2, 4],
		takeaway: "Same loop, two worlds. The 4 pool threads do blocking CPU work; meanwhile the kernel runs all 6 network ops concurrently with zero threads. Pick the pool only for CPU/file/compress work — never to 'speed up' network calls.",
		code: `// 4 pool tasks (CPU) + 6 network requests,
// launched together on ONE event loop.
for (let i = 1; i <= 4; i++)
  crypto.pbkdf2('pw', 's'+i, 1e6, 64, 'sha512', done);
for (const p of ['/a','/b','/c','/d','/e','/f'])
  https.get(host + p, done);`,
		tasks: [
			poolTask(1, "pbkdf2 #1"),
			poolTask(2, "pbkdf2 #2"),
			poolTask(3, "pbkdf2 #3"),
			poolTask(4, "pbkdf2 #4"),
			netTask(5, "GET /a"),
			netTask(6, "GET /b"),
			netTask(7, "GET /c"),
			netTask(8, "GET /d"),
			netTask(9, "GET /e"),
			netTask(10, "GET /f")
		]
	}
];
//#endregion
//#region src/components/sims/ThreadPoolSim.tsx
var POOL_COLOR = "#FF7A00";
var KERNEL_COLOR = "#6CC24A";
var PLAY_MS = 850;
var pct = (sl) => Math.max(0, Math.min(100, (sl.task.cost - sl.remaining) / sl.task.cost * 100));
function Slot({ slot, idx }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "tp-slot" + (slot ? " busy" : ""),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "tp-slot-head",
			children: ["thread ", idx + 1]
		}), slot ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
			className: "tp-slot-task",
			style: { color: POOL_COLOR },
			children: slot.task.label
		}), /* @__PURE__ */ jsx("div", {
			className: "tp-bar",
			children: /* @__PURE__ */ jsx("div", {
				className: "tp-bar-fill",
				style: {
					width: pct(slot) + "%",
					background: POOL_COLOR
				}
			})
		})] }) : /* @__PURE__ */ jsx("div", {
			className: "tp-slot-idle",
			children: "idle"
		})]
	});
}
function DoneChip({ rec, fresh }) {
	const c = rec.task.lane === "pool" ? POOL_COLOR : KERNEL_COLOR;
	return /* @__PURE__ */ jsx("span", {
		className: "tp-chip" + (fresh ? " fresh" : ""),
		style: {
			borderColor: c,
			color: c
		},
		title: `finished at tick ${rec.finish}`,
		children: rec.task.label
	});
}
function ThreadPoolSim() {
	const [sIdx, setSIdx] = useState(0);
	const scenario = SCENARIOS[sIdx];
	const sizes = scenario.poolSizes ?? [scenario.poolSize];
	const [poolSize, setPoolSize] = useState(scenario.poolSize);
	const frames = useMemo(() => simulate(scenario, poolSize), [scenario, poolSize]);
	const codeLines = useMemo(() => scenario.code.split("\n"), [scenario]);
	const [i, setI] = useState(0);
	const [playing, setPlaying] = useState(false);
	const timer = useRef(null);
	useEffect(() => {
		setI(0);
		setPlaying(false);
	}, [sIdx, poolSize]);
	useEffect(() => {
		setPoolSize(scenario.poolSize);
	}, [sIdx, scenario.poolSize]);
	useEffect(() => {
		if (!playing) return;
		timer.current = window.setInterval(() => {
			setI((prev) => {
				if (prev >= frames.length - 1) {
					setPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, PLAY_MS);
		return () => {
			if (timer.current) window.clearInterval(timer.current);
		};
	}, [playing, frames.length]);
	const f = frames[i];
	const atEnd = i >= frames.length - 1;
	const kernelInFlight = f.kernel.filter((k) => k.remaining > 0);
	const kernelDone = f.done.filter((d) => d.task.lane === "kernel").length;
	const hasKernel = scenario.tasks.some((t) => t.lane === "kernel");
	const hasPool = scenario.tasks.some((t) => t.lane === "pool");
	return /* @__PURE__ */ jsxs("div", {
		className: "tp-sim",
		"aria-label": "Thread pool vs kernel simulator",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "tp-tabs",
				role: "tablist",
				children: SCENARIOS.map((s, idx) => /* @__PURE__ */ jsx("button", {
					role: "tab",
					"aria-selected": idx === sIdx,
					className: idx === sIdx ? "on" : "",
					onClick: () => setSIdx(idx),
					children: s.title
				}, s.id))
			}),
			/* @__PURE__ */ jsx("p", {
				className: "tp-blurb",
				children: scenario.blurb
			}),
			sizes.length > 1 ? /* @__PURE__ */ jsxs("div", {
				className: "tp-poolsize",
				children: [/* @__PURE__ */ jsx("span", {
					className: "tp-ps-lbl",
					children: "UV_THREADPOOL_SIZE"
				}), sizes.map((n) => /* @__PURE__ */ jsx("button", {
					className: "tp-ps-btn" + (n === poolSize ? " on" : ""),
					onClick: () => setPoolSize(n),
					"aria-pressed": n === poolSize,
					children: n
				}, n))]
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "tp-body",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "tp-code",
					children: [/* @__PURE__ */ jsx("div", {
						className: "tp-code-head",
						children: "program.js"
					}), /* @__PURE__ */ jsx("pre", { children: /* @__PURE__ */ jsx("code", { children: codeLines.map((ln, k) => /* @__PURE__ */ jsxs("div", {
						className: "tp-cl",
						children: [/* @__PURE__ */ jsx("span", {
							className: "tp-ln",
							children: String(k + 1).padStart(2, " ")
						}), /* @__PURE__ */ jsx("span", {
							className: "tp-lt",
							children: ln === "" ? " " : ln
						})]
					}, k)) }) })]
				}), /* @__PURE__ */ jsxs("div", {
					className: "tp-stage",
					children: [
						hasPool ? /* @__PURE__ */ jsxs("div", {
							className: "tp-lane pool",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "tp-lane-head",
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "tp-dot",
											style: { background: POOL_COLOR }
										}),
										"libuv thread pool · ",
										f.poolSize,
										" slot",
										f.poolSize > 1 ? "s" : "",
										/* @__PURE__ */ jsx("span", {
											className: "tp-lane-sub",
											children: "fs · crypto · zlib · dns.lookup — blocking work"
										})
									]
								}),
								/* @__PURE__ */ jsx("div", {
									className: "tp-slots",
									style: { gridTemplateColumns: `repeat(${Math.min(f.poolSize, 6)}, 1fr)` },
									children: f.slots.map((sl, k) => /* @__PURE__ */ jsx(Slot, {
										slot: sl,
										idx: k
									}, k))
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "tp-queue-row",
									children: [/* @__PURE__ */ jsx("span", {
										className: "tp-queue-lbl",
										children: "queue"
									}), /* @__PURE__ */ jsx("span", {
										className: "tp-queue",
										children: f.queue.length ? f.queue.map((t) => /* @__PURE__ */ jsx("span", {
											className: "tp-chip waiting",
											style: {
												borderColor: POOL_COLOR,
												color: POOL_COLOR
											},
											children: t.label
										}, t.id)) : /* @__PURE__ */ jsx("span", {
											className: "tp-empty",
											children: "— empty —"
										})
									})]
								})
							]
						}) : null,
						hasKernel ? /* @__PURE__ */ jsxs("div", {
							className: "tp-lane kernel",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "tp-lane-head",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "tp-dot",
										style: { background: KERNEL_COLOR }
									}),
									"OS kernel · epoll / kqueue / IOCP",
									/* @__PURE__ */ jsxs("span", {
										className: "tp-lane-sub",
										children: [
											"sockets — non-blocking, no thread held (",
											kernelDone,
											"/",
											f.kernel.length,
											" done)"
										]
									})
								]
							}), /* @__PURE__ */ jsx("div", {
								className: "tp-kernel",
								children: kernelInFlight.length ? kernelInFlight.map((k) => /* @__PURE__ */ jsxs("div", {
									className: "tp-inflight",
									children: [/* @__PURE__ */ jsx("span", {
										style: { color: KERNEL_COLOR },
										children: k.task.label
									}), /* @__PURE__ */ jsx("div", {
										className: "tp-bar",
										children: /* @__PURE__ */ jsx("div", {
											className: "tp-bar-fill",
											style: {
												width: pct(k) + "%",
												background: KERNEL_COLOR
											}
										})
									})]
								}, k.task.id)) : /* @__PURE__ */ jsx("span", {
									className: "tp-empty",
									children: kernelDone ? "all sockets resolved" : "—"
								})
							})]
						}) : null,
						/* @__PURE__ */ jsxs("div", {
							className: "tp-doneline",
							children: [/* @__PURE__ */ jsx("div", {
								className: "tp-col-title",
								children: "completed — in finish order"
							}), /* @__PURE__ */ jsxs("div", {
								className: "tp-done",
								"aria-live": "polite",
								children: [f.done.length === 0 ? /* @__PURE__ */ jsx("span", {
									className: "tp-empty",
									children: "(nothing yet)"
								}) : null, f.done.map((rec) => /* @__PURE__ */ jsx(DoneChip, {
									rec,
									fresh: f.justFinished.includes(rec.task.id)
								}, rec.task.id))]
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "tp-caption",
				"aria-live": "polite",
				children: [/* @__PURE__ */ jsxs("span", {
					className: "tp-tick",
					children: ["t=", f.now]
				}), f.caption]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "tp-controls",
				children: [
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI(0);
						},
						disabled: i === 0 && !playing,
						children: "⤺ Reset"
					}),
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI((v) => Math.max(0, v - 1));
						},
						disabled: i === 0,
						children: "◀ Back"
					}),
					atEnd ? /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => {
							setI(0);
							setPlaying(true);
						},
						children: "↻ Replay"
					}) : /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => setPlaying((p) => !p),
						children: playing ? "⏸ Pause" : "▶ Play"
					}),
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => {
							setPlaying(false);
							setI((v) => Math.min(frames.length - 1, v + 1));
						},
						disabled: atEnd,
						children: "Step ▶"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "tp-progress",
						children: /* @__PURE__ */ jsx("div", {
							className: "tp-progress-bar",
							style: { width: `${i / (frames.length - 1) * 100}%` }
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "tp-step",
						children: [
							i + 1,
							"/",
							frames.length
						]
					})
				]
			}),
			atEnd ? /* @__PURE__ */ jsxs("div", {
				className: "tp-takeaway",
				children: [/* @__PURE__ */ jsx("span", {
					className: "tp-take-lbl",
					children: "Takeaway"
				}), scenario.takeaway]
			}) : null
		]
	});
}
//#endregion
//#region src/components/figures/EventLoopRing.tsx
var NODES = [
	{
		n: "1",
		label: "timers",
		x: 340,
		y: 60
	},
	{
		n: "2",
		label: "pending callbacks",
		x: 453,
		y: 125
	},
	{
		n: "3",
		label: "idle, prepare",
		x: 453,
		y: 255
	},
	{
		n: "4",
		label: "poll",
		x: 340,
		y: 320,
		hot: true
	},
	{
		n: "5",
		label: "check",
		x: 227,
		y: 255
	},
	{
		n: "6",
		label: "close callbacks",
		x: 227,
		y: 125
	}
];
var W = 156;
var H = 46;
/** Static, on-brand diagram of one event-loop tick (the dynamic version is the simulator). */
function EventLoopRing() {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 680 380",
		width: "100%",
		role: "img",
		"aria-label": "The six phases of the event loop arranged in a clockwise ring, with poll highlighted and microtasks draining in the center.",
		children: [
			/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("marker", {
				id: "arr",
				markerWidth: "9",
				markerHeight: "9",
				refX: "6",
				refY: "3",
				orient: "auto",
				children: /* @__PURE__ */ jsx("path", {
					d: "M0,0 L6,3 L0,6 Z",
					fill: "#3C873A"
				})
			}) }),
			/* @__PURE__ */ jsx("circle", {
				cx: "340",
				cy: "190",
				r: "120",
				fill: "none",
				stroke: "#243024",
				strokeWidth: "1.5",
				strokeDasharray: "3 7"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "340",
				cy: "190",
				r: "74",
				fill: "#0d120c",
				stroke: "#33402f",
				strokeWidth: "1"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "340",
				y: "178",
				textAnchor: "middle",
				fill: "#F4F7F4",
				fontFamily: "'Space Grotesk',sans-serif",
				fontSize: "15",
				fontWeight: "700",
				children: "EVENT LOOP"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "340",
				y: "196",
				textAnchor: "middle",
				fill: "#6CC24A",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "10",
				children: "libuv · 1 thread"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "340",
				y: "214",
				textAnchor: "middle",
				fill: "#A78BFA",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9",
				children: "↻ microtasks drain"
			}),
			NODES.map((nd) => /* @__PURE__ */ jsxs("g", { children: [
				/* @__PURE__ */ jsx("rect", {
					x: nd.x - W / 2,
					y: nd.y - H / 2,
					width: W,
					height: H,
					rx: "9",
					fill: nd.hot ? "#13260f" : "#111511",
					stroke: nd.hot ? "#6CC24A" : "#33402f",
					strokeWidth: nd.hot ? "2" : "1"
				}),
				/* @__PURE__ */ jsx("text", {
					x: nd.x - W / 2 + 14,
					y: nd.y + 1,
					fill: "#6CC24A",
					fontFamily: "'JetBrains Mono',monospace",
					fontSize: "13",
					fontWeight: "700",
					children: nd.n
				}),
				/* @__PURE__ */ jsx("text", {
					x: nd.x - W / 2 + 34,
					y: nd.y - 3,
					fill: "#F4F7F4",
					fontFamily: "'Space Grotesk',sans-serif",
					fontSize: "13.5",
					fontWeight: "600",
					children: nd.label
				}),
				nd.hot ? /* @__PURE__ */ jsx("text", {
					x: nd.x - W / 2 + 34,
					y: nd.y + 13,
					fill: "#9CB3A0",
					fontFamily: "'Inter',sans-serif",
					fontSize: "9.5",
					children: "most of your code"
				}) : null
			] }, nd.n))
		]
	});
}
//#endregion
//#region src/components/figures/AwaitTimeline.tsx
/** Static, on-brand diagram of how `await` suspends a function and resumes it
later as a microtask — "await pauses the function, not the thread". */
function AwaitTimeline() {
	const y = 150;
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 680 250",
		width: "100%",
		role: "img",
		"aria-label": "A single thread timeline: an async function runs its synchronous part, hits await and suspends, the caller and event loop keep running, then the function resumes later as a microtask.",
		children: [
			/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("marker", {
				id: "aw-arr",
				markerWidth: "9",
				markerHeight: "9",
				refX: "6",
				refY: "3",
				orient: "auto",
				children: /* @__PURE__ */ jsx("path", {
					d: "M0,0 L6,3 L0,6 Z",
					fill: "#A78BFA"
				})
			}) }),
			/* @__PURE__ */ jsx("text", {
				x: "40",
				y: "60",
				fill: "#9CB3A0",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "11",
				children: "one thread · never blocked"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "40",
				y1: y,
				x2: "640",
				y2: y,
				stroke: "#33402f",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "60",
				y: y - 16,
				width: "170",
				height: "32",
				rx: "7",
				fill: "#13260f",
				stroke: "#6CC24A",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "145",
				y: 155,
				textAnchor: "middle",
				fill: "#F4F7F4",
				fontFamily: "'Space Grotesk',sans-serif",
				fontSize: "12.5",
				fontWeight: "600",
				children: "run() — sync part"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "145",
				y: y - 26,
				textAnchor: "middle",
				fill: "#6CC24A",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9.5",
				children: "on the call stack"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "238",
				y1: y - 30,
				x2: "238",
				y2: 180,
				stroke: "#FF7A00",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: "238",
				cy: y,
				r: "5",
				fill: "#FF7A00"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "238",
				y: y - 38,
				textAnchor: "middle",
				fill: "#FF7A00",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "11",
				fontWeight: "700",
				children: "await"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "238",
				y: 196,
				textAnchor: "middle",
				fill: "#FF7A00",
				fontFamily: "'Inter',sans-serif",
				fontSize: "9.5",
				children: "suspend · return control"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "248",
				y1: y,
				x2: "446",
				y2: y,
				stroke: "#3C873A",
				strokeWidth: "1.5",
				strokeDasharray: "3 6"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "347",
				y: y - 12,
				textAnchor: "middle",
				fill: "#9CB3A0",
				fontFamily: "'Inter',sans-serif",
				fontSize: "10.5",
				children: "caller continues · other tasks run"
			}),
			/* @__PURE__ */ jsx("line", {
				x1: "454",
				y1: y - 30,
				x2: "454",
				y2: 180,
				stroke: "#A78BFA",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "454",
				y: y - 38,
				textAnchor: "middle",
				fill: "#A78BFA",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "10",
				fontWeight: "700",
				children: "microtask"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "462",
				y: y - 16,
				width: "158",
				height: "32",
				rx: "7",
				fill: "#1a1430",
				stroke: "#A78BFA",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "541",
				y: 155,
				textAnchor: "middle",
				fill: "#F4F7F4",
				fontFamily: "'Space Grotesk',sans-serif",
				fontSize: "12.5",
				fontWeight: "600",
				children: "run() resumes"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "541",
				y: y - 26,
				textAnchor: "middle",
				fill: "#A78BFA",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9.5",
				children: "the rest of the body"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M238,176 C 300,232 392,232 454,180",
				fill: "none",
				stroke: "#A78BFA",
				strokeWidth: "1.6",
				strokeDasharray: "4 4",
				markerEnd: "url(#aw-arr)"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "346",
				y: 236,
				textAnchor: "middle",
				fill: "#A78BFA",
				fontFamily: "'Inter',sans-serif",
				fontSize: "10",
				children: "the continuation is queued as a single microtask"
			})
		]
	});
}
//#endregion
//#region src/components/figures/GcHeap.tsx
/** Static, on-brand mental model of V8's generational heap: objects are born in
the young generation (two semi-spaces, collected by the fast Scavenge), and
survivors are promoted to the old generation (collected by Mark-Sweep-Compact). */
function GcHeap() {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 680 320",
		width: "100%",
		role: "img",
		"aria-label": "V8 generational heap: a young generation of two semi-spaces collected by the Scavenger, with survivors promoted to an old generation collected by Mark-Sweep-Compact.",
		children: [
			/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsx("marker", {
				id: "gc-arr",
				markerWidth: "9",
				markerHeight: "9",
				refX: "6",
				refY: "3",
				orient: "auto",
				children: /* @__PURE__ */ jsx("path", {
					d: "M0,0 L6,3 L0,6 Z",
					fill: "#38BDF8"
				})
			}), /* @__PURE__ */ jsx("marker", {
				id: "gc-flip",
				markerWidth: "8",
				markerHeight: "8",
				refX: "4",
				refY: "3",
				orient: "auto",
				children: /* @__PURE__ */ jsx("path", {
					d: "M0,0 L6,3 L0,6 Z",
					fill: "#6CC24A"
				})
			})] }),
			/* @__PURE__ */ jsx("text", {
				x: "34",
				y: "30",
				fill: "#9CB3A0",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "11",
				children: "most objects die young — so collect the nursery often and cheaply"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "34",
				y: "50",
				width: "338",
				height: "200",
				rx: "12",
				fill: "#0e160c",
				stroke: "#3C873A",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "50",
				y: "74",
				fill: "#6CC24A",
				fontFamily: "'Space Grotesk',sans-serif",
				fontSize: "13.5",
				fontWeight: "600",
				children: "young generation (nursery)"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "52",
				y: "92",
				width: "135",
				height: "96",
				rx: "9",
				fill: "#13260f",
				stroke: "#44883E",
				strokeWidth: "1.2"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "119",
				y: "110",
				textAnchor: "middle",
				fill: "#9CB3A0",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "10",
				children: "From (active)"
			}),
			[
				0,
				1,
				2
			].map((r) => [
				0,
				1,
				2
			].map((c) => /* @__PURE__ */ jsx("rect", {
				x: 64 + c * 38,
				y: 120 + r * 20,
				width: "30",
				height: "13",
				rx: "3",
				fill: r === 0 && c < 2 ? "#1d4d16" : "#20271d",
				stroke: r === 0 && c < 2 ? "#6CC24A" : "#33402f",
				strokeWidth: "1"
			}, `${r}-${c}`))),
			/* @__PURE__ */ jsx("rect", {
				x: "220",
				y: "92",
				width: "135",
				height: "96",
				rx: "9",
				fill: "#0c130a",
				stroke: "#33402f",
				strokeWidth: "1.2",
				strokeDasharray: "4 4"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "287",
				y: "110",
				textAnchor: "middle",
				fill: "#6B7B6E",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "10",
				children: "To (reserve)"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "232",
				y: "120",
				width: "30",
				height: "13",
				rx: "3",
				fill: "#1d4d16",
				stroke: "#6CC24A",
				strokeWidth: "1"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M190,150 L217,150",
				fill: "none",
				stroke: "#6CC24A",
				strokeWidth: "1.5",
				markerEnd: "url(#gc-flip)"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "203",
				y: "143",
				textAnchor: "middle",
				fill: "#6CC24A",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9",
				children: "copy"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "52",
				y: "212",
				fill: "#F4F7F4",
				fontFamily: "'Inter',sans-serif",
				fontSize: "11.5",
				fontWeight: "600",
				children: "Scavenge · minor GC"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "52",
				y: "230",
				fill: "#9CB3A0",
				fontFamily: "'Inter',sans-serif",
				fontSize: "10.5",
				children: "copies survivors → flips · fast, frequent"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M372,150 L432,150",
				fill: "none",
				stroke: "#38BDF8",
				strokeWidth: "2",
				markerEnd: "url(#gc-arr)"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "402",
				y: "138",
				textAnchor: "middle",
				fill: "#38BDF8",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9.5",
				children: "promote"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "402",
				y: "170",
				textAnchor: "middle",
				fill: "#6B7B6E",
				fontFamily: "'Inter',sans-serif",
				fontSize: "9",
				children: "survived ~2"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "446",
				y: "50",
				width: "200",
				height: "200",
				rx: "12",
				fill: "#0a1116",
				stroke: "#2a7fb8",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "462",
				y: "74",
				fill: "#38BDF8",
				fontFamily: "'Space Grotesk',sans-serif",
				fontSize: "13.5",
				fontWeight: "600",
				children: "old generation"
			}),
			[
				0,
				1,
				2,
				3
			].map((r) => [0, 1].map((c) => /* @__PURE__ */ jsx("rect", {
				x: 470 + c * 78,
				y: 92 + r * 22,
				width: "68",
				height: "15",
				rx: "3",
				fill: "#0e2433",
				stroke: "#2a5f80",
				strokeWidth: "1"
			}, `o-${r}-${c}`))),
			/* @__PURE__ */ jsx("text", {
				x: "462",
				y: "212",
				fill: "#F4F7F4",
				fontFamily: "'Inter',sans-serif",
				fontSize: "11.5",
				fontWeight: "600",
				children: "Mark-Sweep-Compact · major GC"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "462",
				y: "230",
				fill: "#9CB3A0",
				fontFamily: "'Inter',sans-serif",
				fontSize: "10.5",
				children: "concurrent · rarer · costlier"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "34",
				y: "286",
				fill: "#6B7B6E",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "10",
				children: "Scavenge cost ∝ survivors (not garbage) · major GC marks concurrently with short stop-the-world pauses"
			})
		]
	});
}
//#endregion
//#region src/components/figures/ThreadPoolKernel.tsx
/** Static, on-brand mental model of Node's two async paths: blocking work
(fs/crypto/zlib/dns.lookup) goes to the libuv thread pool (default 4);
network sockets are handled by the OS kernel with no pool thread held. */
function ThreadPoolKernel() {
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: "0 0 680 330",
		width: "100%",
		role: "img",
		"aria-label": "One event-loop thread dispatches blocking work to the 4-thread libuv pool, while network sockets are watched by the OS kernel with no pool thread held.",
		children: [
			/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsx("marker", {
				id: "tpk-o",
				markerWidth: "9",
				markerHeight: "9",
				refX: "6",
				refY: "3",
				orient: "auto",
				children: /* @__PURE__ */ jsx("path", {
					d: "M0,0 L6,3 L0,6 Z",
					fill: "#FF7A00"
				})
			}), /* @__PURE__ */ jsx("marker", {
				id: "tpk-g",
				markerWidth: "9",
				markerHeight: "9",
				refX: "6",
				refY: "3",
				orient: "auto",
				children: /* @__PURE__ */ jsx("path", {
					d: "M0,0 L6,3 L0,6 Z",
					fill: "#6CC24A"
				})
			})] }),
			/* @__PURE__ */ jsx("rect", {
				x: "250",
				y: "22",
				width: "180",
				height: "46",
				rx: "10",
				fill: "#13260f",
				stroke: "#6CC24A",
				strokeWidth: "1.6"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "340",
				y: "44",
				textAnchor: "middle",
				fill: "#F4F7F4",
				fontFamily: "'Space Grotesk',sans-serif",
				fontSize: "13",
				fontWeight: "600",
				children: "event loop"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "340",
				y: "59",
				textAnchor: "middle",
				fill: "#9CB3A0",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9.5",
				children: "one JS thread"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M300,68 C 250,100 180,104 150,128",
				fill: "none",
				stroke: "#FF7A00",
				strokeWidth: "1.8",
				markerEnd: "url(#tpk-o)"
			}),
			/* @__PURE__ */ jsx("path", {
				d: "M380,68 C 430,100 500,104 530,128",
				fill: "none",
				stroke: "#6CC24A",
				strokeWidth: "1.8",
				markerEnd: "url(#tpk-g)"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "196",
				y: "104",
				textAnchor: "middle",
				fill: "#FF7A00",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9.5",
				children: "blocking work"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "492",
				y: "104",
				textAnchor: "middle",
				fill: "#6CC24A",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9.5",
				children: "network I/O"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "28",
				y: "132",
				width: "286",
				height: "150",
				rx: "12",
				fill: "#1a1206",
				stroke: "#7a4a1c",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "44",
				y: "156",
				fill: "#FF7A00",
				fontFamily: "'Space Grotesk',sans-serif",
				fontSize: "13",
				fontWeight: "600",
				children: "libuv thread pool"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "44",
				y: "173",
				fill: "#caa37a",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9.5",
				children: "default 4 · UV_THREADPOOL_SIZE"
			}),
			[
				0,
				1,
				2,
				3
			].map((k) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
				x: 44 + k * 64,
				y: 186,
				width: "52",
				height: "30",
				rx: "6",
				fill: "#2a1c0c",
				stroke: "#b5611a",
				strokeWidth: "1.2"
			}), /* @__PURE__ */ jsxs("text", {
				x: 70 + k * 64,
				y: 205,
				textAnchor: "middle",
				fill: "#ffb478",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "10",
				children: ["T", k + 1]
			})] }, k)),
			/* @__PURE__ */ jsx("text", {
				x: "44",
				y: "240",
				fill: "#9CB3A0",
				fontFamily: "'Inter',sans-serif",
				fontSize: "10.5",
				children: "fs · crypto · zlib · dns.lookup"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "44",
				y: "258",
				fill: "#6B7B6E",
				fontFamily: "'Inter',sans-serif",
				fontSize: "10",
				children: "blocking C calls → holds a thread; extras queue"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: "366",
				y: "132",
				width: "286",
				height: "150",
				rx: "12",
				fill: "#0c160a",
				stroke: "#2a5320",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "382",
				y: "156",
				fill: "#6CC24A",
				fontFamily: "'Space Grotesk',sans-serif",
				fontSize: "13",
				fontWeight: "600",
				children: "OS kernel"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "382",
				y: "173",
				fill: "#8fae86",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "9.5",
				children: "epoll · kqueue · IOCP"
			}),
			[
				0,
				1,
				2,
				3,
				4,
				5
			].map((k) => /* @__PURE__ */ jsx("circle", {
				cx: 392 + k * 42,
				cy: 201,
				r: "9",
				fill: "#0f2b10",
				stroke: "#4ade80",
				strokeWidth: "1.2"
			}, k)),
			/* @__PURE__ */ jsx("text", {
				x: "382",
				y: "240",
				fill: "#9CB3A0",
				fontFamily: "'Inter',sans-serif",
				fontSize: "10.5",
				children: "TCP/UDP sockets · HTTP"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "382",
				y: "258",
				fill: "#6B7B6E",
				fontFamily: "'Inter',sans-serif",
				fontSize: "10",
				children: "non-blocking → no thread held; scales to thousands"
			}),
			/* @__PURE__ */ jsx("text", {
				x: "28",
				y: "308",
				fill: "#6B7B6E",
				fontFamily: "'JetBrains Mono',monospace",
				fontSize: "10",
				children: "Rule: the pool is for CPU/file/compress work — never use it to \"speed up\" network calls (the kernel already does)."
			})
		]
	});
}
//#endregion
//#region src/components/study/PredictOutputQuiz.tsx
function Order({ lines, tone }) {
	return /* @__PURE__ */ jsx("span", {
		className: "pq-order",
		children: lines.map((l, i) => /* @__PURE__ */ jsxs(React.Fragment, { children: [i > 0 ? /* @__PURE__ */ jsx("span", {
			className: "pq-arrow",
			children: "›"
		}) : null, /* @__PURE__ */ jsx("span", {
			className: "pq-tok" + (tone ? " " + tone : ""),
			children: l
		})] }, i))
	});
}
function PredictOutputQuiz({ questions, title, intro }) {
	const [idx, setIdx] = useState(0);
	const [picked, setPicked] = useState(null);
	const [scored, setScored] = useState({});
	const q = questions[idx];
	const answered = picked !== null;
	const correct = answered && picked === q.correct;
	const total = questions.length;
	const done = Object.keys(scored).length;
	const right = useMemo(() => Object.values(scored).filter(Boolean).length, [scored]);
	const choose = (i) => {
		if (answered) return;
		setPicked(i);
		setScored((s) => q.id in s ? s : {
			...s,
			[q.id]: i === q.correct
		});
	};
	const go = (next) => {
		setIdx(next);
		setPicked(null);
	};
	const reset = () => {
		setIdx(0);
		setPicked(null);
		setScored({});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "pq",
		"aria-label": "Predict the output quiz",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "pq-head",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "pq-titles",
					children: [/* @__PURE__ */ jsx("span", {
						className: "pq-kicker",
						children: title ?? "Predict the output"
					}), intro ? /* @__PURE__ */ jsx("span", {
						className: "pq-intro",
						children: intro
					}) : null]
				}), /* @__PURE__ */ jsxs("div", {
					className: "pq-meta",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "pq-count",
						children: [
							idx + 1,
							"/",
							total
						]
					}), /* @__PURE__ */ jsxs("span", {
						className: "pq-score",
						title: "Correct so far",
						children: [
							"score ",
							right,
							"/",
							done
						]
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "pq-card",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "pq-qrow",
						children: [
							/* @__PURE__ */ jsxs("span", {
								className: "pq-q",
								children: ["Q", idx + 1]
							}),
							q.level ? /* @__PURE__ */ jsx("span", {
								className: "pq-lvl",
								children: q.level
							}) : null,
							/* @__PURE__ */ jsx("span", {
								className: "pq-ask",
								children: "What does this print?"
							})
						]
					}),
					q.prompt ? /* @__PURE__ */ jsx("p", {
						className: "pq-prompt",
						children: q.prompt
					}) : null,
					/* @__PURE__ */ jsx("pre", {
						className: "pq-code",
						children: /* @__PURE__ */ jsx("code", { children: q.code })
					}),
					/* @__PURE__ */ jsx("div", {
						className: "pq-choices",
						role: "listbox",
						"aria-label": "Answer choices",
						children: q.choices.map((choice, i) => {
							const isPicked = picked === i;
							const isAnswer = i === q.correct;
							const tone = !answered ? null : isAnswer ? "ok" : isPicked ? "no" : null;
							return /* @__PURE__ */ jsxs("button", {
								role: "option",
								"aria-selected": isPicked,
								className: "pq-choice" + (answered && isAnswer ? " ok" : "") + (answered && isPicked && !isAnswer ? " no" : "") + (answered ? " locked" : ""),
								onClick: () => choose(i),
								disabled: answered,
								children: [/* @__PURE__ */ jsx("span", {
									className: "pq-mark",
									"aria-hidden": "true",
									children: answered && isAnswer ? "✓" : answered && isPicked ? "✕" : String.fromCharCode(65 + i)
								}), /* @__PURE__ */ jsx(Order, {
									lines: choice,
									tone
								})]
							}, i);
						})
					}),
					answered ? /* @__PURE__ */ jsxs("div", {
						className: "pq-explain " + (correct ? "ok" : "no"),
						children: [/* @__PURE__ */ jsx("div", {
							className: "pq-verdict",
							children: correct ? "✓ Correct" : "✕ Not quite"
						}), /* @__PURE__ */ jsx("p", { children: q.explain })]
					}) : /* @__PURE__ */ jsx("p", {
						className: "pq-hint",
						children: "Pick the exact console output order. The answer reveals on click."
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "pq-controls",
				children: [
					/* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: () => go(Math.max(0, idx - 1)),
						disabled: idx === 0,
						children: "◀ Prev"
					}),
					idx < total - 1 ? /* @__PURE__ */ jsx("button", {
						className: "btn primary",
						onClick: () => go(idx + 1),
						children: "Next ▶"
					}) : /* @__PURE__ */ jsx("button", {
						className: "btn",
						onClick: reset,
						children: "⤺ Restart"
					}),
					done === total ? /* @__PURE__ */ jsxs("span", {
						className: "pq-final",
						children: [
							"Final: ",
							right,
							"/",
							total,
							" ",
							right === total ? "— flawless. You can read the queue." : ""
						]
					}) : null
				]
			})
		]
	});
}
//#endregion
//#region src/data/quizzes.ts
var asyncOrderingQuiz = [
	{
		id: "aq-1",
		level: "senior",
		code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
		choices: [
			[
				"A",
				"D",
				"C",
				"B"
			],
			[
				"A",
				"B",
				"C",
				"D"
			],
			[
				"A",
				"D",
				"B",
				"C"
			],
			[
				"A",
				"C",
				"D",
				"B"
			]
		],
		correct: 0,
		explain: "Synchronous first: A, D. Then microtasks before any macrotask: the Promise callback C. Then the timers-phase macrotask: B. A setTimeout(0) is never as soon as it looks — a microtask always jumps ahead of it."
	},
	{
		id: "aq-2",
		level: "senior",
		code: `async function f() {
  console.log('2');
  await null;
  console.log('4');
}
console.log('1');
f();
console.log('3');`,
		choices: [
			[
				"1",
				"2",
				"3",
				"4"
			],
			[
				"1",
				"2",
				"4",
				"3"
			],
			[
				"1",
				"3",
				"2",
				"4"
			],
			[
				"2",
				"1",
				"3",
				"4"
			]
		],
		correct: 0,
		explain: "Calling f() runs its body synchronously up to await: that prints 2. await suspends f() — '4' becomes a microtask — and control returns, so '3' prints. The stack empties, then the microtask resumes: 4. await pauses the function, not the thread."
	},
	{
		id: "aq-3",
		level: "staff",
		prompt: "Assume a CommonJS module (a plain .js file or node -e).",
		code: `Promise.resolve().then(() => console.log('P'));
process.nextTick(() => console.log('N'));
console.log('S');`,
		choices: [
			[
				"S",
				"N",
				"P"
			],
			[
				"S",
				"P",
				"N"
			],
			[
				"N",
				"P",
				"S"
			],
			[
				"P",
				"N",
				"S"
			]
		],
		correct: 0,
		explain: "S is synchronous. Then microtasks drain — and process.nextTick has its own queue that empties BEFORE the Promise queue, so N then P. (Gotcha: in an ES module the top level is already inside a microtask drain, so the order flips to P then N.)"
	},
	{
		id: "aq-4",
		level: "staff",
		code: `async function g(x) {
  console.log(x);
  await null;
  console.log(x + x);
}
console.log('start');
g('a');
g('b');
console.log('end');`,
		choices: [
			[
				"start",
				"a",
				"b",
				"end",
				"aa",
				"bb"
			],
			[
				"start",
				"a",
				"aa",
				"b",
				"bb",
				"end"
			],
			[
				"start",
				"a",
				"b",
				"end",
				"bb",
				"aa"
			],
			[
				"start",
				"end",
				"a",
				"b",
				"aa",
				"bb"
			]
		],
		correct: 0,
		explain: "Sync parts run first in call order: start, a, b, end. Each g() suspended at await, queuing its continuation. The microtask queue is FIFO, so g('a') resumes before g('b'): aa, bb. Two async functions interleave — concurrency, not parallelism."
	},
	{
		id: "aq-5",
		level: "staff",
		code: `async function one() { console.log('1'); await Promise.resolve(); console.log('2'); }
async function two() { console.log('3'); await Promise.resolve(); console.log('4'); }
(async () => { await Promise.all([one(), two()]); console.log('done'); })();
console.log('sync');`,
		choices: [
			[
				"1",
				"3",
				"sync",
				"2",
				"4",
				"done"
			],
			[
				"1",
				"2",
				"3",
				"4",
				"sync",
				"done"
			],
			[
				"1",
				"3",
				"sync",
				"2",
				"4",
				"done",
				"done"
			],
			[
				"sync",
				"1",
				"3",
				"2",
				"4",
				"done"
			]
		],
		correct: 0,
		explain: "one() and two() are invoked first (to build the array), printing 1 and 3 synchronously, then both suspend. 'sync' prints last in the synchronous pass. Microtasks resume in order: 2, 4. Only once both resolve does Promise.all settle, so 'done' prints after. Promise.all runs them concurrently, then joins."
	}
];
var concurrencyQuiz = [
	{
		id: "cq-1",
		level: "senior",
		prompt: "Started with UV_THREADPOOL_SIZE=1 (a one-thread pool).",
		code: `const crypto = require('node:crypto');
crypto.pbkdf2('p', 'a', 1, 16, 'sha512', () => console.log('A done'));
crypto.pbkdf2('p', 'b', 1, 16, 'sha512', () => console.log('B done'));
console.log('submitted');`,
		choices: [
			[
				"submitted",
				"A done",
				"B done"
			],
			[
				"A done",
				"B done",
				"submitted"
			],
			[
				"submitted",
				"B done",
				"A done"
			],
			[
				"A done",
				"submitted",
				"B done"
			]
		],
		correct: 0,
		explain: "Synchronous code first: 'submitted'. Both pbkdf2 calls are queued to the libuv pool, but with a single thread they run one at a time in submission order (FIFO) — A then B. With the default 4 threads they'd run concurrently and could finish in either order: pool size turns a non-deterministic race into a deterministic queue."
	},
	{
		id: "cq-2",
		level: "senior",
		code: `const fs = require('node:fs');
console.log('start');                       // sync
fs.readFile(__filename, () => {             // poll phase
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});`,
		choices: [
			[
				"start",
				"immediate",
				"timeout"
			],
			[
				"start",
				"timeout",
				"immediate"
			],
			[
				"immediate",
				"timeout",
				"start"
			],
			["start", "timeout"]
		],
		correct: 0,
		explain: "'start' is synchronous. The readFile callback runs in the poll phase; the very next phase in the same tick is check (setImmediate), so 'immediate' fires before the timer — which must wait for the next tick's timers phase. Inside an I/O callback this order is GUARANTEED (unlike the main module, where setTimeout(0)-vs-setImmediate is a race)."
	},
	{
		id: "cq-3",
		level: "staff",
		code: `const fs = require('node:fs');
fs.readFile(__filename, () => {
  setImmediate(() => console.log('immediate'));
  Promise.resolve().then(() => console.log('promise'));
  process.nextTick(() => console.log('nextTick'));
  console.log('read cb');
});`,
		choices: [
			[
				"read cb",
				"nextTick",
				"promise",
				"immediate"
			],
			[
				"read cb",
				"immediate",
				"nextTick",
				"promise"
			],
			[
				"nextTick",
				"promise",
				"read cb",
				"immediate"
			],
			[
				"read cb",
				"promise",
				"nextTick",
				"immediate"
			]
		],
		correct: 0,
		explain: "The callback's synchronous body logs 'read cb' first. After the callback returns, microtasks drain before the loop advances — nextTick before the Promise queue — so 'nextTick' then 'promise'. Only then does the loop reach the check phase: 'immediate'. The microtask-before-macrotask rule applies after every callback, including those on the pool's I/O path."
	}
];
//#endregion
//#region src/lib/registry.tsx
/** A concrete quiz instance, registered as a sim so chapters embed it declaratively. */
var AsyncOrderingQuiz = () => /* @__PURE__ */ jsx(PredictOutputQuiz, {
	questions: asyncOrderingQuiz,
	title: "Predict the output",
	intro: "Five snippets. Read the queues, call the order — then check yourself."
});
var ConcurrencyQuiz = () => /* @__PURE__ */ jsx(PredictOutputQuiz, {
	questions: concurrencyQuiz,
	title: "Predict the output",
	intro: "The thread pool and the kernel make some orders guaranteed and others not. Call each one."
});
/** Interactive widgets, referenced by key from concepts.ts sections (kind: 'sim'). */
var SIMS = {
	"event-loop": EventLoopSim,
	"async-order": AsyncOrderSim,
	"async-quiz": AsyncOrderingQuiz,
	gc: GcSim,
	"thread-pool": ThreadPoolSim,
	"concurrency-quiz": ConcurrencyQuiz
};
/** Static diagrams, referenced by key from concepts.ts sections (kind: 'figure'). */
var FIGURES = {
	"event-loop-ring": EventLoopRing,
	"await-timeline": AwaitTimeline,
	"gc-heap": GcHeap,
	"thread-pool-kernel": ThreadPoolKernel
};
//#endregion
//#region src/components/chapter/Section.tsx
var CALLOUT_ICON = {
	tip: "✓",
	warn: "▲",
	senior: "★"
};
var CALLOUT_WORD = {
	tip: "Tip",
	warn: "Watch out",
	senior: "Senior note"
};
function SectionView({ section }) {
	switch (section.kind) {
		case "prose": return /* @__PURE__ */ jsx("div", {
			className: "prose section",
			children: /* @__PURE__ */ jsx(Md, { md: section.md })
		});
		case "callout": return /* @__PURE__ */ jsxs("div", {
			className: `callout ${section.tone}`,
			children: [/* @__PURE__ */ jsxs("div", {
				className: "ttl",
				children: [/* @__PURE__ */ jsx("span", {
					className: "ico",
					"aria-hidden": "true",
					children: CALLOUT_ICON[section.tone]
				}), section.title || CALLOUT_WORD[section.tone]]
			}), /* @__PURE__ */ jsx("div", {
				className: "prose",
				children: /* @__PURE__ */ jsx(Md, { md: section.md })
			})]
		});
		case "code": return /* @__PURE__ */ jsxs("div", {
			className: "code",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "code-head",
					children: [/* @__PURE__ */ jsx("span", {
						className: "dot",
						"aria-hidden": "true"
					}), section.lang]
				}),
				/* @__PURE__ */ jsx("pre", { children: /* @__PURE__ */ jsx("code", { children: section.code }) }),
				section.note ? /* @__PURE__ */ jsx("div", {
					className: "note",
					children: section.note
				}) : null
			]
		});
		case "table": return /* @__PURE__ */ jsxs("figure", {
			className: "section",
			style: { margin: "18px 0" },
			children: [/* @__PURE__ */ jsx("div", {
				className: "tbl-wrap",
				children: /* @__PURE__ */ jsxs("table", {
					className: "data",
					children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: section.head.map((h, i) => /* @__PURE__ */ jsx("th", { children: h }, i)) }) }), /* @__PURE__ */ jsx("tbody", { children: section.rows.map((row, i) => /* @__PURE__ */ jsx("tr", { children: row.map((cell, j) => /* @__PURE__ */ jsx("td", { children: cell }, j)) }, i)) })]
				})
			}), section.caption ? /* @__PURE__ */ jsx("figcaption", {
				className: "tbl-cap",
				children: section.caption
			}) : null]
		});
		case "compare": return /* @__PURE__ */ jsxs("div", {
			className: "compare section",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "head",
					children: section.a
				}),
				/* @__PURE__ */ jsx("div", {
					className: "head b",
					children: section.b
				}),
				section.rows.map((r, i) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
					/* @__PURE__ */ jsx("div", {
						className: "cell",
						style: {
							gridColumn: "1 / -1",
							color: "var(--tx3)",
							fontSize: 11,
							paddingBottom: 2
						},
						children: r[0]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "cell",
						children: r[1]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "cell b",
						children: r[2]
					})
				] }, i))
			]
		});
		case "figure": {
			const Fig = FIGURES[section.fig];
			return /* @__PURE__ */ jsxs("figure", {
				className: "section",
				style: { margin: "20px 0" },
				children: [/* @__PURE__ */ jsx("div", {
					className: "figure",
					children: Fig ? /* @__PURE__ */ jsx(Fig, {}) : /* @__PURE__ */ jsxs("em", { children: ["figure: ", section.fig] })
				}), section.caption ? /* @__PURE__ */ jsx("figcaption", {
					className: "fig-cap",
					children: section.caption
				}) : null]
			});
		}
		case "sim": {
			const Sim = SIMS[section.sim];
			return /* @__PURE__ */ jsx("div", {
				className: "section",
				children: Sim ? /* @__PURE__ */ jsx(Sim, {}) : /* @__PURE__ */ jsxs("em", { children: ["simulator: ", section.sim] })
			});
		}
	}
}
//#endregion
//#region src/components/chapter/ChapterPage.tsx
var ORDERED = [...CHAPTERS].sort((a, b) => a.order - b.order);
function hrefFor(id) {
	const c = CHAPTER_BY_ID[id];
	if (!c) return "#/map";
	return c.link ? "#" + c.link : "#/chapter/" + c.id;
}
function jump(id) {
	document.getElementById(id)?.scrollIntoView({
		behavior: "smooth",
		block: "start"
	});
}
function ChapterPage({ id }) {
	const ch = CHAPTER_BY_ID[id];
	if (!ch) return /* @__PURE__ */ jsxs("div", {
		className: "chapter",
		children: [/* @__PURE__ */ jsx("p", {
			className: "prose",
			children: "Chapter not found."
		}), /* @__PURE__ */ jsx("button", {
			className: "btn",
			onClick: () => go("/map"),
			children: "← Back to the map"
		})]
	});
	const group = GROUPS.find((g) => g.id === ch.group);
	const idx = ORDERED.findIndex((c) => c.id === ch.id);
	const prev = idx > 0 ? ORDERED[idx - 1] : null;
	const next = idx < ORDERED.length - 1 ? ORDERED[idx + 1] : null;
	const firstSimIdx = ch.sections.findIndex((s) => s.kind === "sim");
	const hasSim = firstSimIdx !== -1;
	return /* @__PURE__ */ jsxs("article", {
		className: "chapter",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "ch-head",
				children: [
					/* @__PURE__ */ jsxs("span", {
						className: "chip",
						children: [/* @__PURE__ */ jsx("span", {
							className: "sb-dot",
							style: { background: group?.accent },
							"aria-hidden": "true"
						}), group?.name]
					}),
					/* @__PURE__ */ jsx("h1", {
						className: "ch-title",
						children: ch.full ?? ch.title
					}),
					/* @__PURE__ */ jsx("p", {
						className: "ch-tagline",
						children: ch.tagline
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "ch-meta",
						children: [
							/* @__PURE__ */ jsxs("span", { children: ["Chapter ", ch.order] }),
							/* @__PURE__ */ jsx("span", { children: "·" }),
							/* @__PURE__ */ jsxs("span", { children: [ch.readMins, " min read"] }),
							ch.stub ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", { children: "·" }), /* @__PURE__ */ jsx("span", {
								style: { color: "var(--accent)" },
								children: "seeded — full deep-dive coming soon"
							})] }) : null
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mental",
						children: [/* @__PURE__ */ jsx("div", {
							className: "lbl",
							children: "Mental model"
						}), /* @__PURE__ */ jsx("p", { children: ch.mentalModel })]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "seealso",
						style: { marginTop: 14 },
						children: [
							hasSim ? /* @__PURE__ */ jsx("a", {
								href: "#simulator",
								onClick: (e) => {
									e.preventDefault();
									jump("simulator");
								},
								children: "▶ Simulator"
							}) : null,
							ch.keyPoints.length ? /* @__PURE__ */ jsx("a", {
								href: "#keypoints",
								onClick: (e) => {
									e.preventDefault();
									jump("keypoints");
								},
								children: "◆ Key points"
							}) : null,
							ch.interview.length ? /* @__PURE__ */ jsx("a", {
								href: "#interview",
								onClick: (e) => {
									e.preventDefault();
									jump("interview");
								},
								children: "? Interview"
							}) : null
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "ch-sections",
				children: ch.sections.map((s, i) => /* @__PURE__ */ jsx("div", {
					id: i === firstSimIdx ? "simulator" : void 0,
					children: /* @__PURE__ */ jsx(SectionView, { section: s })
				}, i))
			}),
			ch.keyPoints.length ? /* @__PURE__ */ jsxs("section", {
				className: "block",
				id: "keypoints",
				children: [/* @__PURE__ */ jsx("h2", { children: "◆ Key points — draw these from memory" }), /* @__PURE__ */ jsx("div", {
					className: "keypoints",
					children: ch.keyPoints.map((k, i) => /* @__PURE__ */ jsxs("div", {
						className: "kp",
						children: [/* @__PURE__ */ jsx("span", {
							className: "n",
							children: String(i + 1).padStart(2, "0")
						}), /* @__PURE__ */ jsx("span", { children: k })]
					}, i))
				})]
			}) : null,
			ch.pitfalls.length ? /* @__PURE__ */ jsxs("section", {
				className: "block",
				id: "pitfalls",
				children: [/* @__PURE__ */ jsx("h2", { children: "▲ Senior pitfalls" }), ch.pitfalls.map((p, i) => /* @__PURE__ */ jsxs("div", {
					className: "pitfall",
					children: [/* @__PURE__ */ jsx("div", {
						className: "pt",
						children: p.title
					}), /* @__PURE__ */ jsx("p", { children: p.body })]
				}, i))]
			}) : null,
			ch.interview.length ? /* @__PURE__ */ jsxs("section", {
				className: "block",
				id: "interview",
				children: [/* @__PURE__ */ jsx("h2", { children: "? Interview questions" }), ch.interview.map((qa, i) => /* @__PURE__ */ jsxs("details", {
					className: "qa",
					children: [/* @__PURE__ */ jsxs("summary", { children: [
						/* @__PURE__ */ jsx("span", {
							className: "qmark",
							children: "Q"
						}),
						/* @__PURE__ */ jsx("span", { children: qa.q }),
						qa.level ? /* @__PURE__ */ jsx("span", {
							className: "lvl",
							children: qa.level
						}) : null
					] }), /* @__PURE__ */ jsx("div", {
						className: "ans",
						children: qa.a
					})]
				}, i))]
			}) : null,
			ch.seeAlso.length ? /* @__PURE__ */ jsxs("section", {
				className: "block",
				children: [/* @__PURE__ */ jsx("h2", { children: "↔ See also" }), /* @__PURE__ */ jsx("div", {
					className: "seealso",
					children: ch.seeAlso.map((sid) => {
						const t = CHAPTER_BY_ID[sid];
						return /* @__PURE__ */ jsx("a", {
							href: hrefFor(sid),
							children: t ? t.title : sid
						}, sid);
					})
				})]
			}) : null,
			ch.sources.length ? /* @__PURE__ */ jsxs("section", {
				className: "block",
				children: [/* @__PURE__ */ jsx("h2", { children: "Sources" }), /* @__PURE__ */ jsx("ul", {
					className: "sources",
					children: ch.sources.map((s, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
						href: s.url,
						target: "_blank",
						rel: "noreferrer",
						children: s.title
					}) }, i))
				})]
			}) : null,
			/* @__PURE__ */ jsxs("nav", {
				className: "prevnext",
				children: [prev ? /* @__PURE__ */ jsxs("button", {
					className: "pn",
					onClick: () => go(prev.link ?? "/chapter/" + prev.id),
					children: [/* @__PURE__ */ jsx("div", {
						className: "dir",
						children: "← Previous"
					}), /* @__PURE__ */ jsx("div", {
						className: "t",
						children: prev.title
					})]
				}) : /* @__PURE__ */ jsx("span", {}), next ? /* @__PURE__ */ jsxs("button", {
					className: "pn next",
					onClick: () => go(next.link ?? "/chapter/" + next.id),
					children: [/* @__PURE__ */ jsx("div", {
						className: "dir",
						children: "Next →"
					}), /* @__PURE__ */ jsx("div", {
						className: "t",
						children: next.title
					})]
				}) : /* @__PURE__ */ jsx("span", {})]
			})
		]
	});
}
//#endregion
//#region src/data/interview.ts
var INTERVIEW = [
	{
		id: "el-phases",
		chapter: "event-loop",
		topic: "Event Loop",
		level: "senior",
		q: "Walk me through the phases of the event loop.",
		a: "Six phases per tick in fixed order: timers → pending callbacks → idle/prepare (internal) → poll → check → close. After every callback and between phases, microtasks drain: the nextTick queue first, then the Promise queue."
	},
	{
		id: "el-order",
		chapter: "event-loop",
		topic: "Event Loop",
		level: "senior",
		q: "nextTick vs Promise.then vs setImmediate vs setTimeout(0) — what order?",
		a: "Synchronous code first. Then microtasks: all nextTick, then all promises. Then macrotasks by phase: setTimeout(0) in timers, setImmediate in check. In the main module timeout-vs-immediate is non-deterministic; inside an I/O callback setImmediate runs first."
	},
	{
		id: "el-starve",
		chapter: "event-loop",
		topic: "Event Loop",
		level: "staff",
		q: "How can you starve the event loop?",
		a: "Recursively scheduling process.nextTick (or promises) keeps a microtask queue non-empty, so the loop never advances — timers and I/O never run. Long synchronous CPU work also blocks the single thread."
	},
	{
		id: "el-v8",
		chapter: "event-loop",
		topic: "Event Loop",
		level: "senior",
		q: "Is the event loop part of V8?",
		a: "No. V8 executes JavaScript and manages its heap. The event loop, timers, the thread pool and OS I/O notifications are all libuv. Node wires them together."
	},
	{
		id: "async-await-parallel",
		chapter: "async-model",
		topic: "Async model",
		level: "senior",
		q: "Does async/await make code run in parallel?",
		a: "No. await pauses the async function until a promise settles; it sequences awaited work. For concurrency, start the promises first and await them together (Promise.all)."
	},
	{
		id: "async-microtask",
		chapter: "async-model",
		topic: "Async model",
		level: "staff",
		q: "Where do awaited continuations run relative to timers?",
		a: "A resolved await continuation is a microtask, so it runs before any timer/macrotask — at the next microtask checkpoint, after the current synchronous run."
	},
	{
		id: "gc-generations",
		chapter: "v8-gc",
		topic: "V8 & GC",
		level: "senior",
		q: "Explain V8's generational garbage collection.",
		a: "Objects are allocated in young space and collected by a fast scavenger (Scavenge); survivors are promoted to old space, collected by mark-sweep-compact. The generational hypothesis: most objects die young."
	},
	{
		id: "gc-shapes",
		chapter: "v8-gc",
		topic: "V8 & GC",
		level: "staff",
		q: "Why keep object shapes stable for performance?",
		a: "V8 uses hidden classes and inline caches keyed on an object's shape. Adding/removing properties in varying order creates new hidden classes, deopting inline caches and slowing property access."
	},
	{
		id: "conc-threads-vs-proc",
		chapter: "concurrency",
		topic: "Concurrency",
		level: "senior",
		q: "worker_threads vs cluster vs child_process — when each?",
		a: "worker_threads for CPU-bound work sharing memory in-process; cluster to fork processes sharing a server port across cores; child_process to run separate programs and talk over IPC/streams."
	},
	{
		id: "conc-pool",
		chapter: "concurrency",
		topic: "Concurrency",
		level: "staff",
		q: "What uses the libuv thread pool, and how big is it?",
		a: "fs operations, dns.lookup, crypto and zlib use the pool (default 4 threads, configurable via UV_THREADPOOL_SIZE). Most network I/O does NOT — the kernel handles it asynchronously without pool threads."
	},
	{
		id: "streams-backpressure",
		chapter: "streams",
		topic: "Streams",
		level: "senior",
		q: "What is backpressure and how do you respect it?",
		a: "When a writable's buffer passes highWaterMark, write() returns false; you should stop writing and wait for the 'drain' event. pipeline()/pipe() handle this for you and (pipeline) also clean up on error."
	},
	{
		id: "modules-cjs-esm",
		chapter: "modules",
		topic: "Modules",
		level: "senior",
		q: "Key differences between CommonJS and ESM?",
		a: "CJS require() is synchronous, cached, returns a value copy of module.exports, and has __dirname. ESM import is asynchronous, statically analyzable, exposes live read-only bindings, and uses import.meta.url; top-level await is ESM-only."
	},
	{
		id: "errors-types",
		chapter: "errors",
		topic: "Errors",
		level: "staff",
		q: "How do you decide whether to crash on an error?",
		a: "Classify it: operational errors (bad input, network failures) are expected — handle and continue. Programmer errors (bugs, invariant violations) should fail fast: log and let the process crash so a supervisor restarts a clean state."
	},
	{
		id: "http-timeouts",
		chapter: "http",
		topic: "HTTP",
		level: "staff",
		q: "Why might a healthy Node service return sporadic 502s behind a proxy?",
		a: "Often a timeout mismatch: the upstream proxy keep-alive outlives Node's keepAliveTimeout/headersTimeout, so Node closes a socket the proxy reuses. Align the timeout triad (keepAliveTimeout ≥ proxy idle, headersTimeout > keepAliveTimeout)."
	},
	{
		id: "gc-tiers-deopt",
		chapter: "v8-gc",
		topic: "V8 & GC",
		level: "staff",
		q: "Name V8's compilation tiers and explain deoptimization.",
		a: "Ignition (bytecode interpreter) → Sparkplug (baseline JIT) → Maglev (mid-tier optimizing JIT, default in Node 22) → TurboFan (peak optimizer). Optimizing tiers speculate on observed types/shapes; when a runtime value breaks an assumption, V8 deoptimizes — discards the optimized code and falls back to a lower tier. Repeated deopt churn is slower than never optimizing, so keep types and object shapes stable."
	},
	{
		id: "gc-leak-hunt",
		chapter: "v8-gc",
		topic: "V8 & GC",
		level: "senior",
		q: "Memory climbs until the process OOMs — how do you find the leak?",
		a: "Confirm it's a leak (rising retained floor across heap snapshots, not just sawtoothing heap-used), then diff snapshots over time and sort by retained size to find the retainer — usually a module-level cache/Map that only grows, per-request listeners never removed, or closures held by timers. Fix the retainer; raising --max-old-space-size only delays the crash and lengthens major-GC pauses."
	},
	{
		id: "conc-dns-pool",
		chapter: "concurrency",
		topic: "Concurrency",
		level: "staff",
		q: "How can DNS stall a busy HTTP client, and how do you fix it?",
		a: "http/net resolve hostnames via dns.lookup, which wraps the blocking getaddrinfo and runs on the 4-thread libuv pool. Many lookups to new hosts can exhaust the pool and block unrelated fs/crypto work. Use dns.resolve*() (c-ares, network-based, no pool thread) or a caching resolver, cache results, and raise UV_THREADPOOL_SIZE."
	},
	{
		id: "conc-worker-comm",
		chapter: "concurrency",
		topic: "Concurrency",
		level: "staff",
		q: "How do worker_threads share data, and what does it cost?",
		a: "By default postMessage makes a structured-clone copy, so large payloads cost serialization and memory. You can transfer an ArrayBuffer (zero-copy, ownership moves) or use a SharedArrayBuffer with Atomics for true shared memory and lock-free coordination. Workers never share ordinary variables — design around copies or shared buffers."
	}
];
var INTERVIEW_TOPICS = Array.from(new Set(INTERVIEW.map((i) => i.topic)));
//#endregion
//#region src/components/pages/InterviewPage.tsx
function InterviewPage() {
	const [topic, setTopic] = useState(null);
	const [level, setLevel] = useState("all");
	const items = useMemo(() => INTERVIEW.filter((i) => (!topic || i.topic === topic) && (level === "all" || i.level === level)), [topic, level]);
	return /* @__PURE__ */ jsxs("div", {
		className: "page",
		children: [
			/* @__PURE__ */ jsx("h1", { children: "Senior / Staff interview bank" }),
			/* @__PURE__ */ jsxs("p", {
				className: "lead",
				children: [INTERVIEW.length, " questions today (growing to 40 in a later session). Filter by topic and level; expand to reveal the answer, or jump to the chapter."]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "filters",
				children: [
					/* @__PURE__ */ jsx("button", {
						className: cx("fbtn", !topic && "on"),
						onClick: () => setTopic(null),
						children: "All topics"
					}),
					INTERVIEW_TOPICS.map((t) => /* @__PURE__ */ jsx("button", {
						className: cx("fbtn", topic === t && "on"),
						onClick: () => setTopic(t),
						children: t
					}, t)),
					/* @__PURE__ */ jsx("span", { className: "filters-sep" }),
					[
						"all",
						"senior",
						"staff"
					].map((l) => /* @__PURE__ */ jsx("button", {
						className: cx("fbtn", level === l && "on"),
						onClick: () => setLevel(l),
						children: l
					}, l))
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: { marginTop: 18 },
				children: [items.map((qa) => /* @__PURE__ */ jsxs("details", {
					className: "qa",
					children: [/* @__PURE__ */ jsxs("summary", { children: [
						/* @__PURE__ */ jsx("span", {
							className: "qmark",
							children: "Q"
						}),
						/* @__PURE__ */ jsx("span", { children: qa.q }),
						/* @__PURE__ */ jsx("span", {
							className: "lvl",
							children: qa.level
						})
					] }), /* @__PURE__ */ jsxs("div", {
						className: "ans",
						children: [/* @__PURE__ */ jsx("p", {
							style: { margin: "0 0 10px" },
							children: qa.a
						}), /* @__PURE__ */ jsxs("button", {
							className: "btn",
							onClick: () => go("/chapter/" + qa.chapter),
							style: {
								fontSize: 12,
								padding: "5px 11px"
							},
							children: [CHAPTER_BY_ID[qa.chapter]?.title ?? "Open", " →"]
						})]
					})]
				}, qa.id)), items.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "lead",
					children: "No questions match that filter."
				}) : null]
			})
		]
	});
}
//#endregion
//#region src/components/pages/MentalModelsPage.tsx
function Card({ m }) {
	const [show, setShow] = useState(false);
	return /* @__PURE__ */ jsxs("div", {
		className: "mm-card",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "mm-head",
				children: m.title
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mm-q",
				children: m.prompt
			}),
			show ? /* @__PURE__ */ jsx("div", {
				className: "mm-a",
				children: m.answer
			}) : /* @__PURE__ */ jsx("div", {
				className: "mm-hidden",
				children: "Answer hidden — draw it first."
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mm-actions",
				children: [/* @__PURE__ */ jsx("button", {
					className: "btn primary",
					onClick: () => setShow((s) => !s),
					style: { fontSize: 12 },
					children: show ? "Hide" : "Reveal"
				}), /* @__PURE__ */ jsxs("button", {
					className: "btn",
					onClick: () => go("/chapter/" + m.chapter),
					style: { fontSize: 12 },
					children: [CHAPTER_BY_ID[m.chapter]?.title ?? "Open", " →"]
				})]
			})
		]
	});
}
function MentalModelsPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "page",
		children: [
			/* @__PURE__ */ jsx("h1", { children: "Mental models" }),
			/* @__PURE__ */ jsx("p", {
				className: "lead",
				children: "The pictures you must be able to draw from memory. Read the prompt, sketch the answer, then reveal to check. Repeat until it's automatic."
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mm-grid",
				children: MODELS.map((m) => /* @__PURE__ */ jsx(Card, { m }, m.id))
			})
		]
	});
}
//#endregion
//#region src/App.tsx
function App() {
	const route = useRoute();
	const activeId = route.name === "chapter" ? route.id : route.name === "interview" ? "interview" : route.name === "mental-models" ? "mental-models" : null;
	return /* @__PURE__ */ jsxs("div", {
		className: "app",
		children: [
			/* @__PURE__ */ jsx("a", {
				className: "skip-link",
				href: "#main",
				children: "Skip to content"
			}),
			/* @__PURE__ */ jsx(TopBar, { route }),
			route.name === "map" ? /* @__PURE__ */ jsx("main", {
				id: "main",
				style: { flex: 1 },
				children: /* @__PURE__ */ jsx(ConceptMap, {})
			}) : /* @__PURE__ */ jsxs("div", {
				className: "layout",
				children: [/* @__PURE__ */ jsx(Sidebar, { activeId }), /* @__PURE__ */ jsxs("main", {
					id: "main",
					className: "main",
					children: [
						route.name === "chapter" ? /* @__PURE__ */ jsx(ChapterPage, { id: route.id }) : null,
						route.name === "interview" ? /* @__PURE__ */ jsx(InterviewPage, {}) : null,
						route.name === "mental-models" ? /* @__PURE__ */ jsx(MentalModelsPage, {}) : null
					]
				})]
			}),
			/* @__PURE__ */ jsx(Footer, {})
		]
	});
}
//#endregion
//#region scripts/smoke-entry.tsx
function render(hash) {
	globalThis.location = { hash };
	globalThis.window = globalThis;
	return renderToString(/* @__PURE__ */ jsx(App, {}));
}
var routes = [
	"#/map",
	"#/chapter/event-loop",
	"#/chapter/async-model",
	"#/chapter/v8-gc",
	"#/chapter/concurrency",
	"#/chapter/summary",
	"#/interview",
	"#/mental-models"
];
var ok = true;
for (const r of routes) try {
	const html = render(r);
	const pass = html.length > 200;
	ok &&= pass;
	console.log(`${pass ? "PASS" : "FAIL"} ${r} (${html.length} chars)`);
} catch (e) {
	ok = false;
	console.log(`FAIL ${r}: ${e.message}`);
	console.log(e.stack);
}
var el = render("#/chapter/event-loop");
for (const must of [
	"EVENT LOOP",
	"console output",
	"Mental model",
	"setImmediate",
	"Key points",
	"program.js"
]) {
	const has = el.includes(must);
	ok &&= has;
	console.log(`${has ? "PASS" : "FAIL"} event-loop contains "${must}"`);
}
var am = render("#/chapter/async-model");
for (const must of [
	"Async model",
	"call stack",
	"microtasks",
	"console output",
	"Predict the output",
	"Promise.all",
	"await suspends the function"
]) {
	const has = am.includes(must);
	ok &&= has;
	console.log(`${has ? "PASS" : "FAIL"} async-model contains "${must}"`);
}
var gc = render("#/chapter/v8-gc");
for (const must of [
	"young generation",
	"old generation",
	"Scavenge",
	"Mark-Sweep-Compact",
	"Maglev",
	"hidden class",
	"minor GCs"
]) {
	const has = gc.includes(must);
	ok &&= has;
	console.log(`${has ? "PASS" : "FAIL"} v8-gc contains "${must}"`);
}
var cc = render("#/chapter/concurrency");
for (const must of [
	"libuv thread pool",
	"UV_THREADPOOL_SIZE",
	"worker_threads",
	"kernel",
	"dns.lookup",
	"Predict the output"
]) {
	const has = cc.includes(must);
	ok &&= has;
	console.log(`${has ? "PASS" : "FAIL"} concurrency contains "${must}"`);
}
console.log(ok ? "\nSMOKE OK" : "\nSMOKE FAILED");
process.exit(ok ? 0 : 1);
//#endregion
export {};
