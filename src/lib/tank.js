// /lib/tank: functions for funding transactions

import { waitForTransactionConfirm } from './txn';
import { CHECK_BLOCK_EVERY_MS } from './constants';

//NOTE if accessing this in a localhost configuration fails with "CORS request
//     did not succeed", you might need to visit localhost:3001 or whatever
//     explicitly and tell your browser that's safe to access.
//     https://stackoverflow.com/a/53011185/1334324
const baseUrl = 'https://gas-tank.urbit.org:3001';

function sendRequest(where, what) {
  return new Promise((resolve, reject) => {
    fetch(baseUrl + where, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(what),
    })
      .then(response => {
        if (response.ok) {
          resolve(response.json());
        } else {
          reject(response);
        }
      })
      .catch(reject);
  });
}

const remainingTransactions = point => {
  if (typeof point === 'string') point = Number(point);
  return sendRequest('/point', { point: point });
};

const fundTransactions = signedTxs => {
  return sendRequest('/request', { txs: signedTxs });
};

// resolves when address has at least cost balance
// returns true if gas tank was used, false otherwise
// askForFunding: callback that takes (address, requiredBalance, currentBalance)
//                and tells the user to get that address the required balance
// gotFunding: optional callback that stops telling the user to go get funding
const ensureFundsFor = async (
  web3,
  point,
  address,
  cost,
  signedTxs,
  askForFunding,
  gotFunding
) => {
  let balance = await web3.eth.getBalance(address);

  if (cost > balance) {
    try {
      if (point !== null) {
        const fundsRemaining = await remainingTransactions(point);
        if (fundsRemaining < signedTxs.length) {
          throw new Error('tank: request invalid');
        }
      } else {
        console.log('tank: skipping remaining-funds check');
        //TODO if we can't always (easily) provide a point, and the
        //     fundTransactions call is gonna fail anyway, should we maybe
        //     just not bother doing this check in the first place?
      }

      const res = await fundTransactions(signedTxs);
      if (!res.success) {
        throw new Error('tank: request rejected');
      } else {
        await waitForTransactionConfirm(web3, res.txHash);
        let newBalance = await web3.eth.getBalance(address);
        console.log(
          'tank: funds have confirmed',
          balance >= cost,
          balance,
          newBalance
        );
        return true;
      }
    } catch (e) {
      console.log('tank: funding failed', e);
      await waitForBalance(web3, address, cost, askForFunding, gotFunding);
    }
  } else {
    console.log('tank: already have sufficient funds');
  }
  return false;
};

// resolves when address has at least minBalance
//
//TODO should maybe do a "we got it" callback also, so clients can hide msg?
async function waitForBalance(
  web3,
  address,
  minBalance,
  askForFunding,
  gotFunding
) {
  console.log('tank: awaiting balance', address, minBalance);
  return new Promise((resolve, reject) => {
    const checkForBalance = async () => {
      const balance = await web3.eth.getBalance(address);

      if (balance >= minBalance) {
        if (gotFunding) {
          gotFunding();
        }

        resolve();
      } else {
        // TODO: minBalance is a `number` type
        // but we want to display ETH, which will never accept a number
        // but instead wants string or BN/BigNumber.
        // this will be heavily refactored to correctly do BN math, but until
        // then we'll manually convert this number to an integer string
        askForFunding(address, minBalance.toFixed(), balance);
        setTimeout(checkForBalance, CHECK_BLOCK_EVERY_MS);
      }
    };

    checkForBalance();
  });
}

export { remainingTransactions, fundTransactions, ensureFundsFor };
