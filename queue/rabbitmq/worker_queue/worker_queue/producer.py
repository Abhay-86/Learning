import pika
import json

credentials = pika.PlainCredentials("admin", "admin123")

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='localhost',
        credentials=credentials
    )
)

channel = connection.channel()
channel.queue_declare(queue='task_queue', durable=True)

tasks = [
    {"task": "sum", "start": 1, "end": 10},
    {"task": "subtract", "start": 1, "end": 10},
    {"task": "multiply", "start": 1, "end": 10}
]

for t in tasks:
    message = json.dumps(t)
    print("Sending task:", message)
    channel.basic_publish(
        exchange='',
        routing_key='task_queue',
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=pika.DeliveryMode.Persistent
        )
    )
    print(f" [x] Sent {message}")

connection.close()