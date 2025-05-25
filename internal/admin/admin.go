package admin

import (
	"database/sql"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/gin-gonic/gin"
)

type AdminApp struct {
	db              *sql.DB
	router          *gin.Engine
	userRepo        *repository.UserRepository
	transactionRepo *repository.TransactionRepository
	withdrawalRepo  *repository.WithdrawalRepository
	kycRepo         *repository.KYCRepository
	planRepo        *repository.PlanRepository
	config          *config.Config
}

func NewAdminApp(
	db *sql.DB,
	userRepo *repository.UserRepository,
	transactionRepo *repository.TransactionRepository,
	withdrawalRepo *repository.WithdrawalRepository,
	kycRepo *repository.KYCRepository,
	planRepo *repository.PlanRepository,
	config *config.Config,
) (*AdminApp, error) {
	app := &AdminApp{
		db:              db,
		userRepo:        userRepo,
		transactionRepo: transactionRepo,
		withdrawalRepo:  withdrawalRepo,
		kycRepo:         kycRepo,
		planRepo:        planRepo,
		config:          config,
	}

	app.setupRouter()
	return app, nil
}

func (a *AdminApp) setupRouter() {
	r := gin.Default()

	// Register template functions BEFORE loading templates
	r.SetFuncMap(template.FuncMap{
		"add": func(a, b int) int {
			return a + b
		},
		"subtract": func(a, b int) int {
			return a - b
		},
		"seq": func(start, end int) []int {
			var result []int
			for i := start; i <= end; i++ {
				result = append(result, i)
			}
			return result
		},
	})

	// Load templates after setting function map
	r.LoadHTMLGlob("views/admin/*.html")

	// Serve static files
	r.Static("/admin/assets", "./public/admin")

	// Auth middleware
	authRequired := func(c *gin.Context) {
		// For simplicity, we'll use a basic auth check here
		// In production, use a proper auth system
		user, pass, ok := c.Request.BasicAuth()
		if !ok || user != "admin" || pass != "admin123" {
			c.Header("WWW-Authenticate", "Basic realm=Admin Panel")
			c.AbortWithStatus(401)
			return
		}
		c.Next()
	}

	// Public routes
	r.GET("/admin/login", a.loginHandler)
	r.POST("/admin/login", a.loginPostHandler)

	// Protected admin routes
	admin := r.Group("/admin")
	admin.Use(authRequired)
	{
		admin.GET("/", a.dashboardHandler)
		admin.GET("/users", a.usersHandler)
		admin.GET("/transactions", a.transactionsHandler)
		admin.GET("/withdrawals", a.withdrawalsHandler)
		admin.GET("/kyc", a.kycHandler)
		admin.GET("/plans", a.plansHandler)

		// Actions
		admin.POST("/withdrawals/:id/approve", a.approveWithdrawalHandler)
		admin.POST("/withdrawals/:id/reject", a.rejectWithdrawalHandler)
		admin.POST("/kyc/:id/approve", a.approveKYCHandler)
		admin.POST("/kyc/:id/reject", a.rejectKYCHandler)

		// Plans
		admin.POST("/plans", a.createPlanHandler)
		admin.POST("/plans/:id", a.updatePlanHandler)
		admin.POST("/plans/:id/delete", a.deletePlanHandler)
		admin.POST("/plans/:id/default", a.setDefaultPlanHandler)

		// System
		admin.GET("/system/calculate-profit", a.calculateProfitHandler)
		admin.POST("/system/calculate-profit", a.calculateProfitPostHandler)
	}

	a.router = r
}

func (a *AdminApp) Run(port string) error {
	return a.router.Run(":" + port)
}

