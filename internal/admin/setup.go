package admin

import (
	"fmt"
	"net/http"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/jinzhu/gorm"
	"github.com/qor/admin"
	"github.com/qor/assetfs"
	"github.com/qor/qor"
)

// AdminConfig contains configuration for the admin interface
type AdminConfig struct {
	DB             *gorm.DB
	Port           string
	UserRepository *repository.UserRepository
	JWTSecret      string
}

// SetupAdmin initializes and configures the admin interface
func SetupAdmin(cfg *AdminConfig) *admin.Admin {
	// Initialize admin
	Admin := admin.New(&qor.Config{
		DB: cfg.DB,
	})

	// Set site name
	Admin.SetSiteName("Investment App Admin")

	// Set auth
	Admin.SetAuth(&AdminAuth{
		UserRepository: cfg.UserRepository,
		JWTSecret:      cfg.JWTSecret,
	})

	// Set asset fs
	Admin.SetAssetFS(assetfs.AssetFS().NameSpace("admin"))

	// Setup resources
	setupUserResource(Admin)
	setupPlanResource(Admin)
	setupTransactionResource(Admin)
	setupPaymentResource(Admin)
	setupWithdrawalResource(Admin)
	setupTaskResource(Admin)
	setupKYCResource(Admin)
	setupNotificationResource(Admin)
	setupNewsResource(Admin)
	setupFAQResource(Admin)

	// Setup system menu and settings
	SetupSystemMenu(Admin)
	SetupSettings(Admin)

	// Setup reports
	RegisterReports(Admin, cfg.DB)

	// Setup dashboard
	setupDashboard(Admin)

	return Admin
}

// RunAdmin starts the admin interface server
func RunAdmin(adminInstance *admin.Admin, port string) {
	mux := http.NewServeMux()
	adminInstance.MountTo("/admin", mux)

	fmt.Printf("Admin interface is running at http://localhost:%s/admin\n", port)
	http.ListenAndServe(fmt.Sprintf(":%s", port), mux)
}

// setupDashboard configures the admin dashboard
func setupDashboard(adminInstance *admin.Admin) {
	adminInstance.AddMenu(&admin.Menu{Name: "Dashboard", Link: "/admin"})
}

// setupUserResource configures the User resource
func setupUserResource(adminInstance *admin.Admin) {
	user := adminInstance.AddResource(&model.User{}, &admin.Config{
		Menu: []string{"User Management"},
		Name: "Users",
	})

	user.Meta(&admin.Meta{
		Name: "PasswordHash",
		Type: "password",
	})

	user.IndexAttrs("ID", "Name", "Email", "Phone", "Balance", "ReferralCode", "IsKYCVerified", "IsAdmin", "IsBlocked")
	user.SearchAttrs("Name", "Email", "Phone", "ReferralCode")
	user.EditAttrs(
		"Name", "Email", "Phone", "Balance", "ReferralCode",
		"IsKYCVerified", "EmailVerified", "IsAdmin", "IsBlocked",
		"BiometricEnabled", "ProfilePicURL", "PlanID",
	)

	// Add actions
	user.Action(&admin.Action{
		Name: "Block User",
		Handler: func(actionArgument *admin.ActionArgument) error {
			for _, record := range actionArgument.FindSelectedRecords() {
				if user, ok := record.(*model.User); ok {
					user.IsBlocked = true
					actionArgument.Context.GetDB().Save(user)
				}
			}
			return nil
		},
		Modes: []string{"batch", "show"},
	})

	user.Action(&admin.Action{
		Name: "Unblock User",
		Handler: func(actionArgument *admin.ActionArgument) error {
			for _, record := range actionArgument.FindSelectedRecords() {
				if user, ok := record.(*model.User); ok {
					user.IsBlocked = false
					actionArgument.Context.GetDB().Save(user)
				}
			}
			return nil
		},
		Modes: []string{"batch", "show"},
	})
}

