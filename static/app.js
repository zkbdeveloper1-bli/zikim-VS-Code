(() => {
  const $ = (id) => document.getElementById(id);
  const starterFiles = {
    "welcome.py": 'print("Hello from VS-ZKB Code Studio!")\n\nname = "Zulqarnain"\nprint("Welcome,", name)\n',
    "index.html": '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My Website</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="card">\n    <h1>Hello, world! 👋</h1>\n    <p>My first website in VS-ZKB Code Studio.</p>\n    <button id="helloBtn">Click me</button>\n    <p id="message"></p>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>\n',
    "style.css": 'body { font-family: Arial, sans-serif; background: #101827; color: #f8fafc; min-height: 100vh; display: grid; place-items: center; margin: 0; }\n.card { text-align: center; padding: 36px; border-radius: 18px; background: #1e293b; box-shadow: 0 20px 60px #0005; }\nbutton { background: #38bdf8; border: 0; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-weight: bold; }\n',
    "script.js": 'document.getElementById("helloBtn").addEventListener("click", () => {\n  document.getElementById("message").textContent = "JavaScript is working!";\n  console.log("Button clicked!");\n});\nconsole.log("Website loaded successfully.");\n'
  };
  let files = {};
  let activeFile = "";
  let openTabs = [];
  let editor = null;
  let monacoReady = false;
  let saveTimer = null;

  try {
    const saved = JSON.parse(localStorage.getItem("vszkb-project-v1") || "null");
    files = saved && saved.files ? saved.files : {...starterFiles};
    openTabs = saved && Array.isArray(saved.openTabs) ? saved.openTabs.filter(n => files[n] !== undefined) : ["welcome.py", "index.html"];
  } catch { files = {...starterFiles}; }
  if (!Object.keys(files).length) files = {...starterFiles};
  if (!openTabs.length) openTabs = [Object.keys(files)[0]];
  activeFile = openTabs[0];

  function saveProject() {
    try {
      localStorage.setItem("vszkb-project-v1", JSON.stringify({files, openTabs}));
      $("saveStatus").textContent = "Saved locally";
    } catch {
      $("saveStatus").textContent = "Browser storage full";
    }
  }
  function scheduleSave() {
    $("saveStatus").textContent = "Saving…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveProject, 250);
  }
  function ext(name) { return (name.split(".").pop() || "").toLowerCase(); }
  function languageFor(name) {
    const e = ext(name);
    return ({py:"python", html:"html", htm:"html", css:"css", js:"javascript", json:"json", md:"markdown", txt:"plaintext"})[e] || "plaintext";
  }
  function fileEmoji(name) {
    return ({py:"🐍", html:"🌐", htm:"🌐", css:"🎨", js:"🟨", json:"{}", md:"M", txt:"≡"})[ext(name)] || "📄";
  }
  function renderTree() {
    const tree = $("fileTree"); tree.innerHTML = "";
    Object.keys(files).sort((a,b) => a.localeCompare(b)).forEach(name => {
      const row = document.createElement("div");
      row.className = "tree-item" + (name === activeFile ? " selected" : "");
      row.title = name;
      const ico = document.createElement("span"); ico.className = "file-icon"; ico.textContent = fileEmoji(name);
      const label = document.createElement("span"); label.textContent = name;
      row.append(ico,label);
      row.addEventListener("click", () => openFile(name));
      row.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const action = prompt(`File: ${name}\nType "rename" to rename, or "delete" to delete:`);
        if (action === "rename") renameFile(name);
        if (action === "delete") deleteFile(name);
      });
      tree.appendChild(row);
    });
  }
  function renderTabs() {
    const tabs = $("tabs"); tabs.innerHTML = "";
    openTabs.forEach(name => {
      const tab = document.createElement("div"); tab.className = "tab" + (name === activeFile ? " active" : "");
      const label = document.createElement("span"); label.textContent = fileEmoji(name) + " " + name;
      label.addEventListener("click", () => openFile(name));
      const close = document.createElement("button"); close.className = "close-tab"; close.textContent = "×"; close.title = "Close tab";
      close.addEventListener("click", e => { e.stopPropagation(); closeTab(name); });
      tab.append(label,close); tabs.appendChild(tab);
    });
    $("breadcrumbs").textContent = activeFile || "";
    $("languageStatus").textContent = languageFor(activeFile || "").replace(/^./, c => c.toUpperCase());
  }
  function openFile(name) {
    if (files[name] === undefined) return;
    if (editor && activeFile) files[activeFile] = editor.getValue();
    activeFile = name;
    if (!openTabs.includes(name)) openTabs.push(name);
    renderTree(); renderTabs();
    if (monacoReady) {
      editor.setValue(files[name]);
      monaco.editor.setModelLanguage(editor.getModel(), languageFor(name));
      editor.focus();
    } else {
      $("plainEditor").value = files[name];
    }
    saveProject();
  }
  function closeTab(name) {
    if (editor && name === activeFile) files[name] = editor.getValue();
    openTabs = openTabs.filter(n => n !== name);
    if (!openTabs.length) openTabs.push(Object.keys(files)[0]);
    const next = openTabs.includes(activeFile) ? activeFile : openTabs[openTabs.length-1];
    activeFile = next;
    renderTabs(); renderTree();
    if (monacoReady) { editor.setValue(files[activeFile] || ""); monaco.editor.setModelLanguage(editor.getModel(), languageFor(activeFile)); }
    else $("plainEditor").value = files[activeFile] || "";
    saveProject();
  }
  function newFile() {
    const name = prompt("New file name (for example: app.py or index.html):");
    if (!name) return;
    if (name.includes("/") || name.includes("\\") || name.trim() !== name) return alert("Use a simple file name without folders.");
    if (files[name] !== undefined) return alert("A file with that name already exists.");
    files[name] = ""; openFile(name); scheduleSave();
  }
  function newFolder() {
    alert("This starter version stores project files in a flat file list. Folder support can be added in the next version.");
  }
  function renameFile(oldName) {
    const newName = prompt("Enter the new file name:", oldName);
    if (!newName || newName === oldName) return;
    if (newName.includes("/") || newName.includes("\\") || files[newName] !== undefined) return alert("Invalid name or a file with that name already exists.");
    files[newName] = files[oldName]; delete files[oldName];
    openTabs = openTabs.map(n => n === oldName ? newName : n);
    if (activeFile === oldName) activeFile = newName;
    renderTree(); renderTabs(); openFile(activeFile); scheduleSave();
  }
  function deleteFile(name) {
    if (!confirm(`Delete ${name} from this browser project?`)) return;
    delete files[name]; openTabs = openTabs.filter(n => n !== name);
    if (!Object.keys(files).length) files["welcome.py"] = 'print("Hello!")\\n';
    if (!openTabs.length) openTabs = [Object.keys(files)[0]];
    activeFile = openTabs[0]; renderTree(); openFile(activeFile); scheduleSave();
  }
  function currentCode() { return monacoReady ? editor.getValue() : $("plainEditor").value; }
  function setOutput(text, type="stdout") {
    const out = $("outputView"); out.innerHTML = "";
    const node = document.createElement("div"); node.className = type; node.textContent = text || (type === "stderr" ? "" : "(No output)");
    out.appendChild(node);
  }
  function appendTerminalText(text, type = "stdout") {
  const out = $("outputView");
  const node = document.createElement("div");
  node.className = type;
  node.textContent = text;
  out.appendChild(node);
  out.scrollTop = out.scrollHeight;
}

