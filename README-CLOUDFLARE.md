# VS-ZKB Code Studio — Cloudflare Pages edition

This edition is adapted to deploy as a static site on Cloudflare Pages.

## Deploy
1. Sign in to Cloudflare and open **Workers & Pages**.
2. Create a Pages project and upload/connect the project files in this folder (the folder containing `index.html` and `static/`).
3. No build command is needed for this static version; the output directory is the project root.
4. Open the provided `*.pages.dev` address to test it.

## Important differences
- HTML/CSS/JavaScript preview runs in the browser.
- Python is executed in the visitor's browser using Pyodide/WebAssembly; this version does **not** run Python on a Cloudflare server and does not require the Flask backend for basic demos.
- First Python run downloads the runtime and can take a while. An internet connection is required.
- This is suitable for learning/basic Python snippets. Some packages or OS-level features will not work, and long-running/infinite loops may freeze the browser tab. Do not use it as a production-grade online judge or promise that every Python library works.
- Files remain in browser local storage on that device; there is no cloud account/file sync.
- Monaco Editor, fonts and Pyodide load from external CDNs.
- Ads/monetization are separate from hosting. Ad network approval and current platform terms still apply; free hosting is not a lifetime guarantee.

## Original Flask edition
The original `app.py` runner executes submitted code with subprocess and is not included in this static deployment. Do not expose that original runner publicly without a proper isolated sandbox and resource limits.
