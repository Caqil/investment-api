package app

import (
	"database/sql"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/controller"
	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/Caqil/investment-api/pkg/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type App struct {
	config     *config.Config
	db         *sql.DB
	jwtManager *utils.JWTManager
}

func NewApp(config *config.Config, db *sql.DB) *App {
	return &App{
		config:     config,
		db:         db,
		jwtManager: utils.NewJWTManager(config.JWT.Secret, config.JWT.ExpiresIn),
	}
}

func (a *App) SetupRoutes() *gin.Engine {
	// Set Gin to release mode in production
	// gin.SetMode(gin.ReleaseMode)

	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "X-CSRF-Token", "X-Device-ID"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 hours
	}))

	// Initialize repositories
	userRepo := repository.NewUserRepository(a.db)
	transactionRepo := repository.NewTransactionRepository(a.db)
	paymentRepo := repository.NewPaymentRepository(a.db)
	planRepo := repository.NewPlanRepository(a.db)
	withdrawalRepo := repository.NewWithdrawalRepository(a.db)
	taskRepo := repository.NewTaskRepository(a.db)
	kycRepo := repository.NewKYCRepository(a.db)
	deviceRepo := repository.NewDeviceRepository(a.db)
	notificationRepo := repository.NewNotificationRepository(a.db)

	// Initialize services
	deviceService := service.NewDeviceService(deviceRepo)
	emailService := utils.NewEmailService(a.config.Email)
	authService := service.NewAuthService(userRepo, a.jwtManager, emailService)
	userService := service.NewUserService(userRepo, deviceRepo)
	planService := service.NewPlanService(planRepo)
	paymentService := service.NewPaymentService(paymentRepo, transactionRepo, userRepo, a.config.Payment)
	bonusService := service.NewBonusService(
		userRepo,
		transactionRepo,
		struct {
			DailyBonusPercentage     float64
			ReferralBonusAmount      float64
			ReferralProfitPercentage float64
		}{
			DailyBonusPercentage:     a.config.App.DailyBonusPercentage,
			ReferralBonusAmount:      a.config.App.ReferralBonusAmount,
			ReferralProfitPercentage: a.config.App.ReferralProfitPercentage,
		},
	)
	taskService := service.NewTaskService(taskRepo)
	withdrawalService := service.NewWithdrawalService(
		withdrawalRepo,
		transactionRepo,
		userRepo,
		taskService,
		struct {
			MinimumWithdrawalAmount float64
		}{
			MinimumWithdrawalAmount: a.config.App.MinimumWithdrawalAmount,
		},
	)
	kycService := service.NewKYCService(kycRepo, userRepo)
	notificationService := service.NewNotificationService(notificationRepo, emailService)

	// Initialize controllers
	authController := controller.NewAuthController(authService, userService, deviceService, planService)
	userController := controller.NewUserController(userService, bonusService)
	paymentController := controller.NewPaymentController(paymentService)
	planController := controller.NewPlanController(planService, userService)
	withdrawalController := controller.NewWithdrawalController(withdrawalService, taskService, notificationService)
	taskController := controller.NewTaskController(taskService)
	kycController := controller.NewKYCController(kycService, notificationService)
	referralController := controller.NewReferralController(userService, bonusService)
	adminController := controller.NewAdminController(
		userService,
		withdrawalService,
		kycService,
		planService,
		taskService,
		notificationService,
	)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(a.jwtManager, userRepo)
	deviceCheckMiddleware := middleware.NewDeviceCheckMiddleware(deviceService)
	adminMiddleware := middleware.NewAdminMiddleware(userRepo)

	// Public routes
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authController.Register)
			auth.POST("/login", authController.Login)
			auth.POST("/verify-email", authController.VerifyEmail)
			auth.POST("/forgot-password", authController.ForgotPassword)
			auth.POST("/reset-password", authController.ResetPassword)
		}

		// Callback routes for payment gateways
		api.GET("/payments/callback/:gateway", paymentController.HandleCallback)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(authMiddleware.Authenticate())
	protected.Use(deviceCheckMiddleware.CheckDevice())
	{
		// User routes
		user := protected.Group("/user")
		{
			user.GET("/profile", userController.GetProfile)
			user.PUT("/profile", userController.UpdateProfile)
			user.PUT("/change-password", userController.ChangePassword)
			user.POST("/enable-biometric", userController.EnableBiometric)
			user.GET("/transactions", userController.GetTransactions)
			user.GET("/notifications", userController.GetNotifications)
			user.PUT("/notifications/:id/read", userController.MarkNotificationAsRead)
		}

		// Payment routes
		payments := protected.Group("/payments")
		{
			payments.POST("/deposit/coingate", paymentController.DepositViaCoingate)
			payments.POST("/deposit/uddoktapay", paymentController.DepositViaUddoktaPay)
			payments.POST("/deposit/manual", paymentController.DepositViaManual)
		}

		// Plan routes
		plans := protected.Group("/plans")
		{
			plans.GET("", planController.GetAllPlans)
			plans.POST("/:id/purchase", planController.PurchasePlan)
		}

		// Withdrawal routes
		withdrawals := protected.Group("/withdrawals")
		{
			withdrawals.POST("", withdrawalController.RequestWithdrawal)
			withdrawals.GET("", withdrawalController.GetWithdrawals)
		}

		// Task routes
		tasks := protected.Group("/tasks")
		{
			tasks.GET("", taskController.GetAllTasks)
			tasks.POST("/:id/complete", taskController.CompleteTask)
		}

		// KYC routes
		kyc := protected.Group("/kyc")
		{
			kyc.POST("/submit", kycController.SubmitKYC)
			kyc.GET("/status", kycController.GetKYCStatus)
		}

		// Referral routes
		referrals := protected.Group("/referrals")
		{
			referrals.GET("", referralController.GetReferrals)
			referrals.GET("/earnings", referralController.GetReferralEarnings)
		}
	}

	// Admin routes
	admin := api.Group("/admin")
	admin.Use(authMiddleware.Authenticate())
	admin.Use(adminMiddleware.EnsureAdmin())
	{
		// Admin user management
		admin.GET("/users", adminController.GetAllUsers)
		admin.GET("/users/:id", adminController.GetUserDetails)
		admin.PUT("/users/:id/block", adminController.BlockUser)
		admin.PUT("/users/:id/unblock", adminController.UnblockUser)

		// Admin withdrawal management
		admin.GET("/withdrawals", adminController.GetAllWithdrawals)
		admin.PUT("/withdrawals/:id/approve", adminController.ApproveWithdrawal)
		admin.PUT("/withdrawals/:id/reject", adminController.RejectWithdrawal)

		// Admin KYC management
		admin.GET("/kyc", adminController.GetAllKYCSubmissions)
		admin.PUT("/kyc/:id/approve", adminController.ApproveKYC)
		admin.PUT("/kyc/:id/reject", adminController.RejectKYC)

		// Admin plan management
		admin.POST("/plans", adminController.CreatePlan)
		admin.PUT("/plans/:id", adminController.UpdatePlan)
		admin.DELETE("/plans/:id", adminController.DeletePlan)

		// Admin task management
		admin.POST("/tasks", adminController.CreateTask)
		admin.PUT("/tasks/:id", adminController.UpdateTask)
		admin.DELETE("/tasks/:id", adminController.DeleteTask)

		// Admin notification management
		admin.POST("/notifications", adminController.SendNotification)
	}

	return r
}
