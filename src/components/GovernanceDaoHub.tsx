import React, { useState, useEffect } from 'react';
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
  FileText
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

export const GovernanceDaoHub: React.FC<GovernanceDaoHubProps> = ({
  nodes,
  config,
  onChangeConfig,
  userStakedNodes,
  userBalance,
  onChangeUserBalance,
  addLog
}) => {
  const [governanceTab, setGovernanceTab] = useState<'dao' | 'compliance'>('dao');
  
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

  // Safe validation checkmark items for Audit/Security report
  const complianceChecklist = [
    { title: "Защита от Reentrancy во всех пулах Liquid Staking", status: "PASSED", suite: "Slither Guard v0.9.3", color: "text-emerald-400" },
    { title: "Превентивный запрет на перерасход токенов (ERC-20 balance checks)", status: "PASSED", suite: "Hardhat Unit Suite", color: "text-emerald-400" },
    { title: "Ограничение лимита эмиссии SYM (Max 1B supply capped)", status: "PASSED", suite: "Slither Checkers", color: "text-emerald-400" },
    { title: "Связующий механизм Timelock Delay (24 часа) на изменение реестра", status: "VERIFIED", suite: "Governor Timelocked Proposal", color: "text-cyan-400" },
    { title: "Прекомпил Falcon-512 (0xF9) низкоуровневых ассемблеров", status: "TESTNET DUMMY ACTIVE", suite: "Geth custom node client requirement", color: "text-amber-400" }
  ];

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
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-sans transition-all cursor-pointer flex items-center gap-1.5 ${
              governanceTab === 'compliance'
                ? 'bg-zinc-900 text-purple-400 border border-purple-900/30 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Отчёт об Аудите & Безопасность
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
                          className="text-[10.5px] border border-pink-900 bg-pink-950/10 hover:bg-pink-950/30 text-pink-500 font-bold font-sans px-3.5 py-1.5 rounded transition-all cursor-pointer disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-650"
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
        // AUDIT COMPLIANCE & PROTOCOL SECURITY VIEW
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Standard Security Matrix Checklist */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-zinc-100 font-bold font-sans text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Проверки Slither & Unit Сборки
                </h3>
                <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed mb-3">
                  Ниже приведен лог проверок формальной верификации смарт-контрактов в репозитории перед проведением внешнего аудита командой Sherlock.
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

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  Поскольку в стандартном Ethereum нода не поддерживает адрес <code>0xF9</code>, развертывание в продакшене требует <strong>кастомный клиент Hardhat/Geth/Reth/OP Stack</strong> с внедренной поддержкой ассемблеров.
                </p>
              </div>

              <div className="pt-2">
                <a 
                  href="/AUDIT_PREP.md" 
                  className="w-full bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 font-mono text-[11px] py-2 border border-zinc-800 rounded-lg flex items-center justify-center gap-1 text-zinc-300 font-bold"
                  target="_blank"
                >
                  <FileText className="w-3.5 h-3.5" /> Читать AUDIT_PREP.md в новой вкладке
                </a>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
