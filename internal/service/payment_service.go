package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
)

type PaymentService struct {
	paymentRepo     *repository.PaymentRepository
	transactionRepo *repository.TransactionRepository
	userRepo        *repository.UserRepository
	config          struct {
		CoinGateAPIKey    string
		UddoktaPayAPIKey  string
		UddoktaPayBaseURL string
	}
}

func NewPaymentService(
	paymentRepo *repository.PaymentRepository,
	transactionRepo *repository.TransactionRepository,
	userRepo *repository.UserRepository,
	config struct {
		CoinGateAPIKey    string
		UddoktaPayAPIKey  string
		UddoktaPayBaseURL string
	},
) *PaymentService {
	return &PaymentService{
		paymentRepo:     paymentRepo,
		transactionRepo: transactionRepo,
		userRepo:        userRepo,
		config:          config,
	}
}

// CreateDepositTransaction creates a deposit transaction
func (s *PaymentService) CreateDepositTransaction(userID int64, amount float64, description string) (*model.Transaction, error) {
	transaction := &model.Transaction{
		UserID:      userID,
		Amount:      amount,
		Type:        model.TransactionTypeDeposit,
		Status:      model.TransactionStatusPending,
		Description: description,
	}

	return s.transactionRepo.Create(transaction)
}

// CreatePayment creates a payment record
func (s *PaymentService) CreatePayment(
	transactionID int64,
	gateway model.PaymentGateway,
	currency model.Currency,
	amount float64,
	metadata model.JSON,
) (*model.Payment, error) {
	payment := &model.Payment{
		TransactionID: transactionID,
		Gateway:       gateway,
		Currency:      currency,
		Amount:        amount,
		Status:        model.PaymentStatusPending,
		Metadata:      metadata,
	}

	return s.paymentRepo.Create(payment)
}

// InitiateCoingatePayment initiates a payment via Coingate
func (s *PaymentService) InitiateCoingatePayment(userID int64, amountUSD float64) (string, *model.Payment, error) {
	// Create deposit transaction
	transaction, err := s.CreateDepositTransaction(
		userID,
		amountUSD*120, // Convert USD to BDT
		fmt.Sprintf("Deposit via CoinGate (%.2f USD)", amountUSD),
	)
	if err != nil {
		return "", nil, err
	}

	// Prepare payment data for CoinGate
	coinGatePayload := map[string]interface{}{
		"order_id":         fmt.Sprintf("order_%d", transaction.ID),
		"price_amount":     amountUSD,
		"price_currency":   "USD",
		"receive_currency": "USD",
		"title":            "Deposit to Investment App",
		"description":      fmt.Sprintf("Deposit of %.2f USD", amountUSD),
		"callback_url":     "https://yourdomain.com/api/payments/callback/coingate",
		"success_url":      "https://yourdomain.com/payment/success",
		"cancel_url":       "https://yourdomain.com/payment/cancel",
		"token":            s.config.CoinGateAPIKey,
	}

	// Convert to JSON
	payloadBytes, err := json.Marshal(coinGatePayload)
	if err != nil {
		return "", nil, err
	}

	// Make API call to CoinGate
	req, err := http.NewRequest("POST", "https://api.coingate.com/v2/orders", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return "", nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Token "+s.config.CoinGateAPIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	// Parse response
	var coinGateResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&coinGateResponse)
	if err != nil {
		return "", nil, err
	}

	// Check if payment was created successfully
	if resp.StatusCode != http.StatusOK {
		return "", nil, fmt.Errorf("failed to create CoinGate payment: %v", coinGateResponse)
	}

	// Get payment URL and ID
	paymentURL, ok := coinGateResponse["payment_url"].(string)
	if !ok {
		return "", nil, errors.New("invalid CoinGate response: missing payment_url")
	}

	gatewayID, ok := coinGateResponse["id"].(string)
	if !ok {
		return "", nil, errors.New("invalid CoinGate response: missing id")
	}

	// Create payment record
	payment, err := s.CreatePayment(
		transaction.ID,
		model.PaymentGatewayCoingate,
		model.CurrencyUSD,
		amountUSD,
		model.JSON(coinGateResponse),
	)
	if err != nil {
		return "", nil, err
	}

	// Update payment with gateway reference
	payment.GatewayReference = gatewayID
	err = s.paymentRepo.Update(payment)
	if err != nil {
		return "", nil, err
	}

	return paymentURL, payment, nil
}

