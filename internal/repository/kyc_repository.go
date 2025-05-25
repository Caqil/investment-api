package repository

import (
	"database/sql"
	"time"

	"github.com/Caqil/investment-api/internal/model"
)

type KYCRepository struct {
	db *sql.DB
}

func NewKYCRepository(db *sql.DB) *KYCRepository {
	return &KYCRepository{
		db: db,
	}
}

func (r *KYCRepository) Create(kyc *model.KYCDocument) (*model.KYCDocument, error) {
	query := `
		INSERT INTO kyc_documents (
			user_id, document_type, document_front_url, document_back_url,
			selfie_url, status, admin_note, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	kyc.CreatedAt = now
	kyc.UpdatedAt = now

	result, err := r.db.Exec(
		query,
		kyc.UserID,
		kyc.DocumentType,
		kyc.DocumentFrontURL,
		kyc.DocumentBackURL,
		kyc.SelfieURL,
		kyc.Status,
		kyc.AdminNote,
		kyc.CreatedAt,
		kyc.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	kyc.ID = id
	return kyc, nil
}

func (r *KYCRepository) FindByID(id int64) (*model.KYCDocument, error) {
	query := `
		SELECT * FROM kyc_documents WHERE id = ?
	`

	var kyc model.KYCDocument
	err := r.db.QueryRow(query, id).Scan(
		&kyc.ID,
		&kyc.UserID,
		&kyc.DocumentType,
		&kyc.DocumentFrontURL,
		&kyc.DocumentBackURL,
		&kyc.SelfieURL,
		&kyc.Status,
		&kyc.AdminNote,
		&kyc.CreatedAt,
		&kyc.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &kyc, nil
}

func (r *KYCRepository) FindByUserID(userID int64) (*model.KYCDocument, error) {
	query := `
		SELECT * FROM kyc_documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
	`

	var kyc model.KYCDocument
	err := r.db.QueryRow(query, userID).Scan(
		&kyc.ID,
		&kyc.UserID,
		&kyc.DocumentType,
		&kyc.DocumentFrontURL,
		&kyc.DocumentBackURL,
		&kyc.SelfieURL,
		&kyc.Status,
		&kyc.AdminNote,
		&kyc.CreatedAt,
		&kyc.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &kyc, nil
}

func (r *KYCRepository) FindByStatus(status model.KYCStatus, limit, offset int) ([]*model.KYCDocument, error) {
	query := `
		SELECT * FROM kyc_documents 
		WHERE status = ? 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []*model.KYCDocument
	for rows.Next() {
		var doc model.KYCDocument
		err := rows.Scan(
			&doc.ID,
			&doc.UserID,
			&doc.DocumentType,
			&doc.DocumentFrontURL,
			&doc.DocumentBackURL,
			&doc.SelfieURL,
			&doc.Status,
			&doc.AdminNote,
			&doc.CreatedAt,
			&doc.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, &doc)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return documents, nil
}

func (r *KYCRepository) FindAll(limit, offset int) ([]*model.KYCDocument, error) {
	query := `
		SELECT * FROM kyc_documents 
		ORDER BY created_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []*model.KYCDocument
	for rows.Next() {
		var doc model.KYCDocument
		err := rows.Scan(
			&doc.ID,
			&doc.UserID,
			&doc.DocumentType,
			&doc.DocumentFrontURL,
			&doc.DocumentBackURL,
			&doc.SelfieURL,
			&doc.Status,
			&doc.AdminNote,
			&doc.CreatedAt,
			&doc.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, &doc)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return documents, nil
}

func (r *KYCRepository) Update(kyc *model.KYCDocument) error {
	query := `
		UPDATE kyc_documents SET
			user_id = ?,
			document_type = ?,
			document_front_url = ?,
			document_back_url = ?,
			selfie_url = ?,
			status = ?,
			admin_note = ?,
			updated_at = ?
		WHERE id = ?
	`

	kyc.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		kyc.UserID,
		kyc.DocumentType,
		kyc.DocumentFrontURL,
		kyc.DocumentBackURL,
		kyc.SelfieURL,
		kyc.Status,
		kyc.AdminNote,
		kyc.UpdatedAt,
		kyc.ID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *KYCRepository) UpdateStatus(id int64, status model.KYCStatus, adminNote string) error {
	query := `
		UPDATE kyc_documents SET
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

func (r *KYCRepository) CountByStatus(status model.KYCStatus) (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM kyc_documents WHERE status = ?", status).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}
