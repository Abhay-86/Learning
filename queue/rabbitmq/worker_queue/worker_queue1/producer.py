import pika
import json
import time

credentials = pika.PlainCredentials("admin", "admin123")

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host='localhost',
        credentials=credentials
    )
)

channel = connection.channel()
channel.queue_declare(queue='task_queue', durable=True)

# tasks = [
#     {"task": "sum", "start": 1, "end": 10000},
#     {"task": "sum", "start": 1, "end": 50000},
#     {"task": "sum", "start": 1, "end": 80000},
#     {"task": "subtract", "start": 1, "end": 20000},
#     {"task": "multiply", "start": 1, "end": 20},
# ]

tasks = []

# 40 sum tasks (increasing size)
for i in range(1, 41):
    tasks.append({
        "task": "sum",
        "start": 1,
        "end": i * 10000  # up to 400,000
    })

# 30 subtract tasks
for i in range(1, 31):
    tasks.append({
        "task": "subtract",
        "start": 1,
        "end": i * 8000
    })

# 30 multiply tasks (kept smaller because factorial grows fast)
for i in range(1, 31):
    tasks.append({
        "task": "multiply",
        "start": 1,
        "end": min(i * 10, 200)  # cap to avoid giant numbers
    })


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
    print(f"[x] Sent: {message}")
    time.sleep(0.2)  # small delay so you can see distribution clearly

connection.close()
