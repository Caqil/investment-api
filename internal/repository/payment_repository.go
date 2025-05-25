package repository

import (
	"database/sql"
	"encoding/json"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type PaymentRepository struct {
	db *sql.DB
}

func NewPaymentRepository(db *sql.DB) *PaymentRepository {
	return &PaymentRepository{
		db: db,
	}
}

// GetDB returns the database connection
func (r *PaymentRepository) GetDB() *sql.DB {
	return r.db
}

func (r *PaymentRepository) Create(payment *model.Payment) (*model.Payment, error) {
	query := `
		INSERT INTO payments (
			transaction_id, gateway, gateway_reference, currency, amount,
			status, metadata, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	// Convert metadata to JSON
	metadataJSON, err := json.Marshal(payment.Metadata)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	payment.CreatedAt = now
	payment.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		payment.TransactionID,
		payment.Gateway,
		payment.GatewayReference,
		payment.Currency,
		payment.Amount,
		payment.Status,
		metadataJSON,
		payment.CreatedAt,
		payment.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	payment.ID = id
	return payment, nil
}

func (r *PaymentRepository) FindByID(id int64) (*model.Payment, error) {
	query := `
		SELECT * FROM payments WHERE id = ?
	`

	var payment model.Payment
	var metadataJSON []byte

	err := r.db.QueryRow(query, id).Scan(
		&payment.ID,
		&payment.TransactionID,
		&payment.Gateway,
		&payment.GatewayReference,
		&payment.Currency,
		&payment.Amount,
		&payment.Status,
		&metadataJSON,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Parse metadata JSON
	var metadata model.JSON
	if err := json.Unmarshal(metadataJSON, &metadata); err != nil {
		return nil, err
	}
	payment.Metadata = metadata

	return &payment, nil
}

func (r *PaymentRepository) FindByTransactionID(transactionID int64) (*model.Payment, error) {
	query := `
		SELECT * FROM payments WHERE transaction_id = ?
	`

	var payment model.Payment
	var metadataJSON []byte

	err := r.db.QueryRow(query, transactionID).Scan(
		&payment.ID,
		&payment.TransactionID,
		&payment.Gateway,
		&payment.GatewayReference,
		&payment.Currency,
		&payment.Amount,
		&payment.Status,
		&metadataJSON,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Parse metadata JSON
	var metadata model.JSON
	if err := json.Unmarshal(metadataJSON, &metadata); err != nil {
		return nil, err
	}
	payment.Metadata = metadata

	return &payment, nil
}

func (r *PaymentRepository) FindByGatewayReference(gatewayReference string) (*model.Payment, error) {
	query := `
		SELECT * FROM payments WHERE gateway_reference = ?
	`

	var payment model.Payment
	var metadataJSON []byte

	err := r.db.QueryRow(query, gatewayReference).Scan(
		&payment.ID,
		&payment.TransactionID,
		&payment.Gateway,
		&payment.GatewayReference,
		&payment.Currency,
		&payment.Amount,
		&payment.Status,
		&metadataJSON,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	// Parse metadata JSON
	var metadata model.JSON
	if err := json.Unmarshal(metadataJSON, &metadata); err != nil {
		return nil, err
	}
	payment.Metadata = metadata

	return &payment, nil
}

func (r *PaymentRepository) FindByGatewayAndStatus(
	gateway model.PaymentGateway,
	status model.PaymentStatus,
	limit, offset int,
) ([]*model.Payment, error) {
	query := `
		SELECT * FROM payments 
		WHERE gateway = ? AND status = ? 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, gateway, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []*model.Payment
	for rows.Next() {
		var payment model.Payment
		var metadataJSON []byte

		err := rows.Scan(
			&payment.ID,
			&payment.TransactionID,
			&payment.Gateway,
			&payment.GatewayReference,
			&payment.Currency,
			&payment.Amount,
			&payment.Status,
			&metadataJSON,
			&payment.CreatedAt,
			&payment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse metadata JSON
		var metadata model.JSON
		if err := json.Unmarshal(metadataJSON, &metadata); err != nil {
			return nil, err
		}
		payment.Metadata = metadata

		payments = append(payments, &payment)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return payments, nil
}

func (r *PaymentRepository) Update(payment *model.Payment) error {
	query := `
		UPDATE payments SET
			transaction_id = ?,
			gateway = ?,
			gateway_reference = ?,
			currency = ?,
			amount = ?,
			status = ?,
			metadata = ?,
			updated_at = ?
		WHERE id = ?
	`

	// Convert metadata to JSON
	metadataJSON, err := json.Marshal(payment.Metadata)
	if err != nil {
		return err
	}

	payment.UpdatedAt = time.Now()

	_, err = r.db.Exec(
		query,
		payment.TransactionID,
		payment.Gateway,
		payment.GatewayReference,
		payment.Currency,
		payment.Amount,
		payment.Status,
		metadataJSON,
		payment.UpdatedAt,
		payment.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *PaymentRepository) UpdateStatus(id int64, status model.PaymentStatus) error {
	query := `
		UPDATE payments SET
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

// CountByGatewayAndStatus counts the number of payments with a specific gateway and status
func (r *PaymentRepository) CountByGatewayAndStatus(gateway model.PaymentGateway, status model.PaymentStatus) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM payments WHERE gateway = ? AND status = ?", gateway, status).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}
