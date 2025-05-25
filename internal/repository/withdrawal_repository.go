package repository

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type WithdrawalRepository struct {
	db *sql.DB
}

func NewWithdrawalRepository(db *sql.DB) *WithdrawalRepository {
	return &WithdrawalRepository{
		db: db,
	}
}

// GetDB returns the database connection
func (r *WithdrawalRepository) GetDB() *sql.DB {
	return r.db
}

func (r *WithdrawalRepository) Create(withdrawal *model.Withdrawal) (*model.Withdrawal, error) {
	query := `
		INSERT INTO withdrawals (
			transaction_id, user_id, amount, payment_method, payment_details,
			status, admin_note, tasks_completed, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	// Convert payment details to JSON
	paymentDetailsJSON, err := json.Marshal(withdrawal.PaymentDetails)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	withdrawal.CreatedAt = now
	withdrawal.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		withdrawal.TransactionID,
		withdrawal.UserID,
		withdrawal.Amount,
		withdrawal.PaymentMethod,
		paymentDetailsJSON,
		withdrawal.Status,
		withdrawal.AdminNote,
		withdrawal.TasksCompleted,
		withdrawal.CreatedAt,
		withdrawal.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	withdrawal.ID = id
	return withdrawal, nil
}

func (r *WithdrawalRepository) FindByID(id int64) (*model.Withdrawal, error) {
	query := `
		SELECT * FROM withdrawals WHERE id = ?
	`

	var withdrawal model.Withdrawal
	var paymentDetailsJSON []byte

	err := r.db.QueryRow(query, id).Scan(
		&withdrawal.ID,
		&withdrawal.TransactionID,
		&withdrawal.UserID,
		&withdrawal.Amount,
		&withdrawal.PaymentMethod,
		&paymentDetailsJSON,
		&withdrawal.Status,
		&withdrawal.AdminNote,
		&withdrawal.TasksCompleted,
		&withdrawal.CreatedAt,
		&withdrawal.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Parse payment details JSON
	var paymentDetails model.PaymentDetails
	if err := json.Unmarshal(paymentDetailsJSON, &paymentDetails); err != nil {
		return nil, err
	}
	withdrawal.PaymentDetails = paymentDetails

	return &withdrawal, nil
}

func (r *WithdrawalRepository) FindByUserID(userID int64, limit, offset int) ([]*model.Withdrawal, error) {
	query := `
		SELECT * FROM withdrawals 
		WHERE user_id = ? 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var withdrawals []*model.Withdrawal
	for rows.Next() {
		var withdrawal model.Withdrawal
		var paymentDetailsJSON []byte

		err := rows.Scan(
			&withdrawal.ID,
			&withdrawal.TransactionID,
			&withdrawal.UserID,
			&withdrawal.Amount,
			&withdrawal.PaymentMethod,
			&paymentDetailsJSON,
			&withdrawal.Status,
			&withdrawal.AdminNote,
			&withdrawal.TasksCompleted,
			&withdrawal.CreatedAt,
			&withdrawal.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse payment details JSON
		var paymentDetails model.PaymentDetails
		if err := json.Unmarshal(paymentDetailsJSON, &paymentDetails); err != nil {
			return nil, err
		}
		withdrawal.PaymentDetails = paymentDetails

		withdrawals = append(withdrawals, &withdrawal)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return withdrawals, nil
}

func (r *WithdrawalRepository) FindByStatus(status model.WithdrawalStatus, limit, offset int) ([]*model.Withdrawal, error) {
	query := `
		SELECT * FROM withdrawals 
		WHERE status = ? 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var withdrawals []*model.Withdrawal
	for rows.Next() {
		var withdrawal model.Withdrawal
		var paymentDetailsJSON []byte

		err := rows.Scan(
			&withdrawal.ID,
			&withdrawal.TransactionID,
			&withdrawal.UserID,
			&withdrawal.Amount,
			&withdrawal.PaymentMethod,
			&paymentDetailsJSON,
			&withdrawal.Status,
			&withdrawal.AdminNote,
			&withdrawal.TasksCompleted,
			&withdrawal.CreatedAt,
			&withdrawal.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse payment details JSON
		var paymentDetails model.PaymentDetails
		if err := json.Unmarshal(paymentDetailsJSON, &paymentDetails); err != nil {
			return nil, err
		}
		withdrawal.PaymentDetails = paymentDetails

		withdrawals = append(withdrawals, &withdrawal)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return withdrawals, nil
}

func (r *WithdrawalRepository) FindAll(limit, offset int) ([]*model.Withdrawal, error) {
	query := `
		SELECT * FROM withdrawals 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var withdrawals []*model.Withdrawal
	for rows.Next() {
		var withdrawal model.Withdrawal
		var paymentDetailsJSON []byte

		err := rows.Scan(
			&withdrawal.ID,
			&withdrawal.TransactionID,
			&withdrawal.UserID,
			&withdrawal.Amount,
			&withdrawal.PaymentMethod,
			&paymentDetailsJSON,
			&withdrawal.Status,
			&withdrawal.AdminNote,
			&withdrawal.TasksCompleted,
			&withdrawal.CreatedAt,
			&withdrawal.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse payment details JSON
		var paymentDetails model.PaymentDetails
		if err := json.Unmarshal(paymentDetailsJSON, &paymentDetails); err != nil {
			return nil, err
		}
		withdrawal.PaymentDetails = paymentDetails

		withdrawals = append(withdrawals, &withdrawal)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return withdrawals, nil
}

func (r *WithdrawalRepository) CountByStatus(status model.WithdrawalStatus) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM withdrawals WHERE status = ?", status).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WithdrawalRepository) CountByUserID(userID int64) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM withdrawals WHERE user_id = ?", userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *WithdrawalRepository) Update(withdrawal *model.Withdrawal) error {
	query := `
		UPDATE withdrawals SET
			transaction_id = ?,
			user_id = ?,
			amount = ?,
			payment_method = ?,
			payment_details = ?,
			status = ?,
			admin_note = ?,
			tasks_completed = ?,
			updated_at = ?
		WHERE id = ?
	`

	// Convert payment details to JSON
	paymentDetailsJSON, err := json.Marshal(withdrawal.PaymentDetails)
	if err != nil {
		return err
	}

	withdrawal.UpdatedAt = time.Now()

	_, err = r.db.Exec(
		query,
		withdrawal.TransactionID,
		withdrawal.UserID,
		withdrawal.Amount,
		withdrawal.PaymentMethod,
		paymentDetailsJSON,
		withdrawal.Status,
		withdrawal.AdminNote,
		withdrawal.TasksCompleted,
		withdrawal.UpdatedAt,
		withdrawal.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *WithdrawalRepository) UpdateStatus(id int64, status model.WithdrawalStatus, adminNote string) error {
	query := `
		UPDATE withdrawals SET
			status = ?,
			admin_note = ?,
			updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, status, adminNote, time.Now(), id)
	if err != nil {
		return err
	}

	return nil
}

// FindByTransactionID finds a withdrawal by transaction ID
func (r *WithdrawalRepository) FindByTransactionID(transactionID int64) (*model.Withdrawal, error) {
	query := `
		SELECT * FROM withdrawals WHERE transaction_id = ?
	`

	var withdrawal model.Withdrawal
	var paymentDetailsJSON []byte

	err := r.db.QueryRow(query, transactionID).Scan(
		&withdrawal.ID,
		&withdrawal.TransactionID,
		&withdrawal.UserID,
		&withdrawal.Amount,
		&withdrawal.PaymentMethod,
		&paymentDetailsJSON,
		&withdrawal.Status,
		&withdrawal.AdminNote,
		&withdrawal.TasksCompleted,
		&withdrawal.CreatedAt,
		&withdrawal.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Parse payment details JSON
	var paymentDetails model.PaymentDetails
	if err := json.Unmarshal(paymentDetailsJSON, &paymentDetails); err != nil {
		return nil, err
	}
	withdrawal.PaymentDetails = paymentDetails

	return &withdrawal, nil
}
