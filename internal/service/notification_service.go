package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/database"
	"github.com/Caqil/investment-api/pkg/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type NotificationService struct {
	notificationRepo *repository.NotificationRepository
	mongoConn        *database.MongoDBConnection // Add this field
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
	userRepo := repository.NewUserRepository(s.mongoConn)
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
	userRepo := repository.NewUserRepository(s.mongoConn)
	user, err := userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	return s.emailService.SendWithdrawalRejectionEmail(user.Email, amount, reason)
}

// CreateDailyBonusNotification creates a notification for a daily bonus
func (s *NotificationService) CreateDailyBonusNotification(userID int64, amount float64) error {
	title := "Daily Bonus Received"
	message := fmt.Sprintf("You have received a daily bonus of %.2f BDT, which has been added to your balance.", amount)

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
	count, err := s.notificationRepo.CountUnreadByUserID(userID)
	if err != nil {
		return 0, err
	}

	// Convert int64 to int
	return int(count), nil
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

// Add these methods to internal/service/notification_service.go

// GetAllNotifications gets all notifications across all users
func (s *NotificationService) GetAllNotifications(limit, offset int) ([]*model.Notification, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(int64(offset))

	if limit > 0 {
		options.SetLimit(int64(limit))
	}

	cursor, err := s.notificationRepo.GetDB().Collection("notifications").Find(ctx, bson.M{}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var notifications []*model.Notification
	if err = cursor.All(ctx, &notifications); err != nil {
		return nil, err
	}

	return notifications, nil
}

// GetReadNotificationsByUserID gets all read notifications for a user
func (s *NotificationService) GetReadNotificationsByUserID(userID int64, limit, offset int) ([]*model.Notification, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(int64(offset))

	if limit > 0 {
		options.SetLimit(int64(limit))
	}

	cursor, err := s.notificationRepo.GetDB().Collection("notifications").Find(ctx,
		bson.M{
			"user_id": userID,
			"is_read": true,
		},
		options,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var notifications []*model.Notification
	if err = cursor.All(ctx, &notifications); err != nil {
		return nil, err
	}

	return notifications, nil
}

// CountAllNotifications counts all notifications across all users
func (s *NotificationService) CountAllNotifications() (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := s.notificationRepo.GetDB().Collection("notifications").CountDocuments(ctx, bson.M{})
	if err != nil {
		return 0, err
	}

	return int(count), nil
}

// CountAllUnreadNotifications counts all unread notifications across all users
func (s *NotificationService) CountAllUnreadNotifications() (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := s.notificationRepo.GetDB().Collection("notifications").CountDocuments(ctx, bson.M{"is_read": false})
	if err != nil {
		return 0, err
	}

	return int(count), nil
}

// CountNotificationsByType counts notifications by type
func (s *NotificationService) CountNotificationsByType(notificationType model.NotificationType) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := s.notificationRepo.GetDB().Collection("notifications").CountDocuments(ctx, bson.M{"type": notificationType})
	if err != nil {
		return 0, err
	}

	return int(count), nil
}

// GetRecentNotifications gets the most recent notifications across all users
func (s *NotificationService) GetRecentNotifications(limit int) ([]*model.Notification, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := s.notificationRepo.GetDB().Collection("notifications").Find(ctx, bson.M{}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var notifications []*model.Notification
	if err = cursor.All(ctx, &notifications); err != nil {
		return nil, err
	}

	return notifications, nil
}

// MarkNotificationAsReadByAdmin marks a notification as read (for admin use)
func (s *NotificationService) MarkNotificationAsReadByAdmin(notificationID int64) error {
	return s.notificationRepo.MarkAsRead(notificationID)
}

// DeleteNotificationByAdmin deletes a notification (for admin use)
func (s *NotificationService) DeleteNotificationByAdmin(notificationID int64) error {
	return s.notificationRepo.Delete(notificationID)
}

// internal/service/notification_service.go
// Add these methods to your notification service

// CreateWithdrawalRequestNotification creates a notification for a withdrawal request
func (s *NotificationService) CreateWithdrawalRequestNotification(userID int64, amount float64, paymentMethod string) error {
	title := "Withdrawal Request Submitted"
	message := fmt.Sprintf("Your withdrawal request for %.2f BDT via %s has been submitted and is pending approval.", amount, paymentMethod)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeWithdrawal)
	return err
}

// CreateDepositNotification creates a notification for a deposit
func (s *NotificationService) CreateDepositNotification(userID int64, amount float64, method string) error {
	title := "Deposit Successful"
	message := fmt.Sprintf("Your deposit of %.2f BDT via %s has been successfully processed and added to your balance.", amount, method)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeDeposit)
	return err
}

// CreateReferralBonusNotification creates a notification for a referral bonus
func (s *NotificationService) CreateReferralBonusNotification(userID int64, amount float64, referredName string) error {
	title := "Referral Bonus Received"
	message := fmt.Sprintf("You have received a referral bonus of %.2f BDT for referring %s.", amount, referredName)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeBonus)
	return err
}

