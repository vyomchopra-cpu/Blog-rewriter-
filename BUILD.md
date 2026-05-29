# Build & Distribute — runbook

Two platforms, two build machines. **A `.exe` only runs on Windows; a `.app` only runs on macOS.** You must build each on its own OS.

The shared API key lives in `src/main/bundled-config.json` (gitignored, so it is NOT in this repo). **Every build machine needs its own copy** or the build ships with no key.

---

## 0. Create the baked-key file (once per build machine)
Copy the template and paste the key:
```
cp src/main/bundled-config.example.json src/main/bundled-config.json
```
Then edit `src/main/bundled-config.json` and set `anthropicApiKey` to the real key. Keep `model` = `claude-sonnet-4-5-20250929` and `fastModel` = `claude-haiku-4-5-20251001`.

---

## 1. Windows build (.exe) — on a Windows PC
Node 18+ installed. From the project folder:
```
npm install
npm run build            # or: npx electron-builder --win dir
```
Then zip `release\win-unpacked\` and share. Writers: unzip → run `Blog Generator.exe` → SmartScreen → More info → Run anyway.

**Gotchas on a locked machine (already solved on the current build box):**
- `keytar` was removed (native module; won't compile when the user path has a space). WP password falls back to local storage. Don't re-add it.
- electron-builder's `winCodeSign` toolkit fails to extract without symlink privilege. Fix: extract any `*.7z` in `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\` into a folder named `winCodeSign-2.6.0` (ignore the 2 macOS symlink errors), then rebuild.
- Use the **`dir`** target (`--win dir`); the installer/portable targets need the signing toolkit.

## 2. macOS build (.app) — on a Mac
Node 18+ installed (nodejs.org). Then:
```
git clone https://github.com/vyomchopra-cpu/Blog-rewriter-.git
cd Blog-rewriter-
cp src/main/bundled-config.example.json src/main/bundled-config.json   # then paste the key into it
./scripts/build-mac.sh      # or: npm install && npx electron-builder --mac dir
```
Output: `release/mac*/Blog Generator.app`. Zip it and share. Mac writers:
- First open: **right-click the app → Open** (Gatekeeper warns because it's unsigned).
- If macOS says it's "damaged / can't be opened": clear the quarantine flag once:
  ```
  xattr -cr "/Applications/Blog Generator.app"
  ```
- Apple Silicon vs Intel: building on the writer's chip type is simplest. For both, use `npx electron-builder --mac dir --x64 --arm64`.

To just test quickly on the Mac without building: `npm install && npm run dev`.

---

## 3. Weekly update loop
1. Writers: **Context & Feedback → Export weekly feedback file** → send you `WEEKLY-EXPORT-<date>.md`.
2. We tune → commit + push to GitHub.
3. Rebuild: `.exe` on the Windows box, `.app` on the Mac.
4. Writers replace their old app folder with the new one. Their data in `%APPDATA%\Blog Generator\` (Win) or `~/Library/Application Support/Blog Generator/` (Mac) **persists** across updates.
