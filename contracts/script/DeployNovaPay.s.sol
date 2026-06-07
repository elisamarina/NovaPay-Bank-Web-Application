// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Script, console2} from "forge-std/Script.sol";

import {NovaPayGateway} from "../src/NovaPayGateway.sol";
import {NovaPayStakingVault} from "../src/NovaPayStakingVault.sol";
import {NovaUSD} from "../src/NovaUSD.sol";
import {ChainlinkPriceOracle} from "../src/oracles/ChainlinkPriceOracle.sol";

/// @notice Deploys the NovaPay Base Sepolia staking MVP.
/// @dev Use Foundry keystore accounts with `forge script --account`, not raw private keys.
contract DeployNovaPay is Script {
    address internal constant DEFAULT_OWNER = 0xC3616f92ecEEabb61fa0BC7f14b70aC531c8D63d;
    uint256 internal constant DEFAULT_MIN_ETH_DEPOSIT = 0.001 ether;
    uint256 internal constant DEFAULT_MIN_VAULT_DEPOSIT = 1e18;
    uint256 internal constant DEFAULT_APR_BPS = 700;
    uint256 internal constant DEFAULT_YEAR_IN_SECONDS = 365 days;
    uint256 internal constant DEFAULT_ORACLE_MAX_AGE = 1 hours;
    uint256 internal constant DEFAULT_SEQUENCER_GRACE_PERIOD = 1 hours;

    struct DeployConfig {
        address owner;
        address rewardReserve;
        address ethUsdFeed;
        address sequencerUptimeFeed;
        uint256 oracleMaxAge;
        uint256 sequencerGracePeriod;
        uint256 minEthDeposit;
        uint256 minVaultDeposit;
        uint256 aprBps;
        uint256 yearInSeconds;
    }

    function run() external {
        DeployConfig memory config = _loadConfig();
        vm.startBroadcast();

        NovaUSD novaUsd = new NovaUSD(config.owner);
        ChainlinkPriceOracle oracle = new ChainlinkPriceOracle(
            config.ethUsdFeed, config.oracleMaxAge, config.sequencerUptimeFeed, config.sequencerGracePeriod
        );
        NovaPayGateway gateway =
            new NovaPayGateway(address(novaUsd), address(oracle), config.minEthDeposit, config.owner);
        NovaPayStakingVault stakingVault = new NovaPayStakingVault(
            novaUsd, config.rewardReserve, config.minVaultDeposit, config.aprBps, config.yearInSeconds, config.owner
        );

        novaUsd.setMinter(address(gateway), true);

        vm.stopBroadcast();

        console2.log("NovaPay Base Sepolia deployment");
        console2.log("owner", config.owner);
        console2.log("rewardReserve", config.rewardReserve);
        console2.log("CHAINLINK_ETH_USD_FEED", config.ethUsdFeed);
        console2.log("NovaUSD", address(novaUsd));
        console2.log("ChainlinkPriceOracle", address(oracle));
        console2.log("NovaPayGateway", address(gateway));
        console2.log("NovaPayStakingVault", address(stakingVault));
        console2.log("");
        console2.log("Frontend env:");
        console2.log("NEXT_PUBLIC_NOVAPAY_NOVAUSD_ADDRESS=%s", address(novaUsd));
        console2.log("NEXT_PUBLIC_NOVAPAY_GATEWAY_ADDRESS=%s", address(gateway));
        console2.log("NEXT_PUBLIC_NOVAPAY_STAKING_VAULT_ADDRESS=%s", address(stakingVault));
    }

    function _loadConfig() private view returns (DeployConfig memory config) {
        config.owner = vm.envOr("NOVAPAY_OWNER", DEFAULT_OWNER);
        config.rewardReserve = vm.envOr("NOVAPAY_REWARD_RESERVE", config.owner);
        config.ethUsdFeed = vm.envAddress("CHAINLINK_ETH_USD_FEED");
        config.sequencerUptimeFeed = vm.envOr("CHAINLINK_SEQUENCER_UPTIME_FEED", address(0));
        config.oracleMaxAge = vm.envOr("CHAINLINK_MAX_AGE", DEFAULT_ORACLE_MAX_AGE);
        config.sequencerGracePeriod = vm.envOr("CHAINLINK_SEQUENCER_GRACE_PERIOD", DEFAULT_SEQUENCER_GRACE_PERIOD);
        config.minEthDeposit = vm.envOr("NOVAPAY_MIN_ETH_DEPOSIT", DEFAULT_MIN_ETH_DEPOSIT);
        config.minVaultDeposit = vm.envOr("NOVAPAY_MIN_VAULT_DEPOSIT", DEFAULT_MIN_VAULT_DEPOSIT);
        config.aprBps = vm.envOr("NOVAPAY_APR_BPS", DEFAULT_APR_BPS);
        config.yearInSeconds = vm.envOr("NOVAPAY_YEAR_IN_SECONDS", DEFAULT_YEAR_IN_SECONDS);
    }
}
