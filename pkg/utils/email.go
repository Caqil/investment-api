package utils

import (
	"fmt"
	"net/smtp"
)

type EmailService struct {
	config struct {
		SMTPHost     string
		SMTPPort     string
		SMTPUsername string
		SMTPPassword string
		FromEmail    string
		FromName     string
	}
}

func NewEmailService(config struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
}) *EmailService {
	return &EmailService{
		config: config,
	}
}

func (s *EmailService) SendVerificationEmail(to, code string) error {
	subject := "Verify Your Email"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Verify Your Email Address</h2>
			<p>Thank you for registering. Please use the following code to verify your email address:</p>
			<h3>%s</h3>
			<p>This code will expire in 1 hour.</p>
			<p>Best regards,<br/>Investment App Team</p>
		</body>
		</html>
	`, code)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendWithdrawalApprovalEmail(to string, amount float64) error {
	subject := "Withdrawal Approved"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Withdrawal Approved</h2>
			<p>Your withdrawal request for %.2f BDT has been approved.</p>
			<p>The funds should be credited to your account within the next 24 hours.</p>
			<p>Best regards,<br/>Investment App Team</p>
		</body>
		</html>
	`, amount)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendWithdrawalRejectionEmail(to string, amount float64, reason string) error {
	subject := "Withdrawal Rejected"
	body := fmt.Sprintf(`
		<html>
		<body>
			<h2>Withdrawal Rejected</h2>
			<p>Your withdrawal request for %.2f BDT has been rejected.</p>
			<p>Reason: %s</p>
			<p>If you have any questions, please contact our support team.</p>
			<p>Best regards,<br/>Investment App Team</p>
		</body>
		</html>
	`, amount, reason)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) sendEmail(to, subject, body string) error {
	// Set up authentication information
	auth := smtp.PlainAuth(
		"",
		s.config.SMTPUsername,
		s.config.SMTPPassword,
		s.config.SMTPHost,
	)

	// Compose the message
	from := fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail)
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	headers := "From: " + from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		mime

	message := headers + "\r\n" + body

	// Connect to the server, authenticate, set the sender and recipient,
	// and send the email all in one step
	err := smtp.SendMail(
		s.config.SMTPHost+":"+s.config.SMTPPort,
		auth,
		s.config.FromEmail,
		[]string{to},
		[]byte(message),
	)
	if err != nil {
		return err
	}

	return nil
}
