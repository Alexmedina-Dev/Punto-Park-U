// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Web Store Setup                                                   ║
// ║  Initializes shared-stores with web (localStorage) adapter          ║
// ║  Import this early in app startup (e.g., main.tsx or App.tsx)      ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { setStorageAdapter, createWebStorageAdapter } from '@punto-park-u/shared-stores'

// Initialize with browser localStorage
setStorageAdapter(createWebStorageAdapter(localStorage))
