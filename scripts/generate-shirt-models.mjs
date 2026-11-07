import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  ShapeUtils,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const OUTPUT_DIRECTORY = resolve('public/models/shirts')
const FRONT_Z = 0.14
const BACK_Z = -0.14

const UV_AREAS = {
  front: [0.05, 0.54, 0.45, 0.95],
  back: [0.55, 0.54, 0.95, 0.95],
  'left-sleeve-front': [0.05, 0.27, 0.22, 0.48],
  'right-sleeve-front': [0.28, 0.27, 0.45, 0.48],
  'left-sleeve-back': [0.55, 0.27, 0.72, 0.48],
  'right-sleeve-back': [0.78, 0.27, 0.95, 0.48],
}

const whiteFabric = new MeshStandardMaterial({
  name: 'PureWhiteFabric',
  color: 0xffffff,
  roughness: 0.88,
  metalness: 0,
})

const seamFabric = new MeshStandardMaterial({
  name: 'WhiteSeams',
  color: 0xe8ece9,
  roughness: 0.92,
  metalness: 0,
})

const buttonMaterial = new MeshStandardMaterial({
  name: 'WhiteButtons',
  color: 0xf7f8f7,
  roughness: 0.72,
  metalness: 0,
})

const deepCloneOutline = (outline) => outline.map(([x, y]) => [x, y])

