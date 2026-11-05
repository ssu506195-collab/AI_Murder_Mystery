# AI 劇本殺｜GitHub Pages Demo

這是「AI 劇本殺：多代理式智慧推理遊戲」的 **GitHub Pages 靜態演示版**。

## 重要：這個版本可以做什麼？

- 直接部署到 GitHub Pages，使用瀏覽器遊玩。
- 不需要安裝 Python、不需要建立伺服器、不需要 Groq API Key。
- 包含 1 位玩家與 4 位嫌疑犯角色。
- 固定案件開場與角色自我介紹。
- 四名角色依序選擇詢問對象。
- 每組最多三次公開問答，包含原問題及最多兩次追問。
- 每名嫌疑犯每輪最多接受兩名不同角色詢問。
- 調查中途公開第二批線索。
- 最後陳述、玩家投票、真相揭曉。
- 透過瀏覽器 `localStorage` 記住目前遊戲進度。
- 模擬版 Token 使用量固定為 0。

## 重要限制

GitHub Pages 是靜態網站服務，只能直接託管 HTML、CSS、JavaScript 等靜態內容，不能在 Pages 上執行這個專案的 Python / FastAPI 後端。

因此本版本的角色問答是**預先設計的模擬回覆**，用來驗證網頁、流程、公開紀錄及投票機制；它不是即時 Groq LLM 對話。若要使用真正的 Groq AI，必須另外部署 FastAPI 後端（例如 Render、Railway 或其他支援 Python 的服務），讓 GitHub Pages 前端透過 HTTPS 呼叫後端。Groq API Key 必須只存放在後端環境變數，絕對不要放入 `game.js`、HTML 或公開 repository。

> 本演示版的案件 JSON 會被瀏覽器下載，其中包含測試案件的真相與角色秘密。這份內容是自行創作的測試劇本，因此可供課堂展示；但這種靜態做法不適合需要對玩家保密答案的正式多人競賽。正式版本應將完整真相與私人角色卡保存在後端。

## 方式一：部署到 GitHub Pages（建議）

1. 在 GitHub 建立一個新的 **Public** repository，例如 `ai-murder-mystery`。
2. 將本資料夾中的所有檔案與資料夾上傳至 repository 根目錄。確認 `index.html` 位於根目錄，而不是再包一層子資料夾。
3. 將預設分支命名為 `main`。
4. 開啟 repository 的 **Settings → Pages**。
5. 在 **Build and deployment → Source** 選擇 **GitHub Actions**。
6. 確認 `.github/workflows/deploy.yml` 已經上傳。每次推送到 `main` 後，Actions 會自動部署。
7. 等待 repository 的 **Actions** 頁面顯示部署成功，再從 **Settings → Pages** 取得網站網址。第一次部署後可能需要一些時間才會出現網址。

GitHub Free 帳號的 GitHub Pages 通常需要使用 Public repository。請依 GitHub 帳號當下的方案與 Pages 設定為準。

## 方式二：本機先預覽（不需要 Python）

如果電腦有 Node.js，可在專案根目錄執行：

```bash
npx serve .
```

或使用 VS Code 的 Live Server 開啟根目錄 `index.html`。不要直接雙擊 HTML，因為瀏覽器可能會阻擋讀取 `data/case_001.json`。

## 檔案結構

```text
AI_Murder_Mystery_GitHub_Pages/
├── index.html
├── style.css
├── game.js
├── data/
│   └── case_001.json
├── .nojekyll
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

## 新增劇本

目前前端載入 `data/case_001.json`。新增案件時，建議沿用相同 JSON 結構，並修改 `game.js` 的案件選擇與載入邏輯。要注意：若把私人角色卡及 `truth` 一起放在公開靜態 JSON，訪客可以透過瀏覽器的 Network 面板查看。這只適合原創示範案件；正式多人版本應由後端按權限傳送資料。

## 下一階段：接入真正 Groq AI

部署架構應為：

```text
GitHub Pages（HTML / CSS / JavaScript）
          │ HTTPS API
          ▼
FastAPI 後端（部署於 Render / Railway 等）
          │ 環境變數讀取 GROQ_API_KEY
          ▼
Groq API
```

不能把 Groq Key 放在 GitHub Pages 前端，因為任何訪客都能讀取前端原始碼及網路請求。請參考 Groq 官方安全文件：
https://console.groq.com/docs/production-readiness/security-onboarding

## 技術

- HTML / CSS / JavaScript
- JSON 劇本資料
- Browser localStorage
- GitHub Actions / GitHub Pages

---

本專案為課堂用途的原創互動遊戲原型，尚非具備後端保密與多人連線能力的正式服務。
