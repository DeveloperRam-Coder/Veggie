
// Available notification sounds
export type SoundOption = {
  id: string;
  name: string; 
  url: string;
  duration?: number; // Duration in seconds
};

export const availableSounds: SoundOption[] = [
  {
    id: 'default',
    name: 'Default Bell',
    url: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
    duration: 30
  },
  {
    id: 'gentle',
    name: 'Gentle Chime',
    url: 'https://assets.mixkit.co/active_storage/sfx/1531/1531-preview.mp3',
    duration: 30
  },
  {
    id: 'buzzer',
    name: 'Buzzer Alert',
    url: 'https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3',
    duration: 30
  },
  {
    id: 'kitchen',
    name: 'Kitchen Timer',
    url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    duration: 30
  },
  {
    id: 'alarm',
    name: 'Loud Alarm',
    url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    duration: 30
  },
  {
    id: 'siren',
    name: 'Warning Siren',
    url: 'https://assets.mixkit.co/active_storage/sfx/1815/1815-preview.mp3',
    duration: 30
  },
  {
    id: 'bell',
    name: 'School Bell',
    url: 'https://assets.mixkit.co/active_storage/sfx/2872/2872-preview.mp3',
    duration: 30
  },
  {
    id: 'emergency',
    name: 'Emergency Alert',
    url: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3',
    duration: 30
  },
  {
    id: 'digital',
    name: 'Digital Alarm',
    url: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
    duration: 30
  },
  {
    id: 'ring',
    name: 'Phone Ring',
    url: 'https://assets.mixkit.co/active_storage/sfx/2907/2907-preview.mp3', 
    duration: 30
  },
  {
    id: 'industrial',
    name: 'Industrial Alarm',
    url: 'https://assets.mixkit.co/active_storage/sfx/2865/2865-preview.mp3',
    duration: 30
  },
  {
    id: 'hospital',
    name: 'Hospital Alert',
    url: 'https://assets.mixkit.co/active_storage/sfx/2908/2908-preview.mp3',
    duration: 30
  },
  {
    id: 'doorbell',
    name: 'Doorbell',
    url: 'https://assets.mixkit.co/active_storage/sfx/1/1-preview.mp3',
    duration: 30
  },
  {
    id: 'clockalarm',
    name: 'Alarm Clock',
    url: 'https://assets.mixkit.co/active_storage/sfx/214/214-preview.mp3',
    duration: 30
  },
  {
    id: 'custom',
    name: 'Custom Sound',
    url: '',
    duration: 30
  }
];

// Audio element for controlling sound
let activeAudio: HTMLAudioElement | null = null;
let soundDuration: number = 30;
let soundTimer: number | null = null;

export const playSound = (soundUrl: string, duration: number = 30): void => {
  // Stop any currently playing sound
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }
  
  // Clear any existing timer
  if (soundTimer !== null) {
    window.clearTimeout(soundTimer);
    soundTimer = null;
  }
  
  // Create and play the new sound
  const audio = new Audio(soundUrl);
  activeAudio = audio;
  soundDuration = duration;
  
  // Set up loop if duration is longer than the audio file
  audio.loop = true;
  
  audio.play().catch(error => {
    console.error('Error playing sound:', error);
  });
  
  // Stop the sound after specified duration
  soundTimer = window.setTimeout(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      if (activeAudio === audio) {
        activeAudio = null;
      }
      soundTimer = null;
    }
  }, duration * 1000);
};

export const stopSound = (): void => {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  
  if (soundTimer !== null) {
    window.clearTimeout(soundTimer);
    soundTimer = null;
  }
};

// Get currently playing sound info
export const getActiveSoundInfo = (): { isPlaying: boolean, remainingSeconds: number } => {
  if (!activeAudio || !soundTimer) {
    return { isPlaying: false, remainingSeconds: 0 };
  }
  
  // Calculate remaining time
  const elapsed = activeAudio.currentTime;
  const remaining = Math.max(0, soundDuration - elapsed);
  
  return {
    isPlaying: !activeAudio.paused,
    remainingSeconds: Math.round(remaining)
  };
};

// Function to add custom sound
export const addCustomSound = (name: string, url: string): SoundOption => {
  const customSound: SoundOption = {
    id: `custom-${Date.now()}`,
    name,
    url,
    duration: 30
  };
  
  // Replace the placeholder custom sound
  const customIndex = availableSounds.findIndex(sound => sound.id === 'custom');
  if (customIndex >= 0) {
    availableSounds[customIndex] = customSound;
  } else {
    availableSounds.push(customSound);
  }
  
  return customSound;
};
