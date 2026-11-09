/**
 * All player-facing text lives here, in Chinese (default) and English.
 * `en` is typed against `zh`, so a missing translation is a compile error.
 * To rename characters or tweak the story wording, edit this file only.
 */
import { quyuanZh, quyuanEn } from './quyuanStrings';
import { santanZh, santanEn } from './santanStrings';
import { sudiZh, sudiEn } from './sudiStrings';
import { huagangZh, huagangEn } from './huagangStrings';
import { duanqiaoZh, duanqiaoEn } from './duanqiaoStrings';
import { pinghuZh, pinghuEn } from './pinghuStrings';
import { shuangfengZh, shuangfengEn } from './shuangfengStrings';
import { leifengZh, leifengEn } from './leifengStrings';
import { nanpingZh, nanpingEn } from './nanpingStrings';
import { liulangZh, liulangEn } from './liulangStrings';

export const zh = {
  ...quyuanZh,
  ...santanZh,
  ...sudiZh,
  ...huagangZh,
  ...duanqiaoZh,
  ...pinghuZh,
  ...shuangfengZh,
  ...leifengZh,
  ...nanpingZh,
  ...liulangZh,
  // ---- general ----
  'game.title': '西湖逍遥游',
  'game.subtitle': '十个梦，游遍西湖十景',
  'lang.toggle': 'EN',
  'common.tapToContinue': '点击或按空格继续',
  'home.ask': '回到主页吗？',
  'home.note': '这个梦会从头开始。已经游览过的景点不受影响。',
  'home.stay': '继续做梦',
  'home.leave': '回到主页',

  // ---- characters ----
  'name.me': '我',
  'name.gogo': 'GOGO',
  'name.koko': 'KOKO',

  // ---- title screen ----
  'title.progress': '已游览 {n} / 10',
  'title.allDone': '十景都游遍了！',
  'title.rank': '十景之{n}',
  'title.next': '从这里开始',

  // ---- the ten scenes of West Lake ----
  'view.sudi': '苏堤春晓',
  'view.quyuan': '曲院风荷',
  'view.pinghu': '平湖秋月',
  'view.duanqiao': '断桥残雪',
  'view.liulang': '柳浪闻莺',
  'view.huagang': '花港观鱼',
  'view.leifeng': '雷峰夕照',
  'view.shuangfeng': '双峰插云',
  'view.nanping': '南屏晚钟',
  'view.santan': '三潭印月',

  'wake.again': '再做一次梦',
  'wake.toTitle': '返回标题',
} as const;

export type StrKey = keyof typeof zh;

export const en: Record<StrKey, string> = {
  ...quyuanEn,
  ...santanEn,
  ...sudiEn,
  ...huagangEn,
  ...duanqiaoEn,
  ...pinghuEn,
  ...shuangfengEn,
  ...leifengEn,
  ...nanpingEn,
  ...liulangEn,
  'game.title': 'West Lake Dreams',
  'title.progress': '{n} of 10 visited',
  'title.allDone': 'All ten scenes visited!',
  'title.rank': 'Scene {m}',
  'title.next': 'Start here',
  'game.subtitle': 'Ten dreams of the Ten Scenes of West Lake',
  'lang.toggle': '中文',
  'common.tapToContinue': 'Click or press Space to continue',
  'home.ask': 'Back to the main menu?',
  'home.note': 'This dream will start over next time. Scenes you have already visited stay visited.',
  'home.stay': 'Keep dreaming',
  'home.leave': 'Main menu',

  'name.me': 'Me',
  'name.gogo': 'GOGO',
  'name.koko': 'KOKO',


  'view.sudi': 'Spring Dawn at Su Causeway',
  'view.quyuan': 'Lotus in the Breeze at Quyuan',
  'view.pinghu': 'Autumn Moon over the Calm Lake',
  'view.duanqiao': 'Lingering Snow on Broken Bridge',
  'view.liulang': 'Orioles Singing in the Willows',
  'view.huagang': 'Viewing Fish at Flower Harbour',
  'view.leifeng': 'Leifeng Pagoda at Sunset',
  'view.shuangfeng': 'Twin Peaks Piercing the Clouds',
  'view.nanping': 'Evening Bell at Nanping Hill',
  'view.santan': 'Three Pools Mirroring the Moon',

  'wake.again': 'Dream again',
  'wake.toTitle': 'Back to title',
};
