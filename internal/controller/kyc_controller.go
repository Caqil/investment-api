package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type KYCController struct {
	kycService          *service.KYCService
	notificationService *service.NotificationService
}

func NewKYCController(
	kycService *service.KYCService,
	notificationService *service.NotificationService,
) *KYCController {
	return &KYCController{
		kycService:          kycService,
		notificationService: notificationService,
	}
}

// SubmitKYC handles KYC document submission
func (c *KYCController) SubmitKYC(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get KYC details from request body
	var req struct {
		DocumentType     string `json:"document_type" binding:"required"`
		DocumentFrontURL string `json:"document_front_url" binding:"required"`
		DocumentBackURL  string `json:"document_back_url"`
		SelfieURL        string `json:"selfie_url" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate document type
	var documentType model.DocumentType
	switch req.DocumentType {
	case "id_card":
		documentType = model.DocumentTypeIDCard
	case "passport":
		documentType = model.DocumentTypePassport
	case "driving_license":
		documentType = model.DocumentTypeDrivingLicense
	default:
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document type"})
		return
	}

	// Submit KYC
	kyc, err := c.kycService.SubmitKYC(
		userID,
		documentType,
		req.DocumentFrontURL,
		req.DocumentBackURL,
		req.SelfieURL,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit KYC: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "KYC document submitted successfully and pending verification",
		"kyc":     kyc.ToResponse(),
	})
}

// GetKYCStatus gets the KYC status for a user
func (c *KYCController) GetKYCStatus(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get KYC status
	kyc, err := c.kycService.GetKYCStatus(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC status"})
		return
	}

	if kyc == nil {
		ctx.JSON(http.StatusOK, gin.H{"kyc_submitted": false})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"kyc_submitted": true,
		"kyc":           kyc.ToResponse(),
	})
}

// GetAllKYCSubmissions gets all KYC submissions (admin only)
func (c *KYCController) GetAllKYCSubmissions(ctx *gin.Context) {
	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get status filter
	status := ctx.Query("status")
	var kycs []*model.KYCDocument
	var err error

	// Get KYCs based on status
	if status != "" {
		switch model.KYCStatus(status) {
		case model.KYCStatusPending:
			kycs, err = c.kycService.GetPendingKYCDocuments(limit, offset)
		case model.KYCStatusApproved:
			kycs, err = c.kycService.GetApprovedKYCDocuments(limit, offset)
		case model.KYCStatusRejected:
			kycs, err = c.kycService.GetRejectedKYCDocuments(limit, offset)
		default:
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
			return
		}
	} else {
		kycs, err = c.kycService.GetAllKYCDocuments(limit, offset)
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC submissions"})
		return
	}

	// Convert to response objects
	kycResponses := make([]interface{}, 0, len(kycs))
	for _, kyc := range kycs {
		kycResponses = append(kycResponses, kyc.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"kyc_documents": kycResponses})
}

// ApproveKYC approves a KYC document (admin only)
func (c *KYCController) ApproveKYC(ctx *gin.Context) {
	// Get KYC ID from URL parameter
	kycIDStr := ctx.Param("id")
	kycID, err := strconv.ParseInt(kycIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid KYC ID"})
		return
	}

	// Get KYC document to get user ID for notification
	kyc, err := c.kycService.GetKYCByID(kycID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC document"})
		return
	}
	if kyc == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "KYC document not found"})
		return
	}

	// Approve KYC
	err = c.kycService.ApproveKYC(kycID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve KYC: " + err.Error()})
		return
	}

	// Send notification
	err = c.notificationService.CreateKYCApprovalNotification(kyc.UserID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "KYC document approved successfully"})
}

// RejectKYC rejects a KYC document (admin only)
func (c *KYCController) RejectKYC(ctx *gin.Context) {
	// Get KYC ID from URL parameter
	kycIDStr := ctx.Param("id")
	kycID, err := strconv.ParseInt(kycIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid KYC ID"})
		return
	}

	// Get reason from request body
	var req struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get KYC document to get user ID for notification
	kyc, err := c.kycService.GetKYCByID(kycID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC document"})
		return
	}
	if kyc == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "KYC document not found"})
		return
	}

	// Reject KYC
	err = c.kycService.RejectKYC(kycID, req.Reason)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject KYC: " + err.Error()})
		return
	}

	// Send notification
	err = c.notificationService.CreateKYCRejectionNotification(kyc.UserID, req.Reason)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "KYC document rejected successfully"})
}
