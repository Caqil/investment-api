package model

import (
	"time"
)

type TaskType string

const (
	TaskTypeFollow  TaskType = "follow"
	TaskTypeLike    TaskType = "like"
	TaskTypeInstall TaskType = "install"
)

type Task struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	TaskType    TaskType  `json:"task_type" db:"task_type"`
	TaskURL     string    `json:"task_url,omitempty" db:"task_url"`
	IsMandatory bool      `json:"is_mandatory" db:"is_mandatory"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type UserTask struct {
	ID          int64      `json:"id" db:"id"`
	UserID      int64      `json:"user_id" db:"user_id"`
	TaskID      int64      `json:"task_id" db:"task_id"`
	IsCompleted bool       `json:"is_completed" db:"is_completed"`
	CompletedAt *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`

	// Populated fields (not from database)
	Task *Task `json:"task,omitempty" db:"-"`
}

type TaskResponse struct {
	ID          int64    `json:"id"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	TaskType    TaskType `json:"task_type"`
	TaskURL     string   `json:"task_url,omitempty"`
	IsMandatory bool     `json:"is_mandatory"`
	IsCompleted bool     `json:"is_completed"`
}

func (t *Task) ToResponse(isCompleted bool) *TaskResponse {
	return &TaskResponse{
		ID:          t.ID,
		Name:        t.Name,
		Description: t.Description,
		TaskType:    t.TaskType,
		TaskURL:     t.TaskURL,
		IsMandatory: t.IsMandatory,
		IsCompleted: isCompleted,
	}
}

func (ut *UserTask) ToResponse() *TaskResponse {
	if ut.Task == nil {
		return nil
	}

	return &TaskResponse{
		ID:          ut.Task.ID,
		Name:        ut.Task.Name,
		Description: ut.Task.Description,
		TaskType:    ut.Task.TaskType,
		TaskURL:     ut.Task.TaskURL,
		IsMandatory: ut.Task.IsMandatory,
		IsCompleted: ut.IsCompleted,
	}
}
