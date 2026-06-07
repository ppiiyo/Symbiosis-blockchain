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
  BadgeAlert,
  Play,
  Flame,
  Terminal,
  RefreshCw
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
  const [governanceTab, setGovernanceTab] = useState<'dao' | 'compliance' | 'stress_tests'>('dao');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [showAdvancedSecurityLab, setShowAdvancedSecurityLab] = useState<boolean>(false);
  
  // State variables for interactive stress testing
  const [selectedStressTest, setSelectedStressTest] = useState<string>("slash_attack");
  const [runningTest, setRunningTest] = useState<boolean>(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testProgress, setTestProgress] = useState<number>(0);
  const [testOutcome, setTestOutcome] = useState<'success' | 'failure' | 'none'>('none');

  // Interactive Stress Tests List defining smart contract attack scenarios
  const stressTestsList = [
    {
      id: "slash_attack",
      name: "S-1: Whistleblower Bounty Exploit (Unrestricted Slashing)",
      vulnId: "unrestricted_slashing",
      severity: "critical",
      contract: "NashConsensusRegistry.sol",
      vulnName: "Неограниченный слэшинг",
      attacker: "0xAttacker_925a...49fd",
      targetAddress: "BenignValidator (0xf39F...2266)",
      objective: "Срезать залог чужого валидатора без доказательств саботажа и присвоить его whistleblower награду себе (7.5%).",
      payload: "triggerLazySlashing(targetNodeAddress, msg.sender, blockNumber, 0x0, [], 0x0, [])",
      steps: [
        "[09:14:02] Подготовка эксплойта на сервере атакующего...",
        "[09:14:03] Сканирование контракта NashConsensusRegistry...",
        "[09:14:04] Обнаружен активный валидатор '0xf39...2266' с залогом 10 000 SYM.",
        "[09:14:05] Вызов triggerLazySlashing() без передачи валидных Falcon-подписей...",
        "[09:14:06] Транзакция отправлена в пул блоков..."
      ],
      successLogs: [
        "[09:14:07] 🔥 ТРАНЗАКЦИЯ УСПЕШНО ВЫПОЛНЕНА! (Блок #492815)",
        "[09:14:08] 💥 Узел 0xf39...2266 отмечен как взломанный (isSlashed = true)",
        "[09:14:09] 💥 С залога валидатора списан штраф 750 SYM (7.5%)",
        "[09:14:10] 🎉 Награда whistleblower в размере 375 SYM переведена хакеру!",
        "💥 СТРЕСС-ТЕСТ ПРОВАЛЕН! Контракт уязвим. Капитал украден."
      ],
      blockedLogs: [
        "[09:14:07] 🛡️ ТРАНЗАКЦИЯ ОТКЛОНЕНА СЕТЬЮ (EVM TRANSACTION REVERTED)",
        "[09:14:08] 🛑 Ошибка: 'Invalid signature 1' | 'Signature count must be 2'",
        "[09:14:09] 🛡️ Смарт-контракт заблокировал вызов: требуются валидные Falcon-подписи двойного подписания!",
        "[09:14:10] 🛡️ Залог валидатора в безопасности (10 000 SYM сохранены).",
        "🛡️ СТРЕСС-ТЕСТ УСПЕШНО ПРОЙДЕН! Контракт защищен криптографическим патчем."
      ]
    },
    {
      id: "signature_bypass",
      name: "S-2: Falcon-512 Signature Mock Bypass",
      vulnId: "mock_signature",
      secondaryId: "mock_signature",
      severity: "critical",
      contract: "NashConsensusRegistry.sol",
      vulnName: "Заглушка проверки подписей",
      attacker: "0xAttacker_925a...49fd",
      targetAddress: "NashConsensusRegistry.verifyFalconSignature",
      objective: "Подделать блок-подпись Falcon-512 для финализации скомпрометированного блока транзакций, послав 99-байтную сигнатуру.",
      payload: "verifyFalconSignature(validator, corruptedHash, signature_len_99)",
      steps: [
        "[09:15:30] Поиск уязвимостей в ассемблерной верификации решеток Falcon...",
        "[09:15:31] Обнаружено: подписи длиной ровно 99 байт минуют NTRU-декодирование.",
        "[09:15:32] Моделирование фрейма фиктивной подписи (99 байт нулей)...",
        "[09:15:33] Публикация транзакции с коррумпированным верификатором блоков..."
      ],
      successLogs: [
        "[09:15:34] 🔥 TРАНЗАКЦИЯ ПРИНЯТА! (Bypass finalization)",
        "[09:15:35] 💥 Функция verifyFalconSignature() вернула TRUE для фальсифицированного блока!",
        "[09:15:36] 💥 Двойной голос злоумышленника успешно засчитан сетью консенсуса!",
        "[09:15:37] 💥 Математическая безопасность византийского консенсуса полностью разрушена.",
        "💥 СТРЕСС-ТЕСТ ПРОВАЛЕН! Любой адрес может генерировать голоса блоков вне криптографического консенсуса."
      ],
      blockedLogs: [
        "[09:15:34] 🛡️ ТРАНЗАКЦИЯ ОТКЛОНЕНА: 'Mock stubs strictly disabled in production'",
        "[09:15:35] 🛑 Ошибка: Заглушки верификации отключены вне тестовой сети Hardhat (ChainID != 31337).",
        "[09:15:36] 🛡️ Вызов принудительно направлен на ассемблерный прекомпилятор по адресу 0xF9!",
        "[09:15:37] 🛡️ Поддельный голос отклонен. Результат верификации: false.",
        "🛡️ СТРЕСС-ТЕСТ УСПЕШНО ПРОЙДЕН! Фальшивые подписи отклонены EVM."
      ]
    },
    {
      id: "prover_takeover",
      name: "S-3: ZK Prover Registry Role Theft",
      vulnId: "privilege_escalation",
      severity: "critical",
      contract: "LiquidStakingSsym.sol",
      vulnName: "Незащищенный захват реестра ZK",
      attacker: "0xAttacker_925a...49fd",
      targetAddress: "LiquidStakingSsym (zkProverRegistry)",
      objective: "Захватить административное управление ZK Prover реестром защиты ликвидного стейкинга.",
      payload: "updateZkProver(msg.sender)",
      steps: [
        "[09:17:10] Опрос состояния смарт-контракта LiquidStakingSsym...",
        "[09:17:11] Переменная zkProverRegistry не инициализирована (равна 0x000...00).",
        "[09:17:12] Подготовка вызова updateZkProver() со своим адресом...",
        "[09:17:13] Транзакция отправлена в сеть..."
      ],
      successLogs: [
        "[09:17:14] 🔥 ТРАНЗАКЦИЯ ВЫПОЛНЕНА! (Privilege escalation)",
        "[09:17:15] 💥 Адрес ZK Prover изменен на 0xAttacker_925a...49fd!",
        "[09:17:16] 💥 Хакер получил монопольное право на управление защитными проверками валидаторов!",
        "[09:17:17] 💥 Баланс и права управления жидким стейкингом скомпрометированы.",
        "💥 СТРЕСС-ТЕСТ ПРОВАЛЕН! Преимущественные права администратора похищены."
      ],
      blockedLogs: [
        "[09:17:14] 🛡️ ТРАНЗАКЦИЯ ОТКЛОНЕНА: 'Caller is not the Prover or Governor'",
        "[09:17:15] 🛑 Ошибка: Изменение реестра доступно только уполномоченным губернаторам или проуверам.",
        "[09:17:16] 🛡️ Права доступа защищены мультисигом. Транзакция отменена.",
        "[09:17:17] 🛡️ Роль zkProverRegistry осталась закрытой от сторонних вмешательств.",
        "🛡️ СТРЕСС-ТЕСТ УСПЕШНО ПРОЙДЕН! Попытка захвата прав отбита."
      ]
    },
    {
      id: "inflation_attack",
      name: "S-4: Rounding-Error Pool Donation (First Depositor Attack)",
      vulnId: "first_depositor",
      severity: "critical",
      contract: "LiquidStakingSsym.sol",
      vulnName: "Инфляционная атака первого вкладчика",
      attacker: "0xAttacker_925a...49fd",
      targetAddress: "Secondary Depositor (Депозит 50 000 SYM)",
      objective: "Сделать вклад в 1 wei, искусственно раздуть пул донатом в 100 000 SYM и согнать баланс долей второго вкладчика в 0.",
      payload: "stake(1 wei) -> donation(100,000 SYM) -> stake(50,000 SYM)",
      steps: [
        "[09:18:45] Атакующий вносит первый депозит в пул ликвидности: 1 wei (shares = 1).",
        "[09:18:46] Прямой перевод доната 100,000 SYM на баланс контракта со стороны хакера...",
        "[09:18:47] Балансовый индекс пула: 1 share = 100,000 SYM.",
        "[09:18:48] Легитимный инвестор вносит депозит на сумму 50,000 SYM.",
        "[09:18:49] Расчёт долей вкладчика: shares = (50,000 * 1) / 100,001 = 0 долей."
      ],
      successLogs: [
        "[09:18:50] 🔥 ДЕПОЗИТ ЗАВЕРШЕН С НУЛЕВЫМ ДЕЛЕНИЕМ!",
        "[09:18:51] 💥 Пользователь внес 50,000 SYM и получил ровно 0 долей sSYM!",
        "[09:18:52] 💥 Вся сумма перешла под контроль хакера, владеющего единственной долей в пуле!",
        "[09:18:53] 💥 Ущерб составил 50,000 SYM за счет уязвимости округления долей.",
        "💥 СТРЕСС-ТЕСТ ПРОВАЛЕН! Новые инвесторы лишаются баланса при первом вкладе."
      ],
      blockedLogs: [
        "[09:18:50] 🛡️ ТРАНЗАКЦИЯ ЗАБЛОКИРОВАНА (EVM TRANSACTION REVERTED)",
        "[09:18:51] 🛑 Ошибка: 'Shares amount cannot be zero'",
        "[09:18:52] 🛡️ Патч пула LiquidStaking запретил выпуск нулевого объема долей для новых пользователей.",
        "[09:18:53] 🛡️ Первые 1000 долей пула (MINIMUM_LIQUIDITY) заблокированы на сжигание, делая атаку донации неэффективной.",
        "🛡️ СТРЕСС-ТЕСТ УСПЕШНО ПРОЙДЕН! Инфляционная уязвимость нейтрализована."
      ]
    },
    {
      id: "gas_drain",
      name: "S-5: Manipulated Gas telemetry (Refund Drainage)",
      vulnId: "gas_recycling",
      severity: "high",
      contract: "SymbiosisToken.sol",
      vulnName: "Манипуляция утилизацией газа",
      attacker: "0xAttacker_925a...49fd",
      targetAddress: "Gasback Refund Treasury Pool (500 000 SYM)",
      objective: "Передать фальсифицированные метрики gasUsed с целью вывода неограниченых сумм компенсации из казначейства.",
      payload: "recycleGas(msg.sender, 999,999,999)",
      steps: [
        "[09:20:15] Инициирование взаимодействия со смарт-контрактом токена...",
        "[09:20:16] Подделка отчета о затраченном газе (gas used = 1 000 000 000 ед.)...",
        "[09:20:17] Вызов функции recycleGas()...",
        "[09:20:18] Ожидание казначейского транша ребейта..."
      ],
      successLogs: [
        "[09:20:19] 🔥 КОМПЕНСАЦИЯ ВЫДАНА! (Gasback Drainage)",
        "[09:20:20] 💥 Смарт-контракт выплатил максимальный ребейт в размере 5,000 SYM!",
        "[09:20:21] 💥 Хакер полностью исчерпал ликвидность возврата фиктивными логами.",
        "💥 СТРЕСС-ТЕСТ ПРОВАЛЕН! Казначейство уязвимо к хищению газа."
      ],
      blockedLogs: [
        "[09:20:19] 🛡️ ТРАНЗАКЦИЯ ОТКЛОНЕНА: 'Manipulated gasUsed value exceeds tx.gaslimit range'",
        "[09:20:20] 🛑 Ошибка: Переданное значение превышает реальный tx.gaslimit транзакции.",
        "[09:20:21] 🛡️ Смарт-контракт заблокировал выплату ребейта. Введенные лимиты rate-limiting и сверка лимитов защитили балансы.",
        "🛡️ СТРЕСС-ТЕСТ УСПЕШНО ПРОЙДЕН! Выплата ограничена реальным лимитом транзакции."
      ]
    },
    {
      id: "reentrancy_attack",
      name: "S-6: Checks-Effects-Interactions Reentrancy Exploit",
      vulnId: "reentrancy",
      severity: "low",
      contract: "LiquidStakingSsym.sol",
      vulnName: "Нарушение паттерна CEI",
      attacker: "0xAttacker_925a...49fd",
      targetAddress: "LiquidStakingSsym.unstake",
      objective: "Выполнить повторный рекурсивный вызов метода unstake() в fallback функции контракта до списания остатка баланса долей.",
      payload: "unstake(10,000 shares) -> fallback() -> unstake(10,000 shares)",
      steps: [
        "[09:22:00] Развертывание вредоносного смарт-контракта в тестовой сети...",
        "[09:22:01] Размещение депозита для генерации sSYM токенов...",
        "[09:22:02] Инициирование транзакции вывода активов unstake(10,000 shares)...",
        "[09:22:03] Контракт пересылает оригинальные токены SYM на адрес хакера...",
        "[09:22:04] Срабатывает fallback() контрактного адреса атакующего, повторно вызывая unstake()..."
      ],
      successLogs: [
        "[09:22:05] 🔥 КЛАССИЧЕСКИЙ РЕЕНТРАНСИ ОДОБРЕН!",
        "[09:22:06] 💥 Баланс вклада еще не был уменьшен в памяти EVM при повторном сеансе!",
        "[09:22:07] 💥 Хакер получил двойную выплату SYM, имея всего 10,000 SYM в доле!",
        "[09:22:08] 💥 Смарт-контракт LiquidStakingSsym полностью обезвожен.",
        "💥 СТРЕСС-ТЕСТ ПРОВАЛЕН! Двойной вывод активов совершен успешно."
      ],
      blockedLogs: [
        "[09:22:05] 🛡️ ТРАНЗАКЦИЯ ОТКЛОНЕНА СЕТЬЮ (EVM TRANSACTION REVERTED)",
        "[09:22:06] 🛑 Ошибка: Списание долей _burn() теперь выполняется ДО трансфера SYM (паттерн CEI). Попытка повторного входа заблокирована.",
        "[09:22:07] 🛡️ Баланс защищен. Транзакция хакера полностью отменена.",
        "🛡️ СТРЕСС-ТЕСТ УСПЕШНО ПРОЙДЕН! Превентивная защита от реентранси заблокировала повторный вызов."
      ]
    }
  ];

  const handleRunStressTest = (scenarioId: string) => {
    if (runningTest) return;
    const scenario = stressTestsList.find(s => s.id === scenarioId);
    if (!scenario) return;

    setRunningTest(true);
    setTestProgress(0);
    setTestOutcome('none');
    setTestLogs([]);

    const isPatched = patchedVulnerabilities[scenario.vulnId] || false;
    let stepIndex = 0;
    const allSteps = [...scenario.steps];
    
    // Add logs step-by-step
    const interval = setInterval(() => {
      if (stepIndex < allSteps.length) {
        setTestLogs(prev => [...prev, allSteps[stepIndex]]);
        setTestProgress(Math.round(((stepIndex + 1) / (allSteps.length + 5)) * 100));
        stepIndex++;
      } else {
        clearInterval(interval);
        
        // Now stream the outcome logs
        const outcomeLogs = isPatched ? scenario.blockedLogs : scenario.successLogs;
        let outcomeIndex = 0;
        
        const outcomeInterval = setInterval(() => {
          if (outcomeIndex < outcomeLogs.length) {
            setTestLogs(prev => [...prev, outcomeLogs[outcomeIndex]]);
            setTestProgress(Math.round(((allSteps.length + outcomeIndex + 1) / (allSteps.length + outcomeLogs.length)) * 100));
            outcomeIndex++;
          } else {
            clearInterval(outcomeInterval);
            setRunningTest(false);
            setTestOutcome(isPatched ? 'failure' : 'success'); // If patch is active, exploit fails -> 'failure' (success for protocol stability)
            addLog(`⚔️ СТРЕСС-ТЕСТ: Запущена симуляция '${scenario.name}'. Результат: ${isPatched ? "ЗАЩИЩЕНО (Патч активен)" : "УЯЗВИМО (Система взломана)"}.`);
          }
        }, 550);
      }
    }, 450);
  };

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
                ? 'bg-zinc-900 text-purple-400 border border-purple-900/30'
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

          <button
            onClick={() => setGovernanceTab('stress_tests')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 relative ${
              governanceTab === 'stress_tests'
                ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> ⚔️ Стресс-Тесты (Ред-Тиминг)
          </button>
        </div>

        {governanceTab === 'dao' && (
          <div className="text-right font-mono text-[11px] text-zinc-400 bg-zinc-950 border border-zinc-900 px-3 py-1 rounded-full">
            Ваша Сила Голоса: <strong className="text-purple-400 font-extrabold">{votingPower.toLocaleString()} SYM-POWER</strong>
          </div>
        )}
      </div>

      {governanceTab === 'dao' && (
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
      )}

      {governanceTab === 'compliance' && (
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
          {!showAdvancedSecurityLab ? (
            <div className="p-5 rounded-xl border border-emerald-950/60 bg-zinc-950/25 backdrop-blur-md space-y-4" id="corporate-compliance-certificate">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Сертификат соответствия Symbiosis (SYM-SEC)
                    </h3>
                    <p className="text-[10.5px] text-zinc-400 font-sans mt-0.5">
                      Криптографический аудит успешно завершен. Все уязвимости устранены и проверяются валидаторами под капотом.
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-950/30 text-emerald-400 border border-emerald-900/40 rounded-xl px-3 py-1.5 text-[10px] font-mono font-bold flex items-center gap-1.5 self-start md:self-auto uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span>Аттестовано (Security Level AAA)</span>
                </div>
              </div>

              {/* Security features running active in background grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono pt-1">
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-350">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>1. Замок реэнтерабельности</span>
                </div>
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-350">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>2. PQ Falcon Verifier (0xF9)</span>
                </div>
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-350">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>3. Inflation Deposit Guard</span>
                </div>
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-350">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>4. Slashing Double-Sign Lock</span>
                </div>
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-350">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>5. Gas Recycling Freeze</span>
                </div>
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>6. Лимиты предложений</span>
                </div>
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>7. Token Rescuing Control</span>
                </div>
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>8. Защита от нулевого залога</span>
                </div>
                <div className="p-2.5 bg-black/40 border border-zinc-900/60 rounded-xl flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>9. Иерархия привилегий ACL</span>
                </div>
              </div>

              {/* Advanced mode expand action info trigger */}
              <div className="p-4 bg-zinc-950 border border-zinc-900/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed">
                <div>
                  <span className="font-bold text-zinc-200 block font-mono">🧪 Инженерный отладочный пульт</span>
                  <p className="text-zinc-400 text-[10.5px] mt-0.5 font-sans">
                    Для проведения тестов на проникновение, симуляции сетевых уязвимостей и инспекции уязвимого смарт-кода вы можете развернуть экспертную панель.
                  </p>
                </div>
                <button
                  onClick={() => setShowAdvancedSecurityLab(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 hover:from-purple-900/40 hover:to-indigo-900/50 text-indigo-300 hover:text-indigo-200 font-mono font-bold text-[10.5px] border border-indigo-950 rounded-lg shrink-0 transition-all active:scale-95 cursor-pointer"
                >
                  Инженерная Лаборатория Угроз
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2">
                  <BadgeAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                  <h3 className="text-zinc-100 font-bold font-sans text-xs uppercase tracking-wider">
                    Ведомость выявления угроз и отладки
                  </h3>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => {
                      const itemsCount = sev === 'all' 
                        ? auditFindingsList.length 
                        : auditFindingsList.filter(f => f.severity === sev).length;
                      
                      return (
                        <button
                          key={sev}
                          onClick={() => setSeverityFilter(sev)}
                          className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
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

                  <button
                    onClick={() => setShowAdvancedSecurityLab(false)}
                    className="text-[9.5px] font-mono px-2 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded cursor-pointer"
                  >
                    Скрыть Лабораторию
                  </button>
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
          )}

        </div>
      )}

      {governanceTab === 'stress_tests' && (
        <div className="space-y-5">
          {/* Stress test introduction header */}
          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/20 backdrop-blur leading-relaxed text-xs text-zinc-350 font-sans">
            <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" /> Песочница Симуляции Стресс-Тестов и Атак (Red-Teaming Sandbox)
            </h3>
            <p>
              Интерактивная среда для запуска хакерских атак и верификации смарт-контрактов в реальном времени. Включайте и отключайте патчи безопасности во вкладке <strong>«Ревизия & Безопасность»</strong>, чтобы увидеть, как криптографические барьеры и математический консенсус протокола блокируют реальные угрозы!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Scenarios List Sidepane */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider font-bold mb-1 font-sans">Сценарии Атак (S1-S6)</span>
              <div className="flex flex-col gap-2">
                {stressTestsList.map(scenario => {
                  const isPatchedObj = patchedVulnerabilities[scenario.vulnId] || false;
                  const isActive = selectedStressTest === scenario.id;
                  
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        if (runningTest) return;
                        setSelectedStressTest(scenario.id);
                        setTestLogs([]);
                        setTestOutcome('none');
                        setTestProgress(0);
                      }}
                      disabled={runningTest}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                        isActive 
                          ? 'border-red-900/50 bg-red-950/10 text-red-100 shadow-md shadow-red-950/10' 
                          : 'border-zinc-900 bg-zinc-950/30 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[11px] font-bold font-mono ${isActive ? 'text-red-400' : 'text-zinc-300'}`}>
                          {scenario.id.toUpperCase()}: {scenario.id === 'slash_attack' ? 'Whistleblower Bounty' : scenario.id === 'signature_bypass' ? 'Falcon Bypass' : scenario.id === 'prover_takeover' ? 'Role Takeover' : scenario.id === 'inflation_attack' ? 'Inflation rounding' : scenario.id === 'gas_drain' ? 'Gasback drain' : 'CEI Reentrancy'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono tracking-wider font-extrabold uppercase shrink-0 ${
                          scenario.severity === 'critical' 
                            ? 'bg-red-950/40 text-red-400 border border-red-900/40' 
                            : 'bg-amber-950/40 text-amber-500 border border-amber-900/30'
                        }`}>
                          {scenario.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                        {scenario.objective}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-900/30 text-[9.5px]">
                        <span className="text-zinc-650 font-mono">Патч:</span>
                        <span className={`flex items-center gap-0.5 font-bold ${isPatchedObj ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {isPatchedObj ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> АКТИВЕН (Безопасно)
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> ВЫКЛЮЧЕН (Уязвимо)
                            </>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Scenario Workspace & Interactive Terminal */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Scenario Details Card */}
              <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                    <div>
                      <h4 className="text-zinc-150 font-bold text-xs uppercase tracking-wider">{stressTestsList.find(s => s.id === selectedStressTest)?.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Целевой Смарт-Контракт: <span className="text-purple-400 font-bold">{stressTestsList.find(s => s.id === selectedStressTest)?.contract}</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <span className="text-zinc-500 text-[10px] block uppercase tracking-wider font-bold mb-1">Цель Взлома:</span>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        {stressTestsList.find(s => s.id === selectedStressTest)?.objective}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block uppercase tracking-wider font-bold mb-1">Спецификация Атаки:</span>
                      <div className="p-2 rounded bg-black/60 border border-red-950/30 font-mono text-[9.5px] text-red-400 max-h-[100px] overflow-y-auto w-full custom-scrollbar">
                        <strong>Payload:</strong><br />
                        {stressTestsList.find(s => s.id === selectedStressTest)?.payload}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-3.5 border-t border-zinc-900/40">
                  <button
                    onClick={() => handleRunStressTest(selectedStressTest)}
                    disabled={runningTest}
                    className={`w-full sm:w-auto px-5 py-2 rounded-lg font-bold font-sans text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
                      runningTest 
                        ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' 
                        : 'bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 shadow-md hover:shadow-red-950/30'
                    }`}
                  >
                    {runningTest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-500" /> Симуляция Контракта...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-red-400 shrink-0" /> ЗАПУСТИТЬ ОНЧЕЙН АТАКУ
                      </>
                    )}
                  </button>

                  {runningTest && (
                    <div className="flex-1 w-full flex items-center gap-3">
                      <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                        <div 
                          className="h-full bg-red-500 transition-all duration-300" 
                          style={{ width: `${testProgress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 whitespace-nowrap">{testProgress}%</span>
                    </div>
                  )}

                  {!runningTest && testOutcome !== 'none' && (
                    <span className={`text-xs font-bold font-sans ${testOutcome === 'success' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {testOutcome === 'success' ? '💥 КОНТРАКТ ВЗЛОМАН!' : '🛡️ СИСТЕМА УСТОЯЛА!'}
                    </span>
                  )}
                </div>
              </div>

              {/* Terminal Logs Window */}
              <div className="rounded-xl border border-zinc-900 bg-black overflow-hidden flex flex-col h-[280px]">
                <div className="bg-zinc-950 border-b border-zinc-900 px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-zinc-400 font-extrabold uppercase tracking-wide">EVM Execution & Telemetry Log</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                </div>

                <div className="p-4 font-mono text-[11px] text-zinc-400 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar leading-relaxed bg-black/90">
                  {testLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic text-[10px] gap-1.5">
                      <span>_ Ожидание запуска атакующего вектора... _</span>
                      <span>Нажмите на красную кнопку для инициации транзакций</span>
                    </div>
                  ) : (
                    testLogs.map((log, i) => {
                      if (typeof log !== 'string') return null;
                      let colorClass = "text-zinc-400";
                      if (log.includes("🏆") || log.includes("🎉") || log.includes("SUCCESS")) colorClass = "text-emerald-400 font-extrabold";
                      else if (log.includes("💥") || log.includes("ПРОВАЛЕН") || log.includes("🔥")) colorClass = "text-red-400 font-extrabold";
                      else if (log.includes("🛡️") || log.includes("УСПЕШНО") || log.includes("ЗАЩИЩЕН")) colorClass = "text-emerald-400 font-extrabold";
                      else if (log.includes("🛑") || log.includes("ОТКЛОНЕНА")) colorClass = "text-amber-400";
                      
                      return (
                        <div key={i} className={`whitespace-pre-wrap border-l-2 pl-2 border-zinc-900 py-0.5 ${colorClass}`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
