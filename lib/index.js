/**
 * dsh-sidebar-mica-acrylic —— 宿主半 (Host Entry)
 *
 * 在 Windows 桌面端调用 Win32 DwmSetWindowAttribute API，
 * 为窗口注入原生的 Windows 11 云母 (Mica) 与亚克力 (Acrylic) 系统级材质底衬。
 */

import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const name = 'dsh-sidebar-mica-acrylic'
export const inject = []

function setupWindowsBackdrop(logger) {
  if (process.platform !== 'win32') return

  try {
    const candidatePaths = [
      process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}/Programs/DeepSeek Harness/resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/node_modules/@koromix/koffi-win32-x64/win32_x64/koffi.node`,
      process.env.USERPROFILE && `${process.env.USERPROFILE}/AppData/Local/Programs/DeepSeek Harness/resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/node_modules/@koromix/koffi-win32-x64/win32_x64/koffi.node`,
      'C:/Users/YunHan/AppData/Local/Programs/DeepSeek Harness/resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/node_modules/@koromix/koffi-win32-x64/win32_x64/koffi.node'
    ].filter(Boolean)

    const koffiPath = candidatePaths.find(p => existsSync(p))
    if (!koffiPath) {
      return
    }

    const koffi = require(koffiPath)
    const dwmapi = koffi.load('dwmapi.dll')
    const user32 = koffi.load('user32.dll')

    const DwmSetWindowAttribute = dwmapi.func('__stdcall', 'DwmSetWindowAttribute', 'int', ['intptr_t', 'uint32', 'void*', 'uint32'])
    const EnumWindows = user32.func('__stdcall', 'EnumWindows', 'bool', ['void*', 'intptr_t'])
    const GetWindowThreadProcessId = user32.func('__stdcall', 'GetWindowThreadProcessId', 'uint32', ['intptr_t', 'uint32*'])
    const IsWindowVisible = user32.func('__stdcall', 'IsWindowVisible', 'bool', ['intptr_t'])

    // DWMWA_SYSTEMBACKDROP_TYPE = 38 (Windows 11 Build 22621+)
    // 2 = Mica, 3 = Acrylic, 4 = Mica Alt
    function applyNativeBackdrop(typeVal) {
      try {
        const EnumWindowsProc = koffi.proto('__stdcall', 'EnumWindowsProc', 'bool', ['intptr_t', 'intptr_t'])
        const pidBuffer = [0]
        const hwnds = []

        const cb = koffi.register((hwnd) => {
          if (IsWindowVisible(hwnd)) {
            GetWindowThreadProcessId(hwnd, pidBuffer)
            hwnds.push(hwnd)
          }
          return true
        }, koffi.pointer(EnumWindowsProc))

        EnumWindows(cb, 0)

        const backdropBuf = Buffer.alloc(4)
        backdropBuf.writeUInt32LE(typeVal, 0)

        hwnds.forEach((hwnd) => {
          DwmSetWindowAttribute(hwnd, 38, backdropBuf, 4)
        })
      } catch (err) {
        logger?.debug?.('[sidebar-material] DWM 设置提示:', err)
      }
    }

    // 默认启用原生亚克力材质
    setTimeout(() => {
      applyNativeBackdrop(3) // 3 = Acrylic
    }, 1500)

  } catch (err) {
    logger?.debug?.('[sidebar-material] DWM 原生模块初始化提示:', err)
  }
}

export function apply(ctx) {
  const logger = ctx && typeof ctx.logger === 'function' ? ctx.logger('sidebar-mica-acrylic') : console
  logger.info?.('Sidebar Mica & Acrylic plugin initialized')

  try {
    setupWindowsBackdrop(logger)
  } catch (err) {
    logger?.warn?.('Failed to setup windows backdrop:', err)
  }
}
