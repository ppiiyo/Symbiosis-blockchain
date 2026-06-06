import React, { useState } from 'react';
import { 
  Vote, 
  Coins, 
  Award, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Check,
  Shield,
  Lock,
  Activity,
  ChevronRight,
  ShieldCheck,
  FileText,
  AlertOctagon,
  Wrench,
  Cpu,
  BadgeAlert
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
  patchedVulnerabilities?: { [id: string]: boolean };
  onTogglePatch?: (id: string) => void;
  onToggleAllPatches?: (value: boolean) => void;
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

interface AuditFinding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  contract: string;
  description: string;
  codeVulnerable: string;
  codePatched: string;
  remediation: string;
}

// 10 Detailed Smart Contract Audit Findings representing real Security Exploits in Symbiosis Node Ecosystem
const auditFindingsList: AuditFinding[] = [
  {
    id: "unrestricted_slashing",
    title: "1. Неограниченный слэшинг (Unrestricted Slashing)",
    severity: "critical",
    contract: "NashConsensusRegistry.sol",
    description: "Любой адрес на блокчейне может запустить triggerLazySlashing() на любом валидаторе без предоставления каких-либо криптографических доказательств саботажа (двойной подписи или ZK-пруфа) и присвоить себе 7.5% от его залога под видом whistleblower награды.",
    codeVulnerable: `function triggerLazySlashing(address guiltyNode, address whistleblower, uint256 blockNumber) external {
    ValidatorNode storage v = validators[guiltyNode];
    require(!v.isSlashed, "Node is already slashed");
    
    uint256 penalty = (v.stakedAmount * SLASH_PENALTY_PERCENT) / 100;
    v.stakedAmount -= penalty;
    v.isSlashed = true;
    
    symToken.burn(penalty / 2);
    symToken.transfer(whistleblower, penalty / 2);
}`,
    codePatched: `// 🛡️ REMEDIATION: Enforce cryptographic proofs of validation failure or double signing
function triggerLazySlashing(
    address guiltyNode, 
    address whistleblower, 
    uint256 blockNumber, 
    bytes32 doubleSignHeader1, 
    bytes memory sig1,
    bytes32 doubleSignHeader2,
    bytes memory sig2
) external {
    require(verifyFalconSignature(guiltyNode, doubleSignHeader1, sig1), "Invalid signature 1");
    require(verifyFalconSignature(guiltyNode, doubleSignHeader2, sig2), "Invalid signature 2");
    require(doubleSignHeader1 != doubleSignHeader2, "Identical block headers are not double signing");
    
    // Proceed to slashing safely after double signature proof validation...
}`,
    remediation: "Добавить требование двух конфликтующих сигнатур валидатора на одной высоте блока (Double-Signing Proof) или ограничить вызов только верифицированным ZK-реестром провайдера."
  },
  {
    id: "mock_signature",
    title: "2. Заглушка проверки PQ-подписей (Falcon Signature Mock)",
    severity: "critical",
    contract: "NashConsensusRegistry.sol",
    description: "Реализация verifyFalconSignature() содержит дыру: любая подпись длиной ровно 99 байт автоматически возвращает true, минуя математические проверки на решётках NTRU. Злоумышленник может слать подделки на блоки.",
    codeVulnerable: `function verifyFalconSignature(address validator, bytes32 /* blockHash */, bytes memory signature) public view returns (bool) {
    require(signature.length >= 64 || signature.length == 99, "Invalid Falcon length");
    
    // Dynamic mock/simulation check bypass
    if (signature.length == 99) {
        return true;
    }
    ...
}`,
    codePatched: `// 🛡️ REMEDIATION: Enforce proper chainID checking to restrict test stubs solely to Hardhat local environment
function verifyFalconSignature(address validator, bytes32 blockHash, bytes memory signature) public view returns (bool) {
    if (signature.length == 99) {
        require(block.chainid == 31337 || block.chainid == 1337, "Mock stubs strictly disabled in production");
        return true;
    }
    
    // Fallback to real cryptographical assembly verify precompile contract
    return executeFalconPrecompileAssembly(validator, blockHash, signature);
}`,
    remediation: "Изолировать стабы проверок строго по идентификатору тестовой цепочки (block.chainid == 31337) и полностью вырезать обход проверки 99-байтных заглушек на публичных L2 сетях."
  },
  {
    id: "privilege_escalation",
    title: "3. Незащищенный захват реестра ZK (Registry Privilege Escalation)",
    severity: "critical",
    contract: "LiquidStakingSsym.sol",
    description: "Каждый пользователь может вызвать функцию updateZkProver() при ее начальном значении address(0) и присвоить себе права ZK Prover контроля. Это откроет перед враждебным узлом возможность манипулировать защитными ордерами стейков.",
    codeVulnerable: `function updateZkProver(address newRegistry) external {
    require(zkProverRegistry == address(0) || msg.sender == zkProverRegistry, "Unauthorized");
    zkProverRegistry = newRegistry;
}`,
    codePatched: `// 🛡️ REMEDIATION: Restrict initial deployment or registry definition to authorized Governance proposals
function updateZkProver(address newRegistry) external {
    require(msg.sender == zkProverRegistry || symToken.isGovernor(msg.sender), "Caller is not the Prover or Governor");
    require(newRegistry != address(0), "New registry cannot be zero address");
    zkProverRegistry = newRegistry;
}`,
    remediation: "Инициализировать zkProverRegistry в конструкторе или ограничить начальный updateZkProver() вызовом только со стороны зарегистрированного мультисига губернаторов (isGovernor)."
  },
  {
    id: "first_depositor",
    title: "4. Инфляционная атака первого вкладчика (First Depositor Inflation)",
    severity: "critical",
    contract: "LiquidStakingSsym.sol",
    description: "Первый инвестор вносит 1 wei в стейкинг и получает 1 долю (share) sSYM. Затем он отправляет напрямую 100 000 SYM контрактному адресу LiquidStakingSsym. Огромное соотношение SYM/Shares превращает каждую следующую небольшую инвестицию (например, 50 000 SYM) в 0 долей при делении. Новые вклады превращаются в чистую прибыль злоумышленника.",
    codeVulnerable: `uint256 sharesToMint;
if (totalShares == 0 || totalSym == 0) {
    sharesToMint = amount;
} else {
    sharesToMint = (amount * totalShares) / totalSym;
}
_mint(msg.sender, sharesToMint);`,
    codePatched: `// 🛡️ REMEDIATION: Burn first 1000 shares to make pools mathematically immune to inflation attacks
uint250 constant MINIMUM_LIQUIDITY = 1000;

if (totalShares == 0) {
    _mint(address(0), MINIMUM_LIQUIDITY); // Permanent burn of initial shares
    sharesToMint = amount - MINIMUM_LIQUIDITY;
} else {
    sharesToMint = (amount * totalShares) / totalSym;
}
require(sharesToMint > 0, "Shares amount cannot be zero to avoid rounding donation exploits");`,
    remediation: "Реализовать постоянное сжигание первых 1000 долей (MINIMUM_LIQUIDITY) на адрес address(0) при первичной инициализации пула (как в Uniswap V2) и блокировать транзакции с возвратом 0 акций."
  },
  {
    id: "gas_recycling",
    title: "5. Уязвимость манипуляции утилизацией газа (Gas Recycling Exploits)",
    severity: "high",
    contract: "SymbiosisToken.sol",
    description: "Функция recycleGas производит расчет возврата токенов SYM на основе переданного аргумента gasUsed. Мультисиг-валидаторы могут на коленке передавать огромные фиктивные значения gasUsed, бесконтрольно опустошая пул казначейства.",
    codeVulnerable: `function recycleGas(address validator, uint256 gasUsed) external {
    require(msg.sender == consensusRegistry, "Only Consensus Registry can trigger recycling");
    uint256 refundAmount = (gasUsed * tx.gasprice * gasBackPercentage) / 100;
    uint256 maxRefund = 5000 * 10**18;
    if (refundAmount > maxRefund) refundAmount = maxRefund;
    
    _transfer(address(this), validator, refundAmount);
}`,
    codePatched: `// 🛡️ REMEDIATION: Set validator recycle rate limit intervals and validate true gas parameters in block
mapping(address => uint256) public lastRecycledBlock;

function recycleGas(address validator, uint256 gasUsed) external {
    require(msg.sender == consensusRegistry, "Only Consensus Registry can trigger recycling");
    require(block.number >= lastRecycledBlock[validator] + 12, "Rebate rate limit active! Once per 12 blocks.");
    require(gasUsed <= tx.gaslimit, "Manipulated gasUsed value exceeds tx.gaslimit range");
    
    lastRecycledBlock[validator] = block.number;
    uint256 refundAmount = (gasUsed * tx.gasprice * gasBackPercentage) / 100;
    // transfer logic...
}`,
    remediation: "Внедрить лимиты по интервалам блоков на утилизацию у каждого узла (rate limiting), осуществлять перепроверку gasUsed относительно реального tx.gaslimit текущей транзакции."
  },
  {
    id: "withdrawal_exit",
    title: "6. Отсутствие вывода залога валидаторов (Missing Validator Stake Exit)",
    severity: "high",
    contract: "NashConsensusRegistry.sol",
    description: "В контракте отсутствует интерфейс для добровольного анстейкинга залога (100+ SYM) валидаторов. Заложенные токены остаются заблокированными на балансе реестра навечно независимо от работоспособности.",
    codeVulnerable: `// No withdraw validator stake, unstake collateral or exit queue functions found in contracts.`,
    codePatched: `// 🛡️ REMEDIATION: Implement safe two-step exit queue with a delay (Unbonding Period)
mapping(address => uint256) public unbondingEta;

function initiateValidatorExit() external {
    require(validators[msg.sender].stakedAmount > 0, "No active stake available");
    require(!validators[msg.sender].isSlashed, "Slashed nodes cannot withdraw collateral");
    unbondingEta[msg.sender] = block.timestamp + 7 days; // 7-day safety delay
}

function withdrawValidatorStaking() external {
    require(unbondingEta[msg.sender] > 0 && block.timestamp >= unbondingEta[msg.sender], "Unbonding delay is active");
    uint256 amount = validators[msg.sender].stakedAmount;
    validators[msg.sender].stakedAmount = 0;
    symToken.transfer(msg.sender, amount);
}`,
    remediation: "Внедрить механизм двухэтапной разблокировки (Unbonding Queue) с периодом ожидания 7 дней. Это даст время другим узлам обнаружить скрытые атаки до ухода средств."
  },
  {
    id: "proposal_limits",
    title: "7. Избыточный спам предложений казначейства (Infinite Proposal Creation)",
    severity: "medium",
    contract: "SymbiosisToken.sol",
    description: "Один привилегированный губернатор может спамить неограниченным объемом DAO-предложений, засоряя память блокчейна и подменяя целевой реестр вызовов без системы защиты от наводнения.",
    codeVulnerable: `function proposeAction(string memory _actionType, address _target) external onlyGovernor returns (uint256) {
    uint250 eta = block.timestamp + TIMELOCK_DELAY;
    proposals.push(Proposal({ ... }));
    ...
}`,
    codePatched: `// 🛡️ REMEDIATION: Prevent spam by enforcing active concurrent proposal limits per Governor
mapping(address => uint256) public activeProposalsCount;

function proposeAction(string memory _actionType, address _target) external onlyGovernor returns (uint256) {
    require(activeProposalsCount[msg.sender] < 2, "Governor has too many concurrent proposals open");
    activeProposalsCount[msg.sender]++;
    // Create proposal and record to chain...
}`,
    remediation: "Установить лимит на одновременное нахождение в кворуме не более 2 активных предложений от одного губернатора, а также добавить вето-кнопку для мгновенного отзывного голосования."
  },
  {
    id: "token_rescuing",
    title: "8. Отсутствие функции спасения токенов (Missing Rescue Token Trap)",
    severity: "medium",
    contract: "NashConsensusRegistry.sol",
    description: "Любой ERC20-токен (включая сторонние стейблкоины USDT/USDC), который пользователь случайно переведет на адрес реестра консенсуса, будет заморожен из-за отсутствия функций rescuing.",
    codeVulnerable: `// No rescueERC20, claimLockedToken or withdrawLockedAssets methods exist in NashConsensusRegistry.sol`,
    codePatched: `// 🛡️ REMEDIATION: Safe rescue module restricted to multi-sig governorship
function rescueERC20(address tokenAddress, uint256 amount) external {
    require(symToken.isGovernor(msg.sender), "Caller is not authorized to rescue");
    require(tokenAddress != address(symToken), "Cannot rescue Symbiosis collateral tokens");
    
    IERC20(tokenAddress).transfer(msg.sender, amount);
}`,
    remediation: "Имплементировать защищенную функцию rescueERC20() под управлением мультисиг-говернанса, исключая возможность вывода коинов залога SYM."
  },
  {
    id: "zero_governors",
    title: "9. Угроза парализации DAO (Zero Governor Freeze Risk)",
    severity: "low",
    contract: "SymbiosisToken.sol",
    description: "Логика updateGovernor позволяет беспрепятственно деактивировать любого губернатора при одобрении DAO. При халатном голосовании можно выключить последнего губернатора, заморозив всю сеть управления навечно.",
    codeVulnerable: `} else if (keccak256(bytes(prop.actionType)) == keccak256(bytes("updateGovernor"))) {
    isGovernor[prop.targetAddress] = !isGovernor[prop.targetAddress];
}`,
    codePatched: `} else if (keccak256(bytes(prop.actionType)) == keccak256(bytes("updateGovernor"))) {
    if (isGovernor[prop.targetAddress]) {
        require(getGovernorsCount() > 2, "Cannot remove governor: minimum 2 active governors threshold required");
        isGovernor[prop.targetAddress] = false;
    } else {
        isGovernor[prop.targetAddress] = true;
    }
}`,
    remediation: "Добавить валидацию счетчика активных губернаторов (активных членов мультисига должно быть не менее 2), запретив полное уничтожение судейской коллегии DAO."
  },
  {
    id: "reentrancy",
    title: "10. Нарушение паттерна Checks-Effects-Interactions (Reentrancy Risks)",
    severity: "low",
    contract: "LiquidStakingSsym.sol",
    description: "В методе unstake() списание акций доли sSYM и отправка токенов SYM производятся после расчетов, не вовлекая превентивный Checks-Effects-Interactions (сначала обновляем стейт, далее переводим средства).",
    codeVulnerable: `uint253 symToReturn = (shares * totalSym) / totalShares;
_burn(msg.sender, shares);
symToken.transfer(msg.sender, symToReturn);`,
    codePatched: `// 🛡️ REMEDIATION: strictly adhere to Checks-Effects-Interactions code safety order
uint256 symToReturn = (shares * totalSym) / totalShares;

// 1. Effects: update local contract balances FIRST!
_burn(msg.sender, shares);

// 2. Interactions: perform external output token transfers LAST!
symToken.safeTransfer(msg.sender, symToReturn);`,
    remediation: "Осуществлять сжигание _burn() акций строго до начала вызова symToken.transfer(), предотвращая взломы через кастомные коллбеки токенов ERC-777."
  }
];

