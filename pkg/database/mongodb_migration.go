package database

import (
	"context"
	"log"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// RunMongoDBMigrations sets up the MongoDB collections and indexes
func RunMongoDBMigrations(conn *MongoDBConnection) error {
	// Create a context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Create collections if they don't exist
	collections := []string{
		"users",
		"plans",
		"transactions",
		"payments",
		"withdrawals",
		"tasks",
		"user_tasks",
		"kyc_documents",
		"devices",
		"notifications",
		"support_tickets",
		"support_messages",
		"news",
		"faqs",
		"counters", // For auto-incrementing IDs
	}

	for _, collName := range collections {
		err := createCollection(ctx, conn.Database, collName)
		if err != nil {
			return err
		}
	}

	// Create indexes
	err := CreateIndexes(conn.Database)
	if err != nil {
		return err
	}

	// Seed initial data if collections are empty
	err = seedInitialData(ctx, conn.Database)
	if err != nil {
		return err
	}

	log.Println("MongoDB migrations completed successfully")
	return nil
}

// createCollection creates a collection if it doesn't exist
func createCollection(ctx context.Context, db *mongo.Database, name string) error {
	// Check if collection exists
	collections, err := db.ListCollectionNames(ctx, bson.M{"name": name})
	if err != nil {
		return err
	}

	// If collection doesn't exist, create it
	if len(collections) == 0 {
		err = db.CreateCollection(ctx, name)
		if err != nil {
			return err
		}
		log.Printf("Created collection: %s", name)
	}

	return nil
}

// seedInitialData seeds initial data if collections are empty
func seedInitialData(ctx context.Context, db *mongo.Database) error {
	// Seed plans if empty
	planCount, err := db.Collection("plans").CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}

	if planCount == 0 {
		// Create default plans
		plans := []interface{}{
			// Free plan
			&model.Plan{
				ID:                   1,
				Name:                 "Free",
				DailyDepositLimit:    1000,
				DailyWithdrawalLimit: 500,
				DailyProfitLimit:     200,
				Price:                0,
				IsDefault:            true,
				CreatedAt:            time.Now(),
				UpdatedAt:            time.Now(),
			},
			// Silver plan
			&model.Plan{
				ID:                   2,
				Name:                 "Silver",
				DailyDepositLimit:    5000,
				DailyWithdrawalLimit: 2000,
				DailyProfitLimit:     500,
				Price:                1000,
				IsDefault:            false,
				CreatedAt:            time.Now(),
				UpdatedAt:            time.Now(),
			},
			// Gold plan
			&model.Plan{
				ID:                   3,
				Name:                 "Gold",
				DailyDepositLimit:    10000,
				DailyWithdrawalLimit: 5000,
				DailyProfitLimit:     1000,
				Price:                3000,
				IsDefault:            false,
				CreatedAt:            time.Now(),
				UpdatedAt:            time.Now(),
			},
			// Platinum plan
			&model.Plan{
				ID:                   4,
				Name:                 "Platinum",
				DailyDepositLimit:    25000,
				DailyWithdrawalLimit: 15000,
				DailyProfitLimit:     3000,
				Price:                7000,
				IsDefault:            false,
				CreatedAt:            time.Now(),
				UpdatedAt:            time.Now(),
			},
			// Diamond plan
			&model.Plan{
				ID:                   5,
				Name:                 "Diamond",
				DailyDepositLimit:    50000,
				DailyWithdrawalLimit: 30000,
				DailyProfitLimit:     10000,
				Price:                15000,
				IsDefault:            false,
				CreatedAt:            time.Now(),
				UpdatedAt:            time.Now(),
			},
		}

		_, err = db.Collection("plans").InsertMany(ctx, plans)
		if err != nil {
			return err
		}
		log.Println("Seeded plans")

		// Set up counter for plans
		_, err = db.Collection("counters").InsertOne(ctx, bson.M{
			"_id": "plan_id",
			"seq": int64(5), // Starting after the last inserted plan
		})
		if err != nil {
			return err
		}
	}

	// Seed tasks if empty
	taskCount, err := db.Collection("tasks").CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}

	if taskCount == 0 {
		// Create default tasks
		tasks := []interface{}{
			&model.Task{
				ID:          1,
				Name:        "Follow us on Facebook",
				Description: "Follow our official Facebook page",
				TaskType:    model.TaskTypeFollow,
				TaskURL:     "https://facebook.com/investmentapp",
				IsMandatory: true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			},
			&model.Task{
				ID:          2,
				Name:        "Like our Facebook post",
				Description: "Like our latest Facebook post",
				TaskType:    model.TaskTypeLike,
				TaskURL:     "https://facebook.com/investmentapp/posts/latest",
				IsMandatory: true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			},
			&model.Task{
				ID:          3,
				Name:        "Install our Android app",
				Description: "Install our official Android app from Play Store",
				TaskType:    model.TaskTypeInstall,
				TaskURL:     "https://play.google.com/store/apps/investmentapp",
				IsMandatory: true,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			},
		}

		_, err = db.Collection("tasks").InsertMany(ctx, tasks)
		if err != nil {
			return err
		}
		log.Println("Seeded tasks")

		// Set up counter for tasks
		_, err = db.Collection("counters").InsertOne(ctx, bson.M{
			"_id": "task_id",
			"seq": int64(3), // Starting after the last inserted task
		})
		if err != nil {
			return err
		}
	}

	// Seed admin user if no users exist
	userCount, err := db.Collection("users").CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}

	if userCount == 0 {
		// Create default admin user
		// Generate hashed password for "admin123"
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		adminUser := model.User{
			ID:               1,
			Name:             "Admin User",
			Email:            "admin@example.com",
			PasswordHash:     string(hashedPassword),
			Phone:            "1234567890",
			Balance:          0,
			ReferralCode:     "ADMIN1234",
			PlanID:           1,
			IsKYCVerified:    true,
			EmailVerified:    true,
			IsAdmin:          true,
			IsBlocked:        false,
			BiometricEnabled: false,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}

		_, err = db.Collection("users").InsertOne(ctx, adminUser)
		if err != nil {
			return err
		}
		log.Println("Seeded admin user")

		// Set up counter for users
		_, err = db.Collection("counters").InsertOne(ctx, bson.M{
			"_id": "user_id",
			"seq": int64(1), // Starting after the admin user
		})
		if err != nil {
			return err
		}
	}

	// Initialize other counters if they don't exist
	counters := []string{
		"transaction_id",
		"payment_id",
		"withdrawal_id",
		"kyc_document_id",
		"device_id",
		"notification_id",
		"support_ticket_id",
		"support_message_id",
		"news_id",
		"faq_id",
	}

	for _, counterName := range counters {
		// Check if counter exists
		count, err := db.Collection("counters").CountDocuments(ctx, bson.M{"_id": counterName})
		if err != nil {
			return err
		}

		if count == 0 {
			// Create counter
			_, err = db.Collection("counters").InsertOne(ctx, bson.M{
				"_id": counterName,
				"seq": int64(0),
			})
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// EnsureCollectionIndexes ensures that all required indexes are created
func EnsureCollectionIndexes(db *mongo.Database) error {
	// Create indexes for collections
	indexes := map[string][]mongo.IndexModel{
		"users": {
			{
				Keys:    bson.D{{Key: "email", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
			{
				Keys:    bson.D{{Key: "referral_code", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
			{
				Keys: bson.D{{Key: "referred_by", Value: 1}},
			},
		},
		"transactions": {
			{
				Keys: bson.D{{Key: "user_id", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "type", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "status", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "created_at", Value: -1}},
			},
		},
		"payments": {
			{
				Keys: bson.D{{Key: "transaction_id", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "gateway_reference", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "status", Value: 1}},
			},
		},
		"withdrawals": {
			{
				Keys: bson.D{{Key: "user_id", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "transaction_id", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "status", Value: 1}},
			},
		},
		"kyc_documents": {
			{
				Keys: bson.D{{Key: "user_id", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "status", Value: 1}},
			},
		},
		"devices": {
			{
				Keys:    bson.D{{Key: "device_id", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
			{
				Keys: bson.D{{Key: "user_id", Value: 1}},
			},
		},
		"notifications": {
			{
				Keys: bson.D{{Key: "user_id", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "is_read", Value: 1}},
			},
		},
		"tasks": {
			{
				Keys: bson.D{{Key: "is_mandatory", Value: 1}},
			},
		},
		"user_tasks": {
			{
				Keys:    bson.D{{Key: "user_id", Value: 1}, {Key: "task_id", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		"support_tickets": {
			{
				Keys: bson.D{{Key: "user_id", Value: 1}},
			},
			{
				Keys: bson.D{{Key: "status", Value: 1}},
			},
		},
		"support_messages": {
			{
				Keys: bson.D{{Key: "ticket_id", Value: 1}},
			},
		},
		"news": {
			{
				Keys: bson.D{{Key: "is_published", Value: 1}},
			},
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	for collectionName, collectionIndexes := range indexes {
		_, err := db.Collection(collectionName).Indexes().CreateMany(ctx, collectionIndexes)
		if err != nil {
			return err
		}
	}

	return nil
}
