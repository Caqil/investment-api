package utils

import (
	"strconv"
)

// StringToInt64 converts a string to int64
func StringToInt64(s string) int64 {
	i, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0
	}
	return i
}

// StringToFloat64 converts a string to float64
func StringToFloat64(s string) float64 {
	f, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return 0
	}
	return f
}

// FormatCurrency formats a float64 as a currency string
func FormatCurrency(amount float64, currency string) string {
	return currency + " " + strconv.FormatFloat(amount, 'f', 2, 64)
}
