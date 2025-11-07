let currentAmount = '';
let currentSessionId = null;
let statusCheckInterval = null;
let currentTransaction = null; // Store current transaction details for receipt

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

let BRANDING = null;

function initApp() {
    console.log('Initializing EZ TRANZ app...');
    
    // DOM Elements
    const amountScreen = document.getElementById('amount-screen');
    const qrScreen = document.getElementById('qr-screen');
    const successScreen = document.getElementById('success-screen');
    const amountInput = document.getElementById('amount-input');
    const chargeBtn = document.getElementById('charge-btn');
    const numButtons = document.querySelectorAll('.num-btn');
    const cancelQrBtn = document.getElementById('cancel-qr');
    const newTransactionBtn = document.getElementById('new-transaction');
    const currencySelect = document.getElementById('currency-select');
    const currencySymbol = document.getElementById('currency-symbol');
    const currencyHint = document.getElementById('currency-hint');
    
    // Try to load branding (if merchant is logged in on this browser)
    loadBranding().catch(() => {});
    
    // Check if elements exist
    if (!numButtons.length) {
        console.error('Number buttons not found!');
        return;
    }
    
    console.log('Found', numButtons.length, 'number buttons');
    console.log('Currency hint element:', currencyHint ? 'Found' : 'NOT FOUND');

// Initialize hint with default currency on load
function updateCurrencyHint() {
    const selectedOption = currencySelect.options[currencySelect.selectedIndex];
    const symbol = selectedOption.getAttribute('data-symbol');
    const minAmount = selectedOption.getAttribute('data-min');
    currencySymbol.textContent = symbol;
    if (currencyHint) {
        currencyHint.innerHTML = `ℹ️ <strong>Minimum:</strong> ${symbol}${minAmount}`;
    }
    console.log('Currency:', currencySelect.value, symbol, 'Min:', minAmount);
}

// Update on page load
updateCurrencyHint();

// Update when currency changes
currencySelect.addEventListener('change', updateCurrencyHint);

// Load branding and apply theme
async function loadBranding() {
    try {
        const res = await fetch('/api/merchant/settings');
        if (!res.ok) return; // Not logged in
        BRANDING = await res.json();
        applyBranding(BRANDING);
    } catch (e) {
        // ignore
    }
}

function applyBranding(settings) {
    const root = document.documentElement;
    if (settings.primaryColor) root.style.setProperty('--brand-primary', settings.primaryColor);
    if (settings.secondaryColor) root.style.setProperty('--brand-secondary', settings.secondaryColor);
    
    const logoContainer = document.getElementById('merchant-logo');
    const logoImg = document.getElementById('merchant-logo-img');
    const logoEl = document.getElementById('terminal-logo');
    
    // Show merchant logo if exists, hide text logo
    if (settings.logoUrl && logoContainer && logoImg) {
        logoImg.src = settings.logoUrl;
        logoImg.alt = settings.businessName || 'Merchant Logo';
        logoContainer.style.display = 'block';
        // Hide the text logo when image logo is shown
        if (logoEl) logoEl.style.display = 'none';
    } else {
        // Show text logo with business name
        if (logoEl) {
            logoEl.style.display = 'block';
            if (settings.businessName) {
                logoEl.textContent = `💳 ${settings.businessName}`;
            }
        }
    }
}

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
    const selectedOption = currencySelect.options[currencySelect.selectedIndex];
    const symbol = selectedOption.getAttribute('data-symbol');
    document.getElementById('qr-amount-text').textContent = symbol + amount.toFixed(2);

    try {
        chargeBtn.classList.add('loading');
        chargeBtn.disabled = true;

        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            throw new Error('QR Code library not loaded. Please refresh the page.');
        }

        // Get selected currency
        const currency = currencySelect.value;
        
        // Create payment session
        const response = await fetch('/create-payment-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Server response:', text);
            throw new Error('Server returned invalid response. Please check your Stripe keys.');
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        if (!data.sessionId || !data.paymentUrl) {
            throw new Error('Invalid response from server: missing sessionId or paymentUrl');
        }

        const { sessionId, paymentUrl } = data;

        currentSessionId = sessionId;

        // Clear previous QR code
        const qrcodeDiv = document.getElementById('qrcode');
        qrcodeDiv.innerHTML = '';

        // Generate QR code with error handling
        try {
            new QRCode(qrcodeDiv, {
                text: paymentUrl,
                width: 256,
                height: 256,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (qrError) {
            console.error('QR Code generation error:', qrError);
            throw new Error('Failed to generate QR code: ' + qrError.message);
        }

        showScreen(qrScreen);

        // Start checking payment status
        startStatusCheck();
    } catch (error) {
        console.error('Charge error:', error);
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
            
            if (!response.ok) {
                console.error('Status check failed:', response.status);
                return;
            }
            
            const data = await response.json();
            
            if (data.status === 'paid') {
                clearInterval(statusCheckInterval);
                const selectedOption = currencySelect.options[currencySelect.selectedIndex];
                const symbol = selectedOption.getAttribute('data-symbol');
                const currencyCode = currencySelect.value.toUpperCase();
                
                // Store transaction details for receipt
                currentTransaction = {
                    id: currentSessionId,
                    amount: data.amount,
                    currency: currencyCode,
                    symbol: symbol,
                    date: new Date(),
                    status: 'completed'
                };
                
                document.getElementById('success-amount').textContent = symbol + data.amount.toFixed(2);
                document.getElementById('transaction-id').textContent = currentSessionId.substring(0, 20) + '...';
                showScreen(successScreen);
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

// Download receipt button
const downloadReceiptBtn = document.getElementById('download-receipt');
downloadReceiptBtn.addEventListener('click', () => {
    if (currentTransaction) {
        generateReceipt(currentTransaction);
    }
});

// New transaction
newTransactionBtn.addEventListener('click', () => {
    showScreen(amountScreen);
    currentTransaction = null; // Clear transaction data
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

// Generate and download receipt
function generateReceipt(transaction) {
    const date = transaction.date;
    const dateStr = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const bizName = (BRANDING && BRANDING.businessName) ? BRANDING.businessName : 'EZ TRANZ';
    const primary = (BRANDING && BRANDING.primaryColor) ? BRANDING.primaryColor : '#6366f1';
    const secondary = (BRANDING && BRANDING.secondaryColor) ? BRANDING.secondaryColor : '#8b5cf6';
    const address = (BRANDING && BRANDING.address) ? BRANDING.address : '';
    const phone = (BRANDING && BRANDING.phone) ? BRANDING.phone : '';
    const footerMsg = (BRANDING && BRANDING.receiptFooter) ? BRANDING.receiptFooter : 'Thank you for your payment!';
    const logoUrl = (BRANDING && BRANDING.logoUrl) ? BRANDING.logoUrl : '';

    // Create HTML receipt
    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt - ${bizName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 40px;
            background: #f9fafb;
        }
        .receipt {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid ${primary};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: ${primary};
            margin: 0;
            font-size: 32px;
        }
        .header p {
            color: #6b7280;
            margin: 5px 0 0 0;
        }
        .biz-details { color:#6b7280; font-size: 13px; margin-top:6px; }
        .amount {
            text-align: center;
            font-size: 48px;
            font-weight: bold;
            color: #10b981;
            margin: 30px 0;
        }
        .details {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
            gap: 15px;
        }
        .detail-row:last-child { border-bottom: none; }
        .label {
            color: #6b7280;
            font-weight: 600;
            flex-shrink: 0;
            min-width: 140px;
        }
        .value {
            color: #1f2937;
            font-family: monospace;
            text-align: right;
            word-break: break-all;
            font-size: 13px;
        }
        .status { text-align: center; margin: 30px 0; }
        .status-badge {
            display: inline-block;
            padding: 10px 20px;
            background: #d1fae5;
            color: #065f46;
            border-radius: 20px;
            font-weight: 600;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        @media print { body { background: white; margin: 0; padding: 20px; } .receipt { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${bizName}" style="max-height:60px; max-width:200px; margin-bottom:12px; border-radius:8px;">` : '<h1>📋 ' + bizName + '</h1>'}
            ${!logoUrl ? '<h1>📋 ' + bizName + '</h1>' : '<h2 style="margin-top:8px;">' + bizName + '</h2>'}
            <p>Payment Receipt</p>
            ${(address || phone) ? `<div class="biz-details">${[address, phone].filter(Boolean).join(' • ')}</div>` : ''}
        </div>
        
        <div class="amount">
            ${transaction.symbol}${transaction.amount.toFixed(2)} ${transaction.currency}
        </div>
        
        <div class="status">
            <span class="status-badge">✓ PAYMENT COMPLETED</span>
        </div>
        
        <div class="details">
            <div class="detail-row">
                <span class="label">Transaction ID:</span>
                <span class="value">${transaction.id}</span>
            </div>
            <div class="detail-row">
                <span class="label">Date & Time:</span>
                <span class="value">${dateStr}</span>
            </div>
            <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">${transaction.symbol}${transaction.amount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
                <span class="label">Currency:</span>
                <span class="value">${transaction.currency}</span>
            </div>
            <div class="detail-row">
                <span class="label">Payment Method:</span>
                <span class="value">Card Payment</span>
            </div>
            <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">Completed</span>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${footerMsg}</strong></p>
            <p>Powered by ${bizName} & Stripe</p>
            <p style="font-size: 12px; margin-top: 20px;">This is a valid receipt for your payment. Keep it for your records.</p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Create blob and download
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bizName.replace(/\s+/g,'-')}-Receipt-${transaction.id.substring(0, 12)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📄 Receipt downloaded');
}

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}

} // End of initApp function
