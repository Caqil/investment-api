package admin

import (
	"time"

	"github.com/jinzhu/gorm"
	"github.com/qor/admin"
)

// ReportController handles report generation
type ReportController struct {
	DB *gorm.DB
}

// RegisterReports sets up the reporting routes
func RegisterReports(adminInstance *admin.Admin, db *gorm.DB) {
	controller := &ReportController{DB: db}

	// Register routes first
	adminInstance.GetRouter().Get("/reports/user-growth", controller.UserGrowthReport)
	adminInstance.GetRouter().Get("/reports/transactions", controller.TransactionReport)
	adminInstance.GetRouter().Get("/reports/profit", controller.ProfitReport)
	adminInstance.GetRouter().Get("/reports/referrals", controller.ReferralReport)

	// Add reports menu
	adminInstance.AddMenu(&admin.Menu{Name: "Reports", Priority: 800})

	// Add report links as separate menu items
	adminInstance.AddMenu(&admin.Menu{Name: "User Growth", Link: "/admin/reports/user-growth", Priority: 801})
	adminInstance.AddMenu(&admin.Menu{Name: "Transaction Summary", Link: "/admin/reports/transactions", Priority: 802})
	adminInstance.AddMenu(&admin.Menu{Name: "Profit Analysis", Link: "/admin/reports/profit", Priority: 803})
	adminInstance.AddMenu(&admin.Menu{Name: "Referral Performance", Link: "/admin/reports/referrals", Priority: 804})
}

// UserGrowthReport generates user growth report
func (c *ReportController) UserGrowthReport(context *admin.Context) {
	// Get date range from query params or use defaults
	startDate, endDate := getDateRange(context)

	// Query user growth data
	var userGrowthData []struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	}

	// This query gets the count of users registered per day
	c.DB.Raw(`
		SELECT 
			DATE(created_at) as date, 
			COUNT(*) as count 
		FROM users 
		WHERE created_at BETWEEN ? AND ?
		GROUP BY DATE(created_at) 
		ORDER BY DATE(created_at)
	`, startDate, endDate).Scan(&userGrowthData)

	// Calculate total users
	var totalUsers int
	c.DB.Model("users").Count(&totalUsers)

	// Calculate new users in period
	var newUsers int
	c.DB.Model("users").Where("created_at BETWEEN ? AND ?", startDate, endDate).Count(&newUsers)

	// Render the report template
	context.Execute("reports/user_growth", map[string]interface{}{
		"StartDate":      startDate.Format("2006-01-02"),
		"EndDate":        endDate.Format("2006-01-02"),
		"UserGrowthData": userGrowthData,
		"TotalUsers":     totalUsers,
		"NewUsers":       newUsers,
	})
}

// TransactionReport generates transaction summary report
func (c *ReportController) TransactionReport(context *admin.Context) {
	// Get date range from query params or use defaults
	startDate, endDate := getDateRange(context)

	// Get transaction summary by type
	var transactionSummary []struct {
		Type  string  `json:"type"`
		Count int     `json:"count"`
		Total float64 `json:"total"`
	}

	c.DB.Raw(`
		SELECT 
			type, 
			COUNT(*) as count, 
			SUM(amount) as total 
		FROM transactions 
		WHERE created_at BETWEEN ? AND ?
		GROUP BY type
	`, startDate, endDate).Scan(&transactionSummary)

	// Get transaction summary by status
	var statusSummary []struct {
		Status string  `json:"status"`
		Count  int     `json:"count"`
		Total  float64 `json:"total"`
	}

	c.DB.Raw(`
		SELECT 
			status, 
			COUNT(*) as count, 
			SUM(amount) as total 
		FROM transactions 
		WHERE created_at BETWEEN ? AND ?
		GROUP BY status
	`, startDate, endDate).Scan(&statusSummary)

	// Render the report template
	context.Execute("reports/transactions", map[string]interface{}{
		"StartDate":          startDate.Format("2006-01-02"),
		"EndDate":            endDate.Format("2006-01-02"),
		"TransactionSummary": transactionSummary,
		"StatusSummary":      statusSummary,
	})
}

