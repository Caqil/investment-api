package admin

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/jinzhu/gorm"
	"github.com/qor/admin"
)

// AdminController handles admin interface custom functionality
type AdminController struct {
	DB              *gorm.DB
	UserRepo        *repository.UserRepository
	TransactionRepo *repository.TransactionRepository
	WithdrawalRepo  *repository.WithdrawalRepository
	KYCRepo         *repository.KYCRepository
}

// NewAdminController creates a new admin controller
func NewAdminController(db *gorm.DB, userRepo *repository.UserRepository,
	transactionRepo *repository.TransactionRepository,
	withdrawalRepo *repository.WithdrawalRepository,
	kycRepo *repository.KYCRepository) *AdminController {

	return &AdminController{
		DB:              db,
		UserRepo:        userRepo,
		TransactionRepo: transactionRepo,
		WithdrawalRepo:  withdrawalRepo,
		KYCRepo:         kycRepo,
	}
}

// RegisterRoutes registers admin controller routes
func (c *AdminController) RegisterRoutes(adminInstance *admin.Admin) {
	// Register dashboard
	adminInstance.GetRouter().Get("/", c.Dashboard)

	// Register system actions
	adminInstance.GetRouter().Get("/system/backup", c.BackupDatabase)
	adminInstance.GetRouter().Get("/system/calculate-profit", c.CalculateProfit)
}

// Dashboard renders the admin dashboard
func (c *AdminController) Dashboard(context *admin.Context) {
	// Get user count
	userCount, _ := c.UserRepo.CountAll()

	// Get pending KYC count
	pendingKYCCount, _ := c.KYCRepo.CountByStatus(model.KYCStatusPending)

	// Get pending withdrawals count
	pendingWithdrawalsCount, _ := c.WithdrawalRepo.CountByStatus(model.WithdrawalStatusPending)

	// Calculate total profit - this is a simplified example
	var totalProfit float64 = 0
	rows, _ := c.DB.Table("transactions").
		Where("type = ? AND status = ?", model.TransactionTypeBonus, model.TransactionStatusCompleted).
		Select("SUM(amount) as total").
		Rows()

	if rows.Next() {
		rows.Scan(&totalProfit)
	}
	rows.Close()

	// Get recent users
	var recentUsers []model.User
	c.DB.Order("created_at desc").Limit(5).Find(&recentUsers)

	// Get recent transactions
	var recentTransactions []model.Transaction
	c.DB.Order("created_at desc").Limit(5).Find(&recentTransactions)

	// Render the dashboard template
	context.Execute("dashboard", map[string]interface{}{
		"UserCount":          userCount,
		"PendingKYC":         pendingKYCCount,
		"PendingWithdrawals": pendingWithdrawalsCount,
		"TotalProfit":        totalProfit,
		"RecentUsers":        recentUsers,
		"RecentTransactions": recentTransactions,
	})
}

// BackupDatabase handles database backup
func (c *AdminController) BackupDatabase(context *admin.Context) {
	// Create a timestamp for the backup file
	timestamp := time.Now().Format("2006-01-02-150405")
	backupFileName := fmt.Sprintf("backup-%s.sql", timestamp)
	backupFilePath := fmt.Sprintf("./backups/%s", backupFileName)

	// Create backups directory if it doesn't exist
	if err := os.MkdirAll("./backups", 0755); err != nil {
		context.AddError(fmt.Errorf("Failed to create backup directory: %v", err))
		http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
		return
	}

	// Get database connection details
	dbUser := os.Getenv("DB_USERNAME")
	dbPass := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")

	if dbUser == "" || dbHost == "" || dbName == "" {
		context.AddError(fmt.Errorf("Database configuration is incomplete"))
		http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
		return
	}

	// Create mysqldump command
	var cmd *exec.Cmd
	if dbPass != "" {
		cmd = exec.Command(
			"mysqldump",
			"-h", dbHost,
			"-P", dbPort,
			"-u", dbUser,
			"-p"+dbPass,
			dbName,
		)
	} else {
		cmd = exec.Command(
			"mysqldump",
			"-h", dbHost,
			"-P", dbPort,
			"-u", dbUser,
			dbName,
		)
	}

	// Open backup file for writing
	backupFile, err := os.Create(backupFilePath)
	if err != nil {
		context.AddError(fmt.Errorf("Failed to create backup file: %v", err))
		http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
		return
	}
	defer backupFile.Close()

	// Redirect command output to backup file
	cmd.Stdout = backupFile

	// Execute command
	if err := cmd.Run(); err != nil {
		context.AddError(fmt.Errorf("Failed to backup database: %v", err))
		http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
		return
	}

	// Get file stats to confirm backup was created
	fileInfo, err := os.Stat(backupFilePath)
	if err != nil {
		context.AddError(fmt.Errorf("Failed to verify backup file: %v", err))
		http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
		return
	}

	// Serve file for download
	http.ServeFile(context.Writer, context.Request, backupFilePath)

	// Log the backup
	log.Printf("Database backup created: %s (%.2f MB)", backupFilePath, float64(fileInfo.Size())/(1024*1024))

	// Redirect back to admin dashboard
	http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
}

