import React from 'react';

export default function PlaylistDisplay({ playlists }) {
    return (
        <div className="playlists">
            <h2>Your Playlists</h2>
            {playlists.map((playlist, index) => (
                <div key={index} className="playlist">
                    <span>{playlist}</span>
                    <a href={`https://open.spotify.com/search/${playlist}`} target="_blank" rel="noopener noreferrer">
                        Open in Spotify
                    </a>
                </div>
            ))}
        </div>
    );
}