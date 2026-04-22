# Arqon React Clone

这是把 `https://edugames.uz/game/arqon/` 复刻为 **React + Vite** 项目的版本。

## 用户文档入口

- 用户使用指南（kami 排版）：[`docs/kami/user-guide.html`](docs/kami/user-guide.html)
- 适用对象：课堂教师、活动主持人、现场运维人员

## 技术栈

- React 18
- Vite 5
- Vitest
- Testing Library

## 项目结构

- `src/App.jsx`：React 入口组件
- `src/main.jsx`：挂载入口
- `src/styles/arqon.css`：主页面样式
- `src/styles/audio-panel.css`：音频面板样式
- `public/game/arqon/i18n.js`：原页面多语言脚本
- `public/game/arqon/script.js`：原页面主逻辑脚本（已适配 React 挂载）
- `public/game/assets/audio/`：音频资源
- `public/game/assets/scripts/`：音频面板与辅助脚本
- `public/game/assets/styles/`：音频面板样式
- `public/game/assets/flags/`、`public/game/assets/media/`：旗帜与视频资源

## 开发启动

```bash
cd math-tug-of-war
npm install
npm run dev -- --host 127.0.0.1 --port 4174
```

打开：

- `http://127.0.0.1:4174/`

## 测试

```bash
npm test
```

## 构建

```bash
npm run build
```

## 资源替换说明（视频 / 音频）

### 1) 替换视频（默认不改代码）

直接替换以下文件，保持文件名与路径不变即可：

- `public/game/assets/media/main.mp4`：主场景动画（循环播放）
- `public/game/assets/media/win_blue.mp4`：蓝方胜利动画
- `public/game/assets/media/win_red.mp4`：红方胜利动画

建议：

- 格式：`mp4`
- 编码：`H.264 + AAC`（兼容性最好）
- 分辨率/比例：尽量与原素材一致，避免拉伸
- 体积：尽量压缩，减少加载时间

### 2) 替换音频（默认不改代码）

直接替换以下文件，保持文件名与路径不变即可：

- `public/game/assets/audio/audio.mp3`
- `public/game/assets/audio/audio-1.mp3`

建议：

- 格式：`mp3`
- 时长：建议可循环（背景音乐默认循环）
- 音量：导出时做基础响度统一，避免切换时忽大忽小

### 3) 如果要改文件名或新增音视频

除了替换文件外，需要同步更新引用配置：

- 视频引用：
  - `src/components/GameShell.jsx`
- 音频列表与默认音频：
  - `src/config/audioPanelConfig.js`

## 已完成的适配

- 已改成 React 项目结构
- 页面主体由 React 组件渲染
- 保留原始交互逻辑、音频面板、多语言切换和游戏流程
- 资源改为 Vite `public/` 静态资源方式
- 原始游戏脚本已适配为可在 React 挂载后初始化
- Home 按钮回到本地根路径 `/`
- 已加入基础渲染测试
