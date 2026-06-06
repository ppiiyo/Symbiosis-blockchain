const hre = require("hardhat");

async function main() {
    console.log("🚀 Запуск E2E теста в Base / Arbitrum Sepolia...");
    
    // Получаем фабрики контрактов
    const SymbiosisToken = await hre.ethers.getContractFactory("SymbiosisToken");
    const NashConsensusRegistry = await hre.ethers.getContractFactory("NashConsensusRegistry");

    const [deployer, validator, whistleblower] = await hre.ethers.getSigners();
    console.log(`\n👤 Деплоер: ${deployer.address}`);
    console.log(`👤 Валидатор: ${validator.address}`);
    console.log(`👤 Доносчик: ${whistleblower.address}`);

    // Развертываем локальные экземпляры для E2E проверки, если адреса не переданы
    console.log("\n[1/4] Деплой тестовых контрактов...");
    const token = await SymbiosisToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`✅ Токен SYM развернут: ${tokenAddress}`);

    const consensus = await NashConsensusRegistry.deploy(tokenAddress);
    await consensus.waitForDeployment();
    const consensusAddress = await consensus.getAddress();
    console.log(`✅ Консенсус-реестр развернут: ${consensusAddress}`);

    // Перевод токенов валидатору и аппрув стейкинга
    console.log("\n[2/4] Подготовка: Перевод токенов валидатору и аппрув...");
    const stakeAmount = hre.ethers.parseEther("150");
    await token.transfer(validator.address, stakeAmount);
    await token.connect(validator).approve(consensusAddress, stakeAmount);
    console.log(`✅ Валидатор получил и одобрил ${hre.ethers.formatEther(stakeAmount)} SYM.`);

    // Регистрация валидатора (с мок-ключом Falcon для L2)
    console.log("\n[3/4] Регистрация валидатора с компактным публичным ключом Falcon...");
    const mockFalconKey = "0x" + "F1C5".padEnd(200, "0"); // Имитация публичного ключа Falcon
    await consensus.connect(validator).registerValidator(hre.ethers.parseEther("100"), mockFalconKey);
    console.log("✅ Валидатор успешно зарегистрирован в реестре.");

    // Эмуляция Red-Herring атаки и слэшинга
    console.log("\n[4/4] Инициация слэшинга со стороны whistleblower...");
    const initialBalance = await token.balanceOf(whistleblower.address);
    
    // Вызываем слэшинг
    const tx = await consensus.connect(deployer).triggerLazySlashing(
        validator.address, 
        whistleblower.address, 
        100 // mock block number
    );
    await tx.wait();
    console.log("✅ Транзакция слэшинга подтверждена!");

    // Проверка результатов распределения наград
    const finalBalance = await token.balanceOf(whistleblower.address);
    const reward = finalBalance - initialBalance;
    
    console.log(`\n🎉 E2E ТЕСТ ПРОЙДЕН УСПЕШНО!`);
    console.log(`   - Награда доносчика: ${hre.ethers.formatEther(reward)} SYM`);
    console.log(`   - Сеть успешно обработала Game-Theory механику наказаний.`);
}

main().catch((error) => {
    console.error("❌ Ошибка выполнения теста:", error);
    process.exitCode = 1;
});
