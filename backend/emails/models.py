from django.db import models

# Create your models here.
class BulkEmailLog(models.Model):
    email = models.EmailField(unique=True)
    template_name = models.CharField(max_length=255)
    attachment_no = models.CharField(max_length=255, blank=True, null=True)
    sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} - {'Sent' if self.sent else 'Pending'}"