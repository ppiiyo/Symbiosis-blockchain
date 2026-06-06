# Архитектура фронтенда (Next.js) для «Play-to-Secure» в сети Symbiosis

Концепция **«Play-to-Secure»** призвана геймифицировать обеспечение безопасности L2-стейкинга. Обычные пользователи и мобильные верификаторы (whistleblowers) могут легко мониторить поведение валидаторов и в один клик отправлять транзакции наказания за лень («Lazy Slashing»), не беспокоясь о покупке нативного газа и сложностях Web3.

Данный документ описывает эталонную архитектуру фронтенда на базе **Next.js 14+ (App Router)** с интеграцией абстракции аккаунта для полностью бесшовного (Gasless) мобильного опыта.

---

## 1. Стек технологий фронтенда

* **Фреймворк:** `Next.js 14` (React 18/19, App Router, Server Actions).
* **Стилизация:** `Tailwind CSS v4` + `motion/react` для высокоскоростных интерфейсных анимаций.
* **Web3 библиотека:** `Wagmi v2` + `Viem v2` (стандарт взаимодействия с смарт-контрактами).
* **Провайдер кошельков:** `RainbowKit` (веб) или `ConnectKit` (адаптированный под мобильные браузеры).
* **Account Abstraction (ERC-4337):** `@bimy/sdk` или `ZeroDev Kernel` + `Etherspot` для спонсируемых транзакций (Paymaster).

---

## 2. Схема архитектуры взаимодействия

```
   ┌────────────────────────────────────────────────────────┐
   │                  Мобильный Клиент                      │
   │               (Next.js App Router)                     │
   └───────────┬───────────────────────────────▲────────────┘
               │                               │
               │ (1) Подключение кошелька      │ (4) UI-Оповещения
               │ (2) Кнопка "Report" (Gasless) │     и Анимация Наград
               ▼                               │
   ┌────────────────────────┐         ┌────────┴────────────┐
   │ ERC-4337 Smart Account │         │  L2 Testnet Node    │
   │   (Safe / Biconomy)    │         │ (Base/Arbitrum Sep) │
   └───────────┬────────────┘         └────────▲────────────┘
               │                               │
               │ (3) Передача UserOp           │ (3.1) Выполнение
               ▼                               │       транзакции
   ┌────────────────────────┐         ┌────────┴───────────┐
   │ P2P Bundler / Paymaster│────────►│  NashConsensus     │
   │  (Спонсирует транзакцию)│         │     Registry       │
   └────────────────────────┘         └────────────────────┘
```

---

## 3. Интеграция Кошелька и Web3 (Wagmi Configuration)

Файл конфигурации кошельков `src/lib/wagmi.ts` оптимизирован для L2 сетей Arbitrum Sepolia и Base Sepolia:

```typescript
import { http, createConfig } from 'wagmi';
import { baseSepolia, arbitrumSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'Symbiosis Play-to-Secure',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [baseSepolia, arbitrumSepolia],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
  },
  ssr: true, // Включение SSR оптимизации для Next.js
});
```

---

## 4. Спонсируемые транзакции (ERC-4337 Paymaster)

Для того чтобы пользователь мог нажать кнопку **«Report» (Пожаловаться)** без необходимости платить газ в ETH, мы интегрируем **Biconomy Account Abstraction** и **ERC-7677 Paymaster**.

Пример хука для отправки спонсируемого вызова `triggerLazySlashing`:

```typescript
import { useState } from 'react';
import { createSmartAccountClient } from '@biconomy/account';
import { ethers } from 'ethers';

// Адреса развернутых L2 контрактов
const NASH_CONSENSUS_ADDRESS = "0x..."; // Указывается после deploy.js

export function useGaslessWhistleblower() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportLazyNode = async (guiltyNodeAddress: string, userSigner: any) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Инициализация Смарт-аккаунта пользователя через Biconomy
      const biconomySmartAccount = await createSmartAccountClient({
        signer: userSigner,
        bundlerUrl: process.env.NEXT_PUBLIC_BUNDLER_URL!, // RPC бандлера
        biconomyPaymasterApiKey: process.env.NEXT_PUBLIC_PAYMASTER_API_KEY!,
      });

      const smartAccountAddress = await biconomySmartAccount.getAccountAddress();
      console.log("Smart Account Address:", smartAccountAddress);

      // 2. Создание транзакции (encoded ABI)
      const agreementInterface = new ethers.Interface([
        "function triggerLazySlashing(address guiltyNode, address whistleblower, uint256 blockNumber)"
      ]);
      
      const transactionData = agreementInterface.encodeFunctionData("triggerLazySlashing", [
        guiltyNodeAddress,
        smartAccountAddress, // Награда возвращается на защищенный смарт-аккаунт
        1337 // Номер блока в котором была "лень"
      ]);

      const tx = {
        to: NASH_CONSENSUS_ADDRESS,
        data: transactionData,
      };

      // 3. Отправка User Operation со спонсированием газа (Gasless)
      const userOpResponse = await biconomySmartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: "SPONSORED" },
      });

      const { transactionHash } = await userOpResponse.waitForTxHash();
      console.log("Gasless Transaction Succeeded! Hash:", transactionHash);
      return transactionHash;

    } catch (err: any) {
      console.error("Gasless fail:", err);
      setError(err.message || "Ошибка спонсирования транзакции");
    } finally {
      setLoading(false);
    }
  };

  return { reportLazyNode, loading, error };
}
```

