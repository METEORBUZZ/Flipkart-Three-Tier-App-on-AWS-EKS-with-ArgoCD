FROM golang:1.22-alpine AS build
WORKDIR /app
COPY go.mod ./
COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o payment-service main.go

FROM alpine:3.19
WORKDIR /app
COPY --from=build /app/payment-service .
EXPOSE 5006
CMD ["./payment-service"]
