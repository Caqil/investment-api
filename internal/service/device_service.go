package service

import (
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/utils"
)

type DeviceService struct {
	deviceRepo *repository.DeviceRepository
}

func NewDeviceService(deviceRepo *repository.DeviceRepository) *DeviceService {
	return &DeviceService{
		deviceRepo: deviceRepo,
	}
}

func (s *DeviceService) IsDeviceRegistered(deviceID string) (bool, error) {
	device, err := s.deviceRepo.FindByDeviceID(deviceID)
	if err != nil {
		return false, err
	}
	return device != nil, nil
}

func (s *DeviceService) IsDeviceRegisteredToUser(deviceID string, userID int64) (bool, error) {
	device, err := s.deviceRepo.FindByDeviceID(deviceID)
	if err != nil {
		return false, err
	}
	if device == nil {
		return false, nil
	}
	return device.UserID == userID, nil
}

func (s *DeviceService) RegisterDevice(userID int64, deviceID string) error {
	device := &model.Device{
		UserID:   userID,
		DeviceID: deviceID,
		IsActive: true,
	}
	_, err := s.deviceRepo.Create(device)
	return err
}

func (s *DeviceService) UpdateDeviceLastLogin(deviceID string) error {
	return s.deviceRepo.UpdateLastLogin(deviceID, time.Now())
}

func (s *DeviceService) IsVirtualDevice(deviceID string) (bool, error) {
	// Check if device is virtual
	return utils.IsVirtualDevice(deviceID), nil
}

func (s *DeviceService) GetUserDevices(userID int64) ([]*model.Device, error) {
	return s.deviceRepo.FindByUserID(userID)
}

func (s *DeviceService) DeactivateDevice(deviceID string) error {
	return s.deviceRepo.UpdateActive(deviceID, false)
}

func (s *DeviceService) ActivateDevice(deviceID string) error {
	return s.deviceRepo.UpdateActive(deviceID, true)
}
