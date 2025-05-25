package repository

import (
	"database/sql"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type DeviceRepository struct {
	db *sql.DB
}

func NewDeviceRepository(db *sql.DB) *DeviceRepository {
	return &DeviceRepository{
		db: db,
	}
}

func (r *DeviceRepository) Create(device *model.Device) (*model.Device, error) {
	query := `
		INSERT INTO devices (
			user_id, device_id, device_name, device_model,
			last_login, is_active, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	device.CreatedAt = now
	device.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		device.UserID,
		device.DeviceID,
		device.DeviceName,
		device.DeviceModel,
		device.LastLogin,
		device.IsActive,
		device.CreatedAt,
		device.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	device.ID = id
	return device, nil
}

func (r *DeviceRepository) FindByID(id int64) (*model.Device, error) {
	query := `
		SELECT * FROM devices WHERE id = ?
	`

	var device model.Device
	var lastLogin sql.NullTime

	err := r.db.QueryRow(query, id).Scan(
		&device.ID,
		&device.UserID,
		&device.DeviceID,
		&device.DeviceName,
		&device.DeviceModel,
		&lastLogin,
		&device.IsActive,
		&device.CreatedAt,
		&device.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if lastLogin.Valid {
		device.LastLogin = &lastLogin.Time
	}

	return &device, nil
}

func (r *DeviceRepository) FindByDeviceID(deviceID string) (*model.Device, error) {
	query := `
		SELECT * FROM devices WHERE device_id = ?
	`

	var device model.Device
	var lastLogin sql.NullTime

	err := r.db.QueryRow(query, deviceID).Scan(
		&device.ID,
		&device.UserID,
		&device.DeviceID,
		&device.DeviceName,
		&device.DeviceModel,
		&lastLogin,
		&device.IsActive,
		&device.CreatedAt,
		&device.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if lastLogin.Valid {
		device.LastLogin = &lastLogin.Time
	}

	return &device, nil
}

func (r *DeviceRepository) FindByUserID(userID int64) ([]*model.Device, error) {
	query := `
		SELECT * FROM devices WHERE user_id = ?
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var devices []*model.Device
	for rows.Next() {
		var device model.Device
		var lastLogin sql.NullTime

		err := rows.Scan(
			&device.ID,
			&device.UserID,
			&device.DeviceID,
			&device.DeviceName,
			&device.DeviceModel,
			&lastLogin,
			&device.IsActive,
			&device.CreatedAt,
			&device.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if lastLogin.Valid {
			device.LastLogin = &lastLogin.Time
		}

		devices = append(devices, &device)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return devices, nil
}

func (r *DeviceRepository) UpdateLastLogin(deviceID string, lastLogin time.Time) error {
	query := `
		UPDATE devices SET
			last_login = ?,
			updated_at = ?
		WHERE device_id = ?
	`

	_, err := r.db.Exec(query, lastLogin, time.Now(), deviceID)
	if err != nil {
		return err
	}

	return nil
}

func (r *DeviceRepository) UpdateActive(deviceID string, isActive bool) error {
	query := `
		UPDATE devices SET
			is_active = ?,
			updated_at = ?
		WHERE device_id = ?
	`

	_, err := r.db.Exec(query, isActive, time.Now(), deviceID)
	if err != nil {
		return err
	}

	return nil
}

func (r *DeviceRepository) Delete(id int64) error {
	query := `DELETE FROM devices WHERE id = ?`

	_, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	return nil
}
