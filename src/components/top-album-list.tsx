import type { TopAlbum } from "@/types/dashboard";
import { getSpotifyAlbumPageUrl } from "@/lib/spotify-links";

type TopAlbumListProps = {
  albums: TopAlbum[];
};

export function TopAlbumList({ albums }: TopAlbumListProps) {
  if (albums.length === 0) {
    return <div className="track-list__empty">No album data yet.</div>;
  }

  return (
    <ol className="track-list" aria-label="Top albums list">
      {albums.map((album, index) => (
        <li key={`${album.title}-${album.artist}-${index}`} className="track-list__item">
          <div className="track-list__rank">{index + 1}</div>
          <div className="track-list__media">
            {album.imageUrl ? (
              <img
                className="track-list__image"
                src={album.imageUrl}
                alt={`${album.title} cover`}
                loading="lazy"
              />
            ) : (
              <span className="track-list__placeholder" aria-hidden>
                {album.title.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="track-list__title">
              <a
                className="track-list__title-link"
                href={getSpotifyAlbumPageUrl(album.title, album.artist)}
                target="_blank"
                rel="noreferrer"
              >
                {album.title}
              </a>
            </h3>
            <p className="track-list__meta">{album.artist}</p>
          </div>
          <div className="track-list__stats">
            <div className="track-list__plays">{album.plays}</div>
            <div className="track-list__duration">{album.duration}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