// setupPlanResource configures the Plan resource
func setupPlanResource(adminInstance *admin.Admin) {
	plan := adminInstance.AddResource(&model.Plan{}, &admin.Config{
		Menu: []string{"Plan Management"},
		Name: "Plans",
	})

	plan.IndexAttrs("ID", "Name", "DailyDepositLimit", "DailyWithdrawalLimit", "DailyProfitLimit", "Price", "IsDefault")
	plan.SearchAttrs("Name")
	plan.EditAttrs("Name", "DailyDepositLimit", "DailyWithdrawalLimit", "DailyProfitLimit", "Price", "IsDefault")

	// Add actions
	plan.Action(&admin.Action{
		Name: "Set As Default",
		Handler: func(actionArgument *admin.ActionArgument) error {
			for _, record := range actionArgument.FindSelectedRecords() {
				if plan, ok := record.(*model.Plan); ok {
					// First reset all plans to non-default
					actionArgument.Context.GetDB().Model(&model.Plan{}).Update("is_default", false)

					// Then set this plan as default
					plan.IsDefault = true
					actionArgument.Context.GetDB().Save(plan)
				}
			}
			return nil
		},
		Modes: []string{"show"},
	})
}

// setupTransactionResource configures the Transaction resource
func setupTransactionResource(adminInstance *admin.Admin) {
	transaction := adminInstance.AddResource(&model.Transaction{}, &admin.Config{
		Menu: []string{"Financial Management"},
		Name: "Transactions",
	})

	transaction.IndexAttrs("ID", "UserID", "Amount", "Type", "Status", "Description", "CreatedAt")
	transaction.SearchAttrs("Type", "Status", "Description")
	transaction.EditAttrs("UserID", "Amount", "Type", "Status", "ReferenceID", "Description")
}

// setupPaymentResource configures the Payment resource
func setupPaymentResource(adminInstance *admin.Admin) {
	payment := adminInstance.AddResource(&model.Payment{}, &admin.Config{
		Menu: []string{"Financial Management"},
		Name: "Payments",
	})

	payment.IndexAttrs("ID", "TransactionID", "Gateway", "Amount", "Currency", "Status", "CreatedAt")
	payment.SearchAttrs("Gateway", "GatewayReference", "Status")
	payment.EditAttrs("TransactionID", "Gateway", "GatewayReference", "Amount", "Currency", "Status")
}

// setupWithdrawalResource configures the Withdrawal resource
func setupWithdrawalResource(adminInstance *admin.Admin) {
	withdrawal := adminInstance.AddResource(&model.Withdrawal{}, &admin.Config{
		Menu: []string{"Financial Management"},
		Name: "Withdrawals",
	})

	withdrawal.IndexAttrs("ID", "UserID", "Amount", "PaymentMethod", "Status", "CreatedAt")
	withdrawal.SearchAttrs("Status", "PaymentMethod")
	withdrawal.EditAttrs("UserID", "TransactionID", "Amount", "PaymentMethod", "Status", "AdminNote")

	// Add actions
	withdrawal.Action(&admin.Action{
		Name: "Approve Withdrawal",
		Handler: func(actionArgument *admin.ActionArgument) error {
			for _, record := range actionArgument.FindSelectedRecords() {
				if withdrawal, ok := record.(*model.Withdrawal); ok {
					if withdrawal.Status == model.WithdrawalStatusPending {
						withdrawal.Status = model.WithdrawalStatusApproved
						actionArgument.Context.GetDB().Save(withdrawal)

						// Also update the related transaction
						var transaction model.Transaction
						actionArgument.Context.GetDB().First(&transaction, withdrawal.TransactionID)
						transaction.Status = model.TransactionStatusCompleted
						actionArgument.Context.GetDB().Save(&transaction)
					}
				}
			}
			return nil
		},
		Modes: []string{"batch", "show"},
	})

	withdrawal.Action(&admin.Action{
		Name: "Reject Withdrawal",
		Handler: func(actionArgument *admin.ActionArgument) error {
			for _, record := range actionArgument.FindSelectedRecords() {
				if withdrawal, ok := record.(*model.Withdrawal); ok {
					if withdrawal.Status == model.WithdrawalStatusPending {
						withdrawal.Status = model.WithdrawalStatusRejected
						actionArgument.Context.GetDB().Save(withdrawal)

						// Also update the related transaction
						var transaction model.Transaction
						actionArgument.Context.GetDB().First(&transaction, withdrawal.TransactionID)
						transaction.Status = model.TransactionStatusRejected
						actionArgument.Context.GetDB().Save(&transaction)

						// Refund the user
						var user model.User
						actionArgument.Context.GetDB().First(&user, withdrawal.UserID)
						user.Balance += withdrawal.Amount
						actionArgument.Context.GetDB().Save(&user)
					}
				}
			}
			return nil
		},
		Modes: []string{"batch", "show"},
	})
}

