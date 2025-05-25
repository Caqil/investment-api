package repository

import (
	"database/sql"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type UserRepository struct {
	db *sql.DB
}

func (r *UserRepository) GetDB() *sql.DB {
	return r.db
}
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

func (r *UserRepository) Create(user *model.User) (*model.User, error) {
	query := `
		INSERT INTO users (
			name, email, password_hash, phone, balance, referral_code, 
			referred_by, plan_id, is_kyc_verified, email_verified, is_admin, 
			is_blocked, biometric_enabled, profile_pic_url, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		user.Name,
		user.Email,
		user.PasswordHash,
		user.Phone,
		user.Balance,
		user.ReferralCode,
		user.ReferredBy,
		user.PlanID,
		user.IsKYCVerified,
		user.EmailVerified,
		user.IsAdmin,
		user.IsBlocked,
		user.BiometricEnabled,
		user.ProfilePicURL,
		user.CreatedAt,
		user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	user.ID = id
	return user, nil
}

func (r *UserRepository) FindByID(id int64) (*model.User, error) {
	query := `
		SELECT * FROM users WHERE id = ?
	`

	var user model.User
	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.Phone,
		&user.Balance,
		&user.ReferralCode,
		&user.ReferredBy,
		&user.PlanID,
		&user.IsKYCVerified,
		&user.EmailVerified,
		&user.IsAdmin,
		&user.IsBlocked,
		&user.BiometricEnabled,
		&user.ProfilePicURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	query := `
		SELECT * FROM users WHERE email = ?
	`

	var user model.User
	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.Phone,
		&user.Balance,
		&user.ReferralCode,
		&user.ReferredBy,
		&user.PlanID,
		&user.IsKYCVerified,
		&user.EmailVerified,
		&user.IsAdmin,
		&user.IsBlocked,
		&user.BiometricEnabled,
		&user.ProfilePicURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) FindByReferralCode(code string) (*model.User, error) {
	query := `
		SELECT * FROM users WHERE referral_code = ?
	`

	var user model.User
	err := r.db.QueryRow(query, code).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.Phone,
		&user.Balance,
		&user.ReferralCode,
		&user.ReferredBy,
		&user.PlanID,
		&user.IsKYCVerified,
		&user.EmailVerified,
		&user.IsAdmin,
		&user.IsBlocked,
		&user.BiometricEnabled,
		&user.ProfilePicURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) Update(user *model.User) error {
	query := `
		UPDATE users SET
			name = ?,
			email = ?,
			password_hash = ?,
			phone = ?,
			balance = ?,
			referral_code = ?,
			referred_by = ?,
			plan_id = ?,
			is_kyc_verified = ?,
			email_verified = ?,
			is_admin = ?,
			is_blocked = ?,
			biometric_enabled = ?,
			profile_pic_url = ?,
			updated_at = ?
		WHERE id = ?
	`

	user.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		user.Name,
		user.Email,
		user.PasswordHash,
		user.Phone,
		user.Balance,
		user.ReferralCode,
		user.ReferredBy,
		user.PlanID,
		user.IsKYCVerified,
		user.EmailVerified,
		user.IsAdmin,
		user.IsBlocked,
		user.BiometricEnabled,
		user.ProfilePicURL,
		user.UpdatedAt,
		user.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *UserRepository) UpdateBalance(id int64, amount float64) error {
	query := `
		UPDATE users SET
			balance = balance + ?,
			updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, amount, time.Now(), id)
	if err != nil {
		return err
	}

	return nil
}

func (r *UserRepository) FindReferrals(userID int64) ([]*model.User, error) {
	query := `
		SELECT * FROM users WHERE referred_by = ?
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		var user model.User
		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.PasswordHash,
			&user.Phone,
			&user.Balance,
			&user.ReferralCode,
			&user.ReferredBy,
			&user.PlanID,
			&user.IsKYCVerified,
			&user.EmailVerified,
			&user.IsAdmin,
			&user.IsBlocked,
			&user.BiometricEnabled,
			&user.ProfilePicURL,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *UserRepository) FindAll(limit, offset int) ([]*model.User, error) {
	query := `
		SELECT * FROM users 
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		var user model.User
		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
			&user.PasswordHash,
			&user.Phone,
			&user.Balance,
			&user.ReferralCode,
			&user.ReferredBy,
			&user.PlanID,
			&user.IsKYCVerified,
			&user.EmailVerified,
			&user.IsAdmin,
			&user.IsBlocked,
			&user.BiometricEnabled,
			&user.ProfilePicURL,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (r *UserRepository) CountAll() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}
