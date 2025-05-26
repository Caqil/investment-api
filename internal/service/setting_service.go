package service

import (
	"errors"
	"strconv"
	"sync"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
)

type SettingService struct {
	settingRepo   *repository.SettingRepository
	settingsCache map[string]string
	cacheMutex    sync.RWMutex
}

func NewSettingService(settingRepo *repository.SettingRepository) *SettingService {
	service := &SettingService{
		settingRepo:   settingRepo,
		settingsCache: make(map[string]string),
		cacheMutex:    sync.RWMutex{},
	}

	// Load all settings into cache
	service.loadSettingsCache()

	return service
}

// loadSettingsCache loads all settings into cache
func (s *SettingService) loadSettingsCache() error {
	settings, err := s.settingRepo.FindAll()
	if err != nil {
		return err
	}

	s.cacheMutex.Lock()
	defer s.cacheMutex.Unlock()

	for _, setting := range settings {
		s.settingsCache[setting.Key] = setting.Value
	}

	return nil
}

// GetAllSettings gets all settings
func (s *SettingService) GetAllSettings() ([]*model.Setting, error) {
	return s.settingRepo.FindAll()
}

// GetSettingsByGroup gets all settings in a specific group
func (s *SettingService) GetSettingsByGroup(group string) ([]*model.Setting, error) {
	return s.settingRepo.FindByGroup(group)
}

// GetSettingByID gets a setting by ID
func (s *SettingService) GetSettingByID(id int64) (*model.Setting, error) {
	setting, err := s.settingRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if setting == nil {
		return nil, errors.New("setting not found")
	}
	return setting, nil
}

// GetSettingByKey gets a setting by key
func (s *SettingService) GetSettingByKey(key string) (*model.Setting, error) {
	setting, err := s.settingRepo.FindByKey(key)
	if err != nil {
		return nil, err
	}
	if setting == nil {
		return nil, errors.New("setting not found")
	}
	return setting, nil
}

// GetSettingValue gets a setting value by key
func (s *SettingService) GetSettingValue(key string) (string, error) {
	// Try to get from cache first
	s.cacheMutex.RLock()
	value, exists := s.settingsCache[key]
	s.cacheMutex.RUnlock()

	if exists {
		return value, nil
	}

	// If not in cache, get from database
	setting, err := s.settingRepo.FindByKey(key)
	if err != nil {
		return "", err
	}
	if setting == nil {
		return "", errors.New("setting not found")
	}

	// Add to cache
	s.cacheMutex.Lock()
	s.settingsCache[key] = setting.Value
	s.cacheMutex.Unlock()

	return setting.Value, nil
}

// GetSettingValueFloat gets a setting value as float64
func (s *SettingService) GetSettingValueFloat(key string) (float64, error) {
	value, err := s.GetSettingValue(key)
	if err != nil {
		return 0, err
	}

	floatValue, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0, errors.New("setting value is not a valid number")
	}

	return floatValue, nil
}

// GetSettingValueInt gets a setting value as int
func (s *SettingService) GetSettingValueInt(key string) (int, error) {
	value, err := s.GetSettingValue(key)
	if err != nil {
		return 0, err
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		return 0, errors.New("setting value is not a valid integer")
	}

	return intValue, nil
}

// GetSettingValueBool gets a setting value as bool
func (s *SettingService) GetSettingValueBool(key string) (bool, error) {
	value, err := s.GetSettingValue(key)
	if err != nil {
		return false, err
	}

	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		return false, errors.New("setting value is not a valid boolean")
	}

	return boolValue, nil
}

// CreateSetting creates a new setting
func (s *SettingService) CreateSetting(
	key, value string,
	settingType model.SettingType,
	displayName, description, group string,
) (*model.Setting, error) {
	// Check if setting already exists
	existingSetting, err := s.settingRepo.FindByKey(key)
	if err != nil {
		return nil, err
	}
	if existingSetting != nil {
		return nil, errors.New("setting with this key already exists")
	}

	// Create setting
	setting := &model.Setting{
		Key:         key,
		Value:       value,
		Type:        settingType,
		DisplayName: displayName,
		Description: description,
		Group:       group,
	}

	createdSetting, err := s.settingRepo.Create(setting)
	if err != nil {
		return nil, err
	}

	// Update cache
	s.cacheMutex.Lock()
	s.settingsCache[key] = value
	s.cacheMutex.Unlock()

	return createdSetting, nil
}

// UpdateSetting updates a setting
func (s *SettingService) UpdateSetting(
	id int64,
	value string,
	displayName, description, group string,
) (*model.Setting, error) {
	// Get setting
	setting, err := s.settingRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if setting == nil {
		return nil, errors.New("setting not found")
	}

	// Update setting fields
	setting.Value = value
	setting.DisplayName = displayName
	setting.Description = description
	setting.Group = group

	// Save setting
	err = s.settingRepo.Update(setting)
	if err != nil {
		return nil, err
	}

	// Update cache
	s.cacheMutex.Lock()
	s.settingsCache[setting.Key] = value
	s.cacheMutex.Unlock()

	return setting, nil
}

