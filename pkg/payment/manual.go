package payment

import (
	"errors"
	"time"
)

// ManualPaymentProcessor handles manual payment processing
type ManualPaymentProcessor struct {
	// Configuration parameters for manual payment methods
	BankAccounts  []BankAccount
	MobileWallets []MobileWallet
}

// BankAccount represents a bank account for manual payments
type BankAccount struct {
	BankName      string
	AccountName   string
	AccountNumber string
	BranchName    string
	RoutingNumber string
	IsActive      bool
}

// MobileWallet represents a mobile wallet for manual payments
type MobileWallet struct {
	Provider    string // e.g., bKash, Nagad, Rocket
	Number      string
	AccountType string // personal, agent, merchant
	IsActive    bool
}

// ManualPaymentRequest represents a manual payment request
type ManualPaymentRequest struct {
	Amount            float64
	PaymentMethod     string // bank_transfer, mobile_wallet
	TransactionID     string
	SenderInformation map[string]string
	AttachmentURL     string
	Notes             string
}

// ManualPaymentResponse represents a manual payment response
type ManualPaymentResponse struct {
	ReferenceID string
	Status      string // pending, approved, rejected
	SubmittedAt time.Time
	ProcessedAt *time.Time
}

// NewManualPaymentProcessor creates a new manual payment processor
func NewManualPaymentProcessor(bankAccounts []BankAccount, mobileWallets []MobileWallet) *ManualPaymentProcessor {
	return &ManualPaymentProcessor{
		BankAccounts:  bankAccounts,
		MobileWallets: mobileWallets,
	}
}

// ProcessPayment processes a manual payment
func (m *ManualPaymentProcessor) ProcessPayment(req *ManualPaymentRequest) (*ManualPaymentResponse, error) {
	// Validate payment method
	if req.PaymentMethod != "bank_transfer" && req.PaymentMethod != "mobile_wallet" {
		return nil, errors.New("invalid payment method")
	}

	// Validate transaction ID
	if req.TransactionID == "" {
		return nil, errors.New("transaction ID is required")
	}

	// Validate sender information
	if req.SenderInformation == nil || len(req.SenderInformation) == 0 {
		return nil, errors.New("sender information is required")
	}

	// Different validation based on payment method
	if req.PaymentMethod == "bank_transfer" {
		// Validate required bank transfer fields
		requiredFields := []string{"bank_name", "account_name", "sender_account"}
		for _, field := range requiredFields {
			if _, ok := req.SenderInformation[field]; !ok {
				return nil, errors.New("missing required field for bank transfer: " + field)
			}
		}
	} else if req.PaymentMethod == "mobile_wallet" {
		// Validate required mobile wallet fields
		requiredFields := []string{"provider", "sender_number"}
		for _, field := range requiredFields {
			if _, ok := req.SenderInformation[field]; !ok {
				return nil, errors.New("missing required field for mobile wallet: " + field)
			}
		}

		// Validate provider
		provider := req.SenderInformation["provider"]
		validProvider := false
		for _, wallet := range m.MobileWallets {
			if wallet.Provider == provider && wallet.IsActive {
				validProvider = true
				break
			}
		}
		if !validProvider {
			return nil, errors.New("invalid or inactive payment provider: " + provider)
		}
	}

	// Create a response with pending status
	// In a real implementation, this would likely be saved to a database
	response := &ManualPaymentResponse{
		ReferenceID: generateReferenceID(),
		Status:      "pending",
		SubmittedAt: time.Now(),
	}

	return response, nil
}

// GetAvailablePaymentMethods returns available payment methods
func (m *ManualPaymentProcessor) GetAvailablePaymentMethods() map[string]interface{} {
	// Filter active bank accounts
	activeBankAccounts := []BankAccount{}
	for _, account := range m.BankAccounts {
		if account.IsActive {
			activeBankAccounts = append(activeBankAccounts, account)
		}
	}

	// Filter active mobile wallets
	activeMobileWallets := []MobileWallet{}
	for _, wallet := range m.MobileWallets {
		if wallet.IsActive {
			activeMobileWallets = append(activeMobileWallets, wallet)
		}
	}

	return map[string]interface{}{
		"bank_accounts":  activeBankAccounts,
		"mobile_wallets": activeMobileWallets,
	}
}

// ApprovePayment approves a manual payment
func (m *ManualPaymentProcessor) ApprovePayment(referenceID string) error {
	// In a real implementation, this would update the payment status in the database
	// For this example, we'll just return nil (success)
	return nil
}

// RejectPayment rejects a manual payment
func (m *ManualPaymentProcessor) RejectPayment(referenceID string, reason string) error {
	// In a real implementation, this would update the payment status in the database
	// For this example, we'll just return nil (success)
	return nil
}

// Helper function to generate a reference ID
func generateReferenceID() string {
	// In a real implementation, you would generate a unique reference ID
	// For this example, we'll use a timestamp-based ID
	return "MAN" + time.Now().Format("20060102150405")
}
