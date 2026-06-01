import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initializing server-side Gemini client with telemetric headers as instructed
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Fallback generators to keep the application 100% functional even if the user's API Key hits quota/rate limits
function generateLocalFallbackScript(idea: string) {
  const normIdea = idea.toLowerCase();
  
  if (normIdea.includes('cyber') || normIdea.includes('кибер') || normIdea.includes('неон') || normIdea.includes('neon') || normIdea.includes('будущ')) {
    return {
      name: 'Cyberpunk Odyssey',
      aspectRatio: '9:16',
      segments: [
        { mediaAsset: 'stock-cyberpunk', text: 'ДОБРО ПОЖАЛОВАТЬ', sticker: '⚡', duration: 4, filter: 'cyberpunk' },
        { mediaAsset: 'stock-synthwave', text: 'КЛК_СЕТЬ_01', sticker: '🚨', duration: 4, filter: 'vhs' },
        { mediaAsset: 'stock-space', text: 'НОВЫЙ ХОРИЗОНТ', sticker: '😎', duration: 4, filter: 'cool' }
      ]
    };
  }
  
  if (normIdea.includes('space') || normIdea.includes('космос') || normIdea.includes('звезд') || normIdea.includes('галак') || normIdea.includes('планет')) {
    return {
      name: 'Deep Galactic Voyage',
      aspectRatio: '16:9',
      segments: [
        { mediaAsset: 'stock-space', text: 'СТАРТ ЗВЕЗДОЛЕТА', sticker: '🚀', duration: 4, filter: 'cool' },
        { mediaAsset: 'stock-space', text: 'СКВОЗЬ ТУМАННОСТИ', sticker: '🌌', duration: 4, filter: 'noir' },
        { mediaAsset: 'stock-cyberpunk', text: 'НОВАЯ СИСТЕМА', sticker: '👽', duration: 4, filter: 'cyberpunk' }
      ]
    };
  }

  if (normIdea.includes('nature') || normIdea.includes('природ') || normIdea.includes('лес') || normIdea.includes('рек') || normIdea.includes('зеле') || normIdea.includes('дерев')) {
    return {
      name: 'Nature Serenity',
      aspectRatio: '16:9',
      segments: [
        { mediaAsset: 'stock-nature', text: 'ГЛУБИНА ЛЕСА', sticker: '🌲', duration: 4, filter: 'warm' },
        { mediaAsset: 'stock-nature', text: 'ЖИВАЯ РЕКА', sticker: '🍃', duration: 4, filter: 'vintage' },
        { mediaAsset: 'stock-lofi', text: 'ГАРМОНИЯ ПРИРОДЫ', sticker: '💧', duration: 4, filter: 'cool' }
      ]
    };
  }

  if (normIdea.includes('retro') || normIdea.includes('ретро') || normIdea.includes('synth') || normIdea.includes('вейв') || normIdea.includes('закат')) {
    return {
      name: 'Outrun Retro Grid',
      aspectRatio: '9:16',
      segments: [
        { mediaAsset: 'stock-synthwave', text: 'НОЧНОЙ ГОРОД', sticker: '🌅', duration: 4, filter: 'vhs' },
        { mediaAsset: 'stock-synthwave', text: 'СКОРОСТЬ ЗВУКА', sticker: '⚡', duration: 4, filter: 'cyberpunk' },
        { mediaAsset: 'stock-space', text: 'ВЕЧНЫЙ ДРАЙВ', sticker: '😎', duration: 4, filter: 'vintage' }
      ]
    };
  }

  if (normIdea.includes('lofi') || normIdea.includes('лофи') || normIdea.includes('кофе') || normIdea.includes('чай') || normIdea.includes('уют') || normIdea.includes('дожд')) {
    return {
      name: 'Cozy Lo-Fi Chill',
      aspectRatio: '16:9',
      segments: [
        { mediaAsset: 'stock-lofi', text: 'УЮТНЫЙ ДОЖДЬ', sticker: '🌧️', duration: 4, filter: 'warm' },
        { mediaAsset: 'stock-lofi', text: 'ГОРЯЧИЙ КОФЕ', sticker: '☕', duration: 4, filter: 'vintage' },
        { mediaAsset: 'stock-nature', text: 'ТИШИНА И ХОЛОД', sticker: '💭', duration: 4, filter: 'cool' }
      ]
    };
  }

  // General elegant fallback using extracted key words from the prompt
  const cleanIdea = idea.toUpperCase().replace(/[^A-ZА-ЯЁ0-9\s]/g, ' ').trim();
  const words = cleanIdea.split(/\s+/).filter(w => w.length > 2);
  const word1 = words[0] || 'НАЧАЛО';
  const word2 = words[1] || 'ДВИЖЕНИЕ';
  const word3 = words[2] || 'ФИНАЛ';

  return {
    name: idea.length > 30 ? idea.slice(0, 27) + '...' : idea,
    aspectRatio: '16:9' as const,
    segments: [
      { mediaAsset: 'stock-synthwave', text: word1, sticker: '⚡', duration: 4, filter: 'vintage' },
      { mediaAsset: 'stock-cyberpunk', text: word2, sticker: '🔥', duration: 4, filter: 'cyberpunk' },
      { mediaAsset: 'stock-space', text: word3, sticker: '✨', duration: 4, filter: 'noir' }
    ]
  };
}

