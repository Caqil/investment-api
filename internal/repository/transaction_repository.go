package repository

import (
	"database/sql"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type TransactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) *TransactionRepository {
	return &TransactionRepository{
		db: db,
	}
}

// GetDB returns the database connection
func (r *TransactionRepository) GetDB() *sql.DB {
	return r.db
}

func (r *TransactionRepository) Create(transaction *model.Transaction) (*model.Transaction, error) {
	query := `
		INSERT INTO transactions (
			user_id, amount, type, status, reference_id, description, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	transaction.CreatedAt = now
	transaction.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		transaction.UserID,
		transaction.Amount,
		transaction.Type,
		transaction.Status,
		transaction.ReferenceID,
		transaction.Description,
		transaction.CreatedAt,
		transaction.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	transaction.ID = id
	return transaction, nil
}

func (r *TransactionRepository) FindByID(id int64) (*model.Transaction, error) {
	query := `
		SELECT * FROM transactions WHERE id = ?
	`

	var transaction model.Transaction
	err := r.db.QueryRow(query, id).Scan(
		&transaction.ID,
		&transaction.UserID,
		&transaction.Amount,
		&transaction.Type,
		&transaction.Status,
		&transaction.ReferenceID,
		&transaction.Description,
		&transaction.CreatedAt,
		&transaction.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &transaction, nil
}

func (r *TransactionRepository) FindByUserID(userID int64, limit, offset int) ([]*model.Transaction, error) {
	query := `
		SELECT * FROM transactions 
		WHERE user_id = ? 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*model.Transaction
	for rows.Next() {
		var transaction model.Transaction
		err := rows.Scan(
			&transaction.ID,
			&transaction.UserID,
			&transaction.Amount,
			&transaction.Type,
			&transaction.Status,
			&transaction.ReferenceID,
			&transaction.Description,
			&transaction.CreatedAt,
			&transaction.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) FindByTypeAndUserID(
	userID int64,
	transactionType model.TransactionType,
	startDate, endDate time.Time,
) ([]*model.Transaction, error) {
	query := `
		SELECT * FROM transactions 
		WHERE user_id = ? AND type = ? AND created_at BETWEEN ? AND ?
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID, transactionType, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*model.Transaction
	for rows.Next() {
		var transaction model.Transaction
		err := rows.Scan(
			&transaction.ID,
			&transaction.UserID,
			&transaction.Amount,
			&transaction.Type,
			&transaction.Status,
			&transaction.ReferenceID,
			&transaction.Description,
			&transaction.CreatedAt,
			&transaction.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) CountByUserID(userID int64) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM transactions WHERE user_id = ?", userID).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *TransactionRepository) Update(transaction *model.Transaction) error {
	query := `
		UPDATE transactions SET
			user_id = ?,
			amount = ?,
			type = ?,
			status = ?,
			reference_id = ?,
			description = ?,
			updated_at = ?
		WHERE id = ?
	`

	transaction.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		transaction.UserID,
		transaction.Amount,
		transaction.Type,
		transaction.Status,
		transaction.ReferenceID,
		transaction.Description,
		transaction.UpdatedAt,
		transaction.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *TransactionRepository) UpdateStatus(id int64, status model.TransactionStatus) error {
	query := `
		UPDATE transactions SET
			status = ?,
			updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.Exec(query, status, time.Now(), id)
	if err != nil {
		return err
	}

	return nil
}

// FindByTypeAndDate finds transactions of a specific type within a date range
func (r *TransactionRepository) FindByTypeAndDate(
	transactionType model.TransactionType,
	startDate, endDate time.Time,
) ([]*model.Transaction, error) {
	query := `
		SELECT * FROM transactions 
		WHERE type = ? AND created_at BETWEEN ? AND ?
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, transactionType, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*model.Transaction
	for rows.Next() {
		var transaction model.Transaction
		err := rows.Scan(
			&transaction.ID,
			&transaction.UserID,
			&transaction.Amount,
			&transaction.Type,
			&transaction.Status,
			&transaction.ReferenceID,
			&transaction.Description,
			&transaction.CreatedAt,
			&transaction.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

// FindProfitTransactionsByUserIDAndDate finds profit transactions for a user within a date range
func (r *TransactionRepository) FindProfitTransactionsByUserIDAndDate(
	userID int64,
	startDate, endDate time.Time,
) ([]*model.Transaction, error) {
	query := `
		SELECT * FROM transactions 
		WHERE user_id = ? AND type = ? AND created_at BETWEEN ? AND ? AND status = ?
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(
		query,
		userID,
		model.TransactionTypeBonus,
		startDate,
		endDate,
		model.TransactionStatusCompleted,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*model.Transaction
	for rows.Next() {
		var transaction model.Transaction
		err := rows.Scan(
			&transaction.ID,
			&transaction.UserID,
			&transaction.Amount,
			&transaction.Type,
			&transaction.Status,
			&transaction.ReferenceID,
			&transaction.Description,
			&transaction.CreatedAt,
			&transaction.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

// GetTotalProfitByUserIDAndDate calculates the total profit for a user within a date range
func (r *TransactionRepository) GetTotalProfitByUserIDAndDate(
	userID int64,
	startDate, endDate time.Time,
) (float64, error) {
	query := `
		SELECT COALESCE(SUM(amount), 0) FROM transactions 
		WHERE user_id = ? AND type = ? AND created_at BETWEEN ? AND ? AND status = ?
	`

	var total float64
	err := r.db.QueryRow(
		query,
		userID,
		model.TransactionTypeBonus,
		startDate,
		endDate,
		model.TransactionStatusCompleted,
	).Scan(&total)
	if err != nil {
		return 0, err
	}

	return total, nil
}

// GetDailyTransactionTotalByUserIDAndType calculates the total transactions of a specific type for a user on a given day
func (r *TransactionRepository) GetDailyTransactionTotalByUserIDAndType(
	userID int64,
	transactionType model.TransactionType,
	date time.Time,
) (float64, error) {
	// Get start and end of the day
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	query := `
		SELECT COALESCE(SUM(amount), 0) FROM transactions 
		WHERE user_id = ? AND type = ? AND created_at BETWEEN ? AND ? AND status = ?
	`

	var total float64
	err := r.db.QueryRow(
		query,
		userID,
		transactionType,
		startOfDay,
		endOfDay,
		model.TransactionStatusCompleted,
	).Scan(&total)
	if err != nil {
		return 0, err
	}

	return total, nil
}

// GetTransactionsByStatus gets transactions with a specific status
func (r *TransactionRepository) GetTransactionsByStatus(
	status model.TransactionStatus,
	limit, offset int,
) ([]*model.Transaction, error) {
	query := `
		SELECT * FROM transactions 
		WHERE status = ? 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*model.Transaction
	for rows.Next() {
		var transaction model.Transaction
		err := rows.Scan(
			&transaction.ID,
			&transaction.UserID,
			&transaction.Amount,
			&transaction.Type,
			&transaction.Status,
			&transaction.ReferenceID,
			&transaction.Description,
			&transaction.CreatedAt,
			&transaction.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}

// GetTransactionsByTypeAndStatus gets transactions with a specific type and status
func (r *TransactionRepository) GetTransactionsByTypeAndStatus(
	transactionType model.TransactionType,
	status model.TransactionStatus,
	limit, offset int,
) ([]*model.Transaction, error) {
	query := `
		SELECT * FROM transactions 
		WHERE type = ? AND status = ? 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, transactionType, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []*model.Transaction
	for rows.Next() {
		var transaction model.Transaction
		err := rows.Scan(
			&transaction.ID,
			&transaction.UserID,
			&transaction.Amount,
			&transaction.Type,
			&transaction.Status,
			&transaction.ReferenceID,
			&transaction.Description,
			&transaction.CreatedAt,
			&transaction.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return transactions, nil
}
