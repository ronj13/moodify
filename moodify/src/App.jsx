import React, { useState } from 'react';
import './App.css';

function App() {
    const [mood, setMood] = useState('');

    const handleMoodChange = (event) => {
        setMood(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Fetch playlist based on mood
        // You will integrate the Spotify API here
    };

    return (
        <div className="App">
            <h1>Moodify</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Select your mood:
                    <select value={mood} onChange={handleMoodChange}>
                        <option value="happy">Happy</option>
                        <option value="sad">Sad</option>
                        <option value="relaxed">Relaxed</option>
                        <option value="focused">Focused</option>
                    </select>
                </label>
                <button type="submit">Get Playlist</button>
            </form>
        </div>
    );
}

export default App; <a href=""></a>