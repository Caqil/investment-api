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

type TaskRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewTaskRepository(conn *database.MongoDBConnection) *TaskRepository {
	return &TaskRepository{
		db:         conn.Database,
		collection: conn.GetCollection("tasks"),
	}
}

// GetDB returns the database connection
func (r *TaskRepository) GetDB() *mongo.Database {
	return r.db
}

func (r *TaskRepository) Create(task *model.Task) (*model.Task, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "task_id")
	if err != nil {
		return nil, err
	}

	// Set task ID and timestamps
	task.ID = id
	now := time.Now()
	task.CreatedAt = now
	task.UpdatedAt = now

	// Insert task
	result, err := r.collection.InsertOne(ctx, task)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		task.ObjectID = oid
	}

	return task, nil
}

func (r *TaskRepository) FindByID(id int64) (*model.Task, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var task model.Task
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&task)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &task, nil
}

func (r *TaskRepository) FindAll() ([]*model.Task, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []*model.Task
	if err = cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *TaskRepository) FindByMandatory(isMandatory bool) ([]*model.Task, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	options := options.Find().SetSort(bson.D{{Key: "created_at", Value: 1}})

	cursor, err := r.collection.Find(ctx, bson.M{"is_mandatory": isMandatory}, options)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tasks []*model.Task
	if err = cursor.All(ctx, &tasks); err != nil {
		return nil, err
	}

	return tasks, nil
}

func (r *TaskRepository) Update(task *model.Task) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	task.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": task.ID},
		bson.M{"$set": task},
	)

	return err
}

func (r *TaskRepository) Delete(id int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteOne(ctx, bson.M{"id": id})
	return err
}

// UserTaskRepository handles user task operations
type UserTaskRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewUserTaskRepository(conn *database.MongoDBConnection) *UserTaskRepository {
	return &UserTaskRepository{
		db:         conn.Database,
		collection: conn.GetCollection("user_tasks"),
	}
}

func (r *UserTaskRepository) Create(userTask *model.UserTask) (*model.UserTask, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Generate auto-incrementing ID
	id, err := database.GetNextSequence(r.db, "user_task_id")
	if err != nil {
		return nil, err
	}

	// Set userTask ID and timestamps
	userTask.ID = id
	now := time.Now()
	userTask.CreatedAt = now
	userTask.UpdatedAt = now

	// Insert userTask
	result, err := r.collection.InsertOne(ctx, userTask)
	if err != nil {
		return nil, err
	}

	// Set ObjectID from the result
	if oid, ok := result.InsertedID.(primitive.ObjectID); ok {
		userTask.ObjectID = oid
	}

	return userTask, nil
}

func (r *UserTaskRepository) FindByID(id int64) (*model.UserTask, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var userTask model.UserTask
	err := r.collection.FindOne(ctx, bson.M{"id": id}).Decode(&userTask)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &userTask, nil
}

func (r *UserTaskRepository) FindByUserID(userID int64) ([]*model.UserTask, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := r.collection.Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var userTasks []*model.UserTask
	if err = cursor.All(ctx, &userTasks); err != nil {
		return nil, err
	}

	return userTasks, nil
}

func (r *UserTaskRepository) FindByUserIDAndTaskID(userID, taskID int64) (*model.UserTask, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var userTask model.UserTask
	err := r.collection.FindOne(ctx, bson.M{
		"user_id": userID,
		"task_id": taskID,
	}).Decode(&userTask)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}

	return &userTask, nil
}

func (r *UserTaskRepository) Update(userTask *model.UserTask) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userTask.UpdatedAt = time.Now()

	_, err := r.collection.UpdateOne(
		ctx,
		bson.M{"id": userTask.ID},
		bson.M{"$set": userTask},
	)

	return err
}

func (r *UserTaskRepository) DeleteByTaskID(taskID int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteMany(ctx, bson.M{"task_id": taskID})
	return err
}

func (r *UserTaskRepository) DeleteByUserID(userID int64) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := r.collection.DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}

// CountCompletedTasksByUserID counts the number of completed tasks for a user
func (r *UserTaskRepository) CountCompletedTasksByUserID(userID int64) (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := r.collection.CountDocuments(ctx, bson.M{
		"user_id":      userID,
		"is_completed": true,
	})
	if err != nil {
		return 0, err
	}

	return count, nil
}
