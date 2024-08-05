import { NextResponse } from 'next/server';
import axios from 'axios';

const baseUrl = 'https://api.assemblyai.com/v2';

export async function POST(req) {
  try {
    const apiKey = req.headers.get('authorization');
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key no proporcionada' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio');
    const speakersExpected = formData.get('speakers_expected');
    const languageCode = formData.get('language_code');

    if (!audioFile) {
      return NextResponse.json({ error: 'Archivo de audio no proporcionado' }, { status: 400 });
    }

    const audioBuffer = await audioFile.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    const uploadResponse = await axios.post(`${baseUrl}/upload`, audioData, {
      headers: {
        authorization: apiKey,
        'content-type': 'application/octet-stream',
      },
    });
    const uploadUrl = uploadResponse.data.upload_url;

    const data = {
      audio_url: uploadUrl,
      language_code: languageCode,
      speaker_labels: true,
      speakers_expected: speakersExpected ? parseInt(speakersExpected) : null,
    };

    const transcriptResponse = await axios.post(`${baseUrl}/transcript`, data, {
      headers: { authorization: apiKey },
    });
    const transcriptId = transcriptResponse.data.id;

    let transcriptResult;
    while (true) {
      const pollingResponse = await axios.get(`${baseUrl}/transcript/${transcriptId}`, {
        headers: { authorization: apiKey },
      });
      transcriptResult = pollingResponse.data;

      if (transcriptResult.status === 'completed') {
        break;
      } else if (transcriptResult.status === 'error') {
        throw new Error(`Transcription failed: ${transcriptResult.error}`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    return NextResponse.json(transcriptResult);
  } catch (error) {
    console.error('Error al procesar la transcripción:', error);
    return NextResponse.json({ error: 'Error al procesar la transcripción' }, { status: 500 });
  }
}
