package service

import (
	"errors"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/utils"
)

type AuthService struct {
	userRepo     *repository.UserRepository
	jwtManager   *utils.JWTManager
	emailService *utils.EmailService
}

func NewAuthService(
	userRepo *repository.UserRepository,
	jwtManager *utils.JWTManager,
	emailService *utils.EmailService,
) *AuthService {
	return &AuthService{
		userRepo:     userRepo,
		jwtManager:   jwtManager,
		emailService: emailService,
	}
}

func (s *AuthService) Register(
	name, email, password, phone string,
	referCode string,
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
		Balance:          0,
		ReferralCode:     referralCode,
		PlanID:           1, // Default free plan
		IsKYCVerified:    false,
		EmailVerified:    false,
		IsAdmin:          false,
		IsBlocked:        false,
		BiometricEnabled: false,
	}

	// Handle referral if provided
	if referCode != "" {
		referrer, err := s.userRepo.FindByReferralCode(referCode)
		if err != nil {
			return nil, err
		}
		if referrer != nil {
			user.ReferredBy = &referrer.ID
		}
	}

	// Save user to database
	createdUser, err := s.userRepo.Create(user)
	if err != nil {
		return nil, err
	}

	// Send verification email
	verificationCode := utils.GenerateRandomString(6)
	// TODO: Store verification code in database or cache
	err = s.emailService.SendVerificationEmail(email, verificationCode)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	return createdUser, nil
}

func (s *AuthService) Login(email, password string) (string, *model.User, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return "", nil, err
	}
	if user == nil {
		return "", nil, errors.New("invalid email or password")
	}

	// Check if user is blocked
	if user.IsBlocked {
		return "", nil, errors.New("your account has been blocked, please contact support")
	}

	// Verify password
	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		return "", nil, errors.New("invalid email or password")
	}

	// Generate JWT token
	token, err := s.jwtManager.GenerateToken(user.ID)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

func (s *AuthService) VerifyEmail(email, code string) error {
	// TODO: Implement email verification logic
	// Verify the code against stored code
	// Update user's email_verified status

	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// For now, just mark as verified
	user.EmailVerified = true
	err = s.userRepo.Update(user)
	if err != nil {
		return err
	}

	return nil
}

func (s *AuthService) ProcessReferralBonus(userID, referrerID int64, bonusAmount float64) error {
	// Add bonus to both user and referrer
	err := s.userRepo.UpdateBalance(userID, bonusAmount)
	if err != nil {
		return err
	}

	err = s.userRepo.UpdateBalance(referrerID, bonusAmount)
	if err != nil {
		// Try to rollback user bonus if referrer bonus fails
		_ = s.userRepo.UpdateBalance(userID, -bonusAmount)
		return err
	}

	// TODO: Create transaction records for both bonuses

	return nil
}
