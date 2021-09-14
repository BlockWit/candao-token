import api from './api';

api.handleAccountsChange(accounts => {
  if (accounts.length) {
    document.getElementById('connect-message').innerHTML = accounts[0];
    document.getElementById('connect').disabled = true;
    document.getElementById('connect').innerHTML = 'Connected!';
  } else {
    document.getElementById('connect-message').innerHTML = 'Connect Your MetaMask wallet here ->';
    document.getElementById('connect').disabled = false;
    document.getElementById('connect').innerHTML = 'Connect';
  }
});

// Don't mess with it. Just reload
api.handleChainChange(() => {
  window.location.reload();
});

// Connect to MetaMask
document.getElementById('connect').addEventListener('click', async event => {
  const accounts = await api.getAccounts();
  if (accounts.length) {
    document.getElementById('connect-message').innerHTML = accounts[0];
    event.target.disabled = true;
    event.target.innerHTML = 'Connected!';
  }
});

document.getElementById('reward-cdo').addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleFormError('reward-cdo-feedback', async feedback => {
    const amount = document.getElementById('amount-1').value;
    const referral = document.getElementById('referral-address-1').value;
    const tx = await api.buyWithCDOReferral(amount, referral);
    feedback.innerHTML = 'Sent. Waiting for transaction to be mined.';
    feedback.classList.remove('d-none');
    await api.waitForTransaction(tx.hash);
    feedback.innerHTML = 'Success.';
  });
});

document.getElementById('reward-eth').addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleFormError('reward-eth-feedback', async feedback => {
    const amount = document.getElementById('amount-2').value;
    const referral = document.getElementById('referral-address-2').value;
    const tx = await api.buyWithETHReferral(amount, referral);
    feedback.innerHTML = 'Sent. Waiting for transaction to be mined.';
    feedback.classList.remove('d-none');
    await api.waitForTransaction(tx.hash);
    feedback.innerHTML = 'Success.';
  });
});

document.getElementById('withdraw').addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleFormError('withdraw-feedback', async feedback => {
    const tx = await api.withdraw();
    feedback.innerHTML = 'Sent. Waiting for transaction to be mined.';
    feedback.classList.remove('d-none');
    await api.waitForTransaction(tx.hash);
    feedback.innerHTML = 'Success.';
  });
});

document.getElementById('account-info').addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleFormError('account-info-feedback', async feedback => {
    feedback.innerHTML = 'Requesting account info. Please, wait.';
    feedback.classList.remove('d-none');
    const [address] = await api.getAccounts();
    const { initialCDO, withdrawedCDO, balanceETH } = await api.requestAccountInfo(address);
    feedback.innerHTML = `<dl><dt>CDO initial:</dt><dd>${initialCDO}</dd><dt>CDO withdrawed:</dt><dd>${withdrawedCDO}</dd><dt>ETH balance:</dt><dd>${balanceETH}</dd></dl>`;
  });
});

document.getElementById('sign-message').addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleFormError('sign-message-feedback', async feedback => {
    const message = document.getElementById('message').value;
    const signedMessage = await api.signMessage(message);
    feedback.innerHTML = `Signed message:<br/>${signedMessage}`;
  });
});

// make form user-friendly
async function handleFormError (feedbackElementId, tryBlock) {
  const feedback = document.getElementById(feedbackElementId);
  feedback.classList.add('d-none');
  try {
    feedback.classList.add('text-success');
    feedback.classList.remove('text-danger');
    await tryBlock(feedback);
    feedback.classList.remove('d-none');
  } catch (error) {
    feedback.classList.add('text-danger');
    if (typeof error === 'object' && error.message) feedback.innerHTML = error.message;
    else if (typeof error === 'string') feedback.innerHTML = error;
    else feedback.innerHTML = 'Something went wrong (See console for details)';
    feedback.classList.remove('text-success', 'd-none');
  }
}
