(function () {
  'use strict';

  var STORAGE_KEY = 'dsh_sidebar_material_config';

  var DEFAULT_CONFIG = {
    material: 'acrylic',     // 'none' | 'acrylic' | 'mica' | 'mica-alt'
    opacity: 35,             // 5 - 90 (%) 通透半透明度，默认35%彻底透出底层桌面与背景窗口
    extendToTop: true,       // boolean: 侧栏在 Windows 桌面端向上贯通延伸至顶端
    noise: true,             // boolean: 微噪点质感
    blueLogo: true           // boolean: 侧栏 DeepSeek 经典品牌蓝图标
  };

  var listeners = new Set();

  function loadConfig() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed.titlebarMode !== undefined) {
          parsed.extendToTop = parsed.titlebarMode !== 'none';
          delete parsed.titlebarMode;
        }
        if (typeof parsed.titlebar === 'boolean') {
          parsed.extendToTop = parsed.titlebar;
          delete parsed.titlebar;
        }
        return Object.assign({}, DEFAULT_CONFIG, parsed);
      }
    } catch (e) {
      console.warn('[sidebar-material] Failed to load config from localStorage:', e);
    }
    return Object.assign({}, DEFAULT_CONFIG);
  }

  function saveConfig(patch) {
    try {
      var current = loadConfig();
      var next = Object.assign({}, current, patch);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyConfigToDOM(next);
      listeners.forEach(function (fn) {
        try { fn(next); } catch (err) { console.error(err); }
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dsh:sidebar-material:change', { detail: next }));
      }
      return next;
    } catch (e) {
      console.warn('[sidebar-material] Failed to save config to localStorage:', e);
      return loadConfig();
    }
  }

  function subscribeConfig(fn) {
    listeners.add(fn);
    return function () {
      listeners.delete(fn);
    };
  }

  var STYLE_ELEMENT_ID = 'dsh-sidebar-material-style';

  var MATERIAL_CSS = `
/* ============================================================
   DSH Left Sidebar Windows Mica & Acrylic Styles
   True Windows OS-level translucent rendering!
   IMPORTANT:
   Do NOT use CSS backdrop-filter here!
   In Chromium/Electron, CSS backdrop-filter isolates the layer and flattens
   the alpha channel, blocking the Windows DWM (Mica/Acrylic) desktop compositor!
   We provide clean alpha transparency so the OS DWM shines through!
   ============================================================ */

/* 1. Global Transparency: Allow Windows OS Acrylic/Mica backdrop to shine through */
html[data-sidebar-material]:not([data-sidebar-material="none"]),
html[data-sidebar-material]:not([data-sidebar-material="none"]) body {
  background: transparent !important;
  background-color: transparent !important;
}

/* Clear outer frame container */
html[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="frame"],
body[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="frame"] {
  background: transparent !important;
  background-color: transparent !important;
}

/* Clear top drag bar pseudo-element */
html[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="frame"]::before,
body[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="frame"]::before {
  background: transparent !important;
  background-color: transparent !important;
}

/* Clear specific sidebar fill token so inner elements don't mask the transparency */
html[data-sidebar-material]:not([data-sidebar-material="none"]) {
  --dsw-specific-sidebar-fill: transparent !important;
}
body[data-sidebar-material]:not([data-sidebar-material="none"]) {
  --dsw-specific-sidebar-fill: transparent !important;
}

/* Clear all inner wrappers inside sidebar column */
html[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] > div,
html[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] [class*="_root"],
html[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] > aside,
body[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] > div,
body[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] [class*="_root"],
body[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] > aside {
  background: transparent !important;
  background-color: transparent !important;
}

/* 2. Main content area (centerCol) MUST remain 100% solid and opaque so chats are clear */
html[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="centerCol"],
body[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="centerCol"] {
  background: var(--dsw-alias-bg-base) !important;
  background-color: var(--dsw-alias-bg-base) !important;
  position: relative;
  z-index: 2;
}

/* 3. Style the left sidebar container [class*="sidebarCol"] */
html[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"],
body[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] {
  position: relative !important;
  transition: background 0.24s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

/* ------------------------------------------------------------
   Acrylic Material (Windows 11 Fluent Acrylic - 亚克力透光)
   ------------------------------------------------------------ */
/* Light Mode */
html[data-sidebar-material="acrylic"] [class*="sidebarCol"],
body[data-sidebar-material="acrylic"]:not([data-ds-dark-theme]) [class*="sidebarCol"] {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, calc(var(--dsh-sm-opacity, 0.35) * 1.15)) 0%,
    rgba(240, 246, 255, var(--dsh-sm-opacity, 0.35)) 50%,
    rgba(255, 255, 255, calc(var(--dsh-sm-opacity, 0.35) * 0.85)) 100%
  ) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.08) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
}

/* Dark Mode */
body[data-ds-dark-theme][data-sidebar-material="acrylic"] [class*="sidebarCol"],
html[data-sidebar-material="acrylic"] body[data-ds-dark-theme] [class*="sidebarCol"] {
  background: linear-gradient(
    180deg,
    rgba(30, 34, 45, calc(var(--dsh-sm-opacity, 0.35) * 1.15)) 0%,
    rgba(20, 24, 32, var(--dsh-sm-opacity, 0.35)) 50%,
    rgba(15, 18, 24, calc(var(--dsh-sm-opacity, 0.35) * 0.9)) 100%
  ) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

/* ------------------------------------------------------------
   Mica Material (Windows 11 Mica - 云母微光)
   ------------------------------------------------------------ */
/* Light Mode */
html[data-sidebar-material="mica"] [class*="sidebarCol"],
body[data-sidebar-material="mica"]:not([data-ds-dark-theme]) [class*="sidebarCol"] {
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, calc(var(--dsh-sm-opacity, 0.45) * 1.1)) 0%,
    rgba(241, 245, 249, var(--dsh-sm-opacity, 0.45)) 100%
  ) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.08) !important;
}

/* Dark Mode */
body[data-ds-dark-theme][data-sidebar-material="mica"] [class*="sidebarCol"],
html[data-sidebar-material="mica"] body[data-ds-dark-theme] [class*="sidebarCol"] {
  background: linear-gradient(
    180deg,
    rgba(32, 36, 46, calc(var(--dsh-sm-opacity, 0.45) * 1.1)) 0%,
    rgba(22, 25, 34, var(--dsh-sm-opacity, 0.45)) 100%
  ) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* ------------------------------------------------------------
   Mica Alt Material (Windows 11 Mica Alt - 增强云母)
   ------------------------------------------------------------ */
/* Light Mode */
html[data-sidebar-material="mica-alt"] [class*="sidebarCol"],
body[data-sidebar-material="mica-alt"]:not([data-ds-dark-theme]) [class*="sidebarCol"] {
  background: linear-gradient(
    180deg,
    rgba(240, 244, 252, calc(var(--dsh-sm-opacity, 0.40) * 1.15)) 0%,
    rgba(235, 240, 250, var(--dsh-sm-opacity, 0.40)) 100%
  ) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.08) !important;
}

/* Dark Mode */
body[data-ds-dark-theme][data-sidebar-material="mica-alt"] [class*="sidebarCol"],
html[data-sidebar-material="mica-alt"] body[data-ds-dark-theme] [class*="sidebarCol"] {
  background: linear-gradient(
    180deg,
    rgba(28, 32, 44, calc(var(--dsh-sm-opacity, 0.40) * 1.15)) 0%,
    rgba(18, 20, 28, var(--dsh-sm-opacity, 0.40)) 100%
  ) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* ------------------------------------------------------------
   Micro-Noise Grain Texture (Fluent Noise) on Sidebar
   ------------------------------------------------------------ */
html[data-sidebar-noise="true"][data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"]::after,
body[data-sidebar-noise="true"][data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"]::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: var(--dsh-sm-noise-opacity, 0.035);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

html[data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] > * {
  position: relative;
  z-index: 2;
}

/* ------------------------------------------------------------
   Windows Titlebar: Smooth extension of the left sidebar to top
   ------------------------------------------------------------ */
html[data-windows-titlebar][data-sidebar-extend="true"][data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"],
body[data-windows-titlebar][data-sidebar-extend="true"][data-sidebar-material]:not([data-sidebar-material="none"]) [class*="sidebarCol"] {
  margin-top: calc(-1 * var(--dsh-windows-titlebar-height, 36px)) !important;
  padding-top: var(--dsh-windows-titlebar-height, 36px) !important;
  height: calc(100% + var(--dsh-windows-titlebar-height, 36px)) !important;
  box-sizing: border-box !important;
}

/* ------------------------------------------------------------
   DeepSeek Sidebar Brand Icon & Wordmark -> Official DeepSeek Blue (#4D6BFE)
   Includes both the fish mark and the 'DeepSeek' vector wordmark text icon!
   ------------------------------------------------------------ */
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"],
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"],
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandMark"],
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="railMark"],
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brand"],
html:not([data-sidebar-blue-logo="false"]) [class*="brandIdentity"],
html:not([data-sidebar-blue-logo="false"]) [class*="brandName"],
html:not([data-sidebar-blue-logo="false"]) [class*="brandMark"],
html:not([data-sidebar-blue-logo="false"]) [class*="railMark"],
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"],
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"],
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandMark"],
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="railMark"],
body:not([data-sidebar-blue-logo="false"]) [class*="brandIdentity"],
body:not([data-sidebar-blue-logo="false"]) [class*="brandName"],
body:not([data-sidebar-blue-logo="false"]) [class*="brandMark"],
body:not([data-sidebar-blue-logo="false"]) [class*="railMark"] {
  color: #4D6BFE !important;
}

html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"] svg,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"] svg,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandMark"] svg,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="railMark"] svg,
html:not([data-sidebar-blue-logo="false"]) [class*="brandIdentity"] svg,
html:not([data-sidebar-blue-logo="false"]) [class*="brandName"] svg,
html:not([data-sidebar-blue-logo="false"]) [class*="brandMark"] svg,
html:not([data-sidebar-blue-logo="false"]) [class*="railMark"] svg,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"] svg,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"] svg,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandMark"] svg,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="railMark"] svg,
body:not([data-sidebar-blue-logo="false"]) [class*="brandIdentity"] svg,
body:not([data-sidebar-blue-logo="false"]) [class*="brandName"] svg,
body:not([data-sidebar-blue-logo="false"]) [class*="brandMark"] svg,
body:not([data-sidebar-blue-logo="false"]) [class*="railMark"] svg {
  color: #4D6BFE !important;
  transition: color 0.2s ease, filter 0.2s ease !important;
}

/* HARNESS badge text inside the rect: must stay pure white (#ffffff) so the letters are crisp and clearly visible */
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"] rect + g path,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"] rect + g path,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"] [clip-path] path,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"] [clip-path] path,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"] g[clip-path*="badge"] path,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"] g[clip-path*="badge"] path,
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] rect + g path,
html:not([data-sidebar-blue-logo="false"]) [class*="brandIdentity"] rect + g path,
html:not([data-sidebar-blue-logo="false"]) [class*="brandName"] rect + g path,
html:not([data-sidebar-blue-logo="false"]) rect + g path,
html:not([data-sidebar-blue-logo="false"]) g[clip-path*="badge"] path,
html:not([data-sidebar-blue-logo="false"]) [clip-path*="badge"] path,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"] rect + g path,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"] rect + g path,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"] [clip-path] path,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"] [clip-path] path,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandIdentity"] g[clip-path*="badge"] path,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="brandName"] g[clip-path*="badge"] path,
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] rect + g path,
body:not([data-sidebar-blue-logo="false"]) [class*="brandIdentity"] rect + g path,
body:not([data-sidebar-blue-logo="false"]) [class*="brandName"] rect + g path,
body:not([data-sidebar-blue-logo="false"]) rect + g path,
body:not([data-sidebar-blue-logo="false"]) g[clip-path*="badge"] path,
body:not([data-sidebar-blue-logo="false"]) [clip-path*="badge"] path {
  fill: #ffffff !important;
}

html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="fallbackBrandName"],
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="localBuildTitle"],
html:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="localBuildBrand"],
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="fallbackBrandName"],
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="localBuildTitle"],
body:not([data-sidebar-blue-logo="false"]) [class*="sidebarCol"] [class*="localBuildBrand"] {
  color: #4D6BFE !important;
}

html:not([data-sidebar-blue-logo="false"]) [class*="brandIdentity"]:hover svg,
html:not([data-sidebar-blue-logo="false"]) [class*="brandMark"]:hover svg,
html:not([data-sidebar-blue-logo="false"]) [class*="railMark"]:hover svg,
body:not([data-sidebar-blue-logo="false"]) [class*="brandIdentity"]:hover svg,
body:not([data-sidebar-blue-logo="false"]) [class*="brandMark"]:hover svg,
body:not([data-sidebar-blue-logo="false"]) [class*="railMark"]:hover svg {
  filter: drop-shadow(0 0 6px rgba(77, 107, 254, 0.55)) !important;
}

/* ============================================================
   Settings Component Scoped Styles (dsh-sm-*)
   ============================================================ */

.dsh-sm-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 820px;
  margin: 0 auto;
  padding: 8px 4px 32px 4px;
  color: var(--dsw-alias-label-primary, #1f2328);
  box-sizing: border-box;
}

.dsh-sm-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.1));
}

.dsh-sm-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dsh-sm-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  color: var(--dsw-alias-label-primary, inherit);
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsh-sm-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--dsw-alias-label-secondary, #656d76);
  border: 0.5px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.08));
}

.dsh-sm-badge.active {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  border-color: rgba(59, 130, 246, 0.28);
}
body[data-ds-dark-theme] .dsh-sm-badge.active {
  background: rgba(96, 165, 250, 0.16);
  color: #60a5fa;
  border-color: rgba(96, 165, 250, 0.32);
}

.dsh-sm-desc {
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-secondary, #656d76);
}

/* Live Preview Card */
.dsh-sm-preview-card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
  background: var(--dsw-alias-bg-module-platform, rgba(0, 0, 0, 0.02));
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dsh-sm-preview-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dsh-sm-preview-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--dsw-alias-label-secondary, #656d76);
}

.dsh-sm-preview-status {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8c959f);
  display: flex;
  align-items: center;
  gap: 6px;
}

.dsh-sm-preview-window {
  position: relative;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  border: 1px solid var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.08));
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.dsh-sm-preview-sidebar {
  width: 140px;
  height: 100%;
  padding: 12px 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.dsh-sm-preview-item {
  height: 20px;
  border-radius: 5px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  display: flex;
  align-items: center;
  padding: 0 6px;
  gap: 6px;
}

.dsh-sm-preview-item.active {
  background: rgba(59, 130, 246, 0.16);
  border-left: 2px solid #3b82f6;
}

.dsh-sm-preview-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
}

.dsh-sm-preview-line {
  height: 5px;
  border-radius: 3px;
  background: currentColor;
  opacity: 0.5;
  flex: 1;
}

.dsh-sm-preview-main {
  flex: 1;
  background: var(--dsw-alias-bg-base, #ffffff);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
body[data-ds-dark-theme] .dsh-sm-preview-main {
  background: var(--dsw-alias-bg-base, #16181d);
}

.dsh-sm-preview-bubble {
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 11px;
  max-width: 80%;
  background: var(--dsw-alias-bg-module-platform, rgba(0, 0, 0, 0.04));
  color: var(--dsw-alias-label-secondary, #656d76);
}

/* Material Selection Cards Grid */
.dsh-sm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.dsh-sm-card {
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.1));
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  background: var(--dsw-alias-bg-base, #ffffff);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
  outline: none;
  position: relative;
}
body[data-ds-dark-theme] .dsh-sm-card {
  background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.03));
}

.dsh-sm-card:hover {
  border-color: var(--dsw-static-neutral-bluish-400, #93c5fd);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.dsh-sm-card.selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.04);
  box-shadow: 0 0 0 1px #3b82f6, 0 4px 14px rgba(59, 130, 246, 0.12);
}
body[data-ds-dark-theme] .dsh-sm-card.selected {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.08);
  box-shadow: 0 0 0 1px #60a5fa, 0 4px 14px rgba(96, 165, 250, 0.16);
}

.dsh-sm-card-thumb {
  height: 52px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
}
body[data-ds-dark-theme] .dsh-sm-card-thumb {
  border-color: rgba(255, 255, 255, 0.1);
}

.dsh-sm-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dsh-sm-card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dsh-sm-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}

.dsh-sm-card-desc {
  font-size: 12px;
  line-height: 16px;
  color: var(--dsw-alias-label-secondary, #656d76);
}

/* Control Section */
.dsh-sm-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 0;
  border-top: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
}

.dsh-sm-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, inherit);
}

.dsh-sm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dsh-sm-row-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.dsh-sm-row-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary, inherit);
}

.dsh-sm-row-desc {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #656d76);
}

.dsh-sm-slider-box {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.dsh-sm-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--dsw-alias-border-l3, #e5e7eb);
  outline: none;
  cursor: pointer;
}
body[data-ds-dark-theme] .dsh-sm-slider {
  background: var(--dsw-alias-border-l2, #374151);
}

.dsh-sm-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.1s ease;
}

.dsh-sm-slider::-webkit-slider-thumb:hover {
  transform: scale(1.18);
}

.dsh-sm-val-badge {
  font-size: 12px;
  font-weight: 600;
  min-width: 44px;
  text-align: right;
  color: var(--dsw-alias-label-primary, inherit);
  font-variant-numeric: tabular-nums;
}

/* Switch Component */
.dsh-sm-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
}

.dsh-sm-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.dsh-sm-switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--dsw-alias-border-l3, #ccc);
  transition: .24s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 24px;
}

.dsh-sm-switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .24s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.dsh-sm-switch input:checked + .dsh-sm-switch-slider {
  background-color: #3b82f6;
}

.dsh-sm-switch input:checked + .dsh-sm-switch-slider:before {
  transform: translateX(18px);
}

/* Actions footer */
.dsh-sm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
}

.dsh-sm-btn {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.15));
  background: var(--dsw-alias-bg-base, #ffffff);
  color: var(--dsw-alias-label-primary, inherit);
  cursor: pointer;
  transition: all 0.15s ease;
}
body[data-ds-dark-theme] .dsh-sm-btn {
  background: var(--dsw-alias-bg-module-platform, rgba(255, 255, 255, 0.06));
}

.dsh-sm-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));
  border-color: var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.2));
}

/* General Row item scoped styles */
.dsh-sm-general-group {
  border-bottom: 0.5px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 0;
}

.dsh-sm-general-title {
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dsh-sm-general-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dsh-sm-cube {
  box-sizing: border-box;
  border: 0.5px solid var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.1));
  border-radius: var(--dsw-radius-xl, 8px);
  font: inherit;
  color: var(--dsw-alias-label-primary, inherit);
  cursor: pointer;
  background: transparent;
  flex-direction: column;
  flex: 1 1 120px;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 14px 18px;
  font-size: 13px;
  line-height: 18px;
  display: flex;
  transition: all 0.15s ease;
}

.dsh-sm-cube:hover:not(.selected) {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
}

.dsh-sm-cube.selected {
  background: var(--dsw-alias-bg-module-platform, rgba(59, 130, 246, 0.08));
  border-color: #3b82f6;
  font-weight: 600;
  box-shadow: 0 0 0 1px #3b82f6;
}
body[data-ds-dark-theme] .dsh-sm-cube.selected {
  border-color: #60a5fa;
  box-shadow: 0 0 0 1px #60a5fa;
}

.dsh-sm-cube-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

  function applyConfigToDOM(config) {
    if (typeof document === 'undefined') return;

    var root = document.documentElement;
    var body = document.body;

    root.dataset.sidebarMaterial = config.material;
    root.dataset.sidebarNoise = String(config.noise);
    root.dataset.sidebarExtend = String(config.extendToTop !== false);
    root.dataset.sidebarBlueLogo = String(config.blueLogo !== false);

    if (body) {
      body.dataset.sidebarMaterial = config.material;
      body.dataset.sidebarNoise = String(config.noise);
      body.dataset.sidebarExtend = String(config.extendToTop !== false);
      body.dataset.sidebarBlueLogo = String(config.blueLogo !== false);
    }

    root.style.setProperty('--dsh-sm-opacity', String(config.opacity / 100));
    root.style.setProperty('--dsh-sm-noise-opacity', config.noise ? '0.035' : '0');

    var styleEl = document.getElementById(STYLE_ELEMENT_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }
    if (styleEl.textContent !== MATERIAL_CSS) {
      styleEl.textContent = MATERIAL_CSS;
    }
  }

  // Initial apply
  if (typeof document !== 'undefined') {
    applyConfigToDOM(loadConfig());
  }

  // ============================================================
  // React Component Definitions
  // ============================================================

  function initModule(require) {
    var React = (typeof require === 'function' ? require('react') : null) || (typeof window !== 'undefined' ? window.React : null);
    if (!React) {
      console.error('[sidebar-material] React is not available in environment');
      return { apply: function () {} };
    }

    var e = React.createElement;

    // SVG Icons
    function IconCheck(props) {
      return e('svg', {
        width: props.size || 14,
        height: props.size || 14,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, e('polyline', { points: '20 6 9 17 4 12' }));
    }

    function IconSparkles(props) {
      return e('svg', {
        width: props.size || 16,
        height: props.size || 16,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        e('path', { key: '1', d: 'M12 3v3' }),
        e('path', { key: '2', d: 'M12 18v3' }),
        e('path', { key: '3', d: 'M3 12h3' }),
        e('path', { key: '4', d: 'M18 12h3' }),
        e('path', { key: '5', d: 'M9.5 9.5l5 5' }),
        e('path', { key: '6', d: 'M14.5 9.5l-5 5' })
      ]);
    }

    function IconGlass(props) {
      return e('svg', {
        width: props.size || 16,
        height: props.size || 16,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        e('rect', { key: '1', x: '3', y: '3', width: '18', height: '18', rx: '2' }),
        e('path', { key: '2', d: 'M3 9h18' }),
        e('path', { key: '3', d: 'M9 21V9' })
      ]);
    }

    function IconDefault(props) {
      return e('svg', {
        width: props.size || 16,
        height: props.size || 16,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }, [
        e('rect', { key: '1', x: '4', y: '4', width: '16', height: '16', rx: '2' }),
        e('line', { key: '2', x1: '9', y1: '4', x2: '9', y2: '20' })
      ]);
    }

    // Material definitions
    var MATERIALS = [
      {
        id: 'none',
        name: '原生默认',
        subtitle: 'Default',
        desc: '还原 DSH 官方经典单色样式，不启用半透明与透光。',
        Icon: IconDefault,
        thumbBgLight: '#f3f4f6',
        thumbBgDark: '#1f2937'
      },
      {
        id: 'acrylic',
        name: '亚克力效果',
        subtitle: 'Acrylic',
        desc: 'Fluent 标志性半透明亚克力，真实透出桌面壁纸与软件后方窗口。',
        Icon: IconGlass,
        thumbBgLight: 'rgba(235, 243, 255, 0.45)',
        thumbBgDark: 'rgba(26, 30, 42, 0.45)'
      },
      {
        id: 'mica',
        name: '云母效果',
        subtitle: 'Mica',
        desc: 'Windows 11 经典珠光微透光材质，优雅融合桌面环境光泽与柔和反光。',
        Icon: IconSparkles,
        thumbBgLight: 'rgba(245, 248, 252, 0.55)',
        thumbBgDark: 'rgba(28, 32, 42, 0.55)'
      },
      {
        id: 'mica-alt',
        name: '增强云母',
        subtitle: 'Mica Alt',
        desc: '强化环境光反差与色泽饱满度，专为沉浸式主导航设计。',
        Icon: IconSparkles,
        thumbBgLight: 'rgba(240, 244, 252, 0.50)',
        thumbBgDark: 'rgba(22, 25, 35, 0.50)'
      }
    ];

    // ==========================================================
    // 1. Settings Section Component (侧栏材质独立设置页)
    // ==========================================================
    function SettingsSection() {
      var stateTuple = React.useState(loadConfig);
      var config = stateTuple[0];
      var setConfig = stateTuple[1];

      React.useEffect(function () {
        return subscribeConfig(function (next) {
          setConfig(next);
        });
      }, []);

      var update = function (patch) {
        var updated = saveConfig(patch);
        setConfig(updated);
      };

      // Header
      var headerEl = e('div', { className: 'dsh-sm-header', key: 'header' }, [
        e('div', { className: 'dsh-sm-header-top', key: 'top' }, [
          e('div', { className: 'dsh-sm-title', key: 'title' }, [
            e(IconGlass, { size: 18, key: 'icon' }),
            'Windows 侧栏半透明材质效果'
          ]),
          e('span', {
            className: 'dsh-sm-badge' + (config.material !== 'none' ? ' active' : ''),
            key: 'badge'
          }, config.material === 'none' ? '未启用' : '已启用: ' + config.material.toUpperCase())
        ]),
        e('div', { className: 'dsh-sm-desc', key: 'desc' },
          '专注为左侧导航栏注入 Windows 11 Fluent 亚克力 (Acrylic) 与云母 (Mica) 系统级半透明材质，真实透出软件后方的桌面壁纸与窗口。'
        )
      ]);

      // Live Preview Box
      var isDark = typeof document !== 'undefined' && document.body && document.body.hasAttribute('data-ds-dark-theme');
      var activeMat = MATERIALS.find(function (m) { return m.id === config.material; }) || MATERIALS[0];
      var previewBg = isDark ? activeMat.thumbBgDark : activeMat.thumbBgLight;

      var previewEl = e('div', { className: 'dsh-sm-preview-card', key: 'preview' }, [
        e('div', { className: 'dsh-sm-preview-title-row', key: 'title-row' }, [
          e('span', { className: 'dsh-sm-preview-label', key: 'lbl' }, '实时效果预览 (Live Preview)'),
          e('span', { className: 'dsh-sm-preview-status', key: 'st' }, [
            '材质: ' + activeMat.name,
            e('span', { key: 'dot' }, '•'),
            '不透明度: ' + config.opacity + '%'
          ])
        ]),
        e('div', {
          className: 'dsh-sm-preview-window',
          style: {
            background: 'linear-gradient(45deg, #3b82f633 25%, transparent 25%), linear-gradient(-45deg, #3b82f633 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3b82f633 75%), linear-gradient(-45deg, transparent 75%, #3b82f633 75%)',
            backgroundSize: '16px 16px',
            backgroundColor: isDark ? '#111827' : '#f3f4f6'
          },
          key: 'win'
        }, [
          e('div', {
            className: 'dsh-sm-preview-sidebar',
            style: {
              background: config.material === 'none' ? (isDark ? '#1a1c23' : '#f0f2f5') : previewBg,
              borderRight: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
            },
            key: 'side'
          }, [
            e('div', {
              className: 'dsh-sm-preview-item active',
              key: 'item1',
              style: config.blueLogo !== false ? { color: '#4D6BFE' } : undefined
            }, [
              e('div', {
                className: 'dsh-sm-preview-dot',
                key: 'd1',
                style: config.blueLogo !== false ? { background: '#4D6BFE', opacity: 1, boxShadow: '0 0 6px rgba(77,107,254,0.6)' } : undefined
              }),
              e('div', {
                className: 'dsh-sm-preview-line',
                key: 'l1',
                style: config.blueLogo !== false ? { background: '#4D6BFE', opacity: 0.85 } : undefined
              })
            ]),
            e('div', { className: 'dsh-sm-preview-item', key: 'item2' }, [
              e('div', { className: 'dsh-sm-preview-dot', key: 'd2' }),
              e('div', { className: 'dsh-sm-preview-line', key: 'l2' })
            ]),
            e('div', { className: 'dsh-sm-preview-item', key: 'item3' }, [
              e('div', { className: 'dsh-sm-preview-dot', key: 'd3' }),
              e('div', { className: 'dsh-sm-preview-line', key: 'l3' })
            ])
          ]),
          e('div', { className: 'dsh-sm-preview-main', key: 'main' }, [
            e('div', { className: 'dsh-sm-preview-bubble', key: 'b1' }, '左侧栏真实透出底层桌面 ✨'),
            e('div', { className: 'dsh-sm-preview-bubble', style: { alignSelf: 'flex-end', background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' }, key: 'b2' }, '对话区保持实体不透明，保证阅读对比度')
          ])
        ])
      ]);

      // Material Cards Grid
      var cardsEl = e('div', { className: 'dsh-sm-grid', key: 'grid' }, MATERIALS.map(function (item) {
        var isSelected = config.material === item.id;
        return e('button', {
          key: item.id,
          type: 'button',
          className: 'dsh-sm-card' + (isSelected ? ' selected' : ''),
          onClick: function () { update({ material: item.id }); }
        }, [
          e('div', {
            className: 'dsh-sm-card-thumb',
            style: { background: isDark ? item.thumbBgDark : item.thumbBgLight },
            key: 'thumb'
          }, [
            e(item.Icon, { size: 22, key: 'icon' })
          ]),
          e('div', { className: 'dsh-sm-card-body', key: 'body' }, [
            e('div', { className: 'dsh-sm-card-title-row', key: 't-row' }, [
              e('span', { className: 'dsh-sm-card-title', key: 't' }, item.name),
              isSelected && e(IconCheck, { size: 14, key: 'chk' })
            ]),
            e('span', { className: 'dsh-sm-card-desc', key: 'd' }, item.desc)
          ])
        ]);
      }));

      // Fine-tuning Controls
      var fineTuningEl = e('div', { className: 'dsh-sm-section', key: 'tuning' }, [
        e('div', { className: 'dsh-sm-section-title', key: 'tuning-title' }, '材质透光参数微调'),

        // Opacity Slider
        e('div', { className: 'dsh-sm-row', key: 'opacity-row' }, [
          e('div', { className: 'dsh-sm-row-info', key: 'info' }, [
            e('div', { className: 'dsh-sm-row-label', key: 'lbl' }, '侧栏材质不透明度 (透光度)'),
            e('div', { className: 'dsh-sm-row-desc', key: 'desc' }, '数值越低越通透，后方桌面壁纸透出越明显；推荐 20% ~ 45%。')
          ]),
          e('div', { className: 'dsh-sm-slider-box', key: 'ctrl' }, [
            e('input', {
              type: 'range',
              min: 5,
              max: 90,
              value: config.opacity,
              className: 'dsh-sm-slider',
              onChange: function (ev) { update({ opacity: Number(ev.target.value) }); },
              key: 'slider'
            }),
            e('span', { className: 'dsh-sm-val-badge', key: 'val' }, config.opacity + '%')
          ])
        ]),

        // Extend to top switch (Windows Desktop Mode)
        e('div', { className: 'dsh-sm-row', key: 'extend-row' }, [
          e('div', { className: 'dsh-sm-row-info', key: 'info' }, [
            e('div', { className: 'dsh-sm-row-label', key: 'lbl' }, '左侧栏向上通顶延伸'),
            e('div', { className: 'dsh-sm-row-desc', key: 'desc' }, '在 Windows 桌面端将左侧栏向上平滑贯穿至窗口顶部，右侧主内容区及顶栏保持默认不变。')
          ]),
          e('label', { className: 'dsh-sm-switch', key: 'sw' }, [
            e('input', {
              type: 'checkbox',
              checked: config.extendToTop !== false,
              onChange: function (ev) { update({ extendToTop: ev.target.checked }); },
              key: 'chk'
            }),
            e('span', { className: 'dsh-sm-switch-slider', key: 'slide' })
          ])
        ]),

        // Noise grain switch
        e('div', { className: 'dsh-sm-row', key: 'noise-row' }, [
          e('div', { className: 'dsh-sm-row-info', key: 'info' }, [
            e('div', { className: 'dsh-sm-row-label', key: 'lbl' }, 'Fluent 细腻微质感噪点'),
            e('div', { className: 'dsh-sm-row-desc', key: 'desc' }, '注入微米级随机噪点，消除渐变色阶断层，还原 Windows 11 原生触感。')
          ]),
          e('label', { className: 'dsh-sm-switch', key: 'sw' }, [
            e('input', {
              type: 'checkbox',
              checked: config.noise,
              onChange: function (ev) { update({ noise: ev.target.checked }); },
              key: 'chk'
            }),
            e('span', { className: 'dsh-sm-switch-slider', key: 'slide' })
          ])
        ]),

        // DeepSeek Blue Logo switch
        e('div', { className: 'dsh-sm-row', key: 'blue-logo-row' }, [
          e('div', { className: 'dsh-sm-row-info', key: 'info' }, [
            e('div', { className: 'dsh-sm-row-label', key: 'lbl' }, '侧栏 DeepSeek 图标与文字品牌蓝'),
            e('div', { className: 'dsh-sm-row-desc', key: 'desc' }, '将左侧栏顶部的 DeepSeek 经典鲸鱼标志及文字图标（Brand Wordmark）全部统一为标志性官方品牌蓝 (#4D6BFE)。')
          ]),
          e('label', { className: 'dsh-sm-switch', key: 'sw' }, [
            e('input', {
              type: 'checkbox',
              checked: config.blueLogo !== false,
              onChange: function (ev) { update({ blueLogo: ev.target.checked }); },
              key: 'chk'
            }),
            e('span', { className: 'dsh-sm-switch-slider', key: 'slide' })
          ])
        ])
      ]);

      // Footer with Reset button
      var footerEl = e('div', { className: 'dsh-sm-footer', key: 'footer' }, [
        e('button', {
          type: 'button',
          className: 'dsh-sm-btn',
          onClick: function () {
            update(DEFAULT_CONFIG);
          },
          key: 'reset'
        }, '恢复推荐默认设置')
      ]);

      return e('div', { className: 'dsh-sm-container' }, [
        headerEl,
        previewEl,
        cardsEl,
        fineTuningEl,
        footerEl
      ]);
    }

    // ==========================================================
    // 2. General Settings Item Component (通用设置项行)
    // ==========================================================
    function GeneralItemRow() {
      var stateTuple = React.useState(loadConfig);
      var config = stateTuple[0];
      var setConfig = stateTuple[1];

      React.useEffect(function () {
        return subscribeConfig(function (next) {
          setConfig(next);
        });
      }, []);

      var selectMaterial = function (matId) {
        var updated = saveConfig({ material: matId });
        setConfig(updated);
      };

      return e('div', { className: 'dsh-sm-general-group' }, [
        e('div', { className: 'dsh-sm-general-title', key: 'title' }, [
          e('span', { key: 't' }, '侧栏材质效果'),
          e('span', {
            style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary, #656d76)', fontWeight: 'normal' },
            key: 'hint'
          }, config.material === 'none' ? '原生默认' : ('已选: ' + config.material.toUpperCase()))
        ]),
        e('div', { className: 'dsh-sm-general-row', key: 'cubes' }, MATERIALS.map(function (item) {
          var isSelected = config.material === item.id;
          return e('button', {
            key: item.id,
            type: 'button',
            className: 'dsh-sm-cube' + (isSelected ? ' selected' : ''),
            onClick: function () { selectMaterial(item.id); }
          }, [
            e('div', { className: 'dsh-sm-cube-icon', key: 'icon' }, [
              e(item.Icon, { size: 18 })
            ]),
            e('span', { key: 'name' }, item.name)
          ]);
        }))
      ]);
    }

    return {
      inject: ['slots'],
      apply: function (ctx) {
        // 1. Register section in Settings page (侧栏材质独立设置页)
        if (ctx.slots && typeof ctx.slots.inject === 'function') {
          ctx.slots.inject('settings.section', function () {
            return ctx.slots.register({
              name: 'settings.section',
              id: 'sidebar-material',
              order: 32,
              label: function () { return '侧栏材质'; }
            }, SettingsSection);
          });

          // 2. Register row item in General Settings (通用设置行)
          ctx.slots.inject('settings.general.item', function () {
            return ctx.slots.register({
              name: 'settings.general.item',
              id: 'sidebar-material-general',
              order: 12,
              label: function () { return '侧栏材质'; }
            }, GeneralItemRow);
          });
        }
      }
    };
  }

  // Loader bridge
  if (typeof window !== 'undefined' && window.__ModuleLoader__ && typeof window.__ModuleLoader__.load === 'function') {
    window.__ModuleLoader__.load({
      id: 'dsh-sidebar-mica-acrylic',
      factory: function (require) {
        return initModule(require);
      }
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      inject: ['slots'],
      apply: function (ctx) {
        if (typeof window !== 'undefined') {
          return initModule(null).apply(ctx);
        }
      }
    };
  }
})();
