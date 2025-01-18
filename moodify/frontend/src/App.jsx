import React, { useState, useEffect } from 'react';
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Card,
    CardBody,
    Input,
} from '@nextui-org/react';
import './styles/App.css';

function App() {
    const [mood, setMood] = useState('');
    const [language, setLanguage] = useState('');
    const [numberOfSongs, setNumberOfSongs] = useState(10);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Check if user logged in 
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // Redirect to Spotify Login Page
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
            console.log('Logging in with code:', code)
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
            console.log('Login successful. Access token is', data.accessToken)
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
        } catch (error) {
            console.error('Login failed:', error);
            setError('Failed to log in. Please try again.');
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
                    mood,
                    language,
                    numberOfSongs,
                    accessToken,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create playlist');
            }

            const data = await response.json();
            setPlaylists([{ name: `${mood} ${language} Playlist`, url: data.playlistUrl }]);
        } catch (error) {
            console.error('Failed to create playlist:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            {/* Main Content */}
            <div className="content">
                <h1 className="title">Select Your Mood</h1>

                {/* Mood Selection */}
                <Card className="filter-card">
                    <CardBody>
                        <h4>Mood</h4>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button variant="bordered" color="primary">
                                    {mood || 'Choose a Mood'}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Mood Selection"
                                onAction={(key) => setMood(key)}
                            >
                                <DropdownItem key="Happy">Happy</DropdownItem>
                                <DropdownItem key="Sad">Sad</DropdownItem>
                                <DropdownItem key="Relaxed">Relaxed</DropdownItem>
                                <DropdownItem key="Energetic">Energetic</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </CardBody>
                </Card>

                {/* Language Selection */}
                <Card className="filter-card">
                    <CardBody>
                        <h4>Language</h4>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button variant="bordered" color="primary">
                                    {language || 'Choose a Language'}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Language Selection"
                                onAction={(key) => setLanguage(key)}
                            >
                                <DropdownItem key="English">English</DropdownItem>
                                <DropdownItem key="Mandarin">Mandarin</DropdownItem>
                                <DropdownItem key="Korean">Korean</DropdownItem>
                                <DropdownItem key="Random">Random</DropdownItem>
                                <DropdownItem key="Mix">Mix</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
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
                <Button
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!mood || !language || loading}
                    className="generate-button"
                >
                    {loading ? 'Generating...' : 'Generate Playlist'}
                </Button>

                {error && <p className="error-message">{error}</p>}

                {/* Playlist Display */}
                {playlists.length > 0 && (
                    <div className="playlist-container">
                        <h2>Your Playlists</h2>
                        {playlists.map((playlist, index) => (
                            <Card key={index} className="playlist-card">
                                <CardBody>
                                    <h4>{playlist.name}</h4>
                                    <Button
                                        color="primary"
                                        as="a"
                                        href={playlist.url}
                                        target="_blank"
                                    >
                                        Open in Spotify
                                    </Button>
                                    {/* To Embed Spotify Playlist Preview */}
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