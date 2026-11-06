# Cloudflare Worker 部署（Groq AI 後端）

> **絕對不要把 `cloudflare-worker/worker.js` 上傳到公開 GitHub Repository。** 它包含正式 AI 模式的私人角色卡與真正案件答案。

## 1. 建立 Worker

1. 登入 Cloudflare Dashboard。
2. 進入 Workers & Pages。
3. 選 Create → Worker（或 Create application → Worker）。
4. 建立一個 Worker，例如命名 `ai-murder-mystery`。
5. 部署初始 Worker 後，進入 Edit code。
6. 在本機打開完整專案中的 `cloudflare-worker/worker.js`，複製全部程式碼，貼到 Cloudflare 編輯器，取代預設範例。
7. 按 Deploy。

## 2. 設定 SESSION_SECRET

1. 打開該 Worker 的 Settings → Variables and Secrets。
2. 新增 Secret：
   - Name：`SESSION_SECRET`
   - Value：自行產生一段至少 32 字元的隨機字串（建議 40～64 字元以上）。
3. 儲存並重新部署（如果 Dashboard 提示需要）。

此值用來簽署遊戲工作階段 Token，不是 Groq API Key。不要公開分享。

## 3. 確認允許的網站來源

Worker 檔案最上方 `ALLOWED_ORIGINS` 已經放入本專案的 GitHub Pages Origin：

```js
"https://ssu506195-collab.github.io"
```

注意 Origin 不包含 `/AI_Murder_Mystery/` 路徑。如果你日後更換 GitHub 帳號、網域或本機測試來源，需同步修改此陣列後重新部署。

## 4. 測試 Worker

將 `https://你的-worker.你的子網域.workers.dev` 在瀏覽器開啟並加上 `/health`，例如：

```text
https://ai-murder-mystery.example.workers.dev/health
```

預期回傳 JSON：

```json
{"ok":true,"service":"AI Murder Mystery Worker","version":"2.0"}
```

若出現 `Origin not allowed`，直接在瀏覽器網址列打開可能會因沒有 GitHub Pages Origin 被拒絕；請從已部署的 GitHub Pages 遊戲設定中按「測試 Worker 與 Groq 連線」驗證。

## 5. 玩家設定自己的 Groq Key

1. 每位玩家各自前往 https://console.groq.com/keys 建立 API Key。
2. 開啟 GitHub Pages 遊戲，點右上角設定。
3. 選 Groq AI 模式。
4. 貼上自己的 Worker URL、個人的 Groq API Key，選擇模型。
5. 按「測試 Worker 與 Groq 連線」。
6. 成功後儲存設定並開始遊戲。

### Key 的處理方式

- Key 不寫入 localStorage，不放入網址、不放進公開 GitHub 檔案。
- 瀏覽器將 Key 放在 `X-Groq-User-Key` HTTPS Header，傳給玩家填入的 Worker URL。
- Worker 只在該次請求中讀取 Key，再轉送 Groq API；本程式沒有將它寫入 KV、D1 或持久資料庫。
- Cloudflare Worker 服務會在傳輸過程中處理該 Header；請只對自己信任、確認程式內容的 Worker 網址輸入 Key。
- 每位玩家使用自己的 Groq Key，因此 Groq Token 使用量由各玩家自己的 Groq 帳號承擔。
- 但大家仍共用你部署的 Cloudflare Worker 服務請求額度。若公開給大量陌生人使用，應加入額外的濫用防護及配額管理。

## 6. 測試與排錯

- `Failed to fetch`：通常是 Worker URL 錯誤、CORS Origin 未加入或 Worker 尚未部署。
- `SESSION_SECRET` 錯誤：檢查 Worker Secret 名稱大小寫是否正確。
- Groq 401：檢查玩家自己的 Groq Key 是否有效。
- Groq 429：可能是玩家自己的 RPM/TPM/TPD 額度不足，稍後再試或降低模型輸出量。
- 找不到劇本：確認網站前端 `data/cases.js` 的 case id 與 Worker 私有資料的 case id 一致。
