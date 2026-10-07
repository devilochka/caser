// Sound manager ported from the original caser.one useGameSounds (Howler,
// Web Audio): volume = baseVolume × 0.7, play() stops the previous instance
// unless interrupt:false, loop only when the sound or the call asks for it,
// stop() restores the default loop/volume, everything stops while the tab is
// hidden, and the audio context is unlocked by click/touchstart/keydown.
// Falls back to <audio> when a file cannot be decoded by Web Audio.
const SOUNDS = {
  Drop_Impact: { file: "Case_Drop_Impact", base: 0.65 },
  Open_KeyUnlock: { file: "Case_Open_KeyUnlock", base: 0.72 },
  Roll_Tick_Slow: { file: "Case_Roll_Tick_Slow", base: 0.58 },
  Drop_Common: { file: "Case_Drop_Common", base: 0.68 },
  Drop_Rare: { file: "Case_Drop_Rare", base: 0.78 },
  Upgrade_Wheel_Roll_Fast: { file: "Upgrade_Wheel_Roll_Fast", base: 0.6 },
  Upgrade_Wheel_Roll_Slow: { file: "Upgrade_Wheel_Roll_Slow", base: 0.62 },
  Upgrade_Win: { file: "Upgrade_Win", base: 0.8 },
  LuckyDrop_Appear: { file: "LuckyDrop_Appear", base: 0.72, lazy: true },
  LuckyDrop_Win: { file: "LuckyDrop_Win", base: 0.83, lazy: true },
  Mystery_Ambience_Loop: { file: "Mystery_Ambience_Loop", base: 0.34, loop: true, lazy: true },
  Mystery_Upgrade_Process: { file: "Mystery_Upgrade_Process", base: 0.72, lazy: true },
  Mystery_Drop_Reveal: { file: "Mystery_Drop_Reveal", base: 0.74, lazy: true },
  Mystery_Drop_Rare: { file: "Mystery_Drop_Rare", base: 0.82, lazy: true },
  UI_Notification_Receive: { file: "UI_Notification_Receive", base: 0.7, lazy: true },
};
// Original names with the Case_ prefix are accepted too.
const alias = (name) => (SOUNDS[name] ? name : name?.startsWith("Case_") && SOUNDS[name.slice(5)] ? name.slice(5) : name);
const clamp = (v) => Math.max(0, Math.min(1, v));
const UNLOCK_EVENTS = ["click", "touchstart", "keydown"];