// CreatePlanPurchaseNotification creates a notification for a plan purchase
func (s *NotificationService) CreatePlanPurchaseNotification(userID int64, planName string, price float64) error {
	title := "Plan Purchase Successful"
	message := fmt.Sprintf("You have successfully purchased the %s plan for %.2f BDT.", planName, price)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// GetUserNotifications gets notifications for a user with pagination and sorting by most recent
func (s *NotificationService) GetUserNotifications(userID int64, limit, offset int) ([]*model.Notification, error) {
	return s.notificationRepo.FindByUserID(userID, limit, offset)
}

// GetUserUnreadCount gets the count of unread notifications for a user
func (s *NotificationService) GetUserUnreadCount(userID int64) (int, error) {
	count, err := s.notificationRepo.CountUnreadByUserID(userID)
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

// CreateRegistrationNotification creates a notification for new user registration
func (s *NotificationService) CreateRegistrationNotification(userID int64, name string) error {
	title := "Welcome to Investment Platform"
	message := fmt.Sprintf("Welcome, %s! Your account has been successfully created. Complete your profile and KYC verification to unlock all features.", name)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreateKYCSubmissionNotification creates a notification for KYC document submission
func (s *NotificationService) CreateKYCSubmissionNotification(userID int64) error {
	title := "KYC Documents Submitted"
	message := "Your KYC documents have been submitted successfully and are pending verification. We'll notify you once the verification is complete."

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreateKYCApprovalNotification creates a notification for KYC approval
func (s *NotificationService) CreateKYCApprovalNotification(userID int64) error {
	title := "KYC Verification Approved"
	message := "Congratulations! Your KYC verification has been approved. You now have full access to all platform features."

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreateKYCRejectionNotification creates a notification for KYC rejection
func (s *NotificationService) CreateKYCRejectionNotification(userID int64, reason string) error {
	title := "KYC Verification Rejected"
	message := fmt.Sprintf("Your KYC verification has been rejected. Reason: %s. Please resubmit your documents with the correct information.", reason)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreatePasswordChangeNotification creates a notification for password change
func (s *NotificationService) CreatePasswordChangeNotification(userID int64) error {
	title := "Password Changed"
	message := "Your account password has been changed successfully. If you didn't make this change, please contact support immediately."

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreateProfileUpdateNotification creates a notification for profile update
func (s *NotificationService) CreateProfileUpdateNotification(userID int64) error {
	title := "Profile Updated"
	message := "Your profile information has been updated successfully."

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

// CreateTaskCompletionNotification creates a notification for task completion
func (s *NotificationService) CreateTaskCompletionNotification(userID int64, taskName string) error {
	title := "Task Completed"
	message := fmt.Sprintf("You have successfully completed the task: %s.", taskName)

	_, err := s.CreateNotification(userID, title, message, model.NotificationTypeSystem)
	return err
}

