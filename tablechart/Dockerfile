# Use an official Python runtime as a parent image
FROM python:3.9

# Copy the requirements file into the container
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the code into the container
COPY . .

# Expose port 8000 for the Django app
EXPOSE 8000

# Specify the command to run when the container starts
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]