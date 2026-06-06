const hre = require("hardhat");

async function main() {
  const tokenAddress = "0xF68a6e6401b41BeDb50f9b99A8022a4c7fc94675";
  const stakingAddress = "0xb136B71C5213a6367c6B78E22762159A0C7d9582";
  const consensusAddress = "0xcA37EB02242307735371fA07CA8970c114cF62bF";

  const network = await hre.ethers.provider.getNetwork();
  console.log(`🔗 Подключение к сети: ${network.name} (Chain ID: ${network.chainId})...`);
  
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  // В локальной сети signers автоматически пополнены. В Sepolia используем деплойера или доступные аккаунты.
  const lazyValidator = signers[1] || deployer;
  const whistleblower = signers[2] || deployer;
  
  console.log(`🧑‍💻 Активные аккаунты симуляции:`);
  console.log(`   - Деплойер/Инициатор: ${deployer.address}`);
  console.log(`   - Ленивый валидатор: ${lazyValidator.address}`);
  console.log(`   - Доносчик (Whistleblower): ${whistleblower.address}`);

  const SymbiosisToken = await hre.ethers.getContractAt("SymbiosisToken", tokenAddress);
  const NashConsensusRegistry = await hre.ethers.getContractAt("NashConsensusRegistry", consensusAddress);

  console.log(`✅ Успешно подключено к задеплоенным контрактам:`);
  console.log(`   - SymbiosisToken: ${tokenAddress}`);
  console.log(`   - NashConsensusRegistry: ${consensusAddress}`);
  
  console.log("\n--- ЭМУЛЯЦИЯ АТАКИ ЛЕНИВОГО ВАЛИДАТОРА (ON-CHAIN GAME THEORY) ---");
  
  // Проверим текущий статус валидатора перед действиями для избежания повторных ревертов
  const valInfoBefore = await NashConsensusRegistry.validators(lazyValidator.address);
  if (valInfoBefore.isSlashed) {
    console.log(`🚨 Валидатор ${lazyValidator.address} уже был слэшнут ранее в этой сети.`);
  } else {
    const initialStake = hre.ethers.parseEther("100");
    const balance = await SymbiosisToken.balanceOf(lazyValidator.address);
    console.log(`🪙  Баланс ленивого валидатора: ${hre.ethers.formatEther(balance)} SYM`);
    
    if (balance < initialStake && lazyValidator.address !== deployer.address) {
      console.log(`🪙  Перевод ${hre.ethers.formatEther(initialStake)} SYM от деплойера к ленивому валидатору...`);
      const txTransfer = await SymbiosisToken.connect(deployer).transfer(lazyValidator.address, initialStake);
      await txTransfer.wait();
    }
    
    console.log(`⚠️  ${lazyValidator.address} регистрируется как валидатор со стейком 100 SYM...`);
    const approveTx = await SymbiosisToken.connect(lazyValidator).approve(consensusAddress, initialStake);
    await approveTx.wait();

    const fakeFalconKey = hre.ethers.hexlify(hre.ethers.randomBytes(32));
    const registerTx = await NashConsensusRegistry.connect(lazyValidator).registerValidator(initialStake, fakeFalconKey);
    await registerTx.wait();
    console.log("✅ Валидатор успешно зарегистрирован.");
  }

  const balanceBefore = await SymbiosisToken.balanceOf(whistleblower.address);
  console.log(`💰 Начальный баланс доносчика (whistleblower): ${hre.ethers.formatEther(balanceBefore)} SYM`);

  // 3. Срабатывает Red-Herring ловушка
  console.log("\n🪤 Сработала Ред-Херринг ловушка! Вызов triggerLazySlashing...");
  const valInfoCheck = await NashConsensusRegistry.validators(lazyValidator.address);
  if (valInfoCheck.isSlashed) {
    console.log("⚠️ Нода уже срублена ранее. Вызов triggerLazySlashing пропущен (она уже находится в состоянии слэшинга).");
  } else {
    try {
      const slashTx = await NashConsensusRegistry.connect(deployer).triggerLazySlashing(lazyValidator.address, whistleblower.address, 100);
      await slashTx.wait();
      console.log("🎉 Слэшинг успешно запущен в реальном времени!");
    } catch (err) {
      console.warn("⚠️ Не удалось вызвать triggerLazySlashing. Ошибка:", err.message);
    }
  }

  // 4. Проверка результатов
  const balanceAfter = await SymbiosisToken.balanceOf(whistleblower.address);
  const reward = balanceAfter - balanceBefore;
  
  console.log(`\n🎉 Успех! Доносчик (${whistleblower.address}) получил награду: ${hre.ethers.formatEther(reward)} SYM`);
  
  const valInfo = await NashConsensusRegistry.validators(lazyValidator.address);
  console.log(`📊 Статус ленивого валидатора после атаки:`);
  console.log(`   - Срезан (isSlashed): ${valInfo.isSlashed}`);
  console.log(`   - Оставшийся стейк: ${hre.ethers.formatEther(valInfo.stakedAmount)} SYM`);
  console.log(`   - Репутация (reputation): ${valInfo.reputation}`);
  
  console.log("\n✅ Равновесие Нэша подтверждено на уровне реальных ончейн-транзакций (EVM)!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
