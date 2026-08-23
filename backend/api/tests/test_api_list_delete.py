import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from api.models import IfcFile
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_list_files(auth_client, user):
    for name in ['a.ifc', 'b.ifc']:
        IfcFile.objects.create(
            owner=user,
            file=SimpleUploadedFile(name, b"data"),
            filename=name
        )
    other = User.objects.create_user(username='other', password='pass')
    IfcFile.objects.create(
        owner=other,
        file=SimpleUploadedFile('c.ifc', b"data"),
        filename='c.ifc'
    )

    url = reverse('list_files')
    response = auth_client.get(url)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Проверяем, что в ответе только файлы текущего пользователя
    filenames = {item['filename'] for item in data}
    assert filenames == {'a.ifc', 'b.ifc'}

@pytest.mark.django_db
def test_delete_file(auth_client, user):
    instance = IfcFile.objects.create(
        owner=user,
        file=SimpleUploadedFile('todelete.ifc', b"data"),
        filename='todelete.ifc'
    )
    url = reverse('delete_file', args=[instance.filename])
    response = auth_client.delete(url)

    assert response.status_code == 200
    assert response.data['message'] == "Удалено файлов: 1"
    assert not IfcFile.objects.filter(id=instance.id).exists()

@pytest.mark.django_db
def test_delete_another_users_file(auth_client, user):
    other = User.objects.create_user(username='other', password='pass')
    instance = IfcFile.objects.create(
        owner=other,
        file=SimpleUploadedFile('secret.ifc', b"data"),
        filename='secret.ifc'
    )
    url = reverse('delete_file', args=[instance.filename])
    response = auth_client.delete(url)
    assert response.status_code == 404
    assert IfcFile.objects.filter(id=instance.id).exists()