// InitiateUddoktaPayPayment initiates a payment via UddoktaPay
func (s *PaymentService) InitiateUddoktaPayPayment(userID int64, amountBDT float64) (string, *model.Payment, error) {
	// Create deposit transaction
	transaction, err := s.CreateDepositTransaction(
		userID,
		amountBDT,
		fmt.Sprintf("Deposit via UddoktaPay (%.2f BDT)", amountBDT),
	)
	if err != nil {
		return "", nil, err
	}

	// Get user details
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return "", nil, err
	}
	if user == nil {
		return "", nil, errors.New("user not found")
	}

	// Prepare payment data for UddoktaPay
	uddoktaPayPayload := map[string]interface{}{
		"full_name": user.Name,
		"email":     user.Email,
		"amount":    amountBDT,
		"metadata": map[string]interface{}{
			"transaction_id": transaction.ID,
			"user_id":        userID,
		},
		"redirect_url": "https://yourdomain.com/payment/success",
		"cancel_url":   "https://yourdomain.com/payment/cancel",
		"webhook_url":  "https://yourdomain.com/api/payments/callback/uddoktapay",
	}

	// Convert to JSON
	payloadBytes, err := json.Marshal(uddoktaPayPayload)
	if err != nil {
		return "", nil, err
	}

	// Make API call to UddoktaPay
	req, err := http.NewRequest("POST", s.config.UddoktaPayBaseURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return "", nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("RT-UDDOKTAPAY-API-KEY", s.config.UddoktaPayAPIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	// Parse response
	var uddoktaPayResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&uddoktaPayResponse)
	if err != nil {
		return "", nil, err
	}

	// Check if payment was created successfully
	if resp.StatusCode != http.StatusOK {
		return "", nil, fmt.Errorf("failed to create UddoktaPay payment: %v", uddoktaPayResponse)
	}

	// Get payment URL and ID
	paymentURL, ok := uddoktaPayResponse["payment_url"].(string)
	if !ok {
		return "", nil, errors.New("invalid UddoktaPay response: missing payment_url")
	}

	gatewayID, ok := uddoktaPayResponse["invoice_id"].(string)
	if !ok {
		return "", nil, errors.New("invalid UddoktaPay response: missing invoice_id")
	}

	// Create payment record
	payment, err := s.CreatePayment(
		transaction.ID,
		model.PaymentGatewayUddoktaPay,
		model.CurrencyBDT,
		amountBDT,
		model.JSON(uddoktaPayResponse),
	)
	if err != nil {
		return "", nil, err
	}

	// Update payment with gateway reference
	payment.GatewayReference = gatewayID
	err = s.paymentRepo.Update(payment)
	if err != nil {
		return "", nil, err
	}

	return paymentURL, payment, nil
}

// ProcessManualPayment processes a manual payment
func (s *PaymentService) ProcessManualPayment(userID int64, amountBDT float64, details model.JSON) (*model.Payment, error) {
	// Create deposit transaction
	transaction, err := s.CreateDepositTransaction(
		userID,
		amountBDT,
		fmt.Sprintf("Manual deposit (%.2f BDT)", amountBDT),
	)
	if err != nil {
		return nil, err
	}

	// Create payment record
	payment, err := s.CreatePayment(
		transaction.ID,
		model.PaymentGatewayManual,
		model.CurrencyBDT,
		amountBDT,
		details,
	)
	if err != nil {
		return nil, err
	}

	// Set payment status as pending (needs admin approval)
	payment.Status = model.PaymentStatusPending
	err = s.paymentRepo.Update(payment)
	if err != nil {
		return nil, err
	}

	return payment, nil
}

