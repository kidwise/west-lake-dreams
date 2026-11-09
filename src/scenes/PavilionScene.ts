import * as Phaser from 'phaser';
import { music } from '../core/music';
import { W, H, C } from '../core/config';
import type { StrKey } from '../core/i18n';
import { paintBackdrop, type Backdrop } from '../art/backdrop';
import { Cyclist, LOOKS, drawPerson, type Look } from '../art/Cyclist';
import { Dialogue, type Speaker } from '../ui/Dialogue';
import { run, type Route } from '../core/state';
import { tweenP, wait } from '../ui/narrate';
import { rng } from '../art/paint';
import { sfx } from '../core/sfx';

const FLOOR = 446;

/**
 * The pavilion (凉亭): talk over the next route, daydream about the bridges,
 * then — "我内急" — leave the bag with friends... and the dream ends.
 * part 1 = before the daydream, part 2 = after it.
 */
export class PavilionScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private dlg!: Dialogue;
  private people!: Record<'me' | 'gogo' | 'koko', Phaser.GameObjects.Graphics>;
  private bag!: Phaser.GameObjects.Image;

  constructor() {
    super('Pavilion');
  }

  create(data: { part?: 1 | 2 }): void {
    const part = data.part ?? 1;
    music.play('lake');
    this.backdrop = paintBackdrop(this, { horizon: 250, lakeBottom: 470 });
    this.paintSet();
    this.dlg = new Dialogue(this);
    this.cameras.main.fadeIn(800, 246, 241, 231);
    void (part === 1 ? this.partOne() : this.partTwo());
  }

  private paintSet(): void {
    // stone terrace
    const ground = this.add.graphics().setDepth(1);
    ground.fillStyle(C.stone, 1);
    ground.fillRect(0, 462, W, H - 462);
    ground.fillStyle(0xbcb4a5, 1);
    ground.fillRect(0, 462, W, 8);
    ground.lineStyle(1, 0xaaa294, 0.7);
    for (let y = 500; y < H; y += 46) ground.lineBetween(0, y, W, y);
    for (let x = 0; x < W; x += 90) ground.lineBetween(x + ((x / 90) % 2) * 45, 470, x + ((x / 90) % 2) * 45 - 40, H);

    // lotus leaves on the water behind the terrace
    const r = rng(9);
    for (let x = -20; x < W + 40; x += 34 + r() * 30) {
      this.add.image(x, 450 + r() * 12, r() < 0.5 ? 'leafFlat' : 'leaf3').setOrigin(0.5, 1).setScale(0.35 + r() * 0.2).setDepth(2).setAlpha(0.9);
    }

    this.add.image(W / 2, FLOOR + 44, 'pavilion').setOrigin(0.5, 1).setScale(1.05).setDepth(3);

    // parked bicycles
    const parked: [number, Look][] = [
      [150, LOOKS.koko],
      [255, LOOKS.gogo],
      [360, LOOKS.me],
    ];
    parked.forEach(([x, look], i) => {
      const bike = new Cyclist(this, look, 0.95);
      bike.withRider = false;
      bike.wheelAngle = i;
      bike.crank = i * 1.3;
      bike.draw();
      bike.g.setPosition(x, 540 + i * 8).setDepth(10 + i);
    });

    // stone table and stools
    const table = this.add.graphics().setDepth(6);
    table.fillStyle(0x000000, 0.12);
    table.fillEllipse(W / 2, FLOOR + 2, 150, 18);
    table.fillStyle(0xa79e8f, 1);
    table.fillRect(W / 2 - 16, FLOOR - 52, 32, 52);
    table.fillStyle(0xc9c1b2, 1);
    table.fillEllipse(W / 2, FLOOR - 54, 150, 30);
    table.fillStyle(0xd8d1c4, 1);
    table.fillEllipse(W / 2, FLOOR - 58, 140, 22);
    for (const sx of [W / 2 - 110, W / 2 + 110]) {
      table.fillStyle(0xa79e8f, 1);
      table.fillRect(sx - 12, FLOOR - 26, 24, 26);
      table.fillStyle(0xc9c1b2, 1);
      table.fillEllipse(sx, FLOOR - 28, 44, 14);
    }

    // the three friends
    const mk = (x: number, look: Look, facing: 1 | -1, depth: number, backpack = false) => {
      const g = this.add.graphics().setPosition(x, FLOOR).setDepth(depth);
      drawPerson(g, look, { facing, backpack });
      if (facing < 0) g.setScale(-1, 1);
      return g;
    };
    this.people = {
      koko: mk(W / 2 + 20, LOOKS.koko, -1, 5),
      me: mk(W / 2 - 140, LOOKS.me, 1, 7, true),
      gogo: mk(W / 2 + 150, LOOKS.gogo, -1, 7),
    };

    this.bag = this.add.image(W / 2 - 18, FLOOR - 64, 'backpack').setOrigin(0.5, 1).setDepth(8).setVisible(false);

    // foreground lotus framing the corners
    for (const [x, key, s] of [[40, 'leaf1', 1.3], [130, 'bloomHalf', 1.1], [W - 60, 'leaf2', 1.3], [W - 150, 'bud', 1.1]] as const) {
      const img = this.add.image(x, H + 80, key).setOrigin(0.5, 1).setScale(s).setDepth(20);
      this.tweens.add({ targets: img, angle: { from: -2, to: 2 }, yoyo: true, repeat: -1, duration: 2400 + x });
    }
  }

  private async speak(who: Speaker, key: StrKey, params?: Record<string, string | number>): Promise<void> {
    if (who && who !== 'elder') {
      const g = this.people[who];
      this.tweens.add({ targets: g, y: FLOOR - 8, yoyo: true, duration: 140, repeat: 1 });
    }
    await this.dlg.say(who, key, params);
  }

  private async partOne(): Promise<void> {
    await wait(this, 500);
    await this.speak(null, 'pav.n1');
    const n = run.photoKeys.length;
    await this.speak('koko', n >= 5 ? 'pav.photosMany' : n > 0 ? 'pav.photosFew' : 'pav.photosNone', { n });
    await this.speak('gogo', 'pav.gogo1');
    await this.speak('koko', 'pav.koko1');
    await this.speak('gogo', 'pav.gogo2');
    await this.speak('me', 'pav.me1');
    // 苏堤 is saved for its own dream (苏堤春晓); here we ride 杨公堤
    const route = await this.dlg.choose<Route>('pav.choose', [{ key: 'pav.optYang', value: 'yang' }]);
    run.route = route;
    await this.speak('me', 'pav.me2');
    this.dlg.hide();

    // drift into the daydream
    sfx.whee();
    this.cameras.main.zoomTo(1.15, 1400, 'Sine.easeInOut');
    this.cameras.main.fadeOut(1400, 250, 214, 230);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('BridgeDream'));
  }

  private async partTwo(): Promise<void> {
    await wait(this, 500);
    await this.speak('me', 'pav.me3');
    await this.speak('me', 'pav.me4');

    // hand the bag over to the friends
    drawPerson(this.people.me, LOOKS.me, { facing: 1, backpack: false });
    this.bag.setVisible(true).setPosition(this.people.me.x, FLOOR - 70);
    void tweenP(this, { targets: this.bag, x: W / 2 - 18, y: FLOOR - 64, duration: 500, ease: 'Quad.easeOut' });

    await this.speak('gogo', 'pav.gogo3');
    await this.speak('koko', 'pav.koko3');
    this.dlg.hide();

    // I hurry off... and the dream starts to dissolve
    this.people.me.setScale(-1, 1);
    await tweenP(this, { targets: this.people.me, x: -80, duration: 1600, ease: 'Quad.easeIn' });
    this.cameras.main.shake(1600, 0.004);
    await wait(this, 400);
    this.cameras.main.fadeOut(1800, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Wake'));
  }

  update(time: number): void {
    this.backdrop.update(time, 0);
  }
}