// CalculateProfit manually triggers profit calculation
func (c *AdminController) CalculateProfit(context *admin.Context) {
	// Start time for performance measurement
	startTime := time.Now()

	// Get all users
	var users []model.User
	if err := c.DB.Where("is_blocked = ?", false).Find(&users).Error; err != nil {
		context.AddError(fmt.Errorf("Failed to retrieve users: %v", err))
		http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
		return
	}

	// Variables for statistics
	var totalUsers int = len(users)
	var processedUsers int = 0
	var totalProfit float64 = 0

	// Begin transaction for bulk operations
	tx := c.DB.Begin()

	// Process each user
	for _, user := range users {
		// Skip if user is blocked
		if user.IsBlocked {
			continue
		}

		// Calculate bonus amount (5% of total balance as per requirements)
		bonusAmount := user.Balance * 0.05
		if bonusAmount <= 0 {
			// No bonus if balance is zero or negative
			continue
		}

		// Create bonus transaction
		transaction := &model.Transaction{
			UserID:      user.ID,
			Amount:      bonusAmount,
			Type:        model.TransactionTypeBonus,
			Status:      model.TransactionStatusCompleted,
			Description: "5% daily bonus",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if err := tx.Create(transaction).Error; err != nil {
			tx.Rollback()
			context.AddError(fmt.Errorf("Failed to create transaction: %v", err))
			http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
			return
		}

		// Update user balance
		user.Balance += bonusAmount
		user.UpdatedAt = time.Now()
		if err := tx.Save(&user).Error; err != nil {
			tx.Rollback()
			context.AddError(fmt.Errorf("Failed to update user balance: %v", err))
			http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
			return
		}

		// Process referral profit bonus if user has a referrer
		if user.ReferredBy != nil {
			// Calculate referral profit (10% of profit as per requirements)
			referralProfitAmount := bonusAmount * 0.10

			// Create referral profit transaction
			referralTransaction := &model.Transaction{
				UserID:      *user.ReferredBy,
				Amount:      referralProfitAmount,
				Type:        model.TransactionTypeReferralProfit,
				Status:      model.TransactionStatusCompleted,
				Description: fmt.Sprintf("10%% referral profit bonus from user #%d", user.ID),
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			}

			if err := tx.Create(referralTransaction).Error; err != nil {
				tx.Rollback()
				context.AddError(fmt.Errorf("Failed to create referral transaction: %v", err))
				http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
				return
			}

			// Update referrer's balance
			var referrer model.User
			if err := tx.First(&referrer, *user.ReferredBy).Error; err != nil {
				tx.Rollback()
				context.AddError(fmt.Errorf("Failed to find referrer: %v", err))
				http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
				return
			}

			referrer.Balance += referralProfitAmount
			referrer.UpdatedAt = time.Now()
			if err := tx.Save(&referrer).Error; err != nil {
				tx.Rollback()
				context.AddError(fmt.Errorf("Failed to update referrer balance: %v", err))
				http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
				return
			}

			// Update statistics
			totalProfit += referralProfitAmount
		}

		// Update statistics
		processedUsers++
		totalProfit += bonusAmount
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		context.AddError(fmt.Errorf("failed to commit transaction: %v", err))
		http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
		return
	}

	// Calculate execution time
	duration := time.Since(startTime)

	// Log the operation
	log.Printf("Profit calculation completed in %v. Processed %d/%d users. Total profit: %.2f BDT",
		duration, processedUsers, totalUsers, totalProfit)

	// Redirect back to admin dashboard
	http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
}
