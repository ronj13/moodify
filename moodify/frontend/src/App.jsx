import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
// App.jsx
import React, { useState } from 'react';
import NavbarComponent from './components/Navbar';
import MoodSelector from './components/MoodSelector';
import PlaylistDisplay from './components/PlaylistDisplay';
import './styles/styles.css';

function App() {
    const [mood, setMood] = useState('');
    const [playlists, setPlaylists] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [accessToken, setAccessToken] = useState('');

    // Fetch access token from the backend
    const getAccessToken = async () => {
        try {
            // Redirect to the backend login endpoint
            window.location.href = 'http://localhost:8888/login';
        } catch (error) {
            console.error('Error fetching access token:', error);
        }
    };

    // Check for access token in the URL after redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('access_token');
        if (token) {
            setAccessToken(token);
            // Clear the token from the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Handle mood change
    const handleMoodChange = (selectedMood) => {
        setMood(selectedMood);
    };

    // Handle form submission for mood-based playlists
    const handleSubmit = async (event) => {
        event.preventDefault();
        // Simulate fetching playlists based on mood
        const mockPlaylists = {
            happy: ['Feel Good Beats', 'Chill Vibes', 'Energize'],
            relaxed: ['Chill Vibes', 'Feel Good Beats', 'Energize'],
            focused: ['Energize', 'Feel Good Beats', 'Chill Vibes'],
            energetic: ['Energize', 'Feel Good Beats', 'Chill Vibes'],
        };

        setPlaylists(mockPlaylists[mood] || []);
    };

    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    // Handle search form submission
    const handleSearchSubmit = async (event) => {
        event.preventDefault();

        if (!accessToken) {
            await getAccessToken();
            return;
        }

        // Fetch search results from Spotify API
        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );
            const data = await response.json();
            setSearchResults(data.tracks.items);
        } catch (error) {
            console.error('Error searching for songs:', error);
        }
    };

    return (
        <div className="App">
            <NavbarComponent />
            <div className="content">
                <h1>Select Your Mood</h1>
                
                <iframe 
                    style={{ borderRadius: "12px" }}
                    src="https://open.spotify.com/embed/playlist/37i9dQZF1EVHGWrwldPRtj?utm_source=generator" 
                    width="100%" 
                    height="352" 
                    frameBorder="0" 
                    allowFullScreen="" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                ></iframe>
    
                <form onSubmit={handleSubmit}>
                    <MoodSelector onSelectMood={handleMoodChange} />
                    <button type="submit">Get Playlist</button>
                </form>
                <PlaylistDisplay playlists={playlists} />

                {/* Search Section */}
                <h2>Search for Songs</h2>
                <form onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        placeholder="Search for a song..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                    <button type="submit">Search</button>
                </form>

                {/* Display Search Results */}
                <div className="search-results">
                    {searchResults.map((track) => (
                        <div key={track.id} className="track">
                            <h3>{track.name}</h3>
                            <p>{track.artists.map((artist) => artist.name).join(', ')}</p>
                            <p>{track.album.name}</p>
                            {track.preview_url && (
                                <audio controls>
                                    <source src={track.preview_url} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default App;