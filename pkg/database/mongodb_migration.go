package database

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// RunMongoDBMigrations sets up the MongoDB collections and indexes
func RunMongoDBMigrations(conn *MongoDBConnection) error {
	// Seed random number generator
	rand.Seed(time.Now().UnixNano())

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

	// Seed test users if only the admin exists
	if userCount <= 1 {
		// Create test users
		testUsers := []interface{}{}

		// Create 10 regular users
		for i := 2; i <= 11; i++ {
			hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

			// Generate a random plan ID between 1 and 5
			planID := int64(rand.Intn(5) + 1)

			// Generate a random balance between 1000 and 20000
			balance := float64(1000 + rand.Intn(19000))

			// Randomly assign KYC status
			isKYCVerified := rand.Intn(2) == 1

			user := model.User{
				ID:               int64(i),
				Name:             fmt.Sprintf("Test User %d", i),
				Email:            fmt.Sprintf("user%d@example.com", i),
				PasswordHash:     string(hashedPassword),
				Phone:            fmt.Sprintf("555%07d", i),
				Balance:          balance,
				ReferralCode:     fmt.Sprintf("REF%06d", i),
				PlanID:           planID,
				IsKYCVerified:    isKYCVerified,
				EmailVerified:    true,
				IsAdmin:          false,
				IsBlocked:        i == 11, // Make the last user blocked for testing
				BiometricEnabled: rand.Intn(2) == 1,
				CreatedAt:        time.Now().Add(-time.Duration(rand.Intn(30)) * 24 * time.Hour), // Random creation date within 30 days
				UpdatedAt:        time.Now(),
			}

			testUsers = append(testUsers, user)
		}

		// Insert test users
		_, err = db.Collection("users").InsertMany(ctx, testUsers)
		if err != nil {
			return err
		}
		log.Println("Seeded test users")

		// Update user counter
		_, err = db.Collection("counters").UpdateOne(
			ctx,
			bson.M{"_id": "user_id"},
			bson.M{"$set": bson.M{"seq": int64(11)}}, // Last inserted user ID
		)
		if err != nil {
			return err
		}
	}

	// Seed transactions, payments, and withdrawals if empty
	txCount, err := db.Collection("transactions").CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}

	if txCount == 0 {
		// Create mock transactions
		transactions := []interface{}{}
		payments := []interface{}{}
		withdrawals := []interface{}{}

		txID := int64(1)
		paymentID := int64(1)
		withdrawalID := int64(1)

		// For each user (except admin)
		for userID := int64(2); userID <= 11; userID++ {
			// Skip the blocked user for transactions
			if userID == 11 {
				continue
			}

			// Create 1-3 deposit transactions with payments
			numDeposits := rand.Intn(3) + 1
			for i := 0; i < numDeposits; i++ {
				amount := float64(500 + rand.Intn(5000))
				createdAt := time.Now().Add(-time.Duration(rand.Intn(20)) * 24 * time.Hour)

				// Create transaction
				tx := model.Transaction{
					ID:          txID,
					UserID:      userID,
					Amount:      amount,
					Type:        model.TransactionTypeDeposit,
					Status:      model.TransactionStatusCompleted,
					Description: fmt.Sprintf("Deposit via %s", []string{"Coingate", "UddoktaPay", "Manual"}[rand.Intn(3)]),
					CreatedAt:   createdAt,
					UpdatedAt:   createdAt,
				}
				transactions = append(transactions, tx)

				// Create payment
				gateway := []model.PaymentGateway{
					model.PaymentGatewayCoingate,
					model.PaymentGatewayUddoktaPay,
					model.PaymentGatewayManual,
				}[rand.Intn(3)]

				payment := model.Payment{
					ID:               paymentID,
					TransactionID:    txID,
					Gateway:          gateway,
					GatewayReference: fmt.Sprintf("REF%08d", rand.Intn(100000000)),
					Currency:         []model.Currency{model.CurrencyUSD, model.CurrencyBDT}[rand.Intn(2)],
					Amount:           amount,
					Status:           model.PaymentStatusCompleted,
					CreatedAt:        createdAt,
					UpdatedAt:        createdAt,
				}
				payments = append(payments, payment)

				txID++
				paymentID++
			}

			// Create 0-2 withdrawal transactions with withdrawals
			numWithdrawals := rand.Intn(3)
			for i := 0; i < numWithdrawals; i++ {
				amount := float64(200 + rand.Intn(2000))
				createdAt := time.Now().Add(-time.Duration(rand.Intn(15)) * 24 * time.Hour)

				// Determine status - mostly completed, some pending, few rejected
				var status model.TransactionStatus
				var withdrawalStatus model.WithdrawalStatus

				r := rand.Intn(10)
				if r < 7 { // 70% completed
					status = model.TransactionStatusCompleted
					withdrawalStatus = model.WithdrawalStatusApproved
				} else if r < 9 { // 20% pending
					status = model.TransactionStatusPending
					withdrawalStatus = model.WithdrawalStatusPending
				} else { // 10% rejected
					status = model.TransactionStatusRejected
					withdrawalStatus = model.WithdrawalStatusRejected
				}

				// Create transaction
				tx := model.Transaction{
					ID:          txID,
					UserID:      userID,
					Amount:      amount,
					Type:        model.TransactionTypeWithdrawal,
					Status:      status,
					Description: "Withdrawal via bank transfer",
					CreatedAt:   createdAt,
					UpdatedAt:   createdAt,
				}
				transactions = append(transactions, tx)

				// Create payment details
				paymentDetails := model.PaymentDetails{
					"bank_name":      []string{"CitiBank", "HSBC", "Bank of America", "Chase"}[rand.Intn(4)],
					"account_name":   fmt.Sprintf("Test User %d", userID),
					"account_number": fmt.Sprintf("%010d", rand.Intn(1000000000)),
				}

				// Create withdrawal
				withdrawal := model.Withdrawal{
					ID:             withdrawalID,
					TransactionID:  txID,
					UserID:         userID,
					Amount:         amount,
					PaymentMethod:  "Bank Transfer",
					PaymentDetails: paymentDetails,
					Status:         withdrawalStatus,
					TasksCompleted: true,
					CreatedAt:      createdAt,
					UpdatedAt:      createdAt,
				}

				// Add admin note for completed or rejected
				if withdrawalStatus == model.WithdrawalStatusApproved {
					withdrawal.AdminNote = "Approved and processed"
				} else if withdrawalStatus == model.WithdrawalStatusRejected {
					withdrawal.AdminNote = "Rejected due to suspicious activity"
				}

				withdrawals = append(withdrawals, withdrawal)

				txID++
				withdrawalID++
			}

			// Create 1-3 bonus transactions
			numBonuses := rand.Intn(3) + 1
			for i := 0; i < numBonuses; i++ {
				amount := float64(50 + rand.Intn(200))
				createdAt := time.Now().Add(-time.Duration(rand.Intn(25)) * 24 * time.Hour)

				// Create transaction
				tx := model.Transaction{
					ID:          txID,
					UserID:      userID,
					Amount:      amount,
					Type:        model.TransactionTypeBonus,
					Status:      model.TransactionStatusCompleted,
					Description: "5.00% daily bonus",
					CreatedAt:   createdAt,
					UpdatedAt:   createdAt,
				}
				transactions = append(transactions, tx)

				txID++
			}
		}

		// Add a few pending manual payments for testing approval workflow
		for i := 0; i < 3; i++ {
			userID := int64(rand.Intn(9) + 2) // Random user (not admin, not blocked)
			amount := float64(500 + rand.Intn(3000))
			createdAt := time.Now().Add(-time.Duration(rand.Intn(5)) * 24 * time.Hour)

			// Create transaction
			tx := model.Transaction{
				ID:          txID,
				UserID:      userID,
				Amount:      amount,
				Type:        model.TransactionTypeDeposit,
				Status:      model.TransactionStatusPending, // Pending
				Description: "Manual deposit",
				CreatedAt:   createdAt,
				UpdatedAt:   createdAt,
			}
			transactions = append(transactions, tx)

			// Create payment with metadata
			metadata := model.JSON{
				"transaction_id": fmt.Sprintf("TRX%08d", rand.Intn(10000000)),
				"payment_method": "Mobile Banking",
				"sender_information": map[string]interface{}{
					"name":  fmt.Sprintf("Test User %d", userID),
					"phone": fmt.Sprintf("555%07d", rand.Intn(1000000)),
				},
			}

			payment := model.Payment{
				ID:            paymentID,
				TransactionID: txID,
				Gateway:       model.PaymentGatewayManual,
				Currency:      model.CurrencyBDT,
				Amount:        amount,
				Status:        model.PaymentStatusPending, // Pending
				Metadata:      metadata,
				CreatedAt:     createdAt,
				UpdatedAt:     createdAt,
			}
			payments = append(payments, payment)

			txID++
			paymentID++
		}

		// Insert all data
		if len(transactions) > 0 {
			_, err = db.Collection("transactions").InsertMany(ctx, transactions)
			if err != nil {
				return err
			}
			log.Printf("Seeded %d transactions", len(transactions))

			// Update transaction counter
			_, err = db.Collection("counters").UpdateOne(
				ctx,
				bson.M{"_id": "transaction_id"},
				bson.M{"$set": bson.M{"seq": txID - 1}},
			)
			if err != nil {
				return err
			}
		}

		if len(payments) > 0 {
			_, err = db.Collection("payments").InsertMany(ctx, payments)
			if err != nil {
				return err
			}
			log.Printf("Seeded %d payments", len(payments))

			// Update payment counter
			_, err = db.Collection("counters").UpdateOne(
				ctx,
				bson.M{"_id": "payment_id"},
				bson.M{"$set": bson.M{"seq": paymentID - 1}},
			)
			if err != nil {
				return err
			}
		}

		if len(withdrawals) > 0 {
			_, err = db.Collection("withdrawals").InsertMany(ctx, withdrawals)
			if err != nil {
				return err
			}
			log.Printf("Seeded %d withdrawals", len(withdrawals))

			// Update withdrawal counter
			_, err = db.Collection("counters").UpdateOne(
				ctx,
				bson.M{"_id": "withdrawal_id"},
				bson.M{"$set": bson.M{"seq": withdrawalID - 1}},
			)
			if err != nil {
				return err
			}
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
