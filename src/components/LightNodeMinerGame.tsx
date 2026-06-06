import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Smartphone, 
  ShieldCheck, 
  ShieldAlert, 
  Flame, 
  Coins, 
  TrendingUp, 
  Users, 
  Cpu, 
  Radio, 
  Sparkles, 
  Award,
  AlertOctagon,
  Play,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Volume2,
  VolumeX,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LightNodeMinerGameProps {
  userBalance: number;
  onChangeUserBalance: (bal: number) => void;
  addLog: (msg: string) => void;
  nodes: any[];
}

interface MiningBlock {
  height: number;
  hash: string;
  type: 'valid' | 'herring';
  assignedValidator: string;
  signature: string;
  tapProgress: number; // 0 to 100
  requiredTaps: number;
  reputationMultiplier: number;
}

interface UpgradeItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  bonusText: string;
}

interface TapDrift {
  id: string;
  x: number;
  y: number;
  value: string;
  color: string;
}

export const LightNodeMinerGame: React.FC<LightNodeMinerGameProps> = ({
  userBalance,
  onChangeUserBalance,
  addLog,
  nodes
}) => {
  // Main state
  const [energy, setEnergy] = useState<number>(100);
  const [maxEnergy, setMaxEnergy] = useState<number>(100);
  const [energyRechargeRate, setEnergyRechargeRate] = useState<number>(2.5); // per second
  const [level, setLevel] = useState<number>(1);
  const [xp, setXp] = useState<number>(0);
  const [xpToNextLevel, setXpToNextLevel] = useState<number>(150);
  const [totalMinedBlocks, setTotalMinedBlocks] = useState<number>(0);
  const [herringsReported, setHerringsReported] = useState<number>(0);
  const [cumulativeBountyEarned, setCumulativeBountyEarned] = useState<number>(0);
  
  // Game state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentBlock, setCurrentBlock] = useState<MiningBlock | null>(null);
  const [blocksScannedCount, setBlocksScannedCount] = useState<number>(0);
  const [scanHistory, setScanHistory] = useState<Array<{height: number; type: 'valid' | 'herring'; hash: string; status: 'verified' | 'slashed' | 'failed'}>>([]);
  const [recentClaims, setRecentClaims] = useState<string[]>([]);
  const [tapDrifts, setTapDrifts] = useState<TapDrift[]>([]);
  
  // Audio synthesizer via web audio api
  const playSynthesizedSound = (type: 'tap' | 'upgrade' | 'herring_warning' | 'bounty_claim' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'tap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.002, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'upgrade') {
        const now = ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.04, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.12);
        });
      } else if (type === 'herring_warning') {
        const now = ctx.currentTime;
        const oscNode = ctx.createOscillator();
        const oscLfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const gain = ctx.createGain();
        
        oscNode.type = 'sawtooth';
        oscNode.frequency.value = 180;
        
        oscLfo.type = 'sine';
        oscLfo.frequency.value = 12; // vibrato
        lfoGain.gain.value = 50;
        
        oscLfo.connect(lfoGain);
        lfoGain.connect(oscNode.frequency);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        
        oscNode.connect(gain);
        gain.connect(ctx.destination);
        
        oscNode.start();
        oscLfo.start();
        oscNode.stop(now + 0.45);
        oscLfo.stop(now + 0.45);
      } else if (type === 'bounty_claim') {
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.05, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.05 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.25);
        });
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(105, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      // Chrome/Safari sound gesture policy block catch
    }
  };

  // Tech Tree Upgrades Store
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    {
      id: 'quantum-scan',
      title: 'Falcon Core Optimizer',
      description: 'Increases light-node verification power. Your manual taps process more hashes per click.',
      cost: 400,
      level: 1,
      maxLevel: 10,
      bonusText: '+1.5 SYM/tap, +2 XP/tap'
    },
    {
      id: 'graphene-battery',
      title: 'Graphene Batteries',
      description: 'Upgrades maximum battery cells. Store more scanner power to verify continuous block streams.',
      cost: 650,
      level: 1,
      maxLevel: 8,
      bonusText: '+30 Max Energy & +1.5 regen/sec'
    },
    {
      id: 'radar',
      title: 'Red-Herring Radar',
      description: 'Embeds AI telemetry filters. Passive scan parser finds trap structures automatically.',
      cost: 1100,
      level: 0,
      maxLevel: 5,
      bonusText: '+1.2 passive SYM/sec & warning flashes'
    },
    {
      id: 'zk-prover-compress',
      title: 'Succinct Proof Engine',
      description: 'Zk-SNARK proof compressor. Halves the required proof efforts, reducing taps required to verify.',
      cost: 2000,
      level: 1,
      maxLevel: 4,
      bonusText: '-15% Tap Effort per block verification'
    }
  ]);

  // Leaderboard statistics - simulated other participants
  const [leaderboard, setLeaderboard] = useState([
    { name: 'SatoshiMobile', points: 19800, rank: 1, active: true },
    { name: 'SolanaRebel', points: 14200, rank: 2, active: false },
    { name: 'GasHunter_601', points: 8750, rank: 3, active: true },
    { name: 'FalconStaker', points: 4200, rank: 4, active: true },
    { name: 'You (LightNode #915)', points: 450, rank: 5, active: true },
    { name: 'Vitalik_Fan', points: 310, rank: 6, active: false },
  ]);

  // Refs to avoid stale state and illegal setState render updates in passive loop
  const currentBlockRef = useRef<MiningBlock | null>(null);
  const upgradesRef = useRef<UpgradeItem[]>([]);
  const userBalanceRef = useRef<number>(userBalance);
  const levelRef = useRef<number>(level);
  const xpRef = useRef<number>(xp);
  const xpToNextLevelRef = useRef<number>(xpToNextLevel);

  useEffect(() => {
    currentBlockRef.current = currentBlock;
  }, [currentBlock]);

  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);

  useEffect(() => {
    userBalanceRef.current = userBalance;
  }, [userBalance]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);

  useEffect(() => {
    xpToNextLevelRef.current = xpToNextLevel;
  }, [xpToNextLevel]);

  // 1. Initialise the first block on mount
  const generateNewMiningBlock = (heightOffset: number = 1, customBlock?: MiningBlock | null): MiningBlock => {
    const baseBlock = customBlock !== undefined ? customBlock : currentBlockRef.current;
    const freshHeight = baseBlock ? baseBlock.height + 1 : 12410 + heightOffset;
    
    // 25% chance of spawning a Red Herring block
    const isHerring = Math.random() < 0.28;
    const typeSelected = isHerring ? 'herring' : 'valid';
    
    // Choose validator assigned based on live list
    const candidateValidators = nodes.length > 0 ? nodes : [{ name: 'LazyValidator #04' }, { name: 'SlothPool' }, { name: 'GigaStaker' }];
    const assigned = candidateValidators[Math.floor(Math.random() * candidateValidators.length)].name;
    
    // Generate signature payload
    const hashHex = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const signatureHex = '0x' + Array.from({length: 128}, () => Math.floor(Math.random()*16).toString(16)).join('');

    const baseRequiredTaps = 8 + Math.floor(Math.random() * 6);
    const ZkUpgrade = upgradesRef.current.find(u => u.id === 'zk-prover-compress');
    const factor = ZkUpgrade ? 1 - (ZkUpgrade.level - 1) * 0.15 : 1;
    const finalRequiredTaps = Math.max(3, Math.round(baseRequiredTaps * factor));

    if (isHerring) {
      playSynthesizedSound('herring_warning');
    }

    return {
      height: freshHeight,
      hash: hashHex,
      type: typeSelected,
      assignedValidator: assigned,
      signature: signatureHex,
      tapProgress: 0,
      requiredTaps: finalRequiredTaps,
      reputationMultiplier: typeSelected === 'herring' ? 2.5 : 1.0
    };
  };

  // Setup initial block
  useEffect(() => {
    if (!currentBlockRef.current) {
      setCurrentBlock(generateNewMiningBlock(1));
    }
  }, []);

  // Handle standard block completion inside loop to prevent state race condition
  const handleSuccessfulScan = (block: MiningBlock) => {
    const currentLev = levelRef.current;
    const scanGold = 1.8 + currentLev * 0.8;
    const gainedXp = 30;
    
    onChangeUserBalance(userBalanceRef.current + scanGold);
    setTotalMinedBlocks(prev => prev + 1);
    setBlocksScannedCount(prev => prev + 1);
    
    // Add to logs
    addLog(`🔍 Мобильный валидатор завершил сканирование блока #${block.height}. Сигнатура проверена: OK. Получено +${scanGold.toFixed(1)} SYM.`);
    
    // History
    setScanHistory(prev => [
      { height: block.height, type: 'valid', hash: block.hash, status: 'verified' },
      ...prev.slice(0, 7)
    ]);

    // Handle XP levelling
    const currentXp = xpRef.current;
    const currentLimit = xpToNextLevelRef.current;
    const nextXp = currentXp + gainedXp;

    if (nextXp >= currentLimit) {
      setXp(nextXp - currentLimit);
      setLevel(currentLev + 1);
      setXpToNextLevel(Math.round(currentLimit * 1.35));
      addLog(`📈 УРОВЕНЬ ПОВЫШЕН! Ваш Мобильный Клиент получил уровень ${currentLev + 1}! Разблокированы новые лимиты хеширования.`);
      playSynthesizedSound('upgrade');
    } else {
      setXp(nextXp);
    }
  };

  // 2. Passive battery/energy regeneration loop
  useEffect(() => {
    const timer = setInterval(() => {
      const currentUpgrades = upgradesRef.current;
      const currentBlockValue = currentBlockRef.current;
      const currentUserBalance = userBalanceRef.current;

      // Calculate current battery regeneration rate based on Graphene Battery Upgrade
      const batteryUpgrade = currentUpgrades.find(u => u.id === 'graphene-battery');
      const baseRegen = 2.0;
      const additionalRegen = batteryUpgrade ? (batteryUpgrade.level - 1) * 1.5 : 0;
      const currentRegen = baseRegen + additionalRegen;
      
      const limitUpgrade = batteryUpgrade ? 100 + (batteryUpgrade.level - 1) * 30 : 100;
      setMaxEnergy(limitUpgrade);
      setEnergy(prev => {
        const next = prev + currentRegen * 0.5; // Runs every 500ms
        return Math.min(limitUpgrade, next);
      });
      
      // Radar Passive Income accumulation
      const radarUpgrade = currentUpgrades.find(u => u.id === 'radar');
      if (radarUpgrade && radarUpgrade.level > 0) {
        const rewardPerSec = radarUpgrade.level * 1.2 * 0.5; // Every 500ms
        onChangeUserBalance(currentUserBalance + rewardPerSec);
        
        // Randomly passive-progress blocks
        if (currentBlockValue) {
          if (currentBlockValue.type === 'valid') {
            const nextProgress = currentBlockValue.tapProgress + (radarUpgrade.level * 3);
            if (nextProgress >= 100) {
              // Automatically complete scanning the standard safe block!
              handleSuccessfulScan(currentBlockValue);
              setCurrentBlock(generateNewMiningBlock(1, currentBlockValue));
            } else {
              setCurrentBlock({ ...currentBlockValue, tapProgress: nextProgress });
            }
          }
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [onChangeUserBalance, addLog]);

  // Master click trigger on the Quantum Core Button
  const handleCoreTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!currentBlock) return;
    
    if (energy < 1) {
      playSynthesizedSound('error');
      addLog('⚠️ НИЗКИЙ ЗАРЯД БАТАРЕИ! Мобильный узел временно остановил вычисления для остывания ЦП.');
      return;
    }

    // Spawn floating tap animation drift
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Upgrades modifiers
    const corePowerUpgrade = upgrades.find(u => u.id === 'quantum-scan');
    const tapPowerValue = corePowerUpgrade ? 1.0 + (corePowerUpgrade.level - 1) * 1.5 : 1.0;
    const xpBonus = corePowerUpgrade ? 5 + (corePowerUpgrade.level - 1) * 2 : 5;

    // Deduct raw energy
    setEnergy(prev => Math.max(0, prev - 1));
    playSynthesizedSound('tap');

    // Update block scanner progress
    const totalNewProgress = currentBlock.tapProgress + (100 / currentBlock.requiredTaps);
    
    // Spawn floaters
    const driftId = Math.random().toString(36).substring(3, 9);
    const newDrift: TapDrift = {
      id: driftId,
      x: clickX,
      y: clickY,
      value: `+${tapPowerValue.toFixed(1)} SYM`,
      color: currentBlock.type === 'herring' ? 'text-orange-400' : 'text-purple-400'
    };
    setTapDrifts(prev => [...prev, newDrift]);
    setTimeout(() => {
      setTapDrifts(prev => prev.filter(d => d.id !== driftId));
    }, 1000);

    // Sync rewards to global balance
    onChangeUserBalance(userBalance + tapPowerValue);

    if (totalNewProgress >= 100) {
      // If we finished tapping a standard valid block
      if (currentBlock.type === 'valid') {
        handleAddXp(xpBonus + 25);
        setTotalMinedBlocks(prev => prev + 1);
        setBlocksScannedCount(prev => prev + 1);
        
        setScanHistory(prev => [
          { height: currentBlock.height, type: 'valid', hash: currentBlock.hash, status: 'verified' },
          ...prev.slice(0, 9)
        ]);
        
        addLog(`✅ Блок #${currentBlock.height} проверен! Подтверждены транзакции: x${15 + Math.floor(Math.random() * 20)}.`);
        setCurrentBlock(generateNewMiningBlock());
      } else {
        // Red Herring block scanned blindly without reporting! Oh no! A missed alert!
        handleAddXp(5);
        setScanHistory(prev => [
          { height: currentBlock.height, type: 'herring', hash: currentBlock.hash, status: 'failed' },
          ...prev.slice(0, 9)
        ]);
        addLog(`⚠️ УПУЩЕН РЕД-ХЕРРИНГ! Вы проигнорировали поддельный блок #${currentBlock.height}. Ленивый валидатор ${currentBlock.assignedValidator} избежал разоблачения.`);
        playSynthesizedSound('error');
        setCurrentBlock(generateNewMiningBlock());
      }
    } else {
      // Just step update progress
      setCurrentBlock(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tapProgress: totalNewProgress
        };
      });
    }

    // Dynamic leaderboard points increase
    setLeaderboard(prev => {
      return prev.map(p => {
        if (p.name.includes('You')) {
          return { ...p, points: p.points + Math.round(tapPowerValue * 2) };
        }
        // AI opponents increment points too
        if (Math.random() < 0.15) {
          return { ...p, points: p.points + Math.round(Math.random() * 10 + 2) };
        }
        return p;
      }).sort((a, b) => b.points - a.points).map((item, idx) => ({ ...item, rank: idx + 1 }));
    });
  };

  // Action: User spotted the trap and clicked the massive Alert Button!
  const handleReportHerring = () => {
    if (!currentBlock) return;

    if (currentBlock.type !== 'herring') {
      // False report penalty
      playSynthesizedSound('error');
      setEnergy(prev => Math.max(0, prev - 30)); // Large battery drain from fake report
      addLog(`❌ ЛОЖНЫЙ ДОНОС! Блок #${currentBlock.height} абсолютно легитимен. Процессор перегружен из-за повторных вычислений (-30 батареи).`);
      return;
    }

    // Successful bounty claim!
    const bountyPayout = 7.5; // As per the architecture rule (7.5 SYM reward for catching the red-herring block)
    const bonusXp = 120;
    
    onChangeUserBalance(userBalance + bountyPayout);
    setHerringsReported(prev => prev + 1);
    setCumulativeBountyEarned(prev => prev + bountyPayout);
    
    // Register latest claims inside dynamic marquee notification
    const claimHeadline = `LightNode #${Math.floor(100 + Math.random()*899)} срезал валидатора ${currentBlock.assignedValidator} на блоке #${currentBlock.height}! Будет начислено: +7.5 SYM!`;
    setRecentClaims(prev => [claimHeadline, ...prev.slice(0, 3)]);
    
    // Add real system logging for audits
    addLog(`🚨 РАЗОБЛАЧЕНИЕ ЛЕНИВОГО ВАЛИДАТОРА! Мобильный узел доказал факт слепой подписи блога #${currentBlock.height} валидатором ${currentBlock.assignedValidator}. Награда доносчику: +${bountyPayout} SYM! Делегированный стеллаж валидатора урезан на 30%.`);
    playSynthesizedSound('bounty_claim');

    // Sync to scanner history
    setScanHistory(prev => [
      { height: currentBlock.height, type: 'herring', hash: currentBlock.hash, status: 'slashed' },
      ...prev.slice(0, 9)
    ]);

    // Handle high level booster XP
    handleAddXp(bonusXp);

    // Refresh block immediately
    setCurrentBlock(generateNewMiningBlock());

    // Instant boost in rankings
    setLeaderboard(prev => {
      return prev.map(p => {
        if (p.name.includes('You')) {
          return { ...p, points: p.points + 250 };
        }
        return p;
      }).sort((a, b) => b.points - a.points).map((item, idx) => ({ ...item, rank: idx + 1 }));
    });
  };

  const handleAddXp = (amount: number) => {
    const currentXp = xpRef.current;
    const currentLevel = levelRef.current;
    const currentLimit = xpToNextLevelRef.current;
    const nextVal = currentXp + amount;

    if (nextVal >= currentLimit) {
      setXp(nextVal - currentLimit);
      setLevel(currentLevel + 1);
      setXpToNextLevel(Math.round(currentLimit * 1.35));
      playSynthesizedSound('upgrade');
    } else {
      setXp(nextVal);
    }
  };

  // Handle purchasing an upgrade
  const buyUpgrade = (upgradeId: string) => {
    const item = upgrades.find(u => u.id === upgradeId);
    if (!item) return;

    if (userBalance < item.cost) {
      playSynthesizedSound('error');
      addLog(`❌ Недостаточно средств: Требуется ${item.cost} SYM для покупки '${item.title}' (у вас ${userBalance.toFixed(1)} SYM).`);
      return;
    }

    if (item.level >= item.maxLevel) {
      playSynthesizedSound('error');
      addLog(`✨ Апгрейд '${item.title}' уже развит до максимального значения!`);
      return;
    }

    // Deduct cost and level upgrade
    onChangeUserBalance(userBalance - item.cost);
    playSynthesizedSound('upgrade');
    
    setUpgrades(prev => prev.map(u => {
      if (u.id === upgradeId) {
        return {
          ...u,
          level: u.level + 1,
          cost: Math.round(u.cost * 1.7)
        };
      }
      return u;
    }));

    addLog(`🚀 Увеличен уровень апгрейда: '${item.title}' теперь на уровне ${item.level + 1}.`);
  };

  return (
    <div className="grid grid-cols-12 gap-5 p-1 bg-black text-white" id="lightnode-tapper-dashboard">
      
      {/* 1. Header Banner & Marquee Notifications */}
      <div className="col-span-12 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-600/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-widest">
                Red-Herring Miner Game (Мобильный Пул)
              </h2>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500 text-black font-mono animate-bounce">
                TAP-TO-EARN
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl">
              Зарабатывайте <strong className="text-orange-400 font-mono">7.5 SYM</strong> за каждую обнаруженную ловушку! Миллионы телефонов по всему миру сканируют блоквесы, образуя нерушимый противосаботажный барьер.
            </p>
          </div>
        </div>

        {/* Global balance widget */}
        <div className="flex items-center gap-2 bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2 font-mono shrink-0">
          <Coins className="text-purple-400 w-4 h-4" />
          <span className="text-xs text-zinc-400">Ваш счет:</span>
          <span className="text-sm font-bold text-purple-400">{userBalance.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} SYM</span>
        </div>
      </div>

      {/* 2. Left Column: Smartphone Simulated Device & Console Scan Engine */}
      <div className="col-span-12 lg:col-span-7 flex flex-col items-center gap-4">
        
        {/* Device wrapper simulating a sleek modern smartphone bezel */}
        <div className="w-full max-w-[420px] bg-[#0c0c0e] rounded-[48px] border-8 border-zinc-800 p-5 shadow-2x shadow-purple-950/20 relative flex flex-col gap-4 overflow-hidden select-none">
          
          {/* Smartphone Speaker Grid & Camera Notch Cutout */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-30 flex items-start justify-center">
            <span className="w-10 h-1 bg-black rounded-full mt-1"></span>
          </div>

          {/* Smartphone Status Bar Barometer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-2 pt-2.5">
            <div className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Mesh Net 5G</span>
            </div>
            <div className="flex items-center gap-1.5" id="sound-control-node">
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className="hover:text-purple-400 text-zinc-500 transition-colors p-1"
                title={soundEnabled ? "Выключить звук" : "Включить звук"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-650" />}
              </button>
              <span>V4.1-FALCON</span>
            </div>
          </div>

          {/* Simulated Level Bar */}
          <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-950/30 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold font-mono">
                L{level}
              </div>
              <div className="flex-1">
                <span className="text-[10px] uppercase font-mono text-zinc-400">Прогресс Клиента</span>
                <div className="w-36 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300" 
                    style={{ width: `${(xp / xpToNextLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-[9px] text-zinc-500">
              <span className="text-zinc-200 text-xs font-bold block">{xp} UX</span>
              <span>limit: {xpToNextLevel}</span>
            </div>
          </div>

          {/* Active Block Scanning Status Header Card */}
          {currentBlock && (
            <div className={`rounded-2xl p-3 border font-mono transition-all duration-300 ${
              currentBlock.type === 'herring'
                ? 'bg-red-950/20 border-red-900/50 text-red-100 shadow-md shadow-red-950/30'
                : 'bg-indigo-950/10 border-indigo-950 text-indigo-100'
            }`}>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-2">
                <span className="text-[10px] uppercase tracking-wide text-zinc-400 flex items-center gap-1.5">
                  {currentBlock.type === 'herring' ? (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 bg-purple-500 rounded-full"></span>
                  )}
                  Блок {currentBlock.height} в Сканере
                </span>
                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                  currentBlock.type === 'herring' ? 'bg-red-950 text-red-400 border border-red-900/30' : 'bg-zinc-950 text-purple-400 border border-zinc-900'
                }`}>
                  {currentBlock.type === 'herring' ? '☢️ Red Herring Trap' : '🛡️ Standard Safe'}
                </span>
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-zinc-550">Хэш:</span>
                  <span className="text-zinc-400 select-all">{currentBlock.hash.substring(0, 18)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-550">Провайдер:</span>
                  <span className="text-zinc-300 font-bold">{currentBlock.assignedValidator}</span>
                </div>
                {currentBlock.type === 'herring' && (
                  <div className="text-[9.5px] mt-1 bg-red-950/40 p-1.5 border border-red-900/20 rounded flex items-center gap-1.5 text-red-400 animate-pulse">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                    <span>Внимание: Обнаружены поврежденные пруфы Falcon-512! Не завершайте сканирование слепо!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Smartphone Central Quantum Scan Portal (The Main Clicker Reactor) */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 min-h-[200px] relative">
            <AnimatePresence>
              {tapDrifts.map(drift => (
                <motion.div
                  key={drift.id}
                  initial={{ opacity: 1, scale: 0.8, y: drift.y, x: drift.x }}
                  animate={{ opacity: 0, scale: 1.2, y: drift.y - 120, x: drift.x + (Math.random() * 40 - 20) }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`absolute z-40 text-sm font-extrabold font-mono pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${drift.color}`}
                >
                  {drift.value}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Core Circular Dashboard Button wrapper */}
            {currentBlock && (
              <button
                onClick={handleCoreTap}
                className="w-48 h-48 rounded-full bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-1 filter active:scale-[0.96] transition-transform flex items-center justify-center relative cursor-pointer"
                id="quantum-miner-trigger"
              >
                {/* Rotating background rings */}
                <span className={`absolute inset-0 rounded-full border border-dashed animate-spin transition-all duration-300 [animation-duration:15s] ${
                  currentBlock.type === 'herring' ? 'border-orange-500/35' : 'border-purple-500/20'
                }`}></span>
                <span className={`absolute inset-2 rounded-full border border-double animate-spin transition-all duration-300 [animation-duration:8s] [animation-direction:reverse] ${
                  currentBlock.type === 'herring' ? 'border-red-500/20' : 'border-indigo-500/10'
                }`}></span>

                {/* Laser scan horizontal grid */}
                <span className="absolute inset-4 rounded-full bg-radial-gradient from-zinc-950 to-black overflow-hidden flex items-center justify-center">
                  <span className={`absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full animate-bounce [animation-duration:3s] ${
                    currentBlock.type === 'herring' ? 'via-orange-500' : 'via-purple-500'
                  }`}></span>
                </span>

                {/* Main inner core elements */}
                <div className="relative flex flex-col items-center gap-1 text-center select-none z-10">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    currentBlock.type === 'herring' ? 'bg-orange-600/10 text-orange-400' : 'bg-purple-600/10 text-purple-400'
                  }`}>
                    <Cpu className="w-8 h-8 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-zinc-550 uppercase tracking-widest block font-bold font-mono">Хеширование</span>
                  <span className="text-2xl font-black font-mono tracking-tight text-white">
                    {currentBlock.tapProgress.toFixed(0)}%
                  </span>
                  <span className="text-[8px] text-zinc-400 uppercase tracking-wide font-sans">
                    {Math.round(currentBlock.requiredTaps * (1 - currentBlock.tapProgress/100))} тапов до конца
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Core Hazard Alarm Button to slash Lazy nodes */}
          <div className="flex flex-col gap-2.5">
            {currentBlock && currentBlock.type === 'herring' ? (
              <button
                onClick={handleReportHerring}
                className="w-full py-4.5 bg-gradient-to-r from-red-600 to-orange-500 text-black font-extrabold text-sm rounded-2xl uppercase tracking-wider transition-all shadow-lg active:scale-95 shadow-orange-500/10 hover:shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer border border-orange-400"
                id="report-cheater-node-trigger"
              >
                <AlertOctagon className="w-5 h-5 text-black animate-ping [animation-duration:1s]" />
                <span>Разоблачить саботаж (+7.5 SYM)</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-550 font-extrabold text-sm rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed select-none"
              >
                <ShieldCheck className="w-5 h-5 text-zinc-650" />
                <span>Ловушек в блоке не найдено</span>
              </button>
            )}

            {/* Smartphone Battery Power energy bar */}
            <div className="flex flex-col gap-1 px-1 mt-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-500" /> Батарея Сканнера
                </span>
                <span className="text-zinc-200 font-bold">{Math.round(energy)} / {maxEnergy} mAh</span>
              </div>
              <div className="w-full h-3 bg-zinc-950 border border-zinc-800 p-0.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${(energy / maxEnergy) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

        </div>

        {/* Real-time Game Analytics dashboard */}
        <div className="w-full bg-[#09090b] border border-zinc-900 rounded-2xl p-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono mb-1">Блоков Проверено</span>
            <span className="text-zinc-100 font-bold font-mono text-base">{blocksScannedCount}</span>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono mb-1">Поймано Саботажей</span>
            <span className="text-orange-400 font-bold font-mono text-base">{herringsReported}</span>
          </div>
          <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
            <span className="text-zinc-500 block text-[10px] uppercase font-mono mb-1">Общий Баунти</span>
            <span className="text-purple-400 font-bold font-mono text-base">+{cumulativeBountyEarned.toFixed(1)} SYM</span>
          </div>
        </div>

      </div>

      {/* 3. Right Column: Upgrade Tech Tree & Leaderboard */}
      <div className="col-span-12 lg:col-span-15 grid md:grid-cols-2 lg:grid-cols-1 col-span-12 lg:col-span-5 gap-4">
        
        {/* Hardware Upgrade Store segment */}
        <div className="bg-[#09090b] border border-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2 mb-1">
            <Award className="w-4.5 h-4.5 text-orange-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Улучшение Оборудования Клиента
            </h3>
          </div>

          <div className="space-y-2.5">
            {upgrades.map(item => (
              <div 
                key={item.id}
                className="p-3 bg-zinc-950 rounded-xl border border-zinc-900/60 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-100">
                    {item.id === 'quantum-scan' && <Cpu className="w-3.5 h-3.5 text-purple-400" />}
                    {item.id === 'graphene-battery' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                    {item.id === 'radar' && <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
                    {item.id === 'zk-prover-compress' && <Sparkles className="w-3.5 h-3.5 text-sky-400" />}
                    <span>{item.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Lvl {item.level}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="text-[8.5px] text-emerald-400 uppercase font-bold font-mono mt-1">
                    Эффект: {item.bonusText}
                  </div>
                </div>

                {item.level >= item.maxLevel ? (
                  <span className="text-[10px] text-zinc-550 uppercase font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
                    Max Lvl
                  </span>
                ) : (
                  <button
                    onClick={() => buyUpgrade(item.id)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-purple-950/20 text-purple-400 hover:text-purple-300 font-bold border border-zinc-800 hover:border-purple-900/30 font-mono rounded-lg transition-all active:scale-95 text-[10px] cursor-pointer whitespace-nowrap"
                  >
                    {item.cost} SYM
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Global leaderboards list */}
        <div className="bg-[#09090b] border border-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Лидеры Легких Нод (LightNodes)
              </h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500">Live Global Pool</span>
          </div>

          <div className="space-y-1.5">
            {leaderboard.map(u => (
              <div 
                key={u.name}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs font-mono transition-colors ${
                  u.name.includes('You')
                    ? 'bg-purple-950/20 border-purple-900/40 text-purple-300'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold ${
                    u.rank === 1 ? 'bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20' :
                    u.rank === 2 ? 'bg-zinc-400/10 text-zinc-400 border border-zinc-400/20' :
                    u.rank === 3 ? 'bg-amber-700/10 text-amber-700 border border-amber-700/25' :
                    'bg-zinc-900 text-zinc-500'
                  }`}>
                    {u.rank}
                  </span>
                  <span>{u.name}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-zinc-550 text-[9px] uppercase">
                    {u.active ? '● active' : '○ offline'}
                  </span>
                  <span className="font-bold">{u.points.toLocaleString()} pts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Educational Game-theory rationale explaining why this is crucial */}
          <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-3 text-[10.5px] text-zinc-400 mt-1 space-y-1.5">
            <span className="text-xs font-bold text-zinc-100 block uppercase font-mono">
              🛡️ Как это защищает консенсус
            </span>
            <p className="leading-relaxed">
              Мобильные пользователи выступают в качестве децентрализованной <strong>Whistleblower Guard</strong>. Если крупный валидатор решает лениться (пропускает EVM-проверки), он неизбежно ошибается на <strong>Red Herring (блоках-приманках)</strong>. 
            </p>
            <p className="leading-relaxed">
              Любое легкое мобильное устройство проводит мгновенную выборочную сверку пруфов подписи и может отправить ончейн транзакцию, урезающую ставку нарушителя. Это решает дилемму верификатора математически.
            </p>
          </div>
        </div>

      </div>

      {/* 4. Scanner History Ledger Table */}
      <div className="col-span-12 bg-[#09090b] border border-zinc-900 rounded-2xl p-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 mb-3">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Логи децентрализованных проверок в реальном времени
            </h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500">Автоматически обновляется по мере хэширования</span>
        </div>

        <div className="max-h-[140px] overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 gap-2">
          {scanHistory.length === 0 ? (
            <div className="col-span-2 text-center text-xs text-zinc-600 font-mono py-6">
              Сканируйте блоки выше, чтобы наполнить лог-ленту верификации
            </div>
          ) : (
            scanHistory.map((scan, i) => (
              <div 
                key={i}
                className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg flex items-center justify-between text-[11px] font-mono transition-all hover:bg-zinc-900/20"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    scan.status === 'verified' ? 'bg-purple-500' :
                    scan.status === 'slashed' ? 'bg-red-500 animate-ping' :
                    'bg-orange-500'
                  }`}></span>
                  <span className="text-zinc-200">Блок #{scan.height}</span>
                  <span className="text-zinc-550">({scan.hash.substring(0, 10)}...)</span>
                </div>
                <div>
                  {scan.status === 'verified' && (
                    <span className="text-purple-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Проверен
                    </span>
                  )}
                  {scan.status === 'slashed' && (
                    <span className="text-red-400 font-bold flex items-center gap-1 uppercase">
                      💥 Пойман обманщик
                    </span>
                  )}
                  {scan.status === 'failed' && (
                    <span className="text-amber-500 flex items-center gap-0.5 font-bold">
                      ⚠️ Упущена ловушка
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>



    </div>
  );
};
