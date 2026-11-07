<script setup lang="ts">
import { OrbitControls as CientosOrbitControls } from '@tresjs/cientos'
import { TresCanvas, type TresContext } from '@tresjs/core'
import { Minus, Plus, RotateCcw, RotateCw, RotateCwSquare } from '@lucide/vue'
import { PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsInstance } from 'three-stdlib'
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import ShirtPreview from '@/components/shirts/ShirtPreview.vue'
import ShirtModel3D from '@/components/shirts/ShirtModel3D.vue'
import { SHIRT_MODELS } from '@/data/shirtModels'
import { detectViewerFallback, type ViewerFallbackReason } from '@/lib/viewerSupport'
import { SHIRT_TYPE_DEFINITIONS, type ShirtType, type ShirtView } from '@/types/shirt'

type ViewerState = 'checking' | 'loading' | 'ready' | 'fallback' | 'error'
type ViewerMode = 'auto' | '3d' | 'fallback'

interface Props {
  type: ShirtType
  view?: ShirtView
  mode?: ViewerMode
}

interface OrbitControlsExpose {
  instance: OrbitControlsInstance | null
}

const props = withDefaults(defineProps<Props>(), {
  view: 'front',
  mode: 'auto',
})

const emit = defineEmits<{
  'update:view': [view: ShirtView]
}>()

const MIN_DISTANCE = 4.4
const MAX_DISTANCE = 8.2
const ROTATION_STEP = Math.PI / 8
const viewerCamera = markRaw(new PerspectiveCamera(40, 1, 0.1, 50))
viewerCamera.position.set(0, 0, 6.7)

const modelDefinition = computed(() => SHIRT_MODELS[props.type])
const shirtDefinition = computed(() => SHIRT_TYPE_DEFINITIONS[props.type])
const viewerState = ref<ViewerState>(props.mode === 'fallback' ? 'fallback' : 'checking')
const fallbackReason = ref<ViewerFallbackReason | null>(
  props.mode === 'fallback' ? 'low-performance' : null,
)
const retryKey = ref(0)
const controlsRef = ref<OrbitControlsExpose | null>(null)
const cameraSide = ref<ShirtView>(props.view)
const loadTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const isInteractive = computed(() => viewerState.value === 'ready')
const isFallback = computed(() => viewerState.value === 'fallback' || viewerState.value === 'error')
const stateMessage = computed(() => {
  if (viewerState.value === 'loading' || viewerState.value === 'checking') {
    return 'Loading the interactive 3D shirt.'
  }
  if (viewerState.value === 'error') {
    return 'The 3D shirt could not load. The front and back preview is still available.'
  }
  if (fallbackReason.value === 'low-performance') {
    return '3D is off to keep this page responsive. The front and back preview is still available.'
  }
  if (fallbackReason.value === 'unsupported') {
    return 'This browser could not start 3D graphics. The front and back preview is still available.'
  }
  return 'Interactive 3D shirt ready. Drag to rotate and pinch or scroll to zoom.'
})
const accessibleLabel = computed(
  () => `${shirtDefinition.value.name}, interactive rotatable 3D preview`,
)

function clearLoadTimeout() {
  if (!loadTimeout.value) return
  clearTimeout(loadTimeout.value)
  loadTimeout.value = null
}

function startLoadTimeout() {
  clearLoadTimeout()
  loadTimeout.value = setTimeout(() => {
    if (viewerState.value === 'loading') viewerState.value = 'error'
  }, 15_000)
}

function start3d() {
  fallbackReason.value = null
  viewerState.value = 'loading'
  retryKey.value += 1
  startLoadTimeout()
}

function configureViewer() {
  if (props.mode === 'fallback') {
    fallbackReason.value = 'low-performance'
    viewerState.value = 'fallback'
    return
  }

  if (props.mode === '3d') {
    start3d()
    return
  }

  const reason = detectViewerFallback()
  if (reason) {
    fallbackReason.value = reason
    viewerState.value = 'fallback'
    return
  }

  start3d()
}

function onCanvasReady(context: TresContext) {
  const renderer = context.renderer as TresContext['renderer'] & {
    setPixelRatio?: (ratio: number) => void
  }
  renderer.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, 1.75))
}

