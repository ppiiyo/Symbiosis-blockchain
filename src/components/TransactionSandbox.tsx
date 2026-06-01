import React, { useState } from 'react';
import { 
  Send, 
  Terminal, 
  Cpu, 
  Layers, 
  Search, 
  Sparkles, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Lock, 
  HelpCircle,
  FileCode,
  Activity,
  DollarSign
} from 'lucide-react';
import { Transaction, ValidatorNode } from '../types';

interface TransactionSandboxProps {
  transactions: Transaction[];
  mempool: Transaction[];
  nodes: ValidatorNode[];
  onBroadcastTransaction: (tx: Omit<Transaction, 'id' | 'status' | 'timestamp'>) => void;
  onClearHistory: () => void;
}

export const TransactionSandbox: React.FC<TransactionSandboxProps> = ({
  transactions,
  mempool,
  nodes,
  onBroadcastTransaction,
  onClearHistory
}) => {
  // Input states
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'contracts'>('create');
  const [txType, setTxType] = useState<'transfer' | 'nft_mint' | 'swap_contract'>('transfer');
  const [sender, setSender] = useState('0x8A2f...39cE');
  const [receiver, setReceiver] = useState('0x12Ca...de44');
  const [amount, setAmount] = useState('100');
  const [payload, setPayload] = useState('Transfer 100 SYM to Liquidity Pool');
  
  // Contracts Sandbox
  const [selectedContract, setSelectedContract] = useState<string>('swap');
  const [contractCode, setContractCode] = useState<string>(`// SYM Swap Router v1.02
// Instantly swaps SYM tokens to stable assets
contract SymSwapRouter {
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    public function swapExactTokensForTokens(
        uint250 amountIn,
        uint250 minAmountOut,
        address user
    ) external returns (uint250) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        uint250 fee = amountIn * 3 / 1000; // 0.3% protocol fee
        uint250 swappedOutput = (amountIn - fee) * 118 / 100; // Multi-Asset rate
        
        emit SwapExecuted(user, amountIn, swappedOutput);
        return swappedOutput;
    }
}`);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const handleSelectContract = (key: string) => {
    setSelectedContract(key);
    if (key === 'swap') {
      setContractCode(`// SYM Swap Router v1.02
// Instantly swaps SYM tokens to stable assets
contract SymSwapRouter {
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    public function swapExactTokensForTokens(
        uint250 amountIn,
        uint250 minAmountOut,
        address user
    ) external returns (uint250) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        uint250 fee = amountIn * 3 / 1000; // 0.3% protocol fee
        uint250 swappedOutput = (amountIn - fee) * 118 / 100; // Multi-Asset rate
        
        emit SwapExecuted(user, amountIn, swappedOutput);
        return swappedOutput;
    }
}`);
      setPayload('Executed contract: SymSwapRouter.swapExactTokensForTokens()');
    } else if (key === 'nft') {
      setContractCode(`// SYM Minting Engine
// Zero-gas minting protocol for digital collectibles
contract SymbioteNFT {
    mapping(uint250 => address) public _owners;
    uint250 public totalMinted = 1042;

    public function mintSymbioticCollectable(
        string memory element, 
        address receiver
    ) external returns (uint250) {
        totalMinted += 1;
        _owners[totalMinted] = receiver;
        
        emit NFTMinted(receiver, totalMinted, element);
        return totalMinted;
    }
}`);
      setPayload('Executed contract: SymbioteNFT.mintSymbioticCollectable()');
    } else {
      setContractCode(`// Red Herring Puzzle Hook
// Dynamically verifies attester responsiveness and cuts idle stakes
contract PuzzleHook {
    public function executeDynamicIntegrityChallenge(
        bytes32 expectedPreimage,
        bytes32 providedSignature
    ) external view returns (bool) {
        // Red Herring puzzle check
        if (keccak256(providedSignature) != expectedPreimage) {
            revert("INTEGRITY_VIOLATION: Slash node stake!");
        }
        return true;
    }
}`);
      setPayload('Executed contract: PuzzleHook.executeDynamicIntegrityChallenge()');
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    const gas = txType === 'transfer' ? 21000 : txType === 'nft_mint' ? 45000 : 85000;
    
    onBroadcastTransaction({
      sender,
      receiver,
      amount: Number(amount) || 0,
      type: txType,
      gasUsed: gas,
      payload
    });

    // Reset some fields
    setAmount((10 + Math.floor(Math.random() * 190)).toString());
  };

  const handleDeployContract = () => {
    onBroadcastTransaction({
      sender: '0xDEPLOYER',
      receiver: '0xCONTRACT_SYM',
      amount: 0,
      type: 'swap_contract',
      gasUsed: 120000,
      payload: `Deployed logic size: ${contractCode.length} chars. Preset: ${selectedContract}`
    });
  };

  const filteredTxs = transactions.filter(t => {
    const q = searchQuery.toLowerCase();
    return t.id.toLowerCase().includes(q) || 
           t.sender.toLowerCase().includes(q) || 
           t.receiver.toLowerCase().includes(q) ||
           (t.payload && t.payload.toLowerCase().includes(q));
  });

  return (
    <div className="w-full bg-[#09090b] border border-zinc-900 rounded-xl p-5 flex flex-col gap-5" id="tx-sandbox-module">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <div>
            <h2 className="text-sm font-bold text-zinc-100 font-sans tracking-tight">
              Песочница Транзакций & Смарт-контрактов (Mempool & Explorer)
            </h2>
            <p className="text-[10px] text-zinc-500 font-sans">
              Опробование мгновенного прогона транзакций и вызова смарт-контрактов в сети Symbiosis
            </p>
          </div>
        </div>
        <button 
          onClick={onClearHistory}
          className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 border border-zinc-900 hover:border-zinc-800 bg-zinc-950 px-2 py-1 rounded cursor-pointer"
        >
          Очистить Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Creation Panel (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4 bg-zinc-950/60 p-4 border border-zinc-900/80 rounded-xl">
          
          <div className="flex border-b border-zinc-900 pb-1 shrink-0">
            <button
              onClick={() => { setActiveSubTab('create'); setTxType('transfer'); }}
              className={`pb-2 px-3 text-xs font-semibold font-sans transition-all cursor-pointer border-b ${
                activeSubTab === 'create'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Создать Транзакцию
            </button>
            <button
              onClick={() => { setActiveSubTab('contracts'); setTxType('swap_contract'); }}
              className={`pb-2 px-3 text-xs font-semibold font-sans transition-all cursor-pointer border-b ${
                activeSubTab === 'contracts'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Вызов Смарт-Контракта
            </button>
          </div>

          {activeSubTab === 'create' ? (
            <form onSubmit={handleBroadcast} className="flex flex-col gap-3 text-xs font-sans">
              
              {/* Type Select */}
              <div className="flex gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-850">
                <button
                  type="button"
                  onClick={() => { setTxType('transfer'); setPayload('Transfer funds'); }}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold font-sans transition-colors cursor-pointer ${
                    txType === 'transfer' ? 'bg-zinc-800 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Токены (SYM)
                </button>
                <button
                  type="button"
                  onClick={() => { setTxType('nft_mint'); setPayload('Mint Rare Symbiotic Avatar'); }}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold font-sans transition-colors cursor-pointer ${
                    txType === 'nft_mint' ? 'bg-zinc-800 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Mint NFT
                </button>
                <button
                  type="button"
                  onClick={() => { setTxType('swap_contract'); setPayload('Executed contract: SymSwapRouter.swapExactTokensForTokens()'); }}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold font-sans transition-colors cursor-pointer ${
                    txType === 'swap_contract' ? 'bg-zinc-800 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  DeFi Swap (LPs)
                </button>
              </div>

              {/* Sender & Receiver Address inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-1">Отправитель</label>
                  <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded p-1.5 text-zinc-300">
                    <User className="w-3.5 h-3.5 text-zinc-600 mr-1 shrink-0" />
                    <input 
                      type="text" 
                      value={sender} 
                      onChange={(e) => setSender(e.target.value)}
                      className="bg-transparent border-none outline-none w-full font-mono text-[11px]" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-1">Получатель</label>
                  <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded p-1.5 text-zinc-300">
                    <User className="w-3.5 h-3.5 text-zinc-600 mr-1 shrink-0" />
                    <input 
                      type="text" 
                      value={receiver} 
                      onChange={(e) => setReceiver(e.target.value)}
                      className="bg-transparent border-none outline-none w-full font-mono text-[11px]" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-1">Сумма (SYM)</label>
                <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded p-1.5 text-zinc-100 font-bold font-mono">
                  <DollarSign className="w-3.5 h-3.5 text-purple-400 mr-1 shrink-0" />
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-[11px]" 
                    min="1" 
                    required 
                  />
                </div>
              </div>

              {/* Payload payload */}
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block mb-1">Заметка транзакции (Payload)</label>
                <textarea 
                  value={payload} 
                  onChange={(e) => setPayload(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 rounded p-1.5 text-zinc-300 w-full font-mono text-[11px] h-14 resize-none outline-none focus:border-purple-600"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/15 text-center mt-1"
              >
                <Send className="w-3.5 h-3.5" /> Транслировать в Mempool SYM
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 font-sans text-xs">
              
              {/* Preset Selector */}
              <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-850 overflow-x-auto">
                <button
                  onClick={() => handleSelectContract('swap')}
                  className={`py-1 px-2 text-[10px] rounded font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedContract === 'swap' ? 'bg-zinc-800 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <FileCode className="w-3 h-3" /> Swap Router
                </button>
                <button
                  onClick={() => handleSelectContract('nft')}
                  className={`py-1 px-2 text-[10px] rounded font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedContract === 'nft' ? 'bg-zinc-800 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <FileCode className="w-3 h-3" /> NFT Contract
                </button>
                <button
                  onClick={() => handleSelectContract('puzzle')}
                  className={`py-1 px-2 text-[10px] rounded font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedContract === 'puzzle' ? 'bg-zinc-800 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <FileCode className="w-3 h-3" /> Integrity Puzzle
                </button>
              </div>

              {/* IDE Display */}
              <div className="relative rounded-lg overflow-hidden border border-zinc-900">
                <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 text-zinc-500 text-[10px] font-mono border-b border-zinc-950">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-purple-400" /> {selectedContract === 'swap' ? 'SymSwap.sol' : selectedContract === 'nft' ? 'SymbioteNFT.sol' : 'PuzzleHook.sol'}
                  </span>
                  <span>Solidity v0.8.20</span>
                </div>
                <textarea
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  className="w-full h-44 bg-zinc-950 text-[10.5px] p-3 text-emerald-400 font-mono outline-none leading-normal resize-none"
                />
              </div>

              <div className="p-2 border border-purple-900/30 bg-purple-950/15 rounded-lg text-[10px] text-purple-300 font-mono flex items-start gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Контракт автоматически скомпилируется и запустится на супер-быстром процессоре SYM Block Producer. Вызов будет стоить ~{selectedContract === 'swap' ? '85 000' : selectedContract === 'nft' ? '45 000' : '12 000'} лимита газа.
                </span>
              </div>

              <button 
                onClick={handleDeployContract}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/15 text-center mt-1"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Скомпилировать & Развернуть в блокчейн
              </button>

            </div>
          )}

        </div>

        {/* Right Side: Mempool and Ledger (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Active Mempool Stream */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
              <span className="text-[11px] font-mono tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Очередь Mempool (Получено узлами)
              </span>
              <span className="px-2 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 font-mono font-bold rounded text-[9px] animate-pulse">
                {mempool.length} В очереди
              </span>
            </div>

            {mempool.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-zinc-500 font-sans leading-loose border border-dashed border-zinc-900 rounded-lg">
                Очередь транзакций пуста. Нода симуляции автоматически транслирует новые вызовы на следующем блоке, либо создайте транзакцию вручную!
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                {mempool.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between bg-zinc-900/40 p-2 border border-zinc-900/50 rounded-lg text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="bg-zinc-800 text-purple-300 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase font-sans">
                        {tx.type === 'transfer' ? 'SYM' : tx.type === 'nft_mint' ? 'NFT' : 'SMART'}
                      </span>
                      <span className="text-zinc-300 font-bold">{tx.id}</span>
                      <span className="text-zinc-500 truncate max-w-[150px]">{tx.payload}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-purple-300 font-bold">{tx.amount} SYM</span>
                      <span className="text-[10px] text-zinc-500">Wait block</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Historical Ledger with Search Filter */}
          <div className="bg-[#09090b] border border-zinc-900 rounded-xl p-4 flex flex-col gap-3 flex-1">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-xs font-bold font-sans text-zinc-200">
                Записи Проводника Блоков (SYM Block Explorer)
              </span>

              {/* Simple search bar */}
              <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded px-2 py-1 text-zinc-400">
                <Search className="w-3 h-3 text-zinc-500 mr-1" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по хэшу/адресу..."
                  className="bg-transparent border-none outline-none font-mono text-[9px] w-28" 
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[220px] custom-scrollbar space-y-1.5">
              {filteredTxs.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-600 font-sans">
                  Транзакций не найдено по данному запросу.
                </div>
              ) : (
                filteredTxs.slice().reverse().map(tx => (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-900/50 hover:bg-zinc-900/20 rounded-lg text-xs font-mono cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {tx.status === 'committed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 animate-pulse" />
                      )}
                      
                      <div>
                        <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                          <span className="text-purple-300 font-extrabold">{tx.id}</span>
                          <span className="text-zinc-600 text-[9px] uppercase font-sans tracking-wide">
                            {tx.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{tx.payload || 'Transaction execute'}</p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-center">
                      <span className="font-bold text-emerald-400">{tx.amount} SYM</span>
                      <span className="text-[9px] text-zinc-600 tracking-tighter">Gas: {tx.gasUsed.toLocaleString()}</span>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Transaction Details Modal Backdrop */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-text">
          <div className="bg-[#09090b] border border-purple-900/40 rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-zinc-100 font-sans">
                  Диагностическая Квитанция SYM: {selectedTx.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 font-bold border border-zinc-900 bg-zinc-950 px-2 py-1 rounded cursor-pointer"
              >
                Закрыть
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 font-mono text-xs text-zinc-300 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-3.5 border-b border-zinc-900/60 pb-3">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">Hash транзакции</span>
                  <span className="font-bold text-purple-400 text-[11px] selection:bg-purple-900">{selectedTx.id}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase block mb-0.5">Статус окончательности (Finalized)</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Зафиксировано SYM
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-zinc-300 border-b border-zinc-900/60 pb-3">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Тип консенсуса:</span>
                  <span className="font-bold text-zinc-200">Symbiosis Parallel Pipeline (SYM)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Лимит Газа (Gas Limit):</span>
                  <span className="font-bold text-zinc-200">{selectedTx.gasUsed.toLocaleString()} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Отправитель (Sender):</span>
                  <span className="font-bold text-zinc-400 select-all">{selectedTx.sender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Получатель (Receiver):</span>
                  <span className="font-bold text-zinc-400 select-all">{selectedTx.receiver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Сумма платежа (Value):</span>
                  <span className="font-extrabold text-emerald-400">{selectedTx.amount} SYM</span>
                </div>
              </div>

              {/* Step Process Diagram */}
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 space-y-2.5">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block border-b border-zinc-900 pb-1.5">
                  Трассировка суб-секундного подтверждения (SYM Pipeline)
                </span>

                {/* Step 1 */}
                <div className="flex items-start gap-2 text-[11px]">
                  <div className="w-4 h-4 bg-purple-950 border border-purple-500 text-purple-300 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block">Мгновенный верификационный Trunk</span>
                    <p className="text-zinc-500 text-[10px]">Код смарт-контракта выполнен Block Producer. Затрачено {Math.round(selectedTx.gasUsed * 0.9)} Gas.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-2 text-[11px]">
                  <div className="w-4 h-4 bg-purple-950 border border-purple-500 text-purple-300 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block">Выборочные анонимные комиссии (Attester Pool)</span>
                    <p className="text-zinc-500 text-[10px]">Распараллеленные проверяющие ноды подписали хэш перехода в общей цепочке.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-2 text-[11px]">
                  <div className="w-4 h-4 bg-emerald-950 border border-emerald-500 text-emerald-300 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-zinc-100 block">Нулевая Локаут финализация за 120мс!</span>
                    <p className="text-emerald-400/90 text-[10px]">Угроза Среза при поиске Red Herrings Puzzle гарантирует 100% честность без нативного консенсусного фриза.</p>
                  </div>
                </div>
              </div>

              {selectedTx.payload && (
                <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-lg">
                  <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Декодированные данные payload</span>
                  <code className="text-emerald-400 text-[11px] block break-all">{selectedTx.payload}</code>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
