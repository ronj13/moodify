

export const getPlaylists = (mood) => {
    // Dummy data for testing
    const playlists = {
      happy: ["Happy Vibes", "Upbeat Energy", "Feel-Good Classics"],
      relaxed: ["Lo-Fi Beats", "Acoustic Chill", "Calm Moods"],
      focused: ["Study Jams", "Deep Work Beats", "Instrumental Focus"],
    };
    return playlists[mood] || [];
  };