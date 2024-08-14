'use client';
import { useState } from 'react';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState(null);
  const [utterances, setUtterances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [languageCode, setLanguageCode] = useState('es');
  const [speakersExpected, setSpeakersExpected] = useState(2);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleTranscription = async () => {
    if (!apiKey || !file) {
      setError('Por favor, proporciona la API Key y un archivo .mp3.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('language_code', languageCode);
      formData.append('speakers_expected', speakersExpected);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { authorization: apiKey },
        body: formData,
      });

      if (!response.ok) throw new Error('Error en la transcripción');

      const data = await response.json();
      setUtterances(data.utterances || []);
    } catch (error) {
      console.error('Error en la transcripción:', error);
      setError('Hubo un error al transcribir el archivo.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTranscript = (format) => {
    const content =
      format === 'json'
        ? JSON.stringify({ utterances }, null, 2)
        : utterances.map((u) => `Speaker ${u.speaker}: ${u.text}`).join('\n');
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-gray-800 p-6">
      <h1 className="text-5xl font-extrabold text-red-600 mb-8">Transcriptor de Entrevistas Hola Sandra</h1>

      <div className="w-full max-w-2xl mb-4 p-6 bg-white border border-gray-800 shadow-lg">
        <label htmlFor="api-key" className="block mb-2 text-lg font-semibold">API Key de Assembly AI:</label>
        <div className="flex items-center">
          <input
            type={showApiKey ? "text" : "password"}
            id="api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-3 border border-gray-800 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="ml-2 text-sm text-gray-500 hover:underline"
          >
            {showApiKey ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Puedes obtener tu API Key desde el{' '}
          <a
            href="https://www.assemblyai.co/app"
            className="text-red-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            dashboard de AssemblyAI
          </a>.
        </p>

        <label htmlFor="file-upload" className="block mt-4 mb-2 text-lg font-semibold">Subir archivo .mp3 o mp4:</label>
        <input
          type="file"
          id="file-upload"
          accept=".mp3,.mp4"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-3 border border-gray-800 focus:outline-none"
        />

        <label htmlFor="language-code" className="block mt-4 mb-2 text-lg font-semibold">Código del idioma:</label>
        <select
          id="language-code"
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
          className="w-full p-3 border border-gray-800 focus:outline-none"
        >
          <option value="en_us">Inglés (US)</option>
          <option value="es">Español</option>
        </select>

        <label htmlFor="speakers-expected" className="block mt-4 mb-2 text-lg font-semibold">Número de hablantes esperados:</label>
        <input
          type="number"
          id="speakers-expected"
          value={speakersExpected}
          onChange={(e) => setSpeakersExpected(e.target.value)}
          min="1"
          className="w-full p-3 border border-gray-800 focus:outline-none"
        />
        <button
          onClick={handleTranscription}
          className={`w-full mt-4 p-4 bg-red-600 text-white font-bold border border-gray-800 shadow-md hover:bg-red-700 transition-all ${loading ? 'cursor-not-allowed opacity-50' : ''
            }`}
          disabled={loading}
        >
          {loading ? 'Transcribiendo...' : 'Transcribir'}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}

      </div>


      {utterances.length > 0 && (
        <div className="w-full max-w-md mt-8 p-6 bg-white border border-gray-800 shadow-lg">
          <h3 className="mb-4 text-xl font-semibold">Transcripción:</h3>
          <div className="space-y-4">
            {utterances.map((utterance, index) => (
              <div
                key={index}
                className={`p-4 border-l-4 ${index % 2 === 0 ? 'bg-blue-50 border-blue-500' : 'bg-yellow-50 border-yellow-500'}`}
              >
                <p className="font-bold">Speaker {utterance.speaker}</p>
                <p>{utterance.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => downloadTranscript('txt')}
              className="p-2 bg-red-500 text-white border border-gray-800 shadow-md hover:bg-red-600 transition-all"
            >
              Descargar como .txt
            </button>
            <button
              onClick={() => downloadTranscript('json')}
              className="p-2 bg-red-500 text-white border border-gray-800 shadow-md hover:bg-red-600 transition-all"
            >
              Descargar como .json
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
