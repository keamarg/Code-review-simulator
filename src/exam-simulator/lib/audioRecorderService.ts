import { AudioRecorder } from "../../lib/audio-recorder";

/**
 * A singleton instance of the AudioRecorder to be shared across the application.
 * This prevents issues with component remounts creating multiple recorder instances,
 * ensuring that the microphone is properly managed and released.
 */
export const audioRecorderService = new AudioRecorder();