---

## 5. Компонент кнопки “Report” и Интерактивные Анимации

Использование `@motion/react` для создания красивого отклика на клик, имитирующего "подтверждение радарного сканирования", и воспроизведение анимации салюта из монет при получении наград.

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Zap, Coins } from 'lucide-react';

interface ReportButtonProps {
  guiltyNodeName: string;
  guiltyNodeAddress: string;
  onReportSuccess: (txHash: string) => void;
}

export const ReportButton: React.FC<ReportButtonProps> = ({ 
  guiltyNodeName, 
  guiltyNodeAddress,
  onReportSuccess 
}) => {
  const [reporting, setReporting] = useState(false);
  const [showRewardPop, setShowRewardPop] = useState(false);

  const handlePress = async () => {
    setReporting(true);
    
    // Эмуляция/Вызов спонсируемой транзакции
    setTimeout(() => {
      setReporting(false);
      setShowRewardPop(true);
      onReportSuccess("0xbf55d9d7...b3a1a99");
      
      // Скрытие анимации наград через 4 секунды
      setTimeout(() => setShowRewardPop(false), 4000);
    }, 2000);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={handlePress}
        disabled={reporting}
        className={`w-full py-4 px-6 rounded-2xl font-sans font-semibold text-white flex items-center justify-center gap-3 transition-colors ${
          reporting 
            ? "bg-slate-700 cursor-not-allowed" 
            : "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-lg shadow-red-900/30"
        }`}
      >
        {reporting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Zap className="h-5 w-5 text-amber-400" />
            </motion.div>
            <span>Инициализация ZK-доказательства лени...</span>
          </>
        ) : (
          <>
            <ShieldAlert className="h-5 w-5 animate-pulse" />
            <span>Наказать {guiltyNodeName} (Gasless)</span>
          </>
        )}
      </motion.button>

      {/* Анимация падающих монет при успешном наказании ноды */}
      <AnimatePresence>
        {showRewardPop && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-32 left-0 right-0 mx-auto w-64 bg-slate-900 border border-amber-500/40 rounded-2xl p-4 text-center shadow-2xl z-50 pointer-events-none"
          >
            <div className="flex justify-center mb-1">
              <Coins className="h-8 w-8 text-amber-400 animate-bounce" />
            </div>
            <h4 className="font-sans font-bold text-amber-400">Успешное списание!</h4>
            <p className="font-mono text-xs text-slate-300 mt-1">Вы получили +15.00 SYM в виде награды за бдительность</p>
            
            {/* Генерация мини завихрений */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 50, x: Math.random() * 200 - 100, opacity: 1 }}
                  animate={{ y: -80, opacity: 0 }}
                  transition={{ duration: 1.5, delay: i * 0.2 }}
                  className="absolute bottom-0 text-amber-400 text-xs text-opacity-80 font-bold"
                >
                  ✨ +SYM
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

---

## 6. Финансовая теория игр: Мотивация пользователя

Фронтенд имеет наглядный экран «Теория игр», объясняющий пользователю его выгоду:
1. **Validator Incentives**: Валидаторам рационально подписывать честно, так как штраф (15%) существенно превышает возможную выгоду от экономии вычислительных ресурсов (0.1% в день).
2. **Whistleblower Incentives**: Пользователю выгодно держать запущенным фоновое мобильное приложение (Sentinel AI) в режиме «Play-to-Secure», так как при обнаружении нечестности, утилита автоматически отправит Gasless-транзакцию, и пользователь мгновенно получит **7.5% от срезанного стейка валидатора** абсолютно бесплатно.
3. **ZK-Shielding**: Обычные делегаторы могут дополнительно покупать ZK-страховку, которая защищает их собственный делегированный стейк в случае ошибки выбранного ими валидатора.

Этот трехсторонний консенсус делает экосистему Symbiosis саморегулирующейся и криптографически защищенной.
