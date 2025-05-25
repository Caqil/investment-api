package payment

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
)

// CoinGateClient is a client for the CoinGate API
type CoinGateClient struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
}

// NewCoinGateClient creates a new CoinGate client
func NewCoinGateClient(apiKey string, sandbox bool) *CoinGateClient {
	baseURL := "https://api.coingate.com/v2"
	if sandbox {
		baseURL = "https://api-sandbox.coingate.com/v2"
	}

	return &CoinGateClient{
		APIKey:     apiKey,
		BaseURL:    baseURL,
		HTTPClient: &http.Client{},
	}
}

// CreateOrderRequest represents a request to create a new CoinGate order
type CreateOrderRequest struct {
	OrderID          string  `json:"order_id"`
	PriceAmount      float64 `json:"price_amount"`
	PriceCurrency    string  `json:"price_currency"`
	ReceiveCurrency  string  `json:"receive_currency"`
	Title            string  `json:"title"`
	Description      string  `json:"description"`
	CallbackURL      string  `json:"callback_url"`
	SuccessURL       string  `json:"success_url"`
	CancelURL        string  `json:"cancel_url"`
	PurchaserEmail   string  `json:"purchaser_email,omitempty"`
	PurchaserName    string  `json:"purchaser_name,omitempty"`
	PurchaserCity    string  `json:"purchaser_city,omitempty"`
	PurchaserCountry string  `json:"purchaser_country,omitempty"`
}

// CreateOrderResponse represents a response from the CoinGate API
type CreateOrderResponse struct {
	ID              string  `json:"id"`
	Status          string  `json:"status"`
	PriceAmount     float64 `json:"price_amount,string"`
	PriceCurrency   string  `json:"price_currency"`
	ReceiveCurrency string  `json:"receive_currency"`
	PaymentURL      string  `json:"payment_url"`
	CreatedAt       string  `json:"created_at"`
	OrderID         string  `json:"order_id"`
	Token           string  `json:"token"`
	CallbackURL     string  `json:"callback_url"`
	SuccessURL      string  `json:"success_url"`
	CancelURL       string  `json:"cancel_url"`
}

// OrderStatus represents the status of a CoinGate order
type OrderStatus struct {
	ID              string  `json:"id"`
	Status          string  `json:"status"`
	PriceAmount     float64 `json:"price_amount,string"`
	PriceCurrency   string  `json:"price_currency"`
	ReceiveCurrency string  `json:"receive_currency"`
	PaymentURL      string  `json:"payment_url"`
	CreatedAt       string  `json:"created_at"`
	OrderID         string  `json:"order_id"`
}

// CreateOrder creates a new CoinGate order
func (c *CoinGateClient) CreateOrder(req *CreateOrderRequest) (*CreateOrderResponse, error) {
	url := fmt.Sprintf("%s/orders", c.BaseURL)

	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Token "+c.APIKey)

	response, err := c.HTTPClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("CoinGate API error: %s", body)
	}

	var orderResponse CreateOrderResponse
	err = json.Unmarshal(body, &orderResponse)
	if err != nil {
		return nil, err
	}

	return &orderResponse, nil
}

// GetOrder gets a CoinGate order by ID
func (c *CoinGateClient) GetOrder(orderID string) (*OrderStatus, error) {
	url := fmt.Sprintf("%s/orders/%s", c.BaseURL, orderID)

	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Token "+c.APIKey)

	response, err := c.HTTPClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("CoinGate API error: %s", body)
	}

	var orderStatus OrderStatus
	err = json.Unmarshal(body, &orderStatus)
	if err != nil {
		return nil, err
	}

	return &orderStatus, nil
}

// ValidateCallback validates a callback from CoinGate
func (c *CoinGateClient) ValidateCallback(callbackData []byte) (map[string]interface{}, error) {
	var callbackMap map[string]interface{}
	err := json.Unmarshal(callbackData, &callbackMap)
	if err != nil {
		return nil, err
	}

	// Verify required fields
	requiredFields := []string{"id", "status", "order_id"}
	for _, field := range requiredFields {
		if _, ok := callbackMap[field]; !ok {
			return nil, errors.New("Missing required field: " + field)
		}
	}

	// You can add additional validation here if needed
	// For example, you might want to check the signature if CoinGate provides one

	return callbackMap, nil
}