// HandleCoinGateCallback handles the callback from CoinGate
func (s *PaymentService) HandleCoinGateCallback(payload map[string]interface{}) error {
	// Extract payment details from payload
	gatewayID, ok := payload["id"].(string)
	if !ok {
		return errors.New("invalid CoinGate callback: missing id")
	}

	status, ok := payload["status"].(string)
	if !ok {
		return errors.New("invalid CoinGate callback: missing status")
	}

	// Find payment by gateway reference
	payment, err := s.paymentRepo.FindByGatewayReference(gatewayID)
	if err != nil {
		return err
	}
	if payment == nil {
		return errors.New("payment not found")
	}

	// Update payment status based on CoinGate status
	var paymentStatus model.PaymentStatus
	var transactionStatus model.TransactionStatus

	switch status {
	case "paid":
		paymentStatus = model.PaymentStatusCompleted
		transactionStatus = model.TransactionStatusCompleted
	case "canceled", "expired", "invalid":
		paymentStatus = model.PaymentStatusFailed
		transactionStatus = model.TransactionStatusRejected
	default:
		// Still pending
		return nil
	}

	// Update payment status
	payment.Status = paymentStatus
	err = s.paymentRepo.Update(payment)
	if err != nil {
		return err
	}

	// Update transaction status
	err = s.transactionRepo.UpdateStatus(payment.TransactionID, transactionStatus)
	if err != nil {
		return err
	}

	// If payment was successful, update user balance
	if paymentStatus == model.PaymentStatusCompleted {
		// Get transaction
		transaction, err := s.transactionRepo.FindByID(payment.TransactionID)
		if err != nil {
			return err
		}
		if transaction == nil {
			return errors.New("transaction not found")
		}

		// Update user balance
		err = s.userRepo.UpdateBalance(transaction.UserID, transaction.Amount)
		if err != nil {
			return err
		}
	}

	return nil
}

// HandleUddoktaPayCallback handles the callback from UddoktaPay
func (s *PaymentService) HandleUddoktaPayCallback(payload map[string]interface{}) error {
	// Extract payment details from payload
	invoiceID, ok := payload["invoice_id"].(string)
	if !ok {
		return errors.New("invalid UddoktaPay callback: missing invoice_id")
	}

	status, ok := payload["status"].(string)
	if !ok {
		return errors.New("invalid UddoktaPay callback: missing status")
	}

	// Find payment by gateway reference
	payment, err := s.paymentRepo.FindByGatewayReference(invoiceID)
	if err != nil {
		return err
	}
	if payment == nil {
		return errors.New("payment not found")
	}

	// Update payment status based on UddoktaPay status
	var paymentStatus model.PaymentStatus
	var transactionStatus model.TransactionStatus

	switch status {
	case "COMPLETED":
		paymentStatus = model.PaymentStatusCompleted
		transactionStatus = model.TransactionStatusCompleted
	case "CANCELLED", "FAILED":
		paymentStatus = model.PaymentStatusFailed
		transactionStatus = model.TransactionStatusRejected
	default:
		// Still pending
		return nil
	}

	// Update payment status
	payment.Status = paymentStatus
	err = s.paymentRepo.Update(payment)
	if err != nil {
		return err
	}

	// Update transaction status
	err = s.transactionRepo.UpdateStatus(payment.TransactionID, transactionStatus)
	if err != nil {
		return err
	}

	// If payment was successful, update user balance
	if paymentStatus == model.PaymentStatusCompleted {
		// Get transaction
		transaction, err := s.transactionRepo.FindByID(payment.TransactionID)
		if err != nil {
			return err
		}
		if transaction == nil {
			return errors.New("transaction not found")
		}

		// Update user balance
		err = s.userRepo.UpdateBalance(transaction.UserID, transaction.Amount)
		if err != nil {
			return err
		}
	}

	return nil
}

// ApproveManualPayment approves a manual payment (admin only)
func (s *PaymentService) ApproveManualPayment(paymentID int64) error {
	// Find payment
	payment, err := s.paymentRepo.FindByID(paymentID)
	if err != nil {
		return err
	}
	if payment == nil {
		return errors.New("payment not found")
	}

	// Check if payment is manual and pending
	if payment.Gateway != model.PaymentGatewayManual {
		return errors.New("not a manual payment")
	}
	if payment.Status != model.PaymentStatusPending {
		return fmt.Errorf("payment is already %s", payment.Status)
	}

	// Update payment status
	payment.Status = model.PaymentStatusCompleted
	err = s.paymentRepo.Update(payment)
	if err != nil {
		return err
	}

	// Update transaction status
	err = s.transactionRepo.UpdateStatus(payment.TransactionID, model.TransactionStatusCompleted)
	if err != nil {
		return err
	}

	// Get transaction
	transaction, err := s.transactionRepo.FindByID(payment.TransactionID)
	if err != nil {
		return err
	}
	if transaction == nil {
		return errors.New("transaction not found")
	}

	// Update user balance
	err = s.userRepo.UpdateBalance(transaction.UserID, transaction.Amount)
	if err != nil {
		return err
	}

	return nil
}

