import type { StrKey } from './strings';

/**
 * The Ten Scenes of West Lake (西湖十景). Each one is meant to become a chapter.
 * To add a chapter later: build its scenes, then set `startScene` here.
 */
export interface View {
  id: string;
  name: StrKey;
  /** Scene key that starts this chapter; undefined = not built yet. */
  startScene?: string;
}

export const TEN_VIEWS: View[] = [
  { id: 'quyuan', name: 'view.quyuan', startScene: 'Intro' },
  { id: 'sudi', name: 'view.sudi', startScene: 'SudiIntro' },
  { id: 'pinghu', name: 'view.pinghu' },
  { id: 'duanqiao', name: 'view.duanqiao' },
  { id: 'liulang', name: 'view.liulang' },
  { id: 'huagang', name: 'view.huagang' },
  { id: 'leifeng', name: 'view.leifeng' },
  { id: 'shuangfeng', name: 'view.shuangfeng' },
  { id: 'nanping', name: 'view.nanping' },
  { id: 'santan', name: 'view.santan', startScene: 'SantanIntro' },
];
