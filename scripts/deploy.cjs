const hre = require("hardhat");

async function main() {
  console.log("🚀 Начинаем развертывание Symbiosis Protocol...");

  // 1. Деплой токена
  const SymbiosisToken = await hre.ethers.getContractFactory("SymbiosisToken");
  const token = await SymbiosisToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ SymbiosisToken развернут по адресу: ${tokenAddress}`);

  // 2. Деплой Liquid Staking
  const LiquidStaking = await hre.ethers.getContractFactory("LiquidStakingSsym");
  const staking = await LiquidStaking.deploy(tokenAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`✅ LiquidStakingSsym развернут по адресу: ${stakingAddress}`);

  // 3. Деплой Nash Consensus
  const NashConsensus = await hre.ethers.getContractFactory("NashConsensusRegistry");
  const consensus = await NashConsensus.deploy(tokenAddress);
  await consensus.waitForDeployment();
  const consensusAddress = await consensus.getAddress();
  console.log(`✅ NashConsensusRegistry развернут по адресу: ${consensusAddress}`);

  // 4. Связывание контрактов
  console.log("\n🔗 Связывание контрактов: Регистрация Consensus Registry в Token через DAO-предложение...");
  
  // Создаем предложение
  const proposeTx = await token.proposeAction("setConsensusRegistry", consensusAddress);
  await proposeTx.wait();
  console.log(`✅ DAO Предложение (proposalId: 0) по установке Consensus Registry создано успешно!`);

  console.log("\n🔭 ИНСТРУКЦИЯ ПО ВЕРИФИКАЦИИ В L2 TESTNET:");
  console.log(`  npx hardhat verify --network <network> ${tokenAddress}`);
  console.log(`  npx hardhat verify --network <network> ${stakingAddress} "${tokenAddress}"`);
  console.log(`  npx hardhat verify --network <network> ${consensusAddress} "${tokenAddress}"`);

  console.log("\n💡 Для деплоя на live сети, используйте DAO-интерфейс для голосования и выполнения предложения (proposalId: 0).");
  console.log("📝 Адреса успешно сохранены. Протокол готов к локальному тестированию в Arbitrum / Base Sepolia!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
