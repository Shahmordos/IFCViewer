import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import IfcFile
from django.contrib.auth.models import User

@pytest.mark.django_db
def test_ifc_file_creation(user):
    content = b"ISO-10303-21; HEADER; ..."
    uploaded = SimpleUploadedFile("test.ifc", content, content_type="application/octet-stream")
    instance = IfcFile.objects.create(
        owner=user,
        file=uploaded,
        filename=uploaded.name
    )
    assert instance.id is not None
    assert str(instance) == f"{user.username} - test.ifc"
    assert instance.file.name.startswith("uploads/")