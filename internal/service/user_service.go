package service

import (
	"errors"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/database"
	"github.com/Caqil/investment-api/pkg/utils"
)

type UserService struct {
	userRepo   *repository.UserRepository
	deviceRepo *repository.DeviceRepository
	mongoConn  *database.MongoDBConnection // Add this field
}

func NewUserService(
	userRepo *repository.UserRepository,
	deviceRepo *repository.DeviceRepository,
) *UserService {
	return &UserService{
		userRepo:   userRepo,
		deviceRepo: deviceRepo,
	}
}

// GetUserByID gets a user by ID
func (s *UserService) GetUserByID(id int64) (*model.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

// GetUserByEmail gets a user by email
func (s *UserService) GetUserByEmail(email string) (*model.User, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *UserService) CreateUser(
	name, email, password, phone string,
	balance float64,
	isAdmin, isBlocked bool,
) (*model.User, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Generate password hash
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	// Generate referral code
	referralCode, err := utils.GenerateReferralCode(8)
	if err != nil {
		return nil, err
	}

	// Create user object
	user := &model.User{
		Name:             name,
		Email:            email,
		PasswordHash:     hashedPassword,
		Phone:            phone,
		Balance:          balance,
		ReferralCode:     referralCode,
		PlanID:           1, // Default free plan
		IsKYCVerified:    false,
		EmailVerified:    true, // Admin created users are automatically verified
		IsAdmin:          isAdmin,
		IsBlocked:        isBlocked,
		BiometricEnabled: false,
	}

	// Save user to database
	createdUser, err := s.userRepo.Create(user)
	if err != nil {
		return nil, err
	}

	return createdUser, nil
}

// UpdateUserAsAdmin updates a user with admin privileges
func (s *UserService) UpdateUserAsAdmin(
	userID int64,
	name, phone string,
	balance float64,
	isAdmin, isBlocked bool,
) (*model.User, error) {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Update user fields
	if name != "" {
		user.Name = name
	}
	if phone != "" {
		user.Phone = phone
	}

	// Update other fields
	user.Balance = balance
	user.IsAdmin = isAdmin
	user.IsBlocked = isBlocked

	// Save user to database
	err = s.userRepo.Update(user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// DeleteUser deletes a user by ID
func (s *UserService) DeleteUser(userID int64) error {
	// Check if user exists
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Delete user devices
	devices, err := s.deviceRepo.FindByUserID(userID)
	if err != nil {
		return err
	}

	// Delete each device
	for _, device := range devices {
		err = s.deviceRepo.Delete(device.ID)
		if err != nil {
			// Log error but continue
			// In a real app, you might want to handle this differently
		}
	}

	// Delete the user
	return s.userRepo.Delete(userID)
}

// UpdateProfile updates a user's profile
func (s *UserService) UpdateProfile(
	userID int64,
	name, phone string,
	profilePicURL string,
) (*model.User, error) {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Update user
	user.Name = name
	user.Phone = phone
	if profilePicURL != "" {
		user.ProfilePicURL = profilePicURL
	}

	err = s.userRepo.Update(user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// ChangePassword changes a user's password
func (s *UserService) ChangePassword(userID int64, currentPassword, newPassword string) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Verify current password
	if !utils.CheckPasswordHash(currentPassword, user.PasswordHash) {
		return errors.New("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// Update user
	user.PasswordHash = hashedPassword
	return s.userRepo.Update(user)
}

// EnableBiometric enables biometric login for a user
func (s *UserService) EnableBiometric(userID int64) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Update user
	user.BiometricEnabled = true
	return s.userRepo.Update(user)
}

// DisableBiometric disables biometric login for a user
func (s *UserService) DisableBiometric(userID int64) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Update user
	user.BiometricEnabled = false
	return s.userRepo.Update(user)
}

// AssignPlan assigns a plan to a user
func (s *UserService) AssignPlan(userID, planID int64) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Get plan
	planRepo := repository.NewPlanRepository(s.mongoConn)
	plan, err := planRepo.FindByID(planID)
	if err != nil {
		return err
	}
	if plan == nil {
		return errors.New("plan not found")
	}

	// Update user
	user.PlanID = planID
	return s.userRepo.Update(user)
}

// PurchasePlan purchases a plan for a user
func (s *UserService) PurchasePlan(userID, planID int64, price float64) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Check if user has enough balance
	if user.Balance < price {
		return errors.New("insufficient balance")
	}

	// Get plan
	planRepo := repository.NewPlanRepository(s.mongoConn) // Use mongoConn instead of userRepo.GetDB()
	plan, err := planRepo.FindByID(planID)
	if err != nil {
		return err
	}
	if plan == nil {
		return errors.New("plan not found")
	}

	// Create transaction
	transactionRepo := repository.NewTransactionRepository(s.mongoConn) // Use mongoConn instead of userRepo.GetDB()
	transaction := &model.Transaction{
		UserID:      userID,
		Amount:      price,
		Type:        model.TransactionTypePlanPurchase,
		Status:      model.TransactionStatusCompleted,
		Description: "Purchase of " + plan.Name + " plan",
	}

	_, err = transactionRepo.Create(transaction)
	if err != nil {
		return err
	}

	// Update user balance
	err = s.userRepo.UpdateBalance(userID, -price)
	if err != nil {
		return err
	}

	// Update user plan
	user.PlanID = planID
	return s.userRepo.Update(user)
}

// BlockUser blocks a user
func (s *UserService) BlockUser(userID int64) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Update user
	user.IsBlocked = true
	return s.userRepo.Update(user)
}

// UnblockUser unblocks a user
func (s *UserService) UnblockUser(userID int64) error {
	// Get user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Update user
	user.IsBlocked = false
	return s.userRepo.Update(user)
}

// GetAllUsers gets all users
func (s *UserService) GetAllUsers(limit, offset int) ([]*model.User, error) {
	return s.userRepo.FindAll(limit, offset)
}

// GetUserReferrals gets all users referred by a user
func (s *UserService) GetUserReferrals(userID int64) ([]*model.User, error) {
	return s.userRepo.FindReferrals(userID)
}

// GetUserDevices gets all devices for a user
func (s *UserService) GetUserDevices(userID int64) ([]*model.Device, error) {
	return s.deviceRepo.FindByUserID(userID)
}

// UpdateUserBalance updates a user's balance
func (s *UserService) UpdateUserBalance(userID int64, amount float64) error {
	return s.userRepo.UpdateBalance(userID, amount)
}
