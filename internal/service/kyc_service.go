package service

import (
	"errors"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
)

type KYCService struct {
	kycRepo  *repository.KYCRepository
	userRepo *repository.UserRepository
}

func NewKYCService(
	kycRepo *repository.KYCRepository,
	userRepo *repository.UserRepository,
) *KYCService {
	return &KYCService{
		kycRepo:  kycRepo,
		userRepo: userRepo,
	}
}

// SubmitKYC submits a KYC document for verification
func (s *KYCService) SubmitKYC(
	userID int64,
	documentType model.DocumentType,
	documentFrontURL, documentBackURL, selfieURL string,
) (*model.KYCDocument, error) {
	// Check if user exists
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Check if user already has an approved KYC document
	if user.IsKYCVerified {
		return nil, errors.New("user is already KYC verified")
	}

	// Check if user already has a pending KYC document
	existingKYC, err := s.kycRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}
	if existingKYC != nil && existingKYC.Status == model.KYCStatusPending {
		return nil, errors.New("user already has a pending KYC document")
	}

	// Create KYC document
	kyc := &model.KYCDocument{
		UserID:           userID,
		DocumentType:     documentType,
		DocumentFrontURL: documentFrontURL,
		DocumentBackURL:  documentBackURL,
		SelfieURL:        selfieURL,
		Status:           model.KYCStatusPending,
	}

	return s.kycRepo.Create(kyc)
}

// GetKYCStatus gets the KYC status for a user
func (s *KYCService) GetKYCStatus(userID int64) (*model.KYCDocument, error) {
	// Check if user exists
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Get KYC document
	return s.kycRepo.FindByUserID(userID)
}

// GetKYCByID gets a KYC document by ID
func (s *KYCService) GetKYCByID(id int64) (*model.KYCDocument, error) {
	kyc, err := s.kycRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if kyc == nil {
		return nil, errors.New("KYC document not found")
	}
	return kyc, nil
}

// ApproveKYC approves a KYC document
func (s *KYCService) ApproveKYC(id int64) error {
	// Get KYC document
	kyc, err := s.kycRepo.FindByID(id)
	if err != nil {
		return err
	}
	if kyc == nil {
		return errors.New("KYC document not found")
	}

	// Check if KYC document is already approved or rejected
	if kyc.Status != model.KYCStatusPending {
		return errors.New("KYC document is not pending")
	}

	// Update KYC document status
	err = s.kycRepo.UpdateStatus(id, model.KYCStatusApproved, "")
	if err != nil {
		return err
	}

	// Update user's KYC verification status
	user, err := s.userRepo.FindByID(kyc.UserID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	user.IsKYCVerified = true
	return s.userRepo.Update(user)
}

// RejectKYC rejects a KYC document
func (s *KYCService) RejectKYC(id int64, reason string) error {
	// Get KYC document
	kyc, err := s.kycRepo.FindByID(id)
	if err != nil {
		return err
	}
	if kyc == nil {
		return errors.New("KYC document not found")
	}

	// Check if KYC document is already approved or rejected
	if kyc.Status != model.KYCStatusPending {
		return errors.New("KYC document is not pending")
	}

	// Update KYC document status
	return s.kycRepo.UpdateStatus(id, model.KYCStatusRejected, reason)
}

// GetPendingKYCDocuments gets all pending KYC documents
func (s *KYCService) GetPendingKYCDocuments(limit, offset int) ([]*model.KYCDocument, error) {
	return s.kycRepo.FindByStatus(model.KYCStatusPending, limit, offset)
}

// GetApprovedKYCDocuments gets all approved KYC documents
func (s *KYCService) GetApprovedKYCDocuments(limit, offset int) ([]*model.KYCDocument, error) {
	return s.kycRepo.FindByStatus(model.KYCStatusApproved, limit, offset)
}

// GetRejectedKYCDocuments gets all rejected KYC documents
func (s *KYCService) GetRejectedKYCDocuments(limit, offset int) ([]*model.KYCDocument, error) {
	return s.kycRepo.FindByStatus(model.KYCStatusRejected, limit, offset)
}

// GetAllKYCDocuments gets all KYC documents
func (s *KYCService) GetAllKYCDocuments(limit, offset int) ([]*model.KYCDocument, error) {
	return s.kycRepo.FindAll(limit, offset)
}

// CountPendingKYCDocuments gets the count of pending KYC documents
func (s *KYCService) CountPendingKYCDocuments() (int, error) {
	count, err := s.kycRepo.CountByStatus(model.KYCStatusPending)
	if err != nil {
		return 0, err
	}

	// Convert int64 to int
	return int(count), nil
}
