import React from 'react';

export default function MoodSelector({ onSelectMood }) {
    const moods = ['happy', 'sad', 'relaxed', 'focused'];

    return (
        <select onChange={(e) => onSelectMood(e.target.value)}>
            <option value="">Select your mood</option>
            {moods.map((mood) => (
                <option key={mood} value={mood}>
                    {mood}
                </option>
            ))}
        </select>
    );
}