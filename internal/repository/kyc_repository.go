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

type KYCRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewKYCRepository(conn *database.MongoDBConnection) *KYCRepository {
	return &KYCRepository{
		db:         conn.Database,
		collection: conn.GetCollection("kyc_documents"),
	}
}

func (r *KYCRepository) Create(kyc *model.KYCDocument) (*model.KYCDocument, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "kyc_document_id")
	if err != nil {
		return nil, err
	}

	// Set KYC ID and timestamps
	kyc.ID = id
	now := time.Now()
	kyc.CreatedAt = now
	kyc.UpdatedAt = now

	// Insert KYC document
	result, err := r.collection.InsertOne(ctx, kyc)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		kyc.ObjectID = oid
	}

	return kyc, nil
}

func (r *KYCRepository) FindByID(id int64) (*model.KYCDocument, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var kyc model.KYCDocument
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&kyc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &kyc, nil
}

func (r *KYCRepository) FindByUserID(userID int64) (*model.KYCDocument, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find the most recent KYC document for the user
	opts := options.FindOne().SetSort(bson.D{{Key: "created_at", Value: -1}})

	var kyc model.KYCDocument
	err := r.collection.FindOne(ctx, bson.M{"user_id": userID}, opts).Decode(&kyc)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &kyc, nil
}

func (r *KYCRepository) FindByStatus(status model.KYCStatus, limit, offset int) ([]*model.KYCDocument, error) {
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

	var documents []*model.KYCDocument
	if err = cursor.All(ctx, &documents); err != nil {
		return nil, err
	}

	return documents, nil
}

func (r *KYCRepository) FindAll(limit, offset int) ([]*model.KYCDocument, error) {
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

	var documents []*model.KYCDocument
	if err = cursor.All(ctx, &documents); err != nil {
		return nil, err
	}

	return documents, nil
}

func (r *KYCRepository) Update(kyc *model.KYCDocument) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	kyc.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": kyc.ID},
		bson.M{"$set": kyc},
	)

	return err
}

func (r *KYCRepository) UpdateStatus(id int64, status model.KYCStatus, adminNote string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{
		"status":     status,
		"updated_at": time.Now(),
	}

	if adminNote != "" {
		update["admin_note"] = adminNote
	}

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": id},
		bson.M{"$set": update},
	)

	return err
}

func (r *KYCRepository) CountByStatus(status model.KYCStatus) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{"status": status})
	if err != nil {
		return 0, err
	}

	return count, nil
}
