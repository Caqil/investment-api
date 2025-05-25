package service

import (
	"fmt"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
)

type BonusService struct {
	userRepo         *repository.UserRepository
	transactionRepo  *repository.TransactionRepository
	notificationRepo *repository.NotificationRepository
	config           struct {
		DailyBonusPercentage     float64
		ReferralBonusAmount      float64
		ReferralProfitPercentage float64
	}
}

func NewBonusService(
	userRepo *repository.UserRepository,
	transactionRepo *repository.TransactionRepository,
	config struct {
		DailyBonusPercentage     float64
		ReferralBonusAmount      float64
		ReferralProfitPercentage float64
	},
) *BonusService {
	return &BonusService{
		userRepo:        userRepo,
		transactionRepo: transactionRepo,
		config:          config,
	}
}

// CalculateDailyBonus calculates and adds the daily bonus for a user
func (s *BonusService) CalculateDailyBonus(userID int64) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}

	// Skip if user is blocked
	if user.IsBlocked {
		return nil
	}

	// Calculate bonus amount (5% of total balance)
	bonusAmount := user.Balance * (s.config.DailyBonusPercentage / 100)
	if bonusAmount <= 0 {
		// No bonus if balance is zero or negative
		return nil
	}

	// Create bonus transaction
	transaction := &model.Transaction{
		UserID:      userID,
		Amount:      bonusAmount,
		Type:        model.TransactionTypeBonus,
		Status:      model.TransactionStatusCompleted,
		Description: fmt.Sprintf("%.2f%% daily bonus", s.config.DailyBonusPercentage),
	}

	_, err = s.transactionRepo.Create(transaction)
	if err != nil {
		return err
	}

	// Update user balance
	err = s.userRepo.UpdateBalance(userID, bonusAmount)
	if err != nil {
		return err
	}

	// Create notification if notification repository is set
	if s.notificationRepo != nil {
		notification := &model.Notification{
			UserID:  userID,
			Title:   "Daily Bonus Received",
			Message: fmt.Sprintf("You have received a daily bonus of %.2f BDT, which has been added to your balance.", bonusAmount),
			Type:    model.NotificationTypeBonus,
			IsRead:  false,
		}
		_, err = s.notificationRepo.Create(notification)
		if err != nil {
			// Log error but continue
			// In a real app, this would use a proper logging system
			fmt.Printf("Error creating notification: %v\n", err)
		}
	}

	// Process referral profit bonus if user has a referrer
	if user.ReferredBy != nil {
		err = s.ProcessReferralProfitBonus(userID, *user.ReferredBy, bonusAmount)
		if err != nil {
			// Log error but continue
			// In a real app, this would use a proper logging system
			fmt.Printf("Error processing referral profit bonus: %v\n", err)
		}
	}

	return nil
}

// CalculateDailyBonusForAllUsers calculates and adds daily bonuses for all users
// This should be run as a scheduled task once per day
func (s *BonusService) CalculateDailyBonusForAllUsers() error {
	// Get all users
	users, err := s.userRepo.FindAll(0, 0) // Get all users, no limit or offset
	if err != nil {
		return err
	}

	for _, user := range users {
		// Skip calculating bonus for blocked users
		if user.IsBlocked {
			continue
		}

		// Calculate and add bonus for each user
		if err := s.CalculateDailyBonus(user.ID); err != nil {
			// Log error but continue with other users
			// In a real app, this would use a proper logging system
			fmt.Printf("Error calculating daily bonus for user %d: %v\n", user.ID, err)
			continue
		}
	}

	return nil
}

// ProcessReferralBonus processes the referral bonus for both user and referrer
func (s *BonusService) ProcessReferralBonus(userID, referrerID int64) error {
	// Get both users
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}

	referrer, err := s.userRepo.FindByID(referrerID)
	if err != nil {
		return err
	}
	if referrer == nil {
		return fmt.Errorf("referrer not found")
	}

	// Create transaction for user
	userTransaction := &model.Transaction{
		UserID:      userID,
		Amount:      s.config.ReferralBonusAmount,
		Type:        model.TransactionTypeReferralBonus,
		Status:      model.TransactionStatusCompleted,
		Description: fmt.Sprintf("Referral bonus for being referred by %s", referrer.Name),
	}

	_, err = s.transactionRepo.Create(userTransaction)
	if err != nil {
		return err
	}

	// Create transaction for referrer
	referrerTransaction := &model.Transaction{
		UserID:      referrerID,
		Amount:      s.config.ReferralBonusAmount,
		Type:        model.TransactionTypeReferralBonus,
		Status:      model.TransactionStatusCompleted,
		Description: fmt.Sprintf("Referral bonus for referring %s", user.Name),
	}

	_, err = s.transactionRepo.Create(referrerTransaction)
	if err != nil {
		return err
	}

	// Update user balance
	err = s.userRepo.UpdateBalance(userID, s.config.ReferralBonusAmount)
	if err != nil {
		return err
	}

	// Update referrer balance
	err = s.userRepo.UpdateBalance(referrerID, s.config.ReferralBonusAmount)
	if err != nil {
		return err
	}

	// Create notifications if notification repository is set
	if s.notificationRepo != nil {
		// Notification for user
		userNotification := &model.Notification{
			UserID:  userID,
			Title:   "Referral Bonus Received",
			Message: fmt.Sprintf("You have received a referral bonus of %.2f BDT for being referred by %s.", s.config.ReferralBonusAmount, referrer.Name),
			Type:    model.NotificationTypeBonus,
			IsRead:  false,
		}
		_, err = s.notificationRepo.Create(userNotification)
		if err != nil {
			// Log error but continue
			fmt.Printf("Error creating user notification: %v\n", err)
		}

		// Notification for referrer
		referrerNotification := &model.Notification{
			UserID:  referrerID,
			Title:   "Referral Bonus Received",
			Message: fmt.Sprintf("You have received a referral bonus of %.2f BDT for referring %s.", s.config.ReferralBonusAmount, user.Name),
			Type:    model.NotificationTypeBonus,
			IsRead:  false,
		}
		_, err = s.notificationRepo.Create(referrerNotification)
		if err != nil {
			// Log error but continue
			fmt.Printf("Error creating referrer notification: %v\n", err)
		}
	}

	return nil
}

