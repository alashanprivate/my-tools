import { useSyncExternalStore } from 'react'

type Listener = () => void

let panelOpen = false
const listeners = new Set<Listener>()

/** 「问 AI」面板开关的共享状态：顶栏按钮负责切换，面板负责渲染 */
export const askAiPanel = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  isOpen: () => panelOpen,
  setOpen(next: boolean) {
    if (panelOpen === next) return
    panelOpen = next
    listeners.forEach((listener) => listener())
  },
  toggle() {
    askAiPanel.setOpen(!panelOpen)
  },
}

/** 订阅面板开关状态（顶栏按钮据此显示激活态） */
export function useAskAiOpen(): boolean {
  return useSyncExternalStore(askAiPanel.subscribe, askAiPanel.isOpen)
}
