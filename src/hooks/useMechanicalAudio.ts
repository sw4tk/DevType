'use client';
import { useRef, useCallback, useEffect, useState } from 'react';

export type SwitchProfile = 'thock' | 'clack' | 'click' | 'off';

export function useMechanicalAudio(profile: SwitchProfile = 'thock') {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const ambientNodesRef = useRef<{ source: AudioBufferSourceNode; osc: OscillatorNode; gain: GainNode } | null>(null);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  const ensureContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const bufferSize = Math.floor(ctx.sampleRate * 0.04);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.32));
      }
      noiseBufferRef.current = buffer;
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    const initOnKey = () => ensureContext();
    window.addEventListener('keydown', initOnKey, { once: true });
    return () => window.removeEventListener('keydown', initOnKey);
  }, [ensureContext]);

  // Pure Web Audio API Binaural Flow-State Brown Noise + Sub-Harmonic Drone
  const toggleAmbientDrone = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;

    if (ambientNodesRef.current) {
      const { source, osc, gain } = ambientNodesRef.current;
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      setTimeout(() => {
        try {
          source.stop();
          osc.stop();
        } catch {}
        ambientNodesRef.current = null;
      }, 320);
      setAmbientPlaying(false);
      return;
    }

    // Generate 4-second looping warm brown noise buffer
    const bufLen = ctx.sampleRate * 4;
    const brownBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const output = brownBuf.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 0.15;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = brownBuf;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, ctx.currentTime);

    // Warm 110Hz (A2) ambient synth pad
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(110, ctx.currentTime);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.8);

    noiseSource.connect(filter);
    filter.connect(masterGain);
    droneOsc.connect(masterGain);
    masterGain.connect(ctx.destination);

    noiseSource.start();
    droneOsc.start();

    ambientNodesRef.current = { source: noiseSource, osc: droneOsc, gain: masterGain };
    setAmbientPlaying(true);
  }, [ensureContext]);

  const playKeystroke = useCallback(
    (isError = false) => {
      if (profile === 'off') return;
      const ctx = audioCtxRef.current;
      const noiseBuffer = noiseBufferRef.current;
      if (!ctx || !noiseBuffer || ctx.state === 'suspended') return;

      const t = ctx.currentTime;
      const pitchJitter = 0.94 + Math.random() * 0.12;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      const noiseGain = ctx.createGain();
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      if (isError) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(92, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.065);
        oscGain.gain.setValueAtTime(0.28, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
        osc.start(t);
        osc.stop(t + 0.065);
        return;
      }

      if (profile === 'thock') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160 * pitchJitter, t);
        osc.frequency.exponentialRampToValueAtTime(40 * pitchJitter, t + 0.045);
        oscGain.gain.setValueAtTime(0.55, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(920 * pitchJitter, t);
        noiseGain.gain.setValueAtTime(0.22, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      } else if (profile === 'clack') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(315 * pitchJitter, t);
        osc.frequency.exponentialRampToValueAtTime(95 * pitchJitter, t + 0.035);
        oscGain.gain.setValueAtTime(0.38, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2850 * pitchJitter, t);
        noiseGain.gain.setValueAtTime(0.32, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      } else if (profile === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(520 * pitchJitter, t);
        osc.frequency.exponentialRampToValueAtTime(140 * pitchJitter, t + 0.025);
        oscGain.gain.setValueAtTime(0.2, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(4100 * pitchJitter, t);
        noiseGain.gain.setValueAtTime(0.45, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      }

      osc.start(t);
      osc.stop(t + 0.05);
      noise.start(t);
      noise.stop(t + 0.04);
    },
    [profile]
  );

  return { playKeystroke, ambientPlaying, toggleAmbientDrone };
}