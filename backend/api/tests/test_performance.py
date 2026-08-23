import os
import time
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from api.models import IfcFile

@pytest.mark.django_db
@pytest.mark.parametrize('filename', ['small.ifc', 'medium.ifc', 'large.ifc'])
def test_download_speed(auth_client, user, filename):
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', filename)
    if not os.path.exists(fixture_path):
        pytest.skip(f"Файл {filename} не найден в fixtures")

    with open(fixture_path, 'rb') as f:
        instance = IfcFile.objects.create(
            owner=user,
            file=SimpleUploadedFile(filename, f.read()),
            filename=filename
        )

    url = reverse('get_file', args=[instance.filename])
    start = time.perf_counter()
    response = auth_client.get(url)
    end = time.perf_counter()
    duration = end - start

    assert response.status_code == 200
    file_size_mb = os.path.getsize(fixture_path) / (1024 * 1024)
    speed_mbps = file_size_mb / duration if duration > 0 else float('inf')

    print(f"\nFile: {filename}, Size: {file_size_mb:.2f} MB, "
          f"Time: {duration:.3f}s, Speed: {speed_mbps:.2f} MB/s")