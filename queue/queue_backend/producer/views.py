from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from .serializers import QueueMessageSerializer
from .services.queue_service import QueueService


class PublishToQueueView(APIView):

    @extend_schema(
        request=QueueMessageSerializer,
        responses={201: None},
        description="Create a queue (if not exists) and publish a message"
    )
    def post(self, request):
        serializer = QueueMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        queue = serializer.validated_data["queue"]
        payload = {
            "event": serializer.validated_data["event"],
            "data": serializer.validated_data["data"],
        }

        QueueService().publish(queue, payload)

        return Response(
            {
                "status": "queued",
                "queue": queue,
                "payload": payload,
            },
            status=status.HTTP_201_CREATED,
        )
