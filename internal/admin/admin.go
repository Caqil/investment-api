package admin

import (
	"fmt"
	"net/http"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/interfaces"
	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/database"
	"github.com/gin-gonic/gin"
	"github.com/qor/admin"
	"github.com/qor/assetfs"
	"github.com/qor/qor"
	"github.com/qor/qor/resource"
)

// AdminSetup represents the admin interface setup
type AdminSetup struct {
	Admin     *admin.Admin
	MongoConn *database.MongoDBConnection
	UserRepo  *repository.UserRepository
	Config    *config.Config
}

// Make sure AdminSetup implements the AdminInterface
var _ interfaces.AdminInterface = (*AdminSetup)(nil)

// NewAdminSetup creates a new admin setup
func NewAdminSetup(mongoConn *database.MongoDBConnection, cfg *config.Config) *AdminSetup {
	// Create a new admin instance
	Admin := admin.New(&admin.AdminConfig{
		DB:      nil, // We're not using GORM, so this can be nil
		AssetFS: assetfs.AssetFS().NameSpace("admin"),
	})

	// Create user repository
	userRepo := repository.NewUserRepository(mongoConn)

	// Create admin setup
	adminSetup := &AdminSetup{
		Admin:     Admin,
		MongoConn: mongoConn,
		UserRepo:  userRepo,
		Config:    cfg,
	}

	// Initialize admin
	adminSetup.initAdmin()

	return adminSetup
}

// initAdmin initializes the admin interface
func (as *AdminSetup) initAdmin() {
	// Set admin site title
	as.Admin.SetSiteName("Investment App Admin")

	// Register resources
	as.registerResources()

	// Add custom pages if needed
	as.addCustomPages()
}

// registerResources registers all resources with admin
func (as *AdminSetup) registerResources() {
	// Register User resource
	user := as.Admin.AddResource(&model.User{}, &admin.Config{
		Menu: []string{"User Management"},
		Name: "Users",
	})

	// Customize User resource
	user.Meta(&admin.Meta{Name: "ID", Type: "string"})
	user.Meta(&admin.Meta{Name: "Name", Type: "string"})
	user.Meta(&admin.Meta{Name: "Email", Type: "string"})
	user.Meta(&admin.Meta{
		Name: "IsAdmin",
		Type: "select_one",
		Valuer: func(record interface{}, context *qor.Context) (result interface{}) {
			if u, ok := record.(*model.User); ok {
				if u.IsAdmin {
					return "Yes"
				}
			}
			return "No"
		},
		Collection: []string{"Yes", "No"},
		Setter: func(record interface{}, metaValue *resource.MetaValue, context *qor.Context) {
			if u, ok := record.(*model.User); ok {
				if metaValue.Value.(string) == "Yes" {
					u.IsAdmin = true
				} else {
					u.IsAdmin = false
				}
			}
		},
	})

	user.Meta(&admin.Meta{
		Name: "IsBlocked",
		Type: "select_one",
		Valuer: func(record interface{}, context *qor.Context) (result interface{}) {
			if u, ok := record.(*model.User); ok {
				if u.IsBlocked {
					return "Yes"
				}
			}
			return "No"
		},
		Collection: []string{"Yes", "No"},
		Setter: func(record interface{}, metaValue *resource.MetaValue, context *qor.Context) {
			if u, ok := record.(*model.User); ok {
				if metaValue.Value.(string) == "Yes" {
					u.IsBlocked = true
				} else {
					u.IsBlocked = false
				}
			}
		},
	})

	user.Meta(&admin.Meta{Name: "Balance", Type: "number"})
	user.Meta(&admin.Meta{Name: "CreatedAt", Type: "datetime"})

	// Configure User CRUD functions
	user.IndexAttrs("ID", "Name", "Email", "IsAdmin", "IsBlocked", "Balance", "CreatedAt")
	user.ShowAttrs("ID", "Name", "Email", "Phone", "ReferralCode", "Balance", "PlanID", "IsKYCVerified", "EmailVerified", "IsAdmin", "IsBlocked", "CreatedAt")
	user.EditAttrs("Name", "Email", "Phone", "Balance", "IsAdmin", "IsBlocked")
	user.NewAttrs("Name", "Email", "Phone", "IsAdmin", "IsBlocked")

	// Register Plan resource
	plan := as.Admin.AddResource(&model.Plan{}, &admin.Config{
		Menu: []string{"Plan Management"},
		Name: "Plans",
	})

	plan.Meta(&admin.Meta{Name: "ID", Type: "string"})
	plan.Meta(&admin.Meta{Name: "Name", Type: "string"})
	plan.Meta(&admin.Meta{Name: "Price", Type: "number"})
	plan.Meta(&admin.Meta{Name: "DailyDepositLimit", Type: "number"})
	plan.Meta(&admin.Meta{Name: "DailyWithdrawalLimit", Type: "number"})
	plan.Meta(&admin.Meta{Name: "DailyProfitLimit", Type: "number"})
	plan.Meta(&admin.Meta{
		Name: "IsDefault",
		Type: "select_one",
		Valuer: func(record interface{}, context *qor.Context) (result interface{}) {
			if p, ok := record.(*model.Plan); ok {
				if p.IsDefault {
					return "Yes"
				}
			}
			return "No"
		},
		Collection: []string{"Yes", "No"},
		Setter: func(record interface{}, metaValue *resource.MetaValue, context *qor.Context) {
			if p, ok := record.(*model.Plan); ok {
				if metaValue.Value.(string) == "Yes" {
					p.IsDefault = true
				} else {
					p.IsDefault = false
				}
			}
		},
	})

	plan.IndexAttrs("ID", "Name", "Price", "DailyDepositLimit", "DailyWithdrawalLimit", "DailyProfitLimit", "IsDefault")
	plan.ShowAttrs("ID", "Name", "Price", "DailyDepositLimit", "DailyWithdrawalLimit", "DailyProfitLimit", "IsDefault", "CreatedAt")
	plan.EditAttrs("Name", "Price", "DailyDepositLimit", "DailyWithdrawalLimit", "DailyProfitLimit", "IsDefault")
	plan.NewAttrs("Name", "Price", "DailyDepositLimit", "DailyWithdrawalLimit", "DailyProfitLimit", "IsDefault")

	// Add more resource registrations as needed
}

