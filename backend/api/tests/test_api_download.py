import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from api.models import IfcFile
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_download_requires_auth(anon_client, user):
    instance = IfcFile.objects.create(
        owner=user,
        file=SimpleUploadedFile("test.ifc", b"data"),
        filename="test.ifc"
    )
    url = reverse('get_file', args=[instance.filename])
    response = anon_client.get(url)
    assert response.status_code == 401

@pytest.mark.django_db
def test_download_success(auth_client, user):
    instance = IfcFile.objects.create(
        owner=user,
        file=SimpleUploadedFile("model.ifc", b"IFC binary data"),
        filename="model.ifc"
    )
    url = reverse('get_file', args=[instance.filename])
    response = auth_client.get(url)

    assert response.status_code == 200
    assert response['Content-Type'] in ('application/octet-stream', 'application/ifc')
    assert response['Content-Disposition'] == 'inline; filename="model.ifc"'
    downloaded_content = b''.join(response.streaming_content)
    assert downloaded_content == b"IFC binary data"

@pytest.mark.django_db
def test_download_another_users_file(auth_client, user):
    other_user = User.objects.create_user(username='other', password='pass')
    instance = IfcFile.objects.create(
        owner=other_user,
        file=SimpleUploadedFile("secret.ifc", b"secret"),
        filename="secret.ifc"
    )
    url = reverse('get_file', args=[instance.filename])
    response = auth_client.get(url)
    assert response.status_code == 404

@pytest.mark.django_db
def test_download_nonexistent_file(auth_client):
    url = reverse('get_file', args=['ghost.ifc'])
    response = auth_client.get(url)
    assert response.status_code == 404