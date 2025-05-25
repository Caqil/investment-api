package repository

import (
	"context"
	"time"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/pkg/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type DeviceRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewDeviceRepository(conn *database.MongoDBConnection) *DeviceRepository {
	return &DeviceRepository{
		db:         conn.Database,
		collection: conn.GetCollection("devices"),
	}
}

func (r *DeviceRepository) Create(device *model.Device) (*model.Device, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "device_id")
	if err != nil {
		return nil, err
	}

	// Set device ID and timestamps
	device.ID = id
	now := time.Now()
	device.CreatedAt = now
	device.UpdatedAt = now

	// Insert device
	result, err := r.collection.InsertOne(ctx, device)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		device.ObjectID = oid
	}

	return device, nil
}

func (r *DeviceRepository) FindByID(id int64) (*model.Device, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var device model.Device
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&device)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &device, nil
}

func (r *DeviceRepository) FindByDeviceID(deviceID string) (*model.Device, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var device model.Device
	err := r.collection.FindOne(ctx, bson.M{"device_id": deviceID}).Decode(&device)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &device, nil
}

func (r *DeviceRepository) FindByUserID(userID int64) ([]*model.Device, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var devices []*model.Device
	if err = cursor.All(ctx, &devices); err != nil {
		return nil, err
	}

	return devices, nil
}

func (r *DeviceRepository) UpdateLastLogin(deviceID string, lastLogin time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"device_id": deviceID},
		bson.M{
			"$set": bson.M{
				"last_login": lastLogin,
				"updated_at": time.Now(),
			},
		},
	)

	return err
}

func (r *DeviceRepository) UpdateActive(deviceID string, isActive bool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"device_id": deviceID},
		bson.M{
			"$set": bson.M{
				"is_active":  isActive,
				"updated_at": time.Now(),
			},
		},
	)

	return err
}

func (r *DeviceRepository) Delete(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"id": id})
	return err
}