// addCustomPages adds custom pages to the admin interface
func (as *AdminSetup) addCustomPages() {
	// Add dashboard page
	as.Admin.AddMenu(&admin.Menu{Name: "Dashboard", Link: "/admin"})

	// Example of adding a custom page
	as.Admin.GetRouter().Get("/admin/dashboard", func(context *admin.Context) {
		context.Execute("dashboard", map[string]interface{}{
			"Title": "Dashboard",
		})
	})
}

// Fix for the SimpleAdminSetup.MountTo method in factory.go
func (s *AdminSetup) MountTo(mountPath string, router *gin.Engine) {
	// Ensure we use a template name that exists in the templates directory
	router.GET(mountPath+"/dashboard", func(c *gin.Context) {
		c.HTML(http.StatusOK, "admin/dashboard.html", gin.H{
			"title":              "Admin Dashboard",
			"totalUsers":         0,
			"totalDeposits":      0,
			"pendingWithdrawals": 0,
			"recentTransactions": []interface{}{},
			"pendingKYC":         []interface{}{},
		})
	})
}

// SetupAuth sets up authentication for the admin interface
func (as *AdminSetup) SetupAuth() {
	// Set authentication handler
	as.Admin.SetAuth(&AdminAuth{
		UserRepo: as.UserRepo,
	})
}

// AdminAuth implements qor admin.Auth interface
type AdminAuth struct {
	UserRepo *repository.UserRepository
}

// LoginURL returns the login URL
func (a *AdminAuth) LoginURL(c *admin.Context) string {
	return "/admin/login"
}

// LogoutURL returns the logout URL
func (a *AdminAuth) LogoutURL(c *admin.Context) string {
	return "/admin/logout"
}

// GetCurrentUser gets the current user
func (a *AdminAuth) GetCurrentUser(c *admin.Context) qor.CurrentUser {
	// Get user ID from session
	if userID := c.Request.URL.Query().Get("user_id"); userID != "" {
		// Find user by ID
		user, err := a.UserRepo.FindByID(stringToInt64(userID))
		if err == nil && user != nil && user.IsAdmin {
			return user
		}
	}
	return nil
}

// Login authenticates a user
func (a *AdminAuth) Login(c *admin.Context, user interface{}) {
	// Implement login logic here
}

// Logout logs out a user
func (a *AdminAuth) Logout(c *admin.Context) {
	// Implement logout logic here
}

// Helper function to convert string to int64
func stringToInt64(s string) int64 {
	var i int64
	fmt.Sscanf(s, "%d", &i)
	return i
}
