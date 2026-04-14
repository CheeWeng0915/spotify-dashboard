import type { TopArtist } from "@/types/dashboard";

type TopArtistListProps = {
  artists: TopArtist[];
};

export function TopArtistList({ artists }: TopArtistListProps) {
  if (artists.length === 0) {
    return <div className="track-list__empty">No artist data yet.</div>;
  }

  return (
    <ol className="track-list" aria-label="Top artists list">
      {artists.map((artist, index) => (
        <li key={`${artist.name}-${index}`} className="track-list__item">
          <div className="track-list__rank">{index + 1}</div>
          <div className="track-list__media">
            {artist.imageUrl ? (
              <img
                className="track-list__image track-list__image--round"
                src={artist.imageUrl}
                alt={`${artist.name} portrait`}
                loading="lazy"
              />
            ) : (
              <span className="track-list__placeholder track-list__placeholder--round" aria-hidden>
                {artist.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="track-list__title">{artist.name}</h3>
            <p className="track-list__meta">Top track · {artist.topTrack}</p>
          </div>
          <div className="track-list__stats">
            <div className="track-list__plays">{artist.plays}</div>
            <div className="track-list__duration">{artist.duration}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
