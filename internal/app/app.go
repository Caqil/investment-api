package app

import (
	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/admin"
	"github.com/Caqil/investment-api/internal/controller"
	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/Caqil/investment-api/pkg/database"
	"github.com/Caqil/investment-api/pkg/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

type App struct {
	config     *config.Config
	mongoConn  *database.MongoDBConnection
	jwtService *service.JWTService
}

func NewApp(config *config.Config, mongoConn *database.MongoDBConnection) *App {
	return &App{
		config:     config,
		mongoConn:  mongoConn,
		jwtService: service.NewJWTService(config.JWT.Secret, config.JWT.ExpiresIn),
	}
}

func (a *App) SetupRoutes() *gin.Engine {
	// Set Gin to release mode in production
	// gin.SetMode(gin.ReleaseMode)

	r := gin.Default()

	// Load templates
	r.LoadHTMLGlob("templates/**/*")

	// Serve static files
	r.Static("/static", "./public/static")
	r.Static("/admin/assets", "./public/admin")

	// Set up session middleware
	store := cookie.NewStore([]byte(a.config.JWT.Secret))
	r.Use(sessions.Sessions("investment_app_session", store))

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
	userRepo := repository.NewUserRepository(a.mongoConn)
	transactionRepo := repository.NewTransactionRepository(a.mongoConn)
	paymentRepo := repository.NewPaymentRepository(a.mongoConn)
	planRepo := repository.NewPlanRepository(a.mongoConn)
	withdrawalRepo := repository.NewWithdrawalRepository(a.mongoConn)
	taskRepo := repository.NewTaskRepository(a.mongoConn)
	kycRepo := repository.NewKYCRepository(a.mongoConn)
	deviceRepo := repository.NewDeviceRepository(a.mongoConn)
	notificationRepo := repository.NewNotificationRepository(a.mongoConn)

	// Initialize services
	deviceService := service.NewDeviceService(deviceRepo)
	emailService := utils.NewEmailService(a.config.Email)
	authService := service.NewAuthService(userRepo, a.jwtService.GetJWTManager(), emailService)
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
		bonusService,
	)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(a.jwtService.GetJWTManager(), userRepo)
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

	// Admin API routes
	adminAPI := api.Group("/admin")
	adminAPI.Use(authMiddleware.Authenticate())
	adminAPI.Use(adminMiddleware.EnsureAdmin())
	{
		// Admin user management
		adminAPI.GET("/users", adminController.GetAllUsers)
		adminAPI.GET("/users/:id", adminController.GetUserDetails)
		adminAPI.PUT("/users/:id/block", adminController.BlockUser)
		adminAPI.PUT("/users/:id/unblock", adminController.UnblockUser)

		// Admin withdrawal management
		adminAPI.GET("/withdrawals", adminController.GetAllWithdrawals)
		adminAPI.PUT("/withdrawals/:id/approve", adminController.ApproveWithdrawal)
		adminAPI.PUT("/withdrawals/:id/reject", adminController.RejectWithdrawal)

		// Admin KYC management
		adminAPI.GET("/kyc", adminController.GetAllKYCSubmissions)
		adminAPI.PUT("/kyc/:id/approve", adminController.ApproveKYC)
		adminAPI.PUT("/kyc/:id/reject", adminController.RejectKYC)

		// Admin plan management
		adminAPI.POST("/plans", adminController.CreatePlan)
		adminAPI.PUT("/plans/:id", adminController.UpdatePlan)
		adminAPI.DELETE("/plans/:id", adminController.DeletePlan)

		// Admin task management
		adminAPI.POST("/tasks", adminController.CreateTask)
		adminAPI.PUT("/tasks/:id", adminController.UpdateTask)
		adminAPI.DELETE("/tasks/:id", adminController.DeleteTask)

		// Admin notification management
		adminAPI.POST("/notifications", adminController.SendNotification)
	}

	// Initialize admin components with factory
	adminFactory := admin.NewFactory(a.mongoConn, a.config, a.jwtService.GetJWTManager())

	// Create admin components
	adminSetup := adminFactory.CreateAdminSetup()
	adminAuthController := adminFactory.CreateAdminAuthController()
	dashboardController := adminFactory.CreateDashboardController()

	// Create admin service
	adminService := service.NewAdminService(
		a.mongoConn,
		a.config,
		adminSetup,
		adminAuthController,
		dashboardController,
	)

	// Set up admin routes
	adminService.SetupAdminRoutes(r)

	return r
}
