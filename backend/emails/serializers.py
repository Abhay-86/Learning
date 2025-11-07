from rest_framework import serializers

class SendTemplateEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=255)
    template_name = serializers.CharField()
    context = serializers.JSONField(required=False, default=dict)
    attachment_no = serializers.CharField(required=False, allow_blank=True)

class BulkEmailSendSerializer(serializers.Serializer):
    context = serializers.JSONField(required=False, default=dict)