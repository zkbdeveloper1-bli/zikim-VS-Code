# VS-ZKB Code Studio

A browser-based coding-editor starter project with:
- Monaco Editor (VS Code's editor component) loaded from a CDN
- Python execution through a local Flask backend
- HTML/CSS/JavaScript preview in a sandboxed iframe
- File tabs, simple file creation/rename/delete, local browser autosave, and file download

## Run on Windows

1. Install Python 3.10 or newer from https://www.python.org/downloads/ (enable "Add Python to PATH").
2. Extract this project ZIP.
3. Open the `VS-ZKB-Code-Studio` folder in VS Code.
4. Open VS Code Terminal (`Terminal > New Terminal`).
5. Run:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   python app.py
   ```

   If PowerShell blocks activation, you can skip activation and run:
   ```powershell
   py -m pip install -r requirements.txt
   py app.py
   ```

6. Open http://127.0.0.1:5000 in your browser.
7. To stop the server, return to the terminal and press `Ctrl+C`.

## How to use

- Select a file from Explorer.
- Edit the code in the main editor.
- Press **Run** or `Ctrl+Enter`.
- Python output appears under **OUTPUT**.
- HTML/CSS/JS runs in **PREVIEW**.
- Files are saved in this browser's local storage. Use **Download file** to save the current file to your computer.
- Right-click a file in Explorer to rename or delete it.
- Use `Ctrl+S` to save changes locally.

## Important security limitation

**This is a local-development starter, not a safe public multi-user Python execution service.**
The `/api/run-python` endpoint executes submitted Python on the computer running Flask. Do not deploy this endpoint publicly as-is. Before publishing online, move Python execution into a properly isolated sandbox/container with CPU, memory, filesystem, network, and time limits, plus authentication/rate limits. Hosting the frontend and the Python runner may require separate services. Never put secrets in browser code.
