package repository

import (
	"context"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/pkg/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type WithdrawalRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewWithdrawalRepository(conn *database.MongoDBConnection) *WithdrawalRepository {
	return &WithdrawalRepository{
		db:         conn.Database,
		collection: conn.GetCollection("withdrawals"),
	}
}

// GetDB returns the database connection
func (r *WithdrawalRepository) GetDB() *mongo.Database {
	return r.db
}

func (r *WithdrawalRepository) Create(withdrawal *model.Withdrawal) (*model.Withdrawal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "withdrawal_id")
	if err != nil {
		return nil, err
	}

	// Set withdrawal ID and timestamps
	withdrawal.ID = id
	now := time.Now()
	withdrawal.CreatedAt = now
	withdrawal.UpdatedAt = now

	// Insert withdrawal
	result, err := r.collection.InsertOne(ctx, withdrawal)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		withdrawal.ObjectID = oid
	}

	return withdrawal, nil
}

func (r *WithdrawalRepository) FindByID(id int64) (*model.Withdrawal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var withdrawal model.Withdrawal
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&withdrawal)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &withdrawal, nil
}

func (r *WithdrawalRepository) FindByUserID(userID int64, limit, offset int) ([]*model.Withdrawal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(int64(offset))

	if limit > 0 {
		options.SetLimit(int64(limit))
	}

	cursor, err := r.collection.Find(ctx, bson.M{"user_id": userID}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var withdrawals []*model.Withdrawal
	if err = cursor.All(ctx, &withdrawals); err != nil {
		return nil, err
	}

	return withdrawals, nil
}

func (r *WithdrawalRepository) FindByStatus(status model.WithdrawalStatus, limit, offset int) ([]*model.Withdrawal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(int64(offset))

	if limit > 0 {
		options.SetLimit(int64(limit))
	}

	cursor, err := r.collection.Find(ctx, bson.M{"status": status}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var withdrawals []*model.Withdrawal
	if err = cursor.All(ctx, &withdrawals); err != nil {
		return nil, err
	}

	return withdrawals, nil
}

func (r *WithdrawalRepository) FindAll(limit, offset int) ([]*model.Withdrawal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(int64(offset))

	if limit > 0 {
		options.SetLimit(int64(limit))
	}

	cursor, err := r.collection.Find(ctx, bson.M{}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var withdrawals []*model.Withdrawal
	if err = cursor.All(ctx, &withdrawals); err != nil {
		return nil, err
	}

	return withdrawals, nil
}

func (r *WithdrawalRepository) CountByStatus(status model.WithdrawalStatus) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{"status": status})
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *WithdrawalRepository) CountByUserID(userID int64) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{"user_id": userID})
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *WithdrawalRepository) Update(withdrawal *model.Withdrawal) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	withdrawal.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": withdrawal.ID},
		bson.M{"$set": withdrawal},
	)

	return err
}

func (r *WithdrawalRepository) UpdateStatus(id int64, status model.WithdrawalStatus, adminNote string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{
		"status":     status,
		"updated_at": time.Now(),
	}

	if adminNote != "" {
		update["admin_note"] = adminNote
	}

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": id},
		bson.M{"$set": update},
	)

	return err
}

// FindByTransactionID finds a withdrawal by transaction ID
func (r *WithdrawalRepository) FindByTransactionID(transactionID int64) (*model.Withdrawal, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var withdrawal model.Withdrawal
	err := r.collection.FindOne(ctx, bson.M{"transaction_id": transactionID}).Decode(&withdrawal)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &withdrawal, nil
}
