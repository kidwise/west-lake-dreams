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
import { HuagangIntroScene } from './huagang/HuagangIntroScene';
import { HuagangPondScene } from './huagang/HuagangPondScene';
import { HuagangSteleScene } from './huagang/HuagangSteleScene';
import { HuagangUnderScene } from './huagang/HuagangUnderScene';
import { HuagangEndScene } from './huagang/HuagangEndScene';
import { DuanqiaoIntroScene } from './duanqiao/DuanqiaoIntroScene';
import { DuanqiaoStreetScene } from './duanqiao/DuanqiaoStreetScene';
import { DuanqiaoCrowdScene } from './duanqiao/DuanqiaoCrowdScene';
import { DuanqiaoSnowmanScene } from './duanqiao/DuanqiaoSnowmanScene';
import { DuanqiaoHillScene } from './duanqiao/DuanqiaoHillScene';
import { DuanqiaoEndScene } from './duanqiao/DuanqiaoEndScene';
import { PinghuIntroScene } from './pinghu/PinghuIntroScene';
import { PinghuBridgeScene } from './pinghu/PinghuBridgeScene';
import { PinghuCalmScene } from './pinghu/PinghuCalmScene';
import { PinghuMoonScene } from './pinghu/PinghuMoonScene';
import { PinghuEndScene } from './pinghu/PinghuEndScene';
import { ShuangfengIntroScene } from './shuangfeng/ShuangfengIntroScene';
import { ShuangfengClimbScene } from './shuangfeng/ShuangfengClimbScene';
import { ShuangfengTowerScene } from './shuangfeng/ShuangfengTowerScene';
import { ShuangfengHerdScene } from './shuangfeng/ShuangfengHerdScene';
import { ShuangfengDigScene } from './shuangfeng/ShuangfengDigScene';
import { ShuangfengEndScene } from './shuangfeng/ShuangfengEndScene';
import { LeifengIntroScene } from './leifeng/LeifengIntroScene';
import { LeifengStairsScene } from './leifeng/LeifengStairsScene';
import { LeifengRuinsScene } from './leifeng/LeifengRuinsScene';
import { LeifengTopScene } from './leifeng/LeifengTopScene';
import { LeifengEndScene } from './leifeng/LeifengEndScene';
import { NanpingIntroScene } from './nanping/NanpingIntroScene';
import { NanpingWellScene } from './nanping/NanpingWellScene';
import { NanpingEchoScene } from './nanping/NanpingEchoScene';
import { NanpingBellScene } from './nanping/NanpingBellScene';
import { NanpingEndScene } from './nanping/NanpingEndScene';

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
    // Dream 4 · 花港观鱼
    HuagangIntroScene,
    HuagangPondScene,
    HuagangSteleScene,
    HuagangUnderScene,
    HuagangEndScene,
    // Dream 5 · 断桥残雪
    DuanqiaoIntroScene,
    DuanqiaoStreetScene,
    DuanqiaoCrowdScene,
    DuanqiaoSnowmanScene,
    DuanqiaoHillScene,
    DuanqiaoEndScene,
    // Dream 6 · 平湖秋月
    PinghuIntroScene,
    PinghuBridgeScene,
    PinghuCalmScene,
    PinghuMoonScene,
    PinghuEndScene,
    // Dream 7 · 双峰插云
    ShuangfengIntroScene,
    ShuangfengClimbScene,
    ShuangfengTowerScene,
    ShuangfengHerdScene,
    ShuangfengDigScene,
    ShuangfengEndScene,
    // Dream 8 · 雷峰夕照
    LeifengIntroScene,
    LeifengStairsScene,
    LeifengRuinsScene,
    LeifengTopScene,
    LeifengEndScene,
    // Dream 9 · 南屏晚钟
    NanpingIntroScene,
    NanpingWellScene,
    NanpingEchoScene,
    NanpingBellScene,
    NanpingEndScene,
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
if (import.meta.env.DEV) {
  void import('./huagang/state').then(({ hgRun }) => {
    (window as unknown as { __hgRun: unknown }).__hgRun = hgRun;
  });
  void import('./duanqiao/state').then(({ dqRun }) => {
    (window as unknown as { __dqRun: unknown }).__dqRun = dqRun;
  });
  void import('./pinghu/state').then(({ phRun }) => {
    (window as unknown as { __phRun: unknown }).__phRun = phRun;
  });
  void import('./shuangfeng/state').then(({ sfRun }) => {
    (window as unknown as { __sfRun: unknown }).__sfRun = sfRun;
  });
  void import('./leifeng/state').then(({ lfRun }) => {
    (window as unknown as { __lfRun: unknown }).__lfRun = lfRun;
  });
  void import('./nanping/state').then(({ npRun }) => {
    (window as unknown as { __npRun: unknown }).__npRun = npRun;
  });
}
