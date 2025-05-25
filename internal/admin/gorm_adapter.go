package admin

import (
	"database/sql"
	"fmt"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

// GORMAdapter converts a standard database/sql.DB to a GORM DB
func GORMAdapter(db *sql.DB, dbType string) (*gorm.DB, error) {
	// Create new GORM connection using the existing *sql.DB
	gormDB, err := gorm.Open(dbType, db)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize GORM: %v", err)
	}

	// Auto-migrate the schema
	if err := autoMigrateSchema(gormDB); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate schema: %v", err)
	}

	return gormDB, nil
}

// autoMigrateSchema ensures all models are migrated in GORM
func autoMigrateSchema(db *gorm.DB) error {
	// Register the models for GORM
	db.AutoMigrate(
		&model.User{},
		&model.Plan{},
		&model.Transaction{},
		&model.Payment{},
		&model.Withdrawal{},
		&model.Task{},
		&model.UserTask{},
		&model.KYCDocument{},
		&model.Device{},
		&model.Notification{},
		&model.News{},
		&model.FAQ{},
	)

	return nil
}
