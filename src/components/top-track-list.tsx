import type { TopTrack } from "@/types/dashboard";

type TopTrackListProps = {
  tracks: TopTrack[];
};

export function TopTrackList({ tracks }: TopTrackListProps) {
  return (
    <div className="track-list">
      {tracks.map((track, index) => (
        <a
          key={`${track.title}-${track.artist}`}
          className="track-list__item"
          href={track.spotifyUrl ?? "#tracks"}
          target={track.spotifyUrl ? "_blank" : undefined}
          rel={track.spotifyUrl ? "noreferrer" : undefined}
        >
          <div className="track-list__rank">{index + 1}</div>
          {track.imageUrl ? (
            <img
              className="track-list__image"
              src={track.imageUrl}
              alt={`${track.album} cover`}
            />
          ) : (
            <div className="track-list__image track-list__image--empty" />
          )}
          <div>
            <h3 className="track-list__title">{track.title}</h3>
            <p className="track-list__meta">
              {track.artist} · {track.album}
            </p>
          </div>
          <div className="track-list__detail">{track.detail}</div>
        </a>
      ))}
    </div>
  );
}
