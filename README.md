# AI 劇本殺（GitHub Pages 前端）

這個資料夾的內容就是 GitHub Pages 網站。部署時，請把本資料夾內的檔案與資料夾全部放到 Repository 根目錄。

## 部署

1. GitHub Repository → Settings → Pages。
2. Source 選 `Deploy from a branch`。
3. Branch 選 `main`，Folder 選 `/(root)`。
4. 存檔並等待 Pages 部署完成。

## Groq AI 模式

本網站支援模擬模式及 Groq AI 模式。

- 模擬模式不需要 API Key，可測試劇情流程。
- Groq AI 模式需要玩家自己的 Groq API Key，以及已部署的 Cloudflare Worker URL。
- API Key 僅保存在目前頁面記憶體，不寫入 localStorage 或 GitHub。

Cloudflare Worker 程式不在這個資料夾。請從完整專案 ZIP 的 `cloudflare-worker/worker.js` 複製到 Cloudflare Worker Dashboard。**不要將 Worker 程式上傳到公開 Repository**，因為正式 AI 模式的私人角色卡及案件真相放在 Worker 端。

完整部署方式請參考完整專案中的 `DEPLOY_CLOUDFLARE_WORKER.md`。

## 圖片

目前三個案件暫時共用 `assets/scene/manor-temp.webp` 作為場景圖；角色使用 `assets/portraits/` 中的五張立繪。未來更換圖片時可覆蓋相同檔名，或修改 `data/cases.js` 的圖片路徑。
