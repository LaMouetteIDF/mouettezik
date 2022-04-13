export type BaseResourceTrack = {
  id: string;
  uploader: string;
  uploader_id: string;
  uploader_url: string;
  timestamp: number;
  title: string;
  description: string;
  duration: number;
  webpage_url: string;
  license: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  repost_count: number;
  genre: string;
  extractor: string;
  webpage_url_basename: string;
  extractor_key: string;
  thumbnail: string;
  display_id: string;
  upload_date: string;
  url: string;
  ext: string;
  abr: number;
  format_id: string;
  protocol: string;
  vcodec: string;
  format: string;
};

export type BaseResourcePlaylistTrack = BaseResourceTrack & {
  n_entries: number;
  playlist: string;
  playlist_id: string;
  playlist_title?: string;
  playlist_uploader?: string;
  playlist_uploader_id?: string;
  playlist_index: number;
};

export type BaseResourcePlaylist = {
  _type: 'playlist';
  id: string;
  title?: string;
  uploader?: string;
  uploader_id?: string;
  uploader_url?: string;
  extractor: string;
  webpage_url: string;
  webpage_url_basename: string;
  extractor_key: string;
  entries: BaseResourcePlaylistTrack[];
};

export type BaseResourceData = BaseResourcePlaylist | BaseResourceTrack;
