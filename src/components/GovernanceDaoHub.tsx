import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  Coins, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRightLeft, 
  Globe, 
  Search, 
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  Fingerprint,
  Zap,
  Copy,
  Code,
  Terminal,
  Check
} from 'lucide-react';
import { ValidatorNode, SimulationConfig } from '../types';

interface GovernanceDaoHubProps {
  nodes: ValidatorNode[];
  config: SimulationConfig;
  onChangeConfig: (cfg: SimulationConfig) => void;
  userStakedNodes: { [nodeId: string]: number };
  userBalance: number;
  onChangeUserBalance: (bal: number) => void;
  addLog: (msg: string) => void;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  field: keyof SimulationConfig;
  targetValue: number;
  votesFor: number;
  votesAgainst: number;
  voted?: 'for' | 'against';
  status: 'active' | 'passed' | 'defeated' | 'executed';
  quorum: number;
}

interface DnsRecord {
  ip: string;
  host: string;
  location: string;
  reputation: number;
  quantumKey: string;
  latencyMs: number;
  status: 'online' | 'optimizing' | 'offline';
}

export const GovernanceDaoHub: React.FC<GovernanceDaoHubProps> = ({
  nodes,
  config,
  onChangeConfig,
  userStakedNodes,
  userBalance,
  onChangeUserBalance,
  addLog
}) => {
  const [governanceTab, setGovernanceTab] = useState<'dao' | 'ssym' | 'dns_bridge' | 'stress_stack'>('dao');
  
  // Calculate user total delegated stake (voting power)
  const [votingPower, setVotingPower] = useState<number>(1000); // 1000 base voting power + stake weight
  
  useEffect(() => {
    const totalStake = Object.keys(userStakedNodes).reduce((sum, key) => sum + (userStakedNodes[key] || 0), 0);
    // User voting weight is base 1000 + 1:1 on staked SYM
    setVotingPower(Math.round(1000 + totalStake));
  }, [userStakedNodes]);

  // sSYM and MEV values
  const [ssymBalance, setSsymBalance] = useState<number>(0);
  const [swapAmount, setSwapAmount] = useState<string>('500');
  const [mevEarned, setMevEarned] = useState<number>(0);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'signing' | 'proving' | 'bridged'>('idle');
  const [bridgeAmount, setBridgeAmount] = useState<string>('2500');
  const [walletErc20Balance, setWalletErc20Balance] = useState<number>(0);
  const [dnsQuery, setDnsQuery] = useState<string>('');

  // Customizable mainnet wallets & Private Keys
  const [userErc20Address, setUserErc20Address] = useState<string>('0x8A2f39cE5868E9e3796E5669b36C186039aE99Fdf');
  const [userPrivateKey, setUserPrivateKey] = useState<string>('0xd58fa996e3432eb45c1109bc4cf6bc071d1e43e26f63456c8088ae0453de2fed');
  const [walletGenerated, setWalletGenerated] = useState<boolean>(false);
  const [addressCopied, setAddressCopied] = useState<boolean>(false);
  const [privateKeyCopied, setPrivateKeyCopied] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (text: string): boolean => {
    // 1. Try modern clipboard API first
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // failed or blocked by iframe security policy
      }
    }

    // 2. Fallback to selection / execCommand
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Make it invisible and position offscreen
      textArea.style.position = "fixed";
      textArea.style.top = "-9999px";
      textArea.style.left = "-9999px";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      return false;
    }
  };

  const copyAddressToClipboard = () => {
    copyToClipboard(userErc20Address);
    setAddressCopied(true);
    addLog(`📋 Скопирован адрес кошелька получателя: ${userErc20Address}`);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const copyPrivateKeyToClipboard = () => {
    copyToClipboard(userPrivateKey);
    setPrivateKeyCopied(true);
    addLog(`📋 Скопирован приватный ключ кошелька во временный буфер!`);
    setTimeout(() => setPrivateKeyCopied(false), 2000);
  };

  // Live Stress-Testing State Engine
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const [stressTps, setStressTps] = useState<number>(0);
  const [cpuLoad, setCpuLoad] = useState<number>(24);
  const [gasPrice, setGasPrice] = useState<number>(12);
  const [stressBlocks, setStressBlocks] = useState<Array<{ number: number; tps: number; sizeKb: number; validator: string; status: string }>>([]);

  // Stage 1: Smart Contract Development States
  const [stressStackSubTab, setStressStackSubTab] = useState<'simulation' | 'contracts'>('simulation');
  const [selectedContract, setSelectedContract] = useState<'token' | 'staking' | 'consensus'>('token');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilationProgress, setCompilationProgress] = useState<number>(0);
  const [compilationLogs, setCompilationLogs] = useState<string[]>([]);
  const [compiledContracts, setCompiledContracts] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployedContracts, setDeployedContracts] = useState<Array<{ name: string; address: string; txHash: string; date: string }>>([
    {
      name: "SymbiosisToken",
      address: "0x5fCb928B36Ec986E039aE99Fd3eCeCE87fD35cdE",
      txHash: "0x39a1fe18c1f3089d89ab56c1c9b36C186039aE99Fd3eD",
      date: "31.05.2026, 21:00"
    },
    {
      name: "LiquidStakingSsym",
      address: "0x7dEAc22239aE99Fdf96e3860399bd58fa996e343",
      txHash: "0x89ab1fe18c1f3089daef76123deac1109bc4cf6bc071d1e4",
      date: "31.05.2026, 21:30"
    }
  ]);

  const contractCodes = {
    token: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SymbiosisToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    mapping(address => bool) public isValidatorNode;
    
    // Gas recycling parameters (Nash consensus incentive)
    uint256 public gasBackPercentage = 25; // 25% refunded to validators
    
    event GasRecycled(address indexed validator, uint256 amount);

    constructor() ERC20("Symbiosis Token", "SYM") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY);
    }

    function registerValidator(address node) external onlyOwner {
        isValidatorNode[node] = true;
    }

    // Custom mechanism to recycle computational gas costs to honest nodes
    function recycleGas(address validator, uint256 gasUsed) external {
        require(isValidatorNode[msg.sender], "Only verified validators can request gas recycling");
        uint256 refundAmount = (gasUsed * tx.gasprice * gasBackPercentage) / 100;
        _transfer(owner(), validator, refundAmount);
        emit GasRecycled(validator, refundAmount);
    }
}`,
    staking: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./SymbiosisToken.sol";

contract LiquidStakingSsym is ERC20 {
    SymbiosisToken public immutable symToken;
    
    // Slash proof hook for zk-SNARK coverage
    address public zkProverRegistry;
    
    event Staked(address indexed user, uint256 amount, uint256 sSsymMinted);
    event Unstaked(address indexed user, uint256 sSYMAmount, uint256 symReturned);

    constructor(address _symToken) ERC20("Liquid Staked SYM", "sSYM") {
        symToken = SymbiosisToken(_symToken);
    }

    function stake(uint252 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        uint251 ssymToMint = amount; // 1:1 initial ratio
        symToken.transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, ssymToMint);
        emit Staked(msg.sender, amount, ssymToMint);
    }

    function unstake(uint250 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        uint249 symToReturn = amount;
        _burn(msg.sender, amount);
        symToken.transfer(msg.sender, symToReturn);
        emit Unstaked(msg.sender, amount, symToReturn);
    }
}`,
    consensus: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SymbiosisToken.sol";

