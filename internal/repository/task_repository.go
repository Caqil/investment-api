package repository

import (
	"database/sql"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type TaskRepository struct {
	db *sql.DB
}

func NewTaskRepository(db *sql.DB) *TaskRepository {
	return &TaskRepository{
		db: db,
	}
}

// GetDB returns the database connection
func (r *TaskRepository) GetDB() *sql.DB {
	return r.db
}

func (r *TaskRepository) Create(task *model.Task) (*model.Task, error) {
	query := `
		INSERT INTO tasks (
			name, description, task_type, task_url, is_mandatory, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	task.CreatedAt = now
	task.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		task.Name,
		task.Description,
		task.TaskType,
		task.TaskURL,
		task.IsMandatory,
		task.CreatedAt,
		task.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	task.ID = id
	return task, nil
}

func (r *TaskRepository) FindByID(id int64) (*model.Task, error) {
	query := `
		SELECT * FROM tasks WHERE id = ?
	`

	var task model.Task
	err := r.db.QueryRow(query, id).Scan(
		&task.ID,
		&task.Name,
		&task.Description,
		&task.TaskType,
		&task.TaskURL,
		&task.IsMandatory,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &task, nil
}

func (r *TaskRepository) FindAll() ([]*model.Task, error) {
	query := `
		SELECT * FROM tasks ORDER BY created_at
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*model.Task
	for rows.Next() {
		var task model.Task
		err := rows.Scan(
			&task.ID,
			&task.Name,
			&task.Description,
			&task.TaskType,
			&task.TaskURL,
			&task.IsMandatory,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, &task)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *TaskRepository) FindByMandatory(isMandatory bool) ([]*model.Task, error) {
	query := `
		SELECT * FROM tasks WHERE is_mandatory = ? ORDER BY created_at
	`

	rows, err := r.db.Query(query, isMandatory)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*model.Task
	for rows.Next() {
		var task model.Task
		err := rows.Scan(
			&task.ID,
			&task.Name,
			&task.Description,
			&task.TaskType,
			&task.TaskURL,
			&task.IsMandatory,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, &task)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *TaskRepository) Update(task *model.Task) error {
	query := `
		UPDATE tasks SET
			name = ?,
			description = ?,
			task_type = ?,
			task_url = ?,
			is_mandatory = ?,
			updated_at = ?
		WHERE id = ?
	`

	task.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		task.Name,
		task.Description,
		task.TaskType,
		task.TaskURL,
		task.IsMandatory,
		task.UpdatedAt,
		task.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *TaskRepository) Delete(id int64) error {
	query := `DELETE FROM tasks WHERE id = ?`

	_, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	return nil
}

// UserTaskRepository handles user task operations
type UserTaskRepository struct {
	db *sql.DB
}

func NewUserTaskRepository(db *sql.DB) *UserTaskRepository {
	return &UserTaskRepository{
		db: db,
	}
}

func (r *UserTaskRepository) Create(userTask *model.UserTask) (*model.UserTask, error) {
	query := `
		INSERT INTO user_tasks (
			user_id, task_id, is_completed, completed_at, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	userTask.CreatedAt = now
	userTask.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		userTask.UserID,
		userTask.TaskID,
		userTask.IsCompleted,
		userTask.CompletedAt,
		userTask.CreatedAt,
		userTask.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	userTask.ID = id
	return userTask, nil
}

func (r *UserTaskRepository) FindByID(id int64) (*model.UserTask, error) {
	query := `
		SELECT * FROM user_tasks WHERE id = ?
	`

	var userTask model.UserTask
	var completedAt sql.NullTime

	err := r.db.QueryRow(query, id).Scan(
		&userTask.ID,
		&userTask.UserID,
		&userTask.TaskID,
		&userTask.IsCompleted,
		&completedAt,
		&userTask.CreatedAt,
		&userTask.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if completedAt.Valid {
		userTask.CompletedAt = &completedAt.Time
	}

	return &userTask, nil
}

func (r *UserTaskRepository) FindByUserID(userID int64) ([]*model.UserTask, error) {
	query := `
		SELECT * FROM user_tasks WHERE user_id = ?
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userTasks []*model.UserTask
	for rows.Next() {
		var userTask model.UserTask
		var completedAt sql.NullTime

		err := rows.Scan(
			&userTask.ID,
			&userTask.UserID,
			&userTask.TaskID,
			&userTask.IsCompleted,
			&completedAt,
			&userTask.CreatedAt,
			&userTask.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if completedAt.Valid {
			userTask.CompletedAt = &completedAt.Time
		}

		userTasks = append(userTasks, &userTask)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return userTasks, nil
}

func (r *UserTaskRepository) FindByUserIDAndTaskID(userID, taskID int64) (*model.UserTask, error) {
	query := `
		SELECT * FROM user_tasks WHERE user_id = ? AND task_id = ?
	`

	var userTask model.UserTask
	var completedAt sql.NullTime

	err := r.db.QueryRow(query, userID, taskID).Scan(
		&userTask.ID,
		&userTask.UserID,
		&userTask.TaskID,
		&userTask.IsCompleted,
		&completedAt,
		&userTask.CreatedAt,
		&userTask.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if completedAt.Valid {
		userTask.CompletedAt = &completedAt.Time
	}

	return &userTask, nil
}

func (r *UserTaskRepository) Update(userTask *model.UserTask) error {
	query := `
		UPDATE user_tasks SET
			user_id = ?,
			task_id = ?,
			is_completed = ?,
			completed_at = ?,
			updated_at = ?
		WHERE id = ?
	`

	userTask.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		userTask.UserID,
		userTask.TaskID,
		userTask.IsCompleted,
		userTask.CompletedAt,
		userTask.UpdatedAt,
		userTask.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *UserTaskRepository) DeleteByTaskID(taskID int64) error {
	query := `DELETE FROM user_tasks WHERE task_id = ?`

	_, err := r.db.Exec(query, taskID)
	if err != nil {
		return err
	}

	return nil
}

func (r *UserTaskRepository) DeleteByUserID(userID int64) error {
	query := `DELETE FROM user_tasks WHERE user_id = ?`

	_, err := r.db.Exec(query, userID)
	if err != nil {
		return err
	}

	return nil
}

// CountCompletedTasksByUserID counts the number of completed tasks for a user
func (r *UserTaskRepository) CountCompletedTasksByUserID(userID int64) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM user_tasks WHERE user_id = ? AND is_completed = TRUE", userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}
