package service

import (
	"errors"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
)

type PlanService struct {
	planRepo *repository.PlanRepository
}

func NewPlanService(planRepo *repository.PlanRepository) *PlanService {
	return &PlanService{
		planRepo: planRepo,
	}
}

func (s *PlanService) GetAllPlans() ([]*model.Plan, error) {
	return s.planRepo.FindAll()
}

func (s *PlanService) GetPlanByID(id int64) (*model.Plan, error) {
	plan, err := s.planRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if plan == nil {
		return nil, errors.New("plan not found")
	}
	return plan, nil
}

func (s *PlanService) GetDefaultPlan() (*model.Plan, error) {
	plan, err := s.planRepo.FindDefault()
	if err != nil {
		return nil, err
	}
	if plan == nil {
		return nil, errors.New("default plan not found")
	}
	return plan, nil
}

func (s *PlanService) CreatePlan(name string, dailyDepositLimit, dailyWithdrawalLimit, dailyProfitLimit, price float64, isDefault bool) (*model.Plan, error) {
	plan := &model.Plan{
		Name:                 name,
		DailyDepositLimit:    dailyDepositLimit,
		DailyWithdrawalLimit: dailyWithdrawalLimit,
		DailyProfitLimit:     dailyProfitLimit,
		Price:                price,
		IsDefault:            isDefault,
	}

	// If this plan is set as default, unset all other plans as default
	if isDefault {
		if err := s.planRepo.SetDefault(0); err != nil {
			return nil, err
		}
	}

	createdPlan, err := s.planRepo.Create(plan)
	if err != nil {
		return nil, err
	}

	// If this plan is set as default, update it (to make sure the default is set correctly)
	if isDefault {
		if err := s.planRepo.SetDefault(createdPlan.ID); err != nil {
			return nil, err
		}
	}

	return createdPlan, nil
}

func (s *PlanService) UpdatePlan(id int64, name string, dailyDepositLimit, dailyWithdrawalLimit, dailyProfitLimit, price float64, isDefault bool) (*model.Plan, error) {
	plan, err := s.planRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if plan == nil {
		return nil, errors.New("plan not found")
	}

	plan.Name = name
	plan.DailyDepositLimit = dailyDepositLimit
	plan.DailyWithdrawalLimit = dailyWithdrawalLimit
	plan.DailyProfitLimit = dailyProfitLimit
	plan.Price = price
	plan.IsDefault = isDefault

	if err := s.planRepo.Update(plan); err != nil {
		return nil, err
	}

	// If this plan is set as default, unset all other plans as default
	if isDefault {
		if err := s.planRepo.SetDefault(id); err != nil {
			return nil, err
		}
	}

	return plan, nil
}

func (s *PlanService) DeletePlan(id int64) error {
	plan, err := s.planRepo.FindByID(id)
	if err != nil {
		return err
	}
	if plan == nil {
		return errors.New("plan not found")
	}

	// Check if the plan is set as default
	if plan.IsDefault {
		return errors.New("cannot delete the default plan")
	}

	// TODO: Check if there are users using this plan
	// If so, return an error

	return s.planRepo.Delete(id)
}

func (s *PlanService) SetDefaultPlan(id int64) error {
	plan, err := s.planRepo.FindByID(id)
	if err != nil {
		return err
	}
	if plan == nil {
		return errors.New("plan not found")
	}

	return s.planRepo.SetDefault(id)
}
