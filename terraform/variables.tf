variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "mq_password" {
  description = "RabbitMQ password"
  type        = string
  sensitive   = true
}
