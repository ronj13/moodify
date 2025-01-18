import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MoodSelector from './components/MoodSelector';
import PlaylistDisplay from './components/PlaylistDisplay';

function App() {
    const [mood, setMood] = useState('');
    const [playlists, setPlaylists] = useState([]);

    const handleMoodChange = (selectedMood) => {
        setMood(selectedMood);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Simulate fetching playlists based on mood
        // Replace this with actual API call to Spotify
        const mockPlaylists = {
            happy: ['Happy Hits', 'Feel Good Pop', 'Summer Vibes'],
            sad: ['Sad Songs', 'Heartbreak Hits', 'Melancholy Melodies'],
            relaxed: ['Chill Vibes', 'Lo-fi Beats', 'Relax & Unwind'],
            focused: ['Deep Focus', 'Productive Morning', 'Concentration Flow'],
        };

        setPlaylists(mockPlaylists[mood] || []);
    };

    return (
        <div className="App">
            <Navbar />
            <div style={{ padding: '1rem' }}>
                <h1>Moodify</h1>
                <form onSubmit={handleSubmit}>
                    <label>
                        Select your mood:
                        <MoodSelector onSelectMood={handleMoodChange} />
                    </label>
                    <button type="submit">Get Playlist</button>
                </form>
                <PlaylistDisplay playlists={playlists} />
            </div>
        </div>
    );
}

export default App;