function makeSurfaceGeometry(outline, z, uvBounds, outward = 1, bulge = 0.045) {
  const points = outline.map(([x, y]) => new Vector2(x, y))
  const triangles = ShapeUtils.triangulateShape(points, [])
  const xValues = outline.map(([x]) => x)
  const yValues = outline.map(([, y]) => y)
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)
  const width = Math.max(maxX - minX, 0.001)
  const height = Math.max(maxY - minY, 0.001)
  const [uMin, vMin, uMax, vMax] = uvBounds

  const positions = []
  const uvs = []

  for (const [x, y] of outline) {
    const normalizedX = ((x - minX) / width) * 2 - 1
    const normalizedY = ((y - minY) / height) * 2 - 1
    const clothCurve = Math.max(0, 1 - normalizedX ** 2) * (0.72 + 0.28 * (1 - normalizedY ** 2))
    positions.push(x, y, z + outward * bulge * clothCurve)
    uvs.push(
      uMin + ((x - minX) / width) * (uMax - uMin),
      vMin + ((y - minY) / height) * (vMax - vMin),
    )
  }

  const indices = []
  for (const [a, b, c] of triangles) {
    const [ax, ay] = outline[a]
    const [bx, by] = outline[b]
    const [cx, cy] = outline[c]
    const signedArea = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    const pointsOutward = Math.sign(signedArea || 1) === Math.sign(outward)
    indices.push(...(pointsOutward ? [a, b, c] : [a, c, b]))
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function makeSeamGeometry(outline, frontZ = FRONT_Z, backZ = BACK_Z) {
  const positions = []
  const uvs = []
  const indices = []

  outline.forEach(([x, y], index) => {
    const nextIndex = (index + 1) % outline.length
    const [nextX, nextY] = outline[nextIndex]
    const baseIndex = positions.length / 3
    positions.push(x, y, frontZ, nextX, nextY, frontZ, nextX, nextY, backZ, x, y, backZ)
    uvs.push(0, 1, 1, 1, 1, 0, 0, 0)
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2, baseIndex, baseIndex + 2, baseIndex + 3)
  })

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function addGarmentPart(
  group,
  { outline, name, frontSurface, backSurface, frontUv, backUv, bulge = 0.045 },
) {
  const front = new Mesh(makeSurfaceGeometry(outline, FRONT_Z, frontUv, 1, bulge), whiteFabric)
  front.name = `${name}Front`
  front.castShadow = true
  front.receiveShadow = true
  front.userData = {
    signable: true,
    surface: frontSurface,
    uvBounds: frontUv,
  }

  const back = new Mesh(
    makeSurfaceGeometry(deepCloneOutline(outline), BACK_Z, backUv, -1, bulge),
    whiteFabric,
  )
  back.name = `${name}Back`
  back.castShadow = true
  back.receiveShadow = true
  back.userData = {
    signable: true,
    surface: backSurface,
    uvBounds: backUv,
  }

  const seam = new Mesh(makeSeamGeometry(outline), seamFabric)
  seam.name = `${name}Seams`
  seam.castShadow = true
  seam.userData = { signable: false, reason: 'seam' }

  group.add(front, back, seam)
}

function addRibbon(group, name, points, radius = 0.025, material = seamFabric) {
  const curve = new CatmullRomCurve3(
    points.map((point) => new Vector3(...point)),
    false,
    'centripetal',
  )
  const ribbon = new Mesh(new TubeGeometry(curve, 32, radius, 6, false), material)
  ribbon.name = name
  ribbon.castShadow = true
  ribbon.userData = { signable: false, reason: 'garment-detail' }
  group.add(ribbon)
}

function addFlatDetail(group, name, outline, z, material = whiteFabric) {
  const detail = new Mesh(makeSurfaceGeometry(outline, z, [0, 0, 0.01, 0.01], 1, 0), material)
  detail.name = name
  detail.castShadow = true
  detail.userData = { signable: false, reason: 'garment-detail' }
  group.add(detail)
  return detail
}

function buildShortSleeve() {
  const group = new Group()
  group.name = 'OversizedShortSleeveCrewNeck'
  group.userData = {
    garmentType: 'short-sleeve',
    modelVersion: 'shirt-glb-1.0',
    color: 'pure-white',
    fit: 'oversized-relaxed',
  }

  const body = [
    [-1.3, -1.58],
    [-1.36, 0.72],
    [-1.12, 1.14],
    [-0.62, 1.5],
    [-0.47, 1.39],
    [-0.39, 1.24],
    [-0.22, 1.15],
    [0, 1.11],
    [0.22, 1.15],
    [0.39, 1.24],
    [0.47, 1.39],
    [0.62, 1.5],
    [1.12, 1.14],
    [1.36, 0.72],
    [1.3, -1.58],
  ]
  const leftSleeve = [
    [-0.58, 1.46],
    [-1.15, 1.27],
    [-1.74, 1.16],
    [-2.16, 0.62],
    [-1.57, 0.16],
    [-1.2, 0.61],
    [-0.94, 0.98],
  ]
  const rightSleeve = leftSleeve.map(([x, y]) => [-x, y]).reverse()

  addGarmentPart(group, {
    outline: body,
    name: 'Torso',
    frontSurface: 'front',
    backSurface: 'back',
    frontUv: UV_AREAS.front,
    backUv: UV_AREAS.back,
    bulge: 0.065,
  })
  addGarmentPart(group, {
    outline: leftSleeve,
    name: 'LeftSleeve',
    frontSurface: 'left-sleeve-front',
    backSurface: 'left-sleeve-back',
    frontUv: UV_AREAS['left-sleeve-front'],
    backUv: UV_AREAS['left-sleeve-back'],
    bulge: 0.035,
  })
  addGarmentPart(group, {
    outline: rightSleeve,
    name: 'RightSleeve',
    frontSurface: 'right-sleeve-front',
    backSurface: 'right-sleeve-back',
    frontUv: UV_AREAS['right-sleeve-front'],
    backUv: UV_AREAS['right-sleeve-back'],
    bulge: 0.035,
  })

  addRibbon(
    group,
    'CrewNeckRib',
    [
      [-0.47, 1.4, 0.205],
      [-0.36, 1.21, 0.22],
      [0, 1.08, 0.225],
      [0.36, 1.21, 0.22],
      [0.47, 1.4, 0.205],
    ],
    0.035,
  )
  addRibbon(
    group,
    'LeftSleeveHem',
    [
      [-2.13, 0.62, 0.165],
      [-1.86, 0.39, 0.18],
      [-1.58, 0.18, 0.165],
    ],
    0.018,
  )
  addRibbon(
    group,
    'RightSleeveHem',
    [
      [2.13, 0.62, 0.165],
      [1.86, 0.39, 0.18],
      [1.58, 0.18, 0.165],
    ],
    0.018,
  )
  addRibbon(
    group,
    'BottomHem',
    [
      [-1.28, -1.53, 0.175],
      [0, -1.57, 0.205],
      [1.28, -1.53, 0.175],
    ],
    0.018,
  )

  group.rotation.x = -0.025
  return group
}

function buildLongSleeve() {
  const group = new Group()
  group.name = 'RelaxedLongSleeveButtonDown'
  group.userData = {
    garmentType: 'long-sleeve',
    modelVersion: 'shirt-glb-1.0',
    color: 'pure-white',
    fit: 'relaxed',
  }

  const body = [
    [-1.04, -1.66],
    [-1.13, 0.82],
    [-0.9, 1.24],
    [-0.56, 1.47],
    [-0.45, 1.28],
    [-0.24, 1.14],
    [0, 1.05],
    [0.24, 1.14],
    [0.45, 1.28],
    [0.56, 1.47],
    [0.9, 1.24],
    [1.13, 0.82],
    [1.04, -1.66],
    [0.66, -1.73],
    [0, -1.7],
    [-0.66, -1.73],
  ]
  const leftSleeve = [
    [-0.54, 1.42],
    [-0.94, 1.29],
    [-1.32, 0.94],
    [-1.52, 0.08],
    [-1.66, -1.16],
    [-1.25, -1.2],
    [-1.18, -0.02],
    [-0.91, 0.7],
  ]
  const rightSleeve = leftSleeve.map(([x, y]) => [-x, y]).reverse()

  addGarmentPart(group, {
    outline: body,
    name: 'Torso',
    frontSurface: 'front',
    backSurface: 'back',
    frontUv: UV_AREAS.front,
    backUv: UV_AREAS.back,
    bulge: 0.055,
  })
  addGarmentPart(group, {
    outline: leftSleeve,
    name: 'LeftSleeve',
    frontSurface: 'left-sleeve-front',
    backSurface: 'left-sleeve-back',
    frontUv: UV_AREAS['left-sleeve-front'],
    backUv: UV_AREAS['left-sleeve-back'],
    bulge: 0.03,
  })
  addGarmentPart(group, {
    outline: rightSleeve,
    name: 'RightSleeve',
    frontSurface: 'right-sleeve-front',
    backSurface: 'right-sleeve-back',
    frontUv: UV_AREAS['right-sleeve-front'],
    backUv: UV_AREAS['right-sleeve-back'],
    bulge: 0.03,
  })

  addFlatDetail(
    group,
    'LeftCollarWing',
    [
      [-0.48, 1.42],
      [-0.05, 1.08],
      [-0.16, 0.68],
      [-0.68, 1.24],
    ],
    0.235,
  )
  addFlatDetail(
    group,
    'RightCollarWing',
    [
      [0.48, 1.42],
      [0.05, 1.08],
      [0.16, 0.68],
      [0.68, 1.24],
    ],
    0.235,
  )

  const placket = new Mesh(new CylinderGeometry(0.055, 0.055, 2.7, 10), whiteFabric)
  placket.name = 'FrontButtonPlacket'
  placket.position.set(0, -0.28, 0.215)
  placket.userData = { signable: false, reason: 'button-placket' }
  placket.castShadow = true
  group.add(placket)

  const buttonY = [0.82, 0.48, 0.14, -0.2, -0.54, -0.88, -1.22]
  buttonY.forEach((y, index) => {
    const button = new Mesh(new CylinderGeometry(0.045, 0.045, 0.035, 16), buttonMaterial)
    button.name = `Button${index + 1}`
    button.position.set(0, y, 0.29)
    button.rotation.x = Math.PI / 2
    button.userData = { signable: false, reason: 'button' }
    button.castShadow = true
    group.add(button)
  })

  const leftCuff = new Mesh(new CylinderGeometry(0.215, 0.235, 0.38, 12), whiteFabric)
  leftCuff.name = 'LeftCuff'
  leftCuff.position.set(-1.46, -1.16, 0)
  leftCuff.rotation.z = Math.PI / 2
  leftCuff.userData = { signable: false, reason: 'cuff' }
  leftCuff.castShadow = true
  group.add(leftCuff)

  const rightCuff = leftCuff.clone()
  rightCuff.name = 'RightCuff'
  rightCuff.position.x = 1.46
  group.add(rightCuff)

  addRibbon(
    group,
    'BackYoke',
    [
      [-0.85, 1.05, -0.19],
      [0, 0.94, -0.215],
      [0.85, 1.05, -0.19],
    ],
    0.018,
  )
  addRibbon(
    group,
    'BottomHem',
    [
      [-1.02, -1.61, 0.17],
      [0, -1.68, 0.205],
      [1.02, -1.61, 0.17],
    ],
    0.018,
  )

  group.rotation.x = -0.025
  return group
}

class NodeFileReader {
  result = null
  error = null
  onloadend = null
  onerror = null

  readAsArrayBuffer(blob) {
    blob
      .arrayBuffer()
      .then((buffer) => {
        this.result = buffer
        this.onloadend?.({ target: this })
      })
      .catch((error) => {
        this.error = error
        this.onerror?.(error)
      })
  }

  readAsDataURL(blob) {
    blob
      .arrayBuffer()
      .then((buffer) => {
        const mime = blob.type || 'application/octet-stream'
        this.result = `data:${mime};base64,${Buffer.from(buffer).toString('base64')}`
        this.onloadend?.({ target: this })
      })
      .catch((error) => {
        this.error = error
        this.onerror?.(error)
      })
  }
}

globalThis.FileReader ??= NodeFileReader

async function exportGlb(group, filename) {
  const exporter = new GLTFExporter()
  const result = await exporter.parseAsync(group, {
    binary: true,
    onlyVisible: true,
    trs: false,
  })
  const outputPath = resolve(OUTPUT_DIRECTORY, filename)
  await writeFile(outputPath, Buffer.from(result))
  return outputPath
}

async function validateGlb(path, expectedType) {
  const buffer = await import('node:fs/promises').then(({ readFile }) => readFile(path))
  const loader = new GLTFLoader()
  const gltf = await loader.parseAsync(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
    '',
  )
  const surfaces = new Map()

  gltf.scene.traverse((object) => {
    if (!object.isMesh || !object.userData.signable) return
    if (!object.geometry.attributes.uv) {
      throw new Error(`${object.name} is missing a UV attribute.`)
    }
    const surface = object.userData.surface
    const bounds = object.userData.uvBounds
    if (!surface || !Array.isArray(bounds) || bounds.length !== 4) {
      throw new Error(`${object.name} is missing signable-surface metadata.`)
    }
    surfaces.set(surface, bounds)
  })

  const missing = Object.keys(UV_AREAS).filter((surface) => !surfaces.has(surface))
  if (missing.length) {
    throw new Error(`${expectedType} is missing signable surfaces: ${missing.join(', ')}`)
  }
  if (gltf.scene.children[0]?.userData.garmentType !== expectedType) {
    throw new Error(`${expectedType} garment metadata was not preserved in the GLB.`)
  }

  return surfaces.size
}

await mkdir(OUTPUT_DIRECTORY, { recursive: true })

const models = [
  ['short-sleeve.glb', 'short-sleeve', buildShortSleeve()],
  ['long-sleeve.glb', 'long-sleeve', buildLongSleeve()],
]

for (const [filename, type, group] of models) {
  const path = await exportGlb(group, filename)
  const surfaceCount = await validateGlb(path, type)
  console.log(`Generated ${filename} with ${surfaceCount} UV-mapped signable surfaces.`)
}
