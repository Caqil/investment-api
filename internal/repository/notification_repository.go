package repository

import (
	"database/sql"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type NotificationRepository struct {
	db *sql.DB
}

func NewNotificationRepository(db *sql.DB) *NotificationRepository {
	return &NotificationRepository{
		db: db,
	}
}

func (r *NotificationRepository) Create(notification *model.Notification) (*model.Notification, error) {
	query := `
		INSERT INTO notifications (
			user_id, title, message, type, is_read, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	notification.CreatedAt = now
	notification.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		notification.UserID,
		notification.Title,
		notification.Message,
		notification.Type,
		notification.IsRead,
		notification.CreatedAt,
		notification.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	notification.ID = id
	return notification, nil
}

func (r *NotificationRepository) FindByID(id int64) (*model.Notification, error) {
	query := `
		SELECT * FROM notifications WHERE id = ?
	`

	var notification model.Notification
	err := r.db.QueryRow(query, id).Scan(
		&notification.ID,
		&notification.UserID,
		&notification.Title,
		&notification.Message,
		&notification.Type,
		&notification.IsRead,
		&notification.CreatedAt,
		&notification.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &notification, nil
}

func (r *NotificationRepository) FindByUserID(userID int64, limit, offset int) ([]*model.Notification, error) {
	query := `
		SELECT * FROM notifications 
		WHERE user_id = ? 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []*model.Notification
	for rows.Next() {
		var notification model.Notification
		err := rows.Scan(
			&notification.ID,
			&notification.UserID,
			&notification.Title,
			&notification.Message,
			&notification.Type,
			&notification.IsRead,
			&notification.CreatedAt,
			&notification.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, &notification)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return notifications, nil
}

func (r *NotificationRepository) FindUnreadByUserID(userID int64, limit, offset int) ([]*model.Notification, error) {
	query := `
		SELECT * FROM notifications 
		WHERE user_id = ? AND is_read = FALSE 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []*model.Notification
	for rows.Next() {
		var notification model.Notification
		err := rows.Scan(
			&notification.ID,
			&notification.UserID,
			&notification.Title,
			&notification.Message,
			&notification.Type,
			&notification.IsRead,
			&notification.CreatedAt,
			&notification.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, &notification)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return notifications, nil
}

func (r *NotificationRepository) CountUnreadByUserID(userID int64) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE", userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *NotificationRepository) Update(notification *model.Notification) error {
	query := `
		UPDATE notifications SET
			user_id = ?,
			title = ?,
			message = ?,
			type = ?,
			is_read = ?,
			updated_at = ?
		WHERE id = ?
	`

	notification.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		notification.UserID,
		notification.Title,
		notification.Message,
		notification.Type,
		notification.IsRead,
		notification.UpdatedAt,
		notification.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *NotificationRepository) MarkAsRead(id int64) error {
	query := `
		UPDATE notifications SET
			is_read = TRUE,
			updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, time.Now(), id)
	if err != nil {
		return err
	}

	return nil
}

func (r *NotificationRepository) MarkAllAsRead(userID int64) error {
	query := `
		UPDATE notifications SET
			is_read = TRUE,
			updated_at = ?
		WHERE user_id = ? AND is_read = FALSE
	`

	_, err := r.db.Exec(query, time.Now(), userID)
	if err != nil {
		return err
	}

	return nil
}

func (r *NotificationRepository) Delete(id int64) error {
	query := `DELETE FROM notifications WHERE id = ?`

	_, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	return nil
}

func (r *NotificationRepository) DeleteAllByUserID(userID int64) error {
	query := `DELETE FROM notifications WHERE user_id = ?`

	_, err := r.db.Exec(query, userID)
	if err != nil {
		return err
	}

	return nil
}

// Create a notification for all users
func (r *NotificationRepository) CreateForAllUsers(title, message string, notificationType model.NotificationType) error {
	// Get all user IDs
	userIDsQuery := `SELECT id FROM users WHERE is_blocked = FALSE`
	rows, err := r.db.Query(userIDsQuery)
	if err != nil {
		return err
	}
	defer rows.Close()

	var userIDs []int64
	for rows.Next() {
		var userID int64
		if err := rows.Scan(&userID); err != nil {
			return err
		}
		userIDs = append(userIDs, userID)
	}

	if err = rows.Err(); err != nil {
		return err
	}

	// Begin transaction
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	// Insert notification for each user
	insertQuery := `
		INSERT INTO notifications (
			user_id, title, message, type, is_read, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	for _, userID := range userIDs {
		_, err := tx.Exec(
			insertQuery,
			userID,
			title,
			message,
			notificationType,
			false,
			now,
			now,
		)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}
