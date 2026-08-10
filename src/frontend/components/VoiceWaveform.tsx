export function VoiceWaveform() {
  return (
    <div className="flex items-center gap-0.5 h-4" aria-label="Voice waveform">
      <div className="w-0.5 bg-primary animate-waveform-1 rounded-full" style={{ animationDelay: '0ms' }} />
      <div className="w-0.5 bg-primary animate-waveform-2 rounded-full" style={{ animationDelay: '150ms' }} />
      <div className="w-0.5 bg-primary animate-waveform-3 rounded-full" style={{ animationDelay: '300ms' }} />
      <div className="w-0.5 bg-primary animate-waveform-2 rounded-full" style={{ animationDelay: '450ms' }} />
      <div className="w-0.5 bg-primary animate-waveform-1 rounded-full" style={{ animationDelay: '600ms' }} />
    </div>
  );
}
