package config

import (
	"os"
	"strconv"
)

type Config struct {
	Server struct {
		Port string
	}
	Database struct {
		URI            string // MongoDB URI
		Name           string // Database name
		ConnectTimeout int    // Connection timeout in seconds
		MaxPoolSize    uint64 // Maximum connection pool size
	}
	JWT struct {
		Secret    string
		ExpiresIn int // hours
	}
	Email struct {
		SMTPHost     string
		SMTPPort     string
		SMTPUsername string
		SMTPPassword string
		FromEmail    string
		FromName     string
	}
	Payment struct {
		CoinGateAPIKey    string
		UddoktaPayAPIKey  string
		UddoktaPayBaseURL string
	}
	App struct {
		DailyBonusPercentage     float64
		ReferralBonusAmount      float64
		ReferralProfitPercentage float64
		MinimumWithdrawalAmount  float64
		USDToBDTConversionRate   float64
	}
}

func NewConfig() *Config {
	cfg := &Config{}

	// Server configuration
	cfg.Server.Port = getEnv("SERVER_PORT", "8080")

	// Database configuration
	cfg.Database.URI = getEnv("MONGODB_URI", "mongodb://localhost:27017")
	cfg.Database.Name = getEnv("MONGODB_NAME", "investment_app")
	cfg.Database.ConnectTimeout, _ = strconv.Atoi(getEnv("MONGODB_CONNECT_TIMEOUT", "10"))
	maxPoolSize, _ := strconv.ParseUint(getEnv("MONGODB_MAX_POOL_SIZE", "100"), 10, 64)
	cfg.Database.MaxPoolSize = maxPoolSize

	// JWT configuration
	cfg.JWT.Secret = getEnv("JWT_SECRET", "your-secret-key")
	cfg.JWT.ExpiresIn, _ = strconv.Atoi(getEnv("JWT_EXPIRES_IN", "24"))

	// Email configuration
	cfg.Email.SMTPHost = getEnv("SMTP_HOST", "smtp.gmail.com")
	cfg.Email.SMTPPort = getEnv("SMTP_PORT", "587")
	cfg.Email.SMTPUsername = getEnv("SMTP_USERNAME", "")
	cfg.Email.SMTPPassword = getEnv("SMTP_PASSWORD", "")
	cfg.Email.FromEmail = getEnv("FROM_EMAIL", "no-reply@example.com")
	cfg.Email.FromName = getEnv("FROM_NAME", "Investment App")

	// Payment configuration
	cfg.Payment.CoinGateAPIKey = getEnv("COINGATE_API_KEY", "")
	cfg.Payment.UddoktaPayAPIKey = getEnv("UDDOKTAPAY_API_KEY", "")
	cfg.Payment.UddoktaPayBaseURL = getEnv("UDDOKTAPAY_BASE_URL", "")

	// App configuration
	cfg.App.DailyBonusPercentage, _ = strconv.ParseFloat(getEnv("DAILY_BONUS_PERCENTAGE", "5.0"), 64)
	cfg.App.ReferralBonusAmount, _ = strconv.ParseFloat(getEnv("REFERRAL_BONUS_AMOUNT", "100.0"), 64)
	cfg.App.ReferralProfitPercentage, _ = strconv.ParseFloat(getEnv("REFERRAL_PROFIT_PERCENTAGE", "10.0"), 64)
	cfg.App.MinimumWithdrawalAmount, _ = strconv.ParseFloat(getEnv("MINIMUM_WITHDRAWAL_AMOUNT", "100.0"), 64)
	cfg.App.USDToBDTConversionRate, _ = strconv.ParseFloat(getEnv("USD_TO_BDT_CONVERSION_RATE", "120.0"), 64)

	return cfg
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
