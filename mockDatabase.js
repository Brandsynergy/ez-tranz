// Mock Database for Development
// This will be replaced with Supabase connection later

const bcrypt = require('bcryptjs');

// In-memory storage (will be replaced with actual database)
const merchants = new Map();
const merchantSettings = new Map();
const transactions = new Map();
const sessions = new Map();
const customers = new Map(); // Store customer phone numbers and Stripe IDs
const bankAccounts = new Map(); // Store bank accounts per merchant

// Helper function to generate IDs
function generateId() {
    return 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ==========================================
// MERCHANT AUTHENTICATION
// ==========================================

async function createMerchant(email, password, businessName) {
    // Check if merchant already exists
    for (const [id, merchant] of merchants.entries()) {
        if (merchant.email === email) {
            throw new Error('Merchant already exists with this email');
        }
    }

    const merchantId = generateId();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const merchant = {
        id: merchantId,
        email,
        password: hashedPassword,
        businessName,
        stripeAccountId: null, // Stripe Connect account ID
        stripeAccountStatus: 'not_connected', // not_connected, pending, connected
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    merchants.set(merchantId, merchant);

    // Create default settings
    const defaultSettings = {
        merchantId,
        businessName,
        logoUrl: null,
        primaryColor: '#6366f1',
        secondaryColor: '#8b5cf6',
        address: '',
        phone: '',
        businessEmail: email,
        receiptFooter: 'Thank you for your business!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    merchantSettings.set(merchantId, defaultSettings);

    return { id: merchantId, email, businessName };
}

async function authenticateMerchant(email, password) {
    for (const [id, merchant] of merchants.entries()) {
        if (merchant.email === email) {
            const isValid = await bcrypt.compare(password, merchant.password);
            if (isValid) {
                return { id: merchant.id, email: merchant.email, businessName: merchant.businessName };
            }
        }
    }
    return null;
}

function createSession(merchantId) {
    const sessionId = generateId();
    const session = {
        merchantId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    sessions.set(sessionId, session);
    return sessionId;
}

function validateSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
        sessions.delete(sessionId);
        return null;
    }
    
    return session.merchantId;
}

function deleteSession(sessionId) {
    sessions.delete(sessionId);
}

// ==========================================
// MERCHANT SETTINGS (BRANDING)
// ==========================================

function getMerchantSettings(merchantId) {
    return merchantSettings.get(merchantId) || null;
}

function updateMerchantSettings(merchantId, updates) {
    const currentSettings = merchantSettings.get(merchantId);
    if (!currentSettings) {
        throw new Error('Merchant settings not found');
    }

    const updatedSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    merchantSettings.set(merchantId, updatedSettings);
    return updatedSettings;
}

// ==========================================
// TRANSACTIONS
// ==========================================

function createTransaction(merchantId, transactionData) {
    const transactionId = generateId();
    const transaction = {
        id: transactionId,
        merchantId,
        ...transactionData,
        createdAt: new Date().toISOString()
    };

    if (!transactions.has(merchantId)) {
        transactions.set(merchantId, []);
    }
    
    transactions.get(merchantId).push(transaction);
    return transaction;
}

function getMerchantTransactions(merchantId, options = {}) {
    const merchantTxns = transactions.get(merchantId) || [];
    
    // Sort by date (newest first)
    let sorted = [...merchantTxns].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Apply filters if provided
    if (options.startDate) {
        sorted = sorted.filter(t => new Date(t.createdAt) >= new Date(options.startDate));
    }
    if (options.endDate) {
        sorted = sorted.filter(t => new Date(t.createdAt) <= new Date(options.endDate));
    }
    if (options.currency) {
        sorted = sorted.filter(t => t.currency === options.currency);
    }

    // Pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    return {
        transactions: sorted.slice(offset, offset + limit),
        total: sorted.length,
        hasMore: sorted.length > offset + limit
    };
}

function getTransactionStats(merchantId) {
    const merchantTxns = transactions.get(merchantId) || [];
    
    const stats = {
        totalTransactions: merchantTxns.length,
        totalRevenue: 0,
        todayRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
        currencyBreakdown: {}
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    merchantTxns.forEach(txn => {
        const amount = txn.amount || 0;
        const txnDate = new Date(txn.createdAt);

        // Total revenue (in original currency - for display only)
        stats.totalRevenue += amount;

        // Today's revenue
        if (txnDate >= today) {
            stats.todayRevenue += amount;
        }

        // Week revenue
        if (txnDate >= weekAgo) {
            stats.weekRevenue += amount;
        }

        // Month revenue
        if (txnDate >= monthAgo) {
            stats.monthRevenue += amount;
        }

        // Currency breakdown
        const currency = txn.currency || 'USD';
        if (!stats.currencyBreakdown[currency]) {
            stats.currencyBreakdown[currency] = { count: 0, total: 0 };
        }
        stats.currencyBreakdown[currency].count++;
        stats.currencyBreakdown[currency].total += amount;
    });

    return stats;
}

// ==========================================
// CUSTOMERS (for saved payment methods)
// ==========================================

function createOrUpdateCustomer(phoneNumber, stripeCustomerId, last4, cardBrand) {
    const customerId = generateId();
    const customer = {
        id: customerId,
        phoneNumber,
        stripeCustomerId,
        last4, // Last 4 digits of card
        cardBrand, // visa, mastercard, etc
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    customers.set(phoneNumber, customer);
    return customer;
}

function getCustomerByPhone(phoneNumber) {
    return customers.get(phoneNumber) || null;
}

// ==========================================
// BANK ACCOUNTS
// ==========================================

function getBankAccounts(merchantId) {
    return bankAccounts.get(merchantId) || [];
}

function createBankAccount(merchantId, accountData) {
    const accountId = generateId();
    const account = {
        id: accountId,
        merchantId,
        accountHolderName: accountData.accountHolderName,
        bankName: accountData.bankName,
        accountNumber: accountData.accountNumber,
        routingNumber: accountData.routingNumber,
        accountType: accountData.accountType || 'checking',
        currency: accountData.currency || 'usd',
        isDefault: accountData.isDefault || false,
        createdAt: new Date().toISOString()
    };
    
    if (!bankAccounts.has(merchantId)) {
        bankAccounts.set(merchantId, []);
    }
    
    const accounts = bankAccounts.get(merchantId);
    
    // If this is marked as default, unset other defaults
    if (account.isDefault) {
        accounts.forEach(acc => acc.isDefault = false);
    }
    
    // If this is the first account, make it default
    if (accounts.length === 0) {
        account.isDefault = true;
    }
    
    accounts.push(account);
    return account;
}

function setDefaultBankAccount(merchantId, accountId) {
    const accounts = bankAccounts.get(merchantId) || [];
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
        throw new Error('Bank account not found');
    }
    
    // Unset all defaults
    accounts.forEach(acc => acc.isDefault = false);
    
    // Set new default
    account.isDefault = true;
}

function deleteBankAccount(merchantId, accountId) {
    const accounts = bankAccounts.get(merchantId) || [];
    const index = accounts.findIndex(acc => acc.id === accountId);
    
    if (index === -1) {
        throw new Error('Bank account not found');
    }
    
    const wasDefault = accounts[index].isDefault;
    accounts.splice(index, 1);
    
    // If we deleted the default and there are remaining accounts, set the first as default
    if (wasDefault && accounts.length > 0) {
        accounts[0].isDefault = true;
    }
}

// ==========================================
// MERCHANT INFO
// ==========================================

function getMerchantById(merchantId) {
    const merchant = merchants.get(merchantId);
    if (!merchant) return null;
    
    // Return merchant without password
    const { password, ...merchantData } = merchant;
    return merchantData;
}

// ==========================================
// STRIPE CONNECT
// ==========================================

function updateMerchantStripeAccount(merchantId, stripeAccountId, status = 'connected') {
    const merchant = merchants.get(merchantId);
    if (!merchant) {
        throw new Error('Merchant not found');
    }
    
    merchant.stripeAccountId = stripeAccountId;
    merchant.stripeAccountStatus = status;
    merchant.updatedAt = new Date().toISOString();
    
    return getMerchantById(merchantId);
}

function getMerchantStripeAccount(merchantId) {
    const merchant = merchants.get(merchantId);
    if (!merchant) return null;
    
    return {
        stripeAccountId: merchant.stripeAccountId,
        stripeAccountStatus: merchant.stripeAccountStatus
    };
}

// ==========================================
// DEMO DATA (for testing)
// ==========================================

async function createDemoMerchant() {
    try {
        const demo = await createMerchant(
            'demo@eztranz.com',
            'demo123',
            'Demo Business'
        );
        
        // Update settings with demo data
        updateMerchantSettings(demo.id, {
            businessName: 'Demo Coffee Shop',
            address: '123 Main Street, Lagos, Nigeria',
            phone: '+234 123 456 7890',
            primaryColor: '#10b981',
            secondaryColor: '#059669',
            receiptFooter: 'Thanks for visiting Demo Coffee Shop!'
        });

        // Add some demo transactions
        const demoTransactions = [
            { amount: 1500, currency: 'NGN', status: 'completed', stripeSessionId: 'demo_1' },
            { amount: 2500, currency: 'NGN', status: 'completed', stripeSessionId: 'demo_2' },
            { amount: 50, currency: 'USD', status: 'completed', stripeSessionId: 'demo_3' },
            { amount: 3000, currency: 'NGN', status: 'completed', stripeSessionId: 'demo_4' },
        ];

        demoTransactions.forEach(txn => {
            createTransaction(demo.id, txn);
        });

        console.log('✅ Demo merchant created:');
        console.log('   Email: demo@eztranz.com');
        console.log('   Password: demo123');
        
        return demo;
    } catch (error) {
        console.log('Demo merchant already exists');
    }
}
// Initialize with demo data
let DEMO_MERCHANT_ID = null;
createDemoMerchant().then(demo => { if (demo) DEMO_MERCHANT_ID = demo.id; });

function getDemoMerchantId() {
    return DEMO_MERCHANT_ID;
}

module.exports = {
    // Auth
    createMerchant,
    authenticateMerchant,
    createSession,
    validateSession,
    deleteSession,
    
    // Settings
    getMerchantSettings,
    updateMerchantSettings,
    getDemoMerchantId,
    
    // Transactions
    createTransaction,
    getMerchantTransactions,
    getTransactionStats,
    
    // Merchant
    getMerchantById,
    
    // Stripe Connect
    updateMerchantStripeAccount,
    getMerchantStripeAccount,
    
    // Customers
    createOrUpdateCustomer,
    getCustomerByPhone,
    
    // Bank Accounts
    getBankAccounts,
    createBankAccount,
    setDefaultBankAccount,
    deleteBankAccount
};
