import json
import pika
from django.conf import settings


class QueueService:
    def __init__(self):
        cfg = settings.RABBITMQ

        self.credentials = pika.PlainCredentials(
            cfg["USER"],
            cfg["PASSWORD"]
        )

        self.parameters = pika.ConnectionParameters(
            host=cfg["HOST"],
            port=cfg["PORT"],
            credentials=self.credentials,
            heartbeat=600,
            blocked_connection_timeout=300,
        )

    def _get_channel(self):
        connection = pika.BlockingConnection(self.parameters)
        channel = connection.channel()
        return connection, channel

    def declare_queue(self, queue_name: str):
        connection, channel = self._get_channel()

        channel.queue_declare(
            queue=queue_name,
            durable=True
        )

        connection.close()

    def publish(self, queue_name: str, payload: dict):
        connection, channel = self._get_channel()

        # Ensure queue exists
        channel.queue_declare(
            queue=queue_name,
            durable=True
        )

        channel.basic_publish(
            exchange="",
            routing_key=queue_name,
            body=json.dumps(payload),
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=2,  
            )
        )

        connection.close()
