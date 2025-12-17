from rest_framework import serializers


class QueueMessageSerializer(serializers.Serializer):
    queue = serializers.CharField(max_length=255)
    event = serializers.CharField(max_length=255)
    data = serializers.JSONField()
