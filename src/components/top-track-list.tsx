import type { TopTrack } from "@/types/dashboard";

type TopTrackListProps = {
  tracks: TopTrack[];
};

export function TopTrackList({ tracks }: TopTrackListProps) {
  return (
    <div className="track-list">
      {tracks.map((track, index) => (
        <div key={track.title} className="track-list__item">
          <div className="track-list__rank">{index + 1}</div>
          <div>
            <h3 className="track-list__title">{track.title}</h3>
            <p className="track-list__meta">
              {track.artist} · {track.album}
            </p>
          </div>
          <div className="track-list__plays">{track.plays} plays</div>
        </div>
      ))}
    </div>
  );
}