// Create a simple plan handler for form submission
func (a *AdminApp) createPlanHandler(c *gin.Context) {
	name := c.PostForm("name")
	price, _ := strconv.ParseFloat(c.PostForm("price"), 64)
	dailyDepositLimit, _ := strconv.ParseFloat(c.PostForm("daily_deposit_limit"), 64)
	dailyWithdrawalLimit, _ := strconv.ParseFloat(c.PostForm("daily_withdrawal_limit"), 64)
	dailyProfitLimit, _ := strconv.ParseFloat(c.PostForm("daily_profit_limit"), 64)
	isDefault := c.PostForm("is_default") == "on"

	plan, err := a.planRepo.Create(&model.Plan{
		Name:                 name,
		Price:                price,
		DailyDepositLimit:    dailyDepositLimit,
		DailyWithdrawalLimit: dailyWithdrawalLimit,
		DailyProfitLimit:     dailyProfitLimit,
		IsDefault:            isDefault,
	})

	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to create plan: " + err.Error(),
		})
		return
	}

	if isDefault {
		// If this plan is set as default, unset all other plans
		err = a.planRepo.SetDefault(plan.ID)
		if err != nil {
			log.Printf("Error setting default plan: %v", err)
		}
	}

	c.Redirect(http.StatusFound, "/admin/plans")
}

func (a *AdminApp) updatePlanHandler(c *gin.Context) {
	id := c.Param("id")
	planID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.HTML(http.StatusBadRequest, "error.html", gin.H{
			"title": "Error",
			"error": "Invalid plan ID",
		})
		return
	}

	name := c.PostForm("name")
	price, _ := strconv.ParseFloat(c.PostForm("price"), 64)
	dailyDepositLimit, _ := strconv.ParseFloat(c.PostForm("daily_deposit_limit"), 64)
	dailyWithdrawalLimit, _ := strconv.ParseFloat(c.PostForm("daily_withdrawal_limit"), 64)
	dailyProfitLimit, _ := strconv.ParseFloat(c.PostForm("daily_profit_limit"), 64)
	isDefault := c.PostForm("is_default") == "on"

	plan, err := a.planRepo.FindByID(planID)
	if err != nil || plan == nil {
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title": "Error",
			"error": "Plan not found",
		})
		return
	}

	plan.Name = name
	plan.Price = price
	plan.DailyDepositLimit = dailyDepositLimit
	plan.DailyWithdrawalLimit = dailyWithdrawalLimit
	plan.DailyProfitLimit = dailyProfitLimit
	plan.IsDefault = isDefault

	err = a.planRepo.Update(plan)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to update plan: " + err.Error(),
		})
		return
	}

	if isDefault {
		// If this plan is set as default, unset all other plans
		err = a.planRepo.SetDefault(plan.ID)
		if err != nil {
			log.Printf("Error setting default plan: %v", err)
		}
	}

	c.Redirect(http.StatusFound, "/admin/plans")
}

func (a *AdminApp) deletePlanHandler(c *gin.Context) {
	id := c.Param("id")
	planID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.HTML(http.StatusBadRequest, "error.html", gin.H{
			"title": "Error",
			"error": "Invalid plan ID",
		})
		return
	}

	// Check if plan is default
	plan, err := a.planRepo.FindByID(planID)
	if err != nil || plan == nil {
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title": "Error",
			"error": "Plan not found",
		})
		return
	}

	if plan.IsDefault {
		c.HTML(http.StatusBadRequest, "error.html", gin.H{
			"title": "Error",
			"error": "Cannot delete default plan",
		})
		return
	}

	err = a.planRepo.Delete(planID)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to delete plan: " + err.Error(),
		})
		return
	}

	c.Redirect(http.StatusFound, "/admin/plans")
}

func (a *AdminApp) setDefaultPlanHandler(c *gin.Context) {
	id := c.Param("id")
	planID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.HTML(http.StatusBadRequest, "error.html", gin.H{
			"title": "Error",
			"error": "Invalid plan ID",
		})
		return
	}

	// Check if plan exists
	plan, err := a.planRepo.FindByID(planID)
	if err != nil || plan == nil {
		c.HTML(http.StatusNotFound, "error.html", gin.H{
			"title": "Error",
			"error": "Plan not found",
		})
		return
	}

	// Set as default
	err = a.planRepo.SetDefault(planID)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to set default plan: " + err.Error(),
		})
		return
	}

	c.Redirect(http.StatusFound, "/admin/plans")
}

func (a *AdminApp) calculateProfitHandler(c *gin.Context) {
	c.HTML(http.StatusOK, "calculate_profit.html", gin.H{
		"title": "Calculate Daily Profit",
	})
}

