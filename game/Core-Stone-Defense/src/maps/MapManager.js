/**
 * Core Stone 3D FPS - Modular Map Expansion Framework
 * Didesain agar peta (Maps) dapat terus berkembang dan ditambahkan dengan mudah
 */

export const MAP_REGISTRY = {
  FOREST_OUTPOST: {
    id: 'forest_outpost',
    name: '🌲 Pos Pertahanan Hutan Pinus (Map 1)',
    gridCols: 8,
    gridRows: 20,
    safeRows: [1, 4],
    fenceRow: 5,
    patrolRows: [12, 15],
    spawnRow: 19,
    skyColor: 0x020617,
    groundColor: 0x1e293b,
    environment: 'dense_pine_forest',
    fogDensity: 0.02
  },
  DESERT_CANYON: {
    id: 'desert_canyon',
    name: '🏜️ Lembah Gurun Terlarang (Future Map 2)',
    gridCols: 10,
    gridRows: 24,
    safeRows: [1, 5],
    fenceRow: 6,
    patrolRows: [14, 18],
    spawnRow: 23,
    skyColor: 0x1a0f05,
    groundColor: 0x3d2314,
    environment: 'canyon_rocks',
    fogDensity: 0.015
  },
  CYBERPUNK_FORTRESS: {
    id: 'cyber_fortress',
    name: '🏙️ Benteng Neon Kota Cyber (Future Map 3)',
    gridCols: 12,
    gridRows: 30,
    safeRows: [1, 6],
    fenceRow: 7,
    patrolRows: [18, 24],
    spawnRow: 29,
    skyColor: 0x050510,
    groundColor: 0x0f172a,
    environment: 'neon_city_grid',
    fogDensity: 0.025
  }
};

export class MapEngine {
  constructor(scene) {
    this.scene = scene;
    this.currentMap = MAP_REGISTRY.FOREST_OUTPOST;
  }

  loadMap(mapId) {
    if (!MAP_REGISTRY[mapId]) return;
    this.currentMap = MAP_REGISTRY[mapId];
    console.log(`[MapEngine] Memuat peta baru: ${this.currentMap.name}`);
  }
}
