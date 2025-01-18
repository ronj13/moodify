import React, { useState } from 'react';
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
import './styles/App.css'; // Updated import path

function App() {
    const [mood, setMood] = useState('');
    const [language, setLanguage] = useState('');
    const [numberOfSongs, setNumberOfSongs] = useState(10);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/create-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mood,
                    language,
                    numberOfSongs,
                    accessToken: localStorage.getItem('accessToken'),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create playlist');
            }

            const data = await response.json();
            setPlaylists([{ name: `${mood} ${language} Playlist`, url: data.playlistUrl }]);
        } catch (error) {
            console.error('Failed to create playlist:', error);
        } finally {
            setLoading(false);
        }
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




// import React, { useState } from 'react';
// import Navbar from './components/Navbar';
// import MoodSelector from './components/MoodSelector';
// import PlaylistDisplay from './components/PlaylistDisplay';
// import './styles/styles.css';

// function App() {
//     const [mood, setMood] = useState('');
//     const [playlists, setPlaylists] = useState([]);

//     const handleMoodChange = (selectedMood) => {
//         setMood(selectedMood);
//     };

//     const handleSubmit = async (event) => {
//         event.preventDefault();
//         // Simulate fetching playlists based on mood
//         const mockPlaylists = {
//             happy: ['Feel Good Beats', 'Chill Vibes', 'Energize'],
//             relaxed: ['Chill Vibes', 'Feel Good Beats', 'Energize'],
//             focused: ['Energize', 'Feel Good Beats', 'Chill Vibes'],
//             energetic: ['Energize', 'Feel Good Beats', 'Chill Vibes'],
//         };

//         setPlaylists(mockPlaylists[mood] || []);
//     };

//     return (
//         <div className="App">
//             <Navbar />
//             <div className="content">
//                 <h1>Select Your Mood</h1>
//                 <form onSubmit={handleSubmit}>
//                     <MoodSelector onSelectMood={handleMoodChange} />
//                     <button type="submit">Get Playlist</button>
//                 </form>
//                 <PlaylistDisplay playlists={playlists} />
//             </div>
//         </div>
//     );
// }

// export default App;