package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TaskType string

const (
	TaskTypeFollow  TaskType = "follow"
	TaskTypeLike    TaskType = "like"
	TaskTypeInstall TaskType = "install"
)

type Task struct {
	ID          int64              `json:"id" bson:"id"`
	ObjectID    primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	Name        string             `json:"name" bson:"name"`
	Description string             `json:"description" bson:"description"`
	TaskType    TaskType           `json:"task_type" bson:"task_type"`
	TaskURL     string             `json:"task_url,omitempty" bson:"task_url,omitempty"`
	IsMandatory bool               `json:"is_mandatory" bson:"is_mandatory"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}

type UserTask struct {
	ID          int64              `json:"id" bson:"id"`
	ObjectID    primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	UserID      int64              `json:"user_id" bson:"user_id"`
	TaskID      int64              `json:"task_id" bson:"task_id"`
	IsCompleted bool               `json:"is_completed" bson:"is_completed"`
	CompletedAt *time.Time         `json:"completed_at,omitempty" bson:"completed_at,omitempty"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`

	// Populated fields (not from database)
	Task *Task `json:"task,omitempty" bson:"-"`
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
