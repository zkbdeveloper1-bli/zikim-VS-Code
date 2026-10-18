(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = "vszkb-project-v1";
  const M = "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/";
  const LANG = {py:"python", html:"html", htm:"html", css:"css", js:"javascript", json:"json", md:"markdown", txt:"plaintext", c:"c", cpp:"cpp", java:"java"};
  const starter = {
    "welcome.py": 'print("Hello from VS-ZKB Code Studio!")\n\nname = input("Your name: ")\nprint("Welcome,", name)\n',
    "index.html": '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My Website</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="card">\n    <h1>Hello, world! 👋</h1>\n    <p>My first website in VS-ZKB Code Studio.</p>\n    <button id="helloBtn">Click me</button>\n    <p id="message"></p>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>\n',
    "style.css": 'body { font-family: Arial, sans-serif; background: #101827; color: #f8fafc; min-height: 100vh; display: grid; place-items: center; margin: 0; }\n.card { text-align: center; padding: 36px; border-radius: 18px; background: #1e293b; box-shadow: 0 20px 60px #0005; }\nbutton { background: #38bdf8; border: 0; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-weight: bold; }\n',
    "script.js": 'document.getElementById("helloBtn").addEventListener("click", () => {\n  document.getElementById("message").textContent = "JavaScript is working!";\n  console.log("Button clicked!");\n});\nconsole.log("Website loaded successfully.");\n'
  };

  let files = {}, active = "", editor = null, mReady = false, saveT = null;
  let pending = null, marks = [], rt = [];

  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    files = s && s.files ? s.files : {...starter};
  } catch { files = {...starter}; }
  if (!Object.keys(files).length) files = {...starter};
  active = files["welcome.py"] !== undefined ? "welcome.py" : Object.keys(files)[0];

  const ext = (n) => n.includes(".") ? n.split(".").pop().toLowerCase() : "";
  const lang = (n) => LANG[ext(n)] || "plaintext";

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({files})); $("saveStatus").textContent = "Saved locally"; }
    catch { $("saveStatus").textContent = "Browser storage full"; }
  }
  function sched() {
    $("saveStatus").textContent = "Saving…";
    clearTimeout(saveT); saveT = setTimeout(save, 250);
  }
  const getCode = () => mReady ? editor.getValue() : $("plainEditor").value;
  function setCode(text) {
    if (mReady) {
      editor.setValue(text);
      monaco.editor.setModelLanguage(editor.getModel(), lang(active));
      editor.focus();
    } else $("plainEditor").value = text;
  }

  /* ---------- Explorer (top) ---------- */
  function renderFiles() {
    const t = $("fileTree"); t.innerHTML = "";
    Object.keys(files).sort((a, b) => a.localeCompare(b)).forEach(n => {
      const c = document.createElement("div");
      c.className = "file" + (n === active ? " active" : "");
      c.title = "Click to open · Double-click to rename";
      const l = document.createElement("span"); l.textContent = n;
      const x = document.createElement("button"); x.textContent = "×"; x.title = "Delete file";
      x.onclick = (e) => { e.stopPropagation(); delFile(n); };
      c.onclick = () => openFile(n);
      c.ondblclick = () => renameFile(n);
      c.append(l, x); t.appendChild(c);
    });
    $("langStatus").textContent = lang(active);
  }
  function openFile(n) {
    if (files[n] === undefined) return;
    if (files[active] !== undefined) files[active] = getCode();
    active = n; renderFiles(); setCode(files[n]); save();
  }
  function renameFile(old) {
    const nn = prompt("Enter the new file name:", old);
    if (!nn || nn === old) return;
    if (/[\/\\]/.test(nn) || files[nn] !== undefined) return alert("Invalid name, or a file with that name already exists.");
    files[active] = getCode();
    files[nn] = files[old]; delete files[old];
    if (active === old) active = nn;
    renderFiles(); setCode(files[active]); save();
  }
  function delFile(n) {
    if (!confirm(`Delete ${n} from this browser project?`)) return;
    if (files[active] !== undefined && active !== n) files[active] = getCode();
    delete files[n];
    if (!Object.keys(files).length) files["welcome.py"] = 'print("Hello!")\n';
    if (active === n) active = Object.keys(files)[0];
    renderFiles(); setCode(files[active]); save();
  }
  $("addBtn").onclick = () => {
    $("addForm").classList.toggle("hidden");
    $("newName").value = ""; $("newName").focus();
  };
  $("cancelAdd").onclick = () => $("addForm").classList.add("hidden");
  $("addForm").onsubmit = (e) => {
    e.preventDefault();
    let n = $("newName").value.trim();
    if (!n) return;
    if (!/\.[a-z0-9+]+$/i.test(n)) n += $("newExt").value;
    if (/[\/\\]/.test(n)) return alert("Use a simple file name without folders.");
    if (files[n] !== undefined) return alert("A file with that name already exists.");
    files[n] = "";
    $("addForm").classList.add("hidden");
    openFile(n);
  };

  /* ---------- Terminal ---------- */
  function term(text, cls) {
    const d = document.createElement("div");
    if (cls) d.className = cls;
    d.textContent = text;
    $("termOut").appendChild(d);
    $("termOut").scrollTop = 1e9;
  }
  function readInput(p) {
    return new Promise((resolve) => {
      showPanel("term");
      const out = $("termOut");
      const line = document.createElement("div"); line.className = "inline-line";
      const pr = document.createElement("span"); pr.textContent = String(p ?? "");
      const inp = document.createElement("input");
      inp.className = "inline-input"; inp.autocomplete = "off"; inp.spellcheck = false;
      line.append(pr, inp); out.appendChild(line); out.scrollTop = 1e9; inp.focus();
      inp.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const v = inp.value, t = document.createElement("span");
        t.textContent = v; inp.replaceWith(t); resolve(v);
      });
    });
  }
  $("termOut").addEventListener("click", () => {
    const i = $("termOut").querySelector(".inline-input"); if (i) i.focus();
  });

  /* ---------- Problems ---------- */
  function renderProblems() {
    const all = [...rt, ...marks];
    $("probCount").textContent = all.length;
    const v = $("problemsView"); v.innerHTML = "";
    if (!all.length) { v.innerHTML = '<div class="dim">No problems detected.</div>'; return; }
    all.forEach(p => {
      const d = document.createElement("div");
      d.className = "prob " + (p.sev >= 8 ? "err" : "warn");
      d.textContent = `${p.sev >= 8 ? "✖" : "⚠"} ${p.msg}  [${p.file}, line ${p.line}]`;
      d.onclick = () => {
        if (p.file !== active) openFile(p.file);
        if (editor) { editor.revealLineInCenter(p.line); editor.setPosition({lineNumber: p.line, column: 1}); editor.focus(); }
      };
      v.appendChild(d);
    });
  }
  function showPanel(which) {
    $("panel").classList.remove("hidden");
    $("setPanel").textContent = "Hide Terminal";
    $("panel").classList.toggle("big", which === "output");
    ["term", "problems", "output"].forEach(v => $(v + "View").classList.toggle("hidden", v !== which));
    document.querySelectorAll(".panel-tab").forEach(b => b.classList.toggle("active", b.dataset.panel === which));
  }
  document.querySelectorAll(".panel-tab").forEach(b => b.onclick = () => showPanel(b.dataset.panel));
  $("clearBtn").onclick = () => { $("termOut").innerHTML = ""; rt = []; renderProblems(); };
  $("hidePanelBtn").onclick = togglePanel;

  /* ---------- Output tab (graphics / preview) ---------- */
  function openOutput(html) { $("outFrame").srcdoc = html; showPanel("output"); }

  function buildPreview() {
    const name = ext(active) === "html" || ext(active) === "htm" ? active
      : Object.keys(files).find(n => ext(n) === "html" || ext(n) === "htm");
    let html = name ? files[name] : '<!doctype html><html><head><meta charset="utf-8"></head><body><h1>Preview</h1></body></html>';
    html = html
      .replace(/<link[^>]+href=["']([^"']+)["'][^>]*>/gi, (m, h) => files[h] !== undefined ? `<style>${files[h]}</style>` : m)
      .replace(/<script[^>]+src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (m, s) =>
        files[s] !== undefined ? `<script>${files[s].replace(/<\/script/gi, "<\\/script")}<\/script>` : m);
    return html;
  }

  async function showFigures(py) {
    try {
      const imgs = py.runPython(
        'import matplotlib.pyplot as plt, io, base64\n' +
        'o = []\n' +
        'for n in plt.get_fignums():\n' +
        '    b = io.BytesIO(); plt.figure(n).savefig(b, format="png", bbox_inches="tight")\n' +
        '    o.append(base64.b64encode(b.getvalue()).decode())\n' +
        'plt.close("all")\no'
      ).toJs();
      if (imgs.length) openOutput(
        '<body style="margin:0;background:#fff;text-align:center">' +
        imgs.map(i => `<img style="max-width:100%" src="data:image/png;base64,${i}">`).join("") + "</body>");
    } catch {}
  }

  /* ---------- Run ---------- */
  async function runPython(code) {
    showPanel("term");
    rt = []; renderProblems();
    $("termOut").innerHTML = "";
    const btn = $("runBtn");
    btn.disabled = true; btn.textContent = "Running…";
    const t0 = performance.now(); term("$ python " + active, "dim");
    try {
      if (!window.loadPyodide) {
        term("Loading Python engine…", "dim");
        await new Promise((res, rej) => {
          const sc = document.createElement("script");
          sc.src = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";
          sc.onload = res;
          sc.onerror = () => rej(new Error("Python runtime did not load. Check your internet connection and reload."));
          document.head.appendChild(sc);
        });
      }
      if (!window.vszkbPyodide) {
        term("Starting Python… (first run may take a little while)", "dim");
        const bases = [null, "https://cdn.jsdelivr.net/npm/pyodide@0.27.7/", "https://unpkg.com/pyodide@0.27.7/"];
        let lastErr = null;
        for (const b of bases) {
          try { delete globalThis.__pyodideLoading; window.vszkbPyodide = await (b ? loadPyodide({indexURL: b}) : loadPyodide()); break; }
          catch (e) { lastErr = e; term("Could not download the Python engine, trying another server…", "dim"); }
        }
        if (!window.vszkbPyodide) throw new Error("Python engine could not be downloaded (" + (lastErr && lastErr.message ? lastErr.message : lastErr) + "). Check your internet, or try another network/VPN, then press Run again.");
      }
      const py = window.vszkbPyodide;
      py.setStdout({batched: (t) => term(t)});
      py.setStderr({batched: (t) => term(t, "err")});
      py.runPython('import os, warnings\nos.environ["MPLBACKEND"] = "AGG"\nwarnings.filterwarnings("ignore")');
      py.globals.set("__vszkb_input", readInput);
      await py.loadPackagesFromImports(code);
      try {
        await py.runPythonAsync(code.replace(/\binput\s*\(/g, "await __vszkb_input("));
      } catch (err) {
        const m = String(err).trim();
        term(m, "err");
        const ln = [...m.matchAll(/line (\d+)/g)].pop();
        rt.push({sev: 8, line: ln ? +ln[1] : 1, msg: m.split("\n").pop(), file: active});
        renderProblems();
      } finally {
        py.globals.delete("__vszkb_input");
      }
      term("— finished in " + ((performance.now() - t0) / 1000).toFixed(2) + "s —", "dim");
      if (/matplotlib/.test(code)) await showFigures(py);
    } catch (err) {
      term("Could not run Python: " + err.message, "err");
    } finally {
      btn.disabled = false; btn.innerHTML = "<span>▶</span> Run";
    }
  }
  function runCode() {
    if (!active) return;
    files[active] = getCode(); sched();
    const l = lang(active);
    if (l === "python") runPython(files[active]);
    else if (l === "javascript" && !usedByPage(active)) runJS(files[active]);
    else if (["html", "css", "javascript"].includes(l)) openOutput(buildPreview());
    else {
      showPanel("term");
      term(`Run is not configured for .${ext(active)} files yet. Supported: .py, .html, .css, .js`, "err");
    }
  }
  $("runBtn").onclick = runCode;

  function downloadCurrent() {
    files[active] = getCode();
    const url = URL.createObjectURL(new Blob([files[active]], {type: "text/plain;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = active; a.click();
    URL.revokeObjectURL(url);
  }
  $("downloadBtn").onclick = downloadCurrent;

  /* ---------- Settings ---------- */
  function toggleExplorer() {
    const h = $("explorer").classList.toggle("hidden");
    $("setExp").textContent = h ? "Show Explorer" : "Hide Explorer";
  }
  function togglePanel() {
    const h = $("panel").classList.toggle("hidden");
    $("setPanel").textContent = h ? "Show Terminal" : "Hide Terminal";
  }
  function toggleTheme() {
    const light = document.body.classList.toggle("light");
    $("setTheme").textContent = light ? "Switch to Dark Mode" : "Switch to Light Mode";
    if (mReady) monaco.editor.setTheme(light ? "vs" : "vs-dark");
    prefs.light = light; applyPrefs();
  }
  $("setExp").onclick = toggleExplorer;
  $("setPanel").onclick = togglePanel;
  $("setTheme").onclick = toggleTheme;
  $("settingsBtn").onclick = () => $("settingsMenu").classList.toggle("hidden");
  document.addEventListener("click", (e) => {
    if (!$("settingsMenu").contains(e.target) && !$("settingsBtn").contains(e.target))
      $("settingsMenu").classList.add("hidden");
  });

  /* ---------- Keyboard + fallback editor ---------- */
  $("plainEditor").addEventListener("input", () => { files[active] = $("plainEditor").value; sched(); });
  $("plainEditor").addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const t = e.target; t.setRangeText("    ", t.selectionStart, t.selectionEnd, "end");
      files[active] = t.value; sched();
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (active) files[active] = getCode(); save(); }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode(); }
  });

  /* ---------- Word lists (used by suggestions) ---------- */
    const W = (x) => x.split(" ");
    const mods = W("abc argparse array ast asyncio base64 bisect calendar cmath collections colorsys copy csv dataclasses datetime decimal difflib enum fractions functools hashlib heapq html io itertools json keyword logging math matplotlib numpy operator os pandas pathlib pickle pprint queue random re scipy secrets shutil statistics string struct sys tempfile textwrap threading time timeit traceback types typing unittest urllib uuid warnings zlib");
    const kw = W("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield");
    const bi = W("abs all any bin bool chr dict dir enumerate filter float format input int isinstance len list map max min open ord pow print range repr reversed round set sorted str sum tuple type zip");
    const subs = {matplotlib: W("pyplot cm colors patches animation"), os: W("path"), numpy: W("random linalg")};
    const mem = {
      plt: W("plot show figure title xlabel ylabel legend grid bar barh hist scatter pie subplot subplots savefig xlim ylim axis imshow tight_layout text annotate"),
      pyplot: W("plot show figure title xlabel ylabel legend grid bar barh hist scatter pie subplot subplots savefig xlim ylim axis imshow tight_layout text annotate"),
      math: W("pi e sqrt sin cos tan log log10 floor ceil factorial pow fabs radians degrees gcd inf"),
      random: W("random randint choice shuffle uniform sample seed randrange"),
      np: W("array arange linspace zeros ones sin cos tan sqrt mean sum max min pi random reshape dot"),
      numpy: W("array arange linspace zeros ones sin cos tan sqrt mean sum max min pi random reshape dot"),
      os: W("path listdir getcwd mkdir remove rename environ sep"),
      time: W("time sleep strftime localtime perf_counter"),
      sys: W("argv exit path version platform")
    };
    const LISTS = {
      python: [...kw, ...bi, ...mods],
      javascript: W("const let var function return if else for while class new this async await console document window addEventListener querySelector getElementById setTimeout JSON Math Array Object String Number"),
      html: W("div span p h1 h2 h3 a img ul ol li button input form table section header footer nav main script style link meta class id href src"),
      css: W("color background margin padding border display flex grid font-size width height position align-items justify-content text-align"),
      c: W("include stdio.h stdlib.h string.h int main printf scanf return for while if else void char float double struct sizeof"),
      cpp: W("include iostream vector string using namespace std cout cin endl int main return for while if else class struct auto"),
      java: W("public static void main class String System.out.println int double boolean return for while if else new import")
    };

  /* ---------- Python autocomplete ---------- */
  function setupPython() {
    const K = monaco.languages.CompletionItemKind;
    monaco.languages.registerCompletionItemProvider("python", {
      triggerCharacters: ["."],
      provideCompletionItems(model, pos) {
        const w = model.getWordUntilPosition(pos);
        const range = {startLineNumber: pos.lineNumber, endLineNumber: pos.lineNumber, startColumn: w.startColumn, endColumn: w.endColumn};
        const line = model.getLineContent(pos.lineNumber).slice(0, pos.column - 1);
        const mk = (list, kind) => ({suggestions: list.map(l => ({label: l, kind, insertText: l, range}))});
        let m = line.match(/^\s*from\s+([\w.]+)\s+import\s+\w*$/);
        if (m) return mk(subs[m[1]] || mem[m[1]] || [], K.Module);
        m = line.match(/([\w.]+)\.\w*$/);
        if (m) {
          const isImp = /^\s*(import|from)\s/.test(line);
          return mk((isImp ? subs[m[1]] : mem[m[1].split(".").pop()] || subs[m[1]]) || [], isImp ? K.Module : K.Method);
        }
        if (/^\s*(import|from)\s+\w*$/.test(line)) return mk(mods, K.Module);
        const words = [...new Set(model.getValue().match(/[A-Za-z_]\w{2,}/g) || [])]
          .filter(x => x !== w.word && !kw.includes(x) && !bi.includes(x));
        return {suggestions: [
          ...kw.map(l => ({label: l, kind: K.Keyword, insertText: l, range})),
          ...bi.map(l => ({label: l, kind: K.Function, insertText: l, range})),
          ...words.map(l => ({label: l, kind: K.Variable, insertText: l, range}))
        ]};
      }
    });
  }

  /* ---------- Preferences, phone editor, JS console ---------- */
  const isPhone = navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 700;
  const PREF = "vszkb-prefs-v1";
  let prefs = {suggest: true, size: 13, wrap: true, light: false};
  try { prefs = {...prefs, ...JSON.parse(localStorage.getItem(PREF) || "{}")}; } catch {}
  const extraCss = document.createElement("style");
  extraCss.textContent = ".fallback{flex-direction:column}#sugBar{display:flex;gap:6px;overflow-x:auto;touch-action:pan-x;touch-action:pan-x;padding:6px 8px;background:var(--panel);border-top:1px solid var(--line)}#sugBar button{flex:0 0 auto;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:14px;padding:6px 12px;font:13px Consolas,monospace}@media (max-width:760px){.topbar{padding:4px 8px}.panel{height:190px}.add-form input{width:110px}}";
  document.head.appendChild(extraCss);

  const sugBar = document.createElement("div"); sugBar.id = "sugBar"; sugBar.className = "hidden";
  $("fallbackEditor").appendChild(sugBar);
  function updateBar() {
    const t = $("plainEditor"); sugBar.innerHTML = "";
    if (!prefs.suggest || $("fallbackEditor").classList.contains("hidden")) return sugBar.classList.add("hidden");
    const pos = t.selectionStart, cur = (t.value.slice(0, pos).match(/[\w.]*$/) || [""])[0];
    if (!cur) return sugBar.classList.add("hidden");
    const dot = cur.lastIndexOf("."), part = cur.slice(dot + 1);
    const pool = dot >= 0 ? (mem[cur.slice(0, dot).split(".").pop()] || [])
      : [...new Set([...(LISTS[lang(active)] || []), ...(t.value.match(/[A-Za-z_]\w{2,}/g) || [])])];
    const hits = pool.filter(x => x.startsWith(part) && x !== part).slice(0, 12);
    sugBar.classList.toggle("hidden", !hits.length);
    hits.forEach(w => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = w;
           b.onmousedown = (e) => e.preventDefault();
      b.onclick = () => {
        t.focus({preventScroll: true});
        if (!document.execCommand("insertText", false, w.slice(part.length))) {
          t.setRangeText(w.slice(part.length), pos, pos, "end");
          files[active] = t.value; sched(); updateBar();
        }
      };
      sugBar.appendChild(b);
    });
  }
  // Enter keeps the indentation of the previous line; after ":" (Python) or "{ ( [" it adds 4 spaces
  $("plainEditor").addEventListener("beforeinput", (e) => {
    if (e.inputType !== "insertLineBreak" && e.inputType !== "insertParagraph") return;
    e.preventDefault();
    const t = e.target, before = t.value.slice(0, t.selectionStart);
    const line = before.slice(before.lastIndexOf("\n") + 1), trim = line.trimEnd();
    let ind = (line.match(/^[ \t]*/) || [""])[0];
    if (lang(active) === "python" ? trim.endsWith(":") : /[{(\[]$/.test(trim)) ind += "    ";
    if (!document.execCommand("insertText", false, "\n" + ind)) {
      t.setRangeText("\n" + ind, t.selectionStart, t.selectionEnd, "end");
      files[active] = t.value; sched(); updateBar();
    }
  });

  const fi = document.createElement("input"); fi.type = "file"; fi.multiple = true; fi.hidden = true;
  document.body.appendChild(fi);
  fi.onchange = async () => {
    let last = "";
    for (const f of fi.files) {
      if (f.size > 1e6) { alert(f.name + " is too large (max 1 MB)."); continue; }
      let n = f.name; while (files[n] !== undefined) n = n.replace(/(\.[^.]*)?$/, "-copy$1");
      files[n] = await f.text(); last = n;
    }
    fi.value = ""; renderFiles(); if (last) openFile(last);
  };

  const menu = $("settingsMenu");
  const mkBtn = (fn, text) => { const b = document.createElement("button"); b.type = "button"; b.onclick = fn; if (text) b.textContent = text; menu.appendChild(b); return b; };
  const bSug = mkBtn(() => { prefs.suggest = !prefs.suggest; applyPrefs(); });
  const bWrap = mkBtn(() => { prefs.wrap = !prefs.wrap; applyPrefs(); });
  mkBtn(() => { prefs.size = Math.min(26, prefs.size + 1); applyPrefs(); }, "Font size +");
  mkBtn(() => { prefs.size = Math.max(10, prefs.size - 1); applyPrefs(); }, "Font size −");
  mkBtn(() => {
    if (!mReady) return alert("Format code is available in the desktop editor.");
    const a = editor.getAction("editor.action.formatDocument"); if (a) a.run();
  }, "Format code");
  mkBtn(() => fi.click(), "Open file from device");
  mkBtn(downloadCurrent, "Download file");
  $("downloadBtn").classList.add("hidden");
  $("runBtn").title = "Run (Ctrl+Enter)";
  if (!document.querySelector('link[rel~="icon"]')) {
    const ic = document.createElement("link"); ic.rel = "icon"; ic.href = "./static/zikim-logo.png"; document.head.appendChild(ic);
  }
  function applyPrefs() {
    try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch {}
    bSug.textContent = "Suggestions: " + (prefs.suggest ? "ON" : "OFF");
    bWrap.textContent = "Word wrap: " + (prefs.wrap ? "ON" : "OFF");
    $("plainEditor").style.fontSize = prefs.size + "px";
    if (mReady) editor.updateOptions({fontSize: prefs.size, wordWrap: prefs.wrap ? "on" : "off",
      quickSuggestions: prefs.suggest, suggestOnTriggerCharacters: prefs.suggest,
      wordBasedSuggestions: prefs.suggest ? "currentDocument" : "off"});
    updateBar();
  }

  /* plain JavaScript (console) runs in a hidden sandbox; websites keep using the Output tab */
  const usedByPage = (n) => Object.keys(files).some(f => /^html?$/.test(ext(f)) &&
    (files[f].includes('"' + n + '"') || files[f].includes("'" + n + "'")));
  window.addEventListener("message", (e) => {
    const d = e.data; if (d && d.__vszkb) term(d.text, d.err ? "err" : "");
  });
  function runJS(code) {
    showPanel("term"); $("termOut").innerHTML = ""; rt = []; renderProblems();
    const f = document.createElement("iframe"); f.sandbox = "allow-scripts"; f.hidden = true;
    const boot = 'const __s=(t,e)=>parent.postMessage({__vszkb:1,text:t,err:e},"*");' +
      'const __f=a=>a.map(x=>typeof x==="object"?JSON.stringify(x):String(x)).join(" ");' +
      'console.log=(...a)=>__s(__f(a));console.error=(...a)=>__s(__f(a),1);console.warn=console.log;' +
      'window.onerror=(m,u,l)=>{__s(m+" (line "+l+")",1)};';
    f.srcdoc = "<script>" + boot + "<\/script><script>" + code.replace(/<\/script/gi, "<\\/script") + "<\/script>";
    document.body.appendChild(f); setTimeout(() => f.remove(), 10000);
  }

  /* ---------- Ads (Google AdSense) ---------- */
  // Fill these two values after AdSense approves your site. Until then the "Ad space" placeholder stays.
  const ADS = {client: "", slot: ""};   // client: "ca-pub-XXXXXXXXXXXXXXXX", slot: "XXXXXXXXXX"
  if (ADS.client && ADS.slot) {
    const sc = document.createElement("script");
    sc.async = true; sc.crossOrigin = "anonymous";
    sc.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADS.client;
    document.head.appendChild(sc);
    const box = document.querySelector(".ad-slot");
    box.style.flexBasis = "90px";
    box.innerHTML = '<ins class="adsbygoogle" style="display:block;width:100%;height:90px" data-ad-client="' + ADS.client +
      '" data-ad-slot="' + ADS.slot + '" data-full-width-responsive="true"></ins>';
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }

  /* ---------- Start ---------- */
  renderFiles(); renderProblems();
  function fallback() {
    $("editor").classList.add("hidden");
    $("fallbackEditor").classList.remove("hidden");
    $("plainEditor").value = files[active] || "";
  }
  if (window.require && !isPhone) {
    window.MonacoEnvironment = {
      getWorkerUrl: () => "data:text/javascript;charset=utf-8," + encodeURIComponent(
        `self.MonacoEnvironment={baseUrl:"${M}"};importScripts("${M}vs/base/worker/workerMain.js");`)
    };
    require.config({paths: {vs: M + "vs"}});
    require(["vs/editor/editor.main"], function () {
      mReady = true;
      setupPython();
      editor = monaco.editor.create($("editor"), {
        value: files[active] || "", language: lang(active), theme: prefs.light ? "vs" : "vs-dark",
        automaticLayout: true, minimap: {enabled: false}, fontFamily: "Fira Code, Consolas, monospace",
        fontSize: prefs.size, tabSize: 4, wordWrap: prefs.wrap ? "on" : "off", scrollBeyondLastLine: false, padding: {top: 12},
        quickSuggestions: prefs.suggest, suggestOnTriggerCharacters: prefs.suggest,
        wordBasedSuggestions: prefs.suggest ? "currentDocument" : "off",
        bracketPairColorization: {enabled: true}, smoothScrolling: true, cursorSmoothCaretAnimation: "on",
        formatOnPaste: true, guides: {indentation: true}, renderWhitespace: "selection"
      });
      editor.onDidChangeModelContent(() => { if (active) { files[active] = editor.getValue(); sched(); } });
      editor.onDidChangeCursorPosition(e => $("cursorStatus").textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`);
      monaco.editor.onDidChangeMarkers(() => {
        marks = monaco.editor.getModelMarkers({}).map(m => ({sev: m.severity, line: m.startLineNumber, msg: m.message, file: active}));
        renderProblems();
      });
    }, fallback);
  } else fallback();
  if (prefs.light) { document.body.classList.add("light"); $("setTheme").textContent = "Switch to Dark Mode"; }
  applyPrefs(); save();
})();
