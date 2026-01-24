# Build Stage for Frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend
# Copy frontend package files
COPY temp_frontend/package*.json ./
# Install dependencies
RUN npm install

# Copy frontend source code
COPY temp_frontend/ ./
# Build frontend
RUN npm run build

# Runtime Stage
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for PyMuPDF (fitz) if needed, though wheels usually exist.
# kept minimal for speed.


# Copy requirements FIRST to leverage cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy built frontend assets from builder stage
# Ensure we copy into the location main.py expects: /app/temp_frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/temp_frontend/dist

# Expose port (ModelScope expects 7860)
EXPOSE 7860

# Run the application
CMD ["python", "main.py"]