function readTerminalInput(promptText = "") {
  return new Promise((resolve) => {
    const out = $("outputView");

    if (promptText) {
      const promptLine = document.createElement("span");
      promptLine.textContent = promptText;
      out.appendChild(promptLine);
    }

    const line = document.createElement("div");
    line.style.display = "flex";
    line.style.gap = "8px";
    line.style.alignItems = "center";

    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "Python terminal input");
    input.style.flex = "1";
    input.style.minWidth = "0";
    input.style.background = "#111827";
    input.style.color = "#ffffff";
    input.style.border = "1px solid #64748b";
    input.style.padding = "8px";
    input.style.font = "inherit";

    line.appendChild(input);
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;

    input.focus();

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;

      event.preventDefault();

      const answer = input.value;
      const answerText = document.createElement("span");
      answerText.textContent = answer;

      line.replaceChildren(answerText);
      resolve(answer);
    });
  });
}
  function showPanel(which) {
    $("outputView").classList.toggle("hidden", which !== "output");
    $("previewView").classList.toggle("hidden", which !== "preview");
    document.querySelectorAll(".panel-tab").forEach(b => b.classList.toggle("active", b.dataset.panel === which));
  }
 
async function runCode() {
  if (!activeFile) return;

  files[activeFile] = currentCode();
  scheduleSave();

  const language = languageFor(activeFile);

  if (language === "python") {
    showPanel("output");
    setOutput("Starting browser-based Python… (first run may take a little while)");

    $("runBtn").disabled = true;
    $("runBtn").textContent = "Running…";

    try {
      if (!window.loadPyodide) {
        throw new Error(
          "Python runtime did not load. Check your internet connection and reload."
        );
      }

      if (!window.vszkbPyodide) {
        window.vszkbPyodide = await loadPyodide();
      }

      const py = window.vszkbPyodide;

      // Clear previous output and errors.
      window.vszkbStdout = "";
      window.vszkbStderr = "";

      // Send Python output directly to the terminal.
      py.setStdout({
        batched: (text) => {
          appendTerminalText(text + "\n");
        }
      });

      py.setStderr({
        batched: (text) => {
          appendTerminalText(text + "\n", "stderr");
        }
      });

      // Provide input() through the terminal.
      py.globals.set(
        "__vszkb_input",
        py.toPy(async (promptText) => {
          return await readTerminalInput(
            String(promptText ?? "")
          );
        })
      );

      let code = files[activeFile];
      appendTerminalText("Checking Python libraries...");

      await py.loadPackagesFromImports(code);
      // Initial support for simple input() calls.
      code = code.replace(
        /\binput\s*\(/g,
        "await __vszkb_input("
      );

      try {
        await py.runPythonAsync(code);
      } catch (err) {
        appendTerminalText(String(err), "stderr");
      } finally {
        py.globals.delete("__vszkb_input");
      }

    } catch (err) {
      appendTerminalText(
        "Could not run Python: " + err.message,
        "stderr"
      );
    } finally {
      $("runBtn").disabled = false;
      $("runBtn").innerHTML = "<span>▶</span> Run";
    }

  } else if (
    ["html", "css", "javascript"].includes(language) ||
    activeFile === "index.html"
  ) {
    const html = buildPreview();
    $("previewFrame").srcdoc = html;
    showPanel("preview");

  } else {
    showPanel("output");

    setOutput(
      `Run is not configured for .${ext(activeFile)} files yet. Supported: .py, .html, .css, .js`,
      "stderr"
    );
  }
}

  function buildPreview() {
    let htmlName = Object.keys(files).find(n => ext(n) === "html" || ext(n) === "htm");
    let html = htmlName ? files[htmlName] : '<!doctype html><html><head><meta charset="utf-8"></head><body><h1>Preview</h1></body></html>';
    const cssName = Object.keys(files).find(n => ext(n) === "css");
    const jsName = Object.keys(files).find(n => ext(n) === "js");
    if (cssName) {
      const style = document.createElement("style"); style.textContent = files[cssName];
      html = html.replace(/<\/head>/i, style.outerHTML + "\n</head>");
      if (!/<\/head>/i.test(html)) html = style.outerHTML + html;
    }
    if (jsName) {
      const script = document.createElement("script"); script.textContent = files[jsName];
      html = html.replace(/<\/body>/i, script.outerHTML + "\n</body>");
      if (!/<\/body>/i.test(html)) html += script.outerHTML;
    }
    return html;
  }
  function downloadCurrent() {
    files[activeFile] = currentCode();
    const blob = new Blob([files[activeFile]], {type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = activeFile; a.click(); URL.revokeObjectURL(url);
  }

  $("newFileBtn").addEventListener("click", newFile);
  $("newFolderBtn").addEventListener("click", newFolder);
  $("runBtn").addEventListener("click", runCode);
  $("downloadBtn").addEventListener("click", downloadCurrent);
  $("clearOutputBtn").addEventListener("click", () => setOutput(""));
  $("togglePanelBtn").addEventListener("click", () => $("outputView").parentElement.classList.toggle("hidden"));
  document.querySelectorAll(".panel-tab").forEach(b => b.addEventListener("click", () => showPanel(b.dataset.panel)));
  $("themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("light");
    if (editor) editor.updateOptions({theme: document.body.classList.contains("light") ? "vs" : "vs-dark"});
  });
  $("searchFocus").addEventListener("click", () => {
    const query = prompt("Search in current file:");
    if (!query) return;
    if (editor) { editor.focus(); editor.getAction("actions.find").run(); }
    else { const i = $("plainEditor").value.indexOf(query); if (i >= 0) $("plainEditor").setSelectionRange(i,i+query.length); }
  });
  $("plainEditor").addEventListener("input", () => { files[activeFile] = $("plainEditor").value; scheduleSave(); });
  $("plainEditor").addEventListener("keydown", e => {
    if (e.key === "Tab") { e.preventDefault(); const t=e.target, start=t.selectionStart, end=t.selectionEnd; t.setRangeText("    ",start,end,"end"); files[activeFile]=t.value; scheduleSave(); }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); files[activeFile]=t.value; saveProject(); }
  });
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (activeFile) files[activeFile]=currentCode(); saveProject(); }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode(); }
  });

  renderTree(); renderTabs();
  if (window.require) {
    require.config({paths:{vs:"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs"}});
    require(["vs/editor/editor.main"], function () {
      monacoReady = true;
      $("fallbackEditor").classList.add("hidden");
      editor = monaco.editor.create($("editor"), {
        value: files[activeFile] || "", language: languageFor(activeFile), theme:"vs-dark",
        automaticLayout:true, minimap:{enabled:false}, fontFamily:"Fira Code, Consolas, monospace",
        fontSize:13, tabSize:4, wordWrap:"on", scrollBeyondLastLine:false,
        padding:{top:12}, roundedSelection:false, renderLineHighlight:"all"
      });
      editor.onDidChangeModelContent(() => {
        if (!activeFile) return;
        files[activeFile] = editor.getValue(); scheduleSave();
      });
      editor.onDidChangeCursorPosition(e => $("cursorStatus").textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`);
      renderTree(); renderTabs();
    }, function () {
      $("editor").classList.add("hidden");
      $("fallbackEditor").classList.remove("hidden");
      $("plainEditor").value = files[activeFile] || "";
    });
  } else {
    $("editor").classList.add("hidden");
    $("fallbackEditor").classList.remove("hidden");
    $("plainEditor").value = files[activeFile] || "";
  }
  saveProject();
})();
