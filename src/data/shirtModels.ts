import type { ShirtSignableSurface, ShirtType } from '@/types/shirt'

export type UvBounds = readonly [uMin: number, vMin: number, uMax: number, vMax: number]

export interface SignableUvArea {
  surface: ShirtSignableSurface
  modelMesh: string
  uvBounds: UvBounds
  seamInset: number
  label: string
}

export interface ShirtModelDefinition {
  path: string
  scale: number
  cameraTarget: readonly [number, number, number]
  signableAreas: readonly SignableUvArea[]
  protectedDetails: readonly string[]
}

const UV_BOUNDS = {
  front: [0.05, 0.54, 0.45, 0.95],
  back: [0.55, 0.54, 0.95, 0.95],
  'left-sleeve-front': [0.05, 0.27, 0.22, 0.48],
  'right-sleeve-front': [0.28, 0.27, 0.45, 0.48],
  'left-sleeve-back': [0.55, 0.27, 0.72, 0.48],
  'right-sleeve-back': [0.78, 0.27, 0.95, 0.48],
} as const satisfies Record<ShirtSignableSurface, UvBounds>

function signableAreas(seamInset: number): readonly SignableUvArea[] {
  return [
    {
      surface: 'front',
      modelMesh: 'TorsoFront',
      uvBounds: UV_BOUNDS.front,
      seamInset,
      label: 'Front torso',
    },
    {
      surface: 'back',
      modelMesh: 'TorsoBack',
      uvBounds: UV_BOUNDS.back,
      seamInset,
      label: 'Back torso',
    },
    {
      surface: 'left-sleeve-front',
      modelMesh: 'LeftSleeveFront',
      uvBounds: UV_BOUNDS['left-sleeve-front'],
      seamInset,
      label: 'Left sleeve front',
    },
    {
      surface: 'right-sleeve-front',
      modelMesh: 'RightSleeveFront',
      uvBounds: UV_BOUNDS['right-sleeve-front'],
      seamInset,
      label: 'Right sleeve front',
    },
    {
      surface: 'left-sleeve-back',
      modelMesh: 'LeftSleeveBack',
      uvBounds: UV_BOUNDS['left-sleeve-back'],
      seamInset,
      label: 'Left sleeve back',
    },
    {
      surface: 'right-sleeve-back',
      modelMesh: 'RightSleeveBack',
      uvBounds: UV_BOUNDS['right-sleeve-back'],
      seamInset,
      label: 'Right sleeve back',
    },
  ]
}

export const SHIRT_MODELS: Record<ShirtType, ShirtModelDefinition> = {
  'short-sleeve': {
    path: '/models/shirts/short-sleeve.glb',
    scale: 0.9,
    cameraTarget: [0, -0.04, 0],
    signableAreas: signableAreas(0.06),
    protectedDetails: ['Crew neck', 'Shoulder seams', 'Sleeve hems', 'Bottom hem'],
  },
  'long-sleeve': {
    path: '/models/shirts/long-sleeve.glb',
    scale: 0.95,
    cameraTarget: [0, -0.05, 0],
    signableAreas: signableAreas(0.075),
    protectedDetails: ['Collar', 'Button placket', 'Buttons', 'Cuffs', 'Yoke and seams'],
  },
}
