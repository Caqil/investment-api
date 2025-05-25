package service

import (
	"database/sql"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/interfaces"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

// AdminService coordinates the admin functionality
type AdminService struct {
	DB                  *sql.DB
	Config              *config.Config
	AdminSetup          interfaces.AdminInterface
	AuthController      interfaces.AdminAuthInterface
	DashboardController interfaces.DashboardInterface
}

// NewAdminService creates a new admin service
func NewAdminService(
	db *sql.DB,
	cfg *config.Config,
	adminSetup interfaces.AdminInterface,
	authController interfaces.AdminAuthInterface,
	dashboardController interfaces.DashboardInterface,
) *AdminService {
	return &AdminService{
		DB:                  db,
		Config:              cfg,
		AdminSetup:          adminSetup,
		AuthController:      authController,
		DashboardController: dashboardController,
	}
}

// SetupAdminRoutes sets up the admin routes
func (s *AdminService) SetupAdminRoutes(router *gin.Engine) {
	// Set up session
	store := cookie.NewStore([]byte(s.Config.JWT.Secret))
	router.Use(sessions.Sessions("admin_session", store))

	// Set up admin routes
	admin := router.Group("/admin")

	// Auth routes (no auth required)
	admin.GET("/login", s.AuthController.LoginForm)
	admin.POST("/login", s.AuthController.Login)

	// Protected routes
	admin.Use(s.AuthController.RequireAdmin())
	{
		admin.GET("/", s.DashboardController.Dashboard)
		admin.GET("/logout", s.AuthController.Logout)

		// Mount Qor Admin routes
		s.AdminSetup.MountTo("/admin", router)
	}
}
