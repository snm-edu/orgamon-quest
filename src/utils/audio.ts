class GameAudio {
    private ctx: AudioContext | null = null;
    private isMuted = false;
    private activeBgm: string | null = null;

    // Use HTMLAudioElement for true music playback
    private bgmAudio: HTMLAudioElement | null = null;

    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.warn("Web Audio API is not supported.");
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Keep simple UI sound effects as Web Audio API since they are just quick blips
    playSE(type: 'success' | 'click' | 'error' | 'level_up' | 'capture' | 'impact') {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;

        const playTone = (freq: number, startTime: number, duration: number, vol = 0.1, oscType: OscillatorType = 'sine') => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = oscType;
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(vol, startTime + duration * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        switch (type) {
            case 'click':
                playTone(600, t, 0.1, 0.03, 'sine');
                break;
            case 'success':
                playTone(523.25, t, 0.15, 0.1, 'sine'); // C5
                playTone(659.25, t + 0.1, 0.3, 0.1, 'sine'); // E5
                break;
            case 'error':
                playTone(200, t, 0.2, 0.1, 'sawtooth');
                playTone(150, t + 0.15, 0.3, 0.1, 'sawtooth');
                break;
            case 'level_up':
                playTone(440, t, 0.15, 0.1, 'triangle');
                playTone(554.37, t + 0.15, 0.15, 0.1, 'triangle');
                playTone(659.25, t + 0.3, 0.15, 0.1, 'triangle');
                playTone(880, t + 0.45, 0.5, 0.1, 'triangle');
                break;
            case 'capture':
                playTone(392.00, t, 0.1, 0.1, 'triangle');
                playTone(587.33, t + 0.1, 0.1, 0.1, 'triangle');
                playTone(783.99, t + 0.2, 0.4, 0.15, 'triangle');
                break;
            case 'impact':
                playTone(100, t, 0.3, 0.2, 'square');
                playTone(80, t + 0.1, 0.4, 0.2, 'sawtooth');
                break;
        }
    }

    // Play actual audio files for BGM instead of generating sounds
    playBGM(type: 'title' | 'map' | 'battle' | 'result' | 'quiz') {
        if (this.isMuted) return;

        // If the same BGM is already playing, do nothing
        if (this.activeBgm === type && this.bgmAudio) {
            return;
        }

        this.stopBGM();
        this.activeBgm = type;

        // Map type to the actual filename we expect in public/audio/
        const bgmFiles: Record<string, string> = {
            title: '/audio/bgm_title.mp3',
            map: '/audio/bgm_map.mp3',
            battle: '/audio/bgm_battle.mp3',
            quiz: '/audio/bgm_quiz.mp3',
            result: '/audio/bgm_result.mp3',
        };

        const src = bgmFiles[type];
        if (!src) return;

        this.bgmAudio = new Audio(src);
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.3; // Default BGM volume

        // Try to play. If the browser blocks it due to no interaction, catch the error quietly
        this.bgmAudio.play().catch(e => {
            console.warn("BGM autoplay prevented. Waiting for user interaction...", e);
        });
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
        this.activeBgm = null;
    }
}

export const audio = new GameAudio();

// Ensure audio context and BGM unlock on first user interaction
if (typeof window !== 'undefined') {
    const initAudio = () => {
        audio.init();
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
}
