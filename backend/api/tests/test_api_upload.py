import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from api.models import IfcFile

@pytest.mark.django_db
def test_upload_requires_auth(anon_client):
    url = reverse('upload_ifc')
    response = anon_client.post(url, {})
    assert response.status_code == 401  

@pytest.mark.django_db
def test_upload_success(auth_client, user):
    url = reverse('upload_ifc')
    content = b"IFC test content"
    uploaded = SimpleUploadedFile("project.ifc", content, content_type="application/octet-stream")
    response = auth_client.post(url, {'file': uploaded}, format='multipart')

    assert response.status_code == 201
    assert IfcFile.objects.filter(owner=user, filename="project.ifc").exists()

@pytest.mark.django_db
def test_upload_replaces_existing_with_same_name(auth_client, user):
    url = reverse('upload_ifc')
    file1 = SimpleUploadedFile("duplicate.ifc", b"content1")
    auth_client.post(url, {'file': file1}, format='multipart')
    assert IfcFile.objects.filter(owner=user, filename="duplicate.ifc").count() == 1

    file2 = SimpleUploadedFile("duplicate.ifc", b"content2")
    response = auth_client.post(url, {'file': file2}, format='multipart')

    assert response.status_code == 201
    assert IfcFile.objects.filter(owner=user, filename="duplicate.ifc").count() == 1
    instance = IfcFile.objects.get(owner=user, filename="duplicate.ifc")
    instance.file.open('rb')
    assert instance.file.read() == b"content2"
    instance.file.close()

@pytest.mark.django_db
def test_upload_missing_file(auth_client):
    url = reverse('upload_ifc')
    response = auth_client.post(url, {}, format='multipart')
    assert response.status_code == 400
    assert 'error' in response.data