// setupTaskResource configures the Task resource
func setupTaskResource(adminInstance *admin.Admin) {
	task := adminInstance.AddResource(&model.Task{}, &admin.Config{
		Menu: []string{"Task Management"},
		Name: "Tasks",
	})

	task.IndexAttrs("ID", "Name", "TaskType", "IsMandatory", "CreatedAt")
	task.SearchAttrs("Name", "Description")
	task.EditAttrs("Name", "Description", "TaskType", "TaskURL", "IsMandatory")
}

// setupKYCResource configures the KYC resource
func setupKYCResource(adminInstance *admin.Admin) {
	kyc := adminInstance.AddResource(&model.KYCDocument{}, &admin.Config{
		Menu: []string{"KYC Management"},
		Name: "KYC Documents",
	})

	kyc.IndexAttrs("ID", "UserID", "DocumentType", "Status", "CreatedAt")
	kyc.SearchAttrs("UserID", "DocumentType", "Status")
	kyc.EditAttrs("UserID", "DocumentType", "DocumentFrontURL", "DocumentBackURL", "SelfieURL", "Status", "AdminNote")

	// Add actions
	kyc.Action(&admin.Action{
		Name: "Approve KYC",
		Handler: func(actionArgument *admin.ActionArgument) error {
			for _, record := range actionArgument.FindSelectedRecords() {
				if kyc, ok := record.(*model.KYCDocument); ok {
					if kyc.Status == model.KYCStatusPending {
						kyc.Status = model.KYCStatusApproved
						actionArgument.Context.GetDB().Save(kyc)

						// Also update the user's KYC status
						var user model.User
						actionArgument.Context.GetDB().First(&user, kyc.UserID)
						user.IsKYCVerified = true
						actionArgument.Context.GetDB().Save(&user)
					}
				}
			}
			return nil
		},
		Modes: []string{"batch", "show"},
	})

	kyc.Action(&admin.Action{
		Name: "Reject KYC",
		Handler: func(actionArgument *admin.ActionArgument) error {
			for _, record := range actionArgument.FindSelectedRecords() {
				if kyc, ok := record.(*model.KYCDocument); ok {
					if kyc.Status == model.KYCStatusPending {
						kyc.Status = model.KYCStatusRejected
						actionArgument.Context.GetDB().Save(kyc)
					}
				}
			}
			return nil
		},
		Modes: []string{"batch", "show"},
	})
}

// setupNotificationResource configures the Notification resource
func setupNotificationResource(adminInstance *admin.Admin) {
	notification := adminInstance.AddResource(&model.Notification{}, &admin.Config{
		Menu: []string{"Communication"},
		Name: "Notifications",
	})

	notification.IndexAttrs("ID", "UserID", "Title", "Type", "IsRead", "CreatedAt")
	notification.SearchAttrs("Title", "Message", "Type")
	notification.EditAttrs("UserID", "Title", "Message", "Type", "IsRead")
}

// setupNewsResource configures the News resource
func setupNewsResource(adminInstance *admin.Admin) {
	news := adminInstance.AddResource(&model.News{}, &admin.Config{
		Menu: []string{"Content Management"},
		Name: "News",
	})

	news.IndexAttrs("ID", "Title", "IsPublished", "CreatedAt")
	news.SearchAttrs("Title", "Content")
	news.EditAttrs("Title", "Content", "ImageURL", "IsPublished")
}

// setupFAQResource configures the FAQ resource
func setupFAQResource(adminInstance *admin.Admin) {
	faq := adminInstance.AddResource(&model.FAQ{}, &admin.Config{
		Menu: []string{"Content Management"},
		Name: "FAQs",
	})

	faq.IndexAttrs("ID", "Question", "OrderNumber", "CreatedAt")
	faq.SearchAttrs("Question", "Answer")
	faq.EditAttrs("Question", "Answer", "OrderNumber")
}
