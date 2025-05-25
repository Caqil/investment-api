package repository

import (
	"database/sql"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type PlanRepository struct {
	db *sql.DB
}


func NewPlanRepository(db *sql.DB) *PlanRepository {
	return &PlanRepository{
		db: db,
	}
}

func (r *PlanRepository) Create(plan *model.Plan) (*model.Plan, error) {
	query := `
		INSERT INTO plans (
			name, daily_deposit_limit, daily_withdrawal_limit, daily_profit_limit,
			price, is_default, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	plan.CreatedAt = now
	plan.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		plan.Name,
		plan.DailyDepositLimit,
		plan.DailyWithdrawalLimit,
		plan.DailyProfitLimit,
		plan.Price,
		plan.IsDefault,
		plan.CreatedAt,
		plan.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	plan.ID = id
	return plan, nil
}

func (r *PlanRepository) FindByID(id int64) (*model.Plan, error) {
	query := `
		SELECT * FROM plans WHERE id = ?
	`

	var plan model.Plan
	err := r.db.QueryRow(query, id).Scan(
		&plan.ID,
		&plan.Name,
		&plan.DailyDepositLimit,
		&plan.DailyWithdrawalLimit,
		&plan.DailyProfitLimit,
		&plan.Price,
		&plan.IsDefault,
		&plan.CreatedAt,
		&plan.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &plan, nil
}

func (r *PlanRepository) FindAll() ([]*model.Plan, error) {
	query := `
		SELECT * FROM plans ORDER BY price ASC
	`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []*model.Plan
	for rows.Next() {
		var plan model.Plan
		err := rows.Scan(
			&plan.ID,
			&plan.Name,
			&plan.DailyDepositLimit,
			&plan.DailyWithdrawalLimit,
			&plan.DailyProfitLimit,
			&plan.Price,
			&plan.IsDefault,
			&plan.CreatedAt,
			&plan.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		plans = append(plans, &plan)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return plans, nil
}

func (r *PlanRepository) FindDefault() (*model.Plan, error) {
	query := `
		SELECT * FROM plans WHERE is_default = TRUE LIMIT 1
	`

	var plan model.Plan
	err := r.db.QueryRow(query).Scan(
		&plan.ID,
		&plan.Name,
		&plan.DailyDepositLimit,
		&plan.DailyWithdrawalLimit,
		&plan.DailyProfitLimit,
		&plan.Price,
		&plan.IsDefault,
		&plan.CreatedAt,
		&plan.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &plan, nil
}

func (r *PlanRepository) Update(plan *model.Plan) error {
	query := `
		UPDATE plans SET
			name = ?,
			daily_deposit_limit = ?,
			daily_withdrawal_limit = ?,
			daily_profit_limit = ?,
			price = ?,
			is_default = ?,
			updated_at = ?
		WHERE id = ?
	`

	plan.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		plan.Name,
		plan.DailyDepositLimit,
		plan.DailyWithdrawalLimit,
		plan.DailyProfitLimit,
		plan.Price,
		plan.IsDefault,
		plan.UpdatedAt,
		plan.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *PlanRepository) Delete(id int64) error {
	query := `DELETE FROM plans WHERE id = ?`

	_, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	return nil
}

func (r *PlanRepository) SetDefault(id int64) error {
	// Begin transaction
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	// Set all plans as non-default
	_, err = tx.Exec("UPDATE plans SET is_default = FALSE, updated_at = ?", time.Now())
	if err != nil {
		tx.Rollback()
		return err
	}

	// If id is 0, we're just removing all defaults
	if id > 0 {
		// Set the specified plan as default
		_, err = tx.Exec("UPDATE plans SET is_default = TRUE, updated_at = ? WHERE id = ?", time.Now(), id)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	// Commit transaction
	return tx.Commit()
}
