from django.urls import path
from .views import PublishToQueueView

urlpatterns = [
    path("queue/publish/", PublishToQueueView.as_view()),
]
