import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

@pytest.fixture
def user(db):
    return User.objects.create_user(username='testuser', password='testpass')

@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def anon_client():
    return APIClient()