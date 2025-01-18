import React from 'react';

export default function MoodSelector({ onSelectMood }) {
    const moods = ['happy', 'relaxed', 'focused', 'energetic'];

    return (
        <select onChange={(e) => onSelectMood(e.target.value)}>
            <option value="">Select your mood</option>
            {moods.map((mood) => (
                <option key={mood} value={mood}>
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </option>
            ))}
        </select>
    );
}