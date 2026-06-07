// TypeScript implementation of the Off-chain Validator Node Daemon (ZK-Cops & Falcon-512 Signer)
// This simulates continuous polling of blocks, cryptographic Falcon signing, generation of ZK proofs,
// and sending the verification transactions to the ZkProverRegistry contract.

export interface NodeAgentStats {
  blocksProcessed: number;
  signedBatches: number;
  proofsGenerated: number;
  reputationBoosts: number;
  currentReputation: number;
  accumulatedRewards: number;
  status: 'IDLE' | 'ACTIVE' | 'ERROR';
  logs: string[];
}

export class OffChainValidatorDaemon {
  private intervalId: NodeJS.Timeout | null = null;
  private stats: NodeAgentStats;
  private onUpdate: (stats: NodeAgentStats) => void;
  private validatorAddress: string;

  constructor(validatorAddress: string, onUpdate: (stats: NodeAgentStats) => void) {
    this.validatorAddress = validatorAddress;
    this.onUpdate = onUpdate;
    this.stats = {
      blocksProcessed: 0,
      signedBatches: 0,
      proofsGenerated: 0,
      reputationBoosts: 0,
      currentReputation: 100,
      accumulatedRewards: 0,
      status: 'IDLE',
      logs: ['[DAEMON_INIT] Off-chain ZK-Rollup Node-Validator Daemon инициализирован.']
    };
  }

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.stats.logs.unshift(`[${timestamp}] ${message}`);
    if (this.stats.logs.length > 50) {
      this.stats.logs.pop();
    }
  }

  public start() {
    if (this.stats.status === 'ACTIVE') return;

    this.stats.status = 'ACTIVE';
    this.addLog(`🚀 Запущен автоматический демон валидации блоков для адреса: ${this.validatorAddress.slice(0, 8)}...`);
    this.addLog(`🔑 Генерация Falcon-512 ключей и привязка к смарт-контракту в L2 Base/Arbitrum Sepolia completed.`);
    this.onUpdate({ ...this.stats });

    this.intervalId = setInterval(() => {
      this.processEpoch();
    }, 4000); // Process a simulation round every 4 seconds
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.stats.status = 'IDLE';
    this.addLog('🛑 Демон успешно остановлен оператором.');
    this.onUpdate({ ...this.stats });
  }

  private processEpoch() {
    try {
      this.stats.blocksProcessed += Math.floor(Math.random() * 3) + 1;
      this.stats.signedBatches += 1;
      
      const newBlockHeight = 4859320 + this.stats.blocksProcessed;
      this.addLog(`📡 [L2_RPC] Обнаружен новый блок #${newBlockHeight} в сети Base Sepolia.`);
      
      // 1. Falcon-512 Signature simulation
      const blockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      this.addLog(`🖋️  Подписание хеша блока ${blockHash.slice(0, 10)}... локальным Falcon-512 приватным ключом.`);
      
      // 2. Cryptographic ZK Proof Simulation
      this.stats.proofsGenerated += 1;
      this.addLog(`⚙️  Генерация Groth16 ZK-доказательства валидности транзакций (ZK-Cops)...`);
      
      // 3. Auto sending proof validation to registry
      setTimeout(() => {
        if (this.stats.status !== 'ACTIVE') return;
        
        this.stats.reputationBoosts += 1;
        this.stats.currentReputation = Math.min(200, this.stats.currentReputation + 20);
        
        // 5 SYM per base block reward, boosted by reputation factor
        const baseReward = 5;
        const reward = (baseReward * this.stats.currentReputation) / 100;
        this.stats.accumulatedRewards += reward;

        this.addLog(`💎 [TX_SUCCESS] submitAndVerifyProof транзакция подтверждена!`);
        this.addLog(`📈 Репутация валидатора увеличилась: +20 единиц (Текущая: ${this.stats.currentReputation}/200)`);
        this.addLog(`💰 Начислено на смарт-контракт: +${reward.toFixed(1)} SYM (со скидкой репутации ${((this.stats.currentReputation/100)).toFixed(1)}x APY)`);
        
        this.onUpdate({ ...this.stats });
      }, 1500);

      this.onUpdate({ ...this.stats });
    } catch (err: any) {
      this.stats.status = 'ERROR';
      this.addLog(`❌ Критическая ошибка выполнения демона: ${err.message || err}`);
      this.stop();
    }
  }

  public getStats(): NodeAgentStats {
    return { ...this.stats };
  }
}
