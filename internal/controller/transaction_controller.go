package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/gin-gonic/gin"
)

type TransactionController struct {
	transactionRepo *repository.TransactionRepository
}

func NewTransactionController(transactionRepo *repository.TransactionRepository) *TransactionController {
	return &TransactionController{
		transactionRepo: transactionRepo,
	}
}

// GetUserTransactions gets all transactions for a user
func (c *TransactionController) GetUserTransactions(ctx *gin.Context) {
	// For admin access: Get user ID from URL parameter
	userIDStr := ctx.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get transactions
	transactions, err := c.transactionRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	// Count total transactions for the user
	count, err := c.transactionRepo.CountByUserID(userID)
	if err != nil {
		// Log error but continue
		count = int64(len(transactions))
	}

	// Convert to response objects
	transactionResponses := make([]interface{}, 0, len(transactions))
	for _, transaction := range transactions {
		transactionResponses = append(transactionResponses, transaction.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{
		"transactions": transactionResponses,
		"total":        count,
		"limit":        limit,
		"offset":       offset,
	})
}

// GetMyTransactions gets all transactions for the authenticated user
func (c *TransactionController) GetMyTransactions(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get transactions
	transactions, err := c.transactionRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	// Convert to response objects
	transactionResponses := make([]interface{}, 0, len(transactions))
	for _, transaction := range transactions {
		transactionResponses = append(transactionResponses, transaction.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"transactions": transactionResponses})
}

// GetAllTransactions gets all transactions (admin only)
func (c *TransactionController) GetAllTransactions(ctx *gin.Context) {
	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get transactions
	transactions, err := c.transactionRepo.FindAll(limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	// Convert to response objects
	transactionResponses := make([]interface{}, 0, len(transactions))
	for _, transaction := range transactions {
		transactionResponses = append(transactionResponses, transaction.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"transactions": transactionResponses})
}
