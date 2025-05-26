package cron

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/Caqil/investment-api/internal/service"
	"github.com/robfig/cron/v3"
)

type CronManager struct {
	cron           *cron.Cron
	bonusService   *service.BonusService
	settingService *service.SettingService // Add this field
}

func NewCronManager(
	bonusService *service.BonusService,
	settingService *service.SettingService, // Add this parameter
) *CronManager {
	return &CronManager{
		cron:           cron.New(),
		bonusService:   bonusService,
		settingService: settingService, // Assign the field
	}
}

// Start starts the cron scheduler
func (m *CronManager) Start() {
	// Get profit calculation time from settings if available
	profitCalcTime := "1 0" // Default to 00:01 (1 minute past midnight)

	if m.settingService != nil {
		timeStr, err := m.settingService.GetSettingValue("profit_calculation_time")
		if err == nil && timeStr != "" {
			// Parse the time in format HH:MM
			parts := strings.Split(timeStr, ":")
			if len(parts) == 2 {
				hour := parts[0]
				minute := parts[1]
				profitCalcTime = fmt.Sprintf("%s %s", minute, hour) // Format for cron is "minute hour"
				log.Printf("Using profit calculation time from settings: %s:%s", hour, minute)
			}
		}
	}

	// Set up the cron schedule for daily bonus calculation
	schedule := fmt.Sprintf("%s * * *", profitCalcTime) // Run at the specified time every day
	m.cron.AddFunc(schedule, m.calculateDailyBonuses)

	// Add more scheduled tasks here

	m.cron.Start()
	log.Println("Cron scheduler started")
}

// Stop stops the cron scheduler
func (m *CronManager) Stop() {
	m.cron.Stop()
	log.Println("Cron scheduler stopped")
}

// calculateDailyBonuses calculates and adds daily bonuses for all users
func (m *CronManager) calculateDailyBonuses() {
	log.Println("Starting daily bonus calculation...")

	startTime := time.Now()
	err := m.bonusService.CalculateDailyBonusForAllUsers()
	if err != nil {
		log.Printf("Error calculating daily bonuses: %v", err)
		return
	}

	duration := time.Since(startTime)
	log.Printf("Daily bonus calculation completed in %v", duration)
}

// InitScheduledTasks initializes and starts the cron scheduler
func InitScheduledTasks(
	bonusService *service.BonusService,
	settingService *service.SettingService, // Add this parameter
) *CronManager {
	manager := NewCronManager(bonusService, settingService)
	manager.Start()
	return manager
}