function onViewerError() {
  clearLoadTimeout()
  viewerState.value = 'error'
}

async function onModelLoaded() {
  clearLoadTimeout()
  viewerState.value = 'ready'
  await nextTick()
  snapToView(props.view)
}

function controls() {
  return controlsRef.value?.instance ?? null
}

function snapToView(side: ShirtView) {
  const orbit = controls()
  if (!orbit) return
  cameraSide.value = side
  orbit.setPolarAngle(Math.PI / 2)
  orbit.setAzimuthalAngle(side === 'front' ? 0 : Math.PI)
  orbit.update()
}

function setView(side: ShirtView) {
  cameraSide.value = side
  emit('update:view', side)
  if (isInteractive.value) snapToView(side)
}

function rotate(direction: -1 | 1) {
  const orbit = controls()
  if (!orbit || !isInteractive.value) return
  orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + direction * ROTATION_STEP)
  orbit.update()
}

function zoom(direction: 'in' | 'out') {
  const orbit = controls()
  if (!orbit || !isInteractive.value) return

  const offset = orbit.object.position.clone().sub(orbit.target)
  const nextDistance = Math.min(
    MAX_DISTANCE,
    Math.max(MIN_DISTANCE, offset.length() * (direction === 'in' ? 0.84 : 1.18)),
  )
  offset.setLength(nextDistance)
  orbit.object.position.copy(orbit.target).add(offset)
  orbit.update()
}

function onControlsChange(orbit: OrbitControlsInstance) {
  const azimuth = orbit.getAzimuthalAngle()
  const normalized = Math.atan2(Math.sin(azimuth), Math.cos(azimuth))
  const nextSide: ShirtView = Math.abs(normalized) <= Math.PI / 2 ? 'front' : 'back'
  if (nextSide === cameraSide.value) return
  cameraSide.value = nextSide
  emit('update:view', nextSide)
}

function onViewerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    rotate(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    rotate(1)
  } else if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoom('in')
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    zoom('out')
  }
}

watch(
  () => props.view,
  (view) => {
    if (view === cameraSide.value) return
    cameraSide.value = view
    if (isInteractive.value) snapToView(view)
  },
)

watch(
  () => props.type,
  () => configureViewer(),
)

onMounted(configureViewer)
onBeforeUnmount(clearLoadTimeout)
</script>

