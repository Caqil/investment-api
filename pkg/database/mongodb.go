package database

import (
	"context"
	"fmt"
	"time"

	"github.com/Caqil/investment-api/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

// MongoDBConnection represents a MongoDB connection
type MongoDBConnection struct {
	Client   *mongo.Client
	Database *mongo.Database
}

// NewMongoDBConnection creates a new MongoDB connection
func NewMongoDBConnection(cfg config.Database) (*MongoDBConnection, error) {
	// Create a context with timeout for the connection
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(cfg.ConnectTimeout)*time.Second)
	defer cancel()

	// Set client options
	clientOptions := options.Client().
		ApplyURI(cfg.URI).
		SetMaxPoolSize(cfg.MaxPoolSize)

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// Ping the database to verify connection
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	// Get the database
	database := client.Database(cfg.Name)

	return &MongoDBConnection{
		Client:   client,
		Database: database,
	}, nil
}

// Close closes the MongoDB connection
func (c *MongoDBConnection) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return c.Client.Disconnect(ctx)
}

// GetCollection returns a MongoDB collection
func (c *MongoDBConnection) GetCollection(name string) *mongo.Collection {
	return c.Database.Collection(name)
}
