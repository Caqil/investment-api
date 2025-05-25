package admin

import (
	"github.com/qor/admin"
)

// SetupSystemMenu sets up the system administration menu
func SetupSystemMenu(adminInstance *admin.Admin) {
	// Add system menu
	adminInstance.AddMenu(&admin.Menu{Name: "System", Priority: 999})

	// Add sub-menus as separate menu items
	adminInstance.AddMenu(&admin.Menu{Name: "Backup Database", Link: "/admin/system/backup", Priority: 1000})
	adminInstance.AddMenu(&admin.Menu{Name: "Calculate Profit", Link: "/admin/system/calculate-profit", Priority: 1001})
	adminInstance.AddMenu(&admin.Menu{Name: "Settings", Link: "/admin/settings", Priority: 1002})
}

// SetupSettings sets up the settings resource
func SetupSettings(adminInstance *admin.Admin) {
	// Create a custom settings struct
	type SystemSettings struct {
		ID                   uint    `gorm:"primary_key" json:"id"`
		SiteName             string  `json:"site_name"`
		DailyBonusPercentage float64 `json:"daily_bonus_percentage"`
		ReferralBonusAmount  float64 `json:"referral_bonus_amount"`
		USDToBDTRate         float64 `json:"usd_to_bdt_rate"`
		MinimumWithdrawal    float64 `json:"minimum_withdrawal"`
		MaintenanceMode      bool    `json:"maintenance_mode"`
		EmailNotifications   bool    `json:"email_notifications"`
		PushNotifications    bool    `json:"push_notifications"`
	}

	// Add the settings resource
	settings := adminInstance.AddResource(&SystemSettings{}, &admin.Config{
		Menu:      []string{"System"},
		Name:      "Settings",
		Singleton: true, // There's only one settings record
	})

	// Customize the form
	settings.Meta(&admin.Meta{
		Name:  "DailyBonusPercentage",
		Label: "Daily Bonus (%)",
	})

	settings.Meta(&admin.Meta{
		Name:  "ReferralBonusAmount",
		Label: "Referral Bonus (BDT)",
	})

	settings.Meta(&admin.Meta{
		Name:  "USDToBDTRate",
		Label: "USD to BDT Exchange Rate",
	})

	settings.Meta(&admin.Meta{
		Name:  "MinimumWithdrawal",
		Label: "Minimum Withdrawal Amount (BDT)",
	})
}
