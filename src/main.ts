import * as Phaser from 'phaser';
import { W, H } from './core/config';
import { unlockAudio } from './core/sfx';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { IntroScene } from './scenes/IntroScene';
import { RideScene } from './scenes/RideScene';
import { PavilionScene } from './scenes/PavilionScene';
import { BridgeDreamScene } from './scenes/BridgeDreamScene';
import { WakeScene } from './scenes/WakeScene';
import { UIScene } from './scenes/UIScene';
import { SantanIntroScene } from './santan/SantanIntroScene';
import { SantanBoatScene } from './santan/SantanBoatScene';
import { SantanPuzzleScene } from './santan/SantanPuzzleScene';
import { SantanMoonScene } from './santan/SantanMoonScene';
import { SudiIntroScene } from './sudi/SudiIntroScene';
import { SudiRideScene } from './sudi/SudiRideScene';
import { SudiEndScene } from './sudi/SudiEndScene';

unlockAudio();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#1f2f2e',
  antialias: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    // allow pedalling and shooting at the same time on touch screens
    activePointers: 3,
  },
  render: {
    // keep the canvas readable so in-game photos can be captured
    preserveDrawingBuffer: true,
  },
  // UIScene is last so it always renders above the other scenes.
  scene: [
    BootScene,
    TitleScene,
    // Dream 1 · 曲院风荷
    IntroScene,
    RideScene,
    PavilionScene,
    BridgeDreamScene,
    WakeScene,
    // Dream 2 · 三潭印月
    SantanIntroScene,
    SantanBoatScene,
    SantanPuzzleScene,
    SantanMoonScene,
    // Dream 3 · 苏堤春晓
    SudiIntroScene,
    SudiRideScene,
    SudiEndScene,
    // overlay last so it renders on top
    UIScene,
  ],
});

// Expose the game instance during development for debugging / automated play-testing.
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
if (import.meta.env.DEV) {
  void import('./santan/world').then(({ TARGETS }) => {
    (window as unknown as { __santanDebug: unknown }).__santanDebug = {
      targetPose: (id: string) => TARGETS.find((t) => t.id === id)?.pose,
    };
  });
}
