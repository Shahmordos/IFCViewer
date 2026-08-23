from rest_framework import serializers
from .models import IfcFile

class IfcFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = IfcFile
        fields = ['id', 'filename', 'file', 'uploaded_at']