<template>
  <div
    data-ui="shirt-viewer-3d"
    class="bg-[var(--brand-soft)]"
    role="group"
    :aria-label="accessibleLabel"
    @keydown="onViewerKeydown"
  >
    <div class="viewer-stage relative h-[22rem] overflow-hidden sm:h-[30rem]">
      <TresCanvas
        v-if="!isFallback && viewerState !== 'checking'"
        :key="retryKey"
        clear-color="#eaf8ef"
        :antialias="true"
        :alpha="false"
        :fail-if-major-performance-caveat="true"
        :fps-limit="45"
        :render-mode="viewerState === 'ready' ? 'always' : 'on-demand'"
        :camera="viewerCamera"
        @ready="onCanvasReady"
        @error="onViewerError"
      >
        <TresHemisphereLight :args="['#ffffff', '#b6c5ba', 2.5]" />
        <TresDirectionalLight :position="[-3, 4, 5]" :intensity="2.4" />
        <TresDirectionalLight :position="[4, 1, -4]" :intensity="1.25" />
        <TresMesh
          :position="[0, -1.82, 0]"
          :rotation="[-Math.PI / 2, 0, 0]"
          :scale="[1.8, 0.75, 1]"
        >
          <TresCircleGeometry :args="[1, 48]" />
          <TresMeshBasicMaterial color="#bdcbbf" :transparent="true" :opacity="0.24" />
        </TresMesh>

        <ShirtModel3D
          :key="`${props.type}-${retryKey}`"
          :path="modelDefinition.path"
          :scale="modelDefinition.scale"
          @loaded="onModelLoaded"
          @error="onViewerError"
        />

        <CientosOrbitControls
          ref="controlsRef"
          :target="modelDefinition.cameraTarget"
          :enable-damping="true"
          :damping-factor="0.08"
          :enable-pan="false"
          :enable-zoom="true"
          :min-distance="MIN_DISTANCE"
          :max-distance="MAX_DISTANCE"
          :min-polar-angle="1.22"
          :max-polar-angle="1.92"
          :rotate-speed="0.72"
          :zoom-speed="0.8"
          :touches="{ ONE: 0, TWO: 2 }"
          @change="onControlsChange"
        />
      </TresCanvas>

      <ShirtPreview v-else :type="props.type" :view="props.view" />

      <div
        v-if="viewerState === 'loading' || viewerState === 'checking'"
        class="absolute inset-0 grid place-content-center bg-[rgb(234_248_239/88%)] px-6 text-center"
        role="status"
      >
        <RotateCwSquare
          class="mx-auto size-7 animate-spin text-[var(--brand-strong)]"
          aria-hidden="true"
        />
        <p class="mt-3 text-sm font-semibold text-[var(--text)]">Preparing the 3D shirt</p>
        <p class="mt-1 text-sm text-[var(--muted)]">The controls will appear when it is ready.</p>
      </div>
    </div>

    <div
      v-if="isFallback"
      class="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <p class="text-sm leading-6 text-[var(--muted)]">{{ stateMessage }}</p>
      <button
        type="button"
        class="min-h-11 shrink-0 rounded-[var(--radius-small)] border border-[var(--control)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] outline-none hover:border-[var(--control-hover)] focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]"
        @click="start3d"
      >
        Try 3D
      </button>
    </div>

    <div
      class="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div
        class="grid grid-cols-2 rounded-[var(--radius-small)] bg-[var(--raised)] p-1"
        aria-label="Garment side"
      >
        <button
          v-for="side in ['front', 'back'] as ShirtView[]"
          :key="side"
          type="button"
          :aria-pressed="props.view === side"
          :class="[
            'min-h-11 rounded-md px-5 text-sm font-semibold capitalize outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--focus-ring)]',
            props.view === side
              ? 'bg-[var(--surface)] text-[var(--text)]'
              : 'text-[var(--muted)] hover:text-[var(--text)]',
          ]"
          @click="setView(side)"
        >
          {{ side }}
        </button>
      </div>

      <div class="flex items-center gap-1" aria-label="3D shirt controls">
        <button
          type="button"
          class="viewer-control"
          :disabled="!isInteractive"
          aria-label="Rotate shirt left"
          @click="rotate(-1)"
        >
          <RotateCcw aria-hidden="true" />
        </button>
        <button
          type="button"
          class="viewer-control"
          :disabled="!isInteractive"
          aria-label="Rotate shirt right"
          @click="rotate(1)"
        >
          <RotateCw aria-hidden="true" />
        </button>
        <button
          type="button"
          class="viewer-control"
          :disabled="!isInteractive"
          aria-label="Zoom in"
          @click="zoom('in')"
        >
          <Plus aria-hidden="true" />
        </button>
        <button
          type="button"
          class="viewer-control"
          :disabled="!isInteractive"
          aria-label="Zoom out"
          @click="zoom('out')"
        >
          <Minus aria-hidden="true" />
        </button>
      </div>
    </div>

    <p class="sr-only" aria-live="polite">{{ stateMessage }}</p>
    <p
      v-if="isInteractive"
      class="border-t border-[var(--border)] bg-[var(--surface)] px-4 pb-3 text-xs leading-5 text-[var(--muted)]"
    >
      Drag to rotate · Pinch or scroll to zoom · Arrow keys rotate when the viewer is focused
    </p>
  </div>
</template>

<style scoped>
.viewer-stage :deep(canvas) {
  cursor: grab;
  touch-action: none;
}

.viewer-stage :deep(canvas:active) {
  cursor: grabbing;
}

.viewer-stage :deep(canvas:focus-visible) {
  outline: 3px solid var(--focus-ring);
  outline-offset: -3px;
}

.viewer-control {
  display: inline-grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 0;
  border-radius: var(--radius-small);
  background: transparent;
  color: var(--text);
  outline: none;
}

.viewer-control:hover:not(:disabled) {
  background: var(--raised);
}

.viewer-control:focus-visible {
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.viewer-control:disabled {
  cursor: not-allowed;
  color: var(--muted);
  opacity: 0.42;
}

.viewer-control :deep(svg) {
  width: 1.125rem;
  height: 1.125rem;
  stroke-width: 1.8;
}
</style>