// UpdateSettingValue updates a setting value by key
func (s *SettingService) UpdateSettingValue(key, value string) error {
	// Check if setting exists
	setting, err := s.settingRepo.FindByKey(key)
	if err != nil {
		return err
	}
	if setting == nil {
		return errors.New("setting not found")
	}

	// Update setting value
	err = s.settingRepo.UpdateByKey(key, value)
	if err != nil {
		return err
	}

	// Update cache
	s.cacheMutex.Lock()
	s.settingsCache[key] = value
	s.cacheMutex.Unlock()

	return nil
}

// DeleteSetting deletes a setting
func (s *SettingService) DeleteSetting(id int64) error {
	// Get setting to get the key
	setting, err := s.settingRepo.FindByID(id)
	if err != nil {
		return err
	}
	if setting == nil {
		return errors.New("setting not found")
	}

	// Delete setting
	err = s.settingRepo.Delete(id)
	if err != nil {
		return err
	}

	// Remove from cache
	s.cacheMutex.Lock()
	delete(s.settingsCache, setting.Key)
	s.cacheMutex.Unlock()

	return nil
}

// GetAppSettings gets application settings as a struct
func (s *SettingService) GetAppSettings() (*AppSettings, error) {
	settings := &AppSettings{}

	// Daily bonus percentage
	dailyBonusPercentage, err := s.GetSettingValueFloat("daily_bonus_percentage")
	if err == nil {
		settings.DailyBonusPercentage = dailyBonusPercentage
	} else {
		settings.DailyBonusPercentage = 5.0 // Default value
	}

	// Referral bonus amount
	referralBonusAmount, err := s.GetSettingValueFloat("referral_bonus_amount")
	if err == nil {
		settings.ReferralBonusAmount = referralBonusAmount
	} else {
		settings.ReferralBonusAmount = 100.0 // Default value
	}

	// Referral profit percentage
	referralProfitPercentage, err := s.GetSettingValueFloat("referral_profit_percentage")
	if err == nil {
		settings.ReferralProfitPercentage = referralProfitPercentage
	} else {
		settings.ReferralProfitPercentage = 10.0 // Default value
	}

	// Minimum withdrawal amount
	minimumWithdrawalAmount, err := s.GetSettingValueFloat("minimum_withdrawal_amount")
	if err == nil {
		settings.MinimumWithdrawalAmount = minimumWithdrawalAmount
	} else {
		settings.MinimumWithdrawalAmount = 100.0 // Default value
	}

	// USD to BDT conversion rate
	usdToBdtRate, err := s.GetSettingValueFloat("usd_to_bdt_rate")
	if err == nil {
		settings.USDToBDTConversionRate = usdToBdtRate
	} else {
		settings.USDToBDTConversionRate = 120.0 // Default value
	}

	// Site name
	siteName, err := s.GetSettingValue("site_name")
	if err == nil {
		settings.SiteName = siteName
	} else {
		settings.SiteName = "Investment App" // Default value
	}

	// Site logo URL
	siteLogoURL, err := s.GetSettingValue("site_logo_url")
	if err == nil {
		settings.SiteLogoURL = siteLogoURL
	}

	// Maintenance mode
	maintenanceMode, err := s.GetSettingValueBool("maintenance_mode")
	if err == nil {
		settings.MaintenanceMode = maintenanceMode
	} else {
		settings.MaintenanceMode = false // Default value
	}

	// Enable withdrawals
	enableWithdrawals, err := s.GetSettingValueBool("enable_withdrawals")
	if err == nil {
		settings.EnableWithdrawals = enableWithdrawals
	} else {
		settings.EnableWithdrawals = true // Default value
	}

	// Enable deposits
	enableDeposits, err := s.GetSettingValueBool("enable_deposits")
	if err == nil {
		settings.EnableDeposits = enableDeposits
	} else {
		settings.EnableDeposits = true // Default value
	}

	return settings, nil
}

// AppSettings represents application settings
type AppSettings struct {
	DailyBonusPercentage     float64 `json:"daily_bonus_percentage"`
	ReferralBonusAmount      float64 `json:"referral_bonus_amount"`
	ReferralProfitPercentage float64 `json:"referral_profit_percentage"`
	MinimumWithdrawalAmount  float64 `json:"minimum_withdrawal_amount"`
	USDToBDTConversionRate   float64 `json:"usd_to_bdt_conversion_rate"`
	SiteName                 string  `json:"site_name"`
	SiteLogoURL              string  `json:"site_logo_url"`
	MaintenanceMode          bool    `json:"maintenance_mode"`
	EnableWithdrawals        bool    `json:"enable_withdrawals"`
	EnableDeposits           bool    `json:"enable_deposits"`
}
