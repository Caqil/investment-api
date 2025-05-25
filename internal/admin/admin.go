package admin

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/qor/admin"
	"github.com/qor/assetfs"
	"github.com/qor/qor"
	"github.com/qor/qor/resource"
)

// AdminSetup represents the admin interface setup
type AdminSetup struct {
	Admin      *admin.Admin
	DB         *sql.DB
	Config     *config.Config
	UserRepo   *repository.UserRepository
	JWTService *service.JWTService
}

// NewAdminSetup creates a new admin setup
func NewAdminSetup(db *sql.DB, cfg *config.Config) *AdminSetup {
	// Create a new admin instance
	Admin := admin.New(&qor.Config{
		DB: db,
		AssetFS: assetfs.AssetFS{
			AssetFileSystem: assetfs.LocalFileSystem{},
			NameSpace:       "admin",
		},
	})

	// Create admin setup
	adminSetup := &AdminSetup{
		Admin:    Admin,
		DB:       db,
		Config:   cfg,
		UserRepo: repository.NewUserRepository(db),
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

	// Register Withdrawal resource
	withdrawal := as.Admin.AddResource(&model.Withdrawal{}, &admin.Config{
		Menu: []string{"Financial Management"},
		Name: "Withdrawals",
	})

	withdrawal.Meta(&admin.Meta{Name: "ID", Type: "string"})
	withdrawal.Meta(&admin.Meta{Name: "UserID", Type: "string"})
	withdrawal.Meta(&admin.Meta{Name: "Amount", Type: "number"})
	withdrawal.Meta(&admin.Meta{Name: "PaymentMethod", Type: "string"})
	withdrawal.Meta(&admin.Meta{Name: "Status", Type: "select_one", Collection: []string{"pending", "approved", "rejected"}})
	withdrawal.Meta(&admin.Meta{Name: "AdminNote", Type: "text"})
	withdrawal.Meta(&admin.Meta{Name: "CreatedAt", Type: "datetime"})

	withdrawal.IndexAttrs("ID", "UserID", "Amount", "PaymentMethod", "Status", "CreatedAt")
	withdrawal.ShowAttrs("ID", "TransactionID", "UserID", "Amount", "PaymentMethod", "Status", "AdminNote", "TasksCompleted", "CreatedAt")
	withdrawal.EditAttrs("Status", "AdminNote")

	// Register Transaction resource
	transaction := as.Admin.AddResource(&model.Transaction{}, &admin.Config{
		Menu: []string{"Financial Management"},
		Name: "Transactions",
	})

	transaction.Meta(&admin.Meta{Name: "ID", Type: "string"})
	transaction.Meta(&admin.Meta{Name: "UserID", Type: "string"})
	transaction.Meta(&admin.Meta{Name: "Amount", Type: "number"})
	transaction.Meta(&admin.Meta{Name: "Type", Type: "select_one", Collection: []string{"deposit", "withdrawal", "bonus", "referral_bonus", "plan_purchase", "referral_profit"}})
	transaction.Meta(&admin.Meta{Name: "Status", Type: "select_one", Collection: []string{"pending", "completed", "rejected"}})
	transaction.Meta(&admin.Meta{Name: "Description", Type: "text"})
	transaction.Meta(&admin.Meta{Name: "CreatedAt", Type: "datetime"})

	transaction.IndexAttrs("ID", "UserID", "Amount", "Type", "Status", "CreatedAt")
	transaction.ShowAttrs("ID", "UserID", "Amount", "Type", "Status", "Description", "CreatedAt")
	transaction.EditAttrs("Status", "Description")

	// Register KYC resource
	kyc := as.Admin.AddResource(&model.KYCDocument{}, &admin.Config{
		Menu: []string{"User Management"},
		Name: "KYC Documents",
	})

	kyc.Meta(&admin.Meta{Name: "ID", Type: "string"})
	kyc.Meta(&admin.Meta{Name: "UserID", Type: "string"})
	kyc.Meta(&admin.Meta{Name: "DocumentType", Type: "select_one", Collection: []string{"id_card", "passport", "driving_license"}})
	kyc.Meta(&admin.Meta{Name: "DocumentFrontURL", Type: "string"})
	kyc.Meta(&admin.Meta{Name: "DocumentBackURL", Type: "string"})
	kyc.Meta(&admin.Meta{Name: "SelfieURL", Type: "string"})
	kyc.Meta(&admin.Meta{Name: "Status", Type: "select_one", Collection: []string{"pending", "approved", "rejected"}})
	kyc.Meta(&admin.Meta{Name: "AdminNote", Type: "text"})
	kyc.Meta(&admin.Meta{Name: "CreatedAt", Type: "datetime"})

	kyc.IndexAttrs("ID", "UserID", "DocumentType", "Status", "CreatedAt")
	kyc.ShowAttrs("ID", "UserID", "DocumentType", "DocumentFrontURL", "DocumentBackURL", "SelfieURL", "Status", "AdminNote", "CreatedAt")
	kyc.EditAttrs("Status", "AdminNote")

	// Register Task resource
	task := as.Admin.AddResource(&model.Task{}, &admin.Config{
		Menu: []string{"Task Management"},
		Name: "Tasks",
	})

	task.Meta(&admin.Meta{Name: "ID", Type: "string"})
	task.Meta(&admin.Meta{Name: "Name", Type: "string"})
	task.Meta(&admin.Meta{Name: "Description", Type: "text"})
	task.Meta(&admin.Meta{Name: "TaskType", Type: "select_one", Collection: []string{"follow", "like", "install"}})
	task.Meta(&admin.Meta{Name: "TaskURL", Type: "string"})
	task.Meta(&admin.Meta{
		Name: "IsMandatory",
		Type: "select_one",
		Valuer: func(record interface{}, context *qor.Context) (result interface{}) {
			if t, ok := record.(*model.Task); ok {
				if t.IsMandatory {
					return "Yes"
				}
			}
			return "No"
		},
		Collection: []string{"Yes", "No"},
		Setter: func(record interface{}, metaValue *resource.MetaValue, context *qor.Context) {
			if t, ok := record.(*model.Task); ok {
				if metaValue.Value.(string) == "Yes" {
					t.IsMandatory = true
				} else {
					t.IsMandatory = false
				}
			}
		},
	})

	task.IndexAttrs("ID", "Name", "TaskType", "IsMandatory", "CreatedAt")
	task.ShowAttrs("ID", "Name", "Description", "TaskType", "TaskURL", "IsMandatory", "CreatedAt")
	task.EditAttrs("Name", "Description", "TaskType", "TaskURL", "IsMandatory")
	task.NewAttrs("Name", "Description", "TaskType", "TaskURL", "IsMandatory")

	// Add more resources as needed
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

// MountTo mounts the admin interface to the given path
func (as *AdminSetup) MountTo(mountPath string, router *gin.Engine) {
	// Create a new HTTP mux
	mux := http.NewServeMux()

	// Mount admin to the mux
	as.Admin.MountTo(mountPath, mux)

	// Use Gin adapter to serve the admin interface
	router.Any(fmt.Sprintf("%s/*resource", mountPath), gin.WrapH(mux))

	// Serve admin UI assets
	router.StaticFS("/admin/assets", http.Dir("public/admin"))
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
