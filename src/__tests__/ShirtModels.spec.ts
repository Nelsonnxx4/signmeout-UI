import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { Mesh } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

import { SHIRT_MODELS, type UvBounds } from '@/data/shirtModels'
import type { ShirtType } from '@/types/shirt'

function rectanglesOverlap(first: UvBounds, second: UvBounds) {
  return !(
    first[2] <= second[0] ||
    second[2] <= first[0] ||
    first[3] <= second[1] ||
    second[3] <= first[1]
  )
}

describe('shirt 3D model assets', () => {
  it.each(Object.entries(SHIRT_MODELS) as [ShirtType, (typeof SHIRT_MODELS)[ShirtType]][])(
    '%s has validated meshes for every configured signable UV area',
    async (shirtType, definition) => {
      const asset = await readFile(resolve(process.cwd(), `public${definition.path}`))
      const arrayBuffer = new Uint8Array(asset).buffer
      const gltf = await new GLTFLoader().parseAsync(arrayBuffer, '')
      const signableMeshes = new Map<string, { hasUv: boolean; uvBounds: UvBounds }>()

      gltf.scene.traverse((object) => {
        if (!(object instanceof Mesh) || !object.userData.signable) return
        signableMeshes.set(object.name, {
          hasUv: Boolean(object.geometry.attributes.uv),
          uvBounds: object.userData.uvBounds as UvBounds,
        })
      })

      expect(signableMeshes.size).toBe(6)
      expect(gltf.scene.children[0]?.userData.garmentType).toBe(shirtType)

      for (const area of definition.signableAreas) {
        expect(signableMeshes.get(area.modelMesh)).toEqual({
          hasUv: true,
          uvBounds: [...area.uvBounds],
        })
        expect(area.uvBounds.every((coordinate) => coordinate >= 0 && coordinate <= 1)).toBe(true)
      }

      definition.signableAreas.forEach((area, index) => {
        definition.signableAreas.slice(index + 1).forEach((otherArea) => {
          expect(rectanglesOverlap(area.uvBounds, otherArea.uvBounds)).toBe(false)
        })
      })
    },
  )
})
