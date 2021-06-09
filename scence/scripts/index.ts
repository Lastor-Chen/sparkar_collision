/// <reference path="index.d.ts" />
import { queryAsset } from './find_api'
import { runAABB } from './aabb'
import { runLeftRight } from './left_right'
import { runMultiLines } from './multi_lines'
import { runCircle } from './circle'
import { runGJK } from './gjk'

(async function () {
  const asset = await queryAsset()

  // 矩形-矩形, 軸對稱包圍盒 (Axis-Aligned Bounding Box), 無旋轉
  runAABB(asset)

  // 矩形-矩形, 左右側判定法, 可旋轉
  // runLeftRight(asset)

  // 直線式道路, 連續線段判定, 左右側法
  // runMultiLines(asset)

  // 圓形-圓形 or 圓形-矩形, 半徑法
  // runCircle(asset)

  // 凸多邊形, GJK 演算法, 運算成本過高, 會當掉
  // runGJK(asset)
})();
