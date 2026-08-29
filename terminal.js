/* ============================================================
   terminal.js — 재생 엔진
   보통은 이 파일을 고칠 일이 없습니다. 콘텐츠는 content.js 에서.
   ============================================================ */
(() => {
  "use strict";

  const CFG = Object.assign({
    user: "user", host: "local", cwd: "~", branch: "main", title: "shell",
    typingSpeed: 32, typingJitter: 24, lineDelay: 90, promptDelay: 420,
    interactive: true, loop: false, startDelay: 400
  }, (typeof SHELL !== "undefined" && SHELL.config) || {});

  const $ = (s) => document.querySelector(s);
  const screenEl = $("#screen");
  const term     = $("#terminal");
  const stMode   = $("#st-mode");
  const stBranch = $("#st-branch");
  const stHint   = $("#st-hint");
  const stClock  = $("#st-clock");

  document.title = CFG.title;
  $("#win-title").textContent = CFG.title;
  stBranch.textContent = "⎇ " + CFG.branch;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 실행 상태 ---------- */
  const state = {
    run: 0,          // 실행 세션 토큰 (재시작 시 증가 → 이전 재생 중단)
    skipping: false, // 전체 건너뛰기
    fast: false,     // 클릭 빨리감기
    cwd: CFG.cwd,
    history: [],
    hIndex: -1
  };

  const setMode = (m) => { stMode.textContent = m; stMode.dataset.mode = m; };

  /* ---------- 유틸 ---------- */
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const scroll = () => { screenEl.scrollTop = screenEl.scrollHeight; };

  const append = (node) => { term.appendChild(node); scroll(); return node; };

  class Cancelled extends Error {}

  const sleep = (ms) => new Promise((res, rej) => {
    const token = state.run;
    if (state.skipping || reduced) return res();
    const factor = state.fast ? 0.16 : 1;
    setTimeout(() => (token === state.run ? res() : rej(new Cancelled())),
               Math.max(0, ms * factor));
  });

  class SkipSignal extends Error {}

  /* ---------- 프롬프트 ---------- */
  function promptSpan() {
    const f = document.createDocumentFragment();
    f.append(
      el("span", "p-user", CFG.user),
      el("span", "p-at", "@"),
      el("span", "p-host", CFG.host),
      el("span", "p-at", ":"),
      el("span", "p-path", state.cwd),
      el("span", "p-git", " (" + CFG.branch + ")"),
      el("span", "p-sym", " $ ")
    );
    return f;
  }

  /* ---------- 출력 블록 렌더 ---------- */
  const TEXT_KINDS = ["text", "muted", "success", "warn", "error", "info", "accent", "head"];

  function renderBlock(b) {
    if (typeof b === "string") b = { type: "text", text: b };
    const t = b.type || "text";

    if (TEXT_KINDS.includes(t)) {
      return append(el("div", "line o-" + t, b.text));
    }

    switch (t) {
      case "blank":
        return append(el("div", "line spacer"));

      case "rule": {
        const w = el("div", "line");
        w.appendChild(el("hr", "o-rule"));
        return append(w);
      }

      case "ascii":
        return append(el("pre", "line o-ascii", String(b.text).replace(/^\n/, "")));

      case "code":
        return append(el("pre", "line o-code", b.text));

      case "list": {
        const wrap = el("div");
        (b.items || []).forEach((it) => {
          const row = el("div", "line o-list");
          row.append(el("span", "bullet", b.bullet || "▸"), el("span", "", it));
          wrap.appendChild(row);
        });
        return append(wrap);
      }

      case "kv": {
        const wrap = el("div");
        (b.pairs || []).forEach(([k, v]) => {
          const row = el("div", "line o-kv");
          row.append(el("span", "k", k), el("span", "v", v));
          wrap.appendChild(row);
        });
        return append(wrap);
      }

      case "link": {
        const row = el("div", "line");
        const a = el("a", "o-link", b.label || b.href);
        a.href = b.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        row.appendChild(a);
        return append(row);
      }

      case "table": {
        const head = b.head || [];
        const rows = b.rows || [];
        const cols = Math.max(head.length, ...rows.map((r) => r.length), 1);
        const wrap = el("div", "line o-table-wrap");
        const grid = el("div", "o-table");
        grid.style.gridTemplateColumns = `repeat(${cols}, max-content)`;
        head.forEach((h) => grid.appendChild(el("span", "th", h)));
        rows.forEach((r) => {
          for (let i = 0; i < cols; i++) grid.appendChild(el("span", "td", r[i] ?? ""));
        });
        wrap.appendChild(grid);
        return append(wrap);
      }

      case "html": {
        const row = el("div", "line");
        row.innerHTML = b.html || "";
        return append(row);
      }

      default:
        return append(el("div", "line o-text", b.text || ""));
    }
  }

  /* ---------- 애니메이션 블록 ---------- */
  async function runProgress(b) {
    const row = el("div", "line o-progress");
    const label = el("span", "o-muted", b.label || "working");
    const bar = el("div", "bar");
    const fill = el("i");
    bar.appendChild(fill);
    const pct = el("span", "pct", "0%");
    row.append(label, bar, pct);
    append(row);

    const dur = state.skipping || reduced ? 0 : (b.duration || 1200) * (state.fast ? 0.16 : 1);
    if (dur <= 0) { fill.style.width = "100%"; pct.textContent = "100%"; return; }

    await new Promise((res) => {
      const t0 = performance.now();
      const token = state.run;
      const step = (now) => {
        if (token !== state.run) return res();
        const p = Math.min(1, (now - t0) / dur);
        const eased = p * p * (3 - 2 * p);
        fill.style.width = (eased * 100).toFixed(1) + "%";
        pct.textContent = Math.round(eased * 100) + "%";
        scroll();
        if (state.skipping || p >= 1) {
          fill.style.width = "100%"; pct.textContent = "100%"; res();
        } else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  async function runSpinner(b) {
    const row = el("div", "line");
    const ic = el("span", "spin", FRAMES[0]);
    const label = el("span", "o-muted", " " + (b.label || "loading"));
    row.append(ic, label);
    append(row);

    const dur = state.skipping || reduced ? 0 : (b.duration || 900) * (state.fast ? 0.16 : 1);
    if (dur > 0) {
      await new Promise((res) => {
        const token = state.run;
        let i = 0;
        const id = setInterval(() => {
          if (token !== state.run || state.skipping) { clearInterval(id); return res(); }
          ic.textContent = FRAMES[++i % FRAMES.length];
        }, 80);
        setTimeout(() => { clearInterval(id); res(); }, dur);
      });
    }
    ic.textContent = "✔";
    ic.className = "o-success";
    label.textContent = " " + (b.done || b.label || "done");
    label.className = "o-success";
    scroll();
  }

  /* ---------- 출력 배열 재생 ---------- */
  async function emit(blocks) {
    const list = typeof blocks === "function" ? blocks() : (blocks || []);
    for (const b of list) {
      if (b && b.type === "progress") { await runProgress(b); continue; }
      if (b && b.type === "spinner")  { await runSpinner(b);  continue; }
      renderBlock(b);
      await sleep(CFG.lineDelay);
    }
  }

  /* ---------- 명령어 타이핑 ---------- */
  async function typeCommand(cmd) {
    const line = el("div", "line prompt-line typing");
    line.appendChild(promptSpan());
    const text = el("span", "cmd");
    const cur = el("span", "cursor");
    line.append(text, cur);
    append(line);

    if (state.skipping || reduced) {
      text.textContent = cmd;
    } else {
      for (const ch of cmd) {
        if (state.skipping) { text.textContent = cmd; break; }
        text.textContent += ch;
        scroll();
        const extra = ch === " " ? 20 : 0;
        await sleep(CFG.typingSpeed + Math.random() * CFG.typingJitter + extra);
      }
    }
    line.classList.remove("typing");
    cur.remove();
    scroll();
  }

  /* ---------- 시나리오 실행 ---------- */
  async function play() {
    const token = ++state.run;
    state.skipping = false;
    state.fast = false;
    term.innerHTML = "";
    removeInput();

    try {
      setMode("BOOT");
      await sleep(CFG.startDelay);
      await emit(SHELL.boot);

      setMode("RUN");
      for (const step of (SHELL.script || [])) {
        if (token !== state.run) return;
        if (step.cwd) state.cwd = step.cwd;
        if (step.delay) await sleep(step.delay);
        await typeCommand(step.cmd);
        await sleep(160);
        await emit(step.out);
        await sleep(CFG.promptDelay);
      }
    } catch (e) {
      if (!(e instanceof SkipSignal) && !(e instanceof Cancelled)) throw e;
    }

    if (token !== state.run) return;

    if (CFG.loop) { setTimeout(play, 1600); return; }

    state.skipping = false;
    state.fast = false;
    setMode(CFG.interactive ? "READY" : "DONE");
    if (CFG.interactive) {
      stHint.textContent = "명령어를 입력하세요 · help · ↑↓ 기록 · Tab 자동완성";
      showInput();
    } else {
      stHint.textContent = "재생 완료 · R 키로 다시 보기";
    }
  }

  /* ---------- 대화형 입력 ---------- */
  let inputLine = null, hidden = null, buf = "", caret = null, typedEl = null;

  function removeInput() {
    if (inputLine) inputLine.remove();
    if (hidden) hidden.remove();
    inputLine = hidden = caret = typedEl = null;
    buf = "";
  }

  function showInput() {
    removeInput();

    inputLine = el("div", "line prompt-line input-line");
    inputLine.appendChild(promptSpan());
    typedEl = el("span", "cmd");
    caret = el("span", "cursor");
    inputLine.append(typedEl, caret);
    append(inputLine);

    hidden = el("input");
    hidden.setAttribute("aria-label", "터미널 입력");
    hidden.autocapitalize = "off";
    hidden.autocomplete = "off";
    hidden.spellcheck = false;
    Object.assign(hidden.style, {
      position: "fixed", left: "-9999px", top: "0", opacity: "0", width: "1px", height: "1px"
    });
    document.body.appendChild(hidden);

    hidden.addEventListener("input", () => { buf = hidden.value; typedEl.textContent = buf; scroll(); });
    hidden.addEventListener("keydown", onKey);
    hidden.focus({ preventScroll: true });
  }

  const builtins = ["help", "clear", "replay"];

  function allCommandNames() {
    return builtins.concat(Object.keys((typeof SHELL !== "undefined" && SHELL.commands) || {})).sort();
  }

  async function onKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = buf.trim();
      caret.remove();
      inputLine.classList.remove("input-line");
      hidden.remove();
      const finished = inputLine;
      inputLine = hidden = caret = typedEl = null;
      buf = "";
      if (cmd) { state.history.push(cmd); state.hIndex = state.history.length; }
      void finished;
      let result;
      try { result = await execute(cmd); }
      catch (err) { if (!(err instanceof SkipSignal) && !(err instanceof Cancelled)) throw err; }
      if (result === "replay") return;          // play() 가 입력줄을 다시 만든다
      if (CFG.interactive) showInput();
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      if (!state.history.length) return;
      state.hIndex += e.key === "ArrowUp" ? -1 : 1;
      state.hIndex = Math.max(0, Math.min(state.history.length, state.hIndex));
      buf = state.history[state.hIndex] || "";
      hidden.value = buf;
      typedEl.textContent = buf;
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const hit = allCommandNames().filter((n) => n.startsWith(buf.trim()));
      if (hit.length === 1) {
        buf = hit[0];
        hidden.value = buf;
        typedEl.textContent = buf;
      }
      return;
    }

    if (e.key === "l" && e.ctrlKey) { e.preventDefault(); term.innerHTML = ""; showInput(); }
  }

  async function execute(cmd) {
    if (!cmd) return;

    if (cmd === "clear") { term.innerHTML = ""; return; }

    if (cmd === "replay") { play(); return "replay"; }

    if (cmd === "help") {
      await emit([
        { type: "head", text: "AVAILABLE COMMANDS" },
        { type: "list", items: allCommandNames() },
        { type: "blank" },
        { type: "muted", text: "Tab 자동완성 · ↑↓ 명령 기록 · Ctrl+L 화면 지우기" }
      ]);
      return;
    }

    const table = (typeof SHELL !== "undefined" && SHELL.commands) || {};
    const key = cmd.split(/\s+/)[0];
    if (Object.prototype.hasOwnProperty.call(table, key)) {
      await emit(table[key]);
      return;
    }

    const nf = SHELL.notFound;
    await emit(typeof nf === "function" ? nf(key) : [{ type: "error", text: "command not found: " + key }]);
  }

  /* ---------- 조작 ---------- */
  screenEl.addEventListener("mousedown", (e) => {
    if (e.target.closest("a")) return;
    if (hidden) { hidden.focus({ preventScroll: true }); return; }
    state.fast = true;           // 재생 중 클릭 = 빨리감기
    stHint.textContent = "빨리감기 ▶▶ · Esc 로 건너뛰기";
  });

  $("#btn-skip").addEventListener("click", () => { state.skipping = true; });
  $("#btn-restart").addEventListener("click", () => play());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { state.skipping = true; }
    if (!hidden && (e.key === "r" || e.key === "R")) play();
  });

  /* ---------- 시계 ---------- */
  setInterval(() => {
    stClock.textContent = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  }, 1000);

  /* ---------- 시작 ---------- */
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", play, { once: true });
  } else {
    play();
  }

  // 콘솔에서 조작하고 싶을 때
  window.Terminal = { play, emit, execute, state };
})();
