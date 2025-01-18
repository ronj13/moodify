import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    Button as NextUIButton,
    Card,
    CardBody,
    Input,
} from '@nextui-org/react';
import './styles/App.css';

function App() {
    const [mood, setMood] = useState(null);
    const [language, setLanguage] = useState(null);
    const [numberOfSongs, setNumberOfSongs] = useState(10);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const moodOptions = [
        { value: 'Happy', label: 'Happy' },
        { value: 'Sad', label: 'Sad' },
        { value: 'Relaxed', label: 'Relaxed' },
        { value: 'Energetic', label: 'Energetic' },
    ];

    const languageOptions = [
        { value: 'English', label: 'English' },
        { value: 'Mandarin', label: 'Mandarin' },
        { value: 'Korean', label: 'Korean' },
        { value: 'Random', label: 'Random' },
        { value: 'Mix', label: 'Mix' },
    ];

    // Check if user logged in 
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = `https://accounts.spotify.com/authorize?client_id=957639a18400425fb949acda676fe622&response_type=code&redirect_uri=http://localhost:5174/callback&scope=playlist-modify-private playlist-modify-public`;
        }
    }, []);

    // Handle Spotify callback (extract authorization code)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code) {
            handleLogin(code);
        }
    }, []);

    // Handle login to get access token
    const handleLogin = async (code) => {
        try {
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate');
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            // Schedule token refresh before it expires
            setTimeout(() => refreshToken(data.refreshToken), (data.expiresIn - 60) * 1000); // Refresh 1 minute before expiry
        } catch (error) {
            console.error('Login failed:', error);
            setError('Failed to log in. Please try again.');
        }
    };

    // Refresh the access token
    const refreshToken = async (refreshToken) => {
        try {
            const response = await fetch('http://localhost:3001/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            localStorage.setItem('accessToken', data.accessToken);

            // Schedule the next refresh
            setTimeout(() => refreshToken(refreshToken), (data.expiresIn - 60) * 1000); // Refresh 1 minute before expiry
        } catch (error) {
            console.error('Failed to refresh token:', error);
            setError('Failed to refresh token. Please log in again.');
        }
    };
    // Handle playlist generation
    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                throw new Error('No access token found. Please log in again.');
            }

            const response = await fetch('http://localhost:3001/create-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mood: mood.value,
                    language: language.value,
                    numberOfSongs,
                    accessToken,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create playlist');
            }

            const data = await response.json();
            setPlaylists([{ name: `${mood.value} ${language.value} Playlist`, url: data.playlistUrl }]);
        } catch (error) {
            console.error('Failed to create playlist:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <div className="content">
                <h1 className="title">Select Your Mood</h1>

                {/* Mood Selection */}
                <Card className="filter-card">
                    <CardBody>
                        <h4>Mood</h4>
                        <Select
                            options={moodOptions}
                            value={mood}
                            onChange={setMood}
                            placeholder="Choose a Mood"
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </CardBody>
                </Card>

                {/* Language Selection */}
                <Card className="filter-card">
                    <CardBody>
                        <h4>Language</h4>
                        <Select
                            options={languageOptions}
                            value={language}
                            onChange={setLanguage}
                            placeholder="Choose a Language"
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </CardBody>
                </Card>

                {/* Number of Songs */}
                <Card className="filter-card">
                    <CardBody>
                        <h4>Number of Songs</h4>
                        <Input
                            type="number"
                            value={numberOfSongs}
                            onChange={(e) => setNumberOfSongs(e.target.value)}
                            min="1"
                            max="100"
                            label="Songs"
                            placeholder="Enter number of songs"
                        />
                    </CardBody>
                </Card>

                {/* Generate Playlist Button */}
                <NextUIButton
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!mood || !language || loading}
                    className="generate-button"
                >
                    {loading ? 'Generating...' : 'Generate Playlist'}
                </NextUIButton>

                {error && <p className="error-message">{error}</p>}

                {/* Playlist Display */}
                {playlists.length > 0 && (
                    <div className="playlist-container">
                        <h2>Your Playlists</h2>
                        {playlists.map((playlist, index) => (
                            <Card key={index} className="playlist-card">
                                <CardBody>
                                    <h4>{playlist.name}</h4>
                                    <NextUIButton
                                        color="primary"
                                        as="a"
                                        href={playlist.url}
                                        target="_blank"
                                    >
                                        Open in Spotify
                                    </NextUIButton>
                                    <iframe
                                        src={`https://open.spotify.com/embed/playlist/${playlist.url.split('/').pop()}`}
                                        width="100%"
                                        height="380"
                                        frameBorder="0"
                                        allow="encrypted-media"
                                        style={{ marginTop: '20px' }}
                                    ></iframe>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;