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

type PaymentRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewPaymentRepository(conn *database.MongoDBConnection) *PaymentRepository {
	return &PaymentRepository{
		db:         conn.Database,
		collection: conn.GetCollection("payments"),
	}
}

// GetDB returns the database connection
func (r *PaymentRepository) GetDB() *mongo.Database {
	return r.db
}

func (r *PaymentRepository) Create(payment *model.Payment) (*model.Payment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "payment_id")
	if err != nil {
		return nil, err
	}

	// Set payment ID and timestamps
	payment.ID = id
	now := time.Now()
	payment.CreatedAt = now
	payment.UpdatedAt = now

	// Insert payment
	result, err := r.collection.InsertOne(ctx, payment)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		payment.ObjectID = oid
	}

	return payment, nil
}

func (r *PaymentRepository) FindByID(id int64) (*model.Payment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var payment model.Payment
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&payment)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &payment, nil
}

func (r *PaymentRepository) FindByTransactionID(transactionID int64) (*model.Payment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var payment model.Payment
	err := r.collection.FindOne(ctx, bson.M{"transaction_id": transactionID}).Decode(&payment)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &payment, nil
}

func (r *PaymentRepository) FindByGatewayReference(gatewayReference string) (*model.Payment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var payment model.Payment
	err := r.collection.FindOne(ctx, bson.M{"gateway_reference": gatewayReference}).Decode(&payment)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &payment, nil
}

func (r *PaymentRepository) FindByGatewayAndStatus(
	gateway model.PaymentGateway,
	status model.PaymentStatus,
	limit, offset int,
) ([]*model.Payment, error) {
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
			"gateway": gateway,
			"status":  status,
		},
		options,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var payments []*model.Payment
	if err = cursor.All(ctx, &payments); err != nil {
		return nil, err
	}

	return payments, nil
}

func (r *PaymentRepository) Update(payment *model.Payment) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	payment.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": payment.ID},
		bson.M{"$set": payment},
	)

	return err
}

func (r *PaymentRepository) UpdateStatus(id int64, status model.PaymentStatus) error {
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

// CountByGatewayAndStatus counts the number of payments with a specific gateway and status
func (r *PaymentRepository) CountByGatewayAndStatus(gateway model.PaymentGateway, status model.PaymentStatus) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{
		"gateway": gateway,
		"status":  status,
	})
	if err != nil {
		return 0, err
	}

	return count, nil
}
