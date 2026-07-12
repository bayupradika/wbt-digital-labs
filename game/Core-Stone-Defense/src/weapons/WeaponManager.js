/**
 * Core Stone 3D FPS - Modular Weapon & Damage Systems Framework
 * Didesain khusus untuk pengembangan berkelanjutan (Desktop Game Engine)
 */

export const WEAPON_TYPES = {
  TACTICAL_PISTOL: {
    id: 'tactical_pistol',
    name: '🔫 Pistol Taktis FPS',
    damage: 10,
    fireRate: 2, // 2 shots/second (30 ticks cooldown at 60 FPS)
    isAutomatic: false,
    color: 0xfbbf24,
    description: 'Senjata standar gengsi pertahanan pos. Kerusakan akurat.'
  },
  SURVIVAL_KNIFE: {
    id: 'survival_knife',
    name: '🗡️ Pisau Survival Komando',
    damage: 15,
    fireRate: 4, // Melee fast strike
    range: 2.2,
    color: 0xe2e8f0,
    description: 'Serangan jarak dekat tanpa menghabiskan amunisi.'
  },
  SCIFI_TURRET: {
    id: 'scifi_turret',
    name: '🏗️ Menara Turret Railgun',
    damage: 8,
    fireRate: 6, // 3x kecepatan serang user (10 ticks cooldown at 60 FPS)
    costGold: 100,
    color: 0x38bdf8,
    description: 'Menara pertahanan abadi berkecepatan tinggi.'
  },
  // Kerangka Pengembangan Senjata Masa Depan:
  LASER_BEAM_RIFLE: {
    id: 'laser_beam_rifle',
    name: '⚡ Laser DPS Rifle (Future Feature)',
    damagePerTick: 3, // Continuous DPS stream
    fireRate: 60,
    isContinuous: true,
    color: 0x10b981,
    description: 'Menembakkan sinar plasma kontinyu yang melelehkan pertahanan preman musuh.'
  },
  HEAVY_MORTAR: {
    id: 'heavy_mortar',
    name: '🚀 Mortar Peledak Area (Future Feature)',
    damage: 45,
    splashRadius: 3.5,
    fireRate: 0.5,
    color: 0xef4444,
    description: 'Meluncurkan proyektil parabolik dengan ledakan area luas untuk mengatasi gelombang 1800 musuh.'
  }
};

export class WeaponSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.equippedWeapon = WEAPON_TYPES.TACTICAL_PISTOL;
    this.cooldown = 0;
  }

  updateCooldown() {
    if (this.cooldown > 0) this.cooldown--;
  }

  canFire() {
    return this.cooldown === 0;
  }

  triggerFireRateCooldown() {
    const ticksPerSecond = 60;
    this.cooldown = Math.max(1, Math.floor(ticksPerSecond / this.equippedWeapon.fireRate));
  }
}
