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

type NewsRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewNewsRepository(conn *database.MongoDBConnection) *NewsRepository {
	return &NewsRepository{
		db:         conn.Database,
		collection: conn.GetCollection("news"),
	}
}

func (r *NewsRepository) Create(news *model.News) (*model.News, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "news_id")
	if err != nil {
		return nil, err
	}

	// Set news ID and timestamps
	news.ID = id
	now := time.Now()
	news.CreatedAt = now
	news.UpdatedAt = now

	// Insert news
	result, err := r.collection.InsertOne(ctx, news)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		news.ObjectID = oid
	}

	return news, nil
}

func (r *NewsRepository) FindByID(id int64) (*model.News, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var news model.News
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&news)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &news, nil
}

func (r *NewsRepository) FindPublished(limit, offset int) ([]*model.News, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}).
		SetSkip(int64(offset))

	if limit > 0 {
		options.SetLimit(int64(limit))
	}

	cursor, err := r.collection.Find(ctx, bson.M{"is_published": true}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var newsList []*model.News
	if err = cursor.All(ctx, &newsList); err != nil {
		return nil, err
	}

	return newsList, nil
}

func (r *NewsRepository) FindAll(limit, offset int) ([]*model.News, error) {
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

	var newsList []*model.News
	if err = cursor.All(ctx, &newsList); err != nil {
		return nil, err
	}

	return newsList, nil
}

func (r *NewsRepository) Update(news *model.News) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	news.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": news.ID},
		bson.M{"$set": news},
	)

	return err
}

func (r *NewsRepository) Delete(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"id": id})
	return err
}

func (r *NewsRepository) CountPublished() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{"is_published": true})
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *NewsRepository) CountAll() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return 0, err
	}

	return count, nil
}
