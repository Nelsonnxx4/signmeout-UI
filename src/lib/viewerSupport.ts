export type ViewerFallbackReason = 'low-performance' | 'unsupported'

interface NavigatorPerformanceHints extends Navigator {
  deviceMemory?: number
  connection?: {
    saveData?: boolean
  }
}

export function detectViewerFallback(): ViewerFallbackReason | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'unsupported'

  const navigatorHints = navigator as NavigatorPerformanceHints
  if (
    navigatorHints.connection?.saveData ||
    (navigatorHints.deviceMemory !== undefined && navigatorHints.deviceMemory <= 2) ||
    (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 2)
  ) {
    return 'low-performance'
  }

  try {
    if (!('WebGLRenderingContext' in window) && !('WebGL2RenderingContext' in window)) {
      return 'unsupported'
    }

    const canvas = document.createElement('canvas')
    const contextOptions = { failIfMajorPerformanceCaveat: true }
    const context = (canvas.getContext('webgl2', contextOptions) ??
      canvas.getContext('webgl', contextOptions)) as
      | WebGLRenderingContext
      | WebGL2RenderingContext
      | null

    if (!context) return 'unsupported'

    const loseContext = context.getExtension('WEBGL_lose_context')
    loseContext?.loseContext()
    return null
  } catch {
    return 'unsupported'
  }
}
