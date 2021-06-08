import Scene from 'Scene'
import Materials from 'Materials'
import Textures from 'Textures'

/** Return a renamed asset Object. */
export async function queryAsset() {
  // @ts-ignore
  const assets = await Promise.all([
    Scene.root.findFirst('user'),
    Scene.root.findByPath('**/gameMap/vertices/vertex*'),
    Scene.root.findFirst('circle'),
    Scene.root.findFirst('circleS'),
    Scene.root.findFirst('gjk_plane'),
    Scene.root.findFirst('trapezium'),
    Scene.root.findByPath('**/GJK/trapezium/rect0/vertex*'),
    Materials.findFirst('circle'),
    Materials.findFirst('collider'),
  ])

  // rename assets
  const names = [
    'user',
    'vertices',
    'circle',
    'circleS',
    'gjk_plane',
    'gjk_trapezium',
    'gjk_vertices',
    'circleMat',
    'colliderMat',
  ]

  // build asset Object
  const asset = {}
  names.forEach((key, index) => {
    asset[key] = assets[index]
  })

  return asset
}