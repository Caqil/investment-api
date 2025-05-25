package service

import (
	"errors"
	"fmt"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/utils"
)

type NotificationService struct {
	notificationRepo *repository.NotificationRepository
	emailService     *utils.EmailService
}

func NewNotificationService(
	notificationRepo *repository.NotificationRepository,
	emailService *utils.EmailService,
) *NotificationService {
	return &NotificationService{
		notificationRepo: notificationRepo,
		emailService:     emailService,
	}
}

// CreateNotification creates a new notification for a user
func (s *NotificationService) CreateNotification(
	userID int64,
	title, message string,
	notificationType model.NotificationType,
) (*model.Notification, error) {
	notification := &model.Notification{
		UserID:  userID,
		Title:   title,
		Message: message,
		Type:    notificationType,
		IsRead:  false,
	}

	return s.notificationRepo.Create(notification)
}

// CreateWithdrawalApprovalNotification creates a notification for a withdrawal approval
func (s *NotificationService) CreateWithdrawalApprovalNotification(userID, withdrawalID int64, amount float64) error {
	title := "Withdrawal Approved"
	message := fmt.Sprintf("Your withdrawal request for %.2f BDT has been approved. The funds will be transferred to your account shortly.", amount)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeWithdrawal)
	if err != nil {
		return err
	}

	// Also send an email
	// Get user email from repository
	userRepo := repository.NewUserRepository(s.notificationRepo.GetDB())
	user, err := userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	return s.emailService.SendWithdrawalApprovalEmail(user.Email, amount)
}

// CreateWithdrawalRejectionNotification creates a notification for a withdrawal rejection
func (s *NotificationService) CreateWithdrawalRejectionNotification(userID, withdrawalID int64, amount float64, reason string) error {
	title := "Withdrawal Rejected"
	message := fmt.Sprintf("Your withdrawal request for %.2f BDT has been rejected. Reason: %s", amount, reason)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeWithdrawal)
	if err != nil {
		return err
	}

	// Also send an email
	// Get user email from repository
	userRepo := repository.NewUserRepository(s.notificationRepo.GetDB())
	user, err := userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	return s.emailService.SendWithdrawalRejectionEmail(user.Email, amount, reason)
}

// CreateDepositNotification creates a notification for a deposit
func (s *NotificationService) CreateDepositNotification(userID int64, amount float64, method string) error {
	title := "Deposit Successful"
	message := fmt.Sprintf("Your deposit of %.2f BDT via %s has been successfully processed and added to your balance.", amount, method)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeDeposit)
	return err
}

// CreateDailyBonusNotification creates a notification for a daily bonus
func (s *NotificationService) CreateDailyBonusNotification(userID int64, amount float64) error {
	title := "Daily Bonus Received"
	message := fmt.Sprintf("You have received a daily bonus of %.2f BDT, which has been added to your balance.", amount)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeBonus)
	return err
}

// CreateReferralBonusNotification creates a notification for a referral bonus
func (s *NotificationService) CreateReferralBonusNotification(userID int64, amount float64, referredName string) error {
	title := "Referral Bonus Received"
	message := fmt.Sprintf("You have received a referral bonus of %.2f BDT for referring %s.", amount, referredName)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeBonus)
	return err
}

// CreateReferralProfitNotification creates a notification for a referral profit bonus
func (s *NotificationService) CreateReferralProfitNotification(userID int64, amount float64, referredName string) error {
	title := "Referral Profit Received"
	message := fmt.Sprintf("You have received %.2f BDT as profit from your referral %s.", amount, referredName)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeBonus)
	return err
}

// CreateKYCApprovalNotification creates a notification for a KYC approval
func (s *NotificationService) CreateKYCApprovalNotification(userID int64) error {
	title := "KYC Verified"
	message := "Your KYC verification has been approved. You now have a verified account badge."

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreateKYCRejectionNotification creates a notification for a KYC rejection
func (s *NotificationService) CreateKYCRejectionNotification(userID int64, reason string) error {
	title := "KYC Verification Failed"
	message := fmt.Sprintf("Your KYC verification has been rejected. Reason: %s", reason)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreateSystemNotification creates a system notification for a user
func (s *NotificationService) CreateSystemNotification(userID int64, title, message string) error {
	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreateSystemNotificationForAllUsers creates a system notification for all users
func (s *NotificationService) CreateSystemNotificationForAllUsers(title, message string) error {
	return s.notificationRepo.CreateForAllUsers(title, message, model.NotificationTypeSystem)
}

// GetNotificationsByUserID gets all notifications for a user
func (s *NotificationService) GetNotificationsByUserID(userID int64, limit, offset int) ([]*model.Notification, error) {
	return s.notificationRepo.FindByUserID(userID, limit, offset)
}

// GetUnreadNotificationsByUserID gets all unread notifications for a user
func (s *NotificationService) GetUnreadNotificationsByUserID(userID int64, limit, offset int) ([]*model.Notification, error) {
	return s.notificationRepo.FindUnreadByUserID(userID, limit, offset)
}

// GetUnreadNotificationCountByUserID gets the count of unread notifications for a user
func (s *NotificationService) GetUnreadNotificationCountByUserID(userID int64) (int, error) {
	return s.notificationRepo.CountUnreadByUserID(userID)
}

// MarkNotificationAsRead marks a notification as read
func (s *NotificationService) MarkNotificationAsRead(id, userID int64) error {
	// Check if the notification belongs to the user
	notification, err := s.notificationRepo.FindByID(id)
	if err != nil {
		return err
	}
	if notification == nil {
		return errors.New("notification not found")
	}
	if notification.UserID != userID {
		return errors.New("notification does not belong to the user")
	}

	return s.notificationRepo.MarkAsRead(id)
}

// MarkAllNotificationsAsRead marks all notifications as read for a user
func (s *NotificationService) MarkAllNotificationsAsRead(userID int64) error {
	return s.notificationRepo.MarkAllAsRead(userID)
}

// DeleteNotification deletes a notification
func (s *NotificationService) DeleteNotification(id, userID int64) error {
	// Check if the notification belongs to the user
	notification, err := s.notificationRepo.FindByID(id)
	if err != nil {
		return err
	}
	if notification == nil {
		return errors.New("notification not found")
	}
	if notification.UserID != userID {
		return errors.New("notification does not belong to the user")
	}

	return s.notificationRepo.Delete(id)
}

// DeleteAllNotifications deletes all notifications for a user
func (s *NotificationService) DeleteAllNotifications(userID int64) error {
	return s.notificationRepo.DeleteAllByUserID(userID)
}
