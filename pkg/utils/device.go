package utils

import (
	"regexp"
	"strings"
)

// IsVirtualDevice checks if a device is an emulator or virtual device
func IsVirtualDevice(deviceID string) bool {
	// Common emulator device ID patterns
	emulatorPatterns := []string{
		"emulator",
		"generic",
		"sdk_",
		"vbox",
		"virtual",
		"google_sdk",
		"Emulator",
		"000000000000000",
	}

	for _, pattern := range emulatorPatterns {
		if strings.Contains(strings.ToLower(deviceID), strings.ToLower(pattern)) {
			return true
		}
	}

	// Check for common emulator IP addresses
	emulatorIPPattern := regexp.MustCompile(`127\.0\.0\.1|10\.0\.2\.15`)
	if emulatorIPPattern.MatchString(deviceID) {
		return true
	}

	return false
}

// GenerateDeviceFingerprint creates a unique fingerprint from device info
func GenerateDeviceFingerprint(deviceID, model, manufacturer string) string {
	// Simple implementation - you might want to use a more sophisticated algorithm
	return strings.ToLower(deviceID + ":" + model + ":" + manufacturer)
}
