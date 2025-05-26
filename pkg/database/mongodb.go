package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MongoDBConnection represents a MongoDB connection
type MongoDBConnection struct {
	Client   *mongo.Client
	Database *mongo.Database
}

// MongoDBConfig holds configuration for MongoDB connection
type MongoDBConfig struct {
	URI            string
	Name           string
	ConnectTimeout int
	MaxPoolSize    uint64
}

// NewMongoDBConnection creates a new MongoDB connection
func NewMongoDBConnection(cfg MongoDBConfig) (*MongoDBConnection, error) {
	// Set MongoDB Stable API version
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)

	// Set client options similar to your working example
	clientOptions := options.Client().
		ApplyURI(cfg.URI).
		SetServerAPIOptions(serverAPI)

	// Optional: still set max pool size if needed
	if cfg.MaxPoolSize > 0 {
		clientOptions.SetMaxPoolSize(cfg.MaxPoolSize)
	}

	// Connect to MongoDB using the approach from your working example
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %v", err)
	}

	// Ping the admin database to verify connection (as in your working example)
	err = client.Database("admin").RunCommand(context.TODO(), bson.D{{"ping", 1}}).Err()
	if err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %v", err)
	}

	// Get the specified database
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
func (m *MongoDBConnection) GetContext() context.Context {
	// Create a timeout context if needed
	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	return ctx
}
