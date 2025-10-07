const url = 'https://api.vogent.ai/api/tts';
const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"text":"<string>","voiceId":"<string>","voiceOptionValues":[{"optionId":"<string>","value":"<string>"}],"format":{"outputType":"WAV_PCM16","sampleRate":24000}}'
};

export const vogentClient = async (text: string, voiceId: string, voiceOptionValues: { optionId: string, value: string }[], format: { outputType: string, sampleRate: number }) => {    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}