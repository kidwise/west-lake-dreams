import type * as Phaser from 'phaser';

/**
 * A reflection on water: the texture is cut into horizontal strips, and each
 * strip slides sideways with the ripples. `rough` 0 = a perfect mirror,
 * 1 = badly broken up.
 */
export class Shimmer {
  readonly strips: Phaser.GameObjects.Image[] = [];
  x: number;
  y: number;
  rough = 1;
  scaleX = 1;
  scaleY = 1;
  alpha = 1;
  private h: number;
  private n: number;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string, opts: { strips?: number; depth?: number; flip?: boolean } = {}) {
    this.x = x;
    this.y = y;
    const tex = scene.textures.get(key).getSourceImage() as { width: number; height: number };
    this.h = tex.height;
    this.n = opts.strips ?? 30;
    const sh = this.h / this.n;
    for (let i = 0; i < this.n; i++) {
      const img = scene.add.image(x, y, key).setDepth(opts.depth ?? 10);
      img.setCrop(0, i * sh, tex.width, sh + 1);
      if (opts.flip) img.setFlipY(true);
      this.strips.push(img);
    }
  }

  update(time: number): void {
    const amp = 4 + 26 * this.rough;
    this.strips.forEach((s, i) => {
      const k = i / this.n;
      const wave = Math.sin(time * 0.003 + i * 0.9) * amp * (0.4 + k) + Math.sin(time * 0.0047 + i * 2.3) * amp * 0.4 * this.rough;
      s.setPosition(this.x + wave * this.scaleX, this.y).setScale(this.scaleX * (1 + this.rough * 0.04 * Math.sin(i + time * 0.002)), this.scaleY);
      // broken water: some strips flicker out
      const gap = this.rough > 0.3 && Math.sin(i * 7.1 + time * 0.004) > 1.2 - this.rough ? 0.25 : 1;
      s.setAlpha(this.alpha * gap);
    });
  }

  setDepth(d: number): this {
    for (const s of this.strips) s.setDepth(d);
    return this;
  }

  setVisible(v: boolean): this {
    for (const s of this.strips) s.setVisible(v);
    return this;
  }

  setBlendMode(m: Phaser.BlendModes): this {
    for (const s of this.strips) s.setBlendMode(m);
    return this;
  }

  destroy(): void {
    for (const s of this.strips) s.destroy();
  }
}
