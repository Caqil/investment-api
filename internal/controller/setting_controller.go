package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type SettingController struct {
	settingService *service.SettingService
}

func NewSettingController(settingService *service.SettingService) *SettingController {
	return &SettingController{
		settingService: settingService,
	}
}

// GetAllSettings gets all settings
func (c *SettingController) GetAllSettings(ctx *gin.Context) {
	// Get group filter
	group := ctx.Query("group")

	var settings []*model.Setting
	var err error

	if group != "" {
		settings, err = c.settingService.GetSettingsByGroup(group)
	} else {
		settings, err = c.settingService.GetAllSettings()
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get settings"})
		return
	}

	// Convert to response objects
	settingResponses := make([]interface{}, 0, len(settings))
	for _, setting := range settings {
		settingResponses = append(settingResponses, setting.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"settings": settingResponses})
}

// GetSettingByID gets a setting by ID
func (c *SettingController) GetSettingByID(ctx *gin.Context) {
	// Get setting ID from URL parameter
	settingIDStr := ctx.Param("id")
	settingID, err := strconv.ParseInt(settingIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid setting ID"})
		return
	}

	// Get setting
	setting, err := c.settingService.GetSettingByID(settingID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get setting"})
		return
	}
	if setting == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"setting": setting.ToResponse()})
}

// GetSettingByKey gets a setting by key
func (c *SettingController) GetSettingByKey(ctx *gin.Context) {
	// Get setting key from URL parameter
	key := ctx.Param("key")

	// Get setting
	setting, err := c.settingService.GetSettingByKey(key)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get setting"})
		return
	}
	if setting == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"setting": setting.ToResponse()})
}

// CreateSetting creates a new setting
func (c *SettingController) CreateSetting(ctx *gin.Context) {
	var req struct {
		Key         string            `json:"key" binding:"required"`
		Value       string            `json:"value" binding:"required"`
		Type        model.SettingType `json:"type" binding:"required"`
		DisplayName string            `json:"display_name" binding:"required"`
		Description string            `json:"description"`
		Group       string            `json:"group" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate type
	if req.Type != model.SettingTypeString && req.Type != model.SettingTypeNumber && req.Type != model.SettingTypeBoolean {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid setting type"})
		return
	}

	// Create setting
	setting, err := c.settingService.CreateSetting(
		req.Key,
		req.Value,
		req.Type,
		req.DisplayName,
		req.Description,
		req.Group,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create setting: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Setting created successfully",
		"setting": setting.ToResponse(),
	})
}

// UpdateSetting updates a setting
func (c *SettingController) UpdateSetting(ctx *gin.Context) {
	// Get setting ID from URL parameter
	settingIDStr := ctx.Param("id")
	settingID, err := strconv.ParseInt(settingIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid setting ID"})
		return
	}

	var req struct {
		Value       string `json:"value" binding:"required"`
		DisplayName string `json:"display_name" binding:"required"`
		Description string `json:"description"`
		Group       string `json:"group" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update setting
	setting, err := c.settingService.UpdateSetting(
		settingID,
		req.Value,
		req.DisplayName,
		req.Description,
		req.Group,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update setting: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Setting updated successfully",
		"setting": setting.ToResponse(),
	})
}

// UpdateSettingValue updates a setting value
func (c *SettingController) UpdateSettingValue(ctx *gin.Context) {
	// Get setting key from URL parameter
	key := ctx.Param("key")

	var req struct {
		Value string `json:"value" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update setting value
	err := c.settingService.UpdateSettingValue(key, req.Value)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update setting value: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Setting value updated successfully",
	})
}

// DeleteSetting deletes a setting
func (c *SettingController) DeleteSetting(ctx *gin.Context) {
	// Get setting ID from URL parameter
	settingIDStr := ctx.Param("id")
	settingID, err := strconv.ParseInt(settingIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid setting ID"})
		return
	}

	// Delete setting
	err = c.settingService.DeleteSetting(settingID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete setting: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Setting deleted successfully",
	})
}

// GetAppSettings gets application settings
func (c *SettingController) GetAppSettings(ctx *gin.Context) {
	settings, err := c.settingService.GetAppSettings()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get app settings"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"settings": settings})
}
