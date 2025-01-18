import React from 'react';

export default function PlaylistDisplay({ playlists }) {
    return (
        <ul>
            {playlists.map((playlist, index) => (
                <li key={index}>{playlist}</li>
            ))}
        </ul>
    );
}