#!/bin/bash
set -e

REGION="eu-west-2"
GITHUB_ORG="bhebing"   # ← fill in
GITHUB_REPO="family_recipes"

# Prompt for secrets (not stored in the script)
read -p "AUTH_SECRET: " AUTH_SECRET
read -p "GOOGLE_CLIENT_ID: " GOOGLE_CLIENT_ID
read -s -p "GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET
echo

echo ""
echo "==> Deploying ECR..."
aws cloudformation deploy \
  --region $REGION \
  --stack-name family-recipes-ecr \
  --template-file 01-ecr.yml \
  --capabilities CAPABILITY_NAMED_IAM

echo "==> Deploying VPC..."
aws cloudformation deploy \
  --region $REGION \
  --stack-name family-recipes-vpc \
  --template-file 02-vpc.yml

echo "==> Deploying RDS..."
aws cloudformation deploy \
  --region $REGION \
  --stack-name family-recipes-rds \
  --template-file 03-rds.yml

echo "==> Deploying Secrets..."
aws cloudformation deploy \
  --region $REGION \
  --stack-name family-recipes-secrets \
  --template-file 04-secrets.yml \
  --parameter-overrides \
    AuthSecret="$AUTH_SECRET" \
    GoogleClientId="$GOOGLE_CLIENT_ID" \
    GoogleClientSecret="$GOOGLE_CLIENT_SECRET" \
  --capabilities CAPABILITY_NAMED_IAM

DB_SECRET_ARN=$(aws cloudformation list-exports \
  --region $REGION \
  --query "Exports[?Name=='family-recipes-db-secret-arn'].Value" \
  --output text)

APP_SECRET_ARN=$(aws cloudformation list-exports \
  --region $REGION \
  --query "Exports[?Name=='family-recipes-app-secret-arn'].Value" \
  --output text)

echo "==> Deploying ECS IAM roles..."
aws cloudformation deploy \
  --region $REGION \
  --stack-name family-recipes-iam \
  --template-file 05-iam.yml \
  --capabilities CAPABILITY_NAMED_IAM

echo "==> Deploying GitHub Actions IAM role..."
EXISTING_OIDC_ARN=$(aws iam list-open-id-connect-providers \
  --query "OpenIDConnectProviderList[?contains(Arn, 'token.actions.githubusercontent.com')].Arn | [0]" \
  --output text 2>/dev/null || echo "")
# Treat "None" (no match) as empty
[ "$EXISTING_OIDC_ARN" = "None" ] && EXISTING_OIDC_ARN=""
if [ -n "$EXISTING_OIDC_ARN" ]; then
  echo "    Using existing OIDC provider: $EXISTING_OIDC_ARN"
fi

aws cloudformation deploy \
  --region $REGION \
  --stack-name family-recipes-github-iam \
  --template-file 05b-github-iam.yml \
  --parameter-overrides \
    GitHubOrg="$GITHUB_ORG" \
    GitHubRepo="$GITHUB_REPO" \
    OIDCProviderArn="${EXISTING_OIDC_ARN:-}" \
  --capabilities CAPABILITY_NAMED_IAM

echo "==> Deploying ALB + HTTPS + Route53..."
echo "    (ACM certificate DNS validation may take a few minutes...)"
aws cloudformation deploy \
  --region $REGION \
  --stack-name family-recipes-alb \
  --template-file 06-alb.yml

IMAGE_URI=$(aws cloudformation list-exports \
  --region $REGION \
  --query "Exports[?Name=='family-recipes-ecr-uri'].Value" \
  --output text):latest

echo "==> Deploying ECS..."
aws cloudformation deploy \
  --region $REGION \
  --stack-name family-recipes-ecs \
  --template-file 07-ecs.yml \
  --parameter-overrides \
    ImageUri="$IMAGE_URI" \
    AppSecretArn="$APP_SECRET_ARN" \
    DBSecretArn="$DB_SECRET_ARN" \
  --capabilities CAPABILITY_NAMED_IAM

echo ""
echo "✓ All stacks deployed."
echo ""
echo "Next steps:"
echo "  1. Push an image to ECR so ECS has something to run:"
echo "     aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin \$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com"
echo "     docker build -t $IMAGE_URI . && docker push $IMAGE_URI"
echo ""
echo "  2. Add AWS_DEPLOY_ROLE_ARN to GitHub secrets:"
GITHUB_ROLE_ARN=$(aws cloudformation list-exports \
  --region $REGION \
  --query "Exports[?Name=='family-recipes-github-role-arn'].Value" \
  --output text)
echo "     $GITHUB_ROLE_ARN"
echo ""
echo "  3. Update Google OAuth callback URL to https://klaproosnet.nl/api/auth/callback/google"
