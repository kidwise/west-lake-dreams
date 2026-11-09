import * as Phaser from 'phaser';
import { generateTextures } from '../art/textures';
import { generateRoomTextures } from '../art/room';
import { generateSantanTextures } from '../santan/art';
import { generateSudiTextures } from '../sudi/art';
import { generateHuagangTextures } from '../huagang/art';
import { generateDuanqiaoTextures } from '../duanqiao/art';
import { generatePinghuTextures } from '../pinghu/art';
import { generateShuangfengTextures } from '../shuangfeng/art';
import { generateLeifengTextures } from '../leifeng/art';
import { generateNanpingTextures } from '../nanping/art';
import { generateLiulangTextures } from '../liulang/art';

/** Generates all procedural art, starts the always-on-top UI overlay, then opens the title. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    generateRoomTextures(this);
    generateSantanTextures(this);
    generateSudiTextures(this);
    generateHuagangTextures(this);
    generateDuanqiaoTextures(this);
    generatePinghuTextures(this);
    generateShuangfengTextures(this);
    generateLeifengTextures(this);
    generateNanpingTextures(this);
    generateLiulangTextures(this);
    this.scene.launch('UI');
    this.scene.start('Title');
  }
}