// ProfitReport generates profit analysis report
func (c *ReportController) ProfitReport(context *admin.Context) {
	// Get date range from query params or use defaults
	startDate, endDate := getDateRange(context)

	// Get profit data by day
	var profitByDay []struct {
		Date  string  `json:"date"`
		Total float64 `json:"total"`
	}

	c.DB.Raw(`
		SELECT 
			DATE(created_at) as date, 
			SUM(amount) as total 
		FROM transactions 
		WHERE type = 'bonus' AND status = 'completed' AND created_at BETWEEN ? AND ?
		GROUP BY DATE(created_at) 
		ORDER BY DATE(created_at)
	`, startDate, endDate).Scan(&profitByDay)

	// Calculate total profit
	var totalProfit float64
	c.DB.Raw(`
		SELECT SUM(amount) 
		FROM transactions 
		WHERE type = 'bonus' AND status = 'completed' AND created_at BETWEEN ? AND ?
	`, startDate, endDate).Row().Scan(&totalProfit)

	// Render the report template
	context.Execute("reports/profit", map[string]interface{}{
		"StartDate":   startDate.Format("2006-01-02"),
		"EndDate":     endDate.Format("2006-01-02"),
		"ProfitByDay": profitByDay,
		"TotalProfit": totalProfit,
	})
}

// ReferralReport generates referral performance report
func (c *ReportController) ReferralReport(context *admin.Context) {
	// Get date range from query params or use defaults
	startDate, endDate := getDateRange(context)

	// Get top referrers
	var topReferrers []struct {
		UserID     int64   `json:"user_id"`
		Name       string  `json:"name"`
		Email      string  `json:"email"`
		Count      int     `json:"count"`
		TotalBonus float64 `json:"total_bonus"`
	}

	c.DB.Raw(`
		SELECT 
			u.id as user_id,
			u.name,
			u.email,
			COUNT(r.id) as count,
			IFNULL((
				SELECT SUM(amount) 
				FROM transactions 
				WHERE user_id = u.id AND type = 'referral_bonus' AND status = 'completed'
			), 0) as total_bonus
		FROM users u
		LEFT JOIN users r ON r.referred_by = u.id
		GROUP BY u.id
		HAVING count > 0
		ORDER BY count DESC
		LIMIT 10
	`).Scan(&topReferrers)

	// Get referral bonus summary
	var referralSummary struct {
		TotalReferrals     int     `json:"total_referrals"`
		TotalReferralBonus float64 `json:"total_referral_bonus"`
		TotalProfitBonus   float64 `json:"total_profit_bonus"`
	}

	// Count total referrals
	c.DB.Model("users").Where("referred_by IS NOT NULL").Count(&referralSummary.TotalReferrals)

	// Get total referral bonus
	c.DB.Raw(`
		SELECT SUM(amount) 
		FROM transactions 
		WHERE type = 'referral_bonus' AND status = 'completed'
	`).Row().Scan(&referralSummary.TotalReferralBonus)

	// Get total profit bonus
	c.DB.Raw(`
		SELECT SUM(amount) 
		FROM transactions 
		WHERE type = 'referral_profit' AND status = 'completed'
	`).Row().Scan(&referralSummary.TotalProfitBonus)

	// Render the report template
	context.Execute("reports/referrals", map[string]interface{}{
		"StartDate":       startDate.Format("2006-01-02"),
		"EndDate":         endDate.Format("2006-01-02"),
		"TopReferrers":    topReferrers,
		"ReferralSummary": referralSummary,
	})
}

// Helper function to get date range from context
func getDateRange(context *admin.Context) (time.Time, time.Time) {
	// Default to last 30 days
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -30)

	// Get start date from query params
	if start := context.Request.URL.Query().Get("start_date"); start != "" {
		if parsedDate, err := time.Parse("2006-01-02", start); err == nil {
			startDate = parsedDate
		}
	}

	// Get end date from query params
	if end := context.Request.URL.Query().Get("end_date"); end != "" {
		if parsedDate, err := time.Parse("2006-01-02", end); err == nil {
			endDate = parsedDate
		}
	}

	return startDate, endDate
}
