export const transcribeWithGroq = async (uri: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: "audio.wav",
        type: "audio/wav",
      } as any);
  
      formData.append("model", "whisper-large-v3");
      formData.append("language", "en");
  
      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer YOUR_GROQ_API_KEY_HERE`,
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
  
      const result = await response.json();
      return result.text;
    } catch (error) {
      console.error("Transcription error:", error);
      return "";
    }
  };
  