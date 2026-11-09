import type { StrKey } from './strings';

/**
 * The Ten Scenes of West Lake (西湖十景), in their traditional order (as named
 * in the Southern Song): 苏堤春晓 first, 三潭印月 last. Each is one chapter;
 * chapters can be played in any order.
 * To add a chapter later: build its scenes, then set `startScene` here.
 */
export interface View {
  id: string;
  name: StrKey;
  /** Scene key that starts this chapter; undefined = not built yet. */
  startScene?: string;
}

export const TEN_VIEWS: View[] = [
  { id: 'sudi', name: 'view.sudi', startScene: 'SudiIntro' },
  { id: 'quyuan', name: 'view.quyuan', startScene: 'QuyuanIntro' },
  { id: 'pinghu', name: 'view.pinghu', startScene: 'PinghuIntro' },
  { id: 'duanqiao', name: 'view.duanqiao', startScene: 'DuanqiaoIntro' },
  { id: 'liulang', name: 'view.liulang', startScene: 'LiulangIntro' },
  { id: 'huagang', name: 'view.huagang', startScene: 'HuagangIntro' },
  { id: 'leifeng', name: 'view.leifeng', startScene: 'LeifengIntro' },
  { id: 'shuangfeng', name: 'view.shuangfeng', startScene: 'ShuangfengIntro' },
  { id: 'nanping', name: 'view.nanping', startScene: 'NanpingIntro' },
  { id: 'santan', name: 'view.santan', startScene: 'SantanIntro' },
];
