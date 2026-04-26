# 多人即時顏色競爭遊戲

一個使用 Node.js + Socket.IO 實作的多人即時連線顏色競爭遊戲。

## 功能

- 玩家輸入暱稱和房間號碼（7碼數字）進入遊戲
- 每個房間最多 4 位玩家
- 玩家選擇代表顏色（粉紅、紫粉、藍色、橘色）
- 10 層樓遊戲區域，每層有 4 個方框（1–4）
- 每位玩家在每層只能佔一格，選擇後即時同步給所有玩家
- 點擊已被他人佔據的方框時，跳出確認對話框詢問是否覆蓋
- 重設按鈕清除所有選擇（即時同步）

## 安裝與啟動

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動伺服器

```bash
node server.js
```

### 3. 開啟遊戲

瀏覽器訪問：[http://localhost:3000](http://localhost:3000)

---

## 部署到雲端平台

### Render

1. 前往 [https://render.com](https://render.com) 並登入
2. 點擊 **New → Web Service**
3. 連接你的 GitHub repository
4. 設定：
   - **Build Command**：`npm install`
   - **Start Command**：`node server.js`
5. 點擊 **Create Web Service** 即可部署

### Railway

1. 前往 [https://railway.app](https://railway.app) 並登入
2. 點擊 **New Project → Deploy from GitHub repo**
3. 選擇此 repository
4. Railway 會自動偵測 `package.json` 並執行 `npm start`
5. 部署完成後取得公開網址

### Heroku

1. 安裝 [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. 登入並建立應用：
   ```bash
   heroku login
   heroku create
   ```
3. 部署：
   ```bash
   git push heroku main
   ```
4. 開啟：
   ```bash
   heroku open
   ```

---

## 檔案結構

```
color-game/
├── index.html    前端 HTML
├── style.css     前端樣式
├── client.js     前端邏輯 + Socket.IO 客戶端
├── server.js     後端伺服器 (Node.js + Express + Socket.IO)
├── package.json  Node.js 依賴設定
└── README.md     說明文件
```
