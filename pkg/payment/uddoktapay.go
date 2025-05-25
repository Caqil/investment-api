package payment

import (
	"bytes"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
)

// UddoktaPayClient is a client for the UddoktaPay API
type UddoktaPayClient struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
}

// NewUddoktaPayClient creates a new UddoktaPay client
func NewUddoktaPayClient(apiKey, baseURL string) *UddoktaPayClient {
	return &UddoktaPayClient{
		APIKey:     apiKey,
		BaseURL:    baseURL,
		HTTPClient: &http.Client{},
	}
}

// PaymentRequest represents a request to create a new UddoktaPay payment
type PaymentRequest struct {
	FullName    string                 `json:"full_name"`
	Email       string                 `json:"email"`
	Amount      float64                `json:"amount"`
	InvoiceID   string                 `json:"invoice_id,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	RedirectURL string                 `json:"redirect_url"`
	CancelURL   string                 `json:"cancel_url"`
	WebhookURL  string                 `json:"webhook_url"`
}

// PaymentResponse represents a response from the UddoktaPay API
type PaymentResponse struct {
	Status     string `json:"status"`
	Message    string `json:"message"`
	PaymentURL string `json:"payment_url"`
	InvoiceID  string `json:"invoice_id"`
}

// PaymentStatusResponse represents a payment status response from UddoktaPay
type PaymentStatusResponse struct {
	Status        string                 `json:"status"`
	InvoiceID     string                 `json:"invoice_id"`
	TransactionID string                 `json:"transaction_id"`
	Amount        float64                `json:"amount"`
	PaymentMethod string                 `json:"payment_method"`
	SenderNumber  string                 `json:"sender_number"`
	TransactionAt string                 `json:"transaction_at"`
	Metadata      map[string]interface{} `json:"metadata"`
}

// CreatePayment creates a new UddoktaPay payment
func (c *UddoktaPayClient) CreatePayment(req *PaymentRequest) (*PaymentResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequest("POST", c.BaseURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("RT-UDDOKTAPAY-API-KEY", c.APIKey)

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
		return nil, errors.New("UddoktaPay API error: " + string(body))
	}

	var paymentResponse PaymentResponse
	err = json.Unmarshal(body, &paymentResponse)
	if err != nil {
		return nil, err
	}

	// Check if the response indicates an error
	if paymentResponse.Status != "success" {
		return nil, errors.New("UddoktaPay error: " + paymentResponse.Message)
	}

	return &paymentResponse, nil
}

// VerifyPayment verifies a payment with UddoktaPay
func (c *UddoktaPayClient) VerifyPayment(invoiceID string) (*PaymentStatusResponse, error) {
	// Create the request payload
	payload := map[string]string{
		"invoice_id": invoiceID,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	// UddoktaPay typically has a verify-payment endpoint
	verifyURL := c.BaseURL + "/verify-payment"
	request, err := http.NewRequest("POST", verifyURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("RT-UDDOKTAPAY-API-KEY", c.APIKey)

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
		return nil, errors.New("UddoktaPay API error: " + string(body))
	}

	var statusResponse PaymentStatusResponse
	err = json.Unmarshal(body, &statusResponse)
	if err != nil {
		return nil, err
	}

	return &statusResponse, nil
}

// ValidateCallback validates a callback (webhook) from UddoktaPay
func (c *UddoktaPayClient) ValidateCallback(callbackData []byte) (*PaymentStatusResponse, error) {
	var statusResponse PaymentStatusResponse
	err := json.Unmarshal(callbackData, &statusResponse)
	if err != nil {
		return nil, err
	}

	// Verify required fields
	if statusResponse.InvoiceID == "" || statusResponse.Status == "" {
		return nil, errors.New("missing required fields in callback data")
	}

	// In a real implementation, you might want to validate the callback
	// by making a request to UddoktaPay to verify the payment status
	// For this example, we'll just return the parsed data

	return &statusResponse, nil
}

// IPN (Instant Payment Notification) is another name for the webhook/callback
func (c *UddoktaPayClient) ValidateIPN(ipnData []byte) (*PaymentStatusResponse, error) {
	return c.ValidateCallback(ipnData)
}