// ProcessReferralProfitBonus processes the referral profit bonus
// This should be called when a user receives a profit (e.g., daily bonus)
func (s *BonusService) ProcessReferralProfitBonus(userID, referrerID int64, profitAmount float64) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return fmt.Errorf("user not found")
	}

	// Get referrer
	referrer, err := s.userRepo.FindByID(referrerID)
	if err != nil {
		return err
	}
	if referrer == nil {
		return fmt.Errorf("referrer not found")
	}

	// Skip if referrer is blocked
	if referrer.IsBlocked {
		return nil
	}

	// Calculate bonus amount (10% of profit)
	bonusAmount := profitAmount * (s.config.ReferralProfitPercentage / 100)
	if bonusAmount <= 0 {
		// No bonus if profit is zero or negative
		return nil
	}

	// Create transaction for referrer
	transaction := &model.Transaction{
		UserID:      referrerID,
		Amount:      bonusAmount,
		Type:        model.TransactionTypeReferralProfit,
		Status:      model.TransactionStatusCompleted,
		Description: fmt.Sprintf("%.2f%% profit bonus from %s", s.config.ReferralProfitPercentage, user.Name),
	}

	_, err = s.transactionRepo.Create(transaction)
	if err != nil {
		return err
	}

	// Update referrer balance
	err = s.userRepo.UpdateBalance(referrerID, bonusAmount)
	if err != nil {
		return err
	}

	// Create notification if notification repository is set
	if s.notificationRepo != nil {
		notification := &model.Notification{
			UserID:  referrerID,
			Title:   "Referral Profit Received",
			Message: fmt.Sprintf("You have received %.2f BDT as profit from your referral %s.", bonusAmount, user.Name),
			Type:    model.NotificationTypeBonus,
			IsRead:  false,
		}
		_, err = s.notificationRepo.Create(notification)
		if err != nil {
			// Log error but continue
			fmt.Printf("Error creating notification: %v\n", err)
		}
	}

	return nil
}

// GetUserReferralEarnings gets the total earnings from referrals for a user
func (s *BonusService) GetUserReferralEarnings(userID int64) (float64, error) {
	// Get start date (all time) and end date (now)
	endDate := time.Now()
	startDate := time.Date(2000, 1, 1, 0, 0, 0, 0, endDate.Location()) // Start from a long time ago

	// Get total referral bonus
	var totalReferralBonus float64 = 0
	referralBonusTxs, err := s.transactionRepo.FindByTypeAndUserID(
		userID,
		model.TransactionTypeReferralBonus,
		startDate,
		endDate,
	)
	if err != nil {
		return 0, err
	}

	for _, tx := range referralBonusTxs {
		if tx.Status == model.TransactionStatusCompleted {
			totalReferralBonus += tx.Amount
		}
	}

	// Get total referral profit
	var totalReferralProfit float64 = 0
	referralProfitTxs, err := s.transactionRepo.FindByTypeAndUserID(
		userID,
		model.TransactionTypeReferralProfit,
		startDate,
		endDate,
	)
	if err != nil {
		return 0, err
	}

	for _, tx := range referralProfitTxs {
		if tx.Status == model.TransactionStatusCompleted {
			totalReferralProfit += tx.Amount
		}
	}

	return totalReferralBonus + totalReferralProfit, nil
}

// GetUserTotalReferrals gets the total number of users referred by a user
func (s *BonusService) GetUserTotalReferrals(userID int64) (int, error) {
	referrals, err := s.userRepo.FindReferrals(userID)
	if err != nil {
		return 0, err
	}
	return len(referrals), nil
}

// SetNotificationRepo sets the notification repository
// This is useful when the bonus service is created before the notification repository
func (s *BonusService) SetNotificationRepo(notificationRepo *repository.NotificationRepository) {
	s.notificationRepo = notificationRepo
}
