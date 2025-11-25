/**
 * Audio Context utilities for managing Web Audio API contexts
 */

export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

const map: Map<string, AudioContext> = new Map();

/**
 * Get or create an AudioContext instance
 * Handles browser autoplay restrictions by waiting for user interaction
 * @param options AudioContext options including optional id for caching
 * @returns Promise resolving to an AudioContext instance
 */
export const audioContext: (options?: GetAudioContextOptions) => Promise<AudioContext> = (() => {
  const didInteract = new Promise((res) => {
    window.addEventListener("pointerdown", res, { once: true });
    window.addEventListener("keydown", res, { once: true });
  });

  return async (options?: GetAudioContextOptions) => {
    try {
      const a = new Audio();
      a.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      await a.play();
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx && ctx.state !== "closed") {
          // Verify the existing context has the same sample rate
          if (!options.sampleRate || ctx.sampleRate === options.sampleRate) {
            return ctx;
          }
          // If sample rate doesn't match, close the old one and create new
          try {
            await ctx.close();
          } catch (e) {
            // Ignore errors closing context
          }
          map.delete(options.id);
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    } catch (e) {
      await didInteract;
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx && ctx.state !== "closed") {
          // Verify the existing context has the same sample rate
          if (!options.sampleRate || ctx.sampleRate === options.sampleRate) {
            return ctx;
          }
          // If sample rate doesn't match, close the old one and create new
          try {
            await ctx.close();
          } catch (e) {
            // Ignore errors closing context
          }
          map.delete(options.id);
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    }
  };
})();