// RejectManualPayment rejects a manual payment (admin only)
func (s *PaymentService) RejectManualPayment(paymentID int64) error {
	// Find payment
	payment, err := s.paymentRepo.FindByID(paymentID)
	if err != nil {
		return err
	}
	if payment == nil {
		return errors.New("payment not found")
	}

	// Check if payment is manual and pending
	if payment.Gateway != model.PaymentGatewayManual {
		return errors.New("not a manual payment")
	}
	if payment.Status != model.PaymentStatusPending {
		return fmt.Errorf("payment is already %s", payment.Status)
	}

	// Update payment status
	payment.Status = model.PaymentStatusFailed
	err = s.paymentRepo.Update(payment)
	if err != nil {
		return err
	}

	// Update transaction status
	err = s.transactionRepo.UpdateStatus(payment.TransactionID, model.TransactionStatusRejected)
	if err != nil {
		return err
	}

	return nil
}

// GetPaymentByID gets a payment by ID
func (s *PaymentService) GetPaymentByID(id int64) (*model.Payment, error) {
	payment, err := s.paymentRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if payment == nil {
		return nil, errors.New("payment not found")
	}
	return payment, nil
}

// GetPaymentsByUserID gets all payments for a user
func (s *PaymentService) GetPaymentsByUserID(userID int64, limit, offset int) ([]*model.Payment, error) {
	// Get all transactions for the user
	transactions, err := s.transactionRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		return nil, err
	}

	// Get payments for each transaction
	var payments []*model.Payment
	for _, transaction := range transactions {
		if transaction.Type == model.TransactionTypeDeposit {
			payment, err := s.paymentRepo.FindByTransactionID(transaction.ID)
			if err != nil {
				continue // Skip if error
			}
			if payment != nil {
				payments = append(payments, payment)
			}
		}
	}

	return payments, nil
}

// GetPendingManualPayments gets all pending manual payments (admin only)
func (s *PaymentService) GetPendingManualPayments(limit, offset int) ([]*model.Payment, error) {
	return s.paymentRepo.FindByGatewayAndStatus(
		model.PaymentGatewayManual,
		model.PaymentStatusPending,
		limit,
		offset,
	)
}

// CountAllPayments counts all payments
func (s *PaymentService) CountAllPayments() (int64, error) {
	// Get all payments from repository without pagination
	payments, err := s.paymentRepo.FindAll(0, 0)
	if err != nil {
		return 0, err
	}

	return int64(len(payments)), nil
}

// CountPaymentsByStatus counts payments by status
func (s *PaymentService) CountPaymentsByStatus(status model.PaymentStatus) (int64, error) {
	return s.paymentRepo.CountByStatus(status)
}

// CountPaymentsByGateway counts payments by gateway
func (s *PaymentService) CountPaymentsByGateway(gateway model.PaymentGateway) (int64, error) {
	return s.paymentRepo.CountByGateway(gateway)
}

// GetTotalCompletedAmount calculates the total amount of completed payments
func (s *PaymentService) GetTotalCompletedAmount() (float64, error) {
	// Get completed payments
	payments, err := s.paymentRepo.FindByStatus(model.PaymentStatusCompleted, 0, 0)
	if err != nil {
		return 0, err
	}

	// Calculate total amount
	var totalAmount float64
	for _, payment := range payments {
		// Convert currency if needed
		if payment.Currency == model.CurrencyUSD {
			// Use the conversion rate from config
			totalAmount += payment.Amount * 120 // assuming 1 USD = 120 BDT
		} else {
			totalAmount += payment.Amount
		}
	}

	return totalAmount, nil
}

// GetRecentPayments gets the most recent payments
func (s *PaymentService) GetRecentPayments(limit int) ([]*model.Payment, error) {
	// Get recent payments with sorting by created_at desc
	return s.paymentRepo.FindRecent(limit)
}

// GetTransactionByPaymentID gets the transaction associated with a payment
func (s *PaymentService) GetTransactionByPaymentID(paymentID int64) (*model.Transaction, error) {
	// Get payment
	payment, err := s.GetPaymentByID(paymentID)
	if err != nil {
		return nil, err
	}
	if payment == nil {
		return nil, errors.New("payment not found")
	}

	// Get transaction
	transaction, err := s.transactionRepo.FindByID(payment.TransactionID)
	if err != nil {
		return nil, err
	}

	return transaction, nil
}
