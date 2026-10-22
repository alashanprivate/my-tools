const OPEN_EVENT = 'my-tools:open-ask-ai'

/** 供 TopBar 等全局入口打开「问 AI」对话框（AskAiDialog 监听该事件） */
export function openAskAi(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

export { OPEN_EVENT as ASK_AI_OPEN_EVENT }
