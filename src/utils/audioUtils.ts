
export function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// Naive downsampling to 16kHz
export function downsampleTo16k(buffer: Float32Array, inputSampleRate: number): Int16Array {
    if (inputSampleRate === 16000) {
        const res = new Int16Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) res[i] = buffer[i] * 32768;
        return res;
    }

    const targetRate = 16000;
    const ratio = inputSampleRate / targetRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
        // Simple decimation/nearest neighbor for speed; normally loop filter is better but JS main thread is busy
        const offset = Math.floor(i * ratio);
        result[i] = buffer[offset] * 32768;
    }
    return result;
}

export function createPCM16kBlob(data: Float32Array, inputSampleRate: number): { data: string; mimeType: string } {
    const int16 = downsampleTo16k(data, inputSampleRate);
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}
