import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { SymbiosisSDK, parseSDKError, generateFalconKeypair } from './src/symbiosis-sdk/index';

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

// Import child_process node library for live compilation and deployments
import { exec, spawn } from 'child_process';

// Hardhat Node Process Management
let hardhatNodeProcess: any = null;
let hardhatNodeLogs: string[] = [];
const MAX_LOG_LINES = 1000;

function appendHardhatNodeLog(data: string) {
  const lines = data.split('\n');
  hardhatNodeLogs.push(...lines);
  if (hardhatNodeLogs.length > MAX_LOG_LINES) {
    hardhatNodeLogs = hardhatNodeLogs.slice(hardhatNodeLogs.length - MAX_LOG_LINES);
  }
}

// API 7: Check Hardhat local node status
app.get('/api/hardhat-node-status', (req, res) => {
  res.json({
    success: true,
    running: !!hardhatNodeProcess,
    logs: hardhatNodeLogs.join('\n')
  });
});

// API 8: Start Hardhat local node
app.post('/api/start-hardhat-node', (req, res) => {
  if (hardhatNodeProcess) {
    return res.json({
      success: true,
      message: 'Локальная нода Hardhat уже запущена.',
      running: true
    });
  }

  console.log('[NODE-MANAGER] Запускаем локальную ноду Hardhat...');
  hardhatNodeLogs = [];
  appendHardhatNodeLog('[INFO] Инициализация локальной ноды Hardhat через "npx hardhat node"...');

  try {
    hardhatNodeProcess = spawn('npx', ['hardhat', 'node']);

    hardhatNodeProcess.stdout.on('data', (data: any) => {
      const str = data.toString();
      appendHardhatNodeLog(str);
    });

    hardhatNodeProcess.stderr.on('data', (data: any) => {
      const str = data.toString();
      appendHardhatNodeLog(`[ERROR] ${str}`);
    });

    hardhatNodeProcess.on('close', (code: number) => {
      appendHardhatNodeLog(`\n[INFO] Локальная нода Hardhat завершила работу с кодом: ${code}`);
      hardhatNodeProcess = null;
    });

    // Wait a brief moment to let node start up and listen
    setTimeout(() => {
      res.json({
        success: true,
        message: 'Локальная нода Hardhat успешно инициализирована.',
        running: true
      });
    }, 1500);

  } catch (err: any) {
    console.error('Failed to spawn hardhat node:', err);
    appendHardhatNodeLog(`[FATAL ERROR] Не удалось запустить ноду: ${err.message}`);
    res.json({
      success: false,
      error: err.message,
      running: false
    });
  }
});

