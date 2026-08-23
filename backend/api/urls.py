from django.urls import path
from .views import upload_ifc, list_files, get_file, delete_file

urlpatterns = [
    path('upload/', upload_ifc, name='upload_ifc'),
    path('files/', list_files, name='list_files'),
    path('file/<str:filename>/', get_file, name='get_file'),
    path('delete/<str:filename>/', delete_file, name='delete_file'),
]
