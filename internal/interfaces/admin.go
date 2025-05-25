package interfaces

import (
	"github.com/gin-gonic/gin"
)

// AdminInterface defines the contract for admin functionality
type AdminInterface interface {
	// MountTo mounts the admin interface to the given path
	MountTo(mountPath string, router *gin.Engine)

	// SetupAuth sets up authentication for the admin interface
	SetupAuth()
}

// AdminAuthInterface defines the contract for admin authentication
type AdminAuthInterface interface {
	// RequireAdmin returns a middleware that checks if the user is an admin
	RequireAdmin() gin.HandlerFunc

	// LoginForm renders the login form
	LoginForm(ctx *gin.Context)

	// Login handles admin login
	Login(ctx *gin.Context)

	// Logout handles admin logout
	Logout(ctx *gin.Context)
}

// DashboardInterface defines the contract for the admin dashboard
type DashboardInterface interface {
	// Dashboard renders the admin dashboard
	Dashboard(ctx *gin.Context)
}
