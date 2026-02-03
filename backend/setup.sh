#!/bin/bash

# Exit on error
set -e

echo "🚀 Setting up OpsNexus Backend..."

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 could not be found. Please install Python 3."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
else
    echo "✅ Virtual environment already exists."
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo "⬇️  Installing dependencies from requirements.txt..."
    pip install -r requirements.txt
else
    echo "⚠️  requirements.txt not found!"
    exit 1
fi

echo "🎉 Setup complete!"
echo ""
echo "To run the server, use:"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload"
