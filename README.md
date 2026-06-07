# PagePeer

> 免安裝的瀏覽器端 P2P 檔案與訊息分享工具

透過 WebRTC 技術，掃描 QR Code 即可在桌面與手機之間安全、即時地傳輸文字與檔案，**無需伺服器中轉，無需安裝任何應用程式**。

🔗 **線上體驗**：[https://josudoey.github.io/PagePeer/](https://josudoey.github.io/PagePeer/)

---

## ✨ 功能特色

- **零安裝**：純瀏覽器運行，不需下載或安裝任何軟體
- **P2P 傳輸**：使用 WebRTC 技術，資料直接在裝置間傳輸，不經過中央伺服器
- **QR Code 配對**：桌機開啟頁面後自動產生 QR Code，手機掃描即可快速建立連線
- **訊息傳送**：雙向即時文字訊息，支援一鍵複製內容
- **檔案傳輸**：支援拖放上傳，顯示即時進度、速度與完成通知
- **自適應介面**：根據裝置視窗大小自動切換桌面 / 行動裝置版面配置
- **房號隔離**：每個連線工作階段有獨立隨機房號，不同裝置僅在同一房號內可見

---

## 🚀 快速上手

### 桌機端

1. 開啟 [https://josudoey.github.io/PagePeer/](https://josudoey.github.io/PagePeer/)
2. 頁面自動產生房號與 QR Code
3. 點選右上角「**行動裝置配對**」按鈕，顯示 QR Code

### 行動端

1. 使用手機相機掃描 QR Code（或直接輸入分享連結）
2. 瀏覽器自動開啟頁面並連線至桌機
3. 連線成功後即可雙向傳送文字訊息或檔案

---

## 🛠 技術棧

| 層次 | 技術 |
|------|------|
| 框架 | [Astro](https://astro.build/) v6 + [React](https://react.dev/) v19 |
| 樣式 | [Tailwind CSS](https://tailwindcss.com/) v4 |
| P2P 通訊 | [PeerJS](https://peerjs.com/)（基於 WebRTC） |
| QR Code | [qrcode](https://github.com/soldair/node-qrcode) |
| 套件管理 | [pnpm](https://pnpm.io/) Workspaces（Monorepo） |
| 部署 | GitHub Actions → GitHub Pages |

---

## 📁 專案結構

```
PagePeer/
├── apps/
│   └── web/                  # Astro 前端應用
│       ├── app/
│       │   ├── components/
│       │   │   └── P2PShare.tsx   # 核心 P2P 元件（WebRTC + UI）
│       │   ├── pages/
│       │   │   └── index.astro    # 主頁面
│       │   └── styles/
│       │       └── global.css     # 全域樣式
│       ├── public/                # 靜態資源
│       ├── astro.config.mjs       # Astro 設定
│       └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml             # GitHub Pages 自動部署
├── package.json                   # 根工作區設定
└── pnpm-workspace.yaml
```

---

## 💻 本地開發

### 環境需求

- Node.js（建議使用 `.node-version` 檔案指定版本）
- pnpm

### 安裝依賴

```bash
pnpm install
```

### 啟動開發伺服器

```bash
pnpm --filter web dev
```

開啟瀏覽器前往 [http://localhost:4321](http://localhost:4321)

> **注意**：本地端使用 HTTP，`navigator.clipboard` API 僅在 HTTPS 環境可用。元件已內建 `execCommand` fallback，在本機區域網路 IP 下仍可正常複製文字。

### 建置產出

```bash
pnpm --filter web build
```

產出檔案位於 `apps/web/dist/`。

---

## ⚙️ 環境變數

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| `ASTRO_BASE` | Astro base path，部署至子路徑時需設定 | `/` |

GitHub Pages 部署時，CI 會自動設定 `ASTRO_BASE=/PagePeer`。

---

## 🚢 自動部署

推送至 `master` 分支後，GitHub Actions 自動：

1. 安裝依賴
2. 執行 `pnpm --filter web build`（設定 `ASTRO_BASE=/PagePeer`）
3. 將 `apps/web/dist/` 部署至 GitHub Pages

---

## 📄 授權

[MIT License](./LICENSE)
