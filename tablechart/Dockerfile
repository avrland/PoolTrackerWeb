# Use an official Python runtime as a parent image
FROM python:3.14.2-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies (psycopg2-binary requires no system libs)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the code into the container
COPY . .

# Copy and prepare entrypoint script
RUN chmod +x /app/entrypoint.sh

# Create a directory for logs
RUN mkdir -p /logs

# Expose port 8000 for the Django app
EXPOSE 8000

CMD ["/app/entrypoint.sh"]