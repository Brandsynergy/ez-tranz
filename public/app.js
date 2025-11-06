let currentAmount = '';
let currentSessionId = null;
let statusCheckInterval = null;

// DOM Elements
const amountScreen = document.getElementById('amount-screen');
const qrScreen = document.getElementById('qr-screen');
const successScreen = document.getElementById('success-screen');
const amountInput = document.getElementById('amount-input');
const chargeBtn = document.getElementById('charge-btn');
const numButtons = document.querySelectorAll('.num-btn');
const cancelQrBtn = document.getElementById('cancel-qr');
const newTransactionBtn = document.getElementById('new-transaction');

// Numpad functionality
numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const value = btn.dataset.num;
        const action = btn.dataset.action;

        if (action === 'clear') {
            currentAmount = currentAmount.slice(0, -1);
        } else if (value === '.' && currentAmount.includes('.')) {
            return; // Don't allow multiple decimals
        } else if (value === '.' && currentAmount === '') {
            currentAmount = '0.';
        } else {
            // Limit to 2 decimal places
            if (currentAmount.includes('.')) {
                const parts = currentAmount.split('.');
                if (parts[1] && parts[1].length >= 2) return;
            }
            currentAmount += value;
        }

        amountInput.value = currentAmount;
        chargeBtn.disabled = !isValidAmount(currentAmount);
    });
});

// Check if amount is valid
function isValidAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
}

// Show screen
function showScreen(screenToShow) {
    [amountScreen, qrScreen, successScreen].forEach(screen => {
        screen.classList.remove('active');
    });
    screenToShow.classList.add('active');
}

// Charge button click - Generate QR code
chargeBtn.addEventListener('click', async () => {
    if (!isValidAmount(currentAmount)) return;

    const amount = parseFloat(currentAmount);
    document.getElementById('qr-amount-text').textContent = amount.toFixed(2);

    try {
        chargeBtn.classList.add('loading');
        chargeBtn.disabled = true;

        // Create payment session
        const response = await fetch('/create-payment-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        const { sessionId, paymentUrl, error } = await response.json();

        if (error) {
            throw new Error(error);
        }

        currentSessionId = sessionId;

        // Clear previous QR code
        const qrcodeDiv = document.getElementById('qrcode');
        qrcodeDiv.innerHTML = '';

        // Generate QR code
        new QRCode(qrcodeDiv, {
            text: paymentUrl,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        showScreen(qrScreen);

        // Start checking payment status
        startStatusCheck();
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        chargeBtn.classList.remove('loading');
        chargeBtn.disabled = false;
    }
});

// Check payment status periodically
function startStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }

    statusCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`/payment-status/${currentSessionId}`);
            const { status, amount } = await response.json();

            if (status === 'paid') {
                clearInterval(statusCheckInterval);
                document.getElementById('success-amount').textContent = amount.toFixed(2);
                showScreen(successScreen);
                resetTransaction();
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    }, 2000); // Check every 2 seconds
}

// Cancel QR code
cancelQrBtn.addEventListener('click', () => {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
    showScreen(amountScreen);
});

// New transaction
newTransactionBtn.addEventListener('click', () => {
    showScreen(amountScreen);
});

// Reset transaction
function resetTransaction() {
    currentAmount = '';
    amountInput.value = '';
    chargeBtn.disabled = true;
    currentSessionId = null;
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
}

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}