function generateLocalFallbackCaptions(videoDescription: string) {
  const cleanDesc = videoDescription.toUpperCase().replace(/[^A-ZА-ЯЁ0-9\s]/g, ' ').trim();
  const words = cleanDesc.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length >= 4) {
    return [
      { text: `Готовы увидеть: ${words.slice(0, 2).join(' ')}?`, startTime: 0.5, duration: 2.5 },
      { text: `Погружаемся в ${words.slice(2, 4).join(' ')} прямо сейчас.`, startTime: 3.5, duration: 3.0 },
      { text: 'Это просто потрясающий вид!', startTime: 7.0, duration: 2.2 },
      { text: 'Смонтировано автоматически за секунду.', startTime: 9.5, duration: 2.5 }
    ];
  }
  
  return [
    { text: 'Всем привет! Начинаем наш эксперимент.', startTime: 0.5, duration: 2.5 },
    { text: `Пробуем воссоздать тему: ${videoDescription}`, startTime: 3.5, duration: 3.0 },
    { text: 'Результат получился действительно крутой.', startTime: 7.0, duration: 2.2 },
    { text: 'Автомонтаж проекта выполнен успешно!', startTime: 9.5, duration: 2.5 }
  ];
}

// API: Check status of AI Key
app.get('/api/ai-config', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({ active: hasKey });
});

// API 1: Generate timed subtitles based on prompt/transcript suggestion
app.post('/api/generate-captions', async (req, res) => {
  const { videoDescription, language = 'ru' } = req.body;
  
  try {
    const ai = getAIClient();
    
    if (!ai) {
      // Return high-quality pre-formatted simulation if key is not configured
      return res.json({
        success: true,
        mocked: true,
        captions: generateLocalFallbackCaptions(videoDescription)
      });
    }

    const languagePrompt = language === 'ru' 
      ? 'в формате на русском языке' 
      : 'in English language';

    const systemPrompt = `Вы — профессиональный субтитровщик видео. Создайте реалистичные timed-субтитры (максимум на 15 секунд общего хронометража) для видеоклипа: "${videoDescription}".
Верните JSON-массив объектов, каждый из которых представляет фразу с "text", "startTime" (в секундах) и "duration" (длительность фразы, в секундах).
Соблюдайте правила:
1. Сделайте субтитры яркими, лаконичными и вовлекающими, ${languagePrompt}.
2. Общий тайминг не должен превышать 12-14 секунд.
3. Каждая сцена должна начинаться после предыдущей, startTime должны увеличиваться. Длительность фразы от 1.5 до 3.5 секунд.
4. Выдавайте только чистый JSON согласно указанной схеме.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Создайте субтитры для следующей идеи видео: ${videoDescription}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: 'Текст субтитра' },
              startTime: { type: Type.NUMBER, description: 'Время начала показа на таймлайне (например, 1.2)' },
              duration: { type: Type.NUMBER, description: 'Продолжительность показа в секундах' }
            },
            required: ['text', 'startTime', 'duration']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    res.json({ success: true, mocked: false, captions: parsed });
  } catch (error: any) {
    console.warn('Gemini generate subtitles error, running local fallback logic:', error.message);
    res.json({
      success: true,
      mocked: true,
      errorInfo: error.message,
      captions: generateLocalFallbackCaptions(videoDescription)
    });
  }
});

// API 2: Build a full visual editor template design from prompt
app.post('/api/ai-scripts', async (req, res) => {
  const { idea, language = 'ru' } = req.body;
  
  try {
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        success: true,
        mocked: true,
        script: generateLocalFallbackScript(idea)
      });
    }

    const sysInstruction = `Вы — креативный режиссер видео в TikTok / Reels. Пользователь дает тему или идею: "${idea}".
Ваша задача — спроектировать проект монтажа видео (3 сцены общим хронометражем 12 секунд).
Сгенерируйте JSON объект с полями:
- "name": стильное название проекта (на русском)
- "aspectRatio": формат кадра (только "9:16" or "16:9")
- "segments": массив ровно из 3 сегментов. Каждый сегмент должен содержать:
    - "mediaAsset": один из следующих ID стоковых медиа: "stock-cyberpunk", "stock-nature", "stock-synthwave", "stock-space", "stock-lofi"
    - "text": яркий, кликабельный наложенный Текст (крупным шрифтом, капсом, например "ПРОРЫВ 2026", "НЕ ПРОПУСТИ")
    - "sticker": подходящее эмодзи-стикер (например "🔥", "✨", "💬", "😎", "👑", "🚨")
    - "duration": всегда ровно 4
    - "filter": один из фильтров: "cyberpunk", "vintage", "noir", "vhs", "warm", "cool"
    
Выводите исключительно чистый JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash', // Shift to gemini-3.5-flash as the fast, quota-friendly default
      contents: `Создай профессиональный клип из 3 сцен на тему: ${idea}`,
      config: {
        systemInstruction: sysInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            aspectRatio: { type: Type.STRING },
            segments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mediaAsset: { type: Type.STRING },
                  text: { type: Type.STRING },
                  sticker: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  filter: { type: Type.STRING }
                },
                required: ['mediaAsset', 'text', 'sticker', 'duration', 'filter']
              }
            }
          },
          required: ['name', 'aspectRatio', 'segments']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ success: true, mocked: false, script: parsed });
  } catch (error: any) {
    console.warn('Gemini script planner error, running local fallback logic:', error.message);
    res.json({
      success: true,
      mocked: true,
      errorInfo: error.message,
      script: generateLocalFallbackScript(idea)
    });
  }
});

// API 3: Text-To-Speech generation
app.post('/api/ai-tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(400).json({
        success: false,
        error: 'Для озвучивания текста (TTS) требуется указать действительный GEMINI_API_KEY в панели Secrets.'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `Произнеси выразительно и четко: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice as any }, // 'Kore' | 'Zephyr' | 'Puck' etc.
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ success: true, base64Audio });
    } else {
      res.status(500).json({ success: false, error: 'Модель не вернула звуковые данные.' });
    }
  } catch (error: any) {
    console.error('Gemini TTS error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite Development / Production Middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VibeCut Server booting up on http://localhost:${PORT}`);
  });
}

startServer();
