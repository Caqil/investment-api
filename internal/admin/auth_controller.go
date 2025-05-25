package admin

import (
	"net/http"

	"github.com/Caqil/investment-api/internal/interfaces"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/utils"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// AdminAuthController handles admin authentication
type AdminAuthController struct {
	userRepo   *repository.UserRepository
	jwtManager *utils.JWTManager
}

// Make sure AdminAuthController implements the AdminAuthInterface
var _ interfaces.AdminAuthInterface = (*AdminAuthController)(nil)

// NewAdminAuthController creates a new admin auth controller
func NewAdminAuthController(userRepo *repository.UserRepository, jwtManager *utils.JWTManager) *AdminAuthController {
	return &AdminAuthController{
		userRepo:   userRepo,
		jwtManager: jwtManager,
	}
}

// LoginForm renders the login form
func (c *AdminAuthController) LoginForm(ctx *gin.Context) {
	ctx.HTML(http.StatusOK, "admin/login.html", gin.H{
		"title": "Admin Login",
	})
}

// Login handles admin login
func (c *AdminAuthController) Login(ctx *gin.Context) {
	// Get login credentials
	email := ctx.PostForm("email")
	password := ctx.PostForm("password")

	// Validate credentials
	user, err := c.userRepo.FindByEmail(email)
	if err != nil || user == nil {
		ctx.HTML(http.StatusOK, "admin/login.html", gin.H{
			"title": "Admin Login",
			"error": "Invalid email or password",
		})
		return
	}

	// Check if user is admin
	if !user.IsAdmin {
		ctx.HTML(http.StatusOK, "admin/login.html", gin.H{
			"title": "Admin Login",
			"error": "Unauthorized access",
		})
		return
	}

	// Verify password
	if !utils.CheckPasswordHash(password, user.PasswordHash) {
		ctx.HTML(http.StatusOK, "admin/login.html", gin.H{
			"title": "Admin Login",
			"error": "Invalid email or password",
		})
		return
	}

	// Generate JWT token
	token, err := c.jwtManager.GenerateToken(user.ID)
	if err != nil {
		ctx.HTML(http.StatusOK, "admin/login.html", gin.H{
			"title": "Admin Login",
			"error": "Authentication failed",
		})
		return
	}

	// Set session
	session := sessions.Default(ctx)
	session.Set("user_id", user.ID)
	session.Set("token", token)
	session.Options(sessions.Options{
		Path:     "/",
		MaxAge:   3600 * 24, // 1 day
		HttpOnly: true,
	})
	session.Save()

	// Redirect to admin dashboard
	ctx.Redirect(http.StatusFound, "/admin")
}

// Logout handles admin logout
func (c *AdminAuthController) Logout(ctx *gin.Context) {
	// Clear session
	session := sessions.Default(ctx)
	session.Clear()
	session.Options(sessions.Options{
		Path:     "/",
		MaxAge:   -1, // Delete immediately
		HttpOnly: true,
	})
	session.Save()

	// Redirect to login page
	ctx.Redirect(http.StatusFound, "/admin/login")
}

// RequireAdmin middleware checks if user is authenticated as admin
func (c *AdminAuthController) RequireAdmin() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Check if the request path is for login
		if ctx.Request.URL.Path == "/admin/login" {
			ctx.Next()
			return
		}

		// Get session
		session := sessions.Default(ctx)
		userID := session.Get("user_id")
		token := session.Get("token")

		// Check if user is authenticated
		if userID == nil || token == nil {
			ctx.Redirect(http.StatusFound, "/admin/login")
			ctx.Abort()
			return
		}

		// Validate token
		_, err := c.jwtManager.ValidateToken(token.(string))
		if err != nil {
			// Clear invalid session
			session.Clear()
			session.Save()
			ctx.Redirect(http.StatusFound, "/admin/login")
			ctx.Abort()
			return
		}

		// Get user
		user, err := c.userRepo.FindByID(userID.(int64))
		if err != nil || user == nil || !user.IsAdmin {
			// Clear invalid session
			session.Clear()
			session.Save()
			ctx.Redirect(http.StatusFound, "/admin/login")
			ctx.Abort()
			return
		}

		// User is authenticated as admin
		ctx.Set("user_id", user.ID)
		ctx.Set("admin_user", user)
		ctx.Next()
	}
}
