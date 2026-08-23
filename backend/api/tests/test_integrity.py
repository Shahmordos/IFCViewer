import hashlib
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

@pytest.mark.django_db
def test_upload_download_integrity(auth_client):
    content = b"ISO-10303-21;\nHEADER;\nDATA;\n#1=IFCPERSON($,$,$,$,$,$,$);\nENDSEC;\n"
    original_hash = hashlib.sha256(content).hexdigest()

    uploaded_file = SimpleUploadedFile("test.ifc", content, content_type="application/octet-stream")
    response = auth_client.post(
        reverse('upload_ifc'),
        {'file': uploaded_file},
        format='multipart'
    )
    assert response.status_code == 201
    filename = response.data['filename']

    download_response = auth_client.get(reverse('get_file', args=[filename]))
    assert download_response.status_code == 200

    downloaded_content = b''.join(download_response.streaming_content)
    downloaded_hash = hashlib.sha256(downloaded_content).hexdigest()
    assert downloaded_hash == original_hash