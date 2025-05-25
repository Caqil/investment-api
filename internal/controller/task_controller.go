package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type TaskController struct {
	taskService *service.TaskService
}

func NewTaskController(taskService *service.TaskService) *TaskController {
	return &TaskController{
		taskService: taskService,
	}
}

// GetAllTasks returns all available tasks for the user with completion status
func (c *TaskController) GetAllTasks(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get tasks with completion status
	tasks, err := c.taskService.GetUserTasks(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tasks"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

// CompleteTask marks a task as completed for the user
func (c *TaskController) CompleteTask(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get task ID from URL parameter
	taskIDStr := ctx.Param("id")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Complete the task
	err = c.taskService.CompleteTask(userID, taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete task: " + err.Error()})
		return
	}

	// Check if all mandatory tasks are completed
	allCompleted, err := c.taskService.HasUserCompletedMandatoryTasks(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check task completion"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":                 "Task completed successfully",
		"all_mandatory_completed": allCompleted,
	})
}

// CreateTask creates a new task (admin only)
func (c *TaskController) CreateTask(ctx *gin.Context) {
	var req struct {
		Name        string         `json:"name" binding:"required"`
		Description string         `json:"description" binding:"required"`
		TaskType    model.TaskType `json:"task_type" binding:"required"`
		TaskURL     string         `json:"task_url"`
		IsMandatory bool           `json:"is_mandatory"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate task type
	if req.TaskType != model.TaskTypeFollow && req.TaskType != model.TaskTypeLike && req.TaskType != model.TaskTypeInstall {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task type"})
		return
	}

	// Create the task
	task, err := c.taskService.CreateTask(
		req.Name,
		req.Description,
		req.TaskType,
		req.TaskURL,
		req.IsMandatory,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Task created successfully",
		"task":    task.ToResponse(false),
	})
}

// UpdateTask updates an existing task (admin only)
func (c *TaskController) UpdateTask(ctx *gin.Context) {
	// Get task ID from URL parameter
	taskIDStr := ctx.Param("id")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req struct {
		Name        string         `json:"name" binding:"required"`
		Description string         `json:"description" binding:"required"`
		TaskType    model.TaskType `json:"task_type" binding:"required"`
		TaskURL     string         `json:"task_url"`
		IsMandatory bool           `json:"is_mandatory"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate task type
	if req.TaskType != model.TaskTypeFollow && req.TaskType != model.TaskTypeLike && req.TaskType != model.TaskTypeInstall {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task type"})
		return
	}

	// Update the task
	task, err := c.taskService.UpdateTask(
		taskID,
		req.Name,
		req.Description,
		req.TaskType,
		req.TaskURL,
		req.IsMandatory,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Task updated successfully",
		"task":    task.ToResponse(false),
	})
}

// DeleteTask deletes a task (admin only)
func (c *TaskController) DeleteTask(ctx *gin.Context) {
	// Get task ID from URL parameter
	taskIDStr := ctx.Param("id")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Delete the task
	err = c.taskService.DeleteTask(taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Task deleted successfully",
	})
}

// ResetTask resets a task completion status for a user (admin only)
func (c *TaskController) ResetTask(ctx *gin.Context) {
	// Get task ID from URL parameter
	taskIDStr := ctx.Param("id")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	// Get user ID from request body
	var req struct {
		UserID int64 `json:"user_id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Reset the task
	err = c.taskService.ResetTask(req.UserID, taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset task: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Task reset successfully",
	})
}
