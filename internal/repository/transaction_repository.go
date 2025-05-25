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

type TransactionRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewTransactionRepository(conn *database.MongoDBConnection) *TransactionRepository {
	return &TransactionRepository{
		db:         conn.Database,
		collection: conn.GetCollection("transactions"),
	}
}

// GetDB returns the database connection
func (r *TransactionRepository) GetDB() *mongo.Database {
	return r.db
}

func (r *TransactionRepository) Create(transaction *model.Transaction) (*model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "transaction_id")
	if err != nil {
		return nil, err
	}

	// Set transaction ID and timestamps
	transaction.ID = id
	now := time.Now()
	transaction.CreatedAt = now
	transaction.UpdatedAt = now

	// Insert transaction
	result, err := r.collection.InsertOne(ctx, transaction)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		transaction.ObjectID = oid
	}

	return transaction, nil
}

func (r *TransactionRepository) FindByID(id int64) (*model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var transaction model.Transaction
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&transaction)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &transaction, nil
}

func (r *TransactionRepository) FindByUserID(userID int64, limit, offset int) ([]*model.Transaction, error) {
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

	var transactions []*model.Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) FindByTypeAndUserID(
	userID int64,
	transactionType model.TransactionType,
	startDate, endDate time.Time,
) ([]*model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{
		"user_id": userID,
		"type":    transactionType,
		"created_at": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	options := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var transactions []*model.Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) CountByUserID(userID int64) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{"user_id": userID})
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *TransactionRepository) Update(transaction *model.Transaction) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	transaction.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": transaction.ID},
		bson.M{"$set": transaction},
	)

	return err
}

func (r *TransactionRepository) UpdateStatus(id int64, status model.TransactionStatus) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": id},
		bson.M{
			"$set": bson.M{
				"status":     status,
				"updated_at": time.Now(),
			},
		},
	)

	return err
}

func (r *TransactionRepository) FindByTypeAndDate(
	transactionType model.TransactionType,
	startDate, endDate *time.Time,
) ([]*model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{"type": transactionType}

	if startDate != nil && endDate != nil {
		filter["created_at"] = bson.M{
			"$gte": startDate,
			"$lte": endDate,
		}
	} else if startDate != nil {
		filter["created_at"] = bson.M{"$gte": startDate}
	} else if endDate != nil {
		filter["created_at"] = bson.M{"$lte": endDate}
	}

	options := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var transactions []*model.Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) FindProfitTransactionsByUserIDAndDate(
	userID int64,
	startDate, endDate time.Time,
) ([]*model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	filter := bson.M{
		"user_id": userID,
		"type":    model.TransactionTypeBonus,
		"status":  model.TransactionStatusCompleted,
		"created_at": bson.M{
			"$gte": startDate,
			"$lte": endDate,
		},
	}

	options := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := r.collection.Find(ctx, filter, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var transactions []*model.Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) GetTotalProfitByUserIDAndDate(
	userID int64,
	startDate, endDate time.Time,
) (float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"user_id": userID,
			"type":    model.TransactionTypeBonus,
			"status":  model.TransactionStatusCompleted,
			"created_at": bson.M{
				"$gte": startDate,
				"$lte": endDate,
			},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   nil,
			"total": bson.M{"$sum": "$amount"},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var result []bson.M
	if err = cursor.All(ctx, &result); err != nil {
		return 0, err
	}

	if len(result) == 0 {
		return 0, nil
	}

	total, ok := result[0]["total"].(float64)
	if !ok {
		return 0, nil
	}

	return total, nil
}

func (r *TransactionRepository) GetDailyTransactionTotalByUserIDAndType(
	userID int64,
	transactionType model.TransactionType,
	date time.Time,
) (float64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get start and end of the day
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"user_id": userID,
			"type":    transactionType,
			"status":  model.TransactionStatusCompleted,
			"created_at": bson.M{
				"$gte": startOfDay,
				"$lt":  endOfDay,
			},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   nil,
			"total": bson.M{"$sum": "$amount"},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var result []bson.M
	if err = cursor.All(ctx, &result); err != nil {
		return 0, err
	}

	if len(result) == 0 {
		return 0, nil
	}

	total, ok := result[0]["total"].(float64)
	if !ok {
		return 0, nil
	}

	return total, nil
}

func (r *TransactionRepository) GetTransactionsByStatus(
	status model.TransactionStatus,
	limit, offset int,
) ([]*model.Transaction, error) {
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

	var transactions []*model.Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) GetTransactionsByTypeAndStatus(
	transactionType model.TransactionType,
	status model.TransactionStatus,
	limit, offset int,
) ([]*model.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(int64(offset))

	if limit > 0 {
		options.SetLimit(int64(limit))
	}

	cursor, err := r.collection.Find(ctx,
		bson.M{
			"type":   transactionType,
			"status": status,
		},
		options,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var transactions []*model.Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}

func (r *TransactionRepository) FindAll(limit, offset int) ([]*model.Transaction, error) {
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

	var transactions []*model.Transaction
	if err = cursor.All(ctx, &transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}
