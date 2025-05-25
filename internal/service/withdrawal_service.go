package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
)

type WithdrawalService struct {
	withdrawalRepo  *repository.WithdrawalRepository
	transactionRepo *repository.TransactionRepository
	userRepo        *repository.UserRepository
	taskService     *TaskService
	config          struct {
		MinimumWithdrawalAmount float64
	}
}

func NewWithdrawalService(
	withdrawalRepo *repository.WithdrawalRepository,
	transactionRepo *repository.TransactionRepository,
	userRepo *repository.UserRepository,
	taskService *TaskService,
	config struct {
		MinimumWithdrawalAmount float64
	},
) *WithdrawalService {
	return &WithdrawalService{
		withdrawalRepo:  withdrawalRepo,
		transactionRepo: transactionRepo,
		userRepo:        userRepo,
		taskService:     taskService,
		config:          config,
	}
}

// RequestWithdrawal processes a withdrawal request
func (s *WithdrawalService) RequestWithdrawal(
	userID int64,
	amount float64,
	paymentMethod string,
	paymentDetails model.PaymentDetails,
) (*model.Withdrawal, error) {
	// Validate amount
	if amount < s.config.MinimumWithdrawalAmount {
		return nil, fmt.Errorf("withdrawal amount must be at least %.2f BDT", s.config.MinimumWithdrawalAmount)
	}

	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Check if user has enough balance
	if user.Balance < amount {
		return nil, errors.New("insufficient balance")
	}

	// Check if user has completed all mandatory tasks
	tasksCompleted, err := s.taskService.HasUserCompletedMandatoryTasks(userID)
	if err != nil {
		return nil, err
	}

	// Create transaction
	transaction := &model.Transaction{
		UserID:      userID,
		Amount:      amount,
		Type:        model.TransactionTypeWithdrawal,
		Status:      model.TransactionStatusPending,
		Description: fmt.Sprintf("Withdrawal via %s", paymentMethod),
	}

	transaction, err = s.transactionRepo.Create(transaction)
	if err != nil {
		return nil, err
	}

	// Create withdrawal
	withdrawal := &model.Withdrawal{
		TransactionID:  transaction.ID,
		UserID:         userID,
		Amount:         amount,
		PaymentMethod:  paymentMethod,
		PaymentDetails: paymentDetails,
		Status:         model.WithdrawalStatusPending,
		TasksCompleted: tasksCompleted,
	}

	withdrawal, err = s.withdrawalRepo.Create(withdrawal)
	if err != nil {
		return nil, err
	}

	// Deduct from user balance (even though withdrawal is pending)
	err = s.userRepo.UpdateBalance(userID, -amount)
	if err != nil {
		return nil, err
	}

	return withdrawal, nil
}

// GetUserWithdrawals gets all withdrawals for a user
func (s *WithdrawalService) GetUserWithdrawals(userID int64, limit, offset int) ([]*model.Withdrawal, error) {
	return s.withdrawalRepo.FindByUserID(userID, limit, offset)
}

// GetWithdrawalByID gets a withdrawal by ID
func (s *WithdrawalService) GetWithdrawalByID(id int64) (*model.Withdrawal, error) {
	withdrawal, err := s.withdrawalRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if withdrawal == nil {
		return nil, errors.New("withdrawal not found")
	}
	return withdrawal, nil
}

// ApproveWithdrawal approves a withdrawal
func (s *WithdrawalService) ApproveWithdrawal(id int64, adminNote string) error {
	withdrawal, err := s.withdrawalRepo.FindByID(id)
	if err != nil {
		return err
	}
	if withdrawal == nil {
		return errors.New("withdrawal not found")
	}

	// Check if withdrawal is already approved or rejected
	if withdrawal.Status != model.WithdrawalStatusPending {
		return fmt.Errorf("withdrawal is already %s", withdrawal.Status)
	}

	// Update withdrawal status
	withdrawal.Status = model.WithdrawalStatusApproved
	withdrawal.AdminNote = adminNote
	err = s.withdrawalRepo.Update(withdrawal)
	if err != nil {
		return err
	}

	// Update transaction status
	err = s.transactionRepo.UpdateStatus(withdrawal.TransactionID, model.TransactionStatusCompleted)
	if err != nil {
		return err
	}

	return nil
}

