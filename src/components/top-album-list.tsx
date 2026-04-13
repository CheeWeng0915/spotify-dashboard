import type { TopAlbum } from "@/types/dashboard";

type TopAlbumListProps = {
  albums: TopAlbum[];
};

export function TopAlbumList({ albums }: TopAlbumListProps) {
  if (albums.length === 0) {
    return <div className="track-list__empty">暂无专辑数据。</div>;
  }

  return (
    <div className="track-list">
      {albums.map((album, index) => (
        <div key={`${album.title}-${album.artist}-${index}`} className="track-list__item">
          <div className="track-list__rank">{index + 1}</div>
          <div>
            <h3 className="track-list__title">{album.title}</h3>
            <p className="track-list__meta">{album.artist}</p>
          </div>
          <div className="track-list__stats">
            <div className="track-list__plays">{album.plays}</div>
            <div className="track-list__duration">{album.duration}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
