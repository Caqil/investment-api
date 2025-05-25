package cron

import (
	"log"
	"time"

	"github.com/Caqil/investment-api/internal/service"
	"github.com/robfig/cron/v3"
)

type CronManager struct {
	cron         *cron.Cron
	bonusService *service.BonusService
}

func NewCronManager(
	bonusService *service.BonusService,
) *CronManager {
	return &CronManager{
		cron:         cron.New(),
		bonusService: bonusService,
	}
}

// Start starts the cron scheduler
func (m *CronManager) Start() {
	// Calculate daily bonuses at 00:01 every day
	m.cron.AddFunc("1 0 * * *", m.calculateDailyBonuses)

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
) *CronManager {
	manager := NewCronManager(bonusService)
	manager.Start()
	return manager
}
