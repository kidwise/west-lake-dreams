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
  scene: [BootScene, TitleScene, IntroScene, RideScene, PavilionScene, BridgeDreamScene, WakeScene, UIScene],
});

// Expose the game instance during development for debugging / automated play-testing.
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
