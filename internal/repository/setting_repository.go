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

type SettingRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewSettingRepository(conn *database.MongoDBConnection) *SettingRepository {
	return &SettingRepository{
		db:         conn.Database,
		collection: conn.GetCollection("settings"),
	}
}

// GetDB returns the database connection
func (r *SettingRepository) GetDB() *mongo.Database {
	return r.db
}

// Create creates a new setting
func (r *SettingRepository) Create(setting *model.Setting) (*model.Setting, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "setting_id")
	if err != nil {
		return nil, err
	}

	// Set setting ID and timestamps
	setting.ID = id
	now := time.Now()
	setting.CreatedAt = now
	setting.UpdatedAt = now

	// Insert setting
	result, err := r.collection.InsertOne(ctx, setting)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		setting.ObjectID = oid
	}

	return setting, nil
}

// FindByID finds a setting by ID
func (r *SettingRepository) FindByID(id int64) (*model.Setting, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var setting model.Setting
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&setting)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &setting, nil
}

// FindByKey finds a setting by key
func (r *SettingRepository) FindByKey(key string) (*model.Setting, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var setting model.Setting
	err := r.collection.FindOne(ctx, bson.M{"key": key}).Decode(&setting)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &setting, nil
}

// FindAll finds all settings
func (r *SettingRepository) FindAll() ([]*model.Setting, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().SetSort(bson.D{{Key: "group", Value: 1}, {Key: "display_name", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var settings []*model.Setting
	if err = cursor.All(ctx, &settings); err != nil {
		return nil, err
	}

	return settings, nil
}

// FindByGroup finds all settings in a specific group
func (r *SettingRepository) FindByGroup(group string) ([]*model.Setting, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().SetSort(bson.D{{Key: "display_name", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{"group": group}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var settings []*model.Setting
	if err = cursor.All(ctx, &settings); err != nil {
		return nil, err
	}

	return settings, nil
}

// Update updates a setting
func (r *SettingRepository) Update(setting *model.Setting) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	setting.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": setting.ID},
		bson.M{"$set": setting},
	)

	return err
}

// UpdateByKey updates a setting by key
func (r *SettingRepository) UpdateByKey(key string, value string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"key": key},
		bson.M{
			"$set": bson.M{
				"value":      value,
				"updated_at": time.Now(),
			},
		},
	)

	return err
}

// Delete deletes a setting
func (r *SettingRepository) Delete(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"id": id})
	return err
}
