#!/bin/bash
# Generate a secure random JWT secret

# Generate a 64-character random string
SECRET=$(openssl rand -base64 48)

echo "Generated JWT secret: $SECRET"
echo ""
echo "Add this to my .env file:"
echo "JWT_SECRET=$SECRET"
