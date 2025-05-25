package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/investment-api/internal/middleware"
	"github.com/yourusername/investment-api/internal/service"
)

type ReferralController struct {
	userService  *service.UserService
	bonusService *service.BonusService
}

func NewReferralController(
	userService *service.UserService,
	bonusService *service.BonusService,
) *ReferralController {
	return &ReferralController{
		userService:  userService,
		bonusService: bonusService,
	}
}

// GetReferrals gets all referrals for a user
func (c *ReferralController) GetReferrals(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get referrals
	referrals, err := c.userService.GetUserReferrals(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get referrals"})
		return
	}

	// Convert to response objects
	referralResponses := make([]interface{}, 0, len(referrals))
	for _, referral := range referrals {
		referralResponses = append(referralResponses, referral.ToResponse())
	}

	// Get total earnings
	totalEarnings, err := c.bonusService.GetUserReferralEarnings(userID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{
		"referrals":       referralResponses,
		"total_referrals": len(referrals),
		"total_earnings":  totalEarnings,
	})
}

// GetReferralEarnings gets referral earnings for a user
func (c *ReferralController) GetReferralEarnings(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get total earnings
	totalEarnings, err := c.bonusService.GetUserReferralEarnings(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get referral earnings"})
		return
	}

	// Get referral count
	referralCount, err := c.bonusService.GetUserTotalReferrals(userID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	// Get user's referral code
	user, err := c.userService.GetUserByID(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"referral_code":   user.ReferralCode,
		"total_referrals": referralCount,
		"total_earnings":  totalEarnings,
	})
}
