import type { TopTrack } from "@/types/dashboard";

type TopTrackListProps = {
  tracks: TopTrack[];
};

export function TopTrackList({ tracks }: TopTrackListProps) {
  if (tracks.length === 0) {
    return <div className="track-list__empty">No track data yet.</div>;
  }

  return (
    <ol className="track-list" aria-label="Top tracks list">
      {tracks.map((track, index) => (
        <li key={`${track.title}-${track.artist}-${index}`} className="track-list__item">
          <div className="track-list__rank">{index + 1}</div>
          <div className="track-list__media">
            {track.imageUrl ? (
              <img
                className="track-list__image"
                src={track.imageUrl}
                alt={`${track.title} cover`}
                loading="lazy"
              />
            ) : (
              <span className="track-list__placeholder" aria-hidden>
                {track.title.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="track-list__title">{track.title}</h3>
            <p className="track-list__meta">
              {track.artist} · {track.album}
            </p>
          </div>
          <div className="track-list__stats">
            <div className="track-list__plays">{track.plays}</div>
            <div className="track-list__duration">{track.duration}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
