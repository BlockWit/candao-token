import api from './api';

// Connect to MetaMask
document.getElementById('connect').addEventListener('click', async () => {
  await api.getAccounts();
});

document.getElementById('reward-cdo').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = document.getElementById('reward-cdo-feedback');
  feedback.classList.add('d-none');
  try {
    const amount = document.getElementById('amount-1').value;
    const referral = document.getElementById('referral-address-1').value;
    const tx = await api.buyWithCDOReferral(amount, referral);
    feedback.innerHTML = 'Sent. Waiting for transaction to be mined.';
    feedback.classList.add('text-success');
    feedback.classList.remove('text-danger', 'd-none');
    await api.waitForTransaction(tx.hash);
    feedback.innerHTML = 'Success.';
  } catch (error) {
    feedback.innerHTML = error;
    feedback.classList.add('text-danger');
    feedback.classList.remove('text-success', 'd-none');
  }
});

document.getElementById('reward-eth').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = document.getElementById('reward-eth-feedback');
  feedback.classList.add('d-none');
  try {
    const amount = document.getElementById('amount-2').value;
    const referral = document.getElementById('referral-address-2').value;
    const tx = await api.buyWithETHReferral(amount, referral);
    feedback.innerHTML = 'Sent. Waiting for transaction to be mined.';
    feedback.classList.add('text-success');
    feedback.classList.remove('text-danger', 'd-none');
    await api.waitForTransaction(tx.hash);
    feedback.innerHTML = 'Success.';
  } catch (error) {
    feedback.innerHTML = error;
    feedback.classList.add('text-danger');
    feedback.classList.remove('text-success', 'd-none');
  }
});

document.getElementById('withdraw').addEventListener('submit', async (event) => {
  event.preventDefault();
  const feedback = document.getElementById('withdraw-feedback');
  feedback.classList.add('d-none');
  try {
    const tx = await api.withdraw();
    feedback.innerHTML = 'Sent. Waiting for transaction to be mined.';
    feedback.classList.add('text-success');
    feedback.classList.remove('text-danger', 'd-none');
    await api.waitForTransaction(tx.hash);
    feedback.innerHTML = 'Success.';
  } catch (error) {
    feedback.innerHTML = error;
    feedback.classList.add('text-danger');
    feedback.classList.remove('text-success', 'd-none');
  }
});
