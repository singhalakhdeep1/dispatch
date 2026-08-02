# Terraform configuration for dispatch AWS infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "dispatch" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "dispatch-vpc"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.dispatch.id
  cidr_block              = "10.0.${count.index}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "dispatch-public-${count.index}"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "dispatch" {
  name     = "dispatch-eks"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.public[*].id
  }
}

# EKS Node Group
resource "aws_eks_node_group" "dispatch" {
  cluster_name    = aws_eks_cluster.dispatch.name
  node_group_name = "dispatch-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.public[*].id

  scaling_config {
    desired_size = 3
    max_size     = 6
    min_size     = 2
  }

  instance_types = ["t3.medium"]
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "dispatch" {
  cluster_id           = "dispatch-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# MQ (RabbitMQ)
resource "aws_mq_broker" "dispatch" {
  broker_name = "dispatch-rabbitmq"
  engine_type = "RabbitMQ"
  host_instance_type = "mq.t3.micro"
  deployment_mode = "SINGLE_INSTANCE"

  user {
    username = "admin"
    password = var.mq_password
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}
