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
    const [artistQuery, setArtistQuery] = useState('');
    const [artistResults, setArtistResults] = useState([]);
    const [selectedArtist, setSelectedArtist] = useState(null);

    // Check if user logged in 
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // Redirect to Spotify Login Page
            window.location.href = `https://accounts.spotify.com/authorize?client_id=c2241fa9aede4b82862d5d85188bd33d&response_type=code&redirect_uri=http://localhost:5174/callback&scope=playlist-modify-private playlist-modify-public`;
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
        } catch (error) {
            console.error('Login failed:', error);
            setError('Failed to log in. Please try again.');
        }
    };

    // Debounced search for artists
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (artistQuery.trim() === '') {
                setArtistResults([]);
                return;
            }

            try {
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    throw new Error('No access token found. Please log in again.');
                }

                const response = await fetch('http://localhost:3001/search-artist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        artistQuery,
                        accessToken,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to search for artist');
                }

                const data = await response.json();
                setArtistResults(data.artists);
            } catch (error) {
                console.error('Failed to search for artist:', error);
                setError(error.message);
            }
        }, 300); // 300ms debounce delay

        return () => clearTimeout(delayDebounceFn);
    }, [artistQuery]);
    // Handle artist selection
    const handleArtistSelect = (artist) => {
        setSelectedArtist(artist);
        setArtistQuery(artist.name); // Update the input field with the selected artist's name
        setArtistResults([]); // Clear the dropdown
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
                    selectedArtistId: selectedArtist?.id, // Send only the artist ID
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
                        <div className="dropdown-container">
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
                        </div>
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

                {/* Artist Search */}
                <Card className="filter-card">
                    <CardBody>
                        <h4>Search Artist</h4>
                        <Input
                            type="text"
                            value={artistQuery}
                            onChange={(e) => setArtistQuery(e.target.value)}
                            label="Artist"
                            placeholder="Enter artist name"
                        />
                        {artistResults.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button variant="bordered" color="primary">
                                        Select Artist
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Artist Selection"
                                    onAction={(key) => handleArtistSelect(artistResults[key])}
                                >
                                    {artistResults.map((artist, index) => (
                                        <DropdownItem key={index}>{artist.name}</DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                        {selectedArtist && (
                            <div className="selected-artist">
                                <h4>Selected Artist: {selectedArtist.name}</h4>
                                <img src={selectedArtist.image} alt={selectedArtist.name} />
                            </div>
                        )}
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