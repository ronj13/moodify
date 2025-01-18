const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');
const fetch = require('node-fetch'); // Import node-fetch
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const spotifyApi = new SpotifyWebApi({
    clientId: '957639a18400425fb949acda676fe622',
    clientSecret: '2302f5464c5a41f2933f556aeb2970f7',
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

// Endpoint to refresh the access token
app.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    console.log('Received refresh token:', refreshToken)

    spotifyApi.setRefreshToken(refreshToken);

    spotifyApi.refreshAccessToken().then(data => {
        console.log('Tokens refreshed:', data.body);
        res.json({
            accessToken: data.body.access_token,
            expiresIn: data.body.expires_in,
        });
    }).catch(err => {
        res.status(400).json({ error: 'Failed to refresh token' });
    });
});

// Endpoint to search for an artist
app.post('/search-artist', async (req, res) => {
    const { artistQuery, accessToken } = req.body;

    try {
        // Set the access token for the Spotify API
        spotifyApi.setAccessToken(accessToken);

        // Search for artists using the Spotify API
        const searchResponse = await spotifyApi.searchArtists(artistQuery, { limit: 5 });

        // Extract artist data from the response
        const artists = searchResponse.body.artists.items.map(artist => ({
            id: artist.id,
            name: artist.name,
            image: artist.images[0]?.url, // Use the first image if available
        }));

        // Send the artist data back to the frontend
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

// Endpoint to create a playlist based on filters
app.post('/create-playlist', async (req, res) => {
    const { mood, language, numberOfSongs, accessToken, selectedArtistId, selectedArtistName } = req.body;
    spotifyApi.setAccessToken(accessToken);

    try {
        let tracks = [];

        // Step 1: Fetch all tracks linked to the artist using the search API
        if (selectedArtistId && selectedArtistName) {
            console.log('Fetching all tracks for selected artist:', selectedArtistName);

            // Search for tracks by the artist's name
            const searchResponse = await spotifyApi.searchTracks(`artist:${selectedArtistName}`, { limit: 50 }); // Fetch up to 50 tracks per request
            const artistTracks = searchResponse.body.tracks.items;

            // Filter tracks to ensure they are by the selected artist
            const filteredTracks = artistTracks.filter(track =>
                track.artists.some(artist => artist.id === selectedArtistId)
            );

            // Add track URIs to the list
            tracks.push(...filteredTracks.map(track => track.uri));
            console.log('Tracks fetched for artist:', tracks.length);
        }

        // Step 2: Shuffle and limit the number of tracks
        tracks = shuffleArray(tracks).slice(0, numberOfSongs);
        console.log('Final tracks to add to playlist:', tracks);

        // Step 3: Create a new playlist
        const playlistName = `${mood} ${language} Playlist`; // Customize playlist name
        const playlistResponse = await spotifyApi.createPlaylist(playlistName, {
            description: `A ${mood} ${language} playlist generated by Moodify.`,
            public: false, // Make the playlist private
        });

        // Step 4: Add tracks to the playlist
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