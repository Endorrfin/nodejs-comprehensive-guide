/* ===========================================================================
   Predict-the-output quiz banks. Data only — rendered by the reusable
   <PredictOutputQuiz> engine (components/study/PredictOutputQuiz.tsx).
   Every `choices[correct]` order was captured from real Node 22 (CommonJS);
   see scripts/node-truth-async.mjs for the methodology.
   Add a new bank here + register a one-line wrapper in lib/registry.tsx to
   drop a quiz into any chapter.
   =========================================================================== */

export interface QuizQuestion {
  id: string;
  prompt?: string;
  code: string;
  /** Each choice is the console output as an ordered list of lines. */
  choices: string[][];
  correct: number;
  explain: string;
  level?: "senior" | "staff";
}

export const asyncOrderingQuiz: QuizQuestion[] = [
  {
    id: "aq-1",
    level: "senior",
    code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
    choices: [
      ["A", "D", "C", "B"],
      ["A", "B", "C", "D"],
      ["A", "D", "B", "C"],
      ["A", "C", "D", "B"],
    ],
    correct: 0,
    explain:
      "Synchronous first: A, D. Then microtasks before any macrotask: the Promise callback C. Then the timers-phase macrotask: B. A setTimeout(0) is never as soon as it looks — a microtask always jumps ahead of it.",
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
      ["1", "2", "3", "4"],
      ["1", "2", "4", "3"],
      ["1", "3", "2", "4"],
      ["2", "1", "3", "4"],
    ],
    correct: 0,
    explain:
      "Calling f() runs its body synchronously up to await: that prints 2. await suspends f() — '4' becomes a microtask — and control returns, so '3' prints. The stack empties, then the microtask resumes: 4. await pauses the function, not the thread.",
  },
  {
    id: "aq-3",
    level: "staff",
    prompt: "Assume a CommonJS module (a plain .js file or node -e).",
    code: `Promise.resolve().then(() => console.log('P'));
process.nextTick(() => console.log('N'));
console.log('S');`,
    choices: [
      ["S", "N", "P"],
      ["S", "P", "N"],
      ["N", "P", "S"],
      ["P", "N", "S"],
    ],
    correct: 0,
    explain:
      "S is synchronous. Then microtasks drain — and process.nextTick has its own queue that empties BEFORE the Promise queue, so N then P. (Gotcha: in an ES module the top level is already inside a microtask drain, so the order flips to P then N.)",
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
      ["start", "a", "b", "end", "aa", "bb"],
      ["start", "a", "aa", "b", "bb", "end"],
      ["start", "a", "b", "end", "bb", "aa"],
      ["start", "end", "a", "b", "aa", "bb"],
    ],
    correct: 0,
    explain:
      "Sync parts run first in call order: start, a, b, end. Each g() suspended at await, queuing its continuation. The microtask queue is FIFO, so g('a') resumes before g('b'): aa, bb. Two async functions interleave — concurrency, not parallelism.",
  },
  {
    id: "aq-5",
    level: "staff",
    code: `async function one() { console.log('1'); await Promise.resolve(); console.log('2'); }
async function two() { console.log('3'); await Promise.resolve(); console.log('4'); }
(async () => { await Promise.all([one(), two()]); console.log('done'); })();
console.log('sync');`,
    choices: [
      ["1", "3", "sync", "2", "4", "done"],
      ["1", "2", "3", "4", "sync", "done"],
      ["1", "3", "sync", "2", "4", "done", "done"],
      ["sync", "1", "3", "2", "4", "done"],
    ],
    correct: 0,
    explain:
      "one() and two() are invoked first (to build the array), printing 1 and 3 synchronously, then both suspend. 'sync' prints last in the synchronous pass. Microtasks resume in order: 2, 4. Only once both resolve does Promise.all settle, so 'done' prints after. Promise.all runs them concurrently, then joins.",
  },
];

/* Concurrency quiz — outputs captured from real Node 22 (CommonJS); the pool and
   the event loop make some orders GUARANTEED and others not. */
export const concurrencyQuiz: QuizQuestion[] = [
  {
    id: "cq-1",
    level: "senior",
    prompt: "Started with UV_THREADPOOL_SIZE=1 (a one-thread pool).",
    code: `const crypto = require('node:crypto');
crypto.pbkdf2('p', 'a', 1, 16, 'sha512', () => console.log('A done'));
crypto.pbkdf2('p', 'b', 1, 16, 'sha512', () => console.log('B done'));
console.log('submitted');`,
    choices: [
      ["submitted", "A done", "B done"],
      ["A done", "B done", "submitted"],
      ["submitted", "B done", "A done"],
      ["A done", "submitted", "B done"],
    ],
    correct: 0,
    explain:
      "Synchronous code first: 'submitted'. Both pbkdf2 calls are queued to the libuv pool, but with a single thread they run one at a time in submission order (FIFO) — A then B. With the default 4 threads they'd run concurrently and could finish in either order: pool size turns a non-deterministic race into a deterministic queue.",
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
      ["start", "immediate", "timeout"],
      ["start", "timeout", "immediate"],
      ["immediate", "timeout", "start"],
      ["start", "timeout"],
    ],
    correct: 0,
    explain:
      "'start' is synchronous. The readFile callback runs in the poll phase; the very next phase in the same tick is check (setImmediate), so 'immediate' fires before the timer — which must wait for the next tick's timers phase. Inside an I/O callback this order is GUARANTEED (unlike the main module, where setTimeout(0)-vs-setImmediate is a race).",
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
      ["read cb", "nextTick", "promise", "immediate"],
      ["read cb", "immediate", "nextTick", "promise"],
      ["nextTick", "promise", "read cb", "immediate"],
      ["read cb", "promise", "nextTick", "immediate"],
    ],
    correct: 0,
    explain:
      "The callback's synchronous body logs 'read cb' first. After the callback returns, microtasks drain before the loop advances — nextTick before the Promise queue — so 'nextTick' then 'promise'. Only then does the loop reach the check phase: 'immediate'. The microtask-before-macrotask rule applies after every callback, including those on the pool's I/O path.",
  },
];
