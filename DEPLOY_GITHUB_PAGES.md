# GitHub Pages 部署（前端）

## A. 上傳檔案

1. 解壓縮完整專案 ZIP。
2. 開啟 `site` 資料夾。
3. 將 `site` **裡面的所有檔案與資料夾**上傳到你的公開 Repository 根目錄。正確情況是 Repository 首頁直接看得到：

```text
index.html
style.css
app.js
data/
assets/
.nojekyll
```

4. 請勿把 `site` 這個資料夾本身再包一層上傳，也不要把 `cloudflare-worker` 上傳到公開 Repository。

## B. 設定 Pages

1. Repository → Settings → Pages。
2. Build and deployment → Source 選 `Deploy from a branch`。
3. Branch 選 `main`，Folder 選 `/(root)`。
4. 按 Save。
5. 等待部署完成，Pages 頁面會顯示網址。

預期網址：

```text
https://ssu506195-collab.github.io/AI_Murder_Mystery/
```

若 Repository 名稱或帳號不同，網址需依你的實際設定修改。

## C. 更新圖片

保持圖片路徑不變時，直接用同名新圖覆蓋 `assets/scene/manor-temp.webp` 或 `assets/portraits/*.webp`，重新 Commit 即可。若檔名不同，請修改 `data/cases.js` 對應的路徑。

## D. 重要

GitHub Pages 只執行前端靜態檔案，不會執行 Python/FastAPI，也不能安全地存放 Groq API Key。Groq AI 模式需另外部署 Cloudflare Worker，請看 `DEPLOY_CLOUDFLARE_WORKER.md`。
