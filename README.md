# Google Scholar 镜像站 - Vercel 部署版

## 功能特性
- ✅ 真实 Headless Chrome (Puppeteer)
- ✅ 用户名密码保护
- ✅ 支持切换代理网站（Google Scholar / PubMed / arXiv）
- ✅ 支持搜索、PDF 预览、引用导出

## 部署步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 本地测试
```bash
npm run dev
```
访问 http://localhost:3000

### 3. 部署到 Vercel
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 4. 在 Vercel 设置环境变量
在 Vercel 项目设置中添加：
- `AUTH_USERNAME`: 你的用户名
- `AUTH_PASSWORD`: 你的密码

## 使用说明
1. 访问网站会提示输入用户名密码（HTTP Basic Auth）
2. 选择要访问的学术网站或输入自定义 URL
3. 点击"访问"即可通过代理浏览

## 注意事项
- Vercel 免费版有 10 秒函数执行限制，Pro 版可设置 30 秒
- 首次加载可能较慢（Chrome 启动需要时间）
- 建议使用 Vercel Pro 获得更好性能