func (a *AdminApp) calculateProfitPostHandler(c *gin.Context) {
	// Start time for performance measurement
	startTime := time.Now()

	// Get all users
	users, err := a.userRepo.FindAll(0, 0) // Get all users
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to retrieve users: " + err.Error(),
		})
		return
	}

	// Variables for statistics
	totalUsers := len(users)
	processedUsers := 0
	totalProfit := 0.0

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
		}

		_, err := a.transactionRepo.Create(transaction)
		if err != nil {
			log.Printf("Error creating transaction for user %d: %v", user.ID, err)
			continue
		}

		// Update user balance
		err = a.userRepo.UpdateBalance(user.ID, bonusAmount)
		if err != nil {
			log.Printf("Error updating balance for user %d: %v", user.ID, err)
			continue
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
			}

			_, err := a.transactionRepo.Create(referralTransaction)
			if err != nil {
				log.Printf("Error creating referral transaction: %v", err)
				continue
			}

			// Update referrer's balance
			err = a.userRepo.UpdateBalance(*user.ReferredBy, referralProfitAmount)
			if err != nil {
				log.Printf("Error updating referrer balance: %v", err)
				continue
			}

			// Update statistics
			totalProfit += referralProfitAmount
		}

		// Update statistics
		processedUsers++
		totalProfit += bonusAmount
	}

	// Calculate execution time
	duration := time.Since(startTime)

	// Log the operation
	log.Printf("Profit calculation completed in %v. Processed %d/%d users. Total profit: %.2f BDT",
		duration, processedUsers, totalUsers, totalProfit)

	// Render the result page
	c.HTML(http.StatusOK, "profit_result.html", gin.H{
		"title": "Profit Calculation Result",
		"stats": gin.H{
			"totalUsers":     totalUsers,
			"processedUsers": processedUsers,
			"totalProfit":    totalProfit,
			"duration":       duration.String(),
		},
	})
}

// Handler implementations
func (a *AdminApp) loginHandler(c *gin.Context) {
	c.HTML(http.StatusOK, "login.html", gin.H{
		"title": "Admin Login",
	})
}

func (a *AdminApp) loginPostHandler(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")

	// Simple credential check - in production, use a more secure approach
	if username == "admin" && password == "admin123" {
		// Set auth cookie or session
		c.Redirect(http.StatusFound, "/admin")
	} else {
		c.HTML(http.StatusOK, "login.html", gin.H{
			"title": "Admin Login",
			"error": "Invalid credentials",
		})
	}
}

func (a *AdminApp) dashboardHandler(c *gin.Context) {
	// Get user count
	userCount, err := a.userRepo.CountAll()
	if err != nil {
		userCount = 0 // Fallback
	}

	// Get pending KYC count
	pendingKYCCount, err := a.kycRepo.CountByStatus(model.KYCStatusPending)
	if err != nil {
		pendingKYCCount = 0 // Fallback
	}

	// Get pending withdrawals count
	pendingWithdrawalsCount, err := a.withdrawalRepo.CountByStatus(model.WithdrawalStatusPending)
	if err != nil {
		pendingWithdrawalsCount = 0 // Fallback
	}

	// Calculate total profit - this is a simplified implementation
	totalProfit := 0.0

	c.HTML(http.StatusOK, "dashboard.html", gin.H{
		"title": "Admin Dashboard",
		"stats": gin.H{
			"userCount":               userCount,
			"pendingKYCCount":         pendingKYCCount,
			"pendingWithdrawalsCount": pendingWithdrawalsCount,
			"totalProfit":             totalProfit,
		},
	})
}

func (a *AdminApp) usersHandler(c *gin.Context) {
	// Get pagination parameters
	page := getPage(c)
	limit := 10
	offset := (page - 1) * limit

	// Get users from database
	users, err := a.userRepo.FindAll(limit, offset)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to fetch users: " + err.Error(),
		})
		return
	}

	// Count total users for pagination
	totalUsers, err := a.userRepo.CountAll()
	if err != nil {
		totalUsers = 0 // Fallback
	}

	// Calculate pagination info
	totalPages := (totalUsers + limit - 1) / limit

	c.HTML(http.StatusOK, "users.html", gin.H{
		"title": "Users Management",
		"users": users,
		"pagination": gin.H{
			"current": page,
			"total":   totalPages,
		},
	})
}

