# /new 命令行为修复

- 时间：2026-04-24 18:07
- 执行者：Claude Code
- 状态：已完成

## 背景

PinchChat 中 `/new` 命令的行为与 OpenClaw WebUI 不一致：
- OpenClaw WebUI：`/new` 作为消息发送给后端，后端完成 session 创建、归档旧 session、通道绑定
- PinchChat：`/new` 在客户端直接调用 `sessions.create` API，只创建新 session，不归档旧的，导致 telegram 等通道的消息仍路由到旧 session

## 修改方案

区分两种入口：
1. **Sidebar 的 New 按钮**：保持原有行为（客户端调 `sessions.create`），这是真正的"新建"
2. **聊天窗口输入 `/new`**：改为作为普通文本消息发送给 OpenClaw 后端（和 `/reset` 一样），由后端完成 session 管理逻辑

## 变更文件

- `src/components/ChatInput.tsx`：移除 `/new` 的特殊处理分支，使其走 `onSend` 路径；清理 `onNewSession` prop
- `src/components/Chat.tsx`：清理 `onNewSession` prop 传递
- `src/App.tsx`：移除传给 `Chat` 组件的 `onNewSession` prop（Sidebar 的保留不变）
