import React from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  Smartphone, 
  Radio, 
  Sparkles, 
  Zap, 
  CheckCircle2,
  GitMerge,
  Layers,
  Milestone,
  HelpCircle
} from 'lucide-react';

export const SymbiosisRoadmap: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-1 max-w-7xl mx-auto">
      {/* Header Promo Section with Glassmorphism */}
      <div className="bg-gradient-to-br from-purple-950/20 via-[#0a0a0c] to-[#09090b] border border-purple-900/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-900/30 text-[10px] text-purple-400 font-mono tracking-wider uppercase">
              <Milestone className="w-3.5 h-3.5" /> Вектор Развития
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white font-sans tracking-tight">
              Инкубация и масштабирование системы Veritas
            </h2>
            <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Veritas — распределенный протокол выявления саботажа трансляции и обработки блоков с использованием Proof-of-Whistleblower. 
              Конечная цель нашей глобальной инициативы — превращение миллионов смартфонов в легкие проверяющие узлы для безопасности L2 сетей.
            </p>
          </div>
          
          <div className="flex flex-row md:flex-col gap-4 shrink-0 bg-zinc-950/50 p-4 rounded-xl border border-zinc-900">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Активная Фаза</div>
              <div className="text-sm font-bold text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                Phase 3: Тестнет & Whistleblower
              </div>
            </div>
            <div className="space-y-1 md:border-t md:border-zinc-900 md:pt-2">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Нод в сети</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">12,400+ активных пиров</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Roadmap Steps Showcase */}
      <div className="bg-[#09090b] border border-zinc-900 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Дорожная Карта Veritas (Symbiosis Roadmap)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              От концепта до децентрализованного релиза. Нажмите на этапы, чтобы изучить подробности архитектуры.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-[10.5px] font-mono text-zinc-400 uppercase shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400/50" /> Завершено
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" /> В процессе
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" /> В планах
            </span>
          </div>
        </div>

        {/* Timeline Sequence layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
          {/* Connector horizontal line on large screens */}
          <div className="hidden lg:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-zinc-900 z-0" />

          {/* Phase 1 */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col gap-3 relative z-10 hover:border-emerald-900/30 hover:bg-emerald-950/5 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/20">
                Завершено
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Q3 2025</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors group-hover:bg-emerald-500/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-mono text-zinc-400">Этап 01</h4>
                <h5 className="text-xs font-bold text-zinc-200">Veritas Core Design</h5>
              </div>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Проектирование экономических и игровых моделей выявления саботажа. Изобретение концепта "Red Herring" блоков, симулирующих дефекты для проверки бдительности валидаторов (Proof-of-Whistleblower).
            </p>
            
            <div className="border-t border-zinc-900 pt-3 mt-auto text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Спецификация RFC v1.0 готова</span>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col gap-3 relative z-10 hover:border-emerald-900/30 hover:bg-emerald-950/5 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/20">
                Завершено
              </span>
              <span className="text-[10px] font-mono text-zinc-500">Q1 2026</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors group-hover:bg-emerald-500/10">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-mono text-zinc-400">Этап 02</h4>
                <h5 className="text-xs font-bold text-zinc-200">Sepolia ZK Validation</h5>
              </div>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Разработка умных контрактов контроля стейка на Solidity. Интеграция с математическим ZK-Snark прувером для моментального сжатия подписей. Запуск автоматического механизма ончейн-слешинга.
            </p>
            
            <div className="border-t border-zinc-900 pt-3 mt-auto text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Контракты развернуты (Sepolia)</span>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="bg-gradient-to-b from-purple-950/10 to-zinc-950 border border-purple-900/40 rounded-xl p-5 flex flex-col gap-3 relative z-10 hover:border-purple-900/70 transition-all group shadow-lg shadow-purple-950/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/20 animate-pulse">
                В процессе
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Q2 2026</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-950/20 border border-purple-500/30 flex items-center justify-center text-purple-400 transition-colors group-hover:bg-purple-500/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-mono text-purple-400">Этап 03</h4>
                <h5 className="text-xs font-bold text-white">Whistleblower Simulator</h5>
              </div>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Запуск пилотной программы игрофикации крауд-проверок. Мобильные пользователи устанавливают легкие контейнеры (Light Node Client) в один клик и получают баунти за поимку фальшивых подписей.
            </p>
            
            <div className="border-t border-zinc-900/60 pt-3 mt-auto text-[10px] font-mono text-purple-400 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
              <span>Тестирование с баунти выплатами</span>
            </div>
          </div>

          {/* Phase 4 */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col gap-3 relative z-10 text-zinc-500 opacity-60 hover:opacity-100 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-800">
                В планах
              </span>
              <span className="text-[10px] font-mono text-zinc-600">Q4 2026</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900/30 border border-zinc-800 flex items-center justify-center text-zinc-500 transition-colors group-hover:bg-zinc-800/40">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-mono text-zinc-500">Этап 04</h4>
                <h5 className="text-xs font-bold text-zinc-400">Ethereum Mainnet Release</h5>
              </div>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              Полный децентрализованный релиз в основной сети Ethereum L2. Переход на децентрализованное ДАО управление параметрами детекции. Бесшовная интеграция с Arbitrum и Optimism стеками.
            </p>
            
            <div className="border-t border-zinc-900 pt-3 mt-auto text-[10px] font-mono text-zinc-600 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-zinc-600 shrink-0" />
              <span>Интеграция L2-коннекторов</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Specifications and FAQ panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <GitMerge className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase font-mono">Proof-of-Whistleblower</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Большинство протоколов страдают от "дилеммы верификатора": если споров и ошибок нет, верификаторы перестают проверять данные. 
            Veritas инжектирует контролируемые ошибки для мотивации и наград бдительных стражей.
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-purple-400">
            <Layers className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase font-mono">Абстракция мобильного узла</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Нода Veritas оптимизирована по потреблению трафика и батареи. Вместо полной загрузки блокчейна, она проверяет лишь случайные криптографические подписи, требуя не более 20MB трафика в месяц.
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-2 border-dashed border-zinc-800">
          <div className="flex items-center gap-2 text-zinc-450 text-amber-500">
            <HelpCircle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase font-mono text-zinc-300">Как поучаствовать?</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Перейдите во вкладку <span className="text-orange-400 font-bold">🎮 Ловушки (Tap Game)</span>, чтобы запустить симулятор мобильного легкого верификатора, улучшайте свою систему на баунти-награды и ловите саботажников.
          </p>
        </div>
      </div>
    </div>
  );
};
