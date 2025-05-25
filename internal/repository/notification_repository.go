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

type NotificationRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewNotificationRepository(conn *database.MongoDBConnection) *NotificationRepository {
	return &NotificationRepository{
		db:         conn.Database,
		collection: conn.GetCollection("notifications"),
	}
}

func (r *NotificationRepository) GetDB() *mongo.Database {
	return r.db
}

func (r *NotificationRepository) Create(notification *model.Notification) (*model.Notification, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "notification_id")
	if err != nil {
		return nil, err
	}

	// Set notification ID and timestamps
	notification.ID = id
	now := time.Now()
	notification.CreatedAt = now
	notification.UpdatedAt = now

	// Insert notification
	result, err := r.collection.InsertOne(ctx, notification)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		notification.ObjectID = oid
	}

	return notification, nil
}

func (r *NotificationRepository) FindByID(id int64) (*model.Notification, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var notification model.Notification
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&notification)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &notification, nil
}

func (r *NotificationRepository) FindByUserID(userID int64, limit, offset int) ([]*model.Notification, error) {
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

	var notifications []*model.Notification
	if err = cursor.All(ctx, &notifications); err != nil {
		return nil, err
	}

	return notifications, nil
}

func (r *NotificationRepository) FindUnreadByUserID(userID int64, limit, offset int) ([]*model.Notification, error) {
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
			"user_id": userID,
			"is_read": false,
		},
		options,
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var notifications []*model.Notification
	if err = cursor.All(ctx, &notifications); err != nil {
		return nil, err
	}

	return notifications, nil
}

func (r *NotificationRepository) CountUnreadByUserID(userID int64) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{
		"user_id": userID,
		"is_read": false,
	})
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *NotificationRepository) Update(notification *model.Notification) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	notification.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": notification.ID},
		bson.M{"$set": notification},
	)

	return err
}

func (r *NotificationRepository) MarkAsRead(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": id},
		bson.M{
			"$set": bson.M{
				"is_read":    true,
				"updated_at": time.Now(),
			},
		},
	)

	return err
}

func (r *NotificationRepository) MarkAllAsRead(userID int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.UpdateMany(
		ctx,
		bson.M{
			"user_id": userID,
			"is_read": false,
		},
		bson.M{
			"$set": bson.M{
				"is_read":    true,
				"updated_at": time.Now(),
			},
		},
	)

	return err
}

func (r *NotificationRepository) Delete(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"id": id})
	return err
}

func (r *NotificationRepository) DeleteAllByUserID(userID int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}

// Create a notification for all users
func (r *NotificationRepository) CreateForAllUsers(title, message string, notificationType model.NotificationType) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get all user IDs
	userCollection := r.db.Collection("users")
	cursor, err := userCollection.Find(ctx, bson.M{"is_blocked": false}, options.Find().SetProjection(bson.M{"id": 1}))
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)

	var users []struct {
		ID int64 `bson:"id"`
	}

	if err = cursor.All(ctx, &users); err != nil {
		return err
	}

	// Start a session for transaction
	session, err := r.db.Client().StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	// Use WithTransaction to run the operations in a transaction
	_, err = session.WithTransaction(ctx, func(sessionCtx mongo.SessionContext) (interface{}, error) {
		now := time.Now()
		notifications := make([]interface{}, 0, len(users))

		// Create notification documents for each user
		for i, user := range users {
			// Get next ID for each notification
			id, err := database.GetNextSequence(r.db, "notification_id")
			if err != nil {
				return nil, err
			}

			notifications = append(notifications, bson.M{
				"id":         id,
				"user_id":    user.ID,
				"title":      title,
				"message":    message,
				"type":       notificationType,
				"is_read":    false,
				"created_at": now,
				"updated_at": now,
			})

			// Insert in batches of 1000 to avoid exceeding document size limit
			if i > 0 && i%1000 == 0 || i == len(users)-1 {
				_, err = r.collection.InsertMany(sessionCtx, notifications)
				if err != nil {
					return nil, err
				}
				notifications = notifications[:0] // Clear the slice
			}
		}

		return nil, nil
	})

	return err
}