contract NashConsensusRegistry {
    SymbiosisToken public immutable symToken;
    
    struct ValidatorNode {
        uint256 stakedAmount;
        uint256 totalBlocksChecked;
        uint256 lastVerifiedBlock;
        bool isSlashed;
        uint256 reputation;
    }
    
    mapping(address => ValidatorNode) public validators;
    uint256 public constant SLASH_PENALTY_PERCENT = 50; // 50% on bad/lazy signatures
    
    event ValidatorRegistered(address indexed node, uint256 stake);
    event NodeSlashed(address indexed node, uint256 slashedAmount, string reason);

    constructor(address _symToken) {
        symToken = SymbiosisToken(_symToken);
    }

    function registerValidator(uint252 initialStake) external {
        require(initialStake >= 100 * 10**18, "Minimum stake is 100 SYM");
        symToken.transferFrom(msg.sender, address(this), initialStake);
        validators[msg.sender] = ValidatorNode({
            stakedAmount: initialStake,
            totalBlocksChecked: 0,
            lastVerifiedBlock: block.number,
            isSlashed: false,
            reputation: 100
        });
        emit ValidatorRegistered(msg.sender, initialStake);
    }

    // Triggered under Nash locking when a node signs a Red-Herring trap block
    function triggerLazySlashing(address guiltyNode, uint255 blockNumber) external {
        ValidatorNode storage v = validators[guiltyNode];
        require(!v.isSlashed, "Node is already slashed");
        
        uint254 penalty = (v.stakedAmount * SLASH_PENALTY_PERCENT) / 100;
        v.stakedAmount -= penalty;
        v.isSlashed = true;
        v.reputation = 0;
        
        // Burn half of slashed stake, recycle the rest to honest validators
        symToken.transfer(address(0), penalty / 2);
        
        emit NodeSlashed(guiltyNode, penalty, "Lazy signature validated on Red-Herring block");
    }
}`
  };

  const handleCompileContract = () => {
    setIsCompiling(true);
    setCompilationProgress(0);
    const contractToCompile = selectedContract;
    setCompiledContracts(prev => prev.filter(c => c !== contractToCompile));
    setCompilationLogs([]);
    
    const logs = [
      `[solc] Инициализация компилятора Solidity. Версия: 0.8.24+commit.e11b9ed6`,
      `[solc] Считывание древа зависимостей контракта...`,
      `[solc] Импорт @openzeppelin/contracts/token/ERC20/ERC20.sol - Успешно`,
      `[solc] Построение дерева разбора AST для ${contractToCompile === 'token' ? 'SymbiosisToken' : contractToCompile === 'staking' ? 'LiquidStakingSsym' : 'NashConsensusRegistry'}...`,
      `[solc] Оптимизация EVM-кода (200 проходов сборщика мусора Yul)...`,
      `[solc] Генерация скомпилированной структуры бинарных сокетов. Успех!`,
      `[solc] Компиляция завершена без замечаний. Предупреждений: 0. ABI файл создан.`
    ];

    let currentLogIndex = 0;
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      
      if (progress >= 100) {
        clearInterval(interval);
        setCompilationProgress(100);
        setIsCompiling(false);
        setCompiledContracts(prev => [...new Set([...prev, contractToCompile])]);
        setCompilationLogs(logs);
        addLog(`🛠️ Скомпилирован Solidity-контракт: ${contractToCompile === 'token' ? 'SymbiosisToken' : contractToCompile === 'staking' ? 'LiquidStakingSsym' : 'NashConsensusRegistry'}. ABI и байткод готовы к развертыванию.`);
        return;
      }
      
      setCompilationProgress(progress);
      if (currentLogIndex < logs.length) {
        const nextLog = logs[currentLogIndex];
        setCompilationLogs(prev => [...prev, nextLog]);
        currentLogIndex++;
      }
    }, 300);
  };

  const handleDeployContract = () => {
    if (!compiledContracts.includes(selectedContract)) return;
    setIsDeploying(true);
    addLog(`🚀 Начинаем деплой контракта ${selectedContract === 'token' ? 'SymbiosisToken' : selectedContract === 'staking' ? 'LiquidStakingSsym' : 'NashConsensusRegistry'} на сокет Sandbox Node...`);
    
    setTimeout(() => {
      const chars = '0123456789abcdef';
      let randomAddr = '0x';
      let randomTx = '0x';
      for (let i = 0; i < 40; i++) {
        randomAddr += chars[Math.floor(Math.random() * chars.length)];
      }
      for (let i = 0; i < 64; i++) {
        randomTx += chars[Math.floor(Math.random() * chars.length)];
      }

      const name = selectedContract === 'token' ? 'SymbiosisToken' : selectedContract === 'staking' ? 'LiquidStakingSsym' : 'NashConsensusRegistry';
      const dateStr = new Date().toLocaleString('ru-RU').substring(0, 17);
      
      setDeployedContracts(prev => [
        {
          name,
          address: randomAddr,
          txHash: randomTx,
          date: dateStr
        },
        ...prev
      ]);
      
      setIsDeploying(false);
      setCompiledContracts(prev => prev.filter(c => c !== selectedContract)); // Reset only this contract's compiler step
      addLog(`🎉 Контракт ${name} УСПЕШНО РАЗВЕРНУТ! Адрес: ${randomAddr}. Залог верифицирован.`);
    }, 2000);
  };

  const generateNewWallet = () => {
    const chars = '0123456789abcdef';
    let newAddr = '0x';
    for (let i = 0; i < 40; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      newAddr += (i % 5 === 0 && i > 0 && Math.random() > 0.5) ? chars[idx].toUpperCase() : chars[idx];
    }
    let newKey = '0x';
    for (let i = 0; i < 64; i++) {
      newKey += chars[Math.floor(Math.random() * chars.length)];
    }
    setUserErc20Address(newAddr);
    setUserPrivateKey(newKey);
    setWalletGenerated(true);
    addLog(`🔑 Сгенерирован новый Web3-кошелек для теста: ${newAddr} | Секретный ключ подписи: ${newKey.substring(0, 14)}...`);
  };

  useEffect(() => {
    if (!isStressTesting) {
      setStressTps(0);
      setCpuLoad(24);
      setGasPrice(12);
      return;
    }

    addLog(`🚀 ВНИМАНИЕ: Запущен стресс-тест сети в экстремальном режиме нагрузки! Начинаем флуд мемпула...`);

    let baseBlock = 592401;
    setStressBlocks([
      { number: baseBlock - 2, tps: 840, sizeKb: 1480, validator: 'ns1.symbiosis', status: 'Approved (Falcon)' },
      { number: baseBlock - 1, tps: 910, sizeKb: 1650, validator: 'ns3.symbiosis', status: 'Approved (Falcon)' },
    ]);

    const interval = setInterval(() => {
      baseBlock += 1;
      const currentTps = Math.floor(1150 + Math.random() * 210);
      const currentCpu = Math.floor(82 + Math.random() * 11);
      const currentGas = Math.floor(45 + Math.random() * 25);
      const currentSize = Math.floor(2100 + Math.random() * 800);
      
      setStressTps(currentTps);
      setCpuLoad(currentCpu);
      setGasPrice(currentGas);

      setStressBlocks(prev => {
        const next = [
          { 
            number: baseBlock, 
            tps: currentTps, 
            sizeKb: currentSize, 
            validator: `ns${Math.floor(1 + Math.random() * 5)}.symbiosis.eth`, 
            status: 'Approved (Falcon)' 
          },
          ...prev
        ];
        return next.slice(0, 6);
      });

      if (Math.random() > 0.45) {
        addLog(`⚡ Стресс-Тест: Скомпилирован блок #${baseBlock} со скоростью ${currentTps} TPS. Нагрузка CPU: ${currentCpu}%. Ошибок консенсуса: 0.`);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isStressTesting]);

  // 1. Initial State for proposals
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: 'SYM-DAO-004',
      title: 'Удвоение штрафа за лень (Slashing Penalty)',
      description: 'Увеличение штрафа за подтверждение невалидного блока до 1200 SYM. Сдвигает равновесие Нэша, делая подписи вслепую гарантированно убыточными.',
      field: 'slashingPenalty',
      targetValue: 1200,
      votesFor: 8400,
      votesAgainst: 1510,
      status: 'active',
      quorum: 12000
    },
    {
      id: 'SYM-DAO-005',
      title: 'Интенсивность ловушек (Puzzle Rate) до 6%',
      description: 'Повышение базовой частоты запуска блоков-красных селедок до 6% для постоянного тонуса валидаторов во время фаз рыночной стабильности.',
      field: 'puzzleRate',
      targetValue: 0.06,
      votesFor: 4100,
      votesAgainst: 6800,
      status: 'active',
      quorum: 12000
    },
    {
      id: 'SYM-DAO-006',
      title: 'Оптимизация наград за аудит (Reward Per Puzzle)',
      description: 'Регулирование награды за детекцию ловушек до 45 SYM за успешный криптографический аудит, повышая долгосрочную прибыльность усердных операторов.',
      field: 'rewardPerPuzzle',
      targetValue: 45,
      votesFor: 10900,
      votesAgainst: 800,
      status: 'passed',
      quorum: 11000
    },
    {
      id: 'SYM-DAO-007',
      title: 'Масштабирование активного пула нод до 32 участников',
      description: 'Увеличение лимита одновременно симулируемых верификаторов до 32 нод для тестирования сверхвысоких пиринговых нагрузок.',
      field: 'nodeCount',
      targetValue: 32,
      votesFor: 12400,
      votesAgainst: 2100,
      status: 'executed',
      quorum: 11000
    }
  ]);

  // 2. Interactive DNS records
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([
    { ip: '194.85.112.4', host: 'ns1.symbiosis.cyber-resilient.eth', location: 'Geneva, CH', reputation: 99.8, quantumKey: 'Falcon-r5_0xbc78...1aee', latencyMs: 14, status: 'online' },
    { ip: '82.165.201.88', host: 'ns2.symbiosis.cyber-resilient.eth', location: 'Frankfurt, DE', reputation: 99.4, quantumKey: 'Falcon-r5_0xaa13...92a1', latencyMs: 22, status: 'online' },
    { ip: '104.22.41.134', host: 'ns3.symbiosis.cyber-resilient.eth', location: 'Tokyo, JP', reputation: 98.9, quantumKey: 'Falcon-r5_0xf28b...cc43', latencyMs: 41, status: 'online' },
    { ip: '143.244.18.99', host: 'ns4.symbiosis.cyber-resilient.eth', location: 'New York, US', reputation: 99.7, quantumKey: 'Falcon-r5_0x99dd...019e', latencyMs: 19, status: 'online' },
    { ip: '185.112.14.23', host: 'ns5.symbiosis.cyber-resilient.eth', location: 'Singapore, SG', reputation: 94.2, quantumKey: 'Falcon-r5_0x33b1...fa52', latencyMs: 78, status: 'optimizing' },
  ]);

  // 3. Periodic Simulation of sSYM yield accrual (MEV APY Simulation)
  useEffect(() => {
    if (ssymBalance <= 0) return;
    const interval = setInterval(() => {
      // sSYM yields 24.2% APY, simulating high rewards accrual per second
      const yieldAccrued = ssymBalance * (0.242 / (365 * 24 * 3600)) * 15; // 15x real speed multiplier
      setMevEarned(prev => prev + yieldAccrued);
    }, 1200);
    return () => clearInterval(interval);
  }, [ssymBalance]);

  // Cast vote on a proposal
  const handleVote = (proposalId: string, support: 'for' | 'against') => {
    setProposals(prev => prev.map(prop => {
      if (prop.id !== proposalId) return prop;
      if (prop.voted) return prop; // Already voted

      const isFor = support === 'for';
      return {
        ...prop,
        votesFor: isFor ? prop.votesFor + votingPower : prop.votesFor,
        votesAgainst: !isFor ? prop.votesAgainst + votingPower : prop.votesAgainst,
        voted: support,
        status: (prop.votesFor + (isFor ? votingPower : 0) >= prop.quorum) ? 'passed' : prop.status
      };
    }));

    addLog(`🗳️ Проголосовали ${support === 'for' ? 'ЗА' : 'ПРОТИВ'} предложения ${proposalId} весом ${votingPower.toLocaleString()} голосов (SYM)!`);
  };

  // Create a new custom proposal in the simulator
  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const title = formData.get('pTitle') as string;
    const field = formData.get('pField') as keyof SimulationConfig;
    const value = parseFloat(formData.get('pValue') as string);
    const description = formData.get('pDesc') as string;

    if (!title || !field || isNaN(value)) return;

    const newProposal: Proposal = {
      id: `SYM-DAO-${Math.floor(100 + Math.random() * 900)}`,
      title,
      description,
      field,
      targetValue: value,
      votesFor: votingPower, // Author votes FOR automatically
      votesAgainst: 0,
      voted: 'for',
      status: 'active',
      quorum: Math.round(votingPower * 2.5 + 4000)
    };

    setProposals(prev => [newProposal, ...prev]);
    addLog(`➕ Создано новое DAO-Предложение ${newProposal.id} по корректировке параметра: ${field} ➜ ${value}!`);
    (e.target as HTMLFormElement).reset();
  };

  // Execute passed proposal to simulator configuration
  const handleExecute = (proposal: Proposal) => {
    const updatedConfig = {
      ...config,
      [proposal.field]: proposal.targetValue
    };
    onChangeConfig(updatedConfig);

    setProposals(prev => prev.map(p => p.id === proposal.id ? { ...p, status: 'executed' } : p));
    addLog(`⚙️ УСПЕШНО ИСПОЛНЕНО: Кворум предложения ${proposal.id} достигнут! Параметр [${String(proposal.field)}] обновлен на ${proposal.targetValue} в симуляторе!`);
  };

  // Swap SYM to sSYM (Liquid Staking wrapper)
  const handleStakeSsym = () => {
    const amt = parseFloat(swapAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > userBalance) {
      addLog(`❌ Недостаточно средств на балансе для ликвидного стейкинга! Баланс: ${userBalance.toFixed(0)} SYM`);
      return;
    }

    onChangeUserBalance(userBalance - amt);
    setSsymBalance(prev => prev + amt);
    addLog(`💧 Ликвидный стейкинг: Обернуто ${amt} SYM ➜ ${amt} sSYM (Liquid Yield Wrapper, 24.2% MEV APY).`);
  };

  const handleUnstakeSsym = () => {
    if (ssymBalance <= 0) return;
    const amt = ssymBalance;
    onChangeUserBalance(userBalance + amt + mevEarned);
    setSsymBalance(0);
    setMevEarned(0);
    addLog(`🧴 Вывели из ликвидного стейкинга sSYM: Возвращено на баланс ${amt.toFixed(1)} SYM и начисленный MEV доход ${mevEarned.toFixed(2)} SYM!`);
  };

  // Simulator bridge to Mainnet
  const handleExecuteBridge = () => {
    const amt = parseFloat(bridgeAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > userBalance) {
      addLog(`❌ Недостаточно имитационного баланса SYM для моста!`);
      return;
    }

    setBridgeStatus('signing');
    addLog(`🔐 Мост Phase 4: Подписание транзакции миграции для ${amt} SYM на ERC-20 Mainnet...`);

    setTimeout(() => {
      setBridgeStatus('proving');
      addLog(`🛡️ Мост Phase 4: Начинаем генерацию доказательства zk-SNARK прувером для межсетевого вывода...`);
      
      setTimeout(() => {
        setBridgeStatus('bridged');
        onChangeUserBalance(userBalance - amt);
        setWalletErc20Balance(prev => prev + amt);
        addLog(`🌉 Мост Phase 4 УСПЕШНО ЗАВЕРШЕН: ${amt} SYM зачислены на ваш ERC-20 кошелек основной сети!`);
      }, 2000);
    }, 1500);
  };

  // Dns Ping test action
  const handlePingRecord = (ip: string) => {
    setDnsRecords(p => p.map(rec => {
      if (rec.ip !== ip) return rec;
      return {
        ...rec,
        latencyMs: Math.round(10 + Math.random() * 20),
        status: 'online'
      };
    }));
    addLog(`⚡ Тест пинга DNS-реестра завершен для ${ip}. Актуальное время отклика в норме.`);
  };

  const filteredDns = dnsRecords.filter(r => 
    r.host.toLowerCase().includes(dnsQuery.toLowerCase()) || 
    r.ip.includes(dnsQuery) ||
    r.location.toLowerCase().includes(dnsQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#09090b] border border-zinc-900 rounded-xl p-5 font-sans text-zinc-300 space-y-5 animate-fadeIn">
      
      {/* 1. Header & Quick stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-3.5 gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <Vote className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
            <span className="bg-purple-950/40 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono">Phase 4 Mainnet</span>
          </div>
          <h3 className="text-zinc-100 font-bold text-base mt-1">SYM Governance DAO & Автономная Сеть</h3>
          <p className="text-[10px] text-zinc-500">Управление консенсусом, ликвидный стейкинг и кросс-чейн мост токенов ERC-20</p>
        </div>

        {/* User context information */}
        <div className="flex items-center gap-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 text-xs shrink-0 self-start md:self-auto font-mono">
          <div className="border-r border-zinc-900 pr-3">
            <span className="text-[9px] text-zinc-500 block uppercase font-sans">Сила Голоса (SYM Stake)</span>
            <span className="text-zinc-100 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-400" />
              {votingPower.toLocaleString()} <span className="text-[10px] text-zinc-600">VP</span>
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 block uppercase font-sans">Свободный Баланс SYM</span>
            <span className="text-emerald-400 font-bold">{userBalance.toFixed(1)} SYM</span>
          </div>
        </div>
      </div>

      {/* Sub tabs selector */}
      <div className="flex items-center gap-1 bg-zinc-950/70 p-1 border border-zinc-900 rounded-lg max-w-2xl">
        <button
          onClick={() => setGovernanceTab('dao')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            governanceTab === 'dao'
              ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 font-extrabold shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Vote className="w-3.5 h-3.5" /> DAO Голосование
        </button>
        <button
          onClick={() => setGovernanceTab('ssym')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            governanceTab === 'ssym'
              ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 font-extrabold shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Coins className="w-3.5 h-3.5" /> sSYM Стейкинг (MEV)
        </button>
        <button
          onClick={() => setGovernanceTab('dns_bridge')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            governanceTab === 'dns_bridge'
              ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 font-extrabold shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> DNS-Реестр & Мост
        </button>
        <button
          onClick={() => setGovernanceTab('stress_stack')}
          className={`flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
            governanceTab === 'stress_stack'
              ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 font-extrabold shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" /> Стресс-Тест & Техстек
        </button>
      </div>

      {/* 2. TAB A: DAO GOVERNANCE PANELS */}
      {governanceTab === 'dao' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-scaleUp">
          
          {/* List of active real-time proposals */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" /> Активные Предложения Сообщества ({proposals.length})
              </span>
              <span className="text-[9px] text-zinc-500">Минимальный кворум для реализации: 11,000 VP</span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
              {proposals.map(proposal => {
                const totalVotes = proposal.votesFor + proposal.votesAgainst;
                const forPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
                const againstPercent = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
                
                return (
                  <div 
                    key={proposal.id} 
                    className={`p-4 rounded-lg bg-zinc-950/80 border transition-all ${
                      proposal.status === 'executed' 
                        ? 'border-indigo-950/40 opacity-75' 
                        : proposal.status === 'passed' 
                        ? 'border-emerald-900/65 shadow-[0_0_12px_-4px_rgba(16,185,129,0.15)] shadow-emerald-900/10'
                        : 'border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    {/* Header tags */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-purple-400 flex items-center gap-1">
                        {proposal.id}
                        <span className="text-[9px] text-zinc-500 font-sans font-normal">• [параметр: {String(proposal.field)}]</span>
                      </span>

                      {/* Status pill */}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold border ${
                        proposal.status === 'active'
                          ? 'border-amber-900/40 bg-amber-950/20 text-amber-500 animate-pulse'
                          : proposal.status === 'passed'
                          ? 'border-emerald-900/50 bg-emerald-950/20 text-emerald-400'
                          : proposal.status === 'executed'
                          ? 'border-indigo-900 bg-indigo-950/20 text-indigo-400'
                          : 'border-zinc-900 bg-zinc-950 text-zinc-500'
                      }`}>
                        {proposal.status === 'active' ? 'Активно' : proposal.status === 'passed' ? 'Решено' : 'Внедрено'}
                      </span>
                    </div>

                    <h4 className="text-zinc-100 font-bold text-xs font-sans">{proposal.title}</h4>
                    <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">{proposal.description}</p>

                    {/* Progress vote bars */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span className="text-emerald-400 font-bold">ЗА: {proposal.votesFor.toLocaleString()} SYM ({forPercent.toFixed(1)}%)</span>
                        <span className="text-red-400">ПРОТИВ: {proposal.votesAgainst.toLocaleString()} SYM ({againstPercent.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded overflow-hidden flex border border-zinc-800/40">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${forPercent}%` }} />
                        <div className="bg-red-500 h-full transition-all" style={{ width: `${againstPercent}%` }} />
                      </div>
                    </div>

                    {/* Voting controls */}
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-900/50">
                      <span className="text-[9.5px] text-zinc-500 font-mono">
                        Всего голосов: {totalVotes.toLocaleString()} / Кворум {proposal.quorum.toLocaleString()} VP
                      </span>

                      <div className="flex items-center gap-2">
                        {proposal.status === 'active' ? (
                          <>
                            <button
                              disabled={!!proposal.voted}
                              onClick={() => handleVote(proposal.id, 'for')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                                proposal.voted === 'for'
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900 cursor-not-allowed'
                                  : proposal.voted === 'against'
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30 border border-emerald-900/40 cursor-pointer'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" /> ЗА
                            </button>
                            <button
                              disabled={!!proposal.voted}
                              onClick={() => handleVote(proposal.id, 'against')}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                                proposal.voted === 'against'
                                  ? 'bg-red-950/40 text-red-400 border border-red-900 cursor-not-allowed'
                                  : proposal.voted === 'for'
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'bg-red-950/20 text-red-400 hover:bg-red-900/30 border border-red-900/40 cursor-pointer'
                              }`}
                            >
                              ПРОТИВ
                            </button>
                          </>
                        ) : proposal.status === 'passed' ? (
                          <button
                            onClick={() => handleExecute(proposal)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-3 py-1.5 rounded text-[10px] uppercase font-sans tracking-wide cursor-pointer flex items-center gap-1 shadow-md hover:shadow-purple-700/30 transition-all"
                          >
                            <Sliders className="w-3 h-3" /> Применить в сеть
                          </button>
                        ) : (
                          <span className="text-[10px] text-indigo-400 font-mono font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Выполнено on-chain
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create custom network proposal */}
          <div className="lg:col-span-4 bg-zinc-950 rounded-lg p-4 border border-zinc-900 space-y-4 self-start">
            <div className="border-b border-zinc-900 pb-2 flex items-center gap-1">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h4 className="text-zinc-200 font-bold text-xs">Новое предложение (DAO Proposal)</h4>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[9.5px] text-zinc-500 uppercase font-mono block">Название коррекции</label>
                <input 
                  type="text" 
                  name="pTitle"
                  required
                  placeholder="Пример: Снижение издержек репутации..." 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] text-zinc-500 uppercase font-mono block">Криптоэкономический параметр</label>
                <select 
                  name="pField"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="slashingPenalty">slashingPenalty (Коэффициент штрафа)</option>
                  <option value="rewardPerPuzzle">rewardPerPuzzle (Награда за аудит)</option>
                  <option value="puzzleRate">puzzleRate (Частота блоков-пазлов)</option>
                  <option value="verificationCost">verificationCost (Вычислительный газ)</option>
                  <option value="networkLatencyMs">networkLatencyMs (Тайм-аут задержки)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] text-zinc-500 uppercase font-mono block font-sans">Целевое значение на замену</label>
                <input 
                  type="number" 
                  step="any"
                  name="pValue"
                  required
                  placeholder="Целое число или коэффициент типа 0.05" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] text-zinc-500 uppercase font-mono block">Краткое экономическое обоснование</label>
                <textarea 
                  name="pDesc"
                  required
                  rows={2}
                  placeholder="Как регулирование параметра повлияет на Verifier's Dilemma?" 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-purple-500 leading-tight"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-850 text-purple-400 border border-purple-900/30 hover:border-purple-800 font-bold py-2 rounded text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1"
              >
                Создать и внести голосование
              </button>
            </form>

            <div className="p-2.5 bg-purple-950/10 border border-purple-900/20 rounded text-[9.5px] leading-relaxed text-purple-300">
              <strong>Экономический компромисс:</strong> Голосуя вашей силой голоса (Voting Power), вы замораживаете соответствующий стейк SYM до окончания раунда. Честные решения окупаются стабилизацией Нэш-равновесия.
            </div>
          </div>

        </div>
      )}

      {/* 3. TAB B: LIQUID STAKING sSYM (MEV YIELD) */}
      {governanceTab === 'ssym' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-scaleUp">
          
          {/* Main Swap stakeholder component */}
          <div className="md:col-span-7 bg-zinc-950 rounded-lg p-5 border border-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4.5 h-4.5 text-purple-400" />
                <h4 className="text-zinc-200 font-bold text-xs font-sans">Ликвидный стейкинг: SYM / sSYM</h4>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded font-bold">MEV Yield: ~24.2% APY</span>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Делегируя средства в пулы ликвидности, вы получаете токен-представитель <strong className="text-purple-400 font-mono">sSYM</strong>. Он автоматически накапливает награды за аудит и защищенные комиссии прямо на вашем балансе, сохраняя полную ликвидность капитала.
            </p>

            {/* Live Swap UI */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>Отдаете (SYM)</span>
                  <span>Баланс: {userBalance.toFixed(1)} SYM</span>
                </div>
                <div className="flex bg-zinc-900 rounded p-2 border border-zinc-800 items-center">
                  <input 
                    type="number" 
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="bg-transparent text-zinc-100 font-bold text-sm flex-1 focus:outline-none font-mono"
                    placeholder="0"
                  />
                  <span className="text-xs font-bold text-zinc-400 px-2 font-mono">SYM</span>
                  <button 
                    onClick={() => setSwapAmount(userBalance.toFixed(0))}
                    className="text-[9px] bg-zinc-800 hover:bg-zinc-700 font-bold text-zinc-300 px-2 py-1 rounded tracking-wider cursor-pointer font-sans"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Dynamic conversion symbol */}
              <div className="flex justify-center -my-1">
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                  <ArrowRightLeft className="w-3 h-3 rotate-90" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>Получаете (Liquid sSYM)</span>
                  <span>Баланс sSYM: {ssymBalance.toFixed(1)}</span>
                </div>
                <div className="flex bg-zinc-900 rounded p-2.5 border border-zinc-800 items-center">
                  <span className="text-zinc-500 text-sm font-bold flex-1 font-mono">{swapAmount || '0'}</span>
                  <span className="text-xs font-bold text-purple-400 font-mono">sSYM</span>
                </div>
              </div>

              {/* Stake & unstake controls */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  onClick={handleStakeSsym}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-2.5 rounded text-xs uppercase tracking-wide transition-all shadow-md hover:shadow-purple-700/20 cursor-pointer"
                >
                  Завернуть в sSYM
                </button>
                <button
                  onClick={handleUnstakeSsym}
                  className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold py-2.5 rounded text-xs uppercase cursor-pointer"
                >
                  Развернуть (Claim All)
                </button>
              </div>
            </div>
          </div>

          {/* MEV Real-time generator stats */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-900 space-y-3.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-sans border-b border-zinc-900 pb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-400" /> Стейкинг-панель инвестора
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-900/80">
                  <span className="text-[9px] text-zinc-500 block">Размещено sSYM</span>
                  <span className="text-purple-400 font-bold font-mono text-sm">{ssymBalance.toLocaleString()} sSYM</span>
                </div>
                <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-900/80">
                  <span className="text-[9px] text-zinc-500 block">Накоплено MEV</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">+{mevEarned.toFixed(5)} SYM</span>
                </div>
              </div>

              {/* Security shield notice */}
              <div className="p-3 bg-zinc-900/80 rounded border border-zinc-900 space-y-2 text-[10.5px] leading-relaxed">
                <div className="flex gap-1.5 items-start">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-200 block">Автоматический Смарт-Аудит</strong>
                    <p className="text-zinc-400">
                      Ваш sSYM залог распределяется через IPFS DNS-реестр только проверенным верификаторам с репутационным рейтингом <strong className="text-emerald-400">&gt;95%</strong>. В случае сговора или лени нод, вы полностью застрахованы благодаря буферу Slashing-компенсации.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic live APY speed gauge */}
              <div className="bg-zinc-900/30 p-2.5 rounded border border-zinc-900/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Симуляция начисления:
                </span>
                <span className="text-emerald-400 font-bold">15x ускорение</span>
              </div>
            </div>

            {/* Simple gametheory lock check */}
            <div className="bg-purple-950/10 border border-purple-900/20 p-3 rounded-lg text-[10px] leading-relaxed text-purple-300">
              <strong>Почему 24.2%?</strong> Данный показатель складывается из комбинации базовой инфляционной монетизации (E_blocks=1.0) и возврата налога за переводы сжигания (Gas-back). Обернутые токены помогают удерживать консенсус в безопасной зоне Нэша.
            </div>
          </div>

        </div>
      )}

      {/* 4. TAB C: DECENTRALIZED DNS REGISTRY (Fid-DNS) & ERC-20 BRIDGE */}
      {governanceTab === 'dns_bridge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-scaleUp">
          
          {/* Dec DNS Directory */}
          <div className="lg:col-span-7 bg-zinc-950 rounded-lg p-4 border border-zinc-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-purple-400" />
                <h4 className="text-zinc-200 font-bold text-xs">Распределенный DNS-Реестр Валидаторов (Fid-DNS)</h4>
              </div>
              
              {/* Search query input */}
              <div className="relative">
                <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-[7.5px]" />
                <input 
                  type="text" 
                  value={dnsQuery}
                  onChange={(e) => setDnsQuery(e.target.value)}
                  placeholder="Поиск ноды / IP..." 
                  className="bg-zinc-900 rounded pl-7 pr-2.5 py-1 text-[10px] text-zinc-300 placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:border-purple-500 w-36"
                />
              </div>
            </div>

            <p className="text-[11.5px] text-zinc-400 leading-relaxed">
              В силу Phase 4, DNS-реестр жестко фиксирует IP-адреса и ключи верификаторов через мультисиг-контракты. Это блокирует хакерам внедрение узлов-фантомов во время Sybil-атак.
            </p>

            <div className="space-y-1.5 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
              {filteredDns.map(rec => (
                <div key={rec.ip} className="p-3 bg-zinc-900/50 rounded border border-zinc-900 flex items-center justify-between text-xs hover:border-zinc-800 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200 font-mono text-[11px]">{rec.ip}</span>
                      <span className="text-[10px] text-zinc-500">{rec.location}</span>
                    </div>
                    <code className="text-[10px] text-zinc-400 block font-mono bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900 w-fit">{rec.host}</code>
                    
                    {/* Falcon key representation */}
                    <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-mono">
                      <Fingerprint className="w-3 h-3 text-zinc-600" />
                      Quantum Key: {rec.quantumKey}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-right">
                      <div className="text-[10px]">
                        <span className="text-zinc-500 block uppercase font-sans text-[8px]">Fidelity рейтинг</span>
                        <strong className="text-emerald-400 font-mono">{rec.reputation}%</strong>
                      </div>
                      <div className="text-[10px]">
                        <span className="text-zinc-500 block uppercase font-sans text-[8px]">Ping (RTT)</span>
                        <strong className="text-purple-400 font-mono">{rec.latencyMs}ms</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePingRecord(rec.ip)}
                        className="text-[9px] bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 font-bold px-1.5 py-0.5 rounded font-sans cursor-pointer flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-2.5 h-2.5 text-zinc-400" /> Ping
                      </button>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        rec.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ERC-20 Bridge Claims */}
          <div className="lg:col-span-5 bg-zinc-950 rounded-lg p-5 border border-zinc-900 space-y-4 self-start">
            <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400" />
                <h4 className="text-zinc-200 font-bold text-xs font-sans">Mainnet Token Claims Portal</h4>
              </div>
              <button
                onClick={generateNewWallet}
                className="text-[9px] bg-purple-950/40 text-purple-400 hover:bg-purple-900/30 border border-purple-900/30 font-bold px-2 py-0.5 rounded transition-all cursor-pointer font-sans"
              >
                + Сгенерировать
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Выводите заработанные тестовые монеты <strong className="text-purple-400">SYM</strong> на любой ERC-20 Mainnet кошелек. Нажмите <span className="text-purple-400">"+ Сгенерировать"</span>, чтобы мгновенно получить новые Web3-ключи, или введите ваш реальный адрес вручную!
            </p>

            <div className="space-y-3 bg-zinc-900/30 p-3.5 rounded-lg border border-zinc-900 text-xs">
              
              <div className="space-y-1">
                <span className="text-zinc-500 text-[10px] uppercase font-mono block flex justify-between items-center">
                  <span>Адрес получателя (Ethereum)</span>
                  <div className="flex items-center gap-1.5">
                    {walletGenerated && <span className="text-emerald-400 font-bold font-sans text-[8px] animate-pulse">генерирован!</span>}
                    <button
                      onClick={copyAddressToClipboard}
                      className="text-[9px] text-emerald-400 hover:text-emerald-300 font-sans cursor-pointer bg-emerald-950/20 hover:bg-emerald-900/20 border border-emerald-900/20 py-0.5 px-2 rounded flex items-center gap-1 transition-all"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {addressCopied ? 'Скопировано!' : 'Скопировать'}
                    </button>
                  </div>
                </span>
                <input
                  type="text"
                  value={userErc20Address}
                  onChange={(e) => {
                    setUserErc20Address(e.target.value);
                    setWalletGenerated(false);
                  }}
                  placeholder="0x8A2f39cE..."
                  className="w-full bg-zinc-950 font-mono text-[11px] border border-zinc-900 px-2.5 py-1.5 rounded text-zinc-300 focus:outline-none focus:border-purple-600 focus:text-zinc-100"
                />
              </div>

              {walletGenerated && (
                <div className="space-y-1.5 bg-zinc-950 border border-emerald-950/50 p-2.5 rounded text-[10px] font-mono">
                  <div className="flex justify-between items-center text-zinc-500 text-[8.5px] uppercase font-semibold">
                    <span>Приватный ключ (Для импорта в Metamask)</span>
                    <button
                      onClick={copyPrivateKeyToClipboard}
                      className="text-[9px] text-purple-400 hover:text-purple-300 font-sans cursor-pointer bg-purple-950/40 hover:bg-purple-900/30 border border-purple-900/30 py-0.5 px-2 rounded flex items-center gap-1 transition-all"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      {privateKeyCopied ? 'Скопировано!' : 'Скопировать ключ'}
                    </button>
                  </div>
                  <div className="text-zinc-200 select-all p-2 bg-zinc-900/50 border border-zinc-900 rounded font-mono text-[10px] break-all leading-tight select-all">
                    {userPrivateKey}
                  </div>
                  <span className="text-[8px] text-amber-500 block leading-tight">⚠️ Сохраните приватный ключ. Не отправляйте его в реальные сети, предназначен исключительно для локальных тестов!</span>
                </div>
              )}

              <div className="space-y-1 pt-1">
                <span className="text-zinc-500 text-[10px] uppercase font-mono block">Сумма вывода (Bridge SYM)</span>
                <input 
                  type="number" 
                  value={bridgeAmount} 
                  onChange={(e) => setBridgeAmount(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 flex-1 font-mono text-xs w-full text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Progress visual tracker */}
              {bridgeStatus !== 'idle' && (
                <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900 space-y-1.5">
                  <div className="flex justify-between font-mono text-[9.5px]">
                    <span className="text-purple-400 font-bold">
                      {bridgeStatus === 'signing' ? 'Подписание Web3 ключом...' : bridgeStatus === 'proving' ? 'Генерация zk-SNARK прувера...' : 'Перевод завершен!'}
                    </span>
                    <span className="text-zinc-500">Phase 4 Bridge</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1 rounded overflow-hidden relative">
                    <div className={`bg-gradient-to-r from-purple-500 to-indigo-500 h-full ${
                      bridgeStatus === 'signing' 
                        ? 'w-1/3 animate-pulse' 
                        : bridgeStatus === 'proving' 
                        ? 'w-2/3 animate-pulse'
                        : 'w-full'
                    }`} />
                  </div>
                </div>
              )}

              {bridgeStatus === 'bridged' && (
                <div className="flex flex-col gap-1 text-[10.5px] bg-emerald-950/15 p-2 rounded border border-emerald-900/40">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Успех! Баланс кошелька ERC-20 увеличен.</span>
                  </div>
                  <span className="text-zinc-500 font-mono text-[9px] truncate">Tx: 0x6e267bca9c403...c35f</span>
                </div>
              )}

              <button
                disabled={bridgeStatus === 'signing' || bridgeStatus === 'proving'}
                onClick={handleExecuteBridge}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold py-2 rounded text-[11px] uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1 transition-all"
              >
                Исходящий мост SYM
              </button>
            </div>

            {/* Wallet balances summary */}
            <div className="p-3 bg-zinc-900/40 rounded border border-zinc-900/80 space-y-1 text-[10px] font-mono">
              <span className="text-zinc-500 uppercase block font-sans text-[8.5px] border-b border-zinc-900 pb-1 mb-1">Активы в кошельке Ethereum mainnet</span>
              <div className="flex justify-between">
                <span className="text-zinc-400">SYM ERC-20 Token:</span>
                <span className="text-indigo-400 font-bold">{walletErc20Balance.toLocaleString()} SYM-ERC20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 block truncate max-w-[200px]">Адрес: {userErc20Address.substring(0, 10)}...{userErc20Address.substring(userErc20Address.length - 8)}</span>
                <span className="text-purple-400 font-bold">{ssymBalance.toLocaleString()} sSYM</span>
              </div>
            </div>

            {/* MetaMask Token Guide */}
            <div className="bg-purple-950/10 border border-purple-900/25 p-3 rounded-lg text-[10.5px] leading-relaxed text-purple-400 mt-4 space-y-2 font-sans">
              <h5 className="font-bold text-zinc-200 text-[11px]">Характеристики импорта токена в MetaMask:</h5>
              <div className="text-zinc-400 space-y-1 text-[10px] leading-tight">
                <div>• Token Contract Address: См. сверху (Ledger реестр)</div>
                <div>• Token Symbol: <span className="font-bold text-purple-300">SYM</span> (или <span className="font-bold text-purple-300">sSYM</span>)</div>
                <div>• Decimals: <span className="font-bold text-purple-300">18</span></div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 5. TAB D: DYNAMIC STRESS-TESTING & TECHSTACK SHOWCASE */}
      {governanceTab === 'stress_stack' && (
        <div className="space-y-5 animate-scaleUp">
          
          {/* Sub-tab Navigation */}
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-900 w-fit">
            <button
              onClick={() => setStressStackSubTab('contracts')}
              className={`px-4 py-2 rounded-md text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 ${
                stressStackSubTab === 'contracts'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Code className="w-4 h-4 text-purple-200" />
              Этап 1: Инкубатор Смарт-контрактов (Разработка)
            </button>
            <button
              onClick={() => setStressStackSubTab('simulation')}
              className={`px-4 py-2 rounded-md text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-2 ${
                stressStackSubTab === 'simulation'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              Этап 2: Симулятор Нагрузки & Тех-Стэк
            </button>
          </div>

          {stressStackSubTab === 'contracts' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Side: Code Editor IDE */}
              <div className="lg:col-span-8 bg-zinc-950 rounded-lg border border-zinc-900 overflow-hidden flex flex-col h-[580px]">
                
                {/* IDE Tab Header */}
                <div className="bg-zinc-900/60 px-4 py-2 border-b border-zinc-900 flex items-center justify-between">
                  {/* File selectors */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedContract('token')}
                      className={`px-3 py-1.5 rounded text-xs font-bold font-mono border transition-all cursor-pointer ${
                        selectedContract === 'token'
                          ? 'bg-zinc-950 text-purple-400 border-purple-900/40 font-extrabold'
                          : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-transparent'
                      }`}
                    >
                      📄 SymbiosisToken.sol
                    </button>
                    <button
                      onClick={() => setSelectedContract('staking')}
                      className={`px-3 py-1.5 rounded text-xs font-bold font-mono border transition-all cursor-pointer ${
                        selectedContract === 'staking'
                          ? 'bg-zinc-950 text-purple-400 border-purple-900/40 font-extrabold'
                          : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-transparent'
                      }`}
                    >
                      📄 LiquidStakingSsym.sol
                    </button>
                    <button
                      onClick={() => setSelectedContract('consensus')}
                      className={`px-3 py-1.5 rounded text-xs font-bold font-mono border transition-all cursor-pointer ${
                        selectedContract === 'consensus'
                          ? 'bg-zinc-950 text-purple-400 border-purple-900/40 font-extrabold'
                          : 'text-zinc-500 hover:text-zinc-300 bg-transparent border-transparent'
                      }`}
                    >
                      📄 NashConsensusRegistry.sol
                    </button>
                  </div>

                  {/* Environment indicator */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">EVM Sepolia Sandbox</span>
                  </div>
                </div>

                {/* Solidity Compiler Settings Ribbon */}
                <div className="bg-zinc-900/25 px-4 py-1.5 border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span>Compiler: <strong className="text-zinc-300">solc 0.8.24</strong></span>
                    <span>Optimization: <strong className="text-emerald-400">Enable (200 runs)</strong></span>
                    <span>EVM Version: <strong className="text-zinc-350">Cancun</strong></span>
                  </div>
                  <div className="text-zinc-500">
                    Size: {contractCodes[selectedContract].length} Bytes
                  </div>
                </div>

                {/* Real-time Code Viewer */}
                <div className="flex-1 overflow-auto bg-black font-mono text-[11px] p-4 flex">
                  {/* Line Numbers */}
                  <div className="text-zinc-650 text-right pr-4 select-none border-r border-zinc-900/60 w-10">
                    {contractCodes[selectedContract].split('\n').map((_, index) => (
                      <div key={index + 1}>{index + 1}</div>
                    ))}
                  </div>
                  
                  {/* Code Block with customized coloring to mimic syntax highlighting */}
                  <pre className="pl-4 text-zinc-300 overflow-x-auto whitespace-pre font-mono leading-tight tracking-normal w-full select-text selection:bg-purple-950/55 selection:text-purple-300">
                    {contractCodes[selectedContract].split('\n').map((line, idx) => {
                      let colorClass = 'text-zinc-300';
                      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
                        colorClass = 'text-green-600/90 italic';
                      } else if (line.includes('pragma solidity') || line.includes('import') || line.includes('contract ') || line.includes('is ')) {
                        colorClass = 'text-purple-400 font-bold';
                      } else if (line.includes('constructor') || line.includes('function ') || line.includes('returns(') || line.includes('external ') || line.includes('override ')) {
                        colorClass = 'text-sky-400';
                      } else if (line.includes('event ') || line.includes('emit ')) {
                        colorClass = 'text-pink-400';
                      } else if (line.includes('require(') || line.includes('if ') || line.includes('return ')) {
                        colorClass = 'text-amber-400';
                      }
                      return (
                        <div key={idx} className={colorClass}>
                          {line || ' '}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              </div>

              {/* Right Side: IDE Actions Compiler Bench & Dev Control Panel */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                
                {/* Panel 1: Solc Compiler */}
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-900 flex flex-col gap-4">
                  <div>
                    <h5 className="text-zinc-200 font-bold text-xs flex items-center gap-1.5 font-sans">
                      <Cpu className="w-4 h-4 text-purple-450" />
                      Компилятор Solidity Contracts
                    </h5>
                    <p className="text-[10px] text-zinc-500 font-sans">Генерация байткода и ABI спецификации для Sandbox EVM</p>
                  </div>

                  {/* Status Indicator */}
                  <div className="bg-zinc-900/20 p-2.5 rounded border border-zinc-900 flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Статус:</span>
                    {isCompiling ? (
                      <span className="text-amber-500 font-bold font-mono animate-pulse flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Компиляция {compilationProgress}%
                      </span>
                    ) : compiledContracts.includes(selectedContract) ? (
                      <span className="text-emerald-400 font-bold font-mono flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 border border-emerald-900 rounded-full p-0.5 bg-emerald-950/40" /> Скомпилирован
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-bold font-mono">Не скомпилирован</span>
                    )}
                  </div>

                  {/* Compilation Console Output Terminal */}
                  {compilationLogs.length > 0 && (
                    <div className="bg-black/99 border border-zinc-900 rounded p-2.5 font-mono text-[9.5px] text-zinc-400 space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                      {compilationLogs.map((log, index) => {
                        const isSuccess = log && typeof log === 'string' && (log.includes('Успешно') || log.includes('завершена') || log.includes('Успех'));
                        return (
                          <div key={index} className={isSuccess ? 'text-emerald-400' : 'text-zinc-400'}>
                            {log}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    disabled={isCompiling}
                    onClick={handleCompileContract}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold py-2 rounded text-[11px] uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
                    Компилировать {selectedContract === 'token' ? 'SymbiosisToken.sol' : selectedContract === 'staking' ? 'LiquidStakingSsym.sol' : 'NashConsensusRegistry.sol'}
                  </button>
                </div>

                {/* Panel 2: Sandbox Deployment Control */}
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-900 flex flex-col gap-4">
                  <div>
                    <h5 className="text-zinc-200 font-bold text-xs flex items-center gap-1.5 font-sans">
                      <Zap className="w-4 h-4 text-purple-400" />
                      Развертывание (Deploy) в Сети
                    </h5>
                    <p className="text-[10px] text-zinc-500 font-sans">Симуляция монтирования с подписью приватного ключа</p>
                  </div>

                  {/* Account source address */}
                  <div className="bg-zinc-900/25 p-2.5 rounded border border-zinc-900 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500">Адрес автора деплоя:</span>
                      <span className="text-zinc-450 font-mono text-[9px] truncate max-w-[120px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 select-all">{userErc20Address}</span>
                    </div>

                    {!walletGenerated ? (
                      <div className="flex justify-between items-center bg-zinc-950/80 p-2 rounded border border-zinc-900 text-[10px] gap-2">
                        <span className="text-zinc-500 leading-tight">Используется по умолчанию. Сгенерировать новый Web3-ключ?</span>
                        <button
                          onClick={generateNewWallet}
                          className="bg-purple-950 text-purple-400 hover:bg-purple-900 border border-purple-900/30 px-2 py-1 rounded text-[9.5px] cursor-pointer shrink-0 font-bold whitespace-nowrap"
                        >
                          Создать ключ
                        </button>
                      </div>
                    ) : (
                      <div className="text-[9.5px] text-emerald-400 bg-emerald-950/15 p-1.5 rounded border border-emerald-900/30 font-semibold leading-tight">
                        • Тестовый ключ сгенерирован локально и готов к подписи деплоя.
                      </div>
                    )}
                  </div>

                  {/* Deployment requirements checker */}
                  <div className="text-[10px] font-mono text-zinc-500 space-y-1">
                    <div className="flex justify-between"><span className="text-zinc-500">EVM Sandbox Gas Price:</span> <span className="text-zinc-300 font-bold">{gasPrice} Gwei</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Gas Limit (Est):</span> <span className="text-zinc-300">1,245,612 SYM-gas</span></div>
                  </div>

                  {/* Deploy trigger / warning */}
                  {!compiledContracts.includes(selectedContract) ? (
                    <div className="text-center p-3 bg-zinc-900/30 border border-zinc-900/50 text-zinc-550 rounded text-[10px] leading-relaxed">
                      ⚠️ Сначала скомпилируйте контракт во вкладке выше, чтобы развернуть байткод на Sandbox Node!
                    </div>
                  ) : (
                    <button
                      disabled={isDeploying}
                      onClick={handleDeployContract}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-2 rounded text-[11px] uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 transition-all text-center animate-pulse"
                    >
                      {isDeploying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Деплой в сеть...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-yellow-300" />
                          Развернуть {selectedContract === 'token' ? 'SymbiosisToken' : selectedContract === 'staking' ? 'LiquidStakingSsym' : 'NashConsensusRegistry'}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Panel 3: Deployed Contracts Registry */}
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-900 flex-1 flex flex-col gap-3 min-h-[220px]">
                  <div>
                    <h5 className="text-zinc-200 font-bold text-xs flex items-center gap-1.5 font-sans">
                      <Terminal className="w-4 h-4 text-emerald-450" />
                      Реестр Развернутых Контрактов (EVM Ledger)
                    </h5>
                    <p className="text-[10px] text-zinc-500 font-sans">Все активные контракты децентрализованного стэка</p>
                  </div>

                  {/* Registry interactive rows */}
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] custom-scrollbar pr-1">
                    {deployedContracts.map((cnt, i) => (
                      <div key={cnt.address + '-' + i} className="p-2.5 bg-zinc-900/40 rounded border border-zinc-900 space-y-1">
                        <div className="flex justify-between items-center text-[10.5px]">
                          <span className="text-purple-400 font-bold font-mono">{cnt.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">{cnt.date}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-400 bg-black/40 p-1.5 rounded border border-zinc-900/60">
                          <span className="truncate max-w-[170px] text-emerald-400 font-mono">Address: {cnt.address}</span>
                          <button
                            onClick={() => {
                              copyToClipboard(cnt.address);
                              setCopiedAddress(cnt.address);
                              addLog(`📋 Адрес контракта ${cnt.name} скопирован: ${cnt.address}`);
                              setTimeout(() => setCopiedAddress(null), 2000);
                            }}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 bg-transparent border-0 cursor-pointer"
                          >
                            {copiedAddress === cnt.address ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-650 block truncate">TxHash: {cnt.txHash}</span>
                      </div>
                    ))}
                  </div>

                  {/* MetaMask import notice badge */}
                  <div className="p-2 bg-purple-950/15 border border-purple-900/35 text-purple-400 rounded text-[9px] leading-relaxed font-sans">
                    💡 <strong>MetaMask импорт:</strong> Скопируйте любой адрес контракта выше и импортируйте его как "Custom Token" во внутреннем кабинете кошелька MetaMask (Decimals: 18)!
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Live Stress-Test Bench */}
              <div className="lg:col-span-12 xl:col-span-7 bg-zinc-950 rounded-lg p-5 border border-zinc-900 space-y-4 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-3 gap-2">
                  <div>
                    <h4 className="text-zinc-200 font-bold text-xs flex items-center gap-1.5 font-sans justify-start">
                      <Zap className={`w-4 h-4 shrink-0 ${isStressTesting ? "text-amber-500 animate-spin" : "text-purple-400"}`} />
                      Стресс-Тестирование Максимальной Нагрузки
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-sans">Флуд мемпула транзакциями для тестирования пропускной способности Falcon-Proof</p>
                  </div>

                  {/* Toggle stress trigger */}
                  <button
                    onClick={() => setIsStressTesting(!isStressTesting)}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider ${
                      isStressTesting
                        ? "bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900/30 font-extrabold animate-pulse"
                        : "bg-amber-950/40 text-amber-500 border border-amber-900/40 hover:bg-amber-900/30"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isStressTesting ? "animate-spin" : ""}`} />
                    {isStressTesting ? 'Остановить Тест' : 'Запустить Стресс-Тест'}
                  </button>
                </div>

                {/* Live Stats Indicators Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-900/40 p-3 rounded border border-zinc-900 flex flex-col justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase font-sans">Нагрузка сети</span>
                    <span className={`font-mono text-base font-bold transition-colors ${isStressTesting ? "text-amber-400" : "text-zinc-500"}`}>
                      {isStressTesting ? `${stressTps.toLocaleString()} TPS` : '12 TPS'}
                    </span>
                    <span className="text-[8px] text-zinc-650 block mt-1">Пропускная скорость</span>
                  </div>

                  <div className="bg-zinc-900/40 p-3 rounded border border-zinc-900 flex flex-col justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase font-sans">CPU Валидаторов</span>
                    <div>
                      <span className={`font-mono text-base font-bold block transition-colors ${isStressTesting ? "text-amber-500" : "text-emerald-400"}`}>
                        {cpuLoad}%
                      </span>
                      <div className="w-full bg-zinc-950 h-1 rounded overflow-hidden mt-1">
                        <div 
                          className={`h-full transition-all duration-500 ${isStressTesting ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${cpuLoad}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-900 flex flex-col justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase font-sans">Плата за газ (Gas)</span>
                    <span className="font-mono text-base font-bold text-zinc-300">
                      {gasPrice} <span className="text-[9.5px] text-zinc-650">Gwei</span>
                    </span>
                    <span className="text-[8px] text-zinc-650 block mt-1">Recycled Gas-back</span>
                  </div>

                  <div className="bg-zinc-900/40 p-2.5 rounded border border-zinc-900 flex flex-col justify-between">
                    <span className="text-[9px] text-zinc-500 uppercase font-sans">Сбои консенсуса</span>
                    <span className="font-mono text-base font-bold text-emerald-400">
                      0% <span className="text-[9.5px] text-zinc-650">faults</span>
                    </span>
                    <span className="text-[8px] text-zinc-650 block mt-1">100% защита Нэша</span>
                  </div>
                </div>

                {/* Live Block Compiler Stream Console */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-sans">
                    Терминал подтверждения транзакций (Fid-Terminal)
                  </span>

                  <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-900 font-mono text-[10.5px] space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                    {!isStressTesting ? (
                      <div className="text-zinc-600 text-center py-6">
                        <p className="font-sans">Режим ожидания. Реестр Fid-DNS работает на базовых нагрузках.</p>
                        <button
                          onClick={() => setIsStressTesting(true)}
                          className="mt-1.5 text-[10px] text-purple-400 hover:underline cursor-pointer bg-transparent border-0"
                        >
                          Инициировать флуд мемпула сейчас ➜
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-amber-500 font-sans font-bold leading-normal border-b border-zinc-900 pb-1.5 flex items-center gap-1.5 justify-start">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                          Стресс-тест запущен: Симуляция 1200+ транзакций в секунду...
                        </div>
                        {stressBlocks.map((blk, i) => (
                          <div key={blk.number + '-' + i} className="flex justify-between items-center text-[10px] border-b border-zinc-900/50 pb-1">
                            <span className="text-purple-400 font-bold">Block #{blk.number.toLocaleString()}</span>
                            <span className="text-zinc-400">Size: {(blk.sizeKb / 1024).toFixed(2)} MB</span>
                            <span className="text-emerald-400 font-bold">{blk.tps} txs/s</span>
                            <span className="text-zinc-500 truncate max-w-[80px]">{blk.validator}</span>
                            <span className="text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-1 py-0.2 rounded text-[8.5px] font-sans">
                              {blk.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stress Test explanation */}
                <div className="p-2.5 bg-amber-950/10 border border-amber-900/20 rounded-lg text-[10.5px] leading-relaxed text-amber-500">
                  <strong>Поведение Нэш-Блокировки под нагрузкой:</strong> При экстремальном наплыве транзакций вознаграждение за аудит автоматически увеличивается за счет динамического сжигания комиссий. Это мотивирует ноды активнее задействовать криптографические ловушки (red-herrings) для предотвращения ленивых подписей!
                </div>
              </div>

              {/* Technology Stack Bento Grid */}
              <div className="lg:col-span-12 xl:col-span-5 bg-zinc-950 rounded-lg p-5 border border-zinc-900 space-y-4">
                <div className="border-b border-zinc-900 pb-2">
                  <h4 className="text-zinc-200 font-bold text-xs flex items-center gap-1.5 font-sans justify-start">
                    <Cpu className="w-4 h-4 text-purple-450" />
                    Технологический Стэк Symbiosis
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-sans">Криптографические и распределенные компоненты ядра блокчейна</p>
                </div>

                <div className="space-y-3 font-mono text-xs max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                  {/* Stack Item 1 */}
                  <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded hover:border-zinc-800 transition-colors">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-bold font-sans text-xs mb-1">
                      <span className="w-4 h-4 bg-purple-950 text-purple-400 border border-purple-900/30 text-[9px] font-bold rounded flex items-center justify-center">1</span>
                      Игры Равновесия Нэша
                    </div>
                    <p className="text-[10.5px] text-zinc-400 leading-tight font-sans">
                      Предотвращает <strong className="text-zinc-300">Dilemma Verifier's</strong> через автоматическую инжекцию интерактивных блоков-ловушек. Ноды вынуждены реально валидировать каждый блок для сохранения своего залога.
                    </p>
                  </div>

                  {/* Stack Item 2 */}
                  <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded hover:border-zinc-800 transition-colors">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-bold font-sans text-xs mb-1">
                      <span className="w-4 h-4 bg-purple-950 text-purple-400 border border-purple-900/30 text-[9px] font-bold rounded flex items-center justify-center">2</span>
                      Пост-Квантовые Подписи (Falcon)
                    </div>
                    <p className="text-[10.5px] text-zinc-400 leading-tight font-sans">
                      Разделение ключей нод консенсуса сгенерировано на базе кольцевых решеток Falcon. Это защищает реестры транзакций от будущих атак квантовых суперкомпьютеров.
                    </p>
                  </div>

                  {/* Stack Item 3 */}
                  <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded hover:border-zinc-800 transition-colors">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-bold font-sans text-xs mb-1">
                      <span className="w-4 h-4 bg-purple-950 text-purple-400 border border-purple-900/30 text-[9px] font-bold rounded flex items-center justify-center">3</span>
                      Fid-DNS Реестр на базе IPFS
                    </div>
                    <p className="text-[10.5px] text-zinc-400 leading-tight font-sans">
                      Децентрализованное распределение сетевых сокетов нод, верифицируемое через IPFS Merkle-деревья. Блокирует Sybil-атаки на корневые маршруты.
                    </p>
                  </div>

                  {/* Stack Item 4 */}
                  <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded hover:border-zinc-800 transition-colors">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-bold font-sans text-xs mb-1">
                      <span className="w-4 h-4 bg-purple-950 text-purple-400 border border-purple-900/30 text-[9px] font-bold rounded flex items-center justify-center">4</span>
                      zk-SNARK Кросс-чейн Мосты
                    </div>
                    <p className="text-[10.5px] text-zinc-405 leading-tight font-sans">
                      Интеграционный мост с Ethereum Mainnet использует PLONK-доказательства с нулевым разглашением. Конвертирует SYM в стандартный ERC-20 смарт-контракт без раскрытия балансов.
                    </p>
                  </div>

                  {/* Stack Item 5 */}
                  <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded hover:border-zinc-800 transition-colors">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-bold font-sans text-xs mb-1">
                      <span className="w-4 h-4 bg-purple-950 text-purple-400 border border-purple-900/30 text-[9px] font-bold rounded flex items-center justify-center">5</span>
                      Sentinel AI Guard
                    </div>
                    <p className="text-[10.5px] text-zinc-400 leading-tight font-sans">
                      Агент машинного обучения, анализирующий структуру мемпула. Выявляет скоординированные Sybil-силуэты и упреждает атаки двойного расходования.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
