package service

import (
	"errors"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
)

type TaskService struct {
	taskRepo     *repository.TaskRepository
	userTaskRepo *repository.UserTaskRepository
}

func NewTaskService(taskRepo *repository.TaskRepository) *TaskService {
	return &TaskService{
		taskRepo:     taskRepo,
		userTaskRepo: repository.NewUserTaskRepository(taskRepo.GetDB()),
	}
}

// GetAllTasks gets all available tasks
func (s *TaskService) GetAllTasks() ([]*model.Task, error) {
	return s.taskRepo.FindAll()
}

// GetTaskByID gets a task by ID
func (s *TaskService) GetTaskByID(id int64) (*model.Task, error) {
	task, err := s.taskRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, errors.New("task not found")
	}
	return task, nil
}

// GetUserTasks gets all tasks for a user with completion status
func (s *TaskService) GetUserTasks(userID int64) ([]*model.TaskResponse, error) {
	// Get all tasks
	tasks, err := s.taskRepo.FindAll()
	if err != nil {
		return nil, err
	}

	// Get user tasks
	userTasks, err := s.userTaskRepo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}

	// Create a map of task ID to completion status
	taskCompletionMap := make(map[int64]bool)
	for _, userTask := range userTasks {
		taskCompletionMap[userTask.TaskID] = userTask.IsCompleted
	}

	// Create response
	taskResponses := make([]*model.TaskResponse, 0, len(tasks))
	for _, task := range tasks {
		isCompleted, exists := taskCompletionMap[task.ID]
		if !exists {
			isCompleted = false
		}
		taskResponses = append(taskResponses, task.ToResponse(isCompleted))
	}

	return taskResponses, nil
}

// CompleteTask marks a task as completed for a user
func (s *TaskService) CompleteTask(userID, taskID int64) error {
	// Check if task exists
	task, err := s.taskRepo.FindByID(taskID)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("task not found")
	}

	// Check if user task already exists
	userTask, err := s.userTaskRepo.FindByUserIDAndTaskID(userID, taskID)
	if err != nil {
		return err
	}

	now := time.Now()

	if userTask == nil {
		// Create new user task
		userTask = &model.UserTask{
			UserID:      userID,
			TaskID:      taskID,
			IsCompleted: true,
			CompletedAt: &now,
		}
		_, err = s.userTaskRepo.Create(userTask)
		if err != nil {
			return err
		}
	} else if !userTask.IsCompleted {
		// Update existing user task
		userTask.IsCompleted = true
		userTask.CompletedAt = &now
		err = s.userTaskRepo.Update(userTask)
		if err != nil {
			return err
		}
	} else {
		// Task already completed
		return errors.New("task already completed")
	}

	return nil
}

// ResetTask resets a task for a user (marks it as not completed)
func (s *TaskService) ResetTask(userID, taskID int64) error {
	// Check if user task exists
	userTask, err := s.userTaskRepo.FindByUserIDAndTaskID(userID, taskID)
	if err != nil {
		return err
	}
	if userTask == nil {
		// Task not found or not completed, nothing to do
		return nil
	}

	// Update user task
	userTask.IsCompleted = false
	userTask.CompletedAt = nil
	err = s.userTaskRepo.Update(userTask)
	if err != nil {
		return err
	}

	return nil
}

// HasUserCompletedTask checks if a user has completed a specific task
func (s *TaskService) HasUserCompletedTask(userID, taskID int64) (bool, error) {
	userTask, err := s.userTaskRepo.FindByUserIDAndTaskID(userID, taskID)
	if err != nil {
		return false, err
	}
	if userTask == nil {
		return false, nil
	}
	return userTask.IsCompleted, nil
}

// HasUserCompletedAllTasks checks if a user has completed all tasks
func (s *TaskService) HasUserCompletedAllTasks(userID int64) (bool, error) {
	// Get all tasks
	tasks, err := s.taskRepo.FindAll()
	if err != nil {
		return false, err
	}

	// Get user tasks
	userTasks, err := s.userTaskRepo.FindByUserID(userID)
	if err != nil {
		return false, err
	}

	// Create a map of task ID to completion status
	taskCompletionMap := make(map[int64]bool)
	for _, userTask := range userTasks {
		taskCompletionMap[userTask.TaskID] = userTask.IsCompleted
	}

	// Check if all tasks are completed
	for _, task := range tasks {
		isCompleted, exists := taskCompletionMap[task.ID]
		if !exists || !isCompleted {
			return false, nil
		}
	}

	return true, nil
}

// HasUserCompletedMandatoryTasks checks if a user has completed all mandatory tasks
func (s *TaskService) HasUserCompletedMandatoryTasks(userID int64) (bool, error) {
	// Get all mandatory tasks
	tasks, err := s.taskRepo.FindByMandatory(true)
	if err != nil {
		return false, err
	}

	// Get user tasks
	userTasks, err := s.userTaskRepo.FindByUserID(userID)
	if err != nil {
		return false, err
	}

	// Create a map of task ID to completion status
	taskCompletionMap := make(map[int64]bool)
	for _, userTask := range userTasks {
		taskCompletionMap[userTask.TaskID] = userTask.IsCompleted
	}

	// Check if all mandatory tasks are completed
	for _, task := range tasks {
		isCompleted, exists := taskCompletionMap[task.ID]
		if !exists || !isCompleted {
			return false, nil
		}
	}

	return true, nil
}

// CreateTask creates a new task (admin only)
func (s *TaskService) CreateTask(name, description string, taskType model.TaskType, taskURL string, isMandatory bool) (*model.Task, error) {
	task := &model.Task{
		Name:        name,
		Description: description,
		TaskType:    taskType,
		TaskURL:     taskURL,
		IsMandatory: isMandatory,
	}

	return s.taskRepo.Create(task)
}

// UpdateTask updates an existing task (admin only)
func (s *TaskService) UpdateTask(id int64, name, description string, taskType model.TaskType, taskURL string, isMandatory bool) (*model.Task, error) {
	task, err := s.taskRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, errors.New("task not found")
	}

	task.Name = name
	task.Description = description
	task.TaskType = taskType
	task.TaskURL = taskURL
	task.IsMandatory = isMandatory

	err = s.taskRepo.Update(task)
	if err != nil {
		return nil, err
	}

	return task, nil
}

// DeleteTask deletes a task (admin only)
func (s *TaskService) DeleteTask(id int64) error {
	task, err := s.taskRepo.FindByID(id)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("task not found")
	}

	// Delete all user tasks for this task
	err = s.userTaskRepo.DeleteByTaskID(id)
	if err != nil {
		return err
	}

	// Delete the task
	return s.taskRepo.Delete(id)
}