// API 9: Stop Hardhat local node
app.post('/api/stop-hardhat-node', (req, res) => {
  if (!hardhatNodeProcess) {
    return res.json({
      success: true,
      message: 'Локальная нода уже остановлена.',
      running: false
    });
  }

  console.log('[NODE-MANAGER] Останавливаем локальную ноду Hardhat...');
  try {
    hardhatNodeProcess.kill();
    hardhatNodeProcess = null;
    appendHardhatNodeLog('\n[INFO] Сигнал остановки отправлен. Нода остановлена пользователем.');
    res.json({
      success: true,
      message: 'Локальная нода остановлена.',
      running: false
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// API 4: Retreive environment setup for public Testnets safely
app.get('/api/testnet-config', (req, res) => {
  const privateKeySet = !!process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== '';
  const etherscanKeySet = !!process.env.ETHERSCAN_API_KEY && process.env.ETHERSCAN_API_KEY !== '';
  const sepoliaRpc = process.env.SEPOLIA_RPC_URL || 'https://rpc.ankr.com/eth_sepolia';
  const holeskyRpc = process.env.HOLESKY_RPC_URL || 'https://rpc.ankr.com/eth_holesky';
  
  res.json({
    success: true,
    privateKeySet,
    etherscanKeySet,
    sepoliaRpc: sepoliaRpc.replace(/:[^@/]+@/, ':***@'),
    holeskyRpc: holeskyRpc.replace(/:[^@/]+@/, ':***@'),
    hardhatNodeRunning: !!hardhatNodeProcess
  });
});

// API 5: Trigger npx hardhat run scripts/deploy.cjs with live network parameter
app.post('/api/deploy-testnet', (req, res) => {
  const { network } = req.body;
  if (network !== 'sepolia' && network !== 'holesky' && network !== 'localhost') {
    return res.status(400).json({ success: false, error: 'Invalid network selected' });
  }

  if (network === 'localhost') {
    console.log(`Executing deploy to local network: localhost`);
    exec(`npx hardhat run scripts/deploy.cjs --network localhost`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Deploy error on localhost: ${error.message}`);
        return res.json({
          success: false,
          error: error.message,
          logs: stdout + "\n" + stderr
        });
      }
      res.json({
        success: true,
        simulated: false,
        logs: stdout
      });
    });
    return;
  }

  const hasKey = !!process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY !== '';
  if (!hasKey) {
    // Elegant fallback simulation is returned if the user is in sandbox and has not loaded public keys
    return res.json({
      success: true,
      simulated: true,
      logs: `[DEMO SIMULATION] Инициирован демонстрационный деплой на публичную сеть: ${network}...
🚀 Начинаем развертывание Symbiosis Protocol на ${network}...
⏳ Подключение к RPC-провайдеру: ${network === 'sepolia' ? 'https://rpc.ankr.com/eth_sepolia' : 'https://rpc.ankr.com/eth_holesky'}... [Успешно]
⏳ Сборка смарт-контрактов через Hardhat solidity compiler (evmTarget: paris)...
Compiled 11 Solidity files successfully (evm target: paris).

✅ [1/4] Contract 'SymbiosisToken' успешно развернут!
   -> Адрес: 0x5fCb928B36Ec986E039aE99Fd3eCeCE87fD35cdE
   -> Хэш транзакции: 0x39a1fe18c1f3089d89ab56c1c9b36C186039aE99Fd3eD
   -> Использовано газа: 1,842,501 (Цена: 14 Gwei, Итого: 0.02579 ETH)

✅ [2/4] Contract 'LiquidStakingSsym' успешно развернут!
   -> Адрес: 0x7dEAc22239aE99Fdf96e3860399bd58fa996e343
   -> Хэш транзакции: 0x89ab1fe18c1f3089daef76123deac1109bc4cf6bc071d1e4
   -> Использовано газа: 1,452,190 (Цена: 14 Gwei, Итого: 0.02033 ETH)

✅ [3/4] Contract 'NashConsensusRegistry' успешно развернут!
   -> Адрес: 0x12Ca22239aE99Fdf96e3860399bd58fa996e3439e
   -> Хэш транзакции: 0xbbca957da48646aebd14ef17cf99d7d242ef56a11283d58f
   -> Использовано газа: 1,922,015 (Цена: 14 Gwei, Итого: 0.02691 ETH)

🔗 [4/4] Инициализация связей: Отправка DAO-предложения setConsensusRegistry...
   -> Транзакция подтверждена: 0xfa17ba95e0c655078dbb4c106972e399bd58fb96bc071d1e4e
   -> Создано DAO предложение с proposalId: 0 по внедрению Верховного суда NashConsensusRegistry!

📝 [СВОДКА TESTNET DEPLOY]:
   🚀 Общие затраты: 0.07303 ETH
   💎 Статус баланса: 100% готов к ончейн взаимодействию.

💡 [ВНИМАНИЕ]: Локальный приватный ключ DEPLOYER_PRIVATE_KEY пустой. Мы выполнили реалистичную эмуляцию на основе скомпилированного байткода. Укажите свой приватный ключ в Secrets, чтобы совершить реальный деплой на блокчейн!`
    });
  }

  console.log(`Executing deploy to public network: ${network}`);
  exec(`npx hardhat run scripts/deploy.cjs --network ${network}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Deploy error: ${error.message}`);
      return res.json({
        success: false,
        error: error.message,
        logs: stdout + "\n" + stderr
      });
    }
    res.json({
      success: true,
      simulated: false,
      logs: stdout
    });
  });
});

// API 6: Verification of contracts code on Etherscan
app.post('/api/verify-testnet', (req, res) => {
  const { network, tokenAddress, stakingAddress, consensusAddress } = req.body;
  if (!network || !tokenAddress || !stakingAddress || !consensusAddress) {
    return res.status(400).json({ success: false, error: 'Missing addresses or network parameter' });
  }

  const hasKey = !!process.env.ETHERSCAN_API_KEY && process.env.ETHERSCAN_API_KEY !== '';
  if (!hasKey) {
    return res.json({
      success: true,
      simulated: true,
      logs: `[DEMO SIMULATION] Запущена симулированная верификация контрактов на сети Etherscan (${network})...
⏳ Сбор файлов метаданных Hardhat и артефактов...
⏳ Отправка байткода SymbiosisToken по адресу ${tokenAddress}...
   -> Статус API: Успешно отправлен.
   -> [ВЕРИФИЦИРОВАНО] SymbiosisToken: https://${network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${tokenAddress}#code

⏳ Отправка байткода LiquidStakingSsym по адресу ${stakingAddress} (Конструктор: ${tokenAddress})...
   -> Статус API: Успешно отправлен.
   -> [ВЕРИФИЦИРОВАНО] LiquidStakingSsym: https://${network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${stakingAddress}#code

⏳ Отправка байткода NashConsensusRegistry по адресу ${consensusAddress} (Конструктор: ${tokenAddress})...
   -> Статус API: Успешно отправлен.
   -> [ВЕРИФИЦИРОВАНО] NashConsensusRegistry: https://${network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${consensusAddress}#code

🎉 Верификация всех 3 контрактов завершена на 100%!
💡 Укажите валидный ETHERSCAN_API_KEY в Secrets панели AI Studio для взаимодействия с настоящими серверами биллинга Etherscan.`
    });
  }

  console.log(`Starting real Etherscan code verification for network ${network}`);
  const cmdToken = `npx hardhat verify --network ${network} ${tokenAddress}`;
  const cmdStaking = `npx hardhat verify --network ${network} ${stakingAddress} "${tokenAddress}"`;
  const cmdConsensus = `npx hardhat verify --network ${network} ${consensusAddress} "${tokenAddress}"`;

  let logs = `[ADMIN CLI] Начинаем верификацию исходников на Etherscan для сети ${network}...\n`;

  exec(cmdToken, (err1, stdout1, stderr1) => {
    logs += `\n=== VERIFY SymbiosisToken ===\n${stdout1}\n${stderr1}\n`;
    if (err1) {
      logs += `❌ Ошибка верификации Token: ${err1.message}\n`;
    }

    exec(cmdStaking, (err2, stdout2, stderr2) => {
      logs += `\n=== VERIFY LiquidStakingSsym ===\n${stdout2}\n${stderr2}\n`;
      if (err2) {
        logs += `❌ Ошибка верификации Staking: ${err2.message}\n`;
      }

      exec(cmdConsensus, (err3, stdout3, stderr3) => {
        logs += `\n=== VERIFY NashConsensusRegistry ===\n${stdout3}\n${stderr3}\n`;
        if (err3) {
          logs += `❌ Ошибка верификации Consensus Registry: ${err3.message}\n`;
        }

        res.json({
          success: !err1 && !err2 && !err3,
          logs: logs
        });
      });
    });
  });
});

// Real-time Event Client stream registries for decentralized reactive updates
let sdkEventClients: any[] = [];

export function broadcastSDKEvent(type: string, data: any) {
  console.log(`[SDK SSE BROADCAST] event: ${type}`, data);
  sdkEventClients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    } catch (e) {
      console.error(`[SDK] Error broadcasting event to client:`, e);
    }
  });
}

app.get('/api/sdk-events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Avoid buffering in compression shields:
  res.flushHeaders();

  sdkEventClients.push(res);
  console.log(`[SDK SSE] Client subscribed. Total listeners: ${sdkEventClients.length}`);

  req.on('close', () => {
    sdkEventClients = sdkEventClients.filter(c => c !== res);
    console.log(`[SDK SSE] Client disconnected. Total listeners: ${sdkEventClients.length}`);
  });
});

// API 10: Execute symbiosis-sdk operations on Localhost Hardhat node or simulation fallback
app.post('/api/sdk-call', async (req, res) => {
  const { method, amount, shares, stake, falconPubKey, signerIndex, tokenAddress, stakingAddress, consensusAddress } = req.body;
  const idx = typeof signerIndex === 'number' ? signerIndex : 0;

  let executionLogs: string[] = [];
  executionLogs.push(`[SDK] Инициализация SymbiosisSDK с провайдером JsonRpcProvider...`);

  const config = {
    tokenAddress: tokenAddress || "0xF68a6e6401b41BeDb50f9b99A8022a4c7fc94675",
    stakingAddress: stakingAddress || "0xb136B71C5213a6367c6B78E22762159A0C7d9582",
    consensusAddress: consensusAddress || "0xcA37EB02242307735371fA07CA8970c114cF62bF"
  };

  if (!hardhatNodeProcess) {
    // Falls back to high-fidelity Simulation when node is not running
    executionLogs.push(`[SIMULATOR] Нода Hardhat выключена. Активирован локальный симулятор dApp.`);
    
    const simulatedTxHash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    
    if (method === "stake") {
      const amt = amount || "500";
      executionLogs.push(`[SDK] Считывание адреса кошелька... [Адрес: Account #${idx}]`);
      executionLogs.push(`[SDK] Проверка allowances для пула ликвидного стейкинга (${config.stakingAddress})...`);
      executionLogs.push(`[SDK] Текущий лимит одобрения: 0 SYM. Перерасход!`);
      executionLogs.push(`[SDK] [AUTO-APPROVE] Вызов approve(${config.stakingAddress}, ${amt} SYM) для подготовки...`);
      executionLogs.push(`[SDK] Транзакция одобрения подтверждена в блоке-эмуляции!`);
      executionLogs.push(`[SDK] Вызов stake(${amt} SYM) на контракте LiquidStakingSsym...`);
      executionLogs.push(`[SDK] Ожидание подтверждения транзакции в мемпуле...`);
      executionLogs.push(`[🎉 SDK SUCCESS] Стейкинг успешно завершен! Минтировано ${amt} sSYM.`);
      
      broadcastSDKEvent('Staked', {
        user: idx === 0 ? "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" : idx === 1 ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" : "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        amount: amt,
        sSymMinted: amt
      });
      
      return res.json({
        success: true,
        simulated: true,
        txHash: simulatedTxHash,
        logs: executionLogs.join('\n'),
        receipt: {
          to: config.stakingAddress,
          from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          gasUsed: "114251",
          blockNumber: "1428",
          status: 1
        }
      });
    } else if (method === "unstake") {
      const sh = shares || "250";
      executionLogs.push(`[SDK] Считывание адреса кошелька... [Адрес: Account #${idx}]`);
      executionLogs.push(`[SDK] Вызов unstake(${sh} sSYM shares) на контракте LiquidStakingSsym...`);
      executionLogs.push(`[SDK] Сжигание акций sSYM и возврат токенов SYM из пула...`);
      executionLogs.push(`[SDK] Ожидание подтверждения в блоке...`);
      executionLogs.push(`[🎉 SDK SUCCESS] Анстейкинг успешно подтвержден! Получено ${sh} SYM.`);
      
      broadcastSDKEvent('Unstaked', {
        user: idx === 0 ? "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" : idx === 1 ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" : "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        sSymBurned: sh,
        symReturned: sh
      });
      
      return res.json({
        success: true,
        simulated: true,
        txHash: simulatedTxHash,
        logs: executionLogs.join('\n'),
        receipt: {
          to: config.stakingAddress,
          from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          gasUsed: "92150",
          blockNumber: "1429",
          status: 1
        }
      });
    } else if (method === "registerValidator") {
      const stk = stake || "150";
      const key = falconPubKey || "0x46414c434f4e5055424b4559";
      executionLogs.push(`[SDK] Считывание адреса кошелька... [Адрес: Account #${idx}]`);
      executionLogs.push(`[SDK] Валидация параметров: Ставка ${stk} SYM (Минимум 100). Пройдено.`);
      executionLogs.push(`[SDK] Проверка allowances для ConsensusRegistry (${config.consensusAddress})...`);
      executionLogs.push(`[SDK] Текущий лимит: 0 SYM. Мало токенов одобрено!`);
      executionLogs.push(`[SDK] [AUTO-APPROVE] Вызов approve(${config.consensusAddress}, ${stk} SYM)...`);
      executionLogs.push(`[SDK] Транзакция одобрения подтверждена.`);
      executionLogs.push(`[SDK] Вызов registerValidator(${stk} SYM, Falcon Key) на NashConsensusRegistry...`);
      executionLogs.push(`[SDK] Ожидание сохранения Falcon-публичного ключа в стейт...`);
      executionLogs.push(`[🎉 SDK SUCCESS] Валидатор успешно зарегистрирован! Ставка принята.`);
      
      broadcastSDKEvent('ValidatorRegistered', {
        node: idx === 0 ? "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" : idx === 1 ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" : "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        initialStake: stk
      });
      
      return res.json({
        success: true,
        simulated: true,
        txHash: simulatedTxHash,
        logs: executionLogs.join('\n'),
        receipt: {
          to: config.consensusAddress,
          from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          gasUsed: "185340",
          blockNumber: "1430",
          status: 1
        }
      });
    } else if (method === "registerValidator") {
      const stk = stake || "150";
      const key = falconPubKey || "0x46414c434f4e5055424b4559";
      executionLogs.push(`[SDK] Считывание адреса кошелька... [Адрес: Account #${idx}]`);
      executionLogs.push(`[SDK] Валидация параметров: Ставка ${stk} SYM (Минимум 100). Пройдено.`);
      executionLogs.push(`[SDK] Проверка allowances для ConsensusRegistry (${config.consensusAddress})...`);
      executionLogs.push(`[SDK] Текущий лимит: 0 SYM. Мало токенов одобрено!`);
      executionLogs.push(`[SDK] [AUTO-APPROVE] Вызов approve(${config.consensusAddress}, ${stk} SYM)...`);
      executionLogs.push(`[SDK] Транзакция одобрения подтверждена.`);
      executionLogs.push(`[SDK] Вызов registerValidator(${stk} SYM, Falcon Key) на NashConsensusRegistry...`);
      executionLogs.push(`[SDK] Ожидание сохранения Falcon-публичного ключа в стейт...`);
      executionLogs.push(`[🎉 SDK SUCCESS] Валидатор успешно зарегистрирован! Ставка принята.`);
      
      broadcastSDKEvent('ValidatorRegistered', {
        node: idx === 0 ? "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" : idx === 1 ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" : "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        initialStake: stk
      });
      
      return res.json({
        success: true,
        simulated: true,
        txHash: simulatedTxHash,
        logs: executionLogs.join('\n'),
        receipt: {
          to: config.consensusAddress,
          from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          gasUsed: "185340",
          blockNumber: "1430",
          status: 1
        }
      });
    } else if (method === "slash") {
      const nodeAddress = req.body.node || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const slashReason = req.body.reason || "Double spend violation";
      executionLogs.push(`[SDK] Инициирован арбитражный протокол на NashConsensusRegistry...`);
      executionLogs.push(`[SDK] Проверка улик вредоносного действия для адреса ${nodeAddress}...`);
      executionLogs.push(`[SDK] Подтверждена сигнатура конфликтующего блока (Причина: ${slashReason})`);
      executionLogs.push(`[SDK] Вызов slashValidator(${nodeAddress}) на контракте NashConsensusRegistry...`);
      executionLogs.push(`[SDK] Срезано 15% стейка валидатора и заблокированы будущие награды.`);
      executionLogs.push(`[🎉 SDK SUCCESS] Валидатор успешно оштрафован (Slashed)!`);

      broadcastSDKEvent('NodeSlashed', {
        node: nodeAddress,
        slashedAmount: "15",
        reason: slashReason
      });

      return res.json({
        success: true,
        simulated: true,
        txHash: simulatedTxHash,
        logs: executionLogs.join('\n'),
        receipt: {
          to: config.consensusAddress,
          from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          gasUsed: "125430",
          blockNumber: "1431",
          status: 1
        }
      });
    } else {
      executionLogs.push(`[SDK] Запущен неопознанный метод '${method}' в симулированном режиме.`);
      return res.json({
        success: true,
        simulated: true,
        txHash: simulatedTxHash,
        logs: executionLogs.join('\n'),
        receipt: {
          to: config.consensusAddress,
          from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
          gasUsed: "50000",
          blockNumber: "1432",
          status: 1
        }
      });
    }
  }

  // If node is running, try to execute against real Localhost Node
  try {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Check if node is truly responsive
    await provider.getNetwork();
    
    const signers = await provider.listAccounts();
    if (signers.length === 0) {
      throw new Error("В локальной ноде Hardhat нет доступных тестовых аккаунтов.");
    }
    
    const accountIndex = idx < signers.length ? idx : 0;
    const signer = await provider.getSigner(accountIndex);
    const userAddress = await signer.getAddress();
    
    const sdk = new SymbiosisSDK(signer, config);
    executionLogs.push(`[SDK CONTEXT] Подключение к реальной ноде Hardhat успешно!`);
    executionLogs.push(`[SDK CONTEXT] Выбранный разработчиком аккаунт: ${userAddress}`);
    
    let txHash = "";
    let receipt: any = null;

    if (method === "stake") {
      const amt = amount || "500";
      const amtBig = ethers.parseEther(amt);
      
      executionLogs.push(`[SDK CALL] Запуск stakeSym(${amt} SYM)...`);
      executionLogs.push(`[SDK CALL] Проверка и авто-аппрув лимита SYM для ${config.stakingAddress}...`);
      
      const approveReceipt = await sdk.ensureAllowance(config.stakingAddress, amtBig);
      if (approveReceipt) {
        executionLogs.push(`[SDK LOG] Авто-аппрув выполнен! Хэш транзакции: ${approveReceipt.hash}`);
      } else {
        executionLogs.push(`[SDK LOG] Текущий лимит SYM достаточен. Аппрув не требуется.`);
      }
      
      executionLogs.push(`[SDK CALL] Запуск транзакции стейкинга stake(${amtBig.toString()} wei)...`);
      const rec = await sdk.stakeSym(amtBig);
      txHash = rec.hash;
      receipt = {
        to: rec.to,
        from: rec.from,
        gasUsed: rec.gasUsed.toString(),
        blockNumber: rec.blockNumber.toString(),
        status: rec.status
      };
      
      executionLogs.push(`[🎉 SDK REAL-SUCCESS] Транзакция подтверждена на блокчейне!`);
      executionLogs.push(`[SDK REAL] Новые sSYM токены успешно выпущены на кошельке!`);
      
      broadcastSDKEvent('Staked', {
        user: userAddress,
        amount: amt,
        sSymMinted: amt
      });
      
    } else if (method === "unstake") {
      const sh = shares || "250";
      const shBig = ethers.parseEther(sh);
      
      executionLogs.push(`[SDK CALL] Запуск unstakeSSym(${sh} sSYM)...`);
      executionLogs.push(`[SDK CALL] Запуск транзакции вывода unstake(${shBig.toString()} wei)...`);
      
      const rec = await sdk.unstakeSSym(shBig);
      txHash = rec.hash;
      receipt = {
        to: rec.to,
        from: rec.from,
        gasUsed: rec.gasUsed.toString(),
        blockNumber: rec.blockNumber.toString(),
        status: rec.status
      };
      
      executionLogs.push(`[🎉 SDK REAL-SUCCESS] Транзакция анстейкинга подтверждена на блокчейне!`);
      
      broadcastSDKEvent('Unstaked', {
        user: userAddress,
        sSymBurned: sh,
        symReturned: sh
      });
      
    } else if (method === "registerValidator") {
      const stk = stake || "150";
      const stkBig = ethers.parseEther(stk);
      const keyHex = falconPubKey || "0x46414c434f4e5055424b45595f53594d42494f5349535f50524f544f434f4c5f4c415a595f5349474e41545552455f564552494649434154494f4e5f534543555245";
      
      executionLogs.push(`[SDK CALL] Запуск registerValidator(${stk} SYM, Falcon Key)...`);
      executionLogs.push(`[SDK CALL] Проверка и авто-аппрув SYM токенов для ${config.consensusAddress}...`);
      
      const approveReceipt = await sdk.ensureAllowance(config.consensusAddress, stkBig);
      if (approveReceipt) {
        executionLogs.push(`[SDK LOG] Аппрув для реестра консенсуса подтвержден! Хэш: ${approveReceipt.hash}`);
      } else {
        executionLogs.push(`[SDK LOG] Предыдущий лимит SYM достаточен.`);
      }
      
      executionLogs.push(`[SDK CALL] Запуск транзакции регистрирования registerValidator(${stkBig.toString()} wei)...`);
      const rec = await sdk.registerValidator(stkBig, keyHex);
      txHash = rec.hash;
      receipt = {
        to: rec.to,
        from: rec.from,
        gasUsed: rec.gasUsed.toString(),
        blockNumber: rec.blockNumber.toString(),
        status: rec.status
      };
      
      executionLogs.push(`[🎉 SDK REAL-SUCCESS] Валидатор успешно зарегистрирован в реестре консенсуса Смарт-контракта!`);
      
      broadcastSDKEvent('ValidatorRegistered', {
        node: userAddress,
        initialStake: stk
      });
    }

    res.json({
      success: true,
      simulated: false,
      txHash,
      logs: executionLogs.join('\n'),
      receipt
    });

  } catch (err: any) {
    console.error("SDK Call Error:", err);
    
    // Check if the reason is that mock contracts aren't deployed on localhost
    let errMsg = parseSDKError(err);
    if (errMsg.includes("ECONNREFUSED") || errMsg.includes("connect ECONNREFUSED") || errMsg.includes("could not coalesce error")) {
      errMsg = "Локальная сеть Hardhat на порту 8545 недоступна или выключена. Перейдите на вкладку 'Sepolia On-Chain Портал' для запуска локальной ноды или используйте автоматический симулятор (выключив ноду).";
    } else if (errMsg.includes("contract not found") || errMsg.includes("call revert") || errMsg.includes("revert") || errMsg.includes("revert reason")) {
      errMsg = `${errMsg}. (ПРИМЕЧАНИЕ: Если контракты еще не были развернуты, пожалуйста, зайдите во вкладку 'Этап 6' и запустите 'Деплой на localhost'!)`;
    }
    
    res.json({
      success: false,
      error: errMsg,
      logs: [...executionLogs, `\n❌ [SDK FATAL ERROR] Ошибка выполнения: ${errMsg}`].join('\n')
    });
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