// Transactions page handler
func (a *AdminApp) transactionsHandler(c *gin.Context) {
	// Get pagination parameters
	page := getPage(c)
	limit := 10
	//offset := (page - 1) * limit

	// Get transactions from database - since we don't have a FindAll method, we'll need to simulate this
	// In a real implementation, you'd have a repository method to get all transactions with pagination
	var transactions []*model.Transaction
	var totalTransactions int

	// For demonstration, we'll get transactions for all users up to a limit
	users, err := a.userRepo.FindAll(100, 0) // Get up to 100 users
	if err == nil {
		for _, user := range users {
			userTransactions, err := a.transactionRepo.FindByUserID(user.ID, limit, 0)
			if err == nil {
				transactions = append(transactions, userTransactions...)
				if len(transactions) >= limit {
					transactions = transactions[:limit]
					break
				}
			}
		}
	}

	// For simplicity, we'll estimate total count
	totalTransactions = len(transactions) * 10 // This is just a placeholder
	totalPages := (totalTransactions + limit - 1) / limit

	c.HTML(http.StatusOK, "transactions.html", gin.H{
		"title":        "Transactions",
		"transactions": transactions,
		"pagination": gin.H{
			"current": page,
			"total":   totalPages,
		},
	})
}

// Withdrawals page handler
func (a *AdminApp) withdrawalsHandler(c *gin.Context) {
	// Get pagination parameters
	page := getPage(c)
	limit := 10
	offset := (page - 1) * limit

	// Get status filter
	status := c.DefaultQuery("status", "")

	var withdrawals []*model.Withdrawal
	var err error

	// Get withdrawals based on status filter
	if status != "" {
		withdrawals, err = a.withdrawalRepo.FindByStatus(model.WithdrawalStatus(status), limit, offset)
	} else {
		withdrawals, err = a.withdrawalRepo.FindAll(limit, offset)
	}

	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to fetch withdrawals: " + err.Error(),
		})
		return
	}

	// Count pending withdrawals for display
	pendingCount, _ := a.withdrawalRepo.CountByStatus(model.WithdrawalStatusPending)

	// For pagination, get a rough estimate of total
	totalWithdrawals := pendingCount * 3 // Just an estimate for this example
	totalPages := (totalWithdrawals + limit - 1) / limit

	c.HTML(http.StatusOK, "withdrawals.html", gin.H{
		"title":        "Withdrawals",
		"withdrawals":  withdrawals,
		"pendingCount": pendingCount,
		"statusFilter": status,
		"pagination": gin.H{
			"current": page,
			"total":   totalPages,
		},
	})
}

// KYC documents page handler
func (a *AdminApp) kycHandler(c *gin.Context) {
	// Get pagination parameters
	page := getPage(c)
	limit := 10
	offset := (page - 1) * limit

	// Get status filter
	status := c.DefaultQuery("status", "")

	var kycs []*model.KYCDocument
	var err error

	// Get KYC documents based on status filter
	if status != "" {
		kycs, err = a.kycRepo.FindByStatus(model.KYCStatus(status), limit, offset)
	} else {
		kycs, err = a.kycRepo.FindAll(limit, offset)
	}

	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to fetch KYC documents: " + err.Error(),
		})
		return
	}

	// Count pending KYC documents for display
	pendingCount, _ := a.kycRepo.CountByStatus(model.KYCStatusPending)

	// For pagination, get a rough estimate of total
	totalKYCs := pendingCount * 3 // Just an estimate for this example
	totalPages := (totalKYCs + limit - 1) / limit

	c.HTML(http.StatusOK, "kyc.html", gin.H{
		"title":        "KYC Documents",
		"kycs":         kycs,
		"pendingCount": pendingCount,
		"statusFilter": status,
		"pagination": gin.H{
			"current": page,
			"total":   totalPages,
		},
	})
}

// Plans management page handler
func (a *AdminApp) plansHandler(c *gin.Context) {
	// Get all plans
	plans, err := a.planRepo.FindAll()
	if err != nil {
		c.HTML(http.StatusInternalServerError, "error.html", gin.H{
			"title": "Error",
			"error": "Failed to fetch plans: " + err.Error(),
		})
		return
	}

	c.HTML(http.StatusOK, "plans.html", gin.H{
		"title": "Plans Management",
		"plans": plans,
	})
}

