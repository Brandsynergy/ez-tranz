// Initialize Stripe (publishable key will be injected)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51QRYigP9l4WUjJRq9XyGxzBVPzn4GxOTfZZ0zEqZY8qZP9E6oZMG9h5yVLcqYz7L8wXqN5fYwZ9xXqN5fYwZ9xXq00ABCDEFGH'; // Replace with your actual key
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

let elements;
let currentAmount = '';

// DOM Elements
const amountScreen = document.getElementById('amount-screen');
const paymentScreen = document.getElementById('payment-screen');
const successScreen = document.getElementById('success-screen');
const amountInput = document.getElementById('amount-input');
const chargeBtn = document.getElementById('charge-btn');
const numButtons = document.querySelectorAll('.num-btn');
const submitPaymentBtn = document.getElementById('submit-payment');
const cancelPaymentBtn = document.getElementById('cancel-payment');
const newTransactionBtn = document.getElementById('new-transaction');
const paymentMessage = document.getElementById('payment-message');

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
    [amountScreen, paymentScreen, successScreen].forEach(screen => {
        screen.classList.remove('active');
    });
    screenToShow.classList.add('active');
}

// Charge button click
chargeBtn.addEventListener('click', async () => {
    if (!isValidAmount(currentAmount)) return;

    const amount = parseFloat(currentAmount);
    document.getElementById('payment-amount-text').textContent = amount.toFixed(2);

    try {
        chargeBtn.classList.add('loading');
        chargeBtn.disabled = true;

        // Create payment intent
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });

        const { clientSecret, error } = await response.json();

        if (error) {
            throw new Error(error);
        }

        // Initialize Stripe Elements
        elements = stripe.elements({ clientSecret });
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');

        showScreen(paymentScreen);
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        chargeBtn.classList.remove('loading');
        chargeBtn.disabled = false;
    }
});

// Submit payment
submitPaymentBtn.addEventListener('click', async () => {
    submitPaymentBtn.disabled = true;
    submitPaymentBtn.classList.add('loading');
    paymentMessage.textContent = '';

    try {
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required'
        });

        if (error) {
            paymentMessage.textContent = error.message;
            submitPaymentBtn.disabled = false;
            submitPaymentBtn.classList.remove('loading');
        } else {
            // Payment successful
            document.getElementById('success-amount').textContent = currentAmount;
            showScreen(successScreen);
            resetTransaction();
        }
    } catch (error) {
        paymentMessage.textContent = 'Payment failed. Please try again.';
        submitPaymentBtn.disabled = false;
        submitPaymentBtn.classList.remove('loading');
    }
});

// Cancel payment
cancelPaymentBtn.addEventListener('click', () => {
    showScreen(amountScreen);
    paymentMessage.textContent = '';
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
    submitPaymentBtn.disabled = false;
    submitPaymentBtn.classList.remove('loading');
}

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}
