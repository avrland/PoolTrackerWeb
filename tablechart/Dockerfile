# Use an official Python runtime as a parent image
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Set environment variable for Django DEBUG setting
ENV DJANGO_DEBUG=False

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the code into the container
COPY . .

RUN sed -i "s/DEBUG = True/DEBUG = ${DJANGO_DEBUG}/g" /tablechart/settings.py

# Expose port 8000 for the Django app
EXPOSE 8000

# Specify the command to run when the container starts
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
