import * as Phaser from 'phaser';
import { generateTextures } from '../art/textures';
import { generateSantanTextures } from '../santan/art';
import { generateSudiTextures } from '../sudi/art';
import { generateHuagangTextures } from '../huagang/art';

/** Generates all procedural art, starts the always-on-top UI overlay, then opens the title. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    generateSantanTextures(this);
    generateSudiTextures(this);
    generateHuagangTextures(this);
    this.scene.launch('UI');
    this.scene.start('Title');
  }
}
