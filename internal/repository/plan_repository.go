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

type PlanRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewPlanRepository(conn *database.MongoDBConnection) *PlanRepository {
	return &PlanRepository{
		db:         conn.Database,
		collection: conn.GetCollection("plans"),
	}
}

func (r *PlanRepository) Create(plan *model.Plan) (*model.Plan, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "plan_id")
	if err != nil {
		return nil, err
	}

	// Set plan ID and timestamps
	plan.ID = id
	now := time.Now()
	plan.CreatedAt = now
	plan.UpdatedAt = now

	// Insert plan
	result, err := r.collection.InsertOne(ctx, plan)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		plan.ObjectID = oid
	}

	return plan, nil
}

func (r *PlanRepository) FindByID(id int64) (*model.Plan, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var plan model.Plan
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&plan)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &plan, nil
}

func (r *PlanRepository) FindAll() ([]*model.Plan, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().SetSort(bson.D{{Key: "price", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var plans []*model.Plan
	if err = cursor.All(ctx, &plans); err != nil {
		return nil, err
	}

	return plans, nil
}

func (r *PlanRepository) FindDefault() (*model.Plan, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var plan model.Plan
	err := r.collection.FindOne(ctx, bson.M{"is_default": true}).Decode(&plan)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &plan, nil
}

func (r *PlanRepository) Update(plan *model.Plan) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	plan.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": plan.ID},
		bson.M{"$set": plan},
	)

	return err
}

func (r *PlanRepository) Delete(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"id": id})
	return err
}

func (r *PlanRepository) SetDefault(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Start a session for transaction
	session, err := r.db.Client().StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	// Use WithTransaction to run the operations in a transaction
	_, err = session.WithTransaction(ctx, func(sessionCtx mongo.SessionContext) (interface{}, error) {
		// Set all plans as non-default
		_, err := r.collection.UpdateMany(
			sessionCtx,
			bson.M{},
			bson.M{
				"$set": bson.M{
					"is_default": false,
					"updated_at": time.Now(),
				},
			},
		)
		if err != nil {
			return nil, err
		}

		// If id is greater than 0, set the specified plan as default
		if id > 0 {
			_, err = r.collection.UpdateOne(
				sessionCtx,
				bson.M{"id": id},
				bson.M{
					"$set": bson.M{
						"is_default": true,
						"updated_at": time.Now(),
					},
				},
			)
			if err != nil {
				return nil, err
			}
		}

		return nil, nil
	})

	return err
}
