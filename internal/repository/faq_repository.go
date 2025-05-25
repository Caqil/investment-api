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

type FAQRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewFAQRepository(conn *database.MongoDBConnection) *FAQRepository {
	return &FAQRepository{
		db:         conn.Database,
		collection: conn.GetCollection("faqs"),
	}
}

func (r *FAQRepository) Create(faq *model.FAQ) (*model.FAQ, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "faq_id")
	if err != nil {
		return nil, err
	}

	// Set FAQ ID and timestamps
	faq.ID = id
	now := time.Now()
	faq.CreatedAt = now
	faq.UpdatedAt = now

	// Insert FAQ
	result, err := r.collection.InsertOne(ctx, faq)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		faq.ObjectID = oid
	}

	return faq, nil
}

func (r *FAQRepository) FindByID(id int64) (*model.FAQ, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var faq model.FAQ
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&faq)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &faq, nil
}

func (r *FAQRepository) FindAll() ([]*model.FAQ, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().SetSort(bson.D{{Key: "order_number", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var faqs []*model.FAQ
	if err = cursor.All(ctx, &faqs); err != nil {
		return nil, err
	}

	return faqs, nil
}

func (r *FAQRepository) Update(faq *model.FAQ) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	faq.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": faq.ID},
		bson.M{"$set": faq},
	)

	return err
}

func (r *FAQRepository) Delete(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"id": id})
	return err
}

func (r *FAQRepository) UpdateOrder(id int64, orderNumber int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": id},
		bson.M{
			"$set": bson.M{
				"order_number": orderNumber,
				"updated_at":   time.Now(),
			},
		},
	)

	return err
}

func (r *FAQRepository) CountAll() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return 0, err
	}

	return count, nil
}
