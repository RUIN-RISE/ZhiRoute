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
FROM registry.cn-hangzhou.aliyuncs.com/modelscope-repo/modelscope:ubuntu22.04-py310-torch2.1.2-tf2.14.0-1.11.0 as runtime

WORKDIR /app

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
