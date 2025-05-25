package database

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetNextSequence generates a new sequence number for auto-incrementing IDs
func GetNextSequence(db *mongo.Database, sequenceName string) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Ensure the counters collection exists
	countersCollection := db.Collection("counters")

	// Find and update the sequence, or create it if it doesn't exist
	result := countersCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": sequenceName},
		bson.M{"$inc": bson.M{"seq": int64(1)}},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	)

	// Get the updated document
	var counter struct {
		ID  string `bson:"_id"`
		Seq int64  `bson:"seq"`
	}

	err := result.Decode(&counter)
	if err != nil {
		return 0, err
	}

	return counter.Seq, nil
}

// ObjectIDToString converts ObjectID to string
func ObjectIDToString(id primitive.ObjectID) string {
	return id.Hex()
}

// StringToObjectID converts string to ObjectID
func StringToObjectID(id string) (primitive.ObjectID, error) {
	return primitive.ObjectIDFromHex(id)
}

// CreateIndexes creates indexes for MongoDB collections
func CreateIndexes(db *mongo.Database) error {
	// Create a context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Create indexes for users collection
	usersCollection := db.Collection("users")
	_, err := usersCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "referral_code", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		return err
	}

	// Create indexes for transactions collection
	transactionsCollection := db.Collection("transactions")
	_, err = transactionsCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
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
	})
	if err != nil {
		return err
	}

	// Create indexes for payments collection
	paymentsCollection := db.Collection("payments")
	_, err = paymentsCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "transaction_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "gateway_reference", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
	})
	if err != nil {
		return err
	}

	// Add more indexes for other collections as needed
	return nil
}
