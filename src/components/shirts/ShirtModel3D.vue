<script setup lang="ts">
import { useGLTF } from '@tresjs/cientos'
import { toRef, watch, type Ref } from 'vue'

interface Props {
  path: string
  scale: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  loaded: []
  error: [error: unknown]
}>()

const loadResult = useGLTF(
  toRef(() => props.path),
  {
    traverse(child) {
      if (!('isMesh' in child) || !child.isMesh) return
      child.castShadow = false
      child.receiveShadow = false
    },
  },
)
const model = loadResult.state
const error = (loadResult as typeof loadResult & { error: Ref<unknown> }).error

watch(
  model,
  (loadedModel) => {
    if (loadedModel?.scene) emit('loaded')
  },
  { immediate: true },
)

watch(error, (loadError) => {
  if (loadError) emit('error', loadError)
})
</script>

<template>
  <TresGroup v-if="model?.scene" :scale="props.scale" :position="[0, -0.02, 0]">
    <primitive :object="model.scene" />
  </TresGroup>
</template>
