package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var db *sql.DB

type PaymentIntentRequest struct {
	OrderID     string  `json:"order_id" binding:"required"`
	UserID      string  `json:"user_id" binding:"required"`
	Amount      float64 `json:"amount" binding:"required"`
	PaymentMode string  `json:"payment_mode"` // UPI, CARD, NETBANKING, COD
}

type PaymentVerifyRequest struct {
	PaymentID string `json:"payment_id" binding:"required"`
	Status    string `json:"status" binding:"required"` // SUCCESS, FAILED
}

func initDB() {
	_ = godotenv.Load()

	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "flipkart-postgres"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "5432"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}
	dbPass := os.Getenv("DB_PASSWORD")
	if dbPass == "" {
		dbPass = "postgrespassword"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "flipkart_payments"
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPass, dbName)

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Printf("Failed to open DB connection: %v", err)
		return
	}

	createTableQuery := `
	CREATE TABLE IF NOT EXISTS payments (
		id UUID PRIMARY KEY,
		order_id VARCHAR(100) NOT NULL,
		user_id VARCHAR(100) NOT NULL,
		amount NUMERIC(10, 2) NOT NULL,
		payment_mode VARCHAR(50) NOT NULL,
		status VARCHAR(50) NOT NULL,
		transaction_ref VARCHAR(100),
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(createTableQuery)
	if err != nil {
		log.Printf("Failed to create payments table: %v", err)
	} else {
		log.Println("[payment-service] PostgreSQL payments table ready.")
	}
}

func main() {
	initDB()

	port := os.Getenv("PORT")
	if port == "" {
		port = "5006"
	}

	r := gin.Default()

	// Health Check
	r.GET("/api/v1/payments/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":   "healthy",
			"service":  "payment-service (Go / Gin)",
			"database": "PostgreSQL",
		})
	})

	// Initiate Payment
	r.POST("/api/v1/payments/initiate", func(c *gin.Context) {
		var req PaymentIntentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		paymentID := uuid.New()
		paymentMode := req.PaymentMode
		if paymentMode == "" {
			paymentMode = "UPI"
		}
		status := "PENDING"
		txnRef := fmt.Sprintf("TXN-%d", time.Now().UnixNano())

		if db != nil {
			_, err := db.Exec(
				"INSERT INTO payments (id, order_id, user_id, amount, payment_mode, status, transaction_ref) VALUES ($1, $2, $3, $4, $5, $6, $7)",
				paymentID, req.OrderID, req.UserID, req.Amount, paymentMode, status, txnRef,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		c.JSON(http.StatusCreated, gin.H{
			"payment_id":      paymentID.String(),
			"order_id":        req.OrderID,
			"amount":          req.Amount,
			"status":          status,
			"transaction_ref": txnRef,
			"gateway_url":     "https://checkout.flipkart.internal/pay/" + paymentID.String(),
		})
	})

	// Verify Payment
	r.POST("/api/v1/payments/verify", func(c *gin.Context) {
		var req PaymentVerifyRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if db != nil {
			_, err := db.Exec("UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
				req.Status, req.PaymentID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"payment_id": req.PaymentID,
			"status":     req.Status,
			"message":    "Payment status updated successfully",
		})
	})

	// Get Payment By Order ID
	r.GET("/api/v1/payments/order/:orderId", func(c *gin.Context) {
		orderID := c.Param("orderId")
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database unavailable"})
			return
		}

		row := db.QueryRow("SELECT id, order_id, user_id, amount, payment_mode, status, transaction_ref, created_at FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1", orderID)

		var id, ordID, usrID, pMode, status, txnRef string
		var amount float64
		var createdAt time.Time

		err := row.Scan(&id, &ordID, &usrID, &amount, &pMode, &status, &txnRef, &createdAt)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment record not found for order"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"payment_id":       id,
			"order_id":         ordID,
			"user_id":          usrID,
			"amount":           amount,
			"payment_mode":     pMode,
			"status":           status,
			"transaction_ref":  txnRef,
			"created_at":       createdAt,
		})
	})

	log.Printf("Flipkart Payment Service (Go/Gin) listening on :%s", port)
	_ = r.Run(":" + port)
}