// RejectWithdrawal rejects a withdrawal and refunds the user
func (s *WithdrawalService) RejectWithdrawal(id int64, adminNote string) error {
	withdrawal, err := s.withdrawalRepo.FindByID(id)
	if err != nil {
		return err
	}
	if withdrawal == nil {
		return errors.New("withdrawal not found")
	}

	// Check if withdrawal is already approved or rejected
	if withdrawal.Status != model.WithdrawalStatusPending {
		return fmt.Errorf("withdrawal is already %s", withdrawal.Status)
	}

	// Update withdrawal status
	withdrawal.Status = model.WithdrawalStatusRejected
	withdrawal.AdminNote = adminNote
	err = s.withdrawalRepo.Update(withdrawal)
	if err != nil {
		return err
	}

	// Update transaction status
	err = s.transactionRepo.UpdateStatus(withdrawal.TransactionID, model.TransactionStatusRejected)
	if err != nil {
		return err
	}

	// Refund the user
	err = s.userRepo.UpdateBalance(withdrawal.UserID, withdrawal.Amount)
	if err != nil {
		return err
	}

	// Create refund transaction
	refundTransaction := &model.Transaction{
		UserID:      withdrawal.UserID,
		Amount:      withdrawal.Amount,
		Type:        model.TransactionTypeDeposit, // Using deposit type for refund
		Status:      model.TransactionStatusCompleted,
		Description: fmt.Sprintf("Refund for rejected withdrawal #%d: %s", withdrawal.ID, adminNote),
	}

	_, err = s.transactionRepo.Create(refundTransaction)
	if err != nil {
		return err
	}

	return nil
}

// GetPendingWithdrawals gets all pending withdrawals
func (s *WithdrawalService) GetPendingWithdrawals(limit, offset int) ([]*model.Withdrawal, error) {
	return s.withdrawalRepo.FindByStatus(model.WithdrawalStatusPending, limit, offset)
}

// GetWithdrawalsByStatus gets all withdrawals with a specific status
func (s *WithdrawalService) GetWithdrawalsByStatus(status model.WithdrawalStatus, limit, offset int) ([]*model.Withdrawal, error) {
	return s.withdrawalRepo.FindByStatus(status, limit, offset)
}

// GetAllWithdrawals gets all withdrawals
func (s *WithdrawalService) GetAllWithdrawals(limit, offset int) ([]*model.Withdrawal, error) {
	return s.withdrawalRepo.FindAll(limit, offset)
}

// GetTotalWithdrawalsByStatus gets the total count of withdrawals with a specific status
func (s *WithdrawalService) GetTotalWithdrawalsByStatus(status model.WithdrawalStatus) (int, error) {
	return s.withdrawalRepo.CountByStatus(status)
}

// CalculateDailyWithdrawalAmount calculates the total withdrawal amount for a user on a given day
func (s *WithdrawalService) CalculateDailyWithdrawalAmount(userID int64, date time.Time) (float64, error) {
	return s.transactionRepo.GetDailyTransactionTotalByUserIDAndType(
		userID,
		model.TransactionTypeWithdrawal,
		date,
	)
}

// CheckWithdrawalLimit checks if a user has reached their daily withdrawal limit
func (s *WithdrawalService) CheckWithdrawalLimit(userID int64, amount float64) (bool, float64, error) {
	// Get user's plan
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return false, 0, err
	}
	if user == nil {
		return false, 0, errors.New("user not found")
	}

	// Get plan
	planRepo := repository.NewPlanRepository(s.withdrawalRepo.GetDB())
	plan, err := planRepo.FindByID(user.PlanID)
	if err != nil {
		return false, 0, err
	}
	if plan == nil {
		return false, 0, errors.New("plan not found")
	}

	// Calculate today's total withdrawals
	todayTotal, err := s.CalculateDailyWithdrawalAmount(userID, time.Now())
	if err != nil {
		return false, 0, err
	}

	// Check if user will exceed the limit with this withdrawal
	if todayTotal+amount > plan.DailyWithdrawalLimit {
		return false, plan.DailyWithdrawalLimit - todayTotal, nil
	}

	return true, plan.DailyWithdrawalLimit - todayTotal, nil
}
