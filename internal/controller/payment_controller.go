package controller

import (
	"encoding/json"
	"io"
	"net/http"

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
