import { ethers } from "ethers";
import readline from "readline";
import chalk from "chalk";
import figlet from "figlet";
import fs from "fs";
import path from "path";


const IUniswapV2RouterABI = JSON.parse(
  fs.readFileSync(path.resolve("./node_modules/@uniswap/v2-periphery/build/IUniswapV2Router02.json"))
);

figlet('bactiar 291', (err, data) => {
  if (err) {
    console.log('Error generating banner:', err);
    return;
  }

  console.log(chalk.greenBright(data));
  console.log(chalk.yellowBright("\nPlease enter your private key below:\n"));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Private key: ', (privateKey) => {
    rl.close();

    
    const rpcUrl = 'https://rpc.testnet.citrea.xyz';
    const network = {
      name: "citrea-testnet",
      chainId: 5115,
    };

    const provider = new ethers.JsonRpcProvider(rpcUrl, network);
    const wallet = new ethers.Wallet(privateKey, provider);

    
    const uniswapRouterAddress = "0xb45670f668EE53E62b5F170B5B1d3C6701C8d03A";
    const uniswapRouter = new ethers.Contract(uniswapRouterAddress, IUniswapV2RouterABI.abi, wallet);

    
    const WBTC = "0x8d0c9d1c17aE5e40ffF9bE350f57840E9E66Cd93"; 
    const USDC = "0xb669dC8cC6D044307Ba45366C0c836eC3c7e31AA"; 

    
    const swapTokens = async (fromToken, toToken, amountIn, amountOutMin) => {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; 

      try {
        const tx = await uniswapRouter.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          [fromToken, toToken],
          wallet.address,
          deadline
        );
        console.log(`Swap transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`Swap transaction confirmed: ${tx.hash}`);
      } catch (error) {
        console.error("Error during swap:", error);
      }
    };

   
    const approveToken = async (tokenAddress, amount) => {
      const token = new ethers.Contract(
        tokenAddress,
        ["function approve(address spender, uint256 amount) public returns (bool)"],
        wallet
      );

      try {
        const tx = await token.approve(uniswapRouterAddress, amount);
        console.log(`Approval transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`Approval transaction confirmed: ${tx.hash}`);
      } catch (error) {
        console.error("Error during approval:", error);
      }
    };

    
    const autoSwap = async () => {
      const amountIn = ethers.parseUnits("0.00000012", 8); 
      const amountOutMin = ethers.parseUnits("0.00012", 6); 

      while (true) {
        console.log("Swapping WBTC to USDC...");
        await approveToken(WBTC, amountIn);
        await swapTokens(WBTC, USDC, amountIn, amountOutMin);

        console.log("Swapping USDC to WBTC...");
        await approveToken(USDC, amountOutMin);
        await swapTokens(USDC, WBTC, amountOutMin, amountIn);
      }
    };

    
    autoSwap();
  });
});
