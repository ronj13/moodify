import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Link,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button as NextUIButton,
    Card,
    CardBody,
    Input,
    Spacer,
    Avatar,
    Chip,
} from '@nextui-org/react';
import './styles/App.css';

function App() {
    const [mood, setMood] = useState(null);
    const [numberOfSongs, setNumberOfSongs] = useState(null);

    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const moodOptions = [
        { value: 'Happy', label: 'Happy' },
        { value: 'Sad', label: 'Sad' },
        { value: 'Relaxed', label: 'Relaxed' },
        { value: 'Energetic', label: 'Energetic' },
    ];


    const [artistQuery, setArtistQuery] = useState('');
    const [artistResults, setArtistResults] = useState([]);
    const [selectedArtist, setSelectedArtist] = useState(null);

    const checkAndRefreshToken = async () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!accessToken || !refreshToken) {
            throw new Error('No access token or refresh token found. Please log in again.');
        }

        // Check if the token is expired (you can store the expiry time in localStorage)
        const expiryTime = localStorage.getItem('tokenExpiry');
        if (expiryTime && Date.now() > parseInt(expiryTime)) {
            // Token is expired, refresh it
            const newToken = await refreshToken(refreshToken);
            return newToken;
        }

        return accessToken;
    };

    // Check if user logged in 
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!token && !code) {
            // Redirect to Spotify Login Page only if there's no token and no code
            window.location.href = `https://accounts.spotify.com/authorize?client_id=c2241fa9aede4b82862d5d85188bd33d&response_type=code&redirect_uri=http://localhost:5174/callback&scope=playlist-modify-private playlist-modify-public`;
        } else if (code && !token) {
            // If there's a code but no token, handle the login
            handleLogin(code);
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
            console.log('Exchanging code for access token:', code);
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
    
            // Store the expiry time (current time + expiresIn seconds)
            const expiryTime = Date.now() + data.expiresIn * 1000;
            localStorage.setItem('tokenExpiry', expiryTime);
    
            // Schedule token refresh before it expires
            setTimeout(() => refreshToken(data.refreshToken), (data.expiresIn - 60) * 1000); // Refresh 1 minute before expiry
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
                const testToken = "..gq-O3Y8zrqcdfoVRGs970Qp0IIVJQC-z4V5dMxkshnc"
                if (!accessToken) {
                    throw new Error('No access token found. Please log in again.');
                }

                console.log("Sending artist search request for:", artistQuery); // Debugging Log

                const response = await fetch('http://localhost:3001/search-artist', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ artistQuery, accessToken }),
                });

                if (!response.ok) {
                    throw new Error('Failed to search for artist');
                }

                const data = await response.json();
                console.log("Artists received from backend:", data.artists); // Debugging Log
                setArtistResults(data.artists);
            } catch (error) {
                console.error('Failed to search for artist:', error);
                setError(error.message);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [artistQuery]);

    // Handle artist selection
    const handleArtistSelect = (artist) => {
        if (!selectedArtists.some((a) => a.id === artist.id)) {
            setSelectedArtists([...selectedArtists, artist]);
        }
        setArtistQuery(''); // Clear the input field
        setArtistResults([]); // Clear the dropdown
    };

    // Handle artist removal
    const handleArtistRemove = (artistId) => {
        setSelectedArtists(selectedArtists.filter((artist) => artist.id !== artistId));
    };

    // Refresh the access token
    const refreshToken = async (currentRefreshToken) => {
        try {
            const response = await fetch('http://localhost:3001/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: currentRefreshToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            console.log('Tokens refreshed:', data);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            // Store the expiry time (current time + expiresIn seconds)
            const expiryTime = Date.now() + data.expiresIn * 1000;
            localStorage.setItem('tokenExpiry', expiryTime);

            // Schedule the next refresh
            setTimeout(() => refreshToken(data.refreshToken), (data.expiresIn - 60) * 1000); // Refresh 1 minute before expiry

            return data.accessToken;
        } catch (error) {
            console.error('Failed to refresh token:', error);
            setError('Failed to refresh token. Please log in again.');
            throw error;
        }
    };

    // Handle playlist generation
    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const accessToken = await checkAndRefreshToken();

            const response = await fetch('http://localhost:3001/create-playlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mood: mood?.value,
                    numberOfSongs,
                    accessToken,
                    selectedArtistId: selectedArtist?.id,
                    selectedArtistName: selectedArtist?.name,
                    selectedSongs: selectedSongs.map(song => song.uri), // Send only URIs
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create playlist');
            }

            const data = await response.json();
            setPlaylists([{ name: `${mood.value} Playlist`, url: data.playlistUrl }]);
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
                            fullWidth
                            bordered
                            color="primary"
                        />
                    </CardBody>
                </Card>

                {/* Song Search */}
                <Card className="filter-card">
                    <CardBody>
                        <h4>Search for a Song</h4>
                        <Input
                            type="text"
                            value={songQuery}
                            onChange={(e) => setSongQuery(e.target.value)}
                            placeholder="Enter song name"
                        />
                        {songResults.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <NextUIButton variant="bordered" color="primary">
                                        Select Song
                                    </NextUIButton>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Song Selection"
                                    onAction={(key) => handleSongSelect(songResults[key])}
                                >
                                    {songResults.map((song, index) => (
                                        <DropdownItem key={index}>
                                            {song.name} - {song.artist}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                        {selectedSongs.length > 0 && (
                            <div className="selected-songs">
                                <h4>Selected Songs:</h4>
                                <ul>
                                    {selectedSongs.map((song, index) => (
                                        <li key={index}>{song.name} - {song.artist}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardBody>
                </Card>


                {/* Song Search */}
                <Card className="filter-card">
                    <CardBody>
                        <h4>Search for a Song</h4>
                        <Input
                            type="text"
                            value={songQuery}
                            onChange={(e) => setSongQuery(e.target.value)}
                            placeholder="Enter song name"
                        />
                        {songResults.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <NextUIButton variant="bordered" color="primary">
                                        Select Song
                                    </NextUIButton>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Song Selection"
                                    onAction={(key) => handleSongSelect(songResults[key])}
                                >
                                    {songResults.map((song, index) => (
                                        <DropdownItem key={index}>
                                            {song.name} - {song.artist}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                        {selectedSongs.length > 0 && (
                            <div className="selected-songs">
                                <h4>Selected Songs:</h4>
                                <ul>
                                    {selectedSongs.map((song, index) => (
                                        <li key={index}>{song.name} - {song.artist}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
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
                            fullWidth
                            bordered
                            color="primary"
                        />
                        {artistResults.length > 0 && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <NextUIButton variant="bordered" color="primary" className="dropdown-button">
                                        Select Artist
                                    </NextUIButton>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Artist Selection"
                                    onAction={(key) => handleArtistSelect(artistResults[key])}
                                >
                                    {artistResults.map((artist, index) => (
                                        <DropdownItem key={index}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar
                                                    src={artist.image}
                                                    alt={artist.name}
                                                    size="sm"
                                                    style={{ marginRight: '8px' }}
                                                />
                                                {artist.name}
                                            </div>
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                        {selectedArtists.length > 0 && (
                            <div className="selected-artists">
                                <h4>Selected Artists:</h4>
                                <div className="artist-chips">
                                    {selectedArtists.map((artist) => (
                                        <Chip
                                            key={artist.id}
                                            onClose={() => handleArtistRemove(artist.id)}
                                            variant="bordered"
                                            color="primary"
                                            avatar={
                                                <Avatar
                                                    src={artist.image}
                                                    alt={artist.name}
                                                    size="sm"
                                                />
                                            }
                                        >
                                            {artist.name}
                                        </Chip>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Generate Playlist Button */}
                <NextUIButton
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!mood || loading}
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


// import React, { useState, useEffect } from 'react';
// import Select from 'react-select';
// import {
//     Navbar,
//     NavbarBrand,
//     NavbarContent,
//     NavbarItem,
//     Link,
//     Dropdown,
//     DropdownTrigger,
//     DropdownMenu,
//     DropdownItem,
//     Button as NextUIButton,
//     Card,
//     CardBody,
//     Input,
// } from '@nextui-org/react';
// import './styles/App.css';

// function App() {
//     const [mood, setMood] = useState(null);
//     const [language, setLanguage] = useState(null);
//     const [numberOfSongs, setNumberOfSongs] = useState(null);
//     const [playlists, setPlaylists] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     const moodOptions = [
//         { value: 'Happy', label: 'Happy' },
//         { value: 'Sad', label: 'Sad' },
//         { value: 'Relaxed', label: 'Relaxed' },
//         { value: 'Energetic', label: 'Energetic' },
//     ];

//     const languageOptions = [
//         { value: 'English', label: 'English' },
//         { value: 'Mandarin', label: 'Mandarin' },
//         { value: 'Korean', label: 'Korean' },
//         { value: 'Random', label: 'Random' },
//         { value: 'Mix', label: 'Mix' },
//     ];
//     const [artistQuery, setArtistQuery] = useState('');
//     const [artistResults, setArtistResults] = useState([]);
//     const [selectedArtist, setSelectedArtist] = useState(null);

//     // Check if user logged in 
//     useEffect(() => {
//         const token = localStorage.getItem('accessToken');
//         const urlParams = new URLSearchParams(window.location.search);
//         const code = urlParams.get('code');
    
//         if (!token && !code) {
//             // Redirect to Spotify Login Page only if there's no token and no code
//             window.location.href = `https://accounts.spotify.com/authorize?client_id=957639a18400425fb949acda676fe622&response_type=code&redirect_uri=http://localhost:5174/callback&scope=playlist-modify-private playlist-modify-public`;
//         } else if (code && !token) {
//             // If there's a code but no token, handle the login
//             handleLogin(code);
//         }
//     }, []);

//     // Handle Spotify callback (extract authorization code)
//     useEffect(() => { 
//         const urlParams = new URLSearchParams(window.location.search);
//         const code = urlParams.get('code');
//         if (code) {
//             handleLogin(code);
//         }
//     }, []);

//     // Handle login to get access token
//     const handleLogin = async (code) => {
//         try {
//             console.log('Exchanging code for access token:', code);
//             const response = await fetch('http://localhost:3001/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ code }),
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to authenticate');
//             }

//             const data = await response.json();
//             localStorage.setItem('accessToken', data.accessToken);
//             localStorage.setItem('refreshToken', data.refreshToken);

//             // Schedule token refresh before it expires
//             setTimeout(() => refreshToken(data.refreshToken), (data.expiresIn - 60) * 1000); // Refresh 1 minute before expiry
//         } catch (error) {
//             console.error('Login failed:', error);
//             setError('Failed to log in. Please try again.');
//         }
//     };

//     // Debounced search for artists
//     useEffect(() => {
//         const delayDebounceFn = setTimeout(async () => {
//             if (artistQuery.trim() === '') {
//                 setArtistResults([]);
//                 return;
//             }

//             try {
//                 const accessToken = localStorage.getItem('accessToken');
//                 if (!accessToken) {
//                     throw new Error('No access token found. Please log in again.');
//                 }

//                 const response = await fetch('http://localhost:3001/search-artist', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({
//                         artistQuery,
//                         accessToken,
//                     }),
//                 });

//                 if (!response.ok) {
//                     throw new Error('Failed to search for artist');
//                 }

//                 const data = await response.json();
//                 setArtistResults(data.artists);
//             } catch (error) {
//                 console.error('Failed to search for artist:', error);
//                 setError(error.message);
//             }
//         }, 300); // 300ms debounce delay

//         return () => clearTimeout(delayDebounceFn);
//     }, [artistQuery]);
//     // Handle artist selection
//     const handleArtistSelect = (artist) => {
//         setSelectedArtist(artist);
//         setArtistQuery(artist.name); // Update the input field with the selected artist's name
//         setArtistResults([]); // Clear the dropdown
//     };

//     // Refresh the access token
//     const refreshToken = async (refreshToken) => {
//         try {
//             const response = await fetch('http://localhost:3001/refresh', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({ refreshToken }),
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to refresh token');
//             }

//             const data = await response.json();
//             console.log('Login successful. Tokens received:', data);
//             localStorage.setItem('accessToken', data.accessToken);
//             localStorage.setItem('refreshToken', data.refreshToken);

//             // Schedule the next refresh
//             setTimeout(() => refreshToken(refreshToken), (data.expiresIn - 60) * 1000); // Refresh 1 minute before expiry
//         } catch (error) {
//             console.error('Failed to refresh token:', error);
//             setError('Failed to refresh token. Please log in again.');
//         }
//     };
//     // Handle playlist generation
//     const handleSubmit = async () => {
//         setLoading(true);
//         setError('');
    
//         try {
//             const accessToken = localStorage.getItem('accessToken');
//             if (!accessToken) {
//                 throw new Error('No access token found. Please log in again.');
//             }
    
//             const response = await fetch('http://localhost:3001/create-playlist', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     mood: mood.value,
//                     language: language.value,
//                     numberOfSongs,
//                     accessToken,
//                     selectedArtistId: selectedArtist?.id, // Send the artist ID
//                     selectedArtistName: selectedArtist?.name, // Send the artist
//                 }),
//             });
    
//             if (!response.ok) {
//                 throw new Error('Failed to create playlist');
//             }
    
//             const data = await response.json();
//             setPlaylists([{ name: `${mood.value} ${language.value} Playlist`, url: data.playlistUrl }]);
//         } catch (error) {
//             console.error('Failed to create playlist:', error);
//             setError(error.message);
//         } finally {
//             setLoading(false);
//         }
//     };
    
//     return (
//         <div className="App">
//             <div className="content">
//                 <h1 className="title">Select Your Mood</h1>

//                 {/* Mood Selection */}
//                 <Card className="filter-card">
//                     <CardBody>
//                         <h4>Mood</h4>
//                         <Select
//                             options={moodOptions}
//                             value={mood}
//                             onChange={setMood}
//                             placeholder="Choose a Mood"
//                             className="react-select-container"
//                             classNamePrefix="react-select"
//                         />
//                     </CardBody>
//                 </Card>

//                 {/* Language Selection */}
//                 <Card className="filter-card">
//                     <CardBody>
//                         <h4>Language</h4>
//                         <Select
//                             options={languageOptions}
//                             value={language}
//                             onChange={setLanguage}
//                             placeholder="Choose a Language"
//                             className="react-select-container"
//                             classNamePrefix="react-select"
//                         />
//                     </CardBody>
//                 </Card>

//                 {/* Number of Songs */}
//                 <Card className="filter-card">
//                     <CardBody>
//                         <h4>Number of Songs</h4>
//                         <Input
//                             type="number"
//                             value={numberOfSongs}
//                             onChange={(e) => setNumberOfSongs(e.target.value)}
//                             min="1"
//                             max="100"
//                             label="Songs"
//                             placeholder="Enter number of songs"
//                         />
//                     </CardBody>
//                 </Card>

//                 Artist Search
//                 <Card className="filter-card">
//                     <CardBody>
//                         <h4>Search Artist</h4>
//                         <Input
//                             type="text"
//                             value={artistQuery}
//                             onChange={(e) => setArtistQuery(e.target.value)}
//                             label="Artist"
//                             placeholder="Enter artist name"
//                         />
//                         {artistResults.length > 0 && (
//                             <Dropdown>
//                                 <DropdownTrigger>
//                                     <NextUIButton variant="bordered" color="primary">
//                                         Select Artist
//                                     </NextUIButton>
//                                 </DropdownTrigger>
//                                 <DropdownMenu
//                                     aria-label="Artist Selection"
//                                     onAction={(key) => handleArtistSelect(artistResults[key])}
//                                 >
//                                     {artistResults.map((artist, index) => (
//                                         <DropdownItem key={index}>{artist.name}</DropdownItem>
//                                     ))}
//                                 </DropdownMenu>
//                             </Dropdown>
//                         )}
//                         {selectedArtist && (
//                             <div className="selected-artist">
//                                 <h4>Selected Artist: {selectedArtist.name}</h4>
//                                 <img src={selectedArtist.image} alt={selectedArtist.name} />
//                             </div>
//                         )}
//                     </CardBody>
//                 </Card>

//                 {/* Generate Playlist Button */}
//                 <NextUIButton
//                     color="primary"
//                     onClick={handleSubmit}
//                     disabled={!mood || !language || loading}
//                     className="generate-button"
//                 >
//                     {loading ? 'Generating...' : 'Generate Playlist'}
//                 </NextUIButton>

//                 {error && <p className="error-message">{error}</p>}

//                 {/* Playlist Display */}
//                 {playlists.length > 0 && (
//                     <div className="playlist-container">
//                         <h2>Your Playlists</h2>
//                         {playlists.map((playlist, index) => (
//                             <Card key={index} className="playlist-card">
//                                 <CardBody>
//                                     <h4>{playlist.name}</h4>
//                                     <NextUIButton
//                                         color="primary"
//                                         as="a"
//                                         href={playlist.url}
//                                         target="_blank"
//                                     >
//                                         Open in Spotify
//                                     </NextUIButton>
//                                     <iframe
//                                         src={`https://open.spotify.com/embed/playlist/${playlist.url.split('/').pop()}`}
//                                         width="100%"
//                                         height="380"
//                                         frameBorder="0"
//                                         allow="encrypted-media"
//                                         style={{ marginTop: '20px' }}
//                                     ></iframe>
//                                 </CardBody>
//                             </Card>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default App;