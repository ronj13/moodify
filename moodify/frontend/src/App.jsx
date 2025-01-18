// App.jsx
import React, { useState } from 'react';
import NavbarComponent from './components/Navbar';
import MoodSelector from './components/MoodSelector';
import PlaylistDisplay from './components/PlaylistDisplay';
import './styles/styles.css';

function App() {
  const [mood, setMood] = useState('');
  const [playlists, setPlaylists] = useState([]);

  const handleMoodChange = (selectedMood) => {
    setMood(selectedMood);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const mockPlaylists = {
      happy: ['Feel Good Beats', 'Chill Vibes', 'Energize'],
      relaxed: ['Chill Vibes', 'Feel Good Beats', 'Energize'],
      focused: ['Energize', 'Feel Good Beats', 'Chill Vibes'],
      energetic: ['Energize', 'Feel Good Beats', 'Chill Vibes'],
    };
    
    setPlaylists(mockPlaylists[mood] || []);
  };

  return (
    <div className="App">
      <NavbarComponent />
      <div className="content">
        <h1>Select Your Mood</h1>
        <form onSubmit={handleSubmit}>
          <MoodSelector onSelectMood={handleMoodChange} />
          <button type="submit">Get Playlist</button>
        </form>
        <PlaylistDisplay playlists={playlists} />
      </div>
    </div>
  );
}

export default App;