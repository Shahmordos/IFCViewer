from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
from .models import IfcFile
from .serializers import IfcFileSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_files(request):
    files = IfcFile.objects.filter(owner=request.user)
    serializer = IfcFileSerializer(files, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_ifc(request):
    file = request.FILES.get('file')
    if not file:
        return Response({"error": "Файл не получил"}, status=400)
    
    IfcFile.objects.filter(filename=file.name, owner=request.user).delete()
    
    ifc = IfcFile.objects.create(
        file=file, 
        filename=file.name, 
        owner=request.user
    )
    serializer = IfcFileSerializer(ifc)
    return Response(serializer.data, status=201)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_file(request, filename):
    ifc = IfcFile.objects.filter(filename=filename, owner=request.user).last()
    if not ifc:
        return Response({"error": "Файл не найден или доступ запрещен"}, status=404)
    return FileResponse(ifc.file.open('rb'), filename=ifc.filename)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_file(request, filename):
    deleted_count, _ = IfcFile.objects.filter(filename=filename, owner=request.user).delete()
    
    if deleted_count == 0:
        return Response({"error": "Файл не найден"}, status=404)
        
    return Response({"message": f"Удалено файлов: {deleted_count}"}, status=200)