/* ===========================================================================
   Real-life analogies — one per content chapter, keyed by chapter id.
   Each one is a concrete scene whose parts map 1:1 onto Node terms, plus the
   line a senior adds unprompted: WHERE THE ANALOGY BREAKS. An analogy that is
   never challenged turns into a misconception — `breaks` is mandatory.
   Rendered by ChapterPage (right under the header); validated by qa-integrity.
   =========================================================================== */

export interface Analogy {
  /** The scene, in a few words. */
  title: string;
  /** The story (inline markdown, blank line = new paragraph). */
  scene: string;
  /** [in real life, in Node] — every row is one precise correspondence. */
  map: [string, string][];
  /** Where the picture stops being true (inline markdown). */
  breaks: string;
}

export const ANALOGIES: Record<string, Analogy> = {
  // ---------------------------------------------------------------- Foundations
  "what-is-node": {
    title: "A restaurant with one waiter",
    scene:
      "One waiter serves the whole floor. They take an order, pin the ticket in the kitchen window and go straight to the next table instead of standing at the stove. When the bell rings (\"order up\"), they carry the plate out. One person serves dozens of tables because every table spends most of its time *waiting*.",
    map: [
      ["The waiter", "The single JavaScript thread running the event loop"],
      ["The ticket in the kitchen window", "A pending operation plus its callback"],
      ["The kitchen (4 cooks) and the bar", "libuv's thread pool and the OS's async I/O"],
      ["The \"order up\" bell", "A completion event: the loop picks up your callback"],
      ["The menu and the recipes", "Your code. The restaurant itself (building, staff, rules) is Node"],
    ],
    breaks:
      "If the waiter starts **cooking** themselves (a CPU-heavy loop), every table waits, because there is no second waiter. Also, the \"kitchen\" is really two places: only some work goes to the 4 pool cooks (fs, crypto, zlib). Network I/O is like the bar running itself, so it ties up no cook at all.",
  },

  strengths: {
    title: "One concierge vs a butler per guest",
    scene:
      "Hotel A gives every guest a personal butler. Most of the day the butler stands in the corridor waiting for a taxi or for the restaurant to confirm a booking, and each one still draws a full salary. Hotel B has one concierge at a desk with a stack of tickets. They place the call, write the ticket and serve the next guest. When a call comes back, they finish that ticket. Hotel B serves thousands of guests on one salary.",
    map: [
      ["A butler per guest", "Thread-per-request (each thread reserves a stack, ~1 MiB)"],
      ["The butler idling in the corridor", "A blocked thread waiting on I/O"],
      ["The concierge's ticket stack", "The event loop's queue of pending callbacks (a few KiB per idle socket, ~20 KiB while a request is in flight)"], // CHANGED: S18
      ["Thousands of guests on one salary", "The C10k win: concurrency without a thread per connection"],
    ],
    breaks:
      "The concierge wins only while the guests' needs are mostly **waiting**. Ask them to hand-write a 50-page report (CPU work) and the whole desk freezes, while the butler hotel would still be fine. Concurrency (overlapping waits) is not parallelism (doing work at the same time).",
  },

  weaknesses: {
    title: "One checkout, one customer with a jar of coins",
    scene:
      "A shop has a single cashier, and the queue moves fast because every customer has one or two items. Then someone pays a 250 ms jar of coins. Nobody behind them can pay, even the person holding one bottle of water. The cashier isn't slow. They're just busy, and there is only one of them.",
    map: [
      ["The cashier", "The single JS thread"],
      ["The jar of coins", "Synchronous CPU work: a huge `JSON.parse`, a sync crypto call, a ReDoS regex"],
      ["Everyone stuck behind it", "Every in-flight request, timer and new connection"],
      ["How long the queue waits", "Event-loop lag and your p99 latency"],
      ["\"Count your coins at the side table\"", "Offload to a worker thread, or chunk the work with `setImmediate`"],
    ],
    breaks:
      "In a shop people complain loudly. A blocked loop is **silent**: health checks time out too, so the load balancer may kill a process that is healthy but busy. You only see it if you measure lag.",
  },

  competitors: {
    title: "Vehicles for different jobs",
    scene:
      "No fleet manager asks \"what is the fastest vehicle?\" They ask \"what is the job?\" You use scooters for city deliveries, trucks for freight, a race car for the track and a lab van for field research. Each vehicle wins at its own job and loses at someone else's.",
    map: [
      ["Delivery scooters in city traffic, huge spare-parts market", "Node: I/O-heavy services, the npm ecosystem"],
      ["Same scooter, different manufacturer", "Deno / Bun: the same JS road rules, different engines and tooling (Bun runs JavaScriptCore)"],
      ["A van with a strong engine and simple controls", "Go: cheap goroutines and real parallelism, easy to operate"],
      ["The race car", "Rust: maximal performance and control, but a steep learning curve"],
      ["The freight train", "JVM / .NET: heavy warm-up, then massive sustained throughput"],
      ["The lab van full of instruments", "Python: ML and data science libraries"],
      ["The self-healing tram network", "Elixir/BEAM: millions of lightweight processes, soft real-time"],
    ],
    breaks:
      "Vehicles don't improve every six months. Runtimes do, so re-check benchmarks before you trust them. And the deciding factor is usually the **drivers** (the team's skills, hiring, existing code), not top speed.",
  },

  architecture: {
    title: "The engine is not the car",
    scene:
      "A car is an engine plus a drivetrain, wiring, controls and factory-fitted parts. The driver touches only the pedals and the dashboard. The same engine model can be fitted into a completely different car.",
    map: [
      ["The driver", "Your JavaScript"],
      ["Pedals and dashboard", "The core JS API: `fs`, `http`, `net`, `stream`"],
      ["The wiring harness", "C++ bindings between the JS API and native code"],
      ["The engine", "V8: compiles and runs JS, manages its heap"],
      ["The drivetrain to the road", "libuv: the event loop, async I/O, the thread pool"],
      ["Factory-fitted parts", "Bundled C libs: OpenSSL, zlib, llhttp, c-ares"],
      ["The road", "The operating system (epoll / kqueue / IOCP)"],
      ["The same engine in another car", "V8 also powers Chrome and Deno: V8 is not Node"],
    ],
    breaks:
      "In a car the engine and gearbox work **simultaneously**. In Node, V8 running your JS and the event loop share **one thread** and take turns. Only the thread pool and the kernel do work in parallel with your code.",
  },

  // ---------------------------------------------------------------- Runtime core
  "event-loop": {
    title: "A night guard's patrol round",
    scene:
      "A guard walks the same round all night, through fixed checkpoints in a fixed order. First they check the alarm clocks that are due, then deferred paperwork, then the front door and mailbox for deliveries. Next come the \"right after the mailbox\" notes, and last any doors that need closing. After **every single task** the guard checks the walkie-talkie. They read all the urgent messages, the boss's first, before taking another step.",
    map: [
      ["The guard", "The event-loop thread"],
      ["Checkpoints in a fixed order", "Phases: timers → pending → poll → check → close"],
      ["An alarm clock set for \"not before 9:00\"", "`setTimeout`: a minimum delay, not an exact time"],
      ["The front door and mailbox", "The poll phase: I/O callbacks (sockets, files)"],
      ["The \"right after the mailbox\" note", "`setImmediate`: the check phase"],
      ["Walkie-talkie: the boss first, then the team", "Microtasks: the `process.nextTick` queue, then Promise callbacks"],
      ["The boss who never stops calling", "Recursive `nextTick`: starvation, the guard never moves on"],
    ],
    breaks:
      "A real guard with nothing to do keeps walking. Node's guard **parks at the mailbox**: it blocks in epoll/kqueue until I/O arrives or the nearest alarm is due. When there are no appointments left at all (no timers, sockets or handles), the guard goes home and the process exits.",
  },

  "async-model": {
    title: "The coffee-shop pager",
    scene:
      "You order and get a pager instead of a coffee. You sit down and get on with other things. The pager buzzes green (\"ready\") or red (\"sorry, no oat milk\"). If you think \"I'll continue my to-do list from this line once it buzzes\", that is `await`. Your plan pauses, but the barista keeps serving everyone else.",
    map: [
      ["The pager", "A Promise"],
      ["Waiting / buzzes green / buzzes red", "pending / fulfilled / rejected"],
      ["Bookmarking your to-do list at this line", "`await`: pauses this function, not the thread"],
      ["The barista", "The single JS thread, still serving others"],
      ["Ordering for the whole table at once", "`Promise.all` vs a serial `await` in a loop"],
      ["A pager buzzing red on an empty table", "An unhandled rejection (fatal by default since Node 15)"],
    ],
    breaks:
      "A real pager interrupts you the moment it buzzes. A resolved Promise doesn't: your continuation is **queued as a microtask** and runs only when the current synchronous work finishes. And `async` doesn't make work asynchronous. If your \"order\" is grinding the beans yourself (a sync loop), nothing else happens meanwhile.",
  },

  "v8-gc": {
    title: "A restaurant kitchen's dishes",
    scene:
      "Plates pile up on a small counter by the pass, and most of them are used once and are done in seconds. Every so often a porter sweeps the counter. They move the few plates still in use to the other half and clear the rest in one go, which is quick because so few survive. A plate that survives a couple of sweeps goes to the big storeroom. The storeroom gets a rarer deep clean: the porter marks what is still used, throws out the rest and pushes the shelves together. The kitchen pauses for parts of it.",
    map: [
      ["The small counter by the pass", "The young generation (nursery, semi-spaces)"],
      ["The quick sweep: move survivors, clear the rest", "Scavenge: a minor GC, cost proportional to survivors"],
      ["Plates that survive twice go to the storeroom", "Promotion to old space"],
      ["The storeroom deep clean", "Mark-Sweep-Compact: a major GC, partly concurrent"],
      ["\"Everyone freeze for a second\"", "A stop-the-world pause on the JS thread"],
      ["Keeping every plate \"just in case\" in a global rack", "A leak: an unbounded cache or listener, heading for heap OOM"],
      ["A new cook following the card, later cooking favourites from memory", "JIT tiers: Ignition → Sparkplug → Maglev → TurboFan. A changed order shape sends them back to the card (deopt)"],
    ],
    breaks:
      "Throwing plates out doesn't shrink the storeroom: a heap that grew may stay large after GC, so RSS is not \"live objects\". And the quick sweep is **not free** just because it is quick. Allocation-heavy hot paths trigger it constantly, which is why reducing allocations is a real optimization.",
  },

  concurrency: {
    title: "A post office: clerks vs couriers",
    scene:
      "At the post office, some jobs need a clerk to sit down and do them: weighing parcels, filling in forms. There are only 4 counters. Other jobs go to a courier company. You hand the parcel over, get a tracking number and get notified on arrival, and nobody at the post office is tied up. If you need more hands, you can hire staff who share the back office, open identical branches behind one greeter at the door, or call an outside contractor.",
    map: [
      ["4 counter clerks", "The libuv thread pool (default 4, `UV_THREADPOOL_SIZE` up to 1024)"],
      ["Jobs that need a clerk", "Async fs, `crypto.pbkdf2`/`scrypt`, zlib, `dns.lookup`"],
      ["The courier with a tracking number", "Network sockets: the kernel (epoll/kqueue) watches them, no thread held"],
      ["More staff sharing the back office", "`worker_threads`: same process, message passing or SharedArrayBuffer"],
      ["Identical branches behind one greeter", "`cluster`: N processes, the primary distributes connections"],
      ["An outside contractor", "`child_process`: a separate program with separate memory"],
    ],
    breaks:
      "In a real post office you can **see** the queue. Node's pool queue is invisible: a burst of `dns.lookup` or `pbkdf2` calls silently delays your `fs.readFile`. You can add more counters, but only before the first job arrives, because the pool size is fixed once it is first used.",
  },

  streams: {
    title: "The dishwasher who shouts \"stop!\"",
    scene:
      "Waiters bring dirty plates and a dishwasher washes them. Next to the sink is a rack that holds a set number of plates. When the rack is full, the dishwasher shouts \"stop!\". Good waiters wait until they hear \"ready!\". Bad waiters keep stacking plates on the floor until the kitchen is impassable. Bringing the whole dining room's dishes at once in a truck is `readFile`.",
    map: [
      ["The waiters / the dishwasher", "The Readable (producer) / the Writable (consumer)"],
      ["The rack next to the sink", "The internal buffer, sized by `highWaterMark` (64 KiB bytes / 16 objects)"],
      ["\"Stop!\"", "`write()` returns `false`"],
      ["\"Ready!\"", "The `'drain'` event"],
      ["Plates piling up on the floor", "Ignored backpressure: memory balloons until OOM"],
      ["The shift manager who stops the whole line if anyone drops", "`stream.pipeline()`: error propagation plus cleanup of every stage"],
    ],
    breaks:
      "A real rack is physically full. `highWaterMark` is only a **signal threshold**: `write()` still accepts the plate after shouting \"stop\". The buffer stays bounded only if the producer listens, which `pipe`/`pipeline` do for you and a hand-rolled loop often doesn't.",
  },

  modules: {
    title: "Cooking from a recipe vs mise en place",
    scene:
      "The CommonJS cook reads the recipe step by step. When a step says \"make the sauce (see page 40)\", they flip to page 40 and make it **right now**, then return. A sauce already made is reused from the pot. The ESM cook first reads the whole menu, sets out every ingredient and connects the stations. Only then do they start cooking, in order.",
    map: [
      ["Flip to page 40 and make it right now", "`require()`: synchronous, depth-first evaluation"],
      ["The sauce already in the pot", "The module cache: evaluated once, reused"],
      ["Read the menu, set out ingredients, then cook", "ESM: parse → link → evaluate, so `import` is async and hoisted"],
      ["A photo of the station's whiteboard", "CJS: you get a copy of the `module.exports` value"],
      ["A window onto the whiteboard", "ESM: live, read-only bindings, so you see later updates"],
      ["Two recipes that refer to each other", "A cycle: CJS hands you a half-made sauce (partial exports), ESM already knows the names"],
    ],
    breaks:
      "A real cook can improvise mid-recipe. ESM's graph is fixed **before** anything runs, so conditional or late loading needs dynamic `import()`, which returns a Promise. And in a cycle ESM only knows the *names*: reading a `let`/`const` before its module ran still throws (TDZ).",
  },

  // ---------------------------------------------------------------- Real systems
  errors: {
    title: "A flat tyre vs faulty brakes",
    scene:
      "A flat tyre is expected: you carry a spare, change it and drive on. Brakes that fail because of a design flaw are different. You pull over and stop, because you no longer know what else is broken. Bad news also reaches you four different ways: someone shouts it at you, a letter arrives later, a note is pinned to the first page of a reply, or it is announced over the PA. If nobody listens to the PA, the building alarm goes off.",
    map: [
      ["A flat tyre: use the spare and continue", "Operational error (timeout, 404, bad input): handle and continue"],
      ["Faulty brakes: pull over, stop", "Programmer error (a bug): fail fast and let the supervisor restart"],
      ["Shouted in your face", "Synchronous `throw`: `try/catch` works"],
      ["A letter that arrives later", "A Promise rejection: `await` inside `try`, or `.catch()`"],
      ["A note pinned to page one of the reply", "Error-first callback `(err, data)`"],
      ["The PA with nobody listening: the alarm goes off", "An `'error'` event without a listener crashes the process"],
      ["A case number stamped on every document", "`AsyncLocalStorage`: request context across async hops"],
    ],
    breaks:
      "You can't half pull over. After a programmer error the process state is unknown, and other requests share the same memory. A heroic catch-all in `uncaughtException` keeps a possibly corrupted process serving traffic. Log, exit, restart clean.",
  },

  http: {
    title: "A taxi rank that keeps cars idling",
    scene:
      "Hailing a fresh taxi every trip means negotiating each time, which is the handshake. A taxi company keeps a few cars idling at the rank, so your next trip starts instantly. Each driver waits only so long before leaving. The classic accident: the driver pulls away at exactly the moment you open the door.",
    map: [
      ["Negotiating a new taxi", "A TCP (+TLS) handshake for a new connection"],
      ["Cars idling at the rank", "The keep-alive `Agent` pool: socket reuse"],
      ["The fleet size / cars allowed to idle", "`maxSockets` / `maxFreeSockets`"],
      ["How long a driver waits before leaving", "`server.keepAliveTimeout` (default 5 s)"],
      ["The driver leaves as you open the door", "The 502 race: the LB reuses a socket the server is closing, so keep the server's timeout above the LB's idle timeout"],
      ["The dispatcher transcribing the radio call word by word", "llhttp parsing bytes incrementally into `req`"],
      ["One taxi carrying many passengers' parcels interleaved", "HTTP/2 multiplexing over one connection"],
    ],
    breaks:
      "HTTP/2 removes head-of-line blocking at the HTTP layer only. Underneath, TCP still delivers bytes in order, so one lost packet stalls **every** passenger in the car. That is the reason HTTP/3 moved to QUIC over UDP.",
  },

  performance: {
    title: "A doctor: pulse, stress test, scan",
    scene:
      "A good doctor doesn't operate on a hunch. They take the pulse, run a stress test on the treadmill, then order a scan to find exactly where the problem is. They watch the worst readings, not the average. After treatment they measure again.",
    map: [
      ["The pulse", "Event-loop lag (`monitorEventLoopDelay`)"],
      ["How hard the heart is working", "Event-loop utilization (ELU), where 100% means a queue is forming"],
      ["The treadmill stress test", "A load test (autocannon) with realistic traffic"],
      ["The scan showing where", "A CPU profile / flamegraph: the widest frame is the hot path"],
      ["Surgery without a diagnosis", "Micro-optimizing without a profile"],
      ["The worst readings, not the average", "p99, not mean latency"],
    ],
    breaks:
      "A normal pulse at rest proves little. Lag looks perfect on an idle service, so measure **under load** with production-shaped data. And unlike a body, a service changes with every deploy, so keep the pulse on a dashboard, not in a one-off checkup.",
  },

  security: {
    title: "A restaurant's supply chain",
    scene:
      "Your restaurant buys sauces from suppliers, who buy ingredients from their own suppliers, and the chef serves all of it without tasting. Good kitchens defend in layers. They order exact batch numbers, leave a new delivery on the shelf for a day before using it, keep delivery drivers out of the kitchen and lock the storerooms. They also check the recall list.",
    map: [
      ["The supplier's supplier", "Transitive dependencies: your real attack surface"],
      ["The chef serving without tasting", "Node runs every line with your process's full privileges"],
      ["A purchase order with exact batch numbers", "The lockfile: pinned versions plus integrity hashes"],
      ["New deliveries rest a day on the shelf", "A release cooldown (e.g. pnpm `minimumReleaseAge`), because malicious releases are usually pulled within hours or days"],
      ["Delivery drivers stay out of the kitchen", "`ignore-scripts`: no `postinstall` code at install time"],
      ["A \"made at factory X\" label", "Provenance proves **origin**, not that the recipe is safe"],
      ["The recall list", "`npm audit`: known CVEs only"],
      ["Lockable storerooms", "The Permission Model (`--permission`): a seat belt, not a vault"],
    ],
    breaks:
      "Food poisoning shows symptoms eventually. A malicious package can steal tokens **silently** and leave no trace, so \"nothing happened\" proves nothing. Rotate secrets after any suspicious install.",
  },

  production: {
    title: "The supermarket at closing time",
    scene:
      "At 21:50 the PA announces \"the store closes in 10 minutes\". The sign flips to Closed, but Google Maps still shows the store as open for a little while. The doors lock to new customers, while the people already at the tills get served. The cashiers close their registers and the lights go off properly. At the deadline, security cuts the power, whoever is still inside. A good manager sets their own alarm a bit earlier.",
    map: [
      ["\"Closing in 10 minutes\"", "SIGTERM and the grace period (k8s default 30 s)"],
      ["Flipping the sign to Closed", "Failing the readiness probe"],
      ["Google Maps still says \"open\"", "The endpoint-removal race, so add a `preStop` sleep"],
      ["Doors locked to new customers", "`server.close()`: stop accepting connections"],
      ["Serving those already at the tills", "Draining in-flight requests"],
      ["Closing the registers", "Closing DB pools, flushing logs and queues"],
      ["Lights off properly", "`process.exit(0)`"],
      ["Security cuts the power", "SIGKILL at the deadline, exit 137"],
      ["The manager's earlier alarm", "A force-exit timer (`unref`'d) set before the deadline"],
    ],
    breaks:
      "In a store everyone still inside is visible. `server.close()` knows only about **HTTP connections**, not your cron jobs, queue consumers, timers or background work. Those keep running unless you stop them yourself.",
  },

  express: {
    title: "Airport security lanes",
    scene:
      "Your tray moves through stations in a fixed order. Each officer either stops you there, waves you on, or flags the bag. A flagged bag goes to a separate secondary-screening lane, where only officers with the right badge work. If you reach the end of the hall and no gate matches your boarding pass, nobody arrests you. You are simply told \"no such gate\".",
    map: [
      ["Stations in a fixed order", "Middleware in registration order: order IS the control flow"],
      ["Stop you / wave you on", "Send a response / call `next()`"],
      ["Flag the bag", "`next(err)` or a throw: switch to the error lane"],
      ["Only officers with the right badge", "Error handlers are recognized by **arity**: exactly 4 params `(err, req, res, next)`"],
      ["\"Wrong queue for this gate, skip ahead\"", "`next('route')`: skip the rest of this route's handlers"],
      ["A terminal wing whose signs drop the \"Terminal A\" prefix", "`app.use('/api', router)`: `req.url` is stripped, `req.baseUrl` keeps the prefix"],
      ["No gate matches", "404 via finalhandler: a miss is not an error"],
      ["A dropped tray auto-sent to secondary screening", "Express 5 forwards rejected async handlers. In v4 the tray hit the floor (crash or hang)"],
    ],
    breaks:
      "At an airport, an officer who neither waves you on nor stops you would get noticed. In Express a middleware that forgets both `next()` and a response just leaves the request **hanging** until a timeout. Silence is a valid (buggy) outcome.",
  },

  // ---------------------------------------------------------------- Mastery
  "modern-node": {
    title: "Car model years and the warranty",
    scene:
      "Every year a new model comes out. At first it is the shiny new release, still collecting fixes. Later it gets a full warranty, then only safety recalls, then nothing at all: drive it at your own risk. Some years there is also a concept car that never gets a warranty. Meanwhile features that used to be aftermarket add-ons, like a GPS or a dash-cam, start shipping from the factory.",
    map: [
      ["The new model", "Current: the even major from April (e.g. Node 26)"],
      ["The full warranty", "Active LTS from October: fixes plus careful backports"],
      ["Safety recalls only", "Maintenance LTS: critical and security fixes"],
      ["No recalls", "End-of-life: no security patches"],
      ["The concept car with no warranty", "Odd majors (e.g. 25): Current only, EOL after about 6 months"],
      ["Factory-fitted, no longer aftermarket", "Built-ins replacing deps: `fetch`, `node:test`, `--watch`, WebSocket, TS type stripping"],
      ["A prototype part", "An *experimental* feature: no stability promise"],
    ],
    breaks:
      "A new car model doesn't change how *you* drive. A new Node major can change behaviour underneath you (V8, OpenSSL, defaults, deprecations), so read the changelog and run the test suite. And the schedule itself changes from Node 27: one major a year, every one of them LTS.",
  },
};
