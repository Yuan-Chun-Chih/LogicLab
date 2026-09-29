type ToneOptions = {
  frequency: number
  endFrequency?: number
  duration: number
  waveform?: OscillatorType
  volume?: number
  delay?: number
}

let audioContext: AudioContext | null = null
let enabled = true

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext
    if (!AudioContextConstructor) return null
    audioContext = new AudioContextConstructor()
  }
  if (audioContext.state === 'suspended') void audioContext.resume().catch(() => undefined)
  return audioContext
}

function tone({ frequency, endFrequency, duration, waveform = 'sine', volume = 0.08, delay = 0 }: ToneOptions) {
  if (!enabled) return
  const context = getContext()
  if (!context) return
  const start = context.currentTime + delay
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = waveform
  oscillator.frequency.setValueAtTime(frequency, start)
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)
  gain.gain.setValueAtTime(Math.max(0.001, volume), start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.01)
}

export const soundManager = {
  setEnabled(value: boolean) { enabled = value },
  isEnabled() { return enabled },
  playSwitch() { tone({ frequency: 440, endFrequency: 210, duration: 0.055, waveform: 'triangle', volume: 0.055 }) },
  playConnect() { tone({ frequency: 560, endFrequency: 920, duration: 0.09, waveform: 'sine', volume: 0.06 }) },
  playDisconnect() { tone({ frequency: 350, endFrequency: 150, duration: 0.09, waveform: 'triangle', volume: 0.055 }) },
  playTick(success: boolean) { tone({ frequency: success ? 760 : 260, endFrequency: success ? 920 : 190, duration: 0.045, volume: 0.035 }) },
  playSuccess() {
    ;[523.25, 659.25, 783.99].forEach((frequency, index) => tone({ frequency, duration: 0.24, waveform: 'triangle', volume: 0.07, delay: index * 0.075 }))
  },
  playError() {
    tone({ frequency: 220, endFrequency: 165, duration: 0.16, waveform: 'triangle', volume: 0.055 })
    tone({ frequency: 165, endFrequency: 130, duration: 0.18, waveform: 'triangle', volume: 0.045, delay: 0.12 })
  },
}
