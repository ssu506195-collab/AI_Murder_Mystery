# AI 劇本殺 V2｜視覺小說＋多代理公開推理

這個版本把既有原型升級為較有沉浸感的網頁遊戲。前端可部署在 GitHub Pages；真正的 Groq AI 請求由 Cloudflare Worker 轉送，玩家各自輸入自己的 Groq API Key（BYOK），不共用網站作者的 Groq Key。

## 專案內容

- `site/`：GitHub Pages 靜態網站，包含 `index.html`、CSS、JavaScript、公開劇本資料及圖片。
- `cloudflare-worker/worker.js`：Cloudflare Worker 後端。**不要把這個檔案上傳到公開 GitHub Repository**，因為裡面有 AI 模式使用的私人角色卡及真相資料。
- `DEPLOY_GITHUB_PAGES.md`：將前端部署到 GitHub Pages 的步驟。
- `DEPLOY_CLOUDFLARE_WORKER.md`：將 Worker 部署到 Cloudflare 的步驟。
- `GAME_RULES_AND_NOTES.md`：遊戲流程、規則與目前版本限制。

## 先認識這版功能

1. 劇本選單：目前有三個原創測試案件，每個案件五名可抽選角色。
2. 角色分配：玩家可隨機抽角色，也可手動選擇（測試用）；玩家可能抽到真正兇手。
3. 第一視角序章：以山莊書房場景呈現旁白，逐字顯示；按「繼續」可逐段閱讀。
4. 角色介紹：五位角色依序登場，顯示立繪、姓名、身分、與死者關係及固定自我介紹。
5. 公開調查：兩輪調查，每輪五位角色依序輪流詢問；每組最多三次問答。所有對話公開。
6. 玩家互動：玩家輪到詢問時可選對象、輸入問題；AI 也可能選擇玩家作為詢問對象，玩家要公開回答。
7. 詢問限制：同一輪中，每名被詢問者最多接受兩位不同詢問者；第二輪開始時重置名額。
8. 線索：開場公開第一批線索；第一輪結束後公開第二批線索。
9. 最終階段：NPC 依自己的角色卡與公開資訊提出最後陳述並各自投票；玩家最後獨立投票。
10. 揭曉：公布全體投票、真正兇手、動機、時間線及各角色秘密。
11. 模擬模式：不需要 API Key，可先試完整流程。
12. Groq AI 模式：玩家輸入自己的 Key，透過 Worker 呼叫 Groq；Key 不會寫入 localStorage。

## 最重要的部署原則

**公開 GitHub Repository 只放 `site/` 資料夾裡面的內容。不要把 `cloudflare-worker/worker.js` 放進公開 Repository。**

正式 AI 模式的私人角色卡及兇手真相在 Worker 中；公開前端只有角色公開介紹與線索。模擬模式的 `site/data/demo-private.js` 是公開測試資料，裡面故意放了與 AI 模式不同的假真相，不能用來保密正式案件。

## 快速開始

### 先用模擬模式

1. 下載完整 ZIP 並解壓縮。
2. 將 `site/` 內所有檔案及資料夾上傳到 GitHub Repository 根目錄。
3. GitHub Repository → Settings → Pages → Deploy from a branch → `main` → `/(root)`。
4. 等待部署完成後開啟 GitHub Pages 網址。
5. 先選「模擬模式」完成一局，確認畫面及遊戲流程。

### 再啟用 Groq AI 模式

1. 依 `DEPLOY_CLOUDFLARE_WORKER.md` 將 Worker 程式貼到 Cloudflare Dashboard 並部署。
2. 在 Worker 設定 `SESSION_SECRET` Secret。
3. 到 Groq Console 建立自己的 API Key。
4. 開啟遊戲設定，選擇 Groq AI 模式，輸入 Worker 網址、自己的 Groq Key 及模型，按「測試 Worker 與 Groq 連線」。
5. 連線成功後開始案件。

Groq API Key 由每位玩家自行提供。網站作者不會因其他人使用自己的 Groq Key 而消耗作者的 Groq Token；但所有玩家的請求會使用網站作者部署的 Cloudflare Worker 請求額度。

## 圖片替換

目前山莊案件使用 `site/assets/scene/manor-temp.webp`。劇院及列車案件暫時也引用這張山莊場景作為佔位圖。五張角色圖位於 `site/assets/portraits/`。

未來新增圖片時，可直接覆蓋同名檔案（維持尺寸與路徑即可），或修改 `site/data/cases.js` 裡的 `scene`、`cover`、`portrait` 路徑。無須修改遊戲邏輯。

## 技術架構

- 前端：HTML、CSS、JavaScript（GitHub Pages）
- AI Gateway：Cloudflare Worker
- 模型：Groq Chat Completions API（預設 `openai/gpt-oss-20b`）
- 資料：公開劇本 JSON/JS；私人角色卡與真相保存在 Worker 程式；遊戲中的公開紀錄與角色簡短記憶由前端管理並逐次傳送
- 安全：Groq Key 只在目前頁面的 JavaScript 記憶體中，透過 HTTPS Header 傳給 Worker；Worker 不寫入 KV/D1、不回傳 Key、不主動記錄 Key

## 測試狀態與限制

已完成 JavaScript 語法檢查、劇本與圖片路徑檢查，以及使用模擬 Groq 回應的 Worker API 測試（health、game/start、choose、answer、followup、finalize、reveal）。這個執行環境無法完成實際瀏覽器互動測試及真實 Groq 帳號呼叫，因此部署後仍需由使用者實際測試。

目前三個案件皆為本專案的原創測試內容；劇院與列車場景圖片暫時共用山莊圖。AI 生成內容仍可能出現不一致，系統有角色卡與真相隔離，但不能保證 LLM 永遠不幻覺。模擬模式的答案是固定腳本，只用於檢查介面和流程。