export const GovernanceDaoHub: React.FC<GovernanceDaoHubProps> = ({
  nodes,
  config,
  onChangeConfig,
  userStakedNodes,
  userBalance,
  onChangeUserBalance,
  addLog,
  patchedVulnerabilities = {},
  onTogglePatch,
  onToggleAllPatches
}) => {
  const [governanceTab, setGovernanceTab] = useState<'dao' | 'compliance'>('dao');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  
  // Voting power calculated dynamically from sSYM delegated stake + standard balance weight
  const totalStake = Object.values(userStakedNodes).reduce((sum: number, val: any) => sum + (val || 0), 0) as number;
  const votingPower = Math.round(1000 + totalStake);

  // High fidelity default proposals coordinating simulation configuration pivots
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: "pro-1",
      title: "SIP-01: Увеличение штрафа за ленивое подписание",
      description: "Увеличить штраф за слепую подпись фальшивых Red-Herring блоков (slashingPenalty) с текущего значения до 1200 SYM. Это математически заставит рациональные узлы вернуться к проверке байткода.",
      field: "slashingPenalty",
      targetValue: 1200,
      votesFor: 450000,
      votesAgainst: 120000,
      status: 'active',
      quorum: 500000
    },
    {
      id: "pro-2",
      title: "SIP-02: Корректировка частоты вброса Red-Herring задач",
      description: "Настроить частоту генерации тестовых задач (puzzleRate) до 5% от общих блоков сети, снижая накладные расходы при стабильной безопасности пиринга.",
      field: "puzzleRate",
      targetValue: 0.05,
      votesFor: 620000,
      votesAgainst: 18000,
      status: 'passed',
      quorum: 500000
    },
    {
      id: "pro-3",
      title: "SIP-03: Масштабирование размера компенсации за нахождение проверки",
      description: "Повысить награду за ручное верифицирование скрытных ловушек (rewardPerPuzzle) до 45 токенов SYM, укрепляя доминирование честных валидаторов в кастомном OP Stack пуле.",
      field: "rewardPerPuzzle",
      targetValue: 45,
      votesFor: 0,
      votesAgainst: 0,
      status: 'active',
      quorum: 500000
    }
  ]);

  const handleVote = (proposalId: string, support: 'for' | 'against') => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal || proposal.status !== 'active' || proposal.voted) return;

    addLog(`🗳️ Проголосовано за предложение №${proposal.id}. Отдано ${votingPower.toLocaleString()} голосов за [${support === 'for' ? 'ОДОБРЕНИЕ' : 'ОТКЛОНЕНИЕ'}].`);

    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      
      const updatedFor = support === 'for' ? p.votesFor + votingPower : p.votesFor;
      const updatedAgainst = support === 'against' ? p.votesAgainst + votingPower : p.votesAgainst;
      
      // Determine if quorum achieved and passing
      let nextStatus = p.status;
      if (updatedFor + updatedAgainst >= p.quorum) {
         nextStatus = updatedFor > updatedAgainst ? 'passed' : 'defeated';
      }

      return {
        ...p,
        votesFor: updatedFor,
        votesAgainst: updatedAgainst,
        voted: support,
        status: nextStatus
      };
    }));
  };

  const handleExecute = (proposalId: string) => {
    const p = proposals.find(prop => prop.id === proposalId);
    if (!p || p.status !== 'passed') return;

    // Dynamically execute proposal to influence the core simulator parameters
    const nextConfig = { ...config, [p.field]: p.targetValue };
    onChangeConfig(nextConfig);

    setProposals(prev => prev.map(prop => {
      if (prop.id === proposalId) {
        return { ...prop, status: 'executed' };
      }
      return prop;
    }));

    addLog(`⚙️ УСПЕШНО ВЫПОЛНЕНО: Изменения по KPI предложению '${p.title}' внедрены в реестр нод! Поле '${p.field}' обновлено до ${p.targetValue}.`);
  };

  // Safe validation checkpoint indicators (Standard Security Matrix)
  const complianceChecklist = [
    { title: "Защита от Reentrancy во всех пулах Liquid Staking", status: "PASSED", suite: "Slither Guard v0.9.3", color: "text-emerald-400" },
    { title: "Превентивный запрет на перерасход токенов (ERC-20 balance checks)", status: "PASSED", suite: "Hardhat Unit Suite", color: "text-emerald-400" },
    { title: "Ограничение лимита эмиссии SYM (Max 1B supply capped)", status: "PASSED", suite: "Slither Checkers", color: "text-emerald-400" },
    { title: "Связующий механизм Timelock Delay (24 часа) на изменение реестра", status: "VERIFIED", suite: "Governor Timelocked Proposal", color: "text-cyan-400" },
    { title: "Прекомпил Falcon-512 (0xF9) низкоуровневых ассемблеров", status: "TESTNET DUMMY ACTIVE", suite: "Geth custom node client requirement", color: "text-amber-400" }
  ];

  // Filtering audit findings by user selected severity status
  const filteredFindings = auditFindingsList.filter(item => {
    if (severityFilter === 'all') return true;
    return item.severity === severityFilter;
  });

  const activePatchesCount = Object.values(patchedVulnerabilities).filter(Boolean).length;
  const isFullyPatched = activePatchesCount === auditFindingsList.length;

  return (
    <div className="flex flex-col gap-5" id="governance-dao-hub">
      
      {/* 1. Header Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
          <button
            onClick={() => setGovernanceTab('dao')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
              governanceTab === 'dao'
                ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Vote className="w-3.5 h-3.5" /> Multi-Sig Решения & DAO
          </button>
          
          <button
            onClick={() => setGovernanceTab('compliance')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 relative ${
              governanceTab === 'compliance'
                ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Отчёт об Аудите & Безопасность
            {activePatchesCount < auditFindingsList.length && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        </div>

        {governanceTab === 'dao' && (
          <div className="text-right font-mono text-[11px] text-zinc-400 bg-zinc-950 border border-zinc-900 px-3 py-1 rounded-full">
            Ваша Сила Голоса: <strong className="text-purple-400 font-extrabold">{votingPower.toLocaleString()} SYM-POWER</strong>
          </div>
        )}
      </div>

      {governanceTab === 'dao' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/20 backdrop-blur leading-relaxed text-xs text-zinc-300 font-sans">
            <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
              <Coins className="w-4 h-4 text-purple-400 animate-pulse" /> Децентрализованное Соправление Игры Nash
            </h3>
            Эти предложения напрямую влияют на экономические и игровые коэффициенты симулятора Symbiosis Network в реальном времени! Голосуйте акциями акций <strong>sSYM</strong>, чтобы сместить математическое равновесие в сторону честного выполнения кода.
          </div>

          <div className="grid grid-cols-1 gap-4">
            {proposals.map(proposal => {
              const totalVotes = proposal.votesFor + proposal.votesAgainst;
              const forPercentage = totalVotes > 0 ? Math.round((proposal.votesFor / totalVotes) * 100) : 0;
              const againstPercentage = totalVotes > 0 ? Math.round((proposal.votesAgainst / totalVotes) * 100) : 0;

              return (
                <div key={proposal.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/60 transition-all flex flex-col gap-3">
                  <div className="flex items-start justify-between border-b border-zinc-900/50 pb-2">
                    <div>
                      <h4 className="text-zinc-200 font-bold font-mono text-sm tracking-tight">{proposal.title}</h4>
                      <span className="text-[10px] text-zinc-550 block font-sans mt-0.5">Влияние: <code>{String(proposal.field)} = {proposal.targetValue}</code></span>
                    </div>

                    <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${
                      proposal.status === 'executed'
                        ? 'border-purple-950 bg-purple-950/10 text-purple-400 font-bold'
                        : proposal.status === 'passed'
                        ? 'border-emerald-950 bg-emerald-950/10 text-emerald-400 font-bold'
                        : proposal.status === 'defeated'
                        ? 'border-red-950 bg-red-950/10 text-red-500'
                        : 'border-zinc-800 bg-zinc-900/40 text-zinc-400'
                    }`}>
                      {proposal.status === 'executed' ? 'Выполнено (EVM)' : proposal.status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">{proposal.description}</p>

                  {/* Progressive Bar Indicators */}
                  <div className="space-y-2 font-mono text-[10px] pt-1">
                    <div className="flex items-center justify-between text-zinc-500">
                      <span>Ход голосования: {(proposal.votesFor + proposal.votesAgainst).toLocaleString()} голосов</span>
                      <span>Кворум: {proposal.votesFor + proposal.votesAgainst} / {proposal.quorum.toLocaleString()}</span>
                    </div>
                    
                    <div className="w-full bg-zinc-900 h-2 rounded overflow-hidden flex border border-zinc-850/60">
                      <div className="h-full bg-purple-500" style={{ width: `${forPercentage}%` }} />
                      <div className="h-full bg-pink-600" style={{ width: `${againstPercentage}%` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-purple-400">За (For): {forPercentage}% ({proposal.votesFor.toLocaleString()} SYM)</span>
                      <span className="text-pink-500">Против (Against): {againstPercentage}% ({proposal.votesAgainst.toLocaleString()} SYM)</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-end gap-2.5 pt-1">
                    {proposal.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleVote(proposal.id, 'for')}
                          disabled={proposal.voted !== undefined}
                          className="text-[10.5px] border border-purple-900 bg-purple-950/10 hover:bg-purple-950/30 text-purple-400 font-bold font-sans px-3.5 py-1.5 rounded transition-all cursor-pointer disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-650"
                        >
                          Голосовать За
                        </button>
                        <button
                          onClick={() => handleVote(proposal.id, 'against')}
                          disabled={proposal.voted !== undefined}
                          className="text-[10.5px] border border-pink-900 bg-pink-950/10 hover:bg-pink-950/30 text-pink-500 font-bold font-sans px-3.5 py-1.5 rounded transition-all cursor-pointer disabled:cursor-not-allowed disabled:border-zinc-805 disabled:text-zinc-650"
                        >
                          Голосовать Против
                        </button>
                      </>
                    )}

                    {proposal.status === 'passed' && (
                      <button
                        onClick={() => handleExecute(proposal.id)}
                        className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-sans px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" /> Внедрить в Код (Execute proposal)
                      </button>
                    )}

                    {proposal.voted && proposal.status === 'active' && (
                      <span className="text-[10px] text-zinc-500 font-sans italic flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Вы зафиксировали голос ({votingPower.toLocaleString()} SYM power)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // AUDIT COMPLIANCE & PROTOCOL SECURITY VIEW (UPDATED MODULE WITH FINDINGS & REMEDIATIONS)
        <div className="space-y-5" id="contract-security-audit-report">
          
          {/* Main Security Target Banner */}
          <div className={`p-4 rounded-xl border transition-all ${
            isFullyPatched 
              ? 'border-emerald-900/60 bg-emerald-950/10' 
              : 'border-amber-900/60 bg-amber-950/15'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-zinc-150 font-bold font-sans text-sm flex items-center gap-2">
                  {isFullyPatched ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 animate-bounce" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                  )}
                  {isFullyPatched 
                    ? 'СИСТЕМА ПОЛНОСТЬЮ ЗАЩИЩЕНА ОТ ОНЧЕЙН ВЗЛОМОВ' 
                    : 'СИМУЛЯЦИЯ РЕВИЗИИ БЕЗОПАСНОСТИ SYMBIOSIS PROTOCOL'
                  }
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  {isFullyPatched 
                    ? 'Поздравляем! Все 10 уязвимостей в смарт-контрактах нейтрализованы активными патчами виртуальной среды. Атаки на казначейство и слэшинг будут заблокированы.' 
                    : 'Security-аудит обнаружил 10 уязвимостей (4 критических, 2 высоких, 2 средних и 2 низких). Активируйте патчи безопасности ниже, чтобы симулировать безопасную логику EVM.'
                  }
                </p>
                
                {/* Progress bar metrics */}
                <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                  <div className="w-[120px] bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className={`h-full transition-all duration-500 ${isFullyPatched ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                      style={{ width: `${(activePatchesCount / auditFindingsList.length) * 100}%` }}
                    />
                  </div>
                  <span>
                    Режим Patch-to-Secure: <strong className={isFullyPatched ? "text-emerald-400" : "text-amber-400"}>{activePatchesCount} / 10</strong> патчей развернуто
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {onToggleAllPatches && (
                  <>
                    <button
                      onClick={() => onToggleAllPatches(true)}
                      disabled={isFullyPatched}
                      className="text-[10.5px] bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-900 text-emerald-400 font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Применить Все Патчи
                    </button>
                    <button
                      onClick={() => onToggleAllPatches(false)}
                      disabled={activePatchesCount === 0}
                      className="text-[10.5px] bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer"
                    >
                      Сбросить Все
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Compliance Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Standard Checklist Indicators */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-zinc-100 font-bold font-sans text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Проверки Slither & Unit Сборки
                </h3>
                <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed mb-3 font-medium">
                  Ниже приведен лог проверок формальной верификации смарт-контрактов в репозитории перед проведением внешнего аудита Sherlock.
                </p>
              </div>

              <div className="space-y-2 text-[10.5px] font-mono">
                {complianceChecklist.map((item, id) => (
                  <div key={id} className="flex items-center justify-between p-2 rounded bg-black/60 border border-zinc-900/60">
                    <div>
                      <span className="text-zinc-300 block">{item.title}</span>
                      <span className="text-[9px] text-zinc-550 block font-mono">{item.suite}</span>
                    </div>
                    <span className={`text-[9.5px] font-bold ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Falcon PQ-Signature precompiled details */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <h3 className="text-zinc-100 font-bold font-sans text-xs uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" /> Защитное Окружение Precompile 0xF9
                </h3>
                
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  <strong>Как работает Falcon на цепочке?</strong> Для подписи Falcon-512 мы используем ассемблерный прекомпилятор по адресу <code>0xF9</code> в EVM-коде контракта <code>NashConsensusRegistry.sol</code>.
                </p>

                <div className="bg-black/80 font-mono text-[10px] p-3 border border-zinc-900 rounded space-y-1 my-1 leading-relaxed text-zinc-350">
                  <div className="text-purple-400 font-bold">// Вызов прекомпилятора 0xF9</div>
                  <div>let success := staticcall(</div>
                  <div className="pl-4">gas(), 0xF9, pubKeyPtr, pubKeyLen, ...</div>
                  <div>)</div>
                  <div className="text-zinc-500 font-sans italic mt-1">// Локальный обход наchainId 31337/sepolia возвращает true для отладки.</div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans font-medium">
                  Поскольку в стандартном Ethereum нода не поддерживает адрес <code>0xF9</code>, развертывание в продакшене требует <strong>кастомный клиент Hardhat/Reth/OP Stack</strong> с внедренной поддержкой ассемблеров.
                </p>
              </div>

              <div className="pt-2">
                <a 
                  href="/AUDIT_PREP.md" 
                  className="w-full bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 font-mono text-[11px] py-1.5 border border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 text-zinc-350 font-bold hover:text-zinc-100"
                  target="_blank"
                  referrerPolicy="no-referrer"
                >
                  <FileText className="w-3.5 h-3.5" /> Читать AUDIT_PREP.md в новой вкладке
                </a>
              </div>
            </div>

          </div>

          {/* 10 Detailed Findings Section List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="text-zinc-100 font-bold font-sans text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BadgeAlert className="w-4 h-4 text-rose-500" /> Ведомость выявления угроз и отладки
              </h3>
              
              {/* Severity Filter Buttons */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => {
                  const itemsCount = sev === 'all' 
                    ? auditFindingsList.length 
                    : auditFindingsList.filter(f => f.severity === sev).length;
                  
                  return (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2 py-1 rounded border transition-all cursor-pointer ${
                        severityFilter === sev
                          ? 'bg-zinc-900 text-purple-400 border-purple-900/50 font-bold'
                          : 'text-zinc-500 border-transparent hover:text-zinc-300'
                      }`}
                    >
                      {sev.toUpperCase()} ({itemsCount})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Finding Accordion Widgets */}
            <div className="space-y-3">
              {filteredFindings.map(finding => {
                const isPatched = patchedVulnerabilities[finding.id] || false;
                const isExpanded = expandedFinding === finding.id;

                const severityColors = {
                  critical: 'border-red-900 bg-red-950/10 text-red-400 hover:bg-red-950/15',
                  high: 'border-orange-900 bg-orange-950/10 text-orange-400 hover:bg-orange-950/15',
                  medium: 'border-yellow-900 bg-yellow-950/10 text-yellow-450 hover:bg-yellow-950/15',
                  low: 'border-blue-900 bg-blue-950/10 text-blue-400 hover:bg-blue-950/15'
                };

                return (
                  <div 
                    key={finding.id} 
                    className={`border rounded-xl transition-all ${
                      isPatched 
                        ? 'border-emerald-900/50 bg-emerald-950/5' 
                        : 'border-zinc-900 bg-zinc-950/30'
                    }`}
                  >
                    
                    {/* Header bar of Finding */}
                    <div 
                      onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-zinc-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border tracking-wide font-extrabold pb-1 pt-0.5 ${severityColors[finding.severity]}`}>
                          {finding.severity}
                        </span>
                        
                        <div>
                          <h4 className="text-zinc-250 font-sans font-bold text-xs tracking-tight hover:text-zinc-100 transition-colors">
                            {finding.title}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Локация: <code className="text-zinc-400">{finding.contract}</code>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Patch Indicator Pin */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9.5px] font-mono px-2 py-1.5 rounded-md border font-bold flex items-center gap-1 ${
                            isPatched 
                              ? 'border-emerald-900/60 bg-emerald-950/20 text-emerald-400' 
                              : 'border-rose-900/60 bg-rose-950/10 text-rose-400'
                          }`}>
                            {isPatched ? (
                              <>
                                <Shield className="w-3 h-3 text-emerald-400 animate-pulse" /> Патч Активен
                              </>
                            ) : (
                              <>
                                <Wrench className="w-3 h-3 text-rose-450" /> Требуется Патч
                              </>
                            )}
                          </span>

                          {onTogglePatch && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTogglePatch(finding.id);
                              }}
                              className={`px-3 py-1.5 rounded font-mono text-[10px] border transition-all font-bold cursor-pointer flex items-center gap-1 ${
                                isPatched 
                                  ? 'bg-zinc-900 text-rose-400 border-zinc-800 hover:bg-zinc-850 hover:text-rose-300' 
                                  : 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800'
                              }`}
                            >
                              {isPatched ? 'Отключить' : 'Применить'}
                            </button>
                          )}
                        </div>

                        <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isExpanded ? 'transform rotate-90 text-zinc-200' : ''}`} />
                      </div>
                    </div>

                    {/* Accordion Content Body of Finding */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-zinc-900/50 space-y-3.5 text-xs text-zinc-350 leading-relaxed font-sans">
                        
                        <p>{finding.description}</p>

                        {/* Vulnerable vs Remediation Code Panels */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 font-mono text-[10px] pt-1">
                          
                          {/* Vulnerable container */}
                          <div className="p-3 rounded-lg border border-red-950/60 bg-red-950/5 flex flex-col justify-between">
                            <div>
                              <div className="text-red-400 font-bold font-sans text-[10px] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" /> Уязвимый исходный код:
                              </div>
                              <pre className="overflow-x-auto whitespace-pre p-2 rounded bg-black/50 custom-scrollbar text-red-300/80 max-h-[170px]">
                                {finding.codeVulnerable}
                              </pre>
                            </div>
                          </div>

                          {/* Patched container */}
                          <div className="p-3 rounded-lg border border-emerald-950/60 bg-emerald-950/5 flex flex-col justify-between">
                            <div>
                              <div className="text-emerald-400 font-bold font-sans text-[10px] uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 className='animate-pulse'" /> Решение в патче безопасности:
                              </div>
                              <pre className="overflow-x-auto whitespace-pre p-2 rounded bg-black/50 custom-scrollbar text-emerald-300/90 max-h-[170px]">
                                {finding.codePatched}
                              </pre>
                            </div>
                          </div>

                        </div>

                        {/* Remediation Summary Box */}
                        <div className="p-3 bg-zinc-950/40 border border-zinc-900/50 rounded-lg flex items-start gap-1.5 leading-relaxed text-[11px] text-zinc-400">
                          <Cpu className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <p>
                            <strong>Инженерное устранение:</strong> {finding.remediation}
                          </p>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
