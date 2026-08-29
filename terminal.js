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
      stHint.textContent = "명령어 입력 · help 도움말 · Tab 자동완성 · ↑↓ 기록 · exit 나가기";
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
    // 화면 밖(-9999px)에 두면 탭을 옮겼다 돌아왔을 때 포커스가 살아나지 않는다.
    // 입력줄 안에 투명하게 겹쳐 두면 포커스가 안정적으로 유지된다.
    Object.assign(hidden.style, {
      position: "absolute", opacity: "0", width: "1px", height: "1.2em",
      padding: "0", margin: "0", border: "0", background: "transparent"
    });
    inputLine.style.position = "relative";
    inputLine.appendChild(hidden);

    hidden.addEventListener("input", () => { buf = hidden.value; typedEl.textContent = buf; scroll(); });
    hidden.addEventListener("keydown", onKey);
    refocus();
  }

  /* 탭 전환·클릭 등으로 포커스를 잃어도 입력이 죽지 않게 되돌린다 */
  function refocus() {
    if (!hidden || document.hidden) return;
    if (document.activeElement === hidden) return;
    try { hidden.focus({ preventScroll: true }); } catch (_) {}
  }

  const builtins = {
    help:   "사용 가능한 명령어 보기",
    clear:  "화면 지우기",
    replay: "인트로 다시 재생",
    exit:   "터미널 닫고 이전 페이지로"
  };

  const cmdTable = () => (typeof SHELL !== "undefined" && SHELL.commands) || {};

  // 명령어는 배열/함수 또는 { desc, out } 두 가지 형태를 모두 허용한다
  const entryOf = (v) =>
    (v && !Array.isArray(v) && typeof v !== "function" && v.out) ? v : { out: v, desc: "" };

  function allCommandNames() {
    return Object.keys(builtins).concat(Object.keys(cmdTable())).sort();
  }

  const pad = (t, n) => (t + "          ").slice(0, n);

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

    if (e.key === "Backspace" && document.activeElement !== hidden) {
      e.preventDefault();
      buf = buf.slice(0, -1);
      hidden.value = buf;
      typedEl.textContent = buf;
      return;
    }

    if (e.key === "l" && e.ctrlKey) { e.preventDefault(); term.innerHTML = ""; showInput(); }
  }

  async function execute(cmd) {
    if (!cmd) return;

    if (cmd === "clear") { term.innerHTML = ""; return; }

    if (cmd === "replay") { play(); return "replay"; }

    if (cmd === "exit" || cmd === "quit" || cmd === "logout") {
      await emit([
        { type: "muted", text: "logout" },
        { type: "muted", text: "Connection to portfolio closed." }
      ]);
      removeInput();
      stHint.textContent = "세션 종료 · 돌아가는 중…";
      setTimeout(() => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = "https://github.com/ParkJaeHwan-906";
      }, 800);
      return "exit";
    }

    const table = cmdTable();

    if (cmd === "help") {
      await emit([
        { type: "head", text: "BUILT-IN" },
        { type: "kv", pairs: Object.keys(builtins).sort().map((k) => [pad(k, 10), builtins[k]]) },
        { type: "blank" },
        { type: "head", text: "COMMANDS" },
        { type: "kv", pairs: Object.keys(table).sort().map((k) => [pad(k, 10), entryOf(table[k]).desc || ""]) },
        { type: "blank" },
        { type: "muted", text: "Tab 자동완성 · ↑↓ 명령 기록 · Ctrl+L 화면 지우기 · exit 나가기" }
      ]);
      return;
    }

    const key = cmd.split(/\s+/)[0];
    if (Object.prototype.hasOwnProperty.call(table, key)) {
      await emit(entryOf(table[key]).out);
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
    if (e.key === "Escape") { state.skipping = true; return; }

    if (!hidden) {
      // 아직 재생 중 — 아무 글자나 누르면 곧장 프롬프트로 건너뛴다
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "r" || e.key === "R") { play(); return; }
      if (e.key.length === 1 || e.key === "Enter") state.skipping = true;
      return;
    }

    // 입력줄은 있는데 포커스가 다른 곳에 있을 때 (탭 이동 후 복귀 등)
    if (document.activeElement === hidden) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    refocus();
    if (e.key.length === 1) {          // 놓칠 뻔한 글자를 직접 넣어준다
      e.preventDefault();
      hidden.value += e.key;
      buf = hidden.value;
      typedEl.textContent = buf;
      scroll();
    } else {
      // Enter · ↑↓ · Tab 은 focus() 가 이번 키에는 아직 적용되지 않아
      // 입력창까지 도달하지 못한다. 직접 넘겨준다.
      onKey(e);
    }
  });

  // 탭 복귀 · 창 포커스 · 뒤로가기 복원 시 입력을 되살린다
  window.addEventListener("focus", refocus);
  window.addEventListener("pageshow", refocus);
  document.addEventListener("visibilitychange", () => {
    // 탭이 가려지면 setTimeout 이 1초 단위로 스로틀링돼 인트로가 기어간다.
    // 안 보는 동안 인트로를 즉시 끝내 두고, 돌아오면 바로 입력할 수 있게 한다.
    if (document.hidden) { state.skipping = true; return; }
    refocus();
  });
  document.addEventListener("mouseup", () => {
    if (window.getSelection && String(window.getSelection())) return;  // 드래그 선택 중이면 두지 않는다
    refocus();
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
