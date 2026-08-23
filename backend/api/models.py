from django.db import models
from django.contrib.auth.models import User

class IfcFile(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ifc_files')
    file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    filename = models.CharField(max_length=255)
    
    def __str__(self):
        return f"{self.owner.username} - {self.filename}"