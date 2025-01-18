const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const fetch = require('node-fetch'); // Import node-fetch
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const spotifyApi = new SpotifyWebApi({
    clientId: '3e3cd8871a024fcd932aa6d7dc39ae08',
    clientSecret: 'a552da57757a45819aefc7cc1c2fd857',
    redirectUri: 'http://localhost:5174/callback',
});

// Endpoint to get access token
app.post('/login', (req, res) => {
    const { code } = req.body;
    console.log('Received code:', code);

    spotifyApi.authorizationCodeGrant(code).then(data => {
        console.log('Tokens generated:', data.body);
        res.json({
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token,
            expiresIn: data.body.expires_in,
        });
    }).catch(err => {
        res.status(400).json({ error: 'Failed to authenticate' });
    });
});

app.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    
    spotifyApi.setRefreshToken(refreshToken);

    spotifyApi.refreshAccessToken().then(data => {
        // Send both the new access token and refresh token
        res.json({
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token, // Add this
            expiresIn: data.body.expires_in,
        });
    }).catch(err => {
        res.status(400).json({ error: 'Failed to refresh token' });
    });
});

app.post('/search-song', async (req, res) => {
    const { songQuery, accessToken } = req.body;
    console.log("Song Query Received:", songQuery);

    try {
        spotifyApi.setAccessToken(accessToken);
        const searchResponse = await spotifyApi.searchTracks(songQuery, { limit: 5 });

        const songs = searchResponse.body.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name,
            uri: track.uri,
        }));

        console.log("Songs Found:", songs);
        res.json({ songs });
    } catch (err) {
        console.error('Error searching for songs:', err);
        res.status(500).json({ error: 'Failed to search for songs', details: err.message });
    }
});


// Endpoint to search for an artist
app.post('/search-artist', async (req, res) => {
    const { artistQuery, accessToken } = req.body;
    console.log("Artist Query Received:", artistQuery); // Debugging Log

    try {
        spotifyApi.setAccessToken(accessToken);
        const searchResponse = await spotifyApi.searchArtists(artistQuery, { limit: 5 });

        const artists = searchResponse.body.artists.items.map(artist => ({
            id: artist.id,
            name: artist.name,
            image: artist.images[0]?.url,
        }));

        console.log("Artists Found:", artists); // Debugging Log
        res.json({ artists });
    } catch (err) {
        console.error('Error searching for artist:', err);
        res.status(500).json({ error: 'Failed to search for artist', details: err.message });
    }
});


// Function to fetch similar artists
const getSimilarArtists = async (artistId, accessToken) => {
    spotifyApi.setAccessToken(accessToken);
    const response = await spotifyApi.getArtistRelatedArtists(artistId);
    return response.body.artists.map(artist => artist.id);
};

app.post('/create-playlist', async (req, res) => {
    const { mood, numberOfSongs, accessToken, selectedArtistId, selectedArtistName, selectedSongs } = req.body;
    spotifyApi.setAccessToken(accessToken);

    try {
        console.log("Selected Songs:", selectedSongs);
        let tracks = [...selectedSongs]; // Always start with user-selected songs

        if (selectedArtistId && selectedArtistName) {
            console.log('Fetching tracks for artist:', selectedArtistName);
            const searchResponse = await spotifyApi.searchTracks(`artist:${selectedArtistName}`, { limit: 50 });
            const artistTracks = searchResponse.body.tracks.items;

            const filteredTracks = artistTracks
                .filter(track => track.artists.some(artist => artist.id === selectedArtistId))
                .map(track => track.uri);

            console.log('Artist Tracks:', filteredTracks);

            // **Add only new tracks (avoid duplicating selected songs)**
            filteredTracks.forEach(track => {
                if (!tracks.includes(track)) {
                    tracks.push(track);
                }
            });

            console.log('Merged Tracks:', tracks);
        }

        // Ensure selected songs are **always included at the beginning** 
        // and then apply filtering to the rest
        let prioritizedTracks = [...selectedSongs];
        let remainingTracks = tracks.filter(track => !selectedSongs.includes(track));

        // Shuffle only the remaining tracks
        remainingTracks = shuffleArray(remainingTracks).slice(0, numberOfSongs - prioritizedTracks.length);

        // Final tracklist: User-selected songs + shuffled artist songs
        tracks = [...prioritizedTracks, ...remainingTracks];

        console.log('Final tracks to add to playlist:', tracks);

        // Create the playlist
        const playlistName = `${mood} Playlist`;
        const playlistResponse = await spotifyApi.createPlaylist(playlistName, {
            description: `A ${mood} playlist generated by Moodify.`,
            public: false,
        });

        const playlistId = playlistResponse.body.id;
        await spotifyApi.addTracksToPlaylist(playlistId, tracks);

        res.json({
            playlistUrl: playlistResponse.body.external_urls.spotify,
        });
    } catch (err) {
        console.error('Error creating playlist:', err);
        res.status(500).json({ error: 'Failed to create playlist', details: err.message });
    }
});





// Helper function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}




app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});