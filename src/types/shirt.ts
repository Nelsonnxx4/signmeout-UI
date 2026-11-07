export const SHIRT_TYPES = ['short-sleeve', 'long-sleeve'] as const

export type ShirtType = (typeof SHIRT_TYPES)[number]
export type ShirtStatus = 'draft' | 'published'
export type ShirtView = 'front' | 'back'
export type ShirtSignableSurface =
  | 'front'
  | 'back'
  | 'left-sleeve-front'
  | 'right-sleeve-front'
  | 'left-sleeve-back'
  | 'right-sleeve-back'

export interface Shirt {
  id: string
  type: ShirtType
  slug: string
  modelVersion: string
  status: ShirtStatus
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface ShirtTypeDefinition {
  type: ShirtType
  name: string
  shortName: string
  description: string
  modelLabel: string
}

export const SHIRT_TYPE_DEFINITIONS: Record<ShirtType, ShirtTypeDefinition> = {
  'short-sleeve': {
    type: 'short-sleeve',
    name: 'Short-sleeve T-shirt',
    shortName: 'Short sleeve',
    description: 'Pure-white XL crew-neck T-shirt with a loose, relaxed fit.',
    modelLabel: 'Short-sleeve model',
  },
  'long-sleeve': {
    type: 'long-sleeve',
    name: 'Long-sleeve shirt',
    shortName: 'Long sleeve',
    description: 'Pure-white button-down shirt with a traditional collar and relaxed fit.',
    modelLabel: 'Long-sleeve model',
  },
}