export class AudioManager {
  constructor(enabled) {
    this._enabled = enabled;
    this.events = [];
    this.onToggle = null;
    this.buffers = new Map(); // name -> Promise<AudioBuffer|null>
    this.voices = new Map(); // name -> Set<voice>
    this.elements = new Map(); // name -> HTMLAudioElement fallback
    this.generation = new Map(); // name -> counter, cancels pending plays on stop()
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = Ctx ? new Ctx() : null;
    this.unlocked = !this.ctx || this.ctx.state === "running";
    const unlock = () => {
      if (!this.ctx) return;
      this.ctx
        .resume()
        .then(() => {
          this.unlocked = this.ctx.state === "running";
          if (this.unlocked) {
            UNLOCK_EVENTS.forEach((e) => document.removeEventListener(e, unlock, true));
            this.preload();
          }
        })
        .catch(() => {});
    };
    UNLOCK_EVENTS.forEach((e) => document.addEventListener(e, unlock, true));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
    });
    if (this.unlocked) this.preload();
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(value) {
    this._enabled = value;
    if (!value) this.stop();
    this.onToggle?.(value);
  }
  preload(names = Object.keys(SOUNDS).filter((n) => !SOUNDS[n].lazy)) {
    names.forEach((n) => this.load(alias(n)));
  }
  url(name) {
    return "./sounds/" + SOUNDS[name].file + ".m4a";
  }
  load(name) {
    if (!SOUNDS[name] || !this.ctx) return Promise.resolve(null);
    let p = this.buffers.get(name);
    if (!p) {
      // Resolves to an AudioBuffer, "missing" (file not on disk: stay silent)
      // or null (not decodable here: fall back to <audio>).
      p = fetch(this.url(name))
        .then((r) => (r.ok ? r.arrayBuffer() : "missing"))
        .then((data) => (data === "missing" ? data : this.ctx.decodeAudioData(data)))
        .catch(() => null);
      this.buffers.set(name, p);
    }
    return p;
  }
  element(name) {
    let a = this.elements.get(name);
    if (!a) {
      a = new Audio(this.url(name));
      a.preload = "auto";
      this.elements.set(name, a);
    }
    return a;
  }
  play(rawName, options = {}) {
    const name = alias(rawName),
      sound = SOUNDS[name];
    if (!sound || !this.enabled || document.hidden) return;
    const volume = clamp((options.volume ?? sound.base) * 0.7),
      loop = typeof options.loop === "boolean" ? options.loop : !!sound.loop;
    if (options.interrupt === false && this.isPlaying(name)) return;
    if (options.interrupt !== false) this.stop(name);
    const gen = this.generation.get(name) || 0;
    this.events.push({ name, at: performance.now() });
    if (this.events.length > 200) this.events.shift();
    if (!this.ctx) return this.playElement(name, volume, loop);
    if (this.ctx.state !== "running") {
      // Like the original: no sound before the page got a user gesture, so
      // nothing is queued to burst out later.
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      this.ctx.resume().catch(() => {});
    }
    this.load(name).then((buffer) => {
      // stop() or another play() happened while the file was loading.
      if ((this.generation.get(name) || 0) !== gen || !this.enabled || document.hidden) return;
      if (buffer === "missing") return;
      if (!buffer) return this.playElement(name, volume, loop);
      const source = this.ctx.createBufferSource(),
        gain = this.ctx.createGain();
      source.buffer = buffer;
      source.loop = loop;
      gain.gain.value = volume;
      source.connect(gain).connect(this.ctx.destination);
      const voice = { source, gain };
      let set = this.voices.get(name);
      if (!set) this.voices.set(name, (set = new Set()));
      set.add(voice);
      source.onended = () => set.delete(voice);
      source.start();
    });
  }
  // One short slice of a sound (Web Audio only), e.g. a single roulette tick.
  // Registered under the sound's name, so stop(name) silences it too.
  playSlice(rawName, offset, duration, volumeScale = 1) {
    const name = alias(rawName),
      sound = SOUNDS[name];
    if (!sound || !this.enabled || document.hidden || !this.ctx || this.ctx.state !== "running") return;
    const gen = this.generation.get(name) || 0;
    this.load(name).then((buffer) => {
      if (!buffer || buffer === "missing" || (this.generation.get(name) || 0) !== gen) return;
      const source = this.ctx.createBufferSource(),
        gain = this.ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = clamp(sound.base * 0.7 * volumeScale);
      source.connect(gain).connect(this.ctx.destination);
      const voice = { source, gain };
      let set = this.voices.get(name);
      if (!set) this.voices.set(name, (set = new Set()));
      set.add(voice);
      source.onended = () => set.delete(voice);
      source.start(0, offset, duration);
    });
  }
  playElement(name, volume, loop) {
    const a = this.element(name);
    a.volume = volume;
    a.loop = loop;
    a.currentTime = 0;
    a.play().catch(() => {});
  }
  isPlaying(rawName) {
    const name = alias(rawName);
    return (this.voices.get(name)?.size || 0) > 0 || (this.elements.get(name) && !this.elements.get(name).paused);
  }
  stop(rawName) {
    const names = rawName ? [alias(rawName)] : Object.keys(SOUNDS);
    for (const name of names) {
      this.generation.set(name, (this.generation.get(name) || 0) + 1);
      for (const voice of this.voices.get(name) || []) {
        try {
          voice.source.onended = null;
          voice.source.stop();
          voice.source.disconnect();
        } catch {}
      }
      this.voices.get(name)?.clear();
      const a = this.elements.get(name);
      if (a) {
        a.pause();
        a.currentTime = 0;
        a.loop = !!SOUNDS[name]?.loop;
      }
    }
  }
}
