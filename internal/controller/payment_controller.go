package controller

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type PaymentController struct {
	paymentService *service.PaymentService
}

func NewPaymentController(paymentService *service.PaymentService) *PaymentController {
	return &PaymentController{
		paymentService: paymentService,
	}
}

// DepositViaCoingate initiates a deposit via CoinGate
func (c *PaymentController) DepositViaCoingate(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	enabled, _ := c.paymentService.IsDepositEnabled()
	if !enabled {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Deposits are currently disabled"})
		return
	}
	// Get amount from request body
	var req struct {
		Amount float64 `json:"amount" binding:"required,min=1"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Initiate payment
	paymentURL, payment, err := c.paymentService.InitiateCoingatePayment(userID, req.Amount)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate payment: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":     "Payment initiated successfully",
		"payment_url": paymentURL,
		"payment":     payment.ToResponse(),
	})
}

// DepositViaUddoktaPay initiates a deposit via UddoktaPay
func (c *PaymentController) DepositViaUddoktaPay(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	enabled, _ := c.paymentService.IsDepositEnabled()
	if !enabled {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Deposits are currently disabled"})
		return
	}
	// Get amount from request body
	var req struct {
		Amount float64 `json:"amount" binding:"required,min=100"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Initiate payment
	paymentURL, payment, err := c.paymentService.InitiateUddoktaPayPayment(userID, req.Amount)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate payment: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":     "Payment initiated successfully",
		"payment_url": paymentURL,
		"payment":     payment.ToResponse(),
	})
}

// DepositViaManual initiates a manual deposit
func (c *PaymentController) DepositViaManual(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	enabled, _ := c.paymentService.IsDepositEnabled()
	if !enabled {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Deposits are currently disabled"})
		return
	}
	// Get amount and details from request body
	var req struct {
		Amount            float64                `json:"amount" binding:"required,min=100"`
		TransactionID     string                 `json:"transaction_id" binding:"required"`
		PaymentMethod     string                 `json:"payment_method" binding:"required"`
		SenderInformation map[string]interface{} `json:"sender_information" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create details JSON
	details := model.JSON{
		"transaction_id":     req.TransactionID,
		"payment_method":     req.PaymentMethod,
		"sender_information": req.SenderInformation,
	}

	// Process manual payment
	payment, err := c.paymentService.ProcessManualPayment(userID, req.Amount, details)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process payment: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Manual payment submitted successfully. It will be reviewed by admin.",
		"payment": payment.ToResponse(),
	})
}

// HandleCallback handles payment gateway callbacks
func (c *PaymentController) HandleCallback(ctx *gin.Context) {
	// Get gateway from URL parameter
	gateway := ctx.Param("gateway")

	// Read request body
	body, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	// Parse JSON
	var payload map[string]interface{}
	err = json.Unmarshal(body, &payload)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON payload"})
		return
	}

	// Process callback based on gateway
	switch gateway {
	case "coingate":
		err = c.paymentService.HandleCoinGateCallback(payload)
	case "uddoktapay":
		err = c.paymentService.HandleUddoktaPayCallback(payload)
	default:
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid gateway"})
		return
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process callback: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Callback processed successfully"})
}

// ApproveManualPayment approves a manual payment (admin only)
func (c *PaymentController) ApproveManualPayment(ctx *gin.Context) {
	// Get payment ID from URL parameter
	paymentID, err := parseIDParam(ctx, "id")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	// Approve payment
	err = c.paymentService.ApproveManualPayment(paymentID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve payment: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Payment approved successfully"})
}

// RejectManualPayment rejects a manual payment (admin only)
func (c *PaymentController) RejectManualPayment(ctx *gin.Context) {
	// Get payment ID from URL parameter
	paymentID, err := parseIDParam(ctx, "id")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	// Reject payment
	err = c.paymentService.RejectManualPayment(paymentID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject payment: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Payment rejected successfully"})
}

// GetPendingManualPayments gets all pending manual payments (admin only)
func (c *PaymentController) GetPendingManualPayments(ctx *gin.Context) {
	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get pending manual payments
	payments, err := c.paymentService.GetPendingManualPayments(limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get payments"})
		return
	}

	// Convert to response objects
	paymentResponses := make([]interface{}, 0, len(payments))
	for _, payment := range payments {
		paymentResponses = append(paymentResponses, payment.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"payments": paymentResponses})
}

// Add this method to your PaymentController in internal/controller/payment_controller.go

// GetPaymentStats gets payment statistics for the admin dashboard
func (c *PaymentController) GetPaymentStats(ctx *gin.Context) {
	// Count total payments
	totalPayments, err := c.paymentService.CountAllPayments()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count payments"})
		return
	}

	// Count payments by status
	pendingCount, err := c.paymentService.CountPaymentsByStatus(model.PaymentStatusPending)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count pending payments"})
		return
	}

	completedCount, err := c.paymentService.CountPaymentsByStatus(model.PaymentStatusCompleted)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count completed payments"})
		return
	}

	failedCount, err := c.paymentService.CountPaymentsByStatus(model.PaymentStatusFailed)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count failed payments"})
		return
	}

	// Count payments by gateway
	manualCount, err := c.paymentService.CountPaymentsByGateway(model.PaymentGatewayManual)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count manual payments"})
		return
	}

	coinGateCount, err := c.paymentService.CountPaymentsByGateway(model.PaymentGatewayCoingate)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count CoinGate payments"})
		return
	}

	uddoktaPayCount, err := c.paymentService.CountPaymentsByGateway(model.PaymentGatewayUddoktaPay)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count UddoktaPay payments"})
		return
	}

	// Calculate total amount
	totalAmount, err := c.paymentService.GetTotalCompletedAmount()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate total amount"})
		return
	}

	// Get recent payments (limit to 5)
	recentPayments, err := c.paymentService.GetRecentPayments(5)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recent payments"})
		return
	}

	// Convert recent payments to response objects
	recentPaymentResponses := make([]interface{}, 0, len(recentPayments))
	for _, payment := range recentPayments {
		recentPaymentResponses = append(recentPaymentResponses, payment.ToResponse())
	}

	// Return statistics
	ctx.JSON(http.StatusOK, gin.H{
		"total_payments":   totalPayments,
		"pending_count":    pendingCount,
		"completed_count":  completedCount,
		"failed_count":     failedCount,
		"manual_count":     manualCount,
		"coingate_count":   coinGateCount,
		"uddoktapay_count": uddoktaPayCount,
		"total_amount":     totalAmount,
		"recent_payments":  recentPaymentResponses,
	})
}
func (c *PaymentController) GetPaymentByID(ctx *gin.Context) {
	// Get payment ID from URL parameter
	paymentIDStr := ctx.Param("id")
	paymentID, err := strconv.ParseInt(paymentIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment ID"})
		return
	}

	// Get payment
	payment, err := c.paymentService.GetPaymentByID(paymentID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get payment"})
		return
	}
	if payment == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// Get associated transaction
	transaction, err := c.paymentService.GetTransactionByPaymentID(paymentID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	// Create response
	response := gin.H{
		"payment": payment.ToResponse(),
	}

	// Add transaction to response if available
	if transaction != nil {
		response["transaction"] = transaction.ToResponse()
	}

	ctx.JSON(http.StatusOK, response)
}
func (c *PaymentController) GetAllPayments(ctx *gin.Context) {
	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get payments
	payments, err := c.paymentService.GetAllPayments(limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get payments"})
		return
	}

	// Convert to response objects
	paymentResponses := make([]interface{}, 0, len(payments))
	for _, payment := range payments {
		paymentResponses = append(paymentResponses, payment.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"payments": paymentResponses})
}
