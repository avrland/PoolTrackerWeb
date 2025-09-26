import boto3
from django.conf import settings
from botocore.exceptions import NoCredentialsError

def get_dynamodb_client():
    """Zwraca klienta DynamoDB z automatyczną konfiguracją credentials"""
    try:
        # boto3 automatycznie znajdzie credentials z:
        # 1. Environment variables
        # 2. ~/.aws/credentials
        # 3. IAM roles (jeśli uruchomione na EC2)
        return boto3.client(
            'dynamodb',
            region_name=getattr(settings, 'AWS_DEFAULT_REGION', 'eu-north-1')
        )
    except NoCredentialsError:
        raise Exception("AWS credentials nie zostały skonfigurowane!")

def get_dynamodb_resource():
    """Zwraca resource DynamoDB dla łatwiejszego API"""
    try:
        return boto3.resource(
            'dynamodb',
            region_name=getattr(settings, 'AWS_DEFAULT_REGION', 'eu-north-1')
        )
    except NoCredentialsError:
        raise Exception("AWS credentials nie zostały skonfigurowane!")