// Approve withdrawal handler
func (a *AdminApp) approveWithdrawalHandler(c *gin.Context) {
	// Get withdrawal ID from URL parameter
	id := c.Param("id")
	withdrawalID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid withdrawal ID"})
		return
	}

	// Get admin note from form
	adminNote := c.PostForm("admin_note")

	// Get withdrawal to get user ID and amount for notification
	withdrawal, err := a.withdrawalRepo.FindByID(withdrawalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get withdrawal"})
		return
	}
	if withdrawal == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Withdrawal not found"})
		return
	}

	// Update withdrawal status
	withdrawal.Status = model.WithdrawalStatusApproved
	withdrawal.AdminNote = adminNote
	err = a.withdrawalRepo.Update(withdrawal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve withdrawal"})
		return
	}

	// Update transaction status
	err = a.transactionRepo.UpdateStatus(withdrawal.TransactionID, model.TransactionStatusCompleted)
	if err != nil {
		// Log error but continue
		log.Printf("Error updating transaction status: %v", err)
	}

	// Redirect back to withdrawals page
	c.Redirect(http.StatusFound, "/admin/withdrawals")
}

// Reject withdrawal handler
func (a *AdminApp) rejectWithdrawalHandler(c *gin.Context) {
	// Get withdrawal ID from URL parameter
	id := c.Param("id")
	withdrawalID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid withdrawal ID"})
		return
	}

	// Get reason from form
	reason := c.PostForm("reason")
	if reason == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required"})
		return
	}

	// Get withdrawal to get user ID and amount
	withdrawal, err := a.withdrawalRepo.FindByID(withdrawalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get withdrawal"})
		return
	}
	if withdrawal == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Withdrawal not found"})
		return
	}

	// Update withdrawal status
	withdrawal.Status = model.WithdrawalStatusRejected
	withdrawal.AdminNote = reason
	err = a.withdrawalRepo.Update(withdrawal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject withdrawal"})
		return
	}

	// Update transaction status
	err = a.transactionRepo.UpdateStatus(withdrawal.TransactionID, model.TransactionStatusRejected)
	if err != nil {
		// Log error but continue
		log.Printf("Error updating transaction status: %v", err)
	}

	// Refund the user's balance
	err = a.userRepo.UpdateBalance(withdrawal.UserID, withdrawal.Amount)
	if err != nil {
		// Log error but continue
		log.Printf("Error refunding user balance: %v", err)
	}

	// Redirect back to withdrawals page
	c.Redirect(http.StatusFound, "/admin/withdrawals")
}

// Approve KYC handler
func (a *AdminApp) approveKYCHandler(c *gin.Context) {
	// Get KYC ID from URL parameter
	id := c.Param("id")
	kycID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid KYC ID"})
		return
	}

	// Get KYC document
	kyc, err := a.kycRepo.FindByID(kycID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC document"})
		return
	}
	if kyc == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "KYC document not found"})
		return
	}

	// Update KYC status
	kyc.Status = model.KYCStatusApproved
	err = a.kycRepo.Update(kyc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve KYC"})
		return
	}

	// Update user's KYC verification status
	user, err := a.userRepo.FindByID(kyc.UserID)
	if err == nil && user != nil {
		user.IsKYCVerified = true
		err = a.userRepo.Update(user)
		if err != nil {
			// Log error but continue
			log.Printf("Error updating user KYC status: %v", err)
		}
	}

	// Redirect back to KYC page
	c.Redirect(http.StatusFound, "/admin/kyc")
}

// Reject KYC handler
func (a *AdminApp) rejectKYCHandler(c *gin.Context) {
	// Get KYC ID from URL parameter
	id := c.Param("id")
	kycID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid KYC ID"})
		return
	}

	// Get reason from form
	reason := c.PostForm("reason")
	if reason == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required"})
		return
	}

	// Get KYC document
	kyc, err := a.kycRepo.FindByID(kycID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC document"})
		return
	}
	if kyc == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "KYC document not found"})
		return
	}

	// Update KYC status
	kyc.Status = model.KYCStatusRejected
	kyc.AdminNote = reason
	err = a.kycRepo.Update(kyc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject KYC"})
		return
	}

	// Redirect back to KYC page
	c.Redirect(http.StatusFound, "/admin/kyc")
}

// Helper function to get page number from query params
func getPage(c *gin.Context) int {
	pageStr := c.DefaultQuery("page", "1")
	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	return page
}
