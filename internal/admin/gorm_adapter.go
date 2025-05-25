package admin

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
)

// GORMAdapter converts a standard database/sql.DB to a GORM DB
func GORMAdapter(db *sql.DB, dbType string) (*gorm.DB, error) {
	// Create a DSN from the existing connection
	connStr := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&loc=Local",
		os.Getenv("DB_USERNAME"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"))

	// Open a new GORM connection
	gormDB, err := gorm.Open(dbType, connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize GORM: %v", err)
	}

	// Enable logging for debugging
	gormDB.LogMode(true)

	return gormDB, nil
}
