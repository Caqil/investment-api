package admin

import (
	"fmt"
	"net/http"
	"time"

	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/utils"
	"github.com/golang-jwt/jwt/v4"
	"github.com/qor/admin"
	"github.com/qor/qor"
)

// AdminAuth implements the auth interface for admin
type AdminAuth struct {
	UserRepository *repository.UserRepository
	JWTSecret      string
}

// LoginURL returns the login URL
func (auth *AdminAuth) LoginURL(c *admin.Context) string {
	return c.URLFor("login")
}

// LogoutURL returns the logout URL
func (auth *AdminAuth) LogoutURL(c *admin.Context) string {
	return c.URLFor("logout")
}

// Login authenticates the admin user
func (auth *AdminAuth) Login(context *admin.Context) {
	if context.Request.Method == "GET" {
		// Display login form
		context.Execute("auth/login", map[string]interface{}{
			"Title": "Admin Login",
		})
	} else if context.Request.Method == "POST" {
		// Handle login submission
		context.Request.ParseForm()
		email := context.Request.Form.Get("email")
		password := context.Request.Form.Get("password")

		// Validate login credentials
		user, err := auth.UserRepository.FindByEmail(email)
		if err != nil || user == nil || !user.IsAdmin || !utils.CheckPasswordHash(password, user.PasswordHash) {
			context.AddError(fmt.Errorf("Invalid email or password"))
			http.Redirect(context.Writer, context.Request, context.URLFor("login"), http.StatusSeeOther)
			return
		}

		// Generate JWT token
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
			Subject:   string(user.ID),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token expires in 24 hours
		})

		// Sign and get the complete encoded token as a string
		tokenString, err := token.SignedString([]byte(auth.JWTSecret))
		if err != nil {
			context.AddError(fmt.Errorf("Authentication failed"))
			http.Redirect(context.Writer, context.Request, context.URLFor("login"), http.StatusSeeOther)
			return
		}

		// Set token cookie
		http.SetCookie(context.Writer, &http.Cookie{
			Name:     "admin_token",
			Value:    tokenString,
			Path:     "/admin",
			Expires:  time.Now().Add(24 * time.Hour),
			HttpOnly: true,
		})

		http.Redirect(context.Writer, context.Request, context.URLFor(""), http.StatusSeeOther)
	}
}

// Logout handles admin logout
func (auth *AdminAuth) Logout(context *admin.Context) {
	// Clear the admin token cookie
	http.SetCookie(context.Writer, &http.Cookie{
		Name:     "admin_token",
		Value:    "",
		Path:     "/admin",
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
	})

	http.Redirect(context.Writer, context.Request, context.URLFor("login"), http.StatusSeeOther)
}

// GetCurrentUser gets the current admin user
func (auth *AdminAuth) GetCurrentUser(context *admin.Context) qor.CurrentUser {
	cookie, err := context.Request.Cookie("admin_token")
	if err != nil {
		return nil
	}

	// Parse and validate the token
	tokenString := cookie.Value
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(auth.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return nil
	}

	// Extract user ID from token
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil
	}

	// Convert subject to int64
	userID := claims["sub"].(string)

	// Get user from repository
	user, err := auth.UserRepository.FindByID(utils.StringToInt64(userID))
	if err != nil || user == nil || !user.IsAdmin {
		return nil
	}

	return AdminUser{user}
}

// AdminUser represents an admin user
type AdminUser struct {
	user interface{}
}

// DisplayName returns the display name of the admin user
func (u AdminUser) DisplayName() string {
	if user, ok := u.user.(interface{ GetName() string }); ok {
		return user.GetName()
	}
	return ""
}

// GetName is a helper method to get the name
func (u AdminUser) GetName() string {
	if user, ok := u.user.(interface{ GetName() string }); ok {
		return user.GetName()
	}
	return ""
}

// AvailableLocales returns the available locales for the admin user
func (u AdminUser) AvailableLocales() []string {
	return []string{"en-US"